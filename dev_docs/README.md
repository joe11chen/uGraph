# Local Research Graph 开发文档

本文档集记录当前自托管论文图谱项目的架构、数据模型、API、前端实现、设计规范和实现状态。项目目前实际部署在自有服务器上，通过 Docker Compose 运行；本地前后端分开启动只用于源码开发。

当前版本目标是一个自托管最小可用闭环：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

## 文档事实优先级

文档与实现不一致时，按以下顺序判断：

1. 当前源码和可执行配置。
2. 本目录中的当前状态文档，尤其是 `implementation-status.md`、`architecture.md`、`api.md` 和 `data-model.md`。
3. 根目录 `需求文档.md` 中的初始愿景和候选需求。

仓库级启动入口见 [根 README](../README.md)，后续 Claude Code 的项目上下文见 [CLAUDE.md](../CLAUDE.md)。

## 文档结构

- [architecture.md](./architecture.md)：系统架构、运行时数据流和模块边界。
- [data-model.md](./data-model.md)：数据库表、事务、迁移和导出映射。
- [api.md](./api.md)：后端 REST API、状态码和行为语义。
- [frontend.md](./frontend.md)：前端页面、交互、状态和编辑器实现。
- [design-system.md](./design-system.md)：前端视觉和交互设计规范的唯一文档入口。
- [frontend-change-log.md](./frontend-change-log.md)：影响后续开发的前端稳定决策。
- [implementation-status.md](./implementation-status.md)：当前实现清单、运行方式和已知边界。
- [tasks.md](./tasks.md)：已完成里程碑和后续开发计划。

## 当前核心能力

- 自托管 Web 应用和 Docker volume 中的 SQLite 持久化。
- 自动创建默认项目和默认画布。
- React Flow 图谱、论文节点 CRUD、搜索定位和位置保存。
- 节点 metadata、显示配置、关系标签和入边关系编辑。
- Vditor WYSIWYG Markdown 编辑与 `Paper.version` 乐观锁。
- 单篇 Markdown 下载。
- 全项目服务器端 Markdown 目录快照。

项目 Markdown 快照不是完整备份：当前 `graph.md` 只列论文链接，不序列化关系标签、关系边、画布布局或视口，也没有 ZIP/浏览器目录下载。

## 前端设计约定

前端视觉和交互以 [design-system.md](./design-system.md) 为准，canonical CSS token 和现有组件模式位于 `frontend/src/styles.css`。

关键约定：

- 使用暖色学术写作台风格和棕色 accent。
- React Flow 节点默认压缩，显式单击后按内容展开。
- 论文详情页直接使用 Vditor WYSIWYG。
- 不使用左右 Markdown 编辑/预览分栏。
- 不使用 CodeMirror 或 ReactMarkdown 作为论文编辑主路径。

## 运行模式

### 本地源码开发

本地开发分别启动 Vite 和 FastAPI。后端默认配置使用相对路径；从 `backend/` 启动时必须显式把 `WORKSPACE_PATH` 和 `DATABASE_URL` 指向仓库根 `workspace/`。完整命令见 [根 README](../README.md#本地源码开发) 和 [implementation-status.md](./implementation-status.md#本地源码开发)。

### Docker Compose

```bash
docker compose up --build
```

Docker Compose 是当前自有服务器的实际部署方式。Compose 前端是生产构建产物加 nginx，不是 Vite 开发容器；nginx 将 HTTP 重定向到 HTTPS，并使用 `ugraph.me` 域名和挂载的 Origin 证书。`https://localhost` 不属于当前部署拓扑。

应用本身没有认证或授权；公网部署必须由受信网络、VPN 或带认证的反向代理提供访问控制。

## 当前验证

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app
```

仓库当前没有自动化测试、单测试命令、lint、format 或 CI。
