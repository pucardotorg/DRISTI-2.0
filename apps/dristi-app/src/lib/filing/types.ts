/**
 * E-filing draft model — the shape every filing screen reads and writes.
 *
 * Cheque bounce, S-138 NI Act. Values are plain strings so a draft round-trips through
 * IndexedDB unchanged; dates are ISO `yyyy-mm-dd` (or "" when unset) and are formatted at
 * the edge (see format.ts). Terminology follows docs/product/terminology.md; nothing here
 * is a persona.
 *
 * Engineering note: this is the client-side draft contract. The repository in
 * `./data/` persists it locally today; a backend replaces that layer, not this shape.
 */

export type YesNo = "yes" | "no";
export type ISODate = string; // "yyyy-mm-dd" | ""

/** Screens of the flow, in walking order (see steps.ts for titles/routes). */
export type StepId =
  | "upload"
  | "complainant"
  | "advocate"
  | "accused"
  | "cheque"
  | "demand-notice"
  | "jurisdiction"
  | "adr-prayer"
  | "witnesses"
  | "documents"
  | "affidavit"
  | "preview"
  | "sign"
  | "pay-fees";

export type Address = {
  line1: string;
  city: string;
  pin: string;
  district: string;
  state: string;
};

export type Contact = { mobile: string; email: string };

/** An address plus the jurisdiction facts the court needs to serve process. */
export type AddressBlock = {
  addr: Address;
  police: string;
  geo: string;
};

/* ─────────────────────────────── Files & extraction ─────────────────────────────── */

/** A file the person uploaded; the bytes live in the file store under `id`. */
export type StoredFileRef = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  /** MIME type as reported by the browser ("image/jpeg", "application/pdf"). */
  type: string;
  /** Upper-case extension for chips ("JPG", "PDF"). */
  ext: string;
};

/** Pixel box on the source page (page 1 for PDFs), origin top-left. */
export type ExtractBox = { x0: number; y0: number; x1: number; y1: number };

export type ExtractedField = {
  value: string;
  /** 0–100. */
  confidence: number;
  box?: ExtractBox;
};

/** What document reading produced for one upload — the parsed fields, not the raw text. */
export type DocExtract = {
  engine: "pdf-text" | "tesseract";
  /** Mean word confidence, 0–100 (100 for a PDF text layer). */
  confidence: number;
  page: { width: number; height: number };
  fields: Record<string, ExtractedField>;
  extractedAt: string;
};

/* ───────────────────────── Intake (Case documents upload) ───────────────────────── */

/** What a slot expects — drives which parser reads the upload and where values land. */
export type IntakeDocType =
  | "cheque-front"
  | "return-memo"
  | "demand-notice"
  | "dispatch-proof"
  | "delivery-proof"
  | "notice-reply"
  | "id-proof"
  | "poa"
  | "vakalatnama"
  | "other"
  | "supporting";

export type IntakeSlot = {
  key: string;
  docType: IntakeDocType;
  label: string;
  desc?: string;
  /** Required for filing; optional slots render the "Optional" chip. */
  required: boolean;
  file: StoredFileRef | null;
  /** Reading in progress (upload landed, extraction running). */
  processing?: boolean;
  /** 0–100 while processing. */
  progress?: number;
  /** Extraction confidence too low, or the image too small, to trust the read. */
  poor?: boolean;
  extract?: DocExtract;
  /** Reading failed (unsupported file, engine error) — the upload itself is kept. */
  error?: string;
};

export type IntakeGroup = { n: number; slots: IntakeSlot[] };

export type Intake = {
  cheques: IntakeGroup[];
  parties: IntakeGroup[];
  supporting: IntakeSlot[];
};

/* ───────────────────────────────── Complainant ──────────────────────────────────── */

export type ComplainantType = "individual" | "institution";

export type PoaHolder = {
  mobile: string;
  name: string;
  age: string;
  res: Address;
  permSame: YesNo;
  perm: Address;
};

export type Representative = {
  mobile: string;
  name: string;
  age: string;
  email: string;
  addr: Address;
};

/** Field keys that document reading can machine-fill on a complainant. */
export type ComplainantPrefillKey = "name" | "email" | "res" | "entName" | "age";

export type Complainant = {
  id: string;
  pip: YesNo;
  type: ComplainantType;
  mobile: string;
  confirm: string;
  verified: boolean;
  name: string;
  age: string;
  email: string;
  res: Address;
  permSame: YesNo;
  perm: Address;
  poa: YesNo;
  poaHolder: PoaHolder;
  entType: string;
  entName: string;
  entPhone: string;
  entEmail: string;
  entAddr: Address;
  rep: Representative;
  /** Party-in-person affidavit body (HTML from the rich text editor). */
  affidavit: string;
  prefilled: Partial<Record<ComplainantPrefillKey, boolean>>;
  edited: Partial<Record<ComplainantPrefillKey, boolean>>;
  toReview: boolean;
};

/* ─────────────────────────────────── Advocate ───────────────────────────────────── */

export type Advocate = {
  id: string;
  /** Indices into `draft.complainants` this advocate appears for. */
  forComplainants: number[];
  barNumber: string;
  name: string;
};

/* ─────────────────────────────────── Accused ────────────────────────────────────── */

export type AccusedType =
  | "individual"
  | "proprietorship"
  | "partnership"
  | "company"
  | "other";

