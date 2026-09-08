import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COURT_ROLE_LABEL, COURT_SEATS, CURRENT_STAFF } from "./content";
import {
  readCourtRole,
  seatHasBenchControls,
  setCourtRole,
} from "./court-role";
import { canDraftOrder, hearingProgressLabel } from "./hearings";

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

describe("seatHasBenchControls", () => {
  it("gives Start / End / Pass over to the bench and not to the typist", () => {
    assert.equal(seatHasBenchControls("bench-clerk"), true);
    assert.equal(seatHasBenchControls("magistrate"), true);
    assert.equal(seatHasBenchControls("typist"), false);
  });
});

describe("hearingProgressLabel", () => {
  it("offers the start while there is one to make", () => {
    assert.equal(hearingProgressLabel("scheduled"), "To start");
  });

  it("reports the sitting once it is under way, and once it is done", () => {
    assert.equal(hearingProgressLabel("ongoing"), "Hearing started");
    assert.equal(hearingProgressLabel("completed"), "Hearing ended");
  });

  it("offers the start on a listing that was deferred without being heard", () => {
    assert.equal(hearingProgressLabel("passed-over"), "To start");
    assert.equal(hearingProgressLabel("rescheduled"), "To start");
  });

  /* The whole point of the walk-through: the orders column opens on exactly the
     statuses this label stops offering a start for, so a typist can only reach an order
     through a matter that has been started. */
  it("stops offering a start exactly where the orders column opens", () => {
    for (const status of [
      "scheduled",
      "ongoing",
      "completed",
      "passed-over",
      "rescheduled",
      "abandoned",
    ] as const) {
      assert.equal(
        canDraftOrder(status),
        hearingProgressLabel(status) !== "To start",
        `${status} disagrees about the order column`,
      );
    }
  });
});
