const db = require('../db');

exports.createExpense = async (req, res) => {
    const { getIo } = require('../utils/socket');
    let { title, amount, currency, paid_by, split_type, receipt_path, exchange_rate, splits, expense_date, group_id } = req.body;

    // Fallback to params if not in body
    if (!group_id && req.params.group_id) {
        group_id = req.params.group_id;
    }

    if (!title || !amount || !group_id) {
        return res.status(400).json({ error: 'Title, amount and group_id are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get Group Currency
        const groupRes = await client.query('SELECT currency FROM groups WHERE id = $1', [group_id]);
        if (groupRes.rows.length === 0) {
            throw new Error('Group not found');
        }
        const groupCurrency = groupRes.rows[0].currency || 'USD';
        const expenseCurrency = currency || groupCurrency;

        // Calculate Converted Amount
        let finalExchangeRate = parseFloat(exchange_rate) || 1.0;
        let convertedAmount = parseFloat(amount);
        let originalAmountVal = parseFloat(amount); // Keep track of input amount

        if (expenseCurrency !== groupCurrency) {
            if (!exchange_rate) {
                // Fetch rate if not provided
                try {
                    const { getExchangeRate } = require('../utils/currencyService');
                    finalExchangeRate = await getExchangeRate(expenseCurrency, groupCurrency);
                } catch (e) {
                    console.error("Rate fetch failed, defaulting to 1.0", e);
                    finalExchangeRate = 1.0;
                }
            }
            convertedAmount = (originalAmountVal * finalExchangeRate).toFixed(2);
        } else {
            finalExchangeRate = 1.0;
        }

        // Create Expense
        // Schema: title, amount (converted), currency, original_amount, exchange_rate
        const expenseResult = await client.query(
            'INSERT INTO expenses (group_id, paid_by, title, amount, split_type, receipt_path, expense_date, currency, original_amount, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [
                group_id,
                paid_by || req.user.id,
                title,
                convertedAmount,
                split_type || 'equal',
                receipt_path,
                expense_date || new Date(),
                expenseCurrency,
                originalAmountVal,
                finalExchangeRate
            ]
        );
        const expense = expenseResult.rows[0];

        // Calculate Splits (Use Converted Amount)
        if (split_type === 'equal' || !split_type) {
            // Get all group members
            const membersResult = await client.query(
                'SELECT user_id FROM group_members WHERE group_id = $1',
                [group_id]
            );
            const members = membersResult.rows;

            if (members.length > 0) {
                const splitAmount = (convertedAmount / members.length).toFixed(2);

                for (const member of members) {
                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expense.id, member.user_id, splitAmount]
                    );
                }
            }
        } else if ((split_type === 'percentage' || split_type === 'custom') && splits) {
            let splitsArray = splits;
            if (typeof splits === 'string') {
                try {
                    splitsArray = JSON.parse(splits);
                } catch (e) {
                    console.error("Failed to parse splits JSON", e);
                }
            }

            if (Array.isArray(splitsArray)) {
                let totalSplitAmount = 0;
                for (const split of splitsArray) {
                    // For custom splits, we assume the frontend sends the *converted* amount shares if manual,
                    // OR we might need logic to distribute the converted amount if they split by %.
                    // For now, assuming frontend handles the math or sends raw values that sum to 'amount'.
                    // If frontend sends original currency splits, we should probably convert them too.
                    // Implementation Detail: Let's assume frontend sends values that sum to the *expense amount*. 
                    // Since we updated 'amount' to be convertedAmount, frontend must send converted splits OR 
                    // we re-calculate. 
                    // Simpler: Just save what frontend sends, but check total.
                    // Ideally, splits calculation happens on backend for 'equal', but for 'custom', frontend decides.
                    // If currency differs, frontend should probably assist or we just take the values.
                    // *CRITICAL*: If I change 'amount' to converted, the splits must sum to converted. 

                    // Logic Adjust: If custom/percentage, we trust the 'amount' and 'splits' from request match.
                    // BUT we just changed 'amount' to 'convertedAmount'. 
                    // If user enters 10 EUR (Group USD), converted is 11 USD.
                    // If split is 5 EUR / 5 EUR, we need to save 5.5 USD / 5.5 USD.
                    // This is complex. 
                    // **Simplification**: For MVP, if currency differs, default to 'equal' split or 
                    // require user to input splits in Group Currency?
                    // "Splits" usually come as exact amounts for 'custom'.
                    // Let's apply the exchange rate to the splits too!

                    let splitVal = parseFloat(split.amount);
                    if (expenseCurrency !== groupCurrency) {
                        splitVal = (splitVal * finalExchangeRate).toFixed(2);
                    }

                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expense.id, split.user_id, splitVal]
                    );
                    totalSplitAmount += parseFloat(splitVal);
                }

                if (Math.abs(totalSplitAmount - parseFloat(convertedAmount)) > 0.05) {
                    console.warn(`Expense ${expense.id} split total (${totalSplitAmount}) does not match expense amount (${convertedAmount})`);
                }
            }
        }

        await client.query('COMMIT');

        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'expense_created', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.status(201).json(expense);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error creating expense' });
    } finally {
        client.release();
    }
};

