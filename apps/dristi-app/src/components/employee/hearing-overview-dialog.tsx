"use client";

import * as React from "react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
import { OVERLAY_RISE, RESOLVE_IN_PLACE } from "@/components/chrome/motion";
import {
  HearingOverviewCaption,
  HearingOverviewSections,
  ViewCaseAction,
} from "@/components/employee/hearing-overview-screen";
import { HearingSessionButton } from "@/components/employee/hearings-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CourtRole } from "@/lib/employee/content";
import {
  causeTitle,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  type CourtHearing,
} from "@/lib/employee/hearings";
import { cn } from "@/lib/utils";

/**
 * A matter from the day's list, read over the list it came from.
 *
 * **One thing opens it: the cause title, and the row that delegates to it.** Reading a
 * matter is one act and calling it is another, and they are now cleanly one control
 * each. The overlay used to be the destination for both — Start hearing marked the
 * listing ongoing and opened this on its way — which made calling the list a run of
 * presses each answered by a sheet to dismiss. Calling no longer opens anything
 * (owner, 2026-09-12); it changes the row it was pressed on and leaves the day where it
 * was.
 *
 * So opening this changes nothing about the matter. Whatever the chip in the header
 * reads is the row's own status, arrived at before this was opened.
 *
 * What it shows is the case overview's own sections, not a second reading of them
 * (`HearingOverviewSections`). The route survives underneath for the one job an overlay
 * cannot do — a link that has to outlive the page, in a bookmark or a typed URL — but no
 * control on the list hands one out any more.
 *
 * **It reads, and it calls — nothing else.** The sitting's other outcomes stay on the
 * row: Pass over is not a second session verb (`HearingPassOverMenu`) and the order
 * composer is a trip of its own. What the footer carries is the one control that moves
 * *this* matter through the day, and it is the same control the row carries, in the same
 * four states (`HearingSessionButton`) — one vocabulary, two places to reach it, rather
 * than an overlay that invents a second way to say Start. It reads whatever the matter's
 * next move is at the moment it was opened: Start hearing on a listing still to be
 * called, End hearing on one under way, and spent on one already heard.
 *
 * Pressing it resolves in place (ui-craft §7): the chip and the footer change where they
 * stand, nothing remounts, and the reader is not thrown back to the list to find out
 * what happened. The row underneath has already changed too — the mark lives outside
 * this component (`lib/employee/hearing-session.ts`), which is what lets the two agree.
 *
 * **Nothing here is a court record.** The same bargain the cause list already makes
 * (`lib/employee/hearings.ts`): starting a hearing is a screen mark, and View case is
 * not connected to anything.
 */
export function HearingOverviewDialog({
  hearing,
  seat,
  onStartHearing,
  onEndHearing,
  onOpenChange,
}: {
  /** The listing being read, or `null` when nothing is open. */
  hearing: CourtHearing | null;
  /** Decides whether the footer carries the call at all — as on the row. */
  seat: CourtRole;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={hearing !== null} onOpenChange={onOpenChange}>
      {hearing ? (
        /* Keyed on the listing so calling a second matter opens on its own scroll
           position rather than inheriting the first's — the pattern the review
           queues set. Keyed on the listing and *not* on its status: an act performed
           in here must not remount the sheet, or the outcome reads as the window
           slamming and reopening (ui-craft §7). */
        <HearingOverviewBody
          key={hearing.id}
          hearing={hearing}
          seat={seat}
          onStartHearing={onStartHearing}
          onEndHearing={onEndHearing}
        />
      ) : null}
    </Dialog>
  );
}

