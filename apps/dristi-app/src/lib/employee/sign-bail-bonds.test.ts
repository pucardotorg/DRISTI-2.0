import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPTY_SIGN_BAIL_BOND_FILTERS,
  SIGN_BAIL_BOND_QUEUE,
  SIGN_BAIL_BOND_QUEUE_COUNT,
  buildSignBailBondDocument,
  filterSignBailBonds,
  formatBondAmount,
  rejectBailBond,
  signBailBondDocumentText,
  signSelectedBailBonds,
} from "./sign-bail-bonds";

describe("SIGN_BAIL_BOND_QUEUE", () => {
  it("is long enough to page at 10, 20 and 30", () => {
    assert.ok(
      SIGN_BAIL_BOND_QUEUE.length > 20,
      "the queue has to outrun two page sizes for the pager to be worth testing",
    );
  });

  it("shows the rail the number of bonds actually waiting", () => {
    const pending = SIGN_BAIL_BOND_QUEUE.filter(
      (bond) => bond.status === "pending-signature",
    );
    assert.equal(SIGN_BAIL_BOND_QUEUE_COUNT, pending.length);
  });

  it("carries a case with two bonds under different litigants", () => {
    const byCase = new Map<string, string[]>();
    for (const bond of SIGN_BAIL_BOND_QUEUE) {
      byCase.set(bond.caseNumber, [
        ...(byCase.get(bond.caseNumber) ?? []),
        bond.litigant,
      ]);
    }
    const shared = [...byCase.values()].find((litigants) => litigants.length > 1);
    assert.ok(shared, "no case carries more than one bond");
    assert.equal(
      new Set(shared).size,
      shared.length,
      "two bonds on one case must name different litigants",
    );
  });

  it("gives every bond an id of its own", () => {
    const ids = new Set(SIGN_BAIL_BOND_QUEUE.map((bond) => bond.id));
    assert.equal(ids.size, SIGN_BAIL_BOND_QUEUE.length);
  });

  it("binds every litigant to a hearing after the bond was drawn up", () => {
    for (const bond of SIGN_BAIL_BOND_QUEUE) {
      assert.ok(
        bond.appearsOn > bond.addedOn,
        `${bond.id} appears on ${bond.appearsOn}, before it was added on ${bond.addedOn}`,
      );
    }
  });
});

describe("filterSignBailBonds", () => {
  it("lists the pending queue when nothing is searched for", () => {
    assert.equal(
      filterSignBailBonds(SIGN_BAIL_BOND_QUEUE, EMPTY_SIGN_BAIL_BOND_FILTERS)
        .length,
      SIGN_BAIL_BOND_QUEUE_COUNT,
    );
  });

  it("finds a bond by case number, case name and litigant alike", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    for (const query of [
      bond.caseNumber,
      bond.parties.complainant,
      bond.litigant,
    ]) {
      const found = filterSignBailBonds(SIGN_BAIL_BOND_QUEUE, { query });
      assert.ok(
        found.some((row) => row.id === bond.id),
        `searching "${query}" did not find ${bond.id}`,
      );
    }
  });

  it("ignores case and surrounding space", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const found = filterSignBailBonds(SIGN_BAIL_BOND_QUEUE, {
      query: `  ${bond.litigant.toUpperCase()}  `,
    });
    assert.ok(found.some((row) => row.id === bond.id));
  });

  it("returns nothing for a query no bond matches", () => {
    assert.deepEqual(
      filterSignBailBonds(SIGN_BAIL_BOND_QUEUE, { query: "zzzz no such case" }),
      [],
    );
  });

  it("drops a bond once it is signed or rejected", () => {
    const [first, second] = SIGN_BAIL_BOND_QUEUE;
    const signed = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([first.id]),
      "2026-09-03",
    );
    const then = rejectBailBond(signed, second.id);
    const listed = filterSignBailBonds(then, EMPTY_SIGN_BAIL_BOND_FILTERS);
    assert.ok(!listed.some((bond) => bond.id === first.id));
    assert.ok(!listed.some((bond) => bond.id === second.id));
    assert.equal(listed.length, SIGN_BAIL_BOND_QUEUE_COUNT - 2);
  });
});

