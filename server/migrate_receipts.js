const db = require('./db');

async function migrate() {
    try {
        await db.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_path TEXT;');
        console.log('Migration successful: Added receipt_path to expenses.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        // We can't easily close the pool if it's not exported with an end method, 
        // but the script will exit eventually or we can force exit.
        process.exit();
    }
}

migrate();
