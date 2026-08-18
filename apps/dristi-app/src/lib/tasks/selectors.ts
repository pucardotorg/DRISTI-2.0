/**
 * Filtering, sorting, grouping and counting — pure, over the loaded world.
 *
 * A "lens" is everything the find row, chips and filter sheet hold; it lives in the
 * URL. Counts are computed on the view's population before chips are applied, so a
 * chip's number says how many rows it would keep.
 */

import {
  canApprove,
  canView,
  effectiveAssignee,
  TERMINAL,
  viewOf,
} from "./permissions";
import { BAND_LABELS, BAND_ORDER, bandOf, compareUrgency, consequenceAt, type Band } from "./urgency";
import type { Case, Person, PersonId, Task, TaskKind, TaskView } from "./types";

export type SortKey = "urgency" | "due" | "case" | "recent";
export type GroupKey = "band" | "case" | "kind" | "person";

export type Lens = {
  view: TaskView;
  q: string;
  /** Assignee filter — person ids. */
  people: PersonId[];
  blocking: boolean;
  /** Awaiting my approval. */
  approval: boolean;
  unassigned: boolean;
  kinds: TaskKind[];
  courts: string[];
  stages: string[];
  dueFrom?: string;
  dueTo?: string;
  createdFrom?: string;
  createdTo?: string;
  /** Done view: include expired and obsolete tasks. */
  showClosed: boolean;
  sort: SortKey;
  group: GroupKey;
};

export const DEFAULT_LENS: Lens = {
  view: "todo",
  q: "",
  people: [],
  blocking: false,
  approval: false,
  unassigned: false,
  kinds: [],
  courts: [],
  stages: [],
  showClosed: true,
  sort: "urgency",
  group: "band",
};

export const KIND_LABELS: Record<TaskKind, string> = {
  sign: "Sign",
  pay: "Pay",
  submit: "Submit",
  "fix-defects": "Fix defects",
  respond: "Respond",
  appear: "Appear",
  other: "Other",
};

export const KIND_ORDER: TaskKind[] = [
  "sign",
  "pay",
  "submit",
  "fix-defects",
  "respond",
  "appear",
  "other",
];

export type World = {
  people: Person[];
  cases: Case[];
  tasks: Task[];
  user: Person;
  now: Date | string;
};

export function caseOf(world: Pick<World, "cases">, task: Task): Case | undefined {
  return world.cases.find((c) => c.id === task.caseId);
}

export function personOf(world: Pick<World, "people">, id?: PersonId): Person | undefined {
  return id ? world.people.find((p) => p.id === id) : undefined;
}

/** Tasks on cases the person can see. Everything else starts here. */
export function visibleTasks(world: World): Task[] {
  return world.tasks.filter((t) => {
    const kase = caseOf(world, t);
    return !!kase && canView(world.user, kase);
  });
}

/** The visible tasks that belong to a tab for this person. */
export function tasksInView(world: World, view: TaskView): Task[] {
  return visibleTasks(world).filter((t) => viewOf(t, world.user, caseOf(world, t)!) === view);
}

