# DRISTI docs map

Orientation for this repo. Docs describe the product and how we design; they are
**not** the live case-management app.

**Domain detail source of truth:** [DRISTI 2.0 — Domain Model](https://dristidomain.netlify.app/)
(data under its `data/` folder). Snapshot date for product prose: **2026-07-30**.

## Sections

| Section | What it holds | Start here |
|---|---|---|
| **Product** | What DRISTI is — domain, journey, standards, open questions | [product/README.md](product/README.md) |
| **Design** | How Dristi UI is built — use pucar-design-system only | [design/design-system.md](design/design-system.md) |

## Repo layers (outside `docs/`)

| Path | Role |
|---|---|
| `apps/` | Runnable builds / the product app (added as we build) |
| `.cursor/rules/`, `.claude/rules/` | Always-on guardrails (Cursor / Claude Code) |
| `.cursor/skills/`, `.claude/skills/` | On-demand skills (add when a real workflow exists) |

## Intentionally not here

- Full statutory text and growing datasets — pull from the domain site / its `data/`.
- The design-system **code** (tokens, components) — lives in
  [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system);
  this repo **consumes** it.
- A custom `agents/` folder — tool-native paths above are the agent layer.
