"use client";

import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";

import { blockingCueOf, dueCueOf, ownerOf, statusCueOf } from "@/lib/tasks/format";
import { canMarkDone, verbFor } from "@/lib/tasks/permissions";
import type { Ghost } from "@/lib/tasks/store";
import type { Case, Person, Task, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PersonAvatar } from "@/components/tasks/person-avatar";

/**
 * The due wording, and the only urgency cue a task row carries at rest.
 *
 * Overdue is stated in words and carried by `destructive-ink` text rather than a solid
 * badge: these rows repeat, and a red chip on each one spends the screen's whole
 * destructive budget before the header count is even read. Under an "Overdue" band
 * header the header carries the one red mark and the rows drop to muted (`ink` false).
 *
 * It hides while the row is hovered or holds focus — the actions take this slot rather
 * than stacking beside it. On a device with no hover the swap cannot happen, so both
 * stay visible.
 */
function DueCue({ text, overdue, ink }: { text: string; overdue: boolean; ink: boolean }) {
  return (
    <span
      className={cn(
        "text-caption tabular-nums whitespace-nowrap group-hover/task:hidden group-focus-within/task:hidden pointer-coarse:group-hover/task:inline pointer-coarse:group-focus-within/task:inline",
        overdue && ink ? "font-medium text-destructive-ink" : "text-muted-foreground"
      )}
    >
      {text}
    </span>
  );
}

/**
 * A task's shortcuts, revealed in the due cue's slot on hover **and** on focus-within,
 * and always visible where there is no hover to reveal them. Verbs are outline — the
 * one teal action of the view lives in the detail panel, not on thirty rows.
 */
