/**
 * The order of one listing — what the cause-list icon opens, as data.
 *
 * Employee stays self-contained (`content.ts`): this module restates the hearing-day
 * direction labels rather than importing the advocate-side register. The *words* are
 * the register's (`lib/cases/orders.ts`) so the two halves cannot disagree about
 * "Interim compensation". The catalogue here is the sitting-only subset; scheduling
 * types are not in it, because the next date is its own section on the composer.
 *
 * **Nothing here is issued.** Assembling the text is a screen derivation. Saving a
 * draft and previewing it do not file, notify, or sign — the same honesty bargain
 * Start / End hearing and bulk reschedule already make.
 */

import {
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  formatCourtDay,
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
 * Directions the bench can add on a sitting. Labels match the case-register catalogue
 * exactly; the ids are the same so a later wiring cannot silently rename them.
 */
export const HEARING_DIRECTION_TYPES = [
  { id: "notice", label: "Notice" },
  { id: "summons", label: "Summons" },
  { id: "warrant", label: "Warrant" },
  { id: "proclamation", label: "Proclamation" },
  { id: "interim-compensation", label: "Interim compensation" },
  { id: "cost", label: "Cost" },
  { id: "bail", label: "Bail" },
  { id: "production-of-documents", label: "Production of documents" },
  { id: "others", label: "Others" },
] as const;

export type HearingDirectionTypeId =
  (typeof HEARING_DIRECTION_TYPES)[number]["id"];

export function isHearingDirectionType(
  value: string,
): value is HearingDirectionTypeId {
  return HEARING_DIRECTION_TYPES.some((entry) => entry.id === value);
}

export function hearingDirectionLabel(id: HearingDirectionTypeId): string {
  return (
    HEARING_DIRECTION_TYPES.find((entry) => entry.id === id)?.label ?? id
  );
}

export type DirectionDraft = {
  id: string;
  typeId: HearingDirectionTypeId;
  body: string;
};

export type NextListingChoice = "list" | "none";

export type OrderDraft = {
  marks: Readonly<Record<string, AttendanceMark | undefined>>;
  next: NextListingChoice;
  nextPurpose: CourtHearingPurposeId | "";
  nextDate: string | null;
  directions: DirectionDraft[];
};

export const EMPTY_ORDER_DRAFT: OrderDraft = {
  marks: {},
  next: "list",
  nextPurpose: "",
  nextDate: null,
  directions: [],
};

/** One named block in the assembled order. `pending` when the matching control is empty. */
export type OrderBlock = {
  id: string;
  heading: string;
  body: string;
  pending: boolean;
  /**
   * Attendance only. When present, the document renders a roll of names rather
   * than the joined `body` paragraph — same words, one appearance per line.
   */
  appearances?: AttendanceEntry[];
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

export function assembleDirection(direction: DirectionDraft): OrderBlock {
  const heading = hearingDirectionLabel(direction.typeId);
  const body = direction.body.trim();
  if (!body) {
    return {
      id: direction.id,
      heading,
      body: "The direction has not been written.",
      pending: true,
    };
  }
  return { id: direction.id, heading, body, pending: false };
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
      ...draft.directions.map(assembleDirection),
      assembleNextListing(draft),
    ],
  };
}
