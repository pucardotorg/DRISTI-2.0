/**
 * Identity proof (Aadhaar, PAN, voter ID, passport, driving licence) → name, dob, age,
 * address, pin, district, state, idNumber. Aadhaar is the common case: front has the
 * name over "Date of Birth/DOB:", back has "Address:" through "<State> - <PIN>", with the
 * regional-language column beside it reading as low-confidence noise.
 */

import { STATES } from "../options";
import {
  BIRTH_YEARS,
  Doc,
  type DateHit,
  type ParsedFields,
  type Parser,
  type Span,
  cleanText,
  conf,
  dateAfterLabel,
  editDistance,
  field,
  findDates,
  titleCaseName,
} from "./parse-common";

type IdKind = "aadhaar" | "pan" | "voter" | "passport" | "dl" | "unknown";

export const parseIdProof: Parser = (input) => {
  const doc = new Doc(input);
  const out: ParsedFields = {};

  const id = findIdNumber(doc);
  const kind = id?.kind ?? detectKind(doc);
  if (id) out.idNumber = field(id.value, conf(id.span, id.certainty), id.span);

  const dates = findDates(doc, BIRTH_YEARS);
  const dob = findDob(doc, dates, kind);
  if (dob) {
    if (dob.iso) out.dob = field(dob.iso, conf(dob.span, dob.certainty), dob.span);
    const age = ageFrom(dob.iso || `${dob.year}-07-01`);
    if (age !== null) out.age = field(String(age), conf(dob.span, dob.iso ? dob.certainty : dob.certainty - 0.15), dob.span);
  }

  const name = findName(doc, kind, dob?.span);
  if (name) out.name = field(name.text, conf(name.span, name.certainty), name.span);

  const addr = findAddress(doc);
  if (addr) {
    if (addr.line1) out.address = field(addr.line1.text, conf(addr.line1.span, addr.line1.certainty), addr.line1.span);
    if (addr.pin) out.pin = field(addr.pin.text, conf(addr.pin.span, addr.pin.certainty), addr.pin.span);
    if (addr.state) out.state = field(addr.state.text, conf(addr.state.span, addr.state.certainty), addr.state.span);
    if (addr.district) out.district = field(addr.district.text, conf(addr.district.span, addr.district.certainty), addr.district.span);
  }

  return out;
};

/* ───────────────────────────── ID number ───────────────────────────── */

// Verhoeff tables — Aadhaar's check digit.
const V_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const V_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function verhoeffValid(num: string): boolean {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = V_D[c][V_P[i % 8][digits[i]]];
  return c === 0;
}

