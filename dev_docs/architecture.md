# 系统架构

## 总体架构

```text
Browser
  |
  | HTTP / JSON
  v
React Frontend
  - React Flow graph workspace
  - Vditor paper editor
  - Metadata forms
  - Export actions
  |
  | REST API
  v
FastAPI Backend
  - API routers
  - services
  - repositories
  - exporters
  |
  v
SQLite + Local Workspace
  - workspace/database/research_graph.db
  - workspace/exports/
```

## 技术栈

### 前端

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- React Flow
- Vditor
- lucide-react
- CSS variables in `frontend/src/styles.css`

### 后端

- Python
- FastAPI
- SQLAlchemy 2.x
- Pydantic
- SQLite

## 前端架构

```text
frontend/src/
  api/
    client.ts
    projects.ts
    papers.ts
    canvas.ts
    export.ts
  pages/
    GraphPage.tsx
    PaperEditorPage.tsx
  features/
    graph/
      PaperNode.tsx
      CreateNodeDialog.tsx
    papers/
      PaperMetadataForm.tsx
      MarkdownEditor.tsx
  components/
    AlertDialog.tsx
    ConfirmDialog.tsx
    NoticeBanner.tsx
    SelectField.tsx
  types/
    paper.ts
    graph.ts
  main.tsx
  styles.css
```

Key frontend responsibilities:

- `GraphPage`
  - loads default project and graph data;
  - owns React Flow node state;
  - owns `expandedNodeId` for node expansion;
  - saves node positions after dragging;
  - routes to paper detail pages on double-click.
- `PaperNode`
  - renders collapsed and expanded node states;
  - does not use React Flow native `selected` for expansion.
- `PaperEditorPage`
  - loads paper detail;
  - edits metadata;
  - hosts direct Vditor WYSIWYG editing.
- Shared feedback components
  - `NoticeBanner` handles non-blocking success/info messages and auto-dismisses;
  - `AlertDialog` handles operation errors;
  - `ConfirmDialog` handles user confirmation flows.
- `MarkdownEditor`
  - dynamically imports Vditor;
  - configures local Vditor runtime path `/vditor`;
  - safely cleans up Vditor in React 19 dev StrictMode;
  - falls back to textarea when Vditor initialization fails.

## 后端架构

```text
backend/app/
  main.py
  api/
    projects.py
    papers.py
    canvas.py
    export.py
  core/
    config.py
    database.py
    errors.py
  models/
    project.py
    paper.py
    canvas.py
  schemas/
    project.py
    paper.py
    canvas.py
  repositories/
    projects.py
    papers.py
    canvas.py
  services/
    paper_service.py
    canvas_service.py
    export_service.py
  exporters/
    markdown_exporter.py
```

## 页面流转

```text
/ or /projects/default/graph
  GraphPage
  - create paper node
  - drag node
  - click node to expand metadata
  - double-click node to edit paper
  - export project Markdown

/papers/:paperId/edit
  PaperEditorPage
  - edit title and metadata
  - edit Markdown through Vditor WYSIWYG
  - save paper
  - export single Markdown
  - return to graph
```

## Vditor Runtime Assets

Vditor loads runtime files such as i18n scripts, Mermaid, highlight themes, and other render helpers from its configured `cdn` path.

Current strategy:

- `MarkdownEditor.tsx` sets `cdn: "/vditor"`.
- `frontend/vite.config.ts` maps `/vditor/dist/*` to `node_modules/vditor/dist/*` during dev.
- Build output copies Vditor runtime to `dist/vditor/dist/*`.
- The app does not depend on public CDN access.

## Docker Development Mode

`docker-compose.yml` runs frontend in Vite dev mode:

```text
./frontend:/app
/app/node_modules
```

Because `/app/node_modules` is an anonymous volume, frontend starts with:

```bash
npm install && npm run dev -- --host 0.0.0.0 --port 3000
```

This keeps container dependencies in sync when `package.json` changes.

## Design System

Frontend styling follows [design-system.md](./design-system.md).

Important constraints:

- Warm academic writing-desk style.
- Claude-like brown accent tokens.
- No green/teal/blue-purple accent systems.
- No extra Markdown card around Vditor.
- React Flow node expansion is controlled by explicit graph state, not native selection.
- Ordinary notifications auto-dismiss; errors and confirmation flows use app-styled dialogs instead of browser-native dialogs.
