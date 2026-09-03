/** Derived reads over the draft — pure functions so screens and the shell agree. */

import { addDays, daysBetween, todayIso } from "./format";
import {
  CHANNEL_FEE,
  CONDONATION_FEE,
  COURT_FEE_LINES,
  PROCESS_OPTIONS,
} from "./options";
import { WALK_ORDER } from "./steps";
import type {
  Accused,
  Advocate,
  ChequeDetails,
  Complainant,
  DemandNotice,
  ISODate,
  DocumentGroup,
  FilingDraft,
  Intake,
  IntakeSlot,
  PhoneConfirmer,
  Signatory,
  StepId,
  UserProfile,
  Witness,
} from "./types";

/* ───────────────────────────── Intake ──────────────────────────────── */

export function intakeSlots(intake: Intake): IntakeSlot[] {
  return [
    ...intake.cheques.flatMap((g) => g.slots),
    ...intake.parties.flatMap((g) => g.slots),
    ...intake.supporting,
  ];
}

export function findIntakeSlot(intake: Intake, key: string): IntakeSlot | undefined {
  return intakeSlots(intake).find((s) => s.key === key);
}

/** Required-document progress for the intake step (supporting docs are optional). */
export function intakeProgress(intake: Intake) {
  const required = [
    ...intake.cheques.flatMap((g) => g.slots),
    ...intake.parties.flatMap((g) => g.slots),
  ].filter((s) => s.required);
  const done = required.filter((s) => s.file).length;
  const total = required.length;
  const remaining = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, remaining, pct };
}

/** Files already uploaded at intake — feeds the sidebar count and the documents drawer. */
export function uploadedIntakeSlots(intake: Intake): IntakeSlot[] {
  return intakeSlots(intake).filter((s) => !!s.file);
}

/** How many fields document reading filled from this slot. */
export function extractedFieldCount(slot: IntakeSlot): number {
  return slot.extract ? Object.keys(slot.extract.fields).length : 0;
}

/* ───────────────────────────── Parties ─────────────────────────────── */

export function complainantLabel(c: Complainant, index: number): string {
  return c.name || c.entName || `Complainant ${index + 1}`;
}

/** Complainant names as the advocate multi-select shows them. */
export function complainantChoices(complainants: Complainant[]): string[] {
  return complainants.map((c, i) => `Complainant ${i + 1}${c.name ? ` — ${c.name}` : ""}`);
}

/**
 * A complainant who has said they appear as a party in person conducts the case
 * themselves, so no advocate goes on record for them and none signs in their place.
 */
export function isPartyInPerson(c: Complainant): boolean {
  return c.pip === "yes";
}

/** Complainant indices that an advocate may be put on record for. */
export function representedIndices(complainants: Complainant[]): number[] {
  return complainants.flatMap((c, i) => (isPartyInPerson(c) ? [] : [i]));
}

export function advocateName(a: Advocate): string {
  return a.name.trim();
}

/** An advocate row counts as filled in once it carries a name or a bar number. */
export function advocateNamed(a: Advocate): boolean {
  return !!(a.name.trim() || a.barNumber.trim());
}

/** The advocates put on record for one complainant, by that complainant's index. */
export function advocatesForComplainant(
  advocates: Advocate[],
  index: number
): Advocate[] {
  return advocates.filter((a) => advocateNamed(a) && a.forComplainants.includes(index));
}

export function accusedLabel(a: Accused, index: number): string {
  return a.name.trim() || `Accused ${index + 1}`;
}

export function accusedComplete(a: Accused): boolean {
  return !!a.name.trim() && a.addresses.some((b) => b.addr.line1.trim());
}

export function accusedHasContact(a: Accused): boolean {
  return a.contacts.some((c) => c.mobile.trim() || c.email.trim());
}

export function complainantComplete(c: Complainant): boolean {
  const named = c.type === "institution" ? !!c.entName.trim() : !!c.name.trim();
  const addr = c.type === "institution" ? c.entAddr : c.res;
  return named && !!c.mobile.trim() && !!addr.line1.trim();
}

/* ───────────────────────────── Case details ────────────────────────── */

export function chequeComplete(c: ChequeDetails): boolean {
  return !!(c.dateOnCheque && c.amount && c.chequeNumber);
}

export function chequeFullyComplete(c: ChequeDetails, index: number): boolean {
  const bank = index > 0 && c.sameAsPrev === "yes" ? true : !!(c.ifsc && c.bankName);
  return chequeComplete(c) && bank && !!(c.presentDate && c.returnDate && c.returnReason);
}

