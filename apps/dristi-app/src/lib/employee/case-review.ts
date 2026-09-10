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

/** One block of the file — Cheque details, Advocate details, Witness details. */
export type CaseGroup = {
  id: string;
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
  sections: CaseSection[];
  timeline: CaseTimelineStep[];
};

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

/* ── The file ───────────────────────────────────────────────────────────────────── */

/**
 * `filed`, unless this file is one of the ones with that slot left empty.
 *
 * The key is separate from the label because two heads ask for the same thing: both
 * parties file an ID proof, so a `missing` list holding labels would empty both slots
 * when only one of them is empty — and naming the slot "ID proof of the accused" to
 * keep them apart put the group's own title back inside every row of it.
 */
function slot(
  spec: { key: string; label: string; kind: CaseDocumentKind },
  missing: string[],
): CaseDocument {
  return {
    label: spec.label,
    kind: spec.kind,
    state: missing.includes(spec.key) ? "absent" : "filed",
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
    sections: [
      litigantSection(complaint, seed, marks),
      caseSpecificSection(seed, marks, chain, amount),
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
              slot(
                {
                  key: "complainant-id-proof",
                  label: "ID proof",
                  kind: "id",
                },
                marks.missing,
              ),
              slot(
                {
                  key: "s225-affidavit",
                  label: "Affidavit u/s 225 BNSS",
                  kind: "letter",
                },
                marks.missing,
              ),
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
              slot(
                { key: "accused-id-proof", label: "ID proof", kind: "id" },
                marks.missing,
              ),
              slot(
                {
                  key: "company-documents",
                  label: "Company documents",
                  kind: "form",
                },
                marks.missing,
              ),
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
  /* What was already paid comes off the claim — `DemandNotice.partAmount`, so it is
     less than the cheque it is paid against. */
  const partAmount = Math.round((amount * 0.35) / 100) * 100;
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
            slot(
              {
                key: "dishonoured-cheque",
                label: "Dishonoured cheque",
                kind: "cheque",
              },
              marks.missing,
            ),
            slot(
              { key: "deposit-proof", label: "Proof of deposit", kind: "memo" },
              marks.missing,
            ),
            slot(
              { key: "return-memo", label: "Cheque return memo", kind: "memo" },
              marks.missing,
            ),
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
        slot(
          {
            key: "debt-proof",
            label: "Proof of the debt or liability",
            kind: "receipt",
          },
          marks.missing,
        ),
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
        slot(
          {
            key: "demand-notice",
            label: "Legal demand notice",
            kind: "letter",
          },
          marks.missing,
        ),
        slot(
          { key: "dispatch-proof", label: "Proof of dispatch", kind: "memo" },
          marks.missing,
        ),
        slot(
          { key: "service-proof", label: "Proof of service", kind: "memo" },
          marks.missing,
        ),
        /* No reply, no proof of one. The slot stays on the page because the form
           asked for it, and its emptiness is the same fact the row above states. */
        marks.replied
          ? slot(
              {
                key: "notice-reply",
                label: "Reply to the notice",
                kind: "letter",
              },
              marks.missing,
            )
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
        slot(
          {
            key: "delay-application",
            label: "Delay condonation application",
            kind: "letter",
          },
          marks.missing,
        ),
      ],
    });
  }

  return { id: "case-specific", title: "Case specific details", groups };
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
          slot(
            { key: "complaint", label: "Complaint", kind: "letter" },
            marks.missing,
          ),
          slot(
            {
              key: "s223-affidavit",
              label: "Affidavit u/s 223 BNSS",
              kind: "letter",
            },
            marks.missing,
          ),
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
               registration at all. */
            slot(
              {
                key: `advocate-${index + 1}-bar-id-card`,
                label: "Bar ID card",
                kind: "id",
              },
              marks.missing,
            ),
            slot(
              {
                key: `advocate-${index + 1}-vakalatnama`,
                label: "Vakalatnama",
                kind: "form",
              },
              marks.missing,
            ),
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
          slot(
            { key: "payment-receipt", label: "Payment receipt", kind: "receipt" },
            marks.missing,
          ),
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
