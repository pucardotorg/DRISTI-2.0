"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  applyLens,
  caseOf,
  countsFor,
  DEFAULT_LENS,
  facetsOf,
  groupTasks,
  type Lens,
  lensIsNarrowed,
  sortTasks,
  summaryOf,
  type World,
} from "@/lib/tasks/selectors";
import { canApprove, canMarkDone } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import { approveAndSign, markDone, reassign, sendBack, withdraw } from "@/lib/tasks/transitions";
import type { PersonId, Task, TaskId, TaskView, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop, useMinWidth } from "@/hooks/use-min-width";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs, useChrome } from "@/components/shell/chrome";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { BulkBar } from "@/components/tasks/bulk-bar";
import { ChipsRow } from "@/components/tasks/chips-row";
import { FiltersSheet } from "@/components/tasks/filters-sheet";
import { FindRow } from "@/components/tasks/find-row";
import { useLens } from "@/components/tasks/lens";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskList, TaskListSkeleton } from "@/components/tasks/task-list";
import { actHref, useTaskActions, verbTarget } from "@/components/tasks/use-task-actions";

const VIEW_LABELS: Record<TaskView, string> = { todo: "To do", waiting: "Waiting", done: "Done" };

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
 * All pending tasks — the screen. Header, views, find row, chips, then ONE lifted panel
 * of grouped rows; the detail pushes in from the right on `lg`+ (a sheet below).
 * Everything the find row and chips hold lives in the URL.
 */
