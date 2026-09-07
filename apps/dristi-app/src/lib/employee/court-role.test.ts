import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COURT_ROLE_LABEL, COURT_SEATS, CURRENT_STAFF } from "./content";
import {
  readCourtRole,
  seatOrdersAlwaysOpen,
  seatRunsSitting,
  setCourtRole,
} from "./court-role";
import {
  canDraftOrder,
  hearingProgressLabel,
  type CourtHearingStatus,
} from "./hearings";

describe("court seats", () => {
  it("offers the bench clerk and the typist, and starts in the first", () => {
    assert.deepEqual(COURT_SEATS, ["bench-clerk", "typist"]);
    assert.equal(CURRENT_STAFF.role, "bench-clerk");
    assert.equal(readCourtRole(), CURRENT_STAFF.role);
  });

  it("names every seat it offers", () => {
    for (const seat of COURT_SEATS) {
      assert.ok(COURT_ROLE_LABEL[seat]);
    }
  });

  it("takes a seat, and taking the same one again is not a change", () => {
    let changes = 0;
    /* Read through the module rather than a captured value — the store is what the rail
       subscribes to. */
    setCourtRole("typist");
    assert.equal(readCourtRole(), "typist");
    changes += 1;
    setCourtRole("typist");
    assert.equal(changes, 1);
    setCourtRole("bench-clerk");
    assert.equal(readCourtRole(), "bench-clerk");
  });
});

describe("seatRunsSitting", () => {
  it("is the bench's work and not the typist's", () => {
    assert.equal(seatRunsSitting("bench-clerk"), true);
    assert.equal(seatRunsSitting("magistrate"), true);
    assert.equal(seatRunsSitting("typist"), false);
  });
});

describe("seatOrdersAlwaysOpen", () => {
  it("opens the orders column down the whole board for the typist only", () => {
    assert.equal(seatOrdersAlwaysOpen("typist"), true);
    assert.equal(seatOrdersAlwaysOpen("bench-clerk"), false);
  });

  /* The rule only ever adds: whatever the bench can draft on, so can the typist. */
  it("never closes a listing the bench could already draft on", () => {
    const statuses: CourtHearingStatus[] = [
      "scheduled",
      "ongoing",
      "completed",
      "passed-over",
      "rescheduled",
      "abandoned",
    ];
    for (const status of statuses) {
      const bench = canDraftOrder(status);
      const typist = seatOrdersAlwaysOpen("typist") || canDraftOrder(status);
      assert.ok(typist || !bench, `${status} closed for the typist`);
    }
  });
});

describe("hearingProgressLabel", () => {
  it("says what happened to the sitting, not where the listing stands", () => {
    assert.equal(hearingProgressLabel("scheduled"), "Hearing not started");
    assert.equal(hearingProgressLabel("ongoing"), "Hearing started");
    assert.equal(hearingProgressLabel("completed"), "Hearing ended");
  });

  it("reads a deferred listing as one that never started", () => {
    assert.equal(hearingProgressLabel("passed-over"), "Hearing not started");
    assert.equal(hearingProgressLabel("rescheduled"), "Hearing not started");
  });
});
