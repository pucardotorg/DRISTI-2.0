/**
 * Notice/Process Status — what happened to the instruments the court issued
 * to a party. The file and its exports keep the older "service of process"
 * naming; only the strings carry the product's name (see `FEATURE_NAME`).
 *
 * This is not the Orders register. Orders holds the instrument as a record;
 * this holds whether it reached the person it was addressed to.
 *
 * The subject is the accused first. Under §138 process is what gates the
 * case — no service, no appearance, no plea, no trial (journey.md §5-6) — so
 * this answers that question before any other: can the court get the accused
 * before it? They are ordered the way the cause title orders them, never by
 * who is most unresolved. Where the drawer is a company, every person in
 * charge of it is also an accused and is served in their own right
 * (actors.md, company liability), which is where the multi-party shapes come
 * from.
 *
 * A witness summons is service of process too (journey.md §5; actors.md,
 * "process server / summons bailiff") and it is deliberately not here. It is
 * trial logistics: it decides whether one sitting can go ahead, not whether
 * the case can start. The pack may still name witness parties; they are read
 * and dropped.
 *
 * **Everything below is authored, not computed.** Dates arrive as the words
 * the record uses ("2 July 2026"), statuses as the words the register prints,
 * and "Not recorded" is a value the court file actually holds rather than a
 * gap this module papers over. An earlier build derived round numbers, status
 * lines and rollup dates from a delivery log; the register does not work that
 * way, and every derivation was a place the screen could disagree with the
 * file it claims to show.
 *
 * Featured dummy content comes from `service-dummy.json`, keyed by case.
 */
import pack from "./service-dummy.json";
import { type CaseRecord } from "./types";

/**
 * One round of process, as the master list shows it and as the detail pane
 * expands it. Both panes read the same round, so they read the same fields;
 * where the detail has room to say a thing at more length, that is a second
 * authored string rather than a second source of truth.
 */
export type ServiceRound = {
  id: string;
  /** "Summons · R2" · "Proclamation" — the instrument as the register names it. */
  instrument: string;
  /** The badge in the list. */
  status: string;
  /** The badge in the detail, where "Returned" can be "Returned undelivered". */
  detailStatus?: string;
  /**
   * Whether this round still needs attention. Amber when it does, grey when
   * it is closed — the distinction is authored because "Returned unexecuted"
   * is a finished round and "Compliance incomplete" is a live one, and no
   * amount of parsing the status string tells the two apart reliably.
   */
  outstanding: boolean;
  /** "2 July 2026" — the record's words, for the detail pane. */
  issuedOn: string;
  /** "2 Jul 2026" — the abbreviated form the list has room for. Authored
   *  rather than formatted: `issuedOn` is prose from the record, not a date
   *  this module is entitled to parse. Falls back to `issuedOn`. */
  issuedOnShort?: string;
  /** "Court bailiff" · "Police + RPAD". Absent where nothing was dispatched. */
  channel?: string;
  /** "Police · Punalur station" — the station or article, for the detail. */
  detailChannel?: string;
  /** The line under the date in the list. A précis, not a second outcome. */
  summary?: string;
  /** Where it was sent. "Not recorded" is a value, not an absence. */
  destination?: string;
  /** "Paid 8 May 2026" · "Not recorded". */
  feeRecord?: string;
  /** What came back, in prose. Sits in its own well in the detail. */
  outcome?: string;
};

export type ServiceParty = {
  id: string;
  name: string;
  /** How the cause title names them — "Accused 2", "PW-2". */
  role: string;
  /** "Appearance not secured" — one badge per party, never one per round. */
  verdict: string;
  /**
   * Whether the court has still to secure this party. Drives the verdict
   * badge, and decides which parties get a block.
   */
  outstanding: boolean;
  /** Who they are, and what the case stage does or does not say about them. */
  description?: string;
  /**
   * **Newest first**, in authored order. This is the storage order, and it
   * is no longer the render order — see `RoundTabs`, which walks it
   * backwards so the chain reads left to right.
   *
   * Newest-first was chosen for a vertical master list, where the reader
   * starts from where the case stands now and works back, so current state
   * had to be the first thing under the pointer. Laid out as a line instead,
   * that same order is a chain read backwards, which is a set of unrelated
   * failures rather than a sequence — summons failed, so a warrant, so a
   * proclamation. The line runs oldest to newest; the newest round is still
   * what opens selected, now at the end of the chain rather than the start.
   *
   * Reversing an authored array is not sorting one. The dates are the
   * record's own words rather than sortable values, and turning them back
   * into a guess at chronology is still the derivation this module does not
   * do — the order comes from how the pack was written, read in either
   * direction.
   */
  rounds: ServiceRound[];
};

