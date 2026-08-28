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

Reference bar: three visible layers (page → panel → well) separated by soft elevation and
fill, one saturated focal card per view, big quiet type, almost no visible strokes.
**White panels on a white page separated only by borders is a wireframe** — the single
most common way a build reads amateur. The cure is a lifted panel, not a grey page. Extended rationale and measurements:
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

0. **Layer the surface before you draw a stroke — the DS way.** The page stays
   `bg-background` (the DS `SidebarInset` default); rails are `bg-sidebar`; panels are
   `Card` **lifted** with `border-hairline shadow-raised` (the owner's demo: card + 5%
   shadow; the DS: `SidebarInset variant="inset"` floats a white sheet with
   `shadow-raised`); wells inside panels are `bg-surface-sunken`. If you cannot tell
   page from panel from well with every border removed, the layering is missing and no
   stroke will fix it. **Do not paint a grey canvas under the whole page** — it reads as
   a dull admin panel and departs from the DS's flat-page model (owner-rejected
   2026-08-17). The one sanctioned exception is a **scoped work canvas**: a long-form
   data-entry column may carry `bg-muted` (neutral-2) so the white cards on it read as
   the focus area, provided the bright chrome around it — top bar and sticky footer —
   stays `bg-card` so the tint reads as the writing surface and not as a grey page (a
   `bg-sidebar` rail already shares neutral-2 and may sit flush with the canvas). Approved for
   the e-filing form 2026-08-26 (`FilingMain`); it is not a licence to tint dashboards,
   landings, or any page that is read rather than filled. Light mode only — in dark,
   `muted` is the `surface-raised` step and sits *above* `card`, so tinting the canvas
   inverts depth; keep `dark:bg-background`. (See §4 for the exact recipe.)

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
| White page, white cards, only `border-border` between them ("wireframe", "flat", "no elevation") | Lift the panels: `Card` + `border-hairline shadow-raised` (`PANEL_CLASS`). The DS shadow does the separating; the page stays white |
| Grey canvas painted under the whole page to "add depth" | Revert to `bg-background`; depth comes from the lifted panel and the `bg-sidebar` rail, not from a tinted page (owner-rejected). Exception: a long-form entry column may take `bg-muted` with the chrome left white — see §1.0 |
| Rail/sidebar on `bg-card` (same white as the content) | Rails are `bg-sidebar` with a `border-hairline` seam — the DS's own rail tone is the second layer |
| A sunken well wrapped around a white sheet that already lifts off the page | Delete the wrapper — wells live *inside* panels only |
| `border-b border-border` under a header/tab row that already changes fill or has an active underline | `border-b border-hairline`, or delete the rule and let spacing + the underline separate |
| Table with `border border-border` outside AND `border-b border-border` on every row | Keep the outer frame `border-border` (structural); rows become `border-b border-hairline` or `divide-y divide-hairline`; header row separated by `bg-surface-sunken`, not a second stroke |
| Panel/rail with `border-l border-border` sitting on `bg-sidebar` / `bg-muted` | The fill change already separates it — drop to `border-hairline` or remove |
| `bg-surface-sunken` well *plus* `border border-border` | Pick one: sunken fill with no border (the box-in-box ban — depth is fill, not borders) |
| `shadow-raised` box nested inside another `shadow-raised` card | Inner box becomes a flat fill (`bg-card` on a tinted parent, `bg-surface-sunken` on a white one); shadow only on the outermost lifted surface |
| Notice that reports a status rendered as a plain white panel (variant thrown away, only the icon tinted) | The DS `Alert` variant for that status — opaque `*-muted` fill with its own `*-muted-foreground` pair for title, body and icon (never grey `text-muted-foreground` on the tint), plus the words. Icon + words + tint is not colour *alone*; the tint is the sanctioned third treatment |
| Every notice on a screen tinted, or a status tint on copy that only explains how to fill the control beside it | Tint what reports a status — a failure, a success, a legal risk, machine-read data. Guidance stays the neutral `Alert` default. Count the tints at rest: three stacked on one screen means too many notices, not too much colour |
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
| `text-title-s` | 20/28 | Section headings above a group of cards; sheet titles | 600 | foreground | — |
| `text-body` | 16/24 | Citizen-facing copy default; **card/panel titles at 600** (the Card master's own `text-base`) | 400; 500 for field labels; 600 for card titles | foreground; muted for support | — |
| `text-body-compact` | 14/20 | Dense staff tables/rows — opt-in only | 400; 500–600 for the row's ONE emphasized cell | foreground / muted | never citizen default |
| `text-caption` | 12/16 | Metadata, timestamps, eyebrows | 500 (weight floor); 600 only for eyebrow section labels | muted; status via `*-ink` | never tracked tighter |
| `font-mono` | at body-compact/caption | CNRs, codes | 400–500 | muted unless focal | `tabular-nums` implicit-check |

**Scale discipline (measured 2026-08-17):** the shipped stack (`"Helvetica Neue"`) has no
600 face on macOS, so every `font-semibold` renders as **Bold**; on Windows it falls to
Arial (400/700). Big semibold headings therefore read heavier than the Figma/Inter
intent. Until the DS retunes the stack (see `docs/design/ds-diagnosis.md`), keep form
screens at the demo's scale — page title `text-title` (24), card titles `text-body`
600 (16), labels 14/500 — and do **not** step titles up to compensate for weak
hierarchy; fix hierarchy with colour and spacing.

Numbers: `tabular-nums` on anything columnar or compared (item numbers, dates, counts,
amounts). Currency and counts right-align in tables. One `font-semibold` number per
card is emphasis; five is noise.

## 4. Surface & depth spec

Four layers, in order — this is the model, not a menu (it is the DS's own model, seen in
`SidebarInset`, and the owner's demo):

1. **Page** — `bg-background`, always. Not a tinted canvas.
2. **Chrome** — header and sticky footers `bg-card`; sidebar/rails `bg-sidebar` (the DS
   rail tone, one step off white); docked side panels `bg-card`. Seams `border-hairline`
   or none. Chrome never carries `border-border`.
3. **Panel** — `Card` lifted: `bg-card border-hairline shadow-raised` (the Dristi
   `PANEL_CLASS` recipe in `components/filing/form-card.tsx`) — the DS dual-layer
   shadow defines the panel; the hairline is a soft edge, not a stroke. Flat
   `border-border` Cards belong to *inside* a muted dialog stage (the Laws' recipe), not
   to product pages.
4. **Well** — `bg-surface-sunken`, borderless, `rounded-md`/`rounded-lg` insets *inside a
   panel* (media wells, filled document rows, info wells, number chips, collapsed
   strips, search pills). A well needs a white panel between it and the page.

Shadows by role only: `shadow-raised` = panels and genuinely lifted small boxes (never
nested); `shadow-overlay` = popovers/menus/tooltips; `shadow-modal` = dialogs/sheets. A
hovered card may deepen via `transition-shadow`.

Border policy per surface: chrome seams → `border-hairline` or none; panel →
`border-hairline` (+ `shadow-raised`); control edge → `border-input`; wells →
borderless; structural table frames → the panel edge itself, rows `border-hairline`;
focus → `ring` tokens, never a darkened border.

Radius nesting: containers `rounded-xl` (14), large/hero surfaces `rounded-2xl`–`3xl`
(18/22), controls `rounded-lg` (10), insets `rounded-md`/`sm` (8/6), chips
`rounded-full`. Nested corner = outer radius − gap, rounded down the ladder; a
`rounded-lg` chip inside a `rounded-3xl` p-6 card is over-round — use `rounded-md`.

## 5. Pre-flight micro-detail checklist

Run before declaring any screen done (after the token gates):

- [ ] Layering check: squint at the render — page, rail, panels and wells are each a
      distinct value *with the strokes ignored*; page `bg-background`, rail
      `bg-sidebar`, panels carry `PANEL_CLASS`, wells sunken and inside panels only
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
  `card` — invisible as a stage. Product pages therefore lift panels with shadow instead
  of tinting the page. Proposal: decide whether `muted` should read as a stage at all.
- **Raised Card.** Product panels want `border-hairline shadow-raised`; today that is a
  per-use className (`PANEL_CLASS`). Proposal: `Card variant="raised"`.
- **Neutral temperature.** The ramp is cool; the owner's demo used warm neutrals (OKLCH
  hue ≈ 83) and read warmer/less sterile. See `docs/design/ds-diagnosis.md`.
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
