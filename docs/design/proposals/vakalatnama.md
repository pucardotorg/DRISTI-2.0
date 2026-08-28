# Vakalatnama — user flow and spec

**Status:** draft v1 — brainstorm resolved with owner 2026-08-27; ready for design proposal
**Audience:** developers and agents building the vakalatnama module; design (ux → ui → review)
**Depends on:** e-filing module (`docs/design/proposals/e-filing.md`, `../../efiling-handover/`),
signing Method 3 (`../../signing/`), the bar-registry / profile / payment seams
(`apps/dristi-app/src/lib/filing/README.md`)

## Marks

Same discipline as the e-filing handover: unmarked = requirement · `[DERIVED]` inferred,
confirm before building · `[GAP]` unspecified, blocks the item · `[OWNER]` owner decision,
2026-08-27 · `[VERIFY]` needs checking against a primary source before anything
authoritative depends on it.

Requirement IDs (`VAK / SCOPE / EXE / ADV / TRM / ATT / SGN / PAY / BND / CFG / LIF /
REV-*`) — use in tickets, commits, test names.

---

## 1. What a vakalatnama is (product framing)

A vakalatnama is the instrument by which **one litigant** appoints **one or more advocates**
to act for them in court. In this product it is a **first-class, reusable object** — not a
form nested inside a case.

- `VAK-01` A vakalatnama can be created and executed **outside any case** — from the
  litigant's own dashboard, before a case number exists. **[OWNER]**
- `VAK-02` The instrument holds: one executant, one or more advocates, a scope, an
  attestation, a court reference, a fee/payment record, an execution record, and an
  append-only history.
- `VAK-03` The record is **append-only**. Nothing is deleted; revocation and supersession
  are new states over preserved history ("the record must hold").

Anchor from real practice (Kochi JMFC N.I. Act sample): the executed form carries
**"C.C. No. ___ Of 2016"** — blank. The vakalatnama is routinely executed **before** the
case number exists, and the number is filled in at registration. Our model matches this;
it is the normal path, not a workaround.

---

## 2. Decisions locked (owner, 2026-08-27)

- `[OWNER]` **Build the ideal version.** Both scope types ship (§4). STANDING is enabled by
  default but **court-configurable and can be disabled** (`CFG-02`).
- `[OWNER]` **Signing is eSign, non-Aadhaar** → Workstream B **Method 3** (self-hosted
  signing tool: per-recipient access auth, append-only audit trail, PAdES seal, no
  document ceiling). Not the C-DAC/Aadhaar path — a single vakalatnama would not need
  batching anyway, and non-Aadhaar keeps party-in-person litigants in scope.
- `[OWNER]` **Payment is online.** No physical stamps, no e-stamp graphics. Court fee and
  the Advocates' Welfare Fund contribution are collected as an online payment line
  (§9). Amounts still exist and are `[VERIFY]`.
