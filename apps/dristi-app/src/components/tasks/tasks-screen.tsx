"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  applyFilters,
  cardCounts,
  caseOf,
  courtsOf,
  DEFAULT_FILTERS,
  type Filters,
  isNarrowed,
  summaryOf,
  VIEW_LABELS,
  viewCounts,
  type World,
} from "@/lib/tasks/selectors";
import { canMarkDone } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import { markDone } from "@/lib/tasks/transitions";
import type { CardKind, Task, TaskId, TaskView, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop, useMinWidth } from "@/hooks/use-min-width";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, useChrome } from "@/components/shell/chrome";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { FilterRow } from "@/components/tasks/filter-row";
import { useFilters } from "@/components/tasks/filters";
import { OverviewCards } from "@/components/tasks/overview-cards";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TasksTable, TasksTableSkeleton } from "@/components/tasks/tasks-table";
import { actHref, useTaskActions, verbTarget } from "@/components/tasks/use-task-actions";

const VIEWS: TaskView[] = ["open", "waiting", "completed"];

/**
 * A tab: label + count as muted tabular text — the same presentation as every count.
 * 40px tall (the DS touch floor), text seated low so the underline still sits ON the
 * band's rule (`-mb-px` + `after:bottom-0`) — one line, not two.
 */
const TAB_CLASS =
  "-mb-px flex-none items-end gap-1.5 rounded-none px-0 pb-2.5 text-body-compact group-data-horizontal/tabs:h-10 group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:bg-brand-accent";

