"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  formatSignOrderDate,
  signOrderStatusLabel,
  signOrderTypeLabel,
  type SignOrder,
} from "@/lib/employee/sign-orders";
import { cn } from "@/lib/utils";

/* The same table treatment as the signing queue for forms, the register queue and the
 * rescheduling queue — header separated by fill rather than a second stroke, rows by
 * hairline, the panel edge as the only full-strength border on the screen (ui-craft
 * §1.1). The classes are restated rather than exported because when the advocate shell
 * moves onto the shared `components/chrome` frame, this treatment is what belongs
 * there, and the court-side tables should collapse onto it together rather than one of
 * them becoming the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The signing queue for orders as a table: which orders are picked for signature, the
 * cause, its number, which decision the order carries, whether the signature is already
 * on it, and when it was drawn up.
 *
 * Six columns, and selection is the first one, because signing is the one court-side act
 * the reference does in bulk — a magistrate clears a queue of eighteen orders by
 * checking them, not by opening eighteen dialogs. `SignFormsTable` beside it works the
 * same way for the same reason.
 *
 * **The title is the row's emphasised cell, not the cause.** Every other court-side
 * queue leads with the cause title, because one row there is one case. Here it is not:
 * four rows of this queue are the same case, and the only thing that tells them apart is
 * which decision each one carries. So the title carries the weight and the click, and
 * the cause and its number sit beside it as the plain facts of where the order belongs —
 * the reference's own division, and the reason it underlines that column and no other.
 *
 * **The case name and its number stay two columns.** The reference joins them into one
 * ("AdvocateTest and 1 Other vs Automate Company , ST/198/2026"); every court-side queue
 * we have splits them, and a bench scanning a column of numbers should not have to read
 * past a party name to find one (owner instruction, 2026-09-03).
 *
 * **The row is not the click target.** Its sibling review queues open a dialog from
 * anywhere on the row; this one cannot, because the row already owns a checkbox. A row
 * that both selects and opens on the same click has to guess which the bench meant. So
 * the checkbox selects, the title opens, and nothing else in the row is clickable.
 *
 * There is no row menu. The reference draws a kebab in a trailing Actions column, but
 * every act it could hold is already here — signing is the checkbox and the dialog, and
 * Download lives inside the preview the title opens — so it would be furniture around
 * a hole (deviation logged in the build report).
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table
 * is one panel rather than a box inside a box.
 */
export function SignOrdersTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: SignOrder[];
  selectedIds: ReadonlySet<string>;
  onToggle: (order: SignOrder) => void;
  /** Select or clear every *signable* row currently in view — the header checkbox. */
  onToggleAll: (select: boolean) => void;
  onOpen: (order: SignOrder) => void;
}) {
  /* Only a pending order can be signed, so only a pending order can be selected — the
     header box speaks for those rows alone, and a page of already-signed orders has
     nothing for it to do. */
  const signable = rows.filter((order) => order.status === "pending-signature");
  const selectedOnPage = signable.filter((order) =>
    selectedIds.has(order.id),
  ).length;
  const allSelected =
    signable.length > 0 && selectedOnPage === signable.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means
            each cell paints its own fill, so the radius goes on the end cells rather
            than the row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "w-12")}>
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              disabled={signable.length === 0}
              onCheckedChange={(next) => onToggleAll(next === true)}
              /* Names what the control does to what is on screen, not to the whole
                 queue — the header checkbox reaches this page of rows only, and a label
                 that said "all orders" would be a promise the control does not keep once
                 the list is paged. */
              aria-label={
                allSelected
                  ? "Clear the orders on this page"
                  : "Select the orders on this page"
              }
            />
          </TableHead>
          <TableHead className={cn(headClass, "min-w-56 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-56 whitespace-normal")}>
            Title
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Status
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date added
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header well needs
          each cell to paint its own fill for the end cells to round (above). It puts the
          row stroke on the cell, so the DS TableBody rule that clears the last row
          targets the wrong element. Reach the cells directly, or the final row doubles
          its line against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's
            fill under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={6} className="h-2 p-0" />
        </tr>
        {rows.map((order) => {
          const pending = order.status === "pending-signature";
          const selected = selectedIds.has(order.id);
          return (
            <TableRow
              key={order.id}
              data-state={selected ? "selected" : undefined}
              className="bg-card"
            >
              <TableCell className={cn(cellClass, "w-12")}>
                {/* A signed order has nothing to select. The cell stays for the column,
                    and the status beside it is what says why it is empty. */}
                {pending ? (
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggle(order)}
                    aria-label={`Select ${signOrderTypeLabel(order.type)} in ${order.caseNumber}`}
                  />
                ) : null}
              </TableCell>
              <TableCell className={cn(cellClass, "min-w-56 whitespace-normal")}>
                {causeTitle(order)}
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {order.caseNumber}
              </TableCell>
              {/* The row's one emphasised cell, and its only opener. Quiet
                  `text-foreground` rather than the reference's teal underline: the teal
                  is rationed for the one strong action on the screen, and eighteen
                  underlined teal titles down a column is the colour ui-craft §4 spends
                  it on instead. The underline arrives on hover and focus, where it is an
                  affordance rather than decoration. */}
              <TableCell className={cn(cellClass, "min-w-56 whitespace-normal")}>
                <button
                  type="button"
                  onClick={() => onOpen(order)}
                  className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
                >
                  <span className="sr-only">
                    {pending ? "Read and sign " : "Read "}
                  </span>
                  {signOrderTypeLabel(order.type)}
                </button>
              </TableCell>
              {/* Status is the one tinted mark in the row, and it carries its own word —
                  never colour alone (ACCESSIBILITY §3). `warning` is the variant the
                  court-side overlays already spend on a pending state. */}
              <TableCell className={cn(cellClass, "whitespace-nowrap")}>
                <Badge variant={pending ? "warning" : "success"}>
                  {signOrderStatusLabel(order.status)}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {formatSignOrderDate(order.addedOn)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
