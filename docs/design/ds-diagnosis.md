# Why the built UI reads "dull, sterile, wireframe" — a measured diagnosis

Scope: the e-filing screens on `feature/e-flling-v1` (`apps/dristi-app/src/components/filing/**`)
built on the DS tokens in `apps/dristi-app/src/app/globals.css` (Radix Slate + teal), compared
with the owner's demo (`scratchpad/demo`, warm OKLCH neutrals + `system-ui`). Everything below is
measured — computed styles read from the running app at 1440×900 light, and colour math from a
small script (OKLCH conversion + WCAG contrast; script and full output live in the session
scratchpad as `measure.mjs` / `measure-out.md`). Reference-system values are quoted from memory
and flagged as such in the last section.

## Summary — the verdict

- **The whites and greys are part of it, but they are the third cause, not the first.** Radix Slate
  is measurably cool *and* comparatively chromatic (mid-ramp mean **C 0.010, h ≈ 282°** — blue-violet;
  the muted text `#60646c` sits at h 264°, the ink `#1c2024` at h 248°). The demo's neutrals are
  **h 68–91° at C 0.002–0.006** — warmer *and* half the chroma. Swap only the ramp and the app will
  read less clinical; it will still read as a wireframe.
- **First cause: there is no surface architecture in the build.** Page, header, footer, docked
  panel and every card compute to the same `#fcfcfd`; the rail is `#f9f9fb` (**1.03:1**, invisible).
  Panels are defined by a 10 %-alpha hairline (**1.22:1**) plus a 4 %/7 % black shadow that has no
  darker ground to lift off. The build's own `ui-craft` skill mandates a `bg-surface-sunken` canvas;
  the layout ships `bg-background`.
- **Second cause: the type stack.** `"Helvetica Neue"` on macOS has no 600 face, so every
  `font-semibold` heading renders as **Helvetica Neue Bold** (measured: 600 and 700 produce identical
  glyph widths, 338.84 px; `system-ui`/SF Pro gives 325.96 vs 333.85). Combined with a step-title
  scale of 32/20 px against the demo's 24/16 px, headings are ~25–33 % larger and one weight heavier
  than the design intent (Figma is Inter 600). On Windows the stack falls to Arial.
- **The strokes are inverted.** The loudest non-text marks on a form screen are the field edges
  (`--input` = neutral-9, **3.22:1**, ~10 per viewport), the segmented/progress `track` (neutral-6,
  **1.37:1**) and the `secondary` slab (**1.19:1**); the panel edges that should carry structure sit
  at 1.22:1. The demo has field borders at **1.25:1** and a segmented well at 1.08:1 — a deliberate
  policy difference (DS enforces WCAG 1.4.11 at 3:1 on control edges), not an accident.
- **Status treatment amplifies "template".** The pre-fill notice is a saturated info block
  (`#e6f4fe` fill, *all* text in `#0c6ec3` ink); the demo's is a white box with a faint blue border
  and grey body copy.

## Measurements

### 1. DS light neutrals — OKLCH and contrast against `card` (`#fcfcfd`)

| step | hex | L | C | h° | vs card | role |
|---|---|---|---|---|---|---|
| neutral-1 | `#fcfcfd` | 0.991 | 0.0013 | 286 | 1.00 | background · card · popover · surface |
| neutral-2 | `#f9f9fb` | 0.983 | 0.0026 | 286 | **1.03** | muted · surface-raised · sidebar |
| surface-sunken | `#f4f4f7` | 0.968 | 0.0040 | 286 | 1.07 | tuned 2.5-step well |
| neutral-3 | `#f0f0f3` | 0.956 | 0.0040 | 286 | 1.11 | — (unused) |
| neutral-4 | `#e8e8ec` | 0.932 | 0.0054 | 286 | 1.19 | secondary · accent |
| neutral-5 | `#e0e1e6` | 0.910 | 0.0068 | 277 | 1.27 | accent-strong |
| neutral-6 | `#d9d9e0` | 0.887 | 0.0095 | 286 | **1.37** | track · sidebar-border |
| neutral-7 | `#cdced6` | 0.853 | 0.0111 | 280 | 1.53 | — |
| neutral-8 | `#b9bbc6` | 0.794 | 0.0156 | 278 | **1.86** | border |
| neutral-9 | `#8b8d98` | 0.645 | 0.0165 | 278 | **3.22** | input |
| neutral-11 | `#60646c` | 0.502 | 0.0136 | 264 | 5.79 | muted-foreground |
| neutral-12 | `#1c2024` | 0.241 | 0.0097 | 248 | 15.98 | foreground |
| hairline (n12 @ 10 %) | ≈`#e6e6e7` | 0.925 | — | — | 1.22 | border-hairline |

