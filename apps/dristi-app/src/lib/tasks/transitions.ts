/**
 * The task state machine — pure functions from (task, actor, case) to a new task.
 *
 * Every transition checks the from-state and the actor's permission, and throws a
 * `TransitionError` otherwise; every transition appends a history line, so the panel's
 * timeline is the audit trail. Nothing here touches storage — the store applies the
 * result and writes it.
 *
 *   open ──startPrepare──▶ draft / in-progress ──saveDraft──▶ (same)
 *   open · in-progress · draft · sent-back ──sendForApproval──▶ awaiting-approval
 *   awaiting-approval ──withdraw──▶ draft
 *   awaiting-approval ──approveAndSign──▶ done (sign) · awaiting-court (submit, fix) ·
 *                                          in-progress (pay — then recordPayment)
 *   awaiting-approval ──sendBack(note)──▶ sent-back
 *   open · in-progress · draft · sent-back ──sign──▶ done            (event)
 *   open · in-progress · draft · sent-back ──submit──▶ awaiting-court
 *   open · in-progress · draft · sent-back ──recordPayment──▶ done · payment-confirming
 *                                          · open / same draft / awaiting-approval (failed)
 *   (a finaliser finishing someone else's draft "takes it over" — named in history)
 *   payment-confirming ──confirmPayment──▶ done  (event)
 *   awaiting-court ──courtAccepted──▶ done       (event)
 *   awaiting-court ──courtReturned(defects)──▶ obsolete + a new fix-defects task
 *   open · in-progress ──markDone──▶ done        (manual; only !systemObservable)
 *   any non-terminal ──reassign · redate · expire · obsolete──▶ …
 */

import {
  canApprove,
  canFinalise,
  canFinaliseTask,
  canMarkDone,
  canPrepare,
  canView,
  isTakeOver,
  TERMINAL,
} from "./permissions";
import type {
  Case,
  Defect,
  PaymentResult,
  Person,
  PersonId,
  StoredFileRef,
  Task,
  TaskStatus,
} from "./types";

export type TransitionErrorCode = "illegal-state" | "forbidden" | "invalid";

export class TransitionError extends Error {
  code: TransitionErrorCode;
  constructor(code: TransitionErrorCode, message: string) {
    super(message);
    this.name = "TransitionError";
    this.code = code;
  }
}

/** Who is acting, on which case, and when. `now` defaults to the wall clock. */
export type Ctx = {
  actor: Person;
  kase: Case;
  now?: string;
  /** For naming other people in history lines. */
  people?: Person[];
};

/** A transition either changes one task or changes one and creates another. */
export type Transition = (task: Task, ctx: Ctx) => Task | { task: Task; created: Task };

function nowOf(ctx: Ctx): string {
  return ctx.now ?? new Date().toISOString();
}

function nameOf(ctx: Ctx, id?: PersonId): string {
  if (!id) return "someone";
  if (id === ctx.actor.id) return ctx.actor.name;
  return ctx.people?.find((p) => p.id === id)?.name ?? id;
}

function assertState(task: Task, from: TaskStatus[], what: string): void {
  if (!from.includes(task.status)) {
    throw new TransitionError(
      "illegal-state",
      `Cannot ${what} a task that is ${task.status} (needs ${from.join(" or ")}).`
    );
  }
}

function assertAllowed(ok: boolean, what: string): void {
  if (!ok) throw new TransitionError("forbidden", `You are not allowed to ${what} this task.`);
}

function withHistory(task: Task, ctx: Ctx, text: string, by: PersonId | undefined = ctx.actor.id): Task {
  return { ...task, history: [...task.history, { at: nowOf(ctx), by, text }] };
}

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Stand-in reference the shape a gateway or registry returns, generated locally. */
export function newRef(prefix: string, seed?: number): string {
  let out = "";
  let x = seed ?? Math.floor(Math.random() * 2 ** 31);
  for (let i = 0; i < 10; i += 1) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out += REF_ALPHABET[x % REF_ALPHABET.length];
  }
  return `${prefix}-${out}`;
}

/* ─────────────────────────── preparing ─────────────────────────── */

