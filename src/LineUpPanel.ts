import * as LineUpJS from "lineupjs";
import {
  builder,
  buildCategoricalColumn,
  buildDateColumn,
  buildNumberColumn,
  buildRanking,
  buildStringColumn,
  LineUp,
  Ranking,
} from "lineupjs";
import type { BasesSortConfig } from "obsidian";
import type { ColumnDesc } from "./types";

/**
 * Patch LineUp's MultiLevelCellRenderer.aggregatedIndex to prevent
 * "Cannot read properties of undefined (reading 'r')" crashes when grouping
 * while multi-level/weighted columns have missing or NaN values in a group.
 */
function patchLineUpMultiLevelGroupRenderer(): void {
  const mlProto = (LineUpJS as unknown as { rendererClasses?: { MultiLevelCellRenderer?: { prototype: { aggregatedIndex: unknown } } } })
    ?.rendererClasses?.MultiLevelCellRenderer?.prototype;
  if (!mlProto || typeof mlProto.aggregatedIndex !== "function") return;

  const origAggregatedIndex = mlProto.aggregatedIndex as (
    this: unknown,
    rows: { forEach?: (cb: (row: unknown, idx: number) => void) => void },
    col: unknown
  ) => { index: number; row: unknown };

  mlProto.aggregatedIndex = function (this: unknown, rows: { forEach?: (cb: (row: unknown, idx: number) => void) => void }, col: unknown) {
    try {
      const res = origAggregatedIndex.call(this, rows, col);
      if (res && res.row !== undefined) {
        return res;
      }
    } catch {
      // LineUp's internal medianIndex throws when all group rows evaluate to NaN
    }
    let firstRow: unknown = null;
    let firstIdx = 0;
    if (rows && typeof rows.forEach === "function") {
      rows.forEach((r: unknown, i: number) => {
        if (!firstRow) {
          firstRow = r;
          firstIdx = i;
        }
      });
    }
    return { index: firstIdx, row: firstRow };
  };
}
patchLineUpMultiLevelGroupRenderer();

/**
 * LineUp table builder and DOM wrapper for Obsidian.
 * Encapsulates lineupjs initialization, sorting, resize observation, and side panel controls.
 */
export class LineUpPanel {
  private instance: LineUp | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private autoScrollAnimId: number | null = null;
  private autoScrollVelocity = 0;
  private abortController: AbortController | null = null;
  private changeTimer: number | null = null;

  constructor(
    private container: HTMLElement,
    private rows: Array<Record<string, unknown>>,
    private columns: ColumnDesc[]
  ) {}

  build(basesSort?: BasesSortConfig[], savedDump?: unknown, defaultCollapsed = false): LineUp {
    const b = builder(this.rows);
    for (const col of this.columns) {
      b.column(buildColumn(col, this.rows));
    }
    if (savedDump) {
      try {
        b.restore(savedDump);
      } catch (err) {
        console.warn("[obsidian-lineup] failed to restore lineup layout", err);
        this.applySort(b, basesSort);
      }
    } else {
      this.applySort(b, basesSort);
    }
    this.instance = b.build(this.container);
    this.removeCollapsers();
    this.addPanelToggle();
    if (defaultCollapsed) {
      this.toggleSidePanel(true);
    }
    this.setupDragAutoScroll();

    this.resizeObserver = new ResizeObserver(() => {
      this.instance?.update();
      this.removeCollapsers();
    });
    this.resizeObserver.observe(this.container);

    // Schedule update so LineUp calculates exact dimensions after mounting in DOM
    requestAnimationFrame(() => {
      this.removeCollapsers();
      this.instance?.update();
    });

    return this.instance;
  }

  wireSelection(onSelect: (row: Record<string, unknown>) => void): void {
    this.instance?.on(LineUp.EVENT_SELECTION_CHANGED, (sel: number[]) => {
      if (sel?.length === 1 && this.rows[sel[0]]) {
        onSelect(this.rows[sel[0]]);
      }
    });
  }

  update(): void {
    this.removeCollapsers();
    this.instance?.update();
  }

