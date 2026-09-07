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

/**
 * Whether a row's own words answer what was typed into a court-side search box.
 *
 * Shared for the same reason `isPendingFilterChange` is: every queue on the court side
 * offers one free-text box over a case, and a box that behaves differently on each screen
 * is a box the bench cannot learn.
 *
 * **Every token has to land, in any order and any amount of space.** The reference labels
 * these boxes "Case Name or Number", so the first thing a clerk does is read a name off
 * the Case name column and type it back — and a column prints a *cause title*,
 * "Girija Damodaran v. Sabu Chacko", which no single stored field contains. Matching one
 * contiguous substring against the parties separately therefore fails the most obvious
 * query on the screen, and so does a stray double space. Splitting the query and asking
 * that each part appear somewhere in the row fixes both, and costs nothing a clerk has to
 * know about.
 *
 * Pass the row's words as they are *shown* — the cause title, not the two parties — so
 * what is on screen is what can be found.
 */
export function matchesQuery(
  query: string,
  ...parts: (string | undefined)[]
): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // An empty box is not a filter; it asks for everything.
  if (tokens.length === 0) return true;
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}
