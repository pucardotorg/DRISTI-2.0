import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allResolved,
  breadcrumbOf,
  countResolved,
  defectState,
  editedResolution,
  firstUnresolved,
  intendedResolution,
  isResolved,
  keptResolution,
  resolutionLabel,
  resolutionSatisfies,
  sameResolution,
  targetKey,
} from "./defects";
import { at, makeDefect, makeDocDefect } from "./fixtures";
import type { Defect } from "./types";

const AT = at(0);

describe("defect resolution — derived, never certified", () => {
  it("an untouched field is open, whatever the task record says", () => {
    const d = makeDefect({ resolution: { how: "edited", value: "x", at: AT } });
    // The record claims an edit; the filing still holds what scrutiny saw.
    assert.equal(defectState(d, "KLGB0040231"), "open");
    assert.equal(isResolved(d, "KLGB0040231"), false);
  });

  it("a changed value on a bare note resolves — no essay required", () => {
    const d = makeDefect();
    assert.equal(defectState(d, "KLGB0040213"), "resolved");
    assert.equal(resolutionLabel(d, "KLGB0040213"), "Corrected");
  });

  it("blank and whitespace read the same as the value at return", () => {
    const d = makeDefect({ valueAtReturn: "" });
    assert.equal(defectState(d, "   "), "open");
    assert.equal(defectState(d, "47"), "resolved");
  });

  it("taking the officer's exact value is an acceptance, however it was typed", () => {
    const d = makeDefect({ suggestion: { from: "KLGB0040231", to: "KLGB0040213" } });
    assert.equal(defectState(d, "KLGB0040213"), "resolved");
    assert.equal(resolutionLabel(d, "KLGB0040213"), "Suggestion accepted");
  });

  it("overriding an explicit suggestion is blocked until there is a reason", () => {
    const d = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    assert.equal(defectState(d, "92000"), "needs-justification");

    const justified: Defect = {
      ...d,
      resolution: editedResolution("92000", "The memo at page 7 reads ₹92,000.", AT),
    };
    assert.equal(defectState(justified, "92000"), "resolved");
    assert.equal(resolutionLabel(justified, "92000"), "Changed, with a reason");
  });

  it("a whitespace-only justification is not a reason", () => {
    const d = makeDefect({
      suggestion: { from: "85000", to: "185000" },
      valueAtReturn: "85000",
      resolution: { how: "edited", value: "92000", justification: "   ", at: AT },
    });
    assert.equal(defectState(d, "92000"), "needs-justification");
  });

  it("disagreement resolves a bare-note defect with the value untouched (D7)", () => {
    const d = makeDefect();
    assert.equal(defectState(d, "KLGB0040231"), "open");

    const disputed: Defect = {
      ...d,
      resolution: keptResolution("KLGB0040231", "The branch certificate at page 11 reads this code.", AT),
    };
    assert.equal(defectState(disputed, "KLGB0040231"), "resolved");
    assert.equal(resolutionLabel(disputed, "KLGB0040231"), "Kept, with a reason");
    assert.equal(resolutionSatisfies(disputed), true);
  });

  it("disagreement resolves a suggested defect too — the filed value stands, with a reason", () => {
    const d = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    assert.equal(defectState(d, "85000"), "open");

    const disputed: Defect = {
      ...d,
      resolution: keptResolution("85000", "The memo is the document in error; the cheque reads ₹85,000.", AT),
    };
    assert.equal(defectState(disputed, "85000"), "resolved");
    assert.equal(resolutionLabel(disputed, "85000"), "Kept, with a reason");
  });

  it("a kept record with no reason is not a resolution", () => {
    const d = makeDefect({ resolution: { how: "kept", value: "KLGB0040231", at: AT } });
    assert.equal(defectState(d, "KLGB0040231"), "open");
    assert.equal(resolutionSatisfies(d), false);

    const blank = makeDefect({
      resolution: { how: "kept", value: "KLGB0040231", justification: "  ", at: AT },
    });
    assert.equal(defectState(blank, "KLGB0040231"), "open");
    assert.equal(resolutionSatisfies(blank), false);
  });

  it("a document defect resolves only on a replacement upload", () => {
    const d = makeDocDefect();
    assert.equal(defectState(d, "old-file-id"), "open");

    const replaced: Defect = {
      ...d,
      resolution: {
        how: "replaced",
        at: AT,
        replacement: { id: "f2", name: "ad-card.pdf", size: 10, type: "application/pdf", ext: "PDF" },
      },
    };
    assert.equal(defectState(replaced, "f2"), "resolved");
    assert.equal(resolutionLabel(replaced, "f2"), "Document replaced");

    // A "replaced" record with nothing attached is not a replacement.
    const empty: Defect = { ...d, resolution: { how: "replaced", at: AT } };
    assert.equal(defectState(empty, "f2"), "open");
  });
});

