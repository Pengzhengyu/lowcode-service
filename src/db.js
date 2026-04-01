/**
 * db.js - MySQL 数据库连接池配置
 *
 * 切换自 SQLite，支持更高并发和生产级存储。
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

// 创建 MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lowcode_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 转换 JSON 字段为 JS 对象（如果是 JSON 类型字段）
  typeCast: function (field, next) {
    if (field.type === "JSON") {
      return JSON.parse(field.string());
    }
    return next();
  },
});

/**
 * 自动初始化表结构（生产环境建议使用迁移工具，此处为演示便捷性保留）
 */
async function initTables() {
  try {
    const connection = await pool.getConnection();
    console.log("[db] Connected to MySQL successfully.");

    // 1. 页面配置表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_configs (
        id VARCHAR(255) PRIMARY KEY,
        schema_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. 通用业务数据表
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

    connection.release();
    console.log("[db] MySQL tables initialized.");
  } catch (err) {
    console.error("[db] Error initializing MySQL tables:", err);
    // 注意：如果数据库不存在，此处会报错。实际应用中需先确保 DB 存在或在连接串中不指定 DB 进行创建。
  }
}

// 执行初始化
initTables();

/**
 * 兼容性封装：提供 query 方法，简化服务层调用
 */
module.exports = {
  // 执行查询并返回结果（如果是 SELECT 返回数据数组，如果是其他返回执行信息）
  query: async (sql, params) => {
    const [results] = await pool.query(sql, params);
    return results;
  },
  // 获取单条结果（类似于 SQLite 的 get）
  get: async (sql, params) => {
    const [results] = await pool.query(sql, params);
    return results.length > 0 ? results[0] : null;
  },
};
