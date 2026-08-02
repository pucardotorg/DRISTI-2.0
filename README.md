# Pucar Dristi 2.0

PUCAR's DRISTI platform for NI Act §138 (cheque-dishonour) cases through Indian courts —
shared national core, deployed per state.

This repository is the **product workshop**: orientation docs, design contract, and future
product code. UI primitives come from
[pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system) —
this repo consumes that system; it does not fork it.

## Layout

| Path | Role |
|---|---|
| [docs/](docs/README.md) | Product + design orientation |
| `.cursor/rules/`, `.claude/rules/` | Always-on guardrails (Cursor / Claude Code) |
| `.cursor/skills/`, `.claude/skills/` | On-demand skills (add when needed) |

## Docs

Start at **[docs/README.md](docs/README.md)**.

Domain detail source of truth: [DRISTI 2.0 — Domain Model](https://dristidomain.netlify.app/).

## Agent entrypoint

[CLAUDE.md](CLAUDE.md) — short shared entry for Cursor and Claude Code.