/** Start work: a preparer opens a draft; a signatory marks it in progress. */
export function startPrepare(task: Task, ctx: Ctx): Task {
  assertState(task, ["open", "sent-back"], "start");
  assertAllowed(canView(ctx.actor, ctx.kase), "work on");
  const finaliser = canFinalise(ctx.actor, ctx.kase);
  const status: TaskStatus = finaliser ? "in-progress" : "draft";
  return withHistory(
    {
      ...task,
      status,
      assigneeId: task.assigneeId ?? ctx.actor.id,
      approval:
        task.approval ??
        (finaliser ? undefined : { preparedBy: ctx.actor.id, sentAt: "", prepared: {} }),
    },
    ctx,
    finaliser ? `${ctx.actor.name} started this task` : `${ctx.actor.name} started preparing`
  );
}

/** Save what has been filled or uploaded so far, without changing state. */
export function saveDraft(
  task: Task,
  ctx: Ctx,
  prepared: Record<string, unknown>,
  files?: StoredFileRef[]
): Task {
  assertState(task, ["open", "draft", "in-progress", "sent-back"], "save");
  assertAllowed(canView(ctx.actor, ctx.kase), "save");
  const finaliser = canFinalise(ctx.actor, ctx.kase);
  const status: TaskStatus =
    task.status === "open" ? (finaliser ? "in-progress" : "draft") : task.status;
  // A signatory's saved work is not "prepared for approval"; a preparer's is.
  const approval = finaliser
    ? task.approval
    : {
        preparedBy: ctx.actor.id,
        sentAt: task.approval?.sentAt ?? "",
        prepared: { ...(task.approval?.prepared ?? {}), ...prepared },
        note: task.approval?.note,
      };
  return withHistory(
    {
      ...task,
      status,
      assigneeId: task.assigneeId ?? ctx.actor.id,
      approval,
      files: files ?? task.files,
    },
    ctx,
    `${ctx.actor.name} saved a draft`
  );
}

/**
 * Hand the prepared task to a signatory. Only a non-signatory needs to — including on a
 * task a signatory started (in-progress) and a member then picked up.
 */
export function sendForApproval(task: Task, ctx: Ctx, note?: string): Task {
  assertState(task, ["open", "in-progress", "draft", "sent-back"], "send for approval");
  assertAllowed(canPrepare(ctx.actor, ctx.kase), "send for approval");
  if (!task.requiresSignatory) {
    throw new TransitionError("invalid", "This task does not need a signatory's approval.");
  }
  const at = nowOf(ctx);
  return withHistory(
    {
      ...task,
      status: "awaiting-approval",
      statusNote: undefined,
      assigneeId: task.assigneeId ?? ctx.actor.id,
      approval: {
        preparedBy: ctx.actor.id,
        sentAt: at,
        note: note?.trim() || undefined,
        prepared: task.approval?.prepared ?? {},
      },
    },
    ctx,
    `${ctx.actor.name} sent this for approval${note?.trim() ? ` — “${note.trim()}”` : ""}`
  );
}

/** The preparer takes it back before anyone decides. */
export function withdraw(task: Task, ctx: Ctx): Task {
  assertState(task, ["awaiting-approval"], "withdraw");
  assertAllowed(task.approval?.preparedBy === ctx.actor.id, "withdraw");
  return withHistory(
    {
      ...task,
      status: "draft",
      approval: { ...task.approval!, sentAt: "" },
    },
    ctx,
    `${ctx.actor.name} withdrew this from approval`
  );
}

/* ─────────────────────────── approving ─────────────────────────── */

/**
 * The signatory approves and their signature is applied. Sign closes by event; submit
 * and fix-defects go to the court; pay moves to in-progress so the same person records
 * the payment next (see `recordPayment`).
 */
export function approveAndSign(task: Task, ctx: Ctx): Task {
  assertState(task, ["awaiting-approval"], "approve");
  assertAllowed(canApprove(ctx.actor, task, ctx.kase), "approve");
  const at = nowOf(ctx);
  const approval = {
    ...task.approval!,
    decidedBy: ctx.actor.id,
    decidedAt: at,
    decision: "approved" as const,
  };
  const preparer = nameOf(ctx, task.approval?.preparedBy);
  const base = withHistory(
    { ...task, approval, statusNote: undefined },
    ctx,
    `${ctx.actor.name} approved ${preparer}'s preparation and signed`
  );
  switch (task.kind) {
    case "sign":
      return {
        ...base,
        status: "done",
        completion: { by: ctx.actor.id, at, how: "event", receipt: newRef("ESIGN") },
      };
    case "submit":
    case "fix-defects":
      return withHistory(
        { ...base, status: "awaiting-court" },
        ctx,
        `Submitted to the court — awaiting scrutiny`
      );
    case "pay":
      return { ...base, status: "in-progress" };
    default:
      return { ...base, status: "in-progress" };
  }
}

