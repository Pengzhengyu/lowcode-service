# GEMINI.md：低代码平台后端 API 系统规则

> [!IMPORTANT]
> 这是一个基于 Node.js 基础规则文件，请确保将其作为核心设计约束。

## 1. 项目与架构约定
- **技术栈**：Node.js + Express.js
- **项目角色**：真实 RESTful API，为“低代码页面模型”提供增删改查支持。
- **持久化方案**：第一阶段使用本地文件(如 `fs` 读写 JSON 文件)模拟数据库；后续再平滑替换为 MySQL / MongoDB 驱动。
- **响应包装**：全局统一使用以下严格的数据返回结构标准：
  `{ code: 200, message: "ok", data: ... }`

## 2. 目录规范
- `src/index.js`：应用入口与中间件挂载（含 body-parser, cors）。
- `src/routes/`：存放所有的 Express 路由定义文件。
- `src/controllers/`：存放各个路由绑定的核心业务逻辑。
- `src/services/`：封装数据持久化逻辑。
- `data/`：存放生成与存储的低代码配置文件。
