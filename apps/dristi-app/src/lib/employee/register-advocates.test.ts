import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_REGISTER_ADVOCATES_FILTERS,
  REGISTER_ADVOCATES_QUEUE,
  REGISTER_ADVOCATES_QUEUE_COUNT,
  currentRound,
  editFor,
  filterRegistrations,
  formatDaysWaiting,
  formatDaysWaitingSpoken,
  formatWaitingDuration,
  idPhotoLabel,
  identityRows,
  registerName,
  registrantNoun,
  registrationIdLabel,
  registrationWaitTone,
  rejectionDay,
  rejectionRows,
  requestKindLabel,
  requestKindVariant,
  nextInQueue,
  requestRows,
  requestTypeValue,
  sortByLongestWait,
  sourceLine,
  submissionDay,
  type AdvocateRegistration,
  type RegistrationRow,
  type SourceStatus,
} from "./register-advocates";

/** Every row the overlay renders, for a request — the three groups, in order. */
function allRows(request: AdvocateRegistration): RegistrationRow[] {
  return [
    ...requestRows(request),
    ...identityRows(request),
    ...rejectionRows(request),
  ];
}

const EVERY_STATUS: SourceStatus[] = [
  "matches",
  "differs",
  "no-entry",
  "not-checked",
  "verified",
  "none",
];

describe("REGISTER_ADVOCATES_QUEUE", () => {
  it("is long enough to page, and the count the rail shows is the list's own", () => {
    assert.equal(REGISTER_ADVOCATES_QUEUE.length, 14);
    assert.equal(
      REGISTER_ADVOCATES_QUEUE_COUNT,
      REGISTER_ADVOCATES_QUEUE.length,
    );
  });

  it("gives every row, application number and Bar registration ID its own identity", () => {
    for (const key of ["id", "applicationNumber", "barRegistrationId"] as const) {
      const values = REGISTER_ADVOCATES_QUEUE.map((row) => row[key]);
      assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
    }
  });

  it("keeps the application number in the form the advocate is shown on their own waiting screen", () => {
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      assert.match(
        row.applicationNumber,
        /^KL-ADV-\d{6}-\d{4}$/,
        `${row.applicationNumber} is not a registration application number`,
      );
    }
  });

  it("carries the three kinds of request the lifecycle actually has", () => {
    const kinds = new Set(REGISTER_ADVOCATES_QUEUE.map((r) => r.requestKind));
    assert.deepEqual(
      [...kinds].sort(),
      ["edited", "first", "resubmission"].sort(),
    );
  });

  it("carries all three answers the Bar Council lookup can give", () => {
    const states = new Set(REGISTER_ADVOCATES_QUEUE.map((r) => r.lookup.state));
    assert.deepEqual(
      [...states].sort(),
      ["found", "no-entry", "not-checked"].sort(),
    );
  });

  it("exercises the wait escalation at both thresholds and below them", () => {
    const tones = REGISTER_ADVOCATES_QUEUE.map((r: AdvocateRegistration) =>
      registrationWaitTone(r.daysWaiting),
    );
    assert.equal(tones.filter((t) => t === "destructive").length, 2);
    assert.ok(tones.includes("warning"));
    assert.ok(tones.includes("plain"));
  });

  it("holds a name in a script Helvetica does not cover, tagged so it can be spoken", () => {
    const tagged = REGISTER_ADVOCATES_QUEUE.filter((r) => r.fullNameLang);
    assert.ok(tagged.length >= 2, "expected at least two non-English names");
    for (const row of tagged) {
      assert.match(
        row.fullName,
        /[ഀ-ൿ]/,
        `${row.applicationNumber} is tagged ${row.fullNameLang} but is written in Latin script`,
      );
    }
  });

  it("tags the register's own answer, rather than borrowing the claimant's script", () => {
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      if (row.lookup.state !== "found") continue;
      const nonLatin = /[ഀ-ൿ]/.test(row.lookup.entry.name);
      assert.equal(
        Boolean(row.lookup.entryNameLang),
        nonLatin,
        `${row.applicationNumber}: the register name "${row.lookup.entry.name}" and its entryNameLang disagree about script — a screen reader would speak it in the wrong voice`,
      );
    }
  });

  it("holds a name long enough to wrap the column it sits in", () => {
    const longest = Math.max(
      ...REGISTER_ADVOCATES_QUEUE.map((r) => r.fullName.length),
    );
    assert.ok(longest >= 36, `the longest name is only ${longest} characters`);
  });

  it("holds Bar registration IDs from more than one state bar, so the column is not sized off Kerala", () => {
    const prefixes = new Set(
      REGISTER_ADVOCATES_QUEUE.map((r) => r.barRegistrationId.split("/")[0]),
    );
    assert.ok(
      prefixes.size >= 4,
      `only ${prefixes.size} bar prefixes: ${[...prefixes].join(", ")}`,
    );
  });

  it("leaves email off the rows that never gave one — it is optional, not blank", () => {
    const without = REGISTER_ADVOCATES_QUEUE.filter((r) => r.email === undefined);
    assert.ok(without.length > 0, "every demo row has an email");
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      assert.notEqual(row.email, "", `${row.applicationNumber} has a blank email`);
    }
  });

  it("attaches rejection rounds only to a resubmission, and edits only to an edited account", () => {
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      if (row.requestKind === "resubmission") {
        assert.ok(row.rejections?.length, `${row.id} came back with no reason`);
      } else {
        assert.equal(row.rejections, undefined, `${row.id} carries rejections`);
      }

      if (row.requestKind === "edited") {
        assert.ok(row.edits?.length, `${row.id} is an edit that changed nothing`);
      } else {
        assert.equal(row.edits, undefined, `${row.id} carries edits`);
      }
    }
  });

  it("never says a request came back before the rejection that sent it back", () => {
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      const rounds = row.rejections ?? [];
      for (const round of rounds) {
        assert.ok(
          round.daysAgo > row.daysWaiting,
          `${row.applicationNumber} was resubmitted ${row.daysWaiting} days ago but round ${round.round} went out only ${round.daysAgo} days ago`,
        );
      }
      // Oldest round first, and the numbers run 1, 2, 3 … without a gap.
      assert.deepEqual(
        rounds.map((round) => round.round),
        rounds.map((_, index) => index + 1),
      );
      const ages = rounds.map((round) => round.daysAgo);
      assert.deepEqual(ages, [...ages].sort((a, b) => b - a));
    }
  });

  it("gives every reason enough words to be acted on — the failure the gate exists to stop", () => {
    for (const row of REGISTER_ADVOCATES_QUEUE) {
      for (const round of row.rejections ?? []) {
        assert.ok(
          round.reason.trim().split(/\s+/).length >= 8,
          `${row.applicationNumber} round ${round.round} is a one-word remark`,
        );
      }
    }
  });

  it("holds one photograph that will not open, so the well's failure state is reachable", () => {
    const missing = REGISTER_ADVOCATES_QUEUE.filter((r) =>
      r.photo.src.includes("not-uploaded"),
    );
    assert.equal(missing.length, 1);
  });
});

