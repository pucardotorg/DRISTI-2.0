# Design

How Dristi looks and behaves in product UI. This folder is **guidance for this repo** —
it does **not** contain design-system source code.

**Source of truth for UI:** [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system)

That repo owns tokens (CSS variables), foundations, and documented components
(shadcn/ui + Radix, Pucar-themed). This Dristi repo builds product screens and
flows **from** that system.

## Rules

1. **Tokens only** — no hardcoded hex / `oklch()` / arbitrary values like `bg-[#007e7e]`.
2. **Reuse before create** — compose from existing design-system components; do not
   invent parallel primitives in this repo.
3. **Light and dark are equal** — use tokens that exist in both themes.
4. **Dristi-specific UI** belongs here as *compositions* (screens, flows, layouts),
   not as a second button/input library.
5. **Accessibility is part of the DS contract** — do not redefine it here. Follow
   [ACCESSIBILITY.md](https://github.com/neer-ideasbeforenoon/pucar-design-system/blob/main/ACCESSIBILITY.md)
   in the design-system repo (and its foundations docs). Product-level bar:
   [../product/standards/adherence.md](../product/standards/adherence.md).

## For agents and builders

- Read the design-system `AGENTS.md`, `ACCESSIBILITY.md`, and foundations when changing UI.
- Always-on rails: `.cursor/rules/pucar-design-system.mdc` (Cursor) and
  `.claude/rules/pucar-design-system.md` (Claude Code).
- Product meaning (what a screen is *for*) still comes from [../product/](../product/).

↑ Docs map: [../README.md](../README.md).

## Not decided yet

How this app will *technically* depend on the design system (npm package, workspace,
git dependency) will be set when the product application is scaffolded. Until then,
treat the external repo as the only UI kit to follow.
