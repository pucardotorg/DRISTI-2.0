"use client";

import Link from "next/link";
import { CircleCheckIcon, EllipsisVerticalIcon, FilePlusIcon } from "lucide-react";

import { CounselCell } from "@/components/employee/counsel-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canDraftOrder,
  canEndHearing,
  canPassOver,
  canStartHearing,
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  type CourtHearing,
} from "@/lib/employee/hearings";
import { cn } from "@/lib/utils";

/* The advocate's cases table is the reference for surface and row state, and this is the
 * same table: header separated by fill rather than a second stroke, rows by hairline, and
 * the panel edge as the only full-strength border on the screen (ui-craft §1.1). The
 * classes are restated rather than imported because `/employee` does not reach into the
 * citizen side (see `lib/employee/content.ts`) — when the advocate shell moves onto the
 * shared `components/chrome` frame, this treatment is the next thing that belongs there. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * Start hearing and End hearing live in the Action column, as one labelled outline
 * control — not teal (Join VC is the screen's one primary). Start is a link to the
 * matter's case overview that marks the listing on its way out; End stays a button,
 * because ending a sitting goes nowhere.
 *
 * It is the only bordered action on a callable row (ui-craft §2). Scheduled listings
 * start; the same slot ends the one that is ongoing. Completed listings have nothing
 * left to call, so the control leaves — a muted `circle-check` holds the slot.
 * A dash would read as missing data; the tick says the call is done. It stays
 * `text-muted-foreground` so the Completed chip remains the one status mark
 * (ui-craft §1.4). Passed-over listings also have nothing left to call today;
 * the slot empties rather than showing that tick, because the call was not
 * finished — the Passed over chip is the mark.
 *
 * Pass over is the other sitting outcome, not a second session verb: it lives
 * in a row overflow beside this control, on scheduled and ongoing rows only.
 *
 * `min-w-32` is a floor, not a fit: "Start hearing" measures 83px of ink and "End
 * hearing" less, so 128px holds either label with room and neither the control nor
 * the column jumps when the word changes. It was `min-w-40`, which spent 45px per row
 * on nothing and pushed the table past the width of its own panel — see below.
 */
const SESSION_SLOT_CLASS = "min-w-32";
/**
 * The two right-hand columns are ordinary columns. They used to be pinned, and the pin
 * is what the bench read as a rendering fault.
 *
 * `sticky right-0` does not mean "hold still until scrolled past". It clamps the cell's
 * right edge to the scrollport's, so the moment the table is wider than the port the
 * cell is pulled *left*, over its neighbours, at scroll position zero — before anyone
 * has scrolled anything. Action covered Orders. Pinning Orders as well moved the same
 * collision one column left onto Status, where an opaque cell sliced the status chip
 * mid-word; pinning Status would have moved it onto Purpose. The pin was the bug, and
 * no pinning order was going to fix it.
 *
 * Measured on the render, and the numbers are the point. The panel is the viewport less
 * 385px with the rail open and less 193px folded. The table wanted 1182px, against
 * 1127px of panel at a 1512 viewport and 1055px at 1440 — past the threshold at every
 * laptop width this court has, which is why a chip that was in fact always clipped read
 * as an intermittent fault. Trimming the session control to its label (above) and the
 * action cell to its contents brings the table to 1086px, which fits outright from
 * about a 1471 viewport with the rail open, and from 1280 with it folded. Narrower than
 * that it scrolls, and the last column is cut at the port's own edge — which reads as
 * more to the right, where the same content covered mid-table read as broken. No cell
 * overlaps another at any width now, so the class of bug is gone rather than moved.
 *
 * `w-52` is the action group at the control metric — the session control's `min-w-32`,
 * the overflow trigger's `size-10`, one `gap-2` between them, and the cell's `px-4`.
 * `w-18` is the orders icon button plus that same padding.
 */
const ACTION_COLUMN_CLASS = "w-52 min-w-52";
const ORDERS_COLUMN_CLASS = "w-18";

/**
 * The cause title, as the way into that matter's case overview.
 *
 * It used to open a floating peek over the list. The peek is retired: it showed
 * exactly what the overview page now shows, and two surfaces holding the same facts
 * is how they start disagreeing. So the row's one emphasised cell is what it always
 * read as — a link to the case — and it goes to the same page Start hearing opens.
 *
 * Reading the case and calling it are still two different acts. This one only reads:
 * it does not mark the listing ongoing. Start hearing, on the same row, is the call.
 *
 * It wears the same quiet-name dress as the queues' dialog openers, but stays an
 * anchor: this one navigates, and a destination has to be middle-clickable
 * (`ACCESSIBILITY.md` §2 — prefer the semantic element for the act).
 *
 * The caller supplies the box because the two call sites need different ones: in the
 * table it fills the cell as a 40×40 target, and in the phone list it sits inline
 * after the item number. Only the box is theirs — the dress is fixed here.
 */
