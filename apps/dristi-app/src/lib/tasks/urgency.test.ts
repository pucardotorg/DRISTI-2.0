import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, makeTask, NOW } from "./fixtures";
import { compareUrgency, consequenceAt, daysUntil, isOverdue, nextConsequenceAt } from "./urgency";

describe("consequenceAt / isOverdue", () => {
  it("no date → undefined, never overdue", () => {
    const t = makeTask({ dueKind: "none" });
    assert.equal(consequenceAt(t), undefined);
    assert.equal(isOverdue(t, NOW), false);
  });

  it("uses the earlier of the deadline and the hearing", () => {
    const t = makeTask({ dueAt: at(10), hearingAt: at(1, 5), isBlocking: true });
    assert.equal(consequenceAt(t), at(1, 5));
  });

  it("due yesterday → overdue; due today → not", () => {
    assert.equal(isOverdue(makeTask({ dueAt: at(-1) }), NOW), true);
    assert.equal(isOverdue(makeTask({ dueAt: at(0, 1) }), NOW), false);
    assert.equal(daysUntil(at(-3), NOW), -3);
  });
});

describe("nextConsequenceAt", () => {
  it("an overdue task that still blocks an upcoming hearing is ordered by that hearing", () => {
    const t = makeTask({ dueAt: at(-5), hearingAt: at(2, 5), isBlocking: true });
    assert.equal(nextConsequenceAt(t, NOW), at(2, 5));
  });

  it("once the hearing has passed, the earliest missed date stands", () => {
    const t = makeTask({ dueAt: at(-5), hearingAt: at(-2, 5), isBlocking: true });
    assert.equal(nextConsequenceAt(t, NOW), at(-5));
  });
});

describe("compareUrgency", () => {
  const sorted = (...tasks: ReturnType<typeof makeTask>[]) =>
    [...tasks].sort((a, b) => compareUrgency(a, b, NOW)).map((t) => t.id);

  it("overdue first, then by the date that will hurt, undated last", () => {
    const later = makeTask({ id: "later", dueAt: at(20) });
    const today = makeTask({ id: "today", dueAt: at(0) });
    const overdue = makeTask({ id: "overdue", dueAt: at(-2) });
    const undated = makeTask({ id: "undated", dueKind: "none" });
    const longOverdue = makeTask({ id: "long", dueAt: at(-60) });
    const soon = makeTask({ id: "soon", dueAt: at(3) });
    assert.deepEqual(sorted(later, today, overdue, undated, longOverdue, soon), [
      "long",
      "overdue",
      "today",
      "soon",
      "later",
      "undated",
    ]);
  });

  it("among overdue tasks, the one blocking the nearer hearing comes first", () => {
    const a = makeTask({ id: "a", dueAt: at(-10), hearingAt: at(5, 5), isBlocking: true });
    const b = makeTask({ id: "b", dueAt: at(-1), hearingAt: at(2, 5), isBlocking: true });
    assert.deepEqual(sorted(a, b), ["b", "a"]);
  });

  it("a task a listed hearing cannot proceed without leads the overdue pile, however old the others are", () => {
    // 41 days overdue but the summons hearing is in 3 days; 20 days overdue, no hearing tied.
    const fee = makeTask({ id: "fee", dueAt: at(-41), hearingAt: at(3, 10), isBlocking: true });
    const affidavit = makeTask({ id: "affidavit", dueAt: at(-20) });
    assert.deepEqual(sorted(affidavit, fee), ["fee", "affidavit"]);
    // Not overdue: an upcoming blocker still leads an earlier plain deadline.
    const blocker = makeTask({ id: "blocker", dueAt: at(4), hearingAt: at(4, 10), isBlocking: true });
    const plain = makeTask({ id: "plain", dueAt: at(1) });
    assert.deepEqual(sorted(plain, blocker), ["blocker", "plain"]);
  });

  it("is deterministic down to the id", () => {
    const a = makeTask({ id: "a", dueAt: at(1) });
    const b = makeTask({ id: "b", dueAt: at(1) });
    assert.deepEqual(sorted(b, a), ["a", "b"]);
  });

  it("falls back to case, then oldest created", () => {
    const a = makeTask({ id: "a", dueAt: at(1), caseId: "c-2", createdAt: at(-1) });
    const b = makeTask({ id: "b", dueAt: at(1), caseId: "c-1", createdAt: at(-1) });
    const c = makeTask({ id: "c", dueAt: at(1), caseId: "c-1", createdAt: at(-9) });
    assert.deepEqual(sorted(a, b, c), ["c", "b", "a"]);
  });
});
