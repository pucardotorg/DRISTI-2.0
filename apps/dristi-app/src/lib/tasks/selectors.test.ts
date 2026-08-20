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
  makeTask({ id: "archived", kind: "sign", status: "archived", dueAt: at(4), archived: { at: at(-1), from: "open" } }),
  makeTask({ id: "other-case", kind: "sign", caseId: otherCase.id, dueAt: at(-5) }),
];

const world = (user = senior): World => ({ people: PEOPLE, cases: [kase, otherCase], tasks, user, now: NOW });

describe("visibility and views — per viewer", () => {
  it("a signatory's chair: open/ready completing work needs their action", () => {
    assert.deepEqual(viewCounts(world(senior)), {
      "needs-action": 7,
      waiting: 2,
      completed: 1,
      archived: 1,
    });
  });

  it("a junior's chair: the same items wait on the vakalatnama holders", () => {
    // Drafts and the hearing task stay theirs; open/ready sign/pay/file/returned wait.
    assert.deepEqual(viewCounts(world(junior)), {
      "needs-action": 2,
      waiting: 7,
      completed: 1,
      archived: 1,
    });
  });

  it("only tasks on the person's cases are counted", () => {
    assert.deepEqual(viewCounts(world(outsider)), {
      "needs-action": 1,
      waiting: 0,
      completed: 0,
      archived: 0,
    });
  });

  it("a search query narrows the counts on every tab", () => {
    const counts = viewCounts(world(senior), "process fee");
    // Every seeded fixture shares the same title; the archived and completed ones match too.
    assert.equal(counts["needs-action"] > 0, true);
    assert.deepEqual(viewCounts(world(senior), "zzz-no-match"), {
      "needs-action": 0,
      waiting: 0,
      completed: 0,
      archived: 0,
    });
  });

  it("the header summary counts overdue across open-state work", () => {
    assert.deepEqual(summaryOf(world(senior)), { action: 7, waiting: 2, overdue: 1 });
    // For the junior the overdue pay item sits in Waiting but is still overdue.
    assert.deepEqual(summaryOf(world(junior)), { action: 2, waiting: 7, overdue: 1 });
  });
});

describe("cardCounts", () => {
  it("counts per card for the Needs-action view, with overdue and next due", () => {
    const c = cardCounts(world(), "needs-action");
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

  it("describes the other views too", () => {
    assert.equal(cardCounts(world(), "waiting").file.count, 1);
    assert.equal(cardCounts(world(), "waiting").pay.count, 1);
    assert.equal(cardCounts(world(), "completed").pay.count, 1);
    assert.equal(cardCounts(world(), "archived").sign.count, 1);
    // A junior's Waiting tab holds what waits on the signatories.
    assert.equal(cardCounts(world(junior), "waiting").sign.count, 2);
  });
});

describe("applyFilters", () => {
  const ids = (f: Partial<typeof DEFAULT_FILTERS>) => applyFilters(world(), { ...DEFAULT_FILTERS, ...f }).map((t) => t.id);

  it("default: the Needs-action view sorted by urgency", () => {
    assert.deepEqual(ids({}), [
      "overdue-pay",
      "hearing",
      "week-file",
      "today-sign",
      "returned",
      "ready-sign",
      "draft-file",
    ]);
  });

  it("a card narrows to one kind", () => {
    assert.deepEqual(ids({ kind: "sign" }), ["today-sign", "ready-sign"]);
    assert.deepEqual(ids({ kind: "draft" }), ["draft-file"]);
    assert.deepEqual(ids({ kind: "file" }), ["week-file"]);
    assert.deepEqual(
      applyFilters(world(junior), { ...DEFAULT_FILTERS, kind: "draft" }).map((t) => t.id),
      ["draft-file"]
    );
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
    assert.deepEqual(ids({ view: "archived" }), ["archived"]);
    assert.deepEqual(ids({ sort: "kind" }).slice(0, 3), ["today-sign", "ready-sign", "overdue-pay"]);
    // The junior's tabs hold different populations for the same URL.
    assert.deepEqual(
      applyFilters(world(junior), DEFAULT_FILTERS).map((t) => t.id),
      ["hearing", "draft-file"]
    );
    assert.equal(applyFilters(world(junior), { ...DEFAULT_FILTERS, view: "waiting" }).length, 7);
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
