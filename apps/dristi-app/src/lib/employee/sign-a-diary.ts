/**
 * The A-Diary entries waiting on this bench's signature — the day's register, as data.
 *
 * The third row of the rail's Sign group, and a different kind of paper from the two
 * above it. A form is a court paper a party swears; an order is the court's own
 * decision. The A-Diary is the court's **register of its own day**: for every matter the
 * bench dealt with, what was done and when the case comes back. It is written as the day
 * runs and signed at the end of it, and until the magistrate signs it the day's record
 * is not made.
 *
 * Two facts follow from that and shape everything here:
 *
 * 1. **An entry is dated, and the diary is read one day at a time.** So the screen's one
 *    filter is a date, opening on the day the court is sitting — the reference's own
 *    control — and the entries carry the day they record rather than a created-on
 *    timestamp.
 * 2. **The business of the day is editable until it is signed.** Every other court-side
 *    queue shows a finished paper and asks only whether to act on it. This one is the
 *    record itself, so the bench can correct the words before putting a signature under
 *    them. `saveBusinessOfTheDay` is that edit.
 *
 * **There is no backend. Nothing here is signed, filed or recorded.** `A_DIARY_SEED` is
 * demo data shaped to exercise what the screen has to survive: a day with enough entries
 * to read as a register, a short backlog on earlier days so the date filter has
 * something to cut on, a business line long enough to clamp in its column and to wrap in
 * the editor, a corporate party long enough to wrap the cause title, and a side with no
 * vakalat so the appearance table has an empty row to answer for. No row is read from a
 * case, a court or a register.
 *
 * **The dates are offsets, not fixtures.** A diary pinned to a date in 2026 is empty
 * every morning after that date, and a screen that opens on today would show nothing
 * forever. `bulk-reschedule.ts` reached the same conclusion for the same reason; the
 * offsets here are resolved against the reader's own clock by `aDiaryEntries`.
 *
 * **This does not read today's cause list**, though the diary of a real court is the
 * record of exactly those matters. `CAUSE_LIST` holds one day of listings, and what the
 * bench actually *did* with each of them — heard, passed over, still to be called — is
 * state that lives in the hearings screen for the length of a visit. A diary derived
 * from it would hold three entries, and would empty or contradict itself the moment
 * either side changed. So this module keeps its own matters, and they are its own: no
 * entry here restates a case on today's board, the scheduling queue, the register queue,
 * either review queue, or the two signing queues above it.
 */

import { addDays } from "./bulk-reschedule";
import { CURRENT_STAFF } from "./content";
import {
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  formatCourtDay,
  formatListingDate,
  type CourtCounsel,
  type CourtHearingPurposeId,
} from "./hearings";

/** The court whose register this is. One bench, one diary. */
const COURT = CURRENT_STAFF.court;

export type ADiaryEntry = {
  id: string;
  caseNumber: string;
  parties: { complainant: string; accused: string };
  /** Who appeared. A side may have none — no vakalat yet. */
  counsel: CourtCounsel[];
  /** The day this entry records, `YYYY-MM-DD`. */
  dated: string;
  /**
   * What the court did that day, in the court's own words — the reference's
   * "Proceedings/Business of the day".
   *
   * One string rather than a list of acts, because that is what it is on the paper: a
   * paragraph the bench writes, corrects and signs. It always ends with the sentence
   * that fixes the next date, which is the part the register is read for.
   */
  business: string;
  /** The day the case comes back, and what it is listed for. */
  nextHearing: string;
  nextPurpose: CourtHearingPurposeId;
};

/**
 * One entry before its dates are resolved.
 *
 * `datedOffset` is days from today — `0` is the day the court is sitting, `-1` yesterday.
 * `nextOffset` is measured from the same today rather than from the entry's own day, so
 * a backlog entry cannot list a case for a date that has already passed.
 */
type ADiarySeed = Omit<ADiaryEntry, "dated" | "nextHearing" | "business"> & {
  datedOffset: number;
  nextOffset: number;
  /**
   * What was done, when the day's business was more than fixing the next date.
   *
   * Optional because most of the reference's own entries are the next-hearing sentence
   * and nothing else — a matter called, the parties heard on a date, the case adjourned.
   * Where a seed carries this, `composeBusiness` puts it in front of that sentence.
   */
  proceedings?: string;
};

