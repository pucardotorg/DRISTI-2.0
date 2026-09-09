"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  isTableColumnId,
  listTableColumns,
  type DropSide,
  type TableColumnId,
} from "@/lib/cases/table-columns";
import { partiesLabel, type CaseRecord } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

import { BookmarkButton } from "./bookmark-button";
import { CaseField } from "./case-field";
import { useCasePeek } from "./use-case-peek";
import { useCasesSelection } from "./use-cases-selection";
import { useCasesTableColumns } from "./use-cases-table-columns";

/* Header separates by fill, not a second stroke; rows by hairline. The panel edge
 * is the only full-strength `border-border` on the table (ui-craft §1.1). Matches
 * the pending-tasks table, which is the reference for surface and row state. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/** Keep scannable fields on one line. Case name (and long notes) wrap, but
 *  only after a floor width so extra columns scroll instead of stacking. */
const COLUMN_WIDTH: Record<TableColumnId, string> = {
  caseNumber: "whitespace-nowrap",
  caseName: "min-w-64 whitespace-normal",
  advocates: "whitespace-nowrap",
  representation: "whitespace-nowrap",
  access: "whitespace-nowrap",
  stage: "whitespace-nowrap",
  nextHearing: "whitespace-nowrap",
  hearingPurpose: "min-w-48 whitespace-normal",
  previousHearing: "whitespace-nowrap",
  latestUpdate: "min-w-48 whitespace-normal",
};

const COLUMNS_HINT_ID = "cases-table-columns-hint";

/**
 * Default scan: Case number · Case name · Stage · advocates by side · Next
 * hearing · Bookmark. A folder drops Stage — the folder is that value.
 * Headers drag to reorder, and each heading carries a grip so the drag is
 * visible rather than a secret; the columns menu (beside Folders/List) shows
 * and hides, and reset restores both. Filtering lives in the Filters sheet,
 * not in a column header. Bookmark stays on the row.
 */
/** How close to the scroller's edge a drag has to be before it scrolls, and how fast. */
const AUTOSCROLL_EDGE = 64;
const AUTOSCROLL_STEP = 24;

