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
import {
  courtProcessTypeInline,
  courtProcessTypeLabel,
  formatProcessDate,
  processChannelLabel,
  type CourtProcess,
  type ProcessStage,
} from "@/lib/employee/sign-process";
import { cn } from "@/lib/utils";

/* The same table treatment as the four single-act signing queues — header separated by
 * fill rather than a second stroke, rows by hairline, the panel edge as the only
 * full-strength border on the screen (ui-craft §1.1). Restated rather than exported for
 * the reason `SignOrdersTable` restates it: when the advocate shell moves onto the shared
 * `components/chrome` frame, this treatment is what belongs there, and the court-side
 * tables should collapse onto it together rather than one of them becoming the other's
 * parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";
/* A hovered row lifts as a rounded band rather than a full-bleed strip. Three things
 * have to move for that to paint at all:
 *
 * 1. `border-radius` is ignored on a `tr` in every engine, and under `border-separate`
 *    a row's own fill is a square rectangle behind its cells — so the fill moves to the
 *    cells and the end cells round, exactly as the header well above does it. The row's
 *    own hover and selected fills go transparent, or that square would paint the
 *    rounded corners back in.
 * 2. The hairline the row carries curves with the corner once the cell rounds, and the
 *    row above's hairline cuts across the band's top corners. Both fade to transparent
 *    on hover rather than being removed (`TableBody` below reaches the row above with
 *    `:has()`), so the band floats free of its neighbours without anything shifting by
 *    a pixel.
 * 3. The radius is part of what changes on hover, so it is named in the transition
 *    beside the two colours — otherwise the corners snap square while the fill is still
 *    fading out and the row leaves a square ghost behind the pointer.
 *
 * Selection rounds too, but **as a run rather than per row**. Rounding every selected
 * row would scallop a twelve-row selection into a stack of pills, notching the card
 * through at every join — which is why this started out square. The answer is not to
 * choose between square and scalloped: a selected row rounds its top only when the row
 * above it is not selected, and its bottom only when the row below it is not, so one
 * pick reads as a band and twelve consecutive picks read as one block with two rounded
 * ends. The internal hairlines inside a run go transparent for the same reason the
 * hovered row's do — a rule crossing the block would cut the corners it is trying to
 * round. */
const rowClass = cn(
  "cursor-pointer [&>td]:bg-card",
  "[&>td]:transition-[background-color,border-color,border-radius]",
  "hover:bg-transparent hover:[&>td]:border-transparent hover:[&>td]:bg-accent",
  "hover:[&>td:first-child]:rounded-l-lg hover:[&>td:last-child]:rounded-r-lg",
  "data-[state=selected]:bg-transparent data-[state=selected]:[&>td]:bg-accent-strong",
);

/** Seven columns on every stage — the checkbox and the reference's six. */
const COLUMNS = 7;

