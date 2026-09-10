/**
 * Advocate registrations waiting on the scrutiny officer — the eighth court-side queue,
 * as data.
 *
 * Advocates **self-register** on the citizen side. Their account sits at Pending Approval
 * with no access to it (`REG-24`), and this queue is what stands between them and the
 * right to file. The act the officer performs is the one the Account Creation handover
 * names in §2: verify the person by their **Bar registration ID and the photo of their
 * Bar ID card**, then approve or reject (§5.3). A rejection carries a free-text reason
 * (`REG-22`); the advocate edits and resubmits, without limit (`REG-23`).
 *
 * This is **not** a form for keying an advocate's details in. Nothing on the court side
 * creates a registration; every row here arrived from the other side of the product.
 *
 * Source for every field and every state below:
 * `/Users/abhiramrajilan/Desktop/account-creation-handover.md` §5 (`REG-10`–`REG-24`) and
 * `docs/design/proposals/register-advocates.md`. Only what the registration flow actually
 * collects is modelled — mobile (OTP-verified, the account's primary key), full name, Bar
 * registration ID, the photo of the card, and an optional email. **Address, ID type and
 * ID proof are deliberately absent**: handover §5.1 says they are not collected, and a
 * row that carried them would be inventing data the product never asks for.
 *
 * **There is no backend.** `REGISTER_ADVOCATES_QUEUE` is demo data shaped to exercise
 * what the screen has to survive: two names in Malayalam script, one name long enough to
 * wrap its column twice, Bar registration IDs from four state bars so the column is sized
 * off the longest rather than off Kerala's short form, waits spread from one day to two
 * months, an edited pre-created account (`REG-18`), a resubmission at round 2 and one at
 * round 5 with every earlier reason kept, a Bar Council lookup that disagrees, one that
 * could not be reached, one that found nothing, and one card photo that will not load.
 * No row is read from a bar council, a register or a person.
 *
 * **Approve and Reject perform no act.** Neither opens an account, grants access, refuses
 * anyone, sends a reason or writes to a record. Both do exactly one thing: drop the row
 * from this demo queue, the way the copy-application and rescheduling queues already do.
 * Nothing persists past a reload.
 *
 * The registration application number stays in the `KL-ADV-000207-2026` form the advocate
 * is shown on their own "awaiting approval" screen. It is the only string the two sides of
 * the product share about this request, so it is not re-minted here (brief D14).
 */

import { matchesQuery } from "./filter-state";
import { formatListingDate, parseIsoDay } from "./hearings";
import type { RegisteredAdvocate } from "@/lib/filing/registry";

/**
 * Who is registering.
 *
 * `REG-13a` / `REG-14a` put **clerk** registrations through the same scrutiny-officer
 * approval with their own identifier and their own ID card, and the owner named only
 * advocates. So the distinction lives in the row from the start and every label is read
 * off it — but no column and no filter ships for it while every row says "advocate",
 * because a column whose every cell reads the same is the exact defect this screen's
 * predecessor had (brief D13). The day clerks join, the constant becomes a real
 * distinction and the column earns its place then.
 */
export type RegistrantKind = "advocate" | "clerk";

/**
 * How this request came to be waiting — the three genuinely different jobs behind one
 * queue (brief D7).
 *
 * - `first` — a fresh self-registration. **The norm, and it is left unmarked.**
 * - `edited` — `REG-18`: the account was auto-created from the Bar Council database and
 *   the holder changed something at first login. The officer verifies the *change*, not
 *   the whole record.
 * - `resubmission` — `REG-23`: this was rejected and the advocate has sent it back. The
 *   officer's real question is "did they fix what I said", so the last reason travels
 *   with the row.
 */
export type RequestKind = "first" | "edited" | "resubmission";

/** The four claim fields the registration flow collects — `REG-10`, `REG-12`, `REG-13`, `REG-15`. */
export type ClaimField = "fullName" | "barRegistrationId" | "mobile" | "email";

/**
 * One value the holder of a pre-created account changed at first login (`REG-18`).
 *
 * Only `was` is stored. `now` is whatever the row already carries, so the two can never
 * drift apart, and `null` means the value was **added** rather than altered — the flow
 * pre-fills from the Bar Council record, which holds no email.
 */
export type RegistrationEdit = { field: ClaimField; was: string | null };

