const db = require('../db');

exports.createExpense = async (req, res) => {
    const { getIo } = require('../utils/socket');
    const { group_id } = req.params;
    const { title, amount, split_type, paid_by, splits } = req.body;
    const receipt_path = req.file ? req.file.path : null;

    if (!title || !amount || !group_id) {
        return res.status(400).json({ error: 'Title, amount and group_id are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Create Expense
        const expenseResult = await client.query(
            'INSERT INTO expenses (group_id, paid_by, title, amount, split_type, receipt_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [group_id, paid_by || req.user.id, title, amount, split_type || 'equal', receipt_path]
        );
        const expense = expenseResult.rows[0];

        // Calculate Splits
        if (split_type === 'equal' || !split_type) {
            // Get all group members
            const membersResult = await client.query(
                'SELECT user_id FROM group_members WHERE group_id = $1',
                [group_id]
            );
            const members = membersResult.rows;

            if (members.length > 0) {
                const splitAmount = (amount / members.length).toFixed(2);

                for (const member of members) {
                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expense.id, member.user_id, splitAmount]
                    );
                }
            }
        } else if ((split_type === 'percentage' || split_type === 'custom') && splits) {
            // Handle explicit splits provided by frontend
            // Note: When sending FormData, 'splits' might be a JSON string if sent as text field, 
            // or we need to ensure it's parsed correctly if the frontend sends it as JSON string stringified.
            // Multer handles files, but text fields are in req.body.
            // If splits is a string, parse it.
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
                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expense.id, split.user_id, split.amount]
                    );
                    totalSplitAmount += parseFloat(split.amount);
                }

                if (Math.abs(totalSplitAmount - parseFloat(amount)) > 0.05) {
                    console.warn(`Expense ${expense.id} split total (${totalSplitAmount}) does not match expense amount (${amount})`);
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
            `SELECT u.id, u.name, u.email, u.avatar_url 
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
    const { title, amount, split_type, paid_by, splits } = req.body;
    const receipt_path = req.file ? req.file.path : undefined; // undefined means no update

    if (!title || !amount || !group_id) {
        return res.status(400).json({ error: 'Title, amount and group_id are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check permissions (Owner only)
        const memberCheck = await client.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );

        if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Only the group owner can update expenses' });
        }

        // 2. Update Expense Record
        let updateQuery = 'UPDATE expenses SET title = $1, amount = $2, split_type = $3, paid_by = $4';
        let queryParams = [title, amount, split_type || 'equal', paid_by];
        let paramCount = 5;

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
                const splitAmount = (amount / members.length).toFixed(2);

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
                    await client.query(
                        'INSERT INTO expense_splits (expense_id, user_id, amount_due) VALUES ($1, $2, $3)',
                        [expenseResult.rows[0].id, split.user_id, split.amount]
                    );
                    totalSplitAmount += parseFloat(split.amount);
                }
                // Basic validation
                if (Math.abs(totalSplitAmount - parseFloat(amount)) > 0.05) {
                    console.warn(`Expense ${expenseResult.rows[0].id} split total (${totalSplitAmount}) does not match expense amount (${amount})`);
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
    const { group_id, id } = req.params;

    try {
        // Check permissions (Owner only)
        const memberCheck = await db.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );

        if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
            return res.status(403).json({ error: 'Only the group owner can delete expenses' });
        }

        const result = await db.query('DELETE FROM expenses WHERE id = $1 AND group_id = $2 RETURNING *', [id, group_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

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