describe("sortByLongestWait", () => {
  it("puts the longest wait first — the queue is a work list", () => {
    const days = REGISTER_ADVOCATES_QUEUE.map((r) => r.daysWaiting);
    assert.deepEqual(days, [...days].sort((a, b) => b - a));
  });

  it("breaks a tie on the application number, so the order is stable between renders", () => {
    const rows = sortByLongestWait([
      row({ id: "b", applicationNumber: "KL-ADV-000209-2026", daysWaiting: 1 }),
      row({ id: "a", applicationNumber: "KL-ADV-000204-2026", daysWaiting: 1 }),
      row({ id: "c", applicationNumber: "KL-ADV-000118-2026", daysWaiting: 9 }),
    ]);
    assert.deepEqual(
      rows.map((r) => r.id),
      ["c", "a", "b"],
    );
  });

  it("does not reorder the array it was handed", () => {
    const input = [
      row({ id: "a", daysWaiting: 1 }),
      row({ id: "b", daysWaiting: 9 }),
    ];
    sortByLongestWait(input);
    assert.deepEqual(
      input.map((r) => r.id),
      ["a", "b"],
    );
  });
});

describe("filterRegistrations", () => {
  const all = REGISTER_ADVOCATES_QUEUE;

  it("asks for everything when the box is empty", () => {
    assert.equal(
      filterRegistrations(all, EMPTY_REGISTER_ADVOCATES_FILTERS).length,
      all.length,
    );
    assert.equal(filterRegistrations(all, { query: "   " }).length, all.length);
  });

  it("finds a request by the name the officer was given", () => {
    const rows = filterRegistrations(all, { query: "meera" });
    assert.deepEqual(
      rows.map((r) => r.applicationNumber),
      ["KL-ADV-000181-2026"],
    );
  });

  it("finds a request by the Bar registration ID the bar quoted", () => {
    const rows = filterRegistrations(all, { query: "KAR/12453/2018" });
    assert.deepEqual(
      rows.map((r) => r.applicationNumber),
      ["KL-ADV-000203-2026"],
    );
  });

  it("finds a request by the application number the advocate read off their own screen", () => {
    const rows = filterRegistrations(all, { query: "KL-ADV-000207-2026" });
    assert.deepEqual(
      rows.map((r) => r.fullName),
      ["Joseph Mathew"],
    );
  });

  it("finds a name written in Malayalam, typed in Malayalam", () => {
    const rows = filterRegistrations(all, { query: "ഷൈലജ" });
    assert.deepEqual(
      rows.map((r) => r.applicationNumber),
      ["KL-ADV-000196-2026"],
    );
  });

  it("wants every word, in any order and any amount of space", () => {
    assert.equal(
      filterRegistrations(all, { query: "mathew   joseph" }).length,
      1,
    );
    assert.equal(filterRegistrations(all, { query: "joseph vaidya" }).length, 0);
  });

  it("does not reach the contact details — a queue is not a directory", () => {
    assert.equal(filterRegistrations(all, { query: "9605178432" }).length, 0);
    assert.equal(
      filterRegistrations(all, { query: "meera.suresh@example.com" }).length,
      0,
    );
  });

  it("matches whatever the case the officer typed", () => {
    assert.equal(
      filterRegistrations(all, { query: "kl/3312/2021" }).length,
      filterRegistrations(all, { query: "KL/3312/2021" }).length,
    );
  });
});