function matchesSearch(task: Task, kase: Case, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [task.title, kase.parties, kase.stNumber, kase.cnr, kase.court]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

function within(iso: string | undefined, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false;
  return true;
}

/** Everything but the chips — search + the filter sheet + the view. */
function passesDeepFilters(world: World, task: Task, kase: Case, lens: Lens): boolean {
  if (!matchesSearch(task, kase, lens.q)) return false;
  if (lens.kinds.length && !lens.kinds.includes(task.kind)) return false;
  if (lens.courts.length && !lens.courts.includes(kase.court)) return false;
  if (lens.stages.length && !lens.stages.includes(kase.stage)) return false;
  if (!within(task.dueAt, lens.dueFrom, lens.dueTo)) return false;
  if (!within(task.createdAt, lens.createdFrom, lens.createdTo)) return false;
  if (
    lens.view === "done" &&
    !lens.showClosed &&
    (task.status === "expired" || task.status === "obsolete")
  ) {
    return false;
  }
  return true;
}

function passesChips(world: World, task: Task, kase: Case, lens: Lens): boolean {
  const assignee = effectiveAssignee(task, kase);
  if (lens.people.length || lens.unassigned) {
    const byPerson = lens.people.length > 0 && !!assignee && lens.people.includes(assignee);
    const byUnassigned = lens.unassigned && !assignee;
    if (!byPerson && !byUnassigned) return false;
  }
  if (lens.blocking && !task.isBlocking) return false;
  if (lens.approval && !canApprove(world.user, task, kase)) return false;
  return true;
}

/** When a task closed — its completion, else its last history line. */
export function closedAt(task: Task): number {
  const at = task.completion?.at ?? task.history[task.history.length - 1]?.at ?? task.createdAt;
  return new Date(at).getTime();
}

const CLOSED_LABEL: Record<string, string> = {
  done: "Done",
  expired: "Expired",
  obsolete: "No longer required",
};

export function sortTasks(world: World, tasks: Task[], sort: SortKey): Task[] {
  const now = world.now;
  const list = [...tasks];
  switch (sort) {
    case "urgency":
      // Closed tasks have no urgency; the most recently closed comes first.
      return list.sort((a, b) => {
        const ta = TERMINAL.has(a.status);
        const tb = TERMINAL.has(b.status);
        if (ta && tb) return closedAt(b) - closedAt(a) || compareUrgency(a, b, now);
        if (ta !== tb) return ta ? 1 : -1;
        return compareUrgency(a, b, now);
      });
    case "due":
      return list.sort((a, b) => {
        const ca = consequenceAt(a);
        const cb = consequenceAt(b);
        if (ca && cb) {
          const d = new Date(ca).getTime() - new Date(cb).getTime();
          if (d) return d;
        } else if (ca || cb) {
          return ca ? -1 : 1;
        }
        return compareUrgency(a, b, now);
      });
    case "case":
      return list.sort((a, b) => {
        const pa = caseOf(world, a)?.parties ?? "";
        const pb = caseOf(world, b)?.parties ?? "";
        return pa.localeCompare(pb) || compareUrgency(a, b, now);
      });
    case "recent":
      return list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
          compareUrgency(a, b, now)
      );
  }
}

/** The rows the list shows for a lens, sorted. */
export function applyLens(world: World, lens: Lens): Task[] {
  const rows = tasksInView(world, lens.view).filter((t) => {
    const kase = caseOf(world, t)!;
    return passesDeepFilters(world, t, kase, lens) && passesChips(world, t, kase, lens);
  });
  return sortTasks(world, rows, lens.sort);
}

export type Group = {
  key: string;
  label: string;
  count: number;
  tasks: Task[];
  /** Long pending starts collapsed. */
  collapsed?: boolean;
};

export function groupTasks(world: World, tasks: Task[], group: GroupKey): Group[] {
  const buckets = new Map<string, Group>();
  const put = (key: string, label: string, task: Task, collapsed?: boolean) => {
    const g = buckets.get(key) ?? { key, label, count: 0, tasks: [], collapsed };
    g.tasks.push(task);
    g.count += 1;
    buckets.set(key, g);
  };

  for (const task of tasks) {
    switch (group) {
      case "band": {
        // A closed task has no urgency band — it groups by how it closed.
        if (TERMINAL.has(task.status)) {
          put(`closed-${task.status}`, CLOSED_LABEL[task.status], task);
          break;
        }
        const band = bandOf(task, world.now);
        put(band, BAND_LABELS[band], task, band === "long-pending");
        break;
      }
      case "case": {
        const kase = caseOf(world, task);
        put(task.caseId, kase?.parties ?? "Unknown case", task);
        break;
      }
      case "kind":
        put(task.kind, KIND_LABELS[task.kind], task);
        break;
      case "person": {
        const kase = caseOf(world, task)!;
        const who = effectiveAssignee(task, kase);
        const person = personOf(world, who);
        put(who ?? "unassigned", person?.name ?? "Unassigned", task);
        break;
      }
    }
  }

  const groups = [...buckets.values()];
  const closedOrder = ["closed-done", "closed-expired", "closed-obsolete"];
  switch (group) {
    case "band":
      return groups.sort((a, b) => {
        const ia = a.key.startsWith("closed-") ? BAND_ORDER.length + closedOrder.indexOf(a.key) : BAND_ORDER.indexOf(a.key as Band);
        const ib = b.key.startsWith("closed-") ? BAND_ORDER.length + closedOrder.indexOf(b.key) : BAND_ORDER.indexOf(b.key as Band);
        return ia - ib;
      });
    case "kind":
      return groups.sort(
        (a, b) => KIND_ORDER.indexOf(a.key as TaskKind) - KIND_ORDER.indexOf(b.key as TaskKind)
      );
    case "person":
      // Me first, then the team by name, unassigned last.
      return groups.sort((a, b) => {
        if (a.key === "unassigned") return 1;
        if (b.key === "unassigned") return -1;
        if (a.key === world.user.id) return -1;
        if (b.key === world.user.id) return 1;
        return a.label.localeCompare(b.label);
      });
    case "case":
      return groups.sort((a, b) => a.label.localeCompare(b.label));
  }
}

