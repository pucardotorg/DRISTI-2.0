import { TODAYS_HEARING_COUNT } from "./hearings";
import { ASYNC_SECTIONS } from "./todays-actions";

/**
 * Today's schedule — the bench's whole day as one plan, as data.
 *
 * The owner's clubbing (2026-09-01) of the two "Today's …" views: one calendar that
 * starts with conducting the day's hearings and then runs the paper-only actions one by
 * one. Each block carries the time slot allotted to it — the slot idea comes from the
 * scheduling discussion (a day divided into slots so people know when, not just
 * whether) — and leads to the screen where that work lives: the cause list for
 * hearings, a queue of today's actions for the rest.
 *
 * **The slots are demo data.** No product decision fixes when a Kollam bench registers
 * cases or reviews applications; these times exist so the screen can be judged with
 * real-looking marks, and they are stated here in one place so changing the day's shape
 * is a change to this file. The counts are not demo in the same sense: every one is the
 * length of the list behind its block, and `SCHEDULE_TOTAL` is their sum, so the rail,
 * the schedule and the screens a block opens cannot disagree.
 */

export type ScheduleBlock = {
  id: string;
  label: string;
  /** The slot allotted to this block of the day, e.g. "11:00 am – 1:30 pm". Demo. */
  slot: string;
  /** Where the work happens: the cause list, or one queue of today's actions. */
  href: string;
  /** How many items the block holds — derived from the list behind it. */
  count: number;
  /** The word the count carries: hearings are "listed", actions are "due". */
  unit: "listed" | "due";
};

/** When each action queue sits, keyed by the queue ids in `todays-actions.ts`. */
const ACTION_SLOTS: Record<string, string> = {
  register: "2:30 – 3:00 pm",
  cognizance: "3:00 – 3:30 pm",
  applications: "3:30 – 4:15 pm",
};

/*
 * The day's hearings run in two slots (owner, 2026-09-01) — the scheduling
 * discussion's slot idea applied to the cause list itself, so a party is told a
 * window, not a day. The cause list's demo data carries no slot assignment yet, so
 * the split is the first half and the second half of the day's matters by count —
 * derived from the same `TODAYS_HEARING_COUNT`, so the two slots always sum to the
 * cause list and the rail's total. Both slots open the same cause list; splitting
 * that screen by slot needs a slot field on the hearing data first.
 */
const HEARINGS_SLOT_1 = Math.ceil(TODAYS_HEARING_COUNT / 2);
const HEARINGS_SLOT_2 = TODAYS_HEARING_COUNT - HEARINGS_SLOT_1;

export const TODAYS_SCHEDULE: ScheduleBlock[] = [
  {
    id: "conduct-hearings-1",
    label: "Conduct hearings – slot 1",
    slot: "11:00 am – 12:15 pm",
    href: "/employee/hearings",
    count: HEARINGS_SLOT_1,
    unit: "listed",
  },
  {
    id: "conduct-hearings-2",
    label: "Conduct hearings – slot 2",
    slot: "12:15 – 1:30 pm",
    href: "/employee/hearings",
    count: HEARINGS_SLOT_2,
    unit: "listed",
  },
  ...ASYNC_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    slot: ACTION_SLOTS[section.id] ?? "",
    href: `/employee/todays-actions/${section.id}`,
    count: section.items.length,
    unit: "due" as const,
  })),
];

/** Everything the day holds, hearings and actions together — the rail's number. */
export const SCHEDULE_TOTAL = TODAYS_SCHEDULE.reduce(
  (sum, block) => sum + block.count,
  0,
);
