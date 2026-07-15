# uGraph Frontend Design System

This document is the frontend design contract for uGraph. It describes the visual identity already present in the application, the conventions new work should follow, and the gaps that must not be mistaken for implemented behavior.

Implementation evidence lives in `frontend/src/styles.css` and the named React components. If this document and the running UI disagree, verify the code and update the document rather than layering a second visual system on top.

## Status labels

Rules use three labels:

- **Implemented** — visible or behaviorally present in the current frontend.
- **Convention** — required direction for new work, even if no shared primitive exists yet.
- **Known gap** — incomplete behavior that documentation must not claim is solved.

## Product subject and design thesis

uGraph is a self-hosted research workspace for people organizing papers, relationships, and long-form notes. Its two primary jobs are:

1. Let a researcher scan and rearrange a paper graph without losing semantic context.
2. Let the same researcher move into a focused writing surface without switching to an unrelated visual language.

The interface should feel like an annotated research desk: warm paper, graphite ink, clay marks, ruled writing surfaces, compact instruments, and layers that appear placed over a working table. It must not feel like a SaaS analytics dashboard, a marketing site, or a generic component-library demo.

### Signature visual grammar

**Implemented.** The recognizable uGraph identity comes from the combination of:

- A subtle 28px desk grid behind the application.
- Translucent paper surfaces with warm borders, blur, and restrained shadows.
- Clay-colored diagonal washes across graph and node surfaces.
- Ruled-paper backgrounds in TLDR and Markdown writing areas.
- A compact brand tile paired with an editorial eyebrow, page title, and context line.
- Graph nodes that resemble movable research notes rather than dashboard cards.

The warm palette alone is not the identity. Preserve the relationship between desk texture, paper layers, research-note geometry, and compact scholarly typography.

### Deliberate aesthetic risk

**Implemented.** The paper editor uses a broad writing-table surface rather than a conventional narrow A4 column. This supports technical notes, tables, diagrams, Mermaid output, and dense research material. Keep the surface broad and calm; use padding, type hierarchy, ruling, and metadata structure to maintain readability rather than forcing the editor into a generic blog measure.

## Core principles

- **Paper before chrome.** Content and graph structure should dominate controls.
- **Dense, not cramped.** Research tooling may be information-rich, but spacing and hierarchy must remain legible.
- **Warm, not decorative.** Texture and depth should support spatial understanding, not become ornament.
- **One vocabulary across modes.** Graph, dialogs, metadata, and editor belong to the same product.
- **Color has roles.** Interface chrome follows the warm palette; graph data may use controlled semantic colors.
- **Behavior must be documented honestly.** Do not describe accessibility, persistence, or navigation protection as complete when the implementation is partial.

Avoid:

- Green, teal, blue-purple, neon, or rainbow as the dominant interface accent system.
- Large marketing heroes, feature-card grids, glassmorphism for its own sake, or oversized empty spacing.
- Decorative cards nested repeatedly inside page-level cards.
- Split Markdown editor/preview layouts by default.
- Generic Inter/Roboto/Arial-only SaaS typography.
- New local component styles that ignore existing selectors and shared components.

## Foundations

### Color roles

The root palette is declared in `frontend/src/styles.css`:

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

#### Active interface roles

**Implemented.** The most broadly consumed tokens are:

| Token | Role |
| --- | --- |
| `--ink` | Primary text and strong neutral marks |
| `--muted` | Secondary text, helper copy, subdued controls |
| `--paper` | Main paper surface and edge-label background |
| `--accent` | Primary action, brand tile, active clay mark |
| `--accent-dark` | Active text, stronger borders, selected control emphasis |
| `--cinnabar` | Warm destructive or high-attention accent where appropriate |
| `--shadow` | Major floating-surface elevation |

#### Reserved tokens and hardcoded colors

**Implemented reality.** `--hairline`, `--paper-deep`, `--accent-soft`, and `--olive` are declared but are not consistently consumed through `var(...)`. Several node, form, destructive, relation, and Vditor colors remain component-specific literals.

**Convention.** Do not claim that every color is tokenized. Reuse an existing token or established component recipe first. Add a root token only when the value has a stable cross-component role; do not create aliases for one-off shades.

#### Interface chrome versus graph data

**Convention.** The warm-palette restriction applies to interface chrome, navigation, focus, primary actions, and product identity.

