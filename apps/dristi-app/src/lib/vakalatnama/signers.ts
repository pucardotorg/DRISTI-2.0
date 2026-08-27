/**
 * The signing board: who signs, in what order (spec S7 / §13.4). Built from the draft so
 * the review-and-sign screen stays in step with the parties. Signing is multi-party —
 * each line is a party who signs in turn.
 */

import { executantName } from "./format";
import type { Signer, Vakalatnama } from "./types";

export function plannedSigners(vak: Vakalatnama): Signer[] {
  const list: Signer[] = [];

  // 1 — the executant appoints.
  list.push({
    id: "exec",
    role: "executant",
    label: executantName(vak.executant),
    certifies: "Appointment — signs the vakalatnama",
    method: "esign",
    state: "waiting",
  });

  // 2 — each advocate accepts.
  for (const a of vak.advocates) {
    list.push({
      id: `adv-${a.id}`,
      role: "advocate",
      label: a.name || "Advocate",
      certifies: "Acceptance of the engagement",
      method: "esign",
      state: "waiting",
    });
  }

  // 3 — the witness attests, only if one was added.
  if (vak.attestation.hasWitness) {
    const isNotary = vak.attestation.kind === "notary";
    list.push({
      id: "witness",
      role: "attestor",
      label: vak.attestation.name || (isNotary ? "Notary" : "Witness"),
      certifies: isNotary ? "Notary — attests the signing" : "Witness — signed before me",
      method: "esign",
      state: "waiting",
    });
  }

  return list;
}

/** Merge planned signers with any signatures already captured (by id). */
export function reconcileSigners(vak: Vakalatnama): Signer[] {
  const planned = plannedSigners(vak);
  const byId = new Map(vak.signing.map((s) => [s.id, s]));
  return planned.map((p) => {
    const prior = byId.get(p.id);
    return prior ? { ...p, method: prior.method, state: prior.state, signedAt: prior.signedAt } : p;
  });
}
