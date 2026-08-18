import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, junior, kase, makeTask, NOW, outsider, PEOPLE, senior, senior2 } from "./fixtures";
import { canApprove, verbFor, viewOf } from "./permissions";
import {
  approveAndSign,
  confirmPayment,
  courtAccepted,
  courtReturned,
  type Ctx,
  expire,
  markDone,
  obsolete,
  reassign,
  recordPayment,
  redate,
  saveDraft,
  sendBack,
  sendForApproval,
  setDefect,
  sign,
  startPrepare,
  submit,
  TransitionError,
  withdraw,
} from "./transitions";
import type { Task, TaskStatus } from "./types";

const ctx = (actor = senior): Ctx => ({ actor, kase, now: NOW, people: PEOPLE });

const ALL: TaskStatus[] = [
  "open",
  "in-progress",
  "draft",
  "awaiting-approval",
  "sent-back",
  "awaiting-court",
  "payment-confirming",
  "done",
  "expired",
  "obsolete",
];

/** Asserts a transition is legal exactly from `legal` and throws illegal-state elsewhere. */
function fromStates(
  name: string,
  legal: TaskStatus[],
  run: (task: Task) => unknown,
  base: Partial<Task> = {}
) {
  for (const status of ALL) {
    const task = makeTask({
      status,
      approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} },
      ...base,
    });
    if (legal.includes(status)) {
      assert.doesNotThrow(() => run(task), `${name} should be legal from ${status}`);
    } else {
      assert.throws(
        () => run(task),
        (e: unknown) => e instanceof TransitionError && e.code === "illegal-state",
        `${name} should be illegal from ${status}`
      );
    }
  }
}

function forbidden(run: () => unknown, message: string) {
  assert.throws(
    run,
    (e: unknown) => e instanceof TransitionError && e.code === "forbidden",
    message
  );
}

describe("preparing", () => {
  it("startPrepare: open · sent-back → draft (member) / in-progress (signatory)", () => {
    fromStates("startPrepare", ["open", "sent-back"], (t) => startPrepare(t, ctx(junior)));
    assert.equal(startPrepare(makeTask(), ctx(junior)).status, "draft");
    assert.equal(startPrepare(makeTask(), ctx(senior)).status, "in-progress");
    forbidden(() => startPrepare(makeTask(), ctx(outsider)), "outsider cannot start");
  });

  it("saveDraft keeps state and merges what was prepared", () => {
    fromStates("saveDraft", ["open", "draft", "in-progress", "sent-back"], (t) =>
      saveDraft(t, ctx(junior), { note: "x" })
    );
    const d1 = saveDraft(makeTask(), ctx(junior), { note: "one" });
    assert.equal(d1.status, "draft");
    const d2 = saveDraft(d1, ctx(junior), { upload: "f1" });
    assert.deepEqual(d2.approval?.prepared, { note: "one", upload: "f1" });
    assert.equal(d2.history.length, 2);
  });

  it("sendForApproval: open · in-progress · draft · sent-back → awaiting-approval, members only", () => {
    fromStates("sendForApproval", ["open", "in-progress", "draft", "sent-back"], (t) =>
      sendForApproval(t, ctx(junior), "please sign")
    );
    const sent = sendForApproval(makeTask(), ctx(junior), "please sign");
    assert.equal(sent.status, "awaiting-approval");
    assert.equal(sent.approval?.preparedBy, junior.id);
    assert.equal(sent.approval?.note, "please sign");
    assert.match(sent.history.at(-1)!.text, /sent this for approval/);
    forbidden(() => sendForApproval(makeTask(), ctx(senior)), "a signatory finalises instead");
    assert.throws(
      () => sendForApproval(makeTask({ kind: "respond" }), ctx(junior)),
      (e: unknown) => e instanceof TransitionError && e.code === "invalid"
    );
  });

  it("withdraw: awaiting-approval → draft, preparer only", () => {
    fromStates("withdraw", ["awaiting-approval"], (t) => withdraw(t, ctx(junior)));
    forbidden(
      () =>
        withdraw(
          makeTask({ status: "awaiting-approval", approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} } }),
          ctx(senior)
        ),
      "only the preparer withdraws"
    );
  });
});