/**
 * One stage of the process line as a table: which rows are picked, the cause, its
 * number, which instrument it is, the day this stage is about, how it will be
 * delivered, and the listing it is returnable for.
 *
 * **The stage is not a column.** The tab above the table already says it, and a status
 * cell repeating "Pending sign" down eleven rows would be the loudest thing in the row
 * saying the one thing the bench already knows. What varies instead is the *date* column:
 * the reference names its fourth column for the moment the stage is about — "Payment
 * made" while a registered-post cover is still being collected, "Issued date" once the
 * process has been drawn up — and the three stages the reference does not draw follow
 * the same rule (`ProcessStage.dateColumn`).
 *
 * **Selection is the first column on every stage, including the two with no act.**
 * Download reaches every tab, so a record tab is still a tab you select rows on. On the
 * three working stages the same checkboxes also feed the act in the bar.
 *
 * **The case name opens the row**, matching the four signing queues beside it. The
 * instrument stays in its own column as plain text, because a case can carry three
 * separate processes and it is the fact that tells them apart — so the accessible name
 * of the opener carries it too, and three rows of one case are not read out as the same
 * link three times (ACCESSIBILITY §2, §9).
 *
 * **A pointer on the rest of the row opens it too.** The checkbox still selects, and
 * keyboard still lands on the case name — a row that was itself a button would steal the
 * checkbox's target and add a second tab stop.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function SignProcessTable({
  stage,
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  stage: ProcessStage;
  rows: CourtProcess[];
  selectedIds: ReadonlySet<string>;
  onToggle: (process: CourtProcess) => void;
  /** Select or clear every row currently in view — the header checkbox. */
  onToggleAll: (select: boolean) => void;
  onOpen: (process: CourtProcess) => void;
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
              disabled={rows.length === 0}
              onCheckedChange={(next) => onToggleAll(next === true)}
              /* Names what the control does to what is on screen, not to the whole
                 stage — it reaches this page of rows only, and a label promising "all"
                 would be a promise the control does not keep once the list is paged. */
              aria-label={
                allSelected
                  ? "Clear the processes on this page"
                  : "Select the processes on this page"
              }
            />
          </TableHead>
          <TableHead className={cn(headClass, "min-w-56 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-40 whitespace-normal")}>
            Process type
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            {stage.dateColumn}
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Delivery channel
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Hearing date
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` stays even without a sticky column — the header well needs
          each cell to paint its own fill for the end cells to round (above). It puts the
          row stroke on the cell, so the DS TableBody rule that clears the last row targets
          the wrong element. Reach the cells directly, or the final row doubles its line
          against the panel edge. */}
      <TableBody
        className={cn(
          "[&_tr:last-child_td]:border-b-0 [&>tr:has(+_tr:hover)>td]:border-transparent",
          /* A run of picked rows paints as one block: no rules inside it, none above
             its first row, and rounded ends. Each rule reaches the row from the body so
             it can ask about the row's neighbours, which a row cannot ask about itself. */
          "[&>tr[data-state=selected]>td]:border-transparent",
          "[&>tr:has(+_tr[data-state=selected])>td]:border-transparent",
          "[&>tr:not([data-state=selected])+tr[data-state=selected]>td:first-child]:rounded-tl-lg",
          "[&>tr:not([data-state=selected])+tr[data-state=selected]>td:last-child]:rounded-tr-lg",
          "[&>tr[data-state=selected]:not(:has(+_tr[data-state=selected]))>td:first-child]:rounded-bl-lg",
          "[&>tr[data-state=selected]:not(:has(+_tr[data-state=selected]))>td:last-child]:rounded-br-lg",
        )}
      >
        {/* The header is a well, not a band welded to the rows — it needs the panel's
            fill under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={COLUMNS} className="h-2 p-0" />
        </tr>
        {rows.map((process) => {
          const selected = selectedIds.has(process.id);
          const type = courtProcessTypeLabel(process.type);
          const inline = courtProcessTypeInline(process.type);
          const day = stage.dateOf(process);
          return (
            <TableRow
              key={process.id}
              data-state={selected ? "selected" : undefined}
              className={rowClass}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest("button, a, [role=checkbox], label")) return;
                onOpen(process);
              }}
            >
              <TableCell className={cn(cellClass, "w-12")}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(process)}
                  aria-label={`Select the ${inline} in ${process.caseNumber}`}
                />
              </TableCell>
              {/* The row's opener. Quiet `text-foreground` rather than a teal underline:
                  the teal is rationed for the one strong action on the screen, and a
                  column of underlined teal names is the colour ui-craft §4 spends it on
                  instead. The underline arrives on hover and focus, where it is an
                  affordance rather than decoration. */}
              <TableCell
                className={cn(cellClass, "min-w-56 font-medium whitespace-normal")}
              >
                <button
                  type="button"
                  onClick={() => onOpen(process)}
                  className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
                >
                  <span className="sr-only">Read the {inline} in </span>
                  {causeTitle(process)}
                </button>
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {process.caseNumber}
              </TableCell>
              {/* Which instrument this is — the fact that tells three rows of one case
                  apart. Plain text: the opener already carries the row's weight. */}
              <TableCell className={cn(cellClass, "min-w-40 whitespace-normal")}>
                {type}
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {/* A stage always stamps its own day, so this is never empty in practice.
                    An em dash rather than a blank cell is what a row that somehow reached
                    a stage without its date should say. */}
                {day ? formatProcessDate(day) : "—"}
              </TableCell>
              <TableCell className={cn(cellClass, "whitespace-nowrap")}>
                {processChannelLabel(process.channel)}
              </TableCell>
              <TableCell
                className={cn(cellClass, "tabular-nums whitespace-nowrap")}
              >
                {formatProcessDate(process.hearingDate)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
