/**
 * The items a day-order can carry, and the words each one opens on.
 *
 * The reference screen calls this region **Order items**: the typist chooses what the
 * court passed today — summons, a warrant, cost — and the order text writes itself. That
 * is the difference between the two seats this area serves. The bench dictates; the
 * typist sets down an order the court has already made, from the court's own standing
 * forms, and then corrects it. A blank editor is the wrong instrument for the second job.
 *
 * **The catalogue is the register's, restated** (`content.ts`, D12): `/employee` does not
 * import `lib/cases/orders`, so the labels here are copied from `ORDER_TYPES` word for
 * word instead. The two halves of the app must not disagree about what a "Miscellaneous
 * process" is. Ids match the register's ids for the same reason — a later slice that does
 * issue an order has one name to map, not two.
 *
 * One label is deliberately not the reference's. The reference lists **Section 202 CrPC**;
 * the register calls the same item **Postponement of issue of process**. The Code of
 * Criminal Procedure was replaced by the BNSS on 1 July 2024
 * (`docs/product/sources.md`), so a control naming a repealed section would be wrong for
 * every case filed since — and the register's name says what the order does without
 * citing anything.
 *
 * **The standing words are this app's, not a court's.** No template library was given to
 * us; these read the way `order-demo.ts` reads and carry the same bargain — they are a
 * starting draft the typist edits, nothing here is issued, and the real forms are a
 * question for product (§12 of the brief). Where an order genuinely needs a figure the
 * court fixes on the day, the sentence carries a blank rather than inventing an amount.
 */

import type { RichTextValue } from "@/components/cases/rich-text-field";

export type OrderItemTypeId =
  | "abate-case"
  | "bail"
  | "cost"
  | "judgement"
  | "order-for-taking-cognizance"
  | "order-to-dismiss-case"
  | "refer-case-to-adr"
  | "attachment"
  | "miscellaneous-process"
  | "notice"
  | "postponement-of-issue-of-process"
  | "proclamation"
  | "summons"
  | "warrant"
  | "witness-batta"
  | "mandatory-submissions-responses"
  | "others";

/** The sides an item's words can name. Structural, so `hearings.ts` is not imported. */
export type OrderItemParties = {
  parties: { complainant: string; accused: string };
};

/**
 * The catalogue, in the register's browsing groups.
 *
 * The reference offers all seventeen as one unsorted list, which is a list you read
 * rather than a list you pick from. Grouping them is the register's own answer
 * (`ORDER_CLASSES`) and it survives the type-ahead: a typist who knows the word types it,
 * and one who does not reads seven judicial orders instead of seventeen of everything.
 * `Others` sits last on its own, because it is the bucket for what the catalogue has no
 * name for and must not appear to belong to a group that describes its contents.
 */
