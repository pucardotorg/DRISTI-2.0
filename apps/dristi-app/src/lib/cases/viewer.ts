/**
 * The signed-in advocate, as the case screens need them.
 *
 * A demo identity, matched by name against each case's counsel — the same
 * convention the access surfaces use (their SELF is "Adv. Anjali Nair").
 * The real seam is the session: engineering swaps this for the signed-in
 * user's id and a proper membership lookup, and the screens do not change.
 */

import { counselFor, type CaseRecord, type CounselSide } from "./types";

const VIEWER_NAME = "Anjali Nair";

/** The sides this case's record lists the viewer as counsel for. */
export function viewerSides(record: CaseRecord): CounselSide[] {
  return (["complainant", "accused"] as const).filter((side) =>
    counselFor(record, side).some((name) => name.includes(VIEWER_NAME))
  );
}

/**
 * The side the viewer works for on this case — never empty (owner, Sept 2):
 * even office access descends from one side's team, so the answer is always
 * complainant or accused. Where the record does not name the viewer as
 * counsel, the grant's side is not yet authored in the fixtures, and the
 * demo's standing complainant-side assumption stands in until the fixture
 * pass records the true side per grant.
 */
export function viewerRepresentation(record: CaseRecord): CounselSide[] {
  const sides = viewerSides(record);
  return sides.length > 0 ? sides : ["complainant"];
}
