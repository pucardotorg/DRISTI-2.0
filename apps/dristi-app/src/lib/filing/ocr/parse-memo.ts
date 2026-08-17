/**
 * Cheque return memo → returnReason (RETURN_REASONS value), returnDate, presentDate,
 * receiptDate, chequeNumber, amount. CTS memos are label: value tables ("Cheque No :",
 * "Processing Date :", "Return Reason Description:"); older ones are free text.
 */

import {
  Doc,
  type DateHit,
  type ParsedFields,
  type Parser,
  type Span,
  conf,
  dateAfterLabel,
  field,
  findAmounts,
  findDates,
  groupINR,
} from "./parse-common";

/* ───────────────────────────── Reason ───────────────────────────── */

type ReasonPhrase = { phrase: string; value: string; edits: number; weight?: number };

const REASON_PHRASES: ReasonPhrase[] = [
  { phrase: "funds insufficient", value: "funds-insufficient", edits: 2 },
  { phrase: "insufficient funds", value: "funds-insufficient", edits: 2 },
  { phrase: "insufficient balance", value: "funds-insufficient", edits: 2 },
  { phrase: "insufficient", value: "funds-insufficient", edits: 1 },
  { phrase: "exceeds arrangement", value: "exceeds-arrangement", edits: 2 },
  { phrase: "account closed", value: "account-closed", edits: 1 },
  { phrase: "a/c closed", value: "account-closed", edits: 0 },
  { phrase: "payment stopped", value: "payment-stopped", edits: 1 },
  { phrase: "stop payment", value: "payment-stopped", edits: 1 },
  { phrase: "stopped by drawer", value: "payment-stopped", edits: 1 },
  { phrase: "signature differs", value: "signature-differs", edits: 2 },
  { phrase: "signature incomplete", value: "signature-differs", edits: 2 },
  { phrase: "signature illegible", value: "signature-differs", edits: 2 },
  { phrase: "signature mismatch", value: "signature-differs", edits: 2 },
  { phrase: "drawers signature", value: "signature-differs", edits: 2 },
  { phrase: "signature", value: "signature-differs", edits: 0, weight: -4 },
  { phrase: "amount in words", value: "amount-mismatch", edits: 1 },
  { phrase: "words and figures", value: "amount-mismatch", edits: 1 },
  { phrase: "words & figures", value: "amount-mismatch", edits: 1 },
  { phrase: "figures differ", value: "amount-mismatch", edits: 1 },
  { phrase: "refer to drawer", value: "refer-to-drawer", edits: 2 },
  { phrase: "refer drawer", value: "refer-to-drawer", edits: 1 },
  { phrase: "post dated", value: "stale-cheque", edits: 1 },
  { phrase: "postdated", value: "stale-cheque", edits: 1 },
  { phrase: "stale", value: "stale-cheque", edits: 0 },
  { phrase: "out of date", value: "stale-cheque", edits: 0 },
  { phrase: "outdated", value: "stale-cheque", edits: 1 },
];

/** CTS return codes we are sure of; used only when no reason text was read. */
const REASON_CODES: Record<string, string> = {
  "01": "funds-insufficient",
  "02": "exceeds-arrangement",
  "04": "refer-to-drawer",
  "12": "signature-differs",
  "50": "account-closed",
};

