/**
 * The facts behind one listing's case overview — the page the bench opens when it
 * starts a hearing.
 *
 * Restated here rather than imported from `lib/cases/peek.ts` because the employee
 * area does not read the citizen side (see `content.ts`). The *shape* of the glance
 * is the same one: parties, stage, the last sitting, a short history.
 * Advocate-only facts — "you appear", pending tasks, a link into the advocate case
 * file — are not restated. There is no court-side case file yet, which is also why
 * the overview page's View case action is not wired to one.
 *
 * **There is no backend.** Extras are demo rows keyed to `CAUSE_LIST`, enough for
 * the page to survive a first listing (no last sitting) and a part-heard evidence
 * matter (an order of the day). A hearing with no extras still renders: the listing
 * itself is the case.
 */

import {
  courtHearingPurposeLabel,
  parseIsoDay,
  type CourtHearing,
} from "./hearings";

export type CaseHistoryItem = {
  on: string;
  title: string;
  /**
   * What came out of that sitting. Carried because it is a fact about the step,
   * not because every reader shows it: the overview page prints the last
   * sitting's order in full in its own section, and a timeline that repeated the
   * same paragraph a few centimetres away would be saying it twice.
   */
  note?: string;
  status: "past" | "current" | "future";
};

export type HearingCaseExtras = {
  filedOn?: string;
  chequeAmount?: number;
  lastHearing?: {
    on: string;
    purpose: string;
    order: string;
    directed: boolean;
  };
};

export function formatCaseDate(day: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseIsoDay(day));
}

export function formatCaseWeekday(day: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseIsoDay(day));
}

export function formatChequeAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "A and B" — the same sentence the advocate peek uses for counsel. */
export function formatCounselList(names: string[]): string {
  return new Intl.ListFormat("en-IN", {
    style: "long",
    type: "conjunction",
  }).format(names);
}

export function hearingCaseExtras(id: string): HearingCaseExtras {
  return HEARING_CASE_EXTRAS[id] ?? {};
}

/**
 * Oldest to newest. This sitting is current; dates after today are future.
 * Built from the listing plus extras so a hearing with no sidecar still has a
 * history — today's listing is a fact the cause list already named.
 */
export function caseHistory(
  hearing: CourtHearing,
  extras: HearingCaseExtras,
  today: string,
): CaseHistoryItem[] {
  const items: Omit<CaseHistoryItem, "status">[] = [];

  if (extras.filedOn) {
    items.push({ on: extras.filedOn, title: "Complaint filed" });
  }

  if (extras.lastHearing) {
    items.push({
      on: extras.lastHearing.on,
      title: extras.lastHearing.purpose,
      note: extras.lastHearing.order,
    });
  }

  items.push({
    on: today,
    title: courtHearingPurposeLabel(hearing.purpose),
  });

  return items
    .slice()
    .sort((a, b) => a.on.localeCompare(b.on))
    .map((item) => {
      const status: CaseHistoryItem["status"] =
        item.on > today ? "future" : item.on === today ? "current" : "past";
      return { ...item, status };
    });
}

const HEARING_CASE_EXTRAS: Partial<Record<string, HearingCaseExtras>> = {
  "h-241": {
    filedOn: "2026-03-12",
    chequeAmount: 450000,
    lastHearing: {
      on: "2026-08-19",
      purpose: "Evidence of complainant",
      order:
        "PW-1 was examined in chief and partly cross-examined. Further cross-examination was deferred at the request of counsel for the accused. The complainant was directed to keep PW-2 present and produce the original bank return memo on the next posting date.",
      directed: true,
    },
  },
  "h-243": {
    filedOn: "2026-06-04",
    chequeAmount: 180000,
  },
  "h-244": {
    filedOn: "2026-05-22",
    chequeAmount: 275000,
  },
  "h-245": {
    filedOn: "2026-07-08",
    chequeAmount: 90000,
  },
  "h-246": {
    filedOn: "2026-07-15",
    chequeAmount: 150000,
  },
  "h-247": {
    filedOn: "2026-04-30",
    chequeAmount: 320000,
  },
  "h-248": {
    filedOn: "2026-02-18",
    chequeAmount: 210000,
    lastHearing: {
      on: "2026-08-12",
      purpose: "Plea",
      order:
        "Accused pleaded not guilty. Matter posted for evidence of the complainant.",
      directed: true,
    },
  },
  "h-249": {
    filedOn: "2026-06-28",
    chequeAmount: 125000,
  },
  "h-250": {
    filedOn: "2026-01-16",
    chequeAmount: 620000,
    lastHearing: {
      on: "2026-08-05",
      purpose: "Evidence of complainant",
      order:
        "PW-1's examination-in-chief concluded. Cross-examination to continue.",
      directed: false,
    },
  },
  "h-251": {
    filedOn: "2025-11-04",
    chequeAmount: 840000,
    lastHearing: {
      on: "2026-07-29",
      purpose: "For reports",
      order:
        "Forensic report awaited. Matter posted for reports to be received.",
      directed: true,
    },
  },
  "h-252": {
    filedOn: "2026-06-11",
    chequeAmount: 95000,
  },
  "h-253": {
    filedOn: "2025-09-18",
    chequeAmount: 340000,
    lastHearing: {
      on: "2026-08-26",
      purpose: "Examination of accused under S. 351 BNSS",
      order:
        "Examination of the accused begun. Matter part-heard and posted for continuation.",
      directed: false,
    },
  },
  "h-254": {
    filedOn: "2025-08-07",
    chequeAmount: 410000,
    lastHearing: {
      on: "2026-08-14",
      purpose: "Arguments",
      order: "Arguments heard. Judgment reserved.",
      directed: true,
    },
  },
  "h-255": {
    filedOn: "2026-05-09",
    chequeAmount: 175000,
  },
  "h-256": {
    filedOn: "2026-07-02",
    chequeAmount: 80000,
  },
  "h-257": {
    filedOn: "2026-04-21",
    chequeAmount: 260000,
  },
  "h-258": {
    filedOn: "2026-01-28",
    chequeAmount: 390000,
    lastHearing: {
      on: "2026-08-21",
      purpose: "Evidence of complainant",
      order: "PW-1 kept present. Examination-in-chief to continue.",
      directed: false,
    },
  },
  "h-259": {
    filedOn: "2026-06-19",
    chequeAmount: 110000,
  },
  "h-260": {
    filedOn: "2025-06-03",
    chequeAmount: 505000,
    lastHearing: {
      on: "2026-08-28",
      purpose: "Arguments",
      order: "Arguments concluded. Posted for judgment.",
      directed: true,
    },
  },
  "h-261": {
    filedOn: "2026-03-27",
    chequeAmount: 145000,
    lastHearing: {
      on: "2026-07-22",
      purpose: "Appearance",
      order: "Accused appeared. Posted for plea.",
      directed: true,
    },
  },
  "h-262": {
    filedOn: "2026-07-11",
    chequeAmount: 70000,
  },
  "h-263": {
    filedOn: "2025-12-16",
    chequeAmount: 230000,
    lastHearing: {
      on: "2026-08-07",
      purpose: "Arguments",
      order: "Part-heard. Counsel for the accused to conclude.",
      directed: false,
    },
  },
  "h-264": {
    filedOn: "2026-05-14",
    chequeAmount: 160000,
  },
};
