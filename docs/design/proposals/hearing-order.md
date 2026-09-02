# Hearing order

Status: building
Updated: 2026-09-02
Source: user screenshot (1.0 generate-order screen, opened from the cause-list
orders icon) · user said this is what appears when they click the orders icon ·
docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md · docs/product/open-questions.md ·
docs/product/standards/adherence.md · apps/dristi-app hearings table (the
orders column is currently `aria-disabled`, "Not part of this build")
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation` / `icons`; catalog
card · field · segmented-control · select · date-picker · textarea ·
button · dialog · empty · empty · alert · badge.

---

## 1. Context

**Ask:** the generate-order screen that opens from the cause-list orders icon
is poorly designed. Review it, redesign the experience, then build.

**Where it sits.** Court-side, under Hearings. Today's cause list
(`/employee/hearings`) already has an Orders column: a `file-plus` icon per
listing, currently visible and `aria-disabled` because issuing an order is a
real judicial act this build has not performed. The screenshot is the 1.0
composer that icon used to open — a two-column form titled
"Order : {complainant} vs {accused}".

**Neighbours this is not.** The advocate-side case register
(`CaseOrders`) is the *issued* record of a case. The rail's **Sign orders**
row is a signing queue, not built. This feature is the *composer* for one
listing, entered from the cause list. Signing stays out of scope.

**In scope:** compose the order of this listing — who appeared, the
directions, whether and when it is listed next — as a draft the bench can
read back as a document. Preview. Save as a screen draft.

**Out of scope:** issuing, e-signing, PDF generation as a court record,
the Sign orders queue, writing back to CIS / the case file. Same honesty
bargain as Start / End hearing and bulk reschedule: the work up to the
commitment is live; the commitment itself is not performed.

**Who logs in** is unanswered (`open-questions.md`). The employee area
currently runs as the JMFC magistrate (`content.ts`). Domain actors who
touch an order sheet: the magistrate who passes it, the bench clerk who
keeps it (`domain/actors.md`). Design for a professional repeat user during a
sitting (throughput, keyboard, density) — the more constrained of the two
court-side roles that would sit here — and flag that as an assumption.

---

## 2. Problem

From the screenshot. Numbered so decisions can cite them.

1. **Present and Absent are two independent checkbox grids for the same four
   roles.** The same person can be both, or neither, with no conflict. Attendance
   is one fact per appearance, modelled as two multi-selects.

2. **The four labels are roles, not the people on this listing.**
   "Complainant" / "Accused Advocate" when the cause list already knows
   "Meenakshi Nair" and "Adv. Anitha George". Multiple counsel on one side
   cannot be expressed. A side with no vakalat still shows an advocate checkbox.

3. **Next listing is a negative checkbox ("Skip Scheduling Next Hearing")
   that leaves Purpose and Next date visible.** Inverted logic, and the fields
   do not recede when skipped. Scheduling the next date is the common path on
   a §138 trial listing; skip is the exception.

4. **"Choose item" is an empty dropdown with Edit and Delete beside it, and
   "+ Add Item" below.** There is no list of what is already in the order, no
   name for what an "item" is, and the destructive action sits on a control
   that has no value yet.

5. **The right column is neither a preview nor an editor.** Attendance and
   Next hearing are grey read-only boxes; Item text is a rich-text editor
   sandwiched between them. The contract of the split (left fills, right
   reads) is broken by putting the only free-text edit on the right.

6. **The document is three boxes, not one order.** A court order is one
   text. The screen presents it as Attendance / Item text / Next hearing
   as if they were separate artefacts.

7. **No case context beyond the cause title.** No item number, case number,
   today's purpose, or that this is a draft. During a sitting the bench is
   coming from a 23-row list; the title alone is not enough to confirm they
   opened the right matter.

8. **Hierarchy is flat.** Every label is the same weight. Footer: Back as a
   link, Save as Draft as outline, Preview PDF as the one primary — so the
   strongest action is a look, while the recoverable save recedes, and an
   "API" debug badge sits on the commit row.

9. **The rich-text toolbar is a local `execCommand` editor.** The DS has no
   editor primitive (`docs/design/ds-requests.md` #7). Shipping that toolbar
   here would fork a primitive Dristi already regrets on affidavits.

---

## 3. Objective

- Mark each person on this listing present or absent **without being able to
  mark them both**, and see those names — not role labels — in the order text.
- Add, edit, and remove named directions as a **list of blocks**, and see
  the order assemble as **one document** on the right as they work.
- Schedule the next listing as a positive choice (date + purpose), or
  clearly choose not to; the unused fields recede.
- Leave and come back to a draft on this device. Preview the assembled
  text. Nothing claims the court has issued the order.

---

## 4. Job

**Job: unconfirmed.** Product has not said what this screen is *for* beyond
the user showing the 1.0 composer and asking to improve it.

**User said:** this is what appears when they click the orders icon on the
cause list.

**Candidate (hypothesis, not settled):** compose the order of this listing
— attendance, directions, next date — so it can later be signed. Do not
treat "this is a signing surface" or "this is the case's order register"
as true.

Until Job is confirmed, the entry point (cause-list icon → composer for
*this* listing) and the honesty bound (draft and preview only) are the
constraints that do not depend on a coined purpose.

---

## 5. Decisions

**D0 · Do not polish 1.0.** The dual grids, the skip-checkbox, the empty
"Choose item" row, and the three-box "Order text" are the problem, not a
skin on top of them. Rebuilding those controls in DS tokens would still be
a bad composer. *Judgment.* Gave up: a faster visual-only pass.

**D1 · One mark per appearance, not two lists.** *(problem 1)* Each
appearance is a row: name + role caption, and a `SegmentedControl`
Present | Absent. Unmarked is valid (nothing selected). Cannot be both.
Rule: SegmentedControl is the DS primitive for a small exclusive set
(its own docs: "Yes / No"). Alternative rejected: keep checkboxes and
disable the opposite — still two questions for one fact.

**D2 · Names from this listing.** *(problem 2)* Rows are built from the
hearing: complainant, each complainant counsel, accused, each accused
counsel. A side with no vakalat has no advocate row. Role is the caption
under the name, not the label. Long corporate accused names wrap; the
segment stays `w-fit` and does not shrink below 40px. *Judgment, from
the cause-list data the screen already has.*

**D3 · Next listing is a positive choice.** *(problem 3)* A
`SegmentedControl`: "List next" (default) | "No next date". When listing:
Purpose (`Select` of `COURT_HEARING_PURPOSES`) and Next date
(`DatePicker`), both with visible `FieldLabel`. When not: those fields
are unmounted, not disabled-in-place. Copy is sentence case (Laws).
Alternative rejected: keep the skip checkbox — inverted, and it fought
the fields beside it.

**D4 · Directions are a list of named blocks.** *(problem 4)* The section
is **Directions**, not "Order items" — "item" is implementation talk.
Empty: DS `Empty` inviting **one or more** directions, with the add
button in `EmptyContent` (not a header Select). Add is an outline
`Button` with `PlusIcon` that opens a `DropdownMenu` of hearing-day
types — an action, not a field. Once a block exists, the same control
sits under the list as **Add another direction**. Catalogue: notice,
summons, warrant, proclamation, interim compensation, cost, bail,
production of documents, others. Each added block is a sunken well:
type as title, `Textarea` for the court's words, Remove as a visible
`ghost` button (not hover-only — ACCESSIBILITY §7). No Edit link: the
textarea *is* the edit. Scheduling types are not in this catalogue —
next date is D3.

Alternative rejected (shipped, then reversed 2026-09-02): a `Select`
with placeholder "Add direction" in the section header. It read as
picking the one type for this sitting; the list only appeared after
the first choice, so "more than one" was a surprise. `DropdownMenu`
is the add-action primitive; `Select` stays on Purpose.

**D5 · The right column is one document, read-only.** *(problems 5–6)*
One lifted panel titled **Order**. It renders the assembled text as
prose: heading (cause title + case number), attendance as a **roll of
sentences** (one appearance per line — name medium, office muted,
present in body colour, **absent in `text-destructive-ink`** so a miss
scans without a chip; the words still carry the fact), each direction,
next-listing sentence. The Absent segment on the left uses the same ink
when selected. Present is not painted success — that would status-colour
the expected case.
Not an editor, not a second attendance form, not a `DescriptionList`.
The only free-text edit is the direction textarea on the left. Clicking a
direction in the preview is not a jump in this build (nice, not needed).
Alternative rejected: keep Item text as a rich editor on the right —
that is the contract-break. Alternative rejected (2026-09-02): keep
attendance as one run-on paragraph — four identical “is present”
sentences cannot be scanned. Alternative rejected: chips or a description
list — that would echo the left column’s rows instead of reading as the
order.

**D6 · No rich-text toolbar.** *(problem 9)* `Textarea`, DS chrome. Gap
already filed as ds-requests #7. Plain paragraphs are enough for a
day-order; bold/lists wait for a real primitive. *Gave up: formatted
directions.*

**D7 · Full page, not a sheet or dialog.** A document needs a page.
Route: `/employee/hearings/[hearingId]/order`. Back is a real `Link` to
`/employee/hearings`. RESPONSIVE: overlays are for focused tasks; this
is the task. Alternative rejected: Sheet from the row — cramped for
the document, and it would hide the cause list without replacing it.

**D8 · Page chrome names the listing.** *(problem 7)* Eyebrow:
"Order · item {n} · {case number} · {today's purpose}". Title: the cause
title (`causeTitle`). Support line: "Draft — nothing on this screen is
issued." Sentence case. No status Badge for draft (the word is in the
support line; a chip would be a second mark for the same fact).

**D9 · One primary: Preview.** *(problem 8)* Footer, sticky, `bg-card`
with `border-hairline` top — the bulk-reschedule commit bar. Left: Back
(`link` / ghost). Right: Save draft (`outline`) then Preview
(`default`, the one teal). Preview opens a `Dialog` of the same
assembled text, titled "Preview". It is a look, not a PDF and not a
filing — copy in the dialog says so. Save draft is local to the
session, announced on a live region; it does not persist to a server
(there is none). The "API" badge is gone. Alternative rejected: make
Save the primary — Preview is what 1.0 trained, and it is the
pre-commit look; Save is the recoverable secondary. Issuing is not
offered.

**D10 · Honesty bound, same as the rest of the court side.** Start/End
hearing, bulk reschedule, and this composer all stop before a judicial
act. Preview and Save do not file, notify, or sign. Do not add
"Submit for signature" as a disabled tease — the Sign orders row
already exists in the rail as "not part of this build".

**D11 · Two lifted panels on a white page, not a grey canvas.** The
muted-canvas exception in `FilingMain` is filing-only (owner 2026-08-26).
Employee hearings already sit on `bg-background` with one raised panel.
This screen: left panel = the work (attendance, next listing, directions
as *sections* inside one card, not three nested cards); right panel = the
document. Internal section breaks are `gap-8` + a hairline, not a
second `shadow-raised`. *ui-craft §1.0 / §4.*

**D12 · Employee stays self-contained.** Do not import `lib/cases/orders`.
Restate the hearing-day type labels in `lib/employee/order-draft.ts`,
matching the register's words so the two halves of the app cannot
disagree about "Interim compensation". `hearingById` lives next to
`CAUSE_LIST`.

**D13 · The cause-list orders icon is not green until an order is
actually passed — and even then, colour is not the signal.** User asked
whether the icon should be green always, or only once passed.

Always-green is wrong: the icon is an *action* (open the composer), not a
status. Painting every row success/brand makes “done” the default and
burns the one status colour on the row. Laws: ration teal; “status
colors for status — never recolor brand for success”; AGENTS.md: status
never by colour alone. This table already keeps the ended-hearing tick
muted so the Completed chip remains the one status mark (`hearings-table`
ui-craft §1.4). A green orders icon would be a second green on the
same row.

Idle (no order yet): `file-plus` in `text-muted-foreground` — what ships
today. **Do not turn it green on Save draft or Preview.** Those are not
passing an order (D10).

This is not a design-system gap. The DS already has success ink and
document glyphs. The blocker is **this Dristi app**: composing,
previewing and saving a draft do not file, notify, sign or issue, so
there is no real “order passed” fact to colour. A green icon would
claim a court record the product has not made. When a later slice of
the app actually issues (Sign orders, or an issue step on this
composer), the passed state can be shown.

When that fact exists: change the *glyph* (`file-plus` → a
document-without-plus / check) and the accessible name (`Order for item
N` → `Order passed for item N`). That is the scan cue.
`text-success-ink` is optional and I would still leave it off — the
Completed chip owns green on this row. 1.0’s green-means-generated is
the recognition habit to honour with the glyph change, not with a tint
on 23 idle icons.

---

## 6. What I cut (and why)

- **The dual present/absent grids** — problem 1; D1.
- **Generic role checkboxes** — problem 2; D2.
- **"Skip scheduling" as a checkbox** — problem 3; D3.
- **"Order items" / "Choose item" vocabulary** — implementation talk; D4.
- **Rich-text toolbar and `execCommand`** — no DS primitive; D6.
- **PDF generation, issue, sign** — real judicial acts; D10. Preview is
  text in a Dialog.
- **A wizard (attendance → directions → next → preview)** — a sitting is
  throughput work; one page, two columns. Gave up: a more guided first-use
  path for an occasional user. Who-logs-in is open; we designed for the
  repeat court-side case and said so.
- **Click-to-edit from the preview** — the left column *is* the editor.
- **Hover-only remove on a direction** — ACCESSIBILITY §7.
- **A third "Not marked" segment** — empty selection is the unmarked
  state; a third option would force a click to undo.
- **Tinted `bg-muted` canvas** — filing-only exception; D11.
- **Submit for signature, even disabled** — would imply a queue this
  build does not have; D10.
- **Standing `Alert` for the honesty line** — `Alert` is always
  `role="alert"` (ds-requests #9). The support line under the title is
  enough.
- **Always-green orders icon, and green-on-draft** — D13. Colour is not
  how this list says “the order exists.”

---

## 7. Layout & hierarchy

**Desktop (`lg+`).** Two columns, `gap-8`. Left `minmax(0, 1fr)`, right
`minmax(0, 1fr)` and `lg:sticky lg:top-8` so the document stays in view
while the form scrolls. Header (eyebrow, title, support) is above both,
full width. Footer is sticky at the bottom of the page, full width.

**Phone.** Stack: header, work panel, document panel, sticky footer.
RESPONSIVE: stack before splitting. Footer actions wrap;
Preview remains the last control (the primary stays at the end of
reading order).

**Above the fold on a phone.** Cause title + attendance section. The
document panel is below the work; that is acceptable — the work is the
task, the document is the check.

**Hierarchy.** One page title (`text-title font-semibold`, `sm:text-title-l`
to match Today's hearings). Section titles inside the work panel are
`text-body font-semibold` (card-title role, ui-craft §3). One
`bg-primary` control on the view: Preview. SegmentedControl selection
uses weight + lift, not teal (the primitive's own rule: a segment is a
value, not an action).

**Focus order.** Header → attendance rows (name then segment) → next
listing → directions (each well, then add another) → Back →
Save draft → Preview. When the list is empty, add is the empty state's
action.

---

## 8. Components (DS name → region)

| Region | DS primitive |
|---|---|
| Page title | `h1` `text-title font-semibold` |
| Eyebrow / support | `text-caption` / `text-body text-muted-foreground` |
| Work panel + document panel | `Card` + `border-hairline shadow-raised` (`p-6`, `rounded-xl`) |
| Section headings inside work | `text-body font-semibold` |
| Internal section break | hairline `Separator` / `bg-hairline` rule, not a nested Card |
| Attendance mark | `SegmentedControl` + `SegmentedControlItem` size default |
| Next listing choice | same `SegmentedControl` |
| Purpose | `Field` + `FieldLabel` + `Select` |
| Next date | `Field` + `FieldLabel` + `DatePicker` |
| Direction body | `Field` + `FieldLabel` + `Textarea` |
| Add direction | `Button variant="outline"` + `PlusIcon` opening `DropdownMenu` of types. Empty: **Add direction**. With a list: **Add another direction**. |
| Remove direction | `Button variant="ghost"` with visible label Remove |
| Empty directions | `Empty` + title + description ("one or more") + `EmptyContent` with the add button |
| Document body | `text-body` prose in the panel; generated paragraphs in
  `text-muted-foreground` until the matching left control has a value,
  then `text-foreground` |
| Preview | `Dialog` + `DialogHeader` / `DialogTitle` / `DialogDescription` |
| Footer | sticky `bg-card border-t border-hairline`; `Button` ghost / outline /
  default |
| Missing listing | `Empty` with Back to today's hearings |
| Live save | `aria-live="polite"` on a visually-hidden or caption status |

No new primitive. Direction wells are `bg-surface-sunken rounded-lg p-4`
inside the work panel (ui-craft well: fill, no border, inside a panel).

---

## 9. Spacing

Ladder only: `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.

