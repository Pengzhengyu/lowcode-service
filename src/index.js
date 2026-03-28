const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pageConfigRoutes = require('./routes/pageConfig');
const formRecordsRoutes = require('./routes/formRecords');

const app = express();
const PORT = process.env.PORT || 3000;

// 禁用 ETag，避免客户端缓存产生 304 Not Modified
app.set('etag', false);

// 中间件配置
app.use(cors());
// 全局禁用缓存
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
// 增加 payload 的大小限制，以支持较大的低代码配置 JSON
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 挂载核心业务路由
app.use('/api/v1/page-config', pageConfigRoutes);
app.use('/api/v1/records', formRecordsRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'API server is running.' });
});

// 全局 404 处理
app.use((req, res, next) => {
  res.status(404).json({ code: 404, message: 'Not Found', data: null });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ code: 500, message: 'Internal Server Error', data: null });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`=========================================`);
});
