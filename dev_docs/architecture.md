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
    relations.ts
    export.ts
  pages/
    GraphPage.tsx
    PaperEditorPage.tsx
  features/
    graph/
      PaperNode.tsx
      CreateNodeDialog.tsx
      EditNodeDialog.tsx
      DeleteNodeDialog.tsx
      RelationLabelsDialog.tsx
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
    relation.ts
  main.tsx
  styles.css
```

Key frontend responsibilities:

- `GraphPage`
  - loads default project and graph data;
  - owns React Flow node state;
  - owns `expandedNodeId` for node expansion;
  - manages local node search and graph viewport focusing;
  - opens node edit/delete and relation-label dialogs;
  - saves node positions after dragging;
  - routes to paper detail pages on double-click.
- `PaperNode`
  - renders collapsed and expanded node states;
  - does not use React Flow native `selected` for expansion.
- `PaperEditorPage`
  - loads paper detail;
  - edits metadata;
  - generates a collapsible H1/H2/H3 outline from Markdown;
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
    relations.py
    export.py
  core/
    config.py
    database.py
    errors.py
  models/
    project.py
    paper.py
    canvas.py
    relation.py
  schemas/
    project.py
    paper.py
    canvas.py
    relation.py
  repositories/
    projects.py
    papers.py
    canvas.py
  services/
    paper_service.py
    canvas_service.py
    relation_service.py
    export_service.py
    serialization.py
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
  - search and locate paper nodes
  - edit node metadata and incoming relations
  - configure relation labels
  - double-click node to edit paper
  - export project Markdown

/papers/:paperId/edit
  PaperEditorPage
  - edit title and metadata
  - browse the generated outline
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

## Docker Compose Runtime

`docker-compose.yml` builds two services:

```text
backend   FastAPI service on the internal Docker network
frontend  nginx service that serves the built frontend and proxies API calls
```

The frontend image is built by `frontend/Dockerfile`:

```text
node:22-slim builder -> npm ci -> npm run build
nginx:1.27-alpine  -> serve /usr/share/nginx/html
```

Runtime routing:

- `/` and app routes are served by nginx with SPA fallback to `index.html`.
- `/api/` is proxied to `http://backend:8000/api/`.
- `/health` is proxied to `http://backend:8000/health`.
- `/vditor/` is served from the built frontend assets.

Local source development still uses separate commands:

```bash
cd backend
python main.py

cd frontend
npm run dev
```

## Design System

Frontend styling follows [agent_skills/design-system.md](./agent_skills/design-system.md), with [design-system.md](./design-system.md) kept as a compatibility entry point.

Important constraints:

- Warm academic writing-desk style.
- Claude-like brown accent tokens.
- No green/teal/blue-purple accent systems.
- No extra Markdown card around Vditor.
- React Flow node expansion is controlled by explicit graph state, not native selection.
- Ordinary notifications auto-dismiss; errors and confirmation flows use app-styled dialogs instead of browser-native dialogs.
