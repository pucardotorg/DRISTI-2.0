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
