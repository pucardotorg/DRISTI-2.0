---
name: ui-craft
description: >-
  Taste rules for premium-feeling Dristi UI — layering/elevation (canvas →
  chrome → panel → well), strokes/borders, typography, hierarchy, and
  micro-details inside cards. MANDATORY on every UI build, change, or polish
  in apps/dristi-app, alongside pull-ui-from-ds — composing screens, visual
  polish, "looks cheap/amateur/wireframe/flat" feedback, no elevation, borders
  too dark, type tuning, shadows, or card cleanup. Governs how DS tokens are
  used with judgment; it never overrides a DS law or invents a token.
---

# UI craft — what separates premium from wireframe

The token gates prove the mechanical rules hold. This skill governs the part no gate
can catch: whether the screen was composed with judgment or blindly executed. It runs
**inside** the DS gate (`pull-ui-from-ds`), never instead of it. Where a DS Law and
this skill seem to disagree, the Law wins — and if the Law itself is what makes the
screen feel cheap, that is upstream feedback (§6), not a local hack.

Reference bar: three visible layers (canvas → panel → well) separated by background
value and soft elevation, one saturated focal card per view, big quiet type, almost no
visible strokes. **White panels on a white page separated only by borders is a
wireframe** — the single most common way a build reads amateur. Extended rationale and measurements:
`references/research.md` in this skill's folder.

## 0. The reference is the spec

When a design reference exists (a mockup, Claude Design export, or Figma file), it is
the **spec** for structure, placement, action scope, and interaction — not
inspiration. The owner already made those decisions; re-deriving them is how builds
drift cheap. Rules:

- **Placement encodes scope.** An action's position in the reference tells you what it
  operates on: page/court-level actions live in page chrome (toolbars), item-level
  actions live on the item. Verify scope from the reference and `docs/product/` before
  relocating anything — moving a court-wide action into one hearing's card changes its
  meaning, not just its looks.
- **Deviate only on collision** with a DS Law or accessibility rule — and make the
  *minimal* deviation that resolves it. Hover-only actions (unreachable by keyboard)
  become hover **+ focus-within** reveal with an always-visible touch fallback — not
  "always visible for everyone", which trades an a11y bug for permanent clutter.
- **Structural inventions are deviations too.** Replacing a push-panel with an
  overlay, letting a persistent rail vanish, dropping a stack/peek affordance — these
  change the interaction model the reference specified. If a bug forces a structural
  change, fix the bug within the reference's model first (make the push responsive)
  before abandoning the model.
- **Log every deviation** — what, why (which Law/a11y rule), and the minimal form
  chosen — in the build report for owner sign-off. An unlogged deviation is a defect.

## 1. The six non-negotiables

0. **Layer the surface before you draw a stroke.** Every product screen with panels
   (forms, wizards, dashboards, review, sign) sits on a **canvas** of
   `bg-surface-sunken`; chrome (header, rails, footers, docked panels) and panels are
   `bg-card` and lift off it; wells inside panels are `bg-surface-sunken` again. If you
   cannot tell canvas from panel from well with every border removed, the layering is
   missing and no stroke will fix it. Only reading/text pages stay on a flat
   `bg-background`. (See §4 for the exact recipe.)

