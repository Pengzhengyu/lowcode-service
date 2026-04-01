/**
 * storageService.js - 页面配置存取 (MySQL 版本)
 */
const db = require("../db");

/**
 * 保存页面结构 JSON（新增或覆盖更新）
 */
async function saveSchema(id, schema) {
  const schemaText = JSON.stringify(schema);

  // MySQL 使用 ON DUPLICATE KEY UPDATE 实现 UPSERT
  await db.query(
    `INSERT INTO page_configs (id, schema_json, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       schema_json = VALUES(schema_json),
       updated_at = NOW()`,
    [id, schemaText],
  );
}

/**
 * 根据 id 获取页面 JSON
 */
async function getSchemaById(id) {
  const row = await db.get("SELECT schema_json, updated_at FROM page_configs WHERE id = ?", [id]);
  if (!row) return null;

  // MySQL 的 JSON 字段如果定义为 LONGTEXT 需要解析
  // 如果在 db.js 中定义了 typeCast，则 row.schema_json 可能已经是对象
  // 但此处 schema_json 在 page_configs 中是 LONGTEXT（见 db.js 初始化）
  try {
    return typeof row.schema_json === "string" ? JSON.parse(row.schema_json) : row.schema_json;
  } catch (e) {
    return row.schema_json;
  }
}

/**
 * 获取所有页面配置列表
 */
async function listSchemas() {
  const rows = await db.query("SELECT id, schema_json, created_at, updated_at FROM page_configs ORDER BY updated_at DESC");

  return rows.map((row) => {
    let title = row.id;
    let moduleCode = row.id;
    try {
      const schema = typeof row.schema_json === "string" ? JSON.parse(row.schema_json) : row.schema_json;
      if (schema && schema.header && schema.header.title) {
        title = schema.header.title;
      }
      if (schema && schema.moduleCode) {
        moduleCode = schema.moduleCode;
      }
    } catch (e) {
      console.error("Error parsing schema JSON for id:", row.id);
    }

    return {
      id: row.id,
      moduleCode: moduleCode,
      title: title,
      createTime: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

module.exports = {
  saveSchema,
  getSchemaById,
  listSchemas,
};