/**
 * The accused this case has outstanding process against, in cause-title
 * order — or every accused, when none of them are outstanding.
 *
 * Never empty: `serviceOfProcess` returns null rather than an empty list, so
 * a section that renders always has a party in it.
 */
export type ServiceOfProcess = ServiceParty[];

/**
 * What the product calls this, and the one place the words live. This is the
 * legacy portal's own label, kept verbatim at the product owner's direction —
 * the slash and capitals are the feature's name as the registry knows it, not
 * a heading this module is free to sentence-case. Internal identifiers keep
 * "service of process"; renaming files and exports is churn a reader never
 * sees.
 */
export const FEATURE_NAME = "Notice/Process Status";

export const SERVICE_SECTION_ID = "service-of-process";

/**
 * How a cause title names a party. "Accused" with no number is a sole accused
 * and is not renamed to "Accused 1" — the cause title does not number a party
 * it never had to distinguish. Witnesses carry their examination number.
 */
const ACCUSED_ROLE = /^accused(?:\s+(\d+))?$/i;
const WITNESS_ROLE = /^([a-z]+)\s*-\s*(\d+)$/i;

/**
 * Where an accused stands in the cause title, or `null` when the party is not
 * an accused and so is not this card's subject. The role string is the only
 * place cause-title order survives, so it is parsed rather than guessed at.
 *
 * A witness role is recognised and returns null — dropped on purpose, not by
 * accident, which is why the pattern stays. Anything else throws: filing an
 * unrecognised party under "not an accused" because the pattern did not match
 * is the kind of quiet miss that loses a defendant for a year.
 */
function accusedRank(role: string): number | null {
  const trimmed = role.trim();
  const accused = ACCUSED_ROLE.exec(trimmed);
  /**
   * A sole "Accused" carries no number and still leads: the cause title does
   * not number a party it never had to distinguish, so the absent number
   * reads as rank 1 rather than as unranked.
   */
  if (accused) return Number(accused[1] ?? 1);
  if (WITNESS_ROLE.test(trimmed)) return null;
  throw new Error(`Unknown party role in dummy pack: ${role}`);
}

type DummyCase = { parties: ServiceParty[] };

const PACK = pack.cases as Partial<Record<string, DummyCase>>;

/**
 * Renders whenever the case has any process history against an accused —
 * including when every accused is served. "Served" is the answer an advocate
 * opens a case to confirm, and an earlier rule that hid the finished card
 * read as the feature not existing rather than the service being done.
 * Absent only when no process has ever issued (nothing to report) or the case
 * is disposed (the outcome, not the service record, is the fact that matters
 * then).
 *
 * Which accused get a block is the one filter left: a party the court has
 * already secured is named in the outstanding party's description, where the
 * point of naming them is that the case stage belongs to them. Should every
 * accused be secured, they all get a block rather than none — the section
 * never disappears on a case that has process history.
 */
export function serviceOfProcess(record: CaseRecord): ServiceOfProcess | null {
  if (record.disposal) return null;
  const entry = PACK[record.id];
  if (!entry) return null;

  const accused = entry.parties
    .filter((party) => party.rounds.length > 0)
    .map((party) => ({ party, rank: accusedRank(party.role) }))
    .filter(
      (item): item is { party: ServiceParty; rank: number } =>
        item.rank !== null
    )
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.party);
  if (accused.length === 0) return null;

  const outstanding = accused.filter((party) => party.outstanding);
  return outstanding.length > 0 ? outstanding : accused;
}
