---
name: design-review
description: >-
  Start a live design-review session on the running Dristi app: turn on the
  point-and-edit overlay (tweak type/color/spacing, edit copy in place, delete
  or duplicate elements, make auto-layout stacks, pin comments), hand the owner
  the link, then implement their pasted report. Also runs the Pencil lane:
  import a running screen into the Pencil desktop app as an editable artboard,
  then diff the owner's Pencil edits, anchor every value to the design system,
  and audit each change before implementing. Use when the user says "start
  review", "start critique", "design review", "design mode", "import to
  pencil", "review my pencil changes", or asks to annotate/tweak the running
  app and have the changes applied.
---

# Design review — point, edit, comment, then Claude implements

The overlay is `apps/dristi-app/public/design-mode.js` (invoke-only review
tooling, zero deps, never bundled); `src/components/design-mode-loader.tsx`
loads it in dev when the URL carries `?design=1`. Full usage:
[docs/design-mode.md](../../../docs/design-mode.md).

## Starting a session

1. **Server**: check `http://127.0.0.1:3000` responds. If not, ask the user to
   run `npm run dev` in their own terminal (never start it yourself — see
   `.claude/rules/dev-server.md`).
2. **Tool present on this branch?** Both `apps/dristi-app/public/design-mode.js`
   and the loader wired in `src/app/layout.tsx` must exist. If the branch
   predates them, restore from `design`:
   `git checkout design -- apps/dristi-app/public/design-mode.js apps/dristi-app/src/components/design-mode-loader.tsx`
   (and wire the loader into layout if missing). If only the loader is missing,
   give the user the console fallback from docs/design-mode.md instead.
3. **Hand over the link**: `http://127.0.0.1:3000/<route>?design=1` — the route
   the user named, else the screen under discussion, else `/advocate`. Tell
   them: annotate (Select to tweak/delete/duplicate/auto-layout, double-click
   to edit copy, Comment to pin notes), then **Copy for Claude** and paste the
   report here. Off = the panel's Close button or `?design=0`.

## Implementing a pasted DESIGN MODE REPORT

The report is owner intent, not literal CSS. Before editing, load
`pull-ui-from-ds` and `ui-craft` (mandatory), and run `npm run check:ds-fresh`.

- **Style edits** (`[font-size] 24px → 18px`, `[padding] …`): map the target
  value to the nearest DS type role / spacing-ladder step / token — never copy
  raw pixel values or hex into the code. If the mapped value differs from the
  asked one, say so when reporting.
- **`{ds:<slot>}` tags — the design-system guardrail.** An entry tagged with a
  data-slot targets a synced DS primitive. NEVER restyle the primitive locally
  or hand-edit it: either an existing variant/size already expresses the ask
  (use it), or this is an upstream design-system change — record it as a DS
  proposal (token, measured value, where it shows), put it to the owner, and
  only change the DS via its own repo + `ds:bump` flow. Local screen overrides
  of primitive internals are the defect this tag exists to stop.
- **One instance edited = the owning layer changes.** An edit on one card,
  row, or name is a request against whatever owns it — the shared component,
  the content file, or the seed data — so the change lands once at the source
  and every instance updates. Never fork a single instance to match the
  report; find the owner (component prop/class, `content.ts` copy, fixture
  data) and change it there.
- **`[text]` edits**: new copy, verbatim — but bilingual: update both `en` and
  `ml` in the content file, flagging drafted Malayalam for review.
- **`[delete]`**: the element did not earn its place — remove it from the
  composition (not `display:none`), and take dependent logic/copy with it.
- **`[duplicate]`**: the owner wants another of these in the stack — usually a
  data question (one more item, one more action), not a copy-paste of JSX.
  Read what the element renders and extend the source accordingly.
- **Auto-layout edits** (`[display] flex`, `[flex-direction]`, `[gap]`,
  `[align-items]`): restructure with the codebase's layout idioms (flex + gap
  on the ladder), not inline styles.
- **Comments**: feedback to adjudicate with staff-designer judgment (the eight
  passes apply). If a comment conflicts with a DS law, do what the law allows
  and flag the tension rather than silently ignoring the note.
- **Box comments** (`[box W×H at x,y] region near …`): the note is about a
  region, not one element — read the area's composition, not just the selector
  hint. **Reference images** (`dm-ref-N.jpg`) were auto-downloaded on the
  user's machine when they copied the report; if the paste mentions one that
  is not attached, ask for it before acting on that comment — it is the visual
  spec for that note.
- The selector in each entry locates the element; the quoted label confirms
  you have the right one. Selectors are brittle across edits — resolve them
  against source components, don't grep for the selector string.

