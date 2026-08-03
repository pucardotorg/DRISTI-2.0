---
name: pull-ui-from-ds
description: >-
  Pull exact Pucar design-system rules and components into Dristi App before any
  UI work. Use when building or changing screens, components, tokens, layouts,
  buttons, forms, or styling in apps/dristi-app, or when the user mentions the
  design system, DS, pucar-design-system, look and feel, or UI primitives.
---

# Pull UI from Pucar design system

Do not invent UI. Read the DS, sync primitives, then compose screens in Dristi App.

## Resolve DS root

1. `/Users/neerchaudhury/Documents/pucar-design-system`
2. `../pucar-design-system` relative to the Dristi repo root
3. Or set `PUCAR_DS_ROOT`

If unavailable, stop and ask the user. Do not freestyle.

## Mandatory reads (every UI task)

1. `{DS}/AGENTS.md`
2. `{DS}/ACCESSIBILITY.md`
3. `{DS}/RESPONSIVE.md` (layouts)
4. `{DS}/src/app/(docs)/foundations/laws/page.tsx` when composing screens
5. `{DS}/src/app/(docs)/foundations/typography/page.tsx` for text roles
6. `{DS}/src/app/(docs)/foundations/spacing/page.tsx` for the spacing ladder
7. Matching `{DS}/src/components/ui/<name>.tsx` for each control

**Spacing:** stay on Tailwind’s ladder `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.
Micro steps (`0.5` / `1.5` / `2.5`) inside controls only. No `p-5` / `gap-10` / arbitrary
px. Defaults: `h-10` controls, `p-6` card padding, `gap-8+` section breaks. Radius by
role: controls `rounded-lg`, containers `rounded-xl`.

Obey those files verbatim. DS wins over generic invent-visual preferences.

## Sync — do not hand-write primitives

From repo root:

```bash
npm run sync:ui -- button          # one component
npm run sync:ui -- button input    # several
npm run sync:ui -- --tokens-only   # globals.css from DS
```

Catalog of names: `{DS}/public/r/registry.json` or live
`https://pucar-design-system-five.vercel.app/r/registry.json`.

`components.json` registers `@pucar` for discovery. Prefer **`npm run sync:ui`**
from the local DS clone — that is the supported install path today.

## Build workflow

```
Progress:
- [ ] DS root resolved; AGENTS + ACCESSIBILITY (+ Laws/RESPONSIVE) read
- [ ] Missing controls synced via npm run sync:ui -- <name>
- [ ] Screen composed in apps/dristi-app only
- [ ] npm run check:tokens && npm run check:typography && npm run check:ui-sync
```

Product meaning from `docs/product/` — do not invent personas.

## Done means

- Rules came from DS files; primitives match DS byte-for-byte (gate)
- `check:tokens`, `check:typography`, and `check:ui-sync` pass
- After shipping UI, run **review-ui-ds** if asked to review
