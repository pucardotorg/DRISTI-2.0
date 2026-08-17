/**
 * Demand-notice side of a cheque: the notice itself (dispatchDate, amount, chequeNumber),
 * the postal receipt (dispatchDate, tracking, modeService) and the delivery proof
 * (deliveryDate).
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
  wordsToAmount,
} from "./parse-common";

/* ───────────────────────────── Demand notice ───────────────────────────── */

export const parseDemandNotice: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};
  const dates = findDates(doc);

  const when = noticeDate(doc, dates);
  if (when) out.dispatchDate = field(when.iso, conf(when.span, when.certainty), when.span);

  const amount = noticeAmount(doc, dates);
  if (amount) out.amount = field(groupINR(amount.digits), conf(amount.span, amount.certainty), amount.span);

  const num = noticeChequeNumber(doc);
  if (num) out.chequeNumber = field(num.value, conf(num.span, num.certainty), num.span);

  return out;
};

/**
 * The notice's own date. Letters carry it as "Dated this 12th day of April 2016", a
 * "Date:"/"Dated:" line, or a bare date in the head; and it is later than every event the
 * notice narrates (cheque, presentation, return, intimation), so the latest date wins ties.
 */
function noticeDate(doc: Doc, dates: DateHit[]): { iso: string; span: Span; certainty: number } | null {
  const strict = dates.filter((d) => !d.weak);
  if (!strict.length) return null;
  const maxIso = strict.reduce((m, d) => (d.iso > m ? d.iso : m), "");
  const scored = strict.map((d) => {
    let score = 0;
    const before = doc.flat.slice(Math.max(0, d.start - 30), d.start).toLowerCase();
    const lineIdx = doc.lineAt(d.start);
    const line = doc.lines[lineIdx];
    const lineHead = line ? doc.flat.slice(line.start, d.start).toLowerCase() : "";
    if (/dated\s+(this|the|on)\s*$/.test(before) || /day\s+of/i.test(d.raw)) score += 6;
    else if (/^\s*(date|dated)\s*[:.\-–]?\s*$/.test(lineHead)) score += 5;
    else if (/\b(date|dated)\s*[:.\-–]?\s*$/.test(before) && !/(memo|cheque|chq|receipt|notice of|birth)\s+dated\s*$/.test(before)) score += 3;
    if (/(memo|cheque|chq|award|order|receipt)\s+dated\s*$/.test(before)) score -= 5;
    if (/\b(on|before|from|till|upto|until|since)\s*$/.test(before)) score -= 3;
    if (d.iso === maxIso) score += 3;
    if (lineIdx >= 0 && lineIdx < 6) score += 1;
    if (lineIdx >= doc.lines.length - 8) score += 1;
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score || (b.d.iso > a.d.iso ? 1 : -1));
  const top = scored[0];
  if (!top || top.score < 3) return null;
  const certainty = top.score >= 8 ? 0.92 : top.score >= 6 ? 0.85 : top.score >= 4 ? 0.7 : 0.55;
  return { iso: top.d.iso, span: doc.span(top.d.start, top.d.end), certainty };
}

/** The cheque amount as the notice states it — not the notice cost, not interest. */
function noticeAmount(doc: Doc, dates: DateHit[]): { digits: string; span: Span; certainty: number } | null {
  const hits = findAmounts(doc).filter((a) => !dates.some((d) => a.start < d.end && a.end > d.start) && a.value >= 100);
  if (!hits.length) return null;
  const maxValue = Math.max(...hits.map((h) => h.value));
  const scored = hits.map((a) => {
    let score = 0;
    const before = doc.flat.slice(Math.max(0, a.start - 90), a.start).toLowerCase();
    const after = doc.flat.slice(a.end, a.end + 160).toLowerCase();
    if (a.hasSymbol) score += 2;
    if (a.hasCommas && a.groupingOk) score += 2;
    if (a.hasCommas && !a.groupingOk) score -= 4;
    if (!a.hasSymbol && !a.hasCommas) score -= 3;
    if (/cheque|chq|instrument/.test(before)) score += 2;
    if (/amount\s*(of)?\s*(rs\.?|₹|inr)?\s*$/.test(before)) score += 1;
    if (/(cost|costs|expenses|charges|fee|fees|interest|compensation|damages|towards\s+cost|as\s+cost|per\s+annum|@)\s*(of\s*)?(rs\.?|₹|inr)?\s*$/.test(before)) score -= 4;
    if (/^\s*(\(|\/-|\s)*\s*(?:as|towards|being)\s+(the\s+)?(cost|expenses|charges|fee)/.test(after)) score -= 4;
    if (/^\s*\(?\s*(rupees\s+)?[a-z]+(\s+[a-z]+){1,12}\s+(rupees\s+)?only\)?/.test(after)) {
      // "(Three Lakhs Twenty Two Thousand and Five Hundred Rupees only)" — matching words are strong evidence.
      const words = wordsToAmount(after.slice(0, (after.match(/only/)?.index ?? 0) + 4).replace(/^[\s(]*/, ""));
      if (words && words.value === a.value) score += 5;
      else score += 1;
    }
    if (a.value === maxValue) score += 2;
    return { a, score };
  });
  scored.sort((x, y) => y.score - x.score);
  const top = scored[0];
  if (!top || top.score < 3) return null;
  // Same figure repeated across the notice — count agreement.
  const agree = hits.filter((h) => h.digits === top.a.digits).length;
  const certainty = Math.min(0.95, 0.55 + 0.05 * Math.min(top.score, 6) + (agree > 1 ? 0.1 : 0));
  return { digits: top.a.digits, span: doc.span(top.a.start, top.a.end), certainty };
}

function noticeChequeNumber(doc: Doc): { value: string; span: Span; certainty: number } | null {
  const re = /\b(?:cheque|chq|check)s?\b[^\n]{0,40}?\b(?:no|number|bearing\s*no|numbered)\.?\s*[:.\-–]?\s*(\d{6})(?![\d])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc.flat))) {
    const s = m.index + m[0].length - 6;
    const before = doc.flat.slice(Math.max(0, s - 12), s).toLowerCase();
    if (/pin\s*[:.-]?\s*$/.test(before)) continue;
    return { value: m[1], span: doc.span(s, s + 6), certainty: 0.85 };
  }
  return null;
}

