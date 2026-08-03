# Design

How Dristi looks and behaves in product UI. This folder is **guidance for this repo** —
it does **not** contain design-system source code.

**Source of truth for UI:** [pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system)

## Where the product app lives

**Dristi App** ([`apps/dristi-app`](../../apps/dristi-app)). Screens go there; look and feel
comes from the DS — not a second kit inside Dristi.

## How agents must use the design system

**DS root:** `/Users/neerchaudhury/Documents/pucar-design-system` → sibling
`../pucar-design-system` → `PUCAR_DS_ROOT`.

**Before any UI change, read:** `AGENTS.md`, `ACCESSIBILITY.md`, `RESPONSIVE.md`, Laws
(`src/app/(docs)/foundations/laws/page.tsx`), and the real `src/components/ui/<name>.tsx`.

**Install / sync (do not hand-write):**

```bash
npm run sync:ui -- button input    # copy components from local DS
npm run sync:ui -- --tokens-only   # refresh token CSS
npm run check:tokens               # no hardcoded colours / invent tokens
npm run check:typography           # named DS roles in product composition
npm run check:ui-sync              # primitives + globals must match DS
```

Catalog: DS `public/r/registry.json` (also
https://pucar-design-system-five.vercel.app/r/registry.json). Dristi
`components.json` maps `@pucar` for discovery; **copy via `sync:ui`**.

## Grouped panels in Dristi

Follow DS Laws (“Grouped content gets a border”) and `AGENTS.md`:

- Case facts → synced `Card` + `DescriptionList` (include hearing + court when known).
- Compare paths → `Accordion` inside `Card`; open the first path by default.
- Onboarding modal body uses **`bg-muted` (neutral-2)** as the stage; stroked
  panels stay default **`bg-card` (neutral-1)** so the fill reads against the stage.
  Preferred DS recipe for multi-panel dialogs/wizards going forward; flat pages stay
  neutral-1. Do not use unbordered `bg-muted` as a panel stand-in.
- Nested media wells → `bg-surface-sunken` inside the Card.

Flow-specific notes:
[`apps/dristi-app/src/components/accused-onboarding/DS-FINDINGS.md`](../../apps/dristi-app/src/components/accused-onboarding/DS-FINDINGS.md).

## Agent rails

| Kind | Cursor | Claude |
|---|---|---|
| Always-on gate | `.cursor/rules/pucar-design-system.mdc` | `.claude/rules/pucar-design-system.md` |
| Build UI | `.cursor/skills/pull-ui-from-ds/` | `.claude/skills/pull-ui-from-ds/` |
| Review UI | `.cursor/skills/review-ui-ds/` | `.claude/skills/review-ui-ds/` |

Product meaning: [../product/](../product/).

↑ Docs map: [../README.md](../README.md).
