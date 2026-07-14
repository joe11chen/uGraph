# 数据模型

## 设计目标

当前版本已支持：

- 默认项目。
- 论文节点。
- 节点 metadata。
- Markdown 内容。
- 图谱位置。
- 有向关系边。
- Markdown 导出。

关系编辑在前端表现为节点 metadata 式的入边分组，但后端使用独立关系表维护图结构。

## ER 概览

```text
Project 1 -- N Paper
Project 1 -- N Canvas
Canvas  1 -- N CanvasNode
Paper   1 -- N CanvasNode   当前默认一个 paper 在默认 canvas 中最多一个节点

Project       1 -- N RelationLabel
Project       1 -- N Relation
RelationLabel 1 -- N Relation
Paper(source) 1 -- N Relation
Paper(target) 1 -- N Relation
```

## projects

项目表。首版可以只使用默认项目。

```text
id            string uuid primary key
name          string not null
description   text nullable
created_at    datetime not null
updated_at    datetime not null
```

## papers

论文节点内容表。数据库是主数据源。

```text
id                string uuid primary key
project_id        string uuid not null references projects(id)
title             string not null
metadata_json     json/text not null default '{}'
markdown_content  text not null default ''
created_at        datetime not null
updated_at        datetime not null
version           integer not null default 1
```

### metadata_json 建议结构

metadata 当前不做强约束，使用 JSON 字符串保存，方便扩展。

```json
{
  "authors": [],
  "year": null,
  "venue": "",
  "tags": [],
  "status": "Unread",
  "nodeColor": "clay",
  "nodeShape": "rounded"
}
```

字段说明：

- `title`：唯一必填的论文展示名称。
- `metadata_json`：用于图谱节点展示和 Markdown frontmatter 导出。
- `metadata_json.nodeColor`：图谱节点显示颜色，当前前端支持 `clay`、`ochre`、`olive`、`cinnabar`、`graphite`。
- `metadata_json.nodeShape`：图谱节点显示形状，当前前端支持 `rounded`、`note`、`capsule`。
- `markdown_content`：Markdown 正文内容。
- `version`：乐观锁版本号，用于避免并发覆盖。

## canvases

画布表。首版每个项目一个默认画布。

```text
id            string uuid primary key
project_id    string uuid not null references projects(id)
name          string not null
viewport_x    float not null default 0
viewport_y    float not null default 0
zoom          float not null default 1
created_at    datetime not null
updated_at    datetime not null
```

## canvas_nodes

画布节点布局表。与 `papers` 分离，避免把视图状态混入论文实体。

```text
id            string uuid primary key
canvas_id     string uuid not null references canvases(id)
paper_id      string uuid not null references papers(id)
x             float not null
y             float not null
width         float nullable
height        float nullable
created_at    datetime not null
updated_at    datetime not null
```

建议约束：

```text
unique(canvas_id, paper_id)
```

## relation_labels

项目级关系标签配置表。它定义边的语义名称和图上显示样式。

```text
id            string uuid primary key
project_id    string uuid not null references projects(id)
name          string not null
emoji         string not null default '🔗'
color         string not null default '#b8653f'
line_style    string not null default 'solid'
sort_order    integer not null default 0
created_at    datetime not null
updated_at    datetime not null
```

约束：

```text
unique(project_id, name)
```

字段说明：

- `emoji`：关系标签的短视觉标识，用于设置界面和图谱边 label。
- `line_style` 当前支持：

```text
solid
dashed
dotted
```

## relations

有向关系边表。`source_paper_id -> target_paper_id` 表示 source paper 通过某个 label 指向 target paper。

```text
id               string uuid primary key
project_id       string uuid not null references projects(id)
source_paper_id  string uuid not null references papers(id)
target_paper_id  string uuid not null references papers(id)
label_id         string uuid not null references relation_labels(id)
created_at       datetime not null
updated_at       datetime not null
```

约束：

```text
unique(source_paper_id, target_paper_id, label_id)
```

规则：

- 不允许 self-loop。
- source、target、label 必须属于同一个 project。
- 删除 paper 时清理相关 incoming/outgoing relations。
- 删除 relation label 时清理使用该 label 的 relations。

## 后续扩展表

暂未实现，但后续可加入：

```text
attachments
- id
- paper_id
- file_type
- relative_path
- original_filename
- sha256
- created_at
```

## Markdown 导出映射

导出 Markdown 时：

- frontmatter 来自 `papers.id`、`papers.title`、`papers.metadata_json`。
- 正文来自 `papers.markdown_content`。

示例：

```markdown
---
id: paper-uuid
title: Attention Is All You Need
authors:
  - Ashish Vaswani
year: 2017
venue: NeurIPS
tags:
  - Transformer
status: Read
---

# Attention Is All You Need

Markdown 正文内容。
```

## 当前实际存储位置

```text
workspace/
  database/
    research_graph.db
  exports/
    default-project-YYYYMMDD-HHMMSS/
      graph.md
      papers/
        paper-id-title.md
```

## 当前实现说明

- `projects` 和 `canvases` 在首次访问默认项目时自动创建。
- 创建 paper 时同步创建对应 `canvas_nodes`。
- 删除 paper 时通过级联删除对应 `canvas_nodes` 和相关 `relations`。
- `relation_labels` 在首次读取项目关系配置时写入默认标签；旧 SQLite 库启动时会补齐 `emoji` 字段。
- 节点编辑弹窗里的“指向本文的关系”最终写入 `relations` 表，不写入 `metadata_json`。
- `version` 用于编辑页保存时的乐观锁。
- Markdown 导出不会反向写回数据库。