- Page: `p-6 md:p-8`, column `gap-8` (section break between header and
  panels, and between the two columns).
- Panels: `p-6`, `rounded-xl`, `gap-8` between the three work sections.
- Related stacks (a row of name + segment, a field + its control): `gap-4`.
- Tight control groups (footer buttons, segment + its row): `gap-3` / `gap-2`.
- Direction well: `p-4`, `gap-4` inside.
- Controls: `h-10`, `rounded-lg`. `DatePicker` stays the primitive's
  `w-60` unless the field is full-width — then `w-full` on the trigger
  via className, so a long translated label still fits.
- Micro steps only inside the segment pill (already in the primitive).

---

## 10. States (empty / loading / error / partial / long-label)

- **Unknown `hearingId`.** Empty: "This listing is not on the board" +
  Back to today's hearings. Do not invent a blank composer.
- **Attendance unmarked.** Valid. Preview: "Attendance has not been
  marked." once *every* row is unmarked; otherwise only the marked people
  appear in the paragraph.
- **No directions yet.** Empty in the directions section; the document
  simply has no direction paragraphs (attendance and next listing still
  render).
- **No next date chosen while "List next" is on.** Preview says
  "Next date has not been set." Do not silently omit — a missing date on
  a listed-next order is the thing to notice. Save draft still allowed
  (a draft may be incomplete). Preview still opens.
