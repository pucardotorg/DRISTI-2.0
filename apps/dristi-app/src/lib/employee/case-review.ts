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
 * One term and its value.
 *
 * `value` is absent when the complaint carries nothing there. The screen says so in
 * words rather than leaving the line blank — a form field the litigant left empty is a
 * fact the court is reading, and an empty cell reads as a broken row.
 */
export type CaseFact = {
  term: string;
  value?: string;
  /** A number, an amount or a date — set in a column of its own kind. */
  numeric?: boolean;
};

/**
 * What kind of page this is.
 *
 * It decides the thumbnail the screen draws — a cheque does not look like a letter,
 * and a receipt does not look like either. Six shapes cover a §138 file, and none of
 * them is a picture of a *specific* document: the thumbnail says "a page of this kind
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
  /** A card scan — an ID proof. */
  | "id"
  /** A court form with a ruled table — a vakalatnama, a registration paper. */
  | "form";

/** How the registry lists an upload. */
export type CaseDocumentFile = {
  name: string;
  pages: number;
  /** Already formatted. These are fixtures, not bytes counted off a disk. */
  size: string;
};

/**
 * A document the form asked for, and whether it arrived.
 *
 * `absent` is not an error. Several slots on a §138 e-filing are conditional — there is
 * no proof of reply when no reply came — so the screen shows the slot and says it is
 * empty rather than hiding the question the form asked. An absent slot carries no
 * `file`, which is what makes the two states impossible to render the same way.
 */
export type CaseDocument = {
  label: string;
  state: "filed" | "absent";
  kind: CaseDocumentKind;
  file?: CaseDocumentFile;
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
  /** What kind of party or record this is — "Individual", "Company". */
  tag?: string;
  facts: CaseFact[];
  documents?: CaseDocument[];
  /** What the filer has sworn to about this record, in their own words' effect. */
  confirmed?: string[];
};

/** One block of the file — Cheque details, Advocate details, Witness details. */
export type CaseGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  records?: CaseRecord[];
  facts?: CaseFact[];
  documents?: CaseDocument[];
  confirmed?: string[];
  /** Nothing at all was filed under this head. The group still renders and says so. */
  empty?: string;
};

/** A numbered part of the file, and the head of an entry in the reading index. */
export type CaseSection = {
  id: string;
  title: string;
  groups: CaseGroup[];
};

export type CaseTimelineStep = {
  label: string;
  detail: string;
  status: "past" | "current" | "future";
  /** ISO day when the step has one — current wait and the unmade decision do not. */
  on?: string;
};

/** A complaint's whole file, as this screen reads it. */
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
  category: string;
  type: string;
  court: string;
  sections: CaseSection[];
  timeline: CaseTimelineStep[];
};

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
 * A row with no entry gets `DEFAULT_MARKS` — a complete file, returned for insufficient
 * funds, filed in time, one witness.
 */
/**
 * Why a bank sent a cheque back — in the two registers a file states it in.
 *
 * `memo` is the phrase a return memo carries, and it is what the cheque row shows.
 * `sworn` is the same fact inside a sentence, which is what the complainant's
 * confirmation needs: dropping the memo phrase into one produced "the cheque was
 * returned because of funds insufficient", and a file that reads like a machine wrote
 * it is a file a clerk stops trusting.
 */
const RETURN_REASONS = {
  "insufficient-funds": {
    memo: "Funds insufficient",
    sworn: "the insufficiency of funds",
  },
  "payment-stopped": {
    memo: "Payment stopped by drawer",
    sworn: "payment having been stopped by the drawer",
  },
  "account-closed": {
    memo: "Account closed",
    sworn: "the account having been closed",
  },
} as const;

export type ReturnReasonId = keyof typeof RETURN_REASONS;

type CaseFileMarks = {
  /** Why the bank sent the cheque back. */
  returnReason: ReturnReasonId;
  /** Filed outside the month, so the file carries an application to condone it. */
  delayed: boolean;
  /** Someone the complainant says can speak to the transaction. */
  witnesses: number;
  /** The cheque covers only part of what is owed. */
  partialLiability: boolean;
  /** Slots the filer left empty, by document label. */
  missing: string[];
  /** A reply to the demand notice came back. */
  replied: boolean;
  /** The accused has filed something of their own. Almost never, before registration. */
  accusedSubmissions: boolean;
};

