/**
 * One complaint's own file — what the court reads before deciding whether to take it
 * on the register.
 *
 * The sibling of `hearing-overview.ts`: that module is the glance a bench takes at a
 * matter already on file, this one is the whole submitted complaint, section by
 * section, as the e-filing carried it. It is the screen behind a row of
 * `register-cases.ts`, and it is deliberately the *reading* of a complaint and not the
 * act on it — see `case-review-screen.tsx` for what the page does and does not offer.
 *
 * **There is no backend, and none of this is read from a case.** A complaint's
 * particulars are *derived from its queue row* — its `CMP` serial and how long it has
 * waited — rather than transcribed from a fixture per row. Three reasons, in order of
 * how much they matter:
 *
 * 1. **Every row opens a file.** Thirty-five complaints are waiting; a sidecar for six
 *    of them would leave twenty-nine dead links behind a cause title that now goes
 *    somewhere.
 * 2. **The dates hold together.** A §138 complaint is a chain — cheque drawn, deposited,
 *    returned, notice sent, notice served, fifteen days run, cause of action accrues,
 *    complaint filed within a month of that. Deriving the chain backwards from the one
 *    date the row already implies (today minus its wait) means every file is internally
 *    consistent and none of it drifts as the fixture sits, which is the same reason the
 *    queue stores a day count rather than a date.
 * 3. **A clerk would notice the alternative.** Thirty-five files sharing one cheque
 *    number is the first thing a real reader spots.
 *
 * What derivation cannot decide is which *state* a file is in — whether a document is
 * on record, whether there is a delay-condonation application, whether anyone deposed.
 * Those are the screen's unhappy paths, so they are named for particular rows in
 * `CASE_FILE_MARKS` and reachable from the queue rather than left to a modulo.
 *
 * **A derived value is demo data; a derived attribute is not** (brief §5a.8). Every
 * term this module names is an attribute the registry actually holds — the e-filing
 * contract in `lib/filing/types.ts`, a `docs/product/` citation, or a `REG-nn`
 * requirement — and the whole vocabulary is declared once in `FACT_TERMS` so it can be
 * checked rather than trusted. Nineteen rows that had no source, restated another row,
 * or were constant on every §138 complaint were cut in the 2026-09-10 revision; the
 * table in `docs/design/proposals/register-cases.md` §5a records each one.
 *
 * **The terms are the attributes' names, not the form's questions** (brief §5a.4a).
 * "Date when the fifteen days from service of the legal demand notice were complete" is
 * a question a form asks once; "Notice period ended" is what the court calls the fact
 * afterwards, and it is what survives translation into a column a reader can scan.
 *
 * **The reference's own values are not copied.** The legacy screen shows placeholder
 * filings — `asdf`, `dfgfdg`, a stylesheet pasted into the cheque-return reason. The
 * court side already speaks Kollam parties and `CMP` numbers
 * (`docs/design/proposals/register-cases.md` §6), and a third vocabulary would be the
 * first thing a clerk noticed.
 */