export const ORDER_ITEM_GROUPS: {
  id: string;
  label: string;
  items: { id: OrderItemTypeId; label: string }[];
}[] = [
  {
    id: "judicial",
    label: "Judicial order or judgment",
    items: [
      { id: "abate-case", label: "Abate case" },
      { id: "bail", label: "Bail" },
      { id: "cost", label: "Cost" },
      { id: "judgement", label: "Judgement" },
      {
        id: "order-for-taking-cognizance",
        label: "Order for taking cognizance",
      },
      { id: "order-to-dismiss-case", label: "Order to dismiss case" },
      { id: "refer-case-to-adr", label: "Refer case to ADR" },
    ],
  },
  {
    id: "process",
    label: "Court process",
    items: [
      { id: "attachment", label: "Attachment" },
      { id: "miscellaneous-process", label: "Miscellaneous process" },
      { id: "notice", label: "Notice" },
      {
        id: "postponement-of-issue-of-process",
        label: "Postponement of issue of process",
      },
      { id: "proclamation", label: "Proclamation" },
      { id: "summons", label: "Summons" },
      { id: "warrant", label: "Warrant" },
      { id: "witness-batta", label: "Witness batta" },
    ],
  },
  {
    id: "workflow",
    label: "Workflow decision",
    items: [
      {
        id: "mandatory-submissions-responses",
        label: "Mandatory submissions responses",
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    items: [{ id: "others", label: "Others" }],
  },
];

export const ORDER_ITEM_TYPES: { id: OrderItemTypeId; label: string }[] =
  ORDER_ITEM_GROUPS.flatMap((group) => group.items);

export function orderItemLabel(id: OrderItemTypeId): string {
  return ORDER_ITEM_TYPES.find((item) => item.id === id)?.label ?? id;
}

export function isOrderItemTypeId(value: string): value is OrderItemTypeId {
  return ORDER_ITEM_TYPES.some((item) => item.id === value);
}

/**
 * What each item says before the typist touches it.
 *
 * Named parties, not role words: the order that comes out of this screen says "Issue
 * summons to Anand Traders", because that is what an order says and because the roll two
 * columns away already knows the name. The reference prints the placeholder it never
 * filled in — "Issue summons to Accused Details (Accused)" — which is the tell that its
 * text was never wired to the listing.
 *
 * `others` opens empty on purpose. It is the item the catalogue could not name, so there
 * are no standing words for it and pretending otherwise would put a sentence in an order
 * that nobody chose.
 */
const STANDING_WORDS: Record<
  OrderItemTypeId,
  (parties: { complainant: string; accused: string }) => string
> = {
  "abate-case": ({ accused }) =>
    `The complaint cannot proceed further against ${accused}. The case stands abated and the file is closed.`,
  bail: ({ accused }) =>
    `The application for bail was taken up and both sides were heard. ${accused} is released on bail on executing a bond with one surety to the satisfaction of this court.`,
  cost: () =>
    `The adjournment sought is allowed on terms. Cost of ₹____ is imposed and shall be paid on or before the next posting date.`,
  judgement: () =>
    `Judgement was pronounced in open court and the operative portion was read out. The judgement, signed and dated, is placed on the file.`,
  "order-for-taking-cognizance": ({ complainant }) =>
    `The complaint, the sworn statement of ${complainant} and the documents produced were perused. There is sufficient ground to proceed, and cognizance is taken of the offence under Section 138 of the Negotiable Instruments Act, 1881.`,
  "order-to-dismiss-case": ({ complainant, accused }) =>
    `${complainant} has remained absent and is not represented. The complaint is dismissed for default and ${accused} is discharged.`,
  "refer-case-to-adr": () =>
    `Both sides submit that the matter can be settled. The case is referred for alternative dispute resolution, and the parties shall appear before the centre as directed.`,
  attachment: ({ accused }) =>
    `${accused} has not appeared, and the warrant issued has been returned unexecuted. The property of ${accused} shall be attached, and the office shall place the return before this court.`,
  "miscellaneous-process": () =>
    `Process shall issue as ordered. The office shall draw it up and place the return before this court on the next posting date.`,
  notice: ({ complainant, accused }) =>
    `Notice shall issue to ${accused}. ${complainant} is directed to take steps and to pay the process fee within the time allowed.`,
  "postponement-of-issue-of-process": () =>
    `Before process is issued it is necessary to inquire further into the truth of the complaint. The issue of process is postponed, and the inquiry shall be held on the next posting date.`,
  proclamation: ({ accused }) =>
    `${accused} has absconded and cannot be secured by warrant. A proclamation shall issue requiring ${accused} to appear before this court within thirty days.`,
  summons: ({ complainant, accused }) =>
    `Issue summons to ${accused}, the accused. ${complainant} is directed to make the appropriate payments and to take steps to issue summons.`,
  warrant: ({ accused }) =>
    `${accused} has failed to appear though the summons was served. A warrant shall issue for the arrest of ${accused}, returnable on the next posting date.`,
  "witness-batta": () =>
    `The witness examined today shall be paid batta of ₹____, and the office shall draw up the voucher.`,
  "mandatory-submissions-responses": () =>
    `The submissions called for by this court have been filed and are taken on record. A copy shall be furnished to the other side.`,
  others: () => "",
};

/**
 * The plain sentence as the editor's own markup.
 *
 * The same escape the citizen side makes for the same reason (`lib/cases/
 * application-draft.ts`); the two do not share a function because `/employee` does not
 * import from there (`content.ts`).
 */
export function richTextFromPlain(value: string): RichTextValue {
  if (!value) return { html: "", text: "" };
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return { html: `<p>${escaped}</p>`, text: value };
}

/** One item in the order being composed: what it is, and the words it carries. */
export type OrderItemDraft = {
  id: string;
  type: OrderItemTypeId;
  text: RichTextValue;
};

/*
 * Ids only have to be unique inside one listing's draft, and the drafts die on a reload
 * (`order-drafts.ts`), so a counter is enough and it keeps the module testable — no clock
 * and no randomness in a value the editor is keyed on.
 */
let sequence = 0;

export function nextOrderItemId(): string {
  sequence += 1;
  return `order-item-${sequence}`;
}

/** An item of this type, opened on its standing words with this listing's parties in it. */
export function createOrderItem(
  matter: OrderItemParties,
  type: OrderItemTypeId,
  id: string = nextOrderItemId(),
): OrderItemDraft {
  return {
    id,
    type,
    text: richTextFromPlain(STANDING_WORDS[type](matter.parties)),
  };
}
