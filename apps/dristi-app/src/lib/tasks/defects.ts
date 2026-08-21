/**
 * Whether a scrutiny defect has been addressed — derived, never self-certified.
 *
 * The old model asked the advocate to tick a box; the tick meant only that someone
 * ticked it (brief §2, problem 1). Here "addressed" is a fact computed from what is
 * actually in the filing:
 *
 *   · the flagged field's value changed from what scrutiny saw, or
 *   · the officer's suggestion was taken, or
 *   · the flagged document was replaced —
 *
 * and, where the officer made an *explicit* suggestion and the advocate went a different
 * way, a written justification exists (brief D7). A bare "the IFSC is wrong" answered by
 * a corrected IFSC needs no essay; overriding "it should read KLGB0040213" does.
 *
 * Two tiers, because two callers need different things:
 *   `defectState(defect, value)` — the screen, which holds the live draft value.
 *   `resolutionSatisfies(defect)` — the pure task transition, which does not.
 * They agree because the screen writes and clears `resolution` as the value moves.
 */

import type { Defect, DefectTarget, Resolution } from "./types";

export type DefectState =
  /** Nothing has been done about it yet. */
  | "open"
  /** The value was changed away from an explicit suggestion; say why before it counts. */
  | "needs-justification"
  | "resolved";

const norm = (v: string | undefined | null): string => (v ?? "").trim();

/** Was the officer's exact suggested value taken? */
function tookSuggestion(defect: Defect, value: string | undefined): boolean {
  return !!defect.suggestion && norm(value) === norm(defect.suggestion.to);
}

/**
 * The task-side check: does the recorded resolution stand on its own? Used by `refile`,
 * which has no access to the filing draft.
 */
export function resolutionSatisfies(defect: Defect): boolean {
  const r = defect.resolution;
  if (!r) return false;
  if (r.how === "replaced") return !!r.replacement;
  if (r.how === "accepted") return true;
  // Edited: an explicit suggestion overridden needs a reason on the record.
  return !defect.suggestion || !!norm(r.justification);
}

/**
 * The screen-side state, given what the filing currently holds for this defect's target.
 * `value` is the live field value (field defects) or the replacement file's id (document
 * defects, where `undefined` means nothing has been re-uploaded).
 */
export function defectState(defect: Defect, value: string | undefined): DefectState {
  if (defect.target.kind === "doc") {
    return defect.resolution?.how === "replaced" && defect.resolution.replacement
      ? "resolved"
      : "open";
  }

  const changed = norm(value) !== norm(defect.valueAtReturn);
  if (!changed) return "open";
  if (!defect.suggestion) return "resolved";
  if (tookSuggestion(defect, value)) return "resolved";
  return norm(defect.resolution?.justification) ? "resolved" : "needs-justification";
}

export function isResolved(defect: Defect, value: string | undefined): boolean {
  return defectState(defect, value) === "resolved";
}

/** How many of these defects are addressed, given a lookup of live values. */
export function countResolved(
  defects: readonly Defect[],
  valueOf: (defect: Defect) => string | undefined
): { resolved: number; total: number } {
  let resolved = 0;
  for (const d of defects) if (isResolved(d, valueOf(d))) resolved += 1;
  return { resolved, total: defects.length };
}

/** Every defect addressed — the gate on "Submit corrections to scrutiny". */
export function allResolved(
  defects: readonly Defect[],
  valueOf: (defect: Defect) => string | undefined
): boolean {
  return defects.length > 0 && defects.every((d) => isResolved(d, valueOf(d)));
}

/** The defect the screen should land on when it opens (or re-opens). */
export function firstUnresolved(
  defects: readonly Defect[],
  valueOf: (defect: Defect) => string | undefined
): Defect | null {
  return defects.find((d) => !isResolved(d, valueOf(d))) ?? null;
}

/** "Suggestion accepted" / "Edited" / "Document replaced" — what the frame reports back. */
export function resolutionLabel(defect: Defect, value: string | undefined): string {
  const state = defectState(defect, value);
  if (state !== "resolved") return "";
  if (defect.target.kind === "doc") return "Document replaced";
  if (tookSuggestion(defect, value)) return "Suggestion accepted";
  if (defect.suggestion) return "Changed, with a reason";
  return "Corrected";
}

/** "Case details › Cheque 2 › IFSC code" — never truncated; the queue card wraps it. */
export function breadcrumbOf(target: DefectTarget): string[] {
  const trail = [target.sectionLabel];
  if (target.kind === "field" && target.instanceLabel) trail.push(target.instanceLabel);
  trail.push(target.label);
  return trail;
}

/** A stable key for a defect's target — used to look values up and to focus a field. */
export function targetKey(target: DefectTarget): string {
  if (target.kind === "doc") return `doc:${target.step}:${target.slotKey}`;
  return `field:${target.step}:${target.instance ?? 0}:${target.field}`;
}

/** The resolution to record for a field the advocate has just edited. */
export function editedResolution(
  value: string,
  justification: string | undefined,
  at: string
): Resolution {
  return { how: "edited", value, justification: norm(justification) || undefined, at };
}
