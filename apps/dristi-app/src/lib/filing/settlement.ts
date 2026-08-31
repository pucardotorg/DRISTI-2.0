/**
 * Settlement rules — the arithmetic behind the offer and the invariants it has to hold.
 *
 * Kept out of the screen so the field errors an advocate sees and the gate that decides
 * whether the section is finished are the same rule, read from one place. Nothing here
 * touches the draft's other sections: the amount claimed is passed in, so this module
 * stays free of `selectors` and the two do not import each other.
 */

import { amountToNumber, plural } from "./format";
import type { Period, SettlementBand, SettlementOffer, SettlementPrayer } from "./types";

/* ───────────────────────────── Period arithmetic ───────────────────── */

/**
 * A window in days, so two windows written in different units can be compared. Months and
 * years are the conventional 30 and 365 — close enough to order a ladder by, and the real
 * deadline is a date the parties agree on, not a figure derived here.
 */
export function periodDays(p: Period): number | null {
  const n = amountToNumber(p.value);
  if (!n) return null;
  return p.unit === "days" ? n : p.unit === "months" ? n * 30 : n * 365;
}

/** "30 days" / "1 year"; "" until a number is typed. */
export function periodText(p: Period): string {
  const n = amountToNumber(p.value);
  if (!n) return "";
  const one = p.unit === "days" ? "day" : p.unit === "months" ? "month" : "year";
  return plural(n, one);
}

/** What is left of the claim after `discount` percent comes off it. */
export function amountAfterDiscount(claim: number, discount: number): number {
  return Math.max(0, Math.round(claim * (1 - discount / 100)));
}

/** How far `amount` sits below the claim, in whole percent. Negative means above it. */
export function discountOfClaim(claim: number, amount: number): number | null {
  if (!claim || !amount) return null;
  return Math.round((1 - amount / claim) * 100);
}

/* ───────────────────────────── Invariants ──────────────────────────── */

export type OfferIssue = "over-claim";
export type BandIssue = "over-claim" | "past-limit";

/**
 * A settlement is a concession, so an offer may not ask the accused for more than the
 * complaint does. Anything above the amount claimed is not a settlement at all — it is a
 * demand the court was never asked to make, and the accused has no reason to take it over
 * simply defending the case.
 *
 * Only checked once there is an amount to check against: with no cheque typed yet there
 * is no ceiling, and a blank field is the "required" marker's business, not this rule's.
 */
export function offerIssue(offer: SettlementOffer, claim: number): OfferIssue | null {
  if (!claim) return null;
  return amountToNumber(offer.amount) > claim ? "over-claim" : null;
}

/**
 * The same ceiling from the other side, and why this one needs no amount: a band names a
 * *discount*, so asking for more than the claim would be a negative percentage, which the
 * input cannot produce, while a discount above 100% would have the complainant paying the
 * accused. Both are the one rule — the settlement lands between nothing and the amount
 * claimed — expressed in percent rather than rupees.
 *
 * A window longer than the outer limit is the second invariant: that band could never be
 * reached, so it is a rule the bot would silently never apply.
 */
export function bandIssue(band: SettlementBand, maxPeriod: Period): BandIssue | null {
  if (amountToNumber(band.discount) > 100) return "over-claim";
  const days = periodDays(band.within);
  const limit = periodDays(maxPeriod);
  if (days !== null && limit !== null && days > limit) return "past-limit";
  return null;
}

/**
 * Whether the offer as set up is fit to send.
 *
 * "No" to settling means there is no offer, so nothing to be wrong; and only the mode
 * actually chosen is judged — a stale band left behind from a switch to pre-packaged
 * offers is not a defect in what will be sent.
 */
export function settlementValid(s: SettlementPrayer, claim: number): boolean {
  if (s.willing === "no") return true;
  if (s.mode === "packaged") {
    return s.offers.every((o) => offerIssue(o, claim) === null);
  }
  return s.bands.every((b) => bandIssue(b, s.maxPeriod) === null);
}