describe("removing a decided request from the queue", () => {
  /* The screen holds the ids it has decided and filters them out; the count line and the
     rail count are both read off what is left. This is that arithmetic, without React. */
  function remaining(decided: Set<string>): AdvocateRegistration[] {
    return REGISTER_ADVOCATES_QUEUE.filter((r) => !decided.has(r.id));
  }

  it("drops exactly the row that was decided, and leaves the order alone", () => {
    const first = REGISTER_ADVOCATES_QUEUE[0];
    const rows = remaining(new Set([first.id]));
    assert.equal(rows.length, REGISTER_ADVOCATES_QUEUE.length - 1);
    assert.ok(!rows.some((r) => r.id === first.id));
    const days = rows.map((r) => r.daysWaiting);
    assert.deepEqual(days, [...days].sort((a, b) => b - a));
  });

  it("takes the count down with it — the header and the rail read the same list", () => {
    const decided = new Set(REGISTER_ADVOCATES_QUEUE.slice(0, 3).map((r) => r.id));
    assert.equal(remaining(decided).length, REGISTER_ADVOCATES_QUEUE_COUNT - 3);
  });

  it("empties to the good-empty state rather than to an error", () => {
    const decided = new Set(REGISTER_ADVOCATES_QUEUE.map((r) => r.id));
    assert.deepEqual(remaining(decided), []);
  });
});

describe("registrationWaitTone", () => {
  it("stays plain below the registry's first threshold", () => {
    assert.equal(registrationWaitTone(0), "plain");
    assert.equal(registrationWaitTone(6), "plain");
  });

  it("escalates on day 7 and again on day 14 — the scrutiny queue's borrowed clock", () => {
    assert.equal(registrationWaitTone(7), "warning");
    assert.equal(registrationWaitTone(13), "warning");
    assert.equal(registrationWaitTone(14), "destructive");
    assert.equal(registrationWaitTone(61), "destructive");
  });
});

