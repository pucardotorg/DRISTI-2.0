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

**UI:** always pull tokens and components from
[pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system) —
see [docs/design/design-system.md](docs/design/design-system.md). Do not invent a second
design system in this repo.

**Always-on agent rails:** `.cursor/rules/` (Cursor) and `.claude/rules/` (Claude Code).  
**On-demand skills:** `.cursor/skills/` and `.claude/skills/` — add only for real workflows.

Read only the docs needed for the task. Do not invent product personas or “who uses
DRISTI” assumptions — see [docs/product/open-questions.md](docs/product/open-questions.md).
Do not create a second design system or new top-level folders without updating
[docs/README.md](docs/README.md).
