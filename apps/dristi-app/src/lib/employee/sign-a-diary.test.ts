import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAUSE_LIST, courtHearingPurposeLabel, formatListingDate } from "./hearings";
import {
  A_DIARY_PENDING_COUNT,
  DEFAULT_A_DIARY_FILTERS,
  aDiaryDocumentText,
  aDiaryEntries,
  buildADiaryDocument,
  filterADiary,
  resolveADiaryDay,
  saveBusinessOfTheDay,
} from "./sign-a-diary";

/* An arbitrary day, well away from any date in the fixtures. The register is built from
   offsets, so every assertion below has to hold whatever day it is asked for — which is
   the property these tests exist to hold on to. */
const TODAY = "2027-03-15";
const ENTRIES = aDiaryEntries(TODAY);

describe("aDiaryEntries", () => {
  it("resolves its dates against the day it is given, not a fixture", () => {
    const other = aDiaryEntries("2029-11-02");
    assert.equal(ENTRIES[0].dated, TODAY);
    assert.equal(other[0].dated, "2029-11-02");
    assert.equal(ENTRIES.length, other.length);
  });

  it("carries the whole unsigned diary, and the rail's count is its length", () => {
    assert.equal(ENTRIES.length, 8);
    assert.equal(A_DIARY_PENDING_COUNT, ENTRIES.length);
  });

  it("holds five entries for the day the court is sitting, and a backlog before it", () => {
    const today = ENTRIES.filter((entry) => entry.dated === TODAY);
    assert.equal(today.length, 5);
    assert.equal(ENTRIES.length - today.length, 3);
    for (const entry of ENTRIES) {
      assert.ok(entry.dated <= TODAY, `${entry.id} records a day not yet sat`);
    }
  });

  it("runs newest day first — the order a diary is read back and signed", () => {
    const days = ENTRIES.map((entry) => entry.dated);
    assert.deepEqual(
      days,
      [...days].sort((a, b) => b.localeCompare(a)),
    );
  });

  it("lists every case for a date the court has not yet reached", () => {
    for (const entry of ENTRIES) {
      assert.ok(
        entry.nextHearing > TODAY,
        `${entry.id} comes back on ${entry.nextHearing}, which is not ahead of today`,
      );
    }
  });

  it("ends every entry with the sentence that fixes the next date", () => {
    for (const entry of ENTRIES) {
      const opening = `Next hearing is scheduled on ${formatListingDate(entry.nextHearing)} for `;
      assert.ok(
        entry.business.includes(opening) && entry.business.endsWith("."),
        `${entry.id} does not end with its own next-hearing sentence`,
      );
      const purpose = courtHearingPurposeLabel(entry.nextPurpose);
      assert.ok(
        entry.business.includes(purpose.replace(/^For /, "")),
        `${entry.id} does not name what it is listed for`,
      );
    }
  });

  it("never writes the preposition twice, whatever the purpose is called", () => {
    /* "For reports (to be received from forensics, ADR, etc)" is a label that already
       opens with "for". The register must not read "for For reports". */
    for (const entry of ENTRIES) {
      assert.ok(
        !entry.business.includes("for For "),
        `${entry.id} doubles the preposition`,
      );
    }
    const reports = ENTRIES.find((entry) => entry.nextPurpose === "for-reports");
    assert.ok(reports, "no entry exercises a purpose whose label opens with 'For'");
    assert.ok(reports.business.includes("for reports (to be received"));
  });

  it("keeps a business line long enough to clamp in its column", () => {
    assert.ok(ENTRIES.some((entry) => entry.business.length > 200));
  });

  it("holds a side with no vakalat, so the appearance table has an empty row to answer for", () => {
    assert.ok(
      ENTRIES.some((entry) => entry.counsel.length < 2),
      "no entry exercises a side without counsel",
    );
  });

  it("restates no case that is on today's board", () => {
    const board = new Set(CAUSE_LIST.map((hearing) => hearing.caseNumber));
    for (const entry of ENTRIES) {
      assert.ok(
        !board.has(entry.caseNumber),
        `${entry.caseNumber} is both a listing and a diary entry`,
      );
    }
  });
});

