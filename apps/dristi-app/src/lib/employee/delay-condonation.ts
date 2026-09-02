/**
 * Delay-condonation applications waiting on the bench — the review queue, as data.
 *
 * The sibling of `register-cases.ts`, `schedule.ts` and `rescheduling-request.ts`:
 * those modules are complaints not yet on the register, matters not yet given a
 * date, and listed matters asking to move that date. This one is applications
 * asking the court to condone delay — at filing (Registration / `CMP/…`) and,
 * later, on a matter already on file. They share the court-side vocabulary —
 * counsel, sides, the cause title, the page sizes, the stage labels — rather
 * than restating it. Only the citizen side is off limits (see `content.ts`).
 *
 * **There is no backend.** `DELAY_CONDONATION_QUEUE` is demo data shaped to
 * exercise what the screen has to survive: every stage the filter offers, a
 * corporate accused long enough to wrap the cause title, a side with several
 * counsel, and a complaint with no vakalat on record at all. No row is read
 * from a case, a court or a queue.
 *
 * **Nothing here condones anything.** Accepting or rejecting delay is a real
 * judicial act (`order-for-acceptance-rejection-of-delay-condonation`) and this
 * build performs none, so the table carries no row actions at all (see
 * `DelayCondonationTable`) — not even disabled ones. The list is honest about
 * what is waiting; the act is simply not offered yet.
 *
 * Registration is a stage *here* and not on Schedule hearing. `CASE_STAGES`
 * starts at cognizance because those are hearings to date; a complaint still
 * at filing is the registry's queue. This filter has to name what the
 * screenshot showed, so Registration is prepended and left off `CASE_STAGES`.
 * Numbers follow the stage: `CMP/…` before cognizance is taken, `ST/…` after.
 * These rows do not overlap today's cause list, the scheduling queue, the
 * register queue, or the rescheduling queue.
 */

import { type CourtCounsel } from "./hearings";
import { CASE_STAGES, type CaseStage } from "./schedule";

export type DelayCondonationStage = "registration" | CaseStage;

export const DELAY_CONDONATION_STAGES: {
  id: DelayCondonationStage;
  label: string;
}[] = [{ id: "registration", label: "Registration" }, ...CASE_STAGES];

export function delayCondonationStageLabel(
  stage: DelayCondonationStage,
): string {
  return (
    DELAY_CONDONATION_STAGES.find((entry) => entry.id === stage)?.label ??
    stage
  );
}

export type DelayCondonationCase = {
  id: string;
  caseNumber: string;
  parties: { complainant: string; accused: string };
  /**
   * Counsel on record. A complaint at Registration may have none — it has been
   * submitted, not yet numbered, and a vakalat is not a given. The cell then
   * shows nothing rather than a dash: an empty advocates column on the
   * reference was an absence, not a missing value.
   */
  counsel: CourtCounsel[];
  stage: DelayCondonationStage;
};

/**
 * Applications waiting for the bench to condone delay.
 *
 * Ordered Registration first so the opening page matches the reference
 * (every visible row there was at Registration), then the later stages the
 * filter also offers. Names follow the fixtures the rest of the court side
 * uses: Kollam parties and the same bar, but not the same matters as
 * `CAUSE_LIST`, `SCHEDULING_QUEUE`, `REGISTER_QUEUE` or `RESCHEDULING_QUEUE`.
 */
