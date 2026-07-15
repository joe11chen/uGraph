# uGraph

uGraph 是一个本地优先、可自托管的论文知识图谱与 Markdown 笔记工具。当前实现围绕一个自动创建的默认项目和默认画布，提供论文节点 CRUD、关系标签与入边编辑、React Flow 图谱、Vditor WYSIWYG 编辑、SQLite 持久化和 Markdown 导出。项目当前实际运行在自有服务器上，通过 Docker Compose 部署。

> [需求文档.md](./需求文档.md) 记录初始产品愿景和候选需求，不代表当前全部能力。实际实现范围以源码、配置和 [dev_docs/implementation-status.md](./dev_docs/implementation-status.md) 为准。

## 当前边界

当前已实现最小闭环：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

当前没有应用层认证、自动保存、JSON 备份恢复、PDF 上传、多项目 UI、自动化测试或 CI。项目 Markdown 导出会在服务器工作区生成一个有损目录快照；它不包含完整关系、布局和视口信息，不能作为可恢复备份。

## 运行环境

仓库容器配置使用：

- Python 3.12
- Node.js 22
- Docker Compose（当前服务器部署方式）

## 本地源码开发

前端开发服务器运行在 `http://localhost:3000`：

```bash
cd frontend
npm ci
npm run dev
```

后端运行在 `http://127.0.0.1:8000`。后端配置中的相对路径按当前工作目录解析，因此从 `backend/` 启动时要显式指向仓库根部的 `workspace/`：

```bash
cd backend
python -m pip install -r requirements.txt
WORKSPACE_PATH=../workspace \
DATABASE_URL=sqlite:///../workspace/database/research_graph.db \
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
python main.py
```

根目录的 `.env.example` 主要描述 Docker Compose/域名部署参数；从 `backend/` 直接运行时不会自动加载根目录 `.env`。

## Docker Compose

```bash
docker compose up --build
```

Compose 会构建 FastAPI 后端，以及由 nginx 提供的前端静态产物。当前 nginx 配置：

- 将 HTTP 重定向到 HTTPS；
- 使用 `ugraph.me` / `www.ugraph.me` 作为 `server_name`；
- 从 `certs/origin.crt` 和 `certs/origin.key` 挂载 TLS 材料；
- 同域代理 `/api/` 和 `/health` 到后端。

这是项目当前在自有服务器上的实际部署方式，使用配置的域名对外提供服务。它不应被描述成 `https://localhost` 的本地运行方案；需要修改和调试源码时，再使用上一节的前后端开发模式。

## 数据位置

源码开发按上述命令运行时，数据位于：

```text
workspace/
  database/research_graph.db
  exports/
```

Docker 中后端使用 `/app/workspace`，并通过 Compose 映射到宿主机根目录 `workspace/`。SQLite 数据库是主数据源；Markdown 文件仅是导出产物。

## 验证命令

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app
```

仓库当前没有测试 runner、单测试命令、lint、format 或 CI 配置。

## 部署安全

应用当前没有登录、授权或租户隔离。不要直接作为匿名公网服务暴露；公网使用应放在受信网络、VPN 或具备认证与访问控制的反向代理之后。CORS 不是访问控制。

TLS 私钥必须从仓库外部的部署环境或 secret store 提供。如果仓库历史中出现过真实私钥，应视为已暴露并在证书提供方轮换；文档、提交和 issue 中不要复制密钥内容。

## 文档

- [开发文档索引](./dev_docs/README.md)
- [系统架构](./dev_docs/architecture.md)
- [数据模型](./dev_docs/data-model.md)
- [REST API](./dev_docs/api.md)
- [前端实现](./dev_docs/frontend.md)
- [设计系统](./dev_docs/design-system.md)
- [当前实现状态](./dev_docs/implementation-status.md)
- [后续任务](./dev_docs/tasks.md)