Adjacent-surface steps in the light ladder: card→muted **ΔL 0.009 (1.03:1)**, muted→sunken 0.015
(1.04:1), sunken→n3 0.012 (1.04:1), n3→n4 0.024, n4→n5 0.022, n5→n6 0.023. The first three steps
are below the threshold most displays render as separate layers; iOS grouped (`#f2f2f7` on white,
1.12:1), Material 3 (`surface`→`surface-container` 1.09:1), Stripe (`#f6f8fa` 1.06:1 with strong
shadows) and Linear (`#f4f2f4` 1.11:1) all place their canvas at **≥ 1.09:1**.

Dark mode is better spaced by construction: n2 1.07:1, sunken 1.13:1, n3 1.19:1, hairline 1.27:1,
input (n9) 3.68:1, muted-fg 9.06:1 — the "no layers" complaint is a light-mode problem.

### 2. Demo tokens (OKLCH → sRGB) against the demo card (`#fefdfc`)

| token | hex | L | C | h° | vs card |
|---|---|---|---|---|---|
| background / card / sidebar | `#fefdfc` | 0.995 | 0.0017 | 68 | 1.00 (page body is `#ffffff`, 1.02) |
| secondary / muted / accent (segmented well) | `#f5f4f2` | 0.967 | 0.0029 | 85 | 1.08 |
| border = input = sidebar-border | `#e5e4e1` | 0.919 | 0.0042 | 91 | **1.25** |
| muted-foreground | `#6b6865` | 0.519 | 0.0060 | 68 | 5.45 |
| foreground | `#141211` | 0.184 | 0.0039 | 49 | **18.4** |
| primary (`oklch(.51 .095 195)`) | `#007677` | 0.513 | 0.087 | 196 | 5.36 |
| info-muted / alert-info border | `#e2f3ff` / `#c9e2f3` | 0.955 / 0.900 | 0.024 / 0.035 | 238 | 1.11 / 1.32 |
| shadow-sm ink | `rgba(20,20,15,.05)` | 0.190 | 0.008 | 107 | warm black, one layer |

Demo composition (computed): `system-ui` (SF Pro) 600 = real semibold; h1 **24/600 −0.02em**;
card title **16/600**; label 14/500; input **36 px**, radius 8, border 1.25:1; sidebar `card` fill +
1.25:1 seam; nav items 14/500 at a 78 % foreground mix; alert `bg: card` + tinted border, title in
foreground, body in muted-foreground.

Build composition (computed): `"Helvetica Neue"` 600→**700**; h1 **32/700-rendered −0.8px**; card
title **20/700-rendered**; label 14/500; input **40 px**, radius 10, border **3.22:1**; rail
`#f9f9fb` + hairline; nav items 14/500 at full foreground; alert `info` = tinted fill, tinted body.
Weight census across `components/filing/**`: **53 × font-semibold vs 37 × font-medium**.

### 3. Reference neutrals (approximate; hue/chroma computed from published hex)

