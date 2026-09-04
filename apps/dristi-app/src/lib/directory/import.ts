/**
 * The office-list import: parse, then check, then commit.
 *
 * No LLM (courts do not permit one). The file carries PEOPLE only —
 * `Name, Mobile, Bar ID` — detected by content pattern, never by column
 * name. Grouping and case assignment happen in the app afterwards, so
 * there are no group names in the file to misspell.
 *
 * The Check step turns each discrepancy into one row with an inline fix.
 * Nothing is created until every hard stop is cleared.
 */

import { KNOWN_ACCOUNTS, partyByPhone } from "./cases";
import { normalizeName } from "./derive";
import type { DirectoryCase, Person } from "./types";

/** Kerala enrolment numbers read K/####/YYYY. */
export const BAR_ID_PATTERN = /^K\/\d{4}\/\d{4}$/;

export type RawRow = { row: number; name: string; mobile: string; barId: string };

export type Problem =
  /** Two rows, one number. Resolve by merging: pick the name to keep. */
  | { kind: "duplicate"; withRow: number }
  /** Cannot invite a nameless number. Give a name, or drop the row. */
  | { kind: "missing-name" }
  /** Not a 10-digit Indian mobile. Fix it, or drop the row. */
  | { kind: "bad-mobile" }
  /** Bar ID present but not in the enrolment format. Fix it (advocate) or clear it (staff). */
  | { kind: "bad-bar-id" }
  /** The number belongs to a party on one of the firm's cases. Drop only. */
  | { kind: "party"; party: string; caseId: string }
  /** Already on DRISTI. Informational: linked, no invite. */
  | { kind: "known"; name: string; reason: "vakalatnama" | "account" };

export type CheckedRow = RawRow & {
  /** Normalized 10-digit mobile, when one could be read. */
  phone: string | null;
  problems: Problem[];
  /** Does any problem block the import? (`known` never does.) */
  blocking: boolean;
};

export type Resolution =
  | { kind: "drop" }
  | { kind: "fix"; name?: string; mobile?: string; barId?: string }
  /** For a duplicate: fold this row into `intoRow`, keeping `name`. */
  | { kind: "merge"; intoRow: number; name: string };

