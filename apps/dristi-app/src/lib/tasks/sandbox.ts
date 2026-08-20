/**
 * SANDBOX DATA — the seed the front end runs on until a tasks service exists.
 *
 * Five advocates and their cases, and ~40 tasks that between them touch every kind,
 * every status, every view and every permission edge the screens must handle. Dates are
 * relative to *today*, so the seed never goes stale. Windows and closure rules follow
 * DRISTI 1.0's pending-task inventory: scrutiny returns cure in 3 days, payment tasks
 * auto-close when the hearing they serve passes, response tasks close when the court
 * decides the application. Nothing here has been sent to a real court.
 */

import type { Case, Person, Task } from "./types";

/** Bump when the seed's shape changes; a browser holding an older seed is re-seeded. */
export const SEED_VERSION = 4;

/* ───────────────────────────── people ───────────────────────────── */

export const PEOPLE: Person[] = [
  { id: "p-an", name: "Anjali Nair", initials: "AN", role: "senior" },
  { id: "p-sp", name: "S. Prakash", initials: "SP", role: "junior" },
  { id: "p-dv", name: "Deepa Varghese", initials: "DV", role: "senior" },
  { id: "p-rm", name: "R. Manoj", initials: "RM", role: "senior" },
  { id: "p-ri", name: "Rahul Iyer", initials: "RI", role: "junior" },
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

// Vakalatnamas: the first signatory is the main advocate. Anjali (the default identity)
// is a signatory on some cases, only on the case on others, and absent from a few.
export const CASES: Case[] = [
  { id: "c-412", stNumber: "ST 412/2025", cnr: "KLKL01-000412-2025", parties: "Sreekumar N. v. Vismaya Traders", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(2), signatories: ["p-an", "p-rm"], advocates: ["p-an", "p-rm", "p-sp"] },
  { id: "c-88", stNumber: "ST 88/2026", cnr: "KLKL01-000088-2026", parties: "Fathima Beevi v. Anil Kumar K.", court: ON, stage: "Plea", nextHearingAt: hearing(1), signatories: ["p-an"], advocates: ["p-an", "p-ri"] },
  { id: "c-941", stNumber: "ST 941/2025", cnr: "KLKL01-000941-2025", parties: "Anitha Joseph v. Latheef M.", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(9), signatories: ["p-dv"], advocates: ["p-dv", "p-an", "p-sp"] },
  { id: "c-1102", stNumber: "ST 1102/2026", cnr: "KLKL01-001102-2026", parties: "Nirmala T. v. Ashique P.", court: ON, stage: "Appearance", nextHearingAt: hearing(16), signatories: ["p-rm"], advocates: ["p-rm", "p-an"] },
  { id: "c-217", stNumber: "ST 217/2025", cnr: "KLKL02-000217-2025", parties: "Suresh Babu v. Kairali Motors", court: JMFC1, stage: "Plea", nextHearingAt: hearing(5), signatories: ["p-rm", "p-dv"], advocates: ["p-rm", "p-dv"] },
  { id: "c-509", stNumber: "ST 509/2025", cnr: "KLKL02-000509-2025", parties: "Lakshmi Menon v. P. J. Thomas", court: JMFC1, stage: "Evidence of the complainant", nextHearingAt: hearing(12), signatories: ["p-an"], advocates: ["p-an", "p-sp"] },
  { id: "c-144", stNumber: "ST 144/2025", cnr: "KLKL02-000144-2025", parties: "K. Radhakrishnan v. Chandy & Sons", court: JMFC1, stage: "Arguments", nextHearingAt: hearing(20), signatories: ["p-an", "p-dv"], advocates: ["p-an", "p-dv", "p-sp"] },
  { id: "c-71", stNumber: "ST 71/2025", cnr: "KLKL03-000071-2025", parties: "Joseph Mathew v. Star Traders", court: JMFC2, stage: "Evidence of the complainant", nextHearingAt: hearing(7), signatories: ["p-dv"], advocates: ["p-dv", "p-ri"] },
  { id: "c-381", stNumber: "ST 381/2025", cnr: "KLKL03-000381-2025", parties: "Rukhiya Beevi v. N. Pillai", court: JMFC2, stage: "Cognizance", nextHearingAt: hearing(30), signatories: ["p-an"], advocates: ["p-an"] },
  { id: "c-52", stNumber: "ST 52/2025", cnr: "KLKL04-000052-2025", parties: "Shaji P. v. Kollam Cashew Co.", court: CJM, stage: "Evidence of the complainant", nextHearingAt: hearing(3), signatories: ["p-dv", "p-an"], advocates: ["p-dv", "p-an", "p-sp"] },
  { id: "c-221", stNumber: "ST 221/2025", cnr: "KLKL01-000221-2025", parties: "Ramesh P. v. Coastal Traders", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(18), signatories: ["p-rm"], advocates: ["p-rm", "p-an", "p-sp"] },
  { id: "c-377", stNumber: "ST 377/2025", cnr: "KLKL01-000377-2025", parties: "Sujatha R. v. M. Haneefa", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(25), signatories: ["p-rm"], advocates: ["p-rm", "p-ri"] },
  { id: "c-633", stNumber: "ST 633/2025", cnr: "KLKL01-000633-2025", parties: "Sheeba Rasheed v. Muhammed Ashraf", court: ON, stage: "Evidence of the complainant", nextHearingAt: hearing(4), signatories: ["p-rm"], advocates: ["p-rm", "p-an", "p-sp"] },
  { id: "c-702", stNumber: "ST 702/2025", cnr: "KLKL02-000702-2025", parties: "Manoj Kurian v. Highrange Estates", court: JMFC1, stage: "Evidence of the complainant", nextHearingAt: hearing(3), signatories: ["p-an"], advocates: ["p-an", "p-ri"] },
  { id: "c-815", stNumber: "ST 815/2025", cnr: "KLKL04-000815-2025", parties: "Vinod Chandran v. Sabari Traders", court: CJM, stage: "Arguments", nextHearingAt: hearing(10), signatories: ["p-an", "p-dv"], advocates: ["p-an", "p-dv"] },
  { id: "c-1044", stNumber: "ST 1044/2026", cnr: "KLKL03-001044-2026", parties: "Beena Thomas v. A. Salim", court: JMFC2, stage: "Appearance", nextHearingAt: hearing(22), signatories: ["p-dv"], advocates: ["p-dv", "p-an"] },
  // Matters before filing — no ST number, no CNR yet; the statutory clocks live here.
  { id: "c-sainaba", stNumber: "", cnr: "", parties: "Sainaba K. v. Riyas M.", court: ON, stage: "Pre-filing", signatories: ["p-an"], advocates: ["p-an", "p-sp"] },
  { id: "c-arun", stNumber: "", cnr: "", parties: "Arun K. v. Meera Enterprises", court: ON, stage: "Pre-filing", signatories: ["p-rm"], advocates: ["p-rm", "p-sp"] },
  { id: "c-bindu", stNumber: "", cnr: "", parties: "Bindu S. v. Kerala Agro Traders", court: ON, stage: "Pre-filing", signatories: ["p-an"], advocates: ["p-an", "p-sp"] },
];

/* ───────────────────────────── tasks ───────────────────────────── */

type Seed = Omit<Task, "history" | "createdAt" | "isBlocking" | "systemObservable"> & {
  createdAt?: string;
  history?: Task["history"];
  isBlocking?: boolean;
  systemObservable?: boolean;
};

/** Fill the defaults the kind implies, and open every task with a "created" line. */
function task(seed: Seed): Task {
  const createdAt = seed.createdAt ?? seed.why.at;
  // Hearing tasks happen in court — the system cannot see them; everything else closes
  // on its event (signature, payment, acceptance).
  const systemObservable = seed.systemObservable ?? seed.kind !== "hearing";
  return {
    ...seed,
    isBlocking: seed.isBlocking ?? !!seed.hearingAt,
    createdAt,
    systemObservable,
    history: seed.history ?? [{ at: createdAt, text: `Created — ${seed.why.event}` }],
  };
}

const RUPEE = 100;

export function buildTasks(): Task[] {
  const created = (days: number, event: string) => ({ event, at: at(days, 11) });
  const order = (days: number) => `Order dated ${shortDate(at(days))}`;

  return [
    /* ── To sign ─────────────────────────────────────────────────── */
    task({
      id: "t-vak633",
      caseId: "c-633",
      kind: "sign",
      title: "Sign the vakalatnama for the additional complainant",
      why: created(-9, `The additional complainant was impleaded by ${order(-9).toLowerCase()}`),
      whatToDo: "The vakalatnama for the additional complainant needs the advocate's signature before the next posting.",
      documentsNeeded: ["Vakalatnama (additional complainant)"],
      dueAt: at(-7),
      dueKind: "court-set",
      deadlineNote: "To be filed within 2 days of the impleading order",
      status: "open",
    }),
    task({
      id: "t-sign88",
      caseId: "c-88",
      kind: "sign",
      title: "Sign the proof affidavit of the complainant",
      why: created(-5, `Affidavit prepared for the plea posting on ${shortDate(hearing(1))}`),
      whatToDo: "Read the affidavit and e-sign it. The signed copy attaches to the task and the case file.",
      documentsNeeded: ["Proof affidavit of the complainant"],
      dueAt: at(1, 9),
      dueKind: "before-hearing",
      deadlineNote: `Before the posting on ${shortDate(hearing(1))}`,
      hearingAt: hearing(1),
      status: "open",
    }),
    task({
      id: "t-ready412",
      caseId: "c-412",
      kind: "sign",
      title: "Sign the application to condone the delay",
      why: created(-4, "The complaint was presented after the limitation period; an application under the proviso to section 142 is needed"),
      whatToDo: "Read the application and the affidavit in support, then e-sign. S. Prakash drafted both from the notice dates.",
      documentsNeeded: ["Application to condone the delay", "Affidavit in support"],
      dueAt: at(2),
      dueKind: "court-set",
      deadlineNote: "Registry: to be filed before the next posting",
      status: "ready",
      statusNote: "Prepared by S. Prakash",
      prepared: {
        by: "p-sp",
        at: at(-1, 16, 40),
        note: "Drafted from the notice dates on the file. The postal receipts are annexed as A3 and A4.",
        files: [{ id: "seed-f-cond", name: "condonation-application.pdf", size: 96_512, type: "application/pdf", ext: "PDF", slot: "Application to condone the delay" }],
      },
      files: [{ id: "seed-f-cond", name: "condonation-application.pdf", size: 96_512, type: "application/pdf", ext: "PDF", slot: "Application to condone the delay" }],
      history: [
        { at: at(-4, 11), text: "Created — application under the proviso to section 142 needed" },
        { at: at(-2, 15), by: "p-sp", text: "S. Prakash saved a draft" },
        { at: at(-1, 16, 40), by: "p-sp", text: "S. Prakash marked this ready — “Drafted from the notice dates on the file. The postal receipts are annexed as A3 and A4.”" },
      ],
    }),
    task({
      id: "t-sign221",
      caseId: "c-221",
      kind: "sign",
      title: "Sign the affidavit of service of the summons",
      why: created(-3, "The summons was served by hand on the accused; an affidavit of service is to be filed"),
      whatToDo: "Confirm the date and manner of service in the affidavit, then e-sign it.",
      documentsNeeded: ["Affidavit of service"],
      dueAt: at(5),
      dueKind: "court-set",
      deadlineNote: "Before the next posting",
      status: "open",
    }),
    task({
      id: "t-signdone144",
      caseId: "c-144",
      kind: "sign",
      title: "Sign the vakalatnama for the complainant",
      why: created(-20, "Vakalatnama executed by the complainant on engagement"),
      whatToDo: "Accept the vakalatnama by e-signing it.",
      documentsNeeded: ["Vakalatnama"],
      dueAt: at(-18),
      dueKind: "court-set",
      status: "done",
      completion: { by: "p-an", at: at(-18, 12, 5), how: "event", receipt: "ESIGN-7KQ2M9PXV4" },
      history: [
        { at: at(-20, 11), text: "Created — vakalatnama executed on engagement" },
        { at: at(-18, 12, 5), by: "p-an", text: "Anjali Nair signed with Aadhaar e-Sign — ESIGN-7KQ2M9PXV4" },
      ],
    }),

    /* ── To pay ──────────────────────────────────────────────────── */
    task({
      id: "t-fee412",
      caseId: "c-412",
      kind: "pay",
      title: "Pay the process fee for the summons",
      why: created(-43, "Summons issued to the accused — process fee payable for service by post"),
      whatToDo: "Pay the process fee so the registry can dispatch the summons. The receipt attaches to the case file.",
      amountPaise: 40 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(-41),
      dueKind: "court-set",
      deadlineNote: `${order(-43)}: process fee to be paid within 2 days`,
      hearingAt: hearing(2),
      closesWhen: "Closes on payment, or when the hearing passes",
      status: "open",
    }),
    task({
      id: "t-payfailed702",
      caseId: "c-702",
      kind: "pay",
      title: "Pay the process fee for the witness summons",
      why: created(-3, `Summons ordered to PW-3 by ${order(-3).toLowerCase()}`),
      whatToDo: "Pay the process fee so the summons can go out before the evidence posting.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(1),
      dueKind: "court-set",
      deadlineNote: "Registry: pay within 3 days of the order",
      hearingAt: hearing(3),
      closesWhen: "Closes on payment, or when the hearing passes",
      status: "open",
      statusNote: "Payment failed — try again",
      lastPayment: { result: "failed", ref: "TXN-9F2KQ7HM3X", at: at(-1, 15) },
      history: [
        { at: at(-3, 11), text: "Created — summons ordered to PW-3" },
        { at: at(-1, 15), by: "p-an", text: "Payment failed (ref TXN-9F2KQ7HM3X) — nothing was paid" },
      ],
    }),
    task({
      id: "t-courtfee941",
      caseId: "c-941",
      kind: "pay",
      title: "Pay the court fee on the application to condone the delay",
      why: created(-2, "The condonation application was numbered; the court fee is payable before it is listed"),
      whatToDo: "Pay the court fee on the application. The registry lists it once the fee is on record.",
      amountPaise: 100 * RUPEE,
      feeHead: "Court fee",
      dueAt: at(3),
      dueKind: "court-set",
      deadlineNote: "Registry: before the application is listed",
      closesWhen: "Closes when the fee is paid",
      status: "open",
    }),
    task({
      id: "t-certcopy1102",
      caseId: "c-1102",
      kind: "pay",
      title: "Pay the certified-copy fee for the order on appearance",
      why: created(-1, `Copy application filed for ${order(-1).toLowerCase()}`),
      whatToDo: "Pay the copying fee so the certified copy is issued.",
      amountPaise: 30 * RUPEE,
      feeHead: "Copying fee",
      dueAt: at(6),
      dueKind: "court-set",
      deadlineNote: "Copy section: within 7 days of the copy application",
      closesWhen: "Closes when the fee is paid",
      status: "open",
    }),
    task({
      id: "t-pay71",
      caseId: "c-71",
      kind: "pay",
      title: "Pay the process fee for the summons to PW-2",
      why: created(-2, `Summons ordered to PW-2 by ${order(-2).toLowerCase()}`),
      whatToDo: "Pay the process fee so the summons can go out before the evidence posting.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(2),
      dueKind: "court-set",
      hearingAt: hearing(7),
      closesWhen: "Closes on payment, or when the hearing passes",
      status: "open",
    }),
    task({
      id: "t-payconf52",
      caseId: "c-52",
      kind: "pay",
      title: "Pay the process fee for the summons to PW-3",
      why: created(-6, `Summons ordered to PW-3 by ${order(-6).toLowerCase()}`),
      whatToDo: "Pay the process fee so the summons can go out before the evidence posting.",
      amountPaise: 200 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(1),
      dueKind: "court-set",
      hearingAt: hearing(3),
      closesWhen: "Closes on payment, or when the hearing passes",
      status: "payment-confirming",
      statusNote: "Gateway ref TXN-4HW8NQ2TZC",
      lastPayment: { result: "pending", ref: "TXN-4HW8NQ2TZC", at: at(0, 9, 40) },
      history: [
        { at: at(-6, 11), text: "Created — summons ordered to PW-3" },
        { at: at(0, 9, 40), by: "p-dv", text: "Deepa Varghese paid — gateway is confirming (ref TXN-4HW8NQ2TZC)" },
      ],
    }),
    task({
      id: "t-vakfee509",
      caseId: "c-509",
      kind: "pay",
      title: "Pay the vakalatnama fee",
      why: created(-1, "S. Prakash joined the case; the vakalatnama fee was not paid at joining"),
      whatToDo: "Pay the vakalatnama fee so the joining is complete on the record.",
      amountPaise: 25 * RUPEE,
      feeHead: "Vakalatnama fee",
      dueAt: at(0),
      dueKind: "court-set",
      deadlineNote: "Payable at joining — due immediately",
      closesWhen: "Closes when this or any other vakalatnama fee on the case is paid",
      status: "open",
    }),
    task({
      id: "t-paydone509",
      caseId: "c-509",
      kind: "pay",
      title: "Pay the process fee for the summons",
      why: created(-15, "Summons issued to the accused — process fee payable for service by post"),
      whatToDo: "Pay the process fee so the registry can dispatch the summons.",
      amountPaise: 40 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(-13),
      dueKind: "court-set",
      status: "done",
      lastPayment: { result: "success", ref: "TXN-2BD7PX5KLM", at: at(-14, 10, 12) },
      completion: { by: "p-an", at: at(-14, 10, 12), how: "event", receipt: "TXN-2BD7PX5KLM" },
      history: [
        { at: at(-15, 11), text: "Created — summons issued to the accused" },
        { at: at(-14, 10, 12), by: "p-an", text: "Anjali Nair paid — receipt TXN-2BD7PX5KLM" },
      ],
    }),
    task({
      id: "t-payexpired1044",
      caseId: "c-1044",
      kind: "pay",
      title: "Pay the process fee for the summons",
      why: created(-16, "Summons issued to the accused — process fee payable for service by post"),
      whatToDo: "Pay the process fee so the registry can dispatch the summons.",
      amountPaise: 40 * RUPEE,
      feeHead: "Process fee",
      dueAt: at(-14),
      dueKind: "court-set",
      status: "expired",
      statusNote: "summons re-issued by a fresh order",
      history: [
        { at: at(-16, 11), text: "Created — summons issued to the accused" },
        { at: at(-6, 11), text: "Expired — summons re-issued by a fresh order" },
      ],
    }),

    /* ── To file ─────────────────────────────────────────────────── */
    task({
      id: "t-affidavit509",
      caseId: "c-509",
      kind: "file",
      title: "File the proof affidavit of the complainant",
      why: created(-34, `${order(-34)} — complainant to file proof affidavit in lieu of chief examination`),
      whatToDo: "Prepare the affidavit from the complaint, have it sworn before a notary, and file it with the annexures.",
      documentsNeeded: ["Proof affidavit (sworn)", "Annexure list"],
      dueAt: at(-20),
      dueKind: "court-set",
      deadlineNote: `${order(-34)}: file within two weeks`,
      status: "open",
    }),
    task({
      id: "t-memo1102",
      caseId: "c-1102",
      kind: "file",
      title: "File the memo of addresses for the summons",
      why: created(-2, "Process ordered — addresses of the accused to be furnished for the summons"),
      whatToDo: "File the memo listing the accused's address for service, with the postal covers.",
      documentsNeeded: ["Memo of addresses", "Postal covers"],
      dueAt: at(4),
      dueKind: "court-set",
      deadlineNote: "Registry: within 7 days of the order issuing process",
      status: "open",
    }),
    task({
      id: "t-pw2-412",
      caseId: "c-412",
      kind: "file",
      title: "File the chief affidavit of PW-2 before the evidence posting",
      why: created(-12, `${order(-12)} — complainant directed to keep PW-2 present on the next posting`),
      whatToDo: "File the sworn chief affidavit of PW-2 so it is on record before the witness is examined.",
      documentsNeeded: ["Chief affidavit of PW-2"],
      dueAt: at(0),
      dueKind: "before-hearing",
      deadlineNote: `${order(-12)}: file before the next posting`,
      hearingAt: hearing(2),
      status: "open",
    }),
    task({
      id: "t-reply88",
      caseId: "c-88",
      kind: "file",
      title: "File the reply to the accused's application for adjournment",
      why: created(-2, `The accused filed an application for adjournment on ${shortDate(at(-2))}`),
      whatToDo: "File a reply, or record no objection, before the posting.",
      documentsNeeded: ["Reply"],
      dueAt: at(1, 9),
      dueKind: "court-set",
      deadlineNote: `Reply before the posting on ${shortDate(hearing(1))}`,
      hearingAt: hearing(1),
      closesWhen: "Closes when the court decides the application",
      status: "open",
    }),
    task({
      id: "t-redated633",
      caseId: "c-633",
      kind: "file",
      title: "File the scanned original cheque and return memo",
      why: created(-14, `${order(-14)} — originals to be produced at the evidence posting`),
      whatToDo: "File the scans now; the originals are marked at the hearing.",
      documentsNeeded: ["Original cheque (scan)", "Return memo (scan)"],
      dueAt: at(3),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting",
      hearingAt: hearing(4),
      status: "open",
      statusNote: `Moved from ${shortDate(at(-3))} — hearing adjourned`,
      redate: { from: at(-3), to: at(3), reason: "hearing adjourned", at: at(-3, 13) },
      history: [
        { at: at(-14, 11), text: "Created — order to produce the originals" },
        { at: at(-3, 13), text: `Due date moved from ${shortDate(at(-3))} to ${shortDate(at(3))} — hearing adjourned to ${shortDate(hearing(4))}` },
      ],
    }),
    task({
      id: "t-stmt52",
      caseId: "c-52",
      kind: "file",
      title: "File the bank's statement of account for the cheque period",
      why: created(-8, `${order(-8)} — complainant to produce the account statement`),
      whatToDo: "File the statement covering the cheque date and the return, certified by the bank.",
      documentsNeeded: ["Statement of account (certified)", "Bank certificate under the Bankers' Books Evidence Act"],
      dueAt: at(2),
      dueKind: "before-hearing",
      deadlineNote: `Before the evidence posting on ${shortDate(hearing(3))}`,
      hearingAt: hearing(3),
      status: "draft",
      draft: { by: "p-an", savedAt: at(-1, 16, 20) },
      files: [{ id: "seed-f-stmt", name: "statement-jan-mar.pdf", size: 184_204, type: "application/pdf", ext: "PDF", slot: "Statement of account (certified)" }],
      history: [
        { at: at(-8, 11), text: "Created — order to produce the account statement" },
        { at: at(-1, 16, 20), by: "p-an", text: "Anjali Nair saved a draft" },
      ],
    }),
    task({
      id: "t-draftfile941",
      caseId: "c-941",
      kind: "file",
      title: "File the affidavit of the complainant in lieu of chief examination",
      why: created(-10, `${order(-10)} — complainant to file the chief affidavit before the evidence posting`),
      whatToDo: "Prepare the affidavit from the complaint, have it sworn, and file it with the annexures.",
      documentsNeeded: ["Chief affidavit (sworn)", "Annexure list"],
      dueAt: at(8),
      dueKind: "before-hearing",
      deadlineNote: "Before the evidence posting",
      hearingAt: hearing(9),
      status: "draft",
      draft: { by: "p-sp", savedAt: at(-2, 18, 5), note: "Paras 1–9 done; waiting on the bank certificate." },
      history: [
        { at: at(-10, 11), text: "Created — order to file the chief affidavit" },
        { at: at(-2, 18, 5), by: "p-sp", text: "S. Prakash saved a draft" },
      ],
    }),
    task({
      id: "t-withcourt144",
      caseId: "c-144",
      kind: "file",
      title: "File the application to recall PW-1",
      why: created(-7, "The accused's counsel pointed to an omission in the chief examination; PW-1 is to be recalled"),
      whatToDo: "File the application with the affidavit in support.",
      documentsNeeded: ["Application to recall PW-1", "Affidavit in support"],
      dueAt: at(-1),
      dueKind: "court-set",
      deadlineNote: "Before the arguments posting",
      status: "awaiting-court",
      files: [{ id: "seed-f-recall", name: "recall-application.pdf", size: 142_880, type: "application/pdf", ext: "PDF", slot: "Application to recall PW-1" }],
      history: [
        { at: at(-7, 11), text: "Created — PW-1 to be recalled" },
        { at: at(-3, 14, 30), by: "p-sp", text: "S. Prakash marked this ready — “Affidavit sworn this morning.”" },
        { at: at(-2, 10, 15), by: "p-an", text: "Completed by Anjali Nair — prepared by S. Prakash · filed with the court — awaiting scrutiny" },
      ],
    }),
    task({
      id: "t-filedone221",
      caseId: "c-221",
      kind: "file",
      title: "File the memo of addresses for the summons",
      why: created(-12, "Process ordered — addresses of the accused to be furnished for the summons"),
      whatToDo: "File the memo listing the accused's address for service.",
      documentsNeeded: ["Memo of addresses"],
      dueAt: at(-9),
      dueKind: "court-set",
      status: "done",
      completion: { by: "p-rm", at: at(-9, 12), how: "event", receipt: "ACK-5TV3WQ8RNX" },
      history: [
        { at: at(-12, 11), text: "Created — process ordered" },
        { at: at(-10, 17), by: "p-rm", text: "R. Manoj filed with the court — awaiting scrutiny" },
        { at: at(-9, 12), text: "Accepted by the registry — acknowledgement ACK-5TV3WQ8RNX" },
      ],
    }),
    task({
      id: "t-obsolete1044",
      caseId: "c-1044",
      kind: "file",
      title: "File the reply to the accused's application for adjournment",
      why: created(-9, `The accused filed an application for adjournment on ${shortDate(at(-9))}`),
      whatToDo: "File a reply, or record no objection, before the posting.",
      documentsNeeded: ["Reply"],
      dueAt: at(-5),
      dueKind: "court-set",
      status: "obsolete",
      statusNote: "application withdrawn",
      history: [
        { at: at(-9, 11), text: "Created — application for adjournment filed" },
        { at: at(-6, 15), text: "No longer needed — application withdrawn" },
      ],
    }),

    /* ── Returned by scrutiny ────────────────────────────────────── */
    task({
      id: "t-retsainaba",
      caseId: "c-sainaba",
      kind: "returned",
      title: "Fix 3 defects and re-file the complaint",
      why: created(-9, "Scrutiny returned the complaint for compliance with 3 defects"),
      whatToDo: "Cure each defect, attach the corrected document where one is needed, and re-file.",
      documentsNeeded: ["Complaint", "Affidavit in support", "Index of documents"],
      dueAt: at(-6),
      dueKind: "court-set",
      deadlineNote: "Registry allows 3 days to cure defects",
      status: "open",
      returned: {
        by: "scrutiny",
        at: at(-9, 11),
        defects: [
          { n: 1, text: "Affidavit in support is not attested by a notary.", fixed: false },
          { n: 2, text: "Copy of the postal acknowledgement referred to in para 4 is not produced.", fixed: false },
          { n: 3, text: "Index of documents does not match the annexures.", fixed: false },
        ],
      },
    }),
    task({
      id: "t-ret941",
      caseId: "c-941",
      kind: "returned",
      title: "Fix 2 defects and re-file the application to condone the delay",
      why: created(-3, "Scrutiny returned the application to condone the delay with 2 defects"),
      whatToDo: "Cure each defect, attach the corrected document where one is needed, and re-file.",
      documentsNeeded: ["Affidavit in support (attested)", "Postal acknowledgement"],
      dueAt: at(0),
      dueKind: "court-set",
      deadlineNote: "Registry allows 3 days to cure defects",
      hearingAt: hearing(9),
      status: "open",
      returned: {
        by: "scrutiny",
        at: at(-3, 11),
        defects: [
          { n: 1, text: "Affidavit in support is not attested by a notary.", fixed: false },
          { n: 2, text: "Copy of the postal acknowledgement referred to in para 4 is not produced.", fixed: false },
        ],
      },
    }),
    task({
      id: "t-retready221",
      caseId: "c-221",
      kind: "returned",
      title: "Fix 1 defect and re-file the affidavit of the complainant",
      why: created(-4, "Scrutiny returned the chief affidavit with 1 defect"),
      whatToDo: "Cure the defect, attach the corrected affidavit, and re-file.",
      documentsNeeded: ["Chief affidavit (sworn)"],
      dueAt: at(-1),
      dueKind: "court-set",
      deadlineNote: "Registry allows 3 days to cure defects",
      status: "ready",
      statusNote: "Prepared by S. Prakash",
      returned: {
        by: "scrutiny",
        at: at(-4, 11),
        defects: [
          {
            n: 1,
            text: "Page 3 of the affidavit is not signed by the deponent.",
            fixed: true,
            replacement: { id: "seed-f-aff221", name: "chief-affidavit-signed.pdf", size: 210_440, type: "application/pdf", ext: "PDF", slot: "Replacement for defect 1" },
          },
        ],
      },
      prepared: { by: "p-sp", at: at(-1, 12, 30), note: "Deponent signed page 3 in office yesterday; scan attached." },
      history: [
        { at: at(-4, 11), text: "Created — scrutiny returned the affidavit with 1 defect" },
        { at: at(-1, 12, 10), by: "p-sp", text: "S. Prakash marked defect 1 fixed" },
        { at: at(-1, 12, 30), by: "p-sp", text: "S. Prakash marked this ready — “Deponent signed page 3 in office yesterday; scan attached.”" },
      ],
    }),
    task({
      id: "t-retexpired377",
      caseId: "c-377",
      kind: "returned",
      title: "Fix 2 defects and re-file the application to condone the delay",
      why: created(-20, "Scrutiny returned the application with 2 defects"),
      whatToDo: "Cure each defect, attach the corrected document where one is needed, and re-file.",
      dueAt: at(-17),
      dueKind: "court-set",
      deadlineNote: "Registry allows 3 days to cure defects",
      status: "expired",
      statusNote: "cure window lapsed",
      returned: {
        by: "scrutiny",
        at: at(-20, 11),
        defects: [
          { n: 1, text: "Affidavit in support is not attested by a notary.", fixed: false },
          { n: 2, text: "Court fee on the application is short by ₹50.", fixed: false },
        ],
      },
      history: [
        { at: at(-20, 11), text: "Created — scrutiny returned the application with 2 defects" },
        { at: at(-12, 11), text: "Expired — cure window lapsed" },
      ],
    }),

    /* ── For a hearing ───────────────────────────────────────────── */
    task({
      id: "t-plea88",
      caseId: "c-88",
      kind: "hearing",
      title: "Be present for the plea",
      why: created(-10, `Case posted for recording the plea of the accused on ${shortDate(hearing(1))}`),
      whatToDo: "Be present with the complainant when the plea is recorded; mark done afterwards.",
      dueAt: hearing(1),
      dueKind: "before-hearing",
      deadlineNote: `The posting on ${shortDate(hearing(1))}`,
      hearingAt: hearing(1),
      status: "open",
    }),
    task({
      id: "t-pw1-52",
      caseId: "c-52",
      kind: "hearing",
      title: "Produce PW-1 for cross-examination",
      why: created(-15, `${order(-15)} — complainant to keep PW-1 present on the next posting`),
      whatToDo: "Confirm PW-1 attends the posting; mark done once they have been produced.",
      dueAt: hearing(3),
      dueKind: "before-hearing",
      deadlineNote: `The posting on ${shortDate(hearing(3))}`,
      hearingAt: hearing(3),
      status: "open",
    }),
    task({
      id: "t-cross633",
      caseId: "c-633",
      kind: "hearing",
      title: "Produce the complainant for cross-examination",
      why: created(-14, `${order(-14)} — complainant to be present for cross-examination on the next posting`),
      whatToDo: "Confirm the complainant attends the posting; mark done once examined.",
      dueAt: hearing(4),
      dueKind: "before-hearing",
      hearingAt: hearing(4),
      status: "open",
    }),
    task({
      id: "t-sworn381",
      caseId: "c-381",
      kind: "hearing",
      title: "Be present with the complainant for the sworn statement",
      why: created(-1, `Complaint taken on file; posted for the sworn statement of the complainant on ${shortDate(hearing(30))}`),
      whatToDo: "The complainant makes the sworn statement under section 200 CrPC; mark done afterwards.",
      dueAt: hearing(30),
      dueKind: "before-hearing",
      hearingAt: hearing(30),
      status: "open",
    }),
    task({
      id: "t-args144",
      caseId: "c-144",
      kind: "hearing",
      title: "Address arguments for the complainant",
      why: created(-6, `Evidence closed; case posted for arguments on ${shortDate(hearing(20))}`),
      whatToDo: "Argue the complainant's case; file written arguments at the posting if the court permits.",
      dueAt: hearing(20),
      dueKind: "before-hearing",
      hearingAt: hearing(20),
      status: "open",
    }),
    task({
      id: "t-plea217",
      caseId: "c-217",
      kind: "hearing",
      title: "Be present for the plea",
      why: created(-8, `Case posted for recording the plea of the accused on ${shortDate(hearing(5))}`),
      whatToDo: "Be present with the complainant when the plea is recorded; mark done afterwards.",
      dueAt: hearing(5),
      dueKind: "before-hearing",
      hearingAt: hearing(5),
      status: "open",
    }),
    task({
      id: "t-pw2-509",
      caseId: "c-509",
      kind: "hearing",
      title: "Produce PW-2 for cross-examination",
      why: created(-19, `${order(-19)} — complainant to keep PW-2 present on the posting of ${shortDate(hearing(-6))}`),
      whatToDo: "Confirm PW-2 attends the posting; mark done once they have been produced.",
      dueAt: hearing(-6),
      dueKind: "before-hearing",
      hearingAt: hearing(-6),
      status: "open",
    }),
    task({
      id: "t-dates941",
      caseId: "c-941",
      kind: "hearing",
      title: "Choose your dates for the rescheduled hearing",
      why: created(0, `The accused asked to reschedule the evidence posting of ${shortDate(hearing(9))}`),
      whatToDo: "Give the dates your side can attend; the court fixes the new posting from the preferences.",
      dueAt: at(2),
      dueKind: "court-set",
      deadlineNote: "Registry allows 2 days to give date preferences",
      closesWhen: "Closes when you choose dates, or when the court decides the rescheduling request",
      status: "open",
    }),
    task({
      id: "t-appeardone1102",
      caseId: "c-1102",
      kind: "hearing",
      title: "Be present with the complainant at appearance",
      why: created(-18, `Case posted for appearance of the accused on ${shortDate(hearing(-10))}`),
      whatToDo: "Be present at the appearance posting; mark done afterwards.",
      dueAt: hearing(-10),
      dueKind: "before-hearing",
      hearingAt: hearing(-10),
      status: "done",
      completion: { by: "p-rm", at: at(-10, 12, 45), how: "manual" },
      history: [
        { at: at(-18, 11), text: "Created — posted for appearance" },
        { at: at(-10, 12, 45), by: "p-rm", text: "R. Manoj marked this done" },
      ],
    }),

    /* ── Drafts ──────────────────────────────────────────────────── */
    task({
      id: "t-draftarun",
      caseId: "c-arun",
      kind: "draft",
      title: "Continue the draft complaint",
      why: created(-5, "Statutory notice unanswered for 15 days — the cause of action arose"),
      whatToDo: "Finish the complaint, attach the cheque, return memo, notice and postal receipts, and file it.",
      documentsNeeded: ["Complaint", "Affidavit in support", "Cheque and return memo", "Statutory notice and postal receipts"],
      dueAt: at(18),
      dueKind: "statutory",
      deadlineNote: "Limitation: within one month of the cause of action (section 142)",
      status: "draft",
      draft: { by: "p-sp", savedAt: at(-1, 19, 10), note: "Parties and cheque particulars done; cause-of-action paras pending." },
      history: [
        { at: at(-5, 11), text: "Created — cause of action arose" },
        { at: at(-1, 19, 10), by: "p-sp", text: "S. Prakash saved a draft" },
      ],
    }),
    task({
      id: "t-draftbindu",
      caseId: "c-bindu",
      kind: "draft",
      title: "Continue the draft complaint",
      why: created(-3, "Statutory notice unanswered for 15 days — the cause of action arose"),
      whatToDo: "Finish the complaint, attach the cheque, return memo, notice and postal receipts, and file it.",
      documentsNeeded: ["Complaint", "Affidavit in support", "Cheque and return memo", "Statutory notice and postal receipts"],
      dueAt: at(12),
      dueKind: "statutory",
      deadlineNote: "Limitation: within one month of the cause of action (section 142)",
      status: "draft",
      draft: { by: "p-an", savedAt: at(0, 8, 50) },
      history: [
        { at: at(-3, 11), text: "Created — cause of action arose" },
        { at: at(0, 8, 50), by: "p-an", text: "Anjali Nair saved a draft" },
      ],
    }),
    task({
      id: "t-draftapp815",
      caseId: "c-815",
      kind: "draft",
      title: "Continue the draft application to recall PW-1",
      why: created(-2, "An omission in PW-1's chief examination needs to be cured before arguments"),
      whatToDo: "Finish the application and the affidavit in support, then file it before the arguments posting.",
      documentsNeeded: ["Application to recall PW-1", "Affidavit in support"],
      dueKind: "none",
      status: "draft",
      draft: { by: "p-dv", savedAt: at(-2, 17, 30), note: "Grounds drafted; needs the date of the omission from the deposition." },
      history: [
        { at: at(-2, 11), text: "Created — application to recall PW-1 started" },
        { at: at(-2, 17, 30), by: "p-dv", text: "Deepa Varghese saved a draft" },
      ],
    }),
  ];
}
