# Overview

Snapshot: 2026-07-30. Source: [domain model site](https://dristidomain.netlify.app/).

## What DRISTI is

DRISTI is **PUCAR's platform for running cheque-dishonour (NI Act §138) cases through
Indian courts** — one shared “core” product, deployed per state, each state getting its
own configured copy (rules, language, filer mix) layered on top of identical central law.

Cheque bounce is case type #1 (~15% of a typical Indian court's caseload — high-volume,
fairly standardized). The model is designed to add further case types over the same
shared core later; only one is live today.

## Domain site ≠ product

The site “DRISTI 2.0 — Domain Model” is **not** the case-management product end users
touch. It is the reference layer/spec a build reads from: Acts and provisions, case law,
procedural stages, roles, terminology, a normative Requirements layer (system musts
traced to provisions), and Standards adherence (accessibility, security, DPDP, draft
Supreme Court AI-in-courts regulations).

Treat that site (and its `data/`) as the domain/spec source. These repo docs are a
stable orientation map over that snapshot.

## Related

- Architecture of the domain: [architecture.md](architecture.md)
- What the content model holds: [content-model.md](content-model.md)
- Product unknowns (users, scope): [open-questions.md](open-questions.md)
