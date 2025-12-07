const db = require('../db');

exports.createGroup = async (req, res) => {
    const { name, description, is_one_time } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Create Group
        const groupResult = await client.query(
            'INSERT INTO groups (name, description, is_one_time, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, is_one_time || false, req.user.id]
        );
        const group = groupResult.rows[0];

        // Add Creator as Owner
        await client.query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
            [group.id, req.user.id, 'owner']
        );

        await client.query('COMMIT');
        res.status(201).json(group);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error creating group' });
    } finally {
        client.release();
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT g.*, gm.role 
       FROM groups g 
       JOIN group_members gm ON g.id = gm.group_id 
       WHERE gm.user_id = $1 
       ORDER BY g.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching groups' });
    }
};

exports.getGroupById = async (req, res) => {
    const groupId = req.params.id;

    try {
        // Check membership
        const memberCheck = await db.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.user.id]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const groupResult = await db.query('SELECT * FROM groups WHERE id = $1', [groupId]);
        const membersResult = await db.query(
            `SELECT u.id, u.name, u.email, u.avatar_url, gm.role, gm.joined_at 
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = $1`,
            [groupId]
        );

        const group = groupResult.rows[0];
        group.members = membersResult.rows;

        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching group details' });
    }
};
