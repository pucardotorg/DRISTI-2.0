import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { at, junior, kase, makeTask, otherCase, outsider, PEOPLE, senior, senior2 } from "./fixtures";
import { dueCueOf, permissionLineOf, statusPhraseOf } from "./format";
import {
  advocatesOf,
  canComplete,
  canMarkDone,
  canView,
  cardKindOf,
  verbFor,
  viewOf,
} from "./permissions";
import type { TaskStatus } from "./types";

describe("canView / canComplete", () => {
  it("signatories and juniors on the case can view; only signatories complete", () => {
    assert.equal(canView(senior, kase), true);
    assert.equal(canView(junior, kase), true);
    assert.equal(canView(outsider, kase), false);
    assert.equal(canComplete(senior, kase), true);
    assert.equal(canComplete(senior2, kase), true);
    assert.equal(canComplete(junior, kase), false);
  });

  it("advocatesOf lists the main advocate first, then the rest", () => {
    assert.deepEqual(
      advocatesOf(kase, PEOPLE).map((p) => p.id),
      [senior.id, senior2.id, junior.id]
    );
  });
});

describe("viewOf — the same for every viewer", () => {
  const cases: [TaskStatus, string][] = [
    ["open", "open"],
    ["draft", "open"],
    ["ready", "open"],
    ["awaiting-court", "waiting"],
    ["payment-confirming", "waiting"],
    ["done", "completed"],
    ["expired", "completed"],
    ["obsolete", "completed"],
  ];
  for (const [status, view] of cases) {
    it(`${status} → ${view}`, () => {
      assert.equal(viewOf(makeTask({ status })), view);
    });
  }
});

describe("cardKindOf", () => {
  it("a task in draft status counts under Drafts whatever its kind", () => {
    assert.equal(cardKindOf(makeTask({ kind: "file", status: "draft" })), "draft");
    assert.equal(cardKindOf(makeTask({ kind: "draft", status: "draft" })), "draft");
  });
  it("a draft-kind task marked ready is a filing from then on", () => {
    assert.equal(cardKindOf(makeTask({ kind: "draft", status: "ready" })), "file");
    assert.equal(cardKindOf(makeTask({ kind: "draft", status: "awaiting-court" })), "file");
  });
  it("otherwise the kind is the card", () => {
    assert.equal(cardKindOf(makeTask({ kind: "returned" })), "returned");
    assert.equal(cardKindOf(makeTask({ kind: "hearing" })), "hearing");
  });
});

describe("verbFor", () => {
  it("signatory: the completing verb on open and ready items", () => {
    assert.equal(verbFor(senior, makeTask({ kind: "sign" }), kase), "Sign");
    assert.equal(verbFor(senior, makeTask({ kind: "pay", status: "ready" }), kase), "Pay");
    assert.equal(verbFor(senior2, makeTask({ kind: "file" }), kase), "File");
    assert.equal(verbFor(senior, makeTask({ kind: "returned" }), kase), "Fix & re-file");
    assert.equal(verbFor(senior, makeTask({ kind: "draft", status: "ready" }), kase), "File");
  });

  it("on the case but not a signatory: Open on open and ready items", () => {
    assert.equal(verbFor(junior, makeTask({ kind: "sign" }), kase), "Open");
    assert.equal(verbFor(junior, makeTask({ kind: "pay", status: "ready" }), kase), "Open");
  });

  it("anyone on the case: Continue on a draft", () => {
    assert.equal(verbFor(junior, makeTask({ kind: "file", status: "draft" }), kase), "Continue");
    assert.equal(verbFor(senior, makeTask({ kind: "file", status: "draft" }), kase), "Continue");
  });

  it("hearing tasks: Mark done for anyone on the case while open", () => {
    assert.equal(verbFor(junior, makeTask({ kind: "hearing" }), kase), "Mark done");
    assert.equal(verbFor(senior, makeTask({ kind: "hearing" }), kase), "Mark done");
    assert.equal(canMarkDone(junior, makeTask({ kind: "hearing" }), kase), true);
    assert.equal(canMarkDone(junior, makeTask({ kind: "hearing", systemObservable: true }), kase), false);
  });

  it("not on the case, waiting, or closed: View", () => {
    assert.equal(verbFor(outsider, makeTask({ kind: "sign" }), kase), "View");
    assert.equal(verbFor(senior, makeTask({ status: "awaiting-court" }), kase), "View");
    assert.equal(verbFor(senior, makeTask({ status: "done" }), kase), "View");
    assert.equal(verbFor(outsider, makeTask({ caseId: otherCase.id }), otherCase), "Pay");
  });
});

