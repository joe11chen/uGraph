# API 设计

## 通用约定

Base URL：

```text
/api
```

`GET /health` 不使用 `/api` prefix。

大多数 JSON 成功响应使用：

```json
{
  "data": {}
}
```

例外：

- `GET /health` 返回 `{"status":"ok"}`。
- 单篇 Markdown export 返回原始 `text/markdown`。
- 204 endpoint 没有响应体。

## 状态码总览

| Endpoint 类型 | 当前成功状态 | 响应 |
| --- | ---: | --- |
| GET JSON | 200 | `{"data": ...}`，health 除外 |
| POST create/export | 200 | `{"data": ...}`；当前未显式配置 201 |
| PUT update/replace | 200 | `{"data": ...}` |
| DELETE paper/relation label | 204 | 无 body |
| PATCH canvas node/layout/viewport | 204 | 无 body |
| GET paper Markdown | 200 | `text/markdown` attachment |

## 错误格式

业务代码显式抛出的 `AppError` 使用：

```json
{
  "error": {
    "code": "PAPER_NOT_FOUND",
    "message": "Paper not found",
    "details": {}
  }
}
```

这不是所有错误的统一格式：

- FastAPI/Pydantic 请求校验错误使用标准 422 `{"detail": [...]}`。
- 未捕获的数据库、文件系统或程序异常不保证转换为业务 error envelope。

`Paper.version` 冲突返回 409：

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Paper has been updated elsewhere",
    "details": {
      "current_version": 2
    }
  }
}
```

## 健康检查

```text
GET /health
```

响应：

```json
{"status":"ok"}
```

## 默认项目

### 获取默认项目

```text
GET /api/projects/default
```

如果数据库中没有 project，该 GET 会创建：

- `Default Project`。
- 该 project 的 `Main` canvas。

因此该读取 endpoint 可能产生数据库写入。

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

### 获取 project graph

```text
GET /api/projects/{project_id}/graph
```

该 endpoint 组合返回 project、默认 canvas、canvas nodes/paper summaries、relations 和 relation labels。如果 project 尚无 canvas 或 relation labels，读取过程会惰性创建它们。

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
        "position": {"x": 120, "y": 80},
        "paper": {
          "id": "paper-id",
          "title": "Attention Is All You Need",
          "metadata": {
            "status": "Read",
            "tags": ["Vaswani", "NeurIPS", "Transformer"],
            "tldr": "Transformer 用自注意力替代循环结构。"
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
    "relation_labels": []
  }
}
```

注意：node `id` 是 CanvasNode ID，relation source/target 是 Paper ID。

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
    "status": "Unread",
    "tags": ["Vaswani", "Transformer"],
    "tldr": ""
  },
  "position": {
    "x": 100,
    "y": 100
  }
}
```

行为：

- `title` trim 后不能为空。
- `metadata` 和 `position` 可选。
- 后端未收到 position 时使用 `x=0, y=0`；当前创建弹窗通常显式发送默认位置。
- 在默认 canvas 中同时创建一个 CanvasNode。
- 成功返回 200 和完整 Paper 数据。

### 获取论文详情

```text
GET /api/papers/{paper_id}
```

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
    "status": "Read",
    "tags": ["Vaswani", "Transformer"],
    "tldr": "提出纯 attention 的序列建模架构。"
  },
  "markdown_content": "# Notes\n...",
  "version": 1
}
```

行为：

- `title` trim 后不能为空。
- `version` 必须与数据库当前值完全一致，否则返回 `VERSION_CONFLICT` 409。
- 成功后 `version += 1`，提交并返回更新后的 Paper。

### 删除论文

```text
DELETE /api/papers/{paper_id}
```

成功返回 204。数据库外键/ORM cascade 会清理相关 CanvasNode 和 incoming/outgoing relations。

## 关系标签

关系标签是 project 级配置。首次读取一个没有任何标签的 project 时，会创建：