| system | canvas vs card | border vs card | muted text | temperature |
|---|---|---|---|---|
| Radix Slate (DS) | 1.03 (n2) / 1.11 (n3) | 1.86 (n8) · 1.37 (n6) | 5.79 | cool, **h 282°, C 0.010** |
| Radix Sand | 1.04 / 1.12 | 1.89 / 1.39 | 5.93 | warm, h 91°, C 0.005 |
| Radix Sage (Radix's teal pairing) | 1.04 / 1.11 | 1.88 / 1.38 | 5.83 | cool-green, h 169°, C 0.005 |
| Radix Mauve | 1.03 / 1.11 | 1.87 / 1.38 | 5.77 | pink-cool, h 304°, C 0.012 |
| shadcn zinc (v4 default) | muted 1.10 | border=input `#e4e4e7` **1.27** | 4.83 | cool, h 286°, C 0.004 |
| shadcn stone | muted 1.09 | `#e7e5e4` 1.26 | 4.79 | warm, h 49–106°, C 0.003 |
| iOS grouped | `#f2f2f7` **1.12** | none (fill only) | 3.08 (secondaryLabel) | cool, h 286°, C 0.007 |
| Stripe dashboard | `#f6f8fa` 1.06 + shadow | `#e3e8ee` 1.16 | 4.49 | cool, h 250–270°, C 0.01–0.04 |
| Vercel Geist | `#fafafa` 1.04 / `#f2f2f2` 1.12 | 1px 8 % alpha ≈ 1.19 | 5.74 | achromatic |
| Linear light | `#f9f8f9` 1.06 / `#f4f2f4` 1.11 | `#e9e8ea` 1.22 | 5.03 | mauve, h ~320°, C 0.003 |
| Material 3 | container 1.09 / high 1.16 | outline-variant 1.62 | 8.88 | violet, h 312°, C 0.015 |

Reading: cool systems (iOS, Stripe, zinc) do not read sterile because they layer at ≥ 1.09:1 and keep
edges at ≤ 1.3:1. Slate's *chroma* (0.010–0.016 in steps 6–11) is what makes its greys read
"steel"; Sand/stone/Linear/zinc are all ≤ 0.005.

## Root causes, ranked by impact

1. **No canvas.** Layout root `bg-background`, rail `bg-sidebar` (n2), header/footer/panels
   `bg-card`, cards `PANEL_CLASS` = hairline + `shadow-raised`. Every structural surface is within
   1.00–1.03:1 of every other; the shadow's densest pixel composites to `#eaeaeb` (1.17:1) and
   is the only depth cue. A white card cannot lift off a white ground — hence "no elevation". The
   craft skill (§4) already names the fix; the build did not apply it. Also the source panel and
   footer are `bg-card` on `bg-card`, so their hairline seams float in white.
2. **Typeface and weight substitution.** `Helvetica Neue` ships 400/500/700 only on macOS;
   CSS matching sends 600 to Bold. All `text-title-*` (gate-enforced `font-semibold`), card
   titles, sidebar "Sections", source-panel titles render Bold. On Windows the whole UI is Arial
   (400/700 only, so 500 → 400 as well). The Figma master is Inter 600; the demo is SF Pro 600.
   This alone accounts for much of "amateur": heavy, slightly wide grotesque headings at 32/20 px.
3. **Neutral temperature and chroma.** Slate mid-steps h ≈ 280°, C ≈ 0.010; muted text and ink
   visibly blue. Teal (`#007e7e`, h 195°) sits 85° from Slate — an analogous cool family, so the
   brand never gets warm/cool tension; against the demo's h ≈ 83° neutrals it is 112° away and
   reads richer by simultaneous contrast. The demo's ink is also darker (L 0.184 vs 0.241; 18.4:1
   vs 16.0:1), which reads crisper.