/**
 * The register, newest day first.
 *
 * Five entries for the day the court is sitting, and three left unsigned from earlier
 * days — a bench that has not signed its diary every evening, which is the ordinary case
 * and the reason the screen offers a date at all.
 */
const A_DIARY_SEED: ADiarySeed[] = [
  {
    id: "ad-655",
    caseNumber: "ST/655/2026",
    parties: { complainant: "Sajeev Kumar", accused: "Thevally Auto Works" },
    counsel: [
      { name: "Adv. Nisha Thomas", side: "complainant" },
      { name: "Adv. Arun Prakash", side: "accused" },
    ],
    datedOffset: 0,
    nextOffset: 7,
    nextPurpose: "evidence-of-complainant",
    proceedings:
      "The complainant was present and was examined as PW1. Chief examination was completed and the cheque and the bank memo were marked. Cross examination could not be taken up for want of time.",
  },
  {
    id: "ad-658",
    caseNumber: "ST/658/2026",
    parties: { complainant: "Radhika Menon", accused: "Firoz Muhammad" },
    counsel: [
      { name: "Adv. Leela Krishnan", side: "complainant" },
      { name: "Adv. Sabu Varghese", side: "accused" },
    ],
    datedOffset: 0,
    nextOffset: 10,
    nextPurpose: "appearance",
  },
  {
    id: "ad-662",
    caseNumber: "ST/662/2026",
    parties: {
      complainant: "Ashramam Hardware and Sanitary Wares",
      accused: "Bindu Rajagopal",
    },
    counsel: [{ name: "Adv. Mohan Das", side: "complainant" }],
    datedOffset: 0,
    nextOffset: 14,
    nextPurpose: "plea",
    proceedings:
      "The accused appeared and was released on bail on the bond already executed. The substance of the accusation was read over and explained.",
  },
  {
    id: "ad-665",
    caseNumber: "ST/665/2026",
    parties: { complainant: "Jomon Jacob", accused: "Sheela Ravindran" },
    counsel: [
      { name: "Adv. Priya Raghavan", side: "complainant" },
      { name: "Adv. Haridas Nair", side: "accused" },
    ],
    datedOffset: 0,
    nextOffset: 5,
    nextPurpose: "arguments",
  },
  {
    id: "ad-669",
    caseNumber: "ST/669/2026",
    parties: { complainant: "Shanavas Ali", accused: "Kadappakada Motors" },
    counsel: [
      { name: "Adv. Elizabeth Kurian", side: "complainant" },
      { name: "Adv. Rajan Pillai", side: "accused" },
    ],
    datedOffset: 0,
    nextOffset: 21,
    nextPurpose: "for-reports",
    proceedings:
      "Both sides reported that the reference to mediation is pending before the centre. The report of the mediator has not been received.",
  },
  /* Left unsigned from earlier days. They are the reason the date filter is a control
     and not decoration, and the reason the page's count and the table's count differ:
     the count is the whole unsigned diary, the table is one day of it. */
  {
    id: "ad-672",
    caseNumber: "ST/672/2026",
    parties: { complainant: "Girija Amma", accused: "Nowfal Rawther" },
    counsel: [
      { name: "Adv. Suresh Menon", side: "complainant" },
      { name: "Adv. Deepa Chandran", side: "accused" },
    ],
    datedOffset: -1,
    nextOffset: 9,
    nextPurpose: "examination-of-accused-351",
  },
  {
    id: "ad-1046",
    caseNumber: "CMP/1046/2026",
    parties: {
      complainant: "Kilikolloor Rubber Traders",
      accused: "Anilkumar Sivadasan",
    },
    counsel: [{ name: "Adv. Fathima Nazar", side: "complainant" }],
    datedOffset: -1,
    nextOffset: 4,
    nextPurpose: "cognizance",
    proceedings:
      "The complaint was taken up for cognizance. The sworn statement of the complainant was recorded.",
  },
  {
    id: "ad-676",
    caseNumber: "ST/676/2026",
    parties: { complainant: "Vijayan Pillai", accused: "Susan Mathew" },
    counsel: [
      { name: "Adv. Anwar Sadath", side: "complainant" },
      { name: "Adv. Rekha Pillai", side: "accused" },
    ],
    datedOffset: -3,
    nextOffset: 2,
    nextPurpose: "delay-condonation",
  },
];

