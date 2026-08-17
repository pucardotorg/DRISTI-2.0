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

**UI:** before any UI work, the DS is at `vendor/pucar-design-system` after `npm install`.
**Read** that repo’s `AGENTS.md`, `ACCESSIBILITY.md`, Laws, Typography, and needed
`src/components/ui/*` — then `npm run sync:ui -- <name>` (do not hand-write).
Gates: `npm run check:tokens`, `npm run check:typography`, `npm run check:ui-sync`, and
`npm run check:rails`. See [docs/design/design-system.md](docs/design/design-system.md).
**Craft (mandatory, every iteration):** also load the `ui-craft` skill for any UI build,
change, or polish — layering (canvas → chrome → panel → well), strokes, type, elevation —
and run its pre-flight checklist on the render before reporting done.

**Always-on agent rails:** `.cursor/rules/` / `.claude/rules/` (mandatory DS gate).

**Design roles** — propose → build → review, one skill and one role per stage. Mirrored
across both tools; `check:rails` fails if the copies drift.

| Stage | Skill | Role (Claude / Cursor) |
|---|---|---|
| Propose | `propose-ui-brief` | `ux-designer` / `role-ux-designer.mdc` |
| Build | `pull-ui-from-ds` | `ui-designer` / `role-ui-designer.mdc` |
| Review | `review-ui-ds` | `ui-reviewer` / `role-ui-reviewer.mdc` |

Skills live under `.claude/skills/` and `.cursor/skills/`; roles under `.claude/agents/`
and `.cursor/rules/role-*.mdc`. Briefs go to `docs/design/proposals/`.

Read only the docs needed for the task. Do not invent product personas or “who uses
DRISTI” assumptions — see [docs/product/open-questions.md](docs/product/open-questions.md).
Do not create a second design system or new top-level folders without updating
[docs/README.md](docs/README.md).