4. **Stroke hierarchy inverted.** Field edges 3.22:1 × ~10 per screen, `track` 1.37:1 under
   Yes/No segments and the progress bar, `secondary` 1.19:1 slab for "View uploaded documents",
   `border` 1.86:1 on table frames and the source image; while panel edges are 1.22:1. The eye
   reads the darkest repeated rectangles as the structure — a grid of grey input boxes = wireframe.
   `surface-sunken` at 1.07:1 is consistent with having been tuned so n9 stays ≥ 3:1 on it (3.01) —
   it was designed as a *well*, not a canvas.
5. **Status/notice treatment.** `Alert variant="info"` = tinted fill + tinted title *and*
   description; the DS "three treatments" pushes every notice to a colour block. `Badge` and the
   segmented `track` add more mid-grey. The demo keeps notices white and puts status in the icon
   and a 1.3:1 tinted border.
6. **Not causes:** radius (10/14 vs 8/14 — fine), spacing (both p-6/gap-6), shadow values
   (dual-layer 4/7 % is well-shaped; it just has nothing to work against), teal itself (4.78:1 on
   card; the demo's `#007677` is 5.36:1 — a hair darker but the same colour).

## Prescriptions

### A. DS-level token proposals (values, both modes, with the gate math)

**T1 — Warm the neutral ramp, keep the Slate lightness shape.** Rotating hue to ~83° at the demo's
chroma preserves every existing ratio to ±0.03, so all 54 `check:contrast` pairs keep passing.

| step | light Slate → warm | vs n1 | dark Slate → warm | vs n1 |
|---|---|---|---|---|
| 1 | `#fcfcfd` → `#fdfcfb` | 1.00 | `#111113` → `#121110` | 1.00 |
| 2 | `#f9f9fb` → `#faf9f7` | 1.03 | `#18191b` → `#1a1917` | 1.07 |
| 3 | `#f0f0f3` → `#f1f0ee` | 1.11 | `#212225` → `#232220` | 1.19 |
| 4 | `#e8e8ec` → `#eae8e6` | 1.19 | `#272a2d` → `#2b2927` | 1.30 |
| 5 | `#e0e1e6` → `#e3e1de` | 1.27 | `#2e3135` → `#32312e` | 1.45 |
| 6 | `#d9d9e0` → `#dbdad6` | 1.37 | `#363a3f` → `#3b3937` | 1.64 |
| 7 | `#cdced6` → `#d0cecb` | 1.53 | `#43484e` → `#494744` | 2.04 |
| 8 | `#b9bbc6` → `#bdbbb8` | 1.87 | `#5a6169` → `#62605d` | 3.01 |
| 9 | `#8b8d98` → `#8f8d8a` | **3.23** | `#696e77` → `#6f6e6b` | **3.70** |
| 10 | `#80838d` → `#85837f` | 3.69 | `#777b84` → `#7c7b78` | 4.46 |
| 11 | `#60646c` → `#666460` | **5.76** | `#b0b4ba` → `#b5b3b0` | **9.02** |
| 12 | `#1c2024` → `#201f1d` | 16.07 | `#edeef0` → `#efeeec` | 16.27 |
| surface-sunken | `#f4f4f7` → `#f6f4f1` | 1.07 | `#1d1e21` → `#1f1e1c` | 1.13 |

Gates: input(n9) on n1 3.23 (≥ 3) · muted-fg on n1 5.76, on n3 5.18, on sunken 5.38 (≥ 4.5) ·
`#007e7e` on n1 4.78, white on primary 4.90 · dark: input 3.70, muted-fg 9.02, `#0eb39e` on n1 7.15.
`hairline`, `disabled-fill`, `scrim` derive automatically. Alternative with zero authoring:
**Radix Sand** as a drop-in (light `#fdfdfc #f9f9f8 #f1f0ef #e9e8e6 #e2e1de #dad9d6 #cfceca
#bcbbb5 #8d8d86 #82827c #63635e #21201c`; dark `#111110 #191918 #222221 #2a2a28 #31312e #3b3a37
#494844 #62605b #6f6d66 #7c7b74 #b5b3ad #eeeeec`) — gates 3.28 / 5.93 / 16.02 light, 3.65 / 9.01
dark. If warmth is rejected, Radix's own pairing for Teal is **Sage** (input 3.29, muted-fg 5.83).
Touches: `globals.css` comment "Radix Slate, confirmed exact match against the live Figma file" —
precedence #1 is Figma, so the Figma variable collection changes with it; `check:contrast` re-run.

**T2 — A real canvas step.** Add `--canvas` (light **neutral-3** `#f0f0f3` / warm `#f1f0ee`, 1.11:1;
dark neutral-2 `#18191b`, 1.07:1 — or `surface-sunken` 1.13:1) and make it the stage rule: product
screens with panels put the area root on canvas; chrome (header, rail, footer, docked panels) is
`bg-card`; `Card` on canvas is `bg-card border-hairline shadow-raised` (formalise as
`Card variant="raised"`); wells stay `surface-sunken` inside panels. Constraints the math imposes:
`text-primary` on n3 is **4.31:1** (and 4.46 on sunken) — teal *text* must sit on `card` or use
`brand-tint-foreground` (`#0a6969`, 5.70 on n3); `input` on n3 is 2.90 — fields never sit bare on
the canvas; `secondary` (n4) is 1.07 against n3 — buttons on the canvas are `outline`/`default`.
Touches: Law "Grouped content gets a border" (amend: on the canvas, fill + shadow define the panel;
on a flat page the border does), AGENTS.md "Grouped content" paragraph, elevation page ("Card
remains flat" → flat on flat page, raised on canvas), colours "Roles at a glance" (`muted` = stage
→ `canvas` = stage). This closes the ui-craft §6 "stage token" and "raised Card" items.

**T3 — Retune the structural strokes.** `--border`: neutral-8 → **neutral-6** (1.37:1; Radix's own
"subtle border/separator" step, already `sidebar-border`). `--track`: neutral-6 → **neutral-4**
(1.19:1) for tabs list, segmented, progress, skeleton, with the active segment on `card` +
`shadow-raised`. `--input` stays neutral-9 under the current policy (see T5). Touches AGENTS.md
rule 9 paragraph and the rule-10 `track` definition.

**T4 — Type stack.** `--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans",
"Helvetica Neue", Arial, sans-serif` — still zero-download, gives a real 600 on macOS/iOS (SF),
Windows (Segoe UI), Android/Chrome OS (Roboto/Noto), and keeps Indic fallbacks in one family per
platform. If exact Figma parity matters more than zero-download, self-host Inter variable (~100 KB,
cached) instead. Touches AGENTS.md "Typeface" and the typography Callout.

**T5 — Field-edge policy (a decision, not a measurement).** The DS reads WCAG 1.4.11 as
"control boundary ≥ 3:1"; Radix (n7, 1.53), shadcn (1.27), Linear, Geist and iOS all identify text
fields by label + fill and ship ~1.2–1.5:1 borders; GOV.UK/USWDS enforce ≥ 3:1. Options: **(a)** keep
n9 and make it the *only* strong stroke on the screen via T2/T3 (recommended first); **(b)** relax to
n7/n6 with the visible label as the identifier and a `card` fill on any tinted stage; **(c)** n8
(1.86) as a middle. Decide after the A/B below.

**T6 — Quiet notice.** A notice that is not a status *fill*: `bg-card` + `border-hairline`, icon in
`text-info-ink`, title `text-foreground`, body `text-muted-foreground`. This is the DS's own "ink
on neutral" treatment, so no fourth treatment and no new token; if a tinted border is wanted
(demo: 1.32:1), that would need an `info-border`-class token (info-5 `#c2e5ff` 1.28, info-6 1.46).

**T7 — Shadow ink (optional).** Replace `#000` in the elevation primitives with neutral-12 at the
same alphas (raised composite `#eeedeb` on the warm ramp) so shadows carry the surface hue —
the demo's `rgba(20,20,15,.05)`. Values are already premium-shaped; leave the geometry alone.

### B. Composition-level fixes available today (no token change)

1. `app/filings/layout.tsx`: root `bg-surface-sunken` (the craft §4 canvas; 1.07:1 today, 1.11 once
   T2 lands); `FilingSidebar` `bg-card` instead of `bg-sidebar`; keep `PANEL_CLASS`. Header, footer,
   source panel already `bg-card` — they will now sit on a different value.
2. `FormCard` title `text-body font-semibold` (16/600 — the Card master's own `text-base`) instead of
   `text-title-s`; step `h1` `text-title` (24/600) instead of `text-title-l`; `tracking-tight` only at
   ≥ 24 px. Reserve `text-title-l` for the dashboard hero.
3. `SectionNotice`: compose on `Alert` default (`bg-card`) with the icon in `text-info-ink` /
   `text-warning-ink`, title in foreground, body in muted — status carried by icon + word.
4. Weight discipline: two weights per component (53 semibold today). Rail "Sections" → 500;
   source-panel titles → 500; keep 600 for the h1 and card titles only.
5. Chrome labels: `size="sm"` buttons render 12 px (`text-xs`) — "Hide", "EN", "Support" — use
   `default` (14 px) or accept 12 px only for icon-only controls.
6. `text-primary` on any sunken/canvas surface → `text-brand-muted-foreground` (5.7:1) or keep it on
   `card`; the "Add complainant" ghost and the "Welcome back" eyebrow are the current cases.
7. `secondary` slab in the rail ("View uploaded documents") → `outline` or `ghost` + count; on a
   canvas the 1.19:1 slab disappears anyway.

## Suggested A/B experiment (smallest that settles the owner's question)

Screen: `/filings/new/complainant` at 1440×900, light, macOS Chrome — it has rail, tabs, notice,
segmented, prefilled inputs, cards and the docked source panel. Four renders, judged blind side by
side (plus one Windows Chrome render of A and C for the Arial question):

- **A** — as built.
- **B — greys only.** Add to `globals.css` a scoped override and nothing else, so it isolates
  temperature: `[data-exp="warm"] { --neutral-1: #fdfcfb; … --neutral-12: #201f1d;
  --surface-sunken: #f6f4f1 }` and the dark counterparts (24 lines; every semantic token aliases the
  ramp so no component changes). If B still reads wireframe, temperature is not the primary cause.
- **C — structure + type, Slate kept.** Layout root `bg-surface-sunken`, rail `bg-card`,
  `--border: var(--neutral-6)`, `--track: var(--neutral-4)`, `--font-sans: system-ui, …`,
  FormCard title 16/600, h1 24. If C reads premium, the answer is structure/type.
- **D** — B + C. Expected winner; the gap between C and D is the honest size of the "warm" effect.

Score each on: can you tell canvas from rail from panel with the strokes ignored; count of marks
darker than the panel edge; heading weight; and a one-word gut read.

## What I could not verify

- Pixel sampling. Colours were read as computed styles and token math, not sampled from the
  screenshot pipeline (which rescales); side-by-side renders exist but were judged by eye.
- Radix Sand/Sage/Mauve/Olive/Gray, Linear, Stripe, Geist and M3 hex values are from memory. Slate
  matched the DS byte-for-byte, which validates the source, but verify Sand against
  `@radix-ui/colors` before adopting T1's drop-in.
- Windows (Arial / Segoe UI) and Android (Roboto) rendering were not produced here; the weight
  substitution is a font-availability fact, and the macOS 600→700 collapse is measured.
- Whether the Figma master (precedence #1) can absorb a ramp/font change without breaking the
  variable graph is the owner's call.
- The claim that `surface-sunken` was tuned for n9 ≥ 3:1 (3.01:1) is inference from the numbers.
- Dark mode was not rendered; the numbers say it is already better layered.
- The WCAG 1.4.11 reading in T5 is a policy interpretation of the Understanding text, not a quote.
