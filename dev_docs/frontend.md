# 前端实现说明

本文档记录当前前端的稳定页面结构、交互契约和状态管理。视觉规范以 [design-system.md](./design-system.md) 为准，临时样式调整不写入本文档。

## 技术栈

- React 19
- TypeScript
- Vite
- TanStack Query
- React Router
- React Flow
- Vditor
- lucide-react

## 页面

### GraphPage

路由：

```text
/
/projects/default/graph
```

职责：

- 加载默认项目和图谱数据。
- 使用 React Flow 展示论文节点和关系边。
- 在图谱概览面板中按 title、authors、venue、tags、status 本地搜索节点。
- 点击搜索结果后定位并展开目标节点。
- 新建论文节点。
- 拖拽节点并保存位置。
- 单击节点展开/收起 metadata。
- 点击画布空白区域收起当前节点。
- 在图谱页快速编辑节点 metadata 和基础显示配置。
- 在节点编辑弹窗中编辑指向当前节点的入边关系，使用“已有关系 + 一行添加器”的方式添加边。
- 通过关系设置弹窗维护项目级关系标签，包括 emoji、名称、颜色、线型和排序。
- 删除节点并显示自定义确认弹窗。
- 双击节点进入论文编辑页。
- 导出整个项目 Markdown。
- 节点编辑弹窗支持 `Ctrl/Cmd + S` 保存。

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

### PaperEditorPage

路由：

```text
/papers/:paperId/edit
```

职责：

- 加载论文详情。
- 编辑 title。
- 编辑 metadata。
- 使用 Vditor WYSIWYG 编辑 Markdown。
- 根据 Markdown H1/H2/H3 生成可折叠左侧目录，点击目录项定位到对应标题。
- 手动保存，并支持 `Ctrl/Cmd + S`。
- 返回图谱。
- 导出单篇 Markdown。
- 保存成功显示自动消失通知；保存失败显示错误确认弹窗。
- 有未保存内容时返回图谱会显示统一风格确认弹窗。

## 节点交互契约

### 创建节点

入口：

- 顶部“新建节点”按钮。

字段：

```text
title 必填
year 可选
venue 可选
tags 可选
```

### 展示和展开

PaperNode 有两种状态：

```text
压缩状态
  - status
  - title

展开状态
  - 操作菜单
  - status
  - title
  - authors/year/venue/tags（如存在）
```

实现要点：

- React Flow 自带 `selected` 不用于控制展开。
- `GraphPage` 维护 `expandedNodeId`，并通过 `node.data.expanded` 传给 `PaperNode`。
- 单击节点切换展开/收起。
- 点击画布空白区域清空 `expandedNodeId`。
- 拖动节点不会触发展开。
- 双击节点进入独立论文编辑页。
- 节点宽度按 title/status 内容自适应，并设置最小/最大宽度。

### 快速编辑

展开节点后显示操作菜单：

- 编辑：打开 `EditNodeDialog`。
- 删除：打开 `DeleteNodeDialog`。

`EditNodeDialog` 支持：

```text
title
authors
year
venue
status
tags
nodeColor
nodeShape
incoming relations
```

`nodeColor` 和 `nodeShape` 存在 `paper.metadata` 中，不单独建表。

## 关系编辑

关系编辑采用“节点 metadata 式”的前端交互，但不写入 `paper.metadata`。

### 入边编辑

在 `EditNodeDialog` 中，用户编辑“指向本文的关系”：

```ts
type IncomingRelationGroup = {
  label_id: string;
  source_paper_ids: string[];
};
```

语义：

```text
source_paper_ids 中的每篇 paper 都通过 label_id 指向当前编辑的 paper。
```

保存节点时：

1. 先调用 `PUT /api/papers/{paper_id}` 保存 title 和 metadata。
2. 再调用 `PUT /api/papers/{paper_id}/incoming-relations` 替换当前 paper 的入边关系。
3. 保存成功后刷新 paper、incoming-relations 和 graph query。

### 关系标签设置

入口：

- GraphPage 顶部“关系设置”按钮。

`RelationLabelsDialog` 支持：

```text
emoji
name
color
line_style
sort_order
```

图谱边展示使用后端返回的 `relation_labels` 映射边的 emoji、label、颜色和线型。

## Markdown 编辑器

当前使用 Vditor。

稳定约定：

