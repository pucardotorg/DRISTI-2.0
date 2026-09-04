/**
 * Pure derivations over the directory world. The provider mutates; these
 * read. Every screen's truth about "who has what, and why" comes from here,
 * so the rules live in one place:
 *
 * - access to a case = the union of every source that grants it;
 * - vakalatnama wins a conflict, and co-existing office sources are kept;
 * - removal previews name the blast radius by case, never as a number alone.
 */

import type {
  DirectoryCase,
  DirectoryWorld,
  EffectiveGrant,
  Group,
  GrantSource,
  Person,
} from "./types";

/** "Adv. Ramesh Pillai" and "Ramesh Pillai" are the same person. */
export function normalizeName(name: string): string {
  return name
    .replace(/^adv\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function displayName(name: string): string {
  return name.replace(/^Adv\.\s*/, "");
}

export function isAdvocate(person: Pick<Person, "barId">): boolean {
  return Boolean(person.barId);
}

/** Does the viewer hold this case's vakalatnama, or only office access? */
export function viewerHoldsVakalatnama(kase: DirectoryCase): boolean {
  return kase.viewer.kind === "vakalatnama";
}

/** Cases where this person is named on the vakalatnama (the court's lane). */
export function vakalatnamaCaseIds(person: Person, cases: DirectoryCase[]): string[] {
  if (!isAdvocate(person)) return [];
  const key = normalizeName(person.name);
  return cases.filter((c) => c.counsel.some((n) => normalizeName(n) === key)).map((c) => c.id);
}

export function groupsOf(personId: string, groups: Group[]): Group[] {
  return groups.filter((g) => g.memberIds.includes(personId));
}

/**
 * The person's standing on every case any source reaches. One entry per
 * case; sources in the order vakalatnama → groups → direct.
 */
export function effectiveGrants(person: Person, world: DirectoryWorld): EffectiveGrant[] {
  const byCase = new Map<string, GrantSource[]>();
  const add = (caseId: string, source: GrantSource) => {
    const list = byCase.get(caseId) ?? [];
    list.push(source);
    byCase.set(caseId, list);
  };

  for (const caseId of vakalatnamaCaseIds(person, world.cases)) {
    add(caseId, { kind: "vakalatnama" });
  }
  for (const group of groupsOf(person.id, world.groups)) {
    for (const caseId of group.caseIds) add(caseId, { kind: "group", groupId: group.id });
  }
  for (const grant of world.directGrants) {
    if (grant.personId === person.id) {
      add(grant.caseId, grant.addedBy ? { kind: "direct", addedBy: grant.addedBy } : { kind: "direct" });
    }
  }

  return [...byCase.entries()].map(([caseId, sources]) => ({
    personId: person.id,
    caseId,
    accessType: sources.some((s) => s.kind === "vakalatnama") ? "vakalatnama" : "office",
    sources,
  }));
}

/** Everyone whose effective access reaches this case, office or nama. */
export function peopleOnCase(caseId: string, world: DirectoryWorld): Person[] {
  return world.people.filter((p) => effectiveGrants(p, world).some((g) => g.caseId === caseId));
}

/**
 * How many people gain office access when a group is assigned to cases:
 * members who did not already reach each case through another source.
 * Used for the honest confirm line.
 */
export function assignPreview(
  group: Group,
  caseIds: string[],
  world: DirectoryWorld,
): { people: number; cases: number; grantable: string[]; needsSignature: string[] } {
  const grantable: string[] = [];
  const needsSignature: string[] = [];
  for (const caseId of caseIds) {
    const kase = world.cases.find((c) => c.id === caseId);
    if (!kase) continue;
    if (viewerHoldsVakalatnama(kase)) grantable.push(caseId);
    else needsSignature.push(caseId);
  }
  return {
    people: group.memberIds.length,
    cases: grantable.length,
    grantable,
    needsSignature,
  };
}

/**
 * What a group-sourced removal would do, both ways, by case name. Drives
 * the two-choice modal: remove the person from the group (they lose every
 * case the group grants) or remove the case from the group (everyone in it
 * loses the case).
 */
export function removalPreview(
  person: Person,
  caseId: string,
  group: Group,
  world: DirectoryWorld,
): {
  /** The group's other cases this person would lose, by case. */
  otherCases: DirectoryCase[];
  /** Cases among those they would still reach through another source. */
  keptThroughOtherSource: string[];
  /** Members who lose the case if it leaves the group. */
  membersAffected: number;
  /** After removal, does the person still reach THIS case some other way? */
  stillReachesThisCase: GrantSource[];
} {
  const grants = effectiveGrants(person, world);
  const otherCases = group.caseIds
    .filter((id) => id !== caseId)
    .map((id) => world.cases.find((c) => c.id === id))
    .filter((c): c is DirectoryCase => Boolean(c));
  const keptThroughOtherSource = otherCases
    .filter((c) => {
      const g = grants.find((x) => x.caseId === c.id);
      return g?.sources.some((s) => !(s.kind === "group" && s.groupId === group.id));
    })
    .map((c) => c.id);
  const thisGrant = grants.find((g) => g.caseId === caseId);
  const stillReachesThisCase =
    thisGrant?.sources.filter((s) => !(s.kind === "group" && s.groupId === group.id)) ?? [];
  return {
    otherCases,
    keptThroughOtherSource,
    membersAffected: group.memberIds.length,
    stillReachesThisCase,
  };
}

/** Name the source the way the person meets it. */
export function sourceLabel(source: GrantSource, groups: Group[]): string {
  if (source.kind === "vakalatnama") return "Vakalatnama";
  if (source.kind === "direct") {
    return source.addedBy ? `Added directly by ${displayName(source.addedBy)}` : "Added directly";
  }
  const group = groups.find((g) => g.id === source.groupId);
  return group ? `via ${group.name}` : "via a group";
}

/** Two names, then "+N more" — the folding rule for every name list. */
export function foldNames(names: string[], shown = 3): { shown: string[]; more: number } {
  return { shown: names.slice(0, shown), more: Math.max(0, names.length - shown) };
}

/** "94470 88221" for a bare 10-digit string. */
export function formatPhone(digits: string): string {
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

/** Today in the display format the fixtures use ("4 Sep 2026"). */
export function displayToday(now = new Date()): string {
  return now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
