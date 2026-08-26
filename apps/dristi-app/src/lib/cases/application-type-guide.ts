/**
 * What each application type asks the court for, and the search that finds it
 * from a sentence.
 *
 * The descriptions are the only place the chooser explains a type, so each one
 * states the ask in the words of the filer and stays inside what that type's
 * form actually collects (`application-type-fields.tsx`) and what the national
 * process supports (`docs/product/domain/journey.md`). No type promises a
 * field or an outcome the flow does not have.
 *
 * The substance of the law, never its citation. "Sufficient cause" and
 * "compounded" are the real statutory standards and are the words a filer
 * meets in court, so they stay; the section numbers behind them do not appear
 * anywhere in the UI. A number on a card face is something to look up, not
 * something to decide by.
 *
 * Each line also has to survive two other places: the chosen-type card on the
 * second step, where there is no grid to refer to, and the card's aria-label,
 * read aloud as "<label>: <description>". So none of them points at the screen
 * around it, and each stays short enough for a three-up card to hold without
 * clamping.
 *
 * The search is a local keyword match, not a language model: a filer types the
 * request the way they would say it, the words every request shares ("I want
 * to file…") are dropped, and what is left is scored against each type's own
 * vocabulary. Nothing leaves the browser, and a miss costs nothing — every
 * type stays on the screen, ranked rather than hidden.
 */
import type { LucideIcon } from "lucide-react";
import {
  CalendarDaysIcon,
  FileSearchIcon,
  HourglassIcon,
  LandmarkIcon,
  LockOpenIcon,
  PenLineIcon,
  Undo2Icon,
  UsersIcon,
} from "lucide-react";

import { APPLICATION_TYPES, type ApplicationTypeId } from "./applications";

export type ApplicationTypeGuide = {
  id: ApplicationTypeId;
  label: string;
  /** One line: what this asks the court to do. */
  description: string;
  /**
   * The card's picture of the ask — one per type, all eight distinct, all from
   * the DS icon allowlist. Decorative to assistive tech: the title beside it
   * already names the type.
   */
  icon: LucideIcon;
  /** How a filer might say it. Phrases match only against the whole sentence. */
  keywords: string[];
};

export const APPLICATION_TYPE_GUIDES: ApplicationTypeGuide[] = [
  {
    id: "advancement-reschedule",
    label: "Advancement/reschedule",
    description:
      "Move a listed hearing earlier or later, with the dates you propose.",
    icon: CalendarDaysIcon,
    keywords: [
      "advance",
      "advancement",
      "prepone",
      "postpone",
      "reschedule",
      "adjourn",
      "adjournment",
      "defer",
      "hearing",
      "earlier date",
      "later date",
      "another date",
      "change the date",
      "next date",
    ],
  },
  {
    id: "bail",
    label: "Bail",
    // The petitioner here is the accused, not the complainant — the one place
    // in the chooser where naming the wrong party would send someone into the
    // wrong form entirely.
    description:
      "Ask for the accused to be released on bail, with grounds and any surety.",
    icon: LockOpenIcon,
    keywords: [
      "bail",
      "surety",
      "sureties",
      "bond",
      "release",
      "custody",
      "arrest",
      "warrant",
      "bail bond",
    ],
  },
  {
    id: "condonation-of-delay",
    label: "Condonation of delay",
    // "Sufficient cause" is the standard the court actually applies to a delay
    // beyond the limitation period, and the form asks for exactly that reason.
    description:
      "Ask the court to accept a filing made late, showing sufficient cause.",
    icon: HourglassIcon,
    keywords: [
      "condone",
      "condonation",
      "delay",
      "delayed",
      "late",
      "limitation",
      "deadline",
      "time barred",
      "beyond time",
      "out of time",
      "missed the date",
    ],
  },
  {
    id: "production-of-documents",
    label: "Production of documents",
    // The form takes a reason and an optional list of documents — it has no
    // field for who holds a record, so the line cannot promise one.
    description:
      "Ask for documents to be brought on record, with the reason you need them.",
    icon: FileSearchIcon,
    keywords: [
      "produce",
      "production",
      "summon",
      "records",
      "statement",
      "call for",
      "bank records",
      "account records",
      "documents from",
      "bring the documents",
    ],
  },
  {
    id: "settlement",
    label: "Settlement",
    // The offence is compoundable at any stage, so the parties may settle and
    // close the case. The form places the settlement on record; the compounding
    // is the court's, which is why the line says "can be". It is the offence
    // that is compounded, never the case — a filer who reads it the other way
    // is being taught the wrong word for the thing they are asking for.
    description:
      "Place a settlement on record so the offence can be compounded and the case closed.",
    icon: UsersIcon,
    keywords: [
      "settle",
      "settlement",
      "settled",
      "compound",
      "compounding",
      "compromise",
      "mediation",
      "mutual",
      "close the case",
      "paid the amount",
    ],
  },
  {
    id: "transfer",
    label: "Transfer",
    description:
      "Ask for the case to be moved to a different court, with your grounds.",
    icon: LandmarkIcon,
    keywords: [
      "transfer",
      "shift",
      "another court",
      "different court",
      "move the case",
      "jurisdiction",
    ],
  },
  {
    id: "withdrawal",
    label: "Withdrawal",
    description:
      "Take back something already filed, with your reason for withdrawing it.",
    icon: Undo2Icon,
    keywords: [
      "withdraw",
      "withdrawal",
      "take back",
      "drop",
      "do not pursue",
      "cancel the filing",
    ],
  },
  {
    id: "application-others",
    label: "Others",
    // Never "the types above": this same line is read on the second step, where
    // there is no grid, and aloud from the card's aria-label.
    description:
      "A request the other types do not cover — say what you need in your own words.",
    icon: PenLineIcon,
    keywords: ["other", "others", "something else", "not listed", "general"],
  },
];

