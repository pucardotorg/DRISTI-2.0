/**
 * Today's cause list — what this bench is sitting on, as data.
 *
 * The employee area is self-contained by design (see `content.ts`): nothing under
 * `/employee` reads from the citizen side and nothing there reads from here. So the
 * hearing vocabulary is restated in this module rather than imported from
 * `lib/cases/hearings.ts`. The *words* are deliberately the same ones — a hearing is
 * "scheduled" or "completed" and its purpose is "Admission" whichever side of the app is
 * looking at it — because the two halves must not drift into disagreeing about the same
 * §138 listing. Only the coupling is avoided, never the shared meaning.
 *
 * **There is no backend.** `CAUSE_LIST` is one sitting day of demo rows, shaped to
 * exercise what the screen has to survive: every status chip, a purpose long enough to
 * wrap its column, a corporate accused long enough to wrap the cause title, sides with
 * one counsel and sides with several, and enough rows to page at 10 and 20. No row is
 * read from a case, a court or a queue, and nothing here performs a court action.
 *
 * **"Passed over" is not a status.** The reference's row menu offers it, but marking a
 * matter passed over is a real judicial act and this build performs none — so the action
 * is rendered and plainly disabled (see `HearingsTable`) rather than modelled as data the
 * court could reach. The same goes for starting a hearing.
 */

export type CourtHearingStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "rescheduled"
  | "abandoned";

export const COURT_HEARING_STATUSES: {
  id: CourtHearingStatus;
  label: string;
}[] = [
  { id: "scheduled", label: "Scheduled" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "abandoned", label: "Abandoned" },
];

/**
 * Chip fills follow where the listing sits in the day, matching the citizen side's
 * reading of the same five words: info before it is called and while it is being heard,
 * success once it is done, secondary once it has moved to another date, warning when it
 * did not proceed. The chip always carries the word as well as the fill — status is never
 * colour alone (ACCESSIBILITY §3).
 */
export function courtHearingStatusVariant(
  status: CourtHearingStatus,
): "info" | "success" | "secondary" | "warning" {
  switch (status) {
    case "scheduled":
    case "ongoing":
      return "info";
    case "completed":
      return "success";
    case "rescheduled":
      return "secondary";
    case "abandoned":
      return "warning";
  }
}

export function courtHearingStatusLabel(status: CourtHearingStatus): string {
  return (
    COURT_HEARING_STATUSES.find((entry) => entry.id === status)?.label ?? status
  );
}

/**
 * The listing purposes this cause list actually uses.
 *
 * A subset of the §138 purposes the domain names, not the whole vocabulary — the Purpose
 * filter is built from this list, and offering the bench a purpose that cannot match a
 * row would be a control that only ever returns nothing.
 */
export type CourtHearingPurposeId =
  | "admission"
  | "appearance"
  | "arguments"
  | "bail"
  | "cognizance"
  | "delay-condonation"
  | "evidence-of-complainant"
  | "examination-of-accused-351"
  | "for-reports"
  | "judgement"
  | "plea";

export const COURT_HEARING_PURPOSES: {
  id: CourtHearingPurposeId;
  label: string;
}[] = [
  { id: "admission", label: "Admission" },
  { id: "appearance", label: "Appearance" },
  { id: "arguments", label: "Arguments" },
  { id: "bail", label: "Bail" },
  { id: "cognizance", label: "Cognizance" },
  { id: "delay-condonation", label: "Delay condonation" },
  { id: "evidence-of-complainant", label: "Evidence of complainant" },
  {
    id: "examination-of-accused-351",
    label: "Examination of accused under S. 351 BNSS",
  },
  {
    id: "for-reports",
    label: "For reports (to be received from forensics, ADR, etc)",
  },
  { id: "judgement", label: "Judgement" },
  { id: "plea", label: "Plea" },
];

export function courtHearingPurposeLabel(id: CourtHearingPurposeId): string {
  return (
    COURT_HEARING_PURPOSES.find((entry) => entry.id === id)?.label ?? id
  );
}