import {
  BanknoteIcon,
  FileTextIcon,
  ReceiptIndianRupeeIcon,
  ScaleIcon,
  ScrollTextIcon,
  UserRoundCheckIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { CURRENT_STAFF } from "./content";
import { causeTitle, counselFor, parseIsoDay, isoDay } from "./hearings";
import { formatCaseDate, formatChequeAmount } from "./hearing-overview";
import { registerCaseById, type RegisterCase } from "./register-cases";

/**
 * Every attribute name this file can print, in one place.
 *
 * The point is not tidiness. A term typed at the call site is a term that can be
 * invented, translated twice, or quietly disagree with the slot beside it — and the
 * defect the 2026-09-10 revision found was exactly that: fifteen rows whose terms were
 * the e-filing form's questions rather than the court's names for the facts. Declaring
 * the vocabulary makes "is this a real attribute?" a question a test can ask
 * (`case-review.test.ts`), and it is why no term string lives in the screen.
 *
 * Sources are in the brief's §5a Attributes table, one row per term.
 */
export const FACT_TERMS = {
  /* Litigants — `Complainant` / `Accused` in `lib/filing/types.ts`. */
  mobile: "Mobile",
  email: "Email",
  age: "Age",
  permanentAddress: "Permanent address",
  currentAddress: "Current address",
  powerOfAttorney: "Power of attorney",
  authorisedSignatory: "Authorised signatory",
  registeredOffice: "Registered office",

  /* The cheque — `ChequeDetails` and `Jurisdiction`. */
  amount: "Amount",
  chequeDated: "Cheque dated",
  payeeBank: "Payee bank",
  payeeBranch: "Payee branch",
  payeeIfsc: "Payee IFSC",
  payerBank: "Payer bank",
  payerBranch: "Payer branch",
  payerIfsc: "Payer IFSC",
  depositedOn: "Deposited on",
  returnedOn: "Returned on",
  returnReason: "Return reason",
  payeePolice: "Police station — payee bank",
  drawerPolice: "Police station — drawer bank",
  depositedInTime: "Deposited within three months",

  /* The debt behind it — `DemandNotice`. */
  natureOfDebt: "Nature of the debt",
  paymentAgainstCheque: "Payment against the cheque",
  partAmount: "Part payment amount",
  whyIssued: "Why the cheque was issued",

  /* The demand notice — `DemandNotice` and `Jurisdiction.causeDate`. */
  noticeDispatched: "Notice dispatched",
  noticeServed: "Notice served",
  replyReceived: "Reply received",
  noticePeriodEnded: "Notice period ended",

  /* The delay, when there is one — `Jurisdiction`, §142(b). The group only exists on a
     file that was late, so *whether* it was late is answered by the heading; the row
     that restated it went on 2026-09-11 with the other constants. */
  daysBeyondMonth: "Days beyond the month",
  grounds: "Grounds",

  /* Additional details — `Witness`, `AdrPrayer`, `Advocate`. No `Prayer`: the relief
     §138 allows is the statute's and reads the same on every complaint, which is the
     class `Criminal` and `S.138` were already cut for (brief §5a.4b). */
  speaksTo: "Speaks to",
  otherDetails: "Other details",
  barRegistration: "Bar registration",

  /* What was paid to file — `SignState`. */
  courtFeePaid: "Court fee paid",
  receiptNumber: "Receipt number",
} as const;

export type CaseFactTerm = (typeof FACT_TERMS)[keyof typeof FACT_TERMS];

/**
 * The four cells above the file — Court · Amount · Submitted · Waiting.
 *
 * A second, smaller vocabulary rather than four more `FACT_TERMS`, because three of
 * these are not attributes of the complaint at all: Court, Submitted and Waiting say
 * where this complaint sits and how long it has sat, which is the *page's* context. Only
 * `Amount` is a row of the file, and it deliberately reads the same word here as it does
 * there — one attribute, one name, two places (brief D18).
 *
 * Declared for the same reason `FACT_TERMS` is: a term typed into the screen is a term
 * that can be invented, and `case-review.test.ts` checks both vocabularies the same way.
 */
export const CASE_HEADER_TERMS = {
  court: "Court",
  amount: FACT_TERMS.amount,
  submitted: "Submitted",
  waiting: "Waiting",
} as const;

export type CaseHeaderTerm =
  (typeof CASE_HEADER_TERMS)[keyof typeof CASE_HEADER_TERMS];

/**
 * One term and its value.
 *
 * `value` is absent when the complaint carries nothing there. The screen says so in
 * words rather than leaving the line blank — a form field the litigant left empty is a
 * fact the court is reading, and an empty cell reads as a broken row.
 */
export type CaseFact = {
  term: CaseFactTerm;
  value?: string;
  /** A number, an amount or a date — set in a column of its own kind. */
  numeric?: boolean;
  /**
   * This value is the exception, and the exception has a consequence for the decision
   * the reader is about to take.
   *
   * Marked here rather than styled at the call site, for the reason no term string lives
   * in the screen: which answer is the exception is a property of the fact, not of the
   * render. Today exactly one row can carry it — a cheque presented outside §138(a)'s
   * three months is one no complaint under the section can stand on — and the screen
   * spends its single coloured mark on it (`ui-craft` §1.4). The words already say "No";
   * the ink is the second treatment, not the only one.
   */
  exception?: boolean;
};

/**
 * What kind of page this is.
 *
 * It decides the facsimile the screen draws — a cheque does not look like a letter,
 * and a receipt does not look like either. Six shapes cover a §138 file, and none of
 * them is a picture of a *specific* document: the drawing says "a page of this kind
 * is on the file", never what the page says. Legible facsimile text would be
 * fabricating a record, which is the one thing a demo of a court file must not do.
 */
export type CaseDocumentKind =
  /** A typed page — the complaint, a notice, an affidavit, an application. */
  | "letter"
  /** The dishonoured cheque itself: landscape, with a signature and a MICR band. */
  | "cheque"
  /** A bank slip — the return memo, a deposit counterfoil. */
  | "memo"
  /** A receipt or a ledger extract: label-and-amount rows under a rule. */
  | "receipt"
  /** A card scan — an ID proof, a Bar ID card. */
  | "id"
  /** A court form with a ruled table — a vakalatnama, a registration paper. */
  | "form";

/**
 * A document the form asked for, and whether it arrived.
 *
 * `absent` is not an error. Several slots on a §138 e-filing are conditional — there is
 * no proof of reply when no reply came — so the screen shows the slot and says it is
 * empty rather than hiding the question the form asked.
 *
 * **There is no filename, page count or size here** (brief §5a.6). `StoredFileRef`
 * holds a name and a size on the *filer's* side; nothing on the court side holds any of
 * the three, and nothing anywhere holds a page count. All three were fixtures wearing a
 * field's clothes, which is worse than no field: they invite a reader to trust them and
 * a builder to keep them. What the file holds is the court's label for the slot and
 * whether something is in it.
 */
export type CaseDocument = {
  label: string;
  state: "filed" | "absent";
  kind: CaseDocumentKind;
};

/**
 * One of several like records inside a group — a party, a cheque, an advocate.
 *
 * Numbered by the screen, not here: the number is the record's position in the group as
 * rendered, which is what the reference's "1." is, and storing it would let the two
 * disagree.
 */
export type CaseRecord = {
  id: string;
  heading: string;
  /**
   * What kind of litigant this record is — `Complainant.type` / `Accused.type`, which
   * the registry holds as the closed enum `LITIGANT_TYPES` renders.
   *
   * Optional because not every record is a litigant: an advocate's used to read "For
   * the complainant" on every advocate of every complaint, which is constant by
   * construction — this file only ever lists the complainant's counsel, and before
   * summons there is nobody else to have any. A tag identical on every record is the
   * same defect as a constant fact (brief §5a.4b), so it went on 2026-09-11.
   */
  tag?: string;
  facts: CaseFact[];
  documents?: CaseDocument[];
};

/**
 * Why a head of the file is empty.
 *
 * A closed reason rather than three authored sentences. "No witness added", "No
 * advocate on record — the complainant appears in person" and "Nothing on record — the
 * accused has not been summoned yet" were three shapes for one state, written at three
 * call sites, and the clause after the dash was a *consequence* fused into the absence
 * string — so nothing could sort, count or translate an empty head, and a fourth empty
 * head would have needed a fourth sentence.
 *
 * The reason is the machine-readable half and the screen renders it through one slot;
 * `explanation` is the product's voice and stays copy (`ui-craft` §1.6), carried beside
 * the reason instead of inside it.
 *
 * Two reasons, not three, since 2026-09-11: `not-yet-due` existed only for the section
 * on submissions from the accused, and that section is gone (owner — the accused cannot
 * file before the complaint is registered, so the head read the same absence on every
 * file forever). A reason with no head left to describe is a name the next reader cannot
 * tell is dead, so it goes with the section rather than waiting for one.
 */
export type CaseAbsence = {
  reason: "none-named" | "none-on-record";
  /** What follows from the absence, when anything does. Product copy, not a fact. */
  explanation?: string;
};

/**
 * Every head the file has, as a closed set.
 *
 * Closed because a check's finding deep-links to the head where it is stated
 * (`CaseCheck.link`), and a link to a head that does not exist is a dead control on the
 * one screen that must not have one. A string would have made that a runtime surprise;
 * this makes it a compile error, and `case-review.test.ts` proves every link resolves
 * against a real file.
 */
export type CaseGroupId =
  | "cheque"
  | "debt"
  | "demand-notice"
  | "delay-condonation"
  | "complainant"
  | "accused"
  | "witnesses"
  | "complaint"
  | "advocates"
  | "payment";

/** One block of the file — Cheque details, Advocate details, Witness details. */
export type CaseGroup = {
  id: CaseGroupId;
  title: string;
  icon: LucideIcon;
  records?: CaseRecord[];
  facts?: CaseFact[];
  documents?: CaseDocument[];
  /** Nothing at all was filed under this head. The group still renders and says so. */
  empty?: CaseAbsence;
};

/** A numbered part of the file, and the head of an entry in the reading index. */
export type CaseSection = {
  id: string;
  title: string;
  groups: CaseGroup[];
};

/**
 * The second line of a timeline step, and what kind of thing it is.
 *
 * One `detail: string` used to hold three: a formatted day on the past steps, a spoken
 * duration on the wait, and the name of a state on the decision nobody has made. A slot
 * carrying three kinds of thing is the defect the reply row was already fixed for —
 * nothing can put a `<time>` around the day, nothing can recount the wait in another
 * language, and the module that formats them is the one furthest from the render. The
 * kind is named here and the screen branches on it.
 */
export type CaseTimelineDetail =
  /** The day the step happened, as an ISO day. */
  | { kind: "date"; on: string }
  /** How long the complaint has been in this step, in whole days. */
  | { kind: "elapsed"; days: number }
  /** A step that has not happened, named by the state it is in. */
  | { kind: "state"; state: string };

export type CaseTimelineStep = {
  label: string;
  detail: CaseTimelineDetail;
  status: "past" | "current" | "future";
};

/**
 * A complaint's whole file, as this screen reads it.
 *
 * No `category` and no `type`: "Criminal" and "S.138, Negotiable Instruments Act, 1881"
 * are identical on every complaint DRISTI will ever hold, and `FilingDraft.caseType`
 * being the one-value union `"s138"` is the proof rather than an opinion. A column
 * whose value never varies is the constant-column defect already killed on the queues
 * (brief §5a.4b).
 */
export type CaseReview = {
  id: string;
  caseNumber: string;
  /** The cause — "Rajan Krishnan v. Quilon Cashew Exports". */
  title: string;
  daysSinceSubmitted: number;
  submittedOn: string;
  /**
   * The same day, written out. Carried beside the ISO form because both are needed:
   * the machine-readable day is what a `<time>` wants, and every other date in the
   * file is already formatted here, so the screen does not end up formatting one of
   * them itself in a different register.
   */
  submittedOnLabel: string;
  court: string;
  /**
   * The cheque amount, formatted — the fourth header cell (brief D18).
   *
   * The same attribute the cheque group states as a row, carried here so the header does
   * not have to go looking for a fact inside a section. **Not a second value:** the row
   * and the cell are formatted by one call and read the same word, which is what makes
   * `Amount` one name in both vocabularies rather than two facts that agree today.
   */
  amount: string;
  sections: CaseSection[];
  timeline: CaseTimelineStep[];
};

/** How much of the file is behind the way in — the counts beside that one control. */
export type CaseFileCounts = {
  /** Entered values: every fact row on the file. */
  values: number;
  /** Every document slot the form asked for, filled or empty. */
  documents: number;
};

/**
 * What "Open the full file" is opening, counted.
 *
 * Both numbers are real and both are derived from the file itself rather than typed, for
 * the reason the whole §5a census exists: a count a reader can check is a count that has
 * to be right, and a plausible one beside a control is the fixture-wearing-a-field's-
 * clothes defect one level up.
 */
export function caseFileCounts(review: CaseReview): CaseFileCounts {
  const groups = review.sections.flatMap((section) => section.groups);
  const blocks = groups.flatMap((group) => [
    { facts: group.facts, documents: group.documents },
    ...(group.records ?? []),
  ]);
  return {
    values: blocks.reduce((total, block) => total + (block.facts?.length ?? 0), 0),
    documents: blocks.reduce(
      (total, block) => total + (block.documents?.length ?? 0),
      0,
    ),
  };
}

/**
 * Why a bank sent a cheque back, in the phrase a return memo carries.
 *
 * One register, not two. The second — the same fact inside a sworn sentence — existed
 * only to feed a tinted alert that restated the row above it, and both went in the
 * 2026-09-10 revision (brief §5a.10). `ChequeDetails.returnReason` is a string in the
 * registry, machine-prefilled from the memo; whether it is really a closed list is
 * §12.7, open.
 */
const RETURN_REASONS = {
  "insufficient-funds": "Funds insufficient",
  "payment-stopped": "Payment stopped by drawer",
  "account-closed": "Account closed",
} as const;

export type ReturnReasonId = keyof typeof RETURN_REASONS;

/**
 * What kind of litigant a party is — `Complainant.type` and `Accused.type`, both the
 * closed enum `"individual" | "institution"`.
 *
 * The tag beside a party's name used to be the string "Individual" typed on every
 * complainant and "Company" typed on every accused, which made the slot decoration: a
 * label that never differs tells a reader nothing, and it cannot be filtered or counted.
 * It is the enum now, and at least one complaint in the queue is filed by an entity.
 */
const LITIGANT_TYPES = {
  individual: "Individual",
  institution: "Company",
} as const;

type LitigantType = keyof typeof LITIGANT_TYPES;

/**
 * Whether the cheque reached the bank inside the three months §138(a) allows.
 *
 * Derived from the two dates the same record already prints — the date on the cheque
 * and the day it was deposited — rather than declared. It used to read "Confirmed by
 * the complainant" on all thirty-five complaints, which is a declaration the e-filing
 * cannot be submitted without; a value identical on every file is not a fact, and on a
 * screen where the reader is deciding whether to take cognizance this is the row with a
 * consequence attached to it.
 */
const DEPOSIT_LIMIT = {
  "within-limit": "Yes",
  "outside-limit": "No",
} as const;

type DepositLimit = keyof typeof DEPOSIT_LIMIT;

/**
 * What a witness is offered to speak to — `Witness.prove`.
 *
 * A real field, and the four things a §138 witness is actually called for. Every
 * witness on every complaint used to be offered for the transaction, which made the row
 * a caption on the group rather than an attribute of the person.
 */
const WITNESS_PROVES = [
  "The transaction the cheque was issued for",
  "The signature on the cheque",
  "Service of the demand notice",
  "The dishonour of the cheque",
] as const;

/**
 * `AdrPrayer.otherDetails` — the filer's own words in the form's catch-all slot.
 *
 * Most complaints leave it empty and the row says so, which is why the slot stays on
 * the page. A few say something, and the same closed list `CONDONATION_GROUNDS` is:
 * fixed sentences a filer chose, not prose this module composes about the case.
 */
const OTHER_DETAILS = [
  "The complainant is willing to receive the amount in instalments if the accused offers.",
  "The accused issued cheques to other traders in Kollam which were returned in the same week.",
  "The parties are known to each other and the complainant would accept a settlement before trial.",
  "The complainant asks that the matter be heard early, the business being a small one.",
] as const;

/**
 * The states a derivation cannot decide, named for the rows that carry them.
 *
 * Every complaint in the queue went through the same form, so the *shape* of its file
 * is the same and its particulars can be derived. What differs is what the filer
 * actually did: whether the cheque was returned for want of funds or a stopped
 * payment, whether the complaint was late enough to need the delay condoned, whether a
 * witness was named, whether every slot was filled. Those are named here so each is
 * reachable from a real row, and so the screen's empty and partial states can be seen
 * without editing code.
 *
 * **Every mark lands in a field the registry holds** (brief §5a.8). `returnReason` →
 * `ChequeDetails.returnReason`; `delayed` → `Jurisdiction.causeDate` / `filingDate`;
 * `missing` → `IntakeSlot.file === null`; `witnesses` → the length of `Witness[]`;
 * `replied` → `DemandNotice.replied`; `partPayment` → `DemandNotice.paymentStatus`.
 * The mark this replaces, `partialLiability`, pointed at nothing — there is no
 * full-or-part-liability field anywhere — and `accusedSubmissions` is gone with the
 * section-4 fiction it invented.
 *
 * A row with no entry gets `DEFAULT_MARKS` — a complete file, returned for insufficient
 * funds, filed in time, one witness.
 */
type CaseFileMarks = {
  /** Why the bank sent the cheque back. */
  returnReason: ReturnReasonId;
  /** Filed outside the month, so the file carries an application to condone it. */
  delayed: boolean;
  /** Someone the complainant says can speak to the transaction. */
  witnesses: number;
  /** The drawer paid part of the cheque amount after the notice. */
  partPayment: boolean;
  /** Slots the filer left empty, by document label. */
  missing: string[];
  /** A reply to the demand notice came back. */
  replied: boolean;
  /** `Complainant.type` — an entity complains as often as a person does. */
  complainantType: LitigantType;
  /** `Complainant.poa` — the complaint is filed through a power-of-attorney holder. */
  poa: boolean;
  /**
   * The cheque was presented outside §138(a)'s three months, so the deposit row answers
   * no. The chain is pushed, not the row: the dates and the answer have to agree, which
   * is the whole point of deriving the answer from them.
   */
  depositedLate: boolean;
  /** `AdrPrayer.otherDetails` — the filer wrote something in the catch-all slot. */
  otherDetails: boolean;
};

const DEFAULT_MARKS: CaseFileMarks = {
  returnReason: "insufficient-funds",
  delayed: false,
  witnesses: 1,
  partPayment: false,
  missing: [],
  replied: false,
  complainantType: "individual",
  poa: false,
  depositedLate: false,
  otherDetails: false,
};

const CASE_FILE_MARKS: Record<string, Partial<CaseFileMarks>> = {
  /* The longest wait in the queue, and the fullest file: late enough to need the delay
     condoned, a reply on record, and two witnesses. */
  "r-1840": { delayed: true, replied: true, witnesses: 2 },
  /* Payment stopped rather than funds short — the other limb of §138, and a different
     reason for the same return. */
  "r-1722": { returnReason: "payment-stopped" },
  /* Part of the cheque amount was paid after the notice, so the balance is what is
     claimed — `DemandNotice.paymentStatus: "part"`. */
  "r-1654": { partPayment: true, witnesses: 0 },
  /* Delayed, and the delay-condonation application itself is not on record — the
     partial file the screen has to survive. */
  "r-1588": { delayed: true, missing: ["delay-application"] },
  /* No vakalat on the queue row either: a complaint in person, no witness named, and
     the accused's own ID proof never uploaded. */
  "r-1490": { witnesses: 0, missing: ["accused-id-proof"], otherDetails: true },
  /* The account itself had been closed by the time the cheque was presented. */
  "r-1402": { returnReason: "account-closed", replied: true },
  /* Presented outside the three months §138(a) allows — the one file where the deposit
     row answers no, and the answer bears on whether the court can take cognizance at
     all. Nothing else is marked here, so the row is read on its own. */
  "r-1333": { depositedLate: true },
  /* Two witnesses and a long wait — the file that used to carry an invented letter
     from the accused. Nothing in the product records one before summons, so the mark
     and its section-4 fact went (brief §5a.9a). The complaint is filed through a
     power-of-attorney holder, which is what `Complainant.poa` records. */
  "r-1104": { witnesses: 2, poa: true, otherDetails: true },
  /* The one complaint filed by an entity rather than a person — `Complainant.type:
     "institution"`, which is why the record carries a signatory and a registered office
     where an individual carries an age and two addresses. Its accused is the queue's
     other limited company, so the matter is a trade one on both sides. */
  "r-612": { complainantType: "institution" },
  /* A second part payment and a second power of attorney: one file carrying a state is
     a fixture, two is a field. */
  "r-330": { partPayment: true, poa: true },
};

function marksFor(id: string): CaseFileMarks {
  return { ...DEFAULT_MARKS, ...CASE_FILE_MARKS[id] };
}

/* ── Derivation ─────────────────────────────────────────────────────────────────
   Everything below turns a queue row into particulars. It is demo data and says so
   in the module docstring; what matters is that it is *stable* (the same row always
   yields the same file) and *coherent* (the dates make a §138 chain, the amounts
   agree with each other). Nothing is random. */

/** The `CMP/1840/2025` serial — the one number a row already carries. */
function serialOf(caseNumber: string): number {
  const digits = caseNumber.match(/\d+/);
  return digits ? Number(digits[0]) : 0;
}

/** A stable choice from a list. */
function pick<T>(list: readonly T[], seed: number): T {
  return list[seed % list.length];
}

/**
 * A stable number of exactly `count` digits, never starting with a zero.
 *
 * Every caller passes its own `salt`, and that is the point: with one multiplier a
 * complaint's cheque number came out inside its complainant's mobile number, and
 * "Cheque no. 270960" sitting beside "+91 9740 270960" is the kind of thing that
 * tells a reader the whole file is made up.
 *
 * `count` is in the mix for the same reason, added 2026-09-11. Salting alone left two
 * lengths of the same salt sharing every digit but the leading ones — a nine-digit line
 * and a six-digit code taken modulo different powers of ten are the same number
 * truncated — so a payee IFSC ended in the last six digits of the complainant's mobile
 * on every complaint in the queue. Mixing the length in means a six-digit draw is not a
 * window onto a nine-digit one.
 *
 * **The multiplier has to outrun the modulus** — the third correction, 2026-09-11, and
 * the one that was visible without reading any code. A `CMP` serial is at most four
 * digits, so `(seed + …) * 7919` came out around ten million; taken modulo the 900
 * million a nine-digit draw needs, the remainder *was* the product, and every nine-digit
 * number in the queue therefore began 10… or 11…. Every mobile on the court side read
 * `+91 91…`. `2654435761` is Knuth's 32-bit multiplier and `>>> 0` takes the low 32 bits
 * (4.29 billion), which covers the widest modulus here with room to spare — one change
 * for every length, rather than a special case for nine digits.
 */
function numberOf(seed: number, salt: number, count: number): number {
  const low = 10 ** (count - 1);
  const mixed =
    ((seed + salt * 31 + count * 7) * 2654435761 + salt * 104729) >>> 0;
  return low + (mixed % (10 ** count - low));
}

/** `YYYY-MM-DD`, moved by whole days. */
function shiftDay(day: string, delta: number): string {
  const date = parseIsoDay(day);
  date.setDate(date.getDate() + delta);
  return isoDay(date);
}

const BANKS = [
  { name: "State Bank of India", ifsc: "SBIN" },
  { name: "Federal Bank", ifsc: "FDRL" },
  { name: "South Indian Bank", ifsc: "SIBL" },
  { name: "Canara Bank", ifsc: "CNRB" },
  { name: "Kerala Gramin Bank", ifsc: "KLGB" },
] as const;

/** Kollam localities, taken from the parties the court-side fixtures already name. */
const LOCALITIES = [
  "Kadappakada",
  "Thevally",
  "Chinnakada",
  "Mundakkal",
  "Vadakkevila",
  "Eravipuram",
  "Kilikolloor",
  "Polayathode",
  "Kavanad",
  "Asramam",
] as const;

const PIN_CODES = ["691001", "691008", "691009", "691010", "691020"] as const;

const POLICE_STATIONS = [
  "Kollam East",
  "Kollam West",
  "Chinnakada",
  "Kottiyam",
  "Chavara",
] as const;

/**
 * What the cheque was given for, and why it was issued.
 *
 * Both are closed lists in the registry rather than free text — `NATURE_OF_DEBT` and
 * `WHY_ISSUED` in `lib/filing/options.ts` — so the values here are that vocabulary
 * rather than sentences composed for a case. Restated rather than imported: the court
 * side does not read from the advocate's areas (`content.ts`), and two labels drifting
 * apart is a smaller failure than a dependency in the wrong direction.
 */
const NATURE_OF_DEBT = [
  "Loan / advance repayment",
  "Payment for goods supplied",
  "Payment for services rendered",
  "Business / trade transaction",
  "Repayment of borrowed money",
] as const;

const WHY_ISSUED = [
  "Towards repayment of a loan",
  "Towards payment for goods",
  "Towards payment for services",
  "As security, subsequently enforced",
  "Discharge of an existing debt",
] as const;

/** Who signed a company's cheque. Kollam given names, like the parties around them. */
const SIGNATORIES = [
  "K. Ravindran",
  "Suresh Babu",
  "P. Vijayan",
  "Anil Kumar",
  "M. Salim",
  "Jayaprakash T.",
  "T. Mohanan",
] as const;

const WITNESS_NAMES = [
  "Sudhakaran Nair",
  "Beena Thomas",
  "Nazeer Ahmed",
  "Sarala Devi",
] as const;

/** `DemandNotice.paymentStatus`, in the two labels the filing form offers. */
const PAYMENT_STATUS = {
  none: "No payment made",
  part: "Part payment made",
} as const;

/**
 * Why a late complaint says it was late — `Jurisdiction.condonationReason`.
 *
 * The filer's own words in a fixed slot, which is what that field holds. It replaces
 * two sentences this module used to compose from whether the application had been
 * uploaded: a machine result written as prose needs new prose for every new outcome,
 * and a file whose grounds read as generated is a file a clerk stops trusting. When the
 * application is not on record the row carries no value at all and the screen says so —
 * the grounds live *in* the application, and citing one that never arrived is the
 * contradiction this row was fixed for once already.
 */
const CONDONATION_GROUNDS = [
  "The complainant was under treatment through the period and could not instruct counsel.",
  "The papers were with a previous advocate and were returned only after the month had run.",
  "The complainant was away from Kollam on work and returned after the period expired.",
  "The parties were in settlement talks, which failed only after the month had run.",
] as const;

/** A bank account, the way a cheque names one. */
function bankFor(seed: number, salt: number) {
  const bank = pick(BANKS, seed + salt);
  const branch = pick(LOCALITIES, seed + salt);
  return {
    name: bank.name,
    branch,
    /* An IFSC is four letters, a zero, then six characters. Salted so the payee's and
       the payer's differ from each other, and so neither comes out as the case
       number with a prefix on it. */
    ifsc: `${bank.ifsc}0${numberOf(seed, salt, 6)}`,
  };
}

function addressFor(seed: number): string {
  const door = 8 + (seed % 240);
  return `${door}, ${pick(LOCALITIES, seed)}, Kollam – ${pick(PIN_CODES, seed)}`;
}

/** Ten digits behind a `+91`, grouped five and five, the way one is written here. */
function mobileFor(seed: number, salt: number): string {
  const line = `9${numberOf(seed, salt, 9)}`;
  return `+91 ${line.slice(0, 5)} ${line.slice(5)}`;
}

function emailFor(name: string): string {
  const handle = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
  return `${handle}@example.in`;
}

/**
 * The §138 chain, worked backwards from the day the complaint was submitted.
 *
 * Every step is the one the Act fixes, so the file a clerk reads is one a clerk could
 * check: the cheque is deposited inside three months of its date, the notice goes out
 * inside thirty days of the return, the cause of action accrues fifteen days after the
 * notice is served, and the complaint follows inside a month of that — unless the file
 * carries an application to condone the delay, in which case it deliberately does not.
 *
 * `depositedLate` is the other deliberate exception, and it is the graver one: a cheque
 * presented outside §138(a)'s three months is one no complaint under the section can be
 * built on. One complaint in the queue is in that state so the deposit row has
 * something to answer, and the dates say so as loudly as the row does.
 */
function chainFor(
  submittedOn: string,
  seed: number,
  delayed: boolean,
  depositedLate: boolean,
): CaseChain {
  /* A complaint in time is filed inside the month; a delayed one is filed past it, by
     enough that the application on the file has something to explain. */
  const sinceAccrual = delayed ? 44 + (seed % 90) : 4 + (seed % 24);
  const accruedOn = shiftDay(submittedOn, -sinceAccrual);
  const noticeServedOn = shiftDay(accruedOn, -PAYMENT_WINDOW_DAYS);
  const noticeSentOn = shiftDay(noticeServedOn, -(2 + (seed % 4)));
  /* Inside §138(b)'s thirty days from the return, and inside §138(a)'s three months
     from the date of the cheque — the two windows a file has to sit in to be one the
     court can act on at all. The moduli are sized to stay clear of both. */
  const returnedOn = shiftDay(noticeSentOn, -(3 + (seed % 22)));
  const depositedOn = shiftDay(returnedOn, -(1 + (seed % 3)));
  /* Inside the three months, or past them by enough that no rounding hides it. */
  const chequeOn = shiftDay(
    depositedOn,
    depositedLate ? -(95 + (seed % 20)) : -(6 + (seed % 70)),
  );
  const repliedOn = shiftDay(noticeServedOn, 5 + (seed % 9));
  return {
    submittedOn,
    chequeOn,
    depositedOn,
    returnedOn,
    noticeSentOn,
    noticeServedOn,
    accruedOn,
    repliedOn,
    /**
     * Days between the cause of action and the complaint. Returned rather than
     * recomputed by the caller because the delay-condonation group needs the part of
     * it that runs past the month, and deriving that from two formatted dates would be
     * the same arithmetic done twice.
     */
    sinceAccrual,
  };
}

/** The month §142(b) allows for filing, counted from the cause of action. */
export const FILING_WINDOW_DAYS = 30;

/** The three months §138(a) allows between the date of a cheque and its presentation. */
export const PRESENTATION_WINDOW_DAYS = 90;

/** The thirty days §138(b) allows between the return of a cheque and the notice. */
export const NOTICE_WINDOW_DAYS = 30;

/** The fifteen days §138(c) allows the drawer to pay before the offence is complete. */
export const PAYMENT_WINDOW_DAYS = 15;

/**
 * The §138 dates behind one complaint, as days rather than as the sentences the screen
 * prints.
 *
 * Exported because this chain is the one thing in this module that can be *wrong*
 * rather than merely made up. The rest is invented and says so; a deposit made outside
 * three months of the cheque, or a notice sent outside thirty days of the return, would
 * be a file no court could act on and a demo that teaches the reader the wrong law.
 * That is a claim worth a test rather than a comment — see `case-review.test.ts`.
 */
export function caseChainFor(id: string, today: string): CaseChain | undefined {
  const complaint = registerCaseById(id);
  if (!complaint) return undefined;
  const marks = marksFor(complaint.id);
  const submittedOn = shiftDay(today, -complaint.daysSinceSubmitted);
  return chainFor(
    submittedOn,
    serialOf(complaint.caseNumber),
    marks.delayed,
    marks.depositedLate,
  );
}

/** Every step of the chain, oldest first, plus the gap the delay turns on. */
export type CaseChain = {
  chequeOn: string;
  depositedOn: string;
  returnedOn: string;
  noticeSentOn: string;
  noticeServedOn: string;
  accruedOn: string;
  /** When a reply came, whether or not one did — the file says which. */
  repliedOn: string;
  submittedOn: string;
  /** Days between the cause of action accruing and the complaint being filed. */
  sinceAccrual: number;
};

/** Whole days between two `YYYY-MM-DD` days. */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (parseIsoDay(to).getTime() - parseIsoDay(from).getTime()) / 86400000,
  );
}