/** Return it to the preparer with a note. The note is required. */
export function sendBack(task: Task, ctx: Ctx, note: string): Task {
  assertState(task, ["awaiting-approval"], "send back");
  assertAllowed(canApprove(ctx.actor, task, ctx.kase), "send back");
  const text = note.trim();
  if (!text) throw new TransitionError("invalid", "A note is required when sending back.");
  const at = nowOf(ctx);
  return withHistory(
    {
      ...task,
      status: "sent-back",
      statusNote: text,
      approval: {
        ...task.approval!,
        decidedBy: ctx.actor.id,
        decidedAt: at,
        decision: "sent-back",
        decisionNote: text,
      },
    },
    ctx,
    `${ctx.actor.name} sent this back — “${text}”`
  );
}

/* ─────────────────────────── finalising ─────────────────────────── */

const FINALISABLE: TaskStatus[] = ["open", "in-progress", "draft", "sent-back"];

/**
 * The gate every finalising step passes: a legal from-state, and an actor who may
 * complete this task. When the task is a draft someone else was preparing, the actor
 * takes it over and the history says so — the preparer's work is not silently absorbed.
 */
function beginFinalise(task: Task, ctx: Ctx, what: string): Task {
  assertState(task, FINALISABLE, what);
  assertAllowed(canFinaliseTask(ctx.actor, task, ctx.kase), what);
  if (!isTakeOver(ctx.actor, task, ctx.kase)) return task;
  return withHistory(task, ctx, `${ctx.actor.name} took over from ${nameOf(ctx, task.approval?.preparedBy)}`);
}

/** Record the gateway's answer. Payment is finalising — signatories only. */
export function recordPayment(task: Task, ctx: Ctx, result: PaymentResult): Task {
  if (task.kind !== "pay") throw new TransitionError("invalid", "Not a payment task.");
  const started = beginFinalise(task, ctx, "pay");
  const at = nowOf(ctx);
  const ref = newRef("TXN");
  const lastPayment = { result, ref, at };
  switch (result) {
    case "success":
      return withHistory(
        {
          ...started,
          status: "done",
          statusNote: undefined,
          lastPayment,
          completion: { by: ctx.actor.id, at, how: "event", receipt: ref },
        },
        ctx,
        `${ctx.actor.name} paid — receipt ${ref}`
      );
    case "pending":
      return withHistory(
        {
          ...started,
          status: "payment-confirming",
          statusNote: `Payment confirming · ref ${ref}`,
          lastPayment,
        },
        ctx,
        `${ctx.actor.name} paid — gateway is confirming (ref ${ref})`
      );
    case "failed": {
      // An approver's failed payment un-does the approval step: the task returns to
      // awaiting-approval so the preparer still waits and the approver still sees
      // "Approve & pay". Otherwise a draft stays a draft; open / in-progress fall to open.
      const approving = task.approval?.decision === "approved" && task.status === "in-progress";
      const status: TaskStatus = approving
        ? "awaiting-approval"
        : task.status === "draft" || task.status === "sent-back"
          ? task.status
          : "open";
      const approval = approving
        ? { ...task.approval!, decidedBy: undefined, decidedAt: undefined, decision: undefined }
        : started.approval;
      return withHistory(
        {
          ...started,
          status,
          statusNote: "Payment failed — try again",
          lastPayment,
          approval,
        },
        ctx,
        approving
          ? `Payment failed (ref ${ref}) — back to awaiting approval`
          : `Payment failed (ref ${ref}) — the task stays open`
      );
    }
  }
}

/** The gateway confirms a pending payment. System event; anyone with access may record it. */
export function confirmPayment(task: Task, ctx: Ctx): Task {
  assertState(task, ["payment-confirming"], "confirm payment on");
  assertAllowed(canView(ctx.actor, ctx.kase), "confirm payment on");
  const at = nowOf(ctx);
  const ref = task.lastPayment?.ref ?? newRef("TXN");
  return withHistory(
    {
      ...task,
      status: "done",
      statusNote: undefined,
      lastPayment: { result: "success", ref, at },
      completion: { by: task.lastPayment ? task.assigneeId : ctx.actor.id, at, how: "event", receipt: ref },
    },
    ctx,
    `Payment confirmed — receipt ${ref}`,
    undefined
  );
}

