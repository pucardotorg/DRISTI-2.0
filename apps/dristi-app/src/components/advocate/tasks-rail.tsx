"use client";

import { ChevronRight, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { railCaseLineOf, railTasks } from "@/lib/advocate/home";
import { caseOf, summaryOf, type World } from "@/lib/tasks/selectors";
import { verbFor } from "@/lib/tasks/permissions";
import { dueCueOf } from "@/lib/tasks/format";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { DueCue, TaskAction } from "@/components/advocate/home-bits";

/**
 * A task in the rail: two calm lines — title and due cue, then the matter it
 * belongs to. The action swaps into the due cue's slot on hover / focus-within,
 * so at rest the card carries no buttons at all.
 */
function RailTaskCard({
  world,
  locale,
  task,
  onOpen,
}: {
  world: World;
  locale: Locale;
  task: Task;
  onOpen: () => void;
}) {
  const due = dueCueOf(task, new Date(world.now));
  const kase = caseOf(world, task);
  return (
    <div
      className={cn(
        // Flat tiles: a card on the neutral-2 rail is only ~1.01:1, so a
        // hairline — not a shadow — is what makes each task a unit.
        "group/task relative flex flex-col gap-1 rounded-lg border border-hairline bg-card p-3 outline-none",
        "transition-colors hover:bg-accent has-focus-visible:bg-accent"
      )}
    >
      <div className="flex min-h-8 items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {task.title}
        </button>
        <div className="relative z-10 flex shrink-0 items-center justify-end gap-2">
          <DueCue overdue={due.overdue}>{due.primary}</DueCue>
          <TaskAction
            label={kase ? verbFor(world.user, task, kase) : pick(advHome.open, locale)}
            onOpen={onOpen}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
          {railCaseLineOf(world, task)}
        </span>
        {task.isBlocking ? (
          <span className="shrink-0 text-caption text-brand-muted-foreground">
            {pick(advHome.blocksHearing, locale)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The collapsed strip — the rail's resting width, never its absence. */
function RailStrip({
  locale,
  count,
  onOpen,
}: {
  locale: Locale;
  count: number;
  onOpen: () => void;
}) {
  return (
    <div className="flex w-16 flex-col items-center py-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpen}
        aria-label={fillCopy(advHome.railOpen, locale, { n: String(count) })}
        className="relative bg-warning-muted text-warning-ink hover:bg-warning-muted-hover"
      >
        <ListChecks aria-hidden="true" />
        {count ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-caption tabular-nums text-destructive-foreground"
          >
            {count}
          </span>
        ) : null}
      </Button>
    </div>
  );
}

/**
 * The pending-tasks rail — the Needs-action tab of /tasks, in its exact order,
 * standing beside the board. Two widths on a desktop viewport, a 64px strip or a
 * 320px panel, expanding in place; it never leaves the layout. Below `md` the
 * strip stands down — the nav rail's Pending Tasks entry is the phone's door.
 */
export function TasksRail({
  world,
  locale,
  open,
  topOffset,
  onOpen,
  onClose,
  onOpenTask,
  onViewAll,
}: {
  world: World;
  locale: Locale;
  open: boolean;
  /** The shell top bar's height — the rail hangs below it. */
  topOffset: string;
  onOpen: () => void;
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  onViewAll: () => void;
}) {
  const tasks = railTasks(world);
  const count = summaryOf(world).action;

  return (
    <aside
      aria-label={pick(advHome.railTitle, locale)}
      style={{ top: topOffset, height: `calc(100svh - ${topOffset})` }}
      className={cn(
        "sticky hidden shrink-0 flex-col self-start overflow-hidden border-l border-hairline bg-sidebar transition-[width] duration-200 ease-out md:flex",
        open ? "w-80" : "w-16"
      )}
    >
      {open ? (
        <div className="flex h-full w-80 flex-col">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <ListChecks aria-hidden="true" className="size-4 text-warning-ink" />
            <h2 className="flex-1 text-title-s font-semibold">
              {pick(advHome.railTitle, locale)}
            </h2>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={pick(advHome.railCollapse, locale)}
              onClick={onClose}
              className="relative after:absolute after:-inset-1"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          {tasks.length ? (
            <>
              <p className="px-4 pb-2 text-caption font-semibold text-warning-ink">
                {pick(advHome.railCaption, locale)}
              </p>
              <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 pb-3">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <RailTaskCard
                      world={world}
                      locale={locale}
                      task={task}
                      onOpen={() => onOpenTask(task.id)}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-8 text-center">
              <p className="text-body-compact font-medium">
                {pick(advHome.railEmptyTitle, locale)}
              </p>
              <p className="text-caption text-muted-foreground">
                {pick(advHome.railEmptyBody, locale)}
              </p>
            </div>
          )}
          <div className="border-t border-hairline px-4 py-3">
            <Button variant="link" size="sm" className="px-0" onClick={onViewAll}>
              {fillCopy(advHome.railViewAll, locale, { n: String(count) })}
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <RailStrip locale={locale} count={count} onOpen={onOpen} />
      )}
    </aside>
  );
}