describe("what the row and the overlay call things", () => {
  it("leaves a first registration unmarked — the norm gets no badge", () => {
    const first = REGISTER_ADVOCATES_QUEUE.find(
      (r) => r.requestKind === "first",
    );
    assert.ok(first);
    assert.equal(requestKindLabel(first), null);
  });

  it("marks an edited pre-created account, and a resubmission with its round", () => {
    const edited = REGISTER_ADVOCATES_QUEUE.find(
      (r) => r.requestKind === "edited",
    );
    assert.ok(edited);
    assert.equal(requestKindLabel(edited), "Edited");

    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(back);
    assert.equal(currentRound(back), 5);
    assert.equal(requestKindLabel(back), "Resubmitted · round 5");
  });

  it("colours the two exceptions apart, and leaves the norm uncoloured", () => {
    const first = REGISTER_ADVOCATES_QUEUE.find(
      (r) => r.requestKind === "first",
    );
    const edited = REGISTER_ADVOCATES_QUEUE.find(
      (r) => r.requestKind === "edited",
    );
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(first && edited && back);
    assert.equal(requestKindVariant(first), null);
    assert.equal(requestKindVariant(edited), "info");
    assert.equal(requestKindVariant(back), "warning");
  });

  it("counts a request with one rejection behind it as round 2", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-198");
    assert.ok(back);
    assert.equal(currentRound(back), 2);
    assert.deepEqual(
      rejectionRows(back).map((row) => row.term),
      ["Round 1"],
    );
  });

  it("names the three kinds of request as values, not as sentences", () => {
    const first = REGISTER_ADVOCATES_QUEUE.find((r) => r.requestKind === "first");
    const edited = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-191");
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(first && edited && back);
    assert.equal(requestTypeValue(first), "New registration");
    assert.equal(requestTypeValue(edited), "Edited Bar Council account");
    assert.equal(requestTypeValue(back), "Resubmitted · round 5");
    // Read off the registrant, so a clerk queue costs no new branch (D13).
    assert.equal(
      requestTypeValue({ ...edited, registrantKind: "clerk" }),
      "Edited clerk register account",
    );
  });

  it("reads its labels off the registrant, so clerks need no restructuring", () => {
    assert.equal(registrationIdLabel("advocate"), "Bar registration ID");
    assert.equal(registrationIdLabel("clerk"), "Clerk registration number");
    assert.equal(idPhotoLabel("advocate"), "Photo of Bar ID card");
    assert.equal(idPhotoLabel("clerk"), "Photo of clerk ID card");
    assert.equal(registrantNoun("advocate"), "advocate");
    assert.equal(registrantNoun("clerk"), "clerk");
  });

  it("finds the changed value for a field, and nothing for one that was not touched", () => {
    const edited = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-191");
    assert.ok(edited);
    assert.equal(editFor(edited, "mobile")?.was, "9847051204");
    // An email the Bar Council record never held is an addition, not a change.
    assert.equal(editFor(edited, "email")?.was, null);
    assert.equal(editFor(edited, "fullName")?.was, "Thomas Kurian");
    assert.equal(editFor(edited, "barRegistrationId"), undefined);
  });

  it("spells the unit out where there is no column header to say it", () => {
    assert.equal(formatDaysWaiting(18), "18");
    assert.equal(formatDaysWaitingSpoken(1), "1 day waiting");
    assert.equal(formatDaysWaitingSpoken(18), "18 days waiting");
  });
});

describe("the dates the overlay shows", () => {
  it("derives the submission day from the wait, so the two can never disagree", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(back);
    assert.equal(back.daysWaiting, 61);
    assert.equal(submissionDay(back), "2026-07-11");
  });

  it("puts every rejection round before the submission it sent back", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      const submitted = submissionDay(request);
      for (const round of request.rejections ?? []) {
        assert.ok(
          rejectionDay(round) < submitted,
          `${request.applicationNumber} round ${round.round} is dated after the request it produced`,
        );
      }
    }
  });
});

/**
 * The row model — the thing the overlay was rebuilt around.
 *
 * The screen this replaced turned each machine answer into a sentence of its own, so a
 * fifth answer meant new copy and none of it was data. These are the tests that keep it
 * from happening again: every answer is one of six values, every value renders through the
 * same row, and only one of the six is allowed to put a mark on it.
 */
