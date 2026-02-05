const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const db = require('./db');
const emailService = require('./utils/emailService');
const socketUtil = require('./utils/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  'https://divviup.vercel.app',
  'https://divviup.xyz',
  'https://www.divviup.xyz',
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
app.use('/uploads', express.static('uploads'));


// Initialize Database Schema
const initDb = async () => {
  try {
    await db.query(`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              avatar_url TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS groups (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              is_one_time BOOLEAN DEFAULT FALSE,
              currency VARCHAR(10) DEFAULT 'USD',
              created_by INTEGER REFERENCES users(id),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS group_members (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
              joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(group_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS expenses (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
              title TEXT NOT NULL,
              amount DECIMAL(10, 2) NOT NULL,
              split_type TEXT CHECK (split_type IN ('equal', 'percentage', 'share', 'custom')) DEFAULT 'equal',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS expense_splits (
              id SERIAL PRIMARY KEY,
              expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              amount_due DECIMAL(10, 2) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS shopping_items (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              quantity TEXT,
              added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
              is_completed BOOLEAN DEFAULT FALSE,
              completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
              due_date TIMESTAMP,
              is_completed BOOLEAN DEFAULT FALSE,
              completed_at TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS group_invitations (
              id SERIAL PRIMARY KEY,
              group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
              email TEXT NOT NULL,
              invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
              status TEXT CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(group_id, email)
            );
        `);
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
  }
};

// Log DB Connection on Startup and Init DB
db.query('SELECT NOW()')
  .then(res => {
    console.log('✅ Database connected successfully:', res.rows[0].now);
    emailService.verifyConnection(); // Verify email connection
    initDb(); // Auto-migrate tables
  })
  .catch(err => console.error('❌ Database connection failed:', err));

// TEMPORARY: Setup Database Route (Keep for manual trigger if needed)
app.get('/setup-db', async (req, res) => {
  try {
    await initDb();
    res.send('✅ Database tables created successfully! You can now use the app.');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error setup database: ' + err.message);
  }
});

// Test Email Route (Public)
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('Testing email...');
    const result = await emailService.sendWelcomeEmail('team@divviup.xyz', 'DivviUp Admin');

    if (result && result.success === false) {
      return res.status(500).json({ status: 'error', error: result.error, detailed: 'Check server logs' });
    }

    if (result && result.messageId) {
      res.json({ status: 'success', messageId: result.messageId, preview: result.preview });
    } else {
      res.status(500).json({ status: 'error', error: 'Unknown email error', result });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

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

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found. If you are refreshing the page, ensure you are hitting the Frontend URL, not the API URL.' });
});

// Initialize Socket.io
socketUtil.init(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
