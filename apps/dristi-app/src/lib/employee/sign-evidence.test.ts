import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_SIGN_EVIDENCE_FILTERS,
  EVIDENCE_DOCUMENTS,
  MAX_EVIDENCE_SERIAL,
  SIGN_EVIDENCE_QUEUE,
  SIGN_EVIDENCE_QUEUE_COUNT,
  applyBusinessOfTheDay,
  applyEvidenceMarking,
  businessOfTheDay,
  draftBusinessOfTheDay,
  evidenceNumber,
  exhibitSeries,
  filterSignEvidence,
  markedThroughWitness,
  parseEvidenceSerial,
  signEvidence,
  takenSerials,
} from "./sign-evidence";

/** The five markings on one case — the row the reference's own data is shaped like. */
const CROWDED_CASE = "ST/702/2026";

describe("SIGN_EVIDENCE_QUEUE", () => {
  it("is long enough to page, and the count the rail shows is the list's own", () => {
    assert.equal(SIGN_EVIDENCE_QUEUE.length, 25);
    assert.equal(SIGN_EVIDENCE_QUEUE_COUNT, SIGN_EVIDENCE_QUEUE.length);
  });

  it("marks every document head in the vocabulary at least once", () => {
    const marked = new Set(SIGN_EVIDENCE_QUEUE.map((row) => row.document));
    for (const document of EVIDENCE_DOCUMENTS) {
      assert.ok(
        marked.has(document.id),
        `the vocabulary offers ${document.id} but no row marks one`,
      );
    }
  });

  it("carries one case with several markings, so the cause alone cannot name a row", () => {
    const rows = SIGN_EVIDENCE_QUEUE.filter(
      (row) => row.caseNumber === CROWDED_CASE,
    );
    assert.equal(rows.length, 5);
    assert.equal(new Set(rows.map((row) => row.document)).size, 5);
  });

  it("exercises all three exhibit series", () => {
    const series = new Set(
      SIGN_EVIDENCE_QUEUE.map((row) =>
        exhibitSeries(markedThroughWitness(row).series),
      ),
    );
    assert.deepEqual([...series].sort(), ["C", "D", "P"]);
  });

  it("gives every row a witness that is actually on its case", () => {
    for (const row of SIGN_EVIDENCE_QUEUE) {
      assert.ok(
        row.witnesses.some((witness) => witness.id === row.markedThrough),
        `${row.id} is marked through ${row.markedThrough}, who is not a witness on it`,
      );
    }
  });

  it("never marks two exhibits in one case with the same number", () => {
    const seen = new Set<string>();
    for (const row of SIGN_EVIDENCE_QUEUE) {
      const key = `${row.caseNumber} ${evidenceNumber(row)}`;
      assert.ok(!seen.has(key), `${key} is marked twice`);
      seen.add(key);
    }
  });

  it("holds no row from another court-side queue's case", () => {
    /* The one number this queue must not reuse is a case already sitting in another
       queue; the full check is the fixture comment in each module. Spot-checked on the
       signing queues either side of this one. */
    const numbers = new Set(SIGN_EVIDENCE_QUEUE.map((row) => row.caseNumber));
    for (const taken of ["ST/252/2026", "ST/606/2026", "CMP/757/2026"]) {
      assert.ok(!numbers.has(taken), `${taken} belongs to another queue`);
    }
  });
});

describe("evidenceNumber", () => {
  it("numbers a complainant's exhibit P and the accused's D", () => {
    const row = SIGN_EVIDENCE_QUEUE.find(
      (entry) => entry.caseNumber === "ST/705/2026" && entry.serial === 1,
    )!;
    assert.equal(evidenceNumber(row), "P1");

    const defence = SIGN_EVIDENCE_QUEUE.find(
      (entry) =>
        entry.caseNumber === "ST/705/2026" && entry.markedThrough === "dw1",
    )!;
    assert.equal(evidenceNumber(defence), "D1");
  });

  it("follows the witness when the marking moves to the other side", () => {
    const row = SIGN_EVIDENCE_QUEUE.find((entry) => entry.id.endsWith("702-2026-a"))!;
    assert.equal(evidenceNumber(row), "P1");
    const moved = applyEvidenceMarking([row], row.id, {
      markedThrough: "dw1",
      serial: 1,
    })[0];
    assert.equal(evidenceNumber(moved), "D1");
  });
});

