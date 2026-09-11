"use client";

/**
 * SANDBOX DATA — a handful of drafts so the File a case queue has something to show.
 *
 * Drafts live in this browser's IndexedDB, so a fresh browser opens on an empty Drafts
 * tab and the two columns that matter there — File by and Completed — cannot be judged.
 * This seeds six drafts once per browser, covering every state the File by column can
 * be in: no clock yet, comfortably in time, inside the two-day warning, due today, and
 * a closed window. Seeded once (a marker in localStorage), so a draft the person
 * discards stays discarded. Nothing here has been sent to a real court.
 */

import { blankCheque, createBlankDraft } from "./blank";
import { getRepository } from "./data";
import { addDays } from "./format";
import type { FilingDraft } from "./types";

const SEEDED_KEY = "dristi.filing.sampleDrafts.v1";

/**
 * The demand notice's service date, worked back from how many days the person should
 * have left: the drawer's 15 days after service start the cause of action, and the
 * complaint is due 30 days after that (`selectors.ts`). Negative days = window closed.
 */
function servedFor(today: string, daysLeft: number): string {
  return addDays(today, -(15 + 30 - daysLeft));
}

type Sample = {
  id: string;
  complainant: string;
  accused: string;
  /** Days left on the clock; `null` means the notice dates are not entered yet. */
  daysLeft: number | null;
  /** How far in the form the person got — drives both `lastStep` and the share done. */
  reach: "start" | "parties" | "cheque" | "notice" | "most";
  savedDaysAgo: number;
};

const SAMPLES: Sample[] = [
  { id: "sample-draft-1", complainant: "Sainaba K.", accused: "Riyas M.", daysLeft: 12, reach: "most", savedDaysAgo: 1 },
  { id: "sample-draft-2", complainant: "Meera Nair", accused: "Anwar S.", daysLeft: 2, reach: "notice", savedDaysAgo: 0 },
  { id: "sample-draft-3", complainant: "Latha R.", accused: "Riya Jacob", daysLeft: 0, reach: "notice", savedDaysAgo: 3 },
  { id: "sample-draft-4", complainant: "Suresh Menon", accused: "K. Menon", daysLeft: -6, reach: "cheque", savedDaysAgo: 20 },
  { id: "sample-draft-5", complainant: "Joseph Mathew", accused: "", daysLeft: null, reach: "parties", savedDaysAgo: 5 },
  { id: "sample-draft-6", complainant: "", accused: "", daysLeft: null, reach: "start", savedDaysAgo: 8 },
];

function build(sample: Sample, today: string): FilingDraft {
  const d = createBlankDraft(sample.id);
  const savedOn = addDays(today, -sample.savedDaysAgo);
  d.createdAt = `${addDays(savedOn, -2)}T10:00:00.000Z`;
  d.updatedAt = `${savedOn}T15:30:00.000Z`;

  if (sample.reach === "start") {
    d.lastStep = "upload";
    return d;
  }

  const c = d.complainants[0];
  c.name = sample.complainant;
  c.mobile = "9847012233";
  c.verified = true;
  c.age = "44";
  c.res = { line1: "Puthenveedu, Market Road", city: "Kodungallur", pin: "680664", district: "Thrissur", state: "Kerala" };
  c.perm = { ...c.res };
  d.advocates[0].name = "Anjali Nair";
  d.advocates[0].barNumber = "K/1188/2011";
  if (sample.accused) {
    const a = d.accused[0];
    a.name = sample.accused;
    a.contacts = [{ mobile: "9846778811", email: "" }];
    a.addresses = [{ addr: { line1: "Ashiyana, Beach Road", city: "Kodungallur", pin: "680664", district: "Thrissur", state: "Kerala" }, police: "Kodungallur" }];
  }
  d.lastStep = "accused";
  if (sample.reach === "parties") return d;

  const cheque = d.cheques[0];
  const served = sample.daysLeft === null ? addDays(today, -40) : servedFor(today, sample.daysLeft);
  cheque.dateOnCheque = addDays(served, -30);
  cheque.amount = "240000";
  cheque.chequeNumber = "447162";
  cheque.ifsc = "KLGB0040213";
  cheque.bankName = "Kerala Gramin Bank";
  cheque.bankBranch = "Chalakudy";
  cheque.presentDate = addDays(served, -20);
  cheque.returnDate = addDays(served, -18);
  cheque.returnReason = "funds-insufficient";
  d.lastStep = "cheque";
  if (sample.reach === "cheque" && sample.daysLeft === null) return d;

  const n = d.notices[0];
  n.natureDebt = "loan";
  n.whyIssued = "repayment";
  n.dispatchDate = addDays(served, -3);
  n.modeService = "registered-post-ad";
  n.tracking = "RK123456789IN";
  n.delivered = "yes";
  n.deliveryDate = served;
  n.replied = "no";
  n.paymentStatus = "none";
  d.lastStep = "demand-notice";
  if (sample.reach === "cheque" || sample.reach === "notice") return d;

  d.cheques.push(Object.assign(blankCheque(), { ...cheque, chequeNumber: "447163", amount: "85000", sameAsPrev: "yes" }));
  d.jurisdiction.deposited = "yes";
  d.jurisdiction.ifsc = "SBIN0070123";
  d.jurisdiction.payeeBankName = "State Bank of India";
  d.jurisdiction.payeeBankBranch = "Kodungallur";
  d.jurisdiction.payeeFetched = true;
  d.jurisdiction.payeePolice = "Kodungallur";
  d.jurisdiction.drawerPolice = "Kodungallur";
  d.adr.finalRelief = "Direct the accused to pay the cheque amount with interest and costs.";
  d.lastStep = "witnesses";
  return d;
}

let seeding: Promise<void> | null = null;

/** Seed the samples once per browser. Safe to call on every read; it does nothing after the first time. */
export function ensureSampleDrafts(): Promise<void> {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(SEEDED_KEY)) return;
      const repo = getRepository();
      const today = new Date().toISOString().slice(0, 10);
      for (const sample of SAMPLES) {
        const existing = await repo.getDraft(sample.id);
        if (!existing) await repo.putDraft(build(sample, today));
      }
      window.localStorage.setItem(SEEDED_KEY, new Date().toISOString());
    } catch {
      /* storage blocked — the queue simply opens empty */
    }
  })();
  return seeding;
}
