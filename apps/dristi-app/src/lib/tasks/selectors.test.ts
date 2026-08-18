import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, junior, kase, makeTask, NOW, otherCase, outsider, PEOPLE, senior } from "./fixtures";
import { buildTasks, CASES, PEOPLE as SANDBOX_PEOPLE } from "./sandbox";
import {
  applyLens,
  countsFor,
  DEFAULT_LENS,
  groupTasks,
  summaryOf,
  tasksInView,
  visibleTasks,
  type World,
} from "./selectors";
import { statusCueOf } from "./format";

const world = (over: Partial<World> = {}): World => ({
  people: PEOPLE,
  cases: [kase, otherCase],
  tasks: [],
  user: senior,
  now: NOW,
  ...over,
});

describe("visibility and views", () => {
  const tasks = [
    makeTask({ id: "mine", dueAt: at(-1), assigneeId: senior.id }),
    makeTask({ id: "theirs", dueAt: at(1), assigneeId: junior.id, isBlocking: true, blocksHearingAt: at(2, 5) }),
    makeTask({ id: "unassigned", dueAt: at(20) }),
    makeTask({ id: "gone", dueAt: at(20), assigneeId: outsider.id }),
    makeTask({ id: "hidden", caseId: otherCase.id, dueAt: at(-1) }),
    makeTask({
      id: "awaiting",
      status: "awaiting-approval",
      assigneeId: junior.id,
      approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} },
    }),
    makeTask({ id: "court", status: "awaiting-court" }),
    makeTask({ id: "done", status: "done" }),
    makeTask({ id: "expired", status: "expired" }),
  ];

  it("hides tasks on cases outside access", () => {
    const ids = visibleTasks(world({ tasks })).map((t) => t.id);
    assert.ok(!ids.includes("hidden"));
    assert.equal(ids.length, tasks.length - 1);
  });

  it("splits into to do / waiting / done per person", () => {
    const w = world({ tasks });
    assert.deepEqual(tasksInView(w, "todo").map((t) => t.id).sort(), ["awaiting", "gone", "mine", "theirs", "unassigned"]);
    assert.deepEqual(tasksInView(w, "waiting").map((t) => t.id), ["court"]);
    assert.deepEqual(tasksInView(w, "done").map((t) => t.id).sort(), ["done", "expired"]);
    // The preparer sees their handed-off task in Waiting.
    const asJunior = world({ tasks, user: junior });
    assert.ok(tasksInView(asJunior, "waiting").some((t) => t.id === "awaiting"));
    assert.ok(!tasksInView(asJunior, "todo").some((t) => t.id === "awaiting"));
  });

  it("counts every tab and chip", () => {
    const c = countsFor(world({ tasks }), DEFAULT_LENS);
    assert.deepEqual(c.views, { todo: 5, waiting: 1, done: 2 });
    assert.equal(c.people[senior.id], 1);
    assert.equal(c.people[junior.id], 2); // theirs + awaiting
    assert.equal(c.unassigned, 2); // unassigned + gone (assignee lost access)
    assert.equal(c.blocking, 1);
    assert.equal(c.approval, 1);
  });

  it("chips: people, unassigned, blocking, awaiting my approval", () => {
    const w = world({ tasks });
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, people: [senior.id] }).map((t) => t.id), ["mine"]);
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, unassigned: true }).map((t) => t.id).sort(), ["gone", "unassigned"]);
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, people: [senior.id], unassigned: true }).map((t) => t.id).sort(), ["gone", "mine", "unassigned"]);
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, blocking: true }).map((t) => t.id), ["theirs"]);
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, approval: true }).map((t) => t.id), ["awaiting"]);
  });

  it("search matches title, parties, ST number and CNR", () => {
    const w = world({ tasks: [makeTask({ id: "a", title: "Sign the vakalatnama" }), makeTask({ id: "b" })] });
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, q: "vakalat" }).map((t) => t.id), ["a"]);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, q: "A v. B" }).length, 2);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, q: "ST 1/2025" }).length, 2);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, q: "KLKL01-000001" }).length, 2);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, q: "nothing here" }).length, 0);
  });

  it("deep filters: kind, court, due range, show closed", () => {
    const w = world({ tasks });
    assert.equal(applyLens(w, { ...DEFAULT_LENS, kinds: ["sign"] }).length, 0);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, kinds: ["pay"] }).length, 5);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, courts: ["nowhere"] }).length, 0);
    assert.deepEqual(applyLens(w, { ...DEFAULT_LENS, dueFrom: at(0), dueTo: at(2) }).map((t) => t.id), ["theirs"]);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, view: "done", showClosed: false }).length, 1);
    assert.equal(applyLens(w, { ...DEFAULT_LENS, view: "done", showClosed: true }).length, 2);
  });
});

