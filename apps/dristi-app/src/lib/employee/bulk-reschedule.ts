/**
 * The matters this court could move to another date — as data.
 *
 * Rescheduling in bulk is what a bench does when it is not going to sit: leave, transfer,
 * a court holiday declared late, a strike. The court pulls up everything listed across a
 * span of days and puts it on a new date in one act, rather than opening 20 case files.
 *
 * **There is no backend, and this build moves nothing.** The screen is live up to the
 * point of commitment — selection, the new date, validation, the confirmation and its
 * summary all work — and stops there, because listing a matter on a new date is a real
 * judicial act. `BulkRescheduleScreen` says so plainly at the point of the act rather
 * than performing it silently. Same bargain the row menu on today's cause list makes.
 *
 * **Today's rows are not restated here.** They are read out of `CAUSE_LIST` in
 * `./hearings`, so the two court-side screens cannot disagree about what this bench is
 * sitting on today. Only matters still `scheduled` are offered: one already heard,
 * abandoned or moved is not a matter this court can move again.
 *
 * The days after today are this module's own, and they are declared as **offsets** rather
 * than dates. A fixture pinned to 2026 goes stale the morning after it is written and
 * leaves the screen permanently empty; an offset is right whenever the screen is opened.
 */

import {
  CAUSE_LIST,
  causeTitle,
  isoDay,
  parseIsoDay,
  type CourtCaseStage,
  type CourtHearingPurposeId,
} from "./hearings";

export type ReschedulableHearing = {
  id: string;
  caseNumber: string;
  /** "A v. B" — the cause title, the same way the case record writes it. */
  title: string;
  /** How far the case has got. */
  stage: CourtCaseStage;
  /** What this sitting is listed for. Not the same fact as the stage. */
  purpose: CourtHearingPurposeId;
  /** The date the matter currently stands listed for, `YYYY-MM-DD`. */
  date: string;
};

/** A listing on a day the court has already fixed, held as a distance from today. */
type UpcomingListing = Omit<ReschedulableHearing, "date"> & { offset: number };

/**
 * The days ahead of today, on this bench's board.
 *
 * Shaped to exercise what the screen has to survive rather than to look busy: a cause
 * title long enough to wrap its column, complaint numbers that have not yet become
 * summary-trial numbers, every stage the journey names, and enough days that a range
 * wider than one is worth asking for.
 */
const UPCOMING: UpcomingListing[] = [
  {
    id: "r-799",
    caseNumber: "CMP/799/2026",
    title: "Ancy Varghese v. Kadavu Timber Depot",
    stage: "cognizance",
    purpose: "cognizance",
    offset: 1,
  },
  {
    id: "r-801",
    caseNumber: "CMP/801/2026",
    title: "Rahul Nambiar v. Sreelakshmi Agencies",
    stage: "cognizance",
    purpose: "admission",
    offset: 1,
  },
  {
    id: "r-266",
    caseNumber: "ST/266/2026",
    title: "Jayasree Menon v. Ashokan K",
    stage: "appearance",
    purpose: "appearance",
    offset: 1,
  },
  {
    id: "r-267",
    caseNumber: "ST/267/2026",
    title: "Noushad Ali v. Meridian Tyres and Retreading Works Pvt Ltd",
    stage: "evidence",
    purpose: "evidence-of-complainant",
    offset: 1,
  },
  {
    id: "r-803",
    caseNumber: "CMP/803/2026",
    title: "Sarita Balakrishnan v. Vayal Agri Products",
    stage: "cognizance",
    purpose: "delay-condonation",
    offset: 2,
  },
  {
    id: "r-268",
    caseNumber: "ST/268/2026",
    title: "Devika Ravindran v. Chackos Jewellery",
    stage: "plea",
    purpose: "plea",
    offset: 2,
  },
  {
    id: "r-269",
    caseNumber: "ST/269/2026",
    title: "Manaf Sadiq v. Greenfield Rubber Estates",
    stage: "evidence",
    purpose: "examination-of-accused-351",
    offset: 2,
  },
  {
    id: "r-807",
    caseNumber: "CMP/807/2026",
    title: "Bindu Rajan v. Alappat Hardware",
    stage: "process",
    purpose: "appearance",
    offset: 3,
  },
  {
    id: "r-270",
    caseNumber: "ST/270/2026",
    title: "Elizabeth Mathew v. Karunya Motors",
    stage: "arguments",
    purpose: "arguments",
    offset: 3,
  },
  {
    id: "r-271",
    caseNumber: "ST/271/2026",
    title: "Prakash Menon v. Sea Breeze Cold Storage",
    stage: "evidence",
    purpose: "for-reports",
    offset: 3,
  },
  {
    id: "r-808",
    caseNumber: "CMP/808/2026",
    title: "Shalini Dev v. Amrutha Fabrics",
    stage: "cognizance",
    purpose: "admission",
    offset: 5,
  },
  {
    id: "r-272",
    caseNumber: "ST/272/2026",
    title: "Ibrahim Kutty v. Pournami Chit Funds",
    stage: "judgement",
    purpose: "judgement",
    offset: 5,
  },
  {
    id: "r-273",
    caseNumber: "ST/273/2026",
    title: "Geetha Sasidharan v. Vismaya Builders",
    stage: "appearance",
    purpose: "bail",
    offset: 6,
  },
  {
    id: "r-842",
    caseNumber: "CMP/842/2026",
    title: "Anwar Sadath v. Neeraja Metals",
    stage: "cognizance",
    purpose: "cognizance",
    offset: 8,
  },
  {
    id: "r-274",
    caseNumber: "ST/274/2026",
    title: "Latha Vijayan v. Kollam Marine Foods",
    stage: "plea",
    purpose: "plea",
    offset: 8,
  },
  {
    id: "r-275",
    caseNumber: "ST/275/2026",
    title: "Sabu Cherian v. Highway Auto Works",
    stage: "evidence",
    purpose: "evidence-of-complainant",
    offset: 9,
  },
];

