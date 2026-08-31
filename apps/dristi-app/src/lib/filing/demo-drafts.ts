"use client";

/**
 * SANDBOX DATA — sample drafts and a sample client batch, for looking at the screen.
 *
 * This exists so "File a case" can be reviewed with something in it. It is loaded only
 * when someone presses the sandbox strip's button, never on open: the flow's standing
 * decision is that a new filing starts blank and nothing is seeded behind the person's
 * back (see docs/design/proposals/e-filing.md, 2026-08-17 night).
 *
 * The drafts are chosen to walk every state of the limitation cue rather than to look
 * plausible in a screenshot — comfortable, inside the last week, past the one-month
 * window, and no cause of action at all. Delete this file and the sandbox strip together
 * when real data arrives; nothing else imports it.
 */

import type { BulkBatch } from "@/components/filing/dashboard/bulk-import-card";

import { createBlankDraft } from "./blank";
import { getRepository } from "./data";
import { addDays, todayIso } from "./format";
import type { FilingDraft, StepId } from "./types";

const PREFIX = "demo_";

type Seed = {
  id: string;
  complainant: string;
  accused: string;
  /** Days before today the cause of action arose; null leaves the draft without one. */
  causeDaysAgo: number | null;
  lastStep: StepId;
  /** Days before today the draft was last touched. */
  savedDaysAgo: number;
  /** Sections to mark done, which is what the progress percentage counts. */
  fill: "light" | "half" | "most";
};

const SEEDS: Seed[] = [
  {
    id: `${PREFIX}1`,
    complainant: "Meera Nair",
    accused: "Coastal Agro Exports Pvt Ltd",
    causeDaysAgo: 8,
    lastStep: "documents",
    savedDaysAgo: 0,
    fill: "most",
  },
  {
    id: `${PREFIX}2`,
    complainant: "Suresh Menon",
    accused: "Anwar S.",
    causeDaysAgo: 26,
    lastStep: "jurisdiction",
    savedDaysAgo: 2,
    fill: "half",
  },
  {
    id: `${PREFIX}3`,
    complainant: "Fathima Beevi",
    accused: "Nikhil Raj",
    causeDaysAgo: 41,
    lastStep: "cheque",
    savedDaysAgo: 9,
    fill: "half",
  },
  {
    id: `${PREFIX}4`,
    complainant: "Joseph Chacko",
    accused: "Sona Elizabeth",
    causeDaysAgo: null,
    lastStep: "complainant",
    savedDaysAgo: 1,
    fill: "light",
  },
  {
    id: `${PREFIX}5`,
    complainant: "Devika Pillai",
    accused: "Manoj T.",
    causeDaysAgo: 3,
    lastStep: "adr-prayer",
    savedDaysAgo: 4,
    fill: "most",
  },
];

/** A batch a client's system pushed across, part-way through the court's checks. */
export const DEMO_BATCH: BulkBatch = {
  id: "demo_batch_1",
  client: "Tata Capital Financial Services",
  what: "50 × cheque bounce (S-138, NI Act)",
  receivedOn: "03/07/2026",
  via: "Provakil",
  counts: { registered: 12, scrutiny: 30, defect: 4, notFiled: 4 },
};

function build(seed: Seed): FilingDraft {
  const today = todayIso();
  const draft = createBlankDraft(seed.id);

  draft.complainants[0].name = seed.complainant;
  draft.complainants[0].pip = "no";
  draft.accused[0].name = seed.accused;
  draft.lastStep = seed.lastStep;
  draft.updatedAt = new Date(
    Date.parse(`${addDays(today, -seed.savedDaysAgo)}T10:00:00`)
  ).toISOString();

  if (seed.causeDaysAgo !== null) {
    draft.jurisdiction.causeDate = addDays(today, -seed.causeDaysAgo);
  }

  // Each step completed moves the percentage, so the three fills read as three different
  // drafts rather than three copies. Only the cheap sections are filled — a complete
  // complainant or cheque needs a dozen fields and proves nothing extra here.
  if (seed.fill !== "light") {
    draft.advocates[0].barNumber = "KL/1123/2009";
    draft.advocates[0].name = "Anjali Nair";
  }
  if (seed.fill === "most") {
    draft.jurisdiction.deposited = "no";
    draft.adr.adr = "maybe";
    draft.adr.finalRelief =
      "Convict the accused under Section 138 and award compensation of the cheque amount with interest and costs.";
  }

  return draft;
}

/** Write the sample drafts, replacing any already there. Returns how many landed. */
export async function loadDemoDrafts(): Promise<number> {
  const repo = getRepository();
  for (const seed of SEEDS) {
    await repo.putDraft(build(seed));
  }
  return SEEDS.length;
}

/** Remove only what this file wrote — a real draft with a typed-in name is not touched. */
export async function clearDemoDrafts(): Promise<void> {
  const repo = getRepository();
  const all = await repo.listDrafts();
  for (const draft of all) {
    if (draft.id.startsWith(PREFIX)) await repo.deleteDraft(draft.id);
  }
}
