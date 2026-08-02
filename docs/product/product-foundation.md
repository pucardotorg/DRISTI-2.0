# Domain-backed product foundation

Snapshot: 2026-08-02. Source: [domain model site](https://dristidomain.netlify.app/).

What we can treat as **solid product foundation** from the domain snapshot — without
inventing why 2.0 exists, who logs in, or revamp goals. Those stay in
[open-questions.md](open-questions.md).

Deeper detail lives in the linked docs; this page is the single orientation for design
and agents.

## 1. Product shape

DRISTI is PUCAR’s **vendor platform** for running §138 cheque-dishonour cases: one shared
national core, deployed as a configured copy per state.

- Case type live today: **Cheque bounce · NI Act §138** (~15% of a typical court’s
  caseload; high volume, fairly standardized). Further case types are intended later over
  the same core.
- Adjacent systems (named, ownership not specified): **eCourts**, **CIS**, **NJDG**,
  **NSTEP** (summons / CNR / case-type codes). DRISTI is “your platform” in that list.

See [overview.md](overview.md) and [architecture.md](architecture.md).

## 2. What must vary by state (config surface)

Identical national law underneath; each state owns:

| Axis | Why it matters for product |
|---|---|
| High Court rules of practice | How a matter is filed, listed, moved |
| E-filing rules & portals | Formats and local e-Courts / CIS configuration filers must satisfy |
| Practice directions & circulars | Bulk cause-lists, service, adjournment norms |
| Local, unwritten practice | Registry habits and day-to-day court reality |
| Filer profile & case volume | Who files and at what scale — reshapes workflow though law is identical |
| Court language & UI | Working language for notices, forms, orders, interface |

**Build principle:** build for the state, over the national core.

See [national-vs-state.md](national-vs-state.md) and [rollout.md](rollout.md).

## 3. Case model (timeline, status, clocks)

### National prescribed spine

Same in every state until state rules add to it. Full write-up:
[domain/journey.md](domain/journey.md).

| Stage | Prescribed clock (where set) |
|---|---|
| Dishonour & statutory notice | Notice within **30 days** of the dishonour memo |
| 15-day window to pay | **15 days** for the drawer to pay |
| Cause of action & complaint | Complaint within **1 month** of cause of action |
| Cognizance & examination | — |
| Issue of process (summons) | — |
| Appearance, accusation & plea | — |
| Evidence & presumptions | — |
| Judgment | Endeavour to conclude within **6 months** of filing |
| Sentence, compensation & compounding | — |
| Appeal | — |

**Point-in-time law:** which code set applies depends on the **cause-of-action date**
(cheque bounce), especially around **1 July 2024** (CrPC/IPC/IEA ↔ BNSS/BNS/BSA) — not
the filing or hearing date. See [architecture.md](architecture.md) and
[sources.md](sources.md).

### Kerala operational spine (pilot)

De jure Kerala process from the state layer (rules + Acts). Lived practice is a separate,
provisional layer — see [domain/practice-notes.md](domain/practice-notes.md).

1. Filing the complaint (DCMS e-filing; court fee on filing)
2. Scrutiny & defect check (Registry; before numbering / cognizance)
3. Cognizance & issue of process (Malayalam process needs authorised English translation)
4. Service of summons (police / SHO; e-service where rules permit)
5. If the accused does not appear (warrant → proclamation / attachment)
6. Trial (summary; affidavit evidence; §139 presumption)
7. Judgment, sentence & compensation
8. Compounding / settlement (compoundable at any stage)
9. Appeal & revision (incl. §148 deposit floor; HC revision / quash)

**Kerala design facts from the snapshot:** Kollam **24×7 ON Court** designated for §138;
elsewhere ordinary JMFC courts. Court language **Malayalam**. Court-fee schedule is
ad valorem on cheque amount — verify current Finance Act slabs before shipping numbers.

## 4. Domain cast (roles in the case)

These are **who appears in a §138 case**, not confirmed DRISTI login personas.

| Kind | Roles |
|---|---|
| Parties | Complainant (payee / holder in due course), accused (drawer), PoA holder, surety, drawee bank, witness |
| Representation | Advocate, advocate’s clerk |
| Court | JMFC (trial), Chief Ministerial Officer / Sheristadar, bench clerk, scrutiny officer, stenographer, interpreter |
| Police | Primarily process execution (e.g. SHO) — not FIR-led investigation for §138 |
| Path | JMFC → Court of Session (appeal) → High Court (revision / quash) → Supreme Court (rare, special leave) |

Full national detail: [domain/actors.md](domain/actors.md). Who logs into the product:
[open-questions.md](open-questions.md).

## 5. Normative system musts (Requirements)

What a system **must** do to run a case lawfully — traced to provisions, testable, scoped
National + active state. Full checklists stay on the domain site; do not mirror them here.

As of this snapshot:

| Scope | Count | Dominant levels | Typical `binds` targets |
|---|---|---|---|
| National | ~172 | Mostly MUST / MUST NOT | validation-rule, schema-field, workflow-step, screen, output-document |
| Kerala | ~110 | Mostly MUST | schema-field, validation-rule, output-document, workflow-step (+ some access-control) |

Kerala file adds only what Kerala instruments require (or tighten); it does **not** restate
central offence / notice / limitation law.

Example of a product-binding Kerala must: limitation uses the moment the complaint is
**electronically received in the Registry in IST**, not when the filer started the upload;
portal failure is **not** a ground to extend limitation.

How to use the layer: [standards/requirements.md](standards/requirements.md). Live data:
[Requirements · Kerala](https://dristidomain.netlify.app/#requirements?state=kerala).

## 6. Kerala vs Gujarat (pilot character)

| | Kerala | Gujarat |
|---|---|---|
| Status | Pilot · Kollam ~2 yrs | Expanding |
| Filers | Mostly individuals & small companies | High share of banks / NBFCs |
| Volume signal | ~2,000 cases/yr (Kollam) | Sometimes ~1,000+ cases/day |
| Language | Malayalam | Gujarati |
| Product implication (from snapshot) | Validates core flow for individual / low-volume | Stress-tests bulk filing & case management |

Punjab (requirements gathered) and Sikkim (early contact) are later. Detail:
[rollout.md](rollout.md).

## Intentionally not claimed here

- Why DRISTI 2.0 / what failed in 1.0  
- Who has a DRISTI account (product users / personas)  
- Which stages are in-app vs CIS / eCourts / paper  
- Full-revamp success metrics  
- Practice-note allegations as requirements  

Parked: [open-questions.md](open-questions.md).

## Related map

| Topic | Doc |
|---|---|
| Domain site ≠ product | [overview.md](overview.md) |
| Rules / Systems / Context | [architecture.md](architecture.md) |
| What the domain corpus contains | [content-model.md](content-model.md) |
| Shared terms | [terminology.md](terminology.md) |
| Non-legal bars (WCAG, DPDP, …) | [standards/adherence.md](standards/adherence.md) |
