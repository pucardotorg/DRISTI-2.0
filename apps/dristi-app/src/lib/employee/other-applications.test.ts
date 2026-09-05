import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_OTHER_APPLICATION_FILTERS,
  OTHER_APPLICATIONS_QUEUE,
  OTHER_APPLICATIONS_QUEUE_COUNT,
  OTHER_APPLICATION_STAGES,
  OTHER_APPLICATION_TYPES,
  buildOtherApplicationDocument,
  filterOtherApplications,
  otherApplicationAsk,
  otherApplicationFiler,
  otherApplicationStageLabel,
  otherApplicationTypeLabel,
} from "./other-applications";

describe("OTHER_APPLICATIONS_QUEUE", () => {
  it("is long enough to page, and the count the rail shows is the list's own", () => {
    assert.equal(OTHER_APPLICATIONS_QUEUE.length, 41);
    assert.equal(OTHER_APPLICATIONS_QUEUE_COUNT, OTHER_APPLICATIONS_QUEUE.length);
  });

  it("offers a row for every stage the filter lists", () => {
    const stagesInQueue = new Set(OTHER_APPLICATIONS_QUEUE.map((row) => row.stage));
    for (const stage of OTHER_APPLICATION_STAGES) {
      assert.ok(
        stagesInQueue.has(stage.id),
        `filter offers ${stage.id} but the queue has none`,
      );
    }
  });

  it("offers a row for every application type the filter lists", () => {
    const typesInQueue = new Set(OTHER_APPLICATIONS_QUEUE.map((row) => row.type));
    for (const type of OTHER_APPLICATION_TYPES) {
      assert.ok(
        typesInQueue.has(type.id),
        `filter offers ${type.id} but the queue has none`,
      );
    }
  });

  it("numbers a matter the way its stage does — CMP before cognizance is taken, ST after", () => {
    const beforeCognizance = new Set([
      "filing",
      "scrutiny",
      "registration",
      "cognizance",
    ]);
    for (const row of OTHER_APPLICATIONS_QUEUE) {
      const prefix = beforeCognizance.has(row.stage) ? "CMP/" : "ST/";
      assert.ok(
        row.caseNumber.startsWith(prefix),
        `${row.caseNumber} is at ${row.stage} and should start ${prefix}`,
      );
    }
  });
});

describe("filterOtherApplications", () => {
  it("returns the queue unchanged when the filters are empty", () => {
    const rows = filterOtherApplications(
      OTHER_APPLICATIONS_QUEUE,
      EMPTY_OTHER_APPLICATION_FILTERS,
    );
    assert.equal(rows.length, OTHER_APPLICATIONS_QUEUE.length);
  });

  it("narrows by stage", () => {
    const rows = filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
      ...EMPTY_OTHER_APPLICATION_FILTERS,
      stage: "long-pending-register",
    });
    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.stage === "long-pending-register"));
  });

  it("narrows by application type", () => {
    const rows = filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
      ...EMPTY_OTHER_APPLICATION_FILTERS,
      type: "bail",
    });
    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.type === "bail"));
  });

  it("matches a cause, a number, or an advocate", () => {
    assert.equal(
      filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
        ...EMPTY_OTHER_APPLICATION_FILTERS,
        query: "kannanalloor coir",
      }).length,
      1,
    );
    assert.equal(
      filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
        ...EMPTY_OTHER_APPLICATION_FILTERS,
        query: "ST/541/2026",
      })[0]?.id,
      "oa-541",
    );
    assert.ok(
      filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
        ...EMPTY_OTHER_APPLICATION_FILTERS,
        query: "nisha",
      }).length > 0,
    );
  });

  it("combines all three filters", () => {
    const rows = filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
      stage: "evidence",
      query: "adv. rekha pillai",
      type: "production-of-documents",
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      ["oa-538", "oa-548"],
    );
  });

  it("returns nothing when the three filters cannot all hold at once", () => {
    const rows = filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
      stage: "filing",
      query: "",
      type: "bail",
    });
    assert.equal(rows.length, 0);
  });

  it("treats surrounding spaces as no query", () => {
    const rows = filterOtherApplications(OTHER_APPLICATIONS_QUEUE, {
      ...EMPTY_OTHER_APPLICATION_FILTERS,
      query: "  ",
    });
    assert.equal(rows.length, OTHER_APPLICATIONS_QUEUE.length);
  });
});

