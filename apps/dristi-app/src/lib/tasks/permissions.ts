/**
 * Who may do what — the owner's rule, in code.
 *
 * Signed on the vakalatnama → may finalise (sign, pay, submit). Case access without the
 * vakalatnama → may prepare and send for approval. Nobody approves their own work.
 * Every verb on every row is derived from these functions at render time; nothing is
 * cached per row, so switching identity re-derives everything.
 */

import type { Case, Person, PersonId, Task, TaskView, Verb } from "./types";

export function canView(user: Person | PersonId, kase: Case): boolean {
  const id = typeof user === "string" ? user : user.id;
  return kase.signatories.includes(id) || kase.members.includes(id);
}

/** On the vakalatnama — may sign, pay and submit. */
export function canFinalise(user: Person | PersonId, kase: Case): boolean {
  const id = typeof user === "string" ? user : user.id;
  return kase.signatories.includes(id);
}

/** Has access but is not on the vakalatnama — may prepare and send for approval. */
export function canPrepare(user: Person | PersonId, kase: Case): boolean {
  return canView(user, kase) && !canFinalise(user, kase);
}

/**
 * May complete THIS task's finalising step: a signatory always; anyone with access when
 * the task does not need a signatory (`requiresSignatory` false). The verb and the
 * transitions read the same predicate, so a row never offers what the transition refuses.
 */
export function canFinaliseTask(user: Person | PersonId, task: Task, kase: Case): boolean {
  if (canFinalise(user, kase)) return true;
  return !task.requiresSignatory && canView(user, kase);
}

/**
 * A finaliser looking at a draft someone else is preparing. Finishing it takes it over
 * — the preparer is named in the history — rather than dead-ending on "Continue".
 */
export function isTakeOver(user: Person | PersonId, task: Task, kase: Case): boolean {
  const id = typeof user === "string" ? user : user.id;
  if (task.status !== "draft" && task.status !== "sent-back") return false;
  if (!canFinaliseTask(id, task, kase)) return false;
  return !!task.approval?.preparedBy && task.approval.preparedBy !== id;
}

/** A signatory, looking at someone else's prepared work. Never the preparer. */
export function canApprove(user: Person | PersonId, task: Task, kase: Case): boolean {
  const id = typeof user === "string" ? user : user.id;
  return (
    canFinalise(id, kase) &&
    task.status === "awaiting-approval" &&
    task.approval?.preparedBy !== id
  );
}

/** Only tasks the system cannot observe may be closed by hand, and only while open. */
export function canMarkDone(user: Person | PersonId, task: Task, kase?: Case): boolean {
  if (kase && !canView(user, kase)) return false;
  return !task.systemObservable && (task.status === "open" || task.status === "in-progress");
}

/** Whether an assignee still has access; a person who lost it reads as unassigned. */
export function effectiveAssignee(task: Task, kase: Case): PersonId | undefined {
  if (!task.assigneeId) return undefined;
  return canView(task.assigneeId, kase) ? task.assigneeId : undefined;
}

export const TERMINAL: ReadonlySet<Task["status"]> = new Set(["done", "expired", "obsolete"]);
export const WAITING: ReadonlySet<Task["status"]> = new Set([
  "awaiting-court",
  "payment-confirming",
]);

/**
 * Which tab a task belongs to for THIS person. An awaiting-approval task is the
 * approver's to do and everyone else's wait — including the preparer's.
 */
export function viewOf(task: Task, user: Person | PersonId, kase: Case): TaskView {
  if (TERMINAL.has(task.status)) return "done";
  if (WAITING.has(task.status)) return "waiting";
  if (task.status === "awaiting-approval") {
    return canApprove(user, task, kase) ? "todo" : "waiting";
  }
  return "todo";
}

/** Kinds that have their own act page. */
export const PAGED_KINDS: ReadonlySet<Task["kind"]> = new Set([
  "sign",
  "pay",
  "submit",
  "fix-defects",
]);

const FINAL_VERB: Record<Task["kind"], Verb> = {
  sign: "Sign",
  pay: "Pay",
  submit: "Submit",
  "fix-defects": "Fix defects",
  respond: "Mark done",
  appear: "Mark done",
  other: "Mark done",
};

/**
 * The one verb a row shows this person. "View" means there is nothing for them to do
 * — the task is closed, waiting on someone else, or outside their access.
 */
export function verbFor(user: Person | PersonId, task: Task, kase: Case): Verb {
  const id = typeof user === "string" ? user : user.id;
  if (!canView(id, kase)) return "View";
  if (TERMINAL.has(task.status) || WAITING.has(task.status)) return "View";

  if (task.status === "awaiting-approval") {
    if (canApprove(id, task, kase)) return "Approve & sign";
    if (task.approval?.preparedBy === id) return "Withdraw";
    return "View";
  }

  // open · in-progress · draft · sent-back
  if (!PAGED_KINDS.has(task.kind)) {
    return canMarkDone(id, task, kase) ? "Mark done" : "View";
  }
  if (isTakeOver(id, task, kase)) return "Take over";
  if (task.status === "draft" || task.status === "in-progress") return "Continue";
  if (task.status === "sent-back") return "Continue";
  if (canFinaliseTask(id, task, kase)) return FINAL_VERB[task.kind];
  return "Prepare";
}

/** Names of the people who could finalise this task — for "Needs R. Manoj's signature". */
export function signatoriesOf(kase: Case, people: Person[]): Person[] {
  return kase.signatories
    .map((pid) => people.find((p) => p.id === pid))
    .filter(Boolean) as Person[];
}
