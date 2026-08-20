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
import { headerDate } from "@/lib/tasks/format";
import { ACTIONABLE, canArchive } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import { archive, markDone, unarchive } from "@/lib/tasks/transitions";
import type { CardKind, Task, TaskId, TaskView, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop, useMinWidth } from "@/hooks/use-min-width";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, useChrome } from "@/components/shell/chrome";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { TaskActModal } from "@/components/tasks/act/act-modal";
import { FilterRow } from "@/components/tasks/filter-row";
import { useFilters } from "@/components/tasks/filters";
import { OverviewCards } from "@/components/tasks/overview-cards";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TasksTable, TasksTableSkeleton } from "@/components/tasks/tasks-table";
import { type ActMode, actModeOf, actPathOf, useTaskActions } from "@/components/tasks/use-task-actions";

const VIEWS: TaskView[] = ["needs-action", "waiting", "completed", "archived"];

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
 * The flows that leave this screen for their own page, each behind a dialog that says
 * so. Signing is designed but lives in its own flow; scrutiny (fix & re-file) and
 * e-filing (drafts) are not built yet, so their pages are interim.
 */
type Flow = "sign" | "scrutiny" | "filing";

const FLOW_DIALOG: Record<Flow, { title: string; description: string }> = {
  sign: {
    title: "Continuing in the signing flow",
    description: "Signing happens in its own flow. We'll bring you back here when it's done.",
  },
  scrutiny: {
    title: "Continuing in the scrutiny flow",
    description:
      "Fixing defects and re-filing happens in the scrutiny flow, which is not built yet — this is an interim screen. We'll bring you back here when it's done.",
  },
  filing: {
    title: "Continuing in the filing flow",
    description:
      "Drafting and filing happens in the e-filing flow, which is not built yet — this is an interim screen. We'll bring you back here when it's done.",
  },
};

/** Where each flow's page lives for a task. */
function flowPathOf(flow: Flow, task: Task): string {
  const id = encodeURIComponent(task.id);
  if (flow === "sign") return `/tasks/${id}/sign`;
  if (flow === "scrutiny") return `/tasks/${id}/fix`;
  return `/tasks/${id}/continue`;
}

/** The flow a Continue verb hands its draft to — by the kind the draft will become. */
function draftFlowOf(task: Task): Flow | null {
  if (task.kind === "sign") return "sign";
  if (task.kind === "returned") return "scrutiny";
  if (task.kind === "pay") return null; // paying acts in place — the modal
  return "filing";
}

/**
 * Pending tasks — the command centre. A dated header, four ability-based tabs, then the
 * tab's own breakdown: six kind cards (the overview and the filter), a labelled filter
 * row, and ONE lifted table; the detail pushes in from the right on `lg`+ (a sheet
 * below). Pay and file act in a modal over the table; sign, fix & re-file and drafts
 * continue in their own pages behind a dialog. Search lives in the top bar. Everything
 * the cards, tabs and filters hold lives in the URL — the kind stays put across tab
 * switches, so a batch being cleared survives a change of view.
 */
