"use client";

import { CounselCell } from "@/components/employee/counsel-cell";
import { Checkbox } from "@/components/ui/checkbox";
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
  formatDepositionDate,
  witnessRoleLabel,
  witnessTag,
  type WitnessDeposition,
} from "@/lib/employee/sign-witness-deposition";
import { cn } from "@/lib/utils";

/* The same table treatment as the other court-side queues — header separated by fill
 * rather than a second stroke, rows by hairline, the panel edge as the only
 * full-strength border on the screen (ui-craft §1.1). The classes are restated rather
 * than exported because when the advocate shell moves onto the shared
 * `components/chrome` frame, this treatment is what belongs there, and the court-side
 * tables should collapse onto it together rather than one of them becoming the other's
 * parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The evidence queue as a table: which sheets are picked for signature, the cause, its
 * number, who was in the box, when the evidence was recorded, and who appeared.
 *
 * Six columns, in the reference's own order. The witness column is the one this table
 * has that no sibling queue does, and it is the column that does the work: a case with
 * four witnesses puts four rows in this list under one cause title, and the witness is
 * what tells them apart. Its `PW1` / `DW4` tag rides beside the name because that tag
 * is how the bench, the bar and the record all refer to the sheet — muted, because the
 * name is the fact and the tag is its label.
 *
 * **The row is not the click target here.** Its sibling queues open a dialog from
 * anywhere on the row; this one cannot, because the row already owns a control. A row
 * that both selects and opens on the same click has to guess which the bench meant. So
 * the checkbox selects, the cause title opens, and nothing else in the row is
 * clickable — the reference's own division.
 *
 * There is no status column: a row in this queue is in exactly one state, waiting for
 * signature, so a chip repeating that on every row would carry no information. There is
 * no row menu either — sign is the only act, and it is already in two places.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table
 * is one panel rather than a box inside a box.
 */
export function SignWitnessDepositionTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: WitnessDeposition[];
  selectedIds: ReadonlySet<string>;
  onToggle: (deposition: WitnessDeposition) => void;
  /** Select or clear every row currently in view — the header checkbox. */
  onToggleAll: (select: boolean) => void;
  onOpen: (deposition: WitnessDeposition) => void;
}) {
  const selectedOnPage = rows.filter((row) => selectedIds.has(row.id)).length;
  const allSelected = rows.length > 0 && selectedOnPage === rows.length;
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
              onCheckedChange={(next) => onToggleAll(next === true)}
              /* Names what the control does to what is on screen, not to the whole
                 queue — the header checkbox reaches this page of rows only, and a label
                 that said "all depositions" would be a promise the control does not
                 keep once the list is paged. */
              aria-label={
                allSelected
                  ? "Clear the depositions on this page"
                  : "Select the depositions on this page"
              }
            />
          </TableHead>
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-40 whitespace-normal")}>
            Witness name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date of deposition
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-nowrap")}>
            Advocates
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
        {rows.map((deposition) => {
          const selected = selectedIds.has(deposition.id);
          const tag = witnessTag(deposition);
          return (
            <TableRow
              key={deposition.id}
              data-state={selected ? "selected" : undefined}
              className="bg-card"
            >
              <TableCell className={cn(cellClass, "w-12")}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(deposition)}
                  /* The sheet, not the row: one case can put four of these in the list,
                     and a label naming only the cause would read aloud four times
                     identically. */
                  aria-label={`Select the deposition of ${deposition.witness.name}, ${tag}, in ${deposition.caseNumber}`}
                />
              </TableCell>
              {/* The row's one emphasised cell, and its only opener. Quiet
                  `text-foreground` rather than the reference's teal underline: the
                  sibling court queues already name their opener this way, and ten
                  underlined teal names down a column is the colour ui-craft §4 rations.
                  The underline arrives on hover and focus, where it is an affordance
                  rather than decoration. */}
              <TableCell
                className={cn(
                  cellClass,
                  "min-w-64 font-medium whitespace-normal",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpen(deposition)}
                  className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
                >
                  <span className="sr-only">
                    Read and sign the deposition of {deposition.witness.name} in{" "}
                  </span>
                  {causeTitle(deposition)}
                </button>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {deposition.caseNumber}
              </TableCell>
              {/* The name carries the fact; the tag labels it, so it recedes to muted
                  the way the `(C)` / `(A)` marks do in the advocates cell beside it.
                  Spoken in full, because "PW1" read aloud is not a sentence. */}
              <TableCell className={cn(cellClass, "min-w-40 whitespace-normal")}>
                <span className="text-foreground">
                  {deposition.witness.name}
                </span>{" "}
                <span aria-hidden className="text-muted-foreground">
                  {tag}
                </span>
                <span className="sr-only">{`, ${tag}, ${witnessRoleLabel(deposition)}`}</span>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {formatDepositionDate(deposition.depositionOn)}
              </TableCell>
              <TableCell className={cn(cellClass, "min-w-48 whitespace-nowrap")}>
                <CounselCell
                  complainant={counselFor(deposition, "complainant").map(
                    (counsel) => counsel.name,
                  )}
                  accused={counselFor(deposition, "accused").map(
                    (counsel) => counsel.name,
                  )}
                  dense
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
