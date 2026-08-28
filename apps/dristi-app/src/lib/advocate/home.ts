/**
 * Advocate home — pure selectors over the tasks world.
 *
 * The home screen is a *view* of the same world `/tasks` reads (`useTasks()` →
 * `World`), never a second data source: the cause-list board derives from
 * `Case.nextHearingAt`, the rail from `tasksInView`, and the blockers shown on a
 * hearing are the very tasks the rail lists — one world, two angles. Everything here
 * is pure over `(world, now)` so the tests can pin the clock.
 *
 * What is deliberately NOT here: outcomes of concluded items, cause-list item numbers
 * from the court, and "the court is in session" — none of those exist in the world
 * yet. Item numbers are derived from time order (the honest stand-in), "now" is a
 * hearing whose listed time window covers the clock, and concluded items state no
 * outcome rather than inventing one.
 */

import type { Case, Task } from "@/lib/tasks/types";
import { caseOf, tasksInView, sortTasks, type World } from "@/lib/tasks/selectors";
import { ACTIONABLE, canView } from "@/lib/tasks/permissions";
import { compareUrgency, consequenceAt } from "@/lib/tasks/urgency";

/** How long a listed item is treated as live once its time arrives. */
const HEARING_WINDOW_MS = 90 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/* ───────────────────────────── days ───────────────────────────── */

/** Local calendar day, "2026-08-28" — the key the week strip and board share. */
export function dayKeyOf(when: string | number | Date): string {
  const d = new Date(when);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export type WeekCell = {
  key: string;
  /** Noon local on that day — safe to format without timezone edges. */
  at: Date;
  today: boolean;
  /** Listed matters that day, across courts (viewable cases only). */
  hearings: number;
  /** Needs-action tasks whose consequence date lands that day. */
  due: number;
};

/** Monday-to-Sunday of the week containing `now`, with the day dots filled in. */
export function weekOf(world: World, now: number | Date = Date.now()): WeekCell[] {
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);
  // getDay(): Sunday 0 — the week here runs Monday to Sunday, as courts do.
  const monday = base.getTime() - ((base.getDay() + 6) % 7) * DAY_MS;

  const hearingDays = new Map<string, number>();
  for (const c of viewableCases(world)) {
    if (!c.nextHearingAt) continue;
    const key = dayKeyOf(c.nextHearingAt);
    hearingDays.set(key, (hearingDays.get(key) ?? 0) + 1);
  }

  const dueDays = new Map<string, number>();
  for (const task of tasksInView(world, "needs-action")) {
    const at = consequenceAt(task);
    if (!at) continue;
    const key = dayKeyOf(at);
    dueDays.set(key, (dueDays.get(key) ?? 0) + 1);
  }

  const todayKey = dayKeyOf(now);
  return Array.from({ length: 7 }, (_, i) => {
    const at = new Date(monday + i * DAY_MS);
    const key = dayKeyOf(at);
    return {
      key,
      at,
      today: key === todayKey,
      hearings: hearingDays.get(key) ?? 0,
      due: dueDays.get(key) ?? 0,
    };
  });
}

/* ───────────────────────────── hearings ───────────────────────────── */

export type HearingStatus = "now" | "upcoming" | "concluded";

export type HomeHearing = {
  kase: Case;
  /** Cause-list position for the day in this court — derived from time order. */
  item: number;
  /** The listed time (`Case.nextHearingAt`). */
  at: string;
  status: HearingStatus;
  /** Actionable blocking tasks on the case, most urgent first. */
  blockers: Task[];
  /** No open blocking task stands between the case and the hearing. */
  ready: boolean;
};

function viewableCases(world: World): Case[] {
  return world.cases.filter((c) => canView(world.user, c));
}

function statusOf(at: string, now: number): HearingStatus {
  const start = new Date(at).getTime();
  if (now < start) return "upcoming";
  if (now < start + HEARING_WINDOW_MS) return "now";
  return "concluded";
}

