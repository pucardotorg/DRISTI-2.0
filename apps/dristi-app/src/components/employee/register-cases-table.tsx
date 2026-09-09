"use client";

import Link from "next/link";

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
  formatDaysWaiting,
  type RegisterCase,
} from "@/lib/employee/register-cases";
import { cn } from "@/lib/utils";

/* The same table treatment as the day's cause list and the scheduling queue —
 * header separated by fill rather than a second stroke, rows by hairline, the panel
 * edge as the only full-strength border on the screen (ui-craft §1.1). The classes
 * are restated rather than exported because when the advocate shell moves onto the
 * shared `components/chrome` frame, this treatment is what belongs there, and the
 * court-side tables should collapse onto it together rather than one of them becoming
 * the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * A complaint's cause title, as the way into its file.
 *
 * The exact sibling of the cause list's `HearingCaseLink`, and it wears the same
 * quiet-name dress: the name itself is the control, underlined on hover and focus
 * rather than painted, so a column of thirty-five of them is not a column of links
 * shouting. An anchor and not a button — this navigates, and a destination has to
 * survive a middle click, a new tab and the back button (`ACCESSIBILITY.md` §2).
 *
 * The caller supplies the box, because the table wants the cell filled as a 40×40
 * target and the phone list wants it inline. Only the box is theirs.
 */
export function RegisterCaseLink({
  matter,
  className,
}: {
  matter: RegisterCase;
  className?: string;
}) {
  return (
    <Link
      href={`/employee/register-cases/${matter.id}`}
      className={cn(
        "rounded-sm text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline",
        className,
      )}
    >
      {/* Under a column headed "Case name" the cause title is the whole of what a
          sighted reader needs; out of that column it is a link named after two
          parties and nothing else. */}
      <span className="sr-only">Complaint from </span>
      {causeTitle(matter)}
    </Link>
  );
}

/**
 * The register queue as a table: the cause, its number, who appears, and how long
 * the complaint has been waiting.
 *
 * Four columns, and every absence is deliberate. There is no serial — a serial is a
 * position on a day's list and these complaints have no day yet. There is no status
 * chip: a row in this queue is in exactly one state, waiting, so a column repeating
 * that on every row would carry no information.
 *
 * And there is still no actions column. The day's cause list keeps its row menu because
 * the acts it holds are things a bench does to a listed matter. Here there is nothing to
 * put in one: this build performs no registration act, so a menu would be an empty
 * affordance. Better to leave the column out until registering is real than to draw
 * furniture around a hole. The *decisions* on a complaint live at the foot of its own
 * file, where the clerk has just read the thing they are deciding about — see
 * `case-review-screen.tsx`.
 *
 * The cause title, though, is now a link. It stopped being one of the reference's
 * broken promises the moment the file behind it existed
 * (`/employee/register-cases/<id>`), and a queue whose rows cannot be opened is a
 * queue that can only be counted.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the
 * table is one panel rather than a box inside a box.
 */
export function RegisterCasesTable({ rows }: { rows: RegisterCase[] }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means
            each cell paints its own fill, so the radius goes on the end cells rather
            than the row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Advocates
          </TableHead>
          <TableHead
            className={cn(headClass, "whitespace-nowrap text-right")}
          >
            Days since submitted
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header well needs
          each cell to paint its own fill for the end cells to round (above). It puts
          the row stroke on the cell, so the DS TableBody rule that clears the last
          row targets the wrong element. Reach the cells directly, or the final row
          doubles its line against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's
            fill under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={4} className="h-2 p-0" />
        </tr>
        {/* The DS `TableRow` ships `hover:bg-accent`, and `accent` is the
            transient-hover role — a fill that says something under the pointer is
            live. Something is: the cause title opens the complaint's file, so the
            hover is now telling the truth and is left alone. It used to be cancelled
            back to `bg-card` precisely because this queue had no opener. `bg-card`
            sits in a different merge group and does not touch it either way. */}
        {rows.map((matter) => (
          <TableRow key={matter.id} className="bg-card">
            <TableCell
              className={cn(cellClass, "min-w-64 whitespace-normal")}
            >
              {/* Fills the cell so the target is the row's height rather than the
                  20px line box the text happens to occupy (`ACCESSIBILITY.md` §8).
                  `flex`, not `inline-flex`: an inline box would shrink-wrap and
                  fight the cell's `whitespace-normal` wrapping. */}
              <RegisterCaseLink
                matter={matter}
                className="flex min-h-10 w-full items-center"
              />
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {matter.caseNumber}
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
            {/* The wait is the column's fact. `warning-ink` is the DS token for that
                rust the reference painted — status text on a neutral ground, never a
                fill. The number is the encoding; the colour agrees with it
                (ACCESSIBILITY §3). Right-aligned because it is a compared number. */}
            <TableCell
              className={cn(
                cellClass,
                "text-right tabular-nums whitespace-nowrap text-warning-ink",
              )}
            >
              {formatDaysWaiting(matter.daysSinceSubmitted)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