describe("the one row every fact is in", () => {
  it("renders the request, the four submitted values and every round through one shape", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(back);
    const rows = allRows(back);
    // 3 request facts + 4 identity rows (this one has an email) + 4 rejection rounds.
    assert.equal(rows.length, 11);
    for (const row of rows) {
      // Every row is the same shape: the component has no second branch to take.
      assert.equal(typeof row.term, "string");
      assert.ok(row.term.length > 0, "a row with no term");
      assert.equal(typeof row.value, "string");
      assert.ok(row.value.length > 0, `${row.id} has no value`);
      assert.ok(Array.isArray(row.marks));
      assert.ok(EVERY_STATUS.includes(row.source.status));
    }
  });

  it("collects exactly four attribute rows — five collected values less the photograph", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      const rows = identityRows(request);
      assert.deepEqual(
        rows.map((row) => row.id),
        request.email
          ? ["fullName", "barRegistrationId", "mobile", "email"]
          : ["fullName", "barRegistrationId", "mobile"],
        `${request.applicationNumber} shows an attribute the flow does not collect`,
      );
    }
  });

  it("reaches all six statuses across the queue, each through the same row", () => {
    const seen = new Set<SourceStatus>();
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      for (const row of allRows(request)) seen.add(row.source.status);
    }
    assert.deepEqual([...seen].sort(), [...EVERY_STATUS].sort());
  });

  it("renders no source line for `none`, and two filled slots for every other status", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      for (const row of allRows(request)) {
        const line = sourceLine(row.source);
        if (row.source.status === "none") {
          assert.equal(line, null, `${row.id} filled a slot nothing checks`);
          continue;
        }
        assert.ok(line, `${row.id} is checked but says nothing`);
        assert.ok(line.source.length > 0, `${row.id} has no source`);
        assert.ok(line.answer.length > 0, `${row.id} has no answer`);
      }
    }
  });

  it("answers the four settled statuses with their own word, and `differs` with data", () => {
    // Two names, two scripts, one row — the case where borrowing the claimant's tag
    // would have a screen reader speak a Latin claim and a Malayalam answer as one voice.
    const differs = identityRows(
      REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-181")!,
    )[0];
    assert.equal(differs.valueLang, undefined);
    assert.deepEqual(sourceLine(differs.source), {
      source: "Bar Council of Kerala",
      answer: "മീര സുധാകരൻ",
      answerLang: "ml",
    });

    const matches = identityRows(
      REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-207")!,
    );
    assert.deepEqual(sourceLine(matches[0].source), {
      source: "Bar Council of Kerala",
      answer: "matches",
    });
    assert.deepEqual(sourceLine(matches[2].source), {
      source: "OTP",
      answer: "verified",
    });

    const noEntry = identityRows(
      REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-203")!,
    );
    // No entry: the name row says nothing, and the key it was looked up by says why.
    assert.equal(sourceLine(noEntry[0].source), null);
    assert.deepEqual(sourceLine(noEntry[1].source), {
      source: "Bar Council register",
      answer: "no entry",
    });

    const notChecked = identityRows(
      REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-164")!,
    );
    assert.equal(sourceLine(notChecked[0].source), null);
    assert.deepEqual(sourceLine(notChecked[1].source), {
      source: "Bar Council register",
      answer: "not checked",
    });
  });

  it("marks on `differs` and on nothing else", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      for (const row of allRows(request)) {
        assert.equal(
          row.marks.includes("differs"),
          row.source.status === "differs",
          `${request.applicationNumber} ${row.id}: the Differs mark and the status disagree`,
        );
      }
    }
  });

  it("keeps `changed` orthogonal to the status — one row carries both", () => {
    const edited = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-191");
    assert.ok(edited);
    const [name, , mobile, email] = identityRows(edited);

    // The register holds the name the account was created under; he changed it at first
    // login. Two marks, two lines, one row — the case the overlay has to hold.
    assert.deepEqual(name.marks, ["differs", "changed"]);
    assert.deepEqual(name.previous, { was: "Thomas Kurian" });
    assert.equal(sourceLine(name.source)?.answer, "Thomas Kurian");

    // Changed without a finding, and added rather than altered.
    assert.deepEqual(mobile.marks, ["changed"]);
    assert.deepEqual(mobile.previous, { was: "9847051204" });
    assert.equal(mobile.source.status, "verified");
    assert.deepEqual(email.marks, ["changed"]);
    assert.deepEqual(email.previous, { was: null });
    assert.equal(email.source.status, "none");
  });

  it("puts the newest rejection first, every round in the same row", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(back);
    const rounds = rejectionRows(back);
    assert.deepEqual(
      rounds.map((row) => row.term),
      ["Round 4", "Round 3", "Round 2", "Round 1"],
    );
    for (const round of rounds) {
      // The officer's own words are the value; the date is a slot, not a sentence.
      assert.equal(round.source.status, "none");
      assert.deepEqual(round.marks, []);
      assert.ok(round.note && /^\d+ \w+ \d{4}$/.test(round.note));
    }
    assert.equal(rounds[0].note, "8 July 2026");
    assert.deepEqual(rejectionRows(REGISTER_ADVOCATES_QUEUE[1]), []);
  });

  it("carries the queue cell's own escalation into the overlay's Waiting row", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      const [submitted, waiting, kind] = requestRows(request);
      assert.deepEqual(
        [submitted.term, waiting.term, kind.term],
        ["Submitted", "Waiting", "Request type"],
      );
      assert.equal(waiting.tone, registrationWaitTone(request.daysWaiting));
      assert.equal(waiting.value, formatWaitingDuration(request.daysWaiting));
      // Only the wait speaks in colour; nothing else in the group has a tone.
      assert.equal(submitted.tone, undefined);
      assert.equal(kind.tone, undefined);
    }
  });

  it("never repeats the application number the dialog header already carries", () => {
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      for (const row of allRows(request)) {
        assert.ok(
          !row.value.includes(request.applicationNumber),
          `${request.applicationNumber} is said twice`,
        );
      }
    }
  });

  it("names the register generically only when the register did not name itself", () => {
    assert.equal(registerName("advocate"), "Bar Council register");
    assert.equal(registerName("clerk"), "Clerk register");
    for (const request of REGISTER_ADVOCATES_QUEUE) {
      const line = sourceLine(identityRows(request)[1].source);
      assert.ok(line);
      assert.equal(
        line.source,
        request.lookup.state === "found"
          ? request.lookup.entry.bar
          : registerName(request.registrantKind),
      );
    }
  });

  it("reads every term off the registrant, so a clerk queue needs no new row", () => {
    const request = REGISTER_ADVOCATES_QUEUE[0];
    const clerk: AdvocateRegistration = { ...request, registrantKind: "clerk" };
    assert.equal(identityRows(request)[1].term, "Bar registration ID");
    assert.equal(identityRows(clerk)[1].term, "Clerk registration number");
    // Same rows, same order, same statuses — only the labels move.
    assert.deepEqual(
      identityRows(clerk).map((row) => row.id),
      identityRows(request).map((row) => row.id),
    );
  });
});

