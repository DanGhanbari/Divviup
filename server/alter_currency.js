require('dotenv').config();
const db = require('./db');

async function migrate() {
    try {
        console.log('Running migration: Add currency column to groups');
        await db.query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'");
        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
