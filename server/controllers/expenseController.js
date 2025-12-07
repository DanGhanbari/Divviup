const db = require('../db');

exports.createExpense = async (req, res) => {
    const { group_id } = req.params;
    const { title, amount, split_type, paid_by } = req.body;

    if (!title || !amount || !group_id) {
        return res.status(400).json({ error: 'Title, amount and group_id are required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Create Expense
        const expenseResult = await client.query(
            'INSERT INTO expenses (group_id, paid_by, title, amount, split_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [group_id, paid_by || req.user.id, title, amount, split_type || 'equal']
        );
        const expense = expenseResult.rows[0];

        // Calculate Splits (Default: Equal)
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
        }
        // TODO: Implement other split types (percentage, shares, custom)

        await client.query('COMMIT');
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
