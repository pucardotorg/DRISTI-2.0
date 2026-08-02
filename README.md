# Pucar Dristi 2.0

PUCAR's DRISTI platform for NI Act §138 (cheque-dishonour) cases through Indian courts —
shared national core, deployed per state.

This repository is the **product workshop**: orientation docs, design contract, future
apps, and agent workflows. UI primitives come from the shared
[pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system) —
this repo consumes that system; it does not fork it.

## Layout

| Path | Role |
|---|---|
| [docs/](docs/README.md) | Product + design orientation |
| [apps/](apps/README.md) | Runnable builds (when we start building) |
| [agents/](agents/README.md) | Named agent workflows (as we add them) |
| `.cursor/rules/` | Always-on guardrails for AI agents |

## Docs

Start at **[docs/README.md](docs/README.md)**.

Domain detail source of truth: [DRISTI 2.0 — Domain Model](https://dristidomain.netlify.app/).

## Agent entrypoint

[CLAUDE.md](CLAUDE.md) — short; points into `docs/`, `apps/`, and the design-system contract.
