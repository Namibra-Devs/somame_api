const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query(`ALTER TABLE menu_items ADD COLUMN sizes JSONB DEFAULT '[]'`);
        console.log("Added sizes column");
    } catch (e) {
        console.error("Error adding sizes column:", e.message);
    }
    
    try {
        await pool.query(`ALTER TABLE menu_items ALTER COLUMN price DROP NOT NULL`);
        console.log("Dropped NOT NULL from price");
    } catch (e) {
        console.error("Error modifying price column:", e.message);
    }

    try {
        await pool.query(`ALTER TABLE menu_items ALTER COLUMN price SET DEFAULT 0`);
        console.log("Set default price to 0");
    } catch (e) {
        console.error("Error setting default price:", e.message);
    }

    process.exit();
}

migrate();
