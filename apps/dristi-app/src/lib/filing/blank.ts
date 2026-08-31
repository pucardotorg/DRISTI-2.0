/**
 * Blank factories for the e-filing draft.
 *
 * A new filing starts empty: one complainant, one advocate, one accused, one cheque with
 * its notice, one witness row, and the intake slots those imply. Nothing is pre-typed —
 * values arrive from what the person uploads (document reading) or types.
 */

import { newId } from "./data";
import {
  AFFIDAVIT_PIP_TEMPLATE,
  FINAL_RELIEF_TEMPLATE,
  INTERIM_RELIEF_TEMPLATE,
} from "./options";
import type {
  Accused,
  Address,
  AddressBlock,
  Advocate,
  CaseDocument,
  ChequeDetails,
  Complainant,
  Contact,
  DemandNotice,
  DocumentGroup,
  FilingDraft,
  IntakeGroup,
  IntakeSlot,
  Jurisdiction,
  SettlementBand,
  SettlementOffer,
  SettlementPrayer,
  UserProfile,
  Representative,
  Witness,
} from "./types";

/** Row ids for repeatable things (parties, cheques, documents…). */
export function uid(prefix = "id"): string {
  return newId(prefix);
}

/* ───────────────────────────── Blank factories ─────────────────────── */

export const blankAddress = (): Address => ({
  line1: "",
  city: "",
  pin: "",
  district: "",
  state: "",
});

export const blankContact = (): Contact => ({ mobile: "", email: "" });

/** A person summoned for an entity — the accused entity's own, or a complainant's. */
export const blankRepresentative = (): Representative => ({
  mobile: "",
  name: "",
  age: "",
  designation: "",
  email: "",
  addr: blankAddress(),
});

export const blankAddressBlock = (): AddressBlock => ({
  addr: blankAddress(),
  police: "",
});

export function blankComplainant(): Complainant {
  return {
    id: uid("cp"),
    pip: "no",
    type: "individual",
    mobile: "",
    verified: false,
    fetched: false,
    name: "",
    age: "",
    email: "",
    res: blankAddress(),
    permSame: "yes",
    perm: blankAddress(),
    poa: "no",
    poaHolder: {
      mobile: "",
      name: "",
      age: "",
      res: blankAddress(),
      permSame: "yes",
      perm: blankAddress(),
    },
    entType: "",
    entName: "",
    entPhone: "",
    entEmail: "",
    entAddr: blankAddress(),
    rep: blankRepresentative(),
    affidavit: AFFIDAVIT_PIP_TEMPLATE,
    prefilled: {},
    edited: {},
    toReview: false,
  };
}

export const blankAdvocate = (profile?: UserProfile | null): Advocate => ({
  id: uid("adv"),
  forComplainants: [0],
  barNumber: profile?.barNumber ?? "",
  name: profile?.name ?? "",
});

export const blankAccused = (): Accused => ({
  id: uid("acc"),
  type: "individual",
  name: "",
  entType: "",
  contacts: [blankContact()],
  reps: [blankRepresentative()],
  addresses: [blankAddressBlock()],
  jurisdiction: "yes",
});

export const blankCheque = (): ChequeDetails => ({
  id: uid("chq"),
  dateOnCheque: "",
  amount: "",
  chequeNumber: "",
  sameAsPrev: "no",
  ifsc: "",
  bankName: "",
  bankBranch: "",
  presentDate: "",
  returnDate: "",
  returnReason: "",
  prefilled: {},
  edited: {},
  ifscFetched: false,
});

export const blankNotice = (): DemandNotice => ({
  id: uid("dn"),
  natureDebt: "",
  whyIssued: "",
  dispatchDate: "",
  modeService: "",
  tracking: "",
  delivered: "yes",
  deliveryDate: "",
  replied: "no",
  returnDate: "",
  nonDeliveryReason: "",
  paymentStatus: "",
  partAmount: "",
  prefilled: {},
  edited: {},
});

export const blankJurisdiction = (): Jurisdiction => ({
  deposited: "yes",
  ifsc: "",
  payeeBankName: "",
  payeeBankBranch: "",
  payeeFetched: false,
  payeePolice: "",
  drawerPolice: "",
  otherPending: "no",
  otherCases: [{ court: "", caseNumber: "" }],
  causeDate: "",
  filingDate: "",
  condonationReason: "",
});