- `[OWNER]` **Identification (#3) and attestation (#4) are two capabilities, one signer by
  default** (§5). The appointed advocate does both; a notary splits off attestation only
  when court config demands it.
- `[OWNER]` **The terms (granted powers) are editable** (§4a). The standard clause set is
  the default — most users never touch it — but it is an editable block, not locked
  boilerplate.
- `[OWNER]` **Confirmed 2026-08-27:** creator-role prefill model (§13.1), attestation
  defaulting to the advocate covering both roles (`ATT-02`), and the **asynchronous,
  multi-party, resumable** signing model (§13.4).

---

## 3. Data model (sketch)

```
Vakalatnama
  id
  status                       // LIF-* lifecycle
  courtRef                     // jurisdiction → resolves court config (CFG-*)
  scope:
    type: SPECIFIC | STANDING
    case?: { kind: FILED | DRAFT, id, caseNumber? }   // SPECIFIC only
  executant:
    kind: INDIVIDUAL | ORG
    individual? | { org, authorisedSignatory }
  advocates: [                 // 1..n
    { name, enrolmentNo, isAddressForService, acceptance? } ]
  terms:                       // granted powers — editable
    source: STANDARD | EDITED
    clauses[]                  // ordered clause set; STANDARD seeded from court/state default
    editedBy?, editedAt?       // provenance when source = EDITED
  attestation:
    identifier: { by, signature? }        // #3 "I know the party"
    witness:    { type: ADVOCATE | LAY | NOTARY, identity, signature?, notaryRef? }  // #4
  fees: { courtFee, welfareFundContribution, payment }   // online
  execution: { executantSignature?, date? }
  history[]                    // append-only events (create, sign, accept, attest, bind, revoke…)
```

---

## 4. Scope

- `SCOPE-01` **SPECIFIC** — the vakalatnama names one matter. The matter may be:
  - `SCOPE-02` **already filed** — references a real case number / CNR (add/switch
    counsel mid-case; party-in-person now engaging counsel); or
  - `SCOPE-03` **not yet filed** — references a **draft filing ID**. The case number is
    blank until registration, then **back-filled** (`BND-02`). The executed vakalatnama
    travels inside the e-filing bundle.
- `SCOPE-04` **STANDING** — a master engagement (one litigant, its advocate panel), **not
  itself filed on the court record**. When a case is filed under it, it **spawns a
  SPECIFIC, case-bound copy** (`BND-03`). Serves the institutional/bulk pattern (a bank
  appointing a panel advocate across all its §138 matters — the Gujarat stress case).
- `SCOPE-05` STANDING is behind court config (`CFG-02`); where disabled, only SPECIFIC is
  offered and no STANDING entry point renders.
- `SCOPE-06` `[VERIFY]` Whether a STANDING/general vakalatnama is ever accepted *on the
  record* as-is. Working assumption: no — the record always wants a per-case instrument,
  which is why STANDING spawns copies rather than being filed. Confirm per state/registry.

---

## 4a. Terms — the granted powers (`TRM-*`)

The clauses that say what the advocate may do (appear, prosecute/defend, obtain return of
documents, draw moneys, appeal, apply for review, etc.). **Editable** `[OWNER]`.

- `TRM-01` A vakalatnama carries an ordered **clause set**. It is **seeded from the
  court/state standard** (`source = STANDARD`) so a user who does nothing gets a valid,
  conventional instrument.
- `TRM-02` The user can **edit** the clause set — reorder, remove, or add clauses, and
  amend clause text. Editing flips `source = EDITED` and records `editedBy` / `editedAt`
  in `history[]` (append-only — the record must hold).
- `TRM-03` The standard clause set is **court-configurable** (`CFG-06`) so a state can ship
  its own default wording.
- `TRM-04` Preview (`S6`) renders the effective terms; where `source = EDITED`, the
  instrument (and any downstream scrutiny view) can show that it **deviates from the
  standard**, and how. `[DERIVED]` surface a standard-vs-edited diff for the scrutiny
  officer / magistrate.
- `TRM-05` `[VERIFY]` Whether the court accepts a vakalatnama with **non-standard terms**,
  and whether any clause is **mandatory** (cannot be removed). Until confirmed, keep the
  standard clauses removable in the UI but flag edits clearly; do not assert acceptance.

---

## 5. Actors and the signing choreography

Four sign-roles exist on the paper form; they collapse onto fewer people in the common
case. Model all four as capabilities; let one signer satisfy identification + attestation
by default.

| # | Role | Form wording | Certifies | Default signer |
| --- | --- | --- | --- | --- |
| 1 | **Executant** | "I … do hereby appoint and retain…" | the appointment | the litigant |
| 2 | **Advocate(s)** | "accepted — Advocate" | acceptance of engagement | each appointed advocate |
| 3 | **Identifier** | "I know the party" | **who** the executant is | the appointed advocate (or their clerk) |
| 4 | **Witness / attestor** | "Signed before me" + named witness | **that** they signed | advocate by default; **notary** when config requires |

- `EXE-01` One executant per vakalatnama. Kind = **INDIVIDUAL** or **ORG-via-authorised-
  signatory** (the sample: *Axis Bank Ltd → Antony Xavier, Authorised Signatory*). Reuses
  the entity/representative block flagged as a gap in the e-filing handover.
- `ADV-01` One or more advocates. Each is validated via the **bar-registry seam**
  (enrolment number, e.g. `K-305/96`). `[DERIVED]` enrolment format varies by state bar.
- `ADV-02` Exactly one advocate is marked **address for service** (only that address
  prints on the instrument).
- `ADV-03` Each advocate must **accept** (`SGN-02`); at least one acceptance is required to
  execute.
- `ATT-01` **Identification (#3)** is performed by the appointed advocate (or their clerk)
  and rides along with acceptance — not a free "witness" slot.
- `ATT-02` **Attestation (#4)** is the configurable witness slot: `type ∈ {ADVOCATE, LAY,
  NOTARY}`. Default: the same advocate satisfies #3 and #4 with one signature (minimum
  friction — "reduce suffering").
- `ATT-03` When court config sets `witnessPolicy = NOTARY_REQUIRED`, the witness slot
  splits to a **notary** while the advocate still does #3. `[DERIVED]` most Kerala JMFC
  §138 vakalatnamas are advocate-identified, not notarised — do not default to notary.
- `ATT-04` `[GAP]` The **approved-notary list**: when a court says "notary must be one of
  these," where the list comes from and how it is kept current is unspecified. Model a
  `notaryRegistryRef` on court config; ship an empty/optional list until a source exists.

### Signing (Method 3)

- `SGN-01` All signatures (executant, advocate acceptance, attestor) are captured through
  the **non-Aadhaar signing tool**: per-recipient access authentication, PAdES seal, and
  an **append-only audit log** (timestamp / envelope / name / email / user / IP / UA per
  event). The audit trail is what discharges the burden of proving the person signed.
- `SGN-02` Signing order: executant signs → advocate(s) accept → attestor attests. Each
  transition is a `LIF-*` state and a `history[]` event.
- `SGN-03` **Clerk cannot e-sign** (`ROLE-08` from the handover) — a clerk **can** stand as
  a **lay witness** (the sample witness "Saly" is an Adv. clerk) and can prepare/route the
  draft, but cannot produce the executant or advocate signature. **Enforce server-side.**
- `SGN-04` Party-in-person / any executant without an eSign path may **wet-sign and
  upload**; the uploaded copy still enters the audit trail. Keep this route open to
  everyone, not gated to a "type" of user ("design for circumstances, not categories").

---

## 6. Lifecycle

```
DRAFT
  → PENDING_EXECUTANT_SIGN
  → PENDING_ADVOCATE_ACCEPT        (≥1 acceptance required)
  → PENDING_ATTESTATION            (identifier + witness/notary per config)
  → EXECUTED
        ├─ SPECIFIC  → BOUND_TO_CASE   (case number stamped at registration)
        └─ STANDING  → (source; spawns bound copies per filing)
  → REVOKED | SUPERSEDED           (litigant revokes / advocate withdrawn; history kept)
```

- `LIF-01` State is server-authoritative; every transition writes a `history[]` event.
- `LIF-02` `[DERIVED]` Scrutiny/magistrate send-backs may reopen an attached vakalatnama;
  align with the e-filing `REF-*` refiling rules before building the bound-copy edit path.

---

## 7. User flow — three entry points

Guided by the design principles: tell people **who has signed / who is pending / what's
next** at every step; preserve the litigant's position if a step fails ("our failures are
not theirs"); ask only what changes an outcome ("reduce suffering").

**A. Standalone (primary).** Dashboard → *Create vakalatnama* → choose executant (self /
org + authorised signatory) → add advocate(s) via bar-registry lookup, mark one for
service → choose scope (this draft filing / an existing case / standing) → attestor per
court config → pay online → sign (eSign or upload) → **Executed**, listed under the
litigant's "My authorizations."

**B. Inside e-filing.** At the advocate/representation step, *Attach a vakalatnama* →
reuse a STANDING one (spawns a bound copy) or generate one inline → it joins the filing
bundle; the case number back-fills at registration (`BND-02`).

**C. From an existing case.** *Add / change advocate* → new vakalatnama pre-bound to that
case number.

- `VAK-04` No entry point requires a case to exist first (A and the not-yet-filed path).
- `VAK-05` `[DERIVED]` STANDING entry point in A appears only when `CFG-02` enables it.

---

## 8. Court configuration (`CFG-*`)

Resolved from `courtRef`. Same "build for the state, over the national core" shape.

- `CFG-01` `witnessPolicy ∈ {ADVOCATE_OK, LAY_OK, NOTARY_REQUIRED}` — drives `ATT-02/03`.
- `CFG-02` `standingEnabled: boolean` — drives `SCOPE-05`, `VAK-05`. Default **on**.
- `CFG-03` `notaryRegistryRef?` — link/source for the approved-notary list (`ATT-04`).
- `CFG-04` `electronicVakalatnamaAccepted: boolean` — `[VERIFY]` whether the court takes an
  e-signed vakalatnama on record. Owner's steer is eSign-first; keep the flag so a court
  that refuses degrades to print-and-upload (`SGN-04`) without a rebuild.
- `CFG-05` fee schedule (court fee + welfare-fund contribution) — `[VERIFY]` amounts.
- `CFG-06` standard **terms** clause set + any mandatory (non-removable) clauses — drives
  `TRM-01/03/05`.

---

## 9. Payment (`PAY-*`)

- `PAY-01` Court fee + **Advocates' Welfare Fund contribution** are collected as an
  **online** line item; reuse the e-filing payment seam. No physical/e-stamps.
- `PAY-02` `[VERIFY]` Current amounts (welfare-fund contribution value; court fee on a
  vakalatnama) before any number ships — same discipline as the Finance Act slabs.
- `PAY-03` `[DERIVED]` Payment is a precondition of EXECUTED. Confirm ordering vs signing
  (pay-then-sign, per the e-filing flow).

---

## 10. Binding to a case (`BND-*`)

- `BND-01` A SPECIFIC vakalatnama attaches to exactly one matter.
- `BND-02` For a not-yet-filed matter, the case number is **null until registration**, then
  written once and immutable thereafter.
- `BND-03` A STANDING vakalatnama **spawns** a SPECIFIC bound copy at each filing; the copy
  carries its own execution/attestation lineage back to the standing source in `history[]`.
- `BND-04` `[DERIVED]` Whether a spawned copy needs re-signing or inherits the standing
  signatures depends on `SCOPE-06`/`CFG-04`. Resolve before building `BND-03`.

---

## 11. Revocation and withdrawal (`REV-*`) — scope TBD

- `REV-01` `[GAP]` Litigant-initiated **revocation** and advocate-initiated **withdrawal
  (no-objection)** are out of v1 unless the owner pulls them in. Reserve the `REVOKED`
  state and history events now so the record stays coherent when they land.

---

## 12. Open questions (owners + blocking flags)

| # | Question | Mark | Blocks |
| --- | --- | --- | --- |
| OQ-1 | Does the target court accept an e-signed vakalatnama on record? (`CFG-04`) | `[VERIFY]` | signing UX final shape |
| OQ-2 | Is a STANDING/general vakalatnama ever filed as-is, or always spawn per case? (`SCOPE-06`) | `[VERIFY]` | `BND-03/04` |
| OQ-3 | Current court-fee + welfare-fund amounts (`PAY-02`, `CFG-05`) | `[VERIFY]` | any fee number |
| OQ-4 | Source + upkeep of the approved-notary list (`ATT-04`, `CFG-03`) | `[GAP]` | NOTARY_REQUIRED courts |
| OQ-5 | Revocation/withdrawal in v1? (`REV-01`) | `[GAP]` | revocation path only |
| OQ-6 | Does a spawned standing copy re-sign or inherit signatures? (`BND-04`) | `[DERIVED]` | `BND-03` |
| OQ-7 | Does the court accept non-standard terms; any clause mandatory? (`TRM-05`) | `[VERIFY]` | editing edited terms into a filed instrument |

**Do not start a section that has a blocking `[VERIFY]`/`[GAP]` against it** without
resolving it first.

---

## 13. Screen-by-screen flow (for review)

This section is the flow + information at wireframe level — no visual design. Entry A
(standalone) is described in full; B and C are deltas (§13.6).

### 13.1 Who creates it → what is prefilled

Same profile switcher as e-filing (`ASM-02`): the creator is **advocate, clerk, or
litigant**, and that is known before the flow starts. It changes only prefill, not the
screens.

| Creator | Executant (§S1) | Advocates (§S2) | Can sign? |
| --- | --- | --- | --- |
| **Litigant** | prefilled as **self** from profile (with approval, no silent autofill) | entered by the litigant | executant signature only |
| **Advocate** | entered/selected (the client) | **self auto-added** + associated juniors (removable), self marked address-for-service by default | acceptance + (identifier/attestor) |
| **Clerk** | entered/selected | the advocate(s) they work for **auto-added** | **no** — prepares & routes only (`SGN-03`) |

### 13.2 Step map

```
Create ─▶ S1 Executant ─▶ S2 Advocates ─▶ S3 Scope ─▶ S4 Attestation ─▶ S5 Fees & pay
                                                                              │
                            ┌─────────────────────────────────────────────────┘
                            ▼
                     S6 Preview ─▶ S7 Sign & route ──(all parties signed)──▶ S8 Executed
                                        │
                                        └─ async: parties sign later / on their own device
```

Branches live inside S3 (scope) and S4 (attestation); everything else is linear.

### 13.3 Screens

**S1 — Executant (the litigant).** Who the vakalatnama is *from*.

| Field | Notes | Trace |
| --- | --- | --- |
| Executant kind | **Individual** / **Organisation** — the only branch on this screen | `EXE-01` |
| Individual: name, relation (S/o·D/o·W/o) + name, age, address | reuse the address block; prefill from profile if creator = litigant (with approval) | `LIT-*` |
| Organisation: org name + address | | `EXE-01` |
| Organisation → Authorised signatory: name, designation, address | renders only for ORG; drives the "For <Org>, <Name>, Authorised Signatory" execution line | `EXE-01` |

**S2 — Advocates.** Who is being appointed. One or more.

| Field | Notes | Trace |
| --- | --- | --- |
| Add advocate → search bar registry (name / enrolment no.) | validated against the bar-registry seam; enrolment format varies by state | `ADV-01` |
| Per advocate: name, enrolment no., address | mostly returned by the lookup | `ADV-*` |
| **Address for service** (one, required) | exactly one advocate; default = first / creating advocate | `ADV-02` |
| Remove advocate | juniors removable when auto-added | `ADV-01` |

Validation: ≥1 advocate; exactly one address-for-service.

**S3 — Scope.** What the appointment covers. **First branch point.**

| Choice | Then | Trace |
| --- | --- | --- |
| **A specific case** | → is it filed? | `SCOPE-01` |
| ↳ already filed | enter/select case number (CNR / `KL-nnnnnn-yyyy`); court auto-derived | `SCOPE-02` |
| ↳ not yet filed | link a **draft filing** (select from the litigant's drafts) or "file later"; court selected manually; case number stays blank → back-filled at registration | `SCOPE-03`, `BND-02` |
| **All my cases (standing)** | no case picked; court selected; spawns a bound copy per future filing | `SCOPE-04` |

- Standing option renders **only if** `CFG-02` enabled for the selected court (`VAK-05`).
- Court selection here resolves court config (`CFG-*`) used by S4/S5.
- The **granted powers** (appear, prosecute/defend, receive documents/decrees, draw
  moneys, appeal, apply for review, etc.) show as a **"Terms (standard)" panel** — the
  standard clause set by default, **collapsed**, with **"Edit terms"** to expand and
  amend (`TRM-*`, §4a). Most users never open it ("reduce suffering" = safe default,
  detail on request); those who need to can.

**S4 — Attestation.** Who identifies the party and who witnesses. **Second branch point,
often skipped.**

| Court config (`CFG-01`) | What this screen shows | Trace |
| --- | --- | --- |
| ADVOCATE_OK (default) | Pre-set: appointed advocate does identification **and** witness (one signature). Screen is a **confirmation**, not a form. | `ATT-01/02` |
| LAY_OK | Option to add a **lay witness** (name, relation/role, address) instead of / in addition to the advocate | `ATT-02` |
| NOTARY_REQUIRED | **Notary** picker — constrained to the approved list if `notaryRegistryRef` is set, else free entry; advocate still does identification | `ATT-03/04` |

When the default covers both roles, this screen is auto-satisfied and can be collapsed to
a single confirmable line (only ask if the choice changes the outcome).

**S5 — Fees & payment.** Online, no stamps.

| Line | Notes | Trace |
| --- | --- | --- |
| Court fee | amount from `CFG-05` | `PAY-01` |
| Advocates' Welfare Fund contribution | amount from `CFG-05` | `PAY-01` |
| Total → pay online | reuse e-filing payment seam; pay precedes signing | `PAY-03` |

Amounts are `[VERIFY]` — no number ships unverified (`PAY-02`).

**S6 — Preview.** The actual instrument, rendered and filled — the review-before-sign
moment (show the mechanism, not just a happy path). Case number shows blank where not yet
filed. Also shows **who will sign, in what order**, and the **effective terms** with a
standard-vs-edited marker (`TRM-04`). Edits — including editing terms — bounce back to the
relevant screen.

**S7 — Sign & route.** Multi-party and **asynchronous** (see 13.4). A status board:

- Executant signs first (eSign via Method 3, or wet-sign-and-upload — `SGN-04`).
- Each advocate accepts.
- Attestor attests (identifier + witness per S4).
- Board shows, per party: **not started / signed / pending you** — "tell people where
  they are." Clerk sees route/track only; the sign action is disabled for them (`SGN-03`).

**S8 — Executed.** Instrument sealed (PAdES) with its audit trail. Download; filed to "My
authorizations." If bound to a draft filing → attached to that filing bundle. If standing
→ offered for reuse at future filings.

### 13.4 The signing model (important for the flow)

Signing is **not a single wizard step** — the parties are different people who may sign at
different times, on different devices. After S5, the instrument enters
`PENDING_EXECUTANT_SIGN` and each party is notified in turn. The creator's job ends at S5;
S7/S8 progress as parties act. Design must treat S7 as a **tracked, resumable state**, not
a page the creator sits on. ("Our failures are not theirs" — a party's position is
preserved at the moment they signed, regardless of what happens after.)

### 13.5 What we deliberately do NOT ask ("reduce suffering")

- The granted-powers clauses — standard by default and **collapsed**; editable on request
  (`TRM-*`), not forced on everyone.
- Which court, when it is derivable from a filed case or the linked draft.
- Attestation details when the advocate default covers both roles.
- Executant details already in profile (prefilled, approved, not re-typed).

### 13.6 Entry B and C — deltas only

- **B (inside e-filing):** S1/S2 are prefilled from the filing (complainant + advocates
  already entered); scope is fixed to **this draft** (S3 collapses); the vakalatnama joins
  the bundle and its number back-fills at registration.
- **C (from an existing case):** scope is fixed to **that case number** (S3 collapses);
  S1/S2 prefill from the case parties; used for add/switch counsel mid-case.
