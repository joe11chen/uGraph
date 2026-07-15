# 数据模型

## 设计目标

当前模型支持：

- 默认 project 和 canvas。
- Paper 内容、可扩展 metadata、Markdown 和乐观锁。
- 独立 CanvasNode 布局。
- Project 级 relation labels 和有向 relations。
- Markdown 导出。

SQLite 是主数据源。关系在前端表现为 target paper 的 incoming groups，但后端使用独立图关系表，而不是写入 `metadata_json`。

## ER 概览

```text
Project 1 -- N Paper
Project 1 -- N Canvas
Canvas  1 -- N CanvasNode
Paper   1 -- N CanvasNode

Project       1 -- N RelationLabel
Project       1 -- N Relation
RelationLabel 1 -- N Relation
Paper(source) 1 -- N Relation
Paper(target) 1 -- N Relation
```

当前 UI 只使用一个默认 project 和每个 project 最早创建的默认 canvas。

## projects

```text
id            string uuid primary key
name          string not null
description   text nullable
created_at    datetime not null
updated_at    datetime not null
```

空库首次请求默认 project 时会创建 `Default Project` 和 `Main` canvas。

## papers

```text
id                string uuid primary key
project_id        string uuid not null references projects(id) on delete cascade
title             string not null
metadata_json     text not null default '{}'
markdown_content  text not null default ''
created_at        datetime not null
updated_at        datetime not null
version           integer not null default 1
```

`metadata_json` 是 JSON-as-text，当前不做固定 schema 强约束。常用结构：

```json
{
  "tags": [],
  "status": "Unread",
  "tldr": "",
  "nodeColor": "clay",
  "nodeShape": "rounded"
}
```

字段说明：

- `title`：trim 后唯一必填的展示名称；当前没有 project 内唯一约束。
- `tags`：统一承载作者、会议/期刊、主题和自定义短标签。
- `status`：阅读状态。
- `tldr`：节点展开时显示的短摘要。
- `nodeColor`：当前 UI 支持 `clay`、`ochre`、`olive`、`cinnabar`、`graphite`。
- `nodeShape`：当前 UI 支持 `rounded`、`note`、`capsule`。
- `markdown_content`：Markdown 正文。
- `version`：更新时的乐观锁版本；成功保存后加 1。

`load_metadata()` 对无效 JSON 或非 object JSON 返回 `{}`，而不是使读取失败。

## canvases

```text
id            string uuid primary key
project_id    string uuid not null references projects(id) on delete cascade
name          string not null
viewport_x    float not null default 0
viewport_y    float not null default 0
zoom          float not null default 1
created_at    datetime not null
updated_at    datetime not null
```

每个 project 当前使用最早创建的 canvas；不存在时由读取流程惰性创建 `Main`。

后端可保存 viewport，但当前前端不恢复或更新这些字段。

## canvas_nodes

```text
id            string uuid primary key
canvas_id     string uuid not null references canvases(id) on delete cascade
paper_id      string uuid not null references papers(id) on delete cascade
x             float not null
y             float not null
width         float nullable
height        float nullable
created_at    datetime not null
updated_at    datetime not null
```

约束：

```text
unique(canvas_id, paper_id)
```

CanvasNode 把视图布局与 Paper 内容分离。React Flow node ID 使用 `canvas_nodes.id`，关系端点使用 `papers.id`。

创建 Paper 时，service 会在默认 canvas 中同时创建 CanvasNode，并在同一 service 调用中提交。

## relation_labels

