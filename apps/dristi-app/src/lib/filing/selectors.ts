/** Derived reads over the draft — pure functions so screens and the shell agree. */

import { WALK_ORDER } from "./steps";
import type {
  Accused,
  Advocate,
  ChequeDetails,
  Complainant,
  DemandNotice,
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
