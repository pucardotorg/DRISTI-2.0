/**
 * Words for the row and the panel: the due phrase, the one status phrase, the
 * permission line, amounts and dates. Pure — the table, the panel and the act pages all
 * call these so the same fact always reads the same. The vocabulary is fixed (brief
 * D13): do not add synonyms here.
 */

import { format } from "date-fns";

import { canComplete, mainAdvocateOf, needOf, TERMINAL, WAITING } from "./permissions";
import { consequenceAt, daysUntil } from "./urgency";
import type { Case, Person, PersonId, Task } from "./types";

export function rupees(paise: number): string {
  const whole = Math.floor(paise / 100);
  const frac = paise % 100;
  const base = `₹${whole.toLocaleString("en-IN")}`;
  return frac ? `${base}.${String(frac).padStart(2, "0")}` : base;
}

/** "20 Aug" */
export function shortDate(iso: string): string {
  return format(new Date(iso), "d MMM");
}

/** "20 Aug 2026" */
export function longDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

/** "Tue 20 Aug, 10:30 am" */
export function dateTime(iso: string): string {
  return format(new Date(iso), "EEE d MMM, h:mm a").replace("AM", "am").replace("PM", "pm");
}

export function nameOf(people: Person[], id?: PersonId): string {
  return people.find((p) => p.id === id)?.name ?? "someone";
}

/**
 * The second line under a task's title — the status note, unless the Status phrase
 * already says it (an expired or obsolete task's reason lives in the phrase).
 */
export function noteOf(task: Task): string | undefined {
  if (task.status === "expired" || task.status === "obsolete") return undefined;
  return task.statusNote;
}

export type DueCue = { text: string; overdue: boolean };

/**
 * The Due cell: "{n} days overdue" · "Due today" · "Due {date}" · "Before hearing
 * {date}" · "No date". Closed tasks, and tasks waiting on the court or the gateway, recall
 * the date without the ink — the deadline was met.
 */
export function dueCueOf(task: Task, now: Date | string = new Date()): DueCue {
  const at = consequenceAt(task);
  if (!at) return { text: "No date", overdue: false };
  const settled = TERMINAL.has(task.status) || WAITING.has(task.status);
  const anchored = !!task.hearingAt && at === task.hearingAt;
  if (settled) {
    return { text: anchored ? `Hearing ${shortDate(at)}` : `Due ${shortDate(at)}`, overdue: false };
  }
  const days = daysUntil(at, now);
  if (days < 0) return { text: days === -1 ? "1 day overdue" : `${-days} days overdue`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (anchored) return { text: `Before hearing ${shortDate(at)}`, overdue: false };
  return { text: `Due ${shortDate(at)}`, overdue: false };
}

/**
 * The name a status phrase uses for the person a task needs: "you" when the viewer is a
 * signatory, else the main advocate.
 */
function neededBy(user: Person | PersonId, kase: Case, people: Person[]): string {
  if (canComplete(user, kase)) return "you";
  return nameOf(people, mainAdvocateOf(kase));
}

/**
 * The ONE status phrase a row carries — fixed vocabulary:
 * Needs signature · X · Needs payment · X · Needs filing · X · Draft · X ·
 * Returned · n defects · With the court · Payment confirming · Done {date} ·
 * Expired — {why} · No longer needed — {why}. Hearing tasks, which anyone on the case
 * closes, read "Anyone on the case".
 */
export function statusPhraseOf(task: Task, user: Person | PersonId, kase: Case, people: Person[]): string {
  const uid = typeof user === "string" ? user : user.id;
  switch (task.status) {
    case "awaiting-court":
      return "With the court";
    case "payment-confirming":
      return "Payment confirming";
    case "done":
      return task.completion?.at ? `Done ${shortDate(task.completion.at)}` : "Done";
    case "expired":
      return task.statusNote ? `Expired — ${task.statusNote}` : "Expired";
    case "obsolete":
      return task.statusNote ? `No longer needed — ${task.statusNote}` : "No longer needed";
    case "draft":
      return `Draft · ${task.draft?.by === uid ? "you" : nameOf(people, task.draft?.by)}`;
    case "ready":
    case "open": {
      if (task.kind === "hearing") return "Anyone on the case";
      if (task.kind === "returned" && task.status === "open") {
        const n = task.returned?.defects.length ?? 0;
        return `Returned · ${n} defect${n === 1 ? "" : "s"}`;
      }
      return `Needs ${needOf(task.kind)} · ${neededBy(uid, kase, people)}`;
    }
  }
}

/** "You are on the vakalatnama — you can sign." — the panel's permission line. */
export function permissionLineOf(task: Task, user: Person, kase: Case, people: Person[]): string {
  const signatories = kase.signatories.map((id) => nameOf(people, id));
  const who = signatories.length ? signatories.join(" or ") : "A signatory";
  const verb: Record<Task["kind"], string> = {
    sign: "sign",
    pay: "pay",
    file: "file",
    draft: "file",
    returned: "re-file",
    hearing: "mark it done",
  };
  const v = verb[task.kind];

  if (TERMINAL.has(task.status)) return "This task is closed.";
  if (task.status === "awaiting-court") return "Filed — the registry has it now.";
  if (task.status === "payment-confirming") return "Paid — the gateway is confirming.";
  if (task.kind === "hearing") return "Anyone on the case can mark this done once it has happened in court.";

  const signatory = canComplete(user, kase);
  if (task.status === "ready" && task.prepared) {
    const by = task.prepared.by === user.id ? "you" : nameOf(people, task.prepared.by);
    const on = shortDate(task.prepared.at);
    return signatory
      ? `Prepared by ${by} on ${on} — review and ${v}.`
      : `Prepared by ${by} on ${on} — ${who} must ${v} it.`;
  }
  if (signatory) return `You are on the vakalatnama — you can ${v}.`;
  return `${who} must ${v} this. You can prepare it and mark it ready.`;
}
