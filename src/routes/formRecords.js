const express = require('express');
const router = express.Router();
const recordService = require('../services/recordService');

// 工具处理响应
const sendSuccess = (res, data = null, message = 'success') => {
  res.json({ code: 200, message, data });
};

const sendError = (res, code = 500, message = 'Internal Server Error') => {
  res.status(code).json({ code, message, data: null });
};

// POST /api/v1/records/:model/query (列表分页过滤查询)
router.post('/:model/query', async (req, res) => {
  try {
    const { model } = req.params;
    const queryParams = req.body || {};
    const result = await recordService.queryRecords(model, queryParams);
    sendSuccess(res, result);
  } catch (error) {
    console.error(`Error querying records for model ${req.params.model}:`, error);
    sendError(res, 500, 'Failed to query records');
  }
});

// GET /api/v1/records/:model/:id (获取数据详情)
router.get('/:model/:id', async (req, res) => {
  try {
    const { model, id } = req.params;
    const record = await recordService.getRecordById(model, id);
    if (!record) {
      return sendError(res, 404, 'Record not found');
    }
    sendSuccess(res, record);
  } catch (error) {
    console.error(`Error reading record ${req.params.id} for model ${req.params.model}:`, error);
    sendError(res, 500, 'Failed to read record');
  }
});

// POST /api/v1/records/:model/save (暂存/更新数据)
router.post('/:model/save', async (req, res) => {
  try {
    const { model } = req.params;
    const data = req.body;
    if (!data) {
      return sendError(res, 400, 'Missing record data');
    }
    const savedRecord = await recordService.saveOrUpdateRecord(model, data, false);
    sendSuccess(res, savedRecord, 'Record saved successfully');
  } catch (error) {
    console.error(`Error saving record for model ${req.params.model}:`, error);
    sendError(res, 500, 'Failed to save record');
  }
});

// POST /api/v1/records/:model/submit (提交数据)
router.post('/:model/submit', async (req, res) => {
  try {
    const { model } = req.params;
    const data = req.body;
    if (!data) {
      return sendError(res, 400, 'Missing record data');
    }
    const submittedRecord = await recordService.saveOrUpdateRecord(model, data, true);
    sendSuccess(res, submittedRecord, 'Record submitted successfully');
  } catch (error) {
    console.error(`Error submitting record for model ${req.params.model}:`, error);
    sendError(res, 500, 'Failed to submit record');
  }
});

// DELETE /api/v1/records/:model/delete (删除记录)
router.delete('/:model/delete', async (req, res) => {
  try {
    const { model } = req.params;
    // 支持从 body 中取 id，也支持 query string 传参
    const id = req.body.id || req.query.id;
    if (!id) {
      return sendError(res, 400, 'Missing record id to delete');
    }
    const deleted = await recordService.deleteRecord(model, id);
    if (deleted) {
      sendSuccess(res, null, 'Record deleted successfully');
    } else {
      sendError(res, 404, 'Record not found or already deleted');
    }
  } catch (error) {
    console.error(`Error deleting record for model ${req.params.model}:`, error);
    sendError(res, 500, 'Failed to delete record');
  }
});

module.exports = router;
