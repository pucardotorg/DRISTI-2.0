/**
 * Today's actions — the bench's paper-only work for the day, as data.
 *
 * These are the actions that move a case forward without any party appearing: taking a
 * registered complaint on file, taking cognizance, deciding the applications that only
 * need the papers. "Today's actions" is the owner's product name (2026-09-01) for what
 * the scheduling discussion calls the async cause list — actions that do not need the
 * presence of parties — which is why the identifiers below say "async". `docs/product/`
 * does not define this list for §138 yet, so this module names the queues and claims
 * nothing more about what deciding one entails.
 *
 * **There is no backend, and nothing here performs a judicial act.** The rows are demo
 * data in the same fixtures the rest of the court side uses — Kollam parties,
 * `CMP/NNNN/YYYY` before a complaint is taken on file, `ST/NNN/YYYY` after. Every count
 * on the screen and the rail is derived from these arrays (`items.length`, summed into
 * `ASYNC_DUE_TOTAL`), never stated separately — so the rail, the section headers and the
 * expanded lists cannot disagree about how much work the day holds.
 */

export type AsyncAction = {
  id: string;
  caseNumber: string;
  /** Shaped like the cause list's parties, so `causeTitle` writes the name one way. */
  parties: { complainant: string; accused: string };
  /** What was filed — carried only by review applications, where the kind is the row. */
  kind?: string;
};

export type AsyncSection = {
  id: "register" | "cognizance" | "applications";
  label: string;
  items: AsyncAction[];
};

export const ASYNC_SECTIONS: AsyncSection[] = [
  {
    id: "register",
    label: "Register cases",
    items: [
      {
        id: "ac-reg-1",
        caseNumber: "CMP/1341/2026",
        parties: { complainant: "Sreelatha Pillai", accused: "Kadavoor Agencies" },
      },
      {
        id: "ac-reg-2",
        caseNumber: "CMP/1342/2026",
        parties: { complainant: "Federal Finance Ltd", accused: "Anoop Krishnan" },
      },
      {
        id: "ac-reg-3",
        caseNumber: "CMP/1345/2026",
        parties: { complainant: "Ragini Varma", accused: "Chaithanya Cashews" },
      },
      {
        id: "ac-reg-4",
        caseNumber: "CMP/1347/2026",
        parties: { complainant: "Mathew Kurian", accused: "Pallithura Traders" },
      },
    ],
  },
  {
    id: "cognizance",
    label: "Take cognizance",
    items: [
      {
        id: "ac-cog-1",
        caseNumber: "CMP/1318/2026",
        parties: { complainant: "Devika Menon", accused: "Kollam Marine Exports" },
      },
      {
        id: "ac-cog-2",
        caseNumber: "CMP/1322/2026",
        parties: { complainant: "Prasanth Babu", accused: "Njarakkal Motors" },
      },
      {
        id: "ac-cog-3",
        caseNumber: "CMP/1326/2026",
        parties: { complainant: "Sunitha Rajan", accused: "K. V. Balan" },
      },
      {
        id: "ac-cog-4",
        caseNumber: "CMP/1328/2026",
        parties: { complainant: "Malabar Credits", accused: "Reji Thomas" },
      },
      {
        id: "ac-cog-5",
        caseNumber: "CMP/1330/2026",
        parties: { complainant: "Harilal", accused: "Sree Durga Jewellers" },
      },
      {
        id: "ac-cog-6",
        caseNumber: "CMP/1333/2026",
        parties: { complainant: "Anvar Sadath", accused: "Kottiyam Hardware" },
      },
    ],
  },
  {
    id: "applications",
    label: "Review applications",
    /* The kinds are the async action types the scheduling discussion names — a
       rescheduling request, a delay condonation, a recall of warrant, a reopening of
       evidence, a mediation report. Delay condonations sit on CMP numbers because they
       are decided before the complaint is taken on file. */
    items: [
      {
        id: "ac-app-1",
        caseNumber: "ST/198/2026",
        parties: { complainant: "Gopan Pillai", accused: "Ashtamudi Seafoods" },
        kind: "Rescheduling request",
      },
      {
        id: "ac-app-2",
        caseNumber: "ST/204/2026",
        parties: { complainant: "Leela Bhavani", accused: "R. S. Traders" },
        kind: "Rescheduling request",
      },
      {
        id: "ac-app-3",
        caseNumber: "ST/226/2026",
        parties: { complainant: "Nikhil Raveendran", accused: "Punalur Granites" },
        kind: "Rescheduling request",
      },
      {
        id: "ac-app-4",
        caseNumber: "CMP/1305/2026",
        parties: { complainant: "Shibu Varghese", accused: "Karunagappally Motors" },
        kind: "Delay condonation",
      },
      {
        id: "ac-app-5",
        caseNumber: "CMP/1312/2026",
        parties: { complainant: "Beena Joseph", accused: "T. K. Sudhakaran" },
        kind: "Delay condonation",
      },
      {
        id: "ac-app-6",
        caseNumber: "ST/171/2026",
        parties: { complainant: "Quilon Finance", accused: "Abdul Rasheed" },
        kind: "Recall of warrant",
      },
      {
        id: "ac-app-7",
        caseNumber: "ST/186/2026",
        parties: { complainant: "Meera Nandakumar", accused: "Chavara Ceramics" },
        kind: "Recall of warrant",
      },
      {
        id: "ac-app-8",
        caseNumber: "ST/152/2026",
        parties: { complainant: "Vinod Chandran", accused: "Neendakara Ice Plant" },
        kind: "Reopening of evidence",
      },
      {
        id: "ac-app-9",
        caseNumber: "ST/163/2026",
        parties: { complainant: "Priya Surendran", accused: "Kundara Textiles" },
        kind: "Submission of mediation report",
      },
    ],
  },
];

/** Everything due on the async list today — the number the rail's row reports. */
export const ASYNC_DUE_TOTAL = ASYNC_SECTIONS.reduce(
  (sum, section) => sum + section.items.length,
  0,
);

/** The queue behind one of the hub's buttons, or undefined for a URL that names none. */
export function asyncSectionById(id: string): AsyncSection | undefined {
  return ASYNC_SECTIONS.find((section) => section.id === id);
}
