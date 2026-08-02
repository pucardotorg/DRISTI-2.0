---
name: pucar-design-system
description: Use before writing or changing any UI in this repo (components, screens, styles under apps/). Enforces that Dristi UI comes only from pucar-design-system — no hardcoded colors, no parallel component library.
---

# Pucar design system

DRISTI's UI must use [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system)
only — see [docs/design/design-system.md](../../../docs/design/design-system.md) for the full
contract. This mirrors `.cursor/rules/pucar-design-system.mdc` so the same rules apply
whether the repo is being built with Cursor or Claude Code.

## Rules

1. **Tokens only** — no hardcoded hex / `oklch()` / arbitrary values like `bg-[#007e7e]`.
2. **Reuse before create** — compose from existing design-system components; do not
   invent parallel primitives in `apps/`.
3. **Light and dark are equal** — use tokens that exist in both themes.
4. **Dristi-specific UI** belongs under `apps/` as *compositions* (screens, flows,
   layouts), not as a second button/input library.
5. **Accessibility is part of the DS contract** — do not redefine it here. Follow
   `ACCESSIBILITY.md` in the design-system repo. Product-level bar:
   [docs/product/standards/adherence.md](../../../docs/product/standards/adherence.md).

## Before building UI

- Read the design-system `AGENTS.md`, `ACCESSIBILITY.md`, and foundations.
- Product meaning (what a screen is *for*) comes from
  [docs/product/](../../../docs/product/) — do not invent personas; see
  [docs/product/open-questions.md](../../../docs/product/open-questions.md).
- How `apps/` will technically depend on the design system (npm package, workspace, git
  dependency) isn't decided yet — until the first app is scaffolded, treat the external
  repo as the only UI kit to follow.