/** A rupee amount that reads like a cheque — round to the nearest hundred. */
function chequeAmountFor(seed: number): number {
  return Math.round((45000 + ((seed * 4637) % 1850000)) / 100) * 100;
}

/**
 * What was already paid, on a file that carries a part payment —
 * `DemandNotice.partAmount`, so it is less than the cheque it is paid against.
 *
 * A function rather than a line inside the debt group, because check 7 states the same
 * number on the glance and the two must be the same number.
 */
function partAmountFor(amount: number): number {
  return Math.round((amount * 0.35) / 100) * 100;
}

/* ── The file ───────────────────────────────────────────────────────────────────── */

/**
 * Every document slot the §138 form asks for, declared once.
 *
 * The key is separate from the label because two heads ask for the same thing: both
 * parties file an ID proof, so a `missing` list holding labels would empty both slots
 * when only one of them is empty — and naming the slot "ID proof of the accused" to
 * keep them apart put the group's own title back inside every row of it.
 *
 * Declared as a map rather than passed inline at each call site because check 5
 * (`requiredDocumentsCheck`) has to answer *which* slots are empty from
 * `CaseFileMarks.missing`, which holds keys and nothing else. Resolving a key to its
 * label and to the head it was filed under is then a lookup rather than a second table
 * that could disagree with the first — the defect the term vocabulary was declared for,
 * one level down. `head` is asserted against the group's own title in
 * `case-review.test.ts`, so the two cannot drift.
 */
