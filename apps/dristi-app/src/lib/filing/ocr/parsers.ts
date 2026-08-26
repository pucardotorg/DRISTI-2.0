/**
 * Document type → parser. Pure (no DOM): the engine feeds OCR words in, fields come out.
 * A parser that throws yields no fields — a bad read must never fail the upload.
 */

import type { IntakeDocType } from "../types";
import { FIELD_KEYS } from "./fields";
import { parseCheque } from "./parse-cheque";
import { type ParseInput, type ParsedFields, type Parser } from "./parse-common";
import { parseIdProof } from "./parse-id";
import { parseMemo } from "./parse-memo";
import { parseDeliveryProof, parseDemandNotice, parseDispatchProof } from "./parse-notice";

const PARSERS: Partial<Record<IntakeDocType, Parser>> = {
  "cheque-front": parseCheque,
  "return-memo": parseMemo,
  "demand-notice": parseDemandNotice,
  "dispatch-proof": parseDispatchProof,
  "delivery-proof": parseDeliveryProof,
  "id-proof": parseIdProof,
};

/**
 * Free-text fields are only worth pre-filling when the read is reasonably clean — a
 * garbled branch or payee costs more to notice and delete than to type. Numeric and
 * enumerated fields keep a low floor: they are cheap to check against the highlighted
 * source and usually right even when the surrounding text is noisy.
 */
const TEXT_FIELDS = new Set(["bankBranch", "payee", "name", "address", "district"]);
const TEXT_FLOOR = 30;
const FLOOR = 10;

/** Run the parser for `docType`; only keys listed in FIELD_KEYS with non-empty values survive. */
export function parseDocument(docType: IntakeDocType, input: ParseInput): ParsedFields {
  const parser = PARSERS[docType];
  if (!parser) return {};
  let raw: ParsedFields;
  try {
    raw = parser(input);
  } catch {
    return {};
  }
  const allowed = new Set<string>(FIELD_KEYS[docType]);
  const out: ParsedFields = {};
  for (const [k, f] of Object.entries(raw)) {
    if (!allowed.has(k)) continue;
    if (!f || typeof f.value !== "string" || !f.value.trim()) continue;
    if (f.confidence < (TEXT_FIELDS.has(k) ? TEXT_FLOOR : FLOOR)) continue;
    out[k] = f;
  }
  return out;
}
