/**
 * Words for the row: due cues, blocking cues, the one status cue, amounts and dates.
 * Pure — the row and the panel both call these so the same fact always reads the same.
 */

import { format, isToday, isTomorrow, isYesterday } from "date-fns";

import {
  canApprove,
  canFinalise,
  effectiveAssignee,
  isTakeOver,
  PAGED_KINDS,
  signatoriesOf,
  TERMINAL,
} from "./permissions";
import { bandOf, consequenceAt, daysUntil } from "./urgency";
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

/** "today" · "yesterday" · "20 Aug" — for history lines. */
export function relativeDay(iso: string, now: Date | string = new Date()): string {
  const d = new Date(iso);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  if (isTomorrow(d)) return "tomorrow";
  const days = daysUntil(iso, now);
  if (days < 0 && days > -7) return `${-days} d ago`;
  return shortDate(iso);
}

/** "2 d" — age of a sent-for-approval item. */
export function ageOf(iso: string, now: Date | string = new Date()): string {
  const ms = new Date(now).getTime() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export type DueCue = { text: string; overdue: boolean };

/** The due wording — words, not a badge. Closed tasks only recall the date. */
export function dueCueOf(task: Task, now: Date | string = new Date()): DueCue {
  const at = consequenceAt(task);
  if (!at) return { text: "No date", overdue: false };
  if (TERMINAL.has(task.status)) return { text: `Was due ${shortDate(at)}`, overdue: false };
  const band = bandOf(task, now);
  const days = daysUntil(at, now);
  if (band === "overdue" || band === "long-pending") {
    return { text: days === -1 ? "1 day past due" : `${-days} days past due`, overdue: true };
  }
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  if (task.dueKind === "before-hearing" && task.blocksHearingAt && !task.dueAt) {
    return { text: `Before hearing ${shortDate(at)}`, overdue: false };
  }
  return { text: `Due ${shortDate(at)}`, overdue: false };
}

/** "blocks hearing 20 Aug" — only when the task blocks one. */
export function blockingCueOf(task: Task, now: Date | string = new Date()): string | null {
  if (!task.isBlocking || !task.blocksHearingAt || TERMINAL.has(task.status)) return null;
  const days = daysUntil(task.blocksHearingAt, now);
  if (days === 0) return "blocks today's hearing";
  if (days === 1) return "blocks tomorrow's hearing";
  return `blocks hearing ${shortDate(task.blocksHearingAt)}`;
}

/**
 * The ONE status / permission cue a row carries at rest, or null when the plain state
 * says enough. Priority is fixed so two facts never compete for the slot.
 */
export function statusCueOf(
  task: Task,
  user: Person | PersonId,
  kase: Case,
  people: Person[],
  now: Date | string = new Date()
): string | null {
  const uid = typeof user === "string" ? user : user.id;
  const nameOf = (id?: PersonId) => people.find((p) => p.id === id)?.name ?? "someone";

  const preparer = task.approval?.preparedBy;
  switch (task.status) {
    case "sent-back":
      // The preparer already knows who it went back to; everyone else needs the name.
      return preparer && preparer !== uid ? `Sent back to ${nameOf(preparer)} — 1 note` : "Sent back — 1 note";
    case "awaiting-approval": {
      if (canApprove(uid, task, kase)) return `Prepared by ${nameOf(task.approval?.preparedBy)}`;
      const approvers = signatoriesOf(kase, people).filter((p) => p.id !== task.approval?.preparedBy);
      const to = approvers.length === 1 ? approvers[0].name : approvers.length ? `${approvers[0].name} +${approvers.length - 1}` : "a signatory";
      const age = task.approval?.sentAt ? ` · ${ageOf(task.approval.sentAt, now)}` : "";
      return task.approval?.preparedBy === uid ? `Sent to ${to}${age}` : `Awaiting ${to}${age}`;
    }
    case "awaiting-court":
      return "Awaiting scrutiny";
    case "payment-confirming":
      return "Payment confirming";
    case "done": {
      const how = task.completion?.how === "manual" ? `Done by ${nameOf(task.completion?.by)}` : task.completion?.receipt ? `Done · ${task.completion.receipt}` : "Done";
      return task.completion?.at ? `${how} · ${shortDate(task.completion.at)}` : how;
    }
    case "expired":
      return `Expired${task.dueAt ? ` ${shortDate(task.dueAt)}` : ""}`;
    case "obsolete":
      return "No longer required";
    case "draft":
      // Someone else's draft: name them, so a finaliser knows whose work "Take over" takes.
      return preparer && preparer !== uid ? `${nameOf(preparer)} is preparing this` : "Draft saved";
    case "in-progress":
      return "In progress";
    case "open": {
      if (task.lastPayment?.result === "failed") return "Payment failed";
      if (task.redate) return `Moved from ${shortDate(task.redate.from)} — ${task.redate.reason}`;
      if (task.kind === "fix-defects" && task.defects?.length) {
        const n = task.defects.length;
        return `Returned — ${n} defect${n === 1 ? "" : "s"}`;
      }
      if (task.requiresSignatory && !canFinalise(uid, kase)) {
        const sigs = signatoriesOf(kase, people);
        const who = sigs.length === 1 ? `${sigs[0].name}'s` : sigs.length ? `${sigs[0].name}'s or ${sigs[1].name}'s` : "a signatory's";
        return `Needs ${who} signature`;
      }
      return null;
    }
  }
}

/** The owner slot: a person, or "Unassigned" (including an assignee who lost access). */
export function ownerOf(task: Task, kase: Case, people: Person[]): Person | null {
  const id = effectiveAssignee(task, kase);
  return people.find((p) => p.id === id) ?? null;
}

/** "You are on the vakalatnama — you can sign." — the panel's permission line. */
export function permissionLineOf(
  task: Task,
  user: Person,
  kase: Case,
  people: Person[]
): string {
  const sigs = signatoriesOf(kase, people).filter((p) => p.id !== user.id);
  const others = sigs.map((p) => p.name);
  const finaliser = canFinalise(user, kase);
  const verbWord: Record<Task["kind"], string> = {
    sign: "sign",
    pay: "pay",
    submit: "submit",
    "fix-defects": "re-submit",
    respond: "respond",
    appear: "act",
    other: "act",
  };
  const v = verbWord[task.kind];

  if (task.status === "awaiting-approval") {
    const preparer = people.find((p) => p.id === task.approval?.preparedBy);
    const sent = task.approval?.sentAt ? ` on ${shortDate(task.approval.sentAt)}` : "";
    if (canApprove(user, task, kase)) {
      return `Prepared by ${preparer?.name ?? "someone"}${sent} — approve and ${v === "pay" ? "pay" : "sign"}, or send it back with a note.`;
    }
    if (task.approval?.preparedBy === user.id) {
      const who = others.length ? others.join(" or ") : "a signatory";
      return finaliser
        ? `You prepared this, so ${who} must approve it — nobody approves their own work.`
        : `You sent this to ${who} for approval. You can withdraw it until they decide.`;
    }
    return `Sent by ${preparer?.name ?? "someone"} — waiting on ${others.length ? others.join(" or ") : "a signatory"}.`;
  }
  if (["done", "expired", "obsolete"].includes(task.status)) return "This task is closed.";
  if (task.status === "awaiting-court") return "Submitted — the registry has it now.";
  if (task.status === "payment-confirming") return "Paid — the gateway is confirming.";

  if (isTakeOver(user, task, kase)) {
    const preparer = people.find((p) => p.id === task.approval?.preparedBy)?.name ?? "Someone";
    return `${preparer} is preparing this. You are on the vakalatnama — if you ${v} now you take it over, and the history says so.`;
  }
  if (!task.requiresSignatory) {
    return PAGED_KINDS.has(task.kind)
      ? `Anyone with access to this case can ${v} this — no signature is needed.`
      : "Anyone with access to this case can do this and mark it done.";
  }
  if (finaliser) return `You are on the vakalatnama — you can ${v}.`;
  const who = others.length ? others.join(" or ") : "A signatory";
  return `${who} must ${v} this. You can prepare it and send it for approval.`;
}
