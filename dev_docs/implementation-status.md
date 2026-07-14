# 实现状态

本文档记录当前代码的稳定能力、运行方式和已知边界。临时样式调整和已废弃实现细节不记录。

## 当前版本范围

当前版本是 Local Research Graph 的本地最小可用闭环：

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

- 加载默认项目和默认画布。
- 使用 React Flow 展示论文节点和有向关系边。
- 新建论文节点，`title` 必填，可填写 `year`、`venue`、`tags`。
- 单击节点展开/收起 metadata。
- 点击画布空白区域收起当前节点。
- 拖动节点并在拖动结束后保存位置。
- 双击节点进入独立论文编辑页。
- 展开节点后可快速编辑 title、metadata、节点颜色和节点形状。
- 在节点编辑弹窗中维护“指向本文的关系”，只展示已存在关系和一行空白添加器。
- 通过关系设置弹窗维护项目级关系标签 emoji、名称、颜色、线型和排序。
- 在图谱概览面板中按 title、authors、venue、tags、status 搜索节点。
- 点击搜索结果后定位并展开目标节点。
- 展开节点后可删除节点，删除前显示自定义确认弹窗。
- 节点宽度按内容自适应，长标题有最大宽度限制。
- 操作成功提示自动消失，操作失败使用统一错误确认弹窗。
- 全项目 Markdown 导出。

相关文件：

```text
frontend/src/pages/GraphPage.tsx
frontend/src/features/graph/CreateNodeDialog.tsx
frontend/src/features/graph/EditNodeDialog.tsx
frontend/src/features/graph/DeleteNodeDialog.tsx
frontend/src/features/graph/PaperNode.tsx
frontend/src/features/graph/RelationLabelsDialog.tsx
```

### 论文编辑页面

入口：

```text
/papers/:paperId/edit
```

已实现：

- 加载论文详情。
- 编辑 `title`。
- 编辑 metadata：`authors`、`year`、`venue`、`tags`、`status`。
- 使用 Vditor WYSIWYG 编辑 Markdown。
- Vditor runtime 从本地 `/vditor` 路径加载。
- Vditor 初始化失败时降级为 textarea。
- 手动保存。
- 支持 `Ctrl/Cmd + S` 保存。
- 保存时主动读取 Vditor 当前 Markdown，避免保存旧编辑器状态。
- 保存时使用 `version` 做乐观锁。
- 保存成功提示自动消失，保存失败使用统一错误确认弹窗。
- 离开页面时如有未保存内容，使用统一确认弹窗。
- 单篇 Markdown 导出。

相关文件：

```text
frontend/src/pages/PaperEditorPage.tsx
frontend/src/features/papers/PaperMetadataForm.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/vite.config.ts
```

### 后端 API

已实现：

- 默认项目获取和自动创建。
- 默认画布获取和自动创建。
- 图谱数据读取。
- 论文节点创建、读取、更新、删除。
- 画布节点位置保存。
- 批量布局保存接口。
- 视口保存接口。
- 关系标签创建、读取、更新、删除。
- 单个节点入边关系读取和替换。
- 图谱接口返回关系边和关系标签配置。
- 单篇 Markdown 导出。
- 全项目 Markdown 导出。
- 统一业务错误结构。

相关文件：

```text
backend/app/api/projects.py
backend/app/api/papers.py
backend/app/api/canvas.py
backend/app/api/relations.py
backend/app/api/export.py
backend/app/services/
```

### 数据存储

已实现：

- SQLite 数据库。
- 数据库路径：`workspace/database/research_graph.db`。
- 导出目录：`workspace/exports/`。
- 数据库作为主数据源。
- Markdown 文件只作为导出结果。

关键约定：

- `papers.metadata_json` 保存论文 metadata，也保存节点显示配置 `nodeColor`、`nodeShape`。
- `papers.markdown_content` 保存正文。
- `papers.version` 用于乐观锁。
- `relation_labels` 保存项目级关系标签配置，包括 emoji、名称和边样式。
- `relations` 保存 source paper 指向 target paper 的有向边。

### 前端反馈机制

已实现：

- `NoticeBanner`：普通消息自动消失。
- `AlertDialog`：错误和失败状态由用户确认关闭。
- `ConfirmDialog`：需要明确选择的确认流程。
- 图谱页和论文编辑页不再使用浏览器原生 `alert` / `confirm` 作为应用内反馈。

## 运行方式

### Docker Compose

```bash
docker compose up --build
```

前端：

```text
http://localhost:3000
```

后端：

```text
http://localhost:8000
```

健康检查：

```text
GET http://localhost:8000/health
```

### 服务器公网部署

如果要通过自己的域名访问，推荐在反向代理后面部署，并把前后端放到同一个站点下：

- 前端：`https://your-domain.com/`
- 后端 API：`https://your-domain.com/api`

此时建议设置：

```bash
VITE_API_BASE_URL=/api
CORS_ORIGINS=https://your-domain.com
```

如果前后端分开域名，也可以把 `VITE_API_BASE_URL` 指向后端完整地址，例如 `https://api.your-domain.com/api`，同时把 `CORS_ORIGINS` 设置为前端站点来源。

### 本地开发

后端：

```bash
cd backend
pip install -r requirements.txt
python main.py
```

前端：

```bash
cd frontend
npm install
npm run dev
```

开发侧验证：

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall app
```

## 已知边界

当前版本暂不包含：

- 自动保存。
- JSON 导入导出。
- PDF 上传。
- 多项目管理界面。
- 撤销/重做。
- Markdown 导入。
- 多画布。
- AI / GraphRAG。
- Playwright 自动化回归测试。

## 下一步建议

优先级建议：

1. 基础 Playwright 回归测试。
2. JSON 导入导出。
