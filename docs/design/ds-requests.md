# Design-system requests

Open requests against
[neer-ideasbeforenoon/pucar-design-system](https://github.com/neer-ideasbeforenoon/pucar-design-system),
raised while designing Dristi screens.

**This file is a queue, not a licence.** Nothing here may be worked around locally: an
invented token, a hand-written primitive, or a per-screen override is a defect under the
DS gate (`.cursor/rules/pucar-design-system.mdc`), whatever the deadline. A request that
blocks a feature blocks the feature.

Each entry says what is missing, why the product hit it, and what would close it.

| # | Request | Raised by | Status |
|---|---|---|---|
| 1 | Token family for user-assigned categorical marks | [cases.md](proposals/cases.md) | open — **blocking** |
| 2 | `Badge` cannot hold a long localized label | [cases.md](proposals/cases.md) | open |
| 3 | Five shipped components have no registry guidance | [cases.md](proposals/cases.md) | open |
| 4 | No sanctioned sticky table header or row-density guidance | [cases.md](proposals/cases.md) | open |
| 5 | Panel fill equals page fill in both themes; raised shadow invisible in dark | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 6 | No provenance / source-document panel | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 7 | No rich-text editor | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 8 | `DocumentSlot` cannot own a real upload row | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 9 | `Alert` is always `role="alert"` — no quiet standing notice | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 10 | `Sidebar`: no top offset, 32px nav, hover/selected share a token, hardcoded English chrome | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |
| 11 | No selected-on-track pair: `accent-strong` is 1.08:1 on `track` | [e-filing.md](proposals/e-filing.md) | open — **owner auditing** |

---

## 1. No token family for user-assigned categorical marks — blocking

A confirmed product requirement, not a speculative one: users create their own case tags
and choose a colour from provided defaults ([cases.md](proposals/cases.md)).

Tags are **categorical, not status**. Status is closed at exactly three treatments per
family (`AGENTS.md` rule 6), and `chart-1…5` is documented as "series identity only —
never status" and scoped to data visualisation. So there is no sanctioned home for a
user-chosen mark.

**Request:** a **`tag-1…5`** family aliasing the chart ramp — contrast-checked ≥3:1 as
non-text marks, defined in both `:root` and `.dark`, documented as "never status, never a
row fill, always paired with a name."

System-level rather than a one-off: any future case type or workspace feature will need
user labels.

**Until it exists, tags cannot ship.** A local hex, or a colour picker that emits one, is
a defect under rules 1 (never hardcode a colour), 4 (must exist in light and dark), and 9
(every pair computed, never asserted).

## 2. `Badge` cannot hold a long localized label

`badge.tsx` is `h-6` with `whitespace-nowrap`. One core deploys per state with local
languages over identical national law, and court languages make three-word §138 stage
names much longer — "Bail & recording of plea", "Proclamation & attachment" — with taller
glyphs (`foundations/typography`, `ACCESSIBILITY.md` §13). A non-wrapping fixed-height
chip overflows its cell, and truncating a critical label with no alternative is itself a
defect (a11y §10).

**Request:** either a wrapping / multi-line badge variant, or explicit guidance that long
localized status values render as text. Without one of the two, every screen invents its
own override — [cases.md](proposals/cases.md) D3 avoided that by rendering stage
as plain text.

## 3. Five shipped components have no registry guidance

`item`, `description-list`, `toggle-group`, `input-group`, and `marker` exist in
`src/components/ui/` but have no `componentRegistry` entry, so they carry no `whenToUse`,
usage notes, or do/don't — while [cases.md](proposals/cases.md) depends on all
five.

Per `AGENTS.md`'s own standard, "a component with no reviewed guidance is a component the
system has not actually decided on."

**Request:** registry entries for at least these five.

## 4. No sanctioned sticky table header or row-density guidance

`RESPONSIVE.md` calls a sticky header "optional in product layouts", which means every
product hand-rolls it. A 55-row docket wants one, and if users turn out to be professional
repeat users, it wants a density answer too.

**Request:** a documented `Table` behaviour for sticky headers, with a row-density note,
rather than five screens inventing five versions.

---

↑ Design guidance: [design-system.md](design-system.md) · Briefs:
[proposals/](proposals/)


---

## 5. Panel fill equals page fill in both themes; the raised shadow is invisible in dark

Measured on the running e-filing app (2026-08-17), computed values, both themes:

| pair | light | dark |
|---|---|---|
| `--card` vs `--background` | `#fcfcfd` vs `#fcfcfd` — **1.00:1** | `#111113` vs `#111113` — **1.00:1** |
| `--sidebar` vs `--background` | 1.03:1 | 1.07:1 |
| `--surface-sunken` vs `--card` | 1.07:1 | 1.13:1 |

A panel therefore never differs from the page by *fill*; it exists only through
`shadow-raised` plus a hairline. In light that works — the shadow carries it. **In dark
the shadow is `rgba(0,0,0,.3)`/`rgba(0,0,0,.4)` on `#111113`: invisible.** Nothing
separates panel from page but a 10 %-alpha hairline, so the page renders as one flat
sheet — and because `surface-sunken` (`#1d1e21`) is *lighter* than `card` (`#111113`),
a well reads as the most raised surface and the layering model inverts.

The light half of this is analysed at length in [ds-diagnosis.md](../design/ds-diagnosis.md);
the dark-mode consequence is new.

**Request (one of):**
- give `--card` its own value a step off `--background` in both themes (the ladder already
  has `neutral-2` at 1.03/1.07 and `surface-sunken` at 1.07/1.13), **or**
- define a dark-mode `shadow-raised` that reads on a near-black ground — a light-toned
  top edge (`inset 0 1px 0 rgb(255 255 255 / .04)`) plus a deeper ambient shadow, which is
  how most dark UIs express elevation, **or**
- both, and add a `Card variant="raised"` so the product stops expressing panels as a
  per-use `className` (this repeats request-adjacent note in `ui-craft` §6).

Until then every Dristi screen carries `PANEL_CLASS = "border-hairline shadow-raised"` by
hand and dark mode has no layering.

## 6. No provenance / source-document panel

The e-filing flow reads uploaded documents and pre-fills the form, so every machine-read
value needs an answer to "where did this come from?". Dristi ships `source-panel.tsx`:
a right-docked panel that **pushes** the form (not an overlay) above `xl` and degrades to
a `Sheet` below, showing the uploaded page with the extracted region highlighted and an
editable "value used in this field" box that clears the machine-read marker.

Nothing in the DS covers it, and it is not §138-specific — any intake that machine-reads a
document needs it.

**Request:** a `SourcePanel` (or `Provenance`) primitive owning the docked/sheet
behaviour, the highlight geometry (percentage box over an image), and the corrective
value field. Note the current local implementation masks the page with
`shadow-[0_0_0_9999px_var(--color-scrim)]` — it passes the token gate but is a hack a real
primitive should absorb.

## 7. No rich-text editor

Party-in-person affidavits and the prayer/relief blocks are formatted long-form text.
Dristi ships `rich-text-editor.tsx` on `document.execCommand`, which is deprecated.

**Request:** an editor primitive with `Textarea`-parity chrome (`border-input`, focus
ring), a toolbar of toggle controls at ≥40 px, DS type roles inside the content area, a
real placeholder (the local one is an absolutely-positioned `<span>`), and proper
`role="textbox"` semantics — wrapping a maintained editor core rather than `execCommand`.

## 8. `DocumentSlot` cannot own a real upload row

`DocumentSlot` models the states (empty · empty-optional · processing · filled ·
filled-poor) but not the row: it has no slot for a description, no row actions
(preview / re-upload / delete), no progress element, and no drop-target behaviour. Every
consumer therefore composes around it — Dristi renders the description as a separate
paragraph below the row and overlays an absolutely-positioned action cluster, which is
brittle and reads as two objects rather than one.

**Request:** `description`, `actions` and `progress` slots, plus a documented
drag-and-drop state (`data-dragging`) so the row can be a drop target without a fork.

## 9. `Alert` is always `role="alert"` — no quiet standing notice

`{DS}/src/components/ui/alert.tsx` hardcodes `role="alert"`. Dristi renders ~15 pieces of
standing guidance through it, so screen-reader users are interrupted assertively on mount
for text that is not an alert; one case nests a `role="alert"` inside a `role="status"`
container, which overrides an intentionally polite region.

**Request:** make the live semantics a prop — no role for standing guidance (the common
case), `status`/polite for async results, `alert` reserved for errors that interrupt.


## 10. `Sidebar` — four things a product shell cannot express

Raised while adopting the DS sidebar for the e-filing rail (which was previously a private
fork). Adoption was the right call — collapse persistence, ⌘B, roving focus, the mobile
sheet and `SidebarInset` all came for free — but four things had to be worked around or
accepted, and every product with an app bar will hit the same ones.

1. **No top-offset hook.** `sidebar-container` hardcodes `fixed inset-y-0 … h-svh` and
   `SidebarProvider` hardcodes `min-h-svh`. A shell with a global header must override both
   with inline styles (class overrides of `inset-y-0`/`h-svh` are cascade-order dependent).
   **Request:** a `--sidebar-top` variable alongside `--sidebar-width` / `--sidebar-width-icon`.

2. **Navigation rows are 32px, and 32×32 when collapsed — under the DS's own 40×40 floor**
   (`ACCESSIBILITY.md` §8). `size="lg"` is 48px, which is too tall for a 12-item rail. The
   collapsed size is forced with `!`, so it cannot be raised without a specificity fight.
   Dristi meets the floor by expanding the hit area (`after:-inset-1`) and widening the menu
   gap to `gap-2` so neighbouring targets meet without overlapping — the remedy
   `ACCESSIBILITY.md` prescribes, but every consumer will have to rediscover it.
   **Request:** a `default` size that meets the floor, or a documented `md` between 32 and 48.

3. **Hover and selected share one token.** `SidebarMenuButton` uses `hover:bg-sidebar-accent`
   *and* `data-active:bg-sidebar-accent`, so the current step is indistinguishable from a
   hovered one. `AGENTS.md` rule 10 reserves `accent-strong` for "pressed, engaged and
   selected", but there is no `sidebar-accent-strong` token, so no DS-legal local fix exists.
   Dristi falls back to a teal icon plus `data-active:font-medium`.
   **Request:** a `sidebar-accent-strong` token, bound to `data-active`.

4. **Hardcoded, untranslatable English chrome.** The mobile sheet's accessible name is
   `<SheetTitle>Sidebar</SheetTitle>` with description "Displays the mobile sidebar", and
   `SidebarTrigger`'s sr-only text is "Toggle Sidebar" — Title Case, against the sentence-case
   Law, and none of it is overridable through props. On a court product that must ship in
   Malayalam and Hindi (`ACCESSIBILITY.md` §13), the navigation dialog announces itself in
   English as "Sidebar" — which is also implementation jargon, not what the user sees.
   **Request:** props for the sheet title/description and the trigger's label.


## 11. No selected-on-track pair — `accent-strong` is invisible on `track`

`AGENTS.md` rule 10 names `accent-strong` as "the pressed, engaged and selected fill", and
`Toggle` uses it for `data-[state=on]`. That is correct on a page or card ground. It is not
usable on a **track**, which is where a segmented control lives:

| pair | measured |
|---|---|
| `accent-strong` `#e0e1e6` on `track` `#d9d9e0` | **1.08:1** |
| `accent` `#e8e8ec` on `track` (hover) | 1.15:1 |
| `background` `#fcfcfd` on `track` | 1.37:1 |

At 1.08:1 the selected segment is indistinguishable from the groove — the control reads as
one grey slab (owner, 2026-08-18: "the tokens of the toggle button have got fucked up").

The system already answers this elsewhere and disagrees with itself: **`Tabs` puts
`bg-track` on its list and styles the active trigger `data-active:bg-background` plus a
shadow** (`tabs.tsx:68`), i.e. a raised light chip, not `accent-strong`. Dristi's segmented
control now follows `Tabs` for that reason.

**Request:** either a named selected-on-track pair (`track-selected` / `track-selected-foreground`,
or simply blessing `background` + `shadow-raised` as the documented recipe), or a `Segmented`
primitive that owns it — so consumers do not have to discover the conflict by measuring.
A hover pair for the same ground is needed too: `accent` at 1.15:1 has the same problem.

---

## 12. `Select` opens over its own field by default

`SelectContent` defaults to `position="item-aligned"` (`select.tsx:63`), which pins the
open list so the selected row sits on top of the trigger. On a menu bar that is the
familiar macOS behaviour. In a form card it is not: the list covers the field's own label
and the field below it, and every screenshot of it reads as a rendering bug rather than an
open menu (owner, 2026-08-19: "the drop downs were glitching in a few places").

Dristi now passes `position="popper" align="start" sideOffset={4}` plus
`w-(--radix-select-trigger-width)` at its single wrapper (`inputs.tsx`, `OptionSelect`),
so a form menu opens under its control at the control's width.

**Request:** make `popper` the default for `SelectContent`, or ship the form recipe as a
documented variant. Every consumer putting a Select in a form will otherwise hit this and
fix it privately, and the fix is four props they have to know to write.

---

## 13. `Combobox` has no free-text mode

`Combobox` selects from `items`; there is no sanctioned way to keep a typed value that no
item matches. Several Dristi fields need exactly that — a police station or a bar
registration number is searched against a directory that is *usefully* incomplete, and
refusing an address because our copy of the station list is missing one is worse than
taking the person's word for it.

Dristi drives `inputValue` + `onInputValueChange` back into its own state to get this
(`inputs.tsx`, `ComboField`). It works, but it means the component is controlled two ways
at once and the semantics of "what is the value" live in the consumer.

**Request:** a `freeSolo` (or `allowCustomValue`) prop on `Combobox` that makes the typed
string the value when nothing matches, and lets `ComboboxEmpty` say so. Related: the DS
guidance for `Combobox` should name this case, since a searchable field over a registry is
the most common reason to reach for it in a government form.

---

## 14. No audio primitive — every feedback channel will compose its own

`src/components/ui/` has 68 components and none of them plays media: no `audio`, no
`media`, no `player`. The scrutiny return needs one, because a registry officer's remark
arrives as a voice note as often as it arrives as text
(`docs/product/domain/practice-notes.md`, `ke-scrutiny-officer-2026-07`), and any judge-,
party- or officer-feedback channel in a court product will want spoken context.

Dristi composes one at `components/scrutiny/voice-note.tsx`: `Attachment` as the row, a
`Button size="icon"` transport, `Slider` as the scrub track, `font-mono tabular-nums`
times, and a `Collapsible` transcript. It is deliberately not generalised.

The reason this should be decided once rather than per screen is the accessibility
contract around it, which is easy to get wrong and invisible when you do: WCAG 2.1 AA
**1.2.1** requires a text alternative for prerecorded audio-only content, so a voice note
may never be the sole carrier of a message and the component needs somewhere to put a
transcript; the transport must be keyboard-operable and ≥ 40×40; and progress cannot be
carried by colour alone.

**Request:** `Audio` / `AudioNote` — transport button, `Slider` track, `tabular-nums`
elapsed/duration, optional transcript disclosure, and the `idle | loading | error` states
`Attachment` already models. Until it lands, a second team will build a second audio row.

---

## 15. "Annotation over a document" is a pattern with two callers and no home

Dristi hand-rolls a highlight over an uploaded page twice now, with the same geometry and
two different authors of the box: the OCR read region (`filing/source-panel.tsx`,
`regionFromBox()`) and the scrutiny officer's mark (`scrutiny/annotation.tsx`, which
reuses that function rather than growing a second one).

