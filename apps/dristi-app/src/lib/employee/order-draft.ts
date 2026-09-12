/**
 * The order of one listing — what the cause-list icon opens, as data.
 *
 * Employee stays self-contained (`content.ts`): nothing here reaches into the
 * advocate-side register. What the bench fills in is the reference's own four regions —
 * the applications standing in the matter, who is present and who is absent, the item
 * itself, and where the case is posted to next.
 *
 * **Nothing here is issued.** Assembling the text is a screen derivation. Saving a
 * draft and previewing it do not file, notify, or sign — the same honesty bargain
 * Start / End hearing and bulk reschedule already make.
 */

import type { RichTextValue } from "@/components/cases/rich-text-field";

import { CURRENT_STAFF } from "./content";
import {
  applicationsForListing,
  listingApplicationSentence,
  type ListingApplication,
  type ListingApplicationDecision,
} from "./listing-applications";
import { orderItemLabel, type OrderItemDraft } from "./order-items";
import {
  CAUSE_LIST,
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  formatCourtDay,
  withHearingSession,
  type CourtHearing,
  type CourtHearingPurposeId,
} from "./hearings";

export type AttendanceMark = "present" | "absent";

/** One person who can be marked present or absent on this listing. */
export type Appearance = {
  id: string;
  name: string;
  role: string;
};

/**
 * Who appears, in the order a day-order names them: complainant, then counsel for
 * that side, then the accused, then counsel for that side. A side with no vakalat
 * has no advocate row — the 1.0 screen still offered a checkbox for one.
 */
export function appearancesFor(hearing: CourtHearing): Appearance[] {
  const rows: Appearance[] = [
    {
      id: "complainant",
      name: hearing.parties.complainant,
      role: "Complainant",
    },
  ];
  counselFor(hearing, "complainant").forEach((counsel, index) => {
    rows.push({
      id: `complainant-counsel-${index}`,
      name: counsel.name,
      role: "Advocate for the complainant",
    });
  });
  rows.push({
    id: "accused",
    name: hearing.parties.accused,
    role: "Accused",
  });
  counselFor(hearing, "accused").forEach((counsel, index) => {
    rows.push({
      id: `accused-counsel-${index}`,
      name: counsel.name,
      role: "Advocate for the accused",
    });
  });
  return rows;
}

/**
 * The body of one item, as it is written.
 *
 * Both shapes, the convention `rich-text-field.tsx` sets and the applications draft
 * already follows: `html` is what the order renders, `text` is what decides whether the
 * item has been written at all. Imported as a type only — this module is read by a node
 * test, and a value import would drag a client component into it.
 */
export type ItemText = RichTextValue;

export type NextListingChoice = "list" | "none";

export type OrderDraft = {
  marks: Readonly<Record<string, AttendanceMark | undefined>>;
  /**
   * How the bench answered each application pending on this listing, keyed by
   * application id. Absent means it has not been answered yet — which is a real state
   * and not a default, so the order says so rather than passing over it in silence.
   */
  applications: Readonly<Record<string, ListingApplicationDecision | undefined>>;
  next: NextListingChoice;
  nextPurpose: CourtHearingPurposeId | "";
  nextDate: string | null;
  /**
   * What the court passed today, in the order it is written.
   *
   * A list, because an order routinely carries more than one — cognizance and the
   * summons that follows it, an adjournment and the cost imposed for it — and the
   * reference's own "Add item" says so. Position is the paragraph number: item two is
   * paragraph two of the order, which is how the signing queue already prints one
   * (`sign-order-dialog.tsx`).
   */
  items: readonly OrderItemDraft[];
};

export const EMPTY_ORDER_DRAFT: OrderDraft = {
  marks: {},
  applications: {},
  next: "list",
  nextPurpose: "",
  nextDate: null,
  items: [],
};

/** One named block in the assembled order. `pending` when the matching control is empty. */
export type OrderBlock = {
  id: string;
  heading: string;
  /** The plain sentence — what a reader hears, and what "written" is measured on. */
  body: string;
  /** The item body only: the same words with the composer's formatting kept. */
  html?: string;
  pending: boolean;
  /**
   * Attendance only. When present, the document renders a roll of names rather
   * than the joined `body` paragraph — same words, one appearance per line.
   */
  appearances?: AttendanceEntry[];
  /**
   * Applications only. One disposal per line, for the same reason the roll is a list:
   * two applications answered differently are two findings, and a reader should not
   * have to unpick them out of one paragraph. The last line may be the pending note.
   */
  sentences?: { text: string; pending: boolean }[];
  /**
   * Items only. The order's numbered paragraphs, so the document and the paper can
   * print an `<ol>` rather than a run-on block of everything the court passed.
   */
  items?: OrderItemEntry[];
};

