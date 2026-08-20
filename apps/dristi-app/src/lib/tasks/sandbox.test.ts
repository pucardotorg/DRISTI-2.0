import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cardKindOf, canView, viewOf } from "./permissions";
import { buildTasks, CASES, PEOPLE } from "./sandbox";
import type { Person } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/** Whole calendar days between two ISO instants, local. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / DAY);
}

function person(id: string): Person {
  const p = PEOPLE.find((x) => x.id === id);
  assert.ok(p, `person ${id} in the seed`);
  return p;
}

describe("sandbox seed — grounded in the 1.0 inventory", () => {
  const tasks = buildTasks();

  it("every task parses: a real case, a history, and a visible advocate", () => {
    for (const t of tasks) {
      const kase = CASES.find((c) => c.id === t.caseId);
      assert.ok(kase, `${t.id} points at a seeded case`);
      assert.ok(t.history.length >= 1, `${t.id} opens with a history line`);
      assert.ok(
        PEOPLE.some((p) => canView(p, kase)),
        `${t.id} is visible to someone`
      );
    }
  });

  it("returned tasks cure in 3 days from the return date (the 1.0 window)", () => {
    const returned = tasks.filter((t) => t.kind === "returned");
    assert.ok(returned.length >= 3);
    for (const t of returned) {
      assert.ok(t.returned && t.dueAt, `${t.id} carries the return and a due date`);
      assert.equal(daysBetween(t.returned.at, t.dueAt), 3, `${t.id} due 3 days after return`);
      assert.equal(t.deadlineNote, "Registry allows 3 days to cure defects");
    }
  });

  it("open payment tasks declare their closure rule, auto-closure included", () => {
    const openPays = tasks.filter((t) => t.kind === "pay" && ["open", "payment-confirming"].includes(t.status));
    for (const t of openPays) {
      assert.ok(t.closesWhen, `${t.id} declares closesWhen`);
      if (t.hearingAt) assert.equal(t.closesWhen, "Closes on payment, or when the hearing passes");
    }
  });

  it("the vakalatnama fee task: pay card, due today, dedup closure rule", () => {
    const t = tasks.find((x) => x.id === "t-vakfee509");
    assert.ok(t);
    assert.equal(cardKindOf(t), "pay");
    assert.equal(daysBetween(new Date().toISOString(), t.dueAt!), 0);
    assert.equal(t.closesWhen, "Closes when this or any other vakalatnama fee on the case is paid");
    // A signatory on the case holds the verb — it needs their action.
    const kase = CASES.find((c) => c.id === t.caseId)!;
    assert.equal(viewOf(t, person(kase.signatories[0]), kase), "needs-action");
  });

  it("a response task carries the court-decides auto-close rule", () => {
    const t = tasks.find((x) => x.id === "t-reply88");
    assert.ok(t);
    assert.equal(t.closesWhen, "Closes when the court decides the application");
  });

  it("the date-preferences task: hearing card, court-set due, chosen-or-decided closure", () => {
    const t = tasks.find((x) => x.id === "t-dates941");
    assert.ok(t);
    assert.equal(t.kind, "hearing");
    assert.equal(cardKindOf(t), "hearing");
    assert.equal(t.dueKind, "court-set");
    assert.equal(t.closesWhen, "Closes when you choose dates, or when the court decides the rescheduling request");
    // Anyone on the case can act on a hearing task — Needs action from every chair.
    const kase = CASES.find((c) => c.id === t.caseId)!;
    for (const id of kase.advocates) assert.equal(viewOf(t, person(id), kase), "needs-action");
  });
});
