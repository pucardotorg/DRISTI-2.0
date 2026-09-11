import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CASE_CHECK_COUNT,
  CASE_HEADER_TERMS,
  FACT_TERMS,
  FILING_WINDOW_DAYS,
  NOTICE_WINDOW_DAYS,
  PRESENTATION_WINDOW_DAYS,
  advocateOnRecordCheck,
  caseChecksFor,
  caseFileHref,
  caseGroupAnchor,
  caseReviewFor,
  caseSlotFor,
  filingWindowCheck,
  noticeWindowCheck,
  partPaymentCheck,
  prematureFilingCheck,
  presentationWindowCheck,
  requiredDocumentsCheck,
  type CaseCheck,
  type CaseCheckId,
  type CaseGroupId,
} from "./case-review";
import { REGISTER_QUEUE } from "./register-cases";

/* The same fixed day the file's own tests use, for the same reason. */
const TODAY = "2026-09-09";

function checks(id: string): CaseCheck[] {
  const found = caseChecksFor(id, TODAY);
  assert.ok(found, `no checks for ${id}`);
  return found;
}

function firedIds(id: string): CaseCheckId[] {
  return checks(id).map((check) => check.id);
}

/** Every group on a complaint's file, by id — what a deep link has to resolve against. */
function groupIds(id: string): Set<string> {
  const file = caseReviewFor(id, TODAY);
  assert.ok(file);
  return new Set(
    file.sections.flatMap((section) => section.groups.map((group) => group.id)),
  );
}

/**
 * Which complaints each check fires on, **measured against the demo data on
 * 2026-09-11** rather than taken from the brief.
 *
 * The brief's D15 table names `r-1490` for check 6. The queue holds five complaints with
 * no vakalat on the complainant's side, not one, so the check fires five times — the
 * brief undercounted its own fixture and this table is the correction. It is written out
 * per check rather than derived, because "fires on the complaint that should trigger it
 * **and on no other**" is a claim about a set and a derived expectation would assert
 * nothing.
 *
 * Checks 2 and 3 fire on nothing, and that is deliberate: `chainFor` builds every
 * complaint inside §138(b)'s thirty days and after §138(c)'s fifteen. **Do not bend a
 * fixture to populate these** (brief D15) — the chain's integrity is what makes all
 * thirty-five files legally coherent, and the boundary tests below prove the two checks
 * work without it.
 */
const FIRES_ON: Record<CaseCheckId, string[]> = {
  "presentation-window": ["r-1333"],
  "notice-window": [],
  "premature-filing": [],
  "filing-window": ["r-1588"],
  "required-documents": ["r-1490"],
  "advocate-on-record": ["r-1490", "r-165", "r-341", "r-441", "r-648"],
  "part-payment": ["r-330", "r-1654"],
};

/** The order the ledger prints them: flags in statutory order, then notes. */
const LEDGER_ORDER: CaseCheckId[] = [
  "presentation-window",
  "notice-window",
  "premature-filing",
  "filing-window",
  "required-documents",
  "advocate-on-record",
  "part-payment",
];