/** E-sign applied. Signatories only. */
export function sign(task: Task, ctx: Ctx): Task {
  if (task.kind !== "sign") throw new TransitionError("invalid", "Not a signature task.");
  const started = beginFinalise(task, ctx, "sign");
  const at = nowOf(ctx);
  const ref = newRef("ESIGN");
  return withHistory(
    {
      ...started,
      status: "done",
      statusNote: undefined,
      completion: { by: ctx.actor.id, at, how: "event", receipt: ref },
    },
    ctx,
    `${ctx.actor.name} signed with Aadhaar e-Sign — ${ref}`
  );
}

/** Submit to the court. Signatories only. */
export function submit(task: Task, ctx: Ctx, files?: StoredFileRef[]): Task {
  if (task.kind !== "submit" && task.kind !== "fix-defects") {
    throw new TransitionError("invalid", "Not a submission task.");
  }
  const started = beginFinalise(task, ctx, "submit");
  if (task.kind === "fix-defects" && task.defects?.some((d) => !d.fixed)) {
    throw new TransitionError("invalid", "Every defect must be marked fixed before re-submitting.");
  }
  return withHistory(
    {
      ...started,
      status: "awaiting-court",
      statusNote: undefined,
      files: files ?? task.files,
    },
    ctx,
    `${ctx.actor.name} submitted to the court — awaiting scrutiny`
  );
}

/** Registry accepted the filing. */
export function courtAccepted(task: Task, ctx: Ctx): Task {
  assertState(task, ["awaiting-court"], "accept");
  assertAllowed(canView(ctx.actor, ctx.kase), "record acceptance on");
  const at = nowOf(ctx);
  const ref = newRef("ACK");
  return withHistory(
    {
      ...task,
      status: "done",
      completion: { by: task.assigneeId, at, how: "event", receipt: ref },
    },
    ctx,
    `Accepted by the registry — acknowledgement ${ref}`,
    undefined
  );
}

/**
 * Registry returned the filing with defects. The submitted task is superseded and a
 * fix-defects task takes its place, carrying the defects and the same deadline shape.
 */
export function courtReturned(
  task: Task,
  ctx: Ctx,
  defects: string[]
): { task: Task; created: Task } {
  assertState(task, ["awaiting-court"], "return");
  assertAllowed(canView(ctx.actor, ctx.kase), "record a return on");
  const list = defects.map((d) => d.trim()).filter(Boolean);
  if (!list.length) throw new TransitionError("invalid", "At least one defect is needed.");
  const at = nowOf(ctx);
  const n = list.length;
  const superseded = withHistory(
    {
      ...task,
      status: "obsolete",
      statusNote: `Returned by scrutiny with ${n} defect${n === 1 ? "" : "s"} — replaced by a fix-defects task`,
    },
    ctx,
    `Returned by scrutiny with ${n} defect${n === 1 ? "" : "s"}`,
    undefined
  );
  const created: Task = {
    id: `${task.id}-fix-${at.slice(0, 10).replace(/-/g, "")}`,
    caseId: task.caseId,
    kind: "fix-defects",
    title: `Fix ${n} defect${n === 1 ? "" : "s"} — ${objectOf(task.title)}`,
    why: { event: `Scrutiny returned “${objectOf(task.title)}” with ${n} defect${n === 1 ? "" : "s"}`, at },
    whatToDo: "Cure each defect, attach the corrected document where one is needed, and re-submit.",
    documentsNeeded: task.documentsNeeded,
    dueAt: task.dueAt,
    dueKind: task.dueKind,
    deadlineNote: task.deadlineNote,
    blocksHearingAt: task.blocksHearingAt,
    isBlocking: task.isBlocking,
    createdAt: at,
    assigneeId: task.assigneeId,
    requiresSignatory: true,
    systemObservable: true,
    status: "open",
    defects: list.map((text, i): Defect => ({ n: i + 1, text, fixed: false })),
    files: task.files,
    history: [{ at, text: `Created — scrutiny returned the filing with ${n} defect${n === 1 ? "" : "s"}` }],
  };
  return { task: superseded, created };
}