export function findReturnReason(doc: Doc): { value: string; span: Span; certainty: number; strong: boolean } | null {
  const label = /\b(?:return\s*)?reason\b|\breturn(?:ed)?\s*(?:for|due|because)\b|\bdishonou?r(?:ed)?\s*(?:for|due|because|reason)/i.exec(doc.flat);
  const labelLine = label ? doc.lineAt(label.index) : -1;
  let best: { value: string; span: Span; score: number; certainty: number } | null = null;
  for (const r of REASON_PHRASES) {
    for (const hit of doc.fuzzyAll(r.phrase, r.edits)) {
      const span = doc.span(hit.start, hit.end);
      const line = doc.lineAt(hit.start);
      const nearLabel = labelLine >= 0 && (line === labelLine || line === labelLine + 1) && (!label || hit.start >= label.index);
      const compactLen = r.phrase.replace(/[^a-z0-9]/gi, "").length;
      let score = compactLen - 3 * hit.edits + (nearLabel ? 6 : 0) + (r.weight ?? 0);
      // "Authorised Signatory" / "Signature of …" are not reasons.
      if (r.phrase === "signature") {
        const after = doc.flat.slice(hit.end, hit.end + 12).toLowerCase();
        const before = doc.flat.slice(Math.max(0, hit.start - 14), hit.start).toLowerCase();
        if (/^\s*(of|:)/.test(after) || /authori[sz]ed\s*$/.test(before)) continue;
        score -= 2;
      }
      if (!best || score > best.score) {
        const certainty = Math.min(0.95, 0.55 + 0.05 * Math.max(0, score - 5)) - 0.1 * hit.edits + (nearLabel ? 0.05 : 0);
        best = { value: r.value, span, score, certainty };
      }
    }
  }
  if (best && best.score >= 5) return { value: best.value, span: best.span, certainty: best.certainty, strong: best.score >= 15 };
  const code = /\b(?:return|reason|rejection)\s*code\s*[:.-]?\s*(\d{2})(?!\d)/i.exec(doc.flat);
  if (code && REASON_CODES[code[1]]) {
    const s = code.index + code[0].length - 2;
    return { value: REASON_CODES[code[1]], span: doc.span(s, s + 2), certainty: 0.7, strong: false };
  }
  return null;
}

/* ───────────────────────────── Dates ───────────────────────────── */

const RETURN_LABEL =
  /\b(?:return(?:ed|ing)?\s*(?:date|on)|date\s*of\s*return|dishonou?r(?:ed)?\s*(?:date|on)|date\s*of\s*dishonou?r|memo\s*date|processing\s*date|process\s*date|date\s*of\s*memo|bounce[d]?\s*(?:date|on))\b/i;
const PRESENT_LABEL =
  /\b(?:present(?:ed|ation|ing)?\s*(?:date|on)|date\s*of\s*(?:presentation|presenting|deposit)|deposit(?:ed)?\s*(?:date|on)|clearing\s*date|date\s*of\s*clearing|lodge[d]?\s*(?:date|on)|lodgement\s*date)\b/i;
const RECEIPT_LABEL =
  /\b(?:intimation\s*(?:given|sent|made)?\s*(?:date|on)|intimated\s*on|date\s*of\s*intimation|receiv(?:ed|ing)\s*(?:date|on)|date\s*of\s*receipt|receipt\s*date|informed\s*on|advice\s*date|date\s*of\s*advice)\b/i;
const CHEQUE_DATE_LABEL = /\b(?:cheque|chq|check|instrument|instr)\.?\s*date\b|\bdate\s*of\s*(?:the\s*)?(?:cheque|chq|instrument)\b/i;
const GENERIC_DATE_LABEL = /(?<![A-Za-z])Dated?\b\s*[:.\-–]/i;

function memoDates(doc: Doc, dates: DateHit[]) {
  const pick = (re: RegExp) => dateAfterLabel(doc, re, dates, { maxGap: 40 });
  const ret = pick(RETURN_LABEL);
  const pres = pick(PRESENT_LABEL);
  const rec = pick(RECEIPT_LABEL);
  const chq = pick(CHEQUE_DATE_LABEL);
  const used = new Set<number>();
  for (const x of [ret, pres, rec, chq]) if (x) used.add(x.hit.start);

  let generic: ReturnType<typeof pick> = null;
  if (!ret) {
    // "Date : dd/mm/yyyy" at the head of the memo — but not the cheque date.
    const re = new RegExp(GENERIC_DATE_LABEL.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(doc.flat))) {
      const before = doc.flat.slice(Math.max(0, m.index - 20), m.index).toLowerCase();
      if (/(cheque|chq|check|instrument|instr|value|issue|birth)\s*$/.test(before)) continue;
      const one = dateAfterLabel(doc, new RegExp(escapeRe(m[0])), dates, { maxGap: 30, nextLine: false });
      if (one && !used.has(one.hit.start)) {
        generic = one;
        break;
      }
    }
  }
  return { ret, pres, rec, chq, generic };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ───────────────────────────── Number & amount ───────────────────────────── */

const DIGIT_MAP: Record<string, string> = { O: "0", o: "0", D: "0", Q: "0", I: "1", l: "1", i: "1", "|": "1", Z: "2", z: "2", S: "5", s: "5", G: "6", B: "8", g: "9", q: "9" };

