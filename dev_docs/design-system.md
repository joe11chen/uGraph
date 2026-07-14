# uGraph Frontend Design System

This document is the source of truth for the uGraph frontend visual style. Future frontend work should follow this style instead of introducing a new palette, layout language, or component vocabulary.

## Design Direction

uGraph uses a warm academic writing-desk style: paper, ink, clay-brown accents, restrained controls, and dense but readable research tooling. The UI should feel like a local research workspace, not a SaaS landing page or a generic dashboard.

Core tone:

- Warm, quiet, editorial.
- Practical and scan-friendly.
- Paper-first, with subtle texture and low-contrast depth.
- Claude-like brown accent language: clay, ochre, sepia, and warm paper.

Avoid:

- Green, teal, blue-purple, neon, or rainbow accent systems.
- Large marketing hero sections.
- Decorative cards nested inside other cards.
- Split Markdown editor/preview layouts by default.
- Generic Inter/Roboto/Arial-only SaaS styling.

## Color Tokens

The canonical implementation lives in `frontend/src/styles.css` under `:root`.

Required token set:

```css
--ink: #25221d;
--muted: #706a5e;
--hairline: #d6cdbc;
--paper: #fbfaf6;
--paper-deep: #f1eee6;
--accent: #b8653f;
--accent-dark: #7d3f2b;
--accent-soft: #ead2c1;
--cinnabar: #9d4f35;
--olive: #78644d;
--shadow: 0 20px 60px rgba(61, 52, 39, 0.16);
```

Usage rules:

- `--accent` is the main action and selection color.
- `--accent-dark` is for active states, links, selected borders, and important text accents.
- `--paper` and `--paper-deep` are the dominant surfaces.
- `--ink` is primary text; `--muted` is secondary text.
- Do not add a new dominant hue unless the whole design system is intentionally revised.

## Typography

Default font stack:

```css
"Noto Serif SC", "Source Han Serif SC", "LXGW WenKai", "Segoe UI", serif
```

Rules:

- Use serif Chinese-first typography for page-level reading and research content.
- Use `"Segoe UI", sans-serif` only for small UI labels, chips, metrics, and controls.
- Keep letter spacing at `0` for normal text. Uppercase eyebrow labels may use slight positive spacing.
- Prefer restrained headings over oversized display text.

## Layout

The product has two primary surfaces:

- Graph canvas: full viewport workspace with a compact floating overview panel.
- Paper editor: metadata form plus a direct Vditor editing surface.

Rules:

- Do not create landing pages.
- Do not put page sections inside decorative cards.
- Repeated objects, dialogs, and tool surfaces may use 8px-radius cards.
- Keep controls compact and task-oriented.
- On small screens, collapse toolbars and editor controls without overlapping text.

## React Flow Nodes

Nodes have two states:

- Collapsed: show status and title.
- Expanded: show metadata in-place after an explicit click.

Rules:

- Collapsed nodes must stay visually light so the graph remains scannable.
- Collapsed node width may adapt to status/title content, with min/max bounds.
- Metadata belongs only in selected/expanded nodes.
- React Flow's native `selected` state must not drive expansion, because dragging can also select nodes.
- Expansion is driven by `GraphPage` state and passed through `node.data.expanded`.
- Dragging a collapsed node must not expand it.
- Expanded node size should follow available content. Nodes with only a title stay small; nodes with metadata can grow wider and taller.
- Double-click remains the entry point to the full paper editor.
- Node selection uses warm brown borders and shadows, never green/teal.

## Markdown Experience

The editor should feel closer to Typora than to a developer IDE. The canonical Markdown engine is Vditor.

Rules:

- Paper detail pages show the editor directly.
- Editing uses a single Vditor WYSIWYG surface, not a preview/edit switch.
- Do not show editor and preview at the same time by default.
- The editor surface should look like a readable paper sheet.
- Do not wrap Vditor in an additional Markdown card or show a redundant "WYSIWYG" heading.
- Vditor default blue focus/selection states must be overridden with the warm brown token system.
- Static Markdown rendering, when needed outside the editor, should use `Vditor.preview(...)` so Mermaid and other Vditor-supported Markdown extensions render consistently.
- Vditor runtime assets are served locally from `/vditor` through the Vite config; do not rely on a public CDN for the local app.

## Controls

Use `lucide-react` icons for buttons where a matching icon exists.

Rules:

- Primary actions use `--accent`.
- Secondary actions use paper backgrounds and hairline borders.
- Segmented controls are used for view/mode switching.
- Icon buttons need accessible labels when the visible text is absent.
- Button text must fit on mobile; allow wrapping or flexible widths.
- Ordinary notifications should be non-blocking and auto-dismiss.
- Errors and destructive or navigation confirmations should use the shared dialog style, not browser-native dialogs.

## Motion

Motion should be quiet and functional:

- Hover lift: small translate and border shift.
- Node expansion: width/min-height transition under 200ms.
- Avoid dramatic page-wide animation.

## Implementation Contract

Before changing frontend UI:

1. Check this document.
2. Reuse existing CSS variables from `frontend/src/styles.css`.
3. Reuse existing component class patterns before adding new ones.
4. Keep graph nodes collapsed by default.
5. Keep paper detail Markdown editing as direct Vditor WYSIWYG.
6. Run `npm run build` from `frontend/` for development-side validation.
