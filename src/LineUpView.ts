import {
  App,
  BasesEntry,
  BasesPropertyId,
  BasesView,
  BooleanValue,
  HoverParent,
  HoverPopover,
  NullValue,
  NumberValue,
  QueryController,
  Value,
} from "obsidian";
import type { ColumnDesc } from "./types";
import { LineUpPanel } from "./LineUpPanel";

/** Unwrap Obsidian Bases Value to primitive scalar. */
export function unwrapValue(value: Value | null): unknown {
  if (value == null) return null;
  if (value instanceof NullValue || value.constructor?.name === "NullValue") return null;
  if (value instanceof NumberValue || value.constructor?.name === "NumberValue") {
    const num = Number(value.toString());
    return isNaN(num) ? null : num;
  }
  if (value instanceof BooleanValue || value.constructor?.name === "BooleanValue") {
    return value.toString() === "true";
  }
  const s = value.toString();
  if (s === "" || s === "null" || s === "undefined") return null;
  return s;
}

/**
 * Robustly extract property values from a BasesEntry.
 * Handles unprefixed names ("author" -> "note.author"),
 * file properties ("file.name" -> entry.file.basename),
 * and formulas ("formula.stars").
 */
export function getEntryValue(entry: BasesEntry, id: string): unknown {
  if (id === "file.name" || id === "name") {
    return entry.file?.basename ?? "";
  }
  if (id === "file.path" || id === "path") {
    return entry.file?.path ?? "";
  }

  // 1. Try id as-is (e.g. "formula.stars", "file.ctime")
  let val: Value | null = null;
  try {
    val = entry.getValue(id as BasesPropertyId);
  } catch {
    // Property key not directly present on entry
  }

  // 2. If not found and unprefixed, try "note.<id>"
  if (val == null && !id.includes(".")) {
    try {
      val = entry.getValue(`note.${id}` as BasesPropertyId);
    } catch {
      // Note-prefixed property not present
    }
  }

  // 3. If not found and starts with "note.", try unprefixed "<id>"
  if (val == null && id.startsWith("note.")) {
    try {
      val = entry.getValue(id.slice(5) as BasesPropertyId);
    } catch {
      // Unprefixed fallback not present
    }
  }

  return unwrapValue(val);
}

/**
 * Retrieve column display name with fallback for prefixed/unprefixed property IDs.
 */
export function getColumnLabel(config: { getDisplayName?(id: BasesPropertyId): string } | undefined, id: string): string {
  try {
    if (config?.getDisplayName) {
      const direct = config.getDisplayName(id as BasesPropertyId);
      if (direct && direct !== id) return direct;
      if (!id.includes(".")) {
        const noteLabel = config.getDisplayName(`note.${id}` as BasesPropertyId);
        if (noteLabel && noteLabel !== `note.${id}`) return noteLabel;
      }
    }
  } catch {
    // Config displayName resolver unavailable
  }
  return id.replace(/^(note|file|formula)\./, "");
}

/**
 * Native Bases View for LineUp rankings (`type: lineup`).
 * Renders notes using Obsidian's evaluated query results, property order, and sorting.
 */
export class LineUpView extends BasesView implements HoverParent {
  readonly type = "lineup";
  hoverPopover: HoverPopover | null = null;
  private containerEl: HTMLElement;
  private panel: LineUpPanel | null = null;
  private isSaving = false;
  private saveTimer: number | null = null;

  constructor(public app: App, controller: QueryController, parentEl: HTMLElement) {
    super(controller);
    this.containerEl = parentEl.createDiv("obsidian-lineup-wrapper obsidian-lineup-bases-view");
    this.registerEvent(this.app.workspace.on("css-change", () => this.updateLayout()));
  }

  onDataUpdated(): void {
    if (this.isSaving) return;

    const entries = this.data?.data;
    if (!entries || !entries.length) {
      this.render();
      return;
    }

    const columns = this.resolveColumns(entries);
    const existingCols = this.panel?.getColumns();
    const columnsMatch =
      existingCols &&
      existingCols.length === columns.length &&
      existingCols.every((c, i) => c.id === columns[i]?.id && c.type === columns[i]?.type);

    if (this.panel && columnsMatch) {
      const rows = entries.map((entry) => this.extractRow(entry, columns));
      this.panel.setData(rows);
      return;
    }

    this.render();
  }

  onunload(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (!this.isEmbedded() && this.panel) {
      const dump = this.panel.flushChange();
      if (dump) {
        try {
          this.config?.set?.("lineupLayout", dump);
        } catch {
          // Layout config persistence failed or unsupported
        }
      }
    }
    this.panel?.destroy();
    this.panel = null;
    this.containerEl.remove();
  }

