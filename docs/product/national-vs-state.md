# National vs state split

Snapshot: 2026-07-30. Source: [domain model site](https://dristidomain.netlify.app/).

## National (identical everywhere)

The offence and presumptions (NI Act §§138–147), criminal procedure, evidence rules,
limitation, sentencing/compounding, and the constitutional powers courts draw on.
Modelled as **108 provisions across 21 Acts** (see [sources.md](sources.md)).

## State (each state owns and advances its own)

High Court rules of practice, e-filing rules/portals, practice directions/circulars,
unwritten local practice, filer profile and case volume, court language/UI.

## Build principle

**Build for the state, over the national core.**

That is the model's stated principle: shared law/process underneath; state-specific
configuration, practice, and language on top. See [rollout.md](rollout.md) for which
states are onboarded and how they differ in character.
