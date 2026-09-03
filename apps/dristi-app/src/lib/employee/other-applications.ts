/**
 * Every other application waiting on the bench — the third review queue, as data.
 *
 * The sibling of `rescheduling-request.ts` and `delay-condonation.ts`: those two
 * modules are one kind of application each, and this one is the rest. It shares the
 * court-side vocabulary — counsel, sides, the cause title, the page sizes, the stage
 * labels — rather than restating it. Only the citizen side is off limits (see
 * `content.ts`).
 *
 * **"Others" is not "everything except the two rows above it in the rail."** The
 * reference's Others table lists rows of type `RE_SCHEDULE` and `DELAY_CONDONATION`
 * alongside the rest, so this is the court's view of *all* applications, and the type
 * list keeps reschedule for that reason. The two narrower queues are that same body of
 * work pre-filtered for the bench, not slices carved out of it.
 *
 * **There is no backend.** `OTHER_APPLICATIONS_QUEUE` is demo data shaped to exercise
 * what the screen has to survive: every application type at least once, every stage the
 * filter offers, the two longest type labels in the vocabulary, a corporate accused long
 * enough to wrap the cause title, sides with several counsel, and applications with no
 * vakalat on record at all. No row is read from a case, a court or a queue.
 *
 * **Nothing here decides anything.** Allowing or rejecting an application is a real
 * judicial act and this build performs none, so the table carries no row actions at all
 * (see `OtherApplicationsTable`) — not even disabled ones. The list is honest about what
 * is waiting; the act is simply not offered yet.
 *
 * Numbers follow the stage: `CMP/…` before cognizance is taken, `ST/…` after. These rows
 * do not overlap today's cause list, the scheduling queue, the register queue, the
 * rescheduling queue or the delay-condonation queue.
 */

import { DELAY_CONDONATION_STAGES, type DelayCondonationStage } from "./delay-condonation";
import { type CourtCounsel } from "./hearings";

/**
 * Where a case has reached, across the whole §138 journey — the widest stage list on the
 * court side, because an application can arrive at any point in a case's life.
 *
 * Built on what the narrower queues already own rather than restated: `CASE_STAGES`
 * (`schedule.ts`) owns cognizance→judgement, the six the court lists hearings from, and
 * `DELAY_CONDONATION_STAGES` prepends registration. Four are genuinely new here — the two
 * before a complaint is numbered, and the two after judgement is delivered. A parallel
 * copy of the six that already exist is how two court-side screens end up naming the same
 * stage differently.
 *
 * **Journey order, not the reference's alphabetical.** The reference sorted these
 * A–Z, which puts Judgement above Plea and Scrutiny below Registration. Every other
 * court-side list in this app is ordered the way the process runs
 * (`docs/product/domain/journey.md`), and a court reads stages in process order — so the
 * filter opens in that order and the deviation is deliberate.
 */
export type OtherApplicationStage =
  | "filing"
  | "scrutiny"
  | DelayCondonationStage
  | "post-judgement"
  | "long-pending-register";

export const OTHER_APPLICATION_STAGES: {
  id: OtherApplicationStage;
  label: string;
}[] = [
  { id: "filing", label: "Filing" },
  { id: "scrutiny", label: "Scrutiny" },
  /* Registration, then cognizance→judgement — the delay-condonation list verbatim. */
  ...DELAY_CONDONATION_STAGES,
  { id: "post-judgement", label: "Post-judgement" },
  /**
   * Filed long ago. Not dormant, and not inactive: a matter on the long pending register
   * is one the court has been carrying for years, and it may well have been heard last
   * week. The register exists to surface age, nothing else.
   */
  { id: "long-pending-register", label: "Long pending register" },
];

export function otherApplicationStageLabel(stage: OtherApplicationStage): string {
  return (
    OTHER_APPLICATION_STAGES.find((entry) => entry.id === stage)?.label ?? stage
  );
}

