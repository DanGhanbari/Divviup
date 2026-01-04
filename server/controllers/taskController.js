const db = require('../db');

exports.createTask = async (req, res) => {
    const { getIo } = require('../utils/socket');
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
        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'task_created', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

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
    const { getIo } = require('../utils/socket');
    const { id, group_id } = req.params; // Changed to destructure group_id directly if possible, or we need to query it.
    // Wait, toggleTask params only has :id in routes? Let's check route definition or query task first.
    // server/routes/taskRoutes.js usually mounts on /groups/:group_id/tasks, but toggle might be different.
    // Let's assume req.params contains group_id because of router.mergeParams or URL structure.
    // Actually, line 1 of route file likely sets mergeParams. 
    // BUT looking at original file, toggleTask only extracted { id }.
    // We need group_id to emit to room. We can get it from the task query result.

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

        // Emit real-time update
        try {
            const groupId = result.rows[0].group_id;
            getIo().to('group_' + groupId).emit('group_updated', { type: 'task_updated', groupId: groupId });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating task' });
    }
};

exports.deleteTask = async (req, res) => {
    const { getIo } = require('../utils/socket');
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

        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'task_deleted', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting task' });
    }
};

exports.assignTask = async (req, res) => {
    const { getIo } = require('../utils/socket');
    const { group_id, id } = req.params;
    const { assigned_to } = req.body; // Expecting user_id or null

    try {
        // Verify user is member of group
        // In a real app we might want more robust checks, but for now we assume 
        // if they can hit this endpoint (authMiddleware passes) they can claim tasks if they are in the group.
        // We could double check membership here but let's trust the auth flow + UI for now or add a quick check.

        // Actually, let's verify the user is a member of the group to be safe
        const memberCheck = await db.query(
            'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id, req.user.id]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // If claiming (assigned_to is set), enforce it matches the authenticated user to prevent claiming for others?
        // The prompt says "if a user decides to do a task mention it that I'm om on it".
        // So a user claims it for themselves. 
        // But maybe we want the flexibility to unassign too.
        // Let's assume the UI sends the current user ID for claiming, or null for unclaiming.

        const result = await db.query(
            'UPDATE tasks SET assigned_to = $1 WHERE id = $2 AND group_id = $3 RETURNING *',
            [assigned_to, id, group_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Fetch the assigned user details to return to frontend
        const taskWithUser = await db.query(
            `SELECT t.*, u.name as assigned_to_name 
             FROM tasks t 
             LEFT JOIN users u ON t.assigned_to = u.id 
             WHERE t.id = $1`,
            [id]
        );

        // Emit real-time update
        try {
            getIo().to('group_' + group_id).emit('group_updated', { type: 'task_assigned', groupId: group_id });
        } catch (ioErr) {
            console.error("Socket emit failed:", ioErr);
        }

        res.json(taskWithUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error assigning task' });
    }
};