const DEFAULT_MARKS: CaseFileMarks = {
  returnReason: "insufficient-funds",
  delayed: false,
  witnesses: 1,
  partialLiability: false,
  missing: [],
  replied: false,
  accusedSubmissions: false,
};

const CASE_FILE_MARKS: Record<string, Partial<CaseFileMarks>> = {
  /* The longest wait in the queue, and the fullest file: late enough to need the delay
     condoned, a reply on record, and two witnesses. */
  "r-1840": { delayed: true, replied: true, witnesses: 2 },
  /* Payment stopped rather than funds short — the other limb of §138, and a different
     reason for the same return. */
  "r-1722": { returnReason: "payment-stopped" },
  /* A part-payment case: the cheque covers some of the debt, not all of it. */
  "r-1654": { partialLiability: true, witnesses: 0 },
  /* Delayed, and the delay-condonation application itself is not on record — the
     partial file the screen has to survive. */
  "r-1588": { delayed: true, missing: ["delay-application"] },
  /* No vakalat on the queue row either: a complaint in person, no witness named, and
     the accused's own ID proof never uploaded. */
  "r-1490": { witnesses: 0, missing: ["accused-id-proof"] },
  /* The account itself had been closed by the time the cheque was presented. */
  "r-1402": { returnReason: "account-closed", replied: true },
  /* The one file in the queue with something from the other side already on it. */
  "r-1104": { accusedSubmissions: true, witnesses: 2 },
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
 */
function numberOf(seed: number, salt: number, count: number): number {
  const low = 10 ** (count - 1);
  const mixed = (seed + salt * 31) * 7919 + salt * 104729;
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

/** What the cheque was given for. Generic on purpose — the trade is the accused's. */
const DEBTS = [
  "Goods supplied on credit",
  "Repayment of a hand loan",
  "Return of an advance on a contract",
  "Settlement of a work bill",
  "Arrears of rent",
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
 */
function chainFor(submittedOn: string, seed: number, delayed: boolean): CaseChain {
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
  const chequeOn = shiftDay(depositedOn, -(6 + (seed % 70)));
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
  return chainFor(submittedOn, serialOf(complaint.caseNumber), marks.delayed);
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

/** "Adv. Suresh Menon" → "suresh-menon", for the filename of what they filed. */
function fileSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^adv\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** `05-08-2025` — the way a scanned upload is named, not the way a page reads. */
function shortDay(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}-${month}-${year}`;
}

/**
 * A plausible size for a scan of `pages` pages.
 *
 * Stable per slot rather than random, and derived here rather than through one of the
 * three `formatBytes` helpers the repo already has: all three sit in the advocate's
 * areas (`lib/tasks`, `lib/filing`, `components/cases`), which the court side does not
 * read from (`content.ts`). These are fixture strings, not bytes off a disk, so there
 * is nothing to count.
 */
function fileSize(key: string, pages: number): string {
  const perPage = 74 + ([...key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 58);
  const kb = pages * perPage;
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * `filed`, unless this file is one of the ones with that slot left empty.
 *
 * The key is separate from the label because two heads ask for the same thing: both
 * parties file an ID proof, so a `missing` list holding labels would empty both slots
 * when only one of them is empty — and naming the slot "ID proof of the accused" to
 * keep them apart put the group's own title back inside every row of it.
 *
 * An empty slot gets no `file`: there is no upload to name, and inventing a filename
 * for a document nobody sent is exactly the kind of detail that makes a demo lie.
 */
function slot(
  spec: {
    key: string;
    label: string;
    kind: CaseDocumentKind;
    /** The uploaded filename, without extension — every court upload here is a PDF. */
    name: string;
    pages: number;
  },
  missing: string[],
): CaseDocument {
  if (missing.includes(spec.key)) {
    return { label: spec.label, state: "absent", kind: spec.kind };
  }
  return {
    label: spec.label,
    state: "filed",
    kind: spec.kind,
    file: {
      name: `${spec.name}.pdf`,
      pages: spec.pages,
      size: fileSize(spec.key, spec.pages),
    },
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
  const chain = chainFor(submittedOn, seed, marks.delayed);
  const amount = chequeAmountFor(seed);

  return {
    id: complaint.id,
    caseNumber: complaint.caseNumber,
    title: causeTitle(complaint),
    daysSinceSubmitted: complaint.daysSinceSubmitted,
    submittedOn,
    submittedOnLabel: formatCaseDate(submittedOn),
    category: "Criminal",
    /* The one offence this product tries. Written the way the domain model writes it
       (`docs/product/terminology.md`), not as the reference's `NIA S138`. */
    type: "S.138, Negotiable Instruments Act, 1881",
    court: CURRENT_STAFF.court,
    sections: [
      litigantSection(complaint, seed, marks),
      caseSpecificSection(complaint, seed, marks, chain, amount),
      additionalSection(complaint, seed, marks),
      accusedSubmissionsSection(marks),
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
            tag: "Individual",
            facts: [
              {
                term: "Mobile number",
                value: mobileFor(seed, 1),
                numeric: true,
              },
              { term: "Email", value: emailFor(complainant) },
              { term: "Age", value: String(28 + (seed % 38)), numeric: true },
              { term: "Address", value: addressFor(seed) },
              {
                term: "Current residential address",
                value: addressFor(seed),
              },
              {
                term: "Power of attorney given to somebody else",
                value: "No",
              },
            ],
            documents: [
              slot(
                {
                  key: "complainant-id-proof",
                  label: "ID proof",
                  kind: "id",
                  name: "id-proof-complainant",
                  pages: 1,
                },
                marks.missing,
              ),
              slot(
                {
                  key: "s225-affidavit",
                  label: "Affidavit u/s 225 BNSS",
                  kind: "letter",
                  name: "affidavit-s225-bnss",
                  pages: 2,
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
            /* Every accused in this queue is a trading name, and a company's cheque is
               signed by somebody — which is why the signatory is a fact on the cheque
               and a fact here. */
            tag: "Company",
            facts: [
              {
                term: "Authorised signatory",
                value: pick(SIGNATORIES, seed),
              },
              {
                term: "Mobile number",
                value: mobileFor(seed, 2),
                numeric: true,
              },
              { term: "Email" },
              { term: "Registered office", value: addressFor(seed + 5) },
              {
                term: "Power of attorney given to somebody else",
                value: "No",
              },
            ],
            documents: [
              slot(
                {
                  key: "accused-id-proof",
                  label: "ID proof",
                  kind: "id",
                  name: "id-proof-accused-signatory",
                  pages: 1,
                },
                marks.missing,
              ),
              slot(
                {
                  key: "company-documents",
                  label: "Company documents",
                  kind: "form",
                  name: "certificate-of-incorporation",
                  pages: 3,
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
  complaint: RegisterCase,
  seed: number,
  marks: CaseFileMarks,
  chain: ReturnType<typeof chainFor>,
  amount: number,
): CaseSection {
  const payee = bankFor(seed, 1);
  const payer = bankFor(seed, 2);
  const debt = pick(DEBTS, seed);
  /* Hoisted: the cheque's number heads its record and names the scan of it, and the
     two must not be able to disagree. */
  const chequeNumber = numberOf(seed, 3, 6);
  /* A part-payment case: the cheque is for less than what is claimed to be owed. */
  const owed = marks.partialLiability ? Math.round((amount * 1.6) / 100) * 100 : amount;

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
              term: "Signatory of the dishonoured cheque",
              value: pick(SIGNATORIES, seed),
            },
            { term: "Cheque amount", value: formatChequeAmount(amount), numeric: true },
            { term: "Date of the cheque", value: formatCaseDate(chain.chequeOn), numeric: true },
            { term: "Payee name on the cheque", value: complaint.parties.complainant },
            { term: "Payee bank", value: payee.name },
            { term: "Payee bank branch", value: payee.branch },
            { term: "Payee IFSC code", value: payee.ifsc, numeric: true },
            { term: "Payer bank", value: payer.name },
            { term: "Payer bank branch", value: payer.branch },
            { term: "Payer IFSC code", value: payer.ifsc, numeric: true },
            {
              term: "Date the cheque was deposited",
              value: formatCaseDate(chain.depositedOn),
              numeric: true,
            },
            {
              term: "Date of return as per the cheque return memo",
              value: formatCaseDate(chain.returnedOn),
              numeric: true,
            },
            {
              term: "Reason for the return of the cheque",
              value: RETURN_REASONS[marks.returnReason].memo,
            },
            {
              term: "Police station with jurisdiction over the cheque",
              value: `${pick(POLICE_STATIONS, seed)} police station`,
            },
            { term: "Additional details about the cheque" },
          ],
          /* The two facts a §138 complaint turns on, and the complainant has sworn to
             both. The court checks them against the dates above rather than taking
             them; showing them together is what makes that check one glance. */
          confirmed: [
            "The cheque was deposited within three months from the date of the cheque.",
            `The cheque was returned because of ${RETURN_REASONS[marks.returnReason].sworn}.`,
          ],
          documents: [
            slot(
              {
                key: "dishonoured-cheque",
                label: "Dishonoured cheque",
                kind: "cheque",
                name: `cheque-${chequeNumber}`,
                pages: 1,
              },
              marks.missing,
            ),
            slot(
              {
                key: "deposit-proof",
                label: "Proof of deposit",
                kind: "memo",
                name: `deposit-counterfoil-${shortDay(chain.depositedOn)}`,
                pages: 1,
              },
              marks.missing,
            ),
            slot(
              {
                key: "return-memo",
                label: "Cheque return memo",
                kind: "memo",
                name: `return-memo-${shortDay(chain.returnedOn)}`,
                pages: 1,
              },
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
        { term: "Nature of the debt or liability", value: debt },
        {
          term: "Cheque received for full or part liability",
          value: marks.partialLiability ? "Part liability" : "Full liability",
        },
        { term: "Amount covered by the cheque", value: formatChequeAmount(amount), numeric: true },
        ...(marks.partialLiability
          ? [
              {
                term: "Total amount claimed to be owed",
                value: formatChequeAmount(owed),
                numeric: true,
              },
            ]
          : []),
        { term: "Additional details of the debt or liability" },
      ],
      documents: [
        slot(
          {
            key: "debt-proof",
            label: "Proof of the debt or liability",
            kind: "receipt",
            name: "ledger-extract",
            pages: 4,
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
          term: "Date the notice was dispatched",
          value: formatCaseDate(chain.noticeSentOn),
          numeric: true,
        },
        {
          term: "Date of service or deemed service on the drawer",
          value: formatCaseDate(chain.noticeServedOn),
          numeric: true,
        },
        {
          term: "Date of reply to the notice",
          value: marks.replied ? formatCaseDate(chain.repliedOn) : "No reply received",
          numeric: marks.replied,
        },
        {
          term: "Date the fifteen days from service were complete",
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
            name: `demand-notice-${shortDay(chain.noticeSentOn)}`,
            pages: 2,
          },
          marks.missing,
        ),
        slot(
          {
            key: "dispatch-proof",
            label: "Proof of dispatch",
            kind: "memo",
            name: "speedpost-booking-receipt",
            pages: 1,
          },
          marks.missing,
        ),
        slot(
          {
            key: "service-proof",
            label: "Proof of service",
            kind: "memo",
            name: "speedpost-delivery-confirmation",
            pages: 1,
          },
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
                name: `reply-to-notice-${shortDay(chain.repliedOn)}`,
                pages: 2,
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
        {
          term: "Filed within one month of the cause of action",
          value: "No",
        },
        {
          term: "Days beyond the one month",
          value: String(Math.max(0, chain.sinceAccrual - FILING_WINDOW_DAYS)),
          numeric: true,
        },
        /* The grounds live in the application, so what this row can say depends on
           whether the application arrived. Citing a document that is not on the file
           is the same contradiction as a synopsis calling a notice unanswered on a
           file that carries the reply — and on a late complaint it is the row a court
           would act on. Kept when the details pass was reverted: a correctness fix,
           not a change of dress. */
        {
          term: "Grounds stated",
          value: applicationFiled
            ? "Set out in the application on record"
            : "The application itself was never uploaded",
        },
      ],
      documents: [
        slot(
          {
            key: "delay-application",
            label: "Delay condonation application",
            kind: "letter",
            name: "delay-condonation-application",
            pages: 3,
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
        empty: marks.witnesses === 0 ? "No witness added" : undefined,
        records: Array.from({ length: marks.witnesses }, (_, index) => ({
          id: `witness-${index + 1}`,
          heading: pick(WITNESS_NAMES, seed + index),
          facts: [
            {
              term: "Speaks to",
              value: "The transaction the cheque was issued for",
            },
            {
              term: "Mobile number",
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
        facts: [
          {
            term: "Synopsis",
            /* The two versions exist because the file states elsewhere whether a reply
               came, and a synopsis saying the notice went unanswered on a file that
               carries the reply is the one contradiction a clerk reading both would
               certainly catch. */
            value: marks.replied
              ? `${complaint.parties.complainant} says the cheque drawn by ${complaint.parties.accused} was returned unpaid, and that the reply to the demand notice did not meet the demand.`
              : `${complaint.parties.complainant} says the cheque drawn by ${complaint.parties.accused} was returned unpaid and the demand notice went unanswered.`,
          },
          {
            term: "Prayer",
            value:
              "That the accused be tried and punished under section 138, and that compensation be awarded.",
          },
          { term: "Additional details" },
        ],
        documents: [
          slot(
            {
              key: "complaint",
              label: "Complaint",
              kind: "letter",
              name: `complaint-${complaint.caseNumber.toLowerCase().replace(/\//g, "-")}`,
              pages: 9,
            },
            marks.missing,
          ),
          slot(
            {
              key: "s223-affidavit",
              label: "Affidavit u/s 223 BNSS",
              kind: "letter",
              name: "affidavit-s223-bnss",
              pages: 2,
            },
            marks.missing,
          ),
        ],
      },
      {
        id: "advocates",
        title: "Advocate details",
        icon: ScaleIcon,
        empty:
          complainantCounsel.length === 0
            ? "No advocate on record — the complainant appears in person"
            : undefined,
        records: complainantCounsel.map((counsel, index) => ({
          id: `advocate-${index + 1}`,
          heading: counsel.name,
          tag: "For the complainant",
          facts: [
            {
              term: "Bar registration",
              value: `KER/${1000 + ((seed + index * 37) % 8000)}/20${10 + ((seed + index) % 15)}`,
              numeric: true,
            },
          ],
          documents: [
            slot(
              {
                key: `advocate-${index + 1}-id-proof`,
                label: "ID proof",
                kind: "id",
                name: `bar-card-${fileSlug(counsel.name)}`,
                pages: 1,
              },
              marks.missing,
            ),
            slot(
              {
                key: `advocate-${index + 1}-vakalatnama`,
                label: "Vakalatnama",
                kind: "form",
                name: `vakalatnama-${fileSlug(counsel.name)}`,
                pages: 1,
              },
              marks.missing,
            ),
          ],
        })),
      },
    ],
  };
}

