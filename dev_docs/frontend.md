# 前端实现说明

本文档记录当前前端的稳定页面结构、交互契约和状态管理。视觉规范以 [design-system.md](./design-system.md) 为准，具体实现以 `frontend/src/styles.css` 和现有组件模式为准。

## 技术栈

- React 19、TypeScript、Vite。
- TanStack Query、React Router。
- React Flow、Vditor、lucide-react。

## 路由

```text
/                         -> GraphPage
/projects/default/graph   -> GraphPage
/papers/:paperId/edit     -> PaperEditorPage
*                         -> redirect to /
```

## GraphPage

`frontend/src/pages/GraphPage.tsx` 是图谱页的中央编排器。它直接管理 query/mutation、React Flow state、搜索、弹窗和用户反馈，没有额外的全局 store 或 graph controller hook。

主要职责：

- 加载默认 project 和完整 graph payload。
- 展示论文节点、关系边和 relation-label 样式。
- 新建、快速编辑和删除论文节点。
- 编辑指向当前节点的 incoming relations。
- 维护项目级 relation labels。
- 拖拽节点并在结束时保存单节点位置。
- 单击展开/收起，双击进入 paper editor。
- 导出项目 Markdown 服务器端快照。

主要组件：

```text
GraphPage
  - ReactFlow
  - PaperNode
  - CreateNodeDialog
  - EditNodeDialog
  - RelationLabelsDialog
  - DeleteNodeDialog
  - NoticeBanner
  - AlertDialog
```

### ID 映射

前端图谱同时使用 canvas node ID 和 paper ID：

```text
React Flow node.id = CanvasNode.id
GraphNode.paper_id = Paper.id
Relation endpoints = Paper.id
```

`GraphPage` 从 graph payload 建立两张 map：

- `paperIdByCanvasNode`：节点操作和路由跳转使用。
- `canvasNodeIdByPaper`：把后端 relation 转为 React Flow edge 使用。

修改图谱相关代码时不能把这两种 ID 混用。

### 节点展示和展开

`PaperNode` 有压缩和展开两种状态：

```text
压缩状态
  - status
  - title

展开状态
  - 操作菜单
  - status
  - title
  - TLDR（如存在）
  - tags（如存在）
```

稳定约定：

- React Flow native `selected` 不控制展开，因为拖动也可能触发 selection。
- `GraphPage` 维护 `expandedNodeId`，通过 `node.data.expanded` 传入。
- 单击节点切换展开状态，点击画布空白处收起。
- 拖动节点不会展开节点。
- 双击节点按 paper ID 进入独立编辑页。

### 客户端搜索

搜索完全基于当前已加载的 graph payload，没有后端搜索 endpoint。匹配字段包括：

- title。
- tags。
- status 原值和本地化显示值。
- TLDR。
- 兼容旧 metadata 的 authors、venue。

搜索是小写子串匹配。界面最多显示 8 条结果；匹配更多时提示继续缩小范围。点击结果会展开节点并调用 React Flow `setCenter()` 定位。

### 快速编辑与非原子保存

`EditNodeDialog` 可编辑：

```text
title
status
tags
TLDR
nodeColor
nodeShape
incoming relations
```

保存流程：

1. `PUT /api/papers/{paper_id}` 保存 title、metadata 和当前 Markdown/version。
2. `PUT /api/papers/{paper_id}/incoming-relations` 全量替换指向当前 paper 的关系。
3. 两个请求成功后刷新 paper、incoming-relations 和 graph query。

这两个请求不是同一事务。如果第一个请求成功、第二个失败，paper 更新已经提交，前端不会自动回滚，只会显示错误并等待用户重试。

### 画布持久化

当前前端只使用：

```text
PATCH /api/canvas-nodes/{canvas_node_id}
```

拖动期间只更新本地 React Flow state，`onNodeDragStop` 后保存 x/y。后端 batch layout 和 viewport endpoints 没有 frontend wrapper/caller，返回的 canvas viewport 也没有恢复；React Flow 当前使用 `fitView`。

## PaperEditorPage

