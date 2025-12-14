const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const expenseRoutes = require('./routes/expenseRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/auth', require('./routes/authRoutes'));
app.use('/', expenseRoutes); // Mount at root, paths defined in router
app.use('/groups/:group_id/tasks', taskRoutes);
app.use('/groups', require('./routes/groupRoutes'));

// Basic Health Check
app.get('/', (req, res) => {
    res.send('DivviUp API is running');
});

// Test DB Connection
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ status: 'ok', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