export function CasesTable({
  rows,
  allIds,
  bookmarks,
  onToggleBookmark,
  hideStage = false,
  hideLongPendingFlag = false,
}: {
  rows: CaseRecord[];
  /** Every matched case across all pages — what the header checkbox selects. */
  allIds: string[];
  bookmarks: ReadonlySet<string>;
  onToggleBookmark: (id: string) => void;
  hideStage?: boolean;
  hideLongPendingFlag?: boolean;
}) {
  const { isVisible, order, reorder, shift } = useCasesTableColumns();
  const { record: openRecord } = useCasePeek();
  const { selected, toggle, setMany, enabled: selectable } = useCasesSelection();
  const columns = listTableColumns(isVisible, { hideStage, order });
  const columnCount = columns.length + (selectable ? 1 : 0) + 1;
  const [dragging, setDragging] = React.useState<TableColumnId | null>(null);
  /* Where the dragged column would land: which header, and which edge of it. The
     edge is drawn as a line so the drop is never a guess (owner, Sept 9). */
  const [over, setOver] = React.useState<{ id: TableColumnId; side: DropSide } | null>(
    null
  );

  /* The header checkbox speaks for every matched case, not just the page in view:
     all of them ticked, none, or some (indeterminate). Ticking it selects the whole
     list; unticking clears it. */
  const selectedOfAll = allIds.filter((id) => selected.has(id)).length;
  const allState: boolean | "indeterminate" =
    selectedOfAll === 0
      ? false
      : selectedOfAll === allIds.length
        ? true
        : "indeterminate";

  function onDragStart(
    event: React.DragEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    if (
      (event.target as HTMLElement).closest(
        "button, [role='menu'], input, a"
      )
    ) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
    setDragging(id);
  }

  /**
   * Native drag-and-drop does not scroll a container for you. While a header is being
   * dragged near either edge of the table's own scroller, nudge it — so a column can
   * be carried from the far right to the far left of a table wider than the screen.
   * `dragover` fires continuously while the pointer is held, so a small step per
   * event reads as a steady scroll.
   */
  function autoScroll(event: React.DragEvent<HTMLElement>) {
    const scroller = (event.currentTarget as HTMLElement).closest<HTMLElement>(
      '[data-slot="table-container"]'
    );
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    if (event.clientX < rect.left + AUTOSCROLL_EDGE) {
      scroller.scrollLeft -= AUTOSCROLL_STEP;
    } else if (event.clientX > rect.right - AUTOSCROLL_EDGE) {
      scroller.scrollLeft += AUTOSCROLL_STEP;
    }
  }

  function onDragOver(
    event: React.DragEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const side: DropSide =
      event.clientX < rect.left + rect.width / 2 ? "before" : "after";
    setOver((current) =>
      current?.id === id && current.side === side ? current : { id, side }
    );
  }

  function onDrop(
    event: React.DragEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    event.preventDefault();
    const from = event.dataTransfer.getData("text/plain");
    if (isTableColumnId(from)) {
      reorder(from, id, { hideStage, side: over?.id === id ? over.side : undefined });
    }
    setDragging(null);
    setOver(null);
  }

  function onDragEnd() {
    setDragging(null);
    setOver(null);
  }

  function onHeaderKeyDown(
    event: React.KeyboardEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    if (!event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shift(id, -1, { hideStage });
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      shift(id, 1, { hideStage });
    }
  }

  /* Shell (border / bg-card) lives on the list page so the table is one panel. */
  return (
    <>
      <p id={COLUMNS_HINT_ID} className="sr-only">
        Drag a column header by its handle to change its order. With a header
        focused, press Alt and Left arrow or Alt and Right arrow to move it. Show,
        hide, or reset columns from the columns menu.
      </p>
      <Table
        className="w-full border-separate border-spacing-0 text-body-compact"
        aria-describedby={COLUMNS_HINT_ID}
      >
        <TableHeader>
          {/* The panel insets this table by p-6, so the header strip is a well, not a
              full-bleed band — it rounds itself (ui-craft §4). The tasks table gets the
              same corners from its Card's `overflow-clip`, having no inset to answer to.
              `border-separate` means each cell paints its own fill, so the radius goes on
              the end cells rather than the row. */}
          <TableRow
            className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg"
            onDragOver={dragging ? autoScroll : undefined}
          >
            {selectable ? (
              <TableHead className={cn(headClass, "w-10 px-1")}>
                <div className="flex justify-center">
                  <Checkbox
                    checked={allState}
                    onCheckedChange={(checked) =>
                      setMany(allIds, checked === true)
                    }
                    aria-label={
                      allState === true
                        ? `Clear the selection of all ${allIds.length} cases`
                        : `Select all ${allIds.length} cases`
                    }
                  />
                </div>
              </TableHead>
            ) : null}
            {columns.map((column) => {
              const landing =
                dragging && dragging !== column.id && over?.id === column.id
                  ? over.side
                  : null;
              return (
              <TableHead
                key={column.id}
                draggable
                tabIndex={0}
                aria-grabbed={dragging === column.id || undefined}
                onDragStart={(event) => onDragStart(event, column.id)}
                onDragOver={(event) => onDragOver(event, column.id)}
                onDrop={(event) => onDrop(event, column.id)}
                onDragEnd={onDragEnd}
                onKeyDown={(event) => onHeaderKeyDown(event, column.id)}
                className={cn(
                  headClass,
                  COLUMN_WIDTH[column.id],
                  "relative cursor-grab select-none text-left active:cursor-grabbing",
                  dragging === column.id && "opacity-50"
                )}
              >
                {/* The landing line: a brand-accent rule on the edge the column will
                    take, the same mark the active tab underline uses. */}
                {landing ? (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-y-1 z-10 w-0.5 rounded-full bg-brand-accent",
                      landing === "before" ? "-left-px" : "-right-px"
                    )}
                  />
                ) : null}
                {/* The grip says "this moves" — the whole heading is the handle, the
                    icon is the sign. Decorative, so it inherits the muted heading
                    colour and stays out of the accessibility tree; the sr-only hint
                    above carries the instruction. */}
                <span className="flex items-center gap-1.5">
                  <GripVerticalIcon
                    aria-hidden
                    className="-ml-1 size-3.5 shrink-0 text-muted-foreground"
                  />
                  {column.label}
                </span>
              </TableHead>
              );
            })}
            <TableHead
              className={cn(
                headClass,
                "sticky right-0 z-20 w-12 bg-surface-sunken px-1"
              )}
            >
              <span className="sr-only">Bookmark</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        {/* `border-separate` (needed by the sticky bookmark column) puts the row
            stroke on the cell, so the DS TableBody rule that clears the last row
            targets the wrong element. Reach the cells directly, or the final row
            doubles its line against the panel edge. */}
        <TableBody className="[&_tr:last-child_td]:border-b-0">
          {/* The header is a well, not a band welded to the rows — it needs the
              panel's fill under it or its rounded bottom corners read as cut off
              (ui-craft §4). `border-separate` has no per-edge row gap and
              `border-spacing-y` would space every row, so the gap is one inert
              row, held out of the accessibility tree. */}
          <tr aria-hidden="true">
            <td colSpan={columnCount} className="h-2 p-0" />
          </tr>
          {rows.map((record) => (
            <TableRow
              key={record.id}
              className={cn(
                "relative bg-card",
                openRecord?.id === record.id &&
                  !selected.has(record.id) &&
                  "bg-accent"
              )}
              data-state={selected.has(record.id) ? "selected" : undefined}
              aria-current={openRecord?.id === record.id ? "true" : undefined}
            >
              {selectable ? (
                <TableCell className={cn(cellClass, "w-10 px-1")}>
                  {/* z-10 lifts the control above the case-number button's
                      `after:inset-0` overlay, so a click selects instead of
                      opening the peek. */}
                  <div
                    className="relative z-10 flex justify-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.has(record.id)}
                      onCheckedChange={() => toggle(record.id)}
                      aria-label={`Select ${partiesLabel(record)}`}
                    />
                  </div>
                </TableCell>
              ) : null}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(cellClass, COLUMN_WIDTH[column.id])}
                >
                  <CaseField
                    record={record}
                    id={column.id}
                    presentation="table"
                    hideLongPendingFlag={hideLongPendingFlag}
                  />
                </TableCell>
              ))}
              <TableCell
                className={cn(
                  cellClass,
                  "sticky right-0 z-20 w-12 bg-inherit px-1"
                )}
              >
                <div className="flex justify-center">
                  <BookmarkButton
                    caseLabel={partiesLabel(record)}
                    bookmarked={bookmarks.has(record.id)}
                    onToggle={() => onToggleBookmark(record.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