describe("the seven checks", () => {
  it("is seven, and the count the ledger states is that many", () => {
    assert.equal(LEDGER_ORDER.length, CASE_CHECK_COUNT);
    assert.equal(new Set(LEDGER_ORDER).size, CASE_CHECK_COUNT);
  });

  it("fires each check on the complaints it should, and on no other", () => {
    for (const [id, expected] of Object.entries(FIRES_ON)) {
      const actual = REGISTER_QUEUE.filter((complaint) =>
        firedIds(complaint.id).includes(id as CaseCheckId),
      ).map((complaint) => complaint.id);
      assert.deepEqual(
        [...actual].sort(),
        [...expected].sort(),
        `${id} fires on the wrong complaints`,
      );
    }
  });

  it("leaves twenty-six of the thirty-five complaints with nothing to show", () => {
    /* The number the design turns on, and **not** the 32 the brief claims — measured.
       Check 6 accounts for the difference: five complaints in this queue are conducted
       in person, and each takes a plain-ink note row. If a fixture changes, change this
       number and say so; do not delete the assertion. */
    const clean = REGISTER_QUEUE.filter(
      (complaint) => checks(complaint.id).length === 0,
    );
    assert.equal(clean.length, 26, "clean complaints");
    assert.equal(REGISTER_QUEUE.length, 35);
  });

  it("has no id and no severity outside the two closed enums", () => {
    const ids = new Set<string>(LEDGER_ORDER);
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        assert.ok(ids.has(check.id), `${check.id} is not one of the seven`);
        assert.ok(
          check.class === "flag" || check.class === "note",
          `${check.id} carries the severity "${check.class}"`,
        );
      }
    }
  });

  it("prints flags in statutory order, then notes", () => {
    for (const complaint of REGISTER_QUEUE) {
      const fired = firedIds(complaint.id);
      const ranks = fired.map((id) => LEDGER_ORDER.indexOf(id));
      assert.deepEqual(
        ranks,
        [...ranks].sort((a, b) => a - b),
        `${complaint.id} prints its findings out of order`,
      );
      /* And the notes are last, whatever their statutory position. */
      const classes = checks(complaint.id).map((check) => check.class);
      assert.ok(
        !classes.slice(classes.indexOf("note") + 1).includes("flag") ||
          !classes.includes("note"),
        `${complaint.id} puts a flag after a note`,
      );
    }
  });

  it("never inks a lawful condition as a defect", () => {
    /* Appearing in person is lawful and a part payment is lawful. Both have a
       consequence the magistrate needs, and neither is a defect — brief D15. */
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        if (check.id === "advocate-on-record" || check.id === "part-payment") {
          assert.equal(check.class, "note", `${complaint.id}: ${check.id}`);
        } else {
          assert.equal(check.class, "flag", `${complaint.id}: ${check.id}`);
        }
      }
    }
  });

  it("says what it found in words, always", () => {
    /* Never colour alone (`ACCESSIBILITY.md` §3), and never a bare count. */
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        assert.ok(check.finding.length > 20, `${check.id}: "${check.finding}"`);
        assert.match(check.finding, /\.$/);
      }
    }
  });

  it("names only terms one of the two vocabularies declares", () => {
    /* The same rule the fact rows live under: a finding that named a field the file does
       not hold would be the machine inventing an attribute at the exact moment a reader
       is deciding whether to trust it. */
    const named = new Set<string>([
      ...Object.values(FACT_TERMS),
      ...Object.values(CASE_HEADER_TERMS),
    ]);
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        for (const value of check.values) {
          assert.ok(
            named.has(value.term),
            `${check.id} reads "${value.term}", which neither vocabulary names`,
          );
          assert.ok(value.value.length > 0, `${check.id}: ${value.term} is blank`);
        }
      }
    }
  });

  it("counts one absence once, however many checks could name it", () => {
    /* `r-1588` is late with the delay-condonation application missing. Check 4 names the
       application; check 5 must not count the same empty slot again (brief D15). */
    const fired = checks("r-1588");
    assert.deepEqual(
      fired.map((check) => check.id),
      ["filing-window"],
    );
    const keys = fired.flatMap((check) =>
      check.documents.map((document) => document.key),
    );
    assert.deepEqual(keys, ["delay-application"]);
  });

  it("names the absent slot check 5 found, with the head it sits under", () => {
    const required = checks("r-1490").find(
      (check) => check.id === "required-documents",
    );
    assert.ok(required);
    assert.deepEqual(required.documents, [
      {
        key: "accused-id-proof",
        label: "ID proof",
        kind: "id",
        state: "absent",
        group: "accused",
        head: "Accused details",
      },
    ]);
    /* *The accused's* ID proof, not the complainant's — the correction the brief's own
       decision log records against `CASE_FILE_MARKS`. */
    assert.equal(required.link.group, "accused");
  });
});