exports.getGroupExpenses = async (req, res) => {
    const { group_id } = req.params;

    try {
        const result = await db.query(
            `SELECT e.*, u.name as paid_by_name 
       FROM expenses e 
       JOIN users u ON e.paid_by = u.id 
       WHERE e.group_id = $1 
       ORDER BY e.created_at DESC`,
            [group_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching expenses' });
    }
};

exports.getGroupBalances = async (req, res) => {
    const { group_id } = req.params;

    try {
        // 1. Get total paid by each user
        const paidResult = await db.query(
            `SELECT paid_by as user_id, SUM(amount) as total_paid 
             FROM expenses 
             WHERE group_id = $1 
             GROUP BY paid_by`,
            [group_id]
        );

        // 2. Get total share allocated to each user
        const shareResult = await db.query(
            `SELECT es.user_id, SUM(es.amount_due) as total_share 
             FROM expense_splits es 
             JOIN expenses e ON es.expense_id = e.id 
             WHERE e.group_id = $1 
             GROUP BY es.user_id`,
            [group_id]
        );

        // 3. Get all group members to ensure everyone is included
        const membersResult = await db.query(
            `SELECT u.id, u.name, u.email, u.avatar_url, u.plan 
             FROM group_members gm 
             JOIN users u ON gm.user_id = u.id 
             WHERE gm.group_id = $1`,
            [group_id]
        );

        // console.log('Calculating balances for group:', group_id);
        // console.log('Paid rows:', paidResult.rows);
        // console.log('Share rows:', shareResult.rows);

        const balances = membersResult.rows.map(member => {
            // Convert IDs to strings for robust comparison
            const paidEntry = paidResult.rows.find(p => String(p.user_id) === String(member.id));
            const shareEntry = shareResult.rows.find(s => String(s.user_id) === String(member.id));

            const paid = paidEntry ? paidEntry.total_paid : 0;
            const share = shareEntry ? shareEntry.total_share : 0;

            const net_balance = (parseFloat(paid) - parseFloat(share)).toFixed(2);

            // console.log(`Member ${member.id} (${member.name}): Paid=${paid}, Share=${share}, Net=${net_balance}`);

            return {
                ...member,
                total_paid: parseFloat(paid),
                total_share: parseFloat(share),
                net_balance: net_balance
            };
        });

        res.json(balances);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching balances' });
    }
};

exports.getExpenseById = async (req, res) => {
    const { group_id, id } = req.params;

    try {
        // 1. Get Expense
        const expenseResult = await db.query(
            `SELECT * FROM expenses WHERE id = $1 AND group_id = $2`,
            [id, group_id]
        );

        if (expenseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        const expense = expenseResult.rows[0];

        // 2. Get Splits
        const splitsResult = await db.query(
            'SELECT user_id, amount_due FROM expense_splits WHERE expense_id = $1',
            [id]
        );

        expense.splits = splitsResult.rows;
        res.json(expense);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching expense details' });
    }
};

exports.updateExpense = async (req, res) => {
    const { getIo } = require('../utils/socket');
    const { group_id, id } = req.params;
    const { title, amount, split_type, paid_by, splits, currency, expense_date } = req.body;
    const receipt_path = req.file ? req.file.path : undefined; // undefined means no update

    if (!title || !amount || !group_id) {
        return res.status(400).json({ error: 'Title, amount and group_id are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check permissions
        // Get user role
        const memberCheck = await client.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );
        const userRole = memberCheck.rows.length > 0 ? memberCheck.rows[0].role : null;

        // Get expense details to check paid_by
        const expenseCheck = await client.query('SELECT paid_by FROM expenses WHERE id = $1', [id]);
        if (expenseCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Expense not found' });
        }
        const expensePayer = expenseCheck.rows[0].paid_by;

        // Allow if: Group Owner OR Group Admin OR Payer of the expense
        const isAuthorized = (userRole === 'owner' || userRole === 'admin') || (expensePayer === req.user.id);

        if (!isAuthorized) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'You do not have permission to edit this expense' });
        }

        // Get Group Currency for conversion
        const groupRes = await client.query('SELECT currency FROM groups WHERE id = $1', [group_id]);
        const groupCurrency = groupRes.rows[0]?.currency || 'USD';
        const expenseCurrency = currency || groupCurrency;

        // Calculate Converted Amount
        let finalExchangeRate = 1.0;
        let convertedAmount = parseFloat(amount);
        let originalAmountVal = parseFloat(amount);

        if (expenseCurrency !== groupCurrency) {
            try {
                const { getExchangeRate } = require('../utils/currencyService'); // Use utils path
                finalExchangeRate = await getExchangeRate(expenseCurrency, groupCurrency);
                convertedAmount = (originalAmountVal * finalExchangeRate).toFixed(2);
            } catch (e) {
                console.error("Rate fetch failed during update, defaulting to 1.0", e);
                finalExchangeRate = 1.0;
            }
        }

        // 2. Update Expense Record
        let updateQuery = 'UPDATE expenses SET title = $1, amount = $2, split_type = $3, paid_by = $4, expense_date = $5, currency = $6, original_amount = $7, exchange_rate = $8';
        let queryParams = [title, convertedAmount, split_type || 'equal', paid_by, expense_date || new Date(), expenseCurrency, originalAmountVal, finalExchangeRate];
        let paramCount = 9;

        if (receipt_path) {
            updateQuery += `, receipt_path = $${paramCount}`;
            queryParams.push(receipt_path);
            paramCount++;
        }

        updateQuery += ` WHERE id = $${paramCount} AND group_id = $${paramCount + 1} RETURNING *`;
        queryParams.push(id, group_id);

        const expenseResult = await client.query(updateQuery, queryParams);

        if (expenseResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Expense not found' });
        }

        // 3. Clear Existing Splits
        await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [id]);

        // 4. Recalculate Splits
        if (split_type === 'equal' || !split_type) {
            // Get all group members
            const membersResult = await client.query(
                'SELECT user_id FROM group_members WHERE group_id = $1',
                [group_id]
            );
            const members = membersResult.rows;

            if (members.length > 0) {
                const splitAmount = (convertedAmount / members.length).toFixed(2);

                for (const member of members) {
                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expenseResult.rows[0].id, member.user_id, splitAmount]
                    );
                }
            }
        } else if ((split_type === 'percentage' || split_type === 'custom') && splits) {
            let splitsArray = splits;
            if (typeof splits === 'string') {
                try {
                    splitsArray = JSON.parse(splits);
                } catch (e) {
                    console.error("Failed to parse splits JSON", e);
                }
            }

            if (Array.isArray(splitsArray)) {
                let totalSplitAmount = 0;
                for (const split of splitsArray) {
                    let splitVal = parseFloat(split.amount);
                    if (expenseCurrency !== groupCurrency) {
                        splitVal = (splitVal * finalExchangeRate).toFixed(2);
                    }

                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expenseResult.rows[0].id, split.user_id, splitVal]
                    );
                    totalSplitAmount += parseFloat(splitVal);
                }
                // Basic validation
                if (Math.abs(totalSplitAmount - parseFloat(convertedAmount)) > 0.05) {
                    console.warn(`Expense ${expenseResult.rows[0].id} split total (${totalSplitAmount}) does not match expense amount (${convertedAmount})`);
                }
            }
        }

        await client.query('COMMIT');

        // 5. Fetch full object again to return "paid_by_name" which the frontend needs
        const finalResult = await db.query(
            `SELECT e.*, u.name as paid_by_name 
             FROM expenses e 
             JOIN users u ON e.paid_by = u.id 
             WHERE e.id = $1`,
            [id]
        );

        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'expense_updated', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.json(finalResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error updating expense' });
    } finally {
        client.release();
    }
};

exports.deleteExpense = async (req, res) => {
    const { getIo } = require('../utils/socket');
    const client = await db.pool.connect();
    const { group_id, id } = req.params;

    try {
        await client.query('BEGIN');

        // Check permissions
        const memberCheck = await client.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );
        const userRole = memberCheck.rows.length > 0 ? memberCheck.rows[0].role : null;

        const expenseCheck = await client.query('SELECT paid_by FROM expenses WHERE id = $1', [id]);
        if (expenseCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Expense not found' });
        }
        const expensePayer = expenseCheck.rows[0].paid_by;

        const isAuthorized = (userRole === 'owner' || userRole === 'admin') || (expensePayer === req.user.id);

        if (!isAuthorized) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'You do not have permission to delete this expense' });
        }

        const result = await client.query('DELETE FROM expenses WHERE id = $1 AND group_id = $2 RETURNING *', [id, group_id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK'); // Rollback if not found after permission check
            return res.status(404).json({ error: 'Expense not found' });
        }

        await client.query('COMMIT');

        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'expense_deleted', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting expense' });
    }
};
