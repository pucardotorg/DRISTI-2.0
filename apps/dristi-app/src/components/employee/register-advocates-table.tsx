"use client";

import {
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  tableBodyClass,
  tableRowClass,
} from "@/components/chrome/table-plate";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDaysWaiting,
  registrationWaitTone,
  requestKindLabel,
  type AdvocateRegistration,
  type WaitTone,
} from "@/lib/employee/register-advocates";
import {
  rowActivation,
  rowOpener,
  rowOpenerClass,
} from "@/lib/employee/row-activation";
import { cn } from "@/lib/utils";

/** Plain at rest; the exception gets the ink. See `registrationWaitTone`. */
const waitClass: Record<WaitTone, string> = {
  plain: "",
  warning: "text-warning-ink",
  destructive: "text-destructive-ink",
};

/**
 * The registration queue as a table: the number the advocate can quote, who is asking,
 * the registration they claim, whether this request is an ordinary one, and how long the
 * office has kept them waiting.
 *
 * Five columns, and two of the reference's are gone.
 *
 * **User Type is gone** because it is constant. Every row on this screen is an advocate,
 * and a column whose every cell reads the same carries no information — the argument
 * `RegisterCasesTable` already makes about its missing status chip. The row model still
 * carries the distinction, so the day clerk registrations join this queue
 * (`REG-13a`/`REG-14a`) the column comes back as a real one.
 *
 * **Action / "Verify" is gone** because it was a link that repeated its own row. The
 * application number is the opener on every other court-side table, and it is the opener
 * here.
 *
 * What replaced them is the fact the reference never showed at all: whether this is a
 * first registration, an edit to an account the Bar Council database created (`REG-18`),
 * or a resubmission after the office rejected it (`REG-23`) — three genuinely different
 * jobs, which an officer could previously only tell apart by opening each one. **The
 * Request type cell is empty on a first registration**, deliberately: that is the norm,
 * and marking the norm on every row would spend the column's whole ration saying nothing
 * (ui-craft §4).
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function RegisterAdvocatesTable({
  rows,
  onOpen,
}: {
  rows: AdvocateRegistration[];
  onOpen: (request: AdvocateRegistration) => void;
}) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (`TABLE_HEAD_ROW`, ui-craft §4). */}
        <TableRow className={TABLE_HEAD_ROW}>
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap")}>
            Application number
          </TableHead>
          <TableHead className={cn(TABLE_HEAD, "min-w-48 whitespace-normal")}>
            Full name
          </TableHead>
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap")}>
            Bar registration ID
          </TableHead>
          {/* "Request type", not "Kind" — the court-side columns are named after the
              thing they hold ("Application type", "Process type"), and a header has to
              stand on its own above an empty cell. */}
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap")}>
            Request type
          </TableHead>
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap text-right")}>
            Days waiting
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* Given the same options as the rows, because half the treatment has to ask about a
          row's neighbours and a row cannot — see `table-plate.ts`. Hover, no selection:
          this queue's rows open a request and none of them is picked. */}
      <TableBody className={tableBodyClass()}>
        {/* The header is a well, not a band welded to the rows — it needs the panel's fill
            under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held out
            of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={5} className="h-2 p-0" />
        </tr>
        {rows.map((request) => {
          const kind = requestKindLabel(request);
          return (
            <TableRow key={request.id} {...rowActivation(tableRowClass())}>
              {/* The row's only opener, and now the whole row's — a click anywhere in the
                  row presses this button (`rowActivation`), so the officer no longer has
                  to find the one cell that answered.

                  Quiet `text-foreground` rather than the reference's teal underline. This
                  used to be argued as "the teal is rationed for Search"; Search is gone
                  and the page has no primary at all (brief D9), so the argument is simply
                  that fourteen underlined teal numbers down a column is not what ui-craft
                  §4 spends colour on. The underline still arrives on hover and focus — but
                  from the *row's* hover now, wherever the pointer sits, because an
                  underline that only appeared under the pointer is what taught officers
                  that the underline was the target. See `rowOpenerClass`. */}
              <TableCell className={cn(TABLE_CELL, "whitespace-nowrap")}>
                <button
                  type="button"
                  onClick={() => onOpen(request)}
                  {...rowOpener}
                  className={cn(rowOpenerClass, "tabular-nums")}
                >
                  <span className="sr-only">Review </span>
                  {request.applicationNumber}
                </button>
              </TableCell>
              {/* The emphasised cell — what identifies a person. It wraps and never
                  truncates: a Malayalam name is taller as well as longer, and cropping the
                  one thing that names who is waiting is not a trade worth making. `lang`
                  rides the name so a screen reader does not read Malayalam letters with an
                  English voice (ACCESSIBILITY §13). */}
              <TableCell
                className={cn(TABLE_CELL, "min-w-48 font-medium whitespace-normal")}
                lang={request.fullNameLang}
              >
                {request.fullName}
              </TableCell>
              <TableCell
                className={cn(TABLE_CELL, "tabular-nums whitespace-nowrap")}
              >
                {request.barRegistrationId}
              </TableCell>
              {/* Empty on the norm, and `secondary` on both exceptions — a neutral chip,
                  not a status one. A first pass gave the resubmission `warning`, and on
                  the render the oldest row then carried an amber chip beside a
                  `destructive-ink` wait: two status cues in one row, which is the thing
                  ui-craft §4 rations. The row already has exactly one status cue, the
                  wait, and what these chips carry is a *kind* — the words tell the two
                  apart without a second colour. */}
              <TableCell className={cn(TABLE_CELL, "whitespace-nowrap")}>
                {kind ? <Badge variant="secondary">{kind}</Badge> : null}
              </TableCell>
              {/* The wait is the column's fact, and the number is the encoding — the
                  colour only agrees with it (ACCESSIBILITY §3). Right-aligned because it
                  is a compared number. */}
              <TableCell
                className={cn(
                  TABLE_CELL,
                  "text-right tabular-nums whitespace-nowrap",
                  waitClass[registrationWaitTone(request.daysWaiting)],
                )}
              >
                {formatDaysWaiting(request.daysWaiting)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