After implementing: gates (`check:tokens`, `check:typography`, `check:ui-sync`,
`check:spacing`),
`npm test`, verify on the live render, and summarise what was applied
as-asked, what was translated (and to which token), and what was declined and
why. Offer another round.

## The Pencil lane — heavier edits in a real design tool

The overlay above is the light lane (comments, copy, quick tweaks). When the
owner wants to redesign — move things, restyle broadly, add/remove elements —
import the screen into the Pencil desktop app and audit the edits back.
Everything made in Pencil is a **review artifact, never the design of record**
(the `docs/design/explorations/` rule applies; artifacts live untracked in
`docs/design/explorations/pencil/<route-slug>-<date>/`).

### Import ("import this screen to pencil")

1. Preconditions: dev server responding; the Pencil desktop app is
   **`Pen.app`** — `open -a Pen`. The MCP additionally needs a .pen file OPEN
   in the editor ("A file needs to be open" error otherwise) and cannot create
   one: ask the owner to hit ⌘N in the app (or open an existing artifact),
   ideally saved to the artifact folder. Then, MANDATORY before any other
   pencil call: `get_app_state({include_schema:true, include_canvas_design:
   true, include_scripts_and_shaders:false})` and the relevant
   `get_guidelines`.
2. Extract the rendered screen: open the route in the Browser pane and run
   `/design-export.js` (inject the script, call `window.__dmExtract()`), which
   returns a JSON tree — bounds, flex facts, fills, borders, radius, font
   facts, text, `data-slot`, and a `cssPath` selector per node. Save it as
   `baseline.json` in the artifact folder.
3. Import natively — Pencil's integrated browser does the conversion:
   `browser({action:"load-page", url:"http://127.0.0.1:3000/<route>"})`, then
   `browser({action:"import-to-canvas", target:"query",
   querySelector:"main"})` (import `aside` separately if the rail matters).
   The result names the imported top-level frame id; each node's `context`
   carries the source tag/component. Only fall back to hand-building frames
   from `baseline.json` via `execute` if native import fails.
4. **Create the pair BEFORE handing over — this is the step that makes the
   whole lane work, and skipping it silently destroys the diff.** Duplicate the
   imported frame via `execute` into `BASELINE — <route> — <date>` (reference;
   tell the owner not to touch it) and `EDIT — <route>`, side by side.
   Screenshot the EDIT frame next to the live screen and get the owner's
   fidelity nod. **Never tell the owner to start editing until both frames
   exist and `baseline.json` is saved.** If an import has to be redone (wrong
   width, wrong selector), redo the pair too — deleting the frames leaves the
   owner editing against nothing, and the review degrades to guesswork over
   screenshots. If you find yourself with edits and no baseline, say so plainly,
   import a fresh baseline beside the edited frame, and flag every finding that
   import differences could explain as ambiguous rather than asserting it.
   `baseline.json` (step 2) stays the value ground truth for the diff: Pencil's
   import may normalise values, so BASELINE-vs-EDIT gives *what changed* and
   baseline.json + live computed styles give *from what*.
5. Hand over: the owner edits the EDIT frame only, then says
   "review my pencil changes".

### Review ("review my pencil changes")

1. Read both frames via `execute` Get-visitors; align nodes by selector-name
   (fall back to geometry for renamed nodes; report unmatched as "unmapped",
   never guess). Classify: property change / text change / deleted / added /
   moved.
2. **Anchor every value to the DS** — this is the contract: colors snap to the
   nearest token in `apps/dristi-app/src/app/globals.css` (channel distance),
   spacing/radius/size to the nearest ladder step or type role. Log every
   rounding in the audit line (`13px → 12px · gap-3`). Raw values never enter
   the code.
3. Audit each change with the same rules as the report lane (and ui-craft +
   the nine passes), verdict per item:
   - `healthy-local` — screen-level composition change, DS-legal
   - `use-variant` — an existing DS variant/size already expresses it
   - `upstream-DS` — targets a `[ds:*]` primitive's internals or a token value:
     a proposal for the owner, never a local override
   - `declined` — conflicts with a DS law or craft rule (state which)
4. Post the audit as a NUMBERED list in chat and stop. The owner picks
   ("apply 1, 3, 5"). Implement only the picked items, at the owning layer
   (component / content file / data — one instance edited means the owner layer
   changes once and every instance follows; copy is bilingual). `upstream-DS`
   items go to the feature brief's upstream-feedback section, not into code.
5. Finish exactly like the report lane: `check:ds-fresh` before edits, then
   gates, `npm test`, live-render verification, and the applied / translated /
   declined summary.