/* ───────────────────────────── Postal receipt ───────────────────────────── */

const COURIERS = /\b(dtdc|blue\s*dart|bluedart|delhivery|professional\s*couriers?|dhl|fedex|xpressbees|ecom\s*express|trackon|gati|first\s*flight|st\s*courier|akash\s*ganga|shree\s*maruti|the\s*professional|courier)\b/i;

export const parseDispatchProof: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};
  const dates = findDates(doc);

  const tracking = findTracking(doc);
  if (tracking) out.tracking = field(tracking.value, conf(tracking.span, tracking.certainty), tracking.span);

  const mode = findMode(doc, tracking?.value);
  if (mode) out.modeService = field(mode.value, conf(mode.span, mode.certainty, doc), mode.span);

  const when = receiptDate(doc, dates);
  if (when) out.dispatchDate = field(when.iso, conf(when.span, when.certainty), when.span);

  return out;
};

const DIGIT_MAP: Record<string, string> = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", G: "6", B: "8" };

/** India Post article number (EK123456789IN) or a long courier consignment number. */
export function findTracking(doc: Doc): { value: string; span: Span; certainty: number } | null {
  // India Post: 2 letters, 9 digits, "IN" — allow OCR letter-for-digit in the middle.
  const re = /(?<![A-Z0-9])([A-Z]{2})\s?([0-9OQDILZSGB]{9})\s?(IN|1N|lN)(?![A-Z0-9])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc.upper))) {
    const digits = m[2].split("").map((c) => (/\d/.test(c) ? c : DIGIT_MAP[c] ?? "")).join("");
    if (digits.length !== 9) continue;
    const real = (m[2].match(/\d/g) ?? []).length;
    return { value: `${m[1]}${digits}IN`, span: doc.span(m.index, m.index + m[0].length), certainty: real >= 8 ? 0.92 : 0.75 };
  }
  // Courier / consignment number near its label.
  const lab = /\b(?:consignment|awb|docket|tracking|article|barcode|cn|c\.n\.|ref(?:erence)?)\s*(?:no|number|#)?\.?\s*[:.\-–]?\s*([A-Z0-9]{8,16})(?![A-Z0-9])/i.exec(doc.flat);
  if (lab && /\d{6,}/.test(lab[1])) {
    const s = lab.index + lab[0].length - lab[1].length;
    return { value: lab[1].toUpperCase(), span: doc.span(s, s + lab[1].length), certainty: 0.75 };
  }
  return null;
}

