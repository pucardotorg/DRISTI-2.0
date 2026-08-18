import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, junior, kase, makeTask, otherCase, outsider, senior, senior2 } from "./fixtures";
import {
  canApprove,
  canFinalise,
  canFinaliseTask,
  canMarkDone,
  canPrepare,
  canView,
  effectiveAssignee,
  isTakeOver,
  verbFor,
  viewOf,
} from "./permissions";

describe("access", () => {
  it("signatories finalise; members prepare; outsiders see nothing", () => {
    assert.equal(canView(senior, kase), true);
    assert.equal(canFinalise(senior, kase), true);
    assert.equal(canPrepare(senior, kase), false);

    assert.equal(canView(junior, kase), true);
    assert.equal(canFinalise(junior, kase), false);
    assert.equal(canPrepare(junior, kase), true);

    assert.equal(canView(outsider, kase), false);
    assert.equal(canFinalise(outsider, kase), false);
    assert.equal(canPrepare(outsider, kase), false);
  });

  it("an assignee without access reads as unassigned", () => {
    assert.equal(effectiveAssignee(makeTask({ assigneeId: outsider.id }), kase), undefined);
    assert.equal(effectiveAssignee(makeTask({ assigneeId: junior.id }), kase), junior.id);
  });
});

describe("approval", () => {
  const awaiting = makeTask({
    status: "awaiting-approval",
    approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} },
  });

  it("a signatory who did not prepare it may approve", () => {
    assert.equal(canApprove(senior, awaiting, kase), true);
    assert.equal(canApprove(senior2, awaiting, kase), true);
  });

  it("no self-approval — even for a signatory", () => {
    const selfPrepared = makeTask({
      status: "awaiting-approval",
      approval: { preparedBy: senior.id, sentAt: at(-1), prepared: {} },
    });
    assert.equal(canApprove(senior, selfPrepared, kase), false);
    assert.equal(canApprove(senior2, selfPrepared, kase), true);
  });

  it("members and outsiders never approve", () => {
    assert.equal(canApprove(junior, awaiting, kase), false);
    assert.equal(canApprove(outsider, awaiting, kase), false);
  });

  it("only while awaiting approval", () => {
    assert.equal(canApprove(senior, { ...awaiting, status: "open" }, kase), false);
  });
});

describe("viewOf", () => {
  const awaiting = makeTask({
    status: "awaiting-approval",
    approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} },
  });

  it("awaiting-approval is the approver's to do and everyone else's wait", () => {
    assert.equal(viewOf(awaiting, senior, kase), "todo");
    assert.equal(viewOf(awaiting, junior, kase), "waiting");
    // A third member with access, neither preparer nor signatory.
    const withThird = { ...kase, members: [junior.id, "p-third"] };
    assert.equal(viewOf(awaiting, "p-third", withThird), "waiting");
  });

  it("a signatory who prepared it waits until another signatory decides", () => {
    const selfPrepared = { ...awaiting, approval: { ...awaiting.approval!, preparedBy: senior.id } };
    assert.equal(viewOf(selfPrepared, senior, kase), "waiting");
    assert.equal(viewOf(selfPrepared, senior2, kase), "todo");
  });

  it("open, in-progress, draft and sent-back are to do; court/payment waits; closed is done", () => {
    for (const status of ["open", "in-progress", "draft", "sent-back"] as const) {
      assert.equal(viewOf(makeTask({ status }), junior, kase), "todo", status);
    }
    for (const status of ["awaiting-court", "payment-confirming"] as const) {
      assert.equal(viewOf(makeTask({ status }), senior, kase), "waiting", status);
    }
    for (const status of ["done", "expired", "obsolete"] as const) {
      assert.equal(viewOf(makeTask({ status }), senior, kase), "done", status);
    }
  });
});