const CASE_SLOTS = {
  "complainant-id-proof": {
    label: "ID proof",
    kind: "id",
    group: "complainant",
    head: "Complainant details",
  },
  "s225-affidavit": {
    label: "Affidavit u/s 225 BNSS",
    kind: "letter",
    group: "complainant",
    head: "Complainant details",
  },
  "accused-id-proof": {
    label: "ID proof",
    kind: "id",
    group: "accused",
    head: "Accused details",
  },
  "company-documents": {
    label: "Company documents",
    kind: "form",
    group: "accused",
    head: "Accused details",
  },
  "dishonoured-cheque": {
    label: "Dishonoured cheque",
    kind: "cheque",
    group: "cheque",
    head: "Cheque details",
  },
  "deposit-proof": {
    label: "Proof of deposit",
    kind: "memo",
    group: "cheque",
    head: "Cheque details",
  },
  "return-memo": {
    label: "Cheque return memo",
    kind: "memo",
    group: "cheque",
    head: "Cheque details",
  },
  "debt-proof": {
    label: "Proof of the debt or liability",
    kind: "receipt",
    group: "debt",
    head: "Debt or liability details",
  },
  "demand-notice": {
    label: "Legal demand notice",
    kind: "letter",
    group: "demand-notice",
    head: "Legal demand notice",
  },
  "dispatch-proof": {
    label: "Proof of dispatch",
    kind: "memo",
    group: "demand-notice",
    head: "Legal demand notice",
  },
  "service-proof": {
    label: "Proof of service",
    kind: "memo",
    group: "demand-notice",
    head: "Legal demand notice",
  },
  "notice-reply": {
    label: "Reply to the notice",
    kind: "letter",
    group: "demand-notice",
    head: "Legal demand notice",
  },
  "delay-application": {
    label: "Delay condonation application",
    kind: "letter",
    group: "delay-condonation",
    head: "Delay condonation application",
  },
  complaint: {
    label: "Complaint",
    kind: "letter",
    group: "complaint",
    head: "Complaint",
  },
  "s223-affidavit": {
    label: "Affidavit u/s 223 BNSS",
    kind: "letter",
    group: "complaint",
    head: "Complaint",
  },
  "payment-receipt": {
    label: "Payment receipt",
    kind: "receipt",
    group: "payment",
    head: "Payment receipt",
  },
} as const satisfies Record<
  string,
  { label: string; kind: CaseDocumentKind; group: string; head: string }