describe("approving", () => {
  const awaiting = (kind: Task["kind"] = "sign") =>
    makeTask({ kind, status: "awaiting-approval", approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} } });

  it("approveAndSign: only from awaiting-approval, only by a non-preparer signatory", () => {
    fromStates("approveAndSign", ["awaiting-approval"], (t) => approveAndSign(t, ctx(senior)), { kind: "sign" });
    forbidden(() => approveAndSign(awaiting(), ctx(junior)), "member cannot approve");
    const selfPrepared = { ...awaiting(), approval: { preparedBy: senior.id, sentAt: at(-1), prepared: {} } };
    forbidden(() => approveAndSign(selfPrepared, ctx(senior)), "no self-approval");
    assert.equal(approveAndSign(selfPrepared, ctx(senior2)).status, "done");
  });

  it("approveAndSign advances by kind: sign → done, submit → awaiting-court, pay → in-progress", () => {
    const signed = approveAndSign(awaiting("sign"), ctx(senior));
    assert.equal(signed.status, "done");
    assert.equal(signed.completion?.how, "event");
    assert.equal(signed.approval?.decision, "approved");
    assert.equal(signed.approval?.decidedBy, senior.id);
    assert.equal(approveAndSign(awaiting("submit"), ctx(senior)).status, "awaiting-court");
    assert.equal(approveAndSign(awaiting("fix-defects"), ctx(senior)).status, "awaiting-court");
    const pay = approveAndSign(awaiting("pay"), ctx(senior));
    assert.equal(pay.status, "in-progress");
    assert.equal(recordPayment(pay, ctx(senior), "success").status, "done");
  });

  it("two signatories: either may approve; the first decision wins (state moves on)", () => {
    const first = approveAndSign(awaiting("sign"), ctx(senior2));
    assert.throws(() => approveAndSign(first, ctx(senior)), TransitionError);
  });

  it("sendBack requires a note and records who and why", () => {
    fromStates("sendBack", ["awaiting-approval"], (t) => sendBack(t, ctx(senior), "fix para 4"));
    const back = sendBack(awaiting(), ctx(senior), "fix para 4");
    assert.equal(back.status, "sent-back");
    assert.equal(back.approval?.decision, "sent-back");
    assert.equal(back.approval?.decisionNote, "fix para 4");
    assert.equal(back.statusNote, "fix para 4");
    assert.throws(
      () => sendBack(awaiting(), ctx(senior), "  "),
      (e: unknown) => e instanceof TransitionError && e.code === "invalid"
    );
    forbidden(() => sendBack(awaiting(), ctx(junior), "no"), "member cannot send back");
  });
});