describe("the next request after a decision", () => {
  const a = row({ id: "a", daysWaiting: 30, applicationNumber: "KL-ADV-000001-2026" });
  const b = row({ id: "b", daysWaiting: 20, applicationNumber: "KL-ADV-000002-2026" });
  const c = row({ id: "c", daysWaiting: 20, applicationNumber: "KL-ADV-000003-2026" });
  const d = row({ id: "d", daysWaiting: 5, applicationNumber: "KL-ADV-000004-2026" });

  it("offers the row below the one just decided, in queue order", () => {
    assert.equal(nextInQueue([a, c, d], b)?.id, "c");
    assert.equal(nextInQueue([a, b, d], c)?.id, "d");
  });

  it("wraps to the top of what is left when the last row was decided", () => {
    assert.equal(nextInQueue([a, b, c], d)?.id, "a");
  });

  it("offers nothing once the list is empty", () => {
    assert.equal(nextInQueue([], d), null);
  });

  it("reads the list it is given, so a narrowed search offers the next match", () => {
    assert.equal(nextInQueue([d], a)?.id, "d");
  });
});

/** A minimal row, for the sort tests — only the fields those tests read are meaningful. */
function row(
  over: Partial<AdvocateRegistration> & { id: string },
): AdvocateRegistration {
  return {
    applicationNumber: "KL-ADV-000100-2026",
    fullName: "Test Advocate",
    barRegistrationId: "KL/0001/2000",
    mobile: "9000000000",
    photo: { src: "/demo/bar-id-card-specimen.svg", filename: "card.jpg" },
    daysWaiting: 1,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: { state: "not-checked" },
    ...over,
  };
}
