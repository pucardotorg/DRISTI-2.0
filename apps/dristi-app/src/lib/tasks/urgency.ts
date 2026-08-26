/**
 * Urgency: the one comparator every list uses, and the date arithmetic behind it.
 *
 * The rail on the home screen and the Pending-tasks view must agree on order, so there
 * is exactly one comparator and it is deterministic down to the task id.
 */

import type { Task } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(iso: string | Date): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * The date that carries the consequence: the earlier of the deadline and the hearing
 * the task is anchored to. `undefined` when the task has neither.
 */
export function consequenceAt(task: Task): string | undefined {
  const dates = [task.dueAt, task.hearingAt].filter(Boolean) as string[];
  if (!dates.length) return undefined;
  return dates.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));
}

/** Whole calendar days from `now` to `iso`; negative when past. */
export function daysUntil(iso: string, now: Date | string): number {
  return Math.round((startOfDay(iso) - startOfDay(now)) / DAY_MS);
}

/** Past its consequence date, on the local calendar. */
export function isOverdue(task: Task, now: Date | string): boolean {
  const at = consequenceAt(task);
  return !!at && daysUntil(at, now) < 0;
}

/**
 * The date that decides order among overdue or upcoming tasks: the next thing the task
 * will hurt. A task already past its deadline that still blocks an upcoming hearing is
 * ordered by that hearing — "the task that's blocking and is coming up" comes first —
 * not by how long ago it fell due. Once nothing lies ahead, the earliest date it
 * missed stands.
 */
export function nextConsequenceAt(task: Task, now: Date | string): string | undefined {
  const hearing = task.hearingAt;
  if (task.isBlocking && hearing && daysUntil(hearing, now) >= 0) return hearing;
  return consequenceAt(task);
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

/** Still standing between the court and an upcoming hearing. */
function blocksUpcomingHearing(task: Task, now: Date | string): boolean {
  return !!(task.isBlocking && task.hearingAt && daysUntil(task.hearingAt, now) >= 0);
}

/**
 * Overdue first → tasks a listed hearing cannot proceed without ("blocking and coming
 * up", in the owner's words) → next consequence date (that hearing while it is ahead,
 * else the deadline) → earliest deadline → case → oldest created → id. Undated tasks
 * come last.
 */
export function compareUrgency(a: Task, b: Task, now: Date | string = new Date()): number {
  const overdue = cmp(isOverdue(a, now) ? 0 : 1, isOverdue(b, now) ? 0 : 1);
  if (overdue) return overdue;

  const blocking = cmp(
    blocksUpcomingHearing(a, now) ? 0 : 1,
    blocksUpcomingHearing(b, now) ? 0 : 1
  );
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
