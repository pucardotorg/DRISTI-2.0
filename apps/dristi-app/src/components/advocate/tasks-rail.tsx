"use client";

import * as React from "react";
import {
  ChevronRight,
  FileClock,
  FileUp,
  Gavel,
  IndianRupee,
  ListChecks,
  PenLine,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { railCaseLineOf, railGroups, type RailGroup } from "@/lib/advocate/home";
import { caseOf, summaryOf, type World } from "@/lib/tasks/selectors";
import { verbFor } from "@/lib/tasks/permissions";
import { daysUntil } from "@/lib/tasks/urgency";
import { consequenceAt } from "@/lib/tasks/urgency";
import type { Task, TaskKind } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

/** What the task asks for, at a glance — one icon per kind, all muted. */
const KIND_ICON: Record<TaskKind, LucideIcon> = {
  sign: PenLine,
  pay: IndianRupee,
  file: FileUp,
  returned: Undo2,
  hearing: Gavel,
  draft: FileClock,
};

const MIN_WIDTH = 280;
const MAX_WIDTH = 460;
export const RAIL_DEFAULT_WIDTH = 320;

function groupLabel(locale: Locale, group: RailGroup): string {
  if (group.key === "overdue") return pick(advHome.groupOverdue, locale);
  if (group.key === "today") return pick(advHome.groupToday, locale);
  if (group.key === "tomorrow") return pick(advHome.groupTomorrow, locale);
  const day = new Intl.DateTimeFormat(locale === "ml" ? "ml-IN" : "en-IN", {
    weekday: "long",
  }).format(group.at!);
  return fillCopy(advHome.groupOn, locale, { day });
}

/**
 * One task, two calm lines under a dated header. The header carries the date, so
 * the card does not repeat it — only the overdue group keeps a per-card count,
 * because "overdue" alone does not say by how much. The kind icon does the
 * scanning work; the verb appears in place on hover / focus (always on touch).
 */
function RailTaskCard({
  world,
  locale,
  task,
  overdueGroup,
  onAct,
}: {
  world: World;
  locale: Locale;
  task: Task;
  overdueGroup: boolean;
  onAct: (task: Task) => void;
}) {
  const kase = caseOf(world, task);
  const Icon = KIND_ICON[task.kind];
  const at = consequenceAt(task);
  const days = overdueGroup && at ? -daysUntil(at, world.now) : 0;

  return (
    <div
      className={cn(
        // Flat tiles: a card on the neutral-2 rail is only ~1.01:1, so a
        // hairline — not a shadow — is what makes each task a unit.
        "group/task relative flex items-start gap-3 rounded-lg border border-hairline bg-card p-3",
        "transition-colors hover:bg-accent has-focus-visible:bg-accent"
      )}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onAct(task)}
          className="text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {task.title}
        </button>
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <span className="min-w-0 truncate">{railCaseLineOf(world, task)}</span>
          {task.isBlocking ? (
            <span className="shrink-0 text-brand-muted-foreground">
              · {pick(advHome.blocksHearing, locale)}
            </span>
          ) : null}
        </span>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2 self-center">
        {overdueGroup ? (
          <span className="text-caption font-medium tabular-nums text-destructive-ink group-hover/task:hidden group-focus-within/task:hidden">
            {days}d
          </span>
        ) : null}
        <div className="hidden group-hover/task:flex group-focus-within/task:flex pointer-coarse:flex">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onAct(task)}
          >
            {kase ? verbFor(world.user, task, kase) : pick(advHome.open, locale)}
          </Button>
        </div>
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
 * The pending-tasks rail — the coming week of the Needs-action tab, bucketed
 * under dated headers so each card stays quiet; everything beyond the week
 * lives behind "View all". Open by default, resizable by its left-edge handle
 * (drag, or arrow keys on the handle), collapsing to a 64px strip that never
 * leaves the layout. Below `md` the strip stands down — the nav rail's Pending
 * Tasks entry is the phone's door.
 */
export function TasksRail({
  world,
  locale,
  open,
  topOffset,
  onOpen,
  onClose,
  onAct,
  onViewAll,
}: {
  world: World;
  locale: Locale;
  open: boolean;
  /** The shell top bar's height — the rail hangs below it. */
  topOffset: string;
  onOpen: () => void;
  onClose: () => void;
  onAct: (task: Task) => void;
  onViewAll: () => void;
}) {
  const groups = railGroups(world, Number(new Date(world.now)));
  const count = summaryOf(world).action;
  const [width, setWidth] = React.useState(RAIL_DEFAULT_WIDTH);
  const dragFrom = React.useRef<{ x: number; width: number } | null>(null);

  const clamp = (w: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragFrom.current = { x: e.clientX, width };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragFrom.current) return;
    // The rail sits on the right, so dragging left grows it.
    setWidth(clamp(dragFrom.current.width + (dragFrom.current.x - e.clientX)));
  }
  function onPointerUp() {
    dragFrom.current = null;
  }
  function onHandleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") setWidth((w) => clamp(w + 16));
    if (e.key === "ArrowRight") setWidth((w) => clamp(w - 16));
  }

  return (
    <aside
      aria-label={pick(advHome.railTitle, locale)}
      style={{
        top: topOffset,
        height: `calc(100svh - ${topOffset})`,
        width: open ? width : undefined,
      }}
      className={cn(
        "sticky hidden shrink-0 flex-col self-start overflow-hidden border-l border-hairline bg-sidebar md:flex",
        open ? "" : "w-16 transition-[width] duration-200 ease-out"
      )}
    >
      {open ? (
        <div className="relative flex h-full flex-col">
          {/* The resize handle: an invisible grab strip on the rail's edge with a
              visible thumb on hover — drag, or arrows when focused. */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={pick(advHome.railResize, locale)}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onHandleKeyDown}
            className="group/handle absolute inset-y-0 left-0 z-10 w-2 cursor-col-resize outline-none"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 bg-transparent transition-colors group-hover/handle:bg-brand-accent group-focus-visible/handle:bg-brand-accent"
            />
          </div>

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

          {groups.length ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-3 pb-3">
              {groups.map((group) => (
                <section key={group.key} className="flex flex-col gap-2">
                  <h3
                    className={cn(
                      "px-1 text-caption font-semibold",
                      group.key === "overdue"
                        ? "text-destructive-ink"
                        : group.key === "today"
                          ? "text-warning-ink"
                          : "text-muted-foreground"
                    )}
                  >
                    {groupLabel(locale, group)}
                    <span className="ml-1.5 font-medium tabular-nums text-muted-foreground">
                      {group.tasks.length}
                    </span>
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {group.tasks.map((task) => (
                      <li key={task.id}>
                        <RailTaskCard
                          world={world}
                          locale={locale}
                          task={task}
                          overdueGroup={group.key === "overdue"}
                          onAct={onAct}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
