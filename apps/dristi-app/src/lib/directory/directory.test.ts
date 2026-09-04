import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { DIRECTORY_CASES } from "./cases";
import { assignPreview, effectiveGrants, removalPreview } from "./derive";
import { applyResolution, checkRows, importPlan, parseCsv, summarize, toPeople } from "./import";
import type { DirectoryWorld, Group, Person } from "./types";

const CSV = readFileSync(
  new URL("../../../public/demo/office-people.csv", import.meta.url),
  "utf8",
);

const person = (id: string, name: string, phone: string, barId?: string): Person => ({
  id,
  name,
  phone,
  barId,
  status: "registered",
  addedOn: "4 Sep 2026",
});

const rahul = person("p-rahul", "Adv. Rahul Dev", "9633214567", "K/3567/2017");
const meera = person("p-meera", "Adv. Meera Suresh", "9846521190", "K/1567/2009");
const suresh = person("p-suresh", "Suresh Kumar", "9846778123");

const kollam: Group = {
  id: "g-kollam",
  name: "Kollam NI Cases",
  memberIds: [rahul.id, meera.id, suresh.id],
  caseIds: ["c-847", "c-512", "c-233", "c-690"],
  createdOn: "4 Sep 2026",
};
const trial: Group = {
  id: "g-trial",
  name: "Trial Group",
  memberIds: [rahul.id],
  caseIds: ["c-847"],
  createdOn: "4 Sep 2026",
};

const world: DirectoryWorld = {
  people: [rahul, meera, suresh],
  groups: [kollam, trial],
  directGrants: [{ personId: suresh.id, caseId: "c-778", since: "4 Sep 2026" }],
  pending: [],
  cases: DIRECTORY_CASES,
};

describe("effective access", () => {
  it("unions every source and never doubles a case", () => {
    const grants = effectiveGrants(rahul, world);
    const c847 = grants.find((g) => g.caseId === "c-847");
    assert.equal(grants.filter((g) => g.caseId === "c-847").length, 1);
    assert.deepEqual(
      c847?.sources.map((s) => (s.kind === "group" ? s.groupId : s.kind)),
      ["g-kollam", "g-trial"],
    );
    assert.equal(c847?.accessType, "office");
  });

  it("lets the vakalatnama win while keeping the office source", () => {
    const grants = effectiveGrants(meera, world);
    const c847 = grants.find((g) => g.caseId === "c-847");
    assert.equal(c847?.accessType, "vakalatnama");
    assert.deepEqual(
      c847?.sources.map((s) => s.kind),
      ["vakalatnama", "group"],
    );
    // Meera is on the nama of c-330 too, which no group covers.
    assert.equal(grants.find((g) => g.caseId === "c-330")?.accessType, "vakalatnama");
  });

  it("staff never derive vakalatnama access, only office", () => {
    const grants = effectiveGrants(suresh, world);
    assert.ok(grants.every((g) => g.accessType === "office"));
    assert.deepEqual(grants.find((g) => g.caseId === "c-778")?.sources, [{ kind: "direct" }]);
  });
});

describe("removal preview", () => {
  it("names the group's other cases and what survives through another source", () => {
    const preview = removalPreview(rahul, "c-847", kollam, world);
    assert.deepEqual(
      preview.otherCases.map((c) => c.id),
      ["c-512", "c-233", "c-690"],
    );
    assert.deepEqual(preview.keptThroughOtherSource, []);
    assert.equal(preview.membersAffected, 3);
    // Trial Group still grants c-847 to Rahul.
    assert.deepEqual(preview.stillReachesThisCase, [{ kind: "group", groupId: "g-trial" }]);
  });

  it("reports the vakalatnama surviving a group removal", () => {
    const preview = removalPreview(meera, "c-847", kollam, world);
    assert.deepEqual(preview.stillReachesThisCase, [{ kind: "vakalatnama" }]);
  });
});

describe("assign preview", () => {
  it("splits cases the viewer can grant from ones that need a signature", () => {
    const preview = assignPreview(kollam, ["c-847", "c-778", "c-512"], world);
    assert.deepEqual(preview.grantable, ["c-847", "c-512"]);
    assert.deepEqual(preview.needsSignature, ["c-778"]);
    assert.equal(preview.people, 3);
  });
});

describe("the office list import", () => {
  const rows = parseCsv(CSV);
  const checked = checkRows(rows, { cases: DIRECTORY_CASES });

  it("reads all fifty rows by content", () => {
    assert.equal(rows.length, 50);
    assert.equal(rows[0].name, "Adv. Ramesh Pillai");
    assert.equal(rows[0].barId, "K/0894/2004");
    assert.equal(rows[45].name, "");
  });

  it("counts 15 advocates, 30 staff, 5 needing attention", () => {
    assert.deepEqual(summarize(checked), { found: 50, advocates: 15, staff: 30, attention: 5 });
  });

  it("catches every planted discrepancy", () => {
    const kinds = (row: number) =>
      checked.find((r) => r.row === row)!.problems.map((p) => p.kind).sort();
    assert.deepEqual(kinds(46), ["missing-name"]);
    assert.deepEqual(kinds(47), ["duplicate"]);
    assert.deepEqual(kinds(48), ["bad-mobile"]);
    assert.deepEqual(kinds(49), ["bad-bar-id"]);
    assert.deepEqual(kinds(50), ["party"]);
    const party = checked.find((r) => r.row === 50)!.problems[0];
    assert.equal(party.kind === "party" && party.party, "Manoj Pillai");
  });

  it("recognizes the five people already on DRISTI without blocking", () => {
    const known = checked.filter((r) => r.problems.some((p) => p.kind === "known"));
    assert.deepEqual(
      known.map((r) => r.name),
      ["Adv. Ramesh Pillai", "Adv. Meera Suresh", "Adv. Firoz Khan", "Sameer K.", "Akhil Krishnan"],
    );
    assert.ok(known.every((r) => !r.blocking));
  });

  it("clears to 47 people: 42 invited, 5 linked, 3 dropped", () => {
    let next = checked;
    next = applyResolution(next, 47, { kind: "merge", intoRow: 22, name: "Deepa Mohan" });
    next = applyResolution(next, 46, { kind: "drop" });
    next = applyResolution(next, 48, { kind: "fix", mobile: "9847211234" });
    next = applyResolution(next, 49, { kind: "fix", barId: "K/5599/2020" });
    next = applyResolution(next, 50, { kind: "drop" });
    assert.deepEqual(importPlan(next, 50), { invite: 42, link: 5, dropped: 3, ready: true });
    const people = toPeople(next, "4 Sep 2026");
    assert.equal(people.length, 47);
    assert.equal(people.filter((p) => p.barId).length, 16); // 15 + Ayesha, fixed
    assert.equal(people.find((p) => p.phone === "9847034521")?.status, "registered");
    assert.equal(people.find((p) => p.phone === "9633214567")?.status, "invited");
  });

  it("clearing a bad Bar ID makes the row staff", () => {
    const next = applyResolution(checked, 49, { kind: "fix", barId: "" });
    const ayesha = next.find((r) => r.row === 49)!;
    assert.equal(ayesha.blocking, false);
    assert.equal(ayesha.barId, "");
  });
});
