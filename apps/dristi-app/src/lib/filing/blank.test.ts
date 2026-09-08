import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBlankDraft, migrateDraft } from "./blank";
import { FINAL_RELIEF_TEMPLATE } from "./options";
import { draftProgress, sectionComplete } from "./selectors";
import type { FilingDraft } from "./types";

/**
 * Drafts on disk are written by whichever branch ran last on this origin. The settlement
 * lineage renamed `adr` to `settlement` and deleted the old block, so a draft can come
 * back missing a field every selector here reads. These check that reading one is boring.
 */
describe("migrateDraft — drafts written by another branch", () => {
  /** A draft as `feature/settlement-options` leaves it: no `adr`, version 4. */
  function settlementShaped(): FilingDraft {
    const draft = createBlankDraft("draft-settlement") as Omit<FilingDraft, "version"> & {
      settlement?: unknown;
      version: number;
    };
    delete (draft as { adr?: unknown }).adr;
    draft.settlement = {
      willing: "no",
      otherDetails: "Nothing further.",
      interimRelief: "<p>Interim as typed</p>",
      finalRelief: "<p>Final as typed</p>",
      mode: "packaged",
      offers: [],
    };
    draft.lastStep = "settlement" as FilingDraft["lastStep"];
    draft.version = 4;
    return draft as FilingDraft;
  }

  it("carries the prayer across rather than resetting it to the template", () => {
    const draft = migrateDraft(settlementShaped());
    assert.equal(draft.adr.finalRelief, "<p>Final as typed</p>");
    assert.equal(draft.adr.interimRelief, "<p>Interim as typed</p>");
    assert.equal(draft.adr.otherDetails, "Nothing further.");
    assert.equal(draft.adr.adr, "no");
  });

  it("leaves the settlement block alone, so the offer ladder survives a trip back", () => {
    const draft = migrateDraft(settlementShaped()) as FilingDraft & {
      settlement?: { offers?: unknown[] };
    };
    assert.ok(draft.settlement, "settlement was deleted");
  });

  it("moves a step id this branch does not have onto one it does", () => {
    assert.equal(migrateDraft(settlementShaped()).lastStep, "adr-prayer");
  });

  it("lets the selectors that took the filings screen down run", () => {
    const draft = migrateDraft(settlementShaped());
    assert.equal(sectionComplete(draft, "adr-prayer"), true);
    assert.equal(typeof draftProgress(draft), "number");
  });

  it("falls back to the template when there is no settlement block either", () => {
    const bare = createBlankDraft("draft-bare");
    delete (bare as { adr?: unknown }).adr;
    assert.equal(migrateDraft(bare).adr.finalRelief, FINAL_RELIEF_TEMPLATE);
  });

  it("survives a draft missing whole blocks", () => {
    const gutted = createBlankDraft("draft-gutted");
    for (const key of ["intake", "complainants", "accused", "cheques", "notices",
      "jurisdiction", "witnesses", "documents", "sign", "dismissed"]) {
      delete (gutted as unknown as Record<string, unknown>)[key];
    }
    const draft = migrateDraft(gutted);
    assert.equal(draft.version, 5);
    assert.equal(typeof draftProgress(draft), "number");
  });
});