/**
 * A fixed offer starts as a blank line, not as a guess: the amount the complainant will
 * take is the one number nobody but them can supply. The window defaults to 30 days —
 * the same month the demand notice already gave the accused to pay.
 */
export const blankSettlementOffer = (): SettlementOffer => ({
  id: uid("offer"),
  amount: "",
  within: { value: "30", unit: "days" },
});

/**
 * A band starts empty on both sides. A prefilled window would be the same number on every
 * band the advocate adds, and a ladder whose rungs are all "90 days" is not a ladder.
 */
export const blankSettlementBand = (): SettlementBand => ({
  id: uid("band"),
  within: { value: "", unit: "days" },
  discount: "",
});

export const blankSettlement = (): SettlementPrayer => ({
  willing: "yes",
  mode: "packaged",
  offers: [blankSettlementOffer()],
  maxPeriod: { value: "12", unit: "months" },
  bands: [blankSettlementBand()],
  otherDetails: "",
  interimRelief: INTERIM_RELIEF_TEMPLATE,
  finalRelief: FINAL_RELIEF_TEMPLATE,
});

export const blankWitness = (): Witness => ({
  id: uid("wit"),
  fullName: "",
  designation: "",
  age: "",
  prove: "",
  contacts: [blankContact()],
  addresses: [blankAddressBlock()],
});

/* ───────────────────────────── Intake groups ───────────────────────── */

/** The six documents every cheque needs (five required + the optional reply). */
export function intakeChequeGroup(n: number): IntakeGroup {
  return {
    n,
    slots: [
      {
        key: `c${n}f`,
        docType: "cheque-front",
        label: "Cheque (front side)",
        desc: "The bounced cheque, front side — a photo or scan.",
        required: true,
        file: null,
      },
      {
        key: `c${n}m`,
        docType: "return-memo",
        label: "Cheque return memo",
        desc: "The memo your bank issued when this cheque bounced.",
        required: true,
        file: null,
      },
      {
        key: `c${n}dn`,
        docType: "demand-notice",
        label: "Demand notice",
        desc: "The statutory demand notice sent to the accused.",
        required: true,
        file: null,
      },
      {
        key: `c${n}dp`,
        docType: "dispatch-proof",
        label: "Proof of dispatch of demand notice (postal receipt)",
        desc: "Speed post / RPAD receipt showing dispatch.",
        required: true,
        file: null,
      },
      {
        key: `c${n}ad`,
        docType: "delivery-proof",
        label: "Proof of delivery of demand notice (AD card)",
        desc: "Acknowledgement-due card or tracking proof of delivery.",
        required: true,
        file: null,
      },
      {
        key: `c${n}rp`,
        docType: "notice-reply",
        label: "Reply to the demand notice",
        desc: "The accused's reply to the notice, if any.",
        required: false,
        file: null,
      },
    ],
  };
}

export function intakePartyGroup(n: number): IntakeGroup {
  return {
    n,
    slots: [
      {
        key: `p${n}id`,
        docType: "id-proof",
        label: "Identity proof (complainant)",
        desc: "PAN, Aadhaar, Passport, Driving licence, Voter ID, Ration card or Bank passbook.",
        required: true,
        file: null,
      },
      {
        key: `p${n}poa`,
        docType: "poa",
        label: "Power of attorney",
        desc: "If the complaint is filed through a PoA holder.",
        required: false,
        file: null,
      },
      {
        key: `p${n}vak`,
        docType: "vakalatnama",
        label: "Vakalatnama",
        desc: "Signed authorisation appointing your advocate(s).",
        required: true,
        file: null,
      },
    ],
  };
}

export function intakeOtherPartyDoc(partyN: number, index: number): IntakeSlot {
  return {
    key: `p${partyN}x${index}`,
    docType: "other",
    label: "Other document",
    desc: "Any additional document for this party.",
    required: false,
    file: null,
  };
}

export function intakeSupporting(): IntakeSlot[] {
  return [
    {
      key: "sl",
      docType: "supporting",
      label: "Loan agreement / invoice / ledger",
      desc: "Anything that records the debt, if you have it.",
      required: false,
      file: null,
    },
  ];
}

/* ───────────────────────────── List of documents ───────────────────── */

type DocSpec = {
  name: string;
  required: boolean;
  intakeKey?: string;
};

