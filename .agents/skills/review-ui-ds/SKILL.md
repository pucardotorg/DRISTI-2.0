---
name: review-ui-ds
description: >-
  Review Dristi UI against the Pucar design system — tokens, component sync,
  accessibility, Laws, and invent-risk. Use when reviewing screens, UI diffs,
  PRs, design adherence, accessibility, or when the user asks for a UI / DS
  review.
---

# Review UI against Pucar DS

Run this after building or changing UI. Catch inventing before it ships.

## 1. Resolve and read DS (exact files)

DS root (first match): `vendor/pucar-design-system`, then `PUCAR_DS_ROOT` if set.
Verify origin contains `neer-ideasbeforenoon/pucar-design-system` (or `.pucar-ds-id`).
If missing or wrong org: stop and ask the user to run `npm install`. Never search
Desktop/home for other clones by name.

Read:

- `{DS}/AGENTS.md`
- `{DS}/ACCESSIBILITY.md`
- `{DS}/RESPONSIVE.md` (if layout / breakpoints involved)
- `{DS}/src/app/(docs)/foundations/laws/page.tsx` (Laws)
- `{DS}/src/app/(docs)/foundations/typography/page.tsx`
- Changed files under `apps/dristi-app/`

## 2. Mechanical gates (must run)

From repo root:

```bash
npm run check:tokens
npm run check:typography
npm run check:ui-sync
```

Or `npm run lint -w @pucar/dristi-app` (includes both). Failures are **Critical**.

## 3. Checklist

```
Review:
- [ ] check:tokens passed
- [ ] check:typography passed
- [ ] check:ui-sync passed (primitives match DS; globals.css matches)
- [ ] No hand-written / invented controls — synced via `npm run sync:ui -- <name>`
- [ ] Semantic tokens only (no hex, oklch arbitrary, raw neutral-N, white/black)
- [ ] Status uses solid / muted / ink — no alpha fakes (`bg-destructive/10`)
- [ ] Light and dark both work (token roles from AGENTS.md)
- [ ] Product copy uses named DS roles (`text-body`; `text-title-* font-semibold`)
- [ ] Primitive-internal `text-sm` has not leaked into citizen-facing screen copy
- [ ] Laws: sentence case; one primary teal action per view; 40px controls; 40×40 touch
- [ ] ACCESSIBILITY.md: labels, keyboard, focus, errors via aria-describedby / Field
- [ ] Product meaning from docs/product — no invented personas
```

## 4. Report format

- Critical — must fix (gate fail, hardcoded colour, invented primitive, a11y floor break)
- Suggestion — Laws / composition polish
- Nice to have — optional

For each finding: file path, what DS rule it breaks, how to fix
(usually `npm run sync:ui -- <component>` or use a token utility).

## 5. Done means

Do not approve UI that invents look-and-feel or drifts from DS component source.
