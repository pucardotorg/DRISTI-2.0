/**
 * What is waiting for the bench's signature, by kind.
 *
 * One module owns these numbers so the two places that show them cannot disagree: the
 * rail's single "Sign" row carries `SIGN_TOTAL`, and the sign screen breaks the same
 * total down by queue. The rail used to list all seven queues as rows of its own; the
 * owner collapsed that to one row (2026-09-01) — the rail says how much signing there
 * is, the screen says of what.
 *
 * **The counts are demo data.** They are the reference screens' numbers, kept so both
 * surfaces can be judged at the widths they will really see (`1312` decides how a count
 * truncates, and the total it dominates is four digits). None of these labels describes
 * an action this build performs.
 *
 * Labels are the court's vocabulary, as nouns: the screen that lists them is already
 * titled "Sign", so the rows name what is signed, not the act of signing it.
 */

export type SignQueue = {
  id: string;
  /** Sentence case, per the DS Laws. The A-Diary is a proper name and keeps its case. */
  label: string;
  /** How many documents of this kind are waiting. Demo data; see above. */
  count: number;
};

export const SIGN_QUEUES: SignQueue[] = [
  { id: "forms", label: "Forms", count: 45 },
  { id: "orders", label: "Orders", count: 18 },
  { id: "process", label: "Process", count: 1312 },
  { id: "bail-bonds", label: "Bail bonds", count: 68 },
  { id: "depositions", label: "Witness depositions", count: 92 },
  { id: "evidence", label: "Evidence", count: 25 },
  { id: "a-diary", label: "A-Diary", count: 4 },
];

/** Everything waiting for signature — the number the rail's Sign row reports. */
export const SIGN_TOTAL = SIGN_QUEUES.reduce((sum, q) => sum + q.count, 0);
