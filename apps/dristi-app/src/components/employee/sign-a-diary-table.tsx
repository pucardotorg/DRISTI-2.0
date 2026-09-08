"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatADiaryDate,
  type ADiaryEntry,
} from "@/lib/employee/sign-a-diary";
import { cn } from "@/lib/utils";

/* The same table treatment as the two signing queues above it in the rail, the register
 * queue and the review queues — header separated by fill rather than a second stroke, rows
 * by hairline, the panel edge as the only full-strength border on the screen (ui-craft
 * §1.1). The classes are restated rather than exported because when the advocate shell
 * moves onto the shared `components/chrome` frame, this treatment is what belongs there,
 * and the court-side tables should collapse onto it together rather than one of them
 * becoming the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-top text-left text-body-compact";

/**
 * One day of the A-Diary as a table: the case, what the court did, and when it comes
 * back.
 *
 * Three columns, the reference's own, and the narrowest table on the court side. It reads
 * that way because the register itself does: a diary is not a list of cases with facts
 * hung off them, it is a list of *what was done*, and the business of the day is the row.
 * So the business takes the width, carries the row's emphasis and is the only opener —
 * the cause title, the stage, who appeared and the rest of the case's particulars are in
 * the entry the bench opens, where they are read once rather than scanned down a column.
 *
 * **The cause title is not a fourth column here**, though every other court-side queue
 * leads with it. The bench is signing its own day: the number is the register's index
 * and the business is what it is checking, and a party name between them would push the
 * one cell that matters off the right of a laptop. It heads the entry dialog instead.
 *
 * **The business is clamped to two lines, not truncated away.** A day's proceedings run
 * to a paragraph, and a column that grew to fit the longest one would leave four
 * one-line rows floating in it. The full text is in the button's accessible name and in
 * the entry the button opens, so nothing is only available to a sighted reader who can
 * hover (ACCESSIBILITY §7, §10).
 *
 * Cells align to the top rather than the middle, which is the one place this table
 * departs from the shared treatment: a number centred against a two-line paragraph
 * floats, and a register is read across its first line.
 *
 * There is no actions column and no row menu. Signing is the act, it lives on the entry
 * the row opens, and drawing a kebab for it would be furniture around a hole.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function SignADiaryTable({
  rows,
  onOpen,
}: {
  rows: ADiaryEntry[];
  onOpen: (entry: ADiaryEntry) => void;
}) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means each
            cell paints its own fill, so the radius goes on the end cells rather than the
            row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-80 whitespace-normal")}>
            Proceedings / business of the day
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Next hearing date
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header well needs each
          cell to paint its own fill for the end cells to round (above). It puts the row
          stroke on the cell, so the DS TableBody rule that clears the last row targets the
          wrong element. Reach the cells directly, or the final row doubles its line
          against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's fill
            under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held out
            of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={3} className="h-2 p-0" />
        </tr>
        {rows.map((entry) => (
          <TableRow key={entry.id} className="bg-card">
            <TableCell
              className={cn(cellClass, "tabular-nums whitespace-nowrap")}
            >
              {entry.caseNumber}
            </TableCell>
            {/* The row's one emphasised cell, and its only opener. Quiet
                `text-foreground` rather than the reference's teal underline: the teal is
                rationed for the one strong action on the screen, and a column of
                underlined teal paragraphs is not what ui-craft §4 spends it on. The
                underline arrives on hover and focus, where it is an affordance rather
                than decoration. */}
            <TableCell className={cn(cellClass, "min-w-80 whitespace-normal")}>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
              >
                <span className="sr-only">
                  Read and sign the entry in {entry.caseNumber}.{" "}
                </span>
                <span className="line-clamp-2">{entry.business}</span>
              </button>
            </TableCell>
            <TableCell
              className={cn(cellClass, "tabular-nums whitespace-nowrap")}
            >
              {formatADiaryDate(entry.nextHearing)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
