import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DELAY_CONDONATION_QUEUE,
  DELAY_CONDONATION_STAGES,
  EMPTY_DELAY_CONDONATION_FILTERS,
  buildDelayCondonationDocument,
  delayCondonationFiler,
  delayCondonationStageLabel,
  delayLine,
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

describe("the particulars the review overlay reads", () => {
  it("is on every row, so no application opens half-blank", () => {
    for (const row of DELAY_CONDONATION_QUEUE) {
      assert.match(row.appliedOn, /^\d{4}-\d{2}-\d{2}$/, row.id);
      assert.ok(row.delayDays > 0, `${row.id} claims no delay`);
      assert.ok(row.delayIn.length > 0, `${row.id} says nothing was late`);
      assert.ok(row.reason.length > 0, `${row.id} pleads no cause`);
    }
  });

  it("states the delay as a sentence, and counts a single day as one", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-1213")!;
    assert.equal(delayLine(row), "27 days in filing the complaint");
    assert.equal(
      delayLine({ ...row, delayDays: 1 }),
      "1 day in filing the complaint",
    );
  });
});

describe("who filed the application", () => {
  it("names counsel on record for the applying side", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-1213")!;
    assert.equal(
      delayCondonationFiler(row),
      "Adv. Suresh Menon, counsel for the complainant",
    );
  });

  it("names the applying side's own counsel, never the other side's", () => {
    for (const row of DELAY_CONDONATION_QUEUE) {
      const onRecord = row.counsel.filter(
        (counsel) => counsel.side === row.filedFor,
      );
      const filer = delayCondonationFiler(row);
      if (onRecord.length) {
        assert.equal(
          filer,
          `${onRecord[0]!.name}, counsel for the ${row.filedFor}`,
          row.id,
        );
      } else {
        assert.equal(
          filer,
          `${row.parties[row.filedFor]}, ${row.filedFor}, appearing without counsel`,
          row.id,
        );
      }
    }
  });

  it("reads an accused-filed application off the accused's own vakalat", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-403")!;
    assert.equal(row.filedFor, "accused");
    assert.equal(
      delayCondonationFiler(row),
      "Adv. Saurabh Verma, counsel for the accused",
    );
  });

  it("says so plainly when there is no vakalat at all", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-1235")!;
    assert.equal(row.counsel.length, 0);
    assert.equal(
      delayCondonationFiler(row),
      `${row.parties.complainant}, complainant, appearing without counsel`,
    );
  });
});

describe("buildDelayCondonationDocument", () => {
  it("composes the application every row can produce", () => {
    for (const row of DELAY_CONDONATION_QUEUE) {
      const document = buildDelayCondonationDocument(row);
      assert.equal(document.title, "Application for condonation of delay");
      assert.equal(document.caseNumber, row.caseNumber);
      assert.ok(document.facts.length >= 5, row.id);
      assert.ok(document.paragraphs.length > 0, row.id);
      assert.ok(document.prayer.includes(delayLine(row)), row.id);
    }
  });

  it("recites the cause pleaded and the delay it explains", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-1213")!;
    const document = buildDelayCondonationDocument(row);
    assert.ok(document.paragraphs.some((line) => line.includes(row.reason)));
    assert.ok(
      document.facts.some(
        (fact) =>
          fact.term === "Delay to be condoned" && fact.value === delayLine(row),
      ),
    );
    assert.equal(document.dated, "8 October 2025");
  });

  it("names only the counsel a row actually has on record", () => {
    const row = DELAY_CONDONATION_QUEUE.find((entry) => entry.id === "dc-1235")!;
    const terms = buildDelayCondonationDocument(row).facts.map(
      (fact) => fact.term,
    );
    assert.ok(!terms.includes("Complainant counsel"));
    assert.ok(!terms.includes("Accused counsel"));
  });
});
