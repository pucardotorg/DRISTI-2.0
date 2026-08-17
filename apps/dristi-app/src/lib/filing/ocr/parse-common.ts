/**
 * Shared machinery for the document parsers: a `Doc` view over OCR words (lines, a flat
 * text with word offsets, fuzzy phrase search, spans → boxes), date and amount finders,
 * Indian number-words, and small string helpers.
 *
 * Pure — no DOM — so the parsers run in node for tests and in the browser for real.
 */

import type { ExtractBox, ExtractedField } from "../types";

/* ───────────────────────────── Types ───────────────────────────── */

export type OcrWord = { text: string; confidence: number; bbox: ExtractBox };

export type ParseInput = {
  /** Raw text as the engine produced it (used only as a fallback when there are no words). */
  text: string;
  words: OcrWord[];
  /** Engine-provided line grouping, when it has one (Tesseract lines). */
  lines?: OcrWord[][];
  page: { width: number; height: number };
};

export type ParsedFields = Record<string, ExtractedField>;

export type Parser = (input: ParseInput) => ParsedFields;

/** A stretch of the flat text mapped back onto the words it came from. */
export type Span = {
  start: number;
  end: number;
  text: string;
  box?: ExtractBox;
  /** Mean confidence of the words under the span (0–100). */
  confidence: number;
};

/* ───────────────────────────── Doc ───────────────────────────── */

type FlatWord = { word: OcrWord; start: number; end: number; line: number };

export type DocLine = { words: OcrWord[]; text: string; start: number; end: number; box?: ExtractBox };

/**
 * A parsed view of one page: `flat` is the text the regexes run over (words joined by
 * single spaces, lines by "\n"), and every offset in it maps back to a word and its box.
 */
export class Doc {
  readonly flat: string;
  readonly upper: string;
  readonly lines: DocLine[];
  readonly page: { width: number; height: number };
  readonly hasBoxes: boolean;
  readonly meanConfidence: number;
  private readonly flatWords: FlatWord[];
  /** Alphanumeric-only lowercase text and, per char, its offset in `flat`. */
  private readonly compact: string;
  private readonly compactMap: number[];

  constructor(input: ParseInput) {
    this.page = input.page;
    let lineGroups: OcrWord[][];
    let words = input.words.filter((w) => w.text.trim().length > 0);
    if (words.length === 0 && input.text.trim()) {
      // No word data — fall back to plain text lines without boxes.
      words = [];
      lineGroups = input.text.split(/\r?\n/).map((ln) =>
        ln
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => {
            const w: OcrWord = { text: t, confidence: 60, bbox: { x0: 0, y0: 0, x1: 0, y1: 0 } };
            words.push(w);
            return w;
          })
      );
      this.hasBoxes = false;
    } else {
      this.hasBoxes = words.some((w) => w.bbox.x1 > w.bbox.x0 && w.bbox.y1 > w.bbox.y0);
      lineGroups = input.lines?.length ? input.lines.map((l) => l.filter((w) => w.text.trim())) : clusterLines(words);
    }
    lineGroups = lineGroups.filter((l) => l.length > 0);

    const flatWords: FlatWord[] = [];
    const lines: DocLine[] = [];
    let flat = "";
    lineGroups.forEach((group, li) => {
      const lineStart = flat.length;
      group.forEach((w, wi) => {
        if (wi > 0) flat += " ";
        const start = flat.length;
        flat += w.text;
        flatWords.push({ word: w, start, end: flat.length, line: li });
      });
      lines.push({
        words: group,
        text: flat.slice(lineStart),
        start: lineStart,
        end: flat.length,
        box: this.hasBoxes ? unionBoxes(group.map((w) => w.bbox)) : undefined,
      });
      flat += "\n";
    });
    this.flat = flat;
    this.upper = flat.toUpperCase();
    this.lines = lines;
    this.flatWords = flatWords;
    this.meanConfidence = words.length
      ? words.reduce((s, w) => s + w.confidence, 0) / words.length
      : 0;