export type Counts = {
  views: Record<TaskView, number>;
  people: Record<PersonId, number>;
  blocking: number;
  approval: number;
  unassigned: number;
};

/** Counts for the tabs (whole view) and the chips (this view, deep filters applied). */
export function countsFor(world: World, lens: Lens): Counts {
  const visible = visibleTasks(world);
  const views: Record<TaskView, number> = { todo: 0, waiting: 0, done: 0 };
  for (const t of visible) views[viewOf(t, world.user, caseOf(world, t)!)] += 1;

  const population = tasksInView(world, lens.view).filter((t) =>
    passesDeepFilters(world, t, caseOf(world, t)!, lens)
  );
  const people: Record<PersonId, number> = {};
  let blocking = 0;
  let approval = 0;
  let unassigned = 0;
  for (const t of population) {
    const kase = caseOf(world, t)!;
    const who = effectiveAssignee(t, kase);
    if (who) people[who] = (people[who] ?? 0) + 1;
    else unassigned += 1;
    if (t.isBlocking) blocking += 1;
    if (canApprove(world.user, t, kase)) approval += 1;
  }
  return { views, people, blocking, approval, unassigned };
}

/**
 * "12 to do · 3 waiting · 5 overdue · 2 long pending" — the header line. Overdue and
 * long pending are counted apart so the line agrees with the band headers below it.
 */
export function summaryOf(world: World): {
  todo: number;
  waiting: number;
  overdue: number;
  longPending: number;
} {
  const todo = tasksInView(world, "todo");
  const waiting = tasksInView(world, "waiting");
  let overdue = 0;
  let longPending = 0;
  for (const t of todo) {
    const band = bandOf(t, world.now);
    if (band === "overdue") overdue += 1;
    else if (band === "long-pending") longPending += 1;
  }
  return { todo: todo.length, waiting: waiting.length, overdue, longPending };
}

/** Distinct courts / stages among visible cases — for the filter sheet. */
export function facetsOf(world: World): { courts: string[]; stages: string[] } {
  const visible = world.cases.filter((c) => canView(world.user, c));
  const courts = [...new Set(visible.map((c) => c.court))].sort();
  const stages = [...new Set(visible.map((c) => c.stage))].sort();
  return { courts, stages };
}

/** Whether the lens narrows beyond the view (for "Clear all" and the empty-filtered state). */
export function lensIsNarrowed(lens: Lens): boolean {
  return (
    !!lens.q.trim() ||
    lens.people.length > 0 ||
    lens.blocking ||
    lens.approval ||
    lens.unassigned ||
    lens.kinds.length > 0 ||
    lens.courts.length > 0 ||
    lens.stages.length > 0 ||
    !!lens.dueFrom ||
    !!lens.dueTo ||
    !!lens.createdFrom ||
    !!lens.createdTo ||
    !lens.showClosed
  );
}