export const DELAY_CONDONATION_QUEUE: DelayCondonationCase[] = [
  {
    id: "dc-1213",
    caseNumber: "CMP/1213/2025",
    parties: { complainant: "Thankamani", accused: "Thenmala Timber Depot" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1214",
    caseNumber: "CMP/1214/2025",
    parties: { complainant: "Pradeep Kumar", accused: "Kadakkal Spices" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1220",
    caseNumber: "CMP/1220/2025",
    parties: {
      complainant: "Omana",
      accused: "Kulathupuzha Forest Stores and General Trading",
    },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Saurabh Verma", side: "complainant" },
    ],
    stage: "registration",
  },
  {
    id: "dc-1228",
    caseNumber: "CMP/1228/2025",
    parties: { complainant: "Sudheesh", accused: "Aryankavu Coffee Works" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1235",
    caseNumber: "CMP/1235/2025",
    parties: { complainant: "Nabeesa", accused: "Pathanapuram Feeds" },
    counsel: [],
    stage: "registration",
  },
  {
    id: "dc-1241",
    caseNumber: "CMP/1241/2025",
    parties: { complainant: "Girija", accused: "Punalur Rubber Depot" },
    counsel: [{ name: "Adv. Latha Krishnan", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1251",
    caseNumber: "CMP/1251/2025",
    parties: { complainant: "Manoj", accused: "Anchalumoodu Quarry" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1258",
    caseNumber: "CMP/1258/2025",
    parties: { complainant: "Sabeena", accused: "Mayyanad Ice Plant" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1266",
    caseNumber: "CMP/1266/2025",
    parties: { complainant: "Radhakrishnan", accused: "Kundara Cables" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "complainant" },
    ],
    stage: "registration",
  },
  {
    id: "dc-1274",
    caseNumber: "CMP/1274/2025",
    parties: { complainant: "Pushpa", accused: "Sakthikulangara Nets" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1281",
    caseNumber: "CMP/1281/2025",
    parties: { complainant: "Fazil", accused: "Tenkasi Road Traders" },
    counsel: [],
    stage: "registration",
  },
  {
    id: "dc-1290",
    caseNumber: "CMP/1290/2025",
    parties: { complainant: "Indira", accused: "Karunagappally Cashews" },
    counsel: [{ name: "Adv. Latha Krishnan", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1298",
    caseNumber: "CMP/1298/2025",
    parties: { complainant: "Soman", accused: "Chavara Salt Works" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1305",
    caseNumber: "CMP/1305/2025",
    parties: { complainant: "Naseema", accused: "Kottarakkara Oil Mill" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1312",
    caseNumber: "CMP/1312/2025",
    parties: { complainant: "Biju", accused: "Paravur Boat Jetty Stores" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1320",
    caseNumber: "CMP/1320/2025",
    parties: { complainant: "Vanaja", accused: "Ochira Oil Traders" },
    counsel: [],
    stage: "registration",
  },
  {
    id: "dc-1328",
    caseNumber: "CMP/1328/2025",
    parties: { complainant: "Shamsudeen", accused: "Kadakkal Hardware" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1344",
    caseNumber: "CMP/1344/2025",
    parties: { complainant: "Gracy", accused: "Pathanapuram Tiles" },
    counsel: [{ name: "Adv. Nisha Thomas", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1352",
    caseNumber: "CMP/1352/2025",
    parties: { complainant: "Aneesh", accused: "Kulathupuzha Saw Mill" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "complainant" },
    ],
    stage: "registration",
  },
  {
    id: "dc-1361",
    caseNumber: "CMP/1361/2025",
    parties: { complainant: "Rejitha", accused: "Aryankavu Provisions" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1370",
    caseNumber: "CMP/1370/2025",
    parties: { complainant: "Musthafa", accused: "Thenmala Hill Produce" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "registration",
  },
  {
    id: "dc-1378",
    caseNumber: "CMP/1378/2025",
    parties: { complainant: "Molly", accused: "Tenkasi Road Cold Storage" },
    counsel: [],
    stage: "registration",
  },
  {
    id: "dc-890",
    caseNumber: "CMP/890/2026",
    parties: { complainant: "Santhosh", accused: "Nedumangad Copra Traders" },
    counsel: [{ name: "Adv. Saurabh Verma", side: "complainant" }],
    stage: "cognizance",
  },
  {
    id: "dc-891",
    caseNumber: "CMP/891/2026",
    parties: { complainant: "Zainaba", accused: "Varkala Beach Stores" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "cognizance",
  },
  {
    id: "dc-892",
    caseNumber: "CMP/892/2026",
    parties: { complainant: "Vineeth", accused: "Attingal Grain Market" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Anitha George", side: "accused" },
    ],
    stage: "cognizance",
  },
  {
    id: "dc-401",
    caseNumber: "ST/401/2026",
    parties: { complainant: "Leelamma", accused: "Kilimanoor Motors" },
    counsel: [
      { name: "Adv. Latha Krishnan", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "appearance",
  },
  {
    id: "dc-402",
    caseNumber: "ST/402/2026",
    parties: { complainant: "Hashim", accused: "Venjaramoodu Electricals" },
    counsel: [{ name: "Adv. Suresh Menon", side: "complainant" }],
    stage: "appearance",
  },
  {
    id: "dc-403",
    caseNumber: "ST/403/2026",
    parties: { complainant: "Thankachi", accused: "Nedumangad Furniture" },
    counsel: [
      { name: "Adv. Anitha George", side: "complainant" },
      { name: "Adv. Saurabh Verma", side: "accused" },
    ],
    stage: "plea",
  },
  {
    id: "dc-404",
    caseNumber: "ST/404/2026",
    parties: { complainant: "Rajesh", accused: "Varkala Lime Works" },
    counsel: [{ name: "Adv. Rekha Pillai", side: "complainant" }],
    stage: "plea",
  },
  {
    id: "dc-405",
    caseNumber: "ST/405/2026",
    parties: { complainant: "Noorjahan", accused: "Attingal Handlooms" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Latha Krishnan", side: "accused" },
    ],
    stage: "evidence",
  },
  {
    id: "dc-406",
    caseNumber: "ST/406/2026",
    parties: { complainant: "Prasanna", accused: "Kilimanoor Dairy" },
    counsel: [{ name: "Adv. Feroz Hameed", side: "complainant" }],
    stage: "evidence",
  },
  {
    id: "dc-407",
    caseNumber: "ST/407/2026",
    parties: {
      complainant: "Jayan",
      accused: "Venjaramoodu Agro Mills and Trading Pvt Ltd",
    },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    stage: "evidence",
  },
  {
    id: "dc-408",
    caseNumber: "ST/408/2026",
    parties: { complainant: "Suhara", accused: "Nedumangad Printers" },
    counsel: [{ name: "Adv. Anitha George", side: "complainant" }],
    stage: "arguments",
  },
  {
    id: "dc-409",
    caseNumber: "ST/409/2026",
    parties: { complainant: "Babu", accused: "Varkala Marine Stores" },
    counsel: [
      { name: "Adv. Saurabh Verma", side: "complainant" },
      { name: "Adv. Feroz Hameed", side: "accused" },
    ],
    stage: "arguments",
  },
  {
    id: "dc-410",
    caseNumber: "ST/410/2026",
    parties: { complainant: "Celine", accused: "Attingal Super Bazaar" },
    counsel: [
      { name: "Adv. Latha Krishnan", side: "complainant" },
      { name: "Adv. Nisha Thomas", side: "accused" },
    ],
    stage: "judgement",
  },
];

/**
 * How many applications are waiting — the number the rail carries beside
 * "Delay condonation".
 *
 * Derived from the list rather than typed in beside the label, the way
 * `REGISTER_QUEUE_COUNT` is, so the rail and the screen cannot disagree about
 * the size of the queue.
 */
export const DELAY_CONDONATION_QUEUE_COUNT = DELAY_CONDONATION_QUEUE.length;

export type DelayCondonationFilters = {
  stage: DelayCondonationStage | "all";
  /**
   * Free text over the cause title, the case number and counsel — the same
   * reach the scheduling queue uses. The reference labelled the box "Case
   * Name or Number, Advocate".
   */
  query: string;
};

export const EMPTY_DELAY_CONDONATION_FILTERS: DelayCondonationFilters = {
  stage: "all",
  query: "",
};

export function filterDelayCondonationCases(
  rows: DelayCondonationCase[],
  filters: DelayCondonationFilters,
): DelayCondonationCase[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((entry) => {
    if (filters.stage !== "all" && entry.stage !== filters.stage) return false;
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
