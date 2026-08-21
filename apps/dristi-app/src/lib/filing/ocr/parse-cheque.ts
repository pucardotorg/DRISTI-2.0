/**
 * Cheque front → dateOnCheque, amount, chequeNumber, ifsc, bankName, bankBranch, payee,
 * micr, account. Indian CTS-2010 cheques: bank header top-left, date boxes (DDMMYYYY)
 * top-right, "PAY … OR BEARER", "RUPEES <words>", "₹ <figure>/-", A/c No., MICR band
 * along the bottom (⑈ cheque-no ⑈ 9-digit MICR ⑈ 6-digit a/c ⑈ 2-digit txn code).
 */

import { BANKS, bankForIfsc, type BankRef } from "./banks";
import {
  Doc,
  type AmountHit,
  type DateHit,
  type ParsedFields,
  type Parser,
  type Span,
  cleanText,
  conf,
  dateAfterLabel,
  field,
  findAmounts,
  findDates,
  groupINR,
  looksLikeWords,
  titleCaseName,
  wordsToAmount,
} from "./parse-common";

export const parseCheque: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};
  const dates = findDates(doc);

  /* ─── IFSC ─── */
  const ifsc = findIfsc(doc);
  if (ifsc) out.ifsc = field(ifsc.code, conf(ifsc.span, ifsc.certainty), ifsc.span);

  /* ─── Bank name & branch ─── */
  const bank = matchBank(doc);
  if (bank) {
    out.bankName = field(bank.bank.name, conf(bank.span, bank.certainty), bank.span);
  } else if (ifsc) {
    const byIfsc = bankForIfsc(ifsc.code);
    if (byIfsc) out.bankName = field(byIfsc.name, conf(ifsc.span, 0.7), ifsc.span);
  }
  const branch = findBranch(doc, bank?.span);
  if (branch) out.bankBranch = field(branch.text, conf(branch.span, 0.5), branch.span);

  /* ─── MICR band → cheque number ─── */
  const micr = findMicr(doc);
  if (micr) {
    // E-13B glyphs score low as words even when read right — the band's shape is the evidence.
    out.chequeNumber = field(micr.chequeNumber, Math.max(conf(micr.span, 0.85), micr.micr ? 78 : 66), micr.span);
    if (micr.micr) out.micr = field(micr.micr, Math.max(conf(micr.span, 0.7), 60), micr.span);
  } else {
    const labelled = chequeNumberByLabel(doc);
    if (labelled) out.chequeNumber = field(labelled.value, conf(labelled.span, labelled.certainty), labelled.span);
  }

  /* ─── Date on cheque ─── */
  const date = findChequeDate(doc, dates);
  if (date) out.dateOnCheque = field(date.iso, conf(date.span, date.certainty), date.span);

  /* ─── Amount ─── */
  const amount = findChequeAmount(doc, dates, micr?.lineIndex);
  if (amount) out.amount = field(groupINR(amount.digits), conf(amount.span, amount.certainty), amount.span);

  /* ─── Payee ─── */
  const payee = findPayee(doc);
  if (payee) out.payee = field(payee.text, conf(payee.span, 0.5), payee.span);

  /* ─── Account ─── */
  const account = findAccount(doc, micr?.lineIndex, dates);
  if (account) out.account = field(account.value, conf(account.span, account.certainty), account.span);

  return out;
};

/* ───────────────────────────── IFSC ───────────────────────────── */

const IFSC_RE = /(?<![A-Z0-9])([A-Z]{4})[0O]([A-Z0-9]{6})(?![A-Z0-9])/g;

export function findIfsc(doc: Doc): { code: string; span: Span; certainty: number } | null {
  IFSC_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let best: { code: string; span: Span; certainty: number } | null = null;
  while ((m = IFSC_RE.exec(doc.upper))) {
    const code = `${m[1]}0${m[2]}`;
    const known = !!bankForIfsc(code);
    const before = doc.upper.slice(Math.max(0, m.index - 16), m.index);
    const labelled = /IFS|1FS|IFC/.test(before);
    if (!known && !labelled) continue;
    // Digits after the 0 are the norm; an all-letter tail on an unknown prefix is suspicious.
    if (!known && !/\d/.test(m[2])) continue;
    const certainty = known && labelled ? 0.98 : known ? 0.92 : 0.8;
    const span = doc.span(m.index, m.index + m[0].length);
    if (!best || certainty > best.certainty) best = { code, span, certainty };
  }
  return best;
}

/* ───────────────────────────── Bank ───────────────────────────── */