    let compact = "";
    const map: number[] = [];
    for (let i = 0; i < flat.length; i++) {
      const c = flat[i];
      if (/[a-z0-9]/i.test(c)) {
        compact += c.toLowerCase();
        map.push(i);
      }
    }
    this.compact = compact;
    this.compactMap = map;
  }

  /** Words overlapping the flat range [start, end). */
  wordsIn(start: number, end: number): OcrWord[] {
    const out: OcrWord[] = [];
    for (const fw of this.flatWords) {
      if (fw.end <= start) continue;
      if (fw.start >= end) break;
      out.push(fw.word);
    }
    return out;
  }

  /** The line index a flat offset falls in (or -1). */
  lineAt(offset: number): number {
    for (let i = 0; i < this.lines.length; i++) {
      const l = this.lines[i];
      if (offset >= l.start && offset <= l.end) return i;
    }
    return -1;
  }

  span(start: number, end: number): Span {
    const words = this.wordsIn(start, end);
    const confidence = words.length
      ? words.reduce((s, w) => s + w.confidence, 0) / words.length
      : this.meanConfidence;
    return {
      start,
      end,
      text: this.flat.slice(start, end),
      box: this.hasBoxes && words.length ? unionBoxes(words.map((w) => w.bbox)) : undefined,
      confidence,
    };
  }

  /** Where the box sits on the page, 0–1 (undefined without boxes). */
  relPos(box: ExtractBox | undefined): { cx: number; cy: number } | undefined {
    if (!box || !this.page.width || !this.page.height) return undefined;
    return {
      cx: (box.x0 + box.x1) / 2 / this.page.width,
      cy: (box.y0 + box.y1) / 2 / this.page.height,
    };
  }

  /**
   * Approximate substring search for `phrase` (letters/digits only, case-insensitive) with
   * at most `maxEdits` edits. Returns the best (fewest edits, then earliest) match as a
   * range in `flat`, or null.
   */
  fuzzy(phrase: string, maxEdits: number, from = 0): { start: number; end: number; edits: number } | null {
    const needle = phrase.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!needle) return null;
    const hay = this.compact;
    const startCompact = compactIndexAtOrAfter(this.compactMap, from);
    const hit = fuzzySubstring(hay, needle, maxEdits, startCompact);
    if (!hit) return null;
    return {
      start: this.compactMap[hit.start],
      end: this.compactMap[hit.end - 1] + 1,
      edits: hit.edits,
    };
  }

  /** All non-overlapping fuzzy hits of `phrase`, left to right. */
  fuzzyAll(phrase: string, maxEdits: number): { start: number; end: number; edits: number }[] {
    const out: { start: number; end: number; edits: number }[] = [];
    let from = 0;
    for (let guard = 0; guard < 50; guard++) {
      const h = this.fuzzy(phrase, maxEdits, from);
      if (!h) break;
      out.push(h);
      from = h.end;
    }
    return out;
  }
}

function compactIndexAtOrAfter(map: number[], flatOffset: number): number {
  // map is ascending; binary search first index with map[i] >= flatOffset
  let lo = 0;
  let hi = map.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (map[mid] < flatOffset) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Group words into lines by vertical overlap (fallback when the engine gives no lines). */
function clusterLines(words: OcrWord[]): OcrWord[][] {
  const sorted = [...words].sort((a, b) => cy(a.bbox) - cy(b.bbox));
  const lines: { words: OcrWord[]; y: number; h: number }[] = [];
  for (const w of sorted) {
    const wy = cy(w.bbox);
    const wh = Math.max(1, w.bbox.y1 - w.bbox.y0);
    let best: (typeof lines)[number] | null = null;
    let bestD = Infinity;
    for (const l of lines) {
      const d = Math.abs(l.y - wy);
      const tol = 0.55 * Math.max(l.h, wh);
      if (d < tol && d < bestD) {
        best = l;
        bestD = d;
      }
    }
    if (best) {
      best.words.push(w);
      const n = best.words.length;
      best.y = (best.y * (n - 1) + wy) / n;
      best.h = (best.h * (n - 1) + wh) / n;
    } else {
      lines.push({ words: [w], y: wy, h: wh });
    }
  }
  lines.sort((a, b) => a.y - b.y);
  return lines.map((l) => l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0));
}

function cy(b: ExtractBox): number {
  return (b.y0 + b.y1) / 2;
}

