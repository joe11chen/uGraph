# 实现状态

本文档记录当前代码的稳定能力、运行方式和已知边界。临时样式调整和已废弃实现细节不记录。

## 当前版本范围

当前版本是 Local Research Graph 的自托管最小可用闭环，实际运行在自有服务器的 Docker Compose 环境中：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

## 已实现功能

### 图谱页面

入口：

```text
/
/projects/default/graph
```

已实现：

- 自动加载/创建默认 project 和默认 canvas。
- 使用 React Flow 展示论文节点和有向关系边。
- 创建、快速编辑和删除论文节点。
- 编辑 title、status、tags、TLDR、nodeColor、nodeShape。
- 维护项目级 relation label 的 emoji、名称、颜色、线型和排序。
- 用“已有入边 + 一行添加器”全量维护指向当前 paper 的关系。
- 在当前 graph payload 中搜索 title、tags、status、TLDR 和 legacy authors/venue；最多显示 8 条结果。
- 点击搜索结果后定位并展开节点。
- 单击展开/收起，双击进入 paper editor。
- 拖动结束后保存单个 CanvasNode 的位置。
- 普通成功提示自动消失，错误和确认使用共享 dialog。
- 触发项目 Markdown 服务器端目录导出。

当前未使用后端的 batch layout 和 viewport 保存接口，graph 初始化仍使用 `fitView`。

### 论文编辑页面

入口：

```text
/papers/:paperId/edit
```

已实现：

- 编辑 title、status、tags、TLDR 和 Markdown。
- 使用 Vditor WYSIWYG；runtime 从本地 `/vditor` 加载。
- 对被捕获的 Vditor 加载/初始化错误提供 textarea fallback path。
- 根据 fenced code block 外的 ATX H1/H2/H3 生成可折叠目录。
- 手动保存和 `Ctrl/Cmd + S`。
- 保存时从 Vditor ref 读取最新 Markdown。
- 使用 `Paper.version` 乐观锁。
- 单篇 Markdown 下载。

未保存保护仅覆盖顶部“返回工作台”按钮。页脚 Link、浏览器刷新/关闭、后退和其他导航没有 router blocker 或 `beforeunload` 保护。

### 后端 API

已实现：

- 默认 project/canvas 的读取与惰性创建。
- 完整 graph read model。
- Paper CRUD 和 version conflict 处理。
- 单节点位置、batch layout 和 viewport endpoints。
- Relation-label CRUD 和四个默认标签。
- Incoming relations 读取和全量替换。
- 单篇 Markdown 下载与项目 Markdown 目录快照。
- 显式 `AppError` 的业务错误 envelope。

FastAPI/Pydantic validation error 仍使用标准 `422 {"detail": ...}`；未捕获异常也不保证使用业务 envelope。

### 数据存储

逻辑数据位置：

```text
workspace/
  database/research_graph.db
  exports/
```

关键约定：

- SQLite 是主数据源，Markdown 是导出产物。
- `papers.metadata_json` 保存可扩展 metadata 和 nodeColor/nodeShape。
- `papers.markdown_content` 保存正文。
- `papers.version` 用于乐观锁。
- `canvas_nodes` 保存独立布局。
- `relation_labels` 和 `relations` 保存有向图结构。

实际路径按进程 CWD 和环境变量决定。Docker Compose 显式把宿主机根 `workspace/` 映射到 `/app/workspace`。从 `backend/` 未带环境变量运行时，默认配置会写入 `backend/workspace/`。

## 运行环境

容器配置使用：

- Python 3.12。
- Node.js 22。

## 本地源码开发

### 后端

从 `backend/` 启动时显式指向仓库根 workspace：

```bash
cd backend
python -m pip install -r requirements.txt
WORKSPACE_PATH=../workspace \
DATABASE_URL=sqlite:///../workspace/database/research_graph.db \
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
python main.py
```

后端监听 `127.0.0.1:8000`，并开启 Uvicorn reload。