export function HearingCaseLink({
  hearing,
  className,
}: {
  hearing: CourtHearing;
  className?: string;
}) {
  return (
    <Link
      href={`/employee/hearings/${hearing.id}`}
      className={cn(
        "rounded-sm text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline",
        className
      )}
    >
      {/* The cause title alone is the whole of what a sighted reader needs under a
          column headed "Case name"; out of that column it is a link named after two
          parties and nothing else. */}
      <span className="sr-only">Case overview for </span>
      {causeTitle(hearing)}
    </Link>
  );
}

export function HearingSessionButton({
  hearing,
  onStartHearing,
  onEndHearing,
  className,
}: {
  hearing: CourtHearing;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  className?: string;
}) {
  if (canStartHearing(hearing.status)) {
    return (
      /* A link, not a button that navigates: calling the matter takes the bench to
         that case's overview, and a destination the court can middle-click, open in
         a second tab, or land on from the browser's own history has to be an anchor.
         The mark rides along on the click — `markHearingOngoing` is in a module that
         outlives this screen, so it is still made when the list unmounts a moment
         later (`lib/employee/hearing-session.ts`). */
      <Button
        asChild
        variant="outline"
        className={cn(SESSION_SLOT_CLASS, className)}
      >
        <Link
          href={`/employee/hearings/${hearing.id}`}
          onClick={() => onStartHearing(hearing)}
        >
          Start hearing
        </Link>
      </Button>
    );
  }
  if (canEndHearing(hearing.status)) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(SESSION_SLOT_CLASS, className)}
        onClick={() => onEndHearing(hearing)}
      >
        End hearing
      </Button>
    );
  }
  if (hearing.status === "passed-over") {
    return (
      <span className={cn("inline-flex h-10 items-center", className)}>
        <span className="sr-only">Passed over</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex h-10 items-center text-muted-foreground", className)}>
      <CircleCheckIcon aria-hidden />
      <span className="sr-only">Hearing ended</span>
    </span>
  );
}

/**
 * Pass over — skip this listing without completing it, to hear it on a later
 * date. Secondary to Start/End: ghost icon, one menu item, never a second
 * labelled button (ui-craft §2).
 *
 * The menu is overlay elevation via the DS primitive. Width is `w-auto
 * min-w-40` so a 40px trigger does not pinch the words (the primitive otherwise
 * inherits trigger width).
 */