/** `YYYY-MM-DD`, `n` days on. Built through a Date so month and year ends are the OS's. */
export function addDays(day: string, count: number): string {
  const date = parseIsoDay(day);
  date.setDate(date.getDate() + count);
  return isoDay(date);
}

/**
 * Everything this court could move, today first.
 *
 * Sorted by date and then by the court's own number, so the list reads the way a board
 * does and a matter keeps its place when the range widens.
 */
export function reschedulableHearings(today: string): ReschedulableHearing[] {
  const listedToday: ReschedulableHearing[] = CAUSE_LIST.filter(
    (hearing) => hearing.status === "scheduled",
  ).map((hearing) => ({
    id: hearing.id,
    caseNumber: hearing.caseNumber,
    title: causeTitle(hearing),
    stage: hearing.stage,
    purpose: hearing.purpose,
    date: today,
  }));

  const ahead: ReschedulableHearing[] = UPCOMING.map(({ offset, ...listing }) => ({
    ...listing,
    date: addDays(today, offset),
  }));

  return [...listedToday, ...ahead].sort(
    (a, b) => a.date.localeCompare(b.date) || a.caseNumber.localeCompare(b.caseNumber),
  );
}

export type RescheduleFilters = {
  /** First and last listing date to pull in, inclusive. */
  from: string;
  to: string;
  /** Free text over the cause title and the case number — what the bench can recall. */
  query: string;
};

/**
 * The range the screen opens on: today, and only today.
 *
 * The reference opens on a single day, and that is the case the screen exists for — the
 * court is not sitting today, so today's board has to move. Widening it is one control.
 */
export function defaultRescheduleFilters(today: string): RescheduleFilters {
  return { from: today, to: today, query: "" };
}

export function filterReschedulable(
  rows: ReschedulableHearing[],
  filters: RescheduleFilters,
): ReschedulableHearing[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    /* ISO days sort as strings, so the range is a plain comparison — no Date per row. */
    if (row.date < filters.from || row.date > filters.to) return false;
    if (!query) return true;
    return `${row.title} ${row.caseNumber}`.toLowerCase().includes(query);
  });
}

/** What the bench has typed into the New hearing date column, by listing id. */
export type NewHearingDates = Readonly<Record<string, string | undefined>>;

/**
 * Why a selected matter cannot move yet.
 *
 * `null` means it can. Three ways it cannot, and the screen says which: no date chosen,
 * a date already past, or the date it is already on — none of which is a reschedule, and
 * all three of which are easy to reach with 20 rows selected and one careless pick.
 */
export type NewDateProblem = "missing" | "past" | "unchanged";

export function newDateProblem(
  row: ReschedulableHearing,
  newDate: string | undefined,
  today: string,
): NewDateProblem | null {
  if (!newDate) return "missing";
  if (newDate < today) return "past";
  if (newDate === row.date) return "unchanged";
  return null;
}

/** The distinct dates a set of moves would land on, earliest first. */
export function targetDates(
  rows: ReschedulableHearing[],
  dates: NewHearingDates,
): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const next = dates[row.id];
    if (next) seen.add(next);
  }
  return [...seen].sort();
}
