/**
 * Vakalatnama — the instrument by which one litigant appoints one or more advocates.
 * A first-class, reusable object (created outside any case); see
 * docs/design/proposals/vakalatnama.md for the spec and requirement IDs.
 *
 * This is a front-end model with no server. Persistence is the browser (localStorage,
 * `store.ts`); signing and payment are a labelled sandbox. The seams — repository,
 * bar registry, sign, pay — swap without the screens changing.
 */

import type { Address } from "@/lib/filing/types";

export type { Address };

/** Who is driving the flow. Changes prefill, not the screens (spec §13.1). */
export type CreatorRole = "advocate" | "clerk" | "litigant";

/** Lifecycle (spec §6). */
export type VakStatus =
  | "draft"
  | "pending_executant_sign"
  | "pending_advocate_accept"
  | "pending_attestation"
  | "pending_payment"
  | "executed";

export type ExecutantKind = "individual" | "organisation";

/** The litigant the vakalatnama is *from* (spec S1 / EXE-01). */
export type Executant = {
  kind: ExecutantKind;
  /** Individual */
  name: string;
  relationType: "" | "S/o" | "D/o" | "W/o";
  relationName: string;
  age: string;
  address: Address;
  /** Mobile — the number the signing OTP is sent to. */
  mobile: string;
  /** ID document filename (proof of identity). */
  idDoc: string;
  /** Organisation — signs through an authorised signatory. */
  orgName: string;
  signatoryName: string;
  signatoryDesignation: string;
};

/** An appointed advocate (spec S2 / ADV-*). */
export type Advocate = {
  id: string;
  name: string;
  enrolmentNo: string;
  address: Address;
  /** Exactly one advocate is the address for service (ADV-02). */
  forService: boolean;
  /** Has this advocate accepted the engagement (SGN-02)? */
  accepted: boolean;
};

export type ScopeType = "specific" | "standing";
/** For a specific scope: is the matter already on the court's file? */
export type CaseState = "filed" | "not_filed";

/** What the appointment covers (spec S3 / SCOPE-*). */
export type Scope = {
  type: ScopeType;
  caseState: CaseState;
  /** Filed: the real number. Blank until registration for a not-yet-filed matter. */
  caseNumber: string;
  /** Not-yet-filed: the linked draft filing (label/id). */
  draftRef: string;
  court: string;
};

export type TermsSource = "standard" | "edited";

/** The granted powers — editable (spec §4a / TRM-*). */
export type Terms = {
  source: TermsSource;
  clauses: string[];
};

/** A witness is optional. When present, a registered notary or any other person. */
export type WitnessKind = "notary" | "other";

/** The witness who attests the signing (#4) — optional (spec S4 / ATT-*). */
export type Attestation = {
  /** Whether a witness is being added at all. */
  hasWitness: boolean;
  kind: WitnessKind;
  /** Notary (from the registry) or the other person's name. */
  name: string;
  /** Notary registration number. */
  registration: string;
  /** Other person only: */
  mobile: string;
  address: Address;
  idDoc: string;
  relation: string;
};

/** Online fees (spec §9 / PAY-*). Amounts are indicative until verified (PAY-02). */
export type Fees = {
  courtFee: number;
  welfareFund: number;
  paid: boolean;
};

export type SignerRole = "executant" | "advocate" | "attestor";
export type SignMethod = "esign" | "upload";
export type SignerState = "waiting" | "signed";

/** One party's line on the signing board (spec S7 / §13.4 — async, resumable). */
export type Signer = {
  id: string;
  role: SignerRole;
  /** Who this line is (person's name / advocate name). */
  label: string;
  /** What they certify, in a word ("Appointment", "Acceptance", "Attestation"). */
  certifies: string;
  method: SignMethod;
  state: SignerState;
  /** ISO timestamp, frozen at the moment they signed (§13.4). */
  signedAt?: string;
};

export type Vakalatnama = {
  id: string;
  status: VakStatus;
  createdAt: string;
  updatedAt: string;
  /** Furthest step the wizard should open on (survives reload). */
  step: number;
  creatorRole: CreatorRole;
  executant: Executant;
  advocates: Advocate[];
  scope: Scope;
  terms: Terms;
  attestation: Attestation;
  fees: Fees;
  /** The signing board; built when the instrument leaves data entry. */
  signing: Signer[];
  /** Set once, at registration, for a not-yet-filed matter (BND-02). */
  boundCaseNumber?: string;
};