/**
 * 4 — anything the other side has put on the file.
 *
 * Almost always nothing: the accused has not been summoned, because the complaint has
 * not been registered. The section stays because "has the other side filed anything?"
 * is a question the court asks before it decides, and *no* is an answer to it.
 */
function accusedSubmissionsSection(marks: CaseFileMarks): CaseSection {
  return {
    id: "accused-submissions",
    title: "Submissions from the accused",
    groups: [
      {
        /* The group names what could be filed rather than repeating the section
           heading a few pixels above it — "Submissions from the accused" twice, once
           as the section and once as the only thing in it, was the reference's own
           echo and there is no reason to keep it. */
        id: "accused-submissions",
        title: "Reply, objections and documents",
        icon: UsersRoundIcon,
        empty: marks.accusedSubmissions
          ? undefined
          : "Nothing on record — the accused has not been summoned yet",
        facts: marks.accusedSubmissions
          ? [
              {
                term: "Filed",
                value: "A letter asking that the complaint not be entertained",
              },
            ]
          : undefined,
        documents: marks.accusedSubmissions
          ? [
              slot(
                {
                  key: "accused-letter",
                  label: "Letter from the accused",
                  kind: "letter",
                  name: "letter-from-accused",
                  pages: 1,
                },
                marks.missing,
              ),
            ]
          : undefined,
      },
    ],
  };
}