const GUIDES_BY_ID = new Map(
  APPLICATION_TYPE_GUIDES.map((guide) => [guide.id, guide])
);

export function applicationTypeGuide(
  id: ApplicationTypeId
): ApplicationTypeGuide {
  const guide = GUIDES_BY_ID.get(id);
  if (guide) return guide;
  // The catalogue is the source of the ids, so a label always exists.
  const label =
    APPLICATION_TYPES.find((type) => type.id === id)?.label ?? id;
  return { id, label, description: "", icon: PenLineIcon, keywords: [] };
}

/**
 * Words that appear in every request and so separate no two types. Dropping
 * them is what stops "I want to file an application in this case" from
 * scoring against all eight at once.
 */
const STOPWORDS = new Set([
  "and",
  "any",
  "application",
  "apply",
  "are",
  "ask",
  "asking",
  "can",
  "case",
  "court",
  "file",
  "filing",
  "for",
  "from",
  "have",
  "his",
  "her",
  "need",
  "our",
  "please",
  "raise",
  "request",
  "submit",
  "that",
  "the",
  "their",
  "them",
  "this",
  "want",
  "was",
  "were",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulWords(normalized: string): string[] {
  return normalized
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * One word shared with a description is noise — "filed" appears in half of
 * them. A real match has vocabulary or the type's own name behind it.
 */
export const APPLICATION_TYPE_MATCH_FLOOR = 2;

export type ApplicationTypeMatch = {
  guide: ApplicationTypeGuide;
  /** 0 means the sentence said nothing about this type. */
  score: number;
};

/**
 * Every type, best first. Callers rank with this rather than filter — a
 * chooser that hides the seven types you did not describe is a chooser you
 * cannot browse.
 */
export function searchApplicationTypes(query: string): ApplicationTypeMatch[] {
  const normalized = normalize(query);
  const words = meaningfulWords(normalized);

  return APPLICATION_TYPE_GUIDES.map((guide, index) => ({
    guide,
    index,
    score: words.length === 0 ? 0 : scoreGuide(guide, normalized, words),
  }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ guide, score }) => ({ guide, score }));
}

/**
 * Vocabulary counts most, then the type's own name, then its description —
 * a word the filer shares with the keyword list is a far stronger signal than
 * one it shares with a sentence written to read well.
 */
function scoreGuide(
  guide: ApplicationTypeGuide,
  normalized: string,
  words: string[]
): number {
  let score = 0;

  for (const keyword of guide.keywords) {
    if (keyword.includes(" ")) {
      // A phrase has to appear as one, or "call for" matches every "for".
      if (normalized.includes(keyword)) score += 4;
      continue;
    }
    for (const word of words) {
      if (word === keyword) score += 3;
      else if (
        word.length > 3 &&
        (word.startsWith(keyword) || keyword.startsWith(word))
      ) {
        // "settling" and "settle" are the same ask typed differently.
        score += 2;
      }
    }
  }

  const label = meaningfulWords(normalize(guide.label));
  const description = meaningfulWords(normalize(guide.description));
  for (const word of words) {
    if (label.includes(word)) score += 2;
    else if (word.length > 4 && description.includes(word)) score += 1;
  }

  return score;
}
