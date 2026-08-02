# DRISTI docs map

Orientation for this repo. Docs describe the product and how we design; they are
**not** the live case-management app.

**Domain detail source of truth:** [DRISTI 2.0 — Domain Model](https://dristidomain.netlify.app/)
(data under its `data/` folder). Snapshot date for product prose: **2026-07-30**.

## Sections

| Section | What it holds | Start here |
|---|---|---|
| **Product** | What DRISTI is — domain, journey, standards, open questions | [product/README.md](product/README.md) |
| **Design** | How Dristi UI is built — use pucar-design-system only | [design/README.md](design/README.md) |

## Repo layers (outside `docs/`)

| Path | Role |
|---|---|
| `apps/` | Runnable builds / the product app (added as we build) |
| `agents/` | Named agent workflows and prompts (added as we need them) |
| `.cursor/rules/`, `.claude/skills/` | Always-on guardrails for AI agents in this repo |

## Intentionally not here

- Full statutory text and growing datasets — pull from the domain site / its `data/`.
- The design-system **code** (tokens, components) — lives in
  [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system);
  this repo **consumes** it.
