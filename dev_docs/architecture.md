# 系统架构

## 总体架构

```text
Browser
  |
  v
React / Vite SPA
  - React Flow graph workspace
  - Vditor paper editor
  - local page/dialog state
  - TanStack Query server state
  |
  | JSON REST API
  v
FastAPI
  - routers
  - services and transaction commits
  - thin repositories and/or direct ORM queries
  - Markdown exporter
  |
  v
SQLite + Local Workspace
  - workspace/database/research_graph.db
  - workspace/exports/
```

这是概念分层，不是强制的依赖规则：repositories 只覆盖 project、paper 和 canvas 的部分查询；relation service 和 canvas service 也会直接查询 ORM model；service 通常在一次调用内部自行 `commit()`。

## 技术栈

### 前端

- React 19、TypeScript、Vite。
- React Router、TanStack Query。
- React Flow、Vditor、lucide-react。
- 全局 CSS 和 design tokens 位于 `frontend/src/styles.css`。

### 后端

- Python 3.12 容器基线。
- FastAPI、SQLAlchemy 2.x、Pydantic。
- SQLite。

## 前端架构

```text
frontend/src/
  api/          HTTP client 和按资源划分的 API wrapper
  pages/        GraphPage、PaperEditorPage
  features/     图谱弹窗/节点和论文编辑组件
  components/   共享通知、确认、错误和选择控件
  types/        API/页面共享类型
  utils/        错误信息与显示 label 工具
  main.tsx      Router、QueryClient 和页面入口
  styles.css    全局视觉实现
```

### GraphPage

`frontend/src/pages/GraphPage.tsx` 是图谱页的中央编排器，而不是一个只负责渲染的薄页面。它负责：

- 加载默认项目和完整 graph payload。
- 维护 React Flow node state、展开节点、拖动状态和 viewport focus。
- 管理创建、编辑、删除和关系标签弹窗。
- 执行 paper、relation label、incoming relation、position 和 export mutations。
- 在已加载 graph payload 上做客户端搜索，最多展示 8 条结果。

图谱存在两套 ID：

```text
React Flow node.id = CanvasNode.id
GraphNode.paper_id = Paper.id
Relation.source_paper_id / target_paper_id = Paper.id
```

`GraphPage` 必须先建立 `paperIdByCanvasNode` 和 `canvasNodeIdByPaper` 映射，才能在节点操作和 React Flow edge 之间转换。

当前只接线了单节点位置保存：拖拽结束后调用 `PATCH /api/canvas-nodes/{id}`。后端虽然提供 batch layout 和 viewport API，前端没有调用它们，也没有恢复返回的 viewport；React Flow 目前使用 `fitView` 初始化。

### PaperEditorPage

`frontend/src/pages/PaperEditorPage.tsx` 负责：

- 加载 paper 详情并复制到页面本地状态。
- 编辑 title、metadata 和 Markdown。
- 使用 `Paper.version` 执行手动乐观锁保存。
- 从 fenced code block 之外的 ATX `#`/`##`/`###` 标题生成目录。
- 通过 `MarkdownEditor` ref 读取 Vditor 的最新 Markdown。

未保存离开保护不是全局能力：只有顶部“返回工作台”按钮调用 `guardedBack()`；页脚 `<Link>`、浏览器刷新/关闭和其他路由跳转不会统一触发确认。

### Vditor runtime assets

`MarkdownEditor.tsx` 设置 `cdn: "/vditor"`。`frontend/vite.config.ts` 中的自定义插件：

- 开发时把 `/vditor/dist/*` 映射到 `node_modules/vditor/dist/*`。
- 构建后把 runtime 复制到 `dist/vditor/dist/*`。

应用不依赖公共 CDN。

## 后端架构

```text
backend/app/
  main.py         应用创建、middleware、router 注册、schema 初始化
  api/            FastAPI routers
  core/           配置、数据库 session、错误处理
  models/         SQLAlchemy ORM
  schemas/        Pydantic 输入输出
  repositories/   部分基础查询
  services/       业务规则、查询组合和事务提交
  exporters/      Markdown 生成与文件写入
```

### 启动与 schema

`backend/app/main.py` 在应用创建时：

1. 创建 workspace 目录。
2. 执行 `Base.metadata.create_all()`。
3. 对旧 SQLite 库执行唯一的手写兼容修复：缺少 `relation_labels.emoji` 时 `ALTER TABLE`。
4. 注册 CORS、`AppError` handler 和 routers。

当前没有 Alembic、schema version table 或通用 migration framework。