/** One item as the order carries it — its number, its name, and its words. */
export type OrderItemEntry = {
  id: string;
  /** The paragraph number, from position. Item three is paragraph three. */
  number: number;
  /** The catalogue's name for it — "Summons" — as the composer heads the well. */
  heading: string;
  /** The plain words, and what "written" is measured on. */
  body: string;
  html: string;
  /** Chosen, but nothing written in it yet. */
  pending: boolean;
};

export type AttendanceEntry = {
  id: string;
  name: string;
  /** "the complainant" / "advocate for the accused" — the office in the sentence. */
  office: string;
  mark: AttendanceMark;
};

export type AssembledOrder = {
  cause: string;
  caseNumber: string;
  item: number;
  purpose: string;
  blocks: OrderBlock[];
};

function attendanceOffice(appearance: Appearance): string {
  if (appearance.id === "complainant" || appearance.id === "accused") {
    return `the ${appearance.role.toLowerCase()}`;
  }
  return appearance.role.toLowerCase();
}

function attendanceSentence(entry: AttendanceEntry): string {
  const verb = entry.mark === "present" ? "is present" : "is absent";
  return `${entry.name}, ${entry.office}, ${verb}.`;
}

export function assembleAttendance(
  appearances: Appearance[],
  marks: OrderDraft["marks"],
): OrderBlock {
  const marked: AttendanceEntry[] = appearances.flatMap((appearance) => {
    const mark = marks[appearance.id];
    if (mark !== "present" && mark !== "absent") return [];
    return [
      {
        id: appearance.id,
        name: appearance.name,
        office: attendanceOffice(appearance),
        mark,
      },
    ];
  });
  if (marked.length === 0) {
    return {
      id: "attendance",
      heading: "Attendance",
      body: "Attendance has not been marked.",
      pending: true,
    };
  }
  return {
    id: "attendance",
    heading: "Attendance",
    body: marked.map(attendanceSentence).join(" "),
    pending: false,
    appearances: marked,
  };
}

/**
 * The applications answered in this item — the block that only exists when something
 * was pending.
 *
 * A listing with no application returns nothing at all rather than an empty section:
 * most matters on a board have none, and an order that recites "no application was
 * pending" on twenty-one of twenty-three items is noise the bench has to read past.
 *
 * What has *not* been answered is stated, in the document's own pending voice. An
 * application is on the file whether or not the bench got to it, and an order that
 * silently omitted one would be the screen deciding to hide work rather than report it.
 */
export function assembleApplications(
  hearing: CourtHearing,
  applications: ListingApplication[],
  decisions: OrderDraft["applications"],
): OrderBlock | undefined {
  if (applications.length === 0) return undefined;

  const sentences: { text: string; pending: boolean }[] = applications.flatMap(
    (application) => {
      const decision = decisions[application.id];
      if (decision !== "allowed" && decision !== "dismissed") return [];
      return [
        {
          text: listingApplicationSentence(hearing, application, decision),
          pending: false,
        },
      ];
    },
  );

  const unanswered = applications.length - sentences.length;
  if (unanswered > 0) {
    sentences.push({
      text:
        unanswered === 1
          ? "One application pending on this matter has not been answered."
          : `${unanswered} applications pending on this matter have not been answered.`,
      pending: true,
    });
  }

  return {
    id: "applications",
    heading: "Applications",
    body: sentences.map((sentence) => sentence.text).join(" "),
    pending: unanswered > 0,
    sentences,
  };
}

export function assembleNextListing(
  draft: Pick<OrderDraft, "next" | "nextPurpose" | "nextDate">,
): OrderBlock {
  if (draft.next === "none") {
    return {
      id: "next",
      heading: "Next listing",
      body: "No next date is listed.",
      pending: false,
    };
  }
  if (!draft.nextDate) {
    return {
      id: "next",
      heading: "Next listing",
      body: "Next date has not been set.",
      pending: true,
    };
  }
  const day = formatCourtDay(draft.nextDate);
  if (!draft.nextPurpose) {
    return {
      id: "next",
      heading: "Next listing",
      body: `Posted to ${day}.`,
      pending: true,
    };
  }
  return {
    id: "next",
    heading: "Next listing",
    body: `Posted to ${day} for ${courtHearingPurposeLabel(draft.nextPurpose).toLowerCase()}.`,
    pending: false,
  };
}

/**
 * The items as the order carries them.
 *
 * On the text, not the markup: an empty editor still holds a `<br>`, and an item whose
 * standing words were deleted and never replaced is an item nobody wrote.
 *
 * An item that has been chosen but not written is *pending, not absent*. The court
 * passed it — the typist said so by adding it — and an order that quietly dropped the
 * paragraph would be the screen deciding which of the day's items were worth printing.
 */