- 论文详情页直接显示 Vditor WYSIWYG。
- 不提供默认 split preview/edit 布局。
- 不使用 CodeMirror 作为主编辑器。
- 不使用 ReactMarkdown 作为主渲染链路。
- Vditor 使用动态 import。
- Vditor runtime 从 `/vditor` 加载。
- Vditor 初始化失败时降级为 textarea。
- `MarkdownEditor` 暴露 `getMarkdown()` ref handle，保存时可直接读取 Vditor 最新内容。

相关文件：

```text
frontend/src/features/papers/MarkdownEditor.tsx
frontend/vite.config.ts
frontend/src/main.tsx
frontend/src/styles.css
```

## Metadata 与 Markdown

前端保存 paper 时发送：

```ts
type UpdatePaperRequest = {
  title: string;
  metadata: PaperMetadata;
  markdown_content: string;
  version: number;
};
```

用户不需要手写 frontmatter。导出时由后端生成 frontmatter。

## 状态管理

### 服务端状态

使用 TanStack Query。

主要 query/mutation：

- `getDefaultProject`
- `getProjectGraph`
- `createPaper`
- `getPaper`
- `updatePaper`
- `deletePaper`
- `getIncomingRelations`
- `updateIncomingRelations`
- `createRelationLabel`
- `updateRelationLabel`
- `deleteRelationLabel`
- `updateCanvasNodePosition`
- `exportProjectMarkdown`

### 本地状态

当前不使用 Zustand。

`GraphPage` 本地状态：

- React Flow `nodes`
- `expandedNodeId`
- 搜索关键词
- 拖动状态
- 创建弹窗状态
- 节点编辑弹窗状态
- 关系设置弹窗状态
- 删除确认弹窗状态
- 自动消失的普通通知
- 错误确认弹窗

`PaperEditorPage` 本地状态：

- title
- metadata
- markdown
- Markdown editor ref
- outline collapsed state
- version
- dirty
- 自动消失的普通通知
- 错误确认弹窗
- 离开未保存内容确认弹窗

### 用户反馈

稳定约定：

- 成功、导出完成等普通提示使用 `NoticeBanner`，默认自动消失。
- API 失败、保存失败、删除失败等错误使用 `AlertDialog`，由用户确认关闭。
- 需要用户明确选择的流程使用 `ConfirmDialog`。
- 不使用浏览器原生 `alert` / `confirm` 承载应用内反馈。

相关文件：

```text
frontend/src/components/NoticeBanner.tsx
frontend/src/components/AlertDialog.tsx
frontend/src/components/ConfirmDialog.tsx
frontend/src/utils/errors.ts
```

## 保存策略

### 拖拽节点

- 拖拽过程中只更新前端状态。
- `onNodeDragStop` 后调用位置保存 API。
- 拖动不会触发节点展开。

### 编辑论文

- 当前是手动保存，支持 `Ctrl/Cmd + S`。
- 点击保存后调用 `PUT /api/papers/:paperId`。
- 保存前主动读取 Vditor 当前 Markdown，避免保存旧状态。
- 保存成功后更新 version，并清除 dirty 状态。
- 离开编辑页时如存在未保存内容，会提示确认。

### 编辑节点关系

- 当前是手动保存，节点编辑弹窗支持 `Ctrl/Cmd + S`。
- 节点 title/metadata 和 incoming relations 在同一次节点编辑保存流程中提交。
- 当前没有事务型前端回滚；如果关系保存失败，会显示错误并依赖用户重试。

后续可扩展：

- 自动保存。
- 撤销/重做。

## 路由

```text
/                         -> GraphPage
/projects/default/graph   -> GraphPage
/papers/:paperId/edit     -> PaperEditorPage
```

## 当前主要文件

```text
frontend/src/main.tsx
frontend/src/pages/GraphPage.tsx
frontend/src/pages/PaperEditorPage.tsx
frontend/src/features/graph/CreateNodeDialog.tsx
frontend/src/features/graph/EditNodeDialog.tsx
frontend/src/features/graph/DeleteNodeDialog.tsx
frontend/src/features/graph/PaperNode.tsx
frontend/src/features/graph/RelationLabelsDialog.tsx
frontend/src/features/papers/PaperMetadataForm.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/src/components/NoticeBanner.tsx
frontend/src/components/AlertDialog.tsx
frontend/src/components/ConfirmDialog.tsx
frontend/src/components/SelectField.tsx
frontend/src/api/
frontend/src/types/
frontend/src/styles.css
frontend/vite.config.ts
```