export function noticeComplete(n: DemandNotice): boolean {
  return !!(n.natureDebt && n.dispatchDate && n.modeService);
}

export function witnessComplete(w: Witness): boolean {
  return !!(w.fullName.trim() || w.designation.trim());
}

/** Sum of cheque amounts typed so far (digits only), or 0. */
export function totalChequeAmount(cheques: ChequeDetails[]): number {
  return cheques.reduce((sum, c) => sum + (parseInt(c.amount.replace(/[^\d]/g, ""), 10) || 0), 0);
}

/* ───────────────────────────── List of documents ───────────────────── */

export function documentsProgress(groups: DocumentGroup[]) {
  let total = 0;
  let done = 0;
  for (const g of groups) {
    for (const d of g.docs) {
      if (d.required) {
        total += 1;
        if (d.file) done += 1;
      }
    }
  }
  const remaining = total - done;
  return { total, done, remaining, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ───────────────────────────── Sign ────────────────────────────────── */

function sameMobile(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "").slice(-10);
  const db = b.replace(/\D/g, "").slice(-10);
  return da.length === 10 && da === db;
}

/**
 * Everyone who signs the complaint: each complainant (or the person acting for one), and
 * one advocate signature per complainant who has an advocate.
 *
 * The advocate half is a slot per litigant, not a row per advocate: a complainant may
 * have several advocates on record but only one of them signs for them, so the row is
 * "Advocate for Complainant 1" and the names beneath it say who may fill it. A
 * complainant appearing as a party in person has no advocate row at all.
 *
 * "You" is whoever matches the profile — by bar number for advocates, by mobile for
 * complainants — else the first advocate slot, else the first complainant.
 */
export function signatories(
  draft: FilingDraft,
  profile: UserProfile | null
): { complainants: Signatory[]; advocates: Signatory[] } {
  const signedOf = (id: string): Signatory["status"] => (draft.sign.signed[id] ? "signed" : "pending");

  const complainants: Signatory[] = draft.complainants.map((c, i) => {
    const n = i + 1;
    let name: string;
    let role: string;
    if (c.type === "institution") {
      const rep = c.rep.name.trim();
      name = c.entName.trim() || `Complainant ${n}`;
      role = rep ? `Complainant ${n} · via ${rep}` : `Complainant ${n} · Institution`;
    } else if (c.poa === "yes" && c.poaHolder.name.trim()) {
      name = c.poaHolder.name.trim();
      role = `Complainant ${n} · PoA holder for ${c.name.trim() || `Complainant ${n}`}`;
    } else {
      name = c.name.trim() || `Complainant ${n}`;
      role = `Complainant ${n} · Individual`;
    }
    const you = !!profile?.mobile && sameMobile(profile.mobile, c.mobile);
    return { id: `sig-c-${c.id}`, name, role, status: signedOf(`sig-c-${c.id}`), you };
  });

  const myBar = profile?.barNumber.trim().toUpperCase() ?? "";

  const advocates: Signatory[] = draft.complainants.flatMap((c, i) => {
    if (isPartyInPerson(c)) return [];
    const acting = advocatesForComplainant(draft.advocates, i);
    if (!acting.length) return [];
    const first = acting[0];
    // One signature is needed, so the row names the slot; the line beneath says who can
    // fill it — the single advocate by name, or that any one of several may.
    const role =
      acting.length === 1
        ? [first.name.trim(), first.barNumber.trim()].filter(Boolean).join(" · ")
        : `Any one of ${acting.length} advocates on record`;
    const you = !!myBar && acting.some((a) => a.barNumber.trim().toUpperCase() === myBar);
    return [
      {
        id: `sig-a-${c.id}`,
        name: `Advocate for Complainant ${i + 1}`,
        role,
        status: signedOf(`sig-a-${c.id}`),
        you,
      },
    ];
  });

  const anyYou = [...complainants, ...advocates].some((s) => s.you);
  if (!anyYou) {
    if (advocates[0]) advocates[0].you = true;
    else if (complainants[0]) complainants[0].you = true;
  }
  return { complainants, advocates };
}

/**
 * Everyone who confirms by phone that they signed an uploaded copy.
 *
 * Deliberately not `signatories()`, which folds the advocate slots in and carries signing
 * status. This one is the phone list: one row per person who must sign and has a number
 * of their own.
 *
 * Only people who have to sign are listed. Where a PoA holder has been appointed, the
 * holder signs for the complainant and verifies for them, and the complainant does not
 * appear at all (owner, 2026-08-19).
 *
 * Each row names the person who receives the code: the complainant, their PoA holder, or
 * the authorised representative who answers for an institution.
 */
export function phoneConfirmers(draft: FilingDraft): PhoneConfirmer[] {
  const rows: PhoneConfirmer[] = [];
  draft.complainants.forEach((c, i) => {
    const n = i + 1;
    const who = c.type === "institution" ? c.entName.trim() : c.name.trim();
    const label = who || `Complainant ${n}`;

    if (c.poa === "yes") {
      // The holder signs in the complainant's place, so the complainant is not asked.
      rows.push({
        id: `poa-${c.id}`,
        name: c.poaHolder.name.trim() || `PoA holder for ${label}`,
        role: `PoA holder for ${label}`,
        mobile: c.poaHolder.mobile.trim(),
      });
    } else if (c.type === "institution") {
      // An entity cannot hold a phone; the person who answers for it does.
      rows.push({
        id: `sig-c-${c.id}`,
        name: c.rep.name.trim() || "Authorised representative",
        role: `Complainant ${n} · for ${label}`,
        mobile: c.rep.mobile.trim() || c.entPhone.trim(),
      });
    } else {
      rows.push({
        id: `sig-c-${c.id}`,
        name: label,
        role: `Complainant ${n} · Individual`,
        mobile: c.mobile.trim(),
      });
    }
  });
  return rows;
}

/* ───────────────────────────── Whole-draft reads ───────────────────── */

/** "Prateek vs Rajesh" style title from what has been typed so far. */
export function draftTitle(draft: FilingDraft): string {
  const c = draft.complainants[0];
  const a = draft.accused[0];
  const cName = c ? (c.type === "institution" ? c.entName : c.name).trim() : "";
  const aName = a?.name.trim() ?? "";
  if (cName && aName) return `${cName} vs ${aName}`;
  if (cName) return `${cName} vs …`;
  if (aName) return `… vs ${aName}`;
  return "Untitled filing";
}

/** Whether a section has everything it needs — drives the sidebar progress. */
export function sectionComplete(draft: FilingDraft, step: StepId): boolean {
  switch (step) {
    case "upload":
      return intakeProgress(draft.intake).remaining === 0;
    case "complainant":
      return draft.complainants.length > 0 && draft.complainants.every(complainantComplete);
    case "advocate":
      return (
        draft.complainants.every((c) => c.pip === "yes") ||
        draft.advocates.some((a) => a.barNumber.trim() && a.name.trim())
      );
    case "accused":
      return draft.accused.length > 0 && draft.accused.every(accusedComplete);
    case "cheque":
      return draft.cheques.length > 0 && draft.cheques.every(chequeFullyComplete);
    case "demand-notice":
      return draft.notices.length > 0 && draft.notices.every(noticeComplete);
    case "jurisdiction":
      return (
        !!draft.jurisdiction.causeDate &&
        (draft.jurisdiction.deposited === "no" || !!draft.jurisdiction.payeeBankName.trim())
      );
    case "adr-prayer":
      return !!draft.adr.finalRelief.trim();
    case "witnesses":
      return true; // optional
    case "documents":
      return documentsProgress(draft.documents).remaining === 0;
    case "preview":
      return WALK_ORDER.filter((s) => s !== "preview" && s !== "sign").every((s) =>
        sectionComplete(draft, s)
      );
    case "sign":
      return draft.status === "filed";
    default:
      return false;
  }
}

/** 0–100: share of the walkable steps that are complete. */
export function draftProgress(draft: FilingDraft): number {
  if (draft.status === "filed") return 100;
  const steps = WALK_ORDER;
  const done = steps.filter((s) => sectionComplete(draft, s)).length;
  return Math.round((done / steps.length) * 100);
}

/* ───────────────────────────── Source documents ────────────────────── */

/** The intake upload behind cheque `index` (0-based) of the given kind, if any. */
export function chequeSourceSlot(
  draft: FilingDraft,
  index: number,
  docType: "cheque-front" | "return-memo" | "demand-notice" | "dispatch-proof" | "delivery-proof" | "notice-reply"
): IntakeSlot | undefined {
  return draft.intake.cheques[index]?.slots.find((s) => s.docType === docType);
}

/** The intake upload behind complainant `index` (0-based) of the given kind, if any. */
export function partySourceSlot(
  draft: FilingDraft,
  index: number,
  docType: "id-proof" | "poa" | "vakalatnama"
): IntakeSlot | undefined {
  return draft.intake.parties[index]?.slots.find((s) => s.docType === docType);
}

/**
 * Which field the source panel should land on for a document: the first one, in the
 * screen's own order, that reading actually found a value for.
 *
 * Landing on a fixed field instead means the panel can open on something nothing was read
 * for — an empty "value used in this field" box beside a document with no region marked,
 * which reads as a broken panel rather than as "we didn't find this one".
 */
export function firstReadField<T extends string>(
  slot: IntakeSlot | undefined,
  order: readonly T[],
  fallback: T
): T {
  const fields = slot?.extract?.fields;
  if (!fields) return fallback;
  return order.find((key) => fields[key]?.value) ?? fallback;
}

/* ───────────────────────────── Court fees ──────────────────────────── */

export type BilledLine = {
  key: string;
  label: string;
  /** Per-unit rate, as the schedule states it. */
  rate: number;
  /** How many units — rounds, and addresses again for the per-address lines. */
  units: number;
  /** How that unit count is arrived at, e.g. "2 rounds × 3 addresses". */
  unitNote?: string;
  amount: number;
  note?: string;
};

export type FeeBill = {
  /** Filing fees — what it costs to put the complaint before the court. */
  court: BilledLine[];
  /** The nominal court fee on each process the filer is prepaying. */
  process: BilledLine[];
  /** What the delivery channel charges to carry the summons — not a court fee. */
  delivery: BilledLine[];
  courtTotal: number;
  processTotal: number;
  deliveryTotal: number;
  /** Addresses process is served at — what the per-address lines are multiplied by. */
  addresses: number;
  /** `true` when the filing is past the limitation period and the extra fee applies. */
  delayed: boolean;
  /** Court fees + process fees + delivery. Nothing here is deferrable. */
  total: number;
};

/**
 * The rounds this draft is prepaying, held to the court's own floor and ceiling.
 *
 * The floor is the point: **one round of summons is mandatory**, so a draft that says
 * otherwise — an old one, or a stored value that has drifted — is still billed for it.
 * There is no blanket opt-out to honour, only a per-process count to clamp.
 */
export function processRounds(draft: FilingDraft): Record<string, number> {
  const stored = draft.sign.processRounds ?? {};
  const out: Record<string, number> = {};
  for (const option of PROCESS_OPTIONS) {
    const n = Number.isFinite(stored[option.key]) ? Math.trunc(stored[option.key]) : 0;
    out[option.key] = Math.min(option.maxRounds, Math.max(option.minRounds, n));
  }
  return out;
}

/** How a line's unit count is arrived at — the multiplication, said in words. */
function unitNote(rounds: number, addresses: number): string | undefined {
  const parts: string[] = [];
  if (rounds > 1) parts.push(`${rounds} rounds`);
  if (addresses > 1) parts.push(`${addresses} addresses`);
  return parts.length ? parts.join(" × ") : undefined;
}

/**
 * What this filing owes, derived — never stored.
 *
 * Two things make the bill specific to the draft rather than a fixed price list: whether
 * the complaint is late (which adds the condonation application fee), and how many
 * addresses process has to reach (which multiplies every delivery line). Both are read
 * from the draft here so the screen can state them, because a total nobody can account
 * for is a total nobody should be asked to pay.
 */
export function feeBill(draft: FilingDraft): FeeBill {
  const delay = daysBetween(draft.jurisdiction.causeDate, draft.jurisdiction.filingDate);
  const delayed = delay !== null && delay > 30;

  const court: BilledLine[] = COURT_FEE_LINES.map((l) => ({
    key: l.key,
    label: l.label,
    rate: l.amount,
    units: 1,
    amount: l.amount,
    note: l.note,
  }));
  if (delayed) {
    court.push({
      key: CONDONATION_FEE.key,
      label: CONDONATION_FEE.label,
      rate: CONDONATION_FEE.amount,
      units: 1,
      amount: CONDONATION_FEE.amount,
      note: CONDONATION_FEE.note,
    });
  }

  // Process goes to every address chosen on the process-and-address step; before that
  // choice is made it goes to every address on record, which is what the court assumes.
  const onRecord = draft.accused.reduce(
    (n, a) => n + a.addresses.filter((b) => b.addr.line1.trim()).length,
    0
  );
  const chosen = draft.sign.processAddresses.length;
  const addresses = Math.max(1, chosen || onRecord);

  // One line per process the filer is prepaying, priced by rounds — and by addresses
  // again for the ones the court serves address by address. A process nobody asked for
  // has no line at all, so the bill never charges for something that was declined.
  const rounds = processRounds(draft);
  const process: BilledLine[] = [];
  for (const option of PROCESS_OPTIONS) {
    const n = rounds[option.key] ?? 0;
    if (n < 1) continue;
    const units = option.perAddress ? n * addresses : n;
    process.push({
      key: option.key,
      label: `Court fee — ${option.label.toLowerCase()}`,
      rate: option.fee,
      units,
      unitNote: unitNote(n, option.perAddress ? addresses : 0),
      amount: option.fee * units,
    });
  }

  // The delivery tariff rides with the summons — one article per address, every round —
  // so it appears only when summons is being prepaid, and it moves with it. It is the
  // post office's charge, not the court's, and it is the big number on this bill, so it
  // is billed as its own group rather than buried among the nominal court fees.
  const delivery: BilledLine[] = [];
  const summonsRounds = rounds.summons ?? 0;
  if (summonsRounds > 0) {
    const units = summonsRounds * addresses;
    delivery.push({
      key: CHANNEL_FEE.key,
      label: CHANNEL_FEE.label,
      rate: CHANNEL_FEE.amount,
      units,
      unitNote: unitNote(summonsRounds, addresses),
      amount: CHANNEL_FEE.amount * units,
      note: CHANNEL_FEE.note,
    });
  }

  const sum = (rows: BilledLine[]) => rows.reduce((t, r) => t + r.amount, 0);
  const courtTotal = sum(court);
  const processTotal = sum(process);
  const deliveryTotal = sum(delivery);
  return {
    court,
    process,
    delivery,
    courtTotal,
    processTotal,
    deliveryTotal,
    addresses,
    delayed,
    total: courtTotal + processTotal + deliveryTotal,
  };
}

/* ───────────────────────────── Limitation ──────────────────────────── */

/** Days the drawer has to pay after the demand notice reaches them. */
export const PAYMENT_WINDOW_DAYS = 15;
/** Days from the cause of action within which the complaint must be filed. */
export const LIMITATION_DAYS = 30;

/**
 * The date the notice started the clock — when it reached the accused, or when it came
 * back unserved. Service is deemed complete on a notice returned unclaimed, so a return
 * date counts exactly as a delivery date does.
 */
export function noticeServiceDate(n: DemandNotice): ISODate {
  return n.delivered === "no" ? n.returnDate : n.deliveryDate;
}

/**
 * When the cause of action arose on one notice: fifteen days after it was served.
 *
 * The drawer has that window to pay; the offence is complete when it closes without
 * payment. Empty until the notice records a service date, because a limitation date
 * guessed from nothing is worse than no date at all.
 */
export function noticeCauseDate(n: DemandNotice): ISODate {
  return addDays(noticeServiceDate(n), PAYMENT_WINDOW_DAYS);
}

/**
 * The cause of action for the whole filing — the **earliest** across the notices.
 *
 * With more than one notice there is more than one cause of action, and the complaint has
 * to be in time for the first of them; running the clock from a later one would show the
 * filing as comfortably in time while the earliest cheque was already barred.
 */
export function derivedCauseDate(draft: FilingDraft): ISODate {
  const dates = draft.notices.map(noticeCauseDate).filter(Boolean).sort();
  return dates[0] ?? "";
}

/** What the form shows and the sheet prints: the filer's own date, else the derived one. */
export function causeOfActionDate(draft: FilingDraft): ISODate {
  return draft.jurisdiction.causeDate || derivedCauseDate(draft);
}

/**
 * The filing date. Until the complaint is actually filed this is today — a draft left for
 * a month really is a month later, and freezing the date would hide a growing delay.
 */
export function complaintFilingDate(draft: FilingDraft): ISODate {
  if (draft.jurisdiction.filingDate) return draft.jurisdiction.filingDate;
  return draft.filedAt ? draft.filedAt.slice(0, 10) : todayIso();
}

export type LimitationView = {
  causeDate: ISODate;
  filingDate: ISODate;
  /** Whole days between the two, or null while either is unknown. */
  elapsed: number | null;
  withinLimit: boolean;
  /** Days past the one-month limit; 0 when in time. */
  overBy: number;
  /** True when the dates came from the notices rather than being typed. */
  causeDerived: boolean;
};

export function limitationView(draft: FilingDraft): LimitationView {
  const causeDate = causeOfActionDate(draft);
  const filingDate = complaintFilingDate(draft);
  const elapsed = daysBetween(causeDate, filingDate);
  return {
    causeDate,
    filingDate,
    elapsed,
    withinLimit: elapsed !== null && elapsed <= LIMITATION_DAYS,
    overBy: elapsed === null ? 0 : Math.max(0, elapsed - LIMITATION_DAYS),
    causeDerived: !draft.jurisdiction.causeDate && !!causeDate,
  };
}
