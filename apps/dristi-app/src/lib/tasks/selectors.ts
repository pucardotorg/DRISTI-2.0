/**
 * Filtering, sorting and counting — pure, over the loaded world.
 *
 * The screen's state (view tab, card kind, the labelled filters, search, sort) lives in
 * the URL as `Filters`. Card counts are computed on the view's population before the
 * other filters apply, so the cards always describe the view.
 */

import { canView, cardKindOf, TERMINAL, viewOf } from "./permissions";
import { compareUrgency, consequenceAt, daysUntil, isOverdue } from "./urgency";
import type { Case, CardKind, Person, PersonId, Task, TaskView } from "./types";

export type DueFilter = "any" | "overdue" | "today" | "week" | "before-hearing";
export type SortKey = "due" | "case" | "kind";

export type Filters = {
  view: TaskView;
  /** One card at a time; null = every kind. */
  kind: CardKind | null;
  due: DueFilter;
  /** A court name; "" = all courts. */
  court: string;
  /** An advocate on the case; "" = anyone. */
  advocate: PersonId | "";
  query: string;
  sort: SortKey;
};

export const DEFAULT_FILTERS: Filters = {
  view: "open",
  kind: null,
  due: "any",
  court: "",
  advocate: "",
  query: "",
  sort: "due",
};

export const CARD_ORDER: CardKind[] = ["sign", "pay", "file", "returned", "hearing", "draft"];

export const CARD_LABELS: Record<CardKind, string> = {
  sign: "To sign",
  pay: "To pay",
  file: "To file",
  returned: "Returned by scrutiny",
  hearing: "For a hearing",
  draft: "Drafts",
};

export const VIEW_LABELS: Record<TaskView, string> = {
  open: "Open",
  waiting: "Waiting on others",
  completed: "Completed",
};

export const DUE_LABELS: Record<DueFilter, string> = {
  any: "Any time",
  overdue: "Overdue",
  today: "Today",
  week: "This week",
  "before-hearing": "Before next hearing",
};

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

/** Tasks on cases the person is on. Everything else starts here. */
export function visibleTasks(world: World): Task[] {
  return world.tasks.filter((t) => {
    const kase = caseOf(world, t);
    return !!kase && canView(world.user, kase);
  });
}

/** The visible tasks that belong to a tab. */
export function tasksInView(world: World, view: TaskView): Task[] {
  return visibleTasks(world).filter((t) => viewOf(t) === view);
}

function matchesSearch(task: Task, kase: Case, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [task.title, kase.parties, kase.stNumber, kase.cnr, kase.court].join(" ").toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

function matchesDue(task: Task, due: DueFilter, now: Date | string): boolean {
  if (due === "any") return true;
  if (due === "before-hearing") return !!task.hearingAt && daysUntil(task.hearingAt, now) >= 0;
  const at = consequenceAt(task);
  if (!at) return false;
  const days = daysUntil(at, now);
  if (due === "overdue") return days < 0;
  if (due === "today") return days === 0;
  return days >= 0 && days <= 7;
}

/** Everything but the view and the card: the labelled filters and the search. */
function passesFilters(task: Task, kase: Case, f: Filters, now: Date | string): boolean {
  if (!matchesSearch(task, kase, f.query)) return false;
  if (f.court && kase.court !== f.court) return false;
  if (f.advocate && !canView(f.advocate, kase)) return false;
  if (!matchesDue(task, f.due, now)) return false;
  return true;
}

/** When a task closed — its completion, else its last history line. */
export function closedAt(task: Task): number {
  const at = task.completion?.at ?? task.history[task.history.length - 1]?.at ?? task.createdAt;
  return new Date(at).getTime();
}

export function sortBy(world: World, tasks: Task[], sort: SortKey): Task[] {
  const now = world.now;
  const list = [...tasks];
  // Closed tasks have no urgency; the most recently closed comes first.
  const urgency = (a: Task, b: Task) => {
    const ta = TERMINAL.has(a.status);
    const tb = TERMINAL.has(b.status);
    if (ta && tb) return closedAt(b) - closedAt(a) || compareUrgency(a, b, now);
    if (ta !== tb) return ta ? 1 : -1;
    return compareUrgency(a, b, now);
  };
  switch (sort) {
    case "due":
      return list.sort(urgency);
    case "case":
      return list.sort((a, b) => {
        const pa = caseOf(world, a)?.parties ?? "";
        const pb = caseOf(world, b)?.parties ?? "";
        return pa.localeCompare(pb) || urgency(a, b);
      });
    case "kind":
      return list.sort(
        (a, b) => CARD_ORDER.indexOf(cardKindOf(a)) - CARD_ORDER.indexOf(cardKindOf(b)) || urgency(a, b)
      );
  }
}

/** The rows the table shows for the filters, sorted. */
export function applyFilters(world: World, f: Filters): Task[] {
  const rows = tasksInView(world, f.view).filter((t) => {
    const kase = caseOf(world, t)!;
    if (f.kind && cardKindOf(t) !== f.kind) return false;
    return passesFilters(t, kase, f, world.now);
  });
  return sortBy(world, rows, f.sort);
}

export type CardCount = {
  count: number;
  overdue: number;
  /** The nearest upcoming consequence date among the kind's tasks, if any. */
  nextDue?: string;
};

/**
 * What each overview card says for a view: how many, how many overdue, and the next
 * date. Counts respect the view only — not the other filters — so the cards always
 * describe the tab.
 */
export function cardCounts(world: World, view: TaskView): Record<CardKind, CardCount> {
  const out = Object.fromEntries(CARD_ORDER.map((k) => [k, { count: 0, overdue: 0 }])) as Record<CardKind, CardCount>;
  for (const t of tasksInView(world, view)) {
    const c = out[cardKindOf(t)];
    c.count += 1;
    // Only open work is overdue or due next; waiting and completed tasks just count.
    if (view !== "open") continue;
    if (isOverdue(t, world.now)) {
      c.overdue += 1;
      continue;
    }
    const at = consequenceAt(t);
    if (at && (!c.nextDue || new Date(at) < new Date(c.nextDue))) c.nextDue = at;
  }
  return out;
}

/** "26 open · 2 waiting on others · 5 overdue" — the header line. */
export function summaryOf(world: World): { open: number; waiting: number; overdue: number } {
  const open = tasksInView(world, "open");
  const waiting = tasksInView(world, "waiting");
  const overdue = open.filter((t) => isOverdue(t, world.now)).length;
  return { open: open.length, waiting: waiting.length, overdue };
}

/** Counts for the three tabs, over everything visible. */
export function viewCounts(world: World): Record<TaskView, number> {
  const views: Record<TaskView, number> = { open: 0, waiting: 0, completed: 0 };
  for (const t of visibleTasks(world)) views[viewOf(t)] += 1;
  return views;
}

/** Distinct courts among visible cases — for the Court filter. */
export function courtsOf(world: World): string[] {
  const visible = world.cases.filter((c) => canView(world.user, c));
  return [...new Set(visible.map((c) => c.court))].sort();
}

/** Whether anything narrows the view beyond the tab (for "Clear filters" and the empty state). */
export function isNarrowed(f: Filters): boolean {
  return !!f.kind || f.due !== "any" || !!f.court || !!f.advocate || !!f.query.trim();
}
