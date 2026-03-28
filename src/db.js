/**
 * db.js - SQLite 数据库初始化（基于 node-sqlite3-wasm，纯 JS / WASM，无需编译）
 *
 * 数据文件存储在项目根目录下的 data/database.db
 */
const path = require('path');
const fs = require('fs');
const { Database } = require('node-sqlite3-wasm');

// 确保 data 目录存在
const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'database.db');

// 创建数据库连接（如果文件不存在则自动创建）
const db = new Database(DB_PATH);

// 开启 WAL 模式，提升并发读取性能
db.run('PRAGMA journal_mode=WAL;');

/**
 * 页面配置表：page_configs
 * - id: 页面唯一标识（string），如 'list_01'
 * - schema: 存储整个 JSON 配置文本
 * - created_at / updated_at: 时间戳
 */
db.run(`
  CREATE TABLE IF NOT EXISTS page_configs (
    id TEXT PRIMARY KEY,
    schema_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

/**
 * 通用业务数据表：form_records
 * - id: UUID 主键
 * - model: 表单模型名称，如 'orders'
 * - data_json: 业务数据 JSON 文本
 * - status: 'draft' / 'submitted'
 * - created_at / updated_at: 时间戳
 */
db.run(`
  CREATE TABLE IF NOT EXISTS form_records (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    data_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// 为 model 字段添加索引，加速按模型类型的查询
db.run(`CREATE INDEX IF NOT EXISTS idx_form_records_model ON form_records (model)`);

console.log(`[db] SQLite database initialized at: ${DB_PATH}`);

module.exports = db;