>;

export type CaseSlotKey = keyof typeof CASE_SLOTS;

/**
 * The two slots an advocate's own record carries, one set per advocate.
 *
 * Kept apart from `CASE_SLOTS` because their keys are per-record
 * (`advocate-2-vakalatnama`) and a map cannot hold a key that depends on how many
 * advocates are on record. `REG-14` collects a photograph of the **Bar ID card**, which
 * is what the file holds; it was labelled "ID proof", a document `REG-13` records is not
 * collected at advocate registration at all.
 */
const ADVOCATE_SLOTS = {
  "bar-id-card": { label: "Bar ID card", kind: "id" },
  vakalatnama: { label: "Vakalatnama", kind: "form" },
} as const satisfies Record<string, { label: string; kind: CaseDocumentKind }>;

type AdvocateSlotKey = keyof typeof ADVOCATE_SLOTS;

/** `filed`, unless this file is one of the ones with that slot left empty. */
function slot(key: CaseSlotKey, missing: string[]): CaseDocument {
  const spec = CASE_SLOTS[key];
  return {
    label: spec.label,
    kind: spec.kind,
    state: missing.includes(key) ? "absent" : "filed",
  };
}

function advocateSlotKey(index: number, which: AdvocateSlotKey): string {
  return `advocate-${index}-${which}`;
}

function advocateSlot(
  index: number,
  which: AdvocateSlotKey,
  missing: string[],
): CaseDocument {
  const spec = ADVOCATE_SLOTS[which];
  return {
    label: spec.label,
    kind: spec.kind,
    state: missing.includes(advocateSlotKey(index, which)) ? "absent" : "filed",
  };
}

/**
 * The complaint's file, or nothing.
 *
 * `today` is a parameter rather than read here, for the reason `caseHistory` takes one:
 * the day belongs to the reader's clock, the screen gets it from `useCourtToday`, and a
 * module that asked for itself would render one day on the server and another in the
 * browser.
 */
export function caseReviewFor(
  id: string,
  today: string,
): CaseReview | undefined {
  const complaint = registerCaseById(id);
  if (!complaint) return undefined;

  const seed = serialOf(complaint.caseNumber);
  const marks = marksFor(complaint.id);
  const submittedOn = shiftDay(today, -complaint.daysSinceSubmitted);
  const chain = chainFor(submittedOn, seed, marks.delayed, marks.depositedLate);
  const amount = chequeAmountFor(seed);

  return {
    id: complaint.id,
    caseNumber: complaint.caseNumber,
    title: causeTitle(complaint),
    daysSinceSubmitted: complaint.daysSinceSubmitted,
    submittedOn,
    submittedOnLabel: formatCaseDate(submittedOn),
    court: CURRENT_STAFF.court,
    amount: formatChequeAmount(amount),
    /* **The order is the statute's, not the form's** (brief D4). The cheque and the
       notice come first because that is where the offence is: the section order used to
       be the e-filing form's own, so a reader deciding whether to take cognizance met
       ten rows of contact details before the instrument the complaint is about. The
       advocate's filing side still reads the same complaint in the filing order — a
       real divergence, logged in the brief's §11, accepted because the two readers ask
       different questions. */
    sections: [
      caseSpecificSection(seed, marks, chain, amount),
      litigantSection(complaint, seed, marks),
      additionalSection(complaint, seed, marks),
      paymentSection(seed, marks),
    ],
    timeline: timelineFor(complaint, submittedOn, marks),
  };
}

/** 1 — who is on each side, and how the court reaches them. */
function litigantSection(
  complaint: RegisterCase,
  seed: number,
  marks: CaseFileMarks,
): CaseSection {
  const complainant = complaint.parties.complainant;
  const accused = complaint.parties.accused;
  const entity = marks.complainantType === "institution";

  return {
    id: "litigants",
    title: "Litigant details",
    groups: [
      {
        id: "complainant",
        title: "Complainant details",
        icon: UsersRoundIcon,
        records: [
          {
            id: "complainant-1",
            heading: complainant,
            tag: LITIGANT_TYPES[marks.complainantType],
            facts: [
              /* An entity complains through the person who signs for it and is reached
                 at a registered office; a person has an age and two addresses. Same
                 shape the accused record already uses for the same reason, and the
                 reason the tag beside the name is worth printing. */
              ...(entity
                ? [
                    {
                      term: FACT_TERMS.authorisedSignatory,
                      value: pick(SIGNATORIES, seed + 4),
                    },
                  ]
                : []),
              {
                term: FACT_TERMS.mobile,
                value: mobileFor(seed, 1),
                numeric: true,
              },
              { term: FACT_TERMS.email, value: emailFor(complainant) },
              ...(entity
                ? [
                    {
                      term: FACT_TERMS.registeredOffice,
                      value: addressFor(seed + 7),
                    },
                  ]
                : [
                    {
                      term: FACT_TERMS.age,
                      value: String(28 + (seed % 38)),
                      numeric: true,
                    },
                    {
                      term: FACT_TERMS.permanentAddress,
                      value: addressFor(seed),
                    },
                    /* `Complainant.res`, which the form collects when `permSame ===
                       "no"`. Salted away from the permanent address: the two rows used
                       to print the same string under two labels, which reads as a
                       rendering bug rather than as two answers that happened to
                       agree. */
                    {
                      term: FACT_TERMS.currentAddress,
                      value: addressFor(seed + 3),
                    },
                  ]),
              /* `Complainant.poa` is a `YesNo`, and it is the complainant's alone — the
                 row read "No" on every complaint until 2026-09-11, when the mark that
                 lands in that field arrived. Who the holder is belongs to
                 `poaHolder`, which this screen does not yet have a slot for. */
              {
                term: FACT_TERMS.powerOfAttorney,
                value: marks.poa ? "Yes" : "No",
              },
            ],
            documents: [
              slot("complainant-id-proof", marks.missing),
              slot("s225-affidavit", marks.missing),
            ],
          },
        ],
      },
      {
        id: "accused",
        title: "Accused details",
        icon: UsersRoundIcon,
        records: [
          {
            id: "accused-1",
            heading: accused,
            /* `Accused.type`, from the same enum the complainant's tag comes from.
               Every accused in this queue is a trading name — the queue's own data, not
               a decision taken here — and under S-141 a company's cheque is signed by
               somebody who answers for it, which is the row below. */
            tag: LITIGANT_TYPES.institution,
            facts: [
              {
                term: FACT_TERMS.authorisedSignatory,
                value: pick(SIGNATORIES, seed),
              },
              {
                term: FACT_TERMS.mobile,
                value: mobileFor(seed, 2),
                numeric: true,
              },
              /* The one address slot an accused has. `poa` exists on `Complainant`
                 only, which is why the accused's power-of-attorney row went. */
              { term: FACT_TERMS.email },
              { term: FACT_TERMS.registeredOffice, value: addressFor(seed + 5) },
            ],
            documents: [
              slot("accused-id-proof", marks.missing),
              slot("company-documents", marks.missing),
            ],
          },
        ],
      },
    ],
  };
}

