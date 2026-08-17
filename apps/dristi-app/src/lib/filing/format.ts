/** Formatting helpers for the e-filing flow. Dates in the draft are ISO `yyyy-mm-dd`. */

import { format, isValid, parse, parseISO } from "date-fns";

import type { Address, ISODate } from "./types";

/** ISO → `dd/mm/yyyy` (court forms) or "" when unset. */
export function toDisplayDate(iso: ISODate): string {
  if (!iso) return "";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "dd/MM/yyyy") : iso;
}

/** ISO → `15 March 2026` for the court document. */
export function toLongDate(iso: ISODate): string {
  if (!iso) return "";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMMM yyyy") : iso;
}

/** `dd/mm/yyyy` → ISO. Accepts what the demo used as literal strings. */
export function fromDisplayDate(display: string): ISODate {
  if (!display) return "";
  const d = parse(display, "dd/MM/yyyy", new Date());
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
}

export function isoToDate(iso: ISODate): Date | undefined {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
}

export function dateToIso(d: Date | undefined): ISODate {
  return d && isValid(d) ? format(d, "yyyy-MM-dd") : "";
}

/** Digits → Indian grouping (`5025000` → `50,25,000`). Keeps an already-formatted string. */
export function formatINR(value: string | number): string {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return grouped;
}

export function amountToNumber(value: string): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function rupees(value: string | number): string {
  const f = formatINR(value);
  return f ? `₹${f}` : "";
}

export function addressToString(a: Address | undefined): string {
  if (!a) return "";
  return [a.line1, a.city, a.district, a.state, a.pin].filter(Boolean).join(", ");
}

export function joinDot(...parts: Array<string | null | undefined | false>): string {
  return parts.filter(Boolean).join(" · ");
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Whole days between two ISO dates (b − a); null when either is unset. */
export function daysBetween(a: ISODate, b: ISODate): number | null {
  const da = isoToDate(a);
  const db = isoToDate(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}
