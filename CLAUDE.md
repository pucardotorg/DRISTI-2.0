# Pucar Dristi 2.0

DRISTI is PUCAR's platform for running cheque-dishonour (Negotiable Instruments Act §138)
cases through Indian courts: one shared core, deployed per state with local rules/language
layered on top of identical national law.

**Docs map:** [docs/README.md](docs/README.md)

| Layer | Path |
|---|---|
| Dristi App | [apps/dristi-app](apps/dristi-app) |
| Product / domain | [docs/product/](docs/product/) |
| Design (consume DS only) | [docs/design/](docs/design/) |

**UI:** before any UI work, **read** the DS repo’s `AGENTS.md`, `ACCESSIBILITY.md`, Laws,
Typography, and needed `src/components/ui/*` — then `npm run sync:ui -- <name>` (do not hand-write).
Gates: `npm run check:tokens`, `npm run check:typography`, and `npm run check:ui-sync`. See
[docs/design/design-system.md](docs/design/design-system.md).

**Always-on agent rails:** `.cursor/rules/` / `.claude/rules/` (mandatory DS gate).  
**Skills:** `pull-ui-from-ds` and `review-ui-ds` under `.cursor/skills/` and `.claude/skills/`.

Read only the docs needed for the task. Do not invent product personas or “who uses
DRISTI” assumptions — see [docs/product/open-questions.md](docs/product/open-questions.md).
Do not create a second design system or new top-level folders without updating
[docs/README.md](docs/README.md).
