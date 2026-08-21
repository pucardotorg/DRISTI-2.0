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
  reasonRequired,
  resolutionLabel,
  resolutionSatisfies,
  sameResolution,
  targetKey,
  formOrder,
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

describe("v2.1 — the four routes past the gate, and the one that is not a route", () => {
  /*
   * The flagged control is read-only now: a value can only change by accepting scrutiny's
   * correction or by entering one in the inset. So the derivation has exactly four ways to
   * read "addressed" — accepted, the advocate's own value, the filed value kept with a
   * reason, and a replaced document — and Ignore is none of them.
   */

  it("Ignore is a route, not a resolution — opening tier 3 and entering nothing leaves it open", () => {
    const d = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    // Ignore only opens the accordion. Nothing has been written, so nothing is resolved.
    assert.equal(defectState(d, "85000"), "open");
    assert.equal(isResolved(d, "85000"), false);
    assert.equal(allResolved([d], () => "85000"), false);
    // And the record the screen would write is "nothing was done".
    assert.equal(intendedResolution(d, "85000", "", AT), undefined);
  });

  it("accepted — scrutiny's exact value, and no reason is asked for", () => {
    const d = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    const r = intendedResolution(d, "185000", "", AT);
    assert.equal(r?.how, "accepted");
    assert.equal(r?.justification, undefined);
    assert.equal(defectState({ ...d, resolution: r }, "185000"), "resolved");
    assert.equal(resolutionLabel(d, "185000"), "Suggestion accepted");
  });

  it("own value on a bare note — resolved, reason optional", () => {
    const d = makeDefect();
    assert.equal(intendedResolution(d, "KLGB0040213", "", AT)?.how, "edited");
    assert.equal(defectState(d, "KLGB0040213"), "resolved");
  });

  it("own value against an explicit suggestion — resolved only once the reason is there", () => {
    const d = makeDefect({ suggestion: { from: "85000", to: "185000" }, valueAtReturn: "85000" });
    assert.equal(defectState(d, "92000"), "needs-justification");
    const r = intendedResolution(d, "92000", "The memo at page 7 reads ₹92,000.", AT);
    assert.equal(r?.how, "edited");
    assert.equal(defectState({ ...d, resolution: r }, "92000"), "resolved");
  });

  it("kept — the filed value stands, and the reason is the whole resolution", () => {
    for (const d of [
      makeDefect(),
      makeDefect({ suggestion: { from: "KLGB0040231", to: "KLGB0040213" } }),
    ]) {
      const filed = d.valueAtReturn ?? "";
      assert.equal(defectState(d, filed), "open", "no reason, no resolution");
      const r = intendedResolution(d, filed, "The branch certificate reads this code.", AT);
      assert.equal(r?.how, "kept");
      assert.equal(defectState({ ...d, resolution: r }, filed), "resolved");
      assert.equal(resolutionLabel({ ...d, resolution: r }, filed), "Kept, with a reason");
    }
  });

  it("replaced — a document is answered by a new file, and by nothing else", () => {
    const d = makeDocDefect();
    // The advocate can neither type a value nor write a reason at a document target:
    // the record for one is whatever the upload made of it.
    assert.equal(intendedResolution(d, "old-file-id", "It is legible enough.", AT), undefined);
    assert.equal(defectState(d, "old-file-id"), "open");
  });

  it("the vocabulary is exactly accepted · edited · kept · replaced", () => {
    const hows = new Set<string>();
    const bare = makeDefect();
    const suggested = makeDefect({ suggestion: { from: "a", to: "b" }, valueAtReturn: "a" });
    hows.add(intendedResolution(suggested, "b", "", AT)!.how);
    hows.add(intendedResolution(bare, "changed", "", AT)!.how);
    hows.add(intendedResolution(bare, bare.valueAtReturn ?? "", "why", AT)!.how);
    hows.add("replaced");
    assert.deepEqual([...hows].sort(), ["accepted", "edited", "kept", "replaced"]);
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

describe("the queue's order — the form's, not the memo's", () => {
  const field = (n: number, step: string, instance: number): Defect =>
    makeDefect({
      n,
      target: { ...makeDefect().target, step, instance } as Defect["target"],
    });

  it("sorts by the form's walking order, then instance, then the officer's number", () => {
    // The officer numbered the cheque defects first, but the form reads Documents,
    // then Complainant, then Cheque — and cheque 1 before cheque 2.
    const memo = [
      field(1, "cheque", 1),
      field(2, "cheque", 0),
      makeDocDefect({ n: 3 }),
      field(4, "complainant", 0),
    ];
    const sorted = [...memo].sort(formOrder);
    assert.deepEqual(
      sorted.map((d) => d.n),
      [3, 4, 2, 1]
    );
  });

  it("inside one instance the officer's numbering is the tiebreak", () => {
    const a = field(5, "cheque", 0);
    const b = field(2, "cheque", 0);
    assert.deepEqual([a, b].sort(formOrder).map((d) => d.n), [2, 5]);
  });
});

describe("when a reason is owed — the marker on the field, not the gate", () => {
  it("a freshly opened bare-note defect does not demand a justification", () => {
    // Tier 3 prefills the filed value. Untouched, that prefill is not a kept position:
    // asking why it should stand is asking about the one thing not yet done (§15.3).
    const d = makeDefect();
    assert.equal(reasonRequired(d, "KLGB0040231", false), false);
  });

  it("a bare-note defect answered with a new value never needs one", () => {
    const d = makeDefect();
    assert.equal(reasonRequired(d, "KLGB0040213", true), false);
  });

  it("a bare-note value moved away and put back is a position, and owes a reason", () => {
    const d = makeDefect();
    assert.equal(reasonRequired(d, "KLGB0040231", true), true);
  });

  it("keeping the filed value against an explicit suggestion owes one from the start (D7)", () => {
    const d = makeDefect({ suggestion: { from: "KLGB0040231", to: "KLGB0040213" } });
    assert.equal(reasonRequired(d, "KLGB0040231", false), true);
  });

  it("overriding an explicit suggestion owes one", () => {
    const d = makeDefect({ suggestion: { from: "KLGB0040231", to: "KLGB0040213" } });
    assert.equal(reasonRequired(d, "KLGB0040299", true), true);
  });

  it("taking the suggestion owes nothing, and a document defect has no reason field", () => {
    const d = makeDefect({ suggestion: { from: "KLGB0040231", to: "KLGB0040213" } });
    assert.equal(reasonRequired(d, "KLGB0040213", true), false);
    assert.equal(reasonRequired(makeDocDefect(), undefined, false), false);
  });
});
