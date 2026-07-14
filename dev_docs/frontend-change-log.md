# Frontend Change Log

This document records stable frontend decisions that affect future development. Do not record temporary styling tweaks, bug-fix back-and-forth, or discarded UI experiments here.

## Simplified Metadata And TLDR

Status: completed.

Stable changes:

- Metadata editing now focuses on `status`, `tags`, and `tldr`.
- Author, venue, and year are no longer first-class UI fields; authors, venues, and topics should be entered as tags.
- Existing legacy `authors`, `venue`, and `year` values are merged into the visible tag input when editing, then removed from metadata on save.
- Graph node expansion shows TLDR and tags instead of separate author/year/venue rows.
- Graph search matches title, tags, status, TLDR, and legacy author/venue values for compatibility.

Primary files:

```text
frontend/src/features/graph/CreateNodeDialog.tsx
frontend/src/features/graph/EditNodeDialog.tsx
frontend/src/features/graph/PaperNode.tsx
frontend/src/features/papers/PaperMetadataForm.tsx
frontend/src/pages/GraphPage.tsx
frontend/src/types/paper.ts
backend/app/exporters/markdown_exporter.py
```

Validation:

```bash
cd frontend
npm run build

cd backend
python -m compileall app
```

## Paper Editor Outline Sidebar

Status: completed.

Stable changes:

- Added a collapsible left outline sidebar to the paper editor page.
- The outline is generated locally from Markdown H1/H2/H3 headings.
- Clicking an outline item scrolls the Vditor editor to the matching rendered heading.
- On narrow screens the outline stacks above the editor instead of compressing the writing surface.

Primary files:

```text
frontend/src/pages/PaperEditorPage.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/src/styles.css
```

Validation:

```bash
cd frontend
npm run build
```

## Save Shortcut And Markdown Persistence

Status: completed.

Stable changes:

- Added `Ctrl/Cmd + S` save support on the paper editor page.
- Added `Ctrl/Cmd + S` save support in the graph node edit dialog.
- `MarkdownEditor` now exposes `getMarkdown()` so save actions can read Vditor's latest value directly.
- Paper saves use the latest Vditor value instead of relying only on React state updates from editor input events.
- Vditor initialization and external value sync now use the latest `valueRef` / editor value comparison, so loaded `markdown_content` renders even when it arrives after the editor first mounts.
- Debounced autosave remains deferred.

Primary files:

```text
frontend/src/pages/PaperEditorPage.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/src/features/graph/EditNodeDialog.tsx
```

Validation:

```bash
cd frontend
npm run build
```

## Wider Markdown Editing Surface

Status: completed.

Stable changes:

- Expanded paper editor shell surfaces from 1360px to 1680px on wide screens.
- Overrode Vditor WYSIWYG / IR / SV content nodes, including `.vditor-wysiwyg > .vditor-reset`, so Markdown content can use a wider writing area instead of staying near A4 width.
- Kept the editing content centered with responsive padding.

Primary files:

```text
frontend/src/styles.css
```

Validation:

```bash
cd frontend
npm run build
```

## Graph Search And Locate

Status: completed.

Stable changes:

- Added local graph search in the graph overview panel.
- Search originally matched paper title, authors, venue, tags, and status from the current graph payload; current metadata search is documented in "Simplified Metadata And TLDR".
- Clicking a search result expands the target node and moves the React Flow viewport to it.
- This first version does not add a backend search API.

Primary files:

```text
frontend/src/pages/GraphPage.tsx
frontend/src/styles.css
```

Validation:

```bash
cd frontend
npm run build
```

## Graph Node Operations

Status: completed.

Stable changes:

- Added expanded-node actions for edit and delete.
- Added `EditNodeDialog` for graph-side editing of title, metadata, `nodeColor`, and `nodeShape`.
- Added `DeleteNodeDialog` to replace browser-native delete confirmation.
- Stored node display configuration in paper metadata.
- Clicking blank canvas space collapses the current node.
- Node width adapts to title/status content within min/max bounds.

Primary files:

```text
frontend/src/pages/GraphPage.tsx
frontend/src/features/graph/PaperNode.tsx
frontend/src/features/graph/EditNodeDialog.tsx
frontend/src/features/graph/DeleteNodeDialog.tsx
frontend/src/types/paper.ts
frontend/src/styles.css
```

Validation:

```bash
cd frontend
npm run build
```

## Paper Editor Refactor

Status: completed.

Stable changes:

- Replaced the earlier editor approach with Vditor WYSIWYG as the standard Markdown editor.
- Paper detail pages show the editor directly instead of a split edit/preview layout.
- Vditor runtime assets are served locally from `/vditor`.
- Added safe Vditor cleanup for React 19 development StrictMode.
- Added textarea fallback if Vditor initialization fails.
- Updated Docker Compose so frontend installs dependencies before Vite startup.

Primary files:

```text
frontend/src/pages/PaperEditorPage.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/vite.config.ts
frontend/src/styles.css
docker-compose.yml
frontend/package.json
```

Validation:

```bash
cd frontend
npm run build
```