  updateLayout(): void {
    this.panel?.update();
  }

  private isEmbedded(): boolean {
    return (
      this.containerEl.closest(".internal-embed, .markdown-embed, .block-language-bases") !== null ||
      this.containerEl.closest(".workspace-leaf-content[data-type='markdown']") !== null
    );
  }

  private render(): void {
    this.panel?.destroy();
    this.panel = null;
    this.containerEl.empty();

    const entries = this.data?.data;
    if (!entries || !entries.length) {
      this.containerEl.createDiv({ text: "No notes match this view.", cls: "setting-item-description" });
      return;
    }

    const columns = this.resolveColumns(entries);
    const rows = entries.map((entry) => this.extractRow(entry, columns));
    const embedded = this.isEmbedded();
    const savedLayout = this.config?.get?.("lineupLayout");

    this.panel = new LineUpPanel(this.containerEl, rows, columns);
    this.panel.build(this.config?.getSort?.(), savedLayout, embedded);
    this.panel.wireSelection((row) => {
      const path = row["file.path"];
      if (typeof path === "string") {
        void this.app.workspace.openLinkText(path, "", false);
      }
    });

    if (!embedded) {
      this.panel.wireChange((dump) => {
        this.isSaving = true;
        try {
          this.config?.set?.("lineupLayout", dump);
        } catch (e) {
          console.warn("[obsidian-lineup] failed to save lineup layout to view config", e);
        } finally {
          if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
          this.saveTimer = window.setTimeout(() => {
            this.isSaving = false;
            this.saveTimer = null;
          }, 200);
        }
      });
    }
  }

  private extractRow(entry: BasesEntry, columns: ColumnDesc[]): Record<string, unknown> {
    const row: Record<string, unknown> = {
      "file.path": entry.file?.path ?? "",
      "file.name": entry.file?.basename ?? "",
    };
    for (const col of columns) {
      const raw = getEntryValue(entry, col.id);
      if (raw === null || raw === undefined || raw === "" || raw === "null" || raw === "undefined") {
        row[col.id] = null;
      } else if (col.type === "number") {
        const num = typeof raw === "number" ? raw : Number(raw);
        row[col.id] = isNaN(num) ? null : num;
      } else if (col.type === "categorical") {
        row[col.id] = String(raw);
      } else {
        row[col.id] = raw;
      }
    }
    return row;
  }

  /** Resolve columns from view order or all properties, ensuring file.name is present. */
  private resolveColumns(entries: BasesEntry[]): ColumnDesc[] {
    const order = this.config?.getOrder?.() ?? [];
    const props = this.data?.properties ?? [];
    const ids: string[] = [...(order.length ? order : props)];
    if (!ids.includes("file.name") && !ids.includes("name")) {
      ids.unshift("file.name");
    }
    return ids.map((id) => this.inferColumn(id, entries)).filter((col): col is ColumnDesc => col !== null);
  }

  /**
   * Infer column type and domain from evaluated values.
   * Accurately distinguishes numerical columns with nulls from categorical columns.
   */
  private inferColumn(id: string, entries: BasesEntry[]): ColumnDesc | null {
    const label = getColumnLabel(this.config, id);
    const rawValues = entries.map((e) => getEntryValue(e, id));

    // Filter to only present, non-null values
    const nonNulls = rawValues.filter(
      (v) => v !== undefined && v !== null && v !== "" && v !== "null" && v !== "undefined"
    );

    if (!nonNulls.length) {
      return { id, label, type: "string" };
    }

    // 1. Numeric inference: if all non-null values are numbers (or parseable numeric strings)
    const isAllNumeric = nonNulls.every(
      (v) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)))
    );

    if (isAllNumeric) {
      const nums = nonNulls.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        return {
          id,
          label,
          type: "number",
          domain: min === max ? [min > 0 ? 0 : min - 1, min + 1] : [min, max],
        };
      }
    }

    // 2. Boolean inference
    if (nonNulls.every((v) => typeof v === "boolean" || v === "true" || v === "false")) {
      return { id, label, type: "categorical", categories: ["true", "false"] };
    }

    // 3. Categorical inference: low cardinality non-numeric values
    const strValues = nonNulls.map(String);
    const cats = [...new Set(strValues)];
    if (cats.length <= 20 && cats.length < nonNulls.length) {
      return { id, label, type: "categorical", categories: cats };
    }

    return { id, label, type: "string" };
  }
}