function HearingOverviewBody({
  hearing,
  seat,
  onStartHearing,
  onEndHearing,
}: {
  hearing: CourtHearing;
  seat: CourtRole;
  onStartHearing: (hearing: CourtHearing) => void;
  onEndHearing: (hearing: CourtHearing) => void;
}) {
  /* Where this listing stood when the sheet opened. A status different from it is an
     act the reader performed *in here*, and that is the only thing that gets to move:
     the sheet is already rising on open, and a chip that animated then would be a
     second movement on one gesture (ui-craft §8). State rather than a ref because it is
     read during render; the body is keyed on the listing, so a second matter captures
     its own. */
  const [statusAtOpen] = React.useState(hearing.status);
  const resolved = hearing.status !== statusAtOpen;

  return (
    /* The review overlays' shell, because this is the same kind of surface one route
       along: a sheet in the page column, its own padding removed so the header, the
       reading and the footer are three rows of one column and only the middle one
       scrolls. `sm:max-w-4xl` is what lets the sections keep their two-column pairing
       inside the sheet instead of stacking into a tall scroll.
       Height is a cap, not a measure — unlike the review overlays, which hold a document
       preview and want the full 85dvh whatever is in it. A first listing here is three
       short sections, and a sheet pinned to 85dvh for them would be mostly empty. */
    <ChromeDialogContent
      className={cn(
        "flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl",
        /* The sheet rises rather than snapping open at 95%, the same way the review
           overlays do. It matters more here than it did when this only read: the
           footer now holds a decision, and a decision that zooms open reads as a
           menu (ui-craft §8). */
        OVERLAY_RISE,
      )}
    >
      {/* `pr-16` keeps the title clear of the sheet's own close button. The chip rides
          with the cause title, the same thought in the same order as the page: this
          matter, and where it stands on today's list. */}
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-3">
          <DialogTitle className="text-title-s font-semibold">
            {causeTitle(hearing)}
          </DialogTitle>
          {/* Keyed on the status so a change remounts the chip and replays the
              movement — the one thing that moved, moving (ui-craft §8). The class is
              what is conditional, not the key: on open nothing has happened yet, so
              the chip arrives with the sheet and does not move on its own. */}
          <Badge
            key={hearing.status}
            variant={courtHearingStatusVariant(hearing.status)}
            className={resolved ? RESOLVE_IN_PLACE : undefined}
          >
            {courtHearingStatusLabel(hearing.status)}
          </Badge>
        </div>
        {/* The page prints this line above the title as an eyebrow; a dialog reads
            its description after it, at the house dialog's own support size. Same
            words, the role the surface asks for. */}
        <DialogDescription className="text-body-compact text-muted-foreground">
          <HearingOverviewCaption hearing={hearing} />
        </DialogDescription>
      </DialogHeader>
      {/* The sheet is the lifted surface; this column is the stage inside it, so
          the sections can sit as white cards. The header keeps the sheet's fill so
          the tint reads as the reading surface, not a grey dialog. Fill, not a
          rule, separates the two — the header already sits on a different value. */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-sunken p-6">
        <HearingOverviewSections hearing={hearing} surface="overlay" />
      </div>
      {/* The page's band, as a footer — chrome, so `bg-card` and a hairline seam
          rather than the DS default's grey fill and full-strength rule, which would be
          the loudest stroke on the sheet (ui-craft §4, and the recipe the registrations
          overlay already uses).

          Two controls, and the order is the DOM order: the footer is `sm:flex-row
          sm:justify-end` above `sm` and `flex-col-reverse` below it, so the last child
          is the trailing one on a desktop and the top one on a phone. The act goes
          last. Both are `w-fit` so the stacked phone footer is two buttons and not two
          bars.

          There is no Close. It was the way out for a pointer that never found the
          corner, and it spent the footer's leading slot on the one thing every other
          exit already does — the sheet's own ✕, Esc, and the scrim. The slot is worth
          more to the act (owner, 2026-09-12). */}
      <DialogFooter className="mx-0 mb-0 shrink-0 border-hairline bg-card">
        <ViewCaseAction variant="outline" />
        <HearingSessionButton
          hearing={hearing}
          seat={seat}
          variant="default"
          onStartHearing={onStartHearing}
          onEndHearing={onEndHearing}
          className="w-fit"
        />
      </DialogFooter>
      {/* The outcome, for a reader who cannot see the chip change.
          It has to live *inside* the sheet: Radix hides the rest of the page from
          assistive tech while a modal is open, so the cause list's own announcer —
          which says the same thing for a press made on the row — is unreachable from
          here and would announce to nobody. Mounted empty from the start, because a
          live region that appears already holding its message is not reliably read. */}
      <p className="sr-only" aria-live="polite">
        {resolved
          ? `${causeTitle(hearing)} is now ${courtHearingStatusLabel(
              hearing.status,
            ).toLowerCase()}`
          : null}
      </p>
    </ChromeDialogContent>
  );
}
