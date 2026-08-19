import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, junior, kase, makeTask, NOW, otherCase, outsider, PEOPLE, senior } from "./fixtures";
import {
  applyFilters,
  cardCounts,
  courtsOf,
  DEFAULT_FILTERS,
  isNarrowed,
  summaryOf,
  viewCounts,
  type World,
} from "./selectors";
import type { Task } from "./types";

const tasks: Task[] = [
  makeTask({ id: "overdue-pay", kind: "pay", dueAt: at(-3) }),
  makeTask({ id: "today-sign", kind: "sign", dueAt: at(0) }),
  makeTask({ id: "week-file", kind: "file", dueAt: at(5), hearingAt: at(6, 5), isBlocking: true }),
  makeTask({ id: "draft-file", kind: "file", status: "draft", dueAt: at(9), draft: { by: junior.id, savedAt: at(-1) } }),
  makeTask({ id: "ready-sign", kind: "sign", status: "ready", dueAt: at(2), prepared: { by: junior.id, at: at(-1) } }),
  makeTask({ id: "hearing", kind: "hearing", dueAt: at(3, 5), hearingAt: at(3, 5), isBlocking: true }),
  makeTask({ id: "returned", kind: "returned", dueAt: at(1), returned: { by: "scrutiny", at: at(-1), defects: [] } }),
  makeTask({ id: "waiting", kind: "file", status: "awaiting-court", dueAt: at(-1) }),
  makeTask({ id: "confirming", kind: "pay", status: "payment-confirming" }),
  makeTask({ id: "done", kind: "pay", status: "done", completion: { at: at(-2), how: "event" } }),
  makeTask({ id: "other-case", kind: "sign", caseId: otherCase.id, dueAt: at(-5) }),
];

const world = (user = senior): World => ({ people: PEOPLE, cases: [kase, otherCase], tasks, user, now: NOW });

describe("visibility and views", () => {
  it("only tasks on the person's cases are counted", () => {
    assert.deepEqual(viewCounts(world(senior)), { open: 7, waiting: 2, completed: 1 });
    assert.deepEqual(viewCounts(world(outsider)), { open: 1, waiting: 0, completed: 0 });
    assert.deepEqual(viewCounts(world(junior)), { open: 7, waiting: 2, completed: 1 });
  });

  it("the header summary", () => {
    assert.deepEqual(summaryOf(world()), { open: 7, waiting: 2, overdue: 1 });
  });
});

describe("cardCounts", () => {
  it("counts per card for the Open view, with overdue and next due", () => {
    const c = cardCounts(world(), "open");
    assert.equal(c.pay.count, 1);
    assert.equal(c.pay.overdue, 1);
    assert.equal(c.pay.nextDue, undefined);
    assert.equal(c.sign.count, 2);
    assert.equal(c.sign.overdue, 0);
    assert.equal(c.sign.nextDue, at(0));
    assert.equal(c.file.count, 1); // the draft moved to Drafts
    assert.equal(c.draft.count, 1);
    assert.equal(c.hearing.count, 1);
    assert.equal(c.returned.count, 1);
  });

  it("describes the Waiting and Completed views too", () => {
    assert.equal(cardCounts(world(), "waiting").file.count, 1);
    assert.equal(cardCounts(world(), "waiting").pay.count, 1);
    assert.equal(cardCounts(world(), "waiting").file.overdue, 0);
    assert.equal(cardCounts(world(), "completed").pay.count, 1);
    assert.equal(cardCounts(world(), "completed").pay.overdue, 0);
  });
});

describe("applyFilters", () => {
  const ids = (f: Partial<typeof DEFAULT_FILTERS>) => applyFilters(world(), { ...DEFAULT_FILTERS, ...f }).map((t) => t.id);

  it("default: the Open view sorted by urgency", () => {
    assert.deepEqual(ids({}), ["overdue-pay", "hearing", "week-file", "today-sign", "returned", "ready-sign", "draft-file"]);
  });

  it("a card narrows to one kind", () => {
    assert.deepEqual(ids({ kind: "sign" }), ["today-sign", "ready-sign"]);
    assert.deepEqual(ids({ kind: "draft" }), ["draft-file"]);
    assert.deepEqual(ids({ kind: "file" }), ["week-file"]);
  });

  it("due filters", () => {
    assert.deepEqual(ids({ due: "overdue" }), ["overdue-pay"]);
    assert.deepEqual(ids({ due: "today" }), ["today-sign"]);
    assert.deepEqual(ids({ due: "week" }), ["hearing", "week-file", "today-sign", "returned", "ready-sign"]);
    assert.deepEqual(ids({ due: "before-hearing" }), ["hearing", "week-file"]);
  });

  it("court, advocate and search", () => {
    assert.deepEqual(ids({ court: "JMFC Court 1, Kollam" }), []);
    assert.equal(ids({ court: kase.court }).length, 7);
    assert.equal(ids({ advocate: junior.id }).length, 7);
    assert.deepEqual(ids({ advocate: outsider.id }), []);
    assert.deepEqual(ids({ query: "process" }).length, 7);
    assert.deepEqual(ids({ query: "ST 1/2025 zzz" }), []);
  });

  it("other views and sorts", () => {
    assert.deepEqual(ids({ view: "waiting" }), ["waiting", "confirming"]);
    assert.deepEqual(ids({ view: "completed" }), ["done"]);
    assert.deepEqual(ids({ sort: "kind" }).slice(0, 3), ["today-sign", "ready-sign", "overdue-pay"]);
  });

  it("isNarrowed", () => {
    assert.equal(isNarrowed(DEFAULT_FILTERS), false);
    assert.equal(isNarrowed({ ...DEFAULT_FILTERS, view: "waiting" }), false);
    assert.equal(isNarrowed({ ...DEFAULT_FILTERS, kind: "pay" }), true);
    assert.equal(isNarrowed({ ...DEFAULT_FILTERS, query: " x" }), true);
  });

  it("courtsOf lists the courts of the person's cases", () => {
    assert.deepEqual(courtsOf(world(senior)), [kase.court]);
    assert.deepEqual(courtsOf(world(outsider)), [otherCase.court]);
  });
});
