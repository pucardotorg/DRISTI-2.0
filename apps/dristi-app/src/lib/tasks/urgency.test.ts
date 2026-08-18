import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, makeTask, NOW } from "./fixtures";
import { bandOf, compareUrgency, LONG_PENDING_DAYS, SOON_DAYS } from "./urgency";

describe("bandOf", () => {
  it("has no date → undated", () => {
    assert.equal(bandOf(makeTask({ dueKind: "none" }), NOW), "undated");
  });

  it("due today → today, however late in the day", () => {
    assert.equal(bandOf(makeTask({ dueAt: at(0, 23) }), NOW), "today");
    assert.equal(bandOf(makeTask({ dueAt: at(0, 1) }), NOW), "today");
  });

  it("due yesterday → overdue; due tomorrow → soon", () => {
    assert.equal(bandOf(makeTask({ dueAt: at(-1) }), NOW), "overdue");
    assert.equal(bandOf(makeTask({ dueAt: at(1) }), NOW), "soon");
  });

  it(`the 7-day boundary: +${SOON_DAYS} is soon, +${SOON_DAYS + 1} is later`, () => {
    assert.equal(bandOf(makeTask({ dueAt: at(SOON_DAYS) }), NOW), "soon");
    assert.equal(bandOf(makeTask({ dueAt: at(SOON_DAYS + 1) }), NOW), "later");
  });

  it("before-hearing tasks are soon however far the posting is", () => {
    assert.equal(bandOf(makeTask({ dueAt: at(20), dueKind: "before-hearing" }), NOW), "soon");
  });

  it(`the 45-day boundary: −${LONG_PENDING_DAYS} is overdue, −${LONG_PENDING_DAYS + 1} is long pending`, () => {
    assert.equal(bandOf(makeTask({ dueAt: at(-LONG_PENDING_DAYS) }), NOW), "overdue");
    assert.equal(bandOf(makeTask({ dueAt: at(-LONG_PENDING_DAYS - 1) }), NOW), "long-pending");
  });

  it("uses the earlier of due date and blocked hearing", () => {
    // Due in 10 days but blocks a hearing tomorrow → soon (tomorrow is the consequence).
    assert.equal(
      bandOf(makeTask({ dueAt: at(10), blocksHearingAt: at(1, 5), isBlocking: true }), NOW),
      "soon"
    );
    // No due date, blocks a hearing today → today.
    assert.equal(
      bandOf(makeTask({ blocksHearingAt: at(0, 5), isBlocking: true }), NOW),
      "today"
    );
  });
});

describe("compareUrgency", () => {
  const sorted = (...tasks: ReturnType<typeof makeTask>[]) =>
    [...tasks].sort((a, b) => compareUrgency(a, b, NOW)).map((t) => t.id);

  it("orders by band first", () => {
    const later = makeTask({ id: "later", dueAt: at(20) });
    const today = makeTask({ id: "today", dueAt: at(0) });
    const overdue = makeTask({ id: "overdue", dueAt: at(-2) });
    const undated = makeTask({ id: "undated", dueKind: "none" });
    const longPending = makeTask({ id: "long", dueAt: at(-60) });
    const soon = makeTask({ id: "soon", dueAt: at(3) });
    assert.deepEqual(sorted(later, today, overdue, undated, longPending, soon), [
      "overdue",
      "today",
      "soon",
      "later",
      "undated",
      "long",
    ]);
  });

  it("puts a sent-back task at the top of its band", () => {
    const a = makeTask({ id: "a", dueAt: at(-5), isBlocking: true });
    const b = makeTask({ id: "b", dueAt: at(-1), status: "sent-back" });
    assert.deepEqual(sorted(a, b), ["b", "a"]);
  });

  it("then blocking before not blocking", () => {
    const notBlocking = makeTask({ id: "nb", dueAt: at(-10) });
    const blocking = makeTask({ id: "b", dueAt: at(-1), isBlocking: true, blocksHearingAt: at(1, 5) });
    assert.deepEqual(sorted(notBlocking, blocking), ["b", "nb"]);
  });

  it("then earliest consequence date", () => {
    const a = makeTask({ id: "a", dueAt: at(-1) });
    const b = makeTask({ id: "b", dueAt: at(-10) });
    assert.deepEqual(sorted(a, b), ["b", "a"]);
  });

  it("among overdue blockers, the one whose hearing comes up first leads — not the longest overdue", () => {
    // 41 days overdue but its hearing is the day after tomorrow; 2 days overdue and blocks tomorrow.
    const longOverdue = makeTask({ id: "long", dueAt: at(-41), isBlocking: true, blocksHearingAt: at(2, 10) });
    const tomorrow = makeTask({ id: "tmrw", dueAt: at(-2), isBlocking: true, blocksHearingAt: at(1, 10) });
    assert.deepEqual(sorted(longOverdue, tomorrow), ["tmrw", "long"]);
    // Same hearing → the one that fell due first leads.
    const sameHearing = makeTask({ id: "same", dueAt: at(-4), isBlocking: true, blocksHearingAt: at(2, 10) });
    assert.deepEqual(sorted(sameHearing, longOverdue), ["long", "same"]);
  });

  it("then case, then oldest created, then id — deterministic", () => {
    const base = { dueAt: at(-2) };
    const c2 = makeTask({ id: "z", caseId: "c-2", ...base });
    const c1new = makeTask({ id: "y", caseId: "c-1", createdAt: at(-1), ...base });
    const c1old = makeTask({ id: "x", caseId: "c-1", createdAt: at(-9), ...base });
    const tieA = makeTask({ id: "a", caseId: "c-1", createdAt: at(-9), ...base });
    assert.deepEqual(sorted(c2, c1new, c1old, tieA), ["a", "x", "y", "z"]);
    // Order does not depend on input order.
    assert.deepEqual(sorted(tieA, c1old, c1new, c2), ["a", "x", "y", "z"]);
  });
});
