# DRISTI — product reference

Source of truth for this doc: https://dristidomain.netlify.app/ (a static SPA; content
comes from JSON/XML under its `data/` folder, not from prose on the page itself). Reread
that site rather than trusting this doc once the live domain model has clearly moved on —
this is a snapshot as of 2026-07-30.

## What DRISTI is

DRISTI is **PUCAR's platform for running cheque-dishonour (NI Act §138) cases through
Indian courts** — one shared "core" product, deployed per state, each state getting its
own configured copy (rules, language, filer mix) layered on top of identical central law.

The site reviewed here, "DRISTI 2.0 — Domain Model," is **not the case-management product
itself**. It's the reference layer/spec DRISTI is built against: every Act and provision,
piece of case law, procedural stage, role, and item of terminology relevant to a case
type — plus a normative "Requirements" layer (system musts, each one traced to a specific
provision) and a "Standards adherence" layer (accessibility, security, DPDP, and draft
Supreme Court AI-in-courts regulations). Treat it as the domain/spec repo a case-management
build reads from, not the app end users touch.

Cheque bounce is case type #1 (~15% of a typical Indian court's caseload — high-volume,
fairly standardized). The model is explicitly designed to add further case types over the
same shared core later; only one is live today.

## The core idea: three things kept apart, moving through time

1. **Rules** — what you must legally obey: the Constitution, the case type's core Act plus
   shared procedure/evidence/penal codes, binding judgments. This is the *national* layer.
2. **Systems** — what you plug into: eCourts (national programme), CIS (court's own
   case-management software), NJDG (national judicial data grid), NSTEP (summons delivery,
   CNR/case-type codes). DRISTI is one more system in this list — the vendor's platform.
3. **Context** — what you adapt to per state: High Court practice rules, e-filing
   portals/formats, practice directions, unwritten local habits, filer profile/volume,
   court language and UI.

All three move through time: most visibly, **1 July 2024**, when the old CrPC/IPC/Indian
Evidence Act gave way to the new Sanhitas (BNSS/BNS/BSA). Which set of law applies to a
case depends on *when the cheque bounced* (the cause-of-action date), not when the case is
processed — so the model is point-in-time aware throughout, not just "current law."

## National vs state split

- **National (identical everywhere):** the offence & presumptions (NI Act §§138–147),
  criminal procedure, evidence rules, limitation, sentencing/compounding, the constitutional
  powers courts draw on. Modelled as **108 provisions across 21 Acts** (see Sources below).
- **State (each state owns and advances its own):** High Court rules of practice, e-filing
  rules/portals, practice directions/circulars, unwritten local practice, filer profile and
  case volume, court language/UI.

Build principle stated by the model itself: **build for the state, over the national core.**

## State rollout (as of this snapshot)

| State | Status | Character |
|---|---|---|
| Kerala | 🟢 pilot · Kollam, ~2 yrs live | Clean-sheet original pilot, ~2,000 cases/yr, mostly individuals & small companies, court language Malayalam |
| Gujarat | 🔵 expanding | High share of institutional filers (banks/NBFCs), sometimes 1,000+ cases/day → needs bulk filing & case management at scale, court language Gujarati |
| Punjab | 🟣 requirements gathered | Own sequencing of the same shared-core process, not yet live |
| Sikkim | 🟠 early contact | Small jurisdiction, early engagement, own local practice still being learned |

This is a useful signal for prioritization: Kerala validates the core flow for
individual/low-volume filers; Gujarat is the stress test for institutional/bulk filing.

## Content model (what the domain model actually contains)

- **Acts & provisions** — every national Act the case type draws on, each provision's
  verbatim text, tagged by domain (substantive, procedure, evidence, penal, limitation,
  sentencing, interpretation, electronic, banking, constitutional, representation, policing,
  authentication, settlement, access-to-justice) and by tier (operative, definition,
  supporting, procedure, evidence, notice, limitation, sentencing, constitutional).
- **Case law** — Supreme/High Court judgments that fix how provisions are read (42 in the
  §138 profile as of this snapshot). Note: landmark cases like *Rangappa*, *Dashrath
  Rupsingh*, *Damodar S. Prabhu*, *Expeditious Trial (2021)*, *Sanjabij Tari (2025)* are
  flagged in the data as **not yet in the corpus** — treat citations as incomplete, not
  exhaustive.
- **Policy** — national instruments governing how courts run generally (not case-specific),
  e.g. the Supreme Court's draft *Regulations for Use of AI in Courts, 2026* (published for
  comment June 2026, not yet in force).