describe("the vocabulary this screen names", () => {
  it("orders stages the way the process runs, not the way the reference alphabetised them", () => {
    assert.deepEqual(
      OTHER_APPLICATION_STAGES.map((stage) => stage.id),
      [
        "filing",
        "scrutiny",
        "registration",
        "cognizance",
        "appearance",
        "plea",
        "evidence",
        "arguments",
        "judgement",
        "post-judgement",
        "long-pending-register",
      ],
    );
  });

  it("names the long pending register in the court's own words", () => {
    assert.equal(
      otherApplicationStageLabel("long-pending-register"),
      "Long pending register",
    );
  });

  it("renders human labels rather than the reference's backend enums", () => {
    assert.equal(
      otherApplicationTypeLabel("extension-of-submission-deadline"),
      "Application for extension of submission deadline",
    );
    assert.equal(
      otherApplicationTypeLabel("reschedule-adjournment"),
      "Application to reschedule/adjournment",
    );
    /* "Others" is both this screen and one of the types on it — the reference's own
       collision, kept rather than renamed. */
    assert.equal(otherApplicationTypeLabel("others"), "Others");
  });

  it("offers all fourteen types", () => {
    assert.equal(OTHER_APPLICATION_TYPES.length, 14);
  });
});

describe("the particulars the review overlay reads", () => {
  it("is on every row, so no application opens half-blank", () => {
    for (const row of OTHER_APPLICATIONS_QUEUE) {
      assert.match(row.appliedOn, /^\d{4}-\d{2}-\d{2}$/, row.id);
      assert.ok(row.reason.length > 0, `${row.id} gives no reason`);
    }
  });
});

describe("who filed the application", () => {
  it("names the applying side's own counsel, never the other side's", () => {
    for (const row of OTHER_APPLICATIONS_QUEUE) {
      const onRecord = row.counsel.filter(
        (counsel) => counsel.side === row.filedFor,
      );
      const filer = otherApplicationFiler(row);
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

  it("says so plainly when the accused applies without a vakalat", () => {
    /* Counsel on record for the complainant only, and it is the accused applying. */
    const row = OTHER_APPLICATIONS_QUEUE.find((entry) => entry.id === "oa-517")!;
    assert.equal(row.filedFor, "accused");
    assert.equal(
      otherApplicationFiler(row),
      `${row.parties.accused}, accused, appearing without counsel`,
    );
  });
});

describe("buildOtherApplicationDocument", () => {
  it("gives every head of application its own ask and prayer", () => {
    const asks = new Set<string>();
    const prayers = new Set<string>();
    for (const type of OTHER_APPLICATION_TYPES) {
      const row = OTHER_APPLICATIONS_QUEUE.find(
        (entry) => entry.type === type.id,
      )!;
      const document = buildOtherApplicationDocument(row);
      assert.equal(document.title, type.label);
      assert.ok(document.prayer.length > 0, type.id);
      assert.ok(
        document.paragraphs.some((line) =>
          line.includes(otherApplicationAsk(row)),
        ),
        `${type.id} never says what it asks for`,
      );
      asks.add(otherApplicationAsk(row));
      prayers.add(document.prayer);
    }
    /* Fourteen heads, fourteen distinct asks — no type quietly inherits another's. */
    assert.equal(asks.size, OTHER_APPLICATION_TYPES.length);
    assert.equal(prayers.size, OTHER_APPLICATION_TYPES.length);
  });

  it("composes the application every row can produce", () => {
    for (const row of OTHER_APPLICATIONS_QUEUE) {
      const document = buildOtherApplicationDocument(row);
      assert.equal(document.caseNumber, row.caseNumber);
      assert.ok(document.facts.length >= 5, row.id);
      assert.ok(
        document.paragraphs.some((line) => line.includes(row.reason)),
        row.id,
      );
    }
  });

  it("names only the counsel a row actually has on record", () => {
    const row = OTHER_APPLICATIONS_QUEUE.find((entry) => entry.id === "oa-2109")!;
    assert.equal(row.counsel.length, 0);
    const terms = buildOtherApplicationDocument(row).facts.map(
      (fact) => fact.term,
    );
    assert.ok(!terms.includes("Complainant counsel"));
    assert.ok(!terms.includes("Accused counsel"));
  });
});
