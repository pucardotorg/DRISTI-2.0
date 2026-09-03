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
import { causeTitle, counselFor } from "@/lib/employee/hearings";
import {
  otherApplicationStageLabel,
  otherApplicationTypeLabel,
  type OtherApplication,
} from "@/lib/employee/other-applications";
import { cn } from "@/lib/utils";

/* The same table treatment as the day's cause list, the scheduling queue and the
 * delay-condonation queue — header separated by fill rather than a second stroke, rows by
 * hairline, the panel edge as the only full-strength border on the screen (ui-craft §1.1).
 * The classes are restated rather than exported because when the advocate shell moves onto
 * the shared `components/chrome` frame, this treatment is what belongs there, and the
 * court-side tables should collapse onto it together rather than one of them becoming the
 * other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The whole application queue as a table: the cause, its number, where the case has
 * reached, who appears, and what is being asked for.
 *
 * Delay condonation's four columns plus the one this screen exists for. Every absence is
 * the same absence as there. There is no serial — a serial is a position on a day's list
 * and these applications have no day. There is no actions column: this build performs no
 * act on an application, and drawing furniture around a hole is worse than leaving it out
 * until reviewing is real.
 *
 * Application type is plain text, like stage beside it. Fourteen tinted heads down a
 * column is exactly the decoration the craft rules ration colour to prevent — and unlike
 * a status, a type is not something the bench needs to spot at a glance across the page.
 * It is the widest column by some distance, so it takes a floor width and wraps: the two
 * longest heads in the vocabulary run to five words and must not push the table sideways.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function OtherApplicationsTable({ rows }: { rows: OtherApplication[] }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means each
            cell paints its own fill, so the radius goes on the end cells rather than the
            row. */}
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
          <TableHead className={cn(headClass, "min-w-56 whitespace-normal")}>
            Application type
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
          <td colSpan={5} className="h-2 p-0" />
        </tr>
        {rows.map((application) => (
          <TableRow key={application.id} className="bg-card">
            {/* The row's one emphasised cell. Not a link: the reference underlines it
                because it opens a review, and this build has no such overlay and no
                court-side case file to fall back on. Plain text is the honest render — an
                underline that goes nowhere would promise the bench a screen that is not
                there. */}
            <TableCell
              className={cn(cellClass, "min-w-64 font-medium whitespace-normal")}
            >
              {causeTitle(application)}
            </TableCell>
            <TableCell
              className={cn(cellClass, "tabular-nums whitespace-nowrap")}
            >
              {application.caseNumber}
            </TableCell>
            <TableCell className={cn(cellClass, "whitespace-nowrap")}>
              {otherApplicationStageLabel(application.stage)}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
              <CounselCell
                complainant={counselFor(application, "complainant").map(
                  (counsel) => counsel.name,
                )}
                accused={counselFor(application, "accused").map(
                  (counsel) => counsel.name,
                )}
                dense
              />
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-56 whitespace-normal")}>
              {otherApplicationTypeLabel(application.type)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