describe("grouping", () => {
  const tasks = [
    makeTask({ id: "o", dueAt: at(-2) }),
    makeTask({ id: "lp", dueAt: at(-70) }),
    makeTask({ id: "t", dueAt: at(0), kind: "sign", assigneeId: junior.id }),
    makeTask({ id: "n", dueKind: "none" }),
  ];
  const w = world({ tasks });

  it("by band: ordered, long pending last and collapsed", () => {
    const groups = groupTasks(w, applyLens(w, DEFAULT_LENS), "band");
    assert.deepEqual(groups.map((g) => g.key), ["overdue", "today", "undated", "long-pending"]);
    assert.equal(groups.at(-1)?.collapsed, true);
    assert.equal(groups[0].count, 1);
  });

  it("by kind, by person (me first, unassigned last), by case", () => {
    const rows = applyLens(w, DEFAULT_LENS);
    assert.deepEqual(groupTasks(w, rows, "kind").map((g) => g.key), ["sign", "pay"]);
    const byPerson = groupTasks(w, rows, "person");
    assert.equal(byPerson.at(-1)?.key, "unassigned");
    assert.equal(byPerson[0].key, junior.id);
    assert.deepEqual(groupTasks(w, rows, "case").map((g) => g.label), ["A v. B"]);
  });
});

describe("the one status cue", () => {
  it("names the fact that matters, and only one", () => {
    const awaiting = makeTask({ status: "awaiting-approval", approval: { preparedBy: junior.id, sentAt: at(-2), prepared: {} } });
    assert.equal(statusCueOf(awaiting, senior, kase, PEOPLE, NOW), "Prepared by S. Prakash");
    assert.equal(statusCueOf(awaiting, junior, kase, PEOPLE, NOW), "Sent to Anjali Nair +1 · 2 d");
    assert.equal(statusCueOf(makeTask({ status: "sent-back" }), junior, kase, PEOPLE, NOW), "Sent back — 1 note");
    assert.equal(statusCueOf(makeTask({ lastPayment: { result: "failed", ref: "x", at: NOW } }), senior, kase, PEOPLE, NOW), "Payment failed");
    assert.equal(statusCueOf(makeTask({ kind: "sign" }), junior, kase, PEOPLE, NOW), "Needs Anjali Nair's or R. Manoj's signature");
    assert.equal(statusCueOf(makeTask({ kind: "sign" }), senior, kase, PEOPLE, NOW), null);
    assert.equal(statusCueOf(makeTask({ status: "awaiting-court" }), senior, kase, PEOPLE, NOW), "Awaiting scrutiny");
    assert.equal(statusCueOf(makeTask({ status: "payment-confirming" }), senior, kase, PEOPLE, NOW), "Payment confirming");
    assert.equal(statusCueOf(makeTask({ status: "obsolete" }), senior, kase, PEOPLE, NOW), "No longer required");
  });
});

describe("the sandbox seed", () => {
  const w: World = { people: SANDBOX_PEOPLE, cases: CASES, tasks: buildTasks(), user: SANDBOX_PEOPLE[0], now: new Date() };

  it("never shows Anjali a task on a case she is not on", () => {
    const ids = visibleTasks(w).map((t) => t.id);
    for (const hidden of ["t-217fee", "t-71sign", "t-377respond"]) assert.ok(!ids.includes(hidden), hidden);
  });

  it("covers every band, two approvals for Anjali, and the header summary", () => {
    const groups = groupTasks(w, applyLens(w, DEFAULT_LENS), "band");
    assert.deepEqual(groups.map((g) => g.key), ["overdue", "today", "soon", "later", "undated", "long-pending"]);
    const c = countsFor(w, DEFAULT_LENS);
    assert.equal(c.approval, 2);
    assert.ok(c.views.waiting >= 5);
    assert.ok(c.views.done >= 4);
    const s = summaryOf(w);
    assert.ok(s.todo > 10 && s.overdue >= 5);
    // Overdue and long pending are separate numbers — the header line matches the bands.
    const bands = groupTasks(w, tasksInView(w, "todo"), "band");
    assert.equal(s.overdue, bands.find((g) => g.key === "overdue")?.count ?? 0);
    assert.equal(s.longPending, bands.find((g) => g.key === "long-pending")?.count ?? 0);
  });

  it("switching to R. Manoj shows a different queue", () => {
    const rm = SANDBOX_PEOPLE.find((p) => p.id === "p-rm")!;
    const asRm = { ...w, user: rm };
    const ids = visibleTasks(asRm).map((t) => t.id);
    assert.ok(ids.includes("t-217fee"));
    assert.ok(!ids.includes("t-sign88"));
    // The two tasks Anjali sent him are his to do.
    const todo = tasksInView(asRm, "todo").map((t) => t.id);
    assert.ok(todo.includes("t-sent1102") && todo.includes("t-sent221"));
  });

  it("every task id is unique", () => {
    const ids = w.tasks.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
