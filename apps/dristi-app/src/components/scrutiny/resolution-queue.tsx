"use client";

/**
 * The resolution queue — the spine of the screen, and the only place work is counted
 * (brief D5). One card per defect: what it is, where it lives, what the officer said,
 * and the one action that clears it.
 *
 * Opening a card *navigates* the centre pane to that defect's section and instance and
 * then moves focus to its field. Moving focus rather than merely scrolling is what makes
 * the queue work for a keyboard and a screen reader; scroll-only would be a mouse
 * affordance dressed as navigation.
 *
 * The footer carries the screen's one primary teal action (`foundations/laws` — ration
 * teal), and states its own gate in words rather than leaving a dead button to be poked.
 */

import * as React from "react";
import { CircleCheckIcon, CircleDashedIcon, TriangleAlertIcon } from "lucide-react";

import { breadcrumbOf, defectState, resolutionLabel } from "@/lib/tasks/defects";
import type { Defect } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type QueueDefect = {
  defect: Defect;
  value: string | undefined;
};

/* ───────────────────────────── One card ───────────────────────────── */

function StateMark({ state }: { state: ReturnType<typeof defectState> }) {
  if (state === "resolved") {
    return <CircleCheckIcon className="size-4 shrink-0 text-success-ink" aria-hidden />;
  }
  if (state === "needs-justification") {
    return <TriangleAlertIcon className="size-4 shrink-0 text-warning-ink" aria-hidden />;
  }
  return <CircleDashedIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

function stateWord(state: ReturnType<typeof defectState>): string {
  if (state === "resolved") return "Resolved";
  if (state === "needs-justification") return "Needs a reason";
  return "Open";
}

function QueueCard({
  item,
  active,
  onOpen,
}: {
  item: QueueDefect;
  active: boolean;
  onOpen: () => void;
}) {
  const { defect, value } = item;
  const state = defectState(defect, value);
  const trail = breadcrumbOf(defect.target);

  return (
    <AccordionItem
      value={String(defect.n)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-lg border border-hairline bg-card transition-shadow",
        active && "shadow-raised"
      )}
    >
      <AccordionTrigger
        onClick={onOpen}
        className="items-start gap-3 px-4 py-3 hover:no-underline"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <span className="flex items-center gap-2">
            <StateMark state={state} />
            <span className="text-caption font-semibold tabular-nums text-muted-foreground">
              Defect {defect.n}
            </span>
            <span aria-hidden className="text-caption text-muted-foreground">
              ·
            </span>
            <span
              className={cn(
                "text-caption",
                state === "resolved" ? "text-success-ink" : "text-muted-foreground"
              )}
            >
              {state === "resolved" ? resolutionLabel(defect, value) : stateWord(state)}
            </span>
          </span>
          {/* Wraps rather than truncates: a clipped "Case details › Cheque 2 › IFSC" is a
              wrong answer to the very problem the target exists to solve, and Malayalam
              and Gujarati make these lines longer still. */}
          <span className="text-body-compact font-medium text-foreground">
            {trail.join(" › ")}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-3 px-4 pb-4">
        <p className="text-body-compact text-muted-foreground">{defect.note}</p>
        <Button type="button" variant="outline" size="sm" onClick={onOpen} className="w-fit">
          {state === "resolved" ? "Review in the form" : "Go to the field"}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ───────────────────────────── The queue ───────────────────────────── */

export function QueueProgress({
  resolved,
  total,
  className,
}: {
  resolved: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-compact font-medium text-foreground tabular-nums whitespace-nowrap">
          {resolved} of {total} resolved
        </span>
      </div>
      <Progress
        value={total ? (resolved / total) * 100 : 0}
        aria-label={`${resolved} of ${total} defects resolved`}
        className="h-1.5"
      />
    </div>
  );
}

export function ResolutionQueue({
  items,
  activeDefect,
  onOpenDefect,
  className,
}: {
  items: QueueDefect[];
  activeDefect: number | null;
  onOpenDefect: (n: number) => void;
  className?: string;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      value={activeDefect === null ? "" : String(activeDefect)}
      onValueChange={(v) => onOpenDefect(v ? Number(v) : -1)}
      className={cn("flex flex-col gap-3", className)}
    >
      {items.map((item) => (
        <QueueCard
          key={item.defect.n}
          item={item}
          active={activeDefect === item.defect.n}
          onOpen={() => onOpenDefect(item.defect.n)}
        />
      ))}
    </Accordion>
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
  if (left <= 0) return "Every defect is resolved.";
  return `${left} defect${left === 1 ? "" : "s"} still to resolve.`;
}
