/**
 * Field keys each document type can yield. `applyExtraction` maps these onto the draft;
 * parsers must use exactly these keys. Values are strings in draft form: ISO dates
 * (`yyyy-mm-dd`), amounts as digit strings with Indian grouping ("50,25,000"), option
 * values for enumerations (see options.ts), everything else trimmed text.
 */

import type { IntakeDocType } from "../types";

export const FIELD_KEYS = {
  "cheque-front": [
    "dateOnCheque",
    "amount",
    "chequeNumber",
    "ifsc",
    "bankName",
    "bankBranch",
    "payee",
    "micr",
    "account",
  ],
  "return-memo": [
    "returnDate",
    "presentDate",
    "returnReason", // option value from RETURN_REASONS
    "chequeNumber",
    "amount",
  ],
  "demand-notice": ["dispatchDate", "amount", "chequeNumber"],
  "dispatch-proof": ["dispatchDate", "tracking", "modeService"], // modeService: option value from MODE_OF_SERVICE
  "delivery-proof": ["deliveryDate"],
  "notice-reply": [],
  "id-proof": ["name", "age", "dob", "pin", "address", "district", "state", "idNumber"],
  poa: [],
  vakalatnama: [],
  other: [],
  supporting: [],
} as const satisfies Record<IntakeDocType, readonly string[]>;

export type FieldKeyOf<T extends IntakeDocType> = (typeof FIELD_KEYS)[T][number];