`backend/app/core/config.py` 的相对路径和 `.env` 文件按当前工作目录解析。根 `.env.example` 主要供 Compose/域名部署参考；从 `backend/` 启动不会自动加载根目录 `.env`。

### 前端

```bash
cd frontend
npm ci
npm run dev
```

Vite 监听 `http://localhost:3000`，默认直接请求 `http://localhost:8000/api`。`VITE_API_BASE_URL` 是 build-time 配置。

使用 `npm ci` 做干净、可重复安装；只有在有意修改依赖时才使用 `npm install <package>`。

## Docker Compose 部署

Docker Compose 是项目当前在自有服务器上的实际运行方式，而不是仅供本地试跑的可选配置。

```bash
docker compose up --build
```

Compose 架构：

- backend：FastAPI，只在内部 Docker network 提供 8000。
- frontend：Node 22 builder 执行 `npm ci` 和 `npm run build`，运行阶段由 nginx 提供静态文件并代理 `/api/`、`/health`。
- host 默认映射 80 和 443，可用 `HTTP_PORT`、`HTTPS_PORT` 覆盖。
- host 根 `workspace/` 映射到 backend `/app/workspace`。
- `certs/` 只读挂载到 nginx。

当前 nginx 配置：

- `server_name` 是 `ugraph.me`、`www.ugraph.me`。
- HTTP 请求重定向到同 host 的 HTTPS。
- TLS 从 `certs/origin.crt` 和 `certs/origin.key` 读取。

这套域名导向的 Compose 拓扑就是当前自有服务器部署。它不是 `https://localhost` 开发环境；Cloudflare Origin certificate 的信任依赖 Cloudflare/代理链路，运维时需要明确 TLS 终止位置。

### 安全边界

应用当前没有认证、授权或租户隔离。不要直接匿名暴露到公网。公网运行必须由受信网络、VPN 或带认证/访问控制的反向代理保护；CORS 只限制浏览器来源，不能阻止非浏览器客户端调用 CRUD/export API。

生产 TLS 私钥必须从仓库外的部署环境或 secret store 提供。如果真实私钥曾进入仓库历史，应视为已暴露并轮换；文档中不要复制其内容。

## Markdown 导出边界

### 单篇

`GET /api/papers/{id}/export/markdown` 返回 `text/markdown` attachment。

### 项目

`POST /api/projects/{id}/export/markdown` 写入：

```text
workspace/exports/<project-slug>-<timestamp>/
  graph.md
  papers/<paper-id>-<slug>.md
```

响应只返回相对 `workspace/` 的服务器路径。当前没有 ZIP，也不会把目录下载到浏览器。

`graph.md` 只是论文链接索引。项目导出不包含：

- relation labels。
- relations。
- CanvasNode position/size。
- canvas viewport。
- 可用于恢复的 manifest 或格式版本。

因此项目 Markdown 导出是有损阅读快照，不是完整备份。版本化 JSON 备份与恢复仍是后续任务。

## Schema 与迁移

启动时使用 `Base.metadata.create_all()` 创建缺失表。旧库唯一的手写兼容修复是缺少 `relation_labels.emoji` 时执行 SQLite `ALTER TABLE`。

当前没有 Alembic、migration command、schema version table 或通用升级/回滚策略。后续 model 变更前需要先建立迁移和备份策略。

## 验证现状

当前可执行的最低验证：

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app
```

当前仓库没有：

- backend unit/API tests。
- frontend component tests。
- Playwright/E2E tests。
- test runner 或单测试命令。
- lint/format 命令。
- CI workflow。

这些命令只是 TypeScript/build 和 Python syntax/bytecode 验证，不是行为测试。

## 已知边界

当前版本暂不包含：

- 自动保存。
- 完整的未保存导航保护。
- JSON 备份/恢复。
- PDF 上传。
- 多项目管理界面。
- 多画布 UI。
- 撤销/重做。
- Markdown 导入。
- 应用认证与授权。
- 通用数据库迁移。
- 自动化测试和 CI。
- AI / GraphRAG。

后续优先级见 [tasks.md](./tasks.md)。