1. **Borders are the last resort for separation.** To separate two regions try, in
   order: spacing → background shift (`bg-surface-sunken`, `bg-muted` stage per the
   Laws) → `shadow-raised` (only where the pattern genuinely lifts) → `border-hairline`
   → full `border-border`. Full-strength `border-border` is measured at 1.86:1 against
   the card — it is the darkest non-text mark on any screen, so it is reserved for
   exactly two roles: the edge that *defines a Card panel* (the "grouped content gets a
   border" Law) and structural table/list frames. Control edges use `border-input`.
   Everything else — internal dividers, row separators, chrome seams that already sit
   on a different fill — uses `border-hairline` / `divide-hairline` or nothing.
   Never border + shadow at full strength on the same box.

2. **One focal point per view; everything else visibly recedes.** One saturated
   surface (e.g. the "now" card on `bg-brand-muted`), one `bg-primary` action
   (Ration-teal Law). Emphasis is bought by de-emphasizing neighbors — quieter fills,
   `text-muted-foreground`, ghost buttons — not by adding weight, color, or chrome to
   the thing you want seen.

3. **Two text weights per component, maximum.** A card, row, or chip touches at most
   two of 400/500/600. If everything inside a card is `font-semibold`, nothing is.
   Prefer color (foreground vs `muted-foreground`) over a third weight for the next
   hierarchy step.

4. **Semantic color is a scarce resource.** Count colored marks per view before
   shipping: at most ~3 destructive elements visible at rest, one status chip per
   card/row, status icons only where status is the message. A red badge on every
   overdue row plus red dots on two nav icons is alarm fatigue — pick the one place
   urgency lives and let text carry the rest. On tinted fills, text uses that fill's
   own `-muted-foreground`/ink pair — never grey `text-muted-foreground` on a colored
   background.

5. **Type tightens as it grows.** `tracking-tight` belongs on `text-display` and
   `text-display-s` (the DS specimens) and is permitted at `text-title-l`/`text-title`
   when a large heading reads loose; never track below 20px, never letterspace
   negatively in body or caption. `tabular-nums` on every number that sits in a
   column, pair, count, date, time, or currency. Hierarchy comes from weight + color
   at a fixed size before it comes from a bigger size.

## 2. Cheap-tell → premium move

Every prescription is gate-legal (verified against `check:tokens` /
`check:typography`). Opacity modifiers on tokens (`border-border/50`) also pass the
gate mechanically — do **not** use them: the DS names the faint stroke role
(`hairline`), and the Laws reserve ad-hoc alpha for interaction layers. Use the token
the role names.

| Cheap tell | Premium move |
| --- | --- |
| White page, white cards, only `border-border` between them ("wireframe", "flat", "no elevation") | Put the screen on the canvas: `bg-surface-sunken` on the area root; chrome and Cards stay `bg-card`. The fill difference does the separating |
| Card on the canvas still wearing `border-border` | Panel recipe: `border-hairline shadow-raised` (soft edge + soft lift). Full-strength stroke only on a flat white page where the Law needs it |
| Rail/sidebar on `bg-sidebar`/`bg-muted` next to a muted canvas | Rails are chrome — `bg-card` with a `border-hairline` seam, so canvas and rail read as different layers |
| A sunken well wrapped around a white sheet that already sits on the canvas | Delete the wrapper — canvas is the backdrop; wells live *inside* panels only |
| `border-b border-border` under a header/tab row that already changes fill or has an active underline | `border-b border-hairline`, or delete the rule and let spacing + the underline separate |
| Table with `border border-border` outside AND `border-b border-border` on every row | Keep the outer frame `border-border` (structural); rows become `border-b border-hairline` or `divide-y divide-hairline`; header row separated by `bg-surface-sunken`, not a second stroke |
| Panel/rail with `border-l border-border` sitting on `bg-sidebar` / `bg-muted` | The fill change already separates it — drop to `border-hairline` or remove |
| `bg-surface-sunken` well *plus* `border border-border` | Pick one: sunken fill with no border (the box-in-box ban — depth is fill, not borders) |
| `shadow-raised` box nested inside another `shadow-raised` card | Inner box becomes a flat fill (`bg-card` on a tinted parent, `bg-surface-sunken` on a white one); shadow only on the outermost lifted surface |
| Card where title, number, badge, and metadata are all `font-semibold` | Title keeps 600; numbers drop to 500 + `tabular-nums`; metadata to 400 `text-muted-foreground` — two weights per component |
| 3–4 chips/badges on one card row (status + ownership + count + avatar) | One chip carries the status; ownership becomes the avatar itself or plain caption text; counts become text |
| `Badge variant="destructive"` on every overdue row in a list | Rows state the fact in `text-destructive-ink` caption text; at most the single most-urgent item (or a rail header count) keeps the badge |
| Two labeled buttons (`outline` + `ghost` with icon+label) on every repeated row | One `outline` action per row; the secondary becomes an icon-only ghost or moves to the row's detail view |
| Label-prefixed data ("item 4", "CNR: KL…") styled as loudly as the data | De-emphasize or drop the label: data at 500–600, label at caption `text-muted-foreground` — or let format identify it (a CNR is self-evident in `font-mono`) |
| Same radius on a chip inside a padded card (bulging inner corners) | Inner radius = outer − padding, rounded **down** to the DS ladder (4/6/8/10/14/18/22/26); inner is always at least one step smaller |
| `text-muted-foreground` copy sitting on `bg-brand-muted` / status tints | That fill's own pair: `text-brand-muted-foreground`, `text-warning-ink`, etc. |
| Instant hover jumps, or `transition-all` | `transition-colors` / `transition-shadow` at default (150ms) duration — transition only what changes |
| Icons at full `text-foreground` next to muted copy | Icon inherits the text color of its line; icons are muted unless the icon *is* the signal |
| Active tab underline floating above a separate band rule (two parallel lines) | The underline sits ON the band's rule: container `border-b border-hairline`, trigger `-mb-px border-b-2` so the lines coincide — never two offset horizontal lines |
| Sibling elements presenting the same data type differently (one tab count as an amber badge, the others plain text) | One presentation per data type across siblings — e.g. all tab counts as plain muted `tabular-nums` text. Vary presentation only when the *semantics* differ, and then consistently |
| Selection styled as ring + border + fill at once ("too loud") | Loudness ladder — focus: `ring` only; transient highlight: brief fill that fades; selection: ONE quiet persistent cue (fill tint *or* inset bar, never stacked). Brand fill means "current / now / today / live" — never "selected". A clicked task needs a focus ring, not a selection costume |
| Repeated row showing badge + due date + two buttons + avatar all at rest | At rest: content + ONE status cue. Actions reveal on hover **and** focus-within (touch: always visible) and *replace* the status cue in its slot rather than stacking beside it |
| A toggleable panel/rail that fully disappears when closed | Persistent surfaces collapse to a slim strip and expand **in place** — spatial stability; chrome never vanishes from the layout |

## 3. Typography spec (per DS role)

Weights: pick at most two per component. Muted = `text-muted-foreground` (5.79:1 —
never invent a lighter grey). All headings require `font-semibold` (gate-enforced).

| Role | Size | Use | Weight | Color layer | Extras |
| --- | --- | --- | --- | --- | --- |
| `text-display` | 48/56 | Marketing/empty-shell hero only | 600 | foreground | `tracking-tight` |
| `text-display-s` | 40/48 | Rare page hero | 600 | foreground | `tracking-tight` |
| `text-title-l` | 32/40 | The page title (one per screen) | 600 | foreground | `tracking-tight` allowed |
| `text-title` | 24/32 | Focal card / section hero title | 600 | foreground | `tracking-tight` allowed |
| `text-title-s` | 20/28 | Panel & sheet titles | 600 | foreground | — |
| `text-body` | 16/24 | Citizen-facing copy default | 400; 500 for field labels | foreground; muted for support | — |
| `text-body-compact` | 14/20 | Dense staff tables/rows — opt-in only | 400; 500–600 for the row's ONE emphasized cell | foreground / muted | never citizen default |
| `text-caption` | 12/16 | Metadata, timestamps, eyebrows | 500 (weight floor); 600 only for eyebrow section labels | muted; status via `*-ink` | never tracked tighter |
| `font-mono` | at body-compact/caption | CNRs, codes | 400–500 | muted unless focal | `tabular-nums` implicit-check |

Numbers: `tabular-nums` on anything columnar or compared (item numbers, dates, counts,
amounts). Currency and counts right-align in tables. One `font-semibold` number per
card is emphasis; five is noise.

## 4. Surface & depth spec

Four layers, in order — this is the model, not a menu:

1. **Canvas** — the screen's ground for any product surface with panels: forms,
   wizards, dashboards, review, sign, tables-in-cards. `bg-surface-sunken` on the area
   root (layout), so chrome and panels have something to lift off. Reading/text-only
   pages stay on `bg-background`. (The Laws name `bg-muted` as the stage; measured at
   1.03:1 against card it is imperceptible on most displays, so use `surface-sunken`
   — the DS's tuned 2.5-step — and see §6.)
2. **Chrome** — header, sidebar/rails, sticky footers, docked side panels: `bg-card`,
   seams `border-hairline` (or none). Chrome frames the canvas; it never sits on the
   same fill as the canvas.
3. **Panel** — `Card` on the canvas: `bg-card border-hairline shadow-raised` (the
   Dristi `PANEL_CLASS` recipe) — the fill and the soft dual-layer shadow define the
   panel, so no full-strength stroke. On a *flat white page* the Law's default
   `border-border` Card is what defines it — there, keep the border and skip the shadow.
   Never both at full strength.
4. **Well** — `bg-surface-sunken`, borderless, `rounded-md`/`rounded-lg` insets
   *inside a panel* (media wells, filled document rows, info wells, number chips,
   collapsed strips, search pills). A well needs a white panel between it and the
   canvas, or it disappears.

Shadows by role only: `shadow-raised` = panels on the canvas and genuinely lifted small
boxes (never nested); `shadow-overlay` = popovers/menus/tooltips; `shadow-modal` =
dialogs/sheets. A hovered card may deepen via `transition-shadow`.

Border policy per surface: chrome seams → `border-hairline` or none; panel on canvas →
`border-hairline` (+ `shadow-raised`); panel on flat page → `border-border`; control
edge → `border-input`; wells → borderless; structural table frames → `border-border`,
rows `border-hairline`; focus → `ring` tokens, never a darkened border.

Radius nesting: containers `rounded-xl` (14), large/hero surfaces `rounded-2xl`–`3xl`
(18/22), controls `rounded-lg` (10), insets `rounded-md`/`sm` (8/6), chips
`rounded-full`. Nested corner = outer radius − gap, rounded down the ladder; a
`rounded-lg` chip inside a `rounded-3xl` p-6 card is over-round — use `rounded-md`.

## 5. Pre-flight micro-detail checklist

Run before declaring any screen done (after the token gates):

- [ ] Layering check: squint at the render — canvas, chrome, panels and wells are each
      a distinct value *with the strokes ignored*; the area root is `bg-surface-sunken`,
      chrome and panels `bg-card`, panels carry `PANEL_CLASS`
- [ ] Stroke audit: list every `border-*` on the screen; each is justified as panel
      edge, control edge, or structural frame — the rest are hairline or gone
- [ ] No box shows border + shadow at full strength; no shadow inside a shadow
- [ ] One focal surface, one `bg-primary` action per view; competitors visibly recede
- [ ] ≤ 2 font weights inside each card/row; ≤ 1 status chip per card; ≤ ~3
      destructive marks per view at rest
- [ ] Every columnar/compared number has `tabular-nums`; table numerics align
- [ ] Tinted fills use their own foreground pair, never grey-on-color
- [ ] Repeated rows: one visible bordered action max, others ghost/icon-only
- [ ] Radius nesting: no inner corner ≥ its container's corner
- [ ] Icons inherit line color and optical size (~1em); decorative icons are muted
- [ ] Hover/active transitions are `transition-colors`/`-shadow`, ~150ms, perceptible
      in both themes; focus rings survive on tinted surfaces
- [ ] Empty states invite the next action (per DS Empty), not a bordered grey void
- [ ] Adjacent horizontal rules coincide (active-tab underline sits on the band rule;
      no doubled or offset lines anywhere)
- [ ] Repeated siblings present the same data type identically (counts, dates, chips)
- [ ] Focus/highlight/selection follow the loudness ladder; brand fill appears only on
      "current/now/today/live" semantics
- [ ] Hover-revealed clusters also reveal on focus-within and are always visible on
      touch (`pointer-coarse`/`hover:none`)
- [ ] Every deviation from the design reference is logged with the Law/a11y rule that
      forced it (§0)
- [ ] The Chanel pass: remove one decoration — if nothing can be removed, look again
- [ ] Judge on render, not source: open both themes at desktop and ~375px

## 6. Escalation — token values are upstream, not yours

Open upstream items (restate them in build reports until the DS resolves them):

- **Stage token.** The Laws' `bg-muted` stage (neutral-2, `#f9f9fb`) is 1.03:1 against
  `card` — invisible. Dristi uses `surface-sunken` (`#f4f4f7`) as the canvas. Proposal:
  a `--canvas` token (or retune `--muted`) at the 2.5-step value.
- **Raised Card.** Panels on a canvas want `border-hairline shadow-raised`; today that is
  a per-use className (`PANEL_CLASS`). Proposal: `Card variant="raised"`.
- **`--border` at neutral-8** (1.86:1) is the loudest non-text mark on any flat page.

When a cheapness issue traces to a token's *value* — `--border` sitting at neutral-8
(1.86:1) when the sidebar seam already uses neutral-6, a shadow too harsh, a weight
floor, a specimen missing tracking — do **not** hack around it locally (no opacity
modifiers, no shadowing variables, no per-screen overrides). Use the tokens as they
are, and record the issue as **"Upstream DS feedback"** in your build report: token,
measured value, where it shows, and the premium alternative. The owner controls
`neer-ideasbeforenoon/pucar-design-system` and retunes values there; one knob change
then fixes every screen at once. This skill governs how tokens are used with taste —
it never invents, forks, or locally adjusts one.