### GET 请求的惰性写入

部分读取流程会创建默认数据：

- `GET /api/projects/default` 在空库中创建默认 project 和 canvas。
- graph 读取在 project 没有 canvas 时创建默认 canvas。
- graph 或 relation-label 读取在 project 没有标签时创建四个默认 relation labels。

因此不能假设所有 GET 请求都是无副作用的。

### 事务边界

service 通常自行提交：

- Paper 创建会在一个 service 调用中创建 `Paper` 和 `CanvasNode` 后提交。
- Paper 更新校验 version，更新内容并 `version += 1` 后提交。
- Incoming relation replace 删除旧入边、插入新入边后提交。
- Canvas 和 relation-label 更新分别提交。

图谱节点编辑在前端组合两个请求：

```text
PUT /api/papers/{paper_id}
PUT /api/papers/{paper_id}/incoming-relations
```

它们不是跨请求事务。如果第一个请求成功、第二个失败，paper 更新已经持久化，不会自动回滚。

## 主要运行流

### 初始图谱加载

```text
GraphPage
  -> GET /api/projects/default
     -> 读取或创建默认 project/canvas
  -> GET /api/projects/{project_id}/graph
     -> 读取或创建默认 canvas
     -> 加载 CanvasNode + Paper summary
     -> 加载 Relation
     -> 读取或创建默认 RelationLabel
```

Graph endpoint 是图谱页的组合 read model，返回 project、canvas、nodes、edges 和 relation labels。

### 创建论文节点

```text
CreateNodeDialog
  -> POST /api/projects/{project_id}/papers
  -> create_paper()
  -> Paper + default CanvasNode
  -> commit
  -> invalidate graph query
```

### 编辑图谱节点

```text
EditNodeDialog
  -> PUT paper metadata/title/version
  -> PUT target paper incoming relations
  -> invalidate paper/relation/graph queries
```

### 论文编辑保存

```text
PaperEditorPage
  -> MarkdownEditorHandle.getMarkdown()
  -> PUT /api/papers/{paper_id}
  -> exact version check
  -> version += 1
  -> commit
```

### Markdown 导出

单篇导出返回 `text/markdown` 下载。项目导出写入服务器：

```text
workspace/exports/<project-slug>-<timestamp>/
  graph.md
  papers/<paper-id>-<slug>.md
```

`graph.md` 当前只是论文链接列表；项目快照不包含 relation、relation label、canvas position 或 viewport，不能用于完整恢复。

## Docker Compose runtime

Docker Compose 是项目当前在自有服务器上的实际部署拓扑。`docker-compose.yml` 构建两个 service：

```text
backend   FastAPI，只暴露在内部 Docker network
frontend  nginx，提供前端静态文件并代理 API
```

前端镜像：

```text
node:22-slim builder -> npm ci -> npm run build
nginx:1.27-alpine    -> serve /usr/share/nginx/html
```

nginx runtime routing：

- `/` 和应用路由使用 `index.html` SPA fallback。
- `/api/` 代理到 `http://backend:8000/api/`。
- `/health` 代理到后端 health endpoint。
- `/vditor/` 提供构建后的本地 runtime assets。
- 80 端口重定向到 HTTPS。

当前 `server_name` 和 TLS 证书配置面向 `ugraph.me`/`www.ugraph.me`，不是可信的 localhost TLS 开发配置。应用本身没有认证或授权；公网部署必须在网络或反向代理层增加访问控制，CORS 不能替代认证。

## 本地源码开发的工作目录

`backend/app/core/config.py` 中的 `./workspace`、SQLite URL 和 `.env` 都按进程当前工作目录解析。若从 `backend/` 运行未带环境变量的 `python main.py`，数据会写入 `backend/workspace/`，而不是仓库根 `workspace/`。

推荐从 `backend/` 启动时显式设置：

```bash
WORKSPACE_PATH=../workspace \
DATABASE_URL=sqlite:///../workspace/database/research_graph.db \
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
python main.py
```

前端开发使用：

```bash
cd frontend
npm ci
npm run dev
```

## Design System

前端样式唯一文档入口是 [design-system.md](./design-system.md)，实现以 `frontend/src/styles.css` 为准。

关键约束：

- 暖色学术写作台风格和棕色 accent tokens。
- 不引入绿色、teal 或蓝紫色主 accent system。
- Vditor 外不再增加额外 Markdown card。
- React Flow node expansion 由显式 graph state 控制，不由 native selection 控制。
- 普通通知自动消失；错误和确认流程使用应用内共享 dialog。
