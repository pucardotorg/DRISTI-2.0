# Pucar design system (mandatory gate)

Dristi does **not** own UI rules. Before writing or changing any UI
(`apps/dristi-app/**`, `*.tsx`, `*.css`, components, tokens, layouts):

## 1. Locate the DS repo — and confirm it is current

1. `vendor/pucar-design-system` inside this repo (created by `npm install`)
2. `PUCAR_DS_ROOT` env only if the user explicitly set it

If `vendor/pucar-design-system` is missing, tell the user to run `npm install` from the
Dristi repo root. Do not invent paths and do not search the disk.

**Authoritative remote only:** `neer-ideasbeforenoon/pucar-design-system`.
Before using a candidate, verify:

```bash
git -C "$DS" remote get-url origin
# must contain: neer-ideasbeforenoon/pucar-design-system
```

Or the folder must contain `.pucar-ds-id` with that exact org/repo string.

If none resolve or the remote does not match: **stop**. Ask the user to run
`npm install` (or `npm run setup:ds`). Do not invent UI.

**Never** search Desktop, home, or other paths for folders named
`pucar-design-system`. Wrong-org forks (e.g. `pucardotorg/...`) are invalid even
when the folder name matches. Scripts enforce this via
`apps/dristi-app/scripts/resolve-ds.mjs` — agents must follow the same rule.

**Then check you are on the pinned version — every time, before reading a DS file:**

```bash
npm run check:ds-fresh
```

`ds.lock.json` at the repo root records the one DS commit this repo builds against.
`npm install` checks it out; this gate fails if what you have is anything else. It
needs no network — the pin is a fact in the repo, not a question about timing.

The other gates cannot catch this. `check:ui-sync` diffs our primitives against
whatever sits in `vendor/`, so the *wrong version* passes green. That is how four
branches ended up on three different design systems with nothing complaining.

If it fails: `npm install`, then `npm run check:ui-sync` and sync whatever it reports
as drifting.

**Never edit `ds.lock.json` by hand, and never bump it on a feature branch.** Moving
the whole repo to a newer DS is `npm run ds:bump`, run on main, committed and
reviewed like any other change — it changes how every screen looks. Adopting a DS
change mid-feature without the team is the thing the pin exists to stop.

`npm run check:ds-fresh -- --upstream` reports whether a newer DS exists. That is
information for whoever owns the bump, never a failure: being deliberately behind is
the point of a pin.

Read `{DS}/CHANGELOG.md` for any range you adopt — a token whose *meaning* changed
(`track` narrowing to marks-only, say) breaks no gate and shows up in no file diff,
so the changelog is the only place it surfaces.

Testing an unreleased DS change is the one sanctioned exception: point `PUCAR_DS_ROOT`
at a local DS checkout. The gate then says **OFF PIN** loudly and passes. Nothing built
that way gets committed.

## 2. Read exact DS files (do not paraphrase)

- `{DS}/AGENTS.md`, `{DS}/ACCESSIBILITY.md`, `{DS}/RESPONSIVE.md` as needed
- `{DS}/src/app/(docs)/foundations/laws/page.tsx` when composing screens
- `{DS}/src/app/(docs)/foundations/typography/page.tsx` for text roles
- `{DS}/src/app/(docs)/foundations/spacing/page.tsx` for the spacing ladder
- Relevant `{DS}/src/components/ui/<name>.tsx`

Spacing ladder (Tailwind default, no custom tokens): `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.
Micro steps inside controls only. No `p-5` / `gap-10` / arbitrary px. Controls `h-10` +
`rounded-lg`; containers `p-6` + `rounded-xl`.

## 3. Sync — never hand-write primitives

```bash
npm run check:ds-fresh             # first — am I on the pinned DS?
npm run sync:ui -- <component>     # copy from local DS
npm run sync:ui -- --tokens-only   # refresh globals.css
npm run check:tokens && npm run check:typography && npm run check:ui-sync
```

Screens/flows only in `apps/dristi-app`. DS wins over invent-visual preferences.
`@pucar` in `components.json` is for catalog discovery; install via `sync:ui`.
Use named DS type roles in screen composition: citizen copy is `text-body`;
titles are `text-title-* font-semibold`. Primitive-internal `text-sm` is not a
screen-copy pattern.

## 3a. Craft — mandatory on every UI change, every iteration

The gates above prove legality; they say nothing about whether the screen reads as a
product or a wireframe. So on **every** UI build, change, or polish pass — first
iteration and every one after it, on every branch — load the `ui-craft` skill
(`.claude/skills/ui-craft/SKILL.md` / `.cursor/skills/ui-craft/SKILL.md`) alongside
`pull-ui-from-ds`, apply its layering model (canvas → chrome → panel → well) and run its
pre-flight checklist on the **render** before reporting done. If the skill file is
missing on the branch you are on, restore it from `main` before touching UI (do not build
without it). Subagents that build UI must be handed the skill explicitly.

## 4. Review

After UI changes, use skill `review-ui-ds` (Cursor + Claude).

## 5. Role rules

For a screen that needs planning, building, and auditing as separate passes, invoke the
role rules in this folder: `role-ux-designer.mdc` (proposes, writes briefs to
`docs/design/proposals/`) → `role-ui-designer.mdc` (builds) → `role-ui-reviewer.mdc`
(audits, report-only). They mirror `.claude/agents/` and run **inside** this gate, never
instead of it.

If you edit a role rule or a skill here, run `npm run check:rails` — it fails on drift
between the Cursor and Claude copies.

Product meaning: [docs/product/](docs/product/).
Human contract: [docs/design/design-system.md](docs/design/design-system.md).
