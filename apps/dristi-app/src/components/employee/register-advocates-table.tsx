"use client";

import {
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  tableBodyClass,
  tableRowClass,
} from "@/components/chrome/table-plate";
import { RoleGlyph } from "@/components/employee/role-mark";
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
  requestKindVariant,
  roleLabel,
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
 * The registration queue as a table: the number the applicant can quote, who is asking,
 * what they are registering as, the registration they claim, whether this request is an
 * ordinary one, and how long the office has kept them waiting.
 *
 * **Six columns. Role came back** (2026-09-11), exactly as this comment said it would:
 * the reference's *User Type* was dropped while every row was an advocate, because a
 * column whose every cell reads the same carries no information. Advocate clerks joining
 * the queue (`REG-13a`/`REG-14a`) made it a real distinction, and it sits beside the name
 * because it decides how the number after it is read. Named "Role", the sign-up's own
 * word for the same choice, with the sign-up's own two values.
 *
 * Unlike Request type, **Role is filled on every row**, the norm included. Request type can
 * leave its norm blank because "first registration" is what an empty cell plainly means;
 * an empty Role cell would mean nothing at all, in a column where both values are
 * ordinary.
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
          {/* `min-w-40`, down from 48, to pay for the Role column. Measured at 1280 — the
              narrowest width the table is shown at — six columns came to 935px in a
              910px panel, and the column pushed off the edge was Days waiting, the one
              the queue is read by. The name is the column that can afford it: it wraps
              by design and never truncates, so a lower floor costs a line on the
              longest names and nothing on the rest. */}
          <TableHead className={cn(TABLE_HEAD, "min-w-40 whitespace-normal")}>
            Full name
          </TableHead>
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap")}>
            Role
          </TableHead>
          {/* "Registration number", not "Bar registration ID" — the column holds clerks'
              numbers too, and the Role beside it says which register the number belongs
              to. The overlay keeps the specific label, where a single request is read. */}
          <TableHead className={cn(TABLE_HEAD, "whitespace-nowrap")}>
            Registration number
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
          <td colSpan={6} className="h-2 p-0" />
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
                className={cn(
                  TABLE_CELL,
                  "min-w-40 font-medium whitespace-normal",
                )}
                lang={request.fullNameLang}
              >
                {request.fullName}
              </TableCell>
              {/* The role's mark and its word — not a chip, because it is a category and
                  not a status, and the row's one chip is still the request type. The mark
                  is what makes the column scannable: a briefcase or a clipboard, and a
                  clipboard in the info ink, so the clerks in a long queue are found by
                  looking rather than reading (see `RoleGlyph`). */}
              <TableCell
                className={cn(
                  TABLE_CELL,
                  "whitespace-nowrap text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <RoleGlyph kind={request.registrantKind} />
                  {roleLabel(request.registrantKind)}
                </span>
              </TableCell>
              <TableCell
                className={cn(TABLE_CELL, "tabular-nums whitespace-nowrap")}
              >
                {request.registrationNumber}
              </TableCell>
              {/* Empty on the norm; the two exceptions are told apart by colour as well as
                  by their words — `info` for an edited account, `warning` for a
                  resubmission (`requestKindVariant`, owner ruling 2026-09-10). This
                  spends a second colour on the row whose wait is already `destructive`
                  ink, which ui-craft §4 rations; the owner asked for the trade, and the
                  case for it is that "came back a fifth time" is a fact the officer has to
                  act on differently, not decoration. The words stay, so it is never colour
                  alone. */}
              <TableCell className={cn(TABLE_CELL, "whitespace-nowrap")}>
                {kind ? (
                  <Badge variant={requestKindVariant(request) ?? "secondary"}>
                    {kind}
                  </Badge>
                ) : null}
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
