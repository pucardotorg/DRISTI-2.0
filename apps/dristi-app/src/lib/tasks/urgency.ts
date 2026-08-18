/**
 * Urgency: which band a task falls in, and the one comparator every list uses.
 *
 * The rail on the home screen and the All-pending-tasks view must agree on order, so
 * there is exactly one comparator and it is deterministic down to the task id.
 */

import type { Task } from "./types";

export type Band = "overdue" | "today" | "soon" | "later" | "undated" | "long-pending";

/** Overdue for longer than this drops to the collapsed "Long pending" group. */
export const LONG_PENDING_DAYS = 45;

/** "Soon" reaches this many days ahead. */
export const SOON_DAYS = 7;

export const BAND_ORDER: Band[] = [
  "overdue",
  "today",
  "soon",
  "later",
  "undated",
  "long-pending",
];

export const BAND_LABELS: Record<Band, string> = {
  overdue: "Overdue",
  today: "Due today",
  soon: "Due soon",
  later: "Later",
  undated: "No date",
  "long-pending": "Long pending",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(iso: string | Date): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * The date that carries the consequence: the earlier of the deadline and the hearing
 * the task blocks. `undefined` when the task has neither.
 */
export function consequenceAt(task: Task): string | undefined {
  const dates = [task.dueAt, task.blocksHearingAt].filter(Boolean) as string[];
  if (!dates.length) return undefined;
  return dates.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));
}

/** Whole calendar days from `now` to `iso`; negative when past. */
export function daysUntil(iso: string, now: Date | string): number {
  return Math.round((startOfDay(iso) - startOfDay(now)) / DAY_MS);
}

/**
 * The date that decides order *within* a band: the next thing the task will hurt.
 * A task already past its deadline that still blocks an upcoming hearing is ordered by
 * that hearing — "the task that's blocking and is coming up" comes first — not by how
 * long ago it fell due. Once nothing lies ahead, the earliest date it missed stands.
 */
export function nextConsequenceAt(task: Task, now: Date | string): string | undefined {
  const hearing = task.blocksHearingAt;
  if (task.isBlocking && hearing && daysUntil(hearing, now) >= 0) return hearing;
  return consequenceAt(task);
}

export function bandOf(task: Task, now: Date | string = new Date()): Band {
  const at = consequenceAt(task);
  if (!at) return "undated";
  const days = daysUntil(at, now);
  if (days < 0) return -days > LONG_PENDING_DAYS ? "long-pending" : "overdue";
  if (days === 0) return "today";
  // A task pegged to the next posting is "soon" however far that posting is — the
  // hearing is the horizon. Otherwise a week is the horizon.
  if (days <= SOON_DAYS || task.dueKind === "before-hearing") return "soon";
  return "later";
}

function cmp<T>(a: T, b: T): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Earlier date first; a task with no date sorts after one that has one. */
function cmpDates(a: string | undefined, b: string | undefined): number {
  if (a && b) return cmp(new Date(a).getTime(), new Date(b).getTime());
  if (a || b) return a ? -1 : 1;
  return 0;
}

/**
 * Band → sent-back first (a returned task surfaces at the top of its band) → blocking a
 * hearing first → next consequence date (the hearing it blocks if that is still ahead,
 * else the deadline) → earliest deadline → case → oldest created → id.
 */
export function compareUrgency(a: Task, b: Task, now: Date | string = new Date()): number {
  const band = cmp(BAND_ORDER.indexOf(bandOf(a, now)), BAND_ORDER.indexOf(bandOf(b, now)));
  if (band) return band;

  const sentBack = cmp(a.status === "sent-back" ? 0 : 1, b.status === "sent-back" ? 0 : 1);
  if (sentBack) return sentBack;

  const blocking = cmp(a.isBlocking ? 0 : 1, b.isBlocking ? 0 : 1);
  if (blocking) return blocking;

  const next = cmpDates(nextConsequenceAt(a, now), nextConsequenceAt(b, now));
  if (next) return next;

  const due = cmpDates(a.dueAt, b.dueAt);
  if (due) return due;

  const byCase = cmp(a.caseId, b.caseId);
  if (byCase) return byCase;

  const created = cmp(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime());
  if (created) return created;

  return cmp(a.id, b.id);
}
