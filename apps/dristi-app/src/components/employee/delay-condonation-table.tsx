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
 * And there is no actions column. The day's cause list keeps its row menu
 * because the acts it holds are things a bench does to a listed matter. Here
 * there is nothing to put in one: this build performs no condonation act, and
 * the screenshot of the overlay that would open a row was not supplied. Better
 * to leave the column out until reviewing is real than to draw furniture
 * around a hole.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so
 * the table is one panel rather than a box inside a box.
 */
export function DelayCondonationTable({
  rows,
}: {
  rows: DelayCondonationCase[];
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
          <TableRow key={matter.id} className="bg-card">
            {/* The row's one emphasised cell. Not a link: the reference
                underlines it because it opens a review, and this build has no
                such overlay and no court-side case file to fall back on. Plain
                text is the honest render — an underline that goes nowhere
                would promise the clerk a screen that is not there. */}
            <TableCell
              className={cn(
                cellClass,
                "min-w-64 font-medium whitespace-normal",
              )}
            >
              {causeTitle(matter)}
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
