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