describe("finalising", () => {
  it("recordPayment: open · in-progress · draft · sent-back; signatories only; three outcomes", () => {
    fromStates("recordPayment", ["open", "in-progress", "draft", "sent-back"], (t) => recordPayment(t, ctx(senior), "success"), { kind: "pay" });
    forbidden(() => recordPayment(makeTask(), ctx(junior), "success"), "member cannot pay");
    const ok = recordPayment(makeTask(), ctx(senior), "success");
    assert.equal(ok.status, "done");
    assert.match(ok.completion?.receipt ?? "", /^TXN-/);
    const pending = recordPayment(makeTask(), ctx(senior), "pending");
    assert.equal(pending.status, "payment-confirming");
    const failed = recordPayment(makeTask(), ctx(senior), "failed");
    assert.equal(failed.status, "open");
    assert.equal(failed.lastPayment?.result, "failed");
    assert.match(failed.statusNote ?? "", /failed/i);
  });

  it("confirmPayment: payment-confirming → done with the same ref", () => {
    fromStates("confirmPayment", ["payment-confirming"], (t) => confirmPayment(t, ctx(junior)));
    const pending = recordPayment(makeTask(), ctx(senior), "pending");
    const done = confirmPayment(pending, ctx(junior));
    assert.equal(done.status, "done");
    assert.equal(done.completion?.receipt, pending.lastPayment?.ref);
  });

  it("sign: open · in-progress · draft · sent-back → done by event; signatories only; sign tasks only", () => {
    fromStates("sign", ["open", "in-progress", "draft", "sent-back"], (t) => sign(t, ctx(senior)), { kind: "sign" });
    forbidden(() => sign(makeTask({ kind: "sign" }), ctx(junior)), "member cannot sign");
    assert.throws(() => sign(makeTask({ kind: "pay" }), ctx(senior)), TransitionError);
    const s = sign(makeTask({ kind: "sign" }), ctx(senior));
    assert.equal(s.status, "done");
    assert.match(s.completion?.receipt ?? "", /^ESIGN-/);
  });

  it("submit: open · in-progress · draft · sent-back → awaiting-court; fix-defects needs every defect fixed", () => {
    fromStates("submit", ["open", "in-progress", "draft", "sent-back"], (t) => submit(t, ctx(senior)), { kind: "submit" });
    forbidden(() => submit(makeTask({ kind: "submit" }), ctx(junior)), "member cannot submit");
    const fix = makeTask({
      kind: "fix-defects",
      defects: [
        { n: 1, text: "a", fixed: false },
        { n: 2, text: "b", fixed: false },
      ],
    });
    assert.throws(() => submit(fix, ctx(senior)), (e: unknown) => e instanceof TransitionError && e.code === "invalid");
    const oneFixed = setDefect(fix, ctx(senior), 1, true);
    assert.equal(oneFixed.status, "in-progress");
    assert.throws(() => submit(oneFixed, ctx(senior)), TransitionError);
    const allFixed = setDefect(oneFixed, ctx(senior), 2, true);
    assert.equal(submit(allFixed, ctx(senior)).status, "awaiting-court");
  });

  it("courtAccepted: awaiting-court → done with an acknowledgement", () => {
    fromStates("courtAccepted", ["awaiting-court"], (t) => courtAccepted(t, ctx(junior)));
    const done = courtAccepted(makeTask({ kind: "submit", status: "awaiting-court" }), ctx(junior));
    assert.equal(done.status, "done");
    assert.match(done.completion?.receipt ?? "", /^ACK-/);
  });

  it("courtReturned: awaiting-court → obsolete + a new open fix-defects task", () => {
    fromStates("courtReturned", ["awaiting-court"], (t) => courtReturned(t, ctx(junior), ["x"]));
    const original = makeTask({
      id: "t-orig",
      kind: "submit",
      status: "awaiting-court",
      title: "File the written arguments",
      dueAt: at(3),
      blocksHearingAt: at(5, 5),
      isBlocking: true,
      assigneeId: junior.id,
    });
    const { task: superseded, created } = courtReturned(original, ctx(junior), ["Not signed", "  ", "No stamp"]);
    assert.equal(superseded.status, "obsolete");
    assert.match(superseded.statusNote ?? "", /2 defects/);
    assert.equal(created.kind, "fix-defects");
    assert.equal(created.status, "open");
    assert.equal(created.title, "Fix 2 defects — the written arguments");
    assert.equal(created.defects?.length, 2);
    assert.equal(created.defects?.[1].text, "No stamp");
    assert.equal(created.caseId, original.caseId);
    assert.equal(created.dueAt, original.dueAt);
    assert.equal(created.blocksHearingAt, original.blocksHearingAt);
    assert.equal(created.isBlocking, true);
    assert.equal(created.assigneeId, junior.id);
    assert.equal(created.requiresSignatory, true);
    assert.equal(created.systemObservable, true);
    assert.notEqual(created.id, original.id);
    assert.throws(
      () => courtReturned(original, ctx(junior), []),
      (e: unknown) => e instanceof TransitionError && e.code === "invalid"
    );
  });

  it("markDone: open · in-progress, only for tasks the system cannot observe", () => {
    fromStates("markDone", ["open", "in-progress"], (t) => markDone(t, ctx(junior)), { kind: "respond" });
    forbidden(() => markDone(makeTask({ kind: "pay" }), ctx(senior)), "payment closes by event");
    const done = markDone(makeTask({ kind: "respond" }), ctx(junior));
    assert.equal(done.status, "done");
    assert.equal(done.completion?.how, "manual");
    assert.equal(done.completion?.by, junior.id);
  });
});

