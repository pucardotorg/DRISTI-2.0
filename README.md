# Pucar Dristi 2.0

PUCAR's DRISTI platform for NI Act §138 (cheque-dishonour) cases through Indian courts —
shared national core, deployed per state.

This repository holds product orientation docs and the main app shell. UI look and feel
comes from [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system) —
agents always pull from that system; this repo does not fork it.

## Layout

| Path | Role |
|---|---|
| [apps/dristi-app](apps/dristi-app) | Dristi App (main product) |
| [docs/](docs/README.md) | Product + design orientation |
| `.cursor/rules/`, `.claude/rules/` | Always-on guardrails (Cursor / Claude Code) |
| `.cursor/skills/`, `.claude/skills/` | On-demand skills (add when needed) |

## Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docs

Start at **[docs/README.md](docs/README.md)**.

Domain detail source of truth: [DRISTI 2.0 — Domain Model](https://dristidomain.netlify.app/).

## Agent entrypoint

[CLAUDE.md](CLAUDE.md) — short shared entry for Cursor and Claude Code.
