/**
 * The pending-tasks contract.
 *
 * Everything the screens read is one of these shapes. `Task` mirrors what a tasks
 * service will return; the fields that only this front end needs (history, sandbox
 * payment refs) are marked. Dates are ISO strings throughout — the comparator parses
 * them once.
 */

export type PersonId = string;
export type CaseId = string;
export type TaskId = string;

export type PersonRole = "senior" | "junior";

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
  /**
   * Advocates signed on the vakalatnama, in order — the first is the main advocate.
   * Only they may complete a task (sign, pay, file).
   */
  signatories: PersonId[];
  /** Everyone on the case, signatories included. Anyone here may see and prepare. */
  advocates: PersonId[];
};

/**
 * What the task asks for. Each kind is one overview card:
 * sign · pay · file (a document or application due) · returned (scrutiny sent a filing
 * back: fix the defects and re-file) · hearing (court-initiated, anchored to a posting:
 * the plea, a deposition, the sworn statement, arguments) · draft (a filing or
 * application someone started and left in draft).
 */
export type TaskKind = "sign" | "pay" | "file" | "returned" | "hearing" | "draft";

/** The six overview cards — the same set as the kinds; see `cardKindOf`. */
export type CardKind = TaskKind;

/** What set the deadline; decides how the due cue is worded and how it moves. */
export type DueKind = "statutory" | "court-set" | "before-hearing" | "none";

/**
 * open — nobody has started it · draft — someone on the case started work and saved
 * it · ready — the work is complete and needs a signatory to complete it ·
 * awaiting-court — filed, with the registry · payment-confirming — paid, the gateway
 * has not confirmed · done · expired (the window closed) · obsolete (no longer needed)
 * · archived — put away by someone on the case; restorable to the state it left.
 */
export type TaskStatus =
  | "open"
  | "draft"
  | "ready"
  | "awaiting-court"
  | "payment-confirming"
  | "done"
  | "expired"
  | "obsolete"
  | "archived";

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

/** Who last saved work on this task and when (status `draft`). */
export type Draft = {
  by: PersonId;
  savedAt: string;
  note?: string;
};

/** Who finished the preparation and when (status `ready`). */
export type Prepared = {
  by: PersonId;
  at: string;
  note?: string;
  /** What was attached when it was marked ready — shown to the signatory. */
  files?: StoredFileRef[];
};

/** Why a `returned` task exists: scrutiny sent the filing back with these defects. */
export type Returned = {
  by: "scrutiny";
  at: string;
  defects: Defect[];
};

/** Set while a task is archived: who put it away, when, and the state to restore. */
export type Archived = {
  by?: PersonId;
  at: string;
  /** The status the task held before archiving — unarchive returns it there. */
  from: TaskStatus;
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
  /** Verb + object: "Pay the process fee for the summons". */
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
  /** The hearing this task is anchored to — the posting it must be done before or at. */
  hearingAt?: string;
  /** The hearing cannot proceed without it. */
  isBlocking: boolean;
  createdAt: string;
  /** Closed by the event (payment, signature, acceptance) — never by hand. */
  systemObservable: boolean;
  status: TaskStatus;
  draft?: Draft;
  prepared?: Prepared;
  /** Set on a `returned` task: the scrutiny return that created it. */
  returned?: Returned;
  /** Set while status is `archived`. */
  archived?: Archived;
  completion?: Completion;
  /** One line explaining the current state when the status alone does not. */
  statusNote?: string;
  /** Set when a `before-hearing` due date moved with the hearing. */
  redate?: { from: string; to: string; reason: string; at: string };
  /** Last payment attempt — sandbox gateway result. */
  lastPayment?: { result: PaymentResult; ref: string; at: string };
  history: HistoryEntry[];
  files?: StoredFileRef[];
};

/**
 * Which tab a task belongs to — for a given viewer. A task is "needs action" only when
 * this viewer holds its acting verb; a ready item that needs a vakalatnama holder waits
 * on that person from everyone else's chair.
 */
export type TaskView = "needs-action" | "waiting" | "completed" | "archived";

/** The verbs a row or panel may show. */
export type Verb =
  | "Sign"
  | "Pay"
  | "File"
  | "Re-file"
  /** Any viewer, on a draft. */
  | "Continue"
  /** Any open-state task, by anyone on the case — records completion outside DRISTI. */
  | "Mark done"
  /** An archived task, by anyone on the case — back to the state it left. */
  | "Unarchive"
  /** Nothing to do here: waiting on others, or closed. */
  | "View";