User-configurable relation colors and the existing node palette are graph data encodings. They may include olive, graphite, or another user-selected hue. Data colors must not silently redefine the global action or focus color.

Never rely on color alone to communicate a relationship or state. Pair it with text, emoji, line style, shape, or position.

### Typography

The root stack is Chinese-first and editorial:

```css
"Noto Serif SC", "Source Han Serif SC", "LXGW WenKai", "Segoe UI", serif
```

The current system has three practical roles.

#### Editorial serif

**Implemented.** Used for page reading, headings, general controls, labels, paper metadata, and Markdown content unless a selector explicitly changes the family.

Use serif typography to keep the graph and editor tied to the world of reading and annotation. Avoid oversized display treatments; authority should come from proportion and spacing, not scale alone.

#### Compact UI sans

**Implemented.** `"Segoe UI", sans-serif` is used selectively for eyebrows, chips, compact metadata, search-result details, outline navigation, relation controls, tabs, and graph edge labels.

**Convention.** Use the sans role for dense machine-like information, not as a blanket replacement for all controls.

#### Display numerals

**Implemented.** Metrics use a Georgia/Times-style serif numeral treatment. Preserve this distinction when adding compact counts or version metrics.

#### Current type scale

| Role | Current range |
| --- | --- |
| Eyebrow | 11px, weight 800, slight positive tracking, uppercase where appropriate |
| Helper/meta text | 12–13px |
| Collapsed node title | about 13px |
| Expanded node title | about 15px |
| Topbar title | 18px |
| Dialog heading | 19px |
| Editor hero title | 30px desktop, 26px tablet, 23px mobile |
| Metric numeral | 24px Georgia/Times |
| Long-form editor line height | about 1.72–1.78 |

**Convention.** Preserve these role relationships. Do not add a new typeface unless it solves a specific role that the existing serif/sans/numeral system cannot.

### Spacing and control sizing

The frontend does not yet expose spacing tokens. Treat the following as an implemented rhythm, not a formal API:

| Tier | Typical use |
| --- | --- |
| 4–9px | Icon/text separation, compact internal gaps |
| 10–14px | Ordinary control and component gaps |
| 15–22px | Section, panel, dialog, and page gaps |
| 14–22px | Responsive page padding |

Current height tiers:

- 30–34px: compact toolbar and icon controls.
- 38–40px: ordinary buttons, inputs, and selects.
- 46–48px: larger dialog and metadata controls.

**Known gap.** Several compact icon targets are below a 44px touch target. Do not claim complete touch accessibility. When adding mobile-first controls, prefer a 44px minimum unless density or an existing compact toolbar pattern requires a documented exception.

### Shape, border, and elevation

**Implemented.** The shape language is restrained:

- 7px: base inputs and buttons.
- 8px: panels, dialogs, tool surfaces, and standard graph nodes.
- `999px`: status chips, pills, and small indicators.
- 24px: capsule node shape.
- Folded-corner geometry: note node shape.

Use thin, warm, low-contrast borders. Stronger borders indicate expansion, active state, or destructive attention. Shadows should communicate layering—topbar, floating panel, dialog, expanded node—not decorate every container.

### Texture and surfaces

**Implemented.** Reusable visual recipes include:

- Desk grid for the application background.
- Translucent paper with backdrop blur for topbars and floating tools.
- Clay diagonal washes for graph and node depth.
- 36px writing rules in short-form note fields.
- 44px writing rules in the editor/fallback surface.

**Convention.** Use these recipes sparingly. A new surface should either be plain paper, a floating tool, a movable note, or a writing sheet. Do not invent a fifth unrelated material.

## Page shells

### Shared topbar anatomy

**Implemented.** Both primary pages use:

```text
brand tile | eyebrow
           | page title
           | context line
                         action toolbar
```

The brand block identifies the workspace; the toolbar contains immediate page actions. On narrower screens the layout stacks and actions wrap instead of being hidden.

**Convention.** Keep action names stable between button, pending state, success notice, and confirmation copy.

### Graph workspace

**Implemented.** The graph page is a fixed-height workspace with:

- A compact topbar.
- Full remaining viewport for React Flow.
- A floating overview/search panel, up to roughly 320px wide.
- Visible React Flow controls and minimap.
- A lightweight empty state when there are no papers.

The graph is not a dashboard grid. Panels float over a spatial canvas and should occupy only the space required for commands and orientation.