export function unionBoxes(boxes: ExtractBox[]): ExtractBox | undefined {
  if (!boxes.length) return undefined;
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const x of boxes) {
    b.x0 = Math.min(b.x0, x.x0);
    b.y0 = Math.min(b.y0, x.y0);
    b.x1 = Math.max(b.x1, x.x1);
    b.y1 = Math.max(b.y1, x.y1);
  }
  return b;
}

/**
 * Sellers' algorithm: best approximate occurrence of `needle` in `hay` with ≤ maxEdits
 * (Levenshtein). Returns compact-string offsets.
 */
function fuzzySubstring(
  hay: string,
  needle: string,
  maxEdits: number,
  from: number
): { start: number; end: number; edits: number } | null {
  const m = needle.length;
  const n = hay.length;
  if (m === 0 || from >= n) return null;
  // Column DP: prev[i] = edit distance of needle[0..i) against best hay suffix ending here.
  let prev = new Array<number>(m + 1);
  let cur = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;
  let bestEnd = -1;
  let bestEdits = maxEdits + 1;
  for (let j = from + 1; j <= n; j++) {
    cur[0] = 0;
    const hc = hay.charCodeAt(j - 1);
    for (let i = 1; i <= m; i++) {
      const cost = needle.charCodeAt(i - 1) === hc ? 0 : 1;
      cur[i] = Math.min(prev[i - 1] + cost, prev[i] + 1, cur[i - 1] + 1);
    }
    if (cur[m] < bestEdits) {
      bestEdits = cur[m];
      bestEnd = j;
      if (bestEdits === 0) break;
    }
    const t = prev;
    prev = cur;
    cur = t;
  }
  if (bestEnd < 0) return null;
  // Find the start by running the same DP on the reversed strings up to bestEnd.
  const rHay = hay.slice(from, bestEnd).split("").reverse().join("");
  const rNeedle = needle.split("").reverse().join("");
  const back = fuzzySubstringEnd(rHay, rNeedle, bestEdits);
  const start = back < 0 ? Math.max(from, bestEnd - m) : bestEnd - back;
  return { start, end: bestEnd, edits: bestEdits };
}

function fuzzySubstringEnd(hay: string, needle: string, maxEdits: number): number {
  const m = needle.length;
  const n = hay.length;
  let prev = new Array<number>(m + 1);
  let cur = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;
  let bestEnd = -1;
  let bestEdits = maxEdits + 1;
  for (let j = 1; j <= n; j++) {
    cur[0] = 0;
    const hc = hay.charCodeAt(j - 1);
    for (let i = 1; i <= m; i++) {
      const cost = needle.charCodeAt(i - 1) === hc ? 0 : 1;
      cur[i] = Math.min(prev[i - 1] + cost, prev[i] + 1, cur[i - 1] + 1);
    }
    if (cur[m] < bestEdits) {
      bestEdits = cur[m];
      bestEnd = j;
      if (bestEdits === 0) break;
    }
    const t = prev;
    prev = cur;
    cur = t;
  }
  return bestEnd;
}

/** Plain Levenshtein distance (small strings). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array<number>(n + 1);
  let cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j - 1] + cost, prev[j] + 1, cur[j - 1] + 1);
    }
    const t = prev;
    prev = cur;
    cur = t;
  }
  return prev[n];
}

/* ───────────────────────────── Fields ───────────────────────────── */

export function field(value: string, confidence: number, span?: Span | null): ExtractedField {
  const f: ExtractedField = { value, confidence: clamp(Math.round(confidence), 0, 100) };
  if (span?.box) f.box = span.box;
  return f;
}

