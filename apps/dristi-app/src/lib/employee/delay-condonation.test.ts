import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DELAY_CONDONATION_QUEUE,
  DELAY_CONDONATION_STAGES,
  EMPTY_DELAY_CONDONATION_FILTERS,
  delayCondonationStageLabel,
  filterDelayCondonationCases,
} from "./delay-condonation";

describe("DELAY_CONDONATION_QUEUE", () => {
  it("is long enough to page, and Registration opens the list", () => {
    assert.equal(DELAY_CONDONATION_QUEUE.length, 35);
    assert.equal(DELAY_CONDONATION_QUEUE[0]?.stage, "registration");
    const registrationCount = DELAY_CONDONATION_QUEUE.filter(
      (row) => row.stage === "registration",
    ).length;
    assert.ok(registrationCount > 10);
  });

  it("offers a row for every stage the filter lists", () => {
    const stagesInQueue = new Set(
      DELAY_CONDONATION_QUEUE.map((row) => row.stage),
    );
    for (const stage of DELAY_CONDONATION_STAGES) {
      assert.ok(
        stagesInQueue.has(stage.id),
        `filter offers ${stage.id} but the queue has none`,
      );
    }
  });
});

describe("filterDelayCondonationCases", () => {
  it("returns the queue unchanged when the filters are empty", () => {
    const rows = filterDelayCondonationCases(
      DELAY_CONDONATION_QUEUE,
      EMPTY_DELAY_CONDONATION_FILTERS,
    );
    assert.equal(rows.length, DELAY_CONDONATION_QUEUE.length);
  });

  it("narrows by stage", () => {
    const rows = filterDelayCondonationCases(DELAY_CONDONATION_QUEUE, {
      stage: "registration",
      query: "",
    });
    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.stage === "registration"));
  });

  it("matches a cause, a number, or an advocate", () => {
    assert.equal(
      filterDelayCondonationCases(DELAY_CONDONATION_QUEUE, {
        stage: "all",
        query: "thenmala timber",
      }).length,
      1,
    );
    assert.equal(
      filterDelayCondonationCases(DELAY_CONDONATION_QUEUE, {
        stage: "all",
        query: "CMP/1251/2025",
      })[0]?.id,
      "dc-1251",
    );
    assert.equal(
      filterDelayCondonationCases(DELAY_CONDONATION_QUEUE, {
        stage: "all",
        query: "nisha",
      }).length > 0,
      true,
    );
  });

  it("treats surrounding spaces as no query", () => {
    const rows = filterDelayCondonationCases(DELAY_CONDONATION_QUEUE, {
      stage: "all",
      query: "  ",
    });
    assert.equal(rows.length, DELAY_CONDONATION_QUEUE.length);
  });
});

describe("delayCondonationStageLabel", () => {
  it("names Registration in the screenshot's word", () => {
    assert.equal(delayCondonationStageLabel("registration"), "Registration");
  });
});