describe("take-over", () => {
  const draftBy = (who = junior, status: TaskStatus = "draft", kind: Task["kind"] = "pay") =>
    makeTask({
      kind,
      status,
      approval: { preparedBy: who.id, sentAt: "", prepared: { note: "checked" } },
    });

  it("a finaliser may finish a draft someone else is preparing — and the history names them", () => {
    const paid = recordPayment(draftBy(), ctx(senior), "success");
    assert.equal(paid.status, "done");
    assert.match(paid.history.at(-2)!.text, /Anjali Nair took over from S\. Prakash/);
    assert.match(paid.history.at(-1)!.text, /paid/);

    const signed = sign(draftBy(junior, "sent-back", "sign"), ctx(senior2));
    assert.equal(signed.status, "done");
    assert.match(signed.history.at(-2)!.text, /R\. Manoj took over from S\. Prakash/);

    const submitted = submit(draftBy(junior, "draft", "submit"), ctx(senior));
    assert.equal(submitted.status, "awaiting-court");
    assert.match(submitted.history.at(-2)!.text, /took over from/);
  });

  it("no take-over line when the actor is finishing their own work", () => {
    const own = makeTask({ kind: "pay", status: "in-progress" });
    const paid = recordPayment(own, ctx(senior), "success");
    assert.ok(!paid.history.some((h) => /took over/.test(h.text)));
  });

  it("still forbidden for a non-finaliser — a member cannot take over another member's draft", () => {
    const withThird = { ...kase, members: [junior.id, "p-third"] };
    const third = { id: "p-third", name: "Third Member", initials: "TM", role: "junior" as const };
    forbidden(
      () => recordPayment(draftBy(), { actor: third, kase: withThird, now: NOW, people: PEOPLE }, "success"),
      "member cannot take over"
    );
    forbidden(() => sign(draftBy(junior, "draft", "sign"), ctx(junior)), "the preparer cannot sign their own draft");
    assert.equal(verbFor(third, draftBy(), withThird), "Continue");
    assert.equal(verbFor(senior, draftBy(), kase), "Take over");
    assert.equal(verbFor(junior, draftBy(), kase), "Continue");
  });

  it("a failed take-over payment leaves the draft as it was, for the next attempt", () => {
    const failed = recordPayment(draftBy(), ctx(senior), "failed");
    assert.equal(failed.status, "draft");
    assert.equal(failed.approval?.preparedBy, junior.id);
    assert.match(failed.statusNote ?? "", /failed/i);
  });
});

describe("tasks that do not need a signatory", () => {
  it("anyone with access finalises when requiresSignatory is false — verb and transition agree", () => {
    const loosePay = makeTask({ kind: "pay", requiresSignatory: false });
    assert.equal(verbFor(junior, loosePay, kase), "Pay");
    assert.equal(recordPayment(loosePay, ctx(junior), "success").status, "done");
    const looseSubmit = makeTask({ kind: "submit", requiresSignatory: false });
    assert.equal(verbFor(junior, looseSubmit, kase), "Submit");
    assert.equal(submit(looseSubmit, ctx(junior)).status, "awaiting-court");
    // Outsiders still cannot.
    forbidden(() => recordPayment(loosePay, ctx(outsider), "success"), "no access, no payment");
  });
});

