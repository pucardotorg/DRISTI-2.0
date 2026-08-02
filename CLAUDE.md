# Pucar Dristi 2.0

DRISTI is PUCAR's platform for running cheque-dishonour (Negotiable Instruments Act §138)
cases through Indian courts: one shared core, deployed per state with local rules/language
layered on top of identical national law.

**Docs map:** [docs/README.md](docs/README.md)

| Layer | Path |
|---|---|
| Product / domain | [docs/product/](docs/product/) |
| Design (consume DS only) | [docs/design/](docs/design/) |
| Runnable builds | [apps/](apps/) |
| Named agent workflows | [agents/](agents/) |

**UI:** use [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system)
only — see [docs/design/design-system.md](docs/design/design-system.md). Enforced in
`.cursor/rules/` (Cursor) and `.claude/skills/` (Claude Code).

Read only the docs needed for the task. Do not invent product personas or “who uses
DRISTI” assumptions — see [docs/product/open-questions.md](docs/product/open-questions.md).
