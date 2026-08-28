"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Person, Task } from "@/lib/tasks/types";
import { dueCueOf } from "@/lib/tasks/format";
import { cn } from "@/lib/utils";

/**
 * Shared atoms of the advocate home: the team avatar, the cause-list item chip,
 * and the task row that repeats inside hearing cards, the case peek and the rail.
 */

/** Initials chip for someone on a case. Brand tint marks the signed-in user. */
export function TeamAvatar({
  person,
  you,
  onBrand,
  className,
}: {
  person: Person;
  /** This is the signed-in account — the one brand-tinted avatar per row. */
  you?: boolean;
  /** Sitting on the brand-tinted now card, where the sunken fill has no depth. */
  onBrand?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
            you
              ? "bg-brand-muted text-brand-muted-foreground"
              : onBrand
                ? "bg-card text-foreground"
                : "bg-surface-sunken text-foreground",
            className
          )}
        >
          {person.initials}
          <span className="sr-only">{person.name}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{you ? `${person.name} (you)` : person.name}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The listed item number. A plain card tile on the brand-tinted hero, a sunken
 * well elsewhere — the fill change is the depth, so neither variant carries a
 * shadow inside its already-lifted card.
 */
export function ItemChip({
  item,
  size = "default",
  onBrand,
}: {
  item: number;
  size?: "default" | "lg";
  onBrand?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-md",
        onBrand ? "bg-card" : "bg-surface-sunken",
        size === "lg" ? "size-12" : "size-11"
      )}
    >
      {size === "lg" ? (
        <>
          <span className="text-caption text-muted-foreground">item</span>
          <span className="text-title-s font-semibold tabular-nums">{item}</span>
        </>
      ) : (
        <span className="text-body font-medium tabular-nums">{item}</span>
      )}
    </span>
  );
}

/**
 * The due wording, and the only cue a task row carries at rest. Overdue is words
 * in `destructive-ink`, not a solid badge — these rows repeat, and a red chip on
 * each would spend the screen's whole destructive budget before the rail count is
 * read. It yields its slot to the action on hover / focus-within; on a device
 * with no hover both stay visible.
 */
export function DueCue({
  children,
  overdue,
}: {
  children: ReactNode;
  overdue?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-caption tabular-nums group-hover/task:hidden group-focus-within/task:hidden",
        overdue ? "font-medium text-destructive-ink" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/** The task's one shortcut, revealed in the due cue's slot. */
export function TaskAction({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <div className="hidden shrink-0 items-center group-hover/task:flex group-focus-within/task:flex pointer-coarse:flex">
      <Button variant="outline" size="xs" onClick={onOpen}>
        {label}
      </Button>
    </div>
  );
}

/**
 * One pending task inside a hearing card or the case peek. The row itself opens
 * the task; `min-h-16` holds the height steady across the hover swap.
 */
export function HomeTaskRow({
  task,
  now,
  sub,
  action,
  onOpen,
  className,
}: {
  task: Task;
  now: Date | string | number;
  /** Optional second line — e.g. the matter, where the card does not already say it. */
  sub?: string;
  /** The task's own verb — "Pay", "Sign", "Open". */
  action: string;
  onOpen: () => void;
  className?: string;
}) {
  const due = dueCueOf(task, new Date(now));
  return (
    <div
      className={cn(
        "group/task relative flex min-h-16 items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-accent has-focus-visible:bg-accent",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={onOpen}
          className="text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {task.title}
        </button>
        {sub ? (
          <span className="text-caption text-muted-foreground">{sub}</span>
        ) : null}
      </div>
      <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-2">
        <DueCue overdue={due.overdue}>{due.primary}</DueCue>
        <TaskAction label={action} onOpen={onOpen} />
      </div>
    </div>
  );
}