- **Long names / long language.** Cause title and party names wrap
  (`text-balance` on the h1, `whitespace-normal` on rows). Purpose
  option "For reports (to be received from forensics, ADR, etc)" already
  wraps in the cause list; the Select must too. Malayalam / Gujarati
  labels that triple in length: segment stays two short words (Present /
  Absent — product must translate; do not abbreviate in English to
  "P" / "A").
- **200% zoom.** Columns stack; footer wraps; no fixed min-width trap
  on the page. DatePicker popover is the primitive's.
- **Loading.** There is no backend. First paint is the composer with
  empty marks. No skeleton.
- **Save.** Live region: "Draft saved on this device." Nothing is
  written to a server; reload loses it. Do not pretend otherwise.
- **Dark.** Panels `bg-card`; wells `bg-surface-sunken`; no canvas tint
  (D11). SegmentedControl already has a dark selected-chip recipe.

---

## 11. Risks accepted

- **Session-only draft.** Reload loses the text. Honest for a demo with
  no backend; a real sitting would need persistence. Documented in the
  support line ("Draft") and the save announcement ("on this device").
- **Preview is not a PDF.** 1.0 users click Preview PDF. The dialog is
  the assembled text. The gap is visible; we do not fake a letterhead.
- **Job unconfirmed.** If product later says this surface *is* the
  signing step, D9–D10 have to change. Until then we do not invent a
  signature block.
