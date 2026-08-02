# Design

How Dristi looks and behaves in product UI. This folder is **guidance for this repo** —
it does **not** contain design-system source code.

**Source of truth for UI:** [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system)

That repo owns tokens (CSS variables), foundations, and documented components
(shadcn/ui + Radix, Pucar-themed). This Dristi repo builds product screens and
flows **from** that system.

## Where the product app lives

The main product is **Dristi App** ([`apps/dristi-app`](../../apps/dristi-app)).
Product screens go there. Look and feel still comes from the design-system repo —
not from inventing a second kit inside Dristi.

## How agents and builders use the design system

1. **Always pull from the DS repo first** — tokens, components, `AGENTS.md`,
   `ACCESSIBILITY.md`, and the live docs site.
2. **Do not invent** local colors, buttons, or inputs in Dristi.
3. **Bring pieces into Dristi App as needed** (tokens already seeded in
   `apps/dristi-app/src/app/globals.css`; UI under
   `apps/dristi-app/src/components/ui/`) so the app can run — the DS remains the
   boss; keep Dristi copies in sync with it.
4. **Dristi-specific work** is compositions: screens, flows, layouts.

## Rules

1. **Tokens only** — no hardcoded hex / `oklch()` / arbitrary values like `bg-[#007e7e]`.
2. **Reuse before create** — compose from existing design-system components; do not
   invent parallel primitives in this repo.
3. **Light and dark are equal** — use tokens that exist in both themes.
4. **Accessibility is part of the DS contract** — do not redefine it here. Follow
   [ACCESSIBILITY.md](https://github.com/neer-ideasbeforenoon/pucar-design-system/blob/main/ACCESSIBILITY.md)
   in the design-system repo (and its foundations docs). Product-level bar:
   [../product/standards/adherence.md](../product/standards/adherence.md).

## For agents and builders

- Read the design-system `AGENTS.md`, `ACCESSIBILITY.md`, and foundations when changing UI.
- Always-on rails: `.cursor/rules/pucar-design-system.mdc` (Cursor) and
  `.claude/rules/pucar-design-system.md` (Claude Code).
- Product meaning (what a screen is *for*) still comes from [../product/](../product/).

↑ Docs map: [../README.md](../README.md).
