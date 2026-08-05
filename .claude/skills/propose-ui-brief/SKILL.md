---
name: propose-ui-brief
description: >-
  Write a design brief for a Dristi screen or flow before any code exists —
  job, layout, hierarchy, spacing, DS components, states, and open questions.
  Use when starting a new screen, redesigning a flow, deciding how a feature
  composes from the design system, or when asked for a component that may not
  need to exist. Produces docs/design/proposals/<slug>.md.
---

# Propose a UI brief

Decide what a screen should be **before** anyone writes it. This is the planning leg
that precedes `pull-ui-from-ds` (build) and `review-ui-ds` (audit).

Do not write application code while running this. The only output is a brief.

## 1. Ground in the product first

Read `docs/product/README.md`, then whichever of `overview.md`, `domain/journey.md`,
`domain/actors.md`, `domain/practice-notes.md`, `national-vs-state.md`,
`terminology.md` bear on the screen. Cite them in the brief.

If the docs don't say who this screen serves or why, **say so and ask** — do not invent
personas, adoption numbers, or research. See `docs/product/open-questions.md`.

Assume the reader is under a statutory deadline, not a repeat user, on a mid-range
Android phone, reading their second or third language, in a domain whose native
vocabulary is legal and hostile. Design for that, not the demo.

## 2. Read the design system

DS root: `/Users/neerchaudhury/Documents/pucar-design-system` → `../pucar-design-system`
→ `PUCAR_DS_ROOT`. If none resolve, stop — do not propose UI blind.

- `{DS}/AGENTS.md`, `{DS}/ACCESSIBILITY.md`, `{DS}/RESPONSIVE.md`
- Foundations at `{DS}/src/app/(docs)/foundations/<name>/page.tsx` — `laws` always;
  then `typography`, `spacing`, and `colors` / `elevation` / `radius` / `icons` /
  `accessibility` whenever the brief takes a position they govern
- Glob `{DS}/src/components/ui/` — know the real vocabulary before proposing anything
  that sounds new

Then skim `apps/dristi-app/src/app` and `.../components`. If Dristi already solves this
shape of problem, propose that way or argue explicitly why it should change. Never
quietly introduce a second way.

## 3. Decide, with restraint

New component, step, or field must prove the existing one is **insufficient** — not
merely that the new one is nicer. Cite the DS file behind each call, or label it as
judgment. Name the tradeoff and recommend; don't hand over a menu.

If the request itself is wrong — a screen that shouldn't exist, a step that should be
automatic — say that first.

## 4. Write it

`docs/design/proposals/<kebab-screen-name>.md`:

```markdown
# <Screen / flow name>
Status: draft
Source: <docs/product/... paths this brief is grounded in>

## Job
## What I cut (and why)
## Layout & hierarchy
## Components (DS name → region)
## Spacing
## States (empty / loading / error / long-label)
## Open questions for product
## Gaps in the DS (if any)
```

"What I cut" is not optional — it is the clearest signal of judgment in the brief.
Cover the long-label / long-language case: one core deploys per state with local
languages over identical national law.

## Done means

- Every recommendation traces to a DS file or product doc, or is labelled judgment
- States beyond the happy path are specified
- Gaps are framed as DS-repo requests, never as license to invent inside Dristi
- The decision and its main tradeoff are summarized in the reply, not just the file

Hand to `pull-ui-from-ds` to build. `review-ui-ds` audits the result against the DS —
not against this brief. A brief is a plan; the DS stays the source of truth.