/**
 * One round of the reject–resubmit loop (`REG-22`, `REG-23`).
 *
 * `reason` is the officer's own free text, kept whole: it is what the advocate was told,
 * and a summary of it would let this screen quietly rewrite what the court said.
 */
export type RejectionRound = {
  /** 1 for the first rejection. The badge reads the round the *current* request is on. */
  round: number;
  /** How long ago the rejection went out, counted from the same day as `daysWaiting`. */
  daysAgo: number;
  reason: string;
};

/**
 * What the Bar Council register said when this Bar registration ID was looked up
 * (`REG-13`).
 *
 * Four answers, and only one of them is an exception worth marking (brief D5). It is
 * stated as **a machine reading**, never as a verdict: the evidence `REG-14` actually
 * names is the photograph, and the officer looks at that in every case.
 *
 * `entry` reuses `RegisteredAdvocate` from `lib/filing/registry.ts` — the app already
 * models a bar-council register as `{ barNumber, name, bar }`, and a second shape for the
 * same register is how two screens end up disagreeing about what a lookup returns. That
 * file also says in its own header that "the register will never be complete", which is
 * why `not-found` below is an ordinary state and not an error.
 */
/**
 * BCP 47 tag for `entry.name`, when the register's answer is not written in English.
 *
 * The register's name is its own string and carries its own script: the claimant may
 * have typed Malayalam and the register answer in Latin, or the reverse, and the whole
 * point of the `disagrees` case is that the two are *not* the same name. Tagging the
 * register's name with the claimant's tag — which is what this screen did before — hands
 * a screen reader a Malayalam voice for a Latin string on exactly the row where the
 * officer is being asked to compare them (ACCESSIBILITY §13). It rides `entry` rather
 * than `RegisteredAdvocate` itself because that type is `lib/filing/registry.ts`'s, shared
 * with the filing side, and this is a fact about the lookup's presentation here.
 */
type EntryNameLang = { entryNameLang?: string };

export type BarCouncilLookup =
  /** The register holds this number against this name. The norm — stated once, quietly. */
  | ({ state: "agrees"; entry: RegisteredAdvocate } & EntryNameLang)
  /** The register holds this number against somebody else. A finding for a human. */
  | ({ state: "disagrees"; entry: RegisteredAdvocate } & EntryNameLang)
  /** The number is not in the register. Ordinary — see above. */
  | { state: "not-found" }
  /** The register could not be reached. **The decision is not blocked.** */
  | { state: "unavailable" };

export type AdvocateRegistration = {
  id: string;
  /**
   * `KL-ADV-000207-2026` — the string the advocate is shown on their own waiting screen,
   * and the only identifier they can quote on the phone. The row's opener.
   */
  applicationNumber: string;
  /** `REG-12`. The emphasised cell, and what identifies a person. */
  fullName: string;
  /**
   * BCP 47 tag for `fullName`, when it is not written in English.
   *
   * A name in Malayalam script is data, not a locale — the rest of this screen stays in
   * English — so the tag rides the name itself and nothing else. Without it a screen
   * reader pronounces Malayalam letters with an English voice (ACCESSIBILITY §13).
   */
  fullNameLang?: string;
  /** `REG-13`. The claim under verification, and the second thing an officer searches by. */
  barRegistrationId: string;
  /** `REG-10` — OTP-verified, and the account's primary key (`REG-07`). */
  mobile: string;
  /** `REG-15` — optional. Absent, not empty: the claim block omits the row entirely. */
  email?: string;
  /** `REG-14` — the photograph the whole approval turns on. */
  photo: { src: string; filename: string };
  /**
   * How long this request has been waiting, in days.
   *
   * Stored rather than derived from a date, the way `RegisterCase.daysSinceSubmitted` is:
   * a demo queue whose ages drift with the wall clock stops exercising the escalation it
   * was built to exercise. The submission date the overlay shows is derived from this
   * (`submissionDay`), so the two can never contradict each other.
   */
  daysWaiting: number;
  registrantKind: RegistrantKind;
  requestKind: RequestKind;
  lookup: BarCouncilLookup;
  /** `REG-18`. Present only on an `edited` request, and never empty when present. */
  edits?: RegistrationEdit[];
  /** `REG-23`. Present only on a `resubmission`, oldest round first. */
  rejections?: RejectionRound[];
};

