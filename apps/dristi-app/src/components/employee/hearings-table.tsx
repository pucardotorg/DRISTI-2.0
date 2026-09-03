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

import { HearingPeekTrigger, HEARING_PEEK_ID, useHearingPeek } from "./use-hearing-peek";

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
 * Start hearing and End hearing live in the Action column, as a labelled outline
 * button — not teal (Join VC is the screen's one primary).
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
 * `min-w-40` is the width of "Start hearing" at the control metric, so Start and
 * End share one column and the table does not jump when the label changes.
 */
const SESSION_SLOT_CLASS = "min-w-40";
/**
 * The two right-hand columns are one pinned group, not one sticky column beside a
 * loose one.
 *
 * Action alone was `sticky right-0` with a bare Orders cell to its left. This cause
 * list clears the panel by only a few dozen pixels at an ordinary desktop width, so
 * the sticky cell was pulled left by exactly that overflow and its opaque fill landed
 * on Orders — the narrowest column on the table, an icon button and its `px-4` and
 * nothing else. The column was in the DOM and reachable by scrolling right, and
 * invisible at the scroll position every reader lands on. It came and went with the
 * window width, the sidebar state and how long a case name ran, which is what made it
 * read as intermittent rather than broken.
 *
 * So Orders pins too, one Action-width in from the edge. `w-60` fixes that width
 * instead of leaving it a floor, because it is now an offset another column is
 * measured from: `right-60` has to equal Action's width or the two overlap again.
 * Below the overflow threshold neither cell moves — a sticky right offset only
 * displaces a cell that would otherwise sit closer to the scrollport edge than the
 * offset allows, and at rest Orders sits exactly `w-60` in.
 */
const ACTION_COLUMN_CLASS = "sticky right-0 z-20 w-60 min-w-60";
/** `w-18` is the `size-10` icon button plus the cell's `px-4`. The fill is the row's,
 *  so the columns it now travels over do not show through it. */
const ORDERS_COLUMN_CLASS = "sticky right-60 z-10 w-18";

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
  const { open, close, hearing: openHearing } = useHearingPeek();
  const expanded = openHearing?.id === hearing.id;

  if (canStartHearing(hearing.status)) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(SESSION_SLOT_CLASS, className)}
        aria-expanded={expanded}
        aria-controls={expanded ? HEARING_PEEK_ID : undefined}
        onClick={() => {
          onStartHearing(hearing);
          open(hearing);
        }}
      >
        Start hearing
      </Button>
    );
  }
  if (canEndHearing(hearing.status)) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(SESSION_SLOT_CLASS, className)}
        onClick={() => {
          onEndHearing(hearing);
          if (expanded) close();
        }}
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
  const { close, hearing: openHearing } = useHearingPeek();
  const expanded = openHearing?.id === hearing.id;

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
        <DropdownMenuItem
          onSelect={() => {
            onPassOver(hearing);
            if (expanded) close();
          }}
        >
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
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-nowrap")}>
            Advocates
          </TableHead>
          <TableHead className={cn(headClass, "min-w-40 whitespace-normal")}>
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
            className={cn(
              headClass,
              ACTION_COLUMN_CLASS,
              "bg-surface-sunken whitespace-nowrap",
            )}
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
            {/* The row's one emphasised cell. Opens the case peek — the same
                glance Start hearing opens — rather than a case file: there is
                no court-side file yet, and the citizen side's is not the bench's
                to point at. */}
            <TableCell
              className={cn(cellClass, "min-w-48 font-medium whitespace-normal")}
            >
              <HearingPeekTrigger hearing={hearing} />
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
            <TableCell className={cn(cellClass, "min-w-40 whitespace-normal")}>
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
              className={cn(
                cellClass,
                ORDERS_COLUMN_CLASS,
                "bg-inherit whitespace-nowrap",
              )}
            >
              <div className="flex justify-center">
                <HearingOrdersButton hearing={hearing} />
              </div>
            </TableCell>
            <TableCell
              className={cn(
                cellClass,
                ACTION_COLUMN_CLASS,
                "bg-inherit whitespace-nowrap",
              )}
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