/**
 * What the application asks for.
 *
 * The reference renders raw backend enums in this column — `EXTENSION_SUBMISSION_DEADLINE`,
 * `RE_SCHEDULE`, `DELAY_CONDONATION`, `TRANSFER`. That is a leak, not a pattern: a
 * magistrate should not have to read screaming snake case to find out what is in front of
 * them. The ids below keep the reference's vocabulary and the labels re-case it the way
 * `navigation.ts` already re-cases the reference's Title Case — DS sentence case, one
 * capital at the front.
 *
 * **"Others" is both this screen and one of the types on it.** The rail row is named
 * Others because it is the court's whole application list; the type is named Others
 * because some applications fit no head at all. That collision is the reference's own and
 * it stays — renaming either one would put a word in the court's mouth.
 *
 * A related but **different** list exists on the citizen side:
 * `lib/cases/applications.ts` `APPLICATION_TYPES`, with short labels ("Transfer",
 * "Settlement") for a filing form where the surrounding page already says the word
 * "application". The two are not merged and neither imports the other — `/citizen` is a
 * filer choosing what to submit, this is a court reading a queue of what arrived, and the
 * court's own reference names them at this length.
 */
export type OtherApplicationType =
  | "adding-witnesses"
  | "case-transfer"
  | "case-withdrawal"
  | "checkout-request"
  | "document"
  | "extension-of-submission-deadline"
  | "production-of-documents"
  | "profile-correction"
  | "settlement"
  | "change-power-of-attorney"
  | "reschedule-adjournment"
  | "bail"
  | "others"
  | "submit-bail-documents";

/** In the reference's own order — alphabetical by label, which is how a court finds one of fourteen. */
export const OTHER_APPLICATION_TYPES: {
  id: OtherApplicationType;
  label: string;
}[] = [
  { id: "adding-witnesses", label: "Application for adding witnesses" },
  { id: "case-transfer", label: "Application for case transfer" },
  { id: "case-withdrawal", label: "Application for case withdrawal" },
  { id: "checkout-request", label: "Application for checkout request" },
  /* Not truncated. The reference's own label ends here — it is the head for a document
     asked of the court, and shortening it would invent a distinction. */
  { id: "document", label: "Application for document" },
  {
    id: "extension-of-submission-deadline",
    label: "Application for extension of submission deadline",
  },
  {
    id: "production-of-documents",
    label: "Application for production of documents",
  },
  { id: "profile-correction", label: "Application for profile correction" },
  { id: "settlement", label: "Application for settlement" },
  {
    id: "change-power-of-attorney",
    label: "Application to change power of attorney details",
  },
  {
    id: "reschedule-adjournment",
    label: "Application to reschedule/adjournment",
  },
  { id: "bail", label: "Bail" },
  { id: "others", label: "Others" },
  { id: "submit-bail-documents", label: "Submit bail documents" },
];

export function otherApplicationTypeLabel(type: OtherApplicationType): string {
  return OTHER_APPLICATION_TYPES.find((entry) => entry.id === type)?.label ?? type;
}

export type OtherApplication = {
  id: string;
  caseNumber: string;
  parties: { complainant: string; accused: string };
  /**
   * Counsel on record. An application filed before the complaint is numbered may have
   * none — it has been submitted, not yet taken on file, and a vakalat is not a given.
   * The cell then shows nothing rather than a dash: an empty advocates column on the
   * reference was an absence, not a missing value.
   */
  counsel: CourtCounsel[];
  stage: OtherApplicationStage;
  type: OtherApplicationType;
};

/**
 * The applications this court has in front of it.
 *
 * Ordered the way the court received them, so the opening page mixes stages and types —
 * unlike the delay-condonation queue, whose reference opened on a run of Registration
 * rows. The first page is deliberately the hard one: it carries both of the very long
 * type labels, the longest corporate accused, and an application with no counsel at all.
 *
 * Names follow the fixtures the rest of the court side uses: Kollam parties and the same
 * bar, but not the same matters as `CAUSE_LIST`, `SCHEDULING_QUEUE`, `REGISTER_QUEUE`,
 * `RESCHEDULING_QUEUE` or `DELAY_CONDONATION_QUEUE`.
 */
