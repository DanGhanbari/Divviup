const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await pool.query('ALTER TABLE expenses ADD COLUMN expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
        console.log('✅ Added expense_date column to expenses table');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('⚠️ expense_date column already exists');
        } else {
            console.error('❌ Failed to add column:', err);
        }
    } finally {
        await pool.end();
    }
}

run();
