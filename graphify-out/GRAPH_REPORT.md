# Graph Report - obsidian-lineup  (2026-10-02)

## Corpus Check
- 12 files · ~4,347 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 3, (none) 2)

## Summary
- 129 nodes · 165 edges · 13 communities (8 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `75a65667`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Obsidian LineUp
- devDependencies
- LineUpView
- esbuild.config.mjs
- LineUpPanel
- 2. Core Technical Guidelines & Native Obsidian Patterns
- package.json
- LineUpView.ts
- compilerOptions
- manifest.json

## God Nodes (most connected - your core abstractions)
1. `LineUpPanel` - 18 edges
2. `compilerOptions` - 15 edges
3. `LineUpView` - 13 edges
4. `ColumnDesc` - 9 edges
5. `Obsidian LineUp` - 7 edges
6. `scripts` - 4 edges
7. `obsidian` - 4 edges
8. `getEntryValue()` - 4 edges
9. `AGENTS.md: Obsidian LineUp Plugin (`obsidian-lineup`)` - 4 edges
10. `2. Core Technical Guidelines & Native Obsidian Patterns` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Current Codebase Structure (`src/`)` --references--> `ColumnDesc`  [INFERRED]
  AGENTS.md → src/types.ts
- `LineUpView` --references--> `LineUpPanel`  [EXTRACTED]
  src/LineUpView.ts → src/LineUpPanel.ts

## Import Cycles
- None detected.

## Communities (13 total, 5 thin omitted)

### Community 0 - "Obsidian LineUp"
Cohesion: 0.13
Nodes (14): Adding a View to Bases, Analysis of a Book Base, Core Advantages of LineUp over Standard Tables, Credits & Related Publications, Features, License, Limitations, Obsidian LineUp (+6 more)

### Community 1 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, builtin-modules, esbuild, obsidian, tslib, @types/node, typescript

### Community 3 - "esbuild.config.mjs"
Cohesion: 0.17
Nodes (7): copyCss, lineupUMD, require, builtin-modules, esbuild, manifest, versions

### Community 5 - "2. Core Technical Guidelines & Native Obsidian Patterns"
Cohesion: 0.22
Nodes (8): 1. Project Context & Knowledge Graph (`graphify-out`), 2.1 Obsidian Bases Core Plugin Integration, 2.2 Resource Management & Lifecycle, 2.3 Build & Styling Pipeline, 2. Core Technical Guidelines & Native Obsidian Patterns, 3. Git & Production Rules, AGENTS.md: Obsidian LineUp Plugin (`obsidian-lineup`), Current Codebase Structure (`src/`)

### Community 20 - "package.json"
Cohesion: 0.12
Nodes (15): dependencies, lineupjs, description, keywords, license, main, name, scripts (+7 more)

### Community 37 - "LineUpView.ts"
Cohesion: 0.17
Nodes (8): lineupjs, obsidian, buildColumn(), getColumnLabel(), getEntryValue(), unwrapValue(), LineUpPlugin, ColumnDesc

### Community 45 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowSyntheticDefaultImports, baseUrl, esModuleInterop, importHelpers, inlineSourceMap, inlineSources, isolatedModules (+8 more)

### Community 52 - "manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

## Knowledge Gaps
- **62 isolated node(s):** `require`, `lineupUMD`, `copyCss`, `id`, `name` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 75 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `obsidian` connect `LineUpView.ts` to `package.json`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `LineUpPanel` connect `LineUpPanel` to `LineUpView`, `LineUpView.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `ColumnDesc` connect `LineUpView.ts` to `LineUpView`, `2. Core Technical Guidelines & Native Obsidian Patterns`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `require`, `lineupUMD`, `copyCss` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Obsidian LineUp` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._