export function TasksScreen() {
  const store = useTasks();
  const { state, error, people, cases, tasks, user, online, reload, requestHighlight } = store;
  const { act, busy } = useTaskActions();
  const router = useRouter();
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
  const tabCounts = React.useMemo(() => viewCounts(world, filters.query), [world, filters.query]);
  const summary = React.useMemo(() => summaryOf(world), [world]);
  const courts = React.useMemo(() => courtsOf(world), [world]);

  const openTask = React.useMemo(() => tasks.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const openCase = openTask ? (caseOf(world, openTask) ?? null) : null;

  const [selected, setSelected] = React.useState<Set<TaskId>>(() => new Set());
  /** Tasks awaiting the mark-as-done confirmation — one from a row, several from the bar. */
  const [confirmDone, setConfirmDone] = React.useState<Task[] | null>(null);
  /** The leaving-this-screen dialog: sign, fix and continue open their own pages. */
  const [flowNotice, setFlowNotice] = React.useState<{ task: Task; flow: Flow } | null>(null);
  /** The act modal — pay and file only (the owner's rule). */
  const [acting, setActing] = React.useState<{ taskId: TaskId; mode: ActMode } | null>(null);
  const actingTask = React.useMemo(
    () => (acting ? (tasks.find((t) => t.id === acting.taskId) ?? null) : null),
    [acting, tasks]
  );
  const actingCase = actingTask ? (caseOf(world, actingTask) ?? null) : null;

  const focusRow = React.useCallback((id: TaskId) => {
    window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLButtonElement>(
        `[data-task-row][data-task-id="${CSS.escape(id)}"] [data-task-title]`
      );
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "nearest" });
        return;
      }
      // The row may have left this tab — a task completed on its act page comes back
      // under Completed. Its panel is open (`?task=`), so focus lands on its title.
      document.querySelector<HTMLElement>("[data-task-detail-title]")?.focus();
    });
  }, []);

  const closeDetail = React.useCallback(() => {
    const id = taskId;
    setTaskId(null);
    if (id) focusRow(id);
  }, [taskId, setTaskId, focusRow]);

  // Opening a row moves focus to the panel's heading once it has rendered (Escape
  // brings it back to the row). Arriving with `?task=` already in the URL — an old act
  // route's redirect, a shared link — focuses the row instead, once.
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

  const openAct = React.useCallback(
    (task: Task, mode: ActMode | null) => {
      if (mode) setActing({ taskId: task.id, mode });
    },
    []
  );

  const handleVerb = React.useCallback(
    (task: Task, verb: Verb) => {
      switch (verb) {
        case "Pay":
        case "File":
          openAct(task, actModeOf(task));
          return;
        case "Sign":
          setFlowNotice({ task, flow: "sign" });
          return;
        case "Re-file":
          setFlowNotice({ task, flow: "scrutiny" });
          return;
        case "Continue": {
          // A draft continues in its own flow, behind the dialog; a pay draft is a
          // payment and acts in place.
          const flow = draftFlowOf(task);
          if (flow) setFlowNotice({ task, flow });
          else openAct(task, actModeOf(task));
          return;
        }
        case "Mark done":
          setConfirmDone([task]);
          return;
        case "Unarchive":
          void act(task.id, unarchive, "Restored from the archive");
          return;
        default:
          openDetail(task.id);
      }
    },
    [act, openAct, openDetail]
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
        return selected.has(r.id) && k && canArchive(user, r, k);
      }),
    [rows, selected, world, user]
  );
  const visibleSelected = React.useMemo(() => new Set(selectedTasks.map((t) => t.id)), [selectedTasks]);
  // Mark as done needs an open-state task; a filed one waiting on the court does not.
  const doableSelected = React.useMemo(
    () => selectedTasks.filter((t) => ACTIONABLE.has(t.status)),
    [selectedTasks]
  );

  const markAllDone = async (batch: Task[]) => {
    let ok = 0;
    for (const t of batch) if (await act(t.id, markDone)) ok += 1;
    if (ok) toast.success(`Marked done ${ok} task${ok === 1 ? "" : "s"}`);
    setSelected(new Set());
  };

  const archiveAll = async () => {
    let ok = 0;
    for (const t of selectedTasks) if (await act(t.id, archive)) ok += 1;
    if (ok) toast.success(`Archived ${ok} task${ok === 1 ? "" : "s"}`);
    setSelected(new Set());
  };

  const narrowed = isNarrowed(filters);
  const emptyKind = narrowed ? "filtered" : "none";

  return (
    <main className="flex min-w-0 flex-1">
      <Breadcrumbs crumbs={openTask ? [{ label: openTask.title }] : []} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        {/* Today anchors every relative date below it — "2 days overdue" from when. */}
        <header className="flex flex-col gap-1">
          <h1 className="text-title-s font-semibold text-foreground">{headerDate(now)}</h1>
          <p className="text-body text-muted-foreground tabular-nums">
            {state === "ready"
              ? `${summary.action} need action · ${summary.waiting} waiting on others · ${summary.overdue} overdue`
              : "Loading…"}
          </p>
        </header>

        {/* Views. The active underline sits on the band's own rule rather than floating
            above it — one horizontal line, not two. */}
        <Tabs value={filters.view} onValueChange={(v) => setView(v as TaskView)} className="gap-0">
          <TabsList
            variant="line"
            aria-label="Task views"
            className="w-full justify-start gap-6 overflow-x-auto border-b border-hairline p-0 pb-0 group-data-horizontal/tabs:h-auto"
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

        {/* The tab is the population; the cards are its breakdown — they sit inside the
            tab, above the filters that narrow it further. `cardCounts` counts per view. */}
        <OverviewCards
          counts={state === "ready" ? counts : null}
          view={filters.view}
          active={filters.kind}
          loading={state !== "ready"}
          onToggle={toggleKind}
        />

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
            <Button
              variant="outline"
              disabled={!online || !!busy || !doableSelected.length}
              onClick={() => setConfirmDone(doableSelected)}
            >
              Mark as done
            </Button>
            <Button variant="outline" disabled={!online || !!busy} onClick={() => void archiveAll()}>
              Archive
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
        onOpenFlow={() => {
          if (!openTask) return;
          // Waiting and closed items open their flow to look, not to act: pay and file
          // live in the modal; sign and returned tasks live on their own pages.
          const path = actPathOf(openTask);
          if (path) router.push(path);
          else openAct(openTask, actModeOf(openTask));
        }}
        onMarkDone={() => openTask && setConfirmDone([openTask])}
        onArchive={() => openTask && void act(openTask.id, archive, "Archived — find it under the Archived tab")}
      />

      <TaskActModal
        task={actingTask}
        kase={actingCase}
        mode={acting?.mode ?? null}
        open={!!acting && !!actingTask && !!actingCase}
        onOpenChange={(open) => {
          if (!open) setActing(null);
        }}
        onFinished={(id) => {
          requestHighlight(id);
          focusRow(id);
        }}
      />

      {/* Signing, fixing a return and continuing a draft leave this screen for their
          own pages — the dialog says so before anything moves. */}
      <ConfirmDialog
        open={!!flowNotice}
        onOpenChange={(open) => !open && setFlowNotice(null)}
        title={flowNotice ? FLOW_DIALOG[flowNotice.flow].title : ""}
        description={flowNotice ? FLOW_DIALOG[flowNotice.flow].description : undefined}
        confirmLabel="Continue"
        destructive={false}
        onConfirm={() => {
          const notice = flowNotice;
          setFlowNotice(null);
          if (notice) router.push(flowPathOf(notice.flow, notice.task));
        }}
      />

      <ConfirmDialog
        open={!!confirmDone}
        onOpenChange={(open) => !open && setConfirmDone(null)}
        title="Mark as done?"
        description={
          confirmDone
            ? `${
                confirmDone.length === 1
                  ? `“${confirmDone[0].title}”`
                  : `${confirmDone.length} tasks`
              } — this records that it was completed outside DRISTI. Nothing is sent to the court.`
            : undefined
        }
        confirmLabel="Mark as done"
        destructive={false}
        onConfirm={() => {
          const batch = confirmDone;
          setConfirmDone(null);
          if (batch) void markAllDone(batch);
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
          <h1 className="text-title-s font-semibold text-foreground">{headerDate(new Date())}</h1>
          <p className="text-body text-muted-foreground">Loading…</p>
        </header>
        <TasksTableSkeleton />
      </div>
    </main>
  );
}