/**
 * How many diary entries are unsigned — the number the rail carries beside "Sign
 * A-Diary".
 *
 * The length of the seed, which is a fact about the fixture and not about the clock, so
 * the rail can carry it without asking what day it is. It counts the whole unsigned
 * diary rather than one day of it: the rail sends the bench to a screen that opens on
 * today, and the page's own count line is the one that agrees with this number. Derived
 * rather than typed in beside the label, the way every other built row's count is.
 */
export const A_DIARY_PENDING_COUNT = A_DIARY_SEED.length;

/**
 * The next-hearing sentence — the one line every entry in the register ends with.
 *
 * The purpose keeps the case the catalogue gives it. Lower-casing it mid-sentence would
 * read better for "Appearance" and would destroy "Examination of accused under S. 351
 * BNSS", and the purposes are the court's own register vocabulary rather than ordinary
 * prose — the reference writes "for Appearance" for the same reason.
 *
 * One label — "For reports (to be received from forensics, ADR, etc)" — already opens
 * with the preposition, and bolting a second one on gives "for For reports". The
 * catalogue is right and the sentence is what has to bend, so the duplicate is dropped
 * rather than the purpose being avoided in the fixture.
 */
function nextHearingSentence(day: string, purpose: CourtHearingPurposeId): string {
  const label = courtHearingPurposeLabel(purpose);
  const listedFor = label.startsWith("For ") ? label.slice("For ".length) : label;
  return `Next hearing is scheduled on ${formatListingDate(day)} for ${listedFor}.`;
}

function composeBusiness(seed: ADiarySeed, nextHearing: string): string {
  const sentence = nextHearingSentence(nextHearing, seed.nextPurpose);
  return seed.proceedings ? `${seed.proceedings} ${sentence}` : sentence;
}

/**
 * The unsigned register, resolved against the day the reader is on.
 *
 * Newest day first, and within a day in the order the matters were dealt with — which is
 * the order a diary is written and therefore the order it is read back and signed.
 */
export function aDiaryEntries(today: string): ADiaryEntry[] {
  return A_DIARY_SEED.map((seed) => {
    const nextHearing = addDays(today, seed.nextOffset);
    return {
      id: seed.id,
      caseNumber: seed.caseNumber,
      parties: seed.parties,
      counsel: seed.counsel,
      dated: addDays(today, seed.datedOffset),
      business: composeBusiness(seed, nextHearing),
      nextHearing,
      nextPurpose: seed.nextPurpose,
    };
  });
}

export type ADiaryFilters = {
  /**
   * Which day's diary is on screen.
   *
   * `null` is the day the court is sitting, resolved against the reader's clock at
   * render rather than frozen when the screen first painted — the same bargain
   * `HearingsScreen` makes with its own day. Anything else is the ISO day the bench
   * asked for.
   *
   * There is deliberately no "every day" — the A-Diary is a dated register and is read,
   * corrected and signed one day at a time. A view mixing three days would also be a
   * table whose rows cannot be told apart, since the reference's columns carry the next
   * hearing date and not the day being signed. Clear returns to today for the same
   * reason.
   */
  dated: string | null;
};

/** What the screen opens on, and what Clear returns to: today's diary. */
export const DEFAULT_A_DIARY_FILTERS: ADiaryFilters = { dated: null };

/** Which day the filter is asking for, with `null` resolved to the reader's today. */
export function resolveADiaryDay(
  filters: ADiaryFilters,
  today: string,
): string {
  return filters.dated ?? today;
}