describe("businessOfTheDay", () => {
  const row = SIGN_EVIDENCE_QUEUE[0];

  it("offers the court's draft line until the bench writes one", () => {
    assert.equal(
      businessOfTheDay(row),
      "Document marked as evidence exhibit number P1",
    );
  });

  it("keeps the draft in step with a renumbered exhibit", () => {
    const renumbered = applyEvidenceMarking([row], row.id, {
      markedThrough: row.markedThrough,
      serial: 7,
    })[0];
    assert.equal(businessOfTheDay(renumbered), draftBusinessOfTheDay(renumbered));
    assert.match(businessOfTheDay(renumbered), /P7$/);
  });

  it("leaves a line the bench wrote alone when the exhibit is renumbered", () => {
    const written = applyBusinessOfTheDay(
      [row],
      row.id,
      "Vakalatnama marked in the presence of both counsel",
    )[0];
    const renumbered = applyEvidenceMarking([written], row.id, {
      markedThrough: row.markedThrough,
      serial: 7,
    })[0];
    assert.equal(
      businessOfTheDay(renumbered),
      "Vakalatnama marked in the presence of both counsel",
    );
  });

  it("treats writing the draft back verbatim as no line of the bench's own", () => {
    const same = applyBusinessOfTheDay(
      [row],
      row.id,
      `  ${draftBusinessOfTheDay(row)}  `,
    )[0];
    assert.equal(same.botd, undefined);
  });
});

describe("takenSerials", () => {
  it("reports the numbers already used in this case's series, not the row's own", () => {
    const row = SIGN_EVIDENCE_QUEUE.find((entry) => entry.id.endsWith("702-2026-b"))!;
    const taken = takenSerials(SIGN_EVIDENCE_QUEUE, row, "P");
    assert.deepEqual([...taken].sort((a, b) => a - b), [1, 3, 4, 5]);
    assert.ok(!taken.has(2), "a marking must not collide with itself");
  });

  it("does not reach into another case, or another series", () => {
    const row = SIGN_EVIDENCE_QUEUE.find((entry) => entry.id.endsWith("705-2026-d"))!;
    assert.deepEqual([...takenSerials(SIGN_EVIDENCE_QUEUE, row, "D")], []);
  });
});

describe("parseEvidenceSerial", () => {
  it("accepts a whole exhibit number", () => {
    assert.equal(parseEvidenceSerial("1"), 1);
    assert.equal(parseEvidenceSerial(" 12 "), 12);
    assert.equal(parseEvidenceSerial(String(MAX_EVIDENCE_SERIAL)), MAX_EVIDENCE_SERIAL);
  });

  it("rejects what an exhibit number never is", () => {
    for (const value of ["", "0", "-3", "1.5", "P1", "1000", "٢"]) {
      assert.equal(
        parseEvidenceSerial(value),
        null,
        `${value} is not an exhibit number`,
      );
    }
  });
});

describe("filterSignEvidence", () => {
  it("returns the queue unchanged when nothing is asked for", () => {
    assert.equal(
      filterSignEvidence(SIGN_EVIDENCE_QUEUE, EMPTY_SIGN_EVIDENCE_FILTERS).length,
      SIGN_EVIDENCE_QUEUE.length,
    );
  });

  it("finds a case by number and a party by name, either case", () => {
    assert.equal(
      filterSignEvidence(SIGN_EVIDENCE_QUEUE, { query: CROWDED_CASE }).length,
      5,
    );
    assert.equal(
      filterSignEvidence(SIGN_EVIDENCE_QUEUE, { query: "mustanki" }).length,
      5,
    );
  });

  it("reaches the two columns the reference's label does not name", () => {
    const byDocument = filterSignEvidence(SIGN_EVIDENCE_QUEUE, {
      query: "vakalatnama",
    });
    assert.equal(byDocument.length, 4);
    const byNumber = filterSignEvidence(SIGN_EVIDENCE_QUEUE, { query: "P12" });
    assert.equal(byNumber.length, 1);
    assert.equal(byNumber[0].caseNumber, "ST/730/2026");
  });

  it("matches nothing rather than everything when there is no hit", () => {
    assert.deepEqual(
      filterSignEvidence(SIGN_EVIDENCE_QUEUE, { query: "no such case" }),
      [],
    );
  });
});

describe("signEvidence", () => {
  it("drops the signed rows and leaves the rest in order", () => {
    const ids = new Set([SIGN_EVIDENCE_QUEUE[0].id, SIGN_EVIDENCE_QUEUE[2].id]);
    const left = signEvidence(SIGN_EVIDENCE_QUEUE, ids);
    assert.equal(left.length, SIGN_EVIDENCE_QUEUE.length - 2);
    assert.ok(left.every((row) => !ids.has(row.id)));
    assert.equal(left[0].id, SIGN_EVIDENCE_QUEUE[1].id);
  });

  it("leaves the queue it was given untouched", () => {
    const before = SIGN_EVIDENCE_QUEUE.length;
    signEvidence(SIGN_EVIDENCE_QUEUE, new Set([SIGN_EVIDENCE_QUEUE[0].id]));
    assert.equal(SIGN_EVIDENCE_QUEUE.length, before);
  });
});
