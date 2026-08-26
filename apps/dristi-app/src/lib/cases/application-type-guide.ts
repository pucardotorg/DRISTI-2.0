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
 * The search is a local keyword match, not a language model: a filer types the
 * request the way they would say it, the words every request shares ("I want
 * to file…") are dropped, and what is left is scored against each type's own
 * vocabulary. Nothing leaves the browser, and a miss costs nothing — every
 * type stays on the screen, ranked rather than hidden.
 */
import { APPLICATION_TYPES, type ApplicationTypeId } from "./applications";

export type ApplicationTypeGuide = {
  id: ApplicationTypeId;
  label: string;
  /** One line: what this asks the court to do. */
  description: string;
  /** How a filer might say it. Phrases match only against the whole sentence. */
  keywords: string[];
};

export const APPLICATION_TYPE_GUIDES: ApplicationTypeGuide[] = [
  {
    id: "advancement-reschedule",
    label: "Advancement/reschedule",
    description:
      "Move a listed hearing to an earlier or a later date, with the reason and the dates you propose.",
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
    description:
      "Apply for the accused's release on bail, with the grounds and any surety for the bail bond.",
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
    description:
      "Ask the court to accept a filing made after its deadline, with the reason for the delay.",
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
    description:
      "Ask the court to call for records held by someone else, naming the document and who holds it.",
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
    description:
      "Place a settlement between the parties before the court so the offence can be compounded and the case closed.",
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
      "Ask for the case to move from this court to another one, with the reason for the transfer.",
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
      "Withdraw what was filed, with the reason for withdrawing it.",
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
    description:
      "Anything the types above do not cover — say what you are asking the court to do, in your own words.",
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
  return { id, label, description: "", keywords: [] };
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
