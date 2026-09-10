import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_REGISTER_ADVOCATES_FILTERS,
  REGISTER_ADVOCATES_QUEUE,
  REGISTER_ADVOCATES_QUEUE_COUNT,
  currentRound,
  earlierRejections,
  editFor,
  filterRegistrations,
  formatDaysWaiting,
  formatDaysWaitingSpoken,
  idPhotoLabel,
  latestRejection,
  registrantNoun,
  registrationIdLabel,
  registrationWaitTone,
  rejectionDay,
  requestKindLabel,
  sortByLongestWait,
  submissionDay,
  type AdvocateRegistration,
} from "./register-advocates";

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

  it("carries all four answers the Bar Council lookup can give", () => {
    const states = new Set(REGISTER_ADVOCATES_QUEUE.map((r) => r.lookup.state));
    assert.deepEqual(
      [...states].sort(),
      ["agrees", "disagrees", "not-found", "unavailable"].sort(),
    );
  });

  it("exercises the wait escalation at both thresholds and below them", () => {
    const tones = REGISTER_ADVOCATES_QUEUE.map((r) =>
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
      if (row.lookup.state !== "agrees" && row.lookup.state !== "disagrees") {
        continue;
      }
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

  it("counts a request with one rejection behind it as round 2", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-198");
    assert.ok(back);
    assert.equal(currentRound(back), 2);
    assert.equal(earlierRejections(back).length, 0);
    assert.equal(latestRejection(back)?.round, 1);
  });

  it("shows the last reason in full and collapses only the rounds before it", () => {
    const back = REGISTER_ADVOCATES_QUEUE.find((r) => r.id === "adv-118");
    assert.ok(back);
    assert.equal(latestRejection(back)?.round, 4);
    assert.deepEqual(
      earlierRejections(back).map((r) => r.round),
      [1, 2, 3],
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
    assert.equal(editFor(edited, "fullName"), undefined);
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
    lookup: { state: "unavailable" },
    ...over,
  };
}