function TaskActions({
  verb,
  title,
  markDone,
  disabled,
  onVerb,
  onMarkDone,
}: {
  verb: Verb;
  title: string;
  markDone: boolean;
  disabled: boolean;
  onVerb: () => void;
  onMarkDone: () => void;
}) {
  const verbButton = (
    /* 32px of visible button, expanded to the 40px DS touch floor. */
    <Button
      variant="outline"
      size="xs"
      disabled={disabled}
      onClick={onVerb}
      className="relative after:absolute after:-inset-1"
    >
      {verb}
    </Button>
  );
  return (
    <div className="hidden shrink-0 items-center gap-2 group-hover/task:flex group-focus-within/task:flex pointer-coarse:flex">
      {disabled ? (
        <Tooltip>
          {/* A disabled button swallows pointer events; the wrapper carries the tooltip. */}
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-lg">
              {verbButton}
            </span>
          </TooltipTrigger>
          <TooltipContent>You are offline — read only</TooltipContent>
        </Tooltip>
      ) : (
        verbButton
      )}
      {markDone && verb !== "Mark done" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={`Mark done: ${title}`}
              disabled={disabled}
              onClick={onMarkDone}
              /* 32px of visible button, expanded to the 40px DS touch floor. */
              className="relative after:absolute after:-inset-1"
            >
              <CheckIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark done</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export type TaskRowProps = {
  task: Task;
  kase: Case;
  user: Person;
  people: Person[];
  now: Date;
  /** Hide the case line when the list is already grouped by case. */
  hideCase?: boolean;
  /**
   * Whether an overdue due cue is drawn in destructive ink. Off when the band header
   * already says "Overdue" in ink — one red mark per band, not one per row.
   */
  overdueInk?: boolean;
  open: boolean;
  selected: boolean;
  anySelected: boolean;
  flashing: boolean;
  ghost: Ghost | null;
  offline: boolean;
  index: number;
  onOpen: () => void;
  onVerb: (verb: Verb) => void;
  onMarkDone: () => void;
  onToggleSelect: () => void;
  onDismissGhost: () => void;
};

/**
 * One pending task. Title (500) and the case line; on the right the due cue, the one
 * status/permission cue and the owner. Two weights, one status cue, actions swap into
 * the due cue's slot. The row itself opens the detail; `min-h-16` holds the height
 * steady across the swap so hovering a list does not shuffle it.
 */
export const TaskRow = React.forwardRef<HTMLButtonElement, TaskRowProps>(function TaskRow(
  {
    task,
    kase,
    user,
    people,
    now,
    hideCase,
    overdueInk = true,
    open,
    selected,
    anySelected,
    flashing,
    ghost,
    offline,
    index,
    onOpen,
    onVerb,
    onMarkDone,
    onToggleSelect,
    onDismissGhost,
  },
  ref
) {
  const due = dueCueOf(task, now);
  const blocking = blockingCueOf(task, now);
  const status = statusCueOf(task, user, kase, people, now);
  const owner = ownerOf(task, kase, people);
  const verb = verbFor(user, task, kase);
  const markDone = canMarkDone(user, task, kase);
  const closed = ["done", "expired", "obsolete"].includes(task.status);
  const showActions = !ghost && !closed;
  const checkboxId = `select-${task.id}`;

  return (
    <li
      data-task-row
      data-task-id={task.id}
      data-index={index}
      aria-current={open ? "true" : undefined}
      className={cn(
        "group/task relative flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 outline-none transition-colors duration-700 sm:flex-nowrap",
        "hover:bg-accent",
        // Loudness ladder — focus is the ring alone; hover and the open row share the
        // one quiet `accent` fill; a multi-selected row is the DS "selected" fill; a
        // flash is brand, briefly. Never stacked.
        flashing
          ? "bg-brand-muted"
          : selected
            ? "bg-accent-strong"
            : open
              ? "bg-accent"
              : "bg-transparent",
        ghost && "opacity-60"
      )}
    >
      {/* Selection: 16px box, 40px target; visible on hover, focus, touch, or once
          anything is selected. Its space is always reserved so rows do not shift. */}
      <span
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center -ml-2.5",
          !anySelected &&
            !selected &&
            "opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 pointer-coarse:opacity-100"
        )}
      >
        <Checkbox
          id={checkboxId}
          checked={selected}
          disabled={!!ghost || closed}
          onCheckedChange={onToggleSelect}
          aria-label={`Select: ${task.title}`}
          className="after:absolute after:-inset-3"
        />
      </span>

      <div className="flex min-w-0 flex-1 basis-0 flex-col gap-0.5">
        <button
          ref={ref}
          type="button"
          data-task-title
          onClick={onOpen}
          className="text-left text-body-compact font-medium text-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
        >
          {task.title}
        </button>
        <p className="text-caption text-muted-foreground">
          {hideCase ? null : (
            <>
              <span>{kase.parties}</span>
              {kase.stNumber ? (
                <>
                  <span aria-hidden> · </span>
                  <span className="font-mono tabular-nums">{kase.stNumber}</span>
                </>
              ) : (
                <>
                  <span aria-hidden> · </span>
                  <span>Not yet numbered</span>
                </>
              )}
              <span aria-hidden> · </span>
              <span>{kase.court.replace(", Kollam", "")}</span>
            </>
          )}
          {blocking ? (
            <>
              {hideCase ? null : <span aria-hidden> · </span>}
              <span className="text-brand-muted-foreground">{blocking}</span>
            </>
          ) : null}
        </p>
      </div>

      {/* Right side: due cue (or the actions), the ONE status cue, the owner. On a phone
          this wraps under the title, indented past the checkbox. */}
      <div className="relative z-10 flex w-full items-center justify-between gap-3 pl-7 sm:w-auto sm:shrink-0 sm:justify-end sm:pl-0">
        <div className="flex min-w-0 flex-col items-start sm:items-end">
          {/* The slot is held at the actions' height, so the swap never moves the row.
              On touch both the cue and the verb are visible, so they need a gap. */}
          <div className="flex h-8 items-center pointer-coarse:gap-3">
            {ghost ? (
              <span className="text-caption text-muted-foreground">Done by {ghost.byName} just now</span>
            ) : (
              <>
                <DueCue text={due.text} overdue={due.overdue} ink={overdueInk} />
                {showActions ? (
                  <TaskActions
                    verb={verb}
                    title={task.title}
                    markDone={markDone}
                    disabled={offline}
                    onVerb={() => onVerb(verb)}
                    onMarkDone={onMarkDone}
                  />
                ) : null}
              </>
            )}
          </div>
          {status && !ghost ? (
            <span className="max-w-72 text-caption text-muted-foreground sm:text-right">
              {status}
            </span>
          ) : null}
        </div>
        {/* The owner slot has one width whether it holds an avatar or the word, so the
            due cues above it line up down the list. */}
        <span className="flex shrink-0 items-center justify-end sm:w-20">
          {ghost ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss"
              onClick={onDismissGhost}
              className="relative after:absolute after:-inset-1"
            >
              <XIcon aria-hidden />
            </Button>
          ) : owner ? (
            <PersonAvatar person={owner} you={owner.id === user.id} />
          ) : (
            <span className="text-caption text-muted-foreground">Unassigned</span>
          )}
        </span>
      </div>
    </li>
  );
});