describe("a finding's deep link", () => {
  it("lands on a head the complaint's own file has", () => {
    for (const complaint of REGISTER_QUEUE) {
      const heads = groupIds(complaint.id);
      for (const check of checks(complaint.id)) {
        assert.ok(
          heads.has(check.link.group),
          `${complaint.id}: ${check.id} links to "${check.link.group}", which is not a head on that file`,
        );
        for (const document of check.documents) {
          assert.ok(
            heads.has(document.group),
            `${complaint.id}: ${check.id} names a document under "${document.group}", which is not a head on that file`,
          );
        }
      }
    }
  });

  it("carries a slot the file resolves, when it names one", () => {
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        if (!check.link.doc) continue;
        const spec = caseSlotFor(check.link.doc);
        assert.ok(spec, `${check.id} opens "${check.link.doc}", which is not a slot`);
        assert.equal(spec.group, check.link.group);
      }
    }
  });

  it("names a document the group has a tab for, so the pane can open it", () => {
    /* The link's `doc` is what the pane selects on arrival (brief D25, D26), and the
       pane's tab set is the *group's own filed documents*. A slot that resolves but that
       the group never lists — or that nobody filled — would put the reader on a tab that
       is not there, which is the same dead control the absent-slot rule already rules
       out one level up. */
    for (const complaint of REGISTER_QUEUE) {
      const file = caseReviewFor(complaint.id, TODAY);
      assert.ok(file);
      const byGroup = new Map(
        file.sections
          .flatMap((section) => section.groups)
          .map((group) => [
            group.id,
            [
              ...(group.documents ?? []),
              ...(group.records ?? []).flatMap((record) => record.documents ?? []),
            ],
          ]),
      );
      for (const check of checks(complaint.id)) {
        if (!check.link.doc) continue;
        const filed = (byGroup.get(check.link.group) ?? []).some(
          (document) =>
            document.key === check.link.doc && document.state === "filed",
        );
        assert.ok(
          filed,
          `${complaint.id}: ${check.id} opens "${check.link.doc}", which ${check.link.group} does not have filed`,
        );
      }
    }
  });

  it("spells the head's anchor the same way the file's panel does", () => {
    /* The hash half of the link. It used to be resolved by loading a second page; under
       D25 it has to find an element that was disclosed a frame ago on this one, so a
       mismatch between the two spellings is now a scroll that silently does nothing
       rather than a 404 somebody notices. */
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        const href = caseFileHref(complaint.id, check.link);
        assert.ok(
          href.endsWith(`#${caseGroupAnchor(check.link.group)}`),
          `${complaint.id}: ${check.id} links to ${href}`,
        );
        assert.ok(href.includes("?file=1"), href);
      }
    }
  });

  it("opens the file on the complaint's own route, at the slot and the head's anchor", () => {
    /* **One route, and the file is a query on it** (brief D25). It used to be a second
       page at `/<id>/file`; the disclosure kept every part of the link's meaning and
       moved it into the query, so Back closes the file and the deep link still lands. */
    const deposit = checks("r-1333")[0];
    assert.equal(
      caseFileHref("r-1333", deposit.link),
      `/employee/register-cases/r-1333?file=1&doc=dishonoured-cheque#${caseGroupAnchor("cheque")}`,
    );
    assert.equal(
      caseFileHref("r-1840"),
      "/employee/register-cases/r-1840?file=1",
    );
    /* The file is never opened by a path segment any more — a link that still spelled
       one would be a second way in that nothing maintains. */
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        assert.ok(
          !caseFileHref(complaint.id, check.link).includes("/file"),
          `${complaint.id} still links to a file route`,
        );
      }
    }
  });

  it("calls a head what the file calls it", () => {
    /* `CASE_SLOTS` names the head each slot sits under so a finding can say where to
       look; the section builders name the same head in their own `title`. Two places
       holding one string is a drift risk, so it is a checked fact rather than a
       convention — a group renamed without its slots is caught here. */
    for (const complaint of REGISTER_QUEUE) {
      const file = caseReviewFor(complaint.id, TODAY);
      assert.ok(file);
      const titles = new Map(
        file.sections.flatMap((section) =>
          section.groups.map((group) => [group.id, group.title] as const),
        ),
      );
      for (const check of checks(complaint.id)) {
        for (const document of check.documents) {
          assert.equal(
            document.head,
            titles.get(document.group),
            `${complaint.id}: ${document.key} says it sits under "${document.head}"`,
          );
        }
      }
    }
  });

  it("anchors every head the file can hold", () => {
    /* Every group id on every complaint, so a head added without an anchor is caught
       here rather than as a dead link on the render. */
    for (const complaint of REGISTER_QUEUE) {
      for (const group of groupIds(complaint.id)) {
        assert.equal(
          caseGroupAnchor(group as CaseGroupId),
          `case-group-${group}`,
        );
      }
    }
  });
});