/**
 * The day the demo queue is read as standing on.
 *
 * Every age in this file is counted back from here, so the rows keep their spread — a
 * two-month-old request stays two months old — instead of ageing with whoever opens the
 * screen. Replacing this module with a service replaces the arithmetic too.
 */
const DEMO_TODAY = "2026-09-10";

/** The ISO day a request was submitted, derived from its age. */
export function submissionDay(request: AdvocateRegistration): string {
  return dayBefore(DEMO_TODAY, request.daysWaiting);
}

/** The ISO day a rejection round went out, derived the same way. */
export function rejectionDay(round: RejectionRound): string {
  return dayBefore(DEMO_TODAY, round.daysAgo);
}

function dayBefore(day: string, days: number): string {
  const date = parseIsoDay(day);
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const date_ = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${date_}`;
}

/** "31 Aug 2026" — the same column register every other court-side list uses. */
export function formatRegistrationDate(day: string): string {
  return formatListingDate(day);
}

const LONG_DAY = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "31 August 2026" — a date read inside the overlay, not in a column. */
export function formatRegistrationLongDate(day: string): string {
  return LONG_DAY.format(parseIsoDay(day));
}

/* ─────────────────────────── labels, read off the row ─────────────────────── */

/** What this registrant's identifier is called (brief D13). */
export function registrationIdLabel(kind: RegistrantKind): string {
  return kind === "clerk" ? "Clerk registration number" : "Bar registration ID";
}

/** What the photograph is called (`REG-14` / `REG-14a`). */
export function idPhotoLabel(kind: RegistrantKind): string {
  return kind === "clerk" ? "Photo of clerk ID card" : "Photo of Bar ID card";
}

/** The noun for the person, in a sentence. */
export function registrantNoun(kind: RegistrantKind): string {
  return kind === "clerk" ? "clerk" : "advocate";
}

/**
 * The row's mark, or nothing at all.
 *
 * A first registration is the norm and carries **no badge** — marking every row would
 * spend the column's whole ration on a fact that distinguishes nothing (brief D7).
 */
export function requestKindLabel(request: AdvocateRegistration): string | null {
  if (request.requestKind === "edited") return "Edited";
  if (request.requestKind === "resubmission") {
    return `Resubmitted · round ${currentRound(request)}`;
  }
  return null;
}

/**
 * Which round the request in front of the officer is on.
 *
 * One past the number of rejections behind it: a request that has been refused four times
 * and sent back is on round 5.
 */
export function currentRound(request: AdvocateRegistration): number {
  return (request.rejections?.length ?? 0) + 1;
}

/** The reason the officer gave last time, in full — the resubmission's whole question. */
export function latestRejection(
  request: AdvocateRegistration,
): RejectionRound | undefined {
  return request.rejections?.at(-1);
}

/** Everything before that, oldest first — one line each in the overlay's timeline. */
export function earlierRejections(
  request: AdvocateRegistration,
): RejectionRound[] {
  return request.rejections?.slice(0, -1) ?? [];
}

/** What the holder changed in this field at first login, if anything (`REG-18`). */
export function editFor(
  request: AdvocateRegistration,
  field: ClaimField,
): RegistrationEdit | undefined {
  return request.edits?.find((edit) => edit.field === field);
}

/* ─────────────────────────────── the wait ─────────────────────────────────── */

export type WaitTone = "plain" | "warning" | "destructive";

/**
 * How loudly the days-waiting cell speaks.
 *
 * The escalating shape is the scrutiny queue's `waitTone` (`lib/employee/scrutiny/
 * queue.ts`): plain at rest, `warning-ink` past a threshold, `destructive-ink` past a
 * longer one. Marking every row instead — which `RegisterCasesTable` does — restates the
 * norm and spends a colour on it, so the exception is what gets the ink.
 *
 * **The thresholds are borrowed, not derived.** 7 and 14 days are the scrutiny registry's
 * own clock. Nobody has told us what "too long" means for a registration
 * (`register-advocates.md` §12.5), and until they do, two court-side queues speaking with
 * one voice beats this one inventing a number. What is not borrowed is that a wait here
 * is a live harm: `REG-24` says a pending advocate cannot act at all, and §138 runs on
 * statutory clocks that do not pause while they wait
 * (`docs/product/domain/journey.md` §1–3).
 */
export function registrationWaitTone(days: number): WaitTone {
  if (days >= 14) return "destructive";
  if (days >= 7) return "warning";
  return "plain";
}

/** The number the table shows; the column header names the unit. */
export function formatDaysWaiting(days: number): string {
  return String(days);
}

/** The same fact, spoken — for the stacked phone rows, where there is no header. */
export function formatDaysWaitingSpoken(days: number): string {
  return days === 1 ? "1 day waiting" : `${days} days waiting`;
}

/* ──────────────────────────────── the queue ───────────────────────────────── */

const CARD = "/demo/bar-id-card-specimen.svg";
/** A pale scan — the near-white card the sunken well has to keep an edge against. */
const PALE_CARD = "/demo/bar-id-card-specimen-pale.svg";
/** Deliberately not a file. The one row whose photograph will not open. */
const MISSING_CARD = "/demo/bar-id-card-not-uploaded.svg";

const KERALA = "Bar Council of Kerala";

const PENDING: AdvocateRegistration[] = [
  {
    id: "adv-118",
    applicationNumber: "KL-ADV-000118-2026",
    /* The long one. Four given names and a title, which is ordinary in this bar and
       wraps every column it is put in. */
    fullName: "Fathima Beevi Abdul Rahman Kunju Rawther",
    barRegistrationId: "KL/1109/2009",
    mobile: "9847116620",
    email: "fathimabeevi.rawther@example.com",
    photo: { src: PALE_CARD, filename: "bar-id-kl-1109-2009.jpg" },
    daysWaiting: 61,
    registrantKind: "advocate",
    requestKind: "resubmission",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/1109/2009",
        name: "Fathima Beevi Abdul Rahman Kunju Rawther",
        bar: KERALA,
      },
    },
    /* Five rounds, so the block has to hold without growing without bound: the last
       reason reads in full, the four before it collapse to one line each. */
    rejections: [
      {
        round: 1,
        daysAgo: 78,
        reason:
          "The photo you have uploaded is of the back of the card. Please upload the side that carries your name, your photograph and the enrolment number.",
      },
      {
        round: 2,
        daysAgo: 73,
        reason:
          "The photograph is too dark for the enrolment number to be read. Please take it again in daylight and upload it.",
      },
      {
        round: 3,
        daysAgo: 68,
        reason:
          "The card reads Fathima Beevi Abdul Rahman Kunju Rawther. You have typed Fathima Beevi Rawther. Please type the name exactly as it appears on the card.",
      },
      {
        round: 4,
        daysAgo: 64,
        reason:
          "The enrolment number on the card is KL/1109/2009. You have entered KL/1190/2009. Please correct it and submit again.",
      },
    ],
  },
  {
    id: "adv-164",
    applicationNumber: "KL-ADV-000164-2026",
    fullName: "അനിൽകുമാർ പി. നായർ",
    fullNameLang: "ml",
    barRegistrationId: "KL/0873/2004",
    mobile: "9446203318",
    photo: { src: CARD, filename: "bar-id-kl-0873-2004.jpg" },
    daysWaiting: 19,
    registrantKind: "advocate",
    requestKind: "first",
    /* Nothing came back from the register. The officer still has the card, which is the
       evidence REG-14 names, so the decision is not held up. */
    lookup: { state: "unavailable" },
  },
  {
    id: "adv-181",
    applicationNumber: "KL-ADV-000181-2026",
    fullName: "Meera Suresh",
    barRegistrationId: "KL/3312/2021",
    mobile: "9895447120",
    email: "meera.suresh@example.com",
    photo: { src: CARD, filename: "bar-id-kl-3312-2021.jpg" },
    daysWaiting: 12,
    registrantKind: "advocate",
    requestKind: "first",
    /* The one mismatch. `warning`, never destructive: the register disagreeing with the
       form is a finding that needs a human to look at a photograph, not a verdict. */
    lookup: {
      state: "disagrees",
      entry: {
        barNumber: "KL/3312/2021",
        name: "Meera Sudhakaran",
        bar: KERALA,
      },
    },
  },
  {
    id: "adv-184",
    applicationNumber: "KL-ADV-000184-2026",
    fullName: "Sandeep Deshmukh",
    barRegistrationId: "MAH/2201/2010",
    mobile: "9820114576",
    email: "sandeep.deshmukh@example.com",
    photo: { src: CARD, filename: "bar-id-mah-2201-2010.jpg" },
    daysWaiting: 11,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "MAH/2201/2010",
        name: "Sandeep Deshmukh",
        bar: "Bar Council of Maharashtra",
      },
    },
  },
  {
    id: "adv-191",
    applicationNumber: "KL-ADV-000191-2026",
    fullName: "Thomas Kurian",
    barRegistrationId: "KL/3077/2020",
    /* REG-18: the account was auto-created from the Bar Council record and he changed
       two things at first login. The officer verifies the change, not the record. */
    mobile: "9895204471",
    email: "thomas.kurian@example.com",
    photo: { src: CARD, filename: "bar-id-kl-3077-2020.jpg" },
    daysWaiting: 8,
    registrantKind: "advocate",
    requestKind: "edited",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/3077/2020",
        name: "Thomas Kurian",
        bar: KERALA,
      },
    },
    edits: [
      { field: "mobile", was: "9847051204" },
      /* The Bar Council record holds no email, so this is an addition rather than a
         change — and "was: —" would be a value the record never had. */
      { field: "email", was: null },
    ],
  },
  {
    id: "adv-196",
    applicationNumber: "KL-ADV-000196-2026",
    fullName: "ഷൈലജ രാമകൃഷ്ണൻ",
    fullNameLang: "ml",
    barRegistrationId: "KL/2306/2016",
    mobile: "9744810352",
    photo: { src: PALE_CARD, filename: "bar-id-kl-2306-2016.jpg" },
    daysWaiting: 6,
    registrantKind: "advocate",
    requestKind: "first",
    /* The one row where the register answers in Malayalam too, so the tag is on the
       register's own name and not borrowed from the claimant's. */
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/2306/2016",
        name: "ഷൈലജ രാമകൃഷ്ണൻ",
        bar: KERALA,
      },
      entryNameLang: "ml",
    },
  },
  {
    id: "adv-198",
    applicationNumber: "KL-ADV-000198-2026",
    fullName: "Nazeer Muhammed",
    barRegistrationId: "KL/2140/2015",
    mobile: "9961227804",
    email: "nazeer.muhammed@example.com",
    /* The photograph that will not open. The well says so in words and keeps Download
       reachable; approval is not blocked, because the officer may hold the card another
       way — but they are not shown an empty box and left to infer. */
    photo: { src: MISSING_CARD, filename: "bar-id-kl-2140-2015.jpg" },
    daysWaiting: 5,
    registrantKind: "advocate",
    requestKind: "resubmission",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/2140/2015",
        name: "Nazeer Muhammed",
        bar: KERALA,
      },
    },
    rejections: [
      {
        round: 1,
        daysAgo: 9,
        reason:
          "The photo of your Bar ID card is too blurred to read. Please upload a clearer one.",
      },
    ],
  },
  {
    id: "adv-201",
    applicationNumber: "KL-ADV-000201-2026",
    fullName: "Prakash Vaidya",
    barRegistrationId: "G/60/1992",
    mobile: "9825031147",
    photo: { src: CARD, filename: "bar-id-g-60-1992.jpg" },
    daysWaiting: 4,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "G/60/1992",
        name: "Prakash Vaidya",
        bar: "Bar Council of Gujarat",
      },
    },
  },
  {
    id: "adv-203",
    applicationNumber: "KL-ADV-000203-2026",
    fullName: "Aparna Krishnan",
    /* The longest identifier on the screen, and from another state's bar — the column is
       sized off this rather than off Kerala's short form. */
    barRegistrationId: "KAR/12453/2018",
    mobile: "9880412206",
    email: "aparna.krishnan@example.com",
    photo: { src: CARD, filename: "bar-id-kar-12453-2018.jpg" },
    daysWaiting: 3,
    registrantKind: "advocate",
    requestKind: "first",
    /* An incomplete register is normal, not a defect — `lib/filing/registry.ts` says so
       in its own header. The card is what decides this one. */
    lookup: { state: "not-found" },
  },
  {
    id: "adv-204",
    applicationNumber: "KL-ADV-000204-2026",
    fullName: "Vishnu Prasad",
    barRegistrationId: "KL/2588/2017",
    mobile: "9847339015",
    photo: { src: CARD, filename: "bar-id-kl-2588-2017.jpg" },
    daysWaiting: 3,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/2588/2017",
        name: "Vishnu Prasad",
        bar: KERALA,
      },
    },
  },
  {
    id: "adv-206",
    applicationNumber: "KL-ADV-000206-2026",
    fullName: "Ritu Sabharwal",
    barRegistrationId: "D/1450/2013",
    mobile: "9810226741",
    email: "ritu.sabharwal@example.com",
    photo: { src: CARD, filename: "bar-id-d-1450-2013.jpg" },
    daysWaiting: 2,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "D/1450/2013",
        name: "Ritu Sabharwal",
        bar: "Bar Council of Delhi",
      },
    },
  },
  {
    id: "adv-207",
    applicationNumber: "KL-ADV-000207-2026",
    fullName: "Joseph Mathew",
    barRegistrationId: "KL/1877/2014",
    mobile: "9605178432",
    photo: { src: CARD, filename: "bar-id-kl-1877-2014.jpg" },
    daysWaiting: 2,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/1877/2014",
        name: "Joseph Mathew",
        bar: KERALA,
      },
    },
  },
  {
    id: "adv-209",
    applicationNumber: "KL-ADV-000209-2026",
    fullName: "Sreelakshmi Pillai",
    barRegistrationId: "KL/1533/2012",
    mobile: "9497260813",
    email: "sreelakshmi.pillai@example.com",
    photo: { src: CARD, filename: "bar-id-kl-1533-2012.jpg" },
    daysWaiting: 1,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/1533/2012",
        name: "Sreelakshmi Pillai",
        bar: KERALA,
      },
    },
  },
  {
    id: "adv-211",
    applicationNumber: "KL-ADV-000211-2026",
    fullName: "Deepak Menon",
    barRegistrationId: "KL/0421/2004",
    mobile: "9846015529",
    photo: { src: CARD, filename: "bar-id-kl-0421-2004.jpg" },
    daysWaiting: 1,
    registrantKind: "advocate",
    requestKind: "first",
    lookup: {
      state: "agrees",
      entry: {
        barNumber: "KL/0421/2004",
        name: "Deepak Menon",
        bar: KERALA,
      },
    },
  },
];

/**
 * Longest wait first, then application number.
 *
 * The queue is a work list, so the thing that has been waiting longest is the thing to
 * look at — the order `filterQueue` and `REGISTER_QUEUE` already work in. The application
 * number tie-break keeps the order stable between renders when two requests share a day
 * count, and it is the older serial that wins, because it is the older request.
 */
export function sortByLongestWait(
  rows: AdvocateRegistration[],
): AdvocateRegistration[] {
  return [...rows].sort(
    (a, b) =>
      b.daysWaiting - a.daysWaiting ||
      a.applicationNumber.localeCompare(b.applicationNumber),
  );
}

/** The registrations this court has not yet decided, longest wait first. */
export const REGISTER_ADVOCATES_QUEUE: AdvocateRegistration[] =
  sortByLongestWait(PENDING);

/**
 * How many registrations are waiting — the number the rail carries beside "Register
 * advocates".
 *
 * Derived from the list rather than typed in beside the label, the way
 * `APPROVE_COPY_QUEUE_COUNT` and `REGISTER_QUEUE_COUNT` are, so the rail and the screen
 * cannot disagree about the size of the queue. Every row here is pending — a decided
 * request leaves the queue (see the module header) — so the length *is* the pending count.
 */
export const REGISTER_ADVOCATES_QUEUE_COUNT = REGISTER_ADVOCATES_QUEUE.length;

export type RegisterAdvocatesFilters = {
  /**
   * Free text over the full name, the Bar registration ID and the application number.
   *
   * Three fields and not one, because the officer holds a different one depending on how
   * the request reached them: a name if the advocate walked in, the application number if
   * they telephoned and read it off their own waiting screen, the Bar registration ID if
   * the question came from the bar. The reference screen offered *Application Number*
   * alone — the identifier an officer is least likely to have — so the reach is widened
   * and the visible label says "Search requests", which is what the control actually does.
   *
   * Not searched: mobile and email. Both are contact details rather than identifiers, and
   * a queue that finds a person by their telephone number is a directory.
   */
  query: string;
};

export const EMPTY_REGISTER_ADVOCATES_FILTERS: RegisterAdvocatesFilters = {
  query: "",
};

export function filterRegistrations(
  rows: AdvocateRegistration[],
  filters: RegisterAdvocatesFilters,
): AdvocateRegistration[] {
  return rows.filter((request) =>
    matchesQuery(
      filters.query,
      request.fullName,
      request.barRegistrationId,
      request.applicationNumber,
    ),
  );
}