describe("verbFor", () => {
  it("finalising verbs for signatories, Prepare for members", () => {
    assert.equal(verbFor(senior, makeTask({ kind: "pay" }), kase), "Pay");
    assert.equal(verbFor(senior, makeTask({ kind: "sign" }), kase), "Sign");
    assert.equal(verbFor(senior, makeTask({ kind: "submit" }), kase), "Submit");
    assert.equal(verbFor(senior, makeTask({ kind: "fix-defects" }), kase), "Fix defects");
    assert.equal(verbFor(junior, makeTask({ kind: "pay" }), kase), "Prepare");
    assert.equal(verbFor(junior, makeTask({ kind: "sign" }), kase), "Prepare");
  });

  it("Continue for drafts, in-progress and sent-back", () => {
    assert.equal(verbFor(junior, makeTask({ status: "draft" }), kase), "Continue");
    assert.equal(verbFor(senior, makeTask({ status: "in-progress" }), kase), "Continue");
    assert.equal(verbFor(junior, makeTask({ status: "sent-back" }), kase), "Continue");
  });

  it("Take over for a finaliser on someone else's draft; the preparer keeps Continue", () => {
    const draft = makeTask({ status: "draft", approval: { preparedBy: junior.id, sentAt: "", prepared: {} } });
    assert.equal(verbFor(senior, draft, kase), "Take over");
    assert.equal(verbFor(senior2, draft, kase), "Take over");
    assert.equal(verbFor(junior, draft, kase), "Continue");
    assert.equal(isTakeOver(senior, draft, kase), true);
    assert.equal(isTakeOver(junior, draft, kase), false);
    const sentBack = { ...draft, status: "sent-back" as const };
    assert.equal(verbFor(senior, sentBack, kase), "Take over");
    assert.equal(verbFor(junior, sentBack, kase), "Continue");
    // A signatory who prepared it themselves (member on another case, say) just continues.
    const own = { ...draft, approval: { ...draft.approval!, preparedBy: senior.id } };
    assert.equal(verbFor(senior, own, kase), "Continue");
    // A draft with no recorded preparer is not a take-over.
    assert.equal(verbFor(senior, makeTask({ status: "draft" }), kase), "Continue");
  });

  it("canFinaliseTask: signatories always; anyone with access when no signatory is required", () => {
    assert.equal(canFinaliseTask(senior, makeTask(), kase), true);
    assert.equal(canFinaliseTask(junior, makeTask(), kase), false);
    assert.equal(canFinaliseTask(junior, makeTask({ requiresSignatory: false }), kase), true);
    assert.equal(canFinaliseTask(outsider, makeTask({ requiresSignatory: false }), kase), false);
  });

  it("Approve & sign for the approver, Withdraw for the preparer, View for others", () => {
    const awaiting = makeTask({
      status: "awaiting-approval",
      approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} },
    });
    assert.equal(verbFor(senior, awaiting, kase), "Approve & sign");
    assert.equal(verbFor(junior, awaiting, kase), "Withdraw");
    assert.equal(verbFor("p-third", awaiting, { ...kase, members: [junior.id, "p-third"] }), "View");
  });

  it("Mark done only for tasks the system cannot observe", () => {
    assert.equal(verbFor(junior, makeTask({ kind: "respond" }), kase), "Mark done");
    assert.equal(canMarkDone(junior, makeTask({ kind: "respond" }), kase), true);
    assert.equal(canMarkDone(senior, makeTask({ kind: "pay" }), kase), false);
    assert.equal(canMarkDone(junior, makeTask({ kind: "respond", status: "done" }), kase), false);
  });

  it("View when closed, waiting, or outside access", () => {
    assert.equal(verbFor(senior, makeTask({ status: "done" }), kase), "View");
    assert.equal(verbFor(senior, makeTask({ status: "awaiting-court" }), kase), "View");
    assert.equal(verbFor(senior, makeTask({ caseId: otherCase.id }), otherCase), "View");
  });

  it("switching identity re-derives the verb — nothing is cached", () => {
    const t = makeTask({ kind: "pay" });
    assert.equal(verbFor(senior, t, kase), "Pay");
    assert.equal(verbFor(junior, t, kase), "Prepare");
    // The same person on a case where they are only a member.
    const asMember = { ...kase, signatories: [senior2.id], members: [senior.id] };
    assert.equal(verbFor(senior, t, asMember), "Prepare");
  });
});