describe("filterADiary", () => {
  it("opens on the day the court is sitting", () => {
    assert.equal(resolveADiaryDay(DEFAULT_A_DIARY_FILTERS, TODAY), TODAY);
    const rows = filterADiary(ENTRIES, DEFAULT_A_DIARY_FILTERS, TODAY);
    assert.equal(rows.length, 5);
    assert.ok(rows.every((entry) => entry.dated === TODAY));
  });

  it("reads one day at a time — never a mix the table could not tell apart", () => {
    const days = new Set(
      filterADiary(ENTRIES, DEFAULT_A_DIARY_FILTERS, TODAY).map(
        (entry) => entry.dated,
      ),
    );
    assert.equal(days.size, 1);
  });

  it("cuts to one asked-for day, and says nothing rather than borrowing another", () => {
    const yesterday = ENTRIES.find((entry) => entry.dated < TODAY)?.dated;
    assert.ok(yesterday);
    const rows = filterADiary(ENTRIES, { dated: yesterday }, TODAY);
    assert.ok(rows.length > 0);
    assert.ok(rows.every((entry) => entry.dated === yesterday));
    /* A day this bench did not sit on. The register says so rather than borrowing the
       nearest day's matters to look populated — the answer `hearingsForDay` gives too. */
    assert.equal(filterADiary(ENTRIES, { dated: "2027-03-10" }, TODAY).length, 0);
  });
});

describe("saveBusinessOfTheDay", () => {
  it("replaces the day's business, trimmed, and leaves every other entry alone", () => {
    const target = ENTRIES[0];
    const rows = saveBusinessOfTheDay(
      ENTRIES,
      target.id,
      "  Heard both sides and adjourned.  ",
    );
    assert.equal(
      rows.find((entry) => entry.id === target.id)?.business,
      "Heard both sides and adjourned.",
    );
    assert.equal(rows[1].business, ENTRIES[1].business);
    assert.equal(target.business, ENTRIES[0].business, "the input was mutated");
  });

  it("ignores a blank record and an id that names no entry", () => {
    assert.deepEqual(saveBusinessOfTheDay(ENTRIES, ENTRIES[0].id, "   "), ENTRIES);
    assert.deepEqual(
      saveBusinessOfTheDay(ENTRIES, "ad-nothing", "Recorded."),
      ENTRIES,
    );
  });
});

describe("buildADiaryDocument", () => {
  it("draws the reference's four appearance rows, in its order", () => {
    const entry = ENTRIES[0];
    const document = buildADiaryDocument(entry);
    assert.deepEqual(
      document.appearances.map(({ label }) => label),
      ["Complainant 1", "Advocate(s)", "Accused 1", "Advocate(s)"],
    );
    assert.equal(document.appearances[0].value, entry.parties.complainant);
    assert.equal(document.appearances[2].value, entry.parties.accused);
  });

  it("names a side with no counsel rather than leaving the row blank", () => {
    const entry = ENTRIES.find((row) => row.counsel.length < 2);
    assert.ok(entry);
    const values = buildADiaryDocument(entry).appearances.map((row) => row.value);
    assert.ok(values.includes("No advocate on record"));
  });

  it("says the signature is not on it, because nothing here signs", () => {
    assert.equal(
      buildADiaryDocument(ENTRIES[0]).signature,
      "Pending the signature of the magistrate.",
    );
  });

  it("writes a download that carries the business of the day", () => {
    const entry = ENTRIES[0];
    const text = aDiaryDocumentText(buildADiaryDocument(entry));
    assert.ok(text.includes(entry.caseNumber));
    assert.ok(text.includes(entry.business));
    assert.ok(text.includes("Business of the day"));
  });
});