/**
 * Where the case itself has reached — not what this one sitting is listed for.
 *
 * A hearing's purpose and its case's stage are different facts and the court reads both:
 * a matter at the Cognizance stage can be listed for admission, and so can one that has
 * already reached Appearance. The reference's bulk-reschedule screen shows them as two
 * columns for exactly that reason, so they are two fields here.
 *
 * The stages are the national §138 journey's own (`docs/product/domain/journey.md`
 * §4–§8), named as the court names them. Nothing before cognizance appears: a complaint
 * the magistrate has not taken on file has no hearing to move.
 */
export type CourtCaseStage =
  | "cognizance"
  | "process"
  | "appearance"
  | "plea"
  | "evidence"
  | "arguments"
  | "judgement";

export const COURT_CASE_STAGES: { id: CourtCaseStage; label: string }[] = [
  { id: "cognizance", label: "Cognizance" },
  { id: "process", label: "Process" },
  { id: "appearance", label: "Appearance" },
  { id: "plea", label: "Plea" },
  { id: "evidence", label: "Evidence" },
  { id: "arguments", label: "Arguments" },
  { id: "judgement", label: "Judgement" },
];

export function courtCaseStageLabel(id: CourtCaseStage): string {
  return COURT_CASE_STAGES.find((entry) => entry.id === id)?.label ?? id;
}

/** Which side of the cause a lawyer appears for. The row marks it (C) / (A). */
export type CounselSide = "complainant" | "accused";

export type CourtCounsel = { name: string; side: CounselSide };

export type CourtHearing = {
  id: string;
  /**
   * The court's own serial on the day's list — the number the bench calls, not the row's
   * position on screen. It is stored rather than derived so filtering the list does not
   * renumber the matters: item 17 is item 17 whether or not items 1–16 are in view.
   */
  item: number;
  caseNumber: string;
  /** How far the case has got. Independent of `purpose` — see `CourtCaseStage`. */
  stage: CourtCaseStage;
  parties: { complainant: string; accused: string };
  /** Counsel on record for the listing. A side may have none — no vakalat yet. */
  counsel: CourtCounsel[];
  purpose: CourtHearingPurposeId;
  status: CourtHearingStatus;
};

/**
 * "A v. B" — the cause title, the same way the case record writes it.
 *
 * Takes the parties rather than a `CourtHearing`, so the scheduling queue
 * (`schedule.ts`) writes a cause title the same way this list does. Two court-side
 * screens naming the same case differently is the drift this shape rules out.
 */
export function causeTitle(matter: {
  parties: { complainant: string; accused: string };
}): string {
  return `${matter.parties.complainant} v. ${matter.parties.accused}`;
}

/** One side's advocates on record. Structural for the same reason as `causeTitle`. */
export function counselFor(
  matter: { counsel: CourtCounsel[] },
  side: CounselSide,
): CourtCounsel[] {
  return matter.counsel.filter((entry) => entry.side === side);
}

/**
 * One sitting day, 23 matters — the count the reference screen lists.
 *
 * Names and numbers follow the fixtures the rest of the repo already uses: Kollam parties,
 * `Adv.`-prefixed counsel, and the `ST/NNN/YYYY` summary-trial number the reference shows
 * once a complaint has been taken on file.
 */