export function assembleItems(items: readonly OrderItemDraft[]): OrderBlock {
  if (items.length === 0) {
    return {
      id: "item",
      heading: "Item text",
      body: "No item has been added.",
      pending: true,
    };
  }

  const entries: OrderItemEntry[] = items.map((item, index) => {
    const body = item.text.text.trim();
    return {
      id: item.id,
      number: index + 1,
      heading: orderItemLabel(item.type),
      body: body || `${orderItemLabel(item.type)} — nothing has been written.`,
      html: body ? item.text.html : "",
      pending: !body,
    };
  });

  return {
    id: "item",
    heading: "Item text",
    body: entries.map((entry) => entry.body).join(" "),
    pending: entries.some((entry) => entry.pending),
    items: entries,
  };
}

/** A block that may not exist, as the zero-or-one blocks the order actually holds. */
function toBlocks(block: OrderBlock | undefined): OrderBlock[] {
  return block ? [block] : [];
}

export function assembleOrder(
  hearing: CourtHearing,
  draft: OrderDraft,
): AssembledOrder {
  const appearances = appearancesFor(hearing);
  return {
    cause: causeTitle(hearing),
    caseNumber: hearing.caseNumber,
    item: hearing.item,
    purpose: courtHearingPurposeLabel(hearing.purpose),
    blocks: [
      assembleAttendance(appearances, draft.marks),
      /* Between the roll and the item, where an order takes them: the bench disposes
         of what is pending before it dictates what happens next. */
      ...toBlocks(
        assembleApplications(
          hearing,
          applicationsForListing(hearing.id),
          draft.applications,
        ),
      ),
      assembleItems(draft.items),
      assembleNextListing(draft),
    ],
  };
}

/**
 * The next matter the bench has not yet taken up — what Next item calls.
 *
 * The board is the board: this reads today's cause list with the sitting's own marks
 * applied, and ignores whatever filter or page the list was left on. A filtered view
 * is how one person is looking at the day, not what the day contains.
 *
 * Only a `scheduled` listing is unhandled. Completed matters have been heard, and a
 * passed-over one was deliberately skipped — recalling it is a decision the bench makes
 * from the list, not a default the composer takes on its behalf (`canPassOver`). Item
 * order, forward only, so "next" means what it says; the caller names the item number
 * it found, so a gap in the sequence is disclosed rather than silent.
 */
export function nextUnhandledListing(
  hearing: CourtHearing,
  session: {
    ongoingId: string | null;
    endedIds: ReadonlySet<string>;
    passedOverIds: ReadonlySet<string>;
  },
): CourtHearing | undefined {
  return withHearingSession(CAUSE_LIST, session)
    .filter((row) => row.status === "scheduled" && row.item > hearing.item)
    .sort((a, b) => a.item - b.item)[0];
}

/**
 * The order as paper — what Preview shows.
 *
 * Shaped as the facsimile the signing queue already prints (`sign-order-dialog.tsx`):
 * court and cause at the head, the numbered items as its body, the date, then the
 * signature block. The composer and the signing queue print the same artefact, so they
 * must not disagree about what it looks like — down to the numbering, which is the one
 * thing the two screens were caught disagreeing about before.
 *
 * Attendance opens the order, the applications answered in this sitting follow it, and
 * the next listing closes it — all as plain sentences. Each item keeps whatever the
 * editor's own list controls put inside it, which is where (a), (b), (c) within one
 * paragraph lives.
 *
 * **Nothing here is issued.** The signature block says the order is unsigned, because
 * it is, and this build has no act that would change that.
 */
export type OrderDocument = {
  court: string;
  caseNumber: string;
  matter: string;
  title: string;
  /** Attendance, as it opens the order. */
  opening: string;
  /**
   * How the applications pending on this listing were answered. Empty when none was
   * pending — the paper then has no such paragraph at all.
   */
  applications: { text: string; pending: boolean }[];
  /**
   * The order's numbered paragraphs. Empty when nothing has been added — the paper then
   * says so in its muted voice rather than printing a blank list. An entry's `html` is
   * empty while it is unwritten, and the plain line is what prints instead.
   */
  items: OrderItemEntry[];
  /** The next listing, as it closes the order. */
  closing: string;
  dated: string;
  signature: string;
};

export function buildOrderDocument(
  hearing: CourtHearing,
  draft: OrderDraft,
  day: string,
): OrderDocument {
  const appearances = appearancesFor(hearing);
  return {
    court: `Before the ${CURRENT_STAFF.court}`,
    caseNumber: hearing.caseNumber,
    matter: causeTitle(hearing),
    title: "Order",
    opening: assembleAttendance(appearances, draft.marks).body,
    applications:
      assembleApplications(
        hearing,
        applicationsForListing(hearing.id),
        draft.applications,
      )?.sentences ?? [],
    items: assembleItems(draft.items).items ?? [],
    closing: assembleNextListing(draft).body,
    dated: formatCourtDay(day),
    signature: "Pending the signature of the magistrate.",
  };
}
