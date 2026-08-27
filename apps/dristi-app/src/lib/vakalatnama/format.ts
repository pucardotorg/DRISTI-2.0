/** Display helpers for the vakalatnama flow. */

import type { Address, Advocate, Executant, Vakalatnama } from "./types";

export function rupee(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function feesTotal(v: Vakalatnama): number {
  return v.fees.courtFee + v.fees.welfareFund;
}

export function addressLine(a: Address): string {
  return [a.line1, a.city, a.district, a.state, a.pin]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

/** The executant's name as it signs — an individual, or the org via its signatory. */
export function executantName(e: Executant): string {
  if (e.kind === "organisation") {
    const org = e.orgName.trim() || "the organisation";
    const sig = e.signatoryName.trim();
    return sig ? `For ${org} — ${sig}` : `For ${org}`;
  }
  return e.name.trim() || "the litigant";
}

/** The "I, X, S/o Y, aged N, of <address>" opening line. */
export function executantIntro(e: Executant): string {
  if (e.kind === "organisation") {
    const org = e.orgName.trim() || "[organisation]";
    const sig = e.signatoryName.trim() || "[authorised signatory]";
    const desig = e.signatoryDesignation.trim();
    const addr = addressLine(e.address);
    return `We, ${org}, represented by ${sig}${desig ? `, ${desig}` : ""}${
      addr ? `, of ${addr}` : ""
    }`;
  }
  const name = e.name.trim() || "[name]";
  const rel = e.relationType && e.relationName.trim() ? `${e.relationType} ${e.relationName.trim()}` : "";
  const age = e.age.trim() ? `aged ${e.age.trim()} years` : "";
  const addr = addressLine(e.address);
  return ["I", `${name}`, rel, age, addr ? `of ${addr}` : ""]
    .filter(Boolean)
    .join(", ")
    .replace(/^I, /, "I, ");
}

export function serviceAdvocate(v: Vakalatnama): Advocate | undefined {
  return v.advocates.find((a) => a.forService) ?? v.advocates[0];
}

export function advocateNames(v: Vakalatnama): string {
  if (v.advocates.length === 0) return "[advocate]";
  return v.advocates.map((a) => a.name.trim() || "[advocate]").join(", ");
}

const STATUS_LABEL: Record<Vakalatnama["status"], string> = {
  draft: "Draft",
  pending_executant_sign: "Pending signature",
  pending_advocate_accept: "Pending acceptance",
  pending_attestation: "Pending attestation",
  pending_payment: "Pending payment",
  executed: "Executed",
};

export function statusLabel(status: Vakalatnama["status"]): string {
  return STATUS_LABEL[status];
}

/** How the scope reads on a card or the instrument. */
export function scopeLabel(v: Vakalatnama): string {
  if (v.scope.type === "standing") return "All cases (standing)";
  if (v.scope.caseState === "filed") {
    return v.scope.caseNumber.trim() || "A filed case";
  }
  return v.boundCaseNumber?.trim() || "A case not yet filed";
}