describe("resolutionSatisfies — the task-side half, with no draft in hand", () => {
  it("agrees with the screen on the cases the task can see", () => {
    assert.equal(resolutionSatisfies(makeDefect()), false);
    assert.equal(resolutionSatisfies(makeDefect({ resolution: { how: "accepted", at: AT } })), true);
    assert.equal(
      resolutionSatisfies(makeDefect({ resolution: { how: "edited", value: "x", at: AT } })),
      true
    );
    assert.equal(
      resolutionSatisfies(
        makeDefect({
          suggestion: { from: "a", to: "b" },
          resolution: { how: "edited", value: "c", at: AT },
        })
      ),
      false
    );
    assert.equal(
      resolutionSatisfies(
        makeDefect({
          suggestion: { from: "a", to: "b" },
          resolution: { how: "edited", value: "c", justification: "because", at: AT },
        })
      ),
      true
    );
  });
});

describe("what the record should say — written on commit, not per keystroke", () => {
  it("names the act: accepted, edited, kept, or nothing done", () => {
    const bare = makeDefect();
    assert.equal(intendedResolution(bare, "KLGB0040231", "", AT), undefined);
    assert.deepEqual(intendedResolution(bare, "KLGB0040213", "", AT), {
      how: "edited",
      value: "KLGB0040213",
      justification: undefined,
      at: AT,
    });
    assert.deepEqual(intendedResolution(bare, "KLGB0040231", "This code is right.", AT), {
      how: "kept",
      value: "KLGB0040231",
      justification: "This code is right.",
      at: AT,
    });

    const suggested = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    assert.deepEqual(intendedResolution(suggested, "185000", "", AT), {
      how: "accepted",
      value: "185000",
      at: AT,
    });
    assert.equal(intendedResolution(suggested, "92000", "The memo reads ₹92,000.", AT)?.how, "edited");
  });

  it("compares records on substance, so a re-run writes no second line", () => {
    const d = makeDefect();
    const first = intendedResolution(d, "KLGB0040213", "", at(0));
    const again = intendedResolution(d, "KLGB0040213", "", at(1));
    assert.equal(sameResolution(first, again), true);
    assert.equal(sameResolution(first, intendedResolution(d, "KLGB0040214", "", AT)), false);
    assert.equal(sameResolution(undefined, undefined), true);
    assert.equal(sameResolution(first, undefined), false);
    assert.equal(
      sameResolution(editedResolution("x", "why", AT), editedResolution("x", "why ", AT)),
      true
    );
  });
});

describe("counting the round", () => {
  const defects = [
    makeDefect({ n: 1, valueAtReturn: "a" }),
    makeDefect({ n: 2, valueAtReturn: "b" }),
    makeDefect({ n: 3, valueAtReturn: "c" }),
  ];
  const values: Record<number, string> = { 1: "changed", 2: "b", 3: "c" };
  const valueOf = (d: Defect) => values[d.n];

  it("counts only what is actually resolved", () => {
    assert.deepEqual(countResolved(defects, valueOf), { resolved: 1, total: 3 });
    assert.equal(allResolved(defects, valueOf), false);
    assert.equal(firstUnresolved(defects, valueOf)?.n, 2);
  });

  it("an empty return never counts as complete — there is nothing to submit", () => {
    assert.equal(allResolved([], valueOf), false);
  });

  it("all resolved opens the gate", () => {
    const done = (d: Defect) => `${values[d.n]}-fixed`;
    assert.equal(allResolved(defects, done), true);
    assert.equal(firstUnresolved(defects, done), null);
  });
});

describe("saying where a defect is", () => {
  it("breadcrumbs section › instance › field, and drops the instance when there is none", () => {
    assert.deepEqual(breadcrumbOf(makeDefect().target), ["Case details", "Cheque 1", "IFSC code"]);
    assert.deepEqual(breadcrumbOf(makeDocDefect().target), [
      "Documents",
      "Proof of delivery of demand notice (AD card)",
    ]);
  });

  it("keys distinguish two instances of the same field", () => {
    const one = makeDefect().target;
    const base = makeDefect().target;
    assert.equal(base.kind, "field");
    const two = makeDefect({
      target: base.kind === "field" ? { ...base, instance: 1 } : base,
    }).target;
    assert.notEqual(targetKey(one), targetKey(two));
    assert.equal(targetKey(one), "field:cheque:0:ifsc");
  });
});
