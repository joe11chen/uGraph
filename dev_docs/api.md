# API 设计

## 通用约定

Base URL:

```text
/api
```

响应格式：

```json
{
  "data": {}
}
```

错误格式：

```json
{
  "error": {
    "code": "PAPER_NOT_FOUND",
    "message": "Paper not found",
    "details": {}
  }
}
```

## 默认项目

### 获取默认项目

```text
GET /api/projects/default
```

如果默认项目不存在，后端会自动创建。

响应：

```json
{
  "data": {
    "id": "project-id",
    "name": "Default Project",
    "description": "",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

## 图谱页面数据

### 获取默认画布完整数据

```text
GET /api/projects/{project_id}/graph
```

响应：

```json
{
  "data": {
    "project": {},
    "canvas": {
      "id": "canvas-id",
      "viewport_x": 0,
      "viewport_y": 0,
      "zoom": 1
    },
    "nodes": [
      {
        "id": "canvas-node-id",
        "paper_id": "paper-id",
        "position": { "x": 120, "y": 80 },
        "paper": {
          "id": "paper-id",
          "title": "Attention Is All You Need",
          "metadata": {
            "year": 2017,
            "venue": "NeurIPS",
            "tags": ["Transformer"]
          }
        }
      }
    ],
    "edges": [
      {
        "id": "relation-id",
        "project_id": "project-id",
        "source_paper_id": "source-paper-id",
        "target_paper_id": "target-paper-id",
        "label_id": "label-id",
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "relation_labels": [
      {
        "id": "label-id",
        "project_id": "project-id",
        "name": "Cites",
        "emoji": "📎",
        "color": "#8b5e3c",
        "line_style": "solid",
        "sort_order": 10,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
}
```

## 论文节点

### 创建论文节点

```text
POST /api/projects/{project_id}/papers
```

请求：

```json
{
  "title": "Attention Is All You Need",
  "metadata": {
    "year": 2017,
    "venue": "NeurIPS",
    "tags": ["Transformer"]
  },
  "position": {
    "x": 100,
    "y": 100
  }
}
```

规则：

- `title` 必填。
- `metadata` 可选。
- `position` 可选，未传时后端或前端给默认位置。
- 创建 paper 后，同时创建默认 canvas node。

### 获取论文详情

```text
GET /api/papers/{paper_id}
```

响应：

```json
{
  "data": {
    "id": "paper-id",
    "project_id": "project-id",
    "title": "Attention Is All You Need",
    "metadata": {},
    "markdown_content": "",
    "version": 1,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 更新论文详情

```text
PUT /api/papers/{paper_id}
```

请求：

```json
{
  "title": "Attention Is All You Need",
  "metadata": {
    "authors": ["Ashish Vaswani"],
    "year": 2017,
    "venue": "NeurIPS",
    "tags": ["Transformer"],
    "status": "Read"
  },
  "markdown_content": "# Notes\n...",
  "version": 1
}
```

规则：

- `title` 不能为空。
- 如果 `version` 与数据库不一致，返回 `VERSION_CONFLICT`。
- 成功保存后 `version + 1`。

### 删除论文

```text
DELETE /api/papers/{paper_id}
```

删除时同步清理对应 `canvas_nodes` 和相关 `relations`。

## 关系标签

关系标签是项目级配置，用于定义边的名称和显示样式。

### 获取关系标签

```text
GET /api/projects/{project_id}/relation-labels
```

首次读取时会为项目创建默认标签。

### 创建关系标签

```text
POST /api/projects/{project_id}/relation-labels
```

请求：

```json
{
  "name": "Cites",
  "emoji": "📎",
  "color": "#8b5e3c",
  "line_style": "solid",
  "sort_order": 10
}
```

规则：

- `name` 必填。
- `emoji` 可配置，用于图上边 label 和关系编辑界面。
- 同一 project 下 `name` 唯一。
- `line_style` 支持 `solid`、`dashed`、`dotted`。

### 更新关系标签

```text
PUT /api/relation-labels/{label_id}
```

请求同创建关系标签。

### 删除关系标签

```text
DELETE /api/relation-labels/{label_id}
```

删除标签时同步清理使用该标签的关系边。

## 节点入边关系

前端在节点编辑弹窗里维护“指向当前节点的关系”。界面只展示已存在关系和一行空白添加器，不预铺所有 label。后端会将这些分组替换为 `relations` 表中的有向边。

### 获取节点入边关系

```text
GET /api/papers/{paper_id}/incoming-relations
```

响应：

```json
{
  "data": {
    "target_paper_id": "paper-id",
    "groups": [
      {
        "label_id": "label-id",
        "source_paper_ids": ["source-paper-a", "source-paper-b"]
      }
    ]
  }
}
```

### 替换节点入边关系

```text
PUT /api/papers/{paper_id}/incoming-relations
```

请求：

```json
{
  "groups": [
    {
      "label_id": "label-id",
      "source_paper_ids": ["source-paper-a", "source-paper-b"]
    }
  ]
}
```

规则：

- 该接口是 replace 语义，会先删除当前 paper 的所有入边，再写入请求中的分组。
- 不允许 self-loop。
- label 和 source paper 必须属于 target paper 所在 project。
- 同一组内重复 source 会被去重。

## 画布

### 更新节点位置

```text
PATCH /api/canvas-nodes/{canvas_node_id}
```

请求：

```json
{
  "x": 220,
  "y": 180
}
```

### 批量更新节点位置

```text
PATCH /api/canvases/{canvas_id}/nodes/layout
```

请求：

```json
{
  "nodes": [
    { "canvas_node_id": "node-1", "x": 100, "y": 100 },
    { "canvas_node_id": "node-2", "x": 300, "y": 180 }
  ]
}
```

### 保存视口

```text
PATCH /api/canvases/{canvas_id}/viewport
```

请求：

```json
{
  "viewport_x": 0,
  "viewport_y": 0,
  "zoom": 1
}
```

当前前端主要使用单节点位置保存接口；批量布局和视口保存接口已在后端提供，作为后续增强预留。

## Markdown 导出

### 导出单篇 Markdown

```text
GET /api/papers/{paper_id}/export/markdown
```

响应可以是文件下载：

```text
Content-Type: text/markdown
Content-Disposition: attachment; filename="attention-is-all-you-need.md"
```

### 导出全项目 Markdown

```text
POST /api/projects/{project_id}/export/markdown
```

响应：

```json
{
  "data": {
    "export_path": "exports/default-project-20260711-150000"
  }
}
```

导出目录：

```text
exports/
  default-project-20260711-150000/
    graph.md
    papers/
      paper-id-1.md
      paper-id-2.md
```

## 当前已实现路由清单

```text
GET    /health
GET    /api/projects/default
GET    /api/projects/{project_id}/graph
POST   /api/projects/{project_id}/papers
GET    /api/papers/{paper_id}
PUT    /api/papers/{paper_id}
DELETE /api/papers/{paper_id}
GET    /api/projects/{project_id}/relation-labels
POST   /api/projects/{project_id}/relation-labels
PUT    /api/relation-labels/{label_id}
DELETE /api/relation-labels/{label_id}
GET    /api/papers/{paper_id}/incoming-relations
PUT    /api/papers/{paper_id}/incoming-relations
PATCH  /api/canvas-nodes/{canvas_node_id}
PATCH  /api/canvases/{canvas_id}/nodes/layout
PATCH  /api/canvases/{canvas_id}/viewport
GET    /api/papers/{paper_id}/export/markdown
POST   /api/projects/{project_id}/export/markdown
```