function docRow(spec: DocSpec, existing: CaseDocument | undefined, slot?: IntakeSlot): CaseDocument {
  const mirrored = spec.intakeKey ? slot ?? null : null;
  return {
    id: existing?.id ?? uid("doc"),
    name: spec.name,
    required: spec.required,
    // Rows that mirror an intake slot always show that slot's file; others keep their own.
    file: mirrored ? mirrored.file : existing?.file ?? null,
    quality: mirrored
      ? mirrored.file
        ? mirrored.poor
          ? "bad"
          : "good"
        : null
      : existing?.quality ?? null,
    digital: existing?.digital ?? false,
    intakeKey: spec.intakeKey,
    custom: false,
  };
}

/**
 * The "List of documents" step, derived from the case: one row per document each cheque
 * and party needs, mirroring what intake already holds. Existing rows keep their id,
 * digital flag and any file uploaded on that step; custom rows the person added are kept.
 */
export function buildDocumentGroups(draft: FilingDraft): DocumentGroup[] {
  const slotByKey = new Map<string, IntakeSlot>();
  for (const g of draft.intake.cheques) g.slots.forEach((s) => slotByKey.set(s.key, s));
  for (const g of draft.intake.parties) g.slots.forEach((s) => slotByKey.set(s.key, s));
  draft.intake.supporting.forEach((s) => slotByKey.set(s.key, s));

  const prevGroups = new Map(draft.documents.map((g) => [g.id, g]));
  const findExisting = (groupId: string, spec: DocSpec) => {
    const g = prevGroups.get(groupId);
    if (!g) return undefined;
    return (
      (spec.intakeKey && g.docs.find((d) => d.intakeKey === spec.intakeKey)) ||
      g.docs.find((d) => !d.custom && d.name === spec.name)
    );
  };
  const customOf = (groupId: string) => prevGroups.get(groupId)?.docs.filter((d) => d.custom) ?? [];

  const groups: DocumentGroup[] = [];

  // Case details — per cheque.
  const many = draft.intake.cheques.length > 1;
  const caseSpecs: DocSpec[] = draft.intake.cheques.flatMap((g) => {
    const sfx = many ? ` ${g.n}` : "";
    return [
      { name: `Cheque${sfx}`, required: true, intakeKey: `c${g.n}f` },
      { name: `Cheque return memo${sfx}`, required: true, intakeKey: `c${g.n}m` },
      { name: `Demand notice${sfx}`, required: true, intakeKey: `c${g.n}dn` },
      { name: `Proof of dispatch of demand notice (postal receipt)${sfx}`, required: true, intakeKey: `c${g.n}dp` },
      { name: `Proof of delivery of demand notice (AD card)${sfx}`, required: true, intakeKey: `c${g.n}ad` },
      { name: `Reply to the demand notice${sfx}`, required: false, intakeKey: `c${g.n}rp` },
    ];
  });
  // Intake keys can carry a "-2" suffix after a remove/add; resolve by prefix.
  const resolveSlot = (key?: string) => {
    if (!key) return undefined;
    if (slotByKey.has(key)) return slotByKey.get(key);
    for (const [k, s] of slotByKey) if (k.startsWith(`${key}-`)) return s;
    return undefined;
  };
  groups.push({
    id: "case",
    title: "Case details",
    docs: [
      ...caseSpecs.map((s) => docRow(s, findExisting("case", s), resolveSlot(s.intakeKey))),
      ...customOf("case"),
    ],
  });

  // One group per complainant.
  draft.complainants.forEach((c, i) => {
    const n = i + 1;
    const id = `complainant-${n}`;
    const specs: DocSpec[] = [
      { name: "Identity proof — complainant", required: true, intakeKey: `p${n}id` },
      { name: "Power of attorney", required: c.poa === "yes", intakeKey: `p${n}poa` },
      { name: "Vakalatnama", required: c.pip !== "yes", intakeKey: `p${n}vak` },
    ];
    groups.push({
      id,
      title: `Complainant ${n} — documents`,
      docs: [
        ...specs.map((s) => docRow(s, findExisting(id, s), resolveSlot(s.intakeKey))),
        ...customOf(id),
      ],
    });
  });

  /*
   * The accused used to get a group of their own, listing an identity proof, a power of
   * attorney and a Vakalatnama. None of those are the complainant's to file — you do not
   * hold the ID of the person you are suing, and their advocate is not on record yet. The
   * group asked for documents nobody could produce, so it is gone (owner, 2026-08-19).
   */

  return groups;
}

