# AGENTS.md: Obsidian LineUp Plugin (`obsidian-lineup`)

Technical architecture, rules, and maintenance guidelines for autonomous coding agents and developers working on `obsidian-lineup`.

---

## 1. Project Context & Knowledge Graph (`graphify-out`)

> [!NOTE]
> Knowledge graph artifacts and analysis reside in the [graphify-out](file://graphify-out) directory (`graph.json`, `GRAPH_REPORT.md`, `graph.html`). Use the `graphify` skill/tools to inspect codebase dependencies and structural topology.

### Current Codebase Structure (`src/`)
The plugin follows a flat, minimalist 3-file structure implementing the Obsidian Bases View API:
- [src/main.ts](file://src/main.ts) (`api` layer): Plugin lifecycle, registers native Bases view (`registerBasesView("lineup", ...)`), workspace event wiring (`css-change`).
- [src/LineUpView.ts](file://src/LineUpView.ts) (`ui` layer): Subclasses native `BasesView`, manages DOM containers, reactivity (`onDataUpdated()`), note navigation, and hover popovers.
- [src/LineUpPanel.ts](file://src/LineUpPanel.ts) (`logic` / presentation layer): LineUp.js builder orchestration, column schema synthesis, value unwrapping/type inference, and side-panel toggle UI.
- [src/types.ts](file://src/types.ts): Shared TypeScript interfaces (`ColumnDesc`).
- [src/styles/lineup.css](file://src/styles/lineup.css): CSS variables mapped to native Obsidian theme tokens, layout geometry, side panel transitions.

---

## 2. Core Technical Guidelines & Native Obsidian Patterns

### 2.1 Obsidian Bases Core Plugin Integration
- **Zero Query Re-implementation**: Do not write custom YAML parsers, filter engines, or markdown codeblock fence parsers. Always rely on native `.base` views and `registerBasesView`.
- **Host DOM Isolation**: Always create a child container element (`parentEl.createDiv(...)`). Never mutate or clear `parentEl` directly, as this breaks Obsidian's internal Bases toolbar and view controllers.
- **Value Unwrapping (`NullValue`)**: Obsidian property values use internal `Value` wrapper classes. Explicitly unwrap `NullValue` to native JS `null`—coercing it to string results in `"null"`, which breaks numeric column inference.
- **Virtual Scrolling Height**: The main wrapper container requires an explicit `min-height: 480px` to prevent virtual scroll container collapse inside note embeds (`![[...]`).

### 2.2 Resource Management & Lifecycle
- Bind all event listeners to `Component` lifecycle methods (`this.registerEvent(...)`, `this.registerDomEvent(...)`).
- Do NOT attach global `MutationObserver` instances to `document.body` for theme detection; use native `this.app.workspace.on("css-change", ...)`.

### 2.3 Build & Styling Pipeline
- **Never edit `styles.css` directly**: All styles live in `src/styles/lineup.css` and are bundled by `esbuild.config.mjs`.
- Build command: `npm run build` (bundles JS and CSS).

---

## 3. Git & Production Rules
- `package.json` and `package-lock.json` MUST be committed to Git for deterministic dependency resolution.
- Temporary files, tests, and build artifacts (`node_modules/`, `*.tmp.*`) must remain ignored.
- Bump new version: `npm version patch` or `npm version x.x.x``
- Release new version: `git push origin main --tags`
`
