# Content model

Snapshot: 2026-07-30. Source: [domain model site](https://dristidomain.netlify.app/).

What the domain model actually contains (layers a case-management build can read from):

## Acts & provisions

Every national Act the case type draws on; each provision's verbatim text, tagged by
domain (substantive, procedure, evidence, penal, limitation, sentencing, interpretation,
electronic, banking, constitutional, representation, policing, authentication, settlement,
access-to-justice) and by tier (operative, definition, supporting, procedure, evidence,
notice, limitation, sentencing, constitutional).

## Case law

Supreme/High Court judgments that fix how provisions are read (42 in the §138 profile as
of this snapshot). Landmark cases such as *Rangappa*, *Dashrath Rupsingh*,
*Damodar S. Prabhu*, *Expeditious Trial (2021)*, *Sanjabij Tari (2025)* are flagged in the
data as **not yet in the corpus** — treat citations as incomplete, not exhaustive.

## Policy

National instruments governing how courts run generally (not case-specific), e.g. the
Supreme Court's draft *Regulations for Use of AI in Courts, 2026* (published for comment
June 2026, not yet in force). See [standards/ai-policy.md](standards/ai-policy.md).

## The story

The case's stage-by-stage journey plus the roles around it (Police and Courts). Summarized
in this repo under [domain/journey.md](domain/journey.md) and
[domain/actors.md](domain/actors.md); full detail in the profile JSON.

## State layer

Amendments (state Acts/provisions), State rules (High Court rules), Notifications
(government orders/circulars/SOPs) — populated per state as each is onboarded.

## Vocabulary

Glossary of terms used nationally and locally, with state-specific variants where they
exist (91 national terms in this profile). See also [terminology.md](terminology.md).

## Requirements

Normative layer: what a system *must* do to run a case lawfully, each statement traced to
the provision that requires it, testable, scoped to National + whichever state is active.
See [standards/requirements.md](standards/requirements.md).

## Standards adherence

Non-legal bar: accessibility (WCAG), security, DPDP, performance, interoperability,
usability/testing. See [standards/adherence.md](standards/adherence.md).

## AI policy compliance

Sub-tab of Standards: clause-by-clause read of draft SC AI regulations for a court *and
its vendor*. See [standards/ai-policy.md](standards/ai-policy.md).

## How the domain site packages this

Static SPA, data-driven from `data/` at runtime (`app.config.json`, profile JSON, per-state
and requirements JSON, Akoma Ntoso Act XML). Hosted on Netlify. Adding a policy, Act, or
state is intended as a data/config change, not an app rewrite. Full site architecture
notes remain on the live site; this repo does not mirror the SPA code.
