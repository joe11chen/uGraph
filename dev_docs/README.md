# Local Research Graph 开发文档

本文档集记录当前本地论文图谱项目的架构、数据模型、API、前端实现、设计规范和实现状态。

当前版本目标是一个本地最小可用闭环：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

## 文档结构

- [architecture.md](./architecture.md)：系统架构和模块划分。
- [data-model.md](./data-model.md)：数据库表设计和字段说明。
- [api.md](./api.md)：后端 REST API 设计。
- [frontend.md](./frontend.md)：前端页面、交互、状态和编辑器实现。
- [design-system.md](./design-system.md)：前端视觉和交互设计规范入口。
- [agent_skills/design-system.md](./agent_skills/design-system.md)：给开发代理使用的详细前端设计系统。
- [frontend-change-log.md](./frontend-change-log.md)：前端重要变更记录。
- [implementation-status.md](./implementation-status.md)：当前实现清单、运行方式和已知边界。
- [tasks.md](./tasks.md)：已完成里程碑和后续开发计划。

## 当前核心能力

- 本地 Web 应用。
- SQLite 持久化。
- 默认项目和默认画布。
- React Flow 图谱画布。
- 新建论文节点。
- 搜索并定位论文节点。
- 节点拖拽和位置保存。
- 单击节点展开/收起 metadata。
- 图谱页快速编辑和删除节点。
- 双击节点进入独立论文编辑页。
- Vditor WYSIWYG Markdown 编辑。
- Metadata 编辑。
- 论文编辑页和节点编辑弹窗快捷键保存。
- 单篇 Markdown 导出。
- 全项目 Markdown 导出。

## 前端设计约定

前端视觉和交互以 [agent_skills/design-system.md](./agent_skills/design-system.md) 为详细准则，[design-system.md](./design-system.md) 保留为兼容入口。

关键约定：

- 使用暖色学术写作台风格。
- 使用 Claude 风格棕色 accent。
- React Flow 节点默认压缩，单击后按内容展开。
- 论文详情页直接使用 Vditor WYSIWYG。
- 不再使用左右 Markdown 编辑/预览分栏。
- 不再使用 CodeMirror 或 ReactMarkdown 作为论文编辑主路径。

## 运行方式

Docker Compose：

```bash
docker compose up --build
```

访问入口（容器内 nginx 统一提供）：

```text
http://localhost
https://localhost
```

API（经同域反向代理）：

```text
https://localhost/api
https://localhost/health
```

部署说明：

- `docker-compose.yml` 默认映射 `80:80` 和 `443:443`。
- 可通过环境变量覆盖宿主机端口：`HTTP_PORT`、`HTTPS_PORT`。
- HTTPS 证书文件需放在 `certs/origin.crt` 与 `certs/origin.key`。

前端开发侧验证：

```bash
cd frontend
npm run build
```
