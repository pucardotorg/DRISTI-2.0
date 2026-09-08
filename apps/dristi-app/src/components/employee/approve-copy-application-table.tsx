"use client";

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
  formatCopyApplicationDate,
  type CopyApplication,
} from "@/lib/employee/approve-copy-application";
import { cn } from "@/lib/utils";

/* The same table treatment as the two signing queues, the register queue and the
 * rescheduling queue — header separated by fill rather than a second stroke, rows by
 * hairline, the panel edge as the only full-strength border on the screen (ui-craft
 * §1.1). The classes are restated rather than exported because when the advocate shell
 * moves onto the shared `components/chrome` frame, this treatment is what belongs there,
 * and the court-side tables should collapse onto it together rather than one of them
 * becoming the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The copy-application queue as a table: which applications are picked for acceptance,
 * the application's own number, the case it belongs to, who is asking, when they asked,
 * and what they are asking for.
 *
 * Six columns, in the reference's positions, and selection is the first one — accepting
 * is done in bulk, because a bench clears a counter queue of thirty applications by
 * checking them, not by opening thirty dialogs. `SignFormsTable` and `SignOrdersTable`
 * beside it work the same way for the same reason.
 *
 * **The row is not the click target.** Its sibling review queues open a dialog from
 * anywhere on the row; this one cannot, because the row already owns a checkbox. A row
 * that both selects and opens on the same click has to guess which the bench meant. So
 * the checkbox selects, the application number opens, and nothing else in the row is
 * clickable — the reference's own division, and the reason it underlines that column and
 * no other.
 *
 * **The reference's Status column is gone, and the slot carries the record sought
 * instead** (owner-facing judgement call, made here).
 *
 * The reference shows "Pending Approval" on every row of this list, because this list
 * *is* the pending queue: an application the bench has dealt with leaves it. A column
 * whose every cell reads the same carries no information, and a tinted chip repeating it
 * thirty times down a page spends the one colour ration a row has on a fact the page
 * heading already states (ui-craft §4). `SignFormsTable` drops its status column for
 * exactly this reason.
 *
 * The precedent for keeping it is `SignOrdersTable`, and it does not transfer. That queue
 * earns its Status column two ways this one cannot: it holds already-signed orders
 * alongside pending ones, *and* it carries a status filter to separate them. This screen
 * has neither — one state, one text filter. Keeping the column here would mean inventing
 * the decided rows and the control that finds them again, which is a larger invention
 * than dropping a column that says nothing. What was accepted or rejected is announced in
 * speech instead, and the state of the one application under review is stated once, on
 * the badge in the overlay that reviews it.
 *
 * What took the slot is the fact that actually differs on every row: the record the party
 * is asking for. Two applications in this queue are told apart by whether one wants a
 * judgement and the other one witness's deposition, and until that column existed the
 * bench had to open a dialog to find out.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function ApproveCopyApplicationTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: CopyApplication[];
  selectedIds: ReadonlySet<string>;
  onToggle: (application: CopyApplication) => void;
  /** Select or clear every row currently in view — the header checkbox. */
  onToggleAll: (select: boolean) => void;
  onOpen: (application: CopyApplication) => void;
}) {
  const selectedOnPage = rows.filter((row) => selectedIds.has(row.id)).length;
  const allSelected = rows.length > 0 && selectedOnPage === rows.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means each
            cell paints its own fill, so the radius goes on the end cells rather than the
            row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "w-12")}>
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              /* Names what the control does to what is on screen, not to the whole
                 queue — the header checkbox reaches this page of rows only, and a label
                 that said "all applications" would be a promise the control does not keep
                 once the list is paged. */
              aria-label={
                allSelected
                  ? "Clear the applications on this page"
                  : "Select the applications on this page"
              }
              onCheckedChange={(next) => onToggleAll(next === true)}
            />
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Application number
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Petitioner
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date raised
          </TableHead>
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Copy sought
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
          <td colSpan={6} className="h-2 p-0" />
        </tr>
        {rows.map((application) => {
          const selected = selectedIds.has(application.id);
          return (
            <TableRow
              key={application.id}
              data-state={selected ? "selected" : undefined}
              className="bg-card"
            >
              <TableCell className={cn(cellClass, "w-12")}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(application)}
                  aria-label={`Select ${application.applicationNumber}, ${application.applicant.name}`}
                />
              </TableCell>
              {/* The row's one emphasised cell, and its only opener. Quiet
                  `text-foreground` rather than the reference's teal underline: the teal is
                  rationed for the one strong action on the screen, and thirty underlined
                  teal numbers down a column is not what ui-craft §4 spends it on. The
                  underline arrives on hover and focus, where it is an affordance rather
                  than decoration. */}
              <TableCell
                className={cn(cellClass, "font-medium whitespace-nowrap")}
              >
                <button
                  type="button"
                  onClick={() => onOpen(application)}
                  className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
                >
                  <span className="sr-only">Review </span>
                  {application.applicationNumber}
                </button>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {application.caseNumber}
              </TableCell>
              <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
                {application.applicant.name}
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {formatCopyApplicationDate(application.raisedOn)}
              </TableCell>
              {/* Plain text, not a chip. It is a sentence, not a state, and thirty tinted
                  cells down a column would be decoration (ui-craft §4). */}
              <TableCell className={cn(cellClass, "min-w-64 whitespace-normal")}>
                {application.record.description}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
