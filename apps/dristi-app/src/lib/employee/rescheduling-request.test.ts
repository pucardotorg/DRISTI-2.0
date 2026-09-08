import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  APPLICATION_TYPE_LABEL,
  EMPTY_RESCHEDULING_FILTERS,
  RESCHEDULING_QUEUE,
  buildReschedulingDocument,
  consentLabel,
  filterReschedulingRequests,
  formatProposedDates,
  senderLine,
} from "./rescheduling-request";

describe("RESCHEDULING_QUEUE", () => {
  it("is long enough to page, and newest application first", () => {
    assert.ok(RESCHEDULING_QUEUE.length > 10);
    const dates = RESCHEDULING_QUEUE.map((row) => row.appliedOn);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    assert.deepEqual(dates, sorted);
  });
});

describe("filterReschedulingRequests", () => {
  it("returns the queue unchanged when the query is empty", () => {
    const rows = filterReschedulingRequests(
      RESCHEDULING_QUEUE,
      EMPTY_RESCHEDULING_FILTERS,
    );
    assert.equal(rows.length, RESCHEDULING_QUEUE.length);
  });

  it("matches a cause, a number, or an advocate", () => {
    assert.equal(
      filterReschedulingRequests(RESCHEDULING_QUEUE, {
        query: "thankassery",
      }).length,
      1,
    );
    assert.equal(
      filterReschedulingRequests(RESCHEDULING_QUEUE, {
        query: "ST/310/2026",
      })[0]?.id,
      "rr-310",
    );
    assert.equal(
      filterReschedulingRequests(RESCHEDULING_QUEUE, {
        query: "nisha",
      }).length > 0,
      true,
    );
  });

  it("treats surrounding spaces as no query", () => {
    const rows = filterReschedulingRequests(RESCHEDULING_QUEUE, {
      query: "  ",
    });
    assert.equal(rows.length, RESCHEDULING_QUEUE.length);
  });
});

describe("senderLine", () => {
  it("names the advocate and the party the application is for", () => {
    const accusedFiled = RESCHEDULING_QUEUE.find(
      (row) => row.filedFor === "accused",
    );
    assert.ok(accusedFiled);
    assert.equal(
      senderLine(accusedFiled),
      `${accusedFiled.sender} on behalf of ${accusedFiled.parties.accused}`,
    );
  });
});

describe("buildReschedulingDocument", () => {
  it("is an advancement/reschedule application for the listed matter", () => {
    const request = RESCHEDULING_QUEUE[0];
    const document = buildReschedulingDocument(request);
    assert.equal(APPLICATION_TYPE_LABEL, "Advancement/reschedule");
    assert.match(document.title, /advancement or rescheduling/i);
    assert.equal(document.caseNumber, request.caseNumber);
    assert.ok(document.paragraphs.some((paragraph) => paragraph.includes(request.reason)));
  });

  it("records when the other parties have not agreed", () => {
    const disagreed = RESCHEDULING_QUEUE.find((row) => !row.partiesAgreed);
    assert.ok(disagreed);
    assert.equal(consentLabel(disagreed.partiesAgreed), "No");
    const document = buildReschedulingDocument(disagreed);
    assert.ok(
      document.paragraphs.some((paragraph) =>
        paragraph.includes("have not yet agreed"),
      ),
    );
  });

  it("joins more than one proposed date", () => {
    const twoDates = RESCHEDULING_QUEUE.find((row) => row.proposedOn.length > 1);
    assert.ok(twoDates);
    assert.match(formatProposedDates(twoDates.proposedOn), /,/);
  });
});