export function HearingPassOverMenu({
  hearing,
  onPassOver,
}: {
  hearing: CourtHearing;
  onPassOver: (hearing: CourtHearing) => void;
}) {
  if (!canPassOver(hearing.status)) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          aria-label={`More actions for item ${hearing.item}, ${causeTitle(hearing)}`}
        >
          <EllipsisVerticalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-40">
        <DropdownMenuItem onSelect={() => onPassOver(hearing)}>
          Pass over
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Orders on this listing — the old cause list's document-with-plus column.
 *
 * `file-plus` is the DS allowlist match for that glyph: a sheet with a plus,
 * meaning draft or add an order for this matter. Opens the composer for this
 * listing. Issuing the order is still a real judicial act this build does not
 * perform; the composer itself says so.
 *
 * The control follows the sitting, not the row: a matter the bench has not called
 * yet has no hearing to pass an order in, so on a scheduled listing the icon holds
 * the column disabled and Start hearing on the same row is what opens it
 * (`canDraftOrder`). Disabled by the DS `disabled` prop rather than an
 * `aria-disabled` mark, because this is a live precondition and not a missing
 * build — the same distinction as Sign selected forms with nothing ticked.
 *
 * The reason lives in the accessible name: an icon-only control has no room to
 * carry it, and a tooltip cannot be hovered through the DS's
 * `disabled:pointer-events-none`. Sighted readers get it from the row — the
 * Scheduled chip and Start hearing sit inches away.
 */
export function HearingOrdersButton({ hearing }: { hearing: CourtHearing }) {
  const label = `Order for item ${hearing.item}, ${causeTitle(hearing)}`;

  if (!canDraftOrder(hearing.status)) {
    return (
      <Button
        type="button"
        disabled
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
        aria-label={`${label} (available once the hearing starts)`}
      >
        <FilePlusIcon aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground"
    >
      <Link
        href={`/employee/hearings/${hearing.id}/order`}
        aria-label={label}
      >
        <FilePlusIcon aria-hidden />
      </Link>
    </Button>
  );
}

/** Mobile stack: the start/end control, then Pass over, then orders. */
export function HearingRowActions({
  hearing,
  onStartHearing,
  onEndHearing,
  onPassOver,
  className,
}: {
  hearing: CourtHearing;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  onPassOver: (hearing: CourtHearing) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <HearingSessionButton
        hearing={hearing}
        onStartHearing={onStartHearing}
        onEndHearing={onEndHearing}
        className="min-w-0 flex-1"
      />
      <HearingPassOverMenu hearing={hearing} onPassOver={onPassOver} />
      <HearingOrdersButton hearing={hearing} />
    </div>
  );
}

/**
 * Today's cause list as a table: the court's serial, the cause, its number, who appears,
 * what it is listed for, where it stands, orders on this listing, and the call on this
 * sitting.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function HearingsTable({
  rows,
  onStartHearing,
  onEndHearing,
  onPassOver,
}: {
  rows: CourtHearing[];
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  onPassOver: (hearing: CourtHearing) => void;
}) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means each
            cell paints its own fill, so the radius goes on the end cells rather than the
            row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "w-16 whitespace-nowrap")}>
            S. no.
          </TableHead>
          <TableHead className={cn(headClass, "min-w-40 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-nowrap")}>
            Advocates
          </TableHead>
          <TableHead className={cn(headClass, "min-w-32 whitespace-normal")}>
            Purpose
          </TableHead>
          <TableHead className={cn(headClass, "min-w-32 whitespace-nowrap")}>
            Status
          </TableHead>
          <TableHead
            className={cn(headClass, ORDERS_COLUMN_CLASS, "whitespace-nowrap")}
          >
            Orders
          </TableHead>
          <TableHead
            className={cn(headClass, ACTION_COLUMN_CLASS, "whitespace-nowrap")}
          >
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` (needed so the header well can round its own end cells) puts
          the row stroke on the cell, so the DS TableBody rule that clears the last row
          targets the wrong element. Reach the cells directly, or the final row doubles
          its line against the panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's
            fill under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={8} className="h-2 p-0" />
        </tr>
        {rows.map((hearing) => (
          <TableRow key={hearing.id} className="bg-card">
            <TableCell
              className={cn(cellClass, "w-16 tabular-nums text-muted-foreground")}
            >
              {hearing.item}
            </TableCell>
            {/* The row's one emphasised cell. Opens this matter's case overview —
                the same page Start hearing opens, without calling the matter. */}
            <TableCell
              className={cn(cellClass, "min-w-40 font-medium whitespace-normal")}
            >
              {/* Fills the cell so the target is the row's height, not the 20px
                  line box the text happens to occupy (`ACCESSIBILITY.md` §8).
                  `flex`, not `inline-flex`: an inline box would shrink-wrap and
                  fight the cell's `whitespace-normal` wrapping. */}
              <HearingCaseLink
                hearing={hearing}
                className="flex min-h-10 w-full items-center"
              />
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {hearing.caseNumber}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-48 whitespace-nowrap")}>
              <CounselCell
                complainant={counselFor(hearing, "complainant").map(
                  (counsel) => counsel.name,
                )}
                accused={counselFor(hearing, "accused").map(
                  (counsel) => counsel.name,
                )}
                dense
              />
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-32 whitespace-normal")}>
              {courtHearingPurposeLabel(hearing.purpose)}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-32 whitespace-nowrap")}>
              <Badge
                variant={courtHearingStatusVariant(hearing.status)}
                className="w-fit"
              >
                {courtHearingStatusLabel(hearing.status)}
              </Badge>
            </TableCell>
            <TableCell
              className={cn(cellClass, ORDERS_COLUMN_CLASS, "whitespace-nowrap")}
            >
              <div className="flex justify-center">
                <HearingOrdersButton hearing={hearing} />
              </div>
            </TableCell>
            <TableCell
              className={cn(cellClass, ACTION_COLUMN_CLASS, "whitespace-nowrap")}
            >
              <div className="flex items-center gap-2">
                <HearingSessionButton
                  hearing={hearing}
                  onStartHearing={onStartHearing}
                  onEndHearing={onEndHearing}
                />
                <HearingPassOverMenu
                  hearing={hearing}
                  onPassOver={onPassOver}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