describe("approve & pay", () => {
  const awaitingPay = () =>
    makeTask({ kind: "pay", status: "awaiting-approval", approval: { preparedBy: junior.id, sentAt: at(-1), prepared: {} } });

  it("a failed payment by the approver returns the task to awaiting-approval — junior waits, senior approves again", () => {
    const approved = approveAndSign(awaitingPay(), ctx(senior));
    const failed = recordPayment(approved, ctx(senior), "failed");
    assert.equal(failed.status, "awaiting-approval");
    assert.equal(failed.statusNote, "Payment failed — try again");
    assert.equal(failed.approval?.decision, undefined);
    assert.equal(failed.approval?.preparedBy, junior.id);
    assert.equal(viewOf(failed, junior, kase), "waiting");
    assert.equal(viewOf(failed, senior, kase), "todo");
    assert.equal(canApprove(senior, failed, kase), true);
    assert.equal(verbFor(senior, failed, kase), "Approve & sign");
    assert.equal(verbFor(junior, failed, kase), "Withdraw");
    // And the retry works.
    const retried = recordPayment(approveAndSign(failed, ctx(senior)), ctx(senior), "success");
    assert.equal(retried.status, "done");
  });
});

describe("housekeeping", () => {
  it("reassign to anyone with access, or unassign; never on a closed task; writes history", () => {
    const t = makeTask({ assigneeId: senior.id });
    const r = reassign(t, ctx(junior), junior.id);
    assert.equal(r.assigneeId, junior.id);
    assert.match(r.history.at(-1)!.text, /assigned this to S\. Prakash/);
    const u = reassign(r, ctx(junior), undefined);
    assert.equal(u.assigneeId, undefined);
    assert.match(u.history.at(-1)!.text, /unassigned/);
    assert.throws(
      () => reassign(t, ctx(senior), outsider.id),
      (e: unknown) => e instanceof TransitionError && e.code === "invalid"
    );
    assert.throws(() => reassign(makeTask({ status: "done" }), ctx(senior), junior.id), TransitionError);
    // A no-op reassign leaves the task untouched — no history noise.
    assert.equal(reassign(t, ctx(senior), senior.id), t);
  });

  it("expire: open · in-progress · draft · sent-back → expired with the reason", () => {
    fromStates("expire", ["open", "in-progress", "draft", "sent-back"], (t) => expire(t, ctx(), "window closed"));
    const e = expire(makeTask(), ctx(), "window closed");
    assert.equal(e.status, "expired");
    assert.equal(e.statusNote, "window closed");
    assert.match(e.history.at(-1)!.text, /Expired — window closed/);
  });

  it("obsolete: any open state → obsolete with the reason; not from a closed state", () => {
    fromStates(
      "obsolete",
      ["open", "in-progress", "draft", "awaiting-approval", "sent-back", "awaiting-court", "payment-confirming"],
      (t) => obsolete(t, ctx(), "order withdrawn")
    );
    const o = obsolete(makeTask(), ctx(), "order withdrawn");
    assert.equal(o.status, "obsolete");
    assert.match(o.history.at(-1)!.text, /No longer required — order withdrawn/);
  });

  it("redate keeps the old date, moves the due date and the hearing, and writes history", () => {
    const t = makeTask({ dueAt: at(2), dueKind: "before-hearing", blocksHearingAt: at(3, 5), isBlocking: true });
    const moved = redate(t, ctx(), at(9), "hearing adjourned", at(10, 5));
    assert.equal(moved.dueAt, at(9));
    assert.equal(moved.blocksHearingAt, at(10, 5));
    assert.equal(moved.redate?.from, at(2));
    assert.equal(moved.redate?.reason, "hearing adjourned");
    assert.match(moved.history.at(-1)!.text, /Due date moved from .* to .* — hearing adjourned/);
    assert.throws(() => redate(makeTask({ status: "done" }), ctx(), at(9), "x"), TransitionError);
  });

  it("every transition appends exactly one history line per step", () => {
    let t = makeTask({ kind: "sign" });
    const n0 = t.history.length;
    t = startPrepare(t, ctx(junior));
    t = saveDraft(t, ctx(junior), { note: "a" });
    t = sendForApproval(t, ctx(junior), "ready");
    t = sendBack(t, ctx(senior), "fix");
    t = sendForApproval(t, ctx(junior));
    t = approveAndSign(t, ctx(senior2));
    assert.equal(t.history.length, n0 + 6);
    assert.equal(t.status, "done");
  });
});