### Editor workspace

**Implemented.** The editor page contains:

- Shared topbar.
- Editor hero with persistence state and compact metrics.
- Metadata panel above the writing surface.
- Direct Vditor WYSIWYG surface.
- Fixed collapsible outline rail.
- Footer status and navigation.

The workspace may grow to 2480px. Do not place Vditor inside an additional decorative Markdown card or add a redundant “WYSIWYG” heading.

### Restrained use of cards

**Convention.** Avoid ornamental card grids as page architecture. Bordered surfaces are appropriate for editable metadata, metrics, dialogs, floating command panels, and tool subpanels when the border clarifies grouping or interaction.

The rule is not “never use cards”; it is “every bordered surface must explain a functional boundary.”

## Responsive behavior

The stable CSS breakpoints are 980px and 620px.

### At or below 980px

**Implemented.** The UI generally:

- Stacks topbar and editor-hero content.
- Lets toolbars occupy full width and wrap.
- Moves notices to the bottom of the viewport.
- Collapses multi-column metadata/dialog grids to one column.
- Reduces Vditor horizontal padding.
- Repositions the graph panel and editor outline.

### At or below 620px

**Implemented.** The UI generally:

- Reduces page padding and editor heading size.
- Makes ordinary toolbar/dialog actions flexible and wrapping.
- Reduces node maximum width.
- Stacks metrics and relation-editing rows.
- Reduces Vditor horizontal padding to the narrow-screen treatment.

The outline remains a fixed, collapsible floating panel. It does not become a normal block above the editor.

### Responsive limitations

**Known gaps.** Current implementation does not provide:

- Dynamic viewport-unit handling in place of `100vh`.
- Touch/hover capability media queries.
- A shared dialog max-height/overflow contract.
- App-level hiding or collapsing of React Flow controls, minimap, or the Vditor toolbar.
- Consistent 44px touch targets.

New work must test at desktop, 980px, 620px, and approximately 320px. Do not describe responsive support as complete when these gaps affect the feature.

## Graph visual language

### Node state model

**Implemented.** Native React Flow selection and uGraph expansion are separate states.

- Metadata appears only in explicitly expanded nodes.
- `GraphPage` owns one `expandedNodeId`; at most one node is expanded.
- Clicking a node toggles expansion.
- Clicking the pane collapses the expanded node.
- Dragging suppresses click expansion.
- Double-click opens the full paper editor.

Do not use React Flow’s native `selected` state to drive expansion.

### Node anatomy and sizing

Collapsed nodes show:

```text
status
paper title
```

Expanded nodes may show:

```text
action menu
status
paper title
TLDR
tags
```

Current width bounds are content-sensitive:

- Collapsed: roughly 128–240px.
- Expanded without details: roughly 160–260px.
- Expanded with details: roughly 280–360px.

**Convention.** Keep collapsed nodes visually light so the graph remains scannable. Expanded nodes may grow, but should not become miniature page layouts.

### Node colors and shapes

**Implemented.** Current node colors:

- `clay`
- `ochre`
- `olive`
- `cinnabar`
- `graphite`

Current shapes:

- `rounded`
- `note`
- `capsule`

Color and shape are user-configurable metadata. Maintain a readable title/status contrast in every combination. If a new color or shape is introduced, update TypeScript types/options, CSS recipes, documentation, and fallback behavior together.

### Edges

**Implemented.** Relations render as:

- Directed `smoothstep` edges.
- Closed arrow markers.
- 2px stroke.
- Solid, dashed, or dotted line style.
- User-configurable color.
- Label composed of relation emoji plus localized name.
- Compact sans label on a translucent paper background.

Relation color is data encoding and is exempt from the interface-chrome accent restriction. Preserve emoji/text/line-style cues so meaning is not carried by color alone.

## Markdown and writing experience

### Editor contract

**Implemented.** `MarkdownEditor` is the sole Vditor adapter. The standard experience is:

- One direct WYSIWYG surface.
- Local runtime assets under `/vditor`.
- Chinese locale.
- Pinned toolbar.
- Counter and typewriter mode.
- Current toolbar inventory defined in `MarkdownEditor.tsx`.
- Brown-paper overrides for Vditor controls and syntax surfaces.
- Plain textarea fallback for captured loading/initialization errors.