export function filterADiary(
  rows: ADiaryEntry[],
  filters: ADiaryFilters,
  today: string,
): ADiaryEntry[] {
  const day = resolveADiaryDay(filters, today);
  return rows.filter((entry) => entry.dated === day);
}

/**
 * Correct the day's business before it is signed.
 *
 * A pure function over the register so the screen holds one list and no second copy of
 * the truth. The text is trimmed, and a blank one is ignored rather than written: a
 * diary entry with no business recorded is not a record the court can sign, and the
 * editor disables Save on it for the same reason. An id that names no entry is ignored
 * too — a register that has moved on under a stale dialog is a real case, not an error.
 *
 * **It records nothing.** See the module header: this replaces a string in memory.
 */
export function saveBusinessOfTheDay(
  rows: ADiaryEntry[],
  id: string,
  business: string,
): ADiaryEntry[] {
  const text = business.trim();
  if (!text) return rows;
  return rows.map((entry) =>
    entry.id === id ? { ...entry, business: text } : entry,
  );
}

/** "31 Aug 2026" — the same column register every other court-side list uses. */
export function formatADiaryDate(day: string): string {
  return formatListingDate(day);
}

/**
 * The entry as paper: what the preview renders and what Download writes.
 *
 * Shaped like the other court-side facsimiles — a court heading, the cause, the body,
 * and the block that signs it — so the court side's documents read as one product. What
 * the A-Diary adds is the **appearance table** the reference draws: who was on each side
 * and who appeared for them, which is the part of the day's record that says the hearing
 * happened at all.
 */
export type ADiaryDocument = {
  court: string;
  caseNumber: string;
  matter: string;
  /** "Monday, 31 August 2026" — the day the register records, named in full. */
  dated: string;
  /** The reference's bordered table: a label and a value, in the order it draws them. */
  appearances: { label: string; value: string }[];
  business: string;
  /** The signature block. Nothing in this build ever signs it. */
  signature: string;
};

/** Counsel for one side, or the plain fact that there is none. */
function appearanceFor(entry: ADiaryEntry, side: "complainant" | "accused"): string {
  const names = counselFor(entry, side).map((counsel) => counsel.name);
  /* Named rather than left blank. The reference draws an empty row here, and an empty
     row in a facsimile reads as a document that failed to render — the same reason the
     signature block below says what it is waiting for. */
  return names.length > 0 ? names.join(", ") : "No advocate on record";
}

export function buildADiaryDocument(entry: ADiaryEntry): ADiaryDocument {
  return {
    court: `Before the ${COURT}`,
    caseNumber: entry.caseNumber,
    matter: causeTitle(entry),
    dated: formatCourtDay(entry.dated),
    /* The reference's own four rows, in its own order: each side, then who appeared for
       it. "1" is the reference's numbering — a case can carry more than one complainant
       or accused, and the register numbers them. */
    appearances: [
      { label: "Complainant 1", value: entry.parties.complainant },
      { label: "Advocate(s)", value: appearanceFor(entry, "complainant") },
      { label: "Accused 1", value: entry.parties.accused },
      { label: "Advocate(s)", value: appearanceFor(entry, "accused") },
    ],
    business: entry.business,
    signature: "Pending the signature of the magistrate.",
  };
}

export function aDiaryDocumentText(document: ADiaryDocument): string {
  return [
    document.court,
    `Case no. ${document.caseNumber}`,
    `In the matter of ${document.matter}`,
    `Dated ${document.dated}`,
    "",
    ...document.appearances.map(({ label, value }) => `${label}: ${value}`),
    "",
    "Business of the day",
    document.business,
    "",
    document.signature,
  ].join("\n");
}

export function aDiaryDocumentFilename(entry: ADiaryEntry): string {
  return `${entry.caseNumber.replace(/\//g, "-")}-a-diary-${entry.dated}.txt`;
}

export function downloadADiaryDocument(entry: ADiaryEntry): void {
  const document = buildADiaryDocument(entry);
  const url = URL.createObjectURL(
    new Blob([aDiaryDocumentText(document)], { type: "text/plain" }),
  );
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = aDiaryDocumentFilename(entry);
  anchor.click();
  URL.revokeObjectURL(url);
}