export const OTHER_APPLICATIONS_QUEUE: OtherApplication[] = [
  {
    id: "oa-2101",
    caseNumber: "CMP/2101/2025",
    parties: { complainant: "Sarala", accused: "Kannanalloor Coir Works" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "filing",
    type: "extension-of-submission-deadline",
  },
  {
    id: "oa-2104",
    caseNumber: "CMP/2104/2025",
    parties: {
      complainant: "Prabhakaran",
      accused: "Ezhukone Agro Ventures and Warehousing Company Pvt Ltd",
    },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Nisha Thomas", side: "complainant" },
    ],
    stage: "filing",
    type: "change-power-of-attorney",
  },
  {
    id: "oa-2109",
    caseNumber: "CMP/2109/2025",
    parties: { complainant: "Sosamma", accused: "Ayathil Steel Mart" },
    counsel: [],
    stage: "filing",
    type: "document",
  },
  {
    id: "oa-2113",
    caseNumber: "CMP/2113/2025",
    parties: {
      complainant: "Chandrasekharan",
      accused: "Veliyam Rubber Traders",
    },
    counsel: [{ name: "Adv. Latha Krishnan", side: "complainant" }],
    stage: "filing",
    type: "profile-correction",
  },
  {
    id: "oa-2117",
    caseNumber: "CMP/2117/2025",
    parties: { complainant: "Kunjumon", accused: "Perumpuzha Rice Mill" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "scrutiny",
    type: "extension-of-submission-deadline",
  },
  {
    id: "oa-2122",
    caseNumber: "CMP/2122/2025",
    parties: { complainant: "Sivadasan", accused: "Elampalloor Hardware" },
    counsel: [],
    stage: "scrutiny",
    type: "document",
  },
  {
    id: "oa-2126",
    caseNumber: "CMP/2126/2025",
    parties: { complainant: "Padmini", accused: "Thrikkadavoor Cold Storage" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "scrutiny",
    type: "profile-correction",
  },
  {
    id: "oa-2131",
    caseNumber: "CMP/2131/2025",
    parties: { complainant: "Sarasamma", accused: "Kalluvathukkal Feeds" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "scrutiny",
    type: "others",
  },
  {
    id: "oa-2136",
    caseNumber: "CMP/2136/2025",
    parties: { complainant: "Thulasi", accused: "Sooranad Oil Mill" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "registration",
    type: "case-transfer",
  },
  {
    id: "oa-2141",
    caseNumber: "CMP/2141/2025",
    parties: { complainant: "Mercy", accused: "Poruvazhy Tile Works" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "registration",
    type: "change-power-of-attorney",
  },
  {
    id: "oa-2147",
    caseNumber: "CMP/2147/2025",
    parties: {
      complainant: "Annamma",
      accused: "Clappana Marine Stores and General Trading Company",
    },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "complainant" },
    ],
    stage: "registration",
    type: "document",
  },
  {
    id: "oa-2153",
    caseNumber: "CMP/2153/2025",
    parties: { complainant: "Philomina", accused: "Vellimon Cement Depot" },
    counsel: [],
    stage: "registration",
    type: "case-withdrawal",
  },
  {
    id: "oa-951",
    caseNumber: "CMP/951/2026",
    parties: { complainant: "Sulochana", accused: "Panmana Cashew Company" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "cognizance",
    type: "adding-witnesses",
  },
  {
    id: "oa-955",
    caseNumber: "CMP/955/2026",
    parties: { complainant: "Kochurani", accused: "Mukhathala Auto Works" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "cognizance",
    type: "reschedule-adjournment",
  },
  {
    id: "oa-958",
    caseNumber: "CMP/958/2026",
    parties: { complainant: "Sabu", accused: "Pallithottam Ice Plant" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "cognizance",
    type: "checkout-request",
  },
  {
    id: "oa-962",
    caseNumber: "CMP/962/2026",
    parties: { complainant: "Divya", accused: "Vadakkumthala Poultry Farm" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "complainant" },
    ],
    stage: "cognizance",
    type: "others",
  },
  {
    id: "oa-511",
    caseNumber: "ST/511/2026",
    parties: {
      complainant: "Sethumadhavan",
      accused: "Neendakara Marine Exports",
    },
    counsel: [
      { name: "Adv. Latha Krishnan", side: "complainant" },
      { name: "Adv. Anitha George", side: "accused" },
    ],
    stage: "appearance",
    type: "reschedule-adjournment",
  },
  {
    id: "oa-514",
    caseNumber: "ST/514/2026",
    parties: { complainant: "Smitha", accused: "Thodiyoor Poultry Farm" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "appearance",
    type: "bail",
  },
  {
    id: "oa-517",
    caseNumber: "ST/517/2026",
    parties: { complainant: "Balakrishnan", accused: "Chithara Granites" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "appearance",
    type: "submit-bail-documents",
  },
  {
    id: "oa-520",
    caseNumber: "ST/520/2026",
    parties: { complainant: "Sindhu", accused: "Alayamon Estate Supplies" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "appearance",
    type: "profile-correction",
  },
  {
    id: "oa-523",
    caseNumber: "ST/523/2026",
    parties: { complainant: "Muraleedharan", accused: "Edamulakkal Saw Mill" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "plea",
    type: "bail",
  },
  {
    id: "oa-527",
    caseNumber: "ST/527/2026",
    parties: { complainant: "Reeja", accused: "Yeroor Plywoods" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "plea",
    type: "adding-witnesses",
  },
  {
    id: "oa-530",
    caseNumber: "ST/530/2026",
    parties: { complainant: "Basheer", accused: "Kunnathur Steel Traders" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Suresh Menon", side: "accused" },
    ],
    stage: "plea",
    type: "submit-bail-documents",
  },
  {
    id: "oa-534",
    caseNumber: "ST/534/2026",
    parties: { complainant: "Janaki", accused: "Ummannoor Rubber Works" },
    counsel: [],
    stage: "plea",
    type: "case-transfer",
  },
  {
    id: "oa-538",
    caseNumber: "ST/538/2026",
    parties: { complainant: "Ayyappan", accused: "Pattazhy Agro Traders" },
    counsel: [
      { name: "Adv. Rekha Pillai", side: "complainant" },
      { name: "Adv. Saurabh Verma", side: "accused" },
    ],
    stage: "evidence",
    type: "production-of-documents",
  },
  {
    id: "oa-541",
    caseNumber: "ST/541/2026",
    parties: { complainant: "Chellamma", accused: "Piravanthoor Hill Produce" },
    counsel: [
      { name: "Adv. Latha Krishnan", side: "complainant" },
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "evidence",
    type: "adding-witnesses",
  },
  {
    id: "oa-545",
    caseNumber: "ST/545/2026",
    parties: { complainant: "Nazar", accused: "Kottukal Fisheries" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "evidence",
    type: "extension-of-submission-deadline",
  },
  {
    id: "oa-548",
    caseNumber: "ST/548/2026",
    parties: {
      complainant: "Devaki",
      accused: "Mynagappally Coir Mats and Matting Company Pvt Ltd",
    },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "evidence",
    type: "production-of-documents",
  },
  {
    id: "oa-552",
    caseNumber: "ST/552/2026",
    parties: { complainant: "Salim", accused: "Karicode Engineering Works" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "evidence",
    type: "reschedule-adjournment",
  },
  {
    id: "oa-556",
    caseNumber: "ST/556/2026",
    parties: { complainant: "Ponnamma", accused: "Kalayapuram Textiles" },
    counsel: [
      { name: "Adv. Feroz Hameed", side: "complainant" },
      { name: "Adv. Anitha George", side: "accused" },
    ],
    stage: "arguments",
    type: "settlement",
  },
  {
    id: "oa-559",
    caseNumber: "ST/559/2026",
    parties: { complainant: "Jasmine", accused: "Puthur Metal Works" },
    counsel: [{ name: "Adv. Latha Krishnan", side: "complainant" }],
    stage: "arguments",
    type: "case-withdrawal",
  },
  {
    id: "oa-563",
    caseNumber: "ST/563/2026",
    parties: { complainant: "Gangadharan", accused: "Thattamala Timber Yard" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Suresh Menon", side: "accused" },
    ],
    stage: "arguments",
    type: "document",
  },
  {
    id: "oa-566",
    caseNumber: "ST/566/2026",
    parties: { complainant: "Karthiyayani", accused: "Uliyakovil Provisions" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "arguments",
    type: "checkout-request",
  },
  {
    id: "oa-570",
    caseNumber: "ST/570/2026",
    parties: { complainant: "Kamalam", accused: "Ithikkara Motors" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "judgement",
    type: "settlement",
  },
  {
    id: "oa-573",
    caseNumber: "ST/573/2026",
    parties: { complainant: "Sudhakaran", accused: "Nedumpana Dairy Farm" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "judgement",
    type: "case-withdrawal",
  },
  {
    id: "oa-577",
    caseNumber: "ST/577/2026",
    parties: {
      complainant: "Alice",
      accused: "Kulasekharapuram Handloom House",
    },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Nisha Thomas", side: "accused" },
    ],
    stage: "judgement",
    type: "others",
  },
  {
    id: "oa-580",
    caseNumber: "ST/580/2026",
    parties: { complainant: "Jaleel", accused: "Nilamel Timber Traders" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "post-judgement",
    type: "checkout-request",
  },
  {
    id: "oa-584",
    caseNumber: "ST/584/2026",
    parties: { complainant: "Shylaja", accused: "Pooyappally Provisions" },
    counsel: [
      { name: "Adv. Rekha Pillai", side: "complainant" },
      { name: "Adv. Saurabh Verma", side: "accused" },
    ],
    stage: "post-judgement",
    type: "document",
  },
  /* The long pending register: filed long ago, and still moving. The older year on these
     numbers is the whole of what the register means — none of them is dormant. */
  {
    id: "oa-118",
    caseNumber: "ST/118/2023",
    parties: { complainant: "Subaida", accused: "Ayathil Cashew Traders" },
    counsel: [
      { name: "Adv. Latha Krishnan", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "long-pending-register",
    type: "reschedule-adjournment",
  },
  {
    id: "oa-126",
    caseNumber: "ST/126/2023",
    parties: {
      complainant: "Rajammal",
      accused: "Perumpuzha Marine Products and Cold Chain Pvt Ltd",
    },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "long-pending-register",
    type: "settlement",
  },
  {
    id: "oa-134",
    caseNumber: "ST/134/2023",
    parties: { complainant: "Yohannan", accused: "Vellimon Rice Traders" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "long-pending-register",
    type: "others",
  },
];

/**
 * How many applications are waiting — the number the rail carries beside "Others".
 *
 * Derived from the list rather than typed in beside the label, the way
 * `DELAY_CONDONATION_QUEUE_COUNT` is, so the rail and the screen cannot disagree about
 * the size of the queue.
 */
export const OTHER_APPLICATIONS_QUEUE_COUNT = OTHER_APPLICATIONS_QUEUE.length;

export type OtherApplicationFilters = {
  stage: OtherApplicationStage | "all";
  /**
   * Free text over the cause title, the case number and counsel — the same reach the
   * delay-condonation queue uses. The reference labelled the box "Case Name or Number,
   * Advocate".
   */
  query: string;
  type: OtherApplicationType | "all";
};

export const EMPTY_OTHER_APPLICATION_FILTERS: OtherApplicationFilters = {
  stage: "all",
  query: "",
  type: "all",
};

export function filterOtherApplications(
  rows: OtherApplication[],
  filters: OtherApplicationFilters,
): OtherApplication[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((entry) => {
    if (filters.stage !== "all" && entry.stage !== filters.stage) return false;
    if (filters.type !== "all" && entry.type !== filters.type) return false;
    if (!query) return true;
    const haystack = [
      entry.parties.complainant,
      entry.parties.accused,
      entry.caseNumber,
      ...entry.counsel.map((counsel) => counsel.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
