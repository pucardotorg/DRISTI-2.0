"use client";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
import {
  HearingOverviewCaption,
  HearingOverviewSections,
  ViewCaseAction,
} from "@/components/employee/hearing-overview-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  causeTitle,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  type CourtHearing,
} from "@/lib/employee/hearings";

/**
 * The matter the bench has just called, over the list it was called from.
 *
 * Start hearing used to navigate to that matter's case overview, which meant the day's
 * work left the screen at the exact moment the bench started working it: the cause list
 * unmounted, the next item went out of sight, and getting back to it was a trip through
 * the trail. Calling item 4 is a move *within* the sitting, not a departure from it — so
 * it now opens here, one dismissal away from the list, with the day still underneath.
 *
 * What it shows is the case overview's own sections, not a second reading of them
 * (`HearingOverviewSections`). The route survives for the two jobs an overlay cannot do
 * — reading a matter without calling it, from the cause title on the same row, and a
 * link that has to survive a bookmark, a new tab or the back button.
 *
 * **The overlay reads; it does not run the sitting.** The mark has already been made by
 * the time this opens — the chip in the header says so — and End hearing, Pass over and
 * the order composer all stay on the row, where the day is. Closing this returns the
 * bench to that row with the matter now ongoing.
 *
 * **Nothing here is a court record.** The same bargain the cause list already makes
 * (`lib/employee/hearings.ts`): starting a hearing is a screen mark, and View case is
 * not connected to anything.
 */
export function HearingOverviewDialog({
  hearing,
  onOpenChange,
}: {
  /** The listing being read, or `null` when nothing is open. */
  hearing: CourtHearing | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={hearing !== null} onOpenChange={onOpenChange}>
      {hearing ? (
        /* Keyed on the listing so calling a second matter opens on its own scroll
           position rather than inheriting the first's — the pattern the review
           queues set. */
        <HearingOverviewBody key={hearing.id} hearing={hearing} />
      ) : null}
    </Dialog>
  );
}

function HearingOverviewBody({ hearing }: { hearing: CourtHearing }) {
  return (
    /* The review overlays' shell, because this is the same kind of surface one route
       along: a sheet in the page column, its own padding removed so the header, the
       reading and the footer are three rows of one column and only the middle one
       scrolls. `sm:max-w-4xl` is what lets the sections keep their two-column pairing
       inside the sheet instead of stacking into a tall scroll.
       Height is a cap, not a measure — unlike the review overlays, which hold a document
       preview and want the full 85dvh whatever is in it. A first listing here is three
       short sections, and a sheet pinned to 85dvh for them would be mostly empty. */
    <ChromeDialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
      {/* `pr-16` keeps the title clear of the sheet's own close button. The chip rides
          with the cause title, the same thought in the same order as the page: this
          matter, and it is under way. */}
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-3">
          <DialogTitle className="text-title-s font-semibold">
            {causeTitle(hearing)}
          </DialogTitle>
          <Badge variant={courtHearingStatusVariant(hearing.status)}>
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
      {/* The page's band, as a footer: the same one action, on the trailing edge.
          Close sits beside it as the way out for a pointer that never finds the
          corner — the sheet is dismissible by Esc and by the scrim either way. */}
      <DialogFooter className="mx-0 mb-0 shrink-0">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogClose>
        <ViewCaseAction />
      </DialogFooter>
    </ChromeDialogContent>
  );
}
