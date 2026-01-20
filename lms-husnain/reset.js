require("dotenv").config(); // Load your .env file
const { Pool } = require("pg");

async function wipeDB() {
  // 1. Check if we found the database link
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Error: Could not find DATABASE_URL in your .env file.");
    return;
  }

  const pool = new Pool({ connectionString });

  console.log("🔥 Connecting to database...");

  try {
    // 2. Run the SQL Wipe Command
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE;");
    console.log("✅ SUCCESS! All users and related data deleted.");
  } catch (error) {
    console.error("❌ Error wiping database:", error);
  } finally {
    await pool.end();
    process.exit();
  }
}

wipeDB();