describe("signSelectedBailBonds", () => {
  it("signs the chosen bonds and stamps the day", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const next = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([bond.id]),
      "2026-09-03",
    );
    const signed = next.find((row) => row.id === bond.id);
    assert.equal(signed?.status, "signed");
    assert.equal(signed?.signedOn, "2026-09-03");
  });

  it("leaves every other bond alone", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const next = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([bond.id]),
      "2026-09-03",
    );
    for (const row of next) {
      if (row.id === bond.id) continue;
      assert.equal(row.status, "pending-signature");
      assert.equal(row.signedOn, undefined);
    }
  });

  it("signs one of a case's two bonds without touching the other", () => {
    const pairs = SIGN_BAIL_BOND_QUEUE.filter(
      (bond) =>
        SIGN_BAIL_BOND_QUEUE.filter((row) => row.caseNumber === bond.caseNumber)
          .length > 1,
    );
    const [one, other] = pairs;
    const next = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([one.id]),
      "2026-09-03",
    );
    assert.equal(next.find((row) => row.id === one.id)?.status, "signed");
    assert.equal(
      next.find((row) => row.id === other.id)?.status,
      "pending-signature",
    );
  });

  it("ignores an id the queue has moved on from", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const once = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([bond.id]),
      "2026-09-03",
    );
    const twice = signSelectedBailBonds(
      once,
      new Set([bond.id, "no-such-bond"]),
      "2026-09-10",
    );
    assert.equal(twice.find((row) => row.id === bond.id)?.signedOn, "2026-09-03");
  });
});

describe("rejectBailBond", () => {
  it("refuses one bond and nothing else", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const next = rejectBailBond(SIGN_BAIL_BOND_QUEUE, bond.id);
    assert.equal(next.find((row) => row.id === bond.id)?.status, "rejected");
    assert.equal(
      next.filter((row) => row.status === "rejected").length,
      1,
    );
  });

  it("cannot refuse a bond that is already signed", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const signed = signSelectedBailBonds(
      SIGN_BAIL_BOND_QUEUE,
      new Set([bond.id]),
      "2026-09-03",
    );
    const next = rejectBailBond(signed, bond.id);
    assert.equal(next.find((row) => row.id === bond.id)?.status, "signed");
  });
});

describe("buildSignBailBondDocument", () => {
  it("recites this bond's own particulars, not a shared blob", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const text = signBailBondDocumentText(buildSignBailBondDocument(bond));
    for (const fact of [
      bond.caseNumber,
      bond.litigant,
      bond.surety.name,
      bond.parties.complainant,
      formatBondAmount(bond.bondAmount),
    ]) {
      assert.ok(text.includes(fact), `the bond does not recite ${fact}`);
    }
  });

  it("tells two bonds on one case apart", () => {
    const [one, other] = SIGN_BAIL_BOND_QUEUE.filter(
      (bond) =>
        SIGN_BAIL_BOND_QUEUE.filter((row) => row.caseNumber === bond.caseNumber)
          .length > 1,
    );
    assert.notEqual(
      signBailBondDocumentText(buildSignBailBondDocument(one)),
      signBailBondDocumentText(buildSignBailBondDocument(other)),
    );
  });

  it("says the signature is pending rather than showing an empty rule", () => {
    const document = buildSignBailBondDocument(SIGN_BAIL_BOND_QUEUE[0]);
    assert.match(document.signature, /pending/i);
  });

  it("names the signing magistrate once the bond is signed", () => {
    const bond = SIGN_BAIL_BOND_QUEUE[0];
    const [signed] = signSelectedBailBonds(
      [bond],
      new Set([bond.id]),
      "2026-09-03",
    );
    const document = buildSignBailBondDocument(signed);
    assert.match(document.signature, /magistrate/i);
    assert.match(document.signature, /3 September 2026/);
  });

  it("has a surety clause, an appearance clause and a default clause", () => {
    const document = buildSignBailBondDocument(SIGN_BAIL_BOND_QUEUE[0]);
    assert.ok(document.undertakings.length >= 4);
    assert.ok(
      document.undertakings.some((clause) => /surety/i.test(clause)),
      "no surety clause",
    );
    assert.ok(
      document.undertakings.some((clause) => /attend/i.test(clause)),
      "no appearance clause",
    );
    assert.ok(
      document.undertakings.some((clause) => /default/i.test(clause)),
      "no consequence-of-default clause",
    );
  });

  it("cites no statute, section or form number", () => {
    for (const bond of SIGN_BAIL_BOND_QUEUE) {
      const text = signBailBondDocumentText(buildSignBailBondDocument(bond));
      assert.doesNotMatch(
        text,
        /section \d|§|form no|act, \d{4}/i,
        `${bond.id} recites a citation the product docs do not define`,
      );
    }
  });
});
