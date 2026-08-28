"use client";

import * as React from "react";
import {
  CalendarClock,
  ChevronDown,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import {
  prepQueue,
  railCaseLineOf,
  railGroups,
  type PrepItem,
  type RailGroup,
} from "@/lib/advocate/home";
import { summaryOf, type World } from "@/lib/tasks/selectors";
import { consequenceAt, daysUntil, isOverdue } from "@/lib/tasks/urgency";
import type { Task, TaskKind } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

/**
 * The companion rail — Gmail's model. A persistent icon strip on the far right
 * holds one entry per section: Pending tasks and Hearing prep (the matters
 * listed soon that are not ready — the job the old notifications did). Clicking
 * an icon opens that section's panel beside the strip; clicking it again
 * returns to the strip alone. One panel at a time; the strip never leaves.
 */

export type RailSection = "tasks" | "prep";

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
export const RAIL_DEFAULT_WIDTH = 384;

function groupLabel(locale: Locale, group: RailGroup): string {
  if (group.key === "today") return pick(advHome.groupToday, locale);
  if (group.key === "soon") return pick(advHome.groupSoon, locale);
  return pick(advHome.groupWeek, locale);
}

/**
 * The hover action every row in this rail shares: an overlay, out of the layout
 * flow, floated over the row's right edge on hover / focus-within — so the verb
 * is explicit and the row's geometry provably never changes. The overlay's fill
 * matches the row's hover fill, so it masks cleanly. On touch there is no hover:
 * the row itself is the button, and the overlay stays away.
 */
function HoverAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="absolute inset-y-0 right-0 z-10 hidden items-center rounded-r-lg bg-accent pr-2 pl-3 group-hover/task:flex group-focus-within/task:flex pointer-coarse:group-hover/task:hidden">
      <Button variant="outline" size="xs" onClick={onClick} tabIndex={-1}>
        {label}
      </Button>
    </div>
  );
}

/**
 * One pending task: a single-line title over the matter line — every card the
 * same height, so the list reads as a rhythm, not a pile. The kind icon carries
 * the what; the hover overlay carries the verb.
 */
