# 开发任务状态

本文档只记录对后续开发有用的稳定状态和计划。样式微调、临时纠错过程和已废弃实现细节不在这里记录。

## 当前结论

最小可用闭环已完成：

```text
图谱节点创建 -> 节点 metadata/关系编辑 -> 独立论文编辑 -> SQLite 存储 -> Markdown 导出
```

当前代码支持 React Flow 图谱、论文 CRUD、metadata 与 Markdown 编辑、关系标签与入边关系、客户端搜索、位置保存、乐观锁和 Markdown 导出。Markdown 项目导出是有损服务器端快照，不是项目备份格式。

## 已完成里程碑

### M01 项目骨架

状态：已完成。

范围：
- `frontend/`、`backend/`、`workspace/` 目录。
- 自有服务器 Docker Compose 部署方式和本地源码开发启动方式。
- 前端 Vite、后端 FastAPI 基础运行链路。

### M02 数据库与基础模型

状态：已完成。

范围：
- SQLite 数据库。
- Project、Paper、Canvas、CanvasNode 模型。
- 默认项目和默认画布惰性初始化。
- Paper 使用 `metadata_json`、`markdown_content`、`version`。

### M03 后端基础 API

状态：已完成。

范围：
- 默认项目和图谱读取 API。
- Paper 创建、读取、更新、删除。
- Canvas node 单节点位置保存。
- 批量布局和视口保存后端接口；当前前端未接线。

### M04 图谱页面

状态：已完成。

范围：
- React Flow 图谱。
- 新建论文节点。
- 节点拖拽和位置保存。
- 单击展开/收起，双击进入论文编辑页。

### M05 论文编辑页面

状态：已完成。

范围：
- title、metadata、Markdown 编辑。
- Vditor WYSIWYG 与本地 runtime assets。
- 手动保存、部分 dirty 离开提示、version 乐观锁。

### M06 Markdown 导出

状态：已完成。

范围：
- 单篇 Markdown 下载。
- 全项目服务器端 Markdown 目录快照。
- frontmatter 来自 paper id、title 和过滤后的 metadata。

限制：
- `graph.md` 当前只是论文链接索引。
- 不导出 relations、relation labels、canvas layout 或 viewport。
- 没有 ZIP 下载或恢复导入能力。

### M07 图谱节点操作

状态：已完成。

范围：
- 节点操作菜单和图谱页快速编辑。
- title、metadata、nodeColor、nodeShape。
- 自定义删除确认弹窗。
- 点击空白画布收起节点。

### M08 前端反馈机制

状态：已完成。

稳定约定：
- 普通成功提示使用自动消失的通知条。
- 错误和需要明确确认的流程使用共享弹窗。
- 不使用浏览器原生 `alert` / `confirm` 承载应用内反馈。

### T09 关系边编辑

状态：已完成。

设计结论：
- 前端不直接在图形界面拖拽建边。
- 用户在当前节点编辑弹窗里维护“指向本文的关系”。
- 后端使用独立 `relation_labels` 和 `relations` 表。
- Incoming relations 使用 `{ label_id, source_paper_ids[] }` 的全量替换语义。

### T10 搜索和定位节点

状态：已完成。

范围：
- 对当前 graph payload 进行本地子串搜索。
- 搜索 title、tags、status、TLDR，以及兼容性的 legacy authors/venue。
- 点击结果后展开目标节点并移动 React Flow 视口。
- 当前不提供后端搜索 API。

### T11 保存体验增强

状态：已完成。

范围：
- 论文编辑页和节点编辑弹窗支持 `Ctrl/Cmd + S`。
- 论文保存时从 Vditor 实例读取最新 Markdown。
- 保留 dirty 状态和 version 冲突处理。
- 暂不启用 debounce 自动保存。

限制：
- 图谱侧 paper 更新与 incoming relation replace 是两个独立请求，不具备跨请求原子性。
- 编辑页 dirty 保护只覆盖顶部返回按钮，不覆盖页脚 Link、刷新、关闭标签页和其他导航。

## 后续任务

### T12 自动化测试与 CI

状态：待开发。

目标：
- 建立可重复执行的后端、前端和端到端验证体系，并提供明确的单测试命令。

建议范围：
- 后端 service/API 测试：默认实体惰性创建、Pydantic validation、业务错误 envelope、version conflict、关系全量替换、级联删除和 Markdown 导出。
- 前端组件/交互测试：图谱加载、搜索、节点展开、编辑弹窗、dirty 状态和错误反馈。
- Playwright E2E：新建/编辑/删除节点、关系标签和入边、论文保存、导出入口。
- CI 中执行后端测试、前端 build/测试和 E2E 所需的稳定子集。
- 文档化完整测试和单文件/单用例执行方式。

当前尚未安装 pytest、Vitest/Jest 或 Playwright，也没有 `test` script；在设施加入前不要引用不存在的命令。

### T13 版本化项目备份与恢复

状态：待开发。

目标：
- 实现可迁移、可校验、可恢复的 JSON 导入导出格式。
- 与现有有损 Markdown 快照明确区分。

建议范围：
- 格式包含版本号和项目元数据。
- 导出 projects、papers、canvases、canvas nodes、relation labels、relations 和 viewport。
- 定义空值、metadata 扩展字段和未来 schema 的兼容策略。
- 导入前校验引用完整性、重复 ID、关系 project 一致性和 self-loop 规则。
- 定义 ID 冲突策略、原子恢复/失败回滚和导入结果报告。
- 增加 round-trip 自动化测试。

### T14 安全部署基线

状态：待开发。

目标：
- 在允许公网部署前明确并实现访问控制和秘密材料管理。

建议范围：
- 增加应用认证，或提供受支持的带认证反向代理部署方案。
- 明确可信网络、VPN 和公网暴露边界；不要把 CORS 当作访问控制。
- TLS 证书和私钥从仓库外部的部署环境或 secret store 挂载。
- 轮换任何曾进入仓库历史的真实私钥，并根据仓库传播范围评估历史清理。
- 为备份、恢复和升级制定操作检查清单。

## 暂缓任务

以下任务不进入近期计划，除非需求优先级变化：

- PDF 上传。
- 多项目管理界面。
- 撤销/重做。
- Markdown 导入。
- 多画布。
- GraphRAG。
