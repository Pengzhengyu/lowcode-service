/**
 * migrate-to-mysql.js - 一键将 SQLite 数据迁移至 MySQL
 *
 * 使用方法: node scripts/migrate-to-mysql.js
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// 旧的 SQLite 依赖（由于主应用已移除，此处脚本临时引入或使用 wasm 版）
const { Database: SQLiteDB } = require("node-sqlite3-wasm");
const mysql = require("mysql2/promise");

const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "database.db");

/**
 * 将 ISO 格式日期 (如 2026-04-01T06:34:46.468Z) 转换为 MySQL DATETIME 格式
 */
function toMySQLDate(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toISOString().slice(0, 19).replace("T", " ");
  } catch (e) {
    return isoStr;
  }
}

async function migrate() {
  console.log("--- Starting Data Migration (SQLite -> MySQL) ---");

  if (!fs.existsSync(DB_PATH)) {
    console.error("Error: SQLite database file not found at", DB_PATH);
    process.exit(1);
  }

  // 1. 连接 MySQL
  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "lowcode_db",
      port: process.env.DB_PORT || 3306,
    });
    console.log("[v] Connected to MySQL.");
  } catch (err) {
    console.error("[x] Failed to connect to MySQL:", err.message);
    process.exit(1);
  }

  // --- Initialize Tables ---
  console.log("Initializing tables in MySQL...");
  try {
    await mysqlConn.execute(`
      CREATE TABLE IF NOT EXISTS page_configs (
        id VARCHAR(255) PRIMARY KEY,
        schema_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await mysqlConn.execute(`
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
    console.log("[v] Tables initialized.");
  } catch (err) {
    console.error("[x] Failed to initialize tables:", err.message);
    process.exit(1);
  }

  // 2. 加载 SQLite
  const sqlite = new SQLiteDB(DB_PATH);
  console.log("[v] SQLite database loaded.");

  try {
    // --- 迁移 page_configs ---
    console.log("Migrating page_configs...");
    const pageConfigs = sqlite.all("SELECT * FROM page_configs");
    for (const row of pageConfigs) {
      await mysqlConn.execute(
        `INSERT INTO page_configs (id, schema_json, created_at, updated_at) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE schema_json=VALUES(schema_json), updated_at=VALUES(updated_at)`,
        [row.id, row.schema_json, toMySQLDate(row.created_at), toMySQLDate(row.updated_at)],
      );
    }
    console.log(`[v] Migrated ${pageConfigs.length} page configurations.`);

    // --- 迁移 form_records ---
    console.log("Migrating form_records...");
    const formRecords = sqlite.all("SELECT * FROM form_records");
    for (const row of formRecords) {
      // 这里的 row.data_json 在 SQLite 里是字符串，MySQL JSON 字段也接受字符串插入
      await mysqlConn.execute(
        `INSERT INTO form_records (id, model, data_json, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE data_json=VALUES(data_json), status=VALUES(status), updated_at=VALUES(updated_at)`,
        [row.id, row.model, row.data_json, row.status, toMySQLDate(row.created_at), toMySQLDate(row.updated_at)],
      );
    }
    console.log(`[v] Migrated ${formRecords.length} form records.`);

    console.log("--- Migration Completed Successfully! ---");
  } catch (err) {
    console.error("[x] Migration failed:", err);
  } finally {
    await mysqlConn.end();
  }
}

migrate();
