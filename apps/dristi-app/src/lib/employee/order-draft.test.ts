import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAUSE_LIST } from "./hearings";
import {
  appearancesFor,
  assembleAttendance,
  assembleNextListing,
  assembleOrder,
  EMPTY_ORDER_DRAFT,
} from "./order-draft";

const hearing = CAUSE_LIST[0];

describe("appearancesFor", () => {
  it("names the parties, then each counsel on that side — not a ghost advocate", () => {
    const noAccusedCounsel = CAUSE_LIST.find(
      (row) => row.counsel.every((c) => c.side !== "accused"),
    );
    assert.ok(noAccusedCounsel);
    const rows = appearancesFor(noAccusedCounsel);
    assert.equal(
      rows.some((row) => row.role === "Advocate for the accused"),
      false,
    );
    assert.equal(rows[0].role, "Complainant");
    assert.equal(rows[0].name, noAccusedCounsel.parties.complainant);
  });
});

describe("assembleAttendance", () => {
  it("says attendance is unmarked when nothing is marked", () => {
    const block = assembleAttendance(appearancesFor(hearing), {});
    assert.equal(block.pending, true);
    assert.equal(block.body, "Attendance has not been marked.");
  });

  it("names only the people who were marked, and cannot be both", () => {
    const appearances = appearancesFor(hearing);
    const block = assembleAttendance(appearances, {
      complainant: "present",
      accused: "absent",
    });
    assert.equal(block.pending, false);
    assert.match(block.body, /Sunil Varghese, the complainant, is present/);
    assert.match(block.body, /Anand Traders, the accused, is absent/);
    assert.doesNotMatch(block.body, /Adv\./);
    assert.equal(block.appearances?.length, 2);
    assert.equal(block.appearances?.[0]?.name, "Sunil Varghese");
    assert.equal(block.appearances?.[1]?.mark, "absent");
  });
});

describe("assembleNextListing", () => {
  it("treats skip as a positive sentence, not a missing date", () => {
    const block = assembleNextListing({
      next: "none",
      nextPurpose: "",
      nextDate: null,
    });
    assert.equal(block.pending, false);
    assert.equal(block.body, "No next date is listed.");
  });

  it("flags a listed-next order with no date", () => {
    const block = assembleNextListing({
      next: "list",
      nextPurpose: "plea",
      nextDate: null,
    });
    assert.equal(block.pending, true);
    assert.equal(block.body, "Next date has not been set.");
  });
});

describe("assembleOrder", () => {
  it("is attendance, then directions, then next listing", () => {
    const order = assembleOrder(hearing, {
      ...EMPTY_ORDER_DRAFT,
      directions: [
        { id: "d-1", typeId: "notice", body: "Notice to the accused." },
      ],
    });
    assert.deepEqual(
      order.blocks.map((block) => block.heading),
      ["Attendance", "Notice", "Next listing"],
    );
    assert.equal(order.blocks[1].body, "Notice to the accused.");
  });
});
