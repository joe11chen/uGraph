# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sources of truth

Use this precedence when documentation disagrees:

1. Executable source and configuration.
2. Current-state documents under `dev_docs/`, especially `implementation-status.md`, `architecture.md`, `api.md`, and `data-model.md`.
3. `需求文档.md`, which is the original product vision and includes unimplemented requirements.

Frontend visual work must follow `dev_docs/design-system.md` and the canonical tokens/patterns in `frontend/src/styles.css`.

## Commands

### Frontend

```bash
cd frontend
npm ci
npm run dev       # Vite on port 3000
npm run build     # TypeScript project build + Vite production build
npm run preview   # preview the production build
```

Use `npm ci` for a clean install. Use `npm install <package>` only when intentionally changing dependencies.

### Backend

When starting from `backend/`, override the CWD-relative defaults so local development uses the repository-level workspace:

```bash
cd backend
python -m pip install -r requirements.txt
WORKSPACE_PATH=../workspace \
DATABASE_URL=sqlite:///../workspace/database/research_graph.db \
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
python main.py
```

Backend syntax validation:

```bash
cd backend
python -m compileall app
```

### Docker Compose

```bash
docker compose up --build
```

Docker Compose is the project's current deployment mode on the user's own server. The Compose frontend is a production build served by nginx, not a Vite development container. The nginx/TLS configuration is domain-oriented (`ugraph.me`), redirects HTTP to HTTPS, and is not a `https://localhost` setup. Treat the separate frontend/backend commands as development workflows, not the production topology.

### Tests and linting

There are currently no automated tests, test runner, single-test command, lint/format command, or CI workflow. Do not invent commands such as `pytest`, Playwright, Vitest, or `npm test` until the corresponding tooling is added.

## Architecture

The main request path is:

```text
React/Vite page
  -> frontend/src/api wrappers
  -> FastAPI router
  -> service
  -> thin repository and/or direct SQLAlchemy ORM
  -> SQLite or filesystem export
```

The backend layering is descriptive rather than strict: relation services query ORM models directly, repositories cover only some entities, and services commit their own transactions.

### Frontend

- `frontend/src/pages/GraphPage.tsx` is the central graph-page orchestrator. It owns React Flow state, queries/mutations, dialogs, search, node expansion, and paper-ID/canvas-node-ID mappings.
- React Flow node IDs are `CanvasNode.id`; relation source/target IDs are `Paper.id`. Convert through the mappings built from graph data before producing React Flow edges.
- Search is client-side over the loaded graph payload. The backend has no search endpoint.
- Only single-node position persistence is wired into the frontend. Batch layout and viewport endpoints exist in the backend but are unused; the graph currently starts with `fitView`.
- `PaperEditorPage` manually saves through `Paper.version` optimistic locking. The header back button guards dirty state, but the footer link, browser reload/close, and arbitrary navigation do not.
- Vditor assets are self-hosted: `frontend/vite.config.ts` serves `/vditor` in development and copies runtime assets into the production build.

### Backend and data flow

- `GET /api/projects/default` may create the default project and canvas.
- Graph/relation-label reads may create a missing default canvas and the four default relation labels. Do not assume all GET requests are side-effect free.
- Graph-side node editing performs paper update and incoming-relation replacement as two HTTP requests. A relation failure does not roll back an already committed paper update.
- Incoming relations use replace semantics for all edges targeting one paper.
- Schema setup is `Base.metadata.create_all()` plus one SQLite compatibility patch for `relation_labels.emoji`; there is no Alembic or general migration framework.
- Configuration paths in `backend/app/core/config.py` are relative to the process CWD. Docker explicitly maps the root `workspace/`; an unqualified `cd backend && python main.py` writes under `backend/workspace/`.
- Business `AppError` exceptions use the custom error envelope. FastAPI/Pydantic validation errors and unexpected errors do not necessarily use it.

## Export semantics

SQLite is authoritative. Single-paper export returns Markdown directly. Project export writes a server-side directory under `workspace/exports/` and returns its relative path. Its `graph.md` is only a paper index; relations, relation labels, canvas positions, and viewport are not serialized. Do not describe Markdown export as a complete backup or round-trip format.

## Security boundary

The application has no authentication or authorization. Public deployments require network or authenticating reverse-proxy controls. Never copy certificate private-key material into documentation, code changes, commits, or issue text; production TLS secrets must be provisioned outside the repository.
