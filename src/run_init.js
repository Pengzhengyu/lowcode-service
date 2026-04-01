require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function init() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lowcode",
  });

  try {
    const connection = await pool.getConnection();
    console.log("[db] Connected to MySQL successfully.");

    console.log("Creating page_configs...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_configs (
        id VARCHAR(255) PRIMARY KEY,
        schema_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("Creating form_records...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS form_records (
        id VARCHAR(64) PRIMARY KEY,
        model VARCHAR(128) NOT NULL,
        data_json JSON NOT NULL,
        status VARCHAR(16) DEFAULT 'draft',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_form_records_model (model)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("All tables created.");
    connection.release();
  } catch (err) {
    console.error("[db] Error initializing MySQL tables:");
    console.error(err);
  } finally {
    await pool.end();
  }
}

init();