describe("status phrases — fixed vocabulary", () => {
  it("open items say who they need: you for a signatory, the main advocate for others", () => {
    const t = makeTask({ kind: "sign" });
    assert.equal(statusPhraseOf(t, senior, kase, PEOPLE), "Needs signature · you");
    assert.equal(statusPhraseOf(t, senior2, kase, PEOPLE), "Needs signature · you");
    assert.equal(statusPhraseOf(t, junior, kase, PEOPLE), "Needs signature · Anjali Nair");
    assert.equal(statusPhraseOf(makeTask({ kind: "pay" }), junior, kase, PEOPLE), "Needs payment · Anjali Nair");
    assert.equal(statusPhraseOf(makeTask({ kind: "file", status: "ready" }), junior, kase, PEOPLE), "Needs filing · Anjali Nair");
  });

  it("drafts, returns, waiting and closed states", () => {
    assert.equal(
      statusPhraseOf(makeTask({ status: "draft", draft: { by: junior.id, savedAt: at(0) } }), senior, kase, PEOPLE),
      "Draft · S. Prakash"
    );
    assert.equal(
      statusPhraseOf(makeTask({ status: "draft", draft: { by: junior.id, savedAt: at(0) } }), junior, kase, PEOPLE),
      "Draft · you"
    );
    const returned = makeTask({
      kind: "returned",
      returned: { by: "scrutiny", at: at(-1), defects: [{ n: 1, text: "x", fixed: false }, { n: 2, text: "y", fixed: false }] },
    });
    assert.equal(statusPhraseOf(returned, senior, kase, PEOPLE), "Returned · 2 defects");
    assert.equal(statusPhraseOf(makeTask({ status: "awaiting-court" }), senior, kase, PEOPLE), "With the court");
    assert.equal(statusPhraseOf(makeTask({ status: "payment-confirming" }), senior, kase, PEOPLE), "Payment confirming");
    assert.equal(
      statusPhraseOf(makeTask({ status: "expired", statusNote: "cure window lapsed" }), senior, kase, PEOPLE),
      "Expired — cure window lapsed"
    );
    assert.equal(
      statusPhraseOf(makeTask({ status: "obsolete", statusNote: "order withdrawn" }), senior, kase, PEOPLE),
      "No longer needed — order withdrawn"
    );
    assert.match(statusPhraseOf(makeTask({ status: "done", completion: { at: at(-2), how: "event" } }), senior, kase, PEOPLE), /^Done \d+ \w+$/);
  });

  it("due phrases", () => {
    const NOW = "2026-08-18T12:00:00.000Z";
    assert.deepEqual(dueCueOf(makeTask({ dueAt: at(-3) }), NOW), { text: "3 days overdue", overdue: true });
    assert.deepEqual(dueCueOf(makeTask({ dueAt: at(0) }), NOW), { text: "Due today", overdue: false });
    assert.match(dueCueOf(makeTask({ dueAt: at(4) }), NOW).text, /^Due \d+ \w+$/);
    assert.match(dueCueOf(makeTask({ hearingAt: at(4, 5), dueAt: at(4, 5) }), NOW).text, /^Before hearing /);
    assert.deepEqual(dueCueOf(makeTask({ dueKind: "none" }), NOW), { text: "No date", overdue: false });
    assert.equal(dueCueOf(makeTask({ dueAt: at(-3), status: "awaiting-court" }), NOW).overdue, false);
  });

  it("permission lines", () => {
    assert.equal(
      permissionLineOf(makeTask({ kind: "sign" }), senior, kase, PEOPLE),
      "You are on the vakalatnama — you can sign."
    );
    assert.equal(
      permissionLineOf(makeTask({ kind: "sign" }), junior, kase, PEOPLE),
      "Anjali Nair or R. Manoj must sign this. You can prepare it and mark it ready."
    );
    assert.match(
      permissionLineOf(makeTask({ kind: "sign", status: "ready", prepared: { by: junior.id, at: at(-1) } }), senior, kase, PEOPLE),
      /^Prepared by S\. Prakash on \d+ \w+ — review and sign\.$/
    );
  });
});