| name | emoji | color | line_style | sort_order |
| --- | --- | --- | --- | ---: |
| 引用 | 📎 | `#8b5e3c` | solid | 10 |
| 延伸 | 🧱 | `#b8653f` | solid | 20 |
| 使用方法 | 🛠️ | `#66763f` | dashed | 30 |
| 对比 | ⚖️ | `#3f3a33` | dotted | 40 |

### 获取关系标签

```text
GET /api/projects/{project_id}/relation-labels
```

该 GET 可能创建上述默认标签并提交。

### 创建关系标签

```text
POST /api/projects/{project_id}/relation-labels
```

```json
{
  "name": "引用",
  "emoji": "📎",
  "color": "#8b5e3c",
  "line_style": "solid",
  "sort_order": 10
}
```

规则：

- name trim 后不能为空，同一 project 内唯一。
- emoji trim 后最多保留 16 个字符；空值归一化为 `🔗`。
- `solid`、`dashed`、`dotted` 是受支持的 line style。
- 其他 line style 当前不会报错，而会静默归一化为 `solid`。
- 成功返回 200，不是 201。

### 更新关系标签

```text
PUT /api/relation-labels/{label_id}
```

请求和归一化规则与创建相同，成功返回 200。

### 删除关系标签

```text
DELETE /api/relation-labels/{label_id}
```

成功返回 204；使用该 label 的 relations 会级联删除。

## 节点入边关系

前端维护“指向当前 paper 的关系”。

```ts
type IncomingRelationGroup = {
  label_id: string;
  source_paper_ids: string[];
};
```

### 获取节点入边

```text
GET /api/papers/{paper_id}/incoming-relations
```

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

### 全量替换节点入边

```text
PUT /api/papers/{paper_id}/incoming-relations
```

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

- 先验证所有 label/source，再删除 target paper 的现有全部入边并插入请求内容。
- 不允许 self-loop。
- label、source 和 target 必须属于同一 project。
- 重复 `(label_id, source_paper_id)` 会去重。
- 单个后端调用内部提交；但它不与前端在此之前执行的 paper PUT 构成跨请求事务。

## 画布

### 更新单节点位置

```text
PATCH /api/canvas-nodes/{canvas_node_id}
```

```json
{"x": 220, "y": 180}
```

成功返回 204。当前前端使用该 endpoint。

### 批量更新节点位置

```text
PATCH /api/canvases/{canvas_id}/nodes/layout
```

```json
{
  "nodes": [
    {"canvas_node_id": "node-1", "x": 100, "y": 100},
    {"canvas_node_id": "node-2", "x": 300, "y": 180}
  ]
}
```

成功返回 204。payload 中不存在或不属于该 canvas 的 node ID 会被忽略，不会使整个请求失败。当前前端未调用该 endpoint。

### 保存视口

```text
PATCH /api/canvases/{canvas_id}/viewport
```

```json
{"viewport_x": 0, "viewport_y": 0, "zoom": 1}
```

成功返回 204。当前前端未调用，也未恢复 graph response 中的 viewport。

## Markdown 导出

### 导出单篇 Markdown

```text
GET /api/papers/{paper_id}/export/markdown
```

响应：

```text
Content-Type: text/markdown; charset=utf-8
Content-Disposition: attachment; filename="<paper-slug>.md"
```

### 导出项目 Markdown 快照

```text
POST /api/projects/{project_id}/export/markdown
```

```json
{
  "data": {
    "export_path": "exports/default-project-20260711-150000"
  }
}
```

后端写入：

```text
workspace/
  exports/
    default-project-YYYYMMDD-HHMMSS/
      graph.md
      papers/
        <paper-id>-<slug>.md
```

语义：

- `export_path` 是相对服务器 `workspace/` 的路径。
- endpoint 不返回 ZIP，也不会把目录下载到浏览器。
- `graph.md` 只列 paper Markdown links。
- relations、relation labels、canvas nodes/layout 和 viewport 不会导出。
- 这是有损阅读快照，不是可恢复备份或后续 T13 的版本化 JSON 格式。

## 当前路由清单

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
