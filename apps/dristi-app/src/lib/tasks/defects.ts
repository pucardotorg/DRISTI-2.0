/**
 * Whether a scrutiny defect has been addressed — derived, never self-certified.
 *
 * The old model asked the advocate to tick a box; the tick meant only that someone
 * ticked it (brief §2, problem 1). Here "addressed" is a fact computed from what is
 * actually in the filing:
 *
 *   · the flagged field's value changed from what scrutiny saw, or
 *   · the officer's suggestion was taken, or
 *   · the flagged document was replaced, or
 *   · the value stands as filed and the advocate wrote *why* —
 *
 * and, where the officer made an *explicit* suggestion and the advocate went a different
 * way, a written justification exists (brief D7). A bare "the IFSC is wrong" answered by
 * a corrected IFSC needs no essay; overriding "it should read KLGB0040213" does.
 *
 * That fourth route is disagreement, and it is a resolution rather than a hole in the
 * gate (brief D7, objective 3): "the original value is right, here is why" travels back
 * with the correction. Without it the only way past the submit gate is to edit a field
 * the advocate believes is already correct, which is pressure to falsify a legal filing.
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

/** Does the filing hold something other than what scrutiny saw? */
function changed(defect: Defect, value: string | undefined): boolean {
  return norm(value) !== norm(defect.valueAtReturn);
}

/** The reason the advocate has written, if any. */
function reasonOf(defect: Defect): string {
  return norm(defect.resolution?.justification);
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
  // Kept: the filed value stands, so the reason is the whole resolution.
  if (r.how === "kept") return !!norm(r.justification);
  // Edited: an explicit suggestion overridden needs a reason on the record.
  return !defect.suggestion || !!norm(r.justification);
}

/**
 * The screen-side state, given what the filing currently holds for this defect's target.
 * `value` is the live field value (field defects) or the replacement file's id (document
 * defects, where `undefined` means nothing has been re-uploaded).
 *
 * Read as a table for a field defect:
 *
 *   value unchanged, no reason      → open
 *   value unchanged, reason written → resolved (the advocate disagrees, on the record)
 *   value = the suggested value     → resolved
 *   value changed, no suggestion    → resolved
 *   value changed, suggestion       → resolved once a reason is written
 *
 * The reason is read off the record rather than the record's `how`, because the reason is
 * what the Registry receives — a stale `how` should never decide whether a defect counts.
 */
export function defectState(defect: Defect, value: string | undefined): DefectState {
  if (defect.target.kind === "doc") {
    return defect.resolution?.how === "replaced" && defect.resolution.replacement
      ? "resolved"
      : "open";
  }

  if (!changed(defect, value)) return reasonOf(defect) ? "resolved" : "open";
  if (tookSuggestion(defect, value)) return "resolved";
  if (!defect.suggestion) return "resolved";
  return reasonOf(defect) ? "resolved" : "needs-justification";
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

/** "Suggestion accepted" / "Kept, with a reason" — what the frame reports back. */
export function resolutionLabel(defect: Defect, value: string | undefined): string {
  const state = defectState(defect, value);
  if (state !== "resolved") return "";
  if (defect.target.kind === "doc") return "Document replaced";
  if (!changed(defect, value)) return "Kept, with a reason";
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

/** The resolution to record when the filed value stands and the advocate said why (D7). */
export function keptResolution(value: string, justification: string, at: string): Resolution {
  return { how: "kept", value, justification: norm(justification), at };
}

/**
 * What the task's record *should* say about a field defect, given what the filing now
 * holds and the reason the advocate has written. `undefined` means "nothing was done" —
 * the record is cleared.
 *
 * The screen calls this once per commit rather than per keystroke: the state above is
 * derived live from the draft, so the record only has to catch up when a human act ends
 * (blur, an explicit accept, a pause in typing). One human act, one line of history.
 */
export function intendedResolution(
  defect: Defect,
  value: string | undefined,
  justification: string,
  at: string
): Resolution | undefined {
  if (defect.target.kind === "doc") return defect.resolution;
  const reason = norm(justification);
  if (!changed(defect, value)) {
    return reason ? keptResolution(norm(defect.valueAtReturn), reason, at) : undefined;
  }
  const now = value ?? "";
  if (tookSuggestion(defect, value)) return { how: "accepted", value: now, at };
  return editedResolution(now, reason, at);
}

/**
 * Do two records say the same thing? Compared on substance, never on `at` — otherwise
 * every reconciliation would look like a change and write another line of history.
 */
export function sameResolution(a: Resolution | undefined, b: Resolution | undefined): boolean {
  if (!a || !b) return a === b;
  return (
    a.how === b.how &&
    norm(a.value) === norm(b.value) &&
    norm(a.justification) === norm(b.justification) &&
    (a.replacement?.id ?? null) === (b.replacement?.id ?? null)
  );
}

/**
 * Is a reason *owed* for what the filing currently holds — the marker the inset shows?
 *
 * Two things are true at once and must not be confused. A bare-note defect left untouched
 * is not resolved (the table above: unchanged and no reason → open), and the only way past
 * it without editing is to say why the value stands. But the advocate who has just opened
 * the defect has not yet said anything, and the control is *prefilled* with the filed
 * value — so reading that prefill as an implicit "I keep this" and marking the reason
 * REQUIRED on arrival demands a justification for the one thing they have not done yet.
 * That inverts §15.3's own rule ("bare-note defect, new value entered → optional").
 *
 * So: where scrutiny made an explicit suggestion, keeping the filed value is already a
 * position the moment tier 3 is open — Accept was right there — and the reason is owed
 * (D7, unchanged). Where scrutiny only left a note, the reason becomes owed once the
 * advocate has actually moved the value and brought it back: that return *is* the
 * statement. Until then the field is optional and says so.
 */
export function reasonRequired(
  defect: Defect,
  value: string | undefined,
  /** Has the value differed from what scrutiny saw at any point in this sitting? */
  valueEverChanged: boolean
): boolean {
  if (defect.target.kind === "doc") return false;
  if (defectState(defect, value) === "needs-justification") return true;
  if (changed(defect, value)) return false;
  return defect.suggestion ? true : valueEverChanged;
}
