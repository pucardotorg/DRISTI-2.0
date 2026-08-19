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
  { value: "institution", label: "Institution" },
];

/** Legal form, asked only once the accused is an institution. */
export const ACCUSED_ENTITY_TYPES: Option[] = [
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership firm" },
  { value: "private-limited", label: "Private limited company" },
  { value: "public-limited", label: "Public limited company" },
  { value: "society-trust", label: "Society / trust" },
  { value: "llp", label: "LLP" },
  { value: "other", label: "Other entity" },
];

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
 * What the court charges for an S-138 complaint.
 *
 * Two kinds of line, and the difference matters to the person paying. **Court fees** are
 * due before the complaint is registered at all. **Process fees** buy the delivery of
 * notice, summons and warrants to the accused — the court lets those be paid later, so
 * they are billed per process and per address and can be deferred as a group.
 *
 * Amounts are the sandbox's schedule: fee computation belongs to the court, not to this
 * app, and every total here is derived from these lines rather than typed in anywhere.
 *
 * ENGINEERING SEAM — a live deployment reads this schedule from the court's fee master.
 * Keep the shape: the screen needs to know which lines are deferrable and which scale
 * with the number of addresses, or it cannot state a truthful total.
 */
export type FeeLine = {
  key: string;
  label: string;
  /** Rupees per unit — per filing, or per address when `perAddress`. */
  amount: number;
  /** Charged once for every address process is served at. */
  perAddress?: boolean;
  note?: string;
};

/** Due before the complaint is registered. */
export const COURT_FEE_LINES: FeeLine[] = [
  { key: "complaint", label: "Complaint fee", amount: 25 },
  { key: "legal-benefit", label: "Legal Benefit Fund", amount: 25 },
  { key: "advocate-welfare", label: "Advocate Welfare Fund", amount: 25 },
  { key: "clerk-welfare", label: "Advocate Clerk Welfare Fund", amount: 25 },
  { key: "delay-notice", label: "Court fee — delay notice", amount: 1 },
];

/** Charged only when the complaint is filed after the one-month limitation period. */
export const CONDONATION_FEE: FeeLine = {
  key: "condonation",
  label: "Application fee — condonation of delay",
  amount: 25,
  note: "Charged because this complaint is being filed after the limitation period.",
};

/**
 * Delivery. Keyed to `PROCESS_TYPES` so the bill only lists what the filer actually asked
 * the court to issue, and multiplied by the addresses process is served at.
 */
export const PROCESS_FEE_LINES: FeeLine[] = [
  { key: "notice", label: "Process fee — notice", amount: 49, perAddress: true },
  { key: "summons", label: "Process fee — summons", amount: 49, perAddress: true },
  { key: "warrants", label: "Process fee — warrants", amount: 50, perAddress: true },
];

/**
 * What the delivery channel itself charges — the registered-post or courier tariff the
 * court passes on. It is a placeholder rate until e-post is integrated, which is the
 * point at which this becomes a real per-article charge rather than a flat one.
 */
export const CHANNEL_FEE: FeeLine = {
  key: "channel",
  label: "Delivery channel fee",
  amount: 10,
  perAddress: true,
  note: "Placeholder rate — set by the delivery channel once e-post is integrated.",
};


/* ───────────────────────────── Police stations ─────────────────────── */

/**
 * Stations in the districts this court serves. A real deployment reads these from the
 * state police directory; the list is here so the field can be searched rather than
 * typed from memory, and it stays open — an address outside it is still accepted.
 */
export const POLICE_STATIONS: string[] = [
  "Kollam East Police Station",
  "Kollam West Police Station",
  "Kollam Beach Police Station",
  "Kilikolloor Police Station",
  "Sakthikulangara Police Station",
  "Chinnakada Police Station",
  "Eravipuram Police Station",
  "Karunagappally Police Station",
  "Chavara Police Station",
  "Kottarakkara Police Station",
  "Punalur Police Station",
  "Pathanapuram Police Station",
  "Anchal Police Station",
  "Kunnathur Police Station",
  "Chathannoor Police Station",
  "Paravur Police Station",
  "Oachira Police Station",
  "Kadakkal Police Station",
  "Chadayamangalam Police Station",
  "Pooyappally Police Station",
];
