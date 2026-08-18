/**
 * SANDBOX DATA — the seed the front end runs on until a tasks service exists.
 *
 * Five people and their cases from the advocate home screen, and ~35 tasks that between
 * them touch every kind, every urgency band, every status and every permission edge the
 * screens must handle. Dates are relative to *today*, so the seed never goes stale.
 * Nothing here has been sent to a real court.
 */

import type { Case, Person, Task } from "./types";

/* ───────────────────────────── people ───────────────────────────── */

export const PEOPLE: Person[] = [
  { id: "p-an", name: "Anjali Nair", initials: "AN", role: "senior" },
  { id: "p-sp", name: "S. Prakash", initials: "SP", role: "junior" },
  { id: "p-dv", name: "Deepa Varghese", initials: "DV", role: "senior" },
  { id: "p-rm", name: "R. Manoj", initials: "RM", role: "senior" },
  { id: "p-ri", name: "Rahul Iyer", initials: "RI", role: "clerk" },
];

/** Who the sandbox signs in as until the account menu says otherwise. */
export const DEFAULT_USER_ID = "p-an";

/* ───────────────────────────── dates ───────────────────────────── */

const DAY = 24 * 60 * 60 * 1000;

/** `days` from today at a given hour (local). Negative days are in the past. */
function at(days: number, hour = 17, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + days * DAY).toISOString();
}