function TaskCard({
  world,
  task,
  verb,
  onAct,
}: {
  world: World;
  task: Task;
  verb: string;
  onAct: (task: Task) => void;
}) {
  const Icon = KIND_ICON[task.kind];
  const at = consequenceAt(task);
  const overdue = isOverdue(task, world.now);
  const days = overdue && at ? -daysUntil(at, world.now) : 0;

  return (
    <div
      className={cn(
        // Flat tiles: a card on the neutral-2 rail is only ~1.01:1, so a
        // hairline — not a shadow — is what makes each task a unit.
        "group/task relative flex h-16 cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-card px-3",
        "transition-colors hover:bg-accent has-focus-visible:bg-accent"
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onAct(task)}
          title={task.title}
          className="truncate text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {task.title}
        </button>
        <span className="truncate text-caption text-muted-foreground">
          {railCaseLineOf(world, task)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {overdue ? (
          <span className="text-caption font-medium tabular-nums text-destructive-ink">
            {days}d
          </span>
        ) : null}
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>

      <HoverAction label={verb} onClick={() => onAct(task)} />
    </div>
  );
}

function TasksPanel({
  world,
  locale,
  verbOf,
  onAct,
  onViewAll,
}: {
  world: World;
  locale: Locale;
  verbOf: (task: Task) => string;
  onAct: (task: Task) => void;
  onViewAll: () => void;
}) {
  const groups = railGroups(world, Number(new Date(world.now)));
  const count = summaryOf(world).action;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <ListChecks aria-hidden="true" className="size-4 text-warning-ink" />
        <h2 className="flex-1 text-title-s font-semibold">
          {pick(advHome.railTitle, locale)}
        </h2>
      </div>

      {groups.length ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-3 pb-3">
          {groups.map((group) => (
            <Collapsible
              key={group.key}
              defaultOpen={group.key === "today"}
              className="flex flex-col gap-2"
            >
              {/* The Slack move: the timeline collapses. Today stands open,
                  the rest wait as a header and a count until asked. */}
              <CollapsibleTrigger className="group/bucket flex h-9 w-full shrink-0 items-center gap-1.5 rounded-lg px-1.5 transition-colors hover:bg-accent">
                <span
                  className={cn(
                    "text-caption font-semibold",
                    group.key === "today"
                      ? "text-warning-ink"
                      : "text-muted-foreground"
                  )}
                >
                  {groupLabel(locale, group)}
                </span>
                <span className="text-caption font-medium tabular-nums text-muted-foreground">
                  {group.tasks.length}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="ml-auto size-4 text-muted-foreground transition-transform group-data-open/bucket:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="flex flex-col gap-2 pb-2">
                  {group.tasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard
                        world={world}
                        task={task}
                        verb={verbOf(task)}
                        onAct={onAct}
                      />
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
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
  );
}

/** One matter that is listed soon and not ready — same fixed height as a task card. */
function PrepCard({
  locale,
  item,
  onOpenCase,
}: {
  locale: Locale;
  item: PrepItem;
  onOpenCase: (caseId: string) => void;
}) {
  const when = new Intl.DateTimeFormat(locale === "ml" ? "ml-IN" : "en-IN", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(item.at));
  const toDo =
    item.blockers.length === 1
      ? pick(advHome.prepToDoOne, locale)
      : fillCopy(advHome.prepToDoMany, locale, { n: String(item.blockers.length) });

  return (
    <div
      className={cn(
        "group/task relative flex h-16 cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-card px-3",
        "transition-colors hover:bg-accent has-focus-visible:bg-accent"
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground"
      >
        <Gavel className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onOpenCase(item.kase.id)}
          title={item.kase.parties}
          className="truncate text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {item.kase.parties}
        </button>
        <span className="truncate text-caption text-muted-foreground">
          {when} · {item.kase.court.replace(", Kollam", "")}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-caption font-medium text-warning-ink">{toDo}</span>
        <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>

      <HoverAction
        label={pick(advHome.viewCase, locale)}
        onClick={() => onOpenCase(item.kase.id)}
      />
    </div>
  );
}

function PrepPanel({
  world,
  locale,
  onOpenCase,
}: {
  world: World;
  locale: Locale;
  onOpenCase: (caseId: string) => void;
}) {
  const queue = prepQueue(world, Number(new Date(world.now)));

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-1">
        <CalendarClock aria-hidden="true" className="size-4 text-warning-ink" />
        <h2 className="flex-1 text-title-s font-semibold">
          {pick(advHome.prepTitle, locale)}
        </h2>
      </div>
      <p className="px-4 pb-3 text-caption text-muted-foreground">
        {pick(advHome.prepCaption, locale)}
      </p>

      {queue.length ? (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 pb-3">
          {queue.map((item) => (
            <li key={item.kase.id}>
              <PrepCard locale={locale} item={item} onOpenCase={onOpenCase} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-8 text-center">
          <p className="text-body-compact font-medium">
            {pick(advHome.prepEmptyTitle, locale)}
          </p>
          <p className="text-caption text-muted-foreground">
            {pick(advHome.prepEmptyBody, locale)}
          </p>
        </div>
      )}
    </div>
  );
}

/** One entry on the strip: icon, count, active state — like Gmail's side apps. */
function StripButton({
  icon: Icon,
  label,
  count,
  countTone,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  countTone: "destructive" | "warning";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "relative flex size-10 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-brand-muted text-brand-muted-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
          {count ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-caption tabular-nums",
                countTone === "destructive"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-warning-muted font-medium text-warning-ink"
              )}
            >
              {count}
            </span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

export function CompanionRail({
  world,
  locale,
  section,
  topOffset,
  onSectionChange,
  verbOf,
  onAct,
  onOpenCase,
  onViewAllTasks,
}: {
  world: World;
  locale: Locale;
  /** Which panel is open; null = strip only. */
  section: RailSection | null;
  /** The shell top bar's height — the rail hangs below it. */
  topOffset: string;
  onSectionChange: (section: RailSection | null) => void;
  /** The viewer's verb for a task — resolved by the screen that owns the world. */
  verbOf: (task: Task) => string;
  onAct: (task: Task) => void;
  onOpenCase: (caseId: string) => void;
  onViewAllTasks: () => void;
}) {
  const tasksCount = summaryOf(world).action;
  const prepCount = prepQueue(world, Number(new Date(world.now))).length;
  const [width, setWidth] = React.useState(RAIL_DEFAULT_WIDTH);
  const dragFrom = React.useRef<{ x: number; width: number } | null>(null);

  const clamp = (w: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragFrom.current = { x: e.clientX, width };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragFrom.current) return;
    // The panel sits on the right, so dragging left grows it.
    setWidth(clamp(dragFrom.current.width + (dragFrom.current.x - e.clientX)));
  }
  function onPointerUp() {
    dragFrom.current = null;
  }
  function onHandleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") setWidth((w) => clamp(w + 16));
    if (e.key === "ArrowRight") setWidth((w) => clamp(w - 16));
  }

  const toggle = (next: RailSection) =>
    onSectionChange(section === next ? null : next);

  return (
    <aside
      aria-label={pick(advHome.railTitle, locale)}
      style={{ top: topOffset, height: `calc(100svh - ${topOffset})` }}
      className="sticky hidden shrink-0 self-start border-l border-hairline bg-sidebar md:flex"
    >
      {section ? (
        <div className="relative flex h-full" style={{ width }}>
          {/* The resize handle: an invisible grab strip on the panel's edge with
              a visible thumb on hover — drag, or arrows when focused. */}
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

          {section === "tasks" ? (
            <TasksPanel
              world={world}
              locale={locale}
              verbOf={verbOf}
              onAct={onAct}
              onViewAll={onViewAllTasks}
            />
          ) : (
            <PrepPanel world={world} locale={locale} onOpenCase={onOpenCase} />
          )}
        </div>
      ) : null}

      {/* The strip — always present, one icon per section, like Gmail's side
          apps. The seam only appears once a panel stands beside it. */}
      <div
        className={cn(
          "flex w-14 flex-col items-center gap-2 pt-4",
          section && "border-l border-hairline"
        )}
      >
        <StripButton
          icon={ListChecks}
          label={fillCopy(advHome.railOpen, locale, { n: String(tasksCount) })}
          count={tasksCount}
          countTone="destructive"
          active={section === "tasks"}
          onClick={() => toggle("tasks")}
        />
        <StripButton
          icon={CalendarClock}
          label={fillCopy(advHome.prepOpen, locale, { n: String(prepCount) })}
          count={prepCount}
          countTone="warning"
          active={section === "prep"}
          onClick={() => toggle("prep")}
        />
      </div>
    </aside>
  );
}