/** Word confidence blended with how sure the parse itself is (0–1). */
export function conf(span: Span | null | undefined, certainty: number, doc?: Doc): number {
  const base = span ? span.confidence : doc ? doc.meanConfidence : 50;
  // Word confidence below ~50 is noise; above ~90 is as good as it gets.
  const norm = clamp((base - 30) / 60, 0.2, 1);
  return 100 * norm * clamp(certainty, 0, 1);
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/* ───────────────────────────── Dates ───────────────────────────── */

export type DateHit = {
  iso: string;
  start: number;
  end: number;
  raw: string;
  /** Came from a lenient pattern (OCR-tolerant); prefer strict hits when both exist. */
  weak: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

export type YearRange = { minYear: number; maxYear: number };

/** Case documents: cheques, memos, notices, receipts. */
export const CASE_YEARS: YearRange = { minYear: 2000, maxYear: 2035 };
/** Dates of birth on identity documents. */
export const BIRTH_YEARS: YearRange = { minYear: 1900, maxYear: new Date().getFullYear() };

/** Build an ISO date when the parts form a real calendar date in range, else "". */
export function isoFromParts(d: number, m: number, y: number, range: YearRange = CASE_YEARS): string {
  if (y < 100) y += y + 2000 <= range.maxYear ? 2000 : 1900;
  if (y < range.minYear || y > range.maxYear) return "";
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Parse one date string in any of the accepted shapes → ISO, or "". */
export function parseDate(raw: string, range: YearRange = CASE_YEARS): string {
  const hits = findDatesInText(raw, range);
  return hits.length ? hits[0].iso : "";
}

type DatePattern = { re: RegExp; weak: boolean; parts: (m: RegExpExecArray) => [number, number, number] };

const DATE_PATTERNS: DatePattern[] = [
  // 15/03/2026, 15-03-2026, 15.03.2026, 15/3/26
  {
    re: /(?<![\d/.-])(\d{1,2})\s?[/.-]\s?(\d{1,2})\s?[/.-]\s?(\d{4}|\d{2})(?![\d/.-])/g,
    weak: false,
    parts: (m) => [+m[1], +m[2], +m[3]],
  },
  // 2026-03-15 (ISO) / 2026/03/15
  {
    re: /(?<!\d)((?:19|20)\d{2})[-/](\d{1,2})[-/](\d{1,2})(?!\d)/g,
    weak: false,
    parts: (m) => [+m[3], +m[2], +m[1]],
  },
  // 15 Mar 2026 · 15th March, 2026 · 12th day of April 2016 · 12° day of April 2016
  {
    re: new RegExp(
      `(?<!\\d)(\\d{1,2})(?:\\s?(?:st|nd|rd|th|°|º|"|'|\\*|\\^)+)?\\.?,?\\s*(?:day\\s+of\\s+)?${MONTH_RE}\\.?,?\\s*(\\d{4})(?!\\d)`,
      "gi"
    ),
    weak: false,
    parts: (m) => [+m[1], MONTHS[m[2].toLowerCase()] ?? 0, +m[3]],
  },
  // March 15, 2026 · Mar 15 2026
  {
    re: new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})(?!\\d)`, "gi"),
    weak: false,
    parts: (m) => [+m[2], MONTHS[m[1].toLowerCase()] ?? 0, +m[3]],
  },
  // 15032026 (DDMMYYYY) · 15 03 2026
  {
    re: /(?<![\d,.])(\d{2})\s?(\d{2})\s?((?:19|20)\d{2})(?![\d,.])/g,
    weak: false,
    parts: (m) => [+m[1], +m[2], +m[3]],
  },
  // 1 5 0 3 2 0 2 6 · 1|5|0|3|2|0|2|6 (cheque date boxes read digit by digit, box edges as bars)
  {
    re: /(?<![\d|])(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)[\s|\[\]()]{1,2}(\d)(?![\d|])/g,
    weak: true,
    parts: (m) => [+(m[1] + m[2]), +(m[3] + m[4]), +(m[5] + m[6] + m[7] + m[8])],
  },
  // 040472016 — a "/" read as "7" or "1" between month and year
  {
    re: /(?<![\d,.])(\d{2})(\d{2})[71]((?:19|20)\d{2})(?![\d,.])/g,
    weak: true,
    parts: (m) => [+m[1], +m[2], +m[3]],
  },
];

/** Every date-looking thing in a text, with offsets, non-overlapping, strict patterns first. */
export function findDatesInText(text: string, range: YearRange = CASE_YEARS): DateHit[] {
  const hits: DateHit[] = [];
  const taken: Array<[number, number]> = [];
  const overlaps = (s: number, e: number) => taken.some(([a, b]) => s < b && e > a);
  for (const p of DATE_PATTERNS) {
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(text))) {
      const s = m.index;
      const e = s + m[0].length;
      if (overlaps(s, e)) continue;
      const [d, mo, y] = p.parts(m);
      const iso = isoFromParts(d, mo, y, range);
      if (!iso) continue;
      hits.push({ iso, start: s, end: e, raw: m[0], weak: p.weak });
      taken.push([s, e]);
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

export function findDates(doc: Doc, range: YearRange = CASE_YEARS): DateHit[] {
  return findDatesInText(doc.flat, range);
}

/**
 * The first date after a label match, on the same line or the next, within `maxGap`
 * characters. `label` is tested case-insensitively against `flat`.
 */
export function dateAfterLabel(
  doc: Doc,
  label: RegExp,
  dates: DateHit[],
  opts: { maxGap?: number; nextLine?: boolean } = {}
): { hit: DateHit; label: { start: number; end: number } } | null {
  const { maxGap = 60, nextLine = true } = opts;
  const re = new RegExp(label.source, label.flags.includes("g") ? label.flags : label.flags + "g");
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  let best: { hit: DateHit; label: { start: number; end: number } } | null = null;
  while ((m = re.exec(doc.flat))) {
    const lEnd = m.index + m[0].length;
    const lLine = doc.lineAt(m.index);
    for (const d of dates) {
      if (d.start < lEnd) continue;
      const gap = d.start - lEnd;
      const dLine = doc.lineAt(d.start);
      const sameLine = dLine === lLine;
      const next = dLine === lLine + 1;
      if (!(sameLine || (nextLine && next))) break;
      if (gap > maxGap && !sameLine) break;
      // Prefer the tightest, strict hit for the earliest label.
      if (!best || (best.hit.weak && !d.weak)) best = { hit: d, label: { start: m.index, end: lEnd } };
      break;
    }
    if (best && !best.hit.weak) break;
  }
  return best;
}

/* ───────────────────────────── Amounts ───────────────────────────── */

export type AmountHit = {
  /** Whole rupees, digits only. */
  digits: string;
  value: number;
  start: number;
  end: number;
  raw: string;
  hasSymbol: boolean;
  hasCommas: boolean;
  hasSuffix: boolean;
  hasPaise: boolean;
  /** Indian (2-2-3) or Western (3-3-3) grouping is consistent — mixed groups are OCR noise. */
  groupingOk: boolean;
  /** Grouped the Indian way (…,25,000) rather than in thousands (…,250,000). */
  indianGrouping: boolean;
};

const AMOUNT_RE =
  /(₹|Rs\.?|INR|Rupees|Re\.)?\s*:?\s*(?<![\d,])(\d{1,3}(?:,\s?\d{2,3})+|\d{3,9})(?!\d)(?:(\.\d{1,2})(?!\d)|(?<=\d{3}) (\d{2})(?![\d,]))?(?:\s?(\/[-~=]|\/\s?-|[-–]\/?))?/gi;

/** Every currency-looking number in the text, with what surrounds it. */
export function findAmountsInText(text: string): AmountHit[] {
  const out: AmountHit[] = [];
  AMOUNT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = AMOUNT_RE.exec(text))) {
    const symbol = m[1];
    const num = m[2];
    const paise = m[3] ?? m[4];
    const suffix = m[5];
    const hasCommas = num.includes(",");
    const digits = num.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
    if (!digits || digits.length > 10) continue;
    const value = Number(digits);
    if (!Number.isFinite(value) || value < 10) continue;
    let groupingOk = true;
    let indianGrouping = true;
    if (hasCommas) {
      const groups = num.split(",").map((g) => g.trim());
      const last = groups[groups.length - 1];
      const mids = groups.slice(1, -1);
      const first = groups[0];
      if (last.length !== 3) groupingOk = false;
      else if (mids.length && !(mids.every((g) => g.length === 2) || mids.every((g) => g.length === 3)))
        groupingOk = false;
      else if (first.length > 3 || first.length === 0) groupingOk = false;
      indianGrouping = mids.every((g) => g.length === 2) && first.length <= 2 || (mids.length === 0 && first.length <= 3);
      if (mids.length === 0 && first.length === 3) indianGrouping = digits.length <= 6; // "322,500" is Western
    }
    const start = m.index + (m[0].length - m[0].trimStart().length);
    out.push({
      digits,
      value,
      start,
      end: m.index + m[0].length,
      raw: m[0].trim(),
      hasSymbol: !!symbol,
      hasCommas,
      hasSuffix: !!suffix,
      hasPaise: !!paise,
      groupingOk,
      indianGrouping,
    });
  }
  return out;
}

export function findAmounts(doc: Doc): AmountHit[] {
  return findAmountsInText(doc.flat);
}

/** Digits → "50,25,000" (formatINR without importing the app formatter into pure code). */
export function groupINR(digits: string): string {
  const d = digits.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  if (!d) return "";
  const last3 = d.slice(-3);
  const rest = d.slice(0, -3);
  return rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
}

/* ───────────────────────────── Number words (Indian) ───────────────────────────── */

const ONES: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000, lack: 100000,
  crore: 10000000, crores: 10000000,
};
const FILLERS = new Set(["and", "rupees", "rupee", "rs", "only", "rupess", "rupes", "ony"]);

type NumTok = { kind: "one" | "ten" | "scale" | "filler"; n: number };

function classifyNumberWord(tok: string): NumTok | null {
  const t = tok.toLowerCase();
  if (FILLERS.has(t)) return { kind: "filler", n: 0 };
  const tryTable = (table: Record<string, number>, kind: NumTok["kind"]): NumTok | null => {
    if (table[t] !== undefined) return { kind, n: table[t] };
    // Fuzzy: one edit for 4–6 letters, two for 7+ (scale words are few and distinctive: two from 4).
    if (t.length < 4) return null;
    const maxE = t.length >= 7 || kind === "scale" ? 2 : 1;
    let best: string | null = null;
    let bestD = maxE + 1;
    for (const k of Object.keys(table)) {
      if (Math.abs(k.length - t.length) > maxE) continue;
      const d = editDistance(k, t);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best ? { kind, n: table[best] } : null;
  };
  return (
    tryTable(ONES, "one") ??
    tryTable(TENS, "ten") ??
    tryTable(SCALES, "scale") ??
    (t.length >= 4 && editDistance("only", t) <= 1 ? { kind: "filler", n: 0 } : null)
  );
}

/**
 * "Fifty Lakh Twenty Five Thousand Only" → 5025000. Returns null unless the words form a
 * well-formed Indian amount (every token recognised, scales in descending order, no two
 * bare units in a row — that pattern means a scale word was misread).
 */
export function wordsToAmount(text: string): { value: number; tokens: number } | null {
  const toks = text
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let total = 0;
  let current = 0;
  let last: NumTok["kind"] | "start" = "start";
  let lastScale = Infinity;
  let used = 0;
  let sawScale = false;
  for (const raw of toks) {
    const t = classifyNumberWord(raw);
    if (!t) return null;
    used++;
    if (t.kind === "filler") continue;
    if (t.kind === "one") {
      if (last === "one" || (last === "ten" && t.n >= 10)) return null;
      current += t.n;
    } else if (t.kind === "ten") {
      if (last === "one" || last === "ten") return null;
      current += t.n;
    } else {
      // scale
      if (t.n === 100) {
        if (current === 0 || current >= 100) return null;
        current *= 100;
      } else {
        if (current === 0 && total === 0) return null;
        if (t.n >= lastScale) return null;
        lastScale = t.n;
        total += current * t.n;
        current = 0;
        sawScale = true;
      }
    }
    last = t.kind;
  }
  total += current;
  if (!sawScale && total < 100) return null;
  if (used < 2 || total <= 0) return null;
  return { value: total, tokens: used };
}

/* ───────────────────────────── Text helpers ───────────────────────────── */

/** Title-case a shouted or lowercase name, keeping short particles lowercase. */
export function titleCaseName(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (["of", "and", "the", "&"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\b(S|D|W|C)\/o\b/gi, (m) => m.toUpperCase().replace("/O", "/o"));
}

/** Mostly letters and spaces — a name/label rather than OCR noise. */
export function looksLikeWords(s: string, minWords = 1): boolean {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length < minWords) return false;
  const letters = (s.match(/[A-Za-z]/g) ?? []).length;
  const total = s.replace(/\s/g, "").length;
  if (!total) return false;
  if (letters / total < 0.8) return false;
  // Every word should be pronounceable-ish: at least one vowel per 4+ letter word.
  return words.every((w) => w.length <= 3 || /[aeiouy]/i.test(w));
}

/** Collapse whitespace, trim, and drop stray leading/trailing punctuation. */
export function cleanText(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.\-–—|]+/, "")
    .replace(/[\s:;,\-–—|]+$/, "")
    .trim();
}
