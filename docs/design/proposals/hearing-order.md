# Hearing order

Status: building — **the shipped screen is the reference's four regions; D24
(order items) built 2026-09-09**
Updated: 2026-09-09 (D24: choosing the item is what writes the order)
Source: user screenshot (1.0 generate-order screen, opened from the cause-list
orders icon) · user said this is what appears when they click the orders icon ·
second user screenshot 2026-09-03 of the **built** composer at 1232x928 ·
**third and fourth screenshots 2026-09-06 — the shipped D16 screen at ~1512x923
and the 1.0 composer again, with the owner's report below (§2, problems 11–14)** ·
**four more screenshots 2026-09-09 — the 1.0 composer as the *typist* works it,
three of them its Order items catalogue open (§2, problem 15)** ·
docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md (bench clerk keeps the **order sheet**;
stenographer records **dictation**) · docs/product/domain/practice-notes.md
(`hr-judgment-writer-2026-06` — judgments are produced by dictation) ·
docs/product/open-questions.md · docs/product/standards/adherence.md ·
apps/dristi-app `lib/employee/court-role.ts` + `content.ts` (the bench-clerk and
typist seats), `lib/cases/orders.ts` (`ORDER_TYPES`, `ORDER_CLASSES` — the
catalogue D24 restates), `lib/employee/hearings.ts` (`canDraftOrder`),
`lib/employee/hearing-session.ts`, `components/employee/sign-order-dialog.tsx`
(`OrderFacsimile` — an order is numbered paragraphs on `bg-paper`)
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system` in `.git/config`, pin e0cadea6b9d4 per
`ds.lock.json`) — `AGENTS.md`, `ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations
`laws` / `typography` / `spacing` / `colors` (the `paper` family and its
"never app chrome" rule) / `elevation` / `icons`; catalog
card · field · segmented-control · select · date-picker · textarea ·
collapsible · toggle-group · button · dialog · empty · alert · badge.

---

## 1. Context

**Ask (2026-09-02):** the generate-order screen that opens from the cause-list
orders icon is poorly designed. Review it, redesign the experience, then build.

**Ask (2026-09-06, owner, on the shipped D16 screen):** *"we need to fix this
screen — if we have attendance in an accordian, it still doesn't help. […] Today
we don't have the option move to the next hearing as well. Also the text box
doesn't have the edit option like we see in the second screenshot. But more
importantly, we need to fix this screen."*

Three things in that, and they are not equal. Two are missing affordances
(advance, formatting). The third — *the accordion still doesn't help* — is a
report that D16's instrument did not work, and it is the one this revision is
built around.

**Where it sits.** Court-side, under Hearings. Today's cause list
(`/employee/hearings`) has an Orders column: a `file-plus` icon per listing.
The composer is a page at `/employee/hearings/[hearingId]/order`.

**Confirmed from the code, and it matters more than it looks.**
`canDraftOrder(status)` is `ongoing || completed` (`lib/employee/hearings.ts`).
**The composer is only reachable from inside a sitting** — the bench has called
this matter, and `hearing-session.ts` holds exactly one `ongoingId` because "the
bench hears one cause at a time." So this is not a form someone fills at a desk.
It is the screen that is open while a matter is being heard, on a board of 23,
paginated ten at a time. Everything in §5 follows from that.

*Amended 2026-09-09 (D25).* That is the gate for a seat that calls the matter. The
typist's cause list has no session controls at all, so there the gate is
`canTypeOrder(status)` — `scheduled` as well — and **the trip into the composer is
the sitting**: the row is marked heard on the way in (`hearings-screen.tsx`). The
composer is still only ever opened from inside one listing's sitting; which press
starts that sitting is what changed.

**Attributed fact (owner, 2026-09-06):** advancing from this screen to the next
matter on the board is expected of it. That is a statement about what the bench
does with the screen; it is **not** a statement of the screen's Job (§4), and it
is not treated as one.

**Neighbours this is not.** The advocate-side case register (`CaseOrders`) is the
*issued* record of a case. The rail's **Sign orders** row is a signing queue —
built, and it is downstream of this screen: `sign-order-dialog.tsx` renders an
order as numbered paragraphs on `bg-paper`. **That is the same artefact this
composer produces**, which is why §5 D19 and D21 exist.

**In scope:** compose the order of this listing — who appeared, the directions,
whether and when it is listed next — as a draft the bench can read back as a
document; preview it; move on to the next matter on the board.

**Out of scope:** issuing, e-signing, PDF generation as a court record, writing
back to CIS / the case file. Same honesty bargain as Start / End hearing and bulk
reschedule: the work up to the commitment is live; the commitment is not
performed.

**Who logs in** is unanswered (`open-questions.md`). The employee area currently
runs as the JMFC magistrate (`content.ts`). Domain actors who touch an order
sheet: the magistrate who passes it, the bench clerk who *keeps* it
(`domain/actors.md`). Design for a professional repeat user during a sitting
(throughput, keyboard, density) — the more constrained of the two court-side
roles that would sit here — and flag that as an assumption.

---

## 2. Problem

Numbered so decisions can cite them. Problems 1–9 come from the 1.0 screenshot;
10–14 from the screens we built.

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
   sandwiched between them.

   *Re-read 2026-09-06 (D17).* We called this a broken contract — "left fills,
   right reads" — and built the opposite. That was the wrong reading. 1.0's
   right column is not a broken preview; it is **the order, with the part you
   write left writable**, wrapped in read-only boxes because 1.0 could not
   assemble prose. The defect is the boxes and the `execCommand` toolbar, not
   the decision to put the writing in the document. See D17.

6. **The document is three boxes, not one order.** A court order is one text.
   The screen presents it as Attendance / Item text / Next hearing as if they
   were separate artefacts. *(Still true of 1.0, and still the fault D17 fixes —
   by making them one object rather than by making them one column of prose
   beside a form.)*

7. **No case context beyond the cause title.** No item number, case number,
   today's purpose, or that this is a draft.

8. **Hierarchy is flat.** Every label is the same weight. Footer: Back as a
   link, Save as Draft as outline, Preview PDF as the one primary — so the
   strongest action is a look, and an "API" debug badge sits on the commit row.

