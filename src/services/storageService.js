/**
 * storageService.js - 页面配置存取（SQLite 版本）
 */
const db = require('../db');

/**
 * 保存页面结构 JSON（新增或覆盖更新）
 */
function saveSchema(id, schema) {
  const schemaText = JSON.stringify(schema);
  const now = new Date().toISOString();

  // 如果存在则更新，否则插入（SQLite UPSERT 语法）
  db.run(
    `INSERT INTO page_configs (id, schema_json, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       schema_json = excluded.schema_json,
       updated_at = excluded.updated_at`,
    [id, schemaText, now, now]
  );
}

/**
 * 根据 id 获取页面 JSON
 */
function getSchemaById(id) {
  const row = db.get(
    'SELECT schema_json, updated_at FROM page_configs WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return JSON.parse(row.schema_json);
}

/**
 * 获取所有页面配置列表（解析 JSON 提取元数据用于列表展示）
 */
function listSchemas() {
  const rows = db.all(
    'SELECT id, schema_json, created_at, updated_at FROM page_configs ORDER BY updated_at DESC'
  );
  
  return rows.map(row => {
    let title = row.id;
    let moduleCode = row.id;
    try {
      const schema = JSON.parse(row.schema_json);
      if (schema && schema.header && schema.header.title) {
        title = schema.header.title;
      }
      if (schema && schema.moduleCode) {
        moduleCode = schema.moduleCode;
      }
    } catch (e) {
      console.error('Error parsing schema JSON for id:', row.id);
    }

    return {
      id: row.id,
      moduleCode: moduleCode,
      title: title,
      createTime: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

module.exports = {
  saveSchema,
  getSchemaById,
  listSchemas
};
