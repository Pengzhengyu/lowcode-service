/**
 * recordService.js - 通用业务数据表单记录存取 (MySQL 版本)
 */
const crypto = require("crypto");
const db = require("../db");

/**
 * 分页查询列表
 */
async function queryRecords(model, queryParams = {}) {
  const current = Number(queryParams.current || queryParams.pageNo || 1);
  const pageSize = Number(queryParams.pageSize || queryParams.limit || 10);

  // 提取业务过滤参数
  const excludeKeys = ["current", "pageSize", "pageNo", "limit"];
  const filterKeys = Object.keys(queryParams).filter(
    (k) => !excludeKeys.includes(k) && queryParams[k] !== undefined && queryParams[k] !== "",
  );

  // 基础 WHERE 条件：model 匹配
  const conditions = ["model = ?"];
  const bindings = [model];

  // 对业务字段做 JSON 精准查询（使用 MySQL 的 JSON_EXTRACT 或 ->> 运算符）
  filterKeys.forEach((k) => {
    // MySQL 语法: data_json ->> '$.key'
    conditions.push(`data_json ->> '$.${k}' LIKE ?`);
    bindings.push(`%${queryParams[k]}%`);
  });

  const whereClause = conditions.join(" AND ");

  // 查总数
  const countSql = `SELECT COUNT(*) as total FROM form_records WHERE ${whereClause}`;
  const countRow = await db.get(countSql, bindings);
  const total = countRow ? countRow.total : 0;

  // 查分页数据
  const offset = (current - 1) * pageSize;
  const rows = await db.query(
    `SELECT id, data_json, status, created_at, updated_at
     FROM form_records
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...bindings, pageSize, offset],
  );

  const list = rows.map((row) => ({
    id: row.id,
    ...(typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json),
    status: row.status,
    createTime: row.created_at,
    updateTime: row.updated_at,
  }));

  return { list, total, current, pageSize };
}

/**
 * 读取单条详情
 */
async function getRecordById(model, id) {
  const row = await db.get(
    `SELECT id, data_json, status, created_at, updated_at
     FROM form_records
     WHERE model = ? AND id = ?`,
    [model, id],
  );
  if (!row) return null;

  return {
    id: row.id,
    ...(typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json),
    status: row.status,
    createTime: row.created_at,
    updateTime: row.updated_at,
  };
}

/**
 * 保存或更新记录
 */
async function saveOrUpdateRecord(model, data, isSubmit = false) {
  const status = isSubmit ? "submitted" : "draft";

  // 去掉内置字段，只存业务数据
  const { id: inputId, status: _s, createTime: _c, updateTime: _u, ...businessData } = data;

  if (inputId) {
    // 尝试更新
    const existing = await db.get("SELECT id FROM form_records WHERE model = ? AND id = ?", [model, inputId]);
    if (existing) {
      await db.query(`UPDATE form_records SET data_json = ?, status = ?, updated_at = NOW() WHERE id = ?`, [
        JSON.stringify(businessData),
        status,
        inputId,
      ]);
      return await getRecordById(model, inputId);
    }
  }

  // 新增记录
  const newId = inputId || crypto.randomUUID();
  await db.query(
    `INSERT INTO form_records (id, model, data_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [newId, model, JSON.stringify(businessData), status],
  );
  return await getRecordById(model, newId);
}

/**
 * 删除记录
 */
async function deleteRecord(model, id) {
  const existing = await db.get("SELECT id FROM form_records WHERE model = ? AND id = ?", [model, id]);
  if (!existing) return false;
  await db.query("DELETE FROM form_records WHERE model = ? AND id = ?", [model, id]);
  return true;
}

module.exports = {
  queryRecords,
  getRecordById,
  saveOrUpdateRecord,
  deleteRecord,
};
