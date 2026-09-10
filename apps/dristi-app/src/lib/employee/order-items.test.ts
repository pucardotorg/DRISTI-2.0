import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAUSE_LIST } from "./hearings";
import {
  createOrderItem,
  isOrderItemTypeId,
  nextOrderItemId,
  orderItemLabel,
  ORDER_ITEM_GROUPS,
  ORDER_ITEM_TYPES,
} from "./order-items";

const hearing = CAUSE_LIST[0];

describe("the catalogue", () => {
  it("carries every item the reference screen offers", () => {
    /* The reference's own list, in its own words. "Section 202 CrPC" is the one it names
       differently: the register calls that item Postponement of issue of process, and the
       CrPC was replaced on 1 July 2024 (docs/product/sources.md). */
    const expected = [
      "Abate case",
      "Attachment",
      "Bail",
      "Cost",
      "Judgement",
      "Mandatory submissions responses",
      "Miscellaneous process",
      "Notice",
      "Order for taking cognizance",
      "Order to dismiss case",
      "Others",
      "Postponement of issue of process",
      "Proclamation",
      "Refer case to ADR",
      "Summons",
      "Warrant",
      "Witness batta",
    ];
    assert.deepEqual(ORDER_ITEM_TYPES.map((item) => item.label).sort(), expected);
  });

  it("puts every item in exactly one group, and Others last", () => {
    const grouped = ORDER_ITEM_GROUPS.flatMap((group) => group.items);
    assert.equal(grouped.length, ORDER_ITEM_TYPES.length);
    assert.equal(new Set(grouped.map((item) => item.id)).size, grouped.length);
    assert.deepEqual(ORDER_ITEM_GROUPS.at(-1)?.items.map((item) => item.id), [
      "others",
    ]);
  });

  it("names an unknown id rather than throwing", () => {
    assert.equal(isOrderItemTypeId("summons"), true);
    assert.equal(isOrderItemTypeId("interim-compensation"), false);
    assert.equal(orderItemLabel("witness-batta"), "Witness batta");
  });
});

describe("createOrderItem", () => {
  it("opens the item on words that name this listing's parties", () => {
    const item = createOrderItem(hearing, "summons", "a");
    assert.match(item.text.text, /^Issue summons to /);
    assert.ok(item.text.text.includes(hearing.parties.accused));
    assert.ok(item.text.text.includes(hearing.parties.complainant));
    assert.ok(item.text.html.includes(item.text.text));
  });

  it("gives every item in the catalogue standing words, except the one that has none", () => {
    for (const type of ORDER_ITEM_TYPES) {
      const item = createOrderItem(hearing, type.id, type.id);
      if (type.id === "others") {
        /* The item the catalogue could not name has no standing form, and inventing one
           would put a sentence in an order that nobody chose. */
        assert.equal(item.text.text, "");
        assert.equal(item.text.html, "");
        continue;
      }
      assert.ok(item.text.text.length > 0, `${type.id} opened empty`);
      assert.match(item.text.text, /\.$/, `${type.id} does not end a sentence`);
    }
  });

  it("escapes the party names it writes into the markup", () => {
    const item = createOrderItem(
      { parties: { complainant: "A & B <Traders>", accused: "C & D" } },
      "notice",
      "a",
    );
    assert.ok(item.text.html.includes("&amp;"));
    assert.ok(!item.text.html.includes("<Traders>"));
    assert.ok(item.text.text.includes("A & B <Traders>"));
  });

  it("mints a fresh id for each item, so two of the same type do not collide", () => {
    assert.notEqual(nextOrderItemId(), nextOrderItemId());
    const first = createOrderItem(hearing, "cost");
    const second = createOrderItem(hearing, "cost");
    assert.notEqual(first.id, second.id);
  });
});
