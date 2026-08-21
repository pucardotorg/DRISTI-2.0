/**
 * Reading and writing a filing draft at the place a scrutiny defect points.
 *
 * A `DefectTarget` is `{ step, instance, field }` or `{ step, slotKey }`; this is the one
 * place that turns that into a value on the draft. Keeping it pure and in `lib/` means
 * the resolution derivation can be tested without rendering the form.
 *
 * Only the steps a defect can currently be raised against are mapped. An unmapped step
 * reads back `undefined`, which the screen shows as "we cannot open this defect's field"
 * rather than silently treating it as resolved.
 */

import type { DefectTarget } from "@/lib/tasks/types";
import type { FilingDraft } from "./types";

type Row = Record<string, unknown> & {
  prefilled?: Record<string, boolean>;
  edited?: Record<string, boolean>;
};

function rowFor(draft: FilingDraft, target: DefectTarget): Row | undefined {
  if (target.kind !== "field") return undefined;
  const i = target.instance ?? 0;
  switch (target.step) {
    case "cheque":
      return draft.cheques[i] as unknown as Row;
    case "complainant":
      return draft.complainants[i] as unknown as Row;
    case "demand-notice":
      return draft.notices[i] as unknown as Row;
    case "accused":
      return draft.accused[i] as unknown as Row;
    case "witnesses":
      return draft.witnesses[i] as unknown as Row;
    case "advocate":
      return draft.advocates[i] as unknown as Row;
    case "jurisdiction":
      return draft.jurisdiction as unknown as Row;
    default:
      return undefined;
  }
}

/** Every intake slot on the draft, by key — cheque groups, parties, supporting. */
export function intakeSlot(draft: FilingDraft, slotKey: string) {
  for (const g of draft.intake.cheques) {
    const hit = g.slots.find((s) => s.key === slotKey);
    if (hit) return hit;
  }
  for (const g of draft.intake.parties) {
    const hit = g.slots.find((s) => s.key === slotKey);
    if (hit) return hit;
  }
  return draft.intake.supporting.find((s) => s.key === slotKey);
}

/**
 * What the filing currently holds at this target: the field's value, or — for a document
 * — the id of the file in its slot. `undefined` means the target does not resolve on this
 * draft at all.
 */
export function readTarget(draft: FilingDraft, target: DefectTarget): string | undefined {
  if (target.kind === "doc") return intakeSlot(draft, target.slotKey)?.file?.id;
  const row = rowFor(draft, target);
  if (!row) return undefined;
  const value = row[target.field];
  return typeof value === "string" ? value : undefined;
}

/**
 * Write a corrected value at this target. Also clears the machine-read marker the way an
 * ordinary edit does — a value a person has just corrected is no longer "read, unverified"
 * (`foundations/colors`: `prefilled`).
 */
export function writeTarget(draft: FilingDraft, target: DefectTarget, value: string): void {
  if (target.kind !== "field") return;
  const row = rowFor(draft, target);
  if (!row) return;
  row[target.field] = value;
  if (row.edited) row.edited[target.field] = true;
  // A corrected IFSC retires whatever the last registry lookup filled from it.
  if (target.step === "cheque" && target.field === "ifsc") row.ifscFetched = false;
}