9. **The rich-text toolbar is a local `execCommand` editor.** The DS has no
   editor primitive (`ds-requests.md` #7). Shipping that toolbar here would fork
   a primitive Dristi already regrets on affidavits. *(Still true. D19 answers
   the owner's formatting report without it.)*

10. **In the built screen, the one region that takes typing is below the fold —
    and the half of the page beside it is empty.** *(2026-09-03, user: "the
    biggest problem here is that I have to scroll down to write the direction.")*
    Measured at 1232x928: header ends y=130; Attendance runs y=200 to 470
    (**270px for four one-tap rows**); Next listing y=540 to 700; the
    **Directions** heading lands at **y=774** and its add-affordance at y=817,
    colliding with the sticky footer at y=856. The document panel — 562px wide,
    half the page — ends at **y=447**, leaving ~400px of the lower-right quadrant
    blank.

    Diagnosed then as a **pairing** fault: three *bounded* regions stacked above
    one *unbounded* region, the unbounded one placed beside the page's shortest
    panel. That diagnosis was right as far as it went, and D14, D15 and D16 each
    acted on it by rearranging the same four boxes. **None held.** Problem 11 is
    why.

11. **Half the page is a mirror, and that is the fault under 10.** *(2026-09-06.)*
    The Order panel restates, in prose, what the controls beside it already say:
    the roll of sentences restates four segmented controls two feet to its left;
    each direction paragraph restates a textarea two feet to its left. It adds
    one fact of its own — the assembled shape — and it charges 448px of the
    widest, most valuable area of the screen for it.

    Measured on the shipped D16 screen at ~1512x923: the Order panel runs y≈222
    to y≈500 and then **~360px of blank white** to the footer at y≈860. In its
    default state it reads *"Attendance has not been marked. / Next date has not
    been set."* — **half the screen, on arrival, spent telling the bench what it
    already knows it has not done yet.**

    So the composer has one column of work and one column of nothing, and the
    work column therefore has to carry four acts in a 638px-tall band. That is
    why the typing is always last, and why every rearrangement of the work
    column bought thirty pixels and lost them again on the next revision. The
    lever is not the order of the boxes; it is that **there are four boxes for
    three acts, and one of them is a copy.**

12. **D16's fold pays out only after the work it was meant to make room for.**
    *(2026-09-06, owner: "if we have attendance in an accordian, it still doesn't
    help.")* The roll folds on the transition into *all marked*. The screen's
    default state is **unmarked**, so on arrival the bench sees exactly what it
    saw before D16: three stacked sections, Directions at y≈815, its add
    affordance cut off by the footer at y≈860.

    §6 of this brief had already rejected "collapsing attendance to a summary
    row that expands" because *"the default state is unmarked, so the summary
    would summarise nothing."* D16 shipped the same mechanism with the polarity
    reversed and inherited the identical defect: a disclosure that is open when
    you need the space and closed when you no longer do. The brief knew, and the
    build went the other way. That contradiction is settled in D17.

13. **There is no way to move to the next matter, and the sitting is 23 matters
    long.** *(2026-09-06, owner: "Today we don't have the option move to the next
    hearing as well.")* 1.0 has a teal `Next Hearing →` top-right. We have the
    trail and the rail.

    Counted against the real model: to go from item 1 to item 2 the bench leaves
    the composer, finds item 1's row on a paginated list, presses **End hearing**,
    finds item 2's row, presses **Start hearing** (which navigates to the case
    overview), returns to the cause list, and presses the orders icon. **Five
    acts and three page loads to advance one item, twenty-two times.** The screen
    that is open during a sitting has no way to finish the item it is open for.

14. **The composer and the signing queue disagree about what an order looks
    like.** *(2026-09-06, owner: "the text box doesn't have the edit option like
    we see in the second screenshot.")* The owner pointed at 1.0's toolbar. The
    evidenced defect underneath it is narrower and worse:
    `components/employee/sign-order-dialog.tsx` → `OrderFacsimile` renders an
    order as `<ol className="list-decimal">` — **numbered paragraphs on
    `bg-paper`**. Our composer renders directions as unnumbered prose on
    `bg-card`. Same court side, same artefact, two shapes, three screens apart —
    the exact failure D12 was written to prevent. The directions are *already* a
    list of blocks in our data model (D4); we simply are not numbering them.

15. **The one region the typist actually works is not on our screen.**
    *(2026-09-09, owner: four screenshots of the 1.0 composer "as it looks for the
    typist", three of them the item catalogue open.)* The reference's left column has
    four regions; ours had three. The missing one is **Order items** — the catalogue
    of seventeen orders a court can pass on a hearing day, an order that can carry
    more than one of them, and item text that writes itself from the one you pick.

    Underneath the missing control was a missing model. Our composer offered one
    blank editor called Item text, so an order could hold exactly one item however
    many the court passed; nothing on the screen said *what kind* of order this was;
    and the words had to be typed from nothing every time. That last one is the
    fault, because the seat this screen was handed on 2026-09-07 is the **typist**
    (`content.ts`, `court-role.ts`), and a typist is not composing a direction — they
    are setting down an order the court already made, from the court's own standing
    form. A blank editor asks the wrong question of that seat, twenty-three times a
    sitting.

    Missing from the Order text column with it: the **next-hearing recital**. The
    reference prints three regions there — Attendance, Item Text, Next Hearing — and
    ours printed two, so the sentence that closes the order could only be read by
    opening Preview.

    *Resolved 2026-09-09 by D24.*

---

## 3. Objective

- Mark each person on this listing present or absent **without being able to
  mark them both**, and see those names — not role labels — in the order text.
- **Write the order into the order.** The bench should reach the first typing
  affordance without scrolling, on arrival, before anything has been marked —
  and that position must not move when a matter has twelve appearances instead
  of four.
- Numbered directions, matching the way the signing queue already prints an
  order.
- Schedule the next listing as a positive choice (date + purpose), or clearly
  choose not to; the unused fields recede.
- **Finish the item and call the next one from here**, without the draft dying
  in transit and without claiming anything the build does not do.
- Preview the assembled text as paper. Nothing claims the court has issued it.

Provisional while Job is unconfirmed (§4): the throughput objectives assume a
repeat court-side user working a board during a sitting. If product says
otherwise, D18 is the first thing to fall.

---

## 4. Job

**Job: unconfirmed.** Product has not said what this screen is *for* beyond the
user showing the 1.0 composer and asking to improve it. Nothing in the
2026-09-06 message settles it, and none of it is coined here.

**User said (2026-09-02):** this is what appears when they click the orders icon
on the cause list.
**User said (2026-09-06):** the screen should offer a way to move to the next
hearing, and the direction text box should offer formatting.

**Candidate (hypothesis, not settled):** compose the order of this listing —
attendance, directions, next date — so it can later be signed. Do not treat
"this is a signing surface" or "this is the case's order register" as true.

Until Job is confirmed, three constraints hold without depending on a coined
purpose: the entry point (cause-list icon → composer for *this* listing), the
precondition (the matter has been called — `canDraftOrder` where the seat makes
that call, `canTypeOrder` where entering the composer *is* the call, D25), and the
honesty bound (draft and preview only).

---

## 5. Decisions

**Read this before D14–D22.** The screen that shipped on 2026-09-07 was rebuilt
region for region against the reference — the two checkbox rolls, the "Next hearing
details" block, the "Order text" column, the header bar with the advance in it, the
footer with Save as draft and Preview PDF. **That pass was never written into this
brief.** It supersedes the *arrangement* D14–D18 argued over (segmented controls, the
eyebrow header, directions typed into the document as prose); their *arguments* stay
on the record, and they are why several of the reference's own defects (problems 1, 4,
6) are still absent from our build. §7's diagram is D17's, not the screen's — see the
note there. D23 and D24 are written against the screen as it actually stands.

**D0 · Do not polish 1.0.** The dual grids, the skip-checkbox, the empty
"Choose item" row, and the three-box "Order text" are the problem, not a skin on
top of them. *Judgment.* Gave up: a faster visual-only pass.

**D1 · One mark per appearance, not two lists.** *(problem 1)* Each appearance is
a row: name + role caption, and a `SegmentedControl` Present | Absent. Unmarked
is valid. Cannot be both. Rule: SegmentedControl is the DS primitive for a small
exclusive set. Alternative rejected: checkboxes with the opposite disabled —
still two questions for one fact.

**D2 · Names from this listing.** *(problem 2)* Rows are built from the hearing:
complainant, each complainant counsel, accused, each accused counsel. A side with
no vakalat has no advocate row. Role is the caption under the name. Long
corporate names wrap; the segment stays `w-fit` and never shrinks below 40px.
*Judgment, from the cause-list data the screen already has.*

**D3 · Next listing is a positive choice.** *(problem 3)* A `SegmentedControl`:
"List next" (default) | "No next date". When listing: Purpose (`Select` of
`COURT_HEARING_PURPOSES`) and Next date (`DatePicker`), both with visible
`FieldLabel`. When not: unmounted, not disabled-in-place. Sentence case (Laws).

**D4 · Directions are a list of named blocks.** *(problem 4)* The section is
**Directions**, not "Order items". Add is an outline `Button` with `PlusIcon`
opening a `DropdownMenu` of hearing-day types — an action, not a field.
Catalogue: notice, summons, warrant, proclamation, interim compensation, cost,
bail, production of documents, others. Each block is a well: type as title,
`Textarea` for the court's words, Remove as a visible `ghost` button (not
hover-only — ACCESSIBILITY §7). No Edit link: the textarea *is* the edit.
Scheduling types are not in this catalogue — next date is D3.

Alternative rejected (shipped, then reversed 2026-09-02): a `Select` with
placeholder "Add direction" in the section header. It read as picking the one
type for this sitting.

*Amended 2026-09-06 (D19).* The block is now **numbered** — paragraph *n* of the
order — and it lives inside the document (D17), not in a form beside it.

**D5 · ~~The assembled order is one document, read-only.~~ The assembled order is
one document, and it is where the bench writes.** *(problems 5–6, 11)*

*What stands.* One panel titled **Order**. It renders as prose: heading (cause
title + case number), attendance as a **roll of sentences** (name medium, office
muted, present in body colour, **absent in `text-destructive-ink`** so a miss
scans without a chip; the words still carry the fact), the directions, the
next-listing sentence. Not a `DescriptionList`, not chips, not a second
attendance form. Absent uses the same ink on the left-hand segment.

*What is withdrawn 2026-09-06 (D17).* ~~Read-only. The only free-text edit is the
direction textarea on the left. Alternative rejected: keep Item text as a rich
editor on the right — that is the contract-break.~~ **That was wrong, and it is
the root of problem 11.** A read-only assembly of the controls beside it is a
mirror; it costs half the page and returns one fact. See D17 for the reversal and
its cost.

*Amended 2026-09-03 (D14, superseded by D15).* ~~Paired with Directions in the
narrower 2/5 column, still sticky.~~
*Amended 2026-09-03 (D15, superseded by D16).* ~~Full width below the work,
unsticky, prose capped at `max-w-2xl`.~~
*Amended 2026-09-03 (D16, superseded by D17).* ~~Back in the right column at
`lg:col-span-2`, sticky.~~

**D6 · ~~No rich-text toolbar.~~ No marks; structure yes.** *(problem 9,
amended 2026-09-06 by D19)*

*What stands, and now on better evidence than before:* **no toolbar, no bold,
no italic, no alignment, no `execCommand`.** The original reason was thin —
"plain paragraphs are enough for a day-order" is taste dressed as a rule. The
real reason is that neither place this app prints an order uses a mark:
`OrderFacsimile` (`sign-order-dialog.tsx`) is numbered paragraphs and a dated
signature line; `LastHearingPanel`'s "Order of the day" is a paragraph. No
product doc asks for emphasis inside a judicial direction, and inventing one to
match a 1.0 toolbar would be exactly the invention `CLAUDE.md` forbids. The gap
remains ds-requests #7.

*What is withdrawn:* ~~"Plain paragraphs are enough."~~ They are not. See D19 —
numbering is a property of the artefact, and we were the only screen in this app
not honouring it.

**D7 · Full page, not a sheet or dialog.** A document needs a page. Route:
`/employee/hearings/[hearingId]/order`. RESPONSIVE: overlays are for focused
tasks; this is the task. Alternative rejected: Sheet from the row — cramped for
the document, and it would hide the cause list without replacing it.

**D8 · Page chrome names the listing.** *(problem 7)* Eyebrow: "Order · item {n}
· {case number} · {today's purpose}". Title: the cause title. Support line:
"Draft — nothing on this screen is issued." Sentence case. No status Badge for
draft (the word is in the support line).

**D9 · ~~One primary: Preview.~~ One primary: the advance.** *(problem 8,
amended 2026-09-06 by D18 and D20)*

*What stands.* Footer, sticky, `bg-card` with `border-hairline` top — the
bulk-reschedule commit bar. Exactly one `bg-primary` control on the view (Laws:
ration teal). Preview opens a `Dialog` of the same order; it is a look, not a PDF
and not a filing, and the dialog says so. No "API" badge. Issuing is not offered.

*What is withdrawn.* ~~Preview is the one teal; Save draft is the recoverable
secondary.~~ Preview is a look, and a look is not what a bench does twenty-three
times in a sitting. The one teal goes to **Next item** (D18); Preview drops to
`outline`; **Save draft is removed entirely** (D20).

**D10 · Honesty bound, same as the rest of the court side.** Start/End hearing,
bulk reschedule, and this composer all stop before a judicial act. Preview does
not file, notify, or sign. Do not add "Submit for signature" as a disabled tease
— the Sign orders queue exists and is a different screen. **This bound survives
D18 intact**: `markHearingEnded` / `markHearingOngoing` are screen marks that
this app already makes on the cause list, and they claim nothing judicial.

**D11 · Lifted panels on a white page, not a grey canvas.** The muted-canvas
exception in `FilingMain` is filing-only (owner 2026-08-26). Sections inside a
panel are hairline breaks, never nested `shadow-raised` cards. *ui-craft §1.0 /
§4.* Under D17 the page is **two** panels, not three or four.

**~~D14 · Bounded facts go in a band across the top.~~** *(2026-09-03,
superseded by D15.)* Its arithmetic is gone; **its diagnosis is kept** and is
restated as problem 10. Its one enduring argument — that a deadline-bearing field
should not migrate down the page as the order lengthens — is answered differently
under D17 (§11).

**~~D15 · Attendance is a narrow panel of its own; the document goes below.~~**
*(2026-09-03, superseded by D16.)* **Its best argument survives and is re-adopted
by D17:** put the roll *beside* the writing rather than above it, and the party
count stops affecting where the typing starts — the risk is not mitigated, it is
gone.

**~~D16 · One work container on the left, the document on the right, and the roll
folds once it is marked.~~** *(2026-09-03; **reversed 2026-09-06** by the owner's
report and by D17.)*

The fold is removed. The owner's own words are the finding — *"if we have
attendance in an accordian, it still doesn't help"* — and problem 12 is why: it
pays out after the roll and the default state is unmarked, so it buys nothing at
the only moment the bench needs the space. This brief had already rejected the
same mechanism in §6 and shipped it anyway. That is on this brief, not on the
owner's direction.

*What is kept from D16, and it is not nothing.* Its reasoning about
`Collapsible` versus `Accordion` was correct and is worth keeping on the record:
the DS `Accordion`'s header is a fixed `h3` (`AccordionPrimitive.Header`, not
overridable without editing a synced primitive), which would skip a heading level
under the page `h1`. If any future section on this page needs disclosure, that is
the primitive. This one did not need disclosure; it needed to stop being in the
way, which is a different problem with a different answer.

**D17 · The order is the editing surface. The bench types into the document, not
into a form beside it.** *(problems 5, 6, 10, 11, 12 — 2026-09-06; supersedes
D5's read-only split, D16's arrangement and its fold)*

**This is not a fourth rearrangement, and it must not be read as one.** D14, D15
and D16 each moved the same four objects — header, work panel, document panel,
footer — around a grid, and each bought thirty pixels that the next revision gave
back. D17 removes an object. The count of panels goes from three to two; the
count of places the same sentence appears goes from two to one.

**Left column, `lg:col-span-2` (~438px at 1512 with the rail open) — *the facts of
this listing*.** One panel, two sections split by the horizontal
`role="separator"` hairline that has been there since the first build:
**Attendance** (D1, D2) then **Next listing** (D3). Both are bounded. Neither
grows with anything except the party count, and the party count now costs the
typing nothing at all, because nothing about the writing sits below them.

**Right column, `lg:col-span-3` (~657px) — *the order*.** In the sequence an
order actually reads: cause heading → the attendance roll as it will read → the
**numbered directions, typed in place** → the next-listing sentence. The
generated blocks stay generated and read-only; the direction bodies are
`Textarea` wells inside the paragraph they will become. Add and Remove sit in the
document's flow, where the paragraph goes.

**What this buys, in the numbers that produced problem 10.** At 1512x923, with
the left panel top at y≈222 and the footer at y≈860:

| | today (D16, shipped) | D17 |
|---|---|---|
| first typing affordance, on arrival (roll unmarked) | y≈815, add control cut off by the footer | **y≈450** |
| same, after the roll is marked | y≈518 (only once folded) | y≈558 |
| same, twelve appearances instead of four | y≈1230 unfolded | **y≈558** — unchanged |

The arithmetic on the right column: content top 246; the order's own header
(caption 16 + `gap-2` + cause `h2` 20 + `gap-2` + case caption 16) to 314;
`gap-8` to 346; the attendance block heading and its one pending line
("Attendance has not been marked.") to 394; `gap-8` to 426; the Directions
heading and its `gap-2` to 450. Marked, the roll is four sentences instead of one
line, which costs ~108px and puts it at 558. **There is nothing bounded above the
typing that can grow beyond that**, because the roll is the only thing above it
and the roll is the shortest form of itself the document has.

**Why this is the right shape and not just a smaller one.** A day-order is one
text. The parts of it the bench decides (who was here, when it is listed next)
are *answers*; the part the bench composes is *the order*. Splitting the answers
from the composition and then re-printing the composition beside itself is the
mirror of problem 11. Merge them and the mirror is gone, the typing is at the top
of its own column, and the sequence mismatch this brief has carried as an
accepted risk since D14 — work says attendance → next listing → directions,
`assembleOrder` says attendance → directions → next listing — **dissolves**,
because directions are no longer a peer of the other two.

**Recognition, honestly accounted.** This is 1.0's column assignment: bounded
form left, the order with the writing in it right. §5 of this brief called that a
broken contract in September and it was wrong to. What is defective in 1.0 is the
dual grids, the skip checkbox, the empty "Choose item" row, the grey read-only
boxes and the `execCommand` toolbar — every one of which D1–D4, D6 and D19 still
reject. The column assignment was the one thing 1.0 had right, and rejecting it
along with the rest cost this screen four revisions.

**Nothing is sticky except the footer.** D16 stuck the document column. A column
that now contains a growing list of textareas cannot be sticky — it would pin the
typing surface to a viewport it outgrows within two directions. The left column
is short enough not to need it. RESPONSIVE has no sanctioned sticky-column
pattern and this screen will not invent one.

*Judgment*, within RESPONSIVE §2 ("no fixed trap widths") and §4 ("stack before
splitting"), Laws ("grouped content gets a border" — two panels, hairline breaks
inside), and ui-craft §1.0 / §4. Standard column utilities only — no arbitrary
`grid-cols-[...]`.

**Gave up: the settled read beside the work.** You can no longer see the whole
order as a finished thing without also seeing the controls that make it — the
document and the editor are one object. That was D5's founding argument and it is
genuinely lost. The compensation is that **Preview now has a job** instead of
duplicating a panel three feet away: it is the one place the order appears as
paper, with no controls in it (D21). Naming it plainly — a bench that wants to
read the order back clean now clicks once, where before it turned its head.

**Alternative rejected: keep the split and shrink attendance** (dense rows, one
line per side, chips). It would buy ~120px and would break D2's long-label rule
the moment a role caption is translated. It also leaves the mirror in place, so
the next revision is the fifth.

**Alternative rejected: pre-mark every appearance Present and let the bench mark
the exceptions.** It is the obvious throughput idea, it would reduce the roll to
zero taps in the common case, and it must not be built. Defaulting a mark writes
"Anand Traders is present" into a court order that no one said. On a screen this
brief has bounded for honesty at every other turn (D10), silently authoring a
fact into the document is the worst thing on the page. Unmarked stays valid and
unmarked stays the default.

**Alternative rejected: split the screen into steps (roll → dictate → date).**
D0 and D5: this is one document, not a wizard, and a sitting is throughput work.

**D18 · The advance is the screen's one primary, it is called "Next item", and
it says what it ends.** *(problem 13 — 2026-09-06; amends D9)*

**What advancing means here, from the data and not from 1.0.**
`hearing-session.ts` holds one `ongoingId`; `markHearingOngoing` on a second
listing *returns the first to scheduled*; `canDraftOrder` needs the destination
to be `ongoing`. So a control that merely navigates would land on a locked
composer, and a control that merely called the next matter would silently
un-start this one. The only coherent act is the one a bench actually performs:
**end this listing and call the next.** Both are existing screen marks this app
already makes from the cause list. Neither files, signs, notifies, or writes a
record (D10).

**Where it sits: the footer, on the right, as the one teal.** Not top-right.
1.0 puts it there and 1.0 is not automatically right: top-right is page chrome —
scope of the *page* (ui-craft §0, and the pattern `JoinVideoCourt` and
`ViewCaseAction` already set on the two neighbouring screens) — whereas this is
the *terminal* act of the work, and it belongs at the end of the work, in the
commit bar the hand is already in when the last direction is typed. The header is
also already three lines of identification and does not need a fourth thing in
it.

**It takes the teal from Preview,** and that is the substantive change to D9.
Laws ration teal to one primary per view and say status colours are for status —
so the question is only which act is the view's. Preview is a look. Advancing is
what the screen exists to let a bench do twenty-three times before lunch. The
look yields.

**The label is "Next item", not "Next hearing".** "Next hearing" already means
something specific on this very screen — the **Next listing** section is the next
hearing *of this case*, purpose and date. One phrase carrying two meanings on one
screen is the collision `lib/employee/navigation.ts` already forbids in the other
direction (one destination must not carry two names). "Item" is the court's own
word for a row on the board and the eyebrow already uses it.

**It says what it ends, in a caption, not a dialog.** To its left:
*"Ends this hearing and calls item 4."* — the sentence pattern
`sign-order-dialog.tsx` already uses ("Signing publishes this order and cannot be
reversed"). **No confirmation dialog.** Ending a listing is not reversible in this
build (`withHearingSession`: ended listings stay completed), which is exactly the
argument for a confirm — and it is outweighed, because a modal on every one of
twenty-three items is the alarm fatigue ui-craft §1.4 names, and a confirm people
dismiss reflexively protects nothing. The consequence is carried by the label and
the caption instead, which is where this app already puts it. **Named as a risk
accepted (§11), not waved away.**

**"Next" means the next *unhandled* item — the next `scheduled` listing in item
order on today's board**, ignoring the cause list's filters and its ten-row
pagination. The board is the board. Completed items have been heard; passed-over
items were deliberately skipped and re-calling one is a decision, not a default
(`canPassOver`, `canDraftOrder`). **The caption's item number is the disclosure**
— when it reads "calls item 4" on item 2, the bench can see that 3 was skipped.
Silence there would be magic; a number is not.

**On the last unhandled item the same slot becomes "End item"**, which ends this
listing and returns to today's hearings. One slot, two states, both named for
what they do — the shape `HearingSessionButton` already uses on the cause list
for Start/End. Alternative rejected: keep the label and disable it. `aria-disabled`
with a tooltip is this app's idiom for *not part of this build*
(`ViewCaseAction`, `JoinVideoCourt`), and borrowing it for *there is no next* would
make one treatment mean two things.

*Judgment, on the owner's report, grounded in `hearing-session.ts` and
`canDraftOrder`.* Gave up: Preview's primacy, and the reassurance of a confirm
step before an irreversible session mark.

**D19 · Directions are numbered paragraphs. No toolbar.** *(problem 14 —
2026-09-06; amends D4 and D6)* — **the "no toolbar" half is superseded by D22.
The numbering half stands.**

The owner asked for the 1.0 editor. What the artefact actually requires is
narrower than that and we are already failing it: **`OrderFacsimile` prints an
order as an ordered list, and the composer prints unnumbered prose.** Two screens
in the same court-side flow, disagreeing about the shape of the same document —
the failure D12 exists to prevent.

So: each direction is **paragraph *n*** of the order. The well's heading is
"1. Notice"; the assembled document and the preview render `<ol>` with
`list-decimal`, matching `OrderFacsimile`. **No new primitive, no DS gap, no
`execCommand`** — the numbering is already in the data model as list position
(D4), and we were simply not rendering it.

**Bold, italic and alignment stay out**, on the reasoning restated in D6: no
product doc asks for emphasis inside a judicial direction, and neither of the two
places this app prints an order uses one. Answering the owner's observation means
shipping the structure an order has, not the toolbar 1.0 drew.

**Sub-items — (a), (b), (c) inside one direction — are the one thing plain text
genuinely cannot express**, and §138 directions do carry them (produce three
documents; comply on three conditions). The escape today is **a second
direction**, because our model is a list of blocks and two blocks read correctly
as two numbered paragraphs. Where that is not enough, it is a DS request and a
sharper one than #7 — see §13.

**Gave up: renumbering is destructive to cross-references.** Remove direction 3
and 4 becomes 3; a direction that says "as directed in paragraph 2" can go stale.
Accepted (§11) — the alternative, stable non-sequential ids, is not what a court
order looks like, and the document is the point.

**D20 · The draft is held for the sitting, so "Save draft" goes.** *(2026-09-06;
amends D9; a precondition for D18)*

An advance control that unmounts the composer and discards the order the bench
just dictated is not a throughput feature — it is a data-loss feature, on a
screen where the artefact is the whole point. So drafts move out of component
state into a module beside `hearing-session.ts`, keyed by hearing id.

**This is not new persistence and it does not soften D10.** It is precisely the
bargain `hearing-session.ts` already documents, for precisely the reason it
documents ("marks kept on the list would be gone by the time the bench came
back… a client module instance outlives client-side navigation inside
`/employee`. They do not survive a reload, and are not meant to"). Same lifetime,
same honesty, one more thing riding on it.

**And then Save draft has nothing to do.** A button that performs what the screen
is already doing continuously is a button that teaches the bench to distrust the
screen when they forget to press it. It goes. The footer's left caption carries
the state as standing chrome: *"Held for this sitting — a reload loses it."* In
`text-muted-foreground`, **not** `text-warning-ink`: the current copy is a
caution because it fires after an act, and a caution-coloured line present from
first paint on every visit is the alarm fatigue ui-craft §1.4 warns about
(`foundations/colors`: `*-ink` is status text, and this is standing state, not
status).

**Gave up: the reassurance of an explicit save.** A bench that expects a Save
button and does not find one has to trust a sentence instead. Named in §11.
Alternative rejected: keep Save draft as a no-op for comfort — this build does
not ship controls that lie, and the footer already had to apologise for the last
sentence that overstated what save meant.

**D21 · Preview is the paper the signing queue already uses.** *(2026-09-06)*

With the live mirror gone (D17), Preview is the only place the order appears
without controls in it — so it should appear as what it is. `DocumentPreview` +
an `OrderFacsimile`-shaped article on `bg-paper` is what
`sign-order-dialog.tsx`, `sign-form-dialog.tsx` and
`application-review-dialog.tsx` already do on this side of the app, and the
`paper` family is documented for exactly this: *"the legal-document facsimile —
the court-document preview and the e-signed PDF"* (`foundations/colors`, fixed in
both modes on purpose).

**Paper stays out of the composer itself.** The same page says *"never for app
chrome"*, and it is fixed cool-grey in both themes — a `Textarea` on it would be
a control on a non-themed surface that inverts wrongly in dark mode. The order
panel you type in is `bg-card` with `bg-surface-sunken` wells; the order you read
back is paper. That split is also what makes the preview worth opening.

The dialog still says the order has not been issued (D10). It is not a PDF and
does not offer download — `DocumentPreview`'s download slot stays unused here,
because there is no court record to download (D13's reasoning, one screen along).

**D22 · Directions take formatted text, through the app's existing editor.**
*(owner, 2026-09-06 — supersedes D19's "no toolbar" and what remained of D6)*

Owner, twice: the direction box should have the editor 1.0 shows. D19 answered the
observation with structure (numbering) and held the toolbar back; the owner
reaffirmed the ask after reading that reasoning, so the decision is theirs and it
is taken.

**The right build is not a new editor.** Dristi already ships two —
`components/filing/rich-text-editor.tsx` and `components/cases/rich-text-field.tsx`
— which is one too many, and a court-side third would be the drift D12 exists to
stop. `RichTextField` is the better of the two and is what the applications forms
use: DS chrome throughout (`InputGroup` for the bordered well and focus ring,
`ToggleGroup` for the toolbar at 40px, DS type roles in the content area), pasted
markup stripped to plain text, and a matching read-only `RichTextValueView` for the
paper. The composer takes that component unchanged. Nothing under
`components/ui` is forked and no primitive is hand-written.

**What D19 got right survives.** Directions are still numbered paragraphs; the
preview still prints them as `<ol>` on paper, matching `OrderFacsimile`. The toolbar
sits *inside* one numbered paragraph, so the two levels do not compete: the order
numbers the directions, the editor's own list controls handle sub-items **inside**
one — which is exactly the case D19 named as the thing plain text could not carry
((a), (b), (c) within a single direction) and answered by telling the bench to split
it into a second direction it was not.

**The escalation stands and gets a third caller.** `ds-requests.md` #7 already asks
for an editor primitive because both existing ones sit on `document.execCommand`,
which is deprecated. This adds a caller rather than a fix; the request is unchanged
and this brief does not restate it. That queue is shared and append-only — updating
the caller count is the owner's edit, not this brief's.

*Owner direction, over the recommendation in D19 and D6.* Gave up: the guarantee
that a court order can only hold plain sentences. Every direction is now HTML the
editor produced, so the model carries `{ html, text }` (the convention
`application-draft.ts` already follows) and "has this been written?" is measured on
`text`, never on markup. Named in §11.

Also gave up: the direction textarea's placeholder. `RichTextField` has no
placeholder — the numbered heading above it is what names the field now.

**D24 · Choosing the item is what writes the order.** *(problem 15 — 2026-09-09;
extends D4 and D19 to the catalogue, and replaces the single Item text field)*

**The catalogue is the instrument, not a label on one.** `lib/employee/order-items.ts`
holds the reference's seventeen hearing-day items, restated in the case register's own
words (**D12** — `/employee` does not import `lib/cases/orders`, and the two halves of
this app must not disagree about what a "Miscellaneous process" is; the ids match the
register's ids too, so a later slice that actually issues has one name to map and not
two). Picking one appends a numbered paragraph to the order, opened on the court's
standing words **with this listing's parties named in them**: *"Issue summons to Anand
Traders, the accused."* The reference prints the placeholder it never filled in —
*"Issue summons to Accused Details (Accused)"* — which is the tell that its text was
never wired to the listing it was opened from.

**One label is deliberately not the reference's.** The reference lists **Section 202
CrPC**; the register calls the same item **Postponement of issue of process**. The CrPC
was replaced by the BNSS on 1 July 2024 (`docs/product/sources.md`), so a control naming
a repealed section is wrong for every case filed since — and the register's name says
what the order does without citing anything. *Deviation from the reference, logged.*

**An order carries a list, not a field.** `OrderDraft.itemText` becomes
`OrderDraft.items`, and position is the paragraph number — which is how the signing
queue already prints an order (**D19**; `sign-order-dialog.tsx` → `<ol
className="list-decimal">`). A cognizance listing passes two items, the finding and the
summons that follows from it, and `order-demo.ts` now opens a completed one on both.

**Membership on the left, words on the right.** The reference's own division, and the
one thing about its layout that was always right (D17's recognition paragraph). The left
region carries the chooser and the list of what is in the order; the right column
carries one editor per item, headed "1. Summons". **Neither restates the other** — a
roster row is a name and a number, not a sentence, which is what keeps this from being
problem 11's mirror. It also repairs the reference's own defect here (problem 4): 1.0
hangs Edit and Delete off an empty select with no list of what the order already holds.

**A `Combobox`, not the reference's plain select.** Seventeen items in one unsorted list
is a list you read; this one is grouped as the register groups them (`ORDER_CLASSES`)
and takes type-ahead, so a typist who knows the word never opens the menu at all.
*Rule:* reuse before creating (AGENTS §3) — `case-applications.tsx` already composes
exactly this grouped-combobox shape, so nothing new was invented and nothing was
hand-written. Alternative rejected: the 2026-09-02 decision "button + type menu, not a
Select". That was taken against a select sitting in a section *header* with no list
beneath it, which read as picking the one type for the whole sitting; with the roster
under it, the field reads as the way in to a catalogue.

**Removing an item is neutral, not the reference's red Delete.** Nothing on this screen
is issued, so taking a paragraph out of a draft is not a destructive act, and a red
control on every row of a list the typist builds is the alarm fatigue the Laws ration
colour to avoid (ui-craft §1.4). *Deviation from the reference, logged.* Add is
`outline` for the same reason the Laws give: the view already spends its one teal on the
advance in the header — and, today, a second one on Preview PDF (§11).

**Adding an item is not writing it.** An item chosen and left blank still prints, as a
pending paragraph in the document's muted voice. The court passed it — the typist said
so by adding it — and an order that silently dropped the paragraph would be the screen
deciding which of the day's items were worth printing. `Others` opens empty on purpose:
it is the item the catalogue could not name, so there is no standing form for it.

**The next-hearing recital comes back to the Order text column**, read-only, where the
reference puts it and for the reason attendance is read-only there: it is two controls in
the column beside, and a second editable copy would let the sentence and the date
disagree.

*Judgment, on the owner's screenshots, grounded in `court-role.ts` (the typist seat) and
the register's catalogue.* **Gave up: the guarantee that every word in a Dristi order was
written by a person on the day.** The standing words are this app's own, in
`order-demo.ts`'s voice and under the same bargain — see §11 and §12.

**D12 · Employee stays self-contained.** Do not import `lib/cases/orders`.
Restate the hearing-day type labels in `lib/employee/order-draft.ts`, matching
the register's words so the two halves of the app cannot disagree about "Interim
compensation". `hearingById` lives next to `CAUSE_LIST`. *(D19 is this rule
applied in the other direction: the composer matches the signing queue's shape
because they print the same artefact.)*

**D13 · The cause-list orders icon is not green until an order is actually
passed — and even then, colour is not the signal.**

Always-green is wrong: the icon is an *action* (open the composer), not a status.
Laws: ration teal; status colours for status; AGENTS.md: status never by colour
alone. This table already keeps the ended-hearing tick muted so the Completed
chip remains the one status mark.

Idle: `file-plus` in `text-muted-foreground`. **Do not turn it green on Preview**
— that is not passing an order (D10). Not a DS gap: the blocker is that this app
does not issue, so there is no "order passed" fact to colour. When a later slice
issues, change the *glyph* (`file-plus` → document-with-check) and the accessible
name. `text-success-ink` optional and I would still leave it off.

---

## 6. What I cut (and why)

- **The dual present/absent grids** — problem 1; D1.
- **Generic role checkboxes** — problem 2; D2.
- **"Skip scheduling" as a checkbox** — problem 3; D3.
- **"Order items" / "Choose item" vocabulary** — implementation talk; D4.
- **Rich-text toolbar, bold, italic, alignment, `execCommand`** — problem 9;
  D6/D19. Numbering ships; marks do not, because no order this app prints uses
  one and no product doc asks for them.
- **PDF generation, issue, sign** — real judicial acts; D10.
- **The read-only Order mirror** — *(new, 2026-09-06)* the single largest cut in
  this brief. 448px of the widest area of the screen restating the controls
  beside it, blank for the first half of every sitting. Merged into the editing
  surface (D17) rather than moved for a fourth time.
- **The attendance fold** — *(new)* D16, reversed. It fired after the work it was
  meant to make room for; the owner reported it did not help; §6 of this brief
  had already rejected the same mechanism. Removed rather than retuned, because
  with the roll beside the writing there is no height to buy.
- **Save draft** — *(new)* D20. The draft is held continuously for the sitting,
  so an explicit save is a control that teaches distrust. The state is a caption.
- **A confirmation dialog on Next item** — *(new)* D18. Ending a listing is
  irreversible in this build, which is the argument *for* one; twenty-three
  modals in a sitting is the argument against, and it wins. The label and the
  caption carry the consequence. Logged as a risk, not as a non-issue.
- **Pre-marking every appearance Present** — *(new)* D17. It would make the roll
  nearly free and it would author a fact into a court order that nobody said.
- **`Next Hearing →` top-right, as 1.0 places it** — *(new)* D18. That slot is
  page scope on the two neighbouring screens; this is the terminal act of the
  work and belongs in the commit bar.
- **The phrase "Next hearing" for the advance control** — *(new)* D18. It already
  means the next listing *of this case*, forty pixels away.
- **Accept / Reject on pending applications, inline** — *(new)* see §12. Disposing
  of a bail or advancement application is a separate judicial act with its own
  record and its own queue in the rail. The *fact* that one is pending may belong
  here; the disposal does not.
- **`bg-paper` in the composer** — *(new)* D21. Documented as "never app chrome",
  and fixed in both modes, so a control on it breaks in dark. Paper is Preview.
- **A wizard (attendance → directions → next → preview)** — a sitting is
  throughput work; one page, two columns. Gave up: a more guided first-use path
  for an occasional user. Who-logs-in is open; we designed for the repeat
  court-side case and said so.
- **Click-to-edit from the preview** — under D17 the document *is* the editor, so
  there is nothing to jump back to.
- **Hover-only remove on a direction** — ACCESSIBILITY §7.
- **A third "Not marked" segment** — empty selection is the unmarked state.
- **Tinted `bg-muted` canvas** — filing-only exception; D11.
- **Submit for signature, even disabled** — would imply this build queues
  something; D10.
- **Standing `Alert` for the honesty line** — `Alert` is always `role="alert"`
  (ds-requests #9). The support line under the title is enough.
- **Always-green orders icon, and green-on-draft** — D13.
- **Reordering the stack so Directions comes first** — the cheap answer to
  problem 10, rejected by D14 and moot under D17.
- **Tabs or an accordion over the three sections** — it would guarantee no
  scrolling and hide the roll while the bench dictates, make the document's
  "Attendance has not been marked." unexplainable, and turn one order into three
  steps.
- **~~Collapsing attendance to a summary row that expands~~** — kept in the record
  because D16 shipped it anyway and problem 12 is the result. The original
  reasoning was right: *the default state is unmarked, so the summary would
  summarise nothing.*
- **A capped-height scroll area on the roll** — a roll call you cannot see all of
  is not a roll call. Under D17 the growth costs the typing nothing, so there is
  nothing to cap.
- **Dense / two-up attendance rows** — would buy ~120px and break D2's
  long-label rule on the first translated role caption.

---

## 7. Layout & hierarchy

**What is on the screen today (2026-09-09), left to right.** The 2026-09-07 rebuild
took the reference's regions verbatim, and D24 completed the set:

```
header bar (sticky, bg-card)   Order : Priya Menon v. Sabari Textiles   [Next hearing]

┌ Listing facts  lg:col-span-1 ┐  ┌ Order text  lg:col-span-1 ───────────────┐
│ Applications (only if any)   │  │ Attendance   [read-only Textarea]        │
│ ───────── hairline ───────── │  │                                          │
│ Mark who is present  ☐ ☐ ☐ ☐ │  │ Item text                                │
│ Mark who is absent   ☐ ☐ ☐ ☐ │  │   1. Summons  ┌ RichTextField ────────┐  │
│ ───────── hairline ───────── │  │               │ B I  1. •  ≡         │  │
│ Next hearing details         │  │               │ Issue summons to …   │  │
│   ☐ Skip scheduling…         │  │               └──────────────────────┘  │
│   Purpose      (Select)      │  │   2. Cost     ┌ RichTextField ────────┐  │
│   Next date    (DatePicker)  │  │               └──────────────────────┘  │
│ ───────── hairline ───────── │  │                                          │
│ Order items          ← D24   │  │ Next hearing [read-only Textarea]        │
│   Choose item (Combobox)     │  └──────────────────────────────────────────┘
│                  [Add item]  │
│   ┌ 1. Summons     Remove ┐  │
│   └ 2. Cost        Remove ┘  │
└──────────────────────────────┘

sticky footer                              Save as draft (outline)  Preview PDF (teal)
```

*The diagram below is **D17's**, not the screen's.* It is kept because the arguments
around it are why the build rejects the reference's dual grids, its skip-checkbox
semantics and its empty "Choose item" row — not because anything still looks like it.

Revised 2026-09-06 for **D17**. Two panels: the facts of the listing, and the
order. The bench types in the order.

```
header — eyebrow (Order · item 1 · ST/241/2026 · Evidence of complainant)
         cause title
         "Draft — nothing on this screen is issued."

┌ Listing facts  col-span-2 ──┐  ┌ Order  col-span-3 ─────────────────────────┐
│ Attendance                  │  │ Sunil Varghese v. Anand Traders            │
│   Sunil Varghese            │  │ ST/241/2026 · item 1 · Evidence            │
│   Complainant  [Pres|Abs]   │  │                                            │
│   … one row per appearance  │  │ Attendance                                 │
│   grows; moves nothing      │  │   …the roll, as it will read               │
│ ───────── hairline ──────── │  │                                            │
│ Next listing                │  │ Directions                                 │
│   [List next | No next date]│  │   1. Notice ┌ well ──────────────────┐     │
│   Purpose      (Select)     │  │             │ [Textarea]     Remove  │     │
│   Next date    (DatePicker) │  │             └────────────────────────┘     │
└─────────────────────────────┘  │   + Add another direction                  │
                                 │                                            │
                                 │ Next listing                               │
                                 │   …the sentence, or "Next date has not     │
                                 │      been set."                            │
                                 └────────────────────────────────────────────┘

sticky footer
  "Held for this sitting — a reload loses it."   Preview (outline)  Next item (teal)
  "Ends this hearing and calls item 4."
```

*Superseded, kept for the record —* **D16**: one work container left (roll folding
when marked), the read-only document right and sticky. **D15**: attendance narrow
left, next listing + directions right, document full width below. **D14**: bounded
facts in a band across the top, directions paired with the document beneath. All
three moved the same four objects; D17 removes one.

**Desktop (`lg+`).** One row: `lg:grid-cols-5`, `items-start`, `gap-8` — facts
`lg:col-span-2` (~438px at 1512 with the rail open), order `lg:col-span-3`
(~657px). `items-start` so the shorter facts panel is not stretched. Nothing
sticky but the footer (D17). Standard column utilities only.

**In the facts column, Purpose and Next date stack** rather than sitting side by
side. At ~438px each would get ~203px, and the purpose option "For reports (to be
received from forensics, ADR, etc)" — which already wraps in the cause list —
would truncate in a `SelectTrigger` that narrow. `md:flex-row` comes off; the
pair is a `flex-col gap-4`. The column is allowed to be tall.

**Tablet (`md`) and phone.** Everything stacks in one column: attendance, next
listing, the order (with its typing), footer. RESPONSIVE §4, stack before
splitting. The reading order follows the acts — mark the roll, fix the date, write
the order — so the stacked order is the reading order and stays as is. Problem 10
is a desktop *height* problem; scrolling on a phone is not the bug.

**Above the fold.** Desktop, on arrival with nothing marked: the whole facts
column and **the add-direction affordance at y≈450**, ~410px clear of the footer.
Phone: cause title + the first appearance row.

**Hierarchy.** One page title (`text-title font-semibold`, `sm:text-title-l`).
Section headings `text-body font-semibold` (card-title role, ui-craft §3). One
`bg-primary` control on the view — **Next item** (D18). SegmentedControl selection
by weight + lift, never teal.

**Heading order** (ACCESSIBILITY, and the reason D16 chose `Collapsible` over
`Accordion`): page `h1` → `h2` Attendance, `h2` Next listing in the facts panel;
`h2` the cause title in the order panel, `h3` per order block (Attendance /
Directions / Next listing), `h4` per numbered direction ("1. Notice"). No level is
skipped and the two panels are siblings.

**Focus order.** Header → attendance rows (name then segment) → next listing
(choice, purpose, date) → the order's directions (each textarea, then Remove,
then Add another) → Preview → Next item. Visual left-to-right and tab order agree.

---

## 8. Components (DS name → region)

| Region | DS primitive |
|---|---|
| Page title | `h1` `text-title font-semibold` |
| Eyebrow / support | `text-caption` / `text-body text-muted-foreground` |
| Facts panel · Order panel | `Card` + `border-hairline shadow-raised` (`p-6`, `rounded-xl`) — **two panels under D17**, not three |
| Section headings inside a panel | `text-body font-semibold` |
| Internal section break | horizontal hairline `role="separator"` between Attendance and Next listing. No vertical divider — `gap-8` between two lifted cards does the separating (D11) |
| Attendance mark | `SegmentedControl` + `SegmentedControlItem`, size default |
| Next listing choice | same `SegmentedControl` |
| Purpose | `Field` + `FieldLabel` + `Select` (stacked above the date — §7) |
| Next date | labelled `role="group"` + `DatePicker` (the primitive owns its trigger and takes no `id`) |
| Order body | `text-body` prose in the panel; generated blocks in `text-muted-foreground` until the matching control has a value, then `text-foreground` |
| Numbered directions | `<ol className="list-decimal">` — the shape `OrderFacsimile` already uses (D19) |
| Direction body | `Field` + `FieldLabel` (sr-only) + `Textarea`, inside a `bg-surface-sunken rounded-lg p-4` well **in the order's flow** |
| Add direction | `Button variant="outline"` + `PlusIcon` opening a `DropdownMenu` of types. Empty: **Add direction**. With a list: **Add another direction**. |
| Remove direction | `Button variant="ghost"` with a visible label |
| No directions yet | `Empty` composed **without `EmptyMedia`** — description + `EmptyContent` only. An illustrated empty state in the middle of a court order reads as a bug; the document already has a muted-pending convention ("Next date has not been set.") and this follows it |
| **Item catalogue** *(D24)* | `Field` + `FieldLabel` + `Combobox` / `ComboboxInput` / `ComboboxContent` / `ComboboxGroup` + `ComboboxLabel` / `ComboboxCollection` / `ComboboxItem` / `ComboboxEmpty` — grouped and type-ahead, the same composition `case-applications.tsx` uses |
| **Add item** *(D24)* | `Button variant="outline"`, disabled until the catalogue has a value |
| **Items in the order (roster)** *(D24)* | `ol` of `bg-surface-sunken rounded-lg` rows, `min-h-10`, number in `tabular-nums`, `Button variant="ghost"` Remove with an `sr-only` suffix naming the item |
| **One item's words** *(D24)* | `RichTextField` (`components/cases/rich-text-field.tsx` — D22), labelled by the numbered heading above it, keyed on the item id so removing one does not hand its markup to the next |
| **Next-hearing recital** *(D24)* | `Field` + `FieldLabel` + read-only `Textarea`, the same treatment as Attendance |
| Preview | `Dialog` + `DocumentPreview` + an `OrderFacsimile`-shaped article on `bg-paper text-paper-foreground` (D21) |
| Footer | sticky `bg-card border-t border-hairline`; caption `text-body-compact text-muted-foreground`; `Button` outline (Preview) + default (Next item) |
| Missing listing | `Empty` with Back to today's hearings |
| Live announcements | `aria-live="polite"` on a visually-hidden status |

No new primitive. **Removed from this screen:** `Collapsible` (D16 reversed).

---

## 9. Spacing

Ladder only: `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.

- Page: `p-6 md:p-8`; `gap-8` between header and the row, and between the two
  panels of the row.
- Panels: `p-6`, `rounded-xl`. `gap-8` between the facts panel's two sections,
  either side of the `role="separator"` hairline.
- Attendance rows: `py-2` with the row content at `min-h-10` so the `h-10`
  segmented control still owns the touch target — RESPONSIVE §3's 40px floor is
  the constraint, and `py-2` is the tightest rung that respects it. ~52px per row.
- Order panel: `gap-8` between blocks (heading + body), `gap-2` inside a block,
  `gap-3` between roll sentences, `gap-4` between numbered directions.
- Direction well: `p-4`, `gap-4` inside.
- Related stacks (a field + its control, Purpose above Next date): `gap-4`.
- Footer: `gap-3` between the two buttons; the caption takes `sm:mr-auto`.
- Controls: `h-10`, `rounded-lg`. `DatePicker` and `SelectTrigger` are `w-full`
  in the facts column, so a long translated label still fits.
- Micro steps only inside the segment pill (already in the primitive).

---

## 10. States (empty / loading / error / partial / long-label)

- **Unknown `hearingId`.** `Empty`: "This listing is not on the board" + Back to
  today's hearings. Do not invent a blank composer.
- **Attendance unmarked.** Valid, and it is the arrival state. The order shows
  one muted line, "Attendance has not been marked." — which is why the
  add-direction control is at y≈450 on arrival (D17).
- **Attendance partly marked.** Only the marked people appear in the roll; the
  block stays muted until every appearance is marked.
- **No directions yet.** The Directions block holds "No directions yet." and the
  add control, in the document's own muted-pending voice. No illustration (§8).
- **No next date while "List next" is on.** The order says "Next date has not
  been set." **This is now the only guard on the deadline-bearing field**, since
  the control sits below a growing roll in the facts column — and it is a better
  guard than position, because it is printed *in the artefact*, at eye level, and
  it survives into Preview. §138 runs on hard clocks
  (`docs/product/domain/journey.md`), so the miss must be visible in the order,
  not merely convenient to avoid.
- **Advancing with an incomplete order.** Permitted. A draft may be incomplete
  and a bench may pass an item without dictating. The caption still says what
  Next item ends.
- **The last unhandled item.** The advance slot becomes **End item** and returns
  to today's hearings (D18). There is no disabled "Next item".
- **The next unhandled item is not the next row.** The caption names its number
  ("calls item 4"), so a skipped or already-heard item is visible rather than
  silent.
- **Returning to an item already drafted.** The module holds the draft for the
  sitting (D20), so the composer opens on what was typed. A reload does not.
- **No item added.** *(D24.)* The roster says "No item has been added yet. Choose
  one and its text is written for you."; the Order text column says "The order has
  no item yet…"; the paper says "No item has been added." in its muted voice. No
  illustration — an empty-state graphic in the middle of a court order reads as a
  bug (§8).
- **An item added and then emptied.** *(D24.)* It still prints, as a pending
  paragraph — "Summons — nothing has been written." — in the muted voice. It does
  not vanish: the typist said the court passed it.
- **`Others`.** *(D24.)* Opens with an empty editor. The catalogue has no standing
  form for the item it could not name, and inventing one would put a sentence in an
  order nobody chose.
- **Renumbering after a removal.** Removing item 2 renumbers 3 to 2 in the roster,
  the editors, the order and Preview, immediately; the live region says how many
  paragraphs moved up. Accepted (§11).
- **Long item labels.** "Postponement of issue of process" and "Mandatory
  submissions responses" wrap in the roster row and in the well heading; the
  catalogue's own rows are `whitespace-normal`. Nothing truncates.
- **Long names / long language.** Cause title and party names wrap
  (`text-balance` on the `h1`, `whitespace-normal` on rows). The Purpose select
  wraps. Malayalam / Gujarati labels that triple in length: the segment stays two
  short words (Present / Absent — product must translate; do not abbreviate in
  English to "P" / "A"). "Next item" and "End item" are two short words for the
  same reason.
- **Many appearances.** `appearancesFor` emits a row per party *and per counsel*,
  so the facts panel grows with the matter — and under D17 that costs the order
  **nothing**: a twelve-row roll leaves the add-direction control where a
  four-row roll does. The facts panel simply becomes the taller card;
  `items-start` means the order panel does not stretch to match. What a long roll
  *does* push down is Next listing, inside its own column — see §11.
- **Long role captions in the narrow column.** At ~438px the row has ~200px for
  the name over its caption beside a ~172px segmented control. A translated
  caption wraps to two lines and the row grows to ~68px. Acceptable. Below `sm`
  the row already stacks the control under the name.
- **Several directions / long direction text.** The order panel grows and the
  page scrolls. Nothing is sticky (D17), so the settled read is Preview.
- **200% zoom.** A 1512px window at 200% is a 756px CSS viewport, below `lg`, so
  both columns stack — the same single column as a phone, no fixed min-width
  trap. Footer wraps. DatePicker popover is the primitive's.
- **Loading.** There is no backend. First paint is the composer with empty marks.
  No skeleton.
- **Dark.** Panels `bg-card`; wells `bg-surface-sunken`; no canvas tint (D11).
  Paper appears only in Preview and is fixed in both modes by design
  (`foundations/colors`). SegmentedControl already has a dark selected-chip
  recipe.

---

## 11. Risks accepted

- **Session-only draft.** Reload loses the text. Honest for a demo with no
  backend, and now load-bearing for D18 — the module keeps it alive across an
  advance, not across a refresh. Stated in the footer caption.
- **No explicit save.** *(new, D20.)* A bench that expects a Save button has to
  trust a sentence instead. Accepted: a save control that duplicates continuous
  behaviour teaches distrust the first time someone forgets it, and this build
  does not ship controls that overstate what they do.
- **Next item ends a listing irreversibly, with no confirm step.** *(new, D18.)*
  `withHearingSession` keeps ended listings completed; there is no undo. Chosen
  over a modal because twenty-three modals in a sitting is fatigue, and a confirm
  people dismiss reflexively protects nothing. Mitigated by the label, the
  caption naming the item it calls, and the fact that the mark is a screen state
  rather than a court record (D10). **This is the single most consequential thing
  in the revision and the first thing to revisit if the build ever issues.**
- **Renumbering breaks cross-references.** *(new, D19.)* "As directed in
  paragraph 2" goes stale when paragraph 1 is removed. Accepted: stable
  non-sequential ids are not what an order looks like, and the document is the
  point.
- **The order panel is both the artefact and the form.** *(new, D17.)* There is no
  longer a controls-free view of the order on the page; that read is one click
  away in Preview. Named as the cost of removing the mirror, and the reason D21
  exists.
- **A long roll pushes Next listing down the facts column.** *(new.)* Twelve
  appearances put the date control below the fold in its own column. Accepted
  because the guard on a missed date is now printed in the order rather than
  implied by position (§10), and because the alternative — putting the next date
  above the roll — would fight the sitting's own sequence for a field the
  document already polices.
- **Preview is not a PDF.** 1.0 users click Preview PDF. Under D21 it is the
  order as paper, in a dialog, with no download — the same facsimile the signing
  queue shows. The gap is visible; we do not fake a letterhead or a signature.
- **Job unconfirmed.** If product says this surface *is* the signing step, D9,
  D10, D18 and D21 all have to change. Until then we do not invent a signature
  block.
- **The standing words are ours, not a court's.** *(new, D24, and the largest thing
  in this revision.)* No template library was given to us, so the seventeen opening
  paragraphs were written in `order-demo.ts`'s voice against
  `docs/product/domain/journey.md` and the reference's one visible sample. A typist
  could pass an order whose boilerplate no court approved. Mitigated by the fact that
  every word is editable before anything leaves the screen and that this build issues
  nothing — and it is the **first thing to replace** when product supplies the real
  forms (§12).
- **A blank in the standing words.** *(new, D24.)* Cost and witness batta ship with
  `₹____` because the amount is fixed on the day. A draft can be previewed with the
  blank still in it. Accepted: the alternative is inventing a figure, which is worse
  in a court order than an obvious gap.
- **Two teal actions on the view.** *(new, observed 2026-09-09, not changed in this
  pass.)* The header's advance and the footer's Preview PDF are both `bg-primary`,
  and an answered-in-the-strip application adds an Accept. The Laws ration teal to
  one primary per view, and **D18 already decided** that the advance takes it and
  Preview drops to `outline`; the 2026-09-07 rebuild restored the reference's footer
  instead. D24 kept its own Add item on `outline` rather than adding a third. Which
  of the two is the view's act is the owner's call, and it is one line either way.
- **Hearing-day type subset.** ~~A magistrate may need a type we did not list.~~
  **Answered 2026-09-09 (D24):** the catalogue is the reference's seventeen, which is
  a subset of the register's forty-odd. "Others" is still the escape, and expanding
  the list is a data change in `order-items.ts`.
- ~~**The band grows with the party count.**~~ **Resolved by D15's insight,
  re-adopted by D17** — the roll sits beside the writing, so the party count no
  longer moves the typing at all.
- ~~**The live document is no longer beside the typing.**~~ **Dissolved by D17** —
  the document *is* where the typing happens.
- ~~**The composer changes shape as the roll is marked.**~~ **Removed with the
  fold** (D16 reversed).
- ~~**On first paint the roll is open, so Directions still starts low.**~~
  **Resolved by D17** — the arrival state is now the *best* case (y≈450), not the
  worst.
- ~~**The work order and the document order disagree.**~~ **Dissolved by D17** —
  directions are no longer a peer of attendance and next listing, so there are no
  two sequences left to disagree.
- ~~**The next date is asked before the directions are written.**~~ **Dissolved
  by D17** — they are in different columns and neither precedes the other.

---

## 12. Open questions for product

- **What is this screen's job?** Compose-for-later-signature, or
  compose-and-issue in one sitting? (Job unconfirmed, §4.)
- **Who logs in** to this composer — magistrate, bench clerk, both? Designed for a
  repeat court-side user during a sitting, and D18 in particular assumes it.
- **Does "Next item" correctly model what a bench does between matters?** We
  inferred *end this listing, call the next scheduled one* from
  `hearing-session.ts` and `canDraftOrder`. A bench that routinely keeps two
  matters part-heard, or that ends a listing only after the order is signed,
  would need a different act. **Raised 2026-09-06; D18 proceeds on the inference
  and says so.**
- **Should a pending application on this matter be surfaced here?** 1.0 puts
  bail and advancement/reschedule applications inline at the top of the composer
  with View / Reject / Accept; we have a Review applications queue in the rail
  and the owner did not ask about this. **My read, offered and not decided:** the
  *fact* that an application is pending belongs on this screen — an advancement
  application is time-bearing under §138's clocks and a bench passing a day-order
  without knowing one exists is passing it on incomplete information — but it
  belongs as a **line in the identification header**, not a card, not a cream
  band, and **without Accept / Reject**. Disposing of an application is a
  separate judicial act with its own record, and putting a red Reject button
  above a draft order that issues nothing would be the loudest, least honest
  control on the page. Owner's call; nothing is built for it.
- **Does "No next date" need a reason** (judgment reserved, disposed,
  compounded)? Not in `docs/product/`; not invented here.
- ~~**Is the hearing-day type catalogue the same as the case-register catalogue**,
  or a shorter sitting-only list?~~ **Answered 2026-09-09 by the owner's
  screenshots:** a sitting-only list of seventeen, which is a subset of the
  register's catalogue. Built as D24; kept here because it is why
  `order-items.ts` exists rather than an import.
- **Where do the standing words for each item come from?** *(new, D24 — the open
  question this revision most needs answered.)* Every item now opens on a paragraph
  this app wrote. A court has its own forms, and a state deploys over identical
  national law with local language on top (`docs/product/national-vs-state.md`), so
  the real answer is probably a per-state template library with fields, not
  seventeen English sentences in a TypeScript file. Nothing is issued today, so this
  is safe to leave — but it is not safe to ship past.
- **Does an item need parameters of its own?** *(new, D24.)* 1.0 puts **Edit** beside
  the chosen item, which opens a form for it — which accused a summons goes to, how
  it is served. We have none: the editor is the edit (D4). That is right while the
  order is only text; it stops being right the moment the item has to *produce*
  something (a process to serve, a fee to collect).
- **Must a next date be set before preview or before advancing** when the matter
  is not being disposed? Currently a warning printed in the order, not a block.
- **Do §138 day-orders need sub-items — (a), (b), (c) — inside one direction?**
  D19 offers a second numbered direction as the escape. If the answer is yes,
  §13 is the request that follows.
- ~~**Should Next listing sit *below* Directions rather than above it?**~~
  *(Raised 2026-09-03. **Dissolved 2026-09-06 by D17** — they are no longer in the
  same column, so there is no order between them to choose. Kept because it is
  why the layout was argued about, not deleted.)*

---

## 13. Gaps in the DS (if any)

- **Rich-text editor** — already ds-requests #7, and this screen does **not** need
  it. D19 ships numbering with `<ol>` and `Textarea`; no toolbar, no gap blocking
  the build.

  **Worth sharpening #7, not duplicating it.** #7 asks for a general editor with
  a toolbar of marks. What a court order actually wants is narrower and far more
  answerable: **a structured list-of-paragraphs input** — numbered paragraphs and
  one level of nested items, and *no* marks, no alignment, no font controls. That
  is a smaller component with a clearer contract, and it is what the two Dristi
  callers (this composer and the affidavit/prayer blocks) both actually need.

  **Not filed from here.** `docs/design/ds-requests.md` is a shared, append-only
  queue that teammates edit concurrently, so this brief records the amendment and
  leaves the edit to whoever owns the entry. **No second request is opened.**
- **`Alert` always `role="alert"`** — already ds-requests #9. Honesty copy is a
  support line, not an Alert.
- **Raised Card variant** — already ds-requests #5. Still per-use
  `border-hairline shadow-raised`.

No new DS request from this feature.

---

## 14. Decision log

| Date | What | Who |
|---|---|---|
| 2026-09-09 | **D25: the typist's cause list ends at Orders, and the trip into the composer is the sitting.** Owner on the typist board: the Action column's typist wording (*To start* / *Hearing started* / *Hearing ended*) "is redundant. The last column would be orders only." It was — the Status chip two cells left already said where the matter stood, so that column reported and never acted, and the one press it did offer existed only to unlock the column beside it. Removed: the column, `hearingProgressLabel`, and the two-second start beat with it — **this retires the typist's one-control line (shipped in `d85fe6e`, never written into a decision row)**. That leaves `canDraftOrder` with nothing to open the orders column, so this seat reads new `canTypeOrder(status)` (adds `scheduled`) and `openOrder` marks the matter heard on the way in, as it already did. Both seats still close on a listing that was never heard (passed over, rescheduled, abandoned). Seven columns for the typist, eight for the bench; the table drops to 878px and stops scrolling at every laptop width. On a phone the lone glyph takes the words instead (**Open order**, outline) — no column header there to name it. Gates + typecheck + 386 tests pass; both seats verified against the served DOM. | owner (ask), ui build |
| 2026-09-09 | **D24: the item catalogue is the typist's instrument.** Owner sent four screenshots of the 1.0 composer "as it looks for the typist", three of them the Order items dropdown open — the one region of the reference our build did not have (problem 15). Built: `lib/employee/order-items.ts` with the reference's seventeen items in the case register's words and ids (D12; **Section 202 CrPC** renamed to the register's **Postponement of issue of process**, since the CrPC was replaced by the BNSS on 1 July 2024), each opening on standing words with this listing's parties named in them. `OrderDraft.itemText` became `OrderDraft.items` — a list, numbered by position, printed as the `<ol>` the signing queue already uses (D19). Chooser and roster on the left as the reference has them, one editor per item on the right, and the next-hearing recital restored to the Order text column. `Combobox` over the reference's plain select (grouped + type-ahead, the `case-applications.tsx` composition). Two logged deviations from the reference: the renamed item, and a neutral Remove instead of its red Delete. Gates + typecheck + 386 tests pass; verified against the served DOM. **Recorded as the largest risk: the standing words are this app's, not a court's.** | owner (ask), ui build |
| 2026-09-09 | Noted, not re-litigated: the **2026-09-07 region-for-region rebuild** of this screen against the reference was never written into this brief. §5 now carries a banner saying so, and §7 leads with the shipped layout rather than D17's. | ui build |
| 2026-09-07 | **D23: a completed listing opens on a written order.** Owner: once a hearing is ended, clicking the orders icon should show a dummy order filled out. Until now it opened an empty composer, which said the sitting produced nothing. `lib/employee/order-demo.ts` supplies the *opening* draft for a listing whose live status is `completed`: the whole roll marked present, every application that was pending allowed, one item paragraph per hearing purpose, and the matter posted three weeks on (off weekends) for the next purpose in the §138 progression — judgement alone posts to no date. It is the listing's starting draft and not a lock: the first edit is kept over it, and a listing dictated on during the sitting keeps its own words. Threaded through `readOrderDraft` / `updateOrderDraft` / `useOrderDraft` as one `initial` value so the read path and the write path cannot disagree; a scheduled or ongoing listing is still empty, because the point of the composer is that the bench dictates while the matter is standing there. No visible "this is demo text" mark — the whole board is demo data and the sidecar behind the case overview already fabricates past orders without one. | owner (ask), ui-designer (build) |
| 2026-09-06 | **D22: directions take formatted text, through `RichTextField`. Supersedes D19's "no toolbar" and the rest of D6.** Owner asked a second time for the editor after reading D19's reasoning; reaffirmed ask, owner's call. Built by reusing the applications forms' existing `components/cases/rich-text-field.tsx` — DS chrome (`InputGroup` + `ToggleGroup`), paste sanitised, read-only `RichTextValueView` on the paper — rather than adding a court-side third editor. Numbering from D19 kept: the order numbers the directions, the toolbar's lists handle sub-items inside one. `DirectionDraft.body` becomes `{ html, text }`; "written" is measured on `text`. `ds-requests.md` #7 (no editor primitive; both existing ones use deprecated `execCommand`) gains a third caller and is otherwise unchanged — that queue is shared, so the edit is the owner's. Lost: the plain-text guarantee, and the textarea placeholder. | owner (direction) + ui build |
| 2026-09-06 | **D17: the order is the editing surface.** Owner reported the shipped D16 screen still wrong, and that the accordion "still doesn't help". Diagnosed as problem 11 — the read-only Order panel is a *mirror* of the controls beside it, blank for the first half of every sitting, so the work column has to carry four acts in one 638px band and the typing is always last. **D5's read-only split reversed; D16's fold removed.** Two panels: facts of the listing (attendance, next listing) at `lg:col-span-2`; the order, with the directions typed into it, at `lg:col-span-3`. Nothing sticky but the footer. First typing affordance moves from y≈815 to **y≈450 on arrival**, and stops moving with the party count. Resolves the work-order/document-order mismatch and dissolves the "Next listing above or below Directions" question. Cost: no controls-free read of the order on the page — that is Preview's job now. | ux-designer (owner report) |
| 2026-09-06 | **D16 reversed.** The fold fired on the transition into *all marked* while the screen's default state is unmarked, so it bought nothing on arrival — problem 12, and the owner's own observation. §6 of this brief had already rejected the same mechanism in the opposite polarity and the build shipped it anyway; that is on the brief. `Collapsible`-over-`Accordion` reasoning kept on the record for any future disclosure on this page. | ux-designer (owner report) |
| 2026-09-06 | **D18: "Next item" is the screen's one primary.** Owner: "Today we don't have the option move to the next hearing as well." Counted at five acts and three page loads to advance one item on a 23-row board (problem 13). From `hearing-session.ts` (one `ongoingId`; starting a second returns the first to scheduled) and `canDraftOrder` (`ongoing \|\| completed`), the only coherent act is **end this listing and call the next scheduled one**. Footer right, not top-right (that slot is page scope on the neighbouring screens); takes the teal from Preview, which drops to outline — **amends D9**. Named "Next item", not "Next hearing", which already means the next listing of this case forty pixels away. Caption names the item it calls, so a skip is visible. Last item → "End item", back to the cause list. No confirm dialog; logged as the revision's largest accepted risk. | ux-designer (owner report) |
| 2026-09-06 | **D19: directions are numbered paragraphs; still no toolbar. Amends D4 and D6.** Owner asked for 1.0's editor. Evidence found instead: `sign-order-dialog.tsx` → `OrderFacsimile` already prints an order as `<ol list-decimal>` on `bg-paper`, so the composer and the signing queue disagreed about the same artefact (problem 14) — the failure D12 exists to prevent. Numbering ships with no new primitive (it is already list position in the model). Bold / italic / alignment stay out: no product doc asks for emphasis in a direction and neither place this app prints an order uses one. D6's old reason ("plain paragraphs are enough") withdrawn as taste dressed as a rule. | ux-designer (owner report) |
| 2026-09-06 | **D20: the draft is held for the sitting in a module beside `hearing-session.ts`; Save draft is cut.** Precondition for D18 — an advance that discards the dictated order is a data-loss feature. Same lifetime and same honesty as the session marks (survives client-side navigation inside `/employee`, dies on reload), which that module's own doc comment already argues for. With the draft held continuously, an explicit save is a control that teaches distrust; the footer caption carries the state in `text-muted-foreground`, not `text-warning-ink` (standing state is not a caution — ui-craft §1.4, `foundations/colors`). **Amends D9.** | ux-designer |
| 2026-09-06 | **D21: Preview is the paper facsimile the signing queue already uses** — `DocumentPreview` + `bg-paper`, matching `sign-order-dialog.tsx`. Gives Preview a job now that the live mirror is gone. Paper stays *out* of the composer: `foundations/colors` documents it as "never app chrome" and fixes it in both modes, so a `Textarea` on it breaks in dark. No download — there is no court record to download (D10, D13). | ux-designer |
| 2026-09-06 | Pending applications (1.0 shows bail / advancement inline with Accept / Reject) recorded as an **open question, not a decision** — owner did not ask. Position offered: the *fact* of a pending application may belong in the header line because §138 clocks make an advancement application time-bearing; the *disposal* belongs in the Review applications queue. Nothing built. | ux-designer |
| 2026-09-03 | **D16 (owner): one work container at `lg:col-span-3`, the Order document beside it at `lg:col-span-2`, sticky; attendance folds once every appearance is marked.** Superseded D15 and D14's arrangement. Composed with `Collapsible`, not `Accordion`. Flagged at the time: on first paint the roll is open, so Directions starts at ~y=734 until it folds. **Reversed 2026-09-06.** | owner (direction) + ui-designer (build) |
| 2026-09-03 | **D15 (owner): Attendance its own narrow panel; Next listing + Directions in the wide panel; the document full-width below, unsticky.** Superseded D14's arrangement, kept its diagnosis. Directions heading y≈774 → y≈414. Resolved the party-count risk D14 had accepted. Gave up the live document beside the work. **Superseded by D16; its core insight — roll beside the writing — re-adopted by D17.** | owner (direction) + ui-designer (build) |
| 2026-09-03 | Built D14: `ListingBand`, Directions and Order as siblings of a `lg:grid-cols-5` row at 3/2, attendance rows `py-3` → `py-2` on a `min-h-10` floor. Gates + typecheck pass; verified against the served DOM. | ui-designer |
| 2026-09-03 | **Problem 10 + D14: bounded facts band on top, Directions paired with the document below.** User reported having to scroll to write a direction. Diagnosed as a pairing fault. Rejected: reorder-only, tabs/accordion, dropping the live document, collapsing the roll, capping the roll with an inner scroll. **Superseded; the diagnosis stands and problem 11 is what it was missing.** | ux-designer (user report) |
| 2026-09-02 | Add direction is a button + type menu, not a Select. Empty copy says one or more; after the first, the control is **Add another direction**. | owner |
| 2026-09-02 | Absent is `text-destructive-ink` in the document and on the selected segment — word plus ink, no chip, Present stays unpainted. | owner |
| 2026-09-02 | Attendance in the document: one sentence per appearance, not a run-on paragraph. Same words; name / office / present-or-absent as hierarchy. | owner (selected the jammed paragraph) |
| 2026-09-02 | Clarified: "this build does not issue" means Dristi does not file/sign the order — not that the DS lacks a green treatment. | ux-designer (user ask) |
| 2026-09-02 | **Cause-list icon is not green until an order is passed; even then glyph + name, not colour.** Always-green rejected. Green-on-draft rejected. | ux-designer (user ask) |
| 2026-09-02 | Built: `/employee/hearings/[hearingId]/order`, cause-list icon wired, session-only draft, Preview dialog. No issue/sign/PDF. | ui-designer |
| 2026-09-02 | Brief opened from the 1.0 generate-order screenshot and the cause-list orders icon. Dual attendance grids, skip-checkbox, Choose item, and three-box Order text replaced by one-mark-per-person, named directions, positive next-listing, and one read-only document. Job unconfirmed. Issuing/signing out of scope. | ux-designer (user ask) |