/** 2 — the cheque, the debt behind it, the notice, and any delay. */
function caseSpecificSection(
  seed: number,
  marks: CaseFileMarks,
  chain: ReturnType<typeof chainFor>,
  amount: number,
): CaseSection {
  const payee = bankFor(seed, 1);
  const payer = bankFor(seed, 2);
  /* Hoisted: the cheque's number heads its record, and nothing else may disagree
     with it. */
  const chequeNumber = numberOf(seed, 3, 6);
  const partAmount = partAmountFor(amount);
  /* Read off the chain rather than off the mark, so the row and the two dates it sits
     under can never disagree. */
  const depositLimit: DepositLimit =
    daysBetween(chain.chequeOn, chain.depositedOn) <= PRESENTATION_WINDOW_DAYS
      ? "within-limit"
      : "outside-limit";

  const groups: CaseGroup[] = [
    {
      id: "cheque",
      title: "Cheque details",
      icon: BanknoteIcon,
      records: [
        {
          id: "cheque-1",
          heading: `Cheque no. ${chequeNumber}`,
          facts: [
            {
              term: FACT_TERMS.amount,
              value: formatChequeAmount(amount),
              numeric: true,
            },
            {
              term: FACT_TERMS.chequeDated,
              value: formatCaseDate(chain.chequeOn),
              numeric: true,
            },
            { term: FACT_TERMS.payeeBank, value: payee.name },
            { term: FACT_TERMS.payeeBranch, value: payee.branch },
            { term: FACT_TERMS.payeeIfsc, value: payee.ifsc, numeric: true },
            { term: FACT_TERMS.payerBank, value: payer.name },
            { term: FACT_TERMS.payerBranch, value: payer.branch },
            { term: FACT_TERMS.payerIfsc, value: payer.ifsc, numeric: true },
            {
              term: FACT_TERMS.depositedOn,
              value: formatCaseDate(chain.depositedOn),
              numeric: true,
            },
            {
              term: FACT_TERMS.returnedOn,
              value: formatCaseDate(chain.returnedOn),
              numeric: true,
            },
            {
              term: FACT_TERMS.returnReason,
              value: RETURN_REASONS[marks.returnReason],
            },
            /* Two police stations, because the registry holds two: §138 jurisdiction
               turns on where the payee's bank sits, and the drawer's bank is the other
               end of the same question. One unqualified row used to stand for both. */
            {
              term: FACT_TERMS.payeePolice,
              value: `${pick(POLICE_STATIONS, seed)} police station`,
            },
            {
              term: FACT_TERMS.drawerPolice,
              value: `${pick(POLICE_STATIONS, seed + 2)} police station`,
            },
            /* §138(a), answered rather than declared. It used to read "Confirmed by the
               complainant" on every complaint — the filer's own tick, which the e-filing
               cannot be submitted without, so it was a constant wearing a fact's
               clothes. The court's question is whether the two dates above are less than
               three months apart, and that is a check, not a declaration. */
            {
              term: FACT_TERMS.depositedInTime,
              value: DEPOSIT_LIMIT[depositLimit],
              /* The one row on this file with a cognizance consequence attached to its
                 answer, and only when the answer is no. */
              exception: depositLimit === "outside-limit",
            },
          ],
          documents: [
            slot("dishonoured-cheque", marks.missing),
            slot("deposit-proof", marks.missing),
            slot("return-memo", marks.missing),
          ],
        },
      ],
    },
    {
      id: "debt",
      title: "Debt or liability details",
      icon: ReceiptIndianRupeeIcon,
      facts: [
        { term: FACT_TERMS.natureOfDebt, value: pick(NATURE_OF_DEBT, seed) },
        {
          term: FACT_TERMS.paymentAgainstCheque,
          value: marks.partPayment ? PAYMENT_STATUS.part : PAYMENT_STATUS.none,
        },
        ...(marks.partPayment
          ? [
              {
                term: FACT_TERMS.partAmount,
                value: formatChequeAmount(partAmount),
                numeric: true,
              },
            ]
          : []),
        { term: FACT_TERMS.whyIssued, value: pick(WHY_ISSUED, seed) },
      ],
      documents: [
        slot("debt-proof", marks.missing),
      ],
    },
    {
      id: "demand-notice",
      title: "Legal demand notice",
      icon: ScrollTextIcon,
      facts: [
        {
          term: FACT_TERMS.noticeDispatched,
          value: formatCaseDate(chain.noticeSentOn),
          numeric: true,
        },
        {
          term: FACT_TERMS.noticeServed,
          value: formatCaseDate(chain.noticeServedOn),
          numeric: true,
        },
        /* `DemandNotice.replied` is a `YesNo`, so this row is one. It used to hold a
           date on a file that had a reply and the sentence "No reply received" on one
           that did not — one slot carrying two kinds of thing, which nothing can sort,
           filter or translate. The date the reply came is not a field the registry
           holds at all. */
        {
          term: FACT_TERMS.replyReceived,
          value: marks.replied ? "Yes" : "No",
        },
        {
          term: FACT_TERMS.noticePeriodEnded,
          value: formatCaseDate(chain.accruedOn),
          numeric: true,
        },
      ],
      documents: [
        slot("demand-notice", marks.missing),
        slot("dispatch-proof", marks.missing),
        slot("service-proof", marks.missing),
        /* No reply, no proof of one. The slot stays on the page because the form
           asked for it, and its emptiness is the same fact the row above states. */
        marks.replied
          ? slot("notice-reply", marks.missing)
          : {
              label: "Reply to the notice",
              state: "absent" as const,
              kind: "letter" as const,
            },
      ],
    },
  ];

  /* An application to condone the delay is only on a file that needs one. A complaint
     filed inside the month has nothing to condone, and a group asking whether it was
     late would answer its own question. */
  if (marks.delayed) {
    const applicationFiled = !marks.missing.includes("delay-application");
    groups.push({
      id: "delay-condonation",
      title: "Delay condonation application",
      icon: ScaleIcon,
      facts: [
        /* No "Filed within one month: No". The group is on the file only because the
           complaint was late, so the heading has already answered it and the row was
           the same word twice (2026-09-11). What the court needs is by how much. */
        {
          term: FACT_TERMS.daysBeyondMonth,
          value: String(Math.max(0, chain.sinceAccrual - FILING_WINDOW_DAYS)),
          numeric: true,
        },
        /* The grounds live *in* the application, so a file that never carried one has
           nothing to state here and says so. Citing a document that is not on the file
           is the contradiction this row was fixed for on 2026-09-09; what changed on
           2026-09-10 is that the absence is now the empty slot the screen already
           renders in words, rather than a second composed sentence. */
        {
          term: FACT_TERMS.grounds,
          value: applicationFiled
            ? pick(CONDONATION_GROUNDS, seed)
            : undefined,
        },
      ],
      documents: [
        slot("delay-application", marks.missing),
      ],
    });
  }

  /* "Case specific details" was the e-filing form's label for its own second step, and
     §5a.4a's rule — a term is the attribute's name, not the form's question — applies to
     a heading with more force because it is bigger. The id stays `case-specific`: it is
     a scroll anchor and a test fixture, not a thing a reader sees. **Brief D4 proposes
     this rename; the owner has not ruled on it.** */
  return { id: "case-specific", title: "The cheque and the notice", groups };
}

/** 3 — witnesses, the complaint itself, and who appears. */
function additionalSection(
  complaint: RegisterCase,
  seed: number,
  marks: CaseFileMarks,
): CaseSection {
  const complainantCounsel = counselFor(complaint, "complainant");

  return {
    id: "additional",
    title: "Additional details",
    groups: [
      {
        id: "witnesses",
        title: "Witness details",
        icon: UserRoundCheckIcon,
        /* "Named", not "added": a complainant names a witness in the complaint, and
           "added" is the form's word for what the filer did to a list. */
        empty:
          marks.witnesses === 0
            ? { reason: "none-named" as const }
            : undefined,
        records: Array.from({ length: marks.witnesses }, (_, index) => ({
          id: `witness-${index + 1}`,
          heading: pick(WITNESS_NAMES, seed + index),
          facts: [
            {
              term: FACT_TERMS.speaksTo,
              value: pick(WITNESS_PROVES, seed + index * 3),
            },
            {
              term: FACT_TERMS.mobile,
              value: mobileFor(seed, 40 + index),
              numeric: true,
            },
          ],
        })),
      },
      {
        id: "complaint",
        title: "Complaint",
        icon: FileTextIcon,
        /* No synopsis. The two versions this group used to carry were composed from
           whether a reply had come back — a machine result written as prose, so a third
           outcome would have needed a third paragraph, and nothing could sort, filter
           or translate it. What the complaint says is in the complaint, which is on the
           file below. */
        /* No prayer either, since 2026-09-11: the relief §138 allows is the statute's —
           trial, punishment, compensation — so the row read the same sentence on all
           thirty-five complaints, which is what `Criminal` and `S.138` were cut for. */
        facts: [
          {
            term: FACT_TERMS.otherDetails,
            value: marks.otherDetails
              ? pick(OTHER_DETAILS, seed)
              : undefined,
          },
        ],
        documents: [
          slot("complaint", marks.missing),
          slot("s223-affidavit", marks.missing),
        ],
      },
      {
        id: "advocates",
        title: "Advocate details",
        icon: ScaleIcon,
        /* The clause is the *consequence* of the absence, not part of it: a complaint
           with no vakalat is one the complainant conducts in person, which is a thing
           the court needs told and is product copy rather than a field. It used to be
           fused into the empty string with a dash. */
        empty:
          complainantCounsel.length === 0
            ? {
                reason: "none-on-record" as const,
                explanation: "The complainant appears in person.",
              }
            : undefined,
        records: complainantCounsel.map((counsel, index) => ({
          id: `advocate-${index + 1}`,
          heading: counsel.name,
          /* No tag. Every advocate this file lists is `counselFor(…, "complainant")`,
             so "For the complainant" was the same words under every name — and before
             summons the accused has no counsel for it to be distinguished from. */
          facts: [
            {
              term: FACT_TERMS.barRegistration,
              value: `KER/${1000 + ((seed + index * 37) % 8000)}/20${10 + ((seed + index) % 15)}`,
              numeric: true,
            },
          ],
          documents: [
            /* `REG-14` collects a photograph of the **Bar ID card**, and that is what
               the file holds. It was labelled "ID proof", which is a document
               `REG-13` / handover §5.2 record is *not* collected at advocate
               registration at all. Keyed per record: three advocates means three
               vakalatnamas, and a shared key would empty all of them together. */
            advocateSlot(index + 1, "bar-id-card", marks.missing),
            advocateSlot(index + 1, "vakalatnama", marks.missing),
          ],
        })),
      },
    ],
  };
}

/** 4 — what was paid to file. */
function paymentSection(seed: number, marks: CaseFileMarks): CaseSection {
  return {
    id: "payment",
    title: "Payment details",
    groups: [
      {
        id: "payment",
        title: "Payment receipt",
        icon: ReceiptIndianRupeeIcon,
        facts: [
          {
            term: FACT_TERMS.courtFeePaid,
            value: formatChequeAmount(200 + (seed % 8) * 25),
            numeric: true,
          },
          {
            term: FACT_TERMS.receiptNumber,
            value: `KL-CF-${String(seed).padStart(6, "0")}`,
            numeric: true,
          },
        ],
        documents: [
          slot("payment-receipt", marks.missing),
        ],
      },
    ],
  };
}

/**
 * Where the complaint has got to — six steps, each one an event the product records.
 *
 * Trimmed on 2026-09-10 to what can be traced (brief §5a.9). *Placed before the
 * magistrate* and *Letter from the accused received* are gone: neither appears anywhere
 * in `docs/product/`, the Kerala spine runs filing → scrutiny → **cognizance** with no
 * placement step between, and nothing records a filing from an accused who has not been
 * summoned. Every step below names its source on the line above it.
 *
 * How much of the path has happened is derived from the wait, the same way the file's
 * dates are: a complaint submitted yesterday has not been through scrutiny; one that
 * has sat for months has. Nothing here is a live system event, and two of the steps
 * name spine events no store holds today — flagged in §11 of the brief.
 *
 * Oldest first, like the case history on a listing's overview: two orderings for the
 * same kind of column on the same side of the app is how two screens start disagreeing
 * about which end is the present.
 */
