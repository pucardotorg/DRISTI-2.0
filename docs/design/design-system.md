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
npm run check:rails                # Claude and Cursor agent rails must not drift
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
| Propose UI | `.cursor/skills/propose-ui-brief/` | `.claude/skills/propose-ui-brief/` |
| Build UI | `.cursor/skills/pull-ui-from-ds/` | `.claude/skills/pull-ui-from-ds/` |
| Review UI | `.cursor/skills/review-ui-ds/` | `.claude/skills/review-ui-ds/` |

**Design roles.** Three principal-level roles, mirrored across both tools. Claude Code
runs them as subagents (own context window, tool grants enforced); Cursor runs them as
manually-invoked role rules.

| Role | Job | Claude | Cursor |
|---|---|---|---|
| **UX Designer** | Decides a screen's job, layout, hierarchy, spacing, and DS components **before** code; writes briefs to [design/proposals/](proposals/) | `.claude/agents/ux-designer.md` | `.cursor/rules/role-ux-designer.mdc` |
| **UI Designer** | Builds — syncs primitives, composes screens, implements a brief or a fix list | `.claude/agents/ui-designer.md` | `.cursor/rules/role-ui-designer.mdc` |
| **UI Reviewer** | Audits built UI against the DS gate, Laws, accessibility, and copy — reports, never fixes | `.claude/agents/ui-reviewer.md` | `.cursor/rules/role-ui-reviewer.mdc` |

All three pin `model: opus` on the Claude side. Each carries explicit judgment rules —
restraint over addition, cite-the-rule-or-own-the-taste, severity calibration, escalate
rather than improvise — not just procedure.

Each role wraps the skill for its stage — **the skill is the workflow, the role is the
judgment.** Roles and skills are mirrored across both tools; `npm run check:rails` fails
if the two copies drift, and also fails if `ui-reviewer` is ever granted `Edit`/`Write`.

**Enforcement differs by tool.** Claude Code withholds `Edit`/`Write` from `ui-reviewer`,
so it *cannot* fix what it audits, and scopes `ux-designer`'s `Write` to
`docs/design/proposals/`. Cursor has no equivalent, so there those boundaries are stated
discipline — noted at the top of each role rule.

Intended loop: UX Designer proposes → UI Designer builds → UI Reviewer audits → UI
Designer fixes. Invoke each by name; there's no auto-pipeline.

Product meaning: [../product/](../product/).

↑ Docs map: [../README.md](../README.md).
