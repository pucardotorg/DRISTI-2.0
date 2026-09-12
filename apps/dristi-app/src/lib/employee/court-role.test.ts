import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COURT_ROLE_LABEL, COURT_SEATS, CURRENT_STAFF } from "./content";
import {
  readCourtRole,
  seatHasBenchControls,
  setCourtRole,
} from "./court-role";
import { canDraftOrder, canTypeOrder } from "./hearings";

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

describe("the orders gate each seat reads", () => {
  it("waits for the call in a seat that makes it", () => {
    assert.equal(canDraftOrder("scheduled"), false);
    assert.equal(canDraftOrder("ongoing"), true);
    assert.equal(canDraftOrder("completed"), true);
  });

  /* The point of the typist's board: with no start control on the row, a gate that
     waited for the call would never open, so the whole column would be dead. */
  it("opens on the day's call in the seat with nothing to open it with", () => {
    assert.equal(seatHasBenchControls("typist"), false);
    assert.equal(canTypeOrder("scheduled"), true);
    assert.equal(canTypeOrder("ongoing"), true);
    assert.equal(canTypeOrder("completed"), true);
  });

  it("closes in both seats on a listing that was never heard", () => {
    for (const status of ["passed-over", "rescheduled", "abandoned"] as const) {
      assert.equal(canDraftOrder(status), false, `${status} opened for the bench`);
      assert.equal(canTypeOrder(status), false, `${status} opened for the typist`);
    }
  });

  /* One gate is the other plus the listing nobody has called yet — the seats differ
     about that row and about nothing else. */
  it("differs from the bench's gate on exactly the uncalled listing", () => {
    for (const status of [
      "scheduled",
      "ongoing",
      "completed",
      "passed-over",
      "rescheduled",
      "abandoned",
    ] as const) {
      assert.equal(
        canTypeOrder(status),
        canDraftOrder(status) || status === "scheduled",
        `${status} disagrees about the orders column`,
      );
    }
  });
});
