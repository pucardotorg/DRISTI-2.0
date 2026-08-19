/**
 * Who may do what — the owner's rule, in code. File-share permissions:
 *
 *   on the case (`Case.advocates`)        → may see the task and prepare it (draft, ready)
 *   on the vakalatnama (`Case.signatories`) → may also complete it (sign, pay, file)
 *
 * No assignment, no approval routing. Every verb on every row is derived from these
 * functions at render time; nothing is cached per row, so switching identity re-derives
 * everything.
 */

import type { Case, CardKind, Person, PersonId, Task, TaskStatus, TaskView, Verb } from "./types";

function idOf(user: Person | PersonId): PersonId {
  return typeof user === "string" ? user : user.id;
}

/** On the case. A signatory is always on the case, whatever the advocates list says. */
export function canView(user: Person | PersonId, kase: Case): boolean {
  const id = idOf(user);
  return kase.advocates.includes(id) || kase.signatories.includes(id);
}

/** On the vakalatnama — may sign, pay and file. */
export function canComplete(user: Person | PersonId, kase: Case): boolean {
  return kase.signatories.includes(idOf(user));
}

/** The main advocate: first on the vakalatnama. */
export function mainAdvocateOf(kase: Case): PersonId | undefined {
  return kase.signatories[0];
}

/** The case's advocates as people, main advocate first, then the rest in case order. */
export function advocatesOf(kase: Case, people: Person[]): Person[] {
  const ids = [...kase.signatories, ...kase.advocates.filter((id) => !kase.signatories.includes(id))];
  return ids.map((id) => people.find((p) => p.id === id)).filter(Boolean) as Person[];
}

/** The signatories as people, in vakalatnama order. */
export function signatoriesOf(kase: Case, people: Person[]): Person[] {
  return kase.signatories
    .map((pid) => people.find((p) => p.id === pid))
    .filter(Boolean) as Person[];
}

export const TERMINAL: ReadonlySet<TaskStatus> = new Set(["done", "expired", "obsolete"]);
export const WAITING: ReadonlySet<TaskStatus> = new Set(["awaiting-court", "payment-confirming"]);
/** States someone on the case can still act on. */
export const ACTIONABLE: ReadonlySet<TaskStatus> = new Set(["open", "draft", "ready"]);

/** Which tab a task belongs to. The same for every viewer. */
export function viewOf(task: Task): TaskView {
  if (TERMINAL.has(task.status)) return "completed";
  if (WAITING.has(task.status)) return "waiting";
  return "open";
}

/**
 * Which overview card a task counts under. Anything someone saved as a draft is a
 * draft, whatever it will become; a `draft`-kind task that has been marked ready (or
 * filed) is a filing from then on.
 */
export function cardKindOf(task: Task): CardKind {
  if (task.status === "draft") return "draft";
  if (task.kind === "draft") return "file";
  return task.kind;
}

/** Kinds that have their own act page. Hearing tasks are done in court. */
export const PAGED_KINDS: ReadonlySet<Task["kind"]> = new Set(["sign", "pay", "file", "returned", "draft"]);

/** Only hearing tasks the system cannot observe may be closed by hand, and only while open. */
export function canMarkDone(user: Person | PersonId, task: Task, kase: Case): boolean {
  if (!canView(user, kase)) return false;
  return task.kind === "hearing" && !task.systemObservable && task.status === "open";
}

/** The completing verb for a paged kind. */
export function completeVerbOf(kind: Task["kind"]): Verb {
  switch (kind) {
    case "sign":
      return "Sign";
    case "pay":
      return "Pay";
    case "returned":
      return "Fix & re-file";
    default:
      return "File";
  }
}

/** What a task needs from its signatory: "signature" · "payment" · "filing". */
export function needOf(kind: Task["kind"]): "signature" | "payment" | "filing" {
  if (kind === "sign") return "signature";
  if (kind === "pay") return "payment";
  return "filing";
}

/**
 * The one verb a row shows this person. "View" means there is nothing for them to do
 * — the task is waiting on others, closed, or outside their access.
 */
export function verbFor(user: Person | PersonId, task: Task, kase: Case): Verb {
  const id = idOf(user);
  if (!canView(id, kase)) return "View";
  if (!ACTIONABLE.has(task.status)) return "View";

  if (task.kind === "hearing") {
    return canMarkDone(id, task, kase) ? "Mark done" : "View";
  }
  if (task.status === "draft") return "Continue";
  return canComplete(id, kase) ? completeVerbOf(task.kind) : "Open";
}
