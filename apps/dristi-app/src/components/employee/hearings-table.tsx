"use client";

import Link from "next/link";
import { EllipsisVerticalIcon, FilePlusIcon } from "lucide-react";

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
import type { CourtRole } from "@/lib/employee/content";
import { seatHasBenchControls } from "@/lib/employee/court-role";
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
  hearingProgressLabel,
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
 * control — not teal (Join VC is the screen's one primary). Both are buttons: Start
 * marks the listing ongoing and opens that matter over the list; End marks it
 * completed. Neither leaves the day.
 *
 * It is the only bordered action on a callable row (ui-craft §2). Scheduled listings
 * start; the same slot ends the one that is ongoing. Completed listings have nothing
 * left to call, so the control stops taking a press — the same outline slot now
 * reads *Hearing ended*, disabled, matching the typist's report of that moment. A
 * dash would read as missing data; the words say the call is done. It stays the
 * outline dress (not a second status chip) so the Completed chip remains the one
 * status mark (ui-craft §1.4). Passed-over listings also have nothing left to call
 * today; the slot empties rather than showing that report, because the call was
 * not finished — the Passed over chip is the mark.
 *
 * Pass over is the other sitting outcome, not a second session verb: it lives
 * in a row overflow beside this control, on scheduled and ongoing rows only.
 *
 * `min-w-32` is a floor, not a fit: "Start hearing" measures 83px of ink and "End
 * hearing" / "Hearing ended" sit inside the same width, so 128px holds any of those
 * labels with room and neither the control nor the column jumps when the word
 * changes. It was `min-w-40`, which spent 45px per row on nothing and pushed the
 * table past the width of its own panel — see below.
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
 * It used to open a floating peek over the list, which was retired for the overview
 * page. So the row's one emphasised cell is what it always read as — a link to the
 * case — and it is now the only way to that page: Start hearing opens the same
 * sections in an overlay instead (`hearing-overview-dialog.tsx`). The two surfaces
 * render one composition, so the peek's real fault — the same facts said twice — does
 * not come back with it.
 *
 * Reading the case and calling it are still two different acts. This one only reads:
 * it does not mark the listing ongoing, and it is the one that has to survive a middle
 * click, a new tab and the back button, which is why it stays an anchor while the call
 * beside it is a button.
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
  seat,
  starting = false,
  onStartHearing,
  onEndHearing,
  className,
}: {
  hearing: CourtHearing;
  seat: CourtRole;
  /** This row is inside the typist's start delay — pressed, not yet under way. */
  starting?: boolean;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  className?: string;
}) {
  /* The typist's slot: one control that carries the whole sitting rather than the
     bench's three. It starts the matter and then reports on it — the end is not pressed
     here, it happens on the way into the order (`hearings-screen.tsx`). Same slot, same
     metric and the same outline dress as the bench's, so nothing in the column moves
     when the seat changes. */
  if (!seatHasBenchControls(seat)) {
    const step = hearingProgressLabel(hearing.status);
    if (canStartHearing(hearing.status)) {
      return (
        /* Stays pressable while the start is running rather than going `disabled`:
           disabling under the finger takes the control out of the tab order at the exact
           moment a keyboard user is standing on it, and 2s later it is still gone. The
           label and `aria-busy` carry the wait; a second press is ignored below. */
        <Button
          type="button"
          variant="outline"
          aria-busy={starting || undefined}
          className={cn(SESSION_SLOT_CLASS, className)}
          onClick={() => {
            if (!starting) onStartHearing(hearing);
          }}
        >
          {starting ? "Starting…" : step}
        </Button>
      );
    }
    if (step !== "To start") {
      return (
        /* Once the matter is under way this reports and no longer acts, so it is
           `disabled` and not `aria-disabled` — the same distinction the orders control
           next to it draws: a live precondition, not an unbuilt promise. The fact is
           also in the row's Status chip, so nothing is lost to a reader who cannot tab
           to it. */
        <Button
          type="button"
          disabled
          variant="outline"
          className={cn(SESSION_SLOT_CLASS, className)}
        >
          {step}
        </Button>
      );
    }
    /* Passed over: the label would still read *To start*, but the mark cannot be made —
       `withHearingSession` does not recall a passed-over listing today — and a control
       that offers a press it will not honour is worse than none. The bench leaves this
       slot empty for the same reason; the Passed over chip on the row is the mark. */
    return (
      <span className={cn("inline-flex h-10 items-center", className)}>
        <span className="sr-only">Passed over</span>
      </span>
    );
  }
  if (canStartHearing(hearing.status)) {
    return (
      /* A button, and no longer a link. Calling the matter used to navigate to that
         case's overview; it now marks the listing ongoing and opens the same overview
         over this list (`hearing-overview-dialog.tsx`), so the day the bench is working
         stays on the screen and the next item is one dismissal away. Reading a case
         without calling it is still a destination — that is the cause title on this
         row, which stays an anchor. */
      <Button
        type="button"
        variant="outline"
        className={cn(SESSION_SLOT_CLASS, className)}
        onClick={() => onStartHearing(hearing)}
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
    /* Same report the typist already shows once the sitting is done: outline
       dress, disabled, the words *Hearing ended*. `disabled` rather than
       `aria-disabled` — a live precondition, not an unbuilt promise; the
       Completed chip on the row still carries the fact for a reader who
       cannot tab onto it. */
    <Button
      type="button"
      disabled
      variant="outline"
      className={cn(SESSION_SLOT_CLASS, className)}
    >
      Hearing ended
    </Button>
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
  seat,
  onPassOver,
}: {
  hearing: CourtHearing;
  seat: CourtRole;
  onPassOver: (hearing: CourtHearing) => void;
}) {
  /* Pass over is one of the bench's three controls, and the typist's slot carries one.
     It leaves with the other two rather than staying behind as the single bench act
     reachable from a smaller menu. */
  if (!seatHasBenchControls(seat)) return null;
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
 * The control follows the sitting, not the row: a matter nobody has called yet has no
 * hearing to pass an order in, so on a scheduled listing the icon holds the column
 * disabled and the control beside it is what opens it — Start hearing for the bench, To
 * start for the typist (`canDraftOrder`). **One gate, both seats.** A column open down
 * the whole board for one of them would have every row's order reachable before its
 * matter existed, which is the state this precondition is for.
 *
 * Disabled by the DS `disabled` prop rather than an `aria-disabled` mark, because this
 * is a live precondition and not a missing build — the same distinction as Sign selected
 * forms with nothing ticked.
 *
 * The reason lives in the accessible name: an icon-only control has no room to
 * carry it, and a tooltip cannot be hovered through the DS's
 * `disabled:pointer-events-none`. Sighted readers get it from the row — the
 * Scheduled chip and the start control sit inches away.
 *
 * `onOpen` is the caller's chance to act on the trip itself. The cause list uses it for
 * the typist, where walking into the order is what ends the matter; for the bench it is
 * not supplied and opening the composer changes nothing.
 */
export function HearingOrdersButton({
  hearing,
  onOpen,
}: {
  hearing: CourtHearing;
  onOpen?: (hearing: CourtHearing) => void;
}) {
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
        onClick={() => onOpen?.(hearing)}
      >
        <FilePlusIcon aria-hidden />
      </Link>
    </Button>
  );
}

/** Mobile stack: the start/end control, then Pass over, then orders. */
export function HearingRowActions({
  hearing,
  seat,
  starting,
  onStartHearing,
  onEndHearing,
  onPassOver,
  onOpenOrder,
  className,
}: {
  hearing: CourtHearing;
  seat: CourtRole;
  starting?: boolean;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  onPassOver: (hearing: CourtHearing) => void;
  onOpenOrder?: (hearing: CourtHearing) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <HearingSessionButton
        hearing={hearing}
        seat={seat}
        starting={starting}
        onStartHearing={onStartHearing}
        onEndHearing={onEndHearing}
        className="min-w-0 flex-1"
      />
      <HearingPassOverMenu
        hearing={hearing}
        seat={seat}
        onPassOver={onPassOver}
      />
      <HearingOrdersButton hearing={hearing} onOpen={onOpenOrder} />
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
  seat,
  startingId,
  onStartHearing,
  onEndHearing,
  onPassOver,
  onOpenOrder,
}: {
  rows: CourtHearing[];
  seat: CourtRole;
  /** The listing inside the typist's start delay, if any. */
  startingId?: string | null;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  onPassOver: (hearing: CourtHearing) => void;
  onOpenOrder?: (hearing: CourtHearing) => void;
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
          {/* The column is named for what is in it. For a seat that runs the sitting
              that is the call; for one that does not it is a line about the hearing, and
              a column headed Action with nothing actionable under it is the header
              lying about its own contents. */}
          <TableHead
            className={cn(headClass, ACTION_COLUMN_CLASS, "whitespace-nowrap")}
          >
            {seatHasBenchControls(seat) ? "Action" : "Hearing"}
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
            {/* The row's one emphasised cell. Opens this matter's case overview as a
                page, without calling the matter. */}
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
                <HearingOrdersButton hearing={hearing} onOpen={onOpenOrder} />
              </div>
            </TableCell>
            <TableCell
              className={cn(cellClass, ACTION_COLUMN_CLASS, "whitespace-nowrap")}
            >
              <div className="flex items-center gap-2">
                <HearingSessionButton
                  hearing={hearing}
                  seat={seat}
                  starting={startingId === hearing.id}
                  onStartHearing={onStartHearing}
                  onEndHearing={onEndHearing}
                />
                <HearingPassOverMenu
                  hearing={hearing}
                  seat={seat}
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