export const CAUSE_LIST: CourtHearing[] = [
  {
    id: "h-241",
    item: 1,
    caseNumber: "ST/241/2026",
    parties: { complainant: "Sunil Varghese", accused: "Anand Traders" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "evidence",
    purpose: "evidence-of-complainant",
    status: "ongoing",
  },
  {
    id: "h-243",
    item: 2,
    caseNumber: "ST/243/2026",
    parties: {
      complainant: "Meenakshi Nair",
      accused: "Coastal Agro Exports Pvt Ltd",
    },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Vinod Chandran", side: "accused" },
    ],
    stage: "appearance",
    purpose: "admission",
    status: "scheduled",
  },
  {
    id: "h-244",
    item: 3,
    caseNumber: "ST/244/2026",
    parties: { complainant: "Kiran Mathew", accused: "Harbour Line Shipping" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "appearance",
    purpose: "appearance",
    status: "scheduled",
  },
  {
    id: "h-245",
    item: 4,
    caseNumber: "ST/245/2026",
    parties: { complainant: "Rajeev Menon", accused: "Ferns Interiors" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "cognizance",
    purpose: "delay-condonation",
    status: "scheduled",
  },
  {
    id: "h-246",
    item: 5,
    caseNumber: "ST/246/2026",
    parties: { complainant: "Ayesha Rahman", accused: "Sreekumar P" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "cognizance",
    purpose: "admission",
    status: "scheduled",
  },
  {
    id: "h-247",
    item: 6,
    caseNumber: "ST/247/2026",
    parties: { complainant: "Thomas Kurian", accused: "Highland Rubber Works" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Vinod Chandran", side: "accused" },
    ],
    stage: "cognizance",
    purpose: "cognizance",
    status: "scheduled",
  },
  {
    id: "h-248",
    item: 7,
    caseNumber: "ST/248/2026",
    parties: { complainant: "Deepa Suresh", accused: "Vasanth Kumar S" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "plea",
    purpose: "plea",
    status: "scheduled",
  },
  {
    id: "h-249",
    item: 8,
    caseNumber: "ST/249/2026",
    parties: {
      complainant: "Shubhreet Singh",
      accused: "Gill Steel Fabricators",
    },
    counsel: [{ name: "Adv. Nisha Thomas", side: "complainant" }],
    stage: "process",
    purpose: "appearance",
    status: "rescheduled",
  },
  {
    id: "h-250",
    item: 9,
    caseNumber: "ST/250/2026",
    parties: { complainant: "Fathima Beevi", accused: "Nithin Jose" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "evidence",
    purpose: "evidence-of-complainant",
    status: "scheduled",
  },
  {
    id: "h-251",
    item: 10,
    caseNumber: "ST/251/2026",
    parties: {
      complainant: "Ganesh Iyer",
      accused: "Backwater Marine Logistics and Warehousing Company Pvt Ltd",
    },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
      { name: "Adv. Vinod Chandran", side: "accused" },
    ],
    stage: "evidence",
    purpose: "for-reports",
    status: "scheduled",
  },
  {
    id: "h-252",
    item: 11,
    caseNumber: "ST/252/2026",
    parties: { complainant: "Lakshmi Prasad", accused: "Zenith Auto Spares" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "cognizance",
    purpose: "admission",
    status: "scheduled",
  },
  {
    id: "h-253",
    item: 12,
    caseNumber: "ST/253/2026",
    parties: { complainant: "Abdul Salam", accused: "Riverside Constructions" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "evidence",
    purpose: "examination-of-accused-351",
    status: "scheduled",
  },
  {
    id: "h-254",
    item: 13,
    caseNumber: "ST/254/2026",
    parties: { complainant: "Priya Menon", accused: "Sabari Textiles" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "arguments",
    purpose: "arguments",
    status: "completed",
  },
  {
    id: "h-255",
    item: 14,
    caseNumber: "ST/255/2026",
    parties: { complainant: "Joseph Antony", accused: "Mangala Cashews" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Vinod Chandran", side: "accused" },
    ],
    stage: "appearance",
    purpose: "bail",
    status: "scheduled",
  },
  {
    id: "h-256",
    item: 15,
    caseNumber: "ST/256/2026",
    parties: { complainant: "Radhika Warrier", accused: "Anil Kumar T" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "process",
    purpose: "appearance",
    status: "abandoned",
  },
  {
    id: "h-257",
    item: 16,
    caseNumber: "ST/257/2026",
    parties: {
      complainant: "Vivek Ramachandran",
      accused: "Palm Grove Resorts",
    },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "cognizance",
    purpose: "delay-condonation",
    status: "scheduled",
  },
  {
    id: "h-258",
    item: 17,
    caseNumber: "ST/258/2026",
    parties: { complainant: "Sneha Pillai", accused: "Kerala Spice Traders" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "evidence",
    purpose: "evidence-of-complainant",
    status: "scheduled",
  },
  {
    id: "h-259",
    item: 18,
    caseNumber: "ST/259/2026",
    parties: { complainant: "Mohammed Rafi", accused: "Unity Hardware Mart" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "appearance",
    purpose: "admission",
    status: "scheduled",
  },
  {
    id: "h-260",
    item: 19,
    caseNumber: "ST/260/2026",
    parties: { complainant: "Anjali Nambiar", accused: "Sunrise Poultry Farm" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "judgement",
    purpose: "judgement",
    status: "scheduled",
  },
  {
    id: "h-261",
    item: 20,
    caseNumber: "ST/261/2026",
    parties: { complainant: "Hari Krishnan", accused: "Vaishnav Enterprises" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Vinod Chandran", side: "accused" },
    ],
    stage: "plea",
    purpose: "plea",
    status: "scheduled",
  },
  {
    id: "h-262",
    item: 21,
    caseNumber: "ST/262/2026",
    parties: { complainant: "Beena Jacob", accused: "Trident Packaging" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "process",
    purpose: "appearance",
    status: "scheduled",
  },
  {
    id: "h-263",
    item: 22,
    caseNumber: "ST/263/2026",
    parties: { complainant: "Suresh Babu", accused: "Ocean Pearl Seafoods" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "arguments",
    purpose: "arguments",
    status: "scheduled",
  },
  {
    id: "h-264",
    item: 23,
    caseNumber: "ST/264/2026",
    parties: { complainant: "Nithya Raman", accused: "Everbright Electricals" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "cognizance",
    purpose: "cognizance",
    status: "scheduled",
  },
];

/**
 * How many matters are listed today — the number the rail carries beside "Today's
 * hearings".
 *
 * Derived from the list itself rather than typed in beside the label, so the rail and the
 * screen can never disagree about the size of the day. The other counts in the rail are
 * still the reference's demo numbers; this one is as real as the data behind it.
 */
export const TODAYS_HEARING_COUNT = CAUSE_LIST.length;

/** A calendar day as `YYYY-MM-DD` in the reader's own timezone. */
export function isoDay(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * `YYYY-MM-DD` back to a Date at local midnight.
 *
 * Built from parts rather than `new Date(iso)`, which reads a bare date string as UTC and
 * so lands on the previous day for every court west of Greenwich. Kollam is not one of
 * them, but the bug is silent and the fix is one line.
 */
export function parseIsoDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

/**
 * A day, written out.
 *
 * Two registers, because a date does two jobs on these screens. Prose names the day the
 * court is sitting on and can afford the weekday; a column of dates read against each
 * other cannot, and gets the short form. Both pin `en-IN` rather than reading the
 * runtime's locale, so the server and the browser render the same string.
 */
const LONG_DAY = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const LISTING_DAY = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Monday, 31 August 2026" — a day named in a sentence. */
export function formatCourtDay(day: string): string {
  return LONG_DAY.format(parseIsoDay(day));
}

/** "31 Aug 2026" — a day in a column, beside other days. */
export function formatListingDate(day: string): string {
  return LISTING_DAY.format(parseIsoDay(day));
}

/**
 * The list for one day.
 *
 * There is exactly one day of demo data, so any date other than today's returns nothing
 * and the screen shows its empty state. That is the honest answer for this build: a court
 * that has no listing for the date asked for should say so, not borrow another day's
 * matters to look populated.
 */
export function hearingsForDay(day: string, today: string): CourtHearing[] {
  return day === today ? CAUSE_LIST : [];
}

export type HearingFilters = {
  status: CourtHearingStatus | "all";
  purpose: CourtHearingPurposeId | "all";
  /** Free text over the cause title and the case number — what the bench can recall. */
  query: string;
};

export const EMPTY_FILTERS: HearingFilters = {
  status: "all",
  purpose: "all",
  query: "",
};

export function filterHearings(
  rows: CourtHearing[],
  filters: HearingFilters,
): CourtHearing[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((hearing) => {
    if (filters.status !== "all" && hearing.status !== filters.status) {
      return false;
    }
    if (filters.purpose !== "all" && hearing.purpose !== filters.purpose) {
      return false;
    }
    if (!query) return true;
    const haystack =
      `${causeTitle(hearing)} ${hearing.caseNumber}`.toLowerCase();
    return haystack.includes(query);
  });
}

export const PAGE_SIZES = [10, 20, 30, 50] as const;

export type HearingsPageSize = (typeof PAGE_SIZES)[number];

export function isHearingsPageSize(value: number): value is HearingsPageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}