export type Accused = {
  id: string;
  type: AccusedType;
  name: string;
  age: string;
  contacts: Contact[];
  addresses: AddressBlock[];
  jurisdiction: YesNo;
};

/* ───────────────────────────── Cheque & return memo ─────────────────────────────── */

export type ChequeField =
  | "dateOnCheque"
  | "amount"
  | "chequeNumber"
  | "ifsc"
  | "bankName"
  | "bankBranch"
  | "presentDate"
  | "returnDate"
  | "returnReason"
  | "receiptDate";

export type ChequeDetails = {
  id: string;
  dateOnCheque: ISODate;
  amount: string;
  chequeNumber: string;
  sameAsPrev: YesNo;
  ifsc: string;
  bankName: string;
  bankBranch: string;
  presentDate: ISODate;
  returnDate: ISODate;
  returnReason: string;
  receiptDate: ISODate;
  prefilled: Partial<Record<ChequeField, boolean>>;
  edited: Partial<Record<ChequeField, boolean>>;
  ifscFetched: boolean;
};

/* ───────────────────────────── Demand notice & debt ─────────────────────────────── */

export type NoticeField =
  | "natureDebt"
  | "whyIssued"
  | "dispatchDate"
  | "tracking"
  | "modeService"
  | "deliveryDate";

export type DemandNotice = {
  id: string;
  natureDebt: string;
  whyIssued: string;
  dispatchDate: ISODate;
  modeService: string;
  tracking: string;
  delivered: YesNo;
  deliveryDate: ISODate;
  replied: YesNo;
  returnDate: ISODate;
  nonDeliveryReason: string;
  paymentStatus: "" | "none" | "part";
  partAmount: string;
  prefilled: Partial<Record<NoticeField, boolean>>;
  edited: Partial<Record<NoticeField, boolean>>;
};

/* ─────────────────────────── Jurisdiction & limitation ──────────────────────────── */

export type OtherCase = { court: string; caseNumber: string };

export type Jurisdiction = {
  deposited: YesNo;
  ifsc: string;
  payeeBankName: string;
  payeeBankBranch: string;
  payeeFetched: boolean;
  payeePolice: string;
  drawerPolice: string;
  otherPending: YesNo;
  otherCases: OtherCase[];
  causeDate: ISODate;
  filingDate: ISODate;
  condonationReason: string;
};

/* ───────────────────────────── ADR, other details, prayer ───────────────────────── */

export type AdrPrayer = {
  adr: "yes" | "no" | "maybe";
  otherDetails: string;
  interimRelief: string;
  finalRelief: string;
};

/* ─────────────────────────────────── Witnesses ──────────────────────────────────── */

export type Witness = {
  id: string;
  fullName: string;
  designation: string;
  age: string;
  prove: string;
  contacts: Contact[];
  addresses: AddressBlock[];
};

/* ────────────────────────────── List of documents ───────────────────────────────── */

export type CaseDocument = {
  id: string;
  name: string;
  required: boolean;
  file: StoredFileRef | null;
  /** Readability check on the upload (image resolution / PDF text layer). */
  quality: "good" | "bad" | null;
  digital: boolean;
  /** Mirrors an intake slot (by key) — replacing it there updates here. */
  intakeKey?: string;
  custom?: boolean;
};

export type DocumentGroup = { id: string; title: string; docs: CaseDocument[] };

/* ───────────────────────────────────── Sign ─────────────────────────────────────── */

/** Who has to sign — derived from the parties on the draft (see selectors). */
export type Signatory = {
  id: string;
  name: string;
  role: string;
  status: "pending" | "signed";
  you?: boolean;
};

export type SignState = {
  mode: "esign" | "upload" | null;
  /** Signatory id → signed. Signatories themselves are derived, not stored. */
  signed: Record<string, boolean>;
  /** The signed copy, when signing by upload. */
  signedCopy: StoredFileRef | null;
  deliveryChannel: string;
  processTypes: string[];
  /** `${accusedId}:${addressIndex}` for each address process goes to. */
  processAddresses: string[];
  paid: boolean;
  paidAt: string | null;
  paymentRef: string | null;
  caseFileNumber: string | null;
};

/* ─────────────────────────────────── Draft ──────────────────────────────────────── */

/** Standing notices the user has closed; each is remembered on the draft. */
export type DismissedNotices = {
  advocateInfo: boolean;
  accusedAddress: boolean;
};

export type FilingDraft = {
  version: 2;
  id: string;
  caseType: "s138";
  status: "draft" | "filed";
  /** Where the person last was — "Continue draft" resumes here. */
  lastStep: StepId;
  intake: Intake;
  complainants: Complainant[];
  advocates: Advocate[];
  accused: Accused[];
  cheques: ChequeDetails[];
  notices: DemandNotice[];
  jurisdiction: Jurisdiction;
  adr: AdrPrayer;
  witnesses: Witness[];
  documents: DocumentGroup[];
  sign: SignState;
  dismissed: DismissedNotices;
  createdAt: string;
  updatedAt: string;
  filedAt: string | null;
};

/* ─────────────────────────────────── Profile ────────────────────────────────────── */

/**
 * The signed-in person, as far as this flow needs to know. A stand-in for the product's
 * real session: the greeting, avatar, "you" among the signatories and the advocate
 * prefill read from it.
 */
export type UserProfile = {
  name: string;
  mobile: string;
  email: string;
  barNumber: string;
};