/* ───────────────────────────── Blank draft ─────────────────────────── */

export function createBlankDraft(id: string, profile?: UserProfile | null): FilingDraft {
  const now = new Date().toISOString();
  const draft: FilingDraft = {
    version: 4,
    id,
    caseType: "s138",
    status: "draft",
    lastStep: "upload",
    intake: {
      cheques: [intakeChequeGroup(1)],
      parties: [intakePartyGroup(1)],
      supporting: intakeSupporting(),
    },
    complainants: [blankComplainant()],
    advocates: [blankAdvocate(profile)],
    accused: [blankAccused()],
    cheques: [blankCheque()],
    notices: [blankNotice()],
    jurisdiction: blankJurisdiction(),
    settlement: blankSettlement(),
    witnesses: [blankWitness()],
    affidavit: "",
    documents: [],
    sign: {
      mode: null,
      signed: {},
      signedCopy: null,
      deliveryChannel: "",
      processTypes: ["notice"],
      processAddresses: [],
      deferProcessFees: false,
      paid: false,
      paidAt: null,
      paidAmount: null,
      paymentRef: null,
      caseFileNumber: null,
    },
    dismissed: {
      advocateInfo: false,
      accusedAddress: false,
    },
    createdAt: now,
    updatedAt: now,
    filedAt: null,
  };
  draft.documents = buildDocumentGroups(draft);
  return draft;
}

/* ───────────────────────────── Migration ───────────────────────────── */

/** Accused kinds that used to be one flat list, mapped onto the pair that replaced it. */
const LEGACY_ACCUSED_ENTITY: Record<string, string> = {
  proprietorship: "proprietorship",
  partnership: "partnership",
  company: "private-limited",
  other: "other",
};

/**
 * Bring a stored draft up to the current shape.
 *
 * Drafts live in the browser, so a person who was mid-filing when the form changed still
 * has the old one on disk. Fields that were dropped are simply ignored; the accused's
 * kind is the one value that moved, so it is carried across rather than reset to
 * "Individual" — silently changing who someone is suing would be worse than any of this.
 */
export function migrateDraft(draft: FilingDraft): FilingDraft {
  for (const a of draft.accused as (Accused & { type: string })[]) {
    if (a.type === "individual" || a.type === "institution") {
      a.entType ??= "";
    } else {
      a.entType = a.entType || LEGACY_ACCUSED_ENTITY[a.type] || "other";
      a.type = "institution";
    }
    a.reps ??= [blankRepresentative()];
    for (const r of a.reps) r.designation ??= "";
  }
  for (const c of draft.complainants) {
    c.fetched ??= false;
    c.rep.designation ??= "";
  }
  draft.sign.deferProcessFees ??= false;
  draft.sign.paidAmount ??= null;
  draft.affidavit ??= "";
  migrateSettlement(draft);
  draft.version = 4;
  return draft;
}

/**
 * `adr` became `settlement`.
 *
 * The old section asked one yes/no/maybe question and held the two prayer editors; the
 * new one keeps both and adds the offer the advocate sets up. A draft written before the
 * change carries answers the filer typed — the prayer especially, which they may have
 * rewritten line by line — so it is moved across rather than replaced with a blank.
 */
function migrateSettlement(draft: FilingDraft) {
  const legacy = (draft as unknown as { adr?: Partial<SettlementPrayer> & { adr?: SettlementPrayer["willing"] } }).adr;
  if (legacy && !draft.settlement) {
    draft.settlement = {
      ...blankSettlement(),
      willing: legacy.adr ?? "yes",
      otherDetails: legacy.otherDetails ?? "",
      interimRelief: legacy.interimRelief ?? INTERIM_RELIEF_TEMPLATE,
      finalRelief: legacy.finalRelief ?? FINAL_RELIEF_TEMPLATE,
    };
  }
  delete (draft as unknown as { adr?: unknown }).adr;

  draft.settlement ??= blankSettlement();
  const s = draft.settlement;
  s.willing ??= "yes";
  s.mode ??= "packaged";
  s.maxPeriod ??= { value: "12", unit: "months" };
  s.offers = s.offers?.length ? s.offers : [blankSettlementOffer()];
  s.bands = s.bands?.length ? s.bands : [blankSettlementBand()];

  /* The step this draft was last on may be the id the route no longer has. */
  if ((draft.lastStep as string) === "adr-prayer") draft.lastStep = "settlement";
}