Do not instantiate Vditor directly in another component. Do not restore split preview/edit, CodeMirror, ReactMarkdown, or a public CDN as the primary path.

### Save and persistence language

**Implemented.** Editing is manual-save:

- Save button and `Ctrl/Cmd + S` use the latest Vditor value.
- `Paper.version` provides optimistic locking.
- The page displays “未保存” and “已同步” persistence states.

**Known gap.** Unsaved-navigation protection only covers the topbar return action. The footer link, browser refresh/close, browser back, and arbitrary routing are not globally blocked.

### Outline

**Implemented.** The outline:

- Parses source Markdown H1–H3 ATX headings.
- Ignores headings inside fenced code blocks.
- Distinguishes duplicate headings by occurrence.
- Smooth-scrolls to matching rendered headings.

It does not parse Setext headings or H4–H6.

### Static Markdown rendering

**Convention.** If a future surface needs static rendering outside the editor, prefer `Vditor.preview(...)` to keep Mermaid and Vditor-supported extensions consistent.

**Known gap.** No current frontend surface implements this preview path; do not cite it as existing behavior.

## Controls and reusable components

### Existing control vocabulary

**Implemented.** Current styles include:

- Base secondary button.
- `.primary-action`.
- Text button.
- Icon button.
- Destructive primary action.
- Pressed-choice buttons using `aria-pressed`.
- Segmented/tab-like controls.
- Shared `SelectField`.

Use `lucide-react` icons where a matching icon exists. Icon-only buttons require an accessible label and tooltip/title where useful.

**Convention.** A control should name the user-visible action: “保存”, “删除”, “导出”, “返回工作台”. Avoid implementation terms such as “submit mutation” or “sync payload”.

### Required reuse

Reuse these components and utilities where their role matches:

```text
frontend/src/components/SelectField.tsx
frontend/src/components/NoticeBanner.tsx
frontend/src/components/AlertDialog.tsx
frontend/src/components/ConfirmDialog.tsx
frontend/src/features/papers/PaperMetadataForm.tsx
frontend/src/features/papers/MarkdownEditor.tsx
frontend/src/utils/errors.ts
frontend/src/utils/labels.ts
```

**Implemented reality.** There is no generic Button, Dialog shell, Field, Topbar, MetricTile, StatusChip, or EmptyState component. Reuse established CSS recipes where a shared component does not exist, but do not claim a primitive exists until it is actually introduced.

Do not create a second custom select implementation. Do not duplicate status or relation display mapping outside the centralized label utilities.

## Feedback and state communication

### Non-blocking notice

**Implemented.** `NoticeBanner` is used for ordinary success/info feedback:

- Polite live region.
- Auto-dismiss after approximately 3200ms.
- Explicit close action.
- Non-blocking placement above the active page.

### Blocking error

**Implemented.** `AlertDialog` handles operation failures that require acknowledgement. Use specific failure text and, where possible, say what the user can do next.

### Confirmation

**Implemented.** `ConfirmDialog` handles ordinary confirmation. `DeleteNodeDialog` provides dedicated destructive node-deletion copy.

**Known gap.** Modal semantics and focus behavior are not consistent across every create/edit/dialog implementation.

### Loading, empty, and persistence states

**Implemented.** The application uses:

- Full-page loading/error text for initial queries.
- Graph empty state inviting the first paper.
- Search empty state when no result matches.
- Editor “未保存” / “已同步” state.
- Pending action labels ending in “中”, such as “保存中” or “导出中”.

**Convention.** Empty states should direct the next action. Failures should identify the failed operation rather than apologize or use generic mood-setting copy.

## Content and vocabulary

The interface is Chinese-first. Keep technical terms only where they are already meaningful: `uGraph`, `TLDR`, Markdown, Vditor.

Preferred vocabulary:

| Purpose | Pattern |
| --- | --- |
| Core objects | 文献、关系、关系类型、标签、状态、目录 |
| Primary actions | 新建、添加、保存、删除、导出、返回 |
| Secondary actions | 取消、关闭 |
| Pending | `动作 + 中`：保存中、删除中、导出中 |
| Success | `已 + 结果` or explicit object result：已保存、文献已更新 |
| Failure | `动作 + 失败` with specific context |
| Empty | 暂无、没有、还没有 + next action |