export function matchBank(doc: Doc): { bank: BankRef; span: Span; certainty: number } | null {
  let best: { bank: BankRef; span: Span; score: number; certainty: number } | null = null;
  for (const bank of BANKS) {
    for (const alias of bank.aliases) {
      const compactLen = alias.replace(/[^A-Za-z0-9]/g, "").length;
      let hit: { start: number; end: number; edits: number } | null = null;
      if (compactLen <= 5) {
        const re = new RegExp(`(?<![A-Za-z])${escapeRe(alias)}(?![A-Za-z])`, "i");
        const m = re.exec(doc.flat);
        if (m) hit = { start: m.index, end: m.index + m[0].length, edits: 0 };
      } else {
        const maxEdits = compactLen >= 14 ? 2 : compactLen >= 8 ? 1 : 0;
        hit = doc.fuzzy(alias, maxEdits);
      }
      if (!hit) continue;
      const span = doc.span(hit.start, hit.end);
      let score = compactLen - 2 * hit.edits;
      const pos = doc.relPos(span.box);
      if (pos && pos.cy < 0.45) score += 3; // drawee bank sits in the header
      if (!best || score > best.score) {
        best = {
          bank,
          span,
          score,
          certainty: hit.edits === 0 ? 0.92 : hit.edits === 1 ? 0.8 : 0.68,
        };
      }
    }
  }
  return best;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BRANCH_STOP = /\b(IFSC?|IFS CODE|MICR|TEL|PH|PHONE|BR\.?|CODE|PAYABLE|VALID|DATE|D\s?D\s?M\s?M\s?Y\s?Y\s?Y\s?Y|CHEQUE|A\/C|SAVINGS|CURRENT|PAY|RUPEES|OR BEARER|PLEASE|SIGN|ABOVE|AUTHORISED|SIGNATORY|MULTI|CITY|PAR|BRANCHES)\b/i;

function findBranch(doc: Doc, bankSpan?: Span): { text: string; span: Span } | null {
  // 1. Explicit label.
  const labelled = /\bBranch\b\s*(?:Name)?\s*[:.-]?\s*([A-Za-z][A-Za-z0-9 ,.'()-]{2,50})/i.exec(doc.flat);
  if (labelled && !/^(name|code|no)\b/i.test(labelled[1])) {
    const text = cleanBranch(labelled[1]);
    if (text) return { text, span: doc.span(labelled.index, labelled.index + labelled[0].length) };
  }
  // 2. Text beside / under the bank name — only in the header, only when read cleanly.
  if (!bankSpan) return null;
  const pos = doc.relPos(bankSpan.box);
  if (pos && pos.cy > 0.45) return null;
  const li = doc.lineAt(bankSpan.start);
  if (li < 0) return null;
  const candidates: { text: string; start: number; end: number }[] = [];
  const same = doc.lines[li];
  if (same && bankSpan.end < same.end) candidates.push({ text: doc.flat.slice(bankSpan.end, same.end), start: bankSpan.end, end: same.end });
  const next = doc.lines[li + 1];
  if (next) candidates.push({ text: next.text, start: next.start, end: next.end });
  for (const c of candidates) {
    const text = cleanBranch(c.text);
    if (!text) continue;
    const span = doc.span(c.start, c.end);
    if (span.confidence < 60) continue;
    return { text, span };
  }
  return null;
}

function cleanBranch(raw: string): string {
  let t = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/^[\s,.:-]*(?:ltd\.?|limited|bank|of\s+india)\b[\s,.:-]*/i, "")
    .replace(/^\s*\d{3,}\s*/, "");
  const stop = BRANCH_STOP.exec(t);
  if (stop) t = t.slice(0, stop.index);
  t = cleanText(t);
  if (t.length < 4 || t.length > 60) return "";
  if (!looksLikeWords(t.replace(/[\d,.'()-]/g, " "), 1)) return "";
  const words = t.split(/\s+/);
  const wordy = words.filter((w) => /^[A-Za-z][A-Za-z.'-]*,?$/.test(w) && (w.length <= 3 || /[aeiouy]/i.test(w)));
  if (wordy.length < Math.ceil(words.length * 0.6)) return "";
  return titleCaseName(t.toLowerCase());
}

/* ───────────────────────────── MICR ───────────────────────────── */

const E13B_MAP: Record<string, string> = {
  O: "0", o: "0", Q: "0", D: "0",
  I: "1", l: "1", i: "1", "|": "1", "!": "1",
  Z: "2", z: "2",
  S: "5", s: "5",
  G: "6", b: "6",
  T: "7",
  B: "8",
  g: "9", q: "9",
};

function normaliseMicr(text: string): string {
  return text
    .split("")
    .map((c) => (/[0-9]/.test(c) ? c : E13B_MAP[c] ?? " "))
    .join("");
}

export function findMicr(doc: Doc): { chequeNumber: string; micr: string | null; span: Span; lineIndex: number } | null {
  const n = doc.lines.length;
  const from = Math.max(0, n - 8);
  let best: { chequeNumber: string; micr: string | null; span: Span; lineIndex: number; score: number } | null = null;
  for (let i = from; i < n; i++) {
    const line = doc.lines[i];
    if (doc.hasBoxes && line.box) {
      const pos = doc.relPos(line.box);
      if (pos && pos.cy < 0.6) continue; // MICR band is along the bottom
    }
    const groups = normaliseMicr(line.text).split(/\s+/).filter(Boolean);
    const digits = groups.join("").length;
    if (groups.length < 3 || digits < 16) continue;
    if (groups[0].length !== 6) continue;
    const longest = Math.max(...groups.slice(1).map((g) => g.length));
    if (longest < 6) continue;
    const clean = groups.length >= 3 && groups.length <= 4 && groups[1].length === 9 && groups[2].length === 6;
    const score = digits + (clean ? 10 : 0);
    if (!best || score > best.score) {
      best = {
        chequeNumber: groups[0],
        micr: clean ? groups.join(" ") : null,
        span: doc.span(line.start, line.end),
        lineIndex: i,
        score,
      };
    }
  }
  return best;
}

function chequeNumberByLabel(doc: Doc): { value: string; span: Span; certainty: number } | null {
  const strong = /\b(?:cheque|chq|check)\.?\s*(?:no|number|#)?\.?\s*[:.-]?\s*(\d{6})(?!\d)/i.exec(doc.flat);
  if (strong) {
    const s = strong.index + strong[0].length - strong[1].length;
    return { value: strong[1], span: doc.span(s, s + 6), certainty: 0.8 };
  }
  const weak = /(?<![A-Za-z])No\.?\s*[:.]?\s*(\d{6})(?!\d)/.exec(doc.flat);
  if (weak) {
    const s = weak.index + weak[0].length - weak[1].length;
    return { value: weak[1], span: doc.span(s, s + 6), certainty: 0.6 };
  }
  return null;
}

/* ───────────────────────────── Date ───────────────────────────── */

function findChequeDate(doc: Doc, dates: DateHit[]): { iso: string; span: Span; certainty: number } | null {
  if (!dates.length) return null;
  // Top-right region: the DDMMYYYY boxes.
  if (doc.hasBoxes) {
    let best: { iso: string; span: Span; certainty: number } | null = null;
    for (const d of dates) {
      const span = doc.span(d.start, d.end);
      const pos = doc.relPos(span.box);
      if (!pos || pos.cy > 0.38 || pos.cx < 0.5) continue;
      const certainty = d.weak ? 0.7 : 0.9;
      if (!best || certainty > best.certainty) best = { iso: d.iso, span, certainty };
    }
    if (best) return best;
  }
  const labelled = dateAfterLabel(doc, /\bDate\b|\bDated\b|D\s?D\s?M\s?M\s?Y\s?Y\s?Y\s?Y/i, dates, { maxGap: 40 });
  if (labelled) return { iso: labelled.hit.iso, span: doc.span(labelled.hit.start, labelled.hit.end), certainty: labelled.hit.weak ? 0.6 : 0.75 };
  const strict = dates.filter((d) => !d.weak);
  if (strict.length === 1) return { iso: strict[0].iso, span: doc.span(strict[0].start, strict[0].end), certainty: 0.55 };
  return null;
}

/* ───────────────────────────── Amount ───────────────────────────── */

function findChequeAmount(
  doc: Doc,
  dates: DateHit[],
  micrLine: number | undefined
): { digits: string; span: Span; certainty: number } | null {
  const words = findAmountInWords(doc);
  const hits = findAmounts(doc).filter((a) => !overlapsDate(a, dates) && a.value >= 100 && a.value < 1e9);
  let best: { hit: AmountHit; score: number; span: Span } | null = null;
  for (const a of hits) {
    if (a.hasCommas && !a.groupingOk) continue;
    if (!a.hasCommas && a.digits.length >= 9) continue; // account / MICR numbers
    // "50,210,000": thousands grouping at crore scale is a misread comma unless the words agree.
    if (a.hasCommas && !a.indianGrouping && a.digits.length >= 7 && !(words && words.value === a.value)) continue;
    const span = doc.span(a.start, a.end);
    const li = doc.lineAt(a.start);
    if (micrLine !== undefined && li === micrLine) continue;
    let score = 0;
    if (a.hasCommas) score += 3;
    if (a.hasSuffix) score += 3;
    if (a.hasSymbol) score += 2;
    if (a.hasPaise) score += 1;
    if (!a.hasCommas && !a.hasSymbol && !a.hasSuffix) score -= 2;
    const pos = doc.relPos(span.box);
    if (pos) {
      if (pos.cx > 0.5 && pos.cy > 0.2 && pos.cy < 0.72) score += 2;
      if (pos.cy > 0.78) score -= 3;
    }
    if (words && words.value === a.value) score += 4;
    if (!best || score > best.score) best = { hit: a, score, span };
  }
  if (best && best.score >= 3) {
    let certainty = Math.min(0.95, 0.55 + 0.08 * Math.min(best.score, 5));
    if (words && words.value !== best.hit.value) {
      // Figure and words disagree. A thousands-grouped figure ("50,210,000") on an Indian
      // cheque is almost always a misread comma — trust clean words over it.
      if (best.hit.hasCommas && !best.hit.indianGrouping && words.clean && words.labelled) {
        return { digits: String(words.value), span: words.span, certainty: 0.5 };
      }
      certainty = 0.5;
    }
    return { digits: best.hit.digits, span: best.span, certainty };
  }
  if (words && words.clean && (words.labelled || words.tokens >= 4)) {
    return { digits: String(words.value), span: words.span, certainty: 0.55 };
  }
  return null;
}

function overlapsDate(a: AmountHit, dates: DateHit[]): boolean {
  return dates.some((d) => a.start < d.end && a.end > d.start);
}

/** "RUPEES Fifty Lakh Twenty Five Thousand Only" → 5025000, when the words parse cleanly. */
function findAmountInWords(doc: Doc): { value: number; span: Span; clean: boolean; labelled: boolean; tokens: number } | null {
  const ranges: Array<[number, number]> = [];
  const label = doc.fuzzy("rupees", 1);
  if (label) {
    const li = doc.lineAt(label.start);
    const line = doc.lines[li];
    if (line) {
      ranges.push([label.end, line.end]);
      const next = doc.lines[li + 1];
      if (next && !/\bonly\b/i.test(doc.flat.slice(label.end, line.end))) ranges.push([label.end, next.end]);
    }
  }
  const pick = (candidates: Array<[number, number]>, labelled: boolean) => {
    let best: { value: number; span: Span; clean: boolean; labelled: boolean; tokens: number } | null = null;
    for (const [start, end] of candidates) {
      let text = doc.flat.slice(start, end);
      const only = /\bonly\b/i.exec(text);
      if (only) text = text.slice(0, only.index + 4);
      const parsed = wordsToAmount(text);
      if (parsed && (!best || parsed.tokens > best.tokens)) {
        best = { value: parsed.value, span: doc.span(start, start + text.length), clean: true, labelled, tokens: parsed.tokens };
      }
    }
    return best;
  };
  return pick(ranges, true) ?? pick(doc.lines.map((l) => [l.start, l.end] as [number, number]), false);
}

/* ───────────────────────────── Payee ───────────────────────────── */

function findPayee(doc: Doc): { text: string; span: Span } | null {
  const m = /(?<![A-Za-z])PAY\b\s*[:.-]?\s*(.+?)(?=\s+(?:OR\s+BEARER|OR\s+ORDER|BEARER|या|OR\b)|\n|$)/i.exec(doc.flat);
  if (!m) return null;
  const tokens = m[1]
    .split(/\s+/)
    .filter((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w) && (w.length <= 3 || /[aeiouy]/i.test(w)));
  // Stop at the first junk token; keep 2–6 name-like words.
  const kept: string[] = [];
  for (const w of m[1].split(/\s+/)) {
    if (tokens.includes(w)) kept.push(w);
    else break;
  }
  if (kept.length < 2 || kept.length > 6) return null;
  const text = kept.join(" ");
  if (!looksLikeWords(text, 2) || /rupees|thousand|lakh|only/i.test(text)) return null;
  const s = m.index + m[0].indexOf(m[1]);
  return { text: titleCaseName(text), span: doc.span(s, s + text.length) };
}

/* ───────────────────────────── Account ───────────────────────────── */

function findAccount(doc: Doc, micrLine: number | undefined, dates: DateHit[]): { value: string; span: Span; certainty: number } | null {
  const labelled =
    /(?:\bA\s*\/\s*[cC]\.?|\bAcc(?:ount|t)\.?)\s*(?:No\.?|Number|#)?\s*[:.-]?\s*(\d{9,18})(?!\d)/i.exec(doc.flat);
  if (labelled) {
    const s = labelled.index + labelled[0].length - labelled[1].length;
    return { value: labelled[1], span: doc.span(s, s + labelled[1].length), certainty: 0.85 };
  }
  // A lone long number off the MICR band.
  const re = /(?<![\d,.])(\d{11,16})(?![\d,.])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc.flat))) {
    const start = m.index;
    const end = start + m[0].length;
    const li = doc.lineAt(start);
    if (micrLine !== undefined && li === micrLine) continue;
    if (dates.some((d) => start < d.end && end > d.start)) continue;
    return { value: m[1], span: doc.span(start, end), certainty: 0.5 };
  }
  return null;
}