/** "File the …" → "the …"; the object of the original verb, for the new title. */
function objectOf(title: string): string {
  return title.replace(/^(File|Upload|Submit|Produce|Re-file|Sign|Pay)\s+/i, "");
}

/** Mark a defect fixed / unfixed, optionally with a replacement upload. */
export function setDefect(
  task: Task,
  ctx: Ctx,
  n: number,
  fixed: boolean,
  replacement?: StoredFileRef
): Task {
  assertState(task, ["open", "in-progress", "draft", "sent-back"], "edit defects on");
  assertAllowed(canView(ctx.actor, ctx.kase), "edit");
  const defects = (task.defects ?? []).map((d) =>
    d.n === n ? { ...d, fixed, replacement: replacement ?? d.replacement } : d
  );
  return withHistory(
    {
      ...task,
      defects,
      status:
        task.status === "open"
          ? canFinalise(ctx.actor, ctx.kase)
            ? "in-progress"
            : "draft"
          : task.status,
      assigneeId: task.assigneeId ?? ctx.actor.id,
    },
    ctx,
    `${ctx.actor.name} marked defect ${n} ${fixed ? "fixed" : "not fixed"}`
  );
}

/** By hand — only for tasks the system cannot observe. */
export function markDone(task: Task, ctx: Ctx): Task {
  assertState(task, ["open", "in-progress"], "mark done");
  assertAllowed(canMarkDone(ctx.actor, task, ctx.kase), "mark done");
  const at = nowOf(ctx);
  return withHistory(
    {
      ...task,
      status: "done",
      statusNote: undefined,
      completion: { by: ctx.actor.id, at, how: "manual" },
    },
    ctx,
    `${ctx.actor.name} marked this done`
  );
}

/* ─────────────────────────── housekeeping ─────────────────────────── */

/** Anyone with access may reassign to anyone with access, or unassign. */
export function reassign(task: Task, ctx: Ctx, assigneeId: PersonId | undefined): Task {
  if (TERMINAL.has(task.status)) {
    throw new TransitionError("illegal-state", "A closed task cannot be reassigned.");
  }
  assertAllowed(canView(ctx.actor, ctx.kase), "reassign");
  if (assigneeId && !canView(assigneeId, ctx.kase)) {
    throw new TransitionError("invalid", "That person does not have access to this case.");
  }
  if ((task.assigneeId ?? undefined) === (assigneeId ?? undefined)) return task;
  return withHistory(
    { ...task, assigneeId },
    ctx,
    assigneeId
      ? `${ctx.actor.name} assigned this to ${nameOf(ctx, assigneeId)}`
      : `${ctx.actor.name} unassigned this`
  );
}

/** The window closed. System event. */
export function expire(task: Task, ctx: Ctx, reason: string): Task {
  assertState(task, ["open", "in-progress", "draft", "sent-back"], "expire");
  return withHistory(
    { ...task, status: "expired", statusNote: reason },
    ctx,
    `Expired — ${reason}`,
    undefined
  );
}

/** No longer required — order withdrawn, case disposed. System event or a person. */
export function obsolete(task: Task, ctx: Ctx, reason: string): Task {
  if (TERMINAL.has(task.status)) {
    throw new TransitionError("illegal-state", "A closed task cannot be made obsolete.");
  }
  return withHistory(
    { ...task, status: "obsolete", statusNote: reason },
    ctx,
    `No longer required — ${reason}`
  );
}

/** A due date moved (a hearing was adjourned). Keeps the old date for the cue. */
export function redate(
  task: Task,
  ctx: Ctx,
  newDue: string,
  reason: string,
  newHearing?: string
): Task {
  if (TERMINAL.has(task.status)) {
    throw new TransitionError("illegal-state", "A closed task cannot be re-dated.");
  }
  const at = nowOf(ctx);
  const from = task.dueAt ?? task.blocksHearingAt ?? at;
  return withHistory(
    {
      ...task,
      dueAt: newDue,
      blocksHearingAt: newHearing ?? task.blocksHearingAt,
      redate: { from, to: newDue, reason, at },
    },
    ctx,
    `Due date moved from ${shortDate(from)} to ${shortDate(newDue)} — ${reason}`,
    undefined
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