The shape is stable — a pixel box plus the page dimensions it was measured in, mapped to
percentages so it survives any render width — and the decisions around it are not obvious:
the box is `aria-hidden` and the meaning lives in adjacent text, the image needs a real
alt naming *why* it is marked, and the enlarge control has to be a button rather than a
hover affordance.

**Request:** document the pattern (and ideally ship the mapping helper) before a third
caller appears. It does not need to be a component; it needs to be a decision.

---

## Stacked (multi-segment) progress bar

Raised: 2026-08-30, from the e-filing "File a case" screen (`BatchProgress` in
`components/filing/dashboard/bulk-import-card.tsx`).

`Progress` is single-valued. A batch of filings is not: its cases sit across registered /
in scrutiny / defect / not filed at once, and the useful picture is the proportions in one
bar. Composed here from a flex row of token-filled spans, with the bar `aria-hidden` and a
legend carrying every count as text, so colour never carries the meaning alone.

**Request:** a `Progress` variant (or a `SegmentedProgress`) that takes ordered segments
with a value and a semantic token each, and owns the accessible summary. Three things are
easy to get wrong per-composition and worth deciding once: rounding when segments do not
sum to the total, the minimum visible width of a non-zero segment, and whether the
remainder renders as `track` or as an explicit segment.

---

## `Card` clips its children, so a panel cannot hold sticky content

Raised: 2026-08-30, from the e-filing "File a case" work queue
(`components/filing/dashboard/filings-queue.tsx`).

The `Card` master carries `overflow-hidden`. A clipping ancestor makes `position: sticky`
inert for every descendant, so a panel cannot keep its own header, tab strip or table
head pinned while its content scrolls — a normal pattern for any long list inside a card.
Worked around here with `overflow-visible` on the one Card, which gives up the corner
clip the master was buying.

**Request:** either drop `overflow-hidden` from the master (rounding already clips
backgrounds; it is mainly there for images bleeding to the edge) or add a variant that
opts out, so composition does not have to fight the primitive to pin a header.
