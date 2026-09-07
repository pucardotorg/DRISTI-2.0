"use client";

import { HISTORY, HISTORY_SUMMARY } from "@/lib/employee/scrutiny/history";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Timeline, TimelineItem } from "@/components/ui/timeline";

/**
 * Case history — the advocate ↔ registry round trips.
 *
 * A right-anchored sheet, not a tab in the index rail: drawing a mark puts a count badge
 * against that document IN the index, so a tab that displaced the index would hide the
 * officer's own feedback at the moment they generate it. A sheet is a deliberate,
 * dismissible detour.
 *
 * Send-back events expand to the individual items they carried, and each item is a way
 * back into the work rather than a dead record.
 */
export function HistorySheet({
  open,
  onOpenChange,
  onGoToItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToItem: (fieldId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/*
       * The recipe's own width is `data-[side=right]:sm:max-w-sm` (384px); the override
       * has to carry the same data variant or it loses the cascade.
       */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
        <SheetHeader>
          <SheetTitle>Case history</SheetTitle>
          <SheetDescription>{HISTORY_SUMMARY}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {/*
            Our DS `TimelineItem` takes the title and meta as props rather than as
            `TimelineTitle` / `TimelineMeta` children; anything passed as children
            renders underneath them.
          */}
          <Timeline>
            {HISTORY.map((event, i) => (
              <TimelineItem
                key={`${event.title}-${i}`}
                status={event.status}
                title={event.title}
                description={event.meta}
              >
                {event.items ? (
                  <div className="mt-2 flex flex-col gap-0.5">
                    {event.items.map((item) => (
                      <button
                        key={`${item.ref}-${item.what}`}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-md bg-surface-sunken px-2 py-1.5 text-start transition-colors hover:bg-accent"
                        onClick={() => {
                          onOpenChange(false);
                          onGoToItem(item.ref);
                        }}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-caption">
                          {item.what}
                          <span className="font-normal text-muted-foreground">
                            {item.was}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-caption",
                            item.open
                              ? "text-destructive-muted-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {item.open ? "open" : item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </SheetContent>
    </Sheet>
  );
}
