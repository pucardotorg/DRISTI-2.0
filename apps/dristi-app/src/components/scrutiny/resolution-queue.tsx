"use client";

/**
 * The corrections list — one flat run through the filing (brief v3.2).
 *
 * Two things were taken out of v3.1 and both were layers of reading:
 *
 *   · **Section headings are gone.** Every row names its own place — "Cheque 2 › Bank
 *     branch" — so nothing has to be decoded from a heading three rows up.
 *   · **Nothing regroups.** A corrected row keeps its position and gains a tick. Moving
 *     finished work to the bottom made the list shuffle under the cursor of someone
 *     working down it, which is a worse cost than having the done ones interleaved.
 *
 * The order is the form's own (`formOrder`), so working down this list is working through
 * the filing front to back. The open defect expands *in place* into its card, which is the
 * only place a correction is made — see `defect-card.tsx`.
 */

import * as React from "react";
import { ChevronRightIcon, CircleCheckIcon, CircleDashedIcon, TriangleAlertIcon } from "lucide-react";

import { dueCueOf } from "@/lib/tasks/format";
import { breadcrumbOf, defectState, resolutionLabel } from "@/lib/tasks/defects";
import type { Defect, Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type QueueDefect = {
  defect: Defect;
  value: string | undefined;
};

/* ───────────────────────────── The header ───────────────────────────── */

/**
 * The deadline and the count, together — one clock and one counter on the whole screen, so
 * no two numbers here can disagree. The relative phrase is what an advocate acts on; the
 * absolute date rides in a `<time dateTime>` because the five-day window is still an
 * assumption (open question O7) and an assumption should be inspectable.
 */
export function QueueProgress({
  task,
  resolved,
  total,
  className,
}: {
  task?: Task;
  resolved: number;
  total: number;
  className?: string;
}) {
  const due = task?.dueAt ? dueCueOf(task) : null;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {due ? (
        <p className="flex flex-wrap items-center gap-x-2 text-caption">
          <span
            className={cn(
              "font-medium tabular-nums",
              due.overdue ? "text-destructive-ink" : "text-warning-ink"
            )}
          >
            {due.primary}
          </span>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <time dateTime={task?.dueAt} className="text-muted-foreground tabular-nums">
            {due.date}
          </time>
        </p>
      ) : null}
      <Progress
        value={total ? (resolved / total) * 100 : 0}
        aria-label={`${resolved} of ${total} corrections done`}
        className="h-1.5"
      />
      <p className="text-caption text-muted-foreground tabular-nums">
        {`${resolved} of ${total} done`}
      </p>
    </div>
  );
}

/* ───────────────────────────── One row ───────────────────────────── */

/**
 * How a finished defect was finished — one word at the end of the row.
 *
 * `resolutionLabel` writes the full sentence a card can afford ("Suggestion accepted");
 * a row shares its line with the whole location and cannot. Same four outcomes, said short.
 */
function doneWord(defect: Defect, value: string | undefined): string {
  switch (resolutionLabel(defect, value)) {
    case "Suggestion accepted":
      return "Accepted";
    case "Kept, with a reason":
      return "Kept yours";
    case "Document replaced":
      return "Replaced";
    default:
      return "Corrected";
  }
}

export function QueueRow({
  item,
  onOpen,
}: {
  item: QueueDefect;
  onOpen: () => void;
}) {
  const { defect, value } = item;
  const state = defectState(defect, value);
  const resolved = state === "resolved";
  /* The whole location, on the row itself: "Cheque 2 › Bank branch". With the section
     headings gone this is the only thing that says where the defect lives, so it wraps
     rather than truncating — Malayalam and Gujarati run longer still. */
  const where = breadcrumbOf(defect.target).join(" › ");

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        className="h-auto min-h-11 w-full items-start justify-start gap-2.5 whitespace-normal rounded-lg px-3 py-2.5 text-left font-normal"
      >
        <span className="flex pt-0.5">
          {resolved ? (
            <CircleCheckIcon className="size-4 shrink-0 text-success-ink" aria-hidden />
          ) : state === "needs-justification" ? (
            <TriangleAlertIcon className="size-4 shrink-0 text-warning-ink" aria-hidden />
          ) : (
            <CircleDashedIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 text-body-compact break-words",
            resolved ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {where}
        </span>
        {resolved ? (
          <span className="shrink-0 pt-0.5 text-caption text-success-ink">
            {doneWord(defect, value)}
          </span>
        ) : null}
        <ChevronRightIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
      </Button>
    </li>
  );
}

/* ───────────────────────────── The list ───────────────────────────── */

/**
 * The run, in the form's order. `renderOpen` supplies the card for whichever defect is
 * open, so the card expands in the row's own place rather than the row vanishing to a
 * panel somewhere else.
 */
export function ResolutionQueue({
  items,
  activeDefect,
  onOpenDefect,
  renderOpen,
  className,
}: {
  items: QueueDefect[];
  activeDefect: number | null;
  onOpenDefect: (n: number) => void;
  renderOpen: (item: QueueDefect, index: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {items.map((item, i) =>
        item.defect.n === activeDefect ? (
          <li key={item.defect.n} className="py-1">
            {renderOpen(item, i + 1)}
          </li>
        ) : (
          <QueueRow
            key={item.defect.n}
            item={item}
            onOpen={() => onOpenDefect(item.defect.n)}
          />
        )
      )}
    </ul>
  );
}

/** The gate, in words. Never a dead button with no explanation beside it. */
export function submitReason(
  resolved: number,
  total: number,
  online: boolean
): string {
  if (!online) return "You are offline — corrections stay on this device until you reconnect.";
  const left = total - resolved;
  if (left <= 0) return "Everything is corrected.";
  return `${left} left to correct.`;
}