```text
id            string uuid primary key
project_id    string uuid not null references projects(id) on delete cascade
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

受支持 line style：

```text
solid
dashed
dotted
```

service 对其他值静默归一化为 `solid`。一个 project 没有任何标签时，读取 relation labels 会创建“引用、延伸、使用方法、对比”四个默认值。

## relations

```text
id               string uuid primary key
project_id       string uuid not null references projects(id) on delete cascade
source_paper_id  string uuid not null references papers(id) on delete cascade
target_paper_id  string uuid not null references papers(id) on delete cascade
label_id         string uuid not null references relation_labels(id) on delete cascade
created_at       datetime not null
updated_at       datetime not null
```

约束：

```text
unique(source_paper_id, target_paper_id, label_id)
```

业务规则：

- 不允许 self-loop。
- source、target 和 label 必须属于同一 project。
- 删除 paper 时清理 incoming/outgoing relations。
- 删除 relation label 时清理使用它的 relations。
- Incoming relation API 对一个 target paper 执行全量替换，并去重 `(label_id, source_paper_id)`。

## 事务边界

当前没有 request-wide unit of work。各 service 自行 `commit()`：

- Paper create/update/delete。
- Canvas position/layout/viewport update。
- Relation-label create/update/delete/default initialization。
- Incoming relation replacement。

图谱节点编辑在前端先更新 Paper、再替换 incoming relations。这是两个事务；第二个失败时第一个不会回滚。

## Schema 初始化与迁移

应用导入时执行：

```text
ensure_workspace()
Base.metadata.create_all(bind=engine)
ensure_database_schema()
```

当前 schema 演进能力只有：

- `create_all()` 创建缺失表。
- 旧 SQLite 库缺少 `relation_labels.emoji` 时执行一条手写 `ALTER TABLE`。

当前没有 Alembic、migration command、schema version table、downgrade 或通用兼容策略。后续 model 变更需要先建立迁移和数据备份方案，不能把 `create_all()` 当作完整迁移机制。

## Markdown 导出映射

单篇和项目内 paper 文件都通过 `backend/app/exporters/markdown_exporter.py` 生成。

Frontmatter 包含：

```text
papers.id
papers.title
过滤后的 papers.metadata_json
```

metadata 会移除：

```text
authors
year
venue
nodeColor
nodeShape
```

值为 `null`、空字符串、空数组或空 object 的字段也不会写入。

正文规则：

- `markdown_content.strip()` 后以 `#` 开头时直接写入。
- 否则在正文前自动补 `# {title}`。
- 导出不会反向写回数据库。

示例：

```markdown
---
id: paper-uuid
title: Attention Is All You Need
tags:
  - Vaswani
  - Transformer
status: Read
tldr: 提出纯 attention 的序列建模架构。
---

# Attention Is All You Need

Markdown 正文内容。
```

项目 export 的 `graph.md` 当前只包含 paper links。它不序列化：

- relations。
- relation labels。
- CanvasNode positions/sizes。
- canvas viewport。

因此 Markdown export 不是 round-trip 或恢复格式。

## 存储位置与工作目录

逻辑结构：

```text
workspace/
  database/
    research_graph.db
  exports/
    <project-slug>-YYYYMMDD-HHMMSS/
      graph.md
      papers/
        <paper-id>-<slug>.md
```

`backend/app/core/config.py` 的默认值是 CWD-relative：

```text
WORKSPACE_PATH=./workspace
DATABASE_URL=sqlite:///./workspace/database/research_graph.db
```

- Docker Compose 显式使用 `/app/workspace` 并映射仓库根 `workspace/`。
- 从 `backend/` 未带环境变量启动会使用 `backend/workspace/`。
- 本地开发应显式设置 `WORKSPACE_PATH=../workspace` 和 `DATABASE_URL=sqlite:///../workspace/database/research_graph.db`。

## 备份与恢复边界

当前没有受支持的应用级备份/恢复流程或版本化数据格式。Markdown 项目快照是有损的，不能恢复图关系和布局。

直接复制 SQLite 文件只能视为人工操作，不应在数据库正在写入时承诺得到一致备份。后续 T13 需要定义版本化 JSON、引用完整性校验、ID 冲突策略、原子导入和兼容政策。

## 后续扩展表

PDF/attachment 尚未实现；未来可能增加：

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