/** 5 — what was paid to file. */
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
            term: "Court fee paid",
            value: formatChequeAmount(200 + (seed % 8) * 25),
            numeric: true,
          },
          {
            term: "Receipt number",
            value: `KL-CF-${String(seed).padStart(6, "0")}`,
            numeric: true,
          },
        ],
        documents: [
          slot(
            {
              key: "payment-receipt",
              label: "Payment receipt",
              kind: "receipt",
              name: `court-fee-receipt-kl-cf-${String(seed).padStart(6, "0")}`,
              pages: 1,
            },
            marks.missing,
          ),
        ],
      },
    ],
  };
}

/**
 * Where the complaint has got to — a dummy registry history, oldest first.
 *
 * It follows the Kerala spine as far as this queue sits: e-filing and court fee, then
 * scrutiny, then placement before the magistrate (`docs/product/product-foundation.md`
 * §3). It stops there. Cognizance and numbering are the act this list is waiting for,
 * and this build still performs none of it — so the last two steps are always the wait
 * this row already states, and a decision that has not been made.
 *
 * How much of that path has happened is derived from the wait, the same way the file's
 * dates are: a complaint submitted yesterday has not been through scrutiny; one that
 * has sat for months has. Particular marks add the events the file itself already
 * carries (a delay-condonation application that is on record; a letter from the
 * accused). Nothing here is a live system event.
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
    pastStep("Complaint submitted", submittedOn),
    pastStep("Court fee received", submittedOn),
  ];

  /* Only when the application is actually on the file. A delayed complaint whose
     application was never uploaded already says so in the delay-condonation group;
     claiming it was filed here would contradict that row. */
  if (marks.delayed && !marks.missing.includes("delay-application")) {
    steps.push(pastStep("Delay condonation application filed", submittedOn));
  }

  /* Offsets stay strictly inside the wait, so no dummy event lands on today or after
     it. A one-day complaint has only been submitted; a week-old one has been through
     scrutiny; eight days is the earliest a file in this queue would have been placed
     before the magistrate. */
  if (wait >= 3) {
    steps.push(
      pastStep("Taken up for scrutiny", shiftDay(submittedOn, Math.min(2, wait - 1))),
    );
  }

  if (wait >= 7) {
    steps.push(
      pastStep("Scrutiny completed", shiftDay(submittedOn, Math.min(5, wait - 1))),
    );
  }

  if (wait >= 8) {
    steps.push(
      pastStep(
        "Placed before the magistrate",
        shiftDay(submittedOn, Math.min(7, wait - 1)),
      ),
    );
  }

  if (marks.accusedSubmissions && wait >= 20) {
    steps.push(
      pastStep(
        "Letter from the accused received",
        shiftDay(submittedOn, Math.min(18, wait - 1)),
      ),
    );
  }

  steps.push({
    label: "Waiting to be registered",
    detail: formatDaysWaitingLong(wait),
    status: "current",
  });
  steps.push({
    label: "Registration decision",
    detail: "Not made",
    status: "future",
  });
  return steps;
}

function pastStep(label: string, on: string): CaseTimelineStep {
  return { label, detail: formatCaseDate(on), status: "past", on };
}

/** "281 days so far" — the wait, spoken, for the one place it is not a column. */
export function formatDaysWaitingLong(days: number): string {
  return days === 1 ? "1 day so far" : `${days} days so far`;
}

/** How the review screen names a complaint's one state. Every row here is in it. */
export const CASE_REVIEW_STATUS = "Waiting to be registered";
