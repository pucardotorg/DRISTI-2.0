/**
 * The pending-tasks contract.
 *
 * Everything the screens read is one of these shapes. `Task` mirrors what a tasks
 * service will return; the fields that only this front end needs (history, sandbox
 * payment refs) are marked. Dates are ISO strings throughout — the comparator and the
 * urgency bands parse them once.
 */

export type PersonId = string;
export type CaseId = string;
export type TaskId = string;

export type PersonRole = "senior" | "junior" | "clerk";

export type Person = {
  id: PersonId;
  name: string;
  /** Two letters for the avatar. */
  initials: string;
  role: PersonRole;
};

export type Case = {
  id: CaseId;
  /** "ST 412/2025"; empty until the registry numbers the case. */
  stNumber: string;
  /** "KLKL01-000412-2025"; empty until numbered. */
  cnr: string;
  /** "Sreekumar N. v. Vismaya Traders". */
  parties: string;
  court: string;
  stage: string;
  nextHearingAt?: string;
  /** People signed on the vakalatnama — they may finalise (sign, pay, submit). */
  signatories: PersonId[];
  /** People with case access who are not on the vakalatnama — they may prepare. */
  members: PersonId[];
};

export type TaskKind =
  | "sign"
  | "pay"
  | "submit"
  | "fix-defects"
  | "respond"
  | "appear"
  | "other";

/** What set the deadline; decides how the due cue is worded and how it moves. */
export type DueKind = "statutory" | "court-set" | "before-hearing" | "none";

export type TaskStatus =
  | "open"
  | "in-progress"
  | "draft"
  | "awaiting-approval"
  | "sent-back"
  | "awaiting-court"
  | "payment-confirming"
  | "done"
  | "expired"
  | "obsolete";

/** An uploaded file, by reference; the bytes live in the repository's file store. */
export type StoredFileRef = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** "PDF", "JPG" — for the file chip. */
  ext: string;
  /** Which "documents needed" slot this upload fills, if any. */
  slot?: string;
};

/** One scrutiny defect on a returned filing. */
export type Defect = {
  n: number;
  text: string;
  fixed: boolean;
  replacement?: StoredFileRef;
};

export type Approval = {
  preparedBy: PersonId;
  sentAt: string;
  note?: string;
  /** What the preparer filled or uploaded — free-form, shown to the approver. */
  prepared: Record<string, unknown>;
  decidedBy?: PersonId;
  decidedAt?: string;
  decision?: "approved" | "sent-back";
  decisionNote?: string;
};

export type Completion = {
  by?: PersonId;
  at: string;
  how: "event" | "manual";
  /** Receipt / acknowledgement number the person can quote at the counter. */
  receipt?: string;
};

export type HistoryEntry = {
  at: string;
  by?: PersonId;
  text: string;
};

export type PaymentResult = "success" | "pending" | "failed";

export type Task = {
  id: TaskId;
  caseId: CaseId;
  kind: TaskKind;
  /** Verb + object: "Pay the ₹2 process fee". */
  title: string;
  /** The order / notice / scrutiny remark that created the task. */
  why: { event: string; at: string };
  whatToDo: string;
  documentsNeeded?: string[];
  amountPaise?: number;
  feeHead?: string;
  dueAt?: string;
  dueKind: DueKind;
  /** Provenance of the deadline: "Order dated 27 Jul: produce before next posting". */
  deadlineNote?: string;
  /** The hearing this task must be finished before, if it blocks one. */
  blocksHearingAt?: string;
  isBlocking: boolean;
  createdAt: string;
  assigneeId?: PersonId;
  /** Finalising step — only someone on the vakalatnama may complete it. */
  requiresSignatory: boolean;
  /** Closed by the event (payment, signature, acceptance) — never by hand. */
  systemObservable: boolean;
  status: TaskStatus;
  approval?: Approval;
  completion?: Completion;
  /** One line explaining the current state when the status alone does not. */
  statusNote?: string;
  /** Set when a `before-hearing` due date moved with the hearing. */
  redate?: { from: string; to: string; reason: string; at: string };
  /** Last payment attempt — sandbox gateway result. */
  lastPayment?: { result: PaymentResult; ref: string; at: string };
  /** Scrutiny defects on a `fix-defects` task. */
  defects?: Defect[];
  history: HistoryEntry[];
  files?: StoredFileRef[];
};

/** Which tab a task belongs to for a given person. */
export type TaskView = "todo" | "waiting" | "done";

/** The verbs a row or panel may show. */
export type Verb =
  | "Sign"
  | "Pay"
  | "Submit"
  | "Fix defects"
  | "Prepare"
  | "Continue"
  /** A finaliser finishing a draft someone else was preparing. */
  | "Take over"
  | "Send for approval"
  | "Approve & sign"
  | "Mark done"
  | "Withdraw"
  | "View";
