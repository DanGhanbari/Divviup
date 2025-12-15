const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    console.error('   Please add it in your Railway project settings.');
    process.exit(1);
}

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
