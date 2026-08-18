"use client";

import * as React from "react";
import { ChevronDownIcon, CircleCheckIcon, SearchXIcon } from "lucide-react";

import type { Group } from "@/lib/tasks/selectors";
import type { Ghost } from "@/lib/tasks/store";
import type { Case, Person, Task, TaskId, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PANEL_CLASS } from "@/components/shell/panel";
import { TaskRow } from "@/components/tasks/task-row";

/** Rows still arriving: chrome intact, the list as calm placeholders. */
export function TaskListSkeleton() {
  return (
    <Card className={cn(PANEL_CLASS, "gap-0 py-0")} aria-busy="true" aria-label="Loading tasks">
      <div className="px-4 py-2">
        <Skeleton className="h-4 w-24" />
      </div>
      <ul className="divide-y divide-hairline">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex min-h-16 items-center gap-3 px-4 py-3">
            <Skeleton className="size-4 rounded-sm" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3 max-w-96" />
              <Skeleton className="h-3 w-1/2 max-w-64" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-6 rounded-full" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * A band / group eyebrow. Sticky under the top bar; the hairline under it is what stops
 * it from floating over the row half-hidden beneath. `ink` puts the one red mark of an
 * Overdue / Long pending band here, so its rows can stay muted.
 */
function GroupHeader({
  label,
  count,
  trigger,
  ink,
}: {
  label: string;
  count: number;
  trigger?: boolean;
  ink?: boolean;
}) {
  return (
    <div
      className={cn(
        "sticky top-14 z-10 flex items-center gap-2 border-b border-hairline bg-card px-4 py-2 text-caption font-semibold text-muted-foreground",
        trigger && "w-full text-left transition-colors hover:bg-accent",
        ink && "text-destructive-ink"
      )}
    >
      <span>{label}</span>
      <span className="font-medium tabular-nums">{count}</span>
      {trigger ? (
        <ChevronDownIcon
          aria-hidden
          className="ml-auto size-4 text-muted-foreground transition-transform group-data-open/group:rotate-180"
        />
      ) : null}
    </div>
  );
}

export type TaskListProps = {
  groups: Group[];
  cases: Case[];
  people: Person[];
  user: Person;
  now: Date;
  hideCase?: boolean;
  /** How the rows are grouped — band headers carry the overdue ink; other groupings leave it on the row. */
  groupKey: "band" | "case" | "kind" | "person";
  /** The search text, if any — the filtered-empty state names it. */
  query?: string;
  openId: string | null;
  selected: Set<TaskId>;
  flashId: string | null;
  ghosts: Ghost[];
  offline: boolean;
  /** Which empty state to show when there are no groups. */
  emptyKind: "none" | "filtered";
  view: "todo" | "waiting" | "done";
  onClearFilters: () => void;
  onOpen: (task: Task) => void;
  onVerb: (task: Task, verb: Verb) => void;
  onMarkDone: (task: Task) => void;
  onToggleSelect: (task: Task) => void;
  onDismissGhost: (taskId: TaskId) => void;
};

/**
 * One lifted panel holding the groups. Group headers are sticky under the top bar;
 * rows divide with hairlines; *Long pending* starts collapsed with its count.
 *
 * Keyboard: ↑/↓ move between rows, Enter opens (the title is a real button), `x`
 * toggles selection. Focus lives on the row's title button, so the reveal-on-focus
 * actions show as you move.
 */
export function TaskList(props: TaskListProps) {
  const {
    groups,
    cases,
    people,
    user,
    now,
    hideCase,
    groupKey,
    query,
    openId,
    selected,
    flashId,
    ghosts,
    offline,
    emptyKind,
    view,
    onClearFilters,
    onOpen,
    onVerb,
    onMarkDone,
    onToggleSelect,
    onDismissGhost,
  } = props;

  const listRef = React.useRef<HTMLDivElement>(null);
  const flat = React.useMemo(() => groups.flatMap((g) => g.tasks), [groups]);

  const focusRow = React.useCallback((index: number) => {
    const root = listRef.current;
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>("[data-task-title]");
    const target = buttons[Math.max(0, Math.min(index, buttons.length - 1))];
    target?.focus();
    target?.scrollIntoView({ block: "nearest" });
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    // Only when focus is on a row's title — not inside a checkbox or a button, and never
    // while typing in a field.
    if (!target.matches("[data-task-title]")) return;
    const row = target.closest<HTMLElement>("[data-task-row]");
    const index = Number(row?.dataset.index ?? -1);
    if (index < 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusRow(flat.length - 1);
    } else if (event.key === "x" || event.key === "X") {
      event.preventDefault();
      const task = flat[index];
      if (task) onToggleSelect(task);
    }
  };

  if (groups.length === 0) {
    return (
      <Card className={cn(PANEL_CLASS, "py-0")}>
        {emptyKind === "filtered" ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{query?.trim() ? `Nothing matches “${query.trim()}”` : "No tasks match"}</EmptyTitle>
              <EmptyDescription>
                {query?.trim()
                  ? "Try another spelling or a party name, or clear the search."
                  : "Clear a chip or a filter to see more."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-success-muted text-success-ink">
                <CircleCheckIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>
                {view === "todo"
                  ? "Nothing pending"
                  : view === "waiting"
                    ? "Nothing waiting on anyone"
                    : "Nothing closed yet"}
              </EmptyTitle>
              <EmptyDescription>
                {view === "todo"
                  ? "Every case you can see is up to date."
                  : view === "waiting"
                    ? "Tasks sent for approval, submitted to the court or paying through the gateway will wait here."
                    : "Completed, expired and withdrawn tasks are kept here with why they closed."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Card>
    );
  }

  // Flat index of each group's first row, for ↑/↓ across groups.
  const starts = groups.reduce<number[]>((acc, g, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + groups[i - 1].tasks.length);
    return acc;
  }, []);

  return (
    <Card className={cn(PANEL_CLASS, "gap-0 overflow-clip py-0")}>
      <div ref={listRef} onKeyDown={onKeyDown} className="flex flex-col">
        {groups.map((group, gi) => {
          const start = starts[gi];
          const bandInk = groupKey === "band" && (group.key === "overdue" || group.key === "long-pending");
          const rows = (
            <ul className="divide-y divide-hairline" aria-label={`${group.label}, ${group.count}`}>
              {group.tasks.map((task, i) => {
                const kase = cases.find((c) => c.id === task.caseId);
                if (!kase) return null;
                const ghost = ghosts.find((g) => g.taskId === task.id) ?? null;
                return (
                  <TaskRow
                    key={task.id}
                    index={start + i}
                    task={task}
                    kase={kase}
                    user={user}
                    people={people}
                    now={now}
                    hideCase={hideCase}
                    overdueInk={!bandInk}
                    open={openId === task.id}
                    selected={selected.has(task.id)}
                    anySelected={selected.size > 0}
                    flashing={flashId === task.id}
                    ghost={ghost}
                    offline={offline}
                    onOpen={() => onOpen(task)}
                    onVerb={(verb) => onVerb(task, verb)}
                    onMarkDone={() => onMarkDone(task)}
                    onToggleSelect={() => onToggleSelect(task)}
                    onDismissGhost={() => onDismissGhost(task.id)}
                  />
                );
              })}
            </ul>
          );

          if (group.collapsed) {
            return (
              <Collapsible key={group.key} className={cn("group/group", gi > 0 && "border-t border-hairline")}>
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <GroupHeader label={group.label} count={group.count} trigger ink={bandInk} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>{rows}</CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <section key={group.key} className={cn(gi > 0 && "border-t border-hairline")}>
              <GroupHeader label={group.label} count={group.count} ink={bandInk} />
              {rows}
            </section>
          );
        })}
      </div>
    </Card>
  );
}