export function TasksScreen() {
  const router = useRouter();
  const store = useTasks();
  const { state, error, people, cases, tasks, user, online, ghosts, highlight, reload, dismissGhost, requestHighlight } = store;
  const { act, busy } = useTaskActions();
  const { lens, setLens, taskId, setTaskId } = useLens();
  const now = useNow();
  const { navOpen, foldNav, unfoldNav } = useChrome();
  const pushes = useIsDesktop();
  const roomy = useMinWidth(1536);

  const world = React.useMemo<World>(
    () => ({ people, cases, tasks, user, now }),
    [people, cases, tasks, user, now]
  );

  const rows = React.useMemo(() => applyLens(world, lens), [world, lens]);
  // A task another tab just closed has left this view; keep its row for a moment, dimmed.
  const rowsWithGhosts = React.useMemo(() => {
    const extra = ghosts
      .map((g) => tasks.find((t) => t.id === g.taskId))
      .filter((t): t is Task => !!t && !rows.some((r) => r.id === t.id) && lens.view !== "done");
    return extra.length ? sortTasks(world, [...rows, ...extra], lens.sort) : rows;
  }, [ghosts, tasks, rows, lens.view, lens.sort, world]);
  const groups = React.useMemo(
    () => groupTasks(world, rowsWithGhosts, lens.group),
    [world, rowsWithGhosts, lens.group]
  );
  const counts = React.useMemo(() => countsFor(world, lens), [world, lens]);
  const summary = React.useMemo(() => summaryOf(world), [world]);
  const facets = React.useMemo(() => facetsOf(world), [world]);

  const openTask = React.useMemo(() => tasks.find((t) => t.id === taskId) ?? null, [tasks, taskId]);
  const openCase = openTask ? (caseOf(world, openTask) ?? null) : null;

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<TaskId>>(() => new Set());
  const [confirm, setConfirm] = React.useState<{ task: Task } | null>(null);


  // Flash: on while the newest highlight request has not been retired, then fades.
  const [retired, setRetired] = React.useState(0);
  const flashId = highlight && highlight.nonce > retired ? highlight.taskId : null;
  React.useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => setRetired(highlight.nonce), 1200);
    return () => window.clearTimeout(t);
  }, [highlight]);

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
    if (id) {
      requestHighlight(id);
      focusRow(id);
    }
  }, [taskId, setTaskId, requestHighlight, focusRow]);

  // Opening a row from the list moves focus to the panel's heading once it has rendered
  // (Escape brings it back to the row). Arriving with `?task=` already in the URL — back
  // from an act page, a shared link — flashes and focuses the row instead, once.
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
  // Read through a ref so a person collapsing the rail by hand while the panel is open
  // does not re-run this.
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
      if (verb === "Withdraw") {
        void act(task.id, withdraw, "Withdrawn — back in your drafts");
        return;
      }
      openDetail(task.id);
    },
    [act, router, openDetail]
  );

  const clearFilters = React.useCallback(
    () => setLens({ ...DEFAULT_LENS, view: lens.view, sort: lens.sort, group: lens.group }),
    [lens.group, lens.sort, lens.view, setLens]
  );

  // Only rows in the current view count as selected; ids that scrolled out of the lens
  // are ignored rather than pruned, so a lens round-trip does not lose the selection.
  const selectedTasks = React.useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);
  const visibleSelected = React.useMemo(() => new Set(selectedTasks.map((t) => t.id)), [selectedTasks]);
  const canApproveAll =
    selectedTasks.length > 0 &&
    selectedTasks.every((t) => {
      const k = caseOf(world, t);
      return k && canApprove(user, t, k);
    });
  const canMarkDoneAll =
    selectedTasks.length > 0 &&
    selectedTasks.every((t) => {
      const k = caseOf(world, t);
      return k && canMarkDone(user, t, k);
    });

  const bulk = async (label: string, run: (t: Task) => Promise<Task | null>) => {
    let ok = 0;
    for (const t of selectedTasks) if (await run(t)) ok += 1;
    if (ok) toast.success(`${label} ${ok} task${ok === 1 ? "" : "s"}`);
    setSelected(new Set());
  };

  const activeFilterCount =
    lens.kinds.length +
    lens.courts.length +
    lens.stages.length +
    (lens.dueFrom || lens.dueTo ? 1 : 0) +
    (lens.createdFrom || lens.createdTo ? 1 : 0) +
    (lens.showClosed ? 0 : 1);

  const emptyKind = lensIsNarrowed(lens) ? "filtered" : "none";

  return (
    <main className="flex min-w-0 flex-1">
      <Breadcrumbs crumbs={openTask ? [{ label: openTask.title }] : []} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-semibold text-foreground">Pending tasks</h1>
          <p className="text-body-compact text-muted-foreground tabular-nums">
            {state === "ready"
              ? [
                  `${summary.todo} to do`,
                  `${summary.waiting} waiting`,
                  `${summary.overdue} overdue`,
                  summary.longPending ? `${summary.longPending} long pending` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Loading…"}
          </p>
        </header>

        {/* Views. The active underline sits on the band's own rule rather than floating
            above it — one horizontal line, not two. */}
        <Tabs value={lens.view} onValueChange={(v) => setLens({ view: v as TaskView })} className="gap-0">
          <TabsList
            variant="line"
            aria-label="Task views"
            className="w-full justify-start gap-6 border-b border-hairline p-0 pb-0 group-data-horizontal/tabs:h-auto"
          >
            {(Object.keys(VIEW_LABELS) as TaskView[]).map((v) => (
              <TabsTrigger key={v} value={v} className={TAB_CLASS}>
                {VIEW_LABELS[v]}
                <span className="text-caption tabular-nums text-muted-foreground">
                  {state === "ready" ? counts.views[v] : "–"}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <FindRow
          lens={lens}
          onChange={setLens}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <ChipsRow
          lens={lens}
          counts={counts}
          people={people}
          cases={cases}
          user={user}
          onChange={setLens}
          onClearAll={clearFilters}
        />

        {!online ? (
          <Banner variant="warning">
            You are offline. The list is read-only until the connection returns — nothing is
            queued, so payments and signatures are never sent twice.
          </Banner>
        ) : null}

        {state === "error" ? (
          <Banner
            variant="error"
            action={
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Retry
              </Button>
            }
          >
            Tasks could not be loaded{error ? ` — ${error}` : ""}.
          </Banner>
        ) : null}

        {selectedTasks.length ? (
          <BulkBar
            selected={selectedTasks}
            cases={cases}
            people={people}
            user={user}
            canApproveAll={canApproveAll}
            canMarkDoneAll={canMarkDoneAll}
            disabled={!online || !!busy}
            onReassign={(who) => void bulk("Reassigned", (t) => act(t.id, (task, ctx) => reassign(task, ctx, who)))}
            onApproveAll={() => void bulk("Approved and signed", (t) => act(t.id, approveAndSign))}
            onMarkDoneAll={() => void bulk("Marked done", (t) => act(t.id, markDone))}
            onClear={() => setSelected(new Set())}
          />
        ) : null}

        {state === "loading" ? (
          <TaskListSkeleton />
        ) : (
          <TaskList
            groups={groups}
            cases={cases}
            people={people}
            user={user}
            now={now}
            hideCase={lens.group === "case"}
            groupKey={lens.group}
            query={lens.q}
            openId={taskId}
            selected={visibleSelected}
            flashId={flashId}
            ghosts={ghosts}
            offline={!online}
            emptyKind={emptyKind}
            view={lens.view}
            onClearFilters={clearFilters}
            onOpen={(t) => openDetail(t.id)}
            onVerb={handleVerb}
            onMarkDone={(t) => (t.isBlocking ? setConfirm({ task: t }) : void act(t.id, markDone, "Marked done"))}
            onToggleSelect={(t) =>
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(t.id)) next.delete(t.id);
                else next.add(t.id);
                return next;
              })
            }
            onDismissGhost={dismissGhost}
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
        onWithdraw={() => openTask && void act(openTask.id, withdraw, "Withdrawn — back in your drafts")}
        onSendBack={(note) =>
          openTask && void act(openTask.id, (t, ctx) => sendBack(t, ctx, note), "Sent back with your note")
        }
        onReassign={(who: PersonId | undefined) =>
          openTask && void act(openTask.id, (t, ctx) => reassign(t, ctx, who), who ? "Reassigned" : "Unassigned")
        }
      />

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        lens={lens}
        courts={facets.courts}
        stages={facets.stages}
        onApply={(patch) => setLens(patch as Partial<Lens>)}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Mark this done?"
        description={
          confirm
            ? `“${confirm.task.title}” blocks a hearing. Marking it done says the work is finished; nothing is sent to the court.`
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
          <p className="text-body-compact text-muted-foreground">Loading…</p>
        </header>
        <TaskListSkeleton />
      </div>
    </main>
  );
}
