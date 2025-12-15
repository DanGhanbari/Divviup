const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
    'https://divviup.vercel.app',
    'http://localhost:5173',
    'http://localhost:5001'
];

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Removed to prevent Express 5 PathError
app.use(express.json());

// Log DB Connection on Startup
db.query('SELECT NOW()')
    .then(res => console.log('✅ Database connected successfully:', res.rows[0].now))
    .catch(err => console.error('❌ Database connection failed:', err));

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