- **The story** — the case's stage-by-stage journey (e.g. dishonour → 30-day statutory
  notice → 15-day pay window → complaint → trial stages), plus the roles around it: Police
  (rank ladder from the Police Act, 1861) and Courts (tiers and who staffs them).
- **State layer pages** — Amendments (state Acts/provisions), State rules (High Court
  rules), Notifications (government orders/circulars/SOPs) — populated per state as each is
  onboarded.
- **Vocabulary** — glossary of terms used nationally and locally, with state-specific
  variants where they exist (91 national terms in this profile).
- **Requirements** — the normative layer: what a system *must* do to run a case lawfully,
  each statement traced back to the provision that requires it, testable, scoped to
  National + whichever state is active.
- **Standards adherence** — non-legal bar the build is measured against: accessibility
  (WCAG), security, DPDP (India's data protection law), performance, interoperability,
  usability/testing conformance.
- **AI policy compliance** — a sub-tab of Standards: clause-by-clause read of what the
  Supreme Court's draft AI regulations would require of a court *and its vendor*
  (register, audit log, incident disclosure, human-in-the-loop, etc.) — directly relevant
  since DRISTI is a vendor product a court would deploy.

## Legal source corpus (for the §138 cheque-dishonour profile)

Acts are held as Akoma Ntoso XML (the international legal-document standard), each paired
with its source PDF. Key sources, with the pre/post-1 July 2024 pairing:

| Domain | Pre-2024-07-01 | Post-2024-07-01 |
|---|---|---|
| Procedure | Code of Criminal Procedure, 1973 (CrPC) | Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) |
| Penal | Indian Penal Code, 1860 (IPC) | Bharatiya Nyaya Sanhita, 2023 (BNS) |
| Evidence | Indian Evidence Act, 1872 (IEA) | Bharatiya Sakshya Adhiniyam, 2023 (BSA) |

Plus, always-applicable: Negotiable Instruments Act 1881 (the substantive offence),
Constitution of India, General Clauses Act 1897, Limitation Act 1963, Probation of
Offenders Act 1958, IT Act 2000, Payment and Settlement Systems Act 2007 (banking
context), Bankers' Books Evidence Act 1891, Advocates Act 1961, Police Act 1861, Oaths Act
1969, Notaries Act 1952, Legal Services Authorities Act 1987, Rights of Persons with
Disabilities Act 2016, Code of Civil Procedure 1908.

Caveat baked into the data itself: section numbers were extracted from India Code reprint
PDFs — verify against the official source before relying on them for anything authoritative.

## Site architecture (of the domain-model reference tool itself)

- Static SPA: vanilla JS (`app.js`), hand-rolled routing/rendering (`V.<view>` render
  functions, `go(view)` router, hash-based deep links), no build step or framework beyond
  one page.
- One exception: the **Map** tab uses **React Flow** (loaded from esm.sh via an import
  map) to render the domain as a graph — `flow.js`.
- All content is data-driven, fetched at runtime from `data/`: `data/config/app.config.json`
  (icons, case types, jurisdictions, domain labels, state rollout, systems list),
  `data/policy/policy.json` (policy manifest), `data/profiles/<case-type>.profile.json`
  (the actual domain model: sources, provisions, terms, edges, caselaw, national process,
  national institutions), plus per-state `state/<id>.json` and `requirements/<scope>.json`.
- Hosted on Netlify. Adding a new policy document, Act, or state is meant to be a data/config
  change, not a code change — the page explicitly says it's "generic over" these manifests.

## Terminology quick-reference

- **PUCAR** — the org/team building this (appears as `maintained_by` throughout the data).
- **DRISTI** — the product/platform name; also this specific "Domain Model" reference site.
- **Cause-of-action date** — the date the cheque bounced; determines old-code vs
  new-Sanhita applicability, not the date a case is filed or heard.
- **National core** — law/process identical across every Indian state.
- **State layer** — everything a specific state adds on top of the core.
- **Relevance profile** — the per-case-type cross-index (e.g.
  `cheque-dishonour-s138.profile.json`) tying together provisions, terms, case law, and
  process for that case type.
- **Akoma Ntoso (AKN)** — the XML standard used to store legal text in the corpus.

## What this doc deliberately leaves out

Full statutory text, the complete stage-by-stage procedural timeline, the full police-rank
ladder, and the full requirements/standards checklists all live in the source data
(`data/profiles/*.json`, `data/config/app.config.json`) or the live site — pull them from
there on demand rather than duplicating them here, to keep this file a stable orientation
doc rather than a mirror of a dataset that will keep growing (more case types, more states).
