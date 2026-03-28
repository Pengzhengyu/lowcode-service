const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');

// POST /api/v1/page-config/save
router.post('/save', async (req, res) => {
  try {
    const { id, schema } = req.body;
    
    if (!id) {
      return res.status(400).json({ code: 400, message: 'Missing page id', data: null });
    }
    
    if (!schema) {
      return res.status(400).json({ code: 400, message: 'Missing schema data', data: null });
    }

    await storageService.saveSchema(id, schema);
    
    res.json({
      code: 200,
      message: 'Schema saved successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Error saving schema:', error);
    res.status(500).json({ code: 500, message: 'Failed to save schema', data: null });
  }
});

// GET /api/v1/page-config/list（必须在 /:id 之前注册，避免 'list' 被当作 id 参数）
router.get('/list', async (req, res) => {
  try {
    const list = await storageService.listSchemas();
    res.json({ code: 200, message: 'success', data: list });
  } catch (error) {
    console.error('Error listing schemas:', error);
    res.status(500).json({ code: 500, message: 'Failed to list schemas', data: null });
  }
});

// GET /api/v1/page-config/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = await storageService.getSchemaById(id);
    
    if (!schema) {
      return res.status(404).json({ code: 404, message: 'Schema not found', data: null });
    }

    res.json({ code: 200, message: 'success', data: schema });
  } catch (error) {
    console.error('Error reading schema:', error);
    res.status(500).json({ code: 500, message: 'Failed to load schema', data: null });
  }
});

module.exports = router;
