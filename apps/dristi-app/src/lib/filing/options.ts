/**
 * Option lists and template copy for the e-filing flow.
 *
 * Copy is sentence case (DS Law) except legal abbreviations and proper nouns. Live
 * lookups (IFSC, PIN) live in lookups.ts; there are no mock registries here.
 */

export type Option = { value: string; label: string };

export const CASE_TYPE = {
  code: "s138",
  short: "S-138, NI Act",
  title: "Cheque bounce (S-138, NI Act)",
  offence: "Section 138, Negotiable Instruments Act, 1881",
} as const;

export const COURT = {
  name: "24×7 ON Court, Kollam",
  brand: "24x7 ON Courts",
  place: "Kollam, Kerala",
} as const;

/* ───────────────────────────── Geography ───────────────────────────── */

/** States and union territories, for the address selects. District comes from the PIN. */
export const STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

/* ───────────────────────────── Complainant ─────────────────────────── */

export const ENTITY_TYPES: Option[] = [
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership firm" },
  { value: "private-limited", label: "Private limited company" },
  { value: "public-limited", label: "Public limited company" },
  { value: "society-trust", label: "Society / trust" },
  { value: "llp", label: "LLP" },
];

export const AFFIDAVIT_PIP_TEMPLATE = [
  "<p>Request permission to appear and argue in person, as a party in person.</p>",
  "<p>I have not engaged any advocate for this case.</p>",
  "<p>I give an undertaking that I will maintain decorum of the Court and will not use or express objectionable and unparliamentary language or behaviour during the course of hearing in the Court premises or in any pleadings.</p>",
  "<p>Kindly grant me permission to appear in person and conduct the proceedings.</p>",
].join("");

/* ───────────────────────────── Accused ─────────────────────────────── */

export const ACCUSED_TYPES: Option[] = [
  { value: "individual", label: "Individual" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership firm" },
  { value: "company", label: "Company" },
  { value: "other", label: "Other entity" },
];

export const ACCUSED_TYPE_HEADING: Record<string, string> = {
  individual: "Accused",
  proprietorship: "Proprietorship",
  partnership: "Partnership firm",
  company: "Company",
  other: "Entity",
};

/* ───────────────────────────── Cheque & return memo ────────────────── */

export const RETURN_REASONS: Option[] = [
  { value: "funds-insufficient", label: "Funds insufficient" },
  { value: "exceeds-arrangement", label: "Exceeds arrangement" },
  { value: "account-closed", label: "Account closed" },
  { value: "payment-stopped", label: "Payment stopped by drawer" },
  { value: "signature-differs", label: "Drawer's signature differs / incomplete" },
  { value: "amount-mismatch", label: "Amount in words and figures differ" },
  { value: "refer-to-drawer", label: "Refer to drawer" },
  { value: "stale-cheque", label: "Cheque post-dated / stale" },
];

/** Reasons that squarely attract S-138 — anything else shows the check-applicability warning. */
export const S138_SAFE_REASONS = new Set(["funds-insufficient", "exceeds-arrangement"]);

/* ───────────────────────────── Demand notice & debt ────────────────── */

export const NATURE_OF_DEBT: Option[] = [
  { value: "loan", label: "Loan / advance repayment" },
  { value: "goods", label: "Payment for goods supplied" },
  { value: "services", label: "Payment for services rendered" },
  { value: "business", label: "Business / trade transaction" },
  { value: "borrowed", label: "Repayment of borrowed money" },
  { value: "other", label: "Other liability" },
];

export const WHY_ISSUED: Option[] = [
  { value: "loan-repay", label: "Towards repayment of a loan" },
  { value: "goods-pay", label: "Towards payment for goods" },
  { value: "services-pay", label: "Towards payment for services" },
  { value: "security", label: "As security, subsequently enforced" },
  { value: "discharge", label: "Discharge of an existing debt" },
  { value: "other", label: "Other" },
];

export const MODE_OF_SERVICE: Option[] = [
  { value: "rpad", label: "Registered post (RPAD)" },
  { value: "speed", label: "Speed post" },
  { value: "courier", label: "Courier" },
  { value: "email", label: "Email" },
  { value: "hand", label: "Hand delivery" },
  { value: "fax", label: "Fax" },
];

export const NON_DELIVERY_REASONS: Option[] = [
  { value: "not-available", label: "Addressee not available" },
  { value: "refused", label: "Refused to accept" },
  { value: "incomplete", label: "Address incomplete / incorrect" },
  { value: "left", label: "Left without instructions" },
  { value: "unclaimed", label: "Unclaimed" },
  { value: "lost", label: "Item lost in transit" },
  { value: "other", label: "Other" },
];

export const PAYMENT_STATUS: Option[] = [
  { value: "none", label: "No payment made" },
  { value: "part", label: "Part payment made" },
];

/* ───────────────────────────── ADR & prayer ────────────────────────── */

export const INTERIM_RELIEF_TEMPLATE = [
  "<p>It is, therefore, most respectfully prayed that this Hon'ble Court may be pleased to:</p>",
  "<p>Direct the Accused to pay interim compensation to the Complainant under Section 143A of the Negotiable Instruments Act, 1881, during the pendency of the trial, of a sum not exceeding 20% of the cheque amount, within 60 days of the order or such further period not exceeding 30 days as this Hon'ble Court may allow for sufficient cause shown.</p>",
].join("");

export const FINAL_RELIEF_TEMPLATE = [
  "<p>It is most respectfully prayed that this Hon'ble Court may be pleased to:</p>",
  "<p>(a) Take cognizance of the offence committed by the Accused under Section 138 of the Negotiable Instruments Act, 1881;</p>",
  "<p>(b) Issue process / summons against the Accused and direct him/her to appear before this Hon'ble Court;</p>",
  "<p>(c) Upon trial, convict and sentence the Accused under Section 138 of the Negotiable Instruments Act, 1881, to imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both;</p>",
  "<p>(d) Direct the Accused to pay compensation to the Complainant under Section 395 of the Bharatiya Nagarik Suraksha Sanhita, 2023, equivalent to the cheque amount along with interest @ 6% per annum from the date of dishonour;</p>",
  "<p>(e) Grant such other and further relief(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case.</p>",
].join("");

/* ───────────────────────────── Sign & pay ──────────────────────────── */

export const DELIVERY_CHANNELS = ["RPAD", "Speed post", "Courier", "Email"];

export const PROCESS_TYPES: { key: string; label: string; optional: boolean }[] = [
  { key: "notice", label: "Notice", optional: false },
  { key: "summons", label: "Summons", optional: true },
  { key: "warrants", label: "Warrants", optional: true },
];

/**
 * Court fee lines for an S-138 complaint in the ON Court. Amounts here are the sandbox's
 * schedule (fee computation is the court's, not the app's); the total is derived.
 */
export const COURT_FEE_LINES: { label: string; amount: number }[] = [
  { label: "Court fee", amount: 100 },
  { label: "Advocate Welfare Fund", amount: 5 },
  { label: "Process fee (notice to accused)", amount: 60 },
];

