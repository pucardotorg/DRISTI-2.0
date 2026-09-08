"use client";

import { CounselCell } from "@/components/employee/counsel-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  delayCondonationStageLabel,
  type DelayCondonationCase,
} from "@/lib/employee/delay-condonation";
import { causeTitle, counselFor } from "@/lib/employee/hearings";
import { cn } from "@/lib/utils";

/* The same table treatment as the day's cause list and the scheduling queue —
 * header separated by fill rather than a second stroke, rows by hairline, the
 * panel edge as the only full-strength border on the screen (ui-craft §1.1).
 * The classes are restated rather than exported because when the advocate
 * shell moves onto the shared `components/chrome` frame, this treatment is
 * what belongs there, and the court-side tables should collapse onto it
 * together rather than one of them becoming the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The delay-condonation queue as a table: the cause, its number, where the
 * case has reached, and who appears.
 *
 * Four columns, and every absence is deliberate. There is no serial — a
 * serial is a position on a day's list and these applications have no day.
 * Stage is plain text rather than a chip for the reason the craft rules
 * ration colour — seven tinted stages down a column is decoration.
 *
 * And there is still no actions column. The review overlay the cause title
 * opens is where the bench answers, so a row does not also need buttons: the
 * underlined name is the one target, the way the rescheduling queue and seven
 * other court queues already work.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so
 * the table is one panel rather than a box inside a box.
 */
export function DelayCondonationTable({
  rows,
  onOpen,
}: {
  rows: DelayCondonationCase[];
  onOpen: (matter: DelayCondonationCase) => void;
}) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well,
            not a full-bleed band — it rounds itself (ui-craft §4).
            `border-separate` means each cell paints its own fill, so the
            radius goes on the end cells rather than the row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Stage
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Advocates
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header
          well needs each cell to paint its own fill for the end cells to round
          (above). It puts the row stroke on the cell, so the DS TableBody rule
          that clears the last row targets the wrong element. Reach the cells
          directly, or the final row doubles its line against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the
            panel's fill under it or its rounded bottom corners read as cut
            off (ui-craft §4). `border-separate` has no per-edge row gap, so
            the gap is one inert row held out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={4} className="h-2 p-0" />
        </tr>
        {rows.map((matter) => (
          <TableRow key={matter.id} className="bg-card hover:bg-card">
            {/* The row's one emphasised cell, and its opener. The name keeps
                the court's quiet dress — no teal — and earns its underline on
                hover and focus, where a pointer or a keyboard has actually
                asked. The teal link colour is the citizen side's, for an
                action inline in prose; a court queue is thirty rows of data
                and rations it. */}
            <TableCell
              className={cn(
                cellClass,
                "min-w-64 font-medium whitespace-normal",
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(matter)}
                className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
              >
                <span className="sr-only">Review </span>
                {causeTitle(matter)}
              </button>
            </TableCell>
            <TableCell
              className={cn(cellClass, "tabular-nums whitespace-nowrap")}
            >
              {matter.caseNumber}
            </TableCell>
            <TableCell className={cn(cellClass, "whitespace-nowrap")}>
              {delayCondonationStageLabel(matter.stage)}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
              <CounselCell
                complainant={counselFor(matter, "complainant").map(
                  (counsel) => counsel.name,
                )}
                accused={counselFor(matter, "accused").map(
                  (counsel) => counsel.name,
                )}
                dense
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