**Known vocabulary debt.** Current copy is not fully standardized: “新建文献/添加文献”, “正在打开/正在载入”, “已保存/已同步”, and “导出笔记/导出本文” coexist. New work should choose terms by user meaning and keep them stable throughout one flow; broad renaming should be handled as an intentional copy pass, not incidental edits.

## Accessibility and keyboard contract

### Implemented now

The frontend currently provides:

- `lang="zh-CN"` at the document level.
- Real form labels in primary forms.
- Accessible names for most icon-only application buttons.
- `role="status"` and `aria-live="polite"` for notices.
- Dialog semantics on alert, confirm, delete, and relation-label dialogs.
- `aria-expanded` on the outline disclosure.
- `aria-pressed` on node-style choices.
- `Ctrl/Cmd + S` in the paper editor and node editor.
- Partial listbox/option semantics in `SelectField`.
- Partial tab/tablist/tabpanel semantics in the node editor.

### Known gaps

Do not claim the following are implemented:

- Shared modal focus trap, initial-focus policy, focus return, or Escape-to-close behavior.
- Consistent dialog semantics for create and edit dialogs.
- Complete listbox keyboard behavior: arrows, Home/End, typeahead, option-focus Escape, and focus restoration.
- Complete tabs behavior: roving `tabIndex`, arrow navigation, Home/End, and full ID relationships.
- App-defined keyboard equivalents for graph expand and double-click open.
- Consistent `:focus-visible` styling for all buttons, graph nodes, composite controls, and Vditor shell.
- Consistent 44px touch targets.
- Global browser/router unsaved-change protection.
- Reduced-motion handling.

### Convention for new work

- Preserve visible keyboard focus; never remove an outline without an equivalent warm focus treatment.
- Add semantic relationships together with interaction behavior—not ARIA roles alone.
- When adding a modal, define initial focus, tab containment, Escape behavior, and focus return.
- When extending `SelectField` or tabs, improve the shared implementation rather than solving keyboard behavior in one caller.
- Ensure state is communicated by text or semantics in addition to color.

## Motion

### Current motion

**Implemented.** The application uses restrained functional motion:

- About 140–180ms for button, node, and outline transitions.
- About 210ms for tab-panel entrance.
- 420ms for graph search centering.
- Smooth scrolling from editor outline to heading.
- Small hover lift and border/shadow changes.

Node expansion transitions width and visual emphasis; min-height is not currently animated.

### Reduced motion

**Known gap.** There is no `prefers-reduced-motion` policy. CSS transitions, smooth scrolling, and JavaScript graph-centering animation remain active.

**Convention.** Future reduced-motion work must cover both CSS and JavaScript behavior. Under reduced motion, remove nonessential transforms/entrances, use immediate graph centering, and avoid smooth scrolling.

## Layering and z-index

**Implemented.** The UI uses layered surfaces for topbar, graph panel, node action menu, outline, notices, and modal backdrops.

**Convention.** Reuse existing stacking contexts before adding a new z-index. New values must correspond to a named layer role; do not increment z-index locally until an element appears above its neighbor.

## Adding or changing a visual primitive

Before adding a token, control variant, node style, or surface:

1. Identify the user-facing role that existing patterns cannot express.
2. Check `frontend/src/styles.css` and existing components for an established recipe.
3. Decide whether the change belongs to interface chrome or graph data encoding.
4. Update all coupled locations together—for example TypeScript types, option arrays, CSS, fallback behavior, and this document for a new node style.
5. Keep the signature desk/paper/note grammar intact.
6. Do not create a new dominant hue, typeface, radius language, or material without intentionally revising the entire system.

## Validation checklist

For frontend visual changes:

1. Run:

   ```bash
   cd frontend
   npm run build
   ```

2. Inspect the affected flow at desktop, around 980px, around 620px, and a narrow mobile width near 320px.
3. Check keyboard-only operation and visible focus.
4. Check dialog height/overflow and focus return where applicable.
5. Verify graph click, drag, pane-collapse, and double-click behavior when graph components change.
6. Verify Vditor save, dirty state, outline navigation, and fallback path when editor components change.
7. Verify that success, pending, error, empty, and destructive copy use one vocabulary through the flow.
8. Record reduced-motion behavior honestly; it remains a known gap until implemented.

A documentation-only update does not make a missing behavior real. When a rule moves from **Known gap** to **Implemented**, update the code and verify the behavior before changing its label here.