function findMode(doc: Doc, tracking?: string): { value: string; span?: Span; certainty: number } | null {
  const speed = doc.fuzzy("speed post", 1);
  if (speed) return { value: "speed", span: doc.span(speed.start, speed.end), certainty: 0.9 };
  const regRe = /\b(?:registered\s*(?:post|letter|mail|article|a\.?d\.?)?|regd\.?\s*(?:post|ad|a\.?d\.?)?|rpad|r\.p\.a\.d\.?|RL|R\.L\.)(?![A-Za-z])/gi;
  let reg: RegExpExecArray | null;
  while ((reg = regRe.exec(doc.flat))) {
    const after = doc.flat.slice(reg.index + reg[0].length, reg.index + reg[0].length + 12).toLowerCase();
    const before = doc.flat.slice(Math.max(0, reg.index - 8), reg.index).toLowerCase();
    if (/^\s*office/.test(after) || /gst\w*\s*$/.test(before)) continue;
    return { value: "rpad", span: doc.span(reg.index, reg.index + reg[0].length), certainty: 0.85 };
  }
  const courier = COURIERS.exec(doc.flat);
  if (courier) return { value: "courier", span: doc.span(courier.index, courier.index + courier[0].length), certainty: 0.8 };
  if (tracking && /^E[A-Z]\d{9}IN$/.test(tracking)) return { value: "speed", certainty: 0.7 };
  if (tracking && /^R[A-Z]\d{9}IN$/.test(tracking)) return { value: "rpad", certainty: 0.7 };
  return null;
}

function receiptDate(doc: Doc, dates: DateHit[]): { iso: string; span: Span; certainty: number } | null {
  const strict = dates.filter((d) => !d.weak);
  const labelled = dateAfterLabel(
    doc,
    /\b(?:date|dated|booked\s*(?:on|at|date)|booking\s*date|date\s*of\s*(?:booking|posting|dispatch|despatch)|posted\s*on|dispatched\s*on|despatched\s*on)\b/i,
    strict,
    { maxGap: 40 }
  );
  if (labelled) return { iso: labelled.hit.iso, span: doc.span(labelled.hit.start, labelled.hit.end), certainty: 0.85 };
  if (strict.length === 1) return { iso: strict[0].iso, span: doc.span(strict[0].start, strict[0].end), certainty: 0.65 };
  if (strict.length > 1) {
    // Receipts print the booking date/time; take the earliest (later dates are "deliver by").
    const first = [...strict].sort((a, b) => (a.iso < b.iso ? -1 : 1))[0];
    return { iso: first.iso, span: doc.span(first.start, first.end), certainty: 0.5 };
  }
  return null;
}

/* ───────────────────────────── Delivery proof ───────────────────────────── */

export const parseDeliveryProof: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};
  const dates = findDates(doc).filter((d) => !d.weak);
  if (!dates.length) return out;

  const labelled = dateAfterLabel(
    doc,
    /\b(?:delivered\s*(?:on|date)?|delivery\s*(?:date|on)|date\s*of\s*delivery|received\s*(?:on|date)?|receipt\s*date|date\s*of\s*receipt|signature\s*of\s*(?:the\s*)?(?:addressee|recipient)|item\s*delivered)\b/i,
    dates,
    { maxGap: 40 }
  );
  if (labelled) {
    out.deliveryDate = field(labelled.hit.iso, conf(doc.span(labelled.hit.start, labelled.hit.end), 0.85), doc.span(labelled.hit.start, labelled.hit.end));
    return out;
  }
  if (dates.length === 1) {
    out.deliveryDate = field(dates[0].iso, conf(doc.span(dates[0].start, dates[0].end), 0.6), doc.span(dates[0].start, dates[0].end));
    return out;
  }
  if (dates.length <= 3) {
    // Booking postmark and delivery postmark: delivery is the later one.
    const last = [...dates].sort((a, b) => (a.iso > b.iso ? -1 : 1))[0];
    out.deliveryDate = field(last.iso, conf(doc.span(last.start, last.end), 0.5), doc.span(last.start, last.end));
  }
  return out;
};