function blockersOf(world: World, kase: Case, now: number): Task[] {
  return world.tasks
    .filter((t) => t.caseId === kase.id && t.isBlocking && ACTIONABLE.has(t.status))
    .sort((a, b) => compareUrgency(a, b, new Date(now)));
}

/** Every listed matter on `dayKey` in one court, numbered in time order. */
export function hearingsOn(
  world: World,
  court: string,
  dayKey: string,
  now: number = Date.now()
): HomeHearing[] {
  return viewableCases(world)
    .filter(
      (c) => c.court === court && c.nextHearingAt && dayKeyOf(c.nextHearingAt) === dayKey
    )
    .sort(
      (a, b) =>
        new Date(a.nextHearingAt!).getTime() - new Date(b.nextHearingAt!).getTime() ||
        a.stNumber.localeCompare(b.stNumber)
    )
    .map((kase, index) => {
      const at = kase.nextHearingAt!;
      const blockers = blockersOf(world, kase, now);
      return {
        kase,
        item: index + 1,
        at,
        status: statusOf(at, now),
        blockers,
        ready: blockers.length === 0,
      };
    });
}

export type CourtRoom = {
  court: string;
  /** Listed matters on the selected day. */
  count: number;
  /** An item's listed window covers the clock right now. */
  live: boolean;
};

/**
 * The court tabs for a day: every court the user can see, the flagship ON court
 * first, each with its day count and whether it is live at the moment.
 */
export function courtRooms(
  world: World,
  dayKey: string,
  now: number = Date.now()
): CourtRoom[] {
  const courts = [...new Set(viewableCases(world).map((c) => c.court))].sort((a, b) => {
    const aOn = a.startsWith("24×7") ? 0 : 1;
    const bOn = b.startsWith("24×7") ? 0 : 1;
    return aOn - bOn || a.localeCompare(b);
  });
  return courts.map((court) => {
    const listed = hearingsOn(world, court, dayKey, now);
    return {
      court,
      count: listed.length,
      live: listed.some((h) => h.status === "now"),
    };
  });
}

export type Board = {
  now: HomeHearing | null;
  upcoming: HomeHearing[];
  concluded: HomeHearing[];
};

/** The board below one court tab, split by where the day has got to. */
export function boardOf(
  world: World,
  court: string,
  dayKey: string,
  now: number = Date.now()
): Board {
  const listed = hearingsOn(world, court, dayKey, now);
  return {
    now: listed.find((h) => h.status === "now") ?? null,
    upcoming: listed.filter((h) => h.status === "upcoming"),
    concluded: listed.filter((h) => h.status === "concluded"),
  };
}

/** Total listed matters on a day across every court — the greeting's number. */
export function matterCountOn(
  world: World,
  dayKey: string,
  now: number = Date.now()
): number {
  return courtRooms(world, dayKey, now).reduce((sum, c) => sum + c.count, 0);
}

/**
 * The next day after `fromKey` with anything listed — where the empty board's
 * "jump ahead" goes. Looks across all viewable cases, not just one court.
 */
export function nextHearingDayAfter(
  world: World,
  fromKey: string
): { key: string; count: number } | null {
  const days = new Map<string, number>();
  for (const c of viewableCases(world)) {
    if (!c.nextHearingAt) continue;
    const key = dayKeyOf(c.nextHearingAt);
    if (key > fromKey) days.set(key, (days.get(key) ?? 0) + 1);
  }
  if (days.size === 0) return null;
  const key = [...days.keys()].sort()[0];
  return { key, count: days.get(key)! };
}

/* ───────────────────────────── rail ───────────────────────────── */

/**
 * The pending-tasks rail: exactly the Needs-action tab of `/tasks`, in the one
 * canonical order — blocking first, then overdue, then by date. Not sliced: the
 * rail scrolls, and an abridged list would silently disagree with its own count.
 */
export function railTasks(world: World): Task[] {
  return sortTasks(world, tasksInView(world, "needs-action"));
}

/** The matter line under a rail task — the case it belongs to. */
export function railCaseLineOf(world: World, task: Task): string {
  return caseOf(world, task)?.parties ?? "";
}