`frontend/src/pages/PaperEditorPage.tsx` 负责：

- 加载 paper detail。
- 编辑 title、metadata 和 Markdown。
- 使用 Vditor WYSIWYG。
- 生成可折叠目录。
- 手动保存并支持 `Ctrl/Cmd + S`。
- 使用 `version` 乐观锁。
- 提供单篇 Markdown 下载入口。

页面把查询结果复制到本地 `title`、`metadata`、`markdown`、`version` 和 `dirty` state。保存前通过 `MarkdownEditorHandle.getMarkdown()` 读取 Vditor 最新值，避免只依赖 React input event 的同步时机。

### 目录解析

`parseMarkdownOutline()` 只识别 fenced code block 外的 ATX 标题：

```text
# H1
## H2
### H3
```

它不解析 setext heading，也不解析 H4–H6。重复标题使用 occurrence index 区分，点击后由 `MarkdownEditor.scrollToHeading()` 定位到渲染标题。

目录面板在桌面和窄屏都保持 fixed、可展开的浮层；响应式规则只调整位置、最大高度和内容换行，不会把目录插入编辑器上方的普通文档流。

### 未保存离开保护

当前保护范围有限：

- 顶部“返回工作台”按钮经过 `guardedBack()`，dirty 时显示 `ConfirmDialog`。
- 页脚 `<Link to="/">` 不经过该保护。
- 没有 router blocker 或 `beforeunload` handler。
- 浏览器刷新、关闭标签页、浏览器后退和其他直接导航没有统一确认。

文档和 UI 变更不应把它描述为完整的页面离开保护。

## MarkdownEditor

`frontend/src/features/papers/MarkdownEditor.tsx`：

- 动态 import Vditor。
- 配置 WYSIWYG mode 和 `cdn: "/vditor"`。
- 暴露 `getMarkdown()` 和 `scrollToHeading()` ref handle。
- 针对 React 19 dev StrictMode 做防御性 cleanup。
- 对被捕获的加载/初始化错误提供 textarea fallback path。

Vditor runtime 由 `frontend/vite.config.ts` 自托管；不要切换到公共 CDN，也不要恢复 split edit/preview、CodeMirror 或 ReactMarkdown 主链路。

## Metadata

前端主要 metadata：

```ts
type PaperMetadata = {
  tags?: string[];
  status?: string;
  tldr?: string;
  nodeColor?: string;
  nodeShape?: string;
  [key: string]: unknown;
};
```

`tags` 统一承载作者、会议/期刊、主题和自定义短标签。旧数据中的 `authors`、`venue`、`year` 在 metadata form 中合并到可见 tags，保存时移除这些 legacy key。

用户不手写 frontmatter；后端导出时生成 frontmatter，并过滤展示配置和 legacy 字段。

## 状态管理

### 服务端状态

使用 TanStack Query。主要操作：

- `getDefaultProject`、`getProjectGraph`。
- `createPaper`、`getPaper`、`updatePaper`、`deletePaper`。
- `getIncomingRelations`、`updateIncomingRelations`。
- relation-label create/update/delete。
- `updateCanvasNodePosition`。
- `exportProjectMarkdown`。

### 本地状态

当前不使用 Zustand。

`GraphPage` 持有：React Flow nodes、expanded/editing/deleting IDs、搜索、拖动状态、flow instance、弹窗状态和 notice/error。

`PaperEditorPage` 持有：title、metadata、Markdown、editor ref、version、dirty、outline 和 notice/error/leave-confirm 状态。

## 用户反馈

- 普通成功/info 使用 `NoticeBanner`，默认自动消失。
- API 和保存失败使用 `AlertDialog`。
- destructive 或离开确认使用 `ConfirmDialog`。
- 不使用浏览器原生 `alert` / `confirm` 作为应用内反馈。

相关共享实现：

```text
frontend/src/components/NoticeBanner.tsx
frontend/src/components/AlertDialog.tsx
frontend/src/components/ConfirmDialog.tsx
frontend/src/components/SelectField.tsx
frontend/src/utils/errors.ts
frontend/src/utils/labels.ts
```
