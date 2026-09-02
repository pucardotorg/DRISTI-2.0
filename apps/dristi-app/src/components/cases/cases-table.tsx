"use client";

import * as React from "react";

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
  type TableColumnId,
} from "@/lib/cases/table-columns";
import { partiesLabel, type BucketKey, type CaseRecord, type CasesView } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

import { BookmarkButton } from "./bookmark-button";
import { CaseField } from "./case-field";
import { CasesStageColumnFilter } from "./cases-stage-column-filter";
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
 * Headers drag to reorder. The columns menu (next to Folders/List) also
 * shows, hides, and reorders; reset restores both. Bookmark stays on the row.
 */
export function CasesTable({
  rows,
  bookmarks,
  onToggleBookmark,
  stageFilter,
  hideStage = false,
  hideLongPendingFlag = false,
}: {
  rows: CaseRecord[];
  bookmarks: ReadonlySet<string>;
  onToggleBookmark: (id: string) => void;
  stageFilter?: {
    view: CasesView;
    value: BucketKey[];
    onChange: (stage: BucketKey[]) => void;
  };
  hideStage?: boolean;
  hideLongPendingFlag?: boolean;
}) {
  const { isVisible, order, reorder, shift } = useCasesTableColumns();
  const { record: openRecord } = useCasePeek();
  const { selected, toggle, enabled: selectable } = useCasesSelection();
  const columns = listTableColumns(isVisible, { hideStage, order });
  const columnCount = columns.length + (selectable ? 1 : 0) + 1;
  const [dragging, setDragging] = React.useState<TableColumnId | null>(null);
  const [over, setOver] = React.useState<TableColumnId | null>(null);

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

  function onDragOver(
    event: React.DragEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOver(id);
  }

  function onDrop(
    event: React.DragEvent<HTMLTableCellElement>,
    id: TableColumnId
  ) {
    event.preventDefault();
    const from = event.dataTransfer.getData("text/plain");
    if (isTableColumnId(from)) reorder(from, id, { hideStage });
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
        Drag a column header to change its order, or open the columns menu to
        show, hide, and reorder with the arrows. With a header focused, press
        Alt and Left arrow or Alt and Right arrow to move it. Reset columns from
        the columns menu.
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
          <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
            {selectable ? (
              <TableHead className={cn(headClass, "w-10 px-1")}>
                <span className="sr-only">Select</span>
              </TableHead>
            ) : null}
            {columns.map((column) => {
              const stageFilterHead = column.id === "stage" && stageFilter;
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
                    stageFilterHead && "px-2 py-0",
                    COLUMN_WIDTH[column.id],
                    "cursor-grab select-none text-left active:cursor-grabbing",
                    dragging === column.id && "opacity-50",
                    over === column.id &&
                      dragging &&
                      dragging !== column.id &&
                      "bg-accent"
                  )}
                >
                  {stageFilterHead ? (
                    <div className="flex h-10 items-center">
                      {column.label}
                      <CasesStageColumnFilter
                        view={stageFilter.view}
                        value={stageFilter.value}
                        onChange={stageFilter.onChange}
                      />
                    </div>
                  ) : (
                    column.label
                  )}
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