function timelineFor(
  complaint: RegisterCase,
  submittedOn: string,
  marks: CaseFileMarks,
): CaseTimelineStep[] {
  const wait = complaint.daysSinceSubmitted;
  const steps: CaseTimelineStep[] = [
    /* `FilingDraft.status: "filed"` + `submittedAt`; spine step 1. */
    pastStep("Complaint submitted", submittedOn),
    /* `SignState.paid` / `paidAt` / `paidAmount`; spine step 1, court fee on filing. */
    pastStep("Court fee received", submittedOn),
  ];

  /* `Jurisdiction.condonationReason` + the application's own `IntakeSlot` — and only
     when the application is actually on the file. A delayed complaint whose application
     was never uploaded already says so in the delay-condonation group; claiming it was
     filed here would contradict that row. */
  if (marks.delayed && !marks.missing.includes("delay-application")) {
    steps.push(pastStep("Delay condonation application filed", submittedOn));
  }

  /* Spine step 2 — "Scrutiny & defect check (Registry; before numbering / cognizance)".
     No store holds the event today. Offsets stay strictly inside the wait, so no dummy
     event lands on today or after it. */
  if (wait >= 3) {
    steps.push(
      pastStep("Taken up for scrutiny", shiftDay(submittedOn, Math.min(2, wait - 1))),
    );
  }

  /* Spine step 2, the other end of it — likewise unbacked by any store today. */
  if (wait >= 7) {
    steps.push(
      pastStep("Scrutiny completed", shiftDay(submittedOn, Math.min(5, wait - 1))),
    );
  }

  /* Derived from `daysSinceSubmitted` — the queue's own current state. */
  steps.push({
    label: "Waiting to be registered",
    detail: { kind: "elapsed", days: wait },
    status: "current",
  });
  /* The act this build does not perform (brief §5.7, §12.4). */
  steps.push({
    label: "Registration decision",
    detail: { kind: "state", state: "Not made" },
    status: "future",
  });
  return steps;
}

function pastStep(label: string, on: string): CaseTimelineStep {
  return { label, detail: { kind: "date", on }, status: "past" };
}

/* ── The checks ─────────────────────────────────────────────────────────────────────
 *
 * **NO CHECK READS A DOCUMENT, AND NONE EVER MAY.** Every one of the seven below
 * compares entered values with other entered values — two dates against a statutory
 * window, a slot against whether anything is in it, a count against zero. Not one of
 * them opens, parses or looks inside a filed page, and there is no document store on the
 * court side that would let it. The glance says so out loud, in a caption under the
 * ledger line — *"Checks compare entered values with each other. No document was read."*
 * — and that caption is the only thing that makes the ledger honest: a forged cheque, a
 * wrong date typed consistently across two fields, or a photograph of the wrong page
 * passes all seven. If a future check wants to read a page, it is a different kind of
 * thing and it needs its own words on the screen before it needs code here.
 *
 * They exist because a magistrate glances (brief §1, D13): what he needs from this
 * screen is not a surface to check the file on, it is a statement of what has already
 * been checked and what could not be. Seven of his questions are decidable by machine
 * today over fields the registry already holds, and this is those seven — no eighth.
 * Specifically **not** the cheque's return reason (§138 requires insufficiency of funds
 * or an amount exceeding the arrangement; the registry holds a `string`, brief §12.7)
 * and **not** jurisdiction (§142(2) turns on where the payee's bank sits, and nothing in
 * the product maps a branch to a court). Inventing either would be the machine asserting
 * law it cannot compute.
 *
 * Every function here is pure and takes exactly the fields it compares, so each can be
 * fired in a test without a file around it — which is how `case-review-checks.test.ts`
 * proves a check fires on the complaint it should and on no other.
 */

/** How much a finding weighs. Two values, derived, never authored — and never a third. */
export type CaseCheckClass =
  /** A statutory or completeness failure. Takes `warning-ink` on the screen. */
  | "flag"
  /**
   * A lawful condition with a consequence for the reading or for the act. Plain ink,
   * never inked as a defect: appearing in person is not a defect, and the magistrate
   * still has to know it, because it is the send-back's missing recipient (brief §12.12).
   */
  | "note";

/** The seven, by name. Closed, so a screen cannot render a finding this file cannot make. */
export type CaseCheckId =
  | "presentation-window"
  | "notice-window"
  | "premature-filing"
  | "filing-window"
  | "required-documents"
  | "advocate-on-record"
  | "part-payment";

/** How many run. Every complaint, every time — it is what the ledger's first line counts. */
export const CASE_CHECK_COUNT = 7;

/**
 * One entered value a check compared.
 *
 * The term comes from one of the two declared vocabularies and never from a call site,
 * for the reason no term string lives in the screen: a finding that named a field the
 * file does not have would be the machine inventing an attribute at the exact moment a
 * reader is deciding whether to trust it.
 */
export type CaseCheckValue = {
  term: CaseFactTerm | CaseHeaderTerm;
  value: string;
  numeric?: boolean;
};

/** A document that would settle a finding — or the slot whose emptiness *is* one. */
export type CaseCheckDocument = {
  /** The slot's key, which is what a deep link carries. */
  key: string;
  label: string;
  kind: CaseDocumentKind;
  state: "filed" | "absent";
  /** The head it was filed under, and where the full file states it. */
  group: CaseGroupId;
  head: string;
};

/** Where in the full file a finding is stated. */
export type CaseCheckLink = {
  group: CaseGroupId;
  /** The document to open in the file view's pane on arrival, when there is one. */
  doc?: string;
};

/**
 * One finding.
 *
 * Nothing richer: no severity ladder, no "cleared" state, no assignee. Each of those is
 * scrutiny tooling, and this screen is explicitly not the scrutiny workbench (brief §4).
 */
export type CaseCheck = {
  id: CaseCheckId;
  class: CaseCheckClass;
  /** The finding in words — the row's own text, and never colour alone. */
  finding: string;
  /** The entered values the check read. The detail shows these and nothing else. */
  values: CaseCheckValue[];
  /** The documents that would settle it, filed or absent. */
  documents: CaseCheckDocument[];
  link: CaseCheckLink;
};

/** What a slot key names, for the checks and for a deep link arriving at the file. */
export function caseSlotFor(key: string):
  | { label: string; kind: CaseDocumentKind; group: CaseGroupId; head: string }
  | undefined {
  if (key in CASE_SLOTS) {
    return CASE_SLOTS[key as CaseSlotKey];
  }
  /* An advocate's own slots are keyed per record, so they cannot sit in the map. */
  const advocate = /^advocate-\d+-(bar-id-card|vakalatnama)$/.exec(key);
  if (!advocate) return undefined;
  const spec = ADVOCATE_SLOTS[advocate[1] as AdvocateSlotKey];
  return { ...spec, group: "advocates", head: "Advocate details" };
}

/** The slot as a check states it: the key, the label, and whether anything is in it. */
function checkDocument(key: string, missing: string[]): CaseCheckDocument {
  const spec = caseSlotFor(key);
  /* Unreachable: every caller passes a key this module declared. Answered rather than
     thrown, because a missing document is never worth failing a magistrate's screen. */
  if (!spec) {
    return {
      key,
      label: key,
      kind: "letter",
      state: "absent",
      group: "complaint",
      head: "Complaint",
    };
  }
  return { key, ...spec, state: missing.includes(key) ? "absent" : "filed" };
}

/**
 * 1 · Was the cheque deposited within three months of its date? — §138(a), `flag`.
 *
 * The one check the file already surfaced, as row 14 of the cheque group
 * (`FACT_TERMS.depositedInTime`). Fires on `r-1333`.
 */
export function presentationWindowCheck(
  chain: Pick<CaseChain, "chequeOn" | "depositedOn">,
  missing: string[],
): CaseCheck | undefined {
  const days = daysBetween(chain.chequeOn, chain.depositedOn);
  if (days <= PRESENTATION_WINDOW_DAYS) return undefined;
  return {
    id: "presentation-window",
    class: "flag",
    finding: `Cheque deposited ${days} days after its date — outside the three months §138(a) allows.`,
    values: [
      {
        term: FACT_TERMS.chequeDated,
        value: formatCaseDate(chain.chequeOn),
        numeric: true,
      },
      {
        term: FACT_TERMS.depositedOn,
        value: formatCaseDate(chain.depositedOn),
        numeric: true,
      },
    ],
    documents: [
      checkDocument("dishonoured-cheque", missing),
      checkDocument("deposit-proof", missing),
    ],
    link: { group: "cheque", doc: "dishonoured-cheque" },
  };
}

/**
 * 2 · Was the notice sent within thirty days of the return? — §138(b), `flag`.
 *
 * Fires on nothing in the demo data, because `chainFor` builds every complaint inside
 * the window. **The fixtures must not be bent to demonstrate it** (brief D15): the
 * chain's integrity is what makes all thirty-five files legally coherent, and a real
 * registry is not a generated chain.
 */
export function noticeWindowCheck(
  chain: Pick<CaseChain, "returnedOn" | "noticeSentOn">,
  missing: string[],
): CaseCheck | undefined {
  const days = daysBetween(chain.returnedOn, chain.noticeSentOn);
  if (days <= NOTICE_WINDOW_DAYS) return undefined;
  return {
    id: "notice-window",
    class: "flag",
    finding: `Notice sent ${days} days after the cheque was returned — outside the thirty days §138(b) allows.`,
    values: [
      {
        term: FACT_TERMS.returnedOn,
        value: formatCaseDate(chain.returnedOn),
        numeric: true,
      },
      {
        term: FACT_TERMS.noticeDispatched,
        value: formatCaseDate(chain.noticeSentOn),
        numeric: true,
      },
    ],
    documents: [
      checkDocument("return-memo", missing),
      checkDocument("dispatch-proof", missing),
    ],
    link: { group: "demand-notice", doc: "dispatch-proof" },
  };
}