/** A hearing: 10:30 on that day. */
function hearing(days: number): string {
  return at(days, 10, 30);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ───────────────────────────── cases ───────────────────────────── */

const ON = "24×7 ON Court, Kollam";
const JMFC1 = "JMFC Court 1, Kollam";
const JMFC2 = "JMFC Court 2, Kollam";
const CJM = "CJM Court, Kollam";

// Vakalatnamas: Anjali is a signatory on some, only a member on some, and absent from
// three (217, 71, 377) — tasks on those must never appear when viewing as her.
export const CASES: Case[] = [
  { id: "c-412", stNumber: "ST 412/2025", cnr: "KLKL01-000412-2025", parties: "Sreekumar N. v. Vismaya Traders", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(2), signatories: ["p-an", "p-rm"], members: ["p-sp", "p-ri"] },
  { id: "c-88", stNumber: "ST 88/2026", cnr: "KLKL01-000088-2026", parties: "Fathima Beevi v. Anil Kumar K.", court: ON, stage: "Plea", nextHearingAt: hearing(1), signatories: ["p-an"], members: ["p-ri"] },
  { id: "c-941", stNumber: "ST 941/2025", cnr: "KLKL01-000941-2025", parties: "Anitha Joseph v. Latheef M.", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(9), signatories: ["p-dv"], members: ["p-an", "p-sp"] },
  { id: "c-1102", stNumber: "ST 1102/2026", cnr: "KLKL01-001102-2026", parties: "Nirmala T. v. Ashique P.", court: ON, stage: "Appearance", nextHearingAt: hearing(16), signatories: ["p-rm"], members: ["p-an", "p-ri"] },
  { id: "c-217", stNumber: "ST 217/2025", cnr: "KLKL02-000217-2025", parties: "Suresh Babu v. Kairali Motors", court: JMFC1, stage: "Appearance", nextHearingAt: hearing(5), signatories: ["p-rm", "p-dv"], members: [] },
  { id: "c-509", stNumber: "ST 509/2025", cnr: "KLKL02-000509-2025", parties: "Lakshmi Menon v. P. J. Thomas", court: JMFC1, stage: "Evidence of the complainant", nextHearingAt: hearing(12), signatories: ["p-an"], members: ["p-sp"] },
  { id: "c-144", stNumber: "ST 144/2025", cnr: "KLKL02-000144-2025", parties: "K. Radhakrishnan v. Chandy & Sons", court: JMFC1, stage: "Arguments", nextHearingAt: hearing(20), signatories: ["p-an", "p-dv"], members: ["p-sp", "p-ri"] },
  { id: "c-71", stNumber: "ST 71/2025", cnr: "KLKL03-000071-2025", parties: "Joseph Mathew v. Star Traders", court: JMFC2, stage: "Evidence of the complainant", nextHearingAt: hearing(7), signatories: ["p-dv"], members: ["p-ri"] },
  { id: "c-381", stNumber: "ST 381/2025", cnr: "KLKL03-000381-2025", parties: "Rukhiya Beevi v. N. Pillai", court: JMFC2, stage: "Stage not recorded", nextHearingAt: hearing(30), signatories: ["p-an"], members: [] },
  { id: "c-52", stNumber: "ST 52/2025", cnr: "KLKL04-000052-2025", parties: "Shaji P. v. Kollam Cashew Co.", court: CJM, stage: "Evidence of the complainant", nextHearingAt: hearing(3), signatories: ["p-dv", "p-an"], members: ["p-sp", "p-ri"] },
  { id: "c-221", stNumber: "ST 221/2025", cnr: "KLKL01-000221-2025", parties: "Ramesh P. v. Coastal Traders", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(18), signatories: ["p-rm"], members: ["p-an", "p-sp"] },
  { id: "c-377", stNumber: "ST 377/2025", cnr: "KLKL01-000377-2025", parties: "Sujatha R. v. M. Haneefa", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(25), signatories: ["p-rm"], members: ["p-ri"] },
  { id: "c-633", stNumber: "ST 633/2025", cnr: "KLKL01-000633-2025", parties: "Sheeba Rasheed v. Muhammed Ashraf", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(4), signatories: ["p-rm"], members: ["p-an", "p-sp"] },
  { id: "c-702", stNumber: "ST 702/2025", cnr: "KLKL02-000702-2025", parties: "Manoj Kurian v. Highrange Estates", court: JMFC1, stage: "Evidence of the complainant", nextHearingAt: hearing(3), signatories: ["p-an"], members: ["p-ri"] },
  { id: "c-815", stNumber: "ST 815/2025", cnr: "KLKL04-000815-2025", parties: "Vinod Chandran v. Sabari Traders", court: CJM, stage: "Arguments", nextHearingAt: hearing(10), signatories: ["p-an", "p-dv"], members: [] },
  { id: "c-1044", stNumber: "ST 1044/2026", cnr: "KLKL03-001044-2026", parties: "Beena Thomas v. A. Salim", court: JMFC2, stage: "Appearance", nextHearingAt: hearing(22), signatories: ["p-dv"], members: ["p-an"] },
  // Two matters before filing — no ST number, no CNR yet; the statutory clocks live here.
  { id: "c-sainaba", stNumber: "", cnr: "", parties: "Sainaba K. v. Riyas M.", court: ON, stage: "Pre-filing", signatories: ["p-an"], members: ["p-sp"] },
  { id: "c-arun", stNumber: "", cnr: "", parties: "Arun K. v. Meera Enterprises", court: ON, stage: "Pre-filing", signatories: ["p-an"], members: [] },
];

/* ───────────────────────────── tasks ───────────────────────────── */

type Seed = Omit<Task, "history" | "createdAt" | "isBlocking" | "requiresSignatory" | "systemObservable"> & {
  createdAt?: string;
  history?: Task["history"];
  isBlocking?: boolean;
  requiresSignatory?: boolean;
  systemObservable?: boolean;
};

const FINALISING = new Set<Task["kind"]>(["sign", "pay", "submit", "fix-defects"]);

/** Fill the defaults the kind implies, and open every task with a "created" line. */
function task(seed: Seed): Task {
  const createdAt = seed.createdAt ?? seed.why.at;
  const requiresSignatory = seed.requiresSignatory ?? FINALISING.has(seed.kind);
  const systemObservable = seed.systemObservable ?? FINALISING.has(seed.kind);
  return {
    ...seed,
    isBlocking: seed.isBlocking ?? !!seed.blocksHearingAt,
    createdAt,
    requiresSignatory,
    systemObservable,
    history: seed.history ?? [{ at: createdAt, text: `Created — ${seed.why.event}` }],
  };
}

const RUPEE = 100;

export function buildTasks(): Task[] {
  const created = (days: number, event: string) => ({ event, at: at(days, 11) });

  return [
    /* ── Overdue ─────────────────────────────────────────────────── */
    task({
      id: "t-fee412",
      caseId: "c-412",
      kind: "pay",
      title: "Pay the ₹2 process fee",
      why: created(-43, "Summons issued to the accused — process fee payable for service by post"),
      whatToDo: "Pay the process fee so the registry can dispatch the summons. The receipt attaches to the case file.",
      amountPaise: 2 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(-41),
      dueKind: "court-set",
      deadlineNote: `Order dated ${shortDate(at(-43))}: process fee to be paid within 2 days`,
      blocksHearingAt: hearing(2),
      status: "open",
    }),
    task({
      id: "t-affidavit509",
      caseId: "c-509",
      kind: "submit",
      title: "File the proof affidavit of the complainant",
      why: created(-34, "Order dated " + shortDate(at(-34)) + " — complainant to file proof affidavit in lieu of chief examination"),
      whatToDo: "Prepare the affidavit from the complaint, have it sworn before a notary, and file it with the annexures.",
      documentsNeeded: ["Proof affidavit (sworn)", "Annexure list"],
      dueAt: at(-20),
      dueKind: "court-set",
      deadlineNote: `Order dated ${shortDate(at(-34))}: file within two weeks`,
      assigneeId: "p-sp",
      status: "open",
    }),
    task({
      id: "t-vakalat633",
      caseId: "c-633",
      kind: "sign",
      title: "Sign the vakalatnama for the additional complainant",
      why: created(-9, "The additional complainant was impleaded by order dated " + shortDate(at(-9))),
      whatToDo: "The vakalatnama for the additional complainant needs the advocate's signature before the next posting.",
      documentsNeeded: ["Vakalatnama (additional complainant)"],
      dueAt: at(-7),
      dueKind: "court-set",
      deadlineNote: "To be filed within 2 days of the impleading order",
      assigneeId: "p-rm",
      status: "open",
    }),
    task({
      id: "t-defect412",
      caseId: "c-412",
      kind: "fix-defects",
      title: "Fix 2 defects — condonation of delay application",
      why: created(-6, "Scrutiny returned the application to condone delay with 2 defects"),
      whatToDo: "Cure each defect, attach the corrected document where one is needed, and re-submit.",
      documentsNeeded: ["Affidavit in support (attested)", "Postal acknowledgement"],
      dueAt: at(-4),
      dueKind: "court-set",
      deadlineNote: "Registry: cure within 2 days of return",
      blocksHearingAt: hearing(2),
      assigneeId: "p-sp",
      status: "open",
      defects: [
        { n: 1, text: "Affidavit in support is not attested by a notary.", fixed: false },
        { n: 2, text: "Copy of the postal acknowledgement referred to in para 4 is not produced.", fixed: false },
      ],
    }),
    task({
      id: "t-memo88",
      caseId: "c-88",
      kind: "submit",
      title: "Upload the certified copy of the bank's return memo",
      why: created(-10, "Order dated " + shortDate(at(-10)) + " — complainant to produce the certified return memo before the plea is recorded"),
      whatToDo: "Obtain the certified copy from the bank and upload it. The original is produced at the hearing.",
      documentsNeeded: ["Certified copy of the return memo"],
      dueAt: at(-2),
      dueKind: "before-hearing",
      deadlineNote: "Before the posting for recording the plea",
      blocksHearingAt: hearing(1),
      status: "open",
    }),

    /* ── Due today ────────────────────────────────────────────────── */
    task({
      id: "t-pw2-412",
      caseId: "c-412",
      kind: "submit",
      title: "Upload the chief affidavit of PW-2",
      why: created(-12, "Order dated " + shortDate(at(-12)) + " — complainant directed to keep PW-2 present on the next posting"),
      whatToDo: "Upload the sworn chief affidavit of PW-2 so it is on record before the witness is examined.",
      documentsNeeded: ["Chief affidavit of PW-2"],
      dueAt: at(0),
      dueKind: "before-hearing",
      deadlineNote: `Order dated ${shortDate(at(-12))}: produce before the next posting`,
      blocksHearingAt: hearing(2),
      assigneeId: "p-an",
      status: "open",
    }),

    /* ── Due soon ─────────────────────────────────────────────────── */
    task({
      id: "t-sign88",
      caseId: "c-88",
      kind: "sign",
      title: "Sign the affidavit of the complainant (chief examination)",
      why: created(-5, "Affidavit prepared for the plea posting on " + shortDate(hearing(1))),
      whatToDo: "Read the affidavit and e-sign it. It is filed as soon as it is signed.",
      documentsNeeded: ["Affidavit of the complainant"],
      dueAt: at(1, 9),
      dueKind: "before-hearing",
      deadlineNote: "Before the posting on " + shortDate(hearing(1)),
      blocksHearingAt: hearing(1),
      assigneeId: "p-an",
      status: "open",
    }),
    task({
      id: "t-payfailed702",
      caseId: "c-702",
      kind: "pay",
      title: "Pay the ₹200 process fee for the witness summons",
      why: created(-3, "Summons ordered to PW-3 by order dated " + shortDate(at(-3))),
      whatToDo: "Pay the process fee so the summons can go out before the evidence posting.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(1),
      dueKind: "court-set",
      deadlineNote: "Registry: pay within 3 days of the order",
      blocksHearingAt: hearing(3),
      assigneeId: "p-an",
      status: "open",
      statusNote: "Payment failed — try again",
      lastPayment: { result: "failed", ref: "TXN-9F2KQ7HM3X", at: at(-1, 15) },
      history: [
        { at: at(-3, 11), text: "Created — summons ordered to PW-3" },
        { at: at(-1, 15), by: "p-an", text: "Payment failed (ref TXN-9F2KQ7HM3X) — the task stays open" },
      ],
    }),
    task({
      id: "t-submit52",
      caseId: "c-52",
      kind: "submit",
      title: "Upload the bank's statement of account for the cheque period",
      why: created(-8, "Order dated " + shortDate(at(-8)) + " — complainant to produce the account statement"),
      whatToDo: "Upload the statement covering the cheque date and the return, certified by the bank.",
      documentsNeeded: ["Statement of account (certified)", "Bank certificate under the Bankers' Books Evidence Act"],
      dueAt: at(2),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting on " + shortDate(hearing(3)),
      blocksHearingAt: hearing(3),
      assigneeId: "p-an",
      status: "in-progress",
      files: [{ id: "seed-f-stmt", name: "statement-jan-mar.pdf", size: 184_204, type: "application/pdf", ext: "PDF" }],
      history: [
        { at: at(-8, 11), text: "Created — order to produce the account statement" },
        { at: at(-1, 16), by: "p-an", text: "Anjali Nair started this task" },
        { at: at(-1, 16, 20), by: "p-an", text: "Anjali Nair saved a draft" },
      ],
    }),
    task({
      id: "t-appear52",
      caseId: "c-52",
      kind: "appear",
      title: "Keep PW-1 present for cross-examination",
      why: created(-15, "Order dated " + shortDate(at(-15)) + " — complainant to keep PW-1 present on the next posting"),
      whatToDo: "Confirm PW-1 attends the posting; mark done once they have been produced.",
      dueAt: hearing(3),
      dueKind: "before-hearing",
      deadlineNote: "The posting on " + shortDate(hearing(3)),
      blocksHearingAt: hearing(3),
      assigneeId: "p-dv",
      status: "open",
    }),
    task({
      id: "t-lostaccess88",
      caseId: "c-88",
      kind: "respond",
      title: "Reply to the accused's application for adjournment",
      why: created(-2, "The accused filed an application for adjournment on " + shortDate(at(-2))),
      whatToDo: "File a reply, or record no objection, before the posting.",
      dueAt: at(2),
      dueKind: "court-set",
      deadlineNote: "Reply before the posting on " + shortDate(hearing(1)),
      // Deepa no longer has access to this case — the row must read as Unassigned.
      assigneeId: "p-dv",
      status: "open",
    }),
    task({
      id: "t-redated633",
      caseId: "c-633",
      kind: "submit",
      title: "Produce the original cheque and return memo",
      why: created(-14, "Order dated " + shortDate(at(-14)) + " — originals to be produced at the evidence posting"),
      whatToDo: "Upload scans now; the originals are marked at the hearing.",
      documentsNeeded: ["Original cheque (scan)", "Return memo (scan)"],
      dueAt: at(3),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting",
      blocksHearingAt: hearing(4),
      assigneeId: "p-sp",
      status: "open",
      redate: { from: at(-3), to: at(3), reason: "hearing adjourned to " + shortDate(hearing(4)), at: at(-3, 13) },
      history: [
        { at: at(-14, 11), text: "Created — order to produce the originals" },
        { at: at(-3, 13), text: `Due date moved from ${shortDate(at(-3))} to ${shortDate(at(3))} — hearing adjourned to ${shortDate(hearing(4))}` },
      ],
    }),
    task({
      id: "t-sentback941",
      caseId: "c-941",
      kind: "submit",
      title: "File the affidavit in lieu of chief examination",
      why: created(-6, "Order dated " + shortDate(at(-6)) + " — complainant to file the affidavit in lieu of chief"),
      whatToDo: "Prepare the affidavit, have it sworn, and file it before the evidence posting.",
      documentsNeeded: ["Affidavit in lieu of chief examination (sworn)"],
      dueAt: at(4),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting on " + shortDate(hearing(9)),
      assigneeId: "p-an",
      status: "sent-back",
      statusNote: "The affidavit must be sworn before a notary — attach the attested copy.",
      approval: {
        preparedBy: "p-an",
        sentAt: at(-3, 12),
        note: "Draft affidavit attached; sworn copy to follow.",
        prepared: { note: "Draft affidavit attached; sworn copy to follow." },
        decidedBy: "p-dv",
        decidedAt: at(-1, 10),
        decision: "sent-back",
        decisionNote: "The affidavit must be sworn before a notary — attach the attested copy.",
      },
      history: [
        { at: at(-6, 11), text: "Created — order to file the affidavit in lieu of chief" },
        { at: at(-3, 12), by: "p-an", text: "Anjali Nair sent this for approval — “Draft affidavit attached; sworn copy to follow.”" },
        { at: at(-1, 10), by: "p-dv", text: "Deepa Varghese sent this back — “The affidavit must be sworn before a notary — attach the attested copy.”" },
      ],
    }),
    task({
      id: "t-photocopy412",
      caseId: "c-412",
      kind: "pay",
      title: "Pay the office photocopy charges for the certified copy",
      why: created(-4, "Certified copy of the order dated " + shortDate(at(-12)) + " is ready — copying charges payable"),
      whatToDo: "Pay the copying charges and collect the certified copy from the copy section.",
      amountPaise: 45 * RUPEE,
      feeHead: "Certified-copy fee",
      dueAt: at(5),
      dueKind: "court-set",
      deadlineNote: "Copy section: collect within 7 days of the ready notice",
      assigneeId: "p-an",
      status: "open",
    }),
    task({
      id: "t-approve-proof144",
      caseId: "c-144",
      kind: "sign",
      title: "Sign the proof affidavit of the complainant",
      why: created(-7, "Order dated " + shortDate(at(-7)) + " — proof affidavit to be filed before final arguments"),
      whatToDo: "Read the affidavit S. Prakash prepared; approve and sign, or send it back with what to change.",
      documentsNeeded: ["Proof affidavit"],
      dueAt: at(6),
      dueKind: "before-hearing",
      deadlineNote: "Before the arguments posting on " + shortDate(hearing(20)),
      assigneeId: "p-sp",
      status: "awaiting-approval",
      approval: {
        preparedBy: "p-sp",
        sentAt: at(-2, 16),
        note: "Affidavit drafted from the complaint; para 6 updated with the return memo date.",
        prepared: { note: "Affidavit drafted from the complaint; para 6 updated with the return memo date." },
      },
      history: [
        { at: at(-7, 11), text: "Created — order to file the proof affidavit" },
        { at: at(-4, 10), by: "p-sp", text: "S. Prakash started preparing" },
        { at: at(-2, 16), by: "p-sp", text: "S. Prakash sent this for approval — “Affidavit drafted from the complaint; para 6 updated with the return memo date.”" },
      ],
    }),
    task({
      id: "t-approve-pay52",
      caseId: "c-52",
      kind: "pay",
      title: "Pay the application fee for the petition to recall PW-1",
      why: created(-3, "Petition to recall PW-1 drafted; application fee payable on filing"),
      whatToDo: "Rahul Iyer has prepared the fee challan. Approve to pay it, or send it back.",
      amountPaise: 50 * RUPEE,
      feeHead: "Application fee",
      dueAt: at(2),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting on " + shortDate(hearing(3)),
      blocksHearingAt: hearing(3),
      assigneeId: "p-ri",
      status: "awaiting-approval",
      approval: {
        preparedBy: "p-ri",
        sentAt: at(-1, 11),
        note: "Challan prepared under the application-fee head; petition attached.",
        prepared: { note: "Challan prepared under the application-fee head; petition attached." },
      },
      history: [
        { at: at(-3, 11), text: "Created — application fee on the recall petition" },
        { at: at(-1, 11), by: "p-ri", text: "Rahul Iyer sent this for approval — “Challan prepared under the application-fee head; petition attached.”" },
      ],
    }),
    task({
      id: "t-statutory-complaint",
      caseId: "c-sainaba",
      kind: "submit",
      title: "File the §138 complaint",
      why: created(-24, "The 15-day notice period ended on " + shortDate(at(-24)) + " without payment — cause of action arose"),
      whatToDo: "File the complaint with the cheque, return memo, notice, postal receipts and the affidavit.",
      documentsNeeded: ["Complaint", "Cheque and return memo", "Demand notice with postal proof", "Complainant's affidavit"],
      dueAt: at(6),
      dueKind: "statutory",
      deadlineNote: "Section 142(1)(b) NI Act — within one month of the cause of action",
      assigneeId: "p-sp",
      status: "open",
    }),

    /* ── Later ─────────────────────────────────────────────────────── */
    task({
      id: "t-draft1102",
      caseId: "c-1102",
      kind: "pay",
      title: "Pay the ₹200 process fee for the fresh notice to the accused",
      why: created(-2, "Order dated " + shortDate(at(-2)) + " — fresh notice to issue; process fee payable"),
      whatToDo: "Prepare the fee for R. Manoj to approve — the process fee for service by registered post.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(8),
      dueKind: "court-set",
      deadlineNote: "Registry: pay within 10 days of the order",
      assigneeId: "p-an",
      status: "draft",
      approval: { preparedBy: "p-an", sentAt: "", prepared: { note: "Speed post to the accused's Kollam address." } },
      history: [
        { at: at(-2, 11), text: "Created — fresh notice ordered" },
        { at: at(0, 9), by: "p-an", text: "Anjali Nair started preparing" },
        { at: at(0, 9, 5), by: "p-an", text: "Anjali Nair saved a draft" },
      ],
    }),
    task({
      id: "t-respond221",
      caseId: "c-221",
      kind: "respond",
      title: "Respond to the accused's application under §145(2) to recall PW-1",
      why: created(-1, "The accused filed an application under §145(2) NI Act on " + shortDate(at(-1))),
      whatToDo: "File objections, if any, before the posting.",
      dueAt: at(9),
      dueKind: "court-set",
      deadlineNote: "Objections within 10 days of service",
      assigneeId: "p-rm",
      status: "open",
    }),
    task({
      id: "t-statutory-notice",
      caseId: "c-arun",
      kind: "other",
      title: "Send the demand notice under §138(b)",
      why: created(-18, "Cheque returned unpaid — memo dated " + shortDate(at(-18))),
      whatToDo: "Send the written demand by registered post within 30 days of the return memo; keep the postal receipt.",
      dueAt: at(12),
      dueKind: "statutory",
      deadlineNote: "Section 138(b) NI Act — within 30 days of the return memo",
      assigneeId: "p-an",
      status: "open",
    }),
    task({
      id: "t-later1044",
      caseId: "c-1044",
      kind: "submit",
      title: "File the list of documents relied upon",
      why: created(-3, "Order dated " + shortDate(at(-3)) + " — complainant to file the list of documents"),
      whatToDo: "List every document relied on and file it with copies.",
      documentsNeeded: ["List of documents", "Copies of each document"],
      dueAt: at(15),
      dueKind: "court-set",
      deadlineNote: "Within three weeks of the order",
      status: "open",
    }),
    task({
      id: "t-later941",
      caseId: "c-941",
      kind: "pay",
      title: "Pay the ₹2 process fee for the summons to PW-3",
      why: created(-2, "Summons ordered to PW-3 by order dated " + shortDate(at(-2))),
      whatToDo: "Pay the process fee so the summons can go out.",
      amountPaise: 2 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(20),
      dueKind: "court-set",
      deadlineNote: "Before the next posting",
      assigneeId: "p-sp",
      status: "open",
    }),

    /* ── No date ───────────────────────────────────────────────────── */
    task({
      id: "t-collect144",
      caseId: "c-144",
      kind: "other",
      title: "Collect the certified copy of the order dated " + shortDate(at(-9)),
      why: created(-1, "Copy section marked the certified copy ready on " + shortDate(at(-1))),
      whatToDo: "Collect it from the copy section; no date was fixed.",
      dueKind: "none",
      status: "open",
    }),

    /* ── Long pending ──────────────────────────────────────────────── */
    task({
      id: "t-longpending509",
      caseId: "c-509",
      kind: "other",
      title: "Collect the returned summons from the registry",
      why: created(-63, "Summons to the accused returned unserved on " + shortDate(at(-63))),
      whatToDo: "Collect the returned cover and note the postal endorsement for the fresh summons application.",
      dueAt: at(-60),
      dueKind: "court-set",
      deadlineNote: "Registry: collect within 3 days",
      status: "open",
    }),
    task({
      id: "t-longpending381",
      caseId: "c-381",
      kind: "pay",
      title: "Pay the ₹2 process fee for the summons to the accused (second attempt)",
      why: created(-54, "Fresh summons ordered on " + shortDate(at(-54))),
      whatToDo: "Pay the process fee for the second attempt at service.",
      amountPaise: 2 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(-52),
      dueKind: "court-set",
      deadlineNote: "Registry: pay within 2 days of the order",
      assigneeId: "p-ri",
      status: "open",
    }),

    /* ── Waiting ───────────────────────────────────────────────────── */
    task({
      id: "t-sent1102",
      caseId: "c-1102",
      kind: "submit",
      title: "File the list of witnesses",
      why: created(-6, "Order dated " + shortDate(at(-6)) + " — complainant to file the list of witnesses"),
      whatToDo: "List each witness with what they speak to.",
      documentsNeeded: ["List of witnesses"],
      dueAt: at(9),
      dueKind: "before-hearing",
      deadlineNote: "Before the appearance posting on " + shortDate(hearing(16)),
      assigneeId: "p-an",
      status: "awaiting-approval",
      approval: {
        preparedBy: "p-an",
        sentAt: at(-2, 15),
        note: "Three witnesses; the bank officer is PW-3.",
        prepared: { note: "Three witnesses; the bank officer is PW-3." },
      },
      history: [
        { at: at(-6, 11), text: "Created — order to file the list of witnesses" },
        { at: at(-2, 15), by: "p-an", text: "Anjali Nair sent this for approval — “Three witnesses; the bank officer is PW-3.”" },
      ],
    }),
    task({
      id: "t-sent221",
      caseId: "c-221",
      kind: "pay",
      title: "Pay the ₹200 process fee for the fresh summons",
      why: created(-7, "Fresh summons ordered on " + shortDate(at(-7)) + " after the first returned unserved"),
      whatToDo: "Pay the process fee for service by registered post.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(3),
      dueKind: "court-set",
      deadlineNote: "Registry: pay within 10 days of the order",
      assigneeId: "p-an",
      status: "awaiting-approval",
      approval: {
        preparedBy: "p-an",
        sentAt: at(-5, 12),
        prepared: { note: "" },
      },
      history: [
        { at: at(-7, 11), text: "Created — fresh summons ordered" },
        { at: at(-5, 12), by: "p-an", text: "Anjali Nair sent this for approval" },
      ],
    }),
    task({
      id: "t-sent52",
      caseId: "c-52",
      kind: "sign",
      title: "Sign the memo of calculation of interest due",
      why: created(-4, "Memo of calculation prepared for the evidence posting"),
      whatToDo: "The memo needs a signatory's signature before filing.",
      documentsNeeded: ["Memo of calculation"],
      dueAt: at(2),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting on " + shortDate(hearing(3)),
      assigneeId: "p-an",
      status: "awaiting-approval",
      approval: {
        preparedBy: "p-an",
        sentAt: at(-1, 17),
        note: "Interest at 9% from the cheque date to today.",
        prepared: { note: "Interest at 9% from the cheque date to today." },
      },
      history: [
        { at: at(-4, 11), text: "Created — memo prepared for filing" },
        { at: at(-1, 17), by: "p-an", text: "Anjali Nair sent this for approval — “Interest at 9% from the cheque date to today.”" },
        { at: at(0, 8), text: "Anjali Nair was added to the vakalatnama — she may now sign, but not approve her own preparation" },
      ],
    }),
    task({
      id: "t-payconfirm381",
      caseId: "c-381",
      kind: "pay",
      title: "Pay the ₹500 certified-copy fee",
      why: created(-2, "Certified copy of the deposition applied for on " + shortDate(at(-2))),
      whatToDo: "Pay the copying fee; the copy is ready once the fee is confirmed.",
      amountPaise: 500 * RUPEE,
      feeHead: "Certified-copy fee",
      dueAt: at(10),
      dueKind: "court-set",
      deadlineNote: "Copy section: pay within 14 days of the application",
      assigneeId: "p-an",
      status: "payment-confirming",
      statusNote: "Payment confirming · ref TXN-4Q8VN2KJ7P",
      lastPayment: { result: "pending", ref: "TXN-4Q8VN2KJ7P", at: at(0, 9, 40) },
      history: [
        { at: at(-2, 11), text: "Created — certified copy applied for" },
        { at: at(0, 9, 40), by: "p-an", text: "Anjali Nair paid — gateway is confirming (ref TXN-4Q8VN2KJ7P)" },
      ],
    }),
    task({
      id: "t-awaitcourt815",
      caseId: "c-815",
      kind: "submit",
      title: "File the written arguments",
      why: created(-9, "Order dated " + shortDate(at(-9)) + " — parties to file written arguments"),
      whatToDo: "File the written arguments with the list of authorities.",
      documentsNeeded: ["Written arguments", "List of authorities"],
      dueAt: at(8),
      dueKind: "court-set",
      deadlineNote: "Within two weeks of the order",
      assigneeId: "p-an",
      status: "awaiting-court",
      files: [{ id: "seed-f-args", name: "written-arguments.pdf", size: 402_118, type: "application/pdf", ext: "PDF" }],
      history: [
        { at: at(-9, 11), text: "Created — order to file written arguments" },
        { at: at(-1, 14), by: "p-an", text: "Anjali Nair submitted to the court — awaiting scrutiny" },
      ],
    }),

    /* ── Done ──────────────────────────────────────────────────────── */
    task({
      id: "t-done412",
      caseId: "c-412",
      kind: "pay",
      title: "Pay the ₹40 certified-copy fee for the order dated " + shortDate(at(-12)),
      why: created(-6, "Certified copy applied for"),
      whatToDo: "Pay the copying fee.",
      amountPaise: 40 * RUPEE,
      feeHead: "Certified-copy fee",
      dueAt: at(-1),
      dueKind: "court-set",
      assigneeId: "p-an",
      status: "done",
      lastPayment: { result: "success", ref: "TXN-8K2M4Q7A1Z", at: at(-3, 12) },
      completion: { by: "p-an", at: at(-3, 12), how: "event", receipt: "TXN-8K2M4Q7A1Z" },
      history: [
        { at: at(-6, 11), text: "Created — certified copy applied for" },
        { at: at(-3, 12), by: "p-an", text: "Anjali Nair paid — receipt TXN-8K2M4Q7A1Z" },
      ],
    }),
    task({
      id: "t-donemanual509",
      caseId: "c-509",
      kind: "appear",
      title: "Keep PW-1 present for chief examination",
      why: created(-20, "Order dated " + shortDate(at(-20)) + " — complainant to keep PW-1 present"),
      whatToDo: "Produce PW-1 at the posting.",
      dueAt: at(-8),
      dueKind: "before-hearing",
      assigneeId: "p-sp",
      status: "done",
      completion: { by: "p-sp", at: at(-8, 12), how: "manual" },
      history: [
        { at: at(-20, 11), text: "Created — order to keep PW-1 present" },
        { at: at(-8, 12), by: "p-sp", text: "S. Prakash marked this done" },
      ],
    }),
    task({
      id: "t-expired509",
      caseId: "c-509",
      kind: "fix-defects",
      title: "Fix 1 defect — application to recall the complainant",
      why: created(-13, "Scrutiny returned the application to recall the complainant with 1 defect"),
      whatToDo: "Cure the defect and re-submit within the registry's window.",
      dueAt: at(-6),
      dueKind: "court-set",
      deadlineNote: "Registry: cure within 7 days of return",
      status: "expired",
      statusNote: `The 7-day cure window closed on ${shortDate(at(-6))} and the registry rejected the application. File a fresh application if it is still needed.`,
      defects: [{ n: 1, text: "Court fee stamp of ₹5 not affixed.", fixed: false }],
      history: [
        { at: at(-13, 11), text: "Created — scrutiny returned the filing with 1 defect" },
        { at: at(-6, 18), text: `Expired — the 7-day cure window closed on ${shortDate(at(-6))} and the registry rejected the application` },
      ],
    }),
    task({
      id: "t-obsolete52",
      caseId: "c-52",
      kind: "respond",
      title: "Respond to the accused's petition for production of documents",
      why: created(-9, "The accused filed a petition for production of documents on " + shortDate(at(-9))),
      whatToDo: "File objections before the posting.",
      dueAt: at(1),
      dueKind: "court-set",
      status: "obsolete",
      statusNote: `Order withdrawn on ${shortDate(at(-2))} — the petition was dismissed as not pressed; no response is required.`,
      history: [
        { at: at(-9, 11), text: "Created — petition for production of documents" },
        { at: at(-2, 12), text: `No longer required — order withdrawn on ${shortDate(at(-2))}; petition dismissed as not pressed` },
      ],
    }),

    /* ── On cases Anjali cannot see ────────────────────────────────── */
    task({
      id: "t-217fee",
      caseId: "c-217",
      kind: "pay",
      title: "Pay the ₹2 process fee for the summons to the accused",
      why: created(-3, "Summons ordered on " + shortDate(at(-3))),
      whatToDo: "Pay the process fee.",
      amountPaise: 2 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(2),
      dueKind: "court-set",
      blocksHearingAt: hearing(5),
      assigneeId: "p-rm",
      status: "open",
    }),
    task({
      id: "t-71sign",
      caseId: "c-71",
      kind: "sign",
      title: "Sign the affidavit of the complainant",
      why: created(-4, "Affidavit prepared for the evidence posting"),
      whatToDo: "Read and e-sign the affidavit.",
      documentsNeeded: ["Affidavit of the complainant"],
      dueAt: at(5),
      dueKind: "before-hearing",
      blocksHearingAt: hearing(7),
      assigneeId: "p-dv",
      status: "open",
    }),
    task({
      id: "t-377respond",
      caseId: "c-377",
      kind: "respond",
      title: "Respond to the accused's application for time",
      why: created(-1, "Application for time filed on " + shortDate(at(-1))),
      whatToDo: "Record no objection or file a reply.",
      dueAt: at(6),
      dueKind: "court-set",
      assigneeId: "p-ri",
      status: "open",
    }),
  ];
}