  private removeCollapsers(): void {
    this.container.querySelectorAll(".lu-collapser").forEach((el) => el.remove());
  }

  private applySort(b: ReturnType<typeof builder>, basesSort?: BasesSortConfig[]): void {
    if (!basesSort?.length) {
      b.defaultRanking();
      return;
    }
    try {
      const colIds = new Set(this.columns.map((c) => c.id));
      const rb = buildRanking();
      rb.supportTypes().allColumns().rank();
      for (const s of basesSort) {
        let prop = s.property as string;
        if (!colIds.has(prop)) {
          if (prop.startsWith("note.") && colIds.has(prop.slice(5))) {
            prop = prop.slice(5);
          } else if (colIds.has(`note.${prop}`)) {
            prop = `note.${prop}`;
          }
        }
        if (colIds.has(prop)) {
          rb.sortBy(prop, s.direction === "ASC" ? "asc" : "desc");
        }
      }
      b.ranking(rb);
    } catch (e) {
      console.warn("[obsidian-lineup] failed to apply bases sort", e);
      b.defaultRanking();
    }
  }

  /**
   * Accessible toggle button to expand/collapse LineUp's ranking/filter panel.
   */
  private addPanelToggle(): void {
    if (this.container.querySelector(":scope > .obsidian-lineup-panel-toggle")) return;

    const toggle = document.createElement("button");
    toggle.className = "obsidian-lineup-panel-toggle";
    toggle.type = "button";
    toggle.textContent = "»";
    toggle.setAttribute("aria-label", "Toggle side panel");
    toggle.setAttribute("title", "Collapse side panel");
    toggle.setAttribute("aria-expanded", "true");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleSidePanel();
    });

    this.container.appendChild(toggle);
  }

  toggleSidePanel(forceCollapse?: boolean): void {
    const aside =
      this.container.querySelector<HTMLElement>(":scope > .lu-side-panel") ??
      this.container.querySelector<HTMLElement>("aside");
    const toggle = this.container.querySelector<HTMLElement>(":scope > .obsidian-lineup-panel-toggle");
    const collapsed =
      forceCollapse !== undefined
        ? this.container.classList.toggle("lu-panel-collapsed", forceCollapse)
        : this.container.classList.toggle("lu-panel-collapsed");
    if (aside) aside.style.display = collapsed ? "none" : "";
    if (toggle) {
      toggle.textContent = collapsed ? "«" : "»";
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("title", collapsed ? "Expand side panel" : "Collapse side panel");
    }
    this.removeCollapsers();
    this.instance?.update();
  }

  /**
   * Automatically scroll horizontally when dragging a column header near the edges.
   */
  private setupDragAutoScroll(): void {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const stop = (): void => {
      this.autoScrollVelocity = 0;
      if (this.autoScrollAnimId !== null) {
        cancelAnimationFrame(this.autoScrollAnimId);
        this.autoScrollAnimId = null;
      }
    };

    const step = (): void => {
      if (this.autoScrollVelocity !== 0) {
        const body = this.container.querySelector<HTMLElement>(".le-body");
        const header = this.container.querySelector<HTMLElement>(".le-header");
        if (body) {
          body.scrollLeft += this.autoScrollVelocity;
          if (header) header.scrollLeft = body.scrollLeft;
        }
        this.autoScrollAnimId = requestAnimationFrame(step);
      } else {
        this.autoScrollAnimId = null;
      }
    };

    this.container.addEventListener(
      "dragover",
      (e: DragEvent) => {
        const isColDragging =
          this.container.querySelector(".lu-dragging-column, .lu-dragging") !== null ||
          e.dataTransfer?.types?.some((t) => t.includes("lineup-column"));
        if (!isColDragging) {
          stop();
          return;
        }

        const body = this.container.querySelector<HTMLElement>(".le-body");
        const header = this.container.querySelector<HTMLElement>(".le-header");
        const scroller = header ?? body;
        if (!scroller) return;

        const rect = scroller.getBoundingClientRect();
        const threshold = 60;
        const maxSpeed = 16;

        if (e.clientX <= rect.left + threshold && e.clientX >= rect.left - 50) {
          const ratio = Math.min(1, Math.max(0, (rect.left + threshold - e.clientX) / threshold));
          this.autoScrollVelocity = -Math.max(2, Math.round(ratio * maxSpeed));
          if (this.autoScrollAnimId === null) {
            this.autoScrollAnimId = requestAnimationFrame(step);
          }
        } else if (e.clientX >= rect.right - threshold && e.clientX <= rect.right + 50) {
          const ratio = Math.min(1, Math.max(0, (e.clientX - (rect.right - threshold)) / threshold));
          this.autoScrollVelocity = Math.max(2, Math.round(ratio * maxSpeed));
          if (this.autoScrollAnimId === null) {
            this.autoScrollAnimId = requestAnimationFrame(step);
          }
        } else {
          stop();
        }
      },
      { signal }
    );

    this.container.addEventListener("dragend", stop, { signal });
    this.container.addEventListener("drop", stop, { signal });
    this.container.addEventListener(
      "dragleave",
      (e: DragEvent) => {
        if (!this.container.contains(e.relatedTarget as Node)) {
          stop();
        }
      },
      { signal }
    );

    const doc = this.container.ownerDocument;
    if (doc) {
      doc.addEventListener("dragend", stop, { signal });
      doc.addEventListener("drop", stop, { signal });
    }
  }

  /**
   * Listen for ranking/column additions, removals, and moves with debouncing.
   */
  wireChange(onChange: (dump: unknown) => void): void {
    const trigger = (): void => {
      if (this.changeTimer !== null) window.clearTimeout(this.changeTimer);
      this.changeTimer = window.setTimeout(() => {
        this.changeTimer = null;
        if (this.instance) {
          onChange(this.instance.dump());
        }
      }, 500);
    };

    const data = this.instance?.data;
    if (!data) return;

    data.on(
      [
        Ranking.EVENT_ADD_COLUMN,
        Ranking.EVENT_REMOVE_COLUMN,
        Ranking.EVENT_MOVE_COLUMN,
        Ranking.EVENT_DIRTY_HEADER,
        Ranking.EVENT_ORDER_CHANGED,
      ],
      trigger
    );
  }

  flushChange(): unknown | null {
    return this.instance ? this.instance.dump() : null;
  }

  setData(rows: Array<Record<string, unknown>>): void {
    this.rows = rows;
    if (this.instance?.data && "setData" in this.instance.data) {
      (this.instance.data as { setData: (data: unknown[]) => void }).setData(rows);
    }
  }

  getColumns(): ColumnDesc[] {
    return this.columns;
  }

  destroy(): void {
    if (this.changeTimer !== null) {
      window.clearTimeout(this.changeTimer);
      this.changeTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
    if (this.autoScrollAnimId !== null) {
      cancelAnimationFrame(this.autoScrollAnimId);
      this.autoScrollAnimId = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.instance?.destroy();
    this.instance = null;
    this.container.empty();
  }
}

/** Map inferred ColumnDesc to lineupjs column builders. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildColumn(col: ColumnDesc, data: Array<Record<string, unknown>>): any {
  try {
    if (col.type === "number") {
      const nb = buildNumberColumn(col.id, col.domain);
      if (col.label) nb.label(col.label);
      if (col.color) nb.color(col.color);
      if (col.width) nb.width(col.width);
      return nb.build(data);
    }
    if (col.type === "categorical") {
      const cats = col.categories ?? [...new Set(data.map((r) => r[col.id]).filter((v) => v != null).map(String))];
      const cb = buildCategoricalColumn(col.id, cats);
      if (col.label) cb.label(col.label);
      if (col.color) cb.color(col.color);
      if (col.width) cb.width(col.width);
      return cb.build(data);
    }
    if (col.type === "date") {
      const db = buildDateColumn(col.id);
      if (col.label) db.label(col.label);
      if (col.width) db.width(col.width);
      return db.build(data);
    }
    const sb = buildStringColumn(col.id);
    if (col.label) sb.label(col.label);
    if (col.width) sb.width(col.width);
    return sb.build(data);
  } catch {
    return { type: col.type, column: col.id, label: col.label };
  }
}
