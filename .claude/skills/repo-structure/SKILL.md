---
name: repo-structure
description: Use before creating new top-level files/directories, or deciding where a doc, app, or workflow belongs in this repo. Explains the docs/product, docs/design, apps/, agents/ layout so new work lands in the right place instead of a new ad-hoc location.
---

# Repo structure

This mirrors `.cursor/rules/repo-structure.mdc` so the same layout guardrails apply
whether the repo is being built with Cursor or Claude Code.

| Path | Role |
|---|---|
| `docs/product/` | Product / domain truth |
| `docs/design/` | How we use pucar-design-system (not the DS source) |
| `apps/` | Runnable builds; accepted product lands here over time |
| `agents/` | Named agent workflows (add when a real workflow exists) |
| `.cursor/rules/`, `.claude/skills/` | Always-on agent guardrails, one pair per rule |

Start from [docs/README.md](../../../docs/README.md). Load only the docs needed for the
task. Do not create a second design system inside this repo, and do not add new
top-level directories without updating `docs/README.md`'s "Repo layers" table.
