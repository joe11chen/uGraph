# 开发任务状态

本文档只记录对后续开发有用的稳定状态和计划。样式微调、临时纠错过程、已废弃实现细节不在这里记录。

## 当前结论

最小可用闭环已完成：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

当前代码已经支持：

- 前端：React + TypeScript + Vite + React Flow + Vditor。
- 后端：FastAPI + SQLAlchemy + SQLite。
- 默认项目和默认画布自动创建。
- 论文节点 CRUD、位置保存、metadata 编辑、Markdown 编辑。
- 图谱页节点快速编辑、删除确认、基础节点显示配置。
- 关系标签全局配置，以及以“已有入边 + 空白添加器”的方式编辑节点关系。
- 图谱中展示有向关系边。
- 图谱页本地搜索节点，并可从结果定位和展开节点。
- 论文编辑页和节点编辑弹窗支持 `Ctrl/Cmd + S` 快捷保存。
- 普通操作提示自动消失；错误和需要用户确认的严重状态使用统一风格弹窗。
- 单篇和全项目 Markdown 导出。

## 已完成里程碑

### M01 项目骨架

状态：已完成。

范围：
- `frontend/`、`backend/`、`workspace/` 目录。
- Docker Compose 和本地开发启动方式。
- 前端 Vite、后端 FastAPI 基础可运行。

### M02 数据库与基础模型

状态：已完成。

范围：
- SQLite 数据库。
- Project、Paper、Canvas、CanvasNode 模型。
- 默认项目和默认画布初始化。
- Paper 使用 `metadata_json`、`markdown_content`、`version`。

### M03 后端基础 API

状态：已完成。

范围：
- 默认项目 API。
- 图谱读取 API。
- Paper 创建、读取、更新、删除。
- Canvas node 位置保存。
- 批量布局和视口保存预留接口。

### M04 图谱页面

状态：已完成。

范围：
- React Flow 图谱。
- 新建论文节点。
- 节点拖拽和位置保存。
- 单击展开/收起。
- 双击进入论文编辑页。

### M05 论文编辑页面

状态：已完成。

范围：
- 独立论文编辑页。
- title、metadata、Markdown 编辑。
- Vditor WYSIWYG Markdown 编辑器。
- 手动保存、dirty 提示、version 乐观锁。

### M06 Markdown 导出

状态：已完成。

范围：
- 单篇 Markdown 导出。
- 全项目 Markdown 目录导出。
- frontmatter 来自 paper id、title、metadata。

### M07 图谱节点操作

状态：已完成。

范围：
- 节点悬浮操作菜单。
- 图谱页快速编辑 title、metadata、nodeColor、nodeShape。
- 项目风格一致的删除确认弹窗。
- 点击画布空白区域收起当前节点。
- 节点展示宽度按内容自适应。

### T09 关系边编辑

状态：已完成。

设计结论：
- 前端不直接在图化界面拖拽建边。
- 用户在当前节点编辑弹窗里维护“指向本文的关系”。
- 表达方式为 `{ label_id, source_paper_ids[] }`：这些 source paper 通过该 label 指向当前 paper。
- 后端不把关系塞进 `metadata_json`，而是使用传统图关系表维护。

范围：
- 新增 `relation_labels`：项目级关系标签配置，包含 emoji、名称、颜色、线型、排序。
- 新增 `relations`：有向边，包含 source paper、target paper、label。
- `GET /api/projects/{project_id}/graph` 返回 `edges` 和 `relation_labels`。
- 图谱页使用 React Flow 展示有向关系边。
- 节点编辑弹窗支持通过一行空白添加器选择 label 和来源节点，添加或移除入边。
- 图谱页提供关系标签全局设置弹窗。
- 删除 paper 或 relation label 时清理关联关系。

### M08 前端反馈机制

状态：已完成。

稳定约定：
- 普通成功提示使用自动消失的通知条，不阻塞用户操作。
- 错误、失败和需要明确确认的状态使用统一弹窗，不使用浏览器原生 `alert` / `confirm`。
- 图谱页和论文编辑页共享通知、错误弹窗和确认弹窗组件。

### T10 搜索和定位节点

状态：已完成。

目标：
- 支持按 title、authors、venue、tags、status 查找节点。
- 点击搜索结果后定位并展开目标节点。

范围：
- 在图谱概览面板内提供本地节点搜索。
- 搜索当前 graph 数据中的 title、authors、venue、tags、status。
- 点击搜索结果后展开目标节点，并通过 React Flow 移动画布视图到节点附近。
- 当前不新增后端搜索 API；数据量变大后再考虑。

### T11 保存体验增强

状态：已完成。

目标：
- 支持 `Ctrl/Cmd + S` 快捷键保存。
- 再评估是否需要 debounce 自动保存。

范围：
- 论文编辑页支持 `Ctrl/Cmd + S` 保存。
- 节点编辑弹窗支持 `Ctrl/Cmd + S` 保存。
- 论文编辑页保存时主动从 Vditor 实例读取最新 Markdown，避免编辑器状态未及时同步导致保存空内容或旧内容。
- 保留 dirty 状态和 version 冲突处理。
- 暂不启用 debounce 自动保存，避免引入额外冲突处理复杂度。

## 后续任务

### T12 回归测试

状态：待开发。

目标：
- 补基础 Playwright 回归测试，降低后续 UI 改动风险。

建议覆盖：
- 图谱加载。
- 新建节点。
- 节点展开/收起。
- 节点快速编辑。
- 关系标签配置。
- 节点入边编辑。
- 删除确认弹窗。
- 论文编辑页保存。
- Markdown 导出入口。

### T13 项目级备份

状态：待开发。

目标：
- 实现 JSON 导入导出。
- 支持本地项目迁移和备份。

建议范围：
- 导出 projects、papers、canvas nodes、relation labels、relations。
- 导入时处理 id 冲突和关系完整性。

## 暂缓任务

以下任务不进入近期计划，除非需求优先级变化：

- PDF 上传。
- 多项目管理界面。
- 撤销/重做。
- Markdown 导入。
- 多画布。
- GraphRAG。