/**
 * 3 · Was the complaint filed after the fifteen days ran? — §138(c), `flag`.
 *
 * The offence is not complete until the drawer has had fifteen days from service, so a
 * complaint filed on or before the day the notice period ends is not maintainable. Fires
 * on nothing in the demo data, for the same reason as check 2 and with the same refusal
 * to bend a fixture.
 *
 * No day count in the words. The gap can be zero — filed on the very day the period
 * ended, which is still premature — and "filed 0 days early" is a sentence that reads as
 * a bug. The two dates are in the detail, where the reader can see the gap themselves.
 */
export function prematureFilingCheck(
  chain: Pick<CaseChain, "noticeServedOn" | "accruedOn" | "submittedOn">,
  missing: string[],
): CaseCheck | undefined {
  if (daysBetween(chain.accruedOn, chain.submittedOn) > 0) return undefined;
  return {
    id: "premature-filing",
    class: "flag",
    finding:
      "Complaint filed on or before the day the notice period ended — the fifteen days §138(c) allows the drawer had not run.",
    values: [
      {
        term: FACT_TERMS.noticeServed,
        value: formatCaseDate(chain.noticeServedOn),
        numeric: true,
      },
      {
        term: FACT_TERMS.noticePeriodEnded,
        value: formatCaseDate(chain.accruedOn),
        numeric: true,
      },
      {
        term: CASE_HEADER_TERMS.submitted,
        value: formatCaseDate(chain.submittedOn),
        numeric: true,
      },
    ],
    documents: [checkDocument("service-proof", missing)],
    link: { group: "demand-notice", doc: "service-proof" },
  };
}

/**
 * 4 · Was it filed within the month, or is an application to condone on the file? —
 * §142(b), `flag`. Fires on `r-1588`.
 *
 * Two ways to pass, and the second is why this is one check rather than two rows: a
 * complaint filed late *with* an application to condone the delay is a complaint the
 * court can act on, and flagging it would be flagging the norm for every delayed filing
 * in the queue.
 */
export function filingWindowCheck(
  chain: Pick<CaseChain, "accruedOn" | "submittedOn" | "sinceAccrual">,
  applicationOnFile: boolean,
  missing: string[],
): CaseCheck | undefined {
  if (chain.sinceAccrual <= FILING_WINDOW_DAYS) return undefined;
  if (applicationOnFile) return undefined;
  const beyond = chain.sinceAccrual - FILING_WINDOW_DAYS;
  return {
    id: "filing-window",
    class: "flag",
    finding: `Filed ${beyond} days beyond the month §142(b) allows, with no application to condone the delay on the file.`,
    values: [
      {
        term: FACT_TERMS.noticePeriodEnded,
        value: formatCaseDate(chain.accruedOn),
        numeric: true,
      },
      {
        term: CASE_HEADER_TERMS.submitted,
        value: formatCaseDate(chain.submittedOn),
        numeric: true,
      },
      {
        term: FACT_TERMS.daysBeyondMonth,
        value: String(beyond),
        numeric: true,
      },
    ],
    documents: [checkDocument("delay-application", missing)],
    link: { group: "delay-condonation" },
  };
}

/**
 * 5 · Is every document the form required on the file? — `flag`. Fires on `r-1490`.
 *
 * The interim rule is `IntakeSlot.file === null` over the slots the form required, which
 * is exactly what `CaseFileMarks.missing` records. The conditional slots are excluded by
 * construction rather than by a list: the reply slot on a complaint with no reply is
 * empty *correctly* and never enters `missing`, and a real list of mandatory slots from
 * product replaces this rule (brief §12.16).
 *
 * The row states the count and the detail names the slots, because the count is what a
 * glance needs and the names are what a decision needs.
 */
export function requiredDocumentsCheck(
  absent: CaseCheckDocument[],
): CaseCheck | undefined {
  if (absent.length === 0) return undefined;
  return {
    id: "required-documents",
    class: "flag",
    finding:
      absent.length === 1
        ? "1 document the form required is not on file."
        : `${absent.length} documents the form required are not on file.`,
    values: [],
    documents: absent,
    link: { group: absent[0].group },
  };
}

/**
 * 6 · Is an advocate on record? — `note`. Fires on `r-1490`.
 *
 * A **note**, never a flag. A complaint in person is lawful and inking it as a defect
 * would be the screen telling a magistrate that a citizen conducting their own matter is
 * something wrong with the file. He still has to be told, because it is the send-back's
 * missing recipient — brief §12.12, undesigned and open.
 */
export function advocateOnRecordCheck(counsel: number): CaseCheck | undefined {
  if (counsel > 0) return undefined;
  return {
    id: "advocate-on-record",
    class: "note",
    finding: "No advocate on record — the complainant appears in person.",
    values: [],
    documents: [],
    link: { group: "advocates" },
  };
}

/**
 * 7 · Has anything been paid against the cheque? — `note`. Fires on `r-330`, `r-1654`.
 *
 * `DemandNotice.paymentStatus === "part"`. Lawful, and it changes what is at stake: the
 * balance is what the complaint is really about. A note, not a flag.
 */
export function partPaymentCheck(
  partPayment: boolean,
  amount: number,
  partAmount: number,
): CaseCheck | undefined {
  if (!partPayment) return undefined;
  return {
    id: "part-payment",
    class: "note",
    finding: `Part payment of ${formatChequeAmount(partAmount)} was made against the cheque — ${formatChequeAmount(amount - partAmount)} remains.`,
    values: [
      { term: FACT_TERMS.amount, value: formatChequeAmount(amount), numeric: true },
      {
        term: FACT_TERMS.partAmount,
        value: formatChequeAmount(partAmount),
        numeric: true,
      },
    ],
    documents: [],
    link: { group: "debt" },
  };
}

/**
 * What the seven found on one complaint, in the order the ledger prints them.
 *
 * **Flags in statutory order, then notes** — deterministic, so two magistrates reading
 * the same complaint see the same list in the same order.
 *
 * **No check says the same thing twice.** When the absent document *is* the
 * delay-condonation application, check 4 names it and check 5 does not count it again:
 * one fact with two treatments inside one region is the defect this brief caught four
 * times over.
 */
export function caseChecksFor(
  id: string,
  today: string,
): CaseCheck[] | undefined {
  const complaint = registerCaseById(id);
  if (!complaint) return undefined;

  const seed = serialOf(complaint.caseNumber);
  const marks = marksFor(complaint.id);
  const submittedOn = shiftDay(today, -complaint.daysSinceSubmitted);
  const chain = chainFor(submittedOn, seed, marks.delayed, marks.depositedLate);
  const amount = chequeAmountFor(seed);
  const partAmount = partAmountFor(amount);
  const applicationOnFile =
    marks.delayed && !marks.missing.includes("delay-application");

  const filingWindow = filingWindowCheck(
    chain,
    applicationOnFile,
    marks.missing,
  );

  const absent = marks.missing
    /* Check 4 has already named the application; counting it here would put one
       absence on the ledger twice, under two headings, in two inks. */
    .filter((key) => !(filingWindow && key === "delay-application"))
    .map((key) => checkDocument(key, marks.missing));

  return [
    presentationWindowCheck(chain, marks.missing),
    noticeWindowCheck(chain, marks.missing),
    prematureFilingCheck(chain, marks.missing),
    filingWindow,
    requiredDocumentsCheck(absent),
    advocateOnRecordCheck(counselFor(complaint, "complainant").length),
    partPaymentCheck(marks.partPayment, amount, partAmount),
  ].filter((check): check is CaseCheck => check !== undefined);
}

/**
 * A deep link from a finding into the full file.
 *
 * Built here rather than at the call site because two screens follow these links — the
 * glance's finding rows and its document rows — and a route spelled twice is a route
 * that eventually disagrees with itself. The hash is the head the finding is stated
 * under, which is what the file view's groups anchor; `doc` is the slot the pane opens
 * on arrival, and it is the one time a starting point is asserted by the reader rather
 * than by the screen.
 */
export function caseFileHref(id: string, link?: CaseCheckLink): string {
  const base = `/employee/register-cases/${id}/file`;
  if (!link) return base;
  const query = link.doc ? `?doc=${encodeURIComponent(link.doc)}` : "";
  return `${base}${query}#${caseGroupAnchor(link.group)}`;
}

/** The id a group carries on the full file, and what a deep link's hash names. */
export function caseGroupAnchor(group: CaseGroupId): string {
  return `case-group-${group}`;
}

/**
 * "281 days so far" — the wait, spoken, for the one place it is not a column.
 *
 * The eyebrow's "281 days waiting" is *not* here any more. It was a fourth
 * `formatDaysWaiting` in `lib/employee/`, and — the part that made it a defect rather
 * than a duplication — it returned a different string under a name two sibling modules
 * already export ("281" on both queues). `register-advocates.ts` already spells this
 * one `formatDaysWaitingSpoken` and returns the identical words, so the screen calls
 * that. The three surviving `formatDaysWaiting` exports still disagree with each other
 * across `register-cases.ts` and `register-advocates.ts`; consolidating them is a
 * separate pass and is noted rather than done here.
 */
export function formatDaysWaitingLong(days: number): string {
  return days === 1 ? "1 day so far" : `${days} days so far`;
}

/** How the review screen names a complaint's one state. Every row here is in it. */
export const CASE_REVIEW_STATUS = "Waiting to be registered";
