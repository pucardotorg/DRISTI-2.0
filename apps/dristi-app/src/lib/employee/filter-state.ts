/**
 * When a court-side filter form has something left to ask for.
 *
 * Every queue on the court side filters the same way: the controls hold a `draft`, the
 * table shows what was `applied`, and a Search button moves one to the other. That makes
 * "is there anything to search for?" one question with one answer, asked twelve times —
 * so it is answered here rather than re-derived per screen.
 *
 * The button reads this to decide whether it is live. A Search that is always pressable
 * is a Search that means nothing on a form nobody has touched, and since the court asked
 * for these buttons in the primary fill, an always-on one would also be a standing
 * invitation on every queue in the product.
 */

/** A filter object as these screens hold one: flat, and only ever text. */
type FilterShape = Record<string, string | null>;

/**
 * Whether `draft` is asking for something `applied` is not already showing.
 *
 * Compared field by field, with each value settled first: `null` and `""` are both "not
 * asked for", and a query is trimmed the way every one of these filters trims it before
 * matching — trailing space is not a search the bench meant to run.
 *
 * **Resolve defaulted fields before calling.** Where `null` means something other than
 * empty — "the day the court is sitting", on the screens that carry a date — an untouched
 * field and a deliberately picked today are the same request, and only the screen knows
 * that. Those screens pass resolved objects in (`resolveRange`, `resolveADiaryDay`).
 */
export function isPendingFilterChange<T extends FilterShape>(
  draft: T,
  applied: T,
): boolean {
  return Object.keys(draft).some(
    (key) => settled(draft[key]) !== settled(applied[key]),
  );
}

function settled(value: string | null | undefined): string {
  return value?.trim() ?? "";
}