function findIdNumber(doc: Doc): { kind: IdKind; value: string; span: Span; certainty: number } | null {
  // Aadhaar: 4-4-4 (or 12 digits), not the VID (16 digits), Verhoeff-valid, never starts 0/1.
  const aad = /(?<!\d[\s-]?)([2-9]\d{3})[\s-]?(\d{4})[\s-]?(\d{4})(?![\s-]?\d)/g;
  let m: RegExpExecArray | null;
  let firstAadhaar: { value: string; span: Span; valid: boolean } | null = null;
  while ((m = aad.exec(doc.flat))) {
    const before = doc.flat.slice(Math.max(0, m.index - 6), m.index);
    if (/VID\s*[:.]?\s*$/i.test(before)) continue;
    const digits = m[1] + m[2] + m[3];
    const valid = verhoeffValid(digits);
    const cand = { value: `${m[1]} ${m[2]} ${m[3]}`, span: doc.span(m.index, m.index + m[0].length), valid };
    if (valid) return { kind: "aadhaar", value: cand.value, span: cand.span, certainty: 0.95 };
    if (!firstAadhaar) firstAadhaar = cand;
  }
  const pan = /(?<![A-Z0-9])([A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z])(?![A-Z0-9])/.exec(doc.upper);
  if (pan) return { kind: "pan", value: pan[1], span: doc.span(pan.index, pan.index + pan[0].length), certainty: 0.9 };
  const voter = /(?<![A-Z0-9])([A-Z]{3}\d{7})(?![A-Z0-9])/.exec(doc.upper);
  if (voter && /elect|epic|voter|commission/i.test(doc.flat)) {
    return { kind: "voter", value: voter[1], span: doc.span(voter.index, voter.index + voter[0].length), certainty: 0.85 };
  }
  const dl = /(?<![A-Z0-9])([A-Z]{2})[\s-]?(\d{2})[\s-]?(\d{4})[\s-]?(\d{7})(?![A-Z0-9])/.exec(doc.upper);
  if (dl && /driv|licen|transport|dl\s*no/i.test(doc.flat)) {
    return { kind: "dl", value: `${dl[1]}${dl[2]}${dl[3]}${dl[4]}`, span: doc.span(dl.index, dl.index + dl[0].length), certainty: 0.8 };
  }
  const passport = /(?<![A-Z0-9])([A-Z]\d{7})(?![A-Z0-9])/.exec(doc.upper);
  if (passport && /passport|republic of india/i.test(doc.flat)) {
    return { kind: "passport", value: passport[1], span: doc.span(passport.index, passport.index + passport[0].length), certainty: 0.8 };
  }
  if (firstAadhaar && /aadhaar|aadhar|uidai|unique identification/i.test(doc.flat)) {
    // Checksum failed — one digit misread. Still worth showing, low confidence.
    return { kind: "aadhaar", value: firstAadhaar.value, span: firstAadhaar.span, certainty: 0.5 };
  }
  return null;
}

function detectKind(doc: Doc): IdKind {
  const t = doc.flat.toLowerCase();
  if (/aadhaar|aadhar|uidai|unique identification/.test(t)) return "aadhaar";
  if (/income tax|permanent account/.test(t)) return "pan";
  if (/election commission|elector|epic/.test(t)) return "voter";
  if (/passport/.test(t)) return "passport";
  if (/driving licen[cs]e|transport/.test(t)) return "dl";
  return "unknown";
}

/* ───────────────────────────── DOB & age ───────────────────────────── */

const DOB_LABEL = /\b(?:date\s*of\s*birth|dob|d\.o\.b\.?|birth|born|yob|year\s*of\s*birth)\b/i;

function findDob(doc: Doc, dates: DateHit[], kind: IdKind): { iso: string; year?: number; span: Span; certainty: number } | null {
  const strict = dates.filter((d) => !d.weak);
  const labelled = dateAfterLabel(doc, DOB_LABEL, strict, { maxGap: 30 });
  if (labelled && ageFrom(labelled.hit.iso) !== null) {
    return { iso: labelled.hit.iso, span: doc.span(labelled.hit.start, labelled.hit.end), certainty: 0.92 };
  }
  // "Year of Birth: 1970"
  const yob = /\b(?:year\s*of\s*birth|yob)\s*[:.\-–]?\s*((?:19|20)\d{2})(?!\d)/i.exec(doc.flat);
  if (yob) {
    const year = Number(yob[1]);
    const age = new Date().getFullYear() - year;
    if (age >= 18 && age <= 100) {
      const s = yob.index + yob[0].length - 4;
      return { iso: "", year, span: doc.span(s, s + 4), certainty: 0.8 };
    }
  }
  // Unlabelled (old PAN cards print the DOB bare): the earliest plausible birth date.
  if (kind !== "unknown") {
    const plausible = strict.filter((d) => ageFrom(d.iso) !== null).sort((a, b) => (a.iso < b.iso ? -1 : 1));
    if (plausible.length === 1 || (plausible.length > 1 && kind === "pan")) {
      const d = plausible[0];
      return { iso: d.iso, span: doc.span(d.start, d.end), certainty: 0.6 };
    }
  }
  return null;
}

/** Whole years from an ISO date of birth to today; null unless 18–100. */
export function ageFrom(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const now = new Date();
  let age = now.getFullYear() - Number(m[1]);
  const birthdayPassed =
    now.getMonth() + 1 > Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() >= Number(m[3]));
  if (!birthdayPassed) age -= 1;
  return age >= 18 && age <= 100 ? age : null;
}