/** A clock that ticks once a minute so due cues stay honest on a long-open tab. */
function useNow(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/**
 * Pending tasks — the command centre. Header, six kind cards (the overview and the
 * filter), three state tabs, a labelled filter row, then ONE lifted table; the detail
 * pushes in from the right on `lg`+ (a sheet below). Everything the cards, tabs and
 * filters hold lives in the URL.
 */
export function TasksScreen() {
  const router = useRouter();
  const store = useTasks();
  const { state, error, people, cases, tasks, user, online, reload, requestHighlight } = store;
  const { act, busy } = useTaskActions();
  const { filters, setFilters, taskId, setTaskId } = useFilters();
  const now = useNow();
  const { navOpen, foldNav, unfoldNav } = useChrome();
  const pushes = useIsDesktop();
  const roomy = useMinWidth(1536);

  const world = React.useMemo<World>(
    () => ({ people, cases, tasks, user, now }),
    [people, cases, tasks, user, now]
  );

  const rows = React.useMemo(() => applyFilters(world, filters), [world, filters]);
  const counts = React.useMemo(() => cardCounts(world, filters.view), [world, filters.view]);
  const tabCounts = React.useMemo(() => viewCounts(world), [world]);
  const summary = React.useMemo(() => summaryOf(world), [world]);
  const courts = React.useMemo(() => courtsOf(world), [world]);

  const openTask = React.useMemo(() => tasks.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const openCase = openTask ? (caseOf(world, openTask) ?? null) : null;

  const [selected, setSelected] = React.useState<Set<TaskId>>(() => new Set());
  const [confirm, setConfirm] = React.useState<{ task: Task } | null>(null);

  const focusRow = React.useCallback((id: TaskId) => {
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLButtonElement>(
        `[data-task-row][data-task-id="${CSS.escape(id)}"] [data-task-title]`
      );
      el?.focus();
      el?.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const closeDetail = React.useCallback(() => {
    const id = taskId;
    setTaskId(null);
    if (id) focusRow(id);
  }, [taskId, setTaskId, focusRow]);

  // Opening a row moves focus to the panel's heading once it has rendered (Escape
  // brings it back to the row). Arriving with `?task=` already in the URL — back from
  // an act page, a shared link — focuses the row instead, once.
  const pendingPanelFocus = React.useRef<TaskId | null>(null);
  const openDetail = React.useCallback(
    (id: TaskId) => {
      pendingPanelFocus.current = id;
      setTaskId(id);
    },
    [setTaskId]
  );
  React.useEffect(() => {
    if (!openTask || pendingPanelFocus.current !== openTask.id) return;
    pendingPanelFocus.current = null;
    const raf = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-task-detail-title]")?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [openTask]);

  const [arrivedWith] = React.useState<TaskId | null>(() => taskId);
  const arrivalDone = React.useRef(false);
  React.useEffect(() => {
    if (state !== "ready" || !arrivedWith || arrivalDone.current) return;
    arrivalDone.current = true;
    requestHighlight(arrivedWith);
    focusRow(arrivedWith);
  }, [state, arrivedWith, requestHighlight, focusRow]);

  // The push panel needs width: below 2xl, fold the main nav to its icon rail while the
  // panel is open, and restore it on close only if this screen folded it.
  const foldedNav = React.useRef(false);
  const navOpenRef = React.useRef(navOpen);
  React.useEffect(() => {
    navOpenRef.current = navOpen;
  }, [navOpen]);
  const panelPushing = pushes && !!openTask;
  React.useEffect(() => {
    if (panelPushing && !roomy) {
      if (navOpenRef.current && !foldedNav.current) {
        foldedNav.current = true;
        foldNav();
      }
      return;
    }
    if (foldedNav.current) {
      foldedNav.current = false;
      unfoldNav();
    }
  }, [panelPushing, roomy, foldNav, unfoldNav]);

  const handleVerb = React.useCallback(
    (task: Task, verb: Verb) => {
      if (verbTarget(task, verb) === "page") {
        const href = actHref(task);
        if (href) router.push(href);
        return;
      }
      if (verb === "Mark done") {
        if (task.isBlocking) setConfirm({ task });
        else void act(task.id, markDone, "Marked done");
        return;
      }
      openDetail(task.id);
    },
    [act, router, openDetail]
  );

  const setView = React.useCallback(
    (view: TaskView) => {
      setSelected(new Set());
      setFilters({ view });
    },
    [setFilters]
  );

  const toggleKind = React.useCallback(
    (kind: CardKind) => setFilters((prev: Filters) => ({ ...prev, kind: prev.kind === kind ? null : kind })),
    [setFilters]
  );

  const clearFilters = React.useCallback(
    () => setFilters({ ...DEFAULT_FILTERS, view: filters.view, sort: filters.sort }),
    [filters.view, filters.sort, setFilters]
  );

  // Only rows in the current table count as selected; ids that scrolled out of the
  // filters are ignored rather than pruned, so a filter round-trip keeps the selection.
  const selectedTasks = React.useMemo(
    () =>
      rows.filter((r) => {
        const k = caseOf(world, r);
        return selected.has(r.id) && k && canMarkDone(user, r, k);
      }),
    [rows, selected, world, user]
  );
  const visibleSelected = React.useMemo(() => new Set(selectedTasks.map((t) => t.id)), [selectedTasks]);

  const markAllDone = async () => {
    let ok = 0;
    for (const t of selectedTasks) if (await act(t.id, markDone)) ok += 1;
    if (ok) toast.success(`Marked done ${ok} task${ok === 1 ? "" : "s"}`);
    setSelected(new Set());
  };

  const narrowed = isNarrowed(filters);
  const emptyKind = narrowed ? "filtered" : "none";

  return (
    <main className="flex min-w-0 flex-1">
      <Breadcrumbs crumbs={openTask ? [{ label: openTask.title }] : []} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-semibold text-foreground">Pending tasks</h1>
          <p className="text-body text-muted-foreground tabular-nums">
            {state === "ready"
              ? `${summary.open} open · ${summary.waiting} waiting on others · ${summary.overdue} overdue`
              : "Loading…"}
          </p>
        </header>

        <OverviewCards
          counts={state === "ready" ? counts : null}
          view={filters.view}
          active={filters.kind}
          loading={state !== "ready"}
          onToggle={toggleKind}
        />

        {/* Views. The active underline sits on the band's own rule rather than floating
            above it — one horizontal line, not two. */}
        <Tabs value={filters.view} onValueChange={(v) => setView(v as TaskView)} className="gap-0">
          <TabsList
            variant="line"
            aria-label="Task views"
            className="w-full justify-start gap-6 border-b border-hairline p-0 pb-0 group-data-horizontal/tabs:h-auto"
          >
            {VIEWS.map((v) => (
              <TabsTrigger key={v} value={v} className={TAB_CLASS}>
                {VIEW_LABELS[v]}
                <span className="text-caption tabular-nums text-muted-foreground">
                  {state === "ready" ? tabCounts[v] : "–"}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <FilterRow
          filters={filters}
          courts={courts}
          people={people}
          narrowed={narrowed}
          onChange={setFilters}
          onClear={clearFilters}
        />

        {!online ? (
          <Banner variant="warning">
            You are offline. The table is read-only until the connection returns — nothing is
            queued, so payments and signatures are never sent twice.
          </Banner>
        ) : null}

        {state === "error" ? (
          <Banner
            variant="error"
            action={
              <Button variant="outline" onClick={() => void reload()}>
                Retry
              </Button>
            }
          >
            Tasks could not be loaded{error ? ` — ${error}` : ""}.
          </Banner>
        ) : null}

        {selectedTasks.length ? (
          <div
            role="region"
            aria-label="Selection"
            className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-sunken px-4 py-2 text-body-compact"
          >
            <span className="tabular-nums">
              {selectedTasks.length} selected
            </span>
            <Button variant="outline" disabled={!online || !!busy} onClick={() => void markAllDone()}>
              Mark done
            </Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        ) : null}

        {state === "loading" ? (
          <TasksTableSkeleton />
        ) : (
          <TasksTable
            rows={rows}
            cases={cases}
            people={people}
            user={user}
            now={now}
            view={filters.view}
            sort={filters.sort}
            query={filters.query}
            openId={taskId}
            selected={visibleSelected}
            offline={!online}
            emptyKind={emptyKind}
            onSort={(sort) => setFilters({ sort })}
            onClearFilters={clearFilters}
            onOpen={(t) => openDetail(t.id)}
            onVerb={handleVerb}
            onToggleSelect={(t) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(t.id)) next.delete(t.id);
                else next.add(t.id);
                return next;
              })
            }
          />
        )}
      </div>

      <TaskDetailPanel
        open={!!openTask && !!openCase}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
        task={openTask}
        kase={openCase}
        user={user}
        people={people}
        now={now}
        offline={!online}
        busy={!!busy}
        onVerb={(verb) => openTask && handleVerb(openTask, verb)}
        onMarkDone={() => openTask && void act(openTask.id, markDone, "Marked done")}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Mark this done?"
        description={
          confirm
            ? `“${confirm.task.title}” is for a hearing. Marking it done says it has happened; nothing is sent to the court.`
            : undefined
        }
        confirmLabel="Mark done"
        destructive={false}
        onConfirm={() => {
          const t = confirm?.task;
          setConfirm(null);
          if (t) void act(t.id, markDone, "Marked done");
        }}
      />
    </main>
  );
}

export function TasksScreenFallback() {
  return (
    <main className="flex min-w-0 flex-1">
      <div className={cn("flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8")}>
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-semibold text-foreground">Pending tasks</h1>
          <p className="text-body text-muted-foreground">Loading…</p>
        </header>
        <TasksTableSkeleton />
      </div>
    </main>
  );
}