- **Hearing-day type subset.** A magistrate may need a type we did not
  list. "Others" is the escape. Expanding the catalogue is a data change,
  not a layout change.

---

## 12. Open questions for product

- **What is this screen's job?** Compose-for-later-signature, or
  compose-and-issue in one sitting? (Job unconfirmed.)
- **Who logs in** to this composer — magistrate, bench clerk, both?
  Designed for a repeat court-side user during a sitting.
- **Does "No next date" need a reason** (judgment reserved, disposed,
  compounded)? Not in `docs/product/`; not invented here.
- **Is the hearing-day type catalogue the same as the case-register
  catalogue**, or a shorter sitting-only list? Proceeding with a short
  list + Others.
- **Must a next date be set before preview** when the matter is not
  being disposed? Currently a warning in the document, not a block.

---

## 13. Gaps in the DS (if any)

- **Rich-text editor** — already ds-requests #7. This screen uses
  `Textarea` until that lands. Do not file a second request.
- **`Alert` always `role="alert"`** — already ds-requests #9. Honesty
  copy is a support line, not an Alert.
- **Raised Card variant** — already ds-requests; still per-use
  `border-hairline shadow-raised`.

No new DS request from this feature.

---

## 14. Decision log

| Date | What | Who |
|---|---|---|
| 2026-09-02 | Brief opened from the 1.0 generate-order screenshot and the cause-list orders icon. Dual attendance grids, skip-checkbox, Choose item, and three-box Order text replaced by one-mark-per-person, named directions, positive next-listing, and one read-only document. Job unconfirmed. Issuing/signing out of scope. | ux-designer (user ask) |
| 2026-09-02 | Built: `/employee/hearings/[hearingId]/order`, cause-list icon wired, session-only draft, Preview dialog. No issue/sign/PDF. | ui-designer |
| 2026-09-02 | **Cause-list icon is not green until an order is passed; even then glyph + name, not colour.** Always-green rejected. Green-on-draft rejected. Same row already reserves success for the Completed chip. | ux-designer (user ask) |
| 2026-09-02 | Clarified: “this build does not issue” means Dristi does not file/sign the order — not that the DS lacks a green treatment. | ux-designer (user ask) |
| 2026-09-02 | Attendance in the document: one sentence per appearance, not a run-on paragraph. Same words; name / office / present-or-absent as hierarchy. Not a second form. | owner (selected the jammed paragraph) |
| 2026-09-02 | Absent is `text-destructive-ink` in the document and on the selected segment — word plus ink, no chip, Present stays unpainted. | owner |
| 2026-09-02 | Add direction is a button + type menu, not a Select. Empty copy says one or more; after the first, the control is **Add another direction**. The header Select read as a single choice. | owner |
