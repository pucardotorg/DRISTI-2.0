# Hearing order

Status: building
Updated: 2026-09-03 (owner layout, D16)
Source: user screenshot (1.0 generate-order screen, opened from the cause-list
orders icon) · user said this is what appears when they click the orders icon ·
second user screenshot 2026-09-03 of the **built** composer at 1232x928, with
the measured complaint that Directions sits below the fold ·
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

10. **In the built screen, the one region that takes typing is below the fold —
    and the half of the page beside it is empty.** *(2026-09-03, user: "the
    biggest problem here is that I have to scroll down to write the direction.")*
    Measured from their screenshot at 1232x928: header ends y=130; Attendance
    runs y=200 to 470 (**270px for four one-tap rows**); Next listing y=540 to
    700; the **Directions** heading lands at **y=774** and its add-affordance at
    y=817, colliding with the sticky footer at y=856. Meanwhile the document
    panel — 562px wide, half the page — ends at **y=447**, leaving ~400px of the
    lower-right quadrant blank.

    The structural fault is not the order of the sections, it is the **pairing**:
    three *bounded* regions (a roll call, a purpose, a date) were stacked above
    one *unbounded* region (free text), and the unbounded region was placed
    beside the *shortest* panel on the page. A bounded-above-unbounded stack
    always pushes the typing off screen, and it degrades with the matter: this
    listing has four appearances, but `appearancesFor` returns one row per party
    **and per counsel**, so a matter with three accused and their advocates puts
    eight rows — ~520px — above the first textarea.

    Note also that the work column orders the sections attendance -> next listing
    -> directions, while `assembleOrder` reads attendance -> directions -> next
    listing. The screen and its own document disagree about sequence.

---

## 3. Objective

- Mark each person on this listing present or absent **without being able to
  mark them both**, and see those names — not role labels — in the order text.
- Add, edit, and remove named directions as a **list of blocks**, and see
  the order assemble as **one document** — beside the work until D14, below it
  from D15 — rather than as three boxes.
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

**D5 · The assembled order is one document, read-only.** *(problems 5–6)*
*(Originally the right column; below the work from D15 — see the amendments.)*
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

*Amended 2026-09-03 (D14, superseded by D15).* ~~Paired with Directions in the
narrower 2/5 column, still sticky.~~

*Amended 2026-09-03 (D15, owner).* The document moves **below** the work, full
width, and stops being sticky — it is the check you scroll to, not a second
column. Its prose is capped at `max-w-2xl`, the measure the Preview dialog
already uses, because an order set across 1168px is not a document anyone reads.
Cost, stated plainly: the live assembly is no longer beside the typing. Watching
the words land in the order was D5's own argument for the panel. It is now a
scroll away, with Preview as the deliberate pre-commit look.

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

**D11 · Lifted panels on a white page, not a grey canvas.** The
muted-canvas exception in `FilingMain` is filing-only (owner 2026-08-26).
Employee hearings already sit on `bg-background` with one raised panel.
Internal section breaks are `gap-8` + a hairline, not a second
`shadow-raised`. *ui-craft §1.0 / §4.*

*Amended 2026-09-03 (D14, then D15).* Three sibling panels, not two:
**Attendance** | **Next listing + Directions** across the top, **Order** below.
The rule that survived both revisions is the one that mattered — sections inside
a panel are hairline breaks, never nested `shadow-raised` cards: Next listing and
Directions are two sections of one panel, split by the horizontal
`role="separator"` hairline, exactly as originally built. D14's vertical
`lg:border-l` divider is **gone**; with attendance in a panel of its own, the
`gap-8` between two lifted cards does the separating and no stroke is needed.

**D14 · Bounded facts go in a band across the top; the unbounded region gets
its own row, paired with the document.** *(problem 10)*

Row 1, full width, one panel: **Attendance** (`lg:col-span-2` of a
`lg:grid-cols-3`) and **Next listing** (`lg:col-span-1`, divided by a vertical
hairline). Both are bounded, both are the *facts of this listing*.
Row 2: **Directions** (`lg:col-span-3` of a `lg:grid-cols-5`) beside the
**Order** document (`lg:col-span-2`, sticky).

The arithmetic, against the same 1232x928 viewport that produced problem 10:
header 130 + `gap-8` + band ~288 (four rows at `py-2`, ~52px each, plus heading
and `p-6`) + `gap-8` puts the Directions heading at **y≈482**, its empty state
ending ~y=726, clear of the footer at y=856. The first direction well
(heading + `min-h-24` textarea + `p-4`) ends ~y=746. **The typing is reachable
without scrolling** — which is the whole ask.

Why a band rather than simply reordering the stack: Next listing is the narrow
region, so it costs nothing to put it beside the roll instead of under it, and
the band's height is then set by attendance alone. And because both regions in
the band are bounded, the band cannot grow the way free text grows.

*Judgment*, within RESPONSIVE §2 ("no fixed trap widths") and §4 ("stack before
splitting") and ui-craft §1.0. Standard column utilities only — no arbitrary
`grid-cols-[...]` bracket values.

Gave up: **the bench's own chronological sequence.** A magistrate calls the roll,
dictates, and only then fixes the next date — so this layout asks for the last
decision second. Taken deliberately: §138 runs on hard clocks
(`docs/product/domain/journey.md`), so the next date is the field that must not
be missed, and a bounded control in the bounded band stays above the fold
forever, where one placed after the directions migrates down the page as the
order gets longer.

Alternative rejected: **reorder the existing single column to put Directions
first.** It is the cheap fix, and it fights both the sitting (you take the roll
before you dictate) and the document's own order; worse, it relocates the scroll
onto the roll call — the fact you need *before* typing — and leaves the
lower-right quadrant just as blank.

Alternative rejected: **attendance 2-up at `lg`.** It would halve the band's
growth, but 350px per cell cannot hold a translated role caption beside a
two-segment control. Per-state long-label trap; rejected on the same ground as
D2's wrapping rule.

**D15 · Attendance is a narrow panel of its own; Next listing and Directions
share the wide one; the document goes below.** *(owner, 2026-09-03 — supersedes
D14's arrangement, keeps its diagnosis)*

Owner: "Next listing and direction should be in the same container and besides
attendance. Also, attendance can be a small container in width. And order can
show below if that make sense."

Row 1 is `lg:grid-cols-5`, `items-start`: **Attendance** as its own panel at
`lg:col-span-2` (~448px at 1232), **Next listing + Directions** as one panel at
`lg:col-span-3` (~688px), divided internally by the hairline. Row 2 is the
**document**, full width, not sticky, prose capped.

**This is better than D14, and for a reason D14 had written down as a risk it
accepted.** D14 put attendance *above* the directions, so the roll's height
pushed the typing down — §11 conceded that eight appearances would shove the
first textarea back toward the fold. Beside it, the party count stops mattering
**entirely**: attendance can run to twelve rows and the Directions heading does
not move. The risk is not mitigated, it is **gone**.

Grouping is also truer to the acts. Next listing and Directions are what the
bench *writes* — the words of the order and the date it is posted to, one act,
one container. Attendance is what the bench *marks*: bounded by the party count,
a different verb, and it does not need the width free text needs.

Arithmetic at the same 1232x928: header ends 130, panel top 162, `p-6` puts Next
listing's `h2` at 186; its segmented control and the purpose/date row carry to
~350; the hairline sits at ~382; **the Directions heading lands at y≈414 and its
content at y≈454** — against y=774 in the screen you reported, and y≈482 under
D14. The purpose/date pair goes back to `md:flex-row` side by side, since 688px
is wide enough (D14's narrow 1/3 column had forced them to re-stack at `lg`).

Attendance at ~448px holds a horizontal row: ~400px of content, ~172px of
segmented control, ~212px for the name over its role caption. That is above the
~450px threshold below which D14 rejected a narrow roll — narrower than this and
the row has to stack the control under the name, which makes the panel *taller*,
not smaller.

*Judgment, on the owner's direction.* Gave up: the live document beside the
typing (see D5). Nothing else from D14 is withdrawn — its diagnosis of problem
10 is exactly why this works.

**D16 · One work container on the left, the document on the right, and the roll
folds once it is marked.** *(owner, 2026-09-03 — supersedes D15 and D14's
arrangement; restores the original two-column composer)*

Owner: "this view doesn't make sense - bring attendance and next listing in one
container in the left side and orders in the right side. Once all the attendace
is marked the attendance section should collapse into an accordian."
Confirmed in conversation: "orders" here is the **Order document**, not the
Directions section.

Left: one panel at `lg:col-span-3` of `lg:grid-cols-5` (~688px) holding
Attendance, Next listing and Directions as three sections, split by the
horizontal `role="separator"` hairlines that were there originally. Right: the
Order document at `lg:col-span-2` (~448px), `lg:sticky lg:top-8` — back beside
the work, which restores what D5 asked for and D15 had given up.

**The fold, not the layout, buys the space.** Attendance is the one section that
is expensive in height (~208px for four rows, more per counsel) and short-lived
in relevance: it is marked once at the top of the matter, and thereafter the
document carries it. Folding it when the roll completes hands that height to the
directions. This is a better instrument than D14 and D15 both, because it does
not have to rearrange the screen to find the room — and it degrades correctly
with the party count, since a twelve-row roll folds to the same ~40px trigger.

**`Collapsible`, not `Accordion`.** The DS `Accordion`'s header is a fixed `h3`
(`AccordionPrimitive.Header`, not overridable without editing a synced
primitive). That would put the roll a level below the two sections beside it and
skip a level under the page `h1`. `Collapsible` leaves the markup to us, so the
composition is the canonical disclosure pattern — `<h2><button aria-expanded
aria-controls>` — and the three sections stay siblings. The chevron and the
folded summary are composed on the trigger. *ACCESSIBILITY: heading order.*

**Folded, it summarises rather than hides:** "All 4 present", "3 present · 1
absent", "2 of 4 marked", or "Not marked". Words, not colour — the document is
where an absence is inked (D5), and a second destructive mark in the trigger
would be the alarm fatigue ui-craft §1.4 warns about.

**Folding fires on the transition into "all marked", never on every change** —
otherwise reopening the section would slam it shut on the next click. Unmarking
someone re-arms the fold but does not reopen the section: whether to look at the
roll again is the bench's call. Implemented in the `setMark` handler rather than
an effect, which also keeps it clear of the `react-hooks/set-state-in-effect`
rule that four other files in this app already trip.

*Judgment, on the owner's direction.* Gave up: a stable resting height — the
composer now changes shape as the roll is marked (§11).

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
- **Click-to-edit from the preview** — the work panel *is* the editor.
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
- **Reordering the stack so Directions comes first** — the cheap answer to
  problem 10; D14 rejects it. It moves the scroll onto the roll call and leaves
  the blank lower-right untouched.
- **Tabs or an accordion (Attendance / Directions / Next listing)** — it would
  guarantee no scrolling, and it would hide the roll while the bench dictates,
  make the document's "Attendance has not been marked." unexplainable, and turn
  one order into three steps. D0 and D5: this is one document, not a wizard.
- **Dropping the live document altogether** — Preview already shows the same
  text, so it was tempting. Kept because watching the words assemble is the
  Objective. Under D15 it keeps its place but loses its adjacency: full width
  below the work, read on a scroll rather than out of the corner of the eye.
- **Collapsing attendance to a summary row that expands** ("4 of 4 present").
  The default state is *unmarked*, so the summary would summarise nothing, and
  it puts a click in front of the roll call.
- **A scroll area with a capped height on the attendance roll** — it would keep
  the band fixed no matter the party count, at the price of hiding parties
  behind an inner scrollbar. A roll call you cannot see all of is not a roll
  call. Accepted the growth instead — and under D15 the growth costs nothing,
  because the roll no longer sits above the typing (§11).

---

## 7. Layout & hierarchy

Revised 2026-09-03 for **D16** (owner). One work container, the document beside
it, and the roll folds when it is done.

```
┌ work  col-span-3 ────────────────┐  ┌ Order  col-span-2 ─────┐
│ ▾ Attendance   3 present · 1 abs │  │ Sunil Varghese v.      │
│    …rows, folded once all marked │  │ Anand Traders          │
│ ───────────── hairline ───────── │  │                        │
│ Next listing                     │  │ Attendance             │
│  List next | No next date        │  │  …roll of names        │
│  Purpose        Next date        │  │                        │
│ ───────────── hairline ───────── │  │ Directions             │
│ Directions                       │  │ Next listing           │
│  Add direction / wells           │  │                        │
└──────────────────────────────────┘  └────────────────────────┘
                                        lg:sticky lg:top-8
```

*Superseded, kept for the record —* **D15**: what the bench *marks* sits beside
what the bench *writes*; the document reads below both.

```
header — eyebrow · cause title · "Draft — nothing on this screen is issued."

┌ Attendance  col-span-2 ─┐ ┌ Next listing + Directions   col-span-3 ─────┐
│ name / role             │ │ Next listing                                │
│      Present | Absent   │ │  List next | No next date                   │
│ … one row per           │ │  Purpose (Select)   Next date (DatePicker)  │
│   appearance            │ │ ──────────── hairline ────────────────────  │
│ grows with the party    │ │ Directions                                  │
│ count — and pushes      │ │  Empty → Add direction                      │
│ nothing down            │ │  or wells + Add another direction           │
└─────────────────────────┘ └─────────────────────────────────────────────┘

┌ Order · full width, prose capped at max-w-2xl ───────────────────────────┐
│ read-only — the check you scroll to, not a second column                  │
└──────────────────────────────────────────────────────────────────────────┘

sticky footer — Back · (saved) · Save draft · Preview
```

**Desktop (`lg+`).** One row: `lg:grid-cols-5`, `items-start`, `gap-8` —
attendance `lg:col-span-2` (~448px at 1232), work panel `lg:col-span-3`
(~688px). `items-start` so the shorter attendance panel is not stretched to the
work panel's height. The document is a full-width sibling below, no sticky, no
column span. Standard column utilities — no arbitrary `grid-cols-[...]`.

Two side effects worth naming: the textarea gets ~610px of content width instead
of 565px, and — the one that matters — **the roll's height no longer sets where
the typing starts.** Attendance grows sideways of the work, not above it.

**Tablet (`md`) and phone.** Everything stacks in one column: attendance, next
listing, directions, document, footer. RESPONSIVE §4, stack before splitting.
The band's divider becomes the horizontal hairline it already was. Scrolling on a
phone is not the bug — problem 10 is a desktop *height* problem — so the stacked
order stays the reading order.

**Above the fold.** Desktop: the whole band **and** the directions affordance
(heading at y≈482, empty state clear of the footer). Phone: cause title +
attendance.

**Hierarchy.** Unchanged from the original: one page title
(`text-title font-semibold`, `sm:text-title-l`), section headings
`text-body font-semibold` (card-title role, ui-craft §3), one `bg-primary`
control on the view (Preview), SegmentedControl selection by weight + lift and
never teal. The band carries **no panel-level title** — its two `h2`s are the
labels, and a third heading level over them would be a rung nobody needs.

**Focus order.** Header → attendance rows (name then segment) → next listing
(choice, purpose, date) → directions (each well, then Add another) → Back →
Save draft → Preview. Unchanged by D14: the band's two sections are in DOM
order attendance-then-next-listing, so the visual left-to-right and the tab
order agree. When the list is empty, add is the empty state's action.

---

## 8. Components (DS name → region)

| Region | DS primitive |
|---|---|
| Page title | `h1` `text-title font-semibold` |
| Eyebrow / support | `text-caption` / `text-body text-muted-foreground` |
| Listing band / Directions panel / document panel | `Card` + `border-hairline shadow-raised` (`p-6`, `rounded-xl`) — three panels since D14 |
| Section headings inside a panel | `text-body font-semibold` |
| Internal section break | hairline `Separator` / `bg-hairline` rule, not a nested Card. **Horizontal** between attendance rows and when the band stacks; **vertical** (`lg:border-l border-hairline lg:pl-8`) between the band's two sections at `lg` |
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

- Page: `p-6 md:p-8`, `gap-8` between header, the work row, and the document —
  and `gap-8` between the two panels of the row (D15).
- Panels: `p-6`, `rounded-xl`. `gap-8` between the work panel's two sections,
  either side of the `role="separator"` hairline. No vertical divider — D14's
  `lg:border-l` is gone with the band (D11).
- Attendance rows: `py-2` (was `py-3`) with the row content at `min-h-10` so the
  `h-10` segmented control still owns the touch target — RESPONSIVE §3's 40px
  floor is the constraint, and `py-2` is the tightest rung that respects it.
  ~52px per row instead of ~65px: 4 appearances cost ~208px, not ~270px.
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
- **Many appearances.** `appearancesFor` emits a row per party *and per
  counsel*, so the attendance panel grows with the matter — and under D15 that
  costs the directions **nothing**, because the roll is beside the typing, not
  above it. A twelve-row roll leaves the Directions heading exactly where a
  four-row roll does. The attendance panel simply becomes the taller of the two
  cards; `items-start` means the work panel does not stretch to match.
- **Long names / long role captions in the narrow panel.** At ~448px the row has
  ~212px for the name over its caption beside a ~172px segmented control. A
  translated caption ("Advocate for the complainant" in Malayalam) wraps to two
  lines and the row grows to ~68px. Acceptable — the panel is allowed to be tall.
  Below `sm` the row already stacks the control under the name.
- **Several directions / long direction text.** The work panel grows and the page
  scrolls; the document below grows with it. Nothing is sticky, so the check is a
  scroll or the Preview dialog.
- **200% zoom.** A 1232px window at 200% is a 616px CSS viewport, below `lg`, so
  the band and the work row both stack — the same single column as a phone, and
  no fixed min-width trap. Footer wraps. DatePicker popover is the primitive's.
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
- ~~**The band grows with the party count.**~~ **Resolved by D15**
  (2026-09-03). Kept in the record because it is why the layout changed twice:
  D14 accepted that a long roll would push the first textarea toward the fold.
  Putting attendance *beside* the work instead of above it removes the coupling
  outright — the party count no longer affects where Directions starts.
- ~~**The live document is no longer beside the typing.**~~ **Resolved by D16**
  — the document is back in the right column, sticky. Kept in the record because
  it was the stated cost of D15.
- **The composer changes shape as the roll is marked** (D16). Marking the last
  appearance folds ~208px out from under the pointer. Mitigated: the trigger
  keeps the tally, reopening is one click, and it re-arms only after an unmark.
  Accepted, because the fold is what the owner asked for and the sequence it
  assumes — mark the roll, then dictate — is how a sitting runs.
- **On first paint the roll is open, so Directions still starts low** (~y=734 at
  1232x928, against 774 in the reported screen; ~y=518 once folded). The fold
  only pays out after the roll is marked. This is coherent — attendance *is* the
  first act — but a bench that wants to type a direction before calling the roll
  still scrolls. See the open recommendation in §12.
- **The work order and the document order disagree.** The band asks attendance →
  next listing; `assembleOrder` reads attendance → directions → next listing.
  Accepted: the band is *the facts of this listing*, the document reads as a
  court order reads, and forcing either to match the other costs more than the
  mismatch. Named in problem 10 so it is not mistaken for an oversight.
- **The next date is asked before the directions are written.** Against the
  bench's chronology, and deliberately so (D14) — the deadline-bearing field
  stays above the fold instead of migrating down as the order lengthens.

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
- **Should Next listing sit *below* Directions rather than above it?**
  (Raised 2026-09-03, not decided.) It would put Directions at ~y=290 folded and
  ~y=506 expanded — the typing above the fold in *both* states, not just after
  the roll is marked — and it would match the document's own order (attendance →
  directions → next listing), closing the sequence mismatch named in problem 10.
  Against it: D14's argument that the deadline-bearing next date should not
  migrate down the page as the order lengthens (§138 hard clocks). Owner's call;
  the current build keeps Next listing above Directions as specified.

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
| 2026-09-03 | **D16 (owner): one work container (Attendance / Next listing / Directions) at `lg:col-span-3`, the Order document back beside it at `lg:col-span-2`, sticky. Attendance folds once every appearance is marked.** Supersedes D15 and D14's arrangement. Composed with `Collapsible`, not `Accordion` — the latter's fixed `h3` header would skip a heading level. Folded trigger carries a tally ("3 present · 1 absent"); fold fires on the transition into all-marked, in the handler not an effect. Resolves D15's cost (document no longer beside the typing). Flagged: on first paint the roll is open, so Directions starts at ~y=734 until it folds to ~y=518 — open recommendation in §12 to move Next listing below Directions. Gates + typecheck pass; markup verified in the served DOM, fold behaviour not browser-verified. | owner (direction) + ui-designer (build) |
| 2026-09-03 | **D15 (owner): Attendance is its own narrow panel (`lg:col-span-2`); Next listing + Directions share the wide panel (`lg:col-span-3`); the Order document moves full-width below, unsticky, prose capped at `max-w-2xl`.** Supersedes D14's arrangement but keeps its diagnosis. Directions heading y≈774 -> y≈414. **Resolves the party-count risk D14 had accepted** — the roll is beside the typing, so appearance count no longer moves the textarea. D14's vertical divider dropped; purpose/date back to `md:flex-row`. Gave up the live document beside the work (D5). Gates + typecheck pass; verified against the served DOM. | owner (direction) + ui-designer (build) |
| 2026-09-03 | Built D14: `ListingBand` (attendance `lg:col-span-2` + next listing with a divider that turns vertical at `lg`), Directions and Order as siblings of a `lg:grid-cols-5` row at 3/2. `PANEL` reduced to the surface recipe so each panel owns its inner layout. Attendance rows `py-3` -> `py-2` on a `min-h-10` floor. Purpose/date pair `md:flex-row lg:flex-col`. Band cells stretch (no `items-start`) so the vertical rule is full height; the work row keeps `items-start` so the document can stick. Gates + typecheck pass; verified against the served DOM. | ui-designer |
| 2026-09-03 | **Problem 10 + D14: bounded facts band on top, Directions paired with the document below.** User reported having to scroll to write a direction. Diagnosed as a pairing fault — three bounded regions stacked above one unbounded one, and the unbounded one placed beside the page's shortest panel. Directions heading moves from y≈774 to y≈482 at 1232x928. D11 amended (three panels, band divider vertical at `lg`); D5 amended (document takes the 2/5 column, still read-only and sticky). Rejected: reorder-only, tabs/accordion, dropping the live document, collapsing the roll, capping the roll with an inner scroll. Gave up the bench's chronological sequence for the next date. | ux-designer (user report) |