/** Strip formatting, a +91 or leading 0, and return 10 digits or the residue. */
export function normalizeMobile(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Read a CSV by content, not column names: the 10-digit number is the
 * mobile, the K/####/YYYY value is the Bar ID, the remaining text is the
 * name. A header row (no digits anywhere) is skipped.
 */
export function parseCsv(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: RawRow[] = [];
  let row = 0;
  for (const line of lines) {
    const cells = splitCsvLine(line).map((c) => c.trim());
    if (!/\d/.test(line) && rows.length === 0) continue; // header
    row += 1;
    let mobile = "";
    let barId = "";
    const rest: string[] = [];
    for (const cell of cells) {
      if (!cell) continue;
      const digits = cell.replace(/\D/g, "");
      if (!mobile && /^\+?[\d\s\-()]+$/.test(cell) && digits.length >= 5) {
        mobile = cell;
      } else if (!barId && /^[A-Z]{1,3}\/\d+\/\d+$/i.test(cell)) {
        barId = cell;
      } else {
        rest.push(cell);
      }
    }
    rows.push({ row, name: rest.join(" "), mobile, barId });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Run every check against the rows. Duplicates flag the LATER row so the
 * first occurrence stays a clean person and the merge folds into it.
 */
export function checkRows(
  rows: RawRow[],
  options: { cases?: DirectoryCase[]; existing?: Person[] } = {},
): CheckedRow[] {
  const seen = new Map<string, number>();
  const existingByPhone = new Map((options.existing ?? []).map((p) => [p.phone, p]));
  const namaNames = new Set(
    (options.cases ?? []).flatMap((c) => c.counsel.map((n) => normalizeName(n))),
  );

  return rows.map((raw) => {
    const problems: Problem[] = [];
    const digits = normalizeMobile(raw.mobile);
    const phone = isValidMobile(digits) ? digits : null;

    if (!raw.name.trim()) problems.push({ kind: "missing-name" });
    if (!phone) problems.push({ kind: "bad-mobile" });
    if (raw.barId && !BAR_ID_PATTERN.test(raw.barId)) problems.push({ kind: "bad-bar-id" });

    if (phone) {
      const party = partyByPhone(phone, options.cases);
      if (party) problems.push({ kind: "party", party: party.party, caseId: party.caseId });

      const first = seen.get(phone);
      if (first !== undefined) problems.push({ kind: "duplicate", withRow: first });
      else seen.set(phone, raw.row);

      const known = KNOWN_ACCOUNTS[phone];
      const already = existingByPhone.get(phone);
      if (already) {
        problems.push({ kind: "known", name: already.name, reason: "account" });
      } else if (known) {
        problems.push({ kind: "known", name: known.name, reason: known.reason });
      } else if (raw.barId && namaNames.has(normalizeName(raw.name))) {
        problems.push({ kind: "known", name: raw.name, reason: "vakalatnama" });
      }
    }

    return {
      ...raw,
      phone,
      problems,
      blocking: problems.some((p) => p.kind !== "known"),
    };
  });
}

/** The Upload step's one line: "Found 50 people — 15 advocates, 30 office staff, 5 need your attention." */
export function summarize(checked: CheckedRow[]): {
  found: number;
  advocates: number;
  staff: number;
  attention: number;
} {
  let advocates = 0;
  let staff = 0;
  let attention = 0;
  for (const row of checked) {
    if (row.blocking) attention += 1;
    else if (row.barId) advocates += 1;
    else staff += 1;
  }
  return { found: checked.length, advocates, staff, attention };
}

/** Apply a resolution to one checked row and re-run its checks. */
export function applyResolution(
  checked: CheckedRow[],
  row: number,
  resolution: Resolution,
  options: { cases?: DirectoryCase[]; existing?: Person[] } = {},
): CheckedRow[] {
  if (resolution.kind === "drop") {
    return recheck(checked.filter((r) => r.row !== row), options);
  }
  if (resolution.kind === "merge") {
    const keep = checked.find((r) => r.row === resolution.intoRow);
    if (!keep) return checked;
    return recheck(
      checked
        .filter((r) => r.row !== row)
        .map((r) => (r.row === resolution.intoRow ? { ...r, name: resolution.name } : r)),
      options,
    );
  }
  return recheck(
    checked.map((r) =>
      r.row === row
        ? {
            ...r,
            name: resolution.name ?? r.name,
            mobile: resolution.mobile ?? r.mobile,
            barId: resolution.barId ?? r.barId,
          }
        : r,
    ),
    options,
  );
}

function recheck(
  rows: RawRow[],
  options: { cases?: DirectoryCase[]; existing?: Person[] },
): CheckedRow[] {
  return checkRows(
    rows.map(({ row, name, mobile, barId }) => ({ row, name, mobile, barId })),
    options,
  );
}

/** What Import will do: who gets an SMS, who gets linked, how many rows were dropped. */
export function importPlan(
  checked: CheckedRow[],
  originalCount: number,
): { invite: number; link: number; dropped: number; ready: boolean } {
  const ready = checked.every((r) => !r.blocking);
  const link = checked.filter((r) => r.problems.some((p) => p.kind === "known")).length;
  return {
    invite: checked.length - link,
    link,
    dropped: originalCount - checked.length,
    ready,
  };
}

/** Turn cleared rows into directory people. Known numbers land registered. */
export function toPeople(checked: CheckedRow[], addedOn: string): Person[] {
  return checked
    .filter((r) => !r.blocking && r.phone)
    .map((r) => {
      const known = r.problems.find((p) => p.kind === "known");
      const account = KNOWN_ACCOUNTS[r.phone!];
      return {
        id: `p-${r.phone}`,
        name: known && known.kind === "known" ? known.name : r.name.trim(),
        phone: r.phone!,
        barId: (r.barId || account?.barId) || undefined,
        status: known ? "registered" : "invited",
        addedOn,
      };
    });
}
