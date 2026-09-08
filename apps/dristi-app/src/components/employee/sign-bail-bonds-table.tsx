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
import { causeTitle } from "@/lib/employee/hearings";
import { type SignBailBond } from "@/lib/employee/sign-bail-bonds";
import { cn } from "@/lib/utils";

/* The same table treatment as the signing queues for forms and orders, the register
 * queue and the rescheduling queue — header separated by fill rather than a second
 * stroke, rows by hairline, the panel edge as the only full-strength border on the
 * screen (ui-craft §1.1). The classes are restated rather than exported for the reason
 * `SignOrdersTable` restates them: when the court-side tables collapse onto a shared
 * frame they should do it together, rather than one of them quietly becoming the
 * others' parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The signing queue for bail bonds as a table: which bonds are picked for signature, the
 * cause, its number, and the litigant bound by each one.
 *
 * Four columns — the reference's own four. No status column, because every row on this
 * screen has the same status: signing or rejecting a bond drops it from the queue, so a
 * column that read "Pending signature" all the way down would be a column that never
 * says anything (`lib/employee/sign-bail-bonds.ts`). No date column either; the
 * reference draws none, and the date the bond binds the litigant to appear is in the
 * bond, where it belongs.
 *
 * **Two rows can be the same case.** A case with two accused carries two bonds, and the
 * litigant is the only thing telling those rows apart — the reference shows exactly that,
 * and it is why this queue has a Litigant column at all. So the litigant is named inside
 * the opener's accessible name and inside the checkbox's, and not left to the column
 * header: a bench reading with the screen, and one listening to it, both have to be able
 * to tell which of a case's two bonds they are about to sign.
 *
 * **The case name is the opener, not the litigant.** The reference underlines that column
 * and no other, and it is the right one: the bond is read to check the case it belongs
 * to. Selection is the first column, because signing is the one court-side act the
 * reference does in bulk — a magistrate clears a queue of sixty-eight bonds by checking
 * them, not by opening sixty-eight dialogs.
 *
 * **The row is not the click target.** Its sibling review queues open a dialog from
 * anywhere on the row; this one cannot, because the row already owns a checkbox, and a
 * row that both selects and opens on one click has to guess which the bench meant. So the
 * checkbox selects, the case name opens, and nothing else in the row is clickable.
 *
 * There is no row menu. The reference draws none here, and every act it could hold is
 * already on the screen — signing is the checkbox and the bar, Reject and Download live
 * inside the preview the case name opens.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function SignBailBondsTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: SignBailBond[];
  selectedIds: ReadonlySet<string>;
  onToggle: (bond: SignBailBond) => void;
  /** Select or clear every row currently in view — the header checkbox. */
  onToggleAll: (select: boolean) => void;
  onOpen: (bond: SignBailBond) => void;
}) {
  const selectedOnPage = rows.filter((bond) => selectedIds.has(bond.id)).length;
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
              disabled={rows.length === 0}
              onCheckedChange={(next) => onToggleAll(next === true)}
              /* Names what the control does to what is on screen, not to the whole queue.
                 The header checkbox reaches this page of rows only, and a label that said
                 "all bail bonds" would be a promise it does not keep once the list is
                 paged. */
              aria-label={
                allSelected
                  ? "Clear the bail bonds on this page"
                  : "Select the bail bonds on this page"
              }
            />
          </TableHead>
          <TableHead className={cn(headClass, "min-w-56 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Litigant
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header well needs each
          cell to paint its own fill for the end cells to round (above). It puts the row
          stroke on the cell, so the DS TableBody rule that clears the last row targets
          the wrong element. Reach the cells directly, or the final row doubles its line
          against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's fill
            under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={4} className="h-2 p-0" />
        </tr>
        {rows.map((bond) => {
          const selected = selectedIds.has(bond.id);
          return (
            <TableRow
              key={bond.id}
              data-state={selected ? "selected" : undefined}
              className="bg-card"
            >
              <TableCell className={cn(cellClass, "w-12")}>
                {/* Named for the bond, not the column: with two bonds to a case, "Select
                    ST/822/2026" would name both rows the same thing. */}
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(bond)}
                  aria-label={`Select the bail bond of ${bond.litigant} in ${bond.caseNumber}`}
                />
              </TableCell>
              {/* The row's one emphasised cell, and its only opener. Quiet
                  `text-foreground` rather than the reference's teal underline: the teal is
                  rationed for the one strong action on the screen, and a column of
                  underlined teal case names is the colour ui-craft §2 spends elsewhere.
                  The underline arrives on hover and focus, where it is an affordance
                  rather than decoration. */}
              <TableCell className={cn(cellClass, "min-w-56 whitespace-normal")}>
                <button
                  type="button"
                  onClick={() => onOpen(bond)}
                  className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
                >
                  <span className="sr-only">
                    {`Read the bail bond of ${bond.litigant} in `}
                  </span>
                  {causeTitle(bond)}
                </button>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {bond.caseNumber}
              </TableCell>
              <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
                {bond.litigant}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