/* ───────────────────────────── Name ───────────────────────────── */

const NAME_STOP = /\b(name|dob|birth|male|female|year|address|india|government|govt|father|husband|mother|date|department|income|tax|authority|identification|unique|election|commission|passport|republic|licen[cs]e|signature|issue|download|valid|s\/o|d\/o|w\/o|c\/o)\b/i;

/** 1–5 name-shaped tokens with no digits, no labels, no OCR-noise casing. */
export function nameLike(text: string): boolean {
  const t = cleanText(text).replace(/[.,]+$/, "");
  if (!t || t.length > 60) return false;
  if (NAME_STOP.test(t)) return false;
  const tokens = t.split(/\s+/);
  if (tokens.length < 1 || tokens.length > 5) return false;
  let long = 0;
  for (const tok of tokens) {
    if (!/^[A-Za-z][A-Za-z.'-]*$/.test(tok)) return false;
    if (/[a-z][A-Z]/.test(tok)) return false; // "wT", "gEETA"
    if (tok.length >= 4 && !/[aeiouy]/i.test(tok)) return false;
    if (tok.length >= 3) long++;
  }
  return long >= 1 && (tokens.length === 1 ? tokens[0].length >= 4 : true);
}

function findName(doc: Doc, kind: IdKind, dobSpan?: Span): { text: string; span: Span; certainty: number } | null {
  // 1. Labelled: "Name: X" / "Elector's Name : X" / "Given Name(s)" — not "Father's Name".
  const labelRe = /(?<![A-Za-z'’] ?)(?:(?:elector'?s|holder'?s|applicant'?s|given|surname\s*\/?\s*)?\s*name(?:\s*of\s*(?:the\s*)?(?:holder|applicant|card\s*holder))?)\s*[:.\-–]?\s*([^\n]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(doc.flat))) {
    const before = doc.flat.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    if (/(father|husband|mother|bank|branch|guardian|spouse)'?s?\s*$/.test(before)) continue;
    let value = m[1];
    let start = m.index + m[0].length - m[1].length;
    if (!cleanText(value)) {
      // Value on the next line (new-format PAN).
      const li = doc.lineAt(m.index);
      const next = doc.lines[li + 1];
      if (!next) continue;
      value = next.text;
      start = next.start;
    }
    const picked = leadingName(value);
    if (picked) {
      const span = doc.span(start, start + picked.length);
      if (span.confidence >= 55) return { text: titleCaseName(picked), span, certainty: 0.85 };
    }
  }
  // 2. Positional: the line above the DOB (Aadhaar, voter) or two above (old PAN).
  if (dobSpan) {
    const li = doc.lineAt(dobSpan.start);
    const offsets = kind === "pan" ? [2, 1] : [1, 2];
    for (const off of offsets) {
      const line = doc.lines[li - off];
      if (!line) continue;
      const picked = leadingName(line.text);
      if (!picked) continue;
      const span = doc.span(line.start, line.start + picked.length);
      if (span.confidence < 60) continue;
      return { text: titleCaseName(picked), span, certainty: 0.75 };
    }
  }
  // 3. e-Aadhaar / voter layouts: the line above the "S/O / D/O / W/O / C/O" relation line.
  const rel = /(?<![A-Za-z])(?:s|d|w|c|h)\s?\/\s?o\b/i.exec(doc.flat);
  if (rel) {
    const li = doc.lineAt(rel.index);
    const line = doc.lines[li - 1];
    const picked = line ? leadingName(line.text) : null;
    if (picked) {
      const span = doc.span(line.start, line.start + picked.length);
      if (span.confidence >= 60) return { text: titleCaseName(picked), span, certainty: 0.7 };
    }
  }
  // 4. Aadhaar without a readable DOB: the line above "Male/Female".
  const sex = /\b(male|female|transgender)\b/i.exec(doc.flat);
  if (sex) {
    const li = doc.lineAt(sex.index);
    for (const off of [1, 2]) {
      const line = doc.lines[li - off];
      if (!line) continue;
      const picked = leadingName(line.text);
      if (!picked) continue;
      const span = doc.span(line.start, line.start + picked.length);
      if (span.confidence < 60) continue;
      return { text: titleCaseName(picked), span, certainty: 0.65 };
    }
  }
  return null;
}

/** The longest name-like prefix of a line (drops trailing OCR noise). */
function leadingName(text: string): string | null {
  const tokens = cleanText(text).split(/\s+/).filter(Boolean);
  for (let n = Math.min(5, tokens.length); n >= 1; n--) {
    const cand = tokens.slice(0, n).join(" ");
    if (nameLike(cand)) return cand.replace(/[.,]+$/, "");
  }
  return null;
}

/* ───────────────────────────── Address ───────────────────────────── */

type Piece = { text: string; span: Span; certainty: number };

function findAddress(doc: Doc): { line1?: Piece; pin?: Piece; state?: Piece; district?: Piece } | null {
  const label = /(?<![A-Za-z])(?:address|addr|permanent\s*address|present\s*address|residence)\s*[:.\-–]?/i.exec(doc.flat);
  let startLine = -1;
  let afterLabel = 0;
  if (label) {
    startLine = doc.lineAt(label.index);
    afterLabel = label.index + label[0].length;
  } else {
    const rel = /(?<![A-Za-z])(?:s|d|w|c)\s?\/\s?o\b/i.exec(doc.flat);
    if (rel) {
      startLine = doc.lineAt(rel.index);
      afterLabel = doc.lines[startLine]?.start ?? rel.index;
    }
  }
  const pinRe = /(?<![\d,.])([1-8]\d{5})(?![\d,.])/g;
  const parts: string[] = [];
  const spans: Span[] = [];
  let pin: Piece | undefined;

  if (startLine >= 0) {
    for (let i = startLine; i < Math.min(doc.lines.length, startLine + 7); i++) {
      const line = doc.lines[i];
      const from = i === startLine ? afterLabel : line.start;
      const kept = englishColumn(doc, line.words, from);
      if (kept.text) {
        parts.push(kept.text);
        spans.push(kept.span);
      }
      pinRe.lastIndex = 0;
      let pm: RegExpExecArray | null;
      let found = false;
      while ((pm = pinRe.exec(line.text))) {
        const s = line.start + pm.index;
        pin = { text: pm[1], span: doc.span(s, s + 6), certainty: 0.9 };
        found = true;
        break;
      }
      if (found) break;
      if (i > startLine && !kept.text) break; // the block ended
    }
  }
  if (!pin) {
    const lab = /\b(?:pin\s*code|pincode|pin|postal\s*code|zip)\s*[:.\-–]?\s*([1-8]\d{5})(?!\d)/i.exec(doc.flat);
    if (lab) {
      const s = lab.index + lab[0].length - 6;
      pin = { text: lab[1], span: doc.span(s, s + 6), certainty: 0.85 };
    }
  }

  let addressText = cleanText(parts.join(", ")).replace(/,(\s*,)+/g, ",");
  const state = findState(doc, addressText);
  let district: Piece | undefined;
  let line1: Piece | undefined;

  if (addressText) {
    // Explicit e-Aadhaar labels first.
    const distLab = /\b(?:district|dist)\.?\s*[:.\-–]?\s*([A-Za-z][A-Za-z .]{2,30}?)(?=,|\s+(?:state|pin|sub)|$)/i.exec(addressText);
    if (distLab && nameLike(distLab[1])) {
      district = { text: titleCaseName(distLab[1]), span: spans[0], certainty: 0.8 };
      addressText = cleanText(addressText.replace(distLab[0], "")).replace(/,(\s*,)+/g, ",");
    }

    // Strip "State - PIN" tail and split on commas.
    let tail = addressText;
    if (state) tail = tail.replace(new RegExp(`\\b${escapeRe(state.raw)}\\b[\\s\\S]*$`, "i"), "");
    if (pin) tail = tail.replace(new RegExp(`[\\s,-]*${pin.text}[\\s\\S]*$`), "");
    tail = tail.replace(/\b(?:pin\s*code|pincode|pin|state|dist(?:rict)?)\s*[:.\-–]?\s*$/i, "");
    let pieces = tail
      .split(/\s*,\s*/)
      .map((p) => cleanText(p))
      .filter(Boolean);
    if (!district && state && pieces.length >= 2) {
      const last = pieces[pieces.length - 1].replace(/^(?:dist(?:rict)?\.?\s*[:.-]?\s*)/i, "");
      if (nameLike(last) && !/\d/.test(last)) {
        district = { text: titleCaseName(last), span: spans[spans.length - 1] ?? spans[0], certainty: 0.6 };
        pieces = pieces.slice(0, -1);
      }
    }
    const l1 = cleanText(pieces.join(", "));
    if (l1.length >= 6 && /[A-Za-z]{3}/.test(l1)) {
      const box = spans.length ? doc.span(spans[0].start, spans[spans.length - 1].end) : undefined;
      line1 = { text: l1, span: box ?? doc.span(0, 0), certainty: 0.7 };
    }
    addressText = l1;
  }

  const statePiece: Piece | undefined = state ? { text: state.name, span: state.span, certainty: state.certainty } : undefined;
  if (!line1 && !pin && !statePiece && !district) return null;
  return { line1, pin, state: statePiece, district };
}

/** Left-hand (English) run of a line: stop at the first low-confidence, right-side token. */
function englishColumn(doc: Doc, words: { text: string; confidence: number; bbox: { x0: number } }[], from: number): { text: string; span: Span } {
  const kept: string[] = [];
  let start = -1;
  let end = -1;
  let offset = doc.lines[doc.lineAt(from)]?.start ?? 0;
  for (const w of words) {
    const wStart = offset;
    offset += w.text.length + 1;
    if (wStart < from) continue;
    const rel = doc.page.width ? w.bbox.x0 / doc.page.width : 0;
    const latin = /^[A-Za-z0-9][A-Za-z0-9.,/'()&:#-]*$/.test(w.text) || /^[,.-]$/.test(w.text);
    // Left half: anything Latin. Right half: only confidently read words (the regional column reads as noise).
    const okConf = doc.hasBoxes ? rel < 0.5 || w.confidence >= 60 : w.confidence >= 45;
    if (!latin || !okConf) {
      if (kept.length) break;
      continue;
    }
    if (start < 0) start = wStart;
    end = wStart + w.text.length;
    kept.push(w.text);
  }
  const text = cleanText(kept.join(" "));
  return { text, span: start >= 0 ? doc.span(start, end) : doc.span(from, from) };
}

function findState(doc: Doc, addressText: string): { name: string; raw: string; span: Span; certainty: number } | null {
  let best: { name: string; raw: string; span: Span; certainty: number; score: number } | null = null;
  for (const st of STATES) {
    const compactLen = st.replace(/[^A-Za-z]/g, "").length;
    const maxEdits = compactLen >= 12 ? 2 : compactLen >= 7 ? 1 : 0;
    const hit = doc.fuzzy(st, maxEdits);
    if (!hit) continue;
    const raw = doc.flat.slice(hit.start, hit.end);
    // Short names must stand alone as a word.
    if (compactLen <= 6) {
      const before = doc.flat[hit.start - 1] ?? " ";
      const after = doc.flat[hit.end] ?? " ";
      if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) continue;
    }
    const inAddress = addressText ? new RegExp(escapeRe(raw), "i").test(addressText) : false;
    let score = compactLen - 3 * hit.edits + (inAddress ? 5 : 0);
    // "Bihar" is 5 letters exact; "Delhi" hides in "New Delhi" (still Delhi). Fine.
    if (editDistance(raw.toLowerCase(), st.toLowerCase()) === 0) score += 1;
    if (!best || score > best.score) {
      best = { name: st, raw, span: doc.span(hit.start, hit.end), certainty: hit.edits === 0 ? 0.9 : 0.75, score };
    }
  }
  return best;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