/** A 6-char token after "Cheque No", tolerating OCR letter-for-digit swaps. */
export function findChequeNumber(doc: Doc): { value: string; span: Span; certainty: number } | null {
  const re = /\b(?:cheque|chq|check|instrument|instr)\.?\s*(?:no|number|num|#)?\.?\s*[^\w\n]{0,3}\s*([0-9OoDQIliZzSsGBgq]{6})(?![0-9A-Za-z])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc.flat))) {
    const raw = m[1];
    const real = (raw.match(/\d/g) ?? []).length;
    if (real < 4) continue;
    const value = raw
      .split("")
      .map((c) => (/\d/.test(c) ? c : DIGIT_MAP[c] ?? ""))
      .join("");
    if (value.length !== 6) continue;
    const s = m.index + m[0].length - raw.length;
    return { value, span: doc.span(s, s + raw.length), certainty: real === 6 ? 0.85 : 0.7 };
  }
  return null;
}

export function findLabelledAmount(doc: Doc, dates: DateHit[]): { digits: string; span: Span; certainty: number } | null {
  const hits = findAmounts(doc).filter((a) => !dates.some((d) => a.start < d.end && a.end > d.start));
  if (!hits.length) return null;
  const labelRe = /\b(?:cheque\s*|chq\s*|instrument\s*)?(?:amount|amt)\b|\bRs\.?|₹|\bINR\b/gi;
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(doc.flat))) {
    const lStart = m.index;
    const line = doc.lineAt(lStart);
    const a = hits.find((h) => h.start >= lStart && (doc.lineAt(h.start) === line || doc.lineAt(h.start) === line + 1));
    if (!a) continue;
    if (a.hasCommas && !a.groupingOk) continue;
    // "32250000" — rupees and paise run together, or a real 3.2 crore? Too ambiguous to prefill.
    if (!a.hasCommas && !a.hasPaise && !a.hasSymbol && a.digits.length >= 7 && /00$/.test(a.digits)) continue;
    if (a.value < 100) continue;
    const certainty = a.hasCommas || a.hasPaise ? 0.85 : 0.65;
    return { digits: a.digits, span: doc.span(a.start, a.end), certainty };
  }
  return null;
}

/* ───────────────────────────── Parser ───────────────────────────── */

export const parseMemo: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};
  const dates = findDates(doc);

  const reason = findReturnReason(doc);
  if (reason) {
    // A reason phrase is validated against a short list — the match itself carries weight
    // even when the individual words scored low.
    out.returnReason = field(reason.value, Math.max(conf(reason.span, reason.certainty), reason.strong ? 60 : 45), reason.span);
  }

  const { ret, pres, rec, chq, generic } = memoDates(doc, dates);
  const put = (key: string, hit: DateHit, certainty: number) => {
    out[key] = field(hit.iso, conf(doc.span(hit.start, hit.end), hit.weak ? certainty - 0.15 : certainty), doc.span(hit.start, hit.end));
  };
  if (ret) put("returnDate", ret.hit, 0.9);
  else if (generic) put("returnDate", generic.hit, 0.65);
  if (pres) put("presentDate", pres.hit, 0.9);
  if (rec) put("receiptDate", rec.hit, 0.85);
  if (!out.returnDate) {
    // A memo with a single date on it: that is the return date.
    const strict = dates.filter((d) => !d.weak && d.start !== chq?.hit.start && d.start !== pres?.hit.start && d.start !== rec?.hit.start);
    if (strict.length === 1) put("returnDate", strict[0], 0.55);
  }
  // Order sanity: presented ≤ returned ≤ intimated.
  if (out.presentDate && out.returnDate && out.presentDate.value > out.returnDate.value) delete out.presentDate;
  if (out.receiptDate && out.returnDate && out.receiptDate.value < out.returnDate.value) delete out.receiptDate;

  const num = findChequeNumber(doc);
  if (num) out.chequeNumber = field(num.value, conf(num.span, num.certainty), num.span);

  const amount = findLabelledAmount(doc, dates);
  if (amount) out.amount = field(groupINR(amount.digits), conf(amount.span, amount.certainty), amount.span);

  return out;
};
