"use client";

/**
 * The resolution queue — a compact index, and the only place work is counted (brief D5,
 * §15.6).
 *
 * It is an index and not a reading surface: no officer prose, no accordion, no per-row
 * "go to the field" button. One row is one button, and the row *is* the affordance. What
 * a defect says lives beside the field it concerns; repeating it here was the redundancy
 * v2 set out to remove.
 *
 * Opening a row navigates the centre pane to that defect's section and instance, then
 * moves focus to the inset's primary action. Moving focus rather than merely scrolling is
 * what makes the queue work for a keyboard and a screen reader — a scroll-only jump is a
 * mouse affordance dressed as navigation.
 *
 * The header carries the return's deadline and its count together: one place for the
 * clock, one place for the counter, and the group labels therefore carry no counts of
 * their own. The clock is the one amber in the chrome — the §138 clocks are the only
 * genuinely urgent thing on this screen.
 */

import * as React from "react";
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  ClockIcon,
  TriangleAlertIcon,
} from "lucide-react";

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
  if (state === "needs-justification") return "Needs a reason";
  return "Open";
}

/**
 * The deadline and the count, together. The relative phrase is what an advocate acts on;
 * the absolute date rides in a `<time dateTime>` because the five-day window is still an
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
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
          <span
            className={cn(
              "flex items-center gap-1.5 font-medium tabular-nums",
              due.overdue ? "text-destructive-ink" : "text-warning-ink"
            )}
          >
            <ClockIcon className="size-4 shrink-0" aria-hidden />
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
        aria-label={`${resolved} of ${total} defects resolved`}
        className="h-1.5"
      />
      <p className="text-caption text-muted-foreground tabular-nums">
        {`${resolved} of ${total} resolved`}
      </p>
    </div>
  );
}

/* ───────────────────────────── One row ───────────────────────────── */

function QueueRow({
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
  const resolved = state === "resolved";
  const trail = breadcrumbOf(defect.target);
  /* The section is on the rail and in the form's own heading; the row needs the part that
     disambiguates — "Cheque 2 › Bank branch". */
  const where = trail.slice(1).join(" › ") || trail.join(" › ");

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        /* Selected is one quiet persistent cue, and `accent-strong` is the token the role
           names (`AGENTS.md` rule 10) — not a ring, not a border, not a brand fill. */
        className={cn(
          "h-auto min-h-10 w-full items-start justify-start gap-2 whitespace-normal rounded-lg px-3 py-2 text-left font-normal",
          active && "bg-accent-strong hover:bg-accent-strong"
        )}
      >
        <span className="flex pt-0.5">
          <StateMark state={state} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Wraps rather than truncates: a clipped "Cheque 2 › Bank branch" is a wrong
              answer to the problem the target exists to solve, and Malayalam and Gujarati
              run longer still. */}
          <span
            className={cn(
              "text-body-compact font-medium break-words",
              resolved ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {where}
          </span>
          <span
            className={cn(
              "text-caption",
              resolved ? "text-success-ink" : "text-muted-foreground"
            )}
          >
            {resolved ? resolutionLabel(defect, value) : stateWord(state)}
          </span>
        </span>
        <ChevronRightIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
      </Button>
    </li>
  );
}

/* ───────────────────────────── The index ───────────────────────────── */

function Group({
  label,
  items,
  activeDefect,
  onOpenDefect,
}: {
  label: string;
  items: QueueDefect[];
  activeDefect: number | null;
  onOpenDefect: (n: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h3 className="px-3 text-caption font-medium text-muted-foreground">{label}</h3>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <QueueRow
            key={item.defect.n}
            item={item}
            active={activeDefect === item.defect.n}
            onOpen={() => onOpenDefect(item.defect.n)}
          />
        ))}
      </ul>
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
  const open = items.filter((i) => defectState(i.defect, i.value) !== "resolved");
  const done = items.filter((i) => defectState(i.defect, i.value) === "resolved");
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Group label="Open" items={open} activeDefect={activeDefect} onOpenDefect={onOpenDefect} />
      <Group
        label="Resolved"
        items={done}
        activeDefect={activeDefect}
        onOpenDefect={onOpenDefect}
      />
    </div>
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