describe("each check on its own, at the boundary", () => {
  /* The two checks the demo data cannot exercise are proved here instead, and every
     other one gets its window edge tested — a check that fires one day early is a check
     that tells a magistrate a lawful complaint is defective. */

  it("passes a deposit on the last day of the three months, fails the next", () => {
    const chequeOn = "2026-01-01";
    const inside = {
      chequeOn,
      depositedOn: dayAfter(chequeOn, PRESENTATION_WINDOW_DAYS),
    };
    assert.equal(presentationWindowCheck(inside, []), undefined);
    const outside = {
      chequeOn,
      depositedOn: dayAfter(chequeOn, PRESENTATION_WINDOW_DAYS + 1),
    };
    const fired = presentationWindowCheck(outside, []);
    assert.ok(fired);
    assert.equal(fired.class, "flag");
    assert.match(fired.finding, /91 days/);
    assert.match(fired.finding, /§138\(a\)/);
  });

  it("passes a notice on the thirtieth day after the return, fails the next", () => {
    const returnedOn = "2026-02-01";
    assert.equal(
      noticeWindowCheck(
        { returnedOn, noticeSentOn: dayAfter(returnedOn, NOTICE_WINDOW_DAYS) },
        [],
      ),
      undefined,
    );
    const fired = noticeWindowCheck(
      { returnedOn, noticeSentOn: dayAfter(returnedOn, NOTICE_WINDOW_DAYS + 1) },
      [],
    );
    assert.ok(fired);
    assert.equal(fired.class, "flag");
    assert.match(fired.finding, /31 days/);
    assert.match(fired.finding, /§138\(b\)/);
  });

  it("fails a complaint filed on the day the notice period ended, passes the next", () => {
    const accruedOn = "2026-03-01";
    const chain = { noticeServedOn: "2026-02-14", accruedOn };
    assert.ok(prematureFilingCheck({ ...chain, submittedOn: accruedOn }, []));
    assert.ok(
      prematureFilingCheck(
        { ...chain, submittedOn: dayAfter(accruedOn, -1) },
        [],
      ),
    );
    assert.equal(
      prematureFilingCheck(
        { ...chain, submittedOn: dayAfter(accruedOn, 1) },
        [],
      ),
      undefined,
    );
  });

  it("passes a filing on the last day of the month, and passes a late one that carries the application", () => {
    const chain = { accruedOn: "2026-04-01", submittedOn: "2026-05-01" };
    assert.equal(
      filingWindowCheck(
        { ...chain, sinceAccrual: FILING_WINDOW_DAYS },
        false,
        [],
      ),
      undefined,
    );
    assert.equal(
      filingWindowCheck(
        { ...chain, sinceAccrual: FILING_WINDOW_DAYS + 40 },
        true,
        [],
      ),
      undefined,
      "a late filing with an application to condone is not a finding",
    );
    const fired = filingWindowCheck(
      { ...chain, sinceAccrual: FILING_WINDOW_DAYS + 40 },
      false,
      ["delay-application"],
    );
    assert.ok(fired);
    assert.match(fired.finding, /40 days beyond the month/);
    assert.equal(fired.documents[0].state, "absent");
  });

  it("counts absent documents, and says nothing when none are", () => {
    assert.equal(requiredDocumentsCheck([]), undefined);
    const one = requiredDocumentsCheck([
      {
        key: "deposit-proof",
        label: "Proof of deposit",
        kind: "memo",
        state: "absent",
        group: "cheque",
        head: "Cheque details",
      },
    ]);
    assert.ok(one);
    assert.equal(one.finding, "1 document the form required is not on file.");
    const two = requiredDocumentsCheck([
      {
        key: "deposit-proof",
        label: "Proof of deposit",
        kind: "memo",
        state: "absent",
        group: "cheque",
        head: "Cheque details",
      },
      {
        key: "return-memo",
        label: "Cheque return memo",
        kind: "memo",
        state: "absent",
        group: "cheque",
        head: "Cheque details",
      },
    ]);
    assert.ok(two);
    assert.equal(two.finding, "2 documents the form required are not on file.");
  });

  it("speaks only when nobody is on record", () => {
    assert.equal(advocateOnRecordCheck(1), undefined);
    assert.equal(advocateOnRecordCheck(3), undefined);
    const fired = advocateOnRecordCheck(0);
    assert.ok(fired);
    assert.equal(fired.class, "note");
    assert.equal(fired.documents.length, 0, "an absence is not a document to open");
  });

  it("states the part payment and what is left of the cheque", () => {
    assert.equal(partPaymentCheck(false, 100000, 0), undefined);
    const fired = partPaymentCheck(true, 100000, 35000);
    assert.ok(fired);
    assert.equal(fired.class, "note");
    assert.match(fired.finding, /₹35,000/);
    assert.match(fired.finding, /₹65,000 remains/);
  });
});

describe("the limit the screen promises", () => {
  it("says in the module that no check reads a document", () => {
    /* The glance carries a caption — "Checks compare entered values with each other. No
       document was read." — and that caption is the only thing that makes an absence of
       flags honest. A check that opened a page would make the caption a lie in a place
       no gate looks, so the promise is written where the checks are and asserted here. */
    const source = readFileSync(new URL("./case-review.ts", import.meta.url), "utf8");
    assert.match(source, /NO CHECK READS A DOCUMENT, AND NONE EVER MAY/);
  });

  it("reads a document's state, never its contents", () => {
    /* What a check may know about a document is whether anything is in the slot. Every
       one it names carries a label, a kind and that state — never a page, a text, or a
       value read off one. */
    for (const complaint of REGISTER_QUEUE) {
      for (const check of checks(complaint.id)) {
        for (const document of check.documents) {
          assert.deepEqual(
            Object.keys(document).sort(),
            ["group", "head", "key", "kind", "label", "state"],
            `${check.id} carries a document field no store holds`,
          );
        }
      }
    }
  });
});

/**
 * `YYYY-MM-DD` moved by whole days — the tests' own arithmetic, not the module's.
 *
 * UTC throughout. Parsing the day as local and printing it with `toISOString` reads the
 * date back through the runner's own offset, so east of Greenwich every day came out one
 * short and every boundary test passed for the wrong reason.
 */
function dayAfter(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
