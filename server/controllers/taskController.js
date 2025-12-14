const db = require('../db');

exports.createTask = async (req, res) => {
    const { group_id } = req.params;
    const { title, assigned_to, due_date } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO tasks (group_id, title, assigned_to, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [group_id, title, assigned_to, due_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating task' });
    }
};

exports.getGroupTasks = async (req, res) => {
    const { group_id } = req.params;

    try {
        const result = await db.query(
            `SELECT t.*, u.name as assigned_to_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.group_id = $1 
       ORDER BY t.created_at DESC`,
            [group_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
};

exports.toggleTask = async (req, res) => {
    const { id } = req.params;

    try {
        const taskCheck = await db.query('SELECT is_completed FROM tasks WHERE id = $1', [id]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const newStatus = !taskCheck.rows[0].is_completed;
        const result = await db.query(
            'UPDATE tasks SET is_completed = $1, completed_at = $2 WHERE id = $3 RETURNING *',
            [newStatus, newStatus ? new Date() : null, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating task' });
    }
};

exports.deleteTask = async (req, res) => {
    const { group_id, id } = req.params;

    try {
        // Check permissions (Owner only)
        const memberCheck = await db.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );

        if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
            return res.status(403).json({ error: 'Only the group owner can delete tasks' });
        }

        const result = await db.query('DELETE FROM tasks WHERE id = $1 AND group_id = $2 RETURNING *', [id, group_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting task' });
    }
};
