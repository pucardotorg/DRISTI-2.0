# Rescheduling request

Status: building
Updated: 2026-09-03
Source: docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md · docs/product/open-questions.md ·
user in this conversation (2026-09-02): three screenshots of the legacy
Rescheduling Request list and Document Submission review; “build the same
thing”; “use the same container of the table”; “if you click on any of the
cases, you will see that we have built this component in the advocate
[side] as well”
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation`, `table` / `button` / `badge` / `dialog` /
`description-list` / `empty` / `field` / `input-group` / `pagination` /
`textarea` / `separator` / `item`

Code read: `apps/dristi-app/src/components/employee/register-cases-screen.tsx`,
`register-cases-table.tsx`, `schedule-screen.tsx`, `list-footer.tsx`,
`lib/employee/navigation.ts`, `lib/employee/content.ts`; advocate-side
`components/cases/document-record-dialog.tsx` (preview + comments),
`generated-application-dialog.tsx` (paper facsimile),
`document-preview.tsx` (the one preview well),
`lib/cases/application-document.ts` (advancement/reschedule composition),
`lib/cases/application-draft.ts` and `application-type-fields.tsx`
(the filer's fields this review is looking at)

---

## 1. Context

**Where this sits.** Rescheduling request is the first row in the rail's
**Review applications** group, next to Delay condonation and Others. The
row already exists (`navigation.ts`) with a transcribed count of 20 and
no `href`. Hearings, Schedule hearing, Bulk reschedule, and Register
cases already share one furniture: page title on the page, **one** lifted
panel (`rounded-xl border-hairline bg-card shadow-raised p-6`) holding
filters, table and `ListFooter`. This screen is the next queue down that
group of work.

**The reference (screenshots, 2026-09-02).**

1. A page titled Rescheduling Request: one labelled search (“Case Name
   or No, Advocate”), a teal Search and a Clear Search text control,
   then a four-column table — Case Name (underlined links), Case Number,
   Date of Application, Date of Next Hearing. The rail badge reads 20.
2. Clicking a case name opens a **Document Submission** overlay: title
   plus a “Pending Review” pill; left pane with a key-value strip
   (case number, application type Advancement/Reschedule, sent on,
   sender, created by, current hearing date, proposed hearing date,
   purpose of next hearing, consent of other parties) then a formal
   application facsimile; right pane Comments; footer Download /
   Reject / Approve.

**What already exists on the advocate side.** Two overlays, for two
kinds of document:

- `GeneratedApplicationDialog` — the paper facsimile of an
  advancement/reschedule application. Compact sunken meta well, then
  `DocumentPreview` `height="fill"` as a grid `1fr` child so the
  document is the focal surface (`max-h-[85dvh]`, `sm:max-w-3xl`).
- `DocumentRecordDialog` — a filed PDF: facts-first, preview at
  `h-96` in a scrolling left column, comments on the right.

This review is a generated application the bench must act on. The
overlay is that document-first container, plus the comments pane
and Approve / Reject. It is not the filed-PDF facts layout with a
postage-stamp well.

**In scope:** the list (title, search, table, empty, pagination, wiring
the rail row) and the review dialog (facts, facsimile, comments,
Approve / Reject as a local overlay on the demo queue).

**Out of scope:** Delay condonation and Others; writing an order or
moving the listed date (Bulk reschedule / the order composer already
own those acts); a court-side case file; “View case”; a real backend.

**Who this is for.** Who logs in is still unanswered
(`docs/product/open-questions.md`). The court-side demo runs as a JMFC
magistrate (`lib/employee/content.ts`); that is a demo identity, not a
product fact. This is a staff worklist, so the brief designs for a
professional repeat user (throughput, density) and flags that in §12.

The employee area does not read the citizen side (`content.ts`). The
dialog **composes the generated-application layout** (compact meta
well + fill preview) and reuses `CommentsPane`. It does not import
`CaseDocument`. `DocumentPreview` is the product's one preview well
and is reused by path, not by restating it.

---

## 2. Problem

1. **The row is a dead end.** The rail already names Rescheduling
   request and carries a count. The control says it goes nowhere.
2. **The reference is a flat white page.** Title, search and table sit
   on the same sheet with no panel. Four court-side lists already
   solved this shape with one lifted table container. A fifth layout
   for the same kind of queue would be two products.
3. **Clicking a name has somewhere to go this time.** Register cases
   left the cause title as plain text because there was no
   registration flow. Here the screenshot's whole overlay exists, and
   the advocate side already built it. Opening nothing would be the
   dishonest render.
4. **Approve and Reject are judicial acts this build does not file.**
   The overlay exists to take them. Shipping the dialog without them
   would be furniture around a hole; claiming an order was signed
   would be a fake system action the rails prohibit.

---

## 3. Objective

- The rail's Rescheduling request row opens a list the bench can
  already recognise from Register cases / Schedule hearing.
- A request in that queue is findable by cause, number or advocate,
  and opening a row shows the generated application the way the
  advocate side already shows it, with comments and a decision.
- Approve and Reject are present, local to the demo queue, and do not
  pretend an order was written.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Rescheduling request
is *for* beyond the rail label and the screenshots. Do not invent a
slogan.

**What the screenshots show, attributed:** a queue of applications to
change a listed hearing date (type Advancement/Reschedule), opened as
a document the bench reviews and then Approves or Rejects. The user
asked to compose that list in the court-side table container and to
reuse the advocate-side document record for the click.

**Hypothesis (not settled):** after a party files an
advancement/reschedule application (`lib/cases/application-draft.ts`,
type `advancement-reschedule`), it waits here for the bench before
the listed date moves. Treat as provisional. Choosing the later date
remains Bulk reschedule / Schedule (`hearings-pass-over.md`).

---

## 5. Decisions

1. **Same screen as Register cases.** Title on the page, one lifted
   panel, search then table then `ListFooter`. Rejected: a second
   filter card, or a table that draws its own frame inside the panel
   (box-in-box; ui-craft §4). *Rule:* compose what already exists.
2. **Search only — no status filter.** The reference has one control.
   Every row in this queue is pending review; a filter that can never
   change the list is a control that only ever returns the same
   thing. *Judgment.*
3. **Search is the teal action on the list.** One primary per view
   (Ration Teal). Matches Register cases. Clear is ghost. *Law.*
4. **Visible field label.** `Field` + `FieldLabel` “Search cases”;
   placeholder hints “case name, number or advocate”. Deviation from
   the reference, forced by ACCESSIBILITY §12. Smallest available.
5. **Four columns: case name, case number, date of application, date
   of next hearing.** The reference's columns. The **row** is the
   opener — this queue has no other act — and the cause title is the
   named control (`text-foreground`, no underline, no teal). A
   `Button variant="link"` copied the legacy portal and made this
   list a second product inside the same table container. Confirmed
   with product 2026-09-02: that treatment is wrong. A `w-fit` name
   button then left the rest of the row dead; the click is on the
   row (2026-09-03). Dates are `tabular-nums`, compact `en-IN`.
   *Existing pattern; user correction.*
6. **The review overlay is the generated-application container plus
   the comments pane, not the filed-PDF record.** Short title
   (`Advancement/reschedule`) + warning badge; sender as description;
   compact `rounded-lg bg-surface-sunken p-4` meta well; `DocumentPreview`
   `height="fill"` as a grid `1fr` child of a height-capped dialog
   (`h-[85dvh]`, `sm:max-w-5xl`); comments from `CommentsPane`;
   Approve / Reject in the footer. Rejected: stuffing the facsimile
   into `DocumentRecordFrame`. That frame's left pane is an
   `overflow-y-auto` stack, so `height="fill"` collapses to `min-h-64`
   and a default `h-96` well sits under nine fact rows as a postage
   stamp. Fill works in `GeneratedApplicationDialog` because the
   preview is a direct grid `1fr` child. *Compose existing; user
   correction 2026-09-03.*
7. **The meta well holds the facts the bench needs without reading
   the paper.** Case number, application sent on, current hearing
   (date · purpose), proposed hearing date, consent of other parties.
   Application type is the dialog title; sender is the description.
   Dropped from the well: created by (not decision-critical; the
   paper names counsel), a second copy of type/sender, “View case”
   (no court-side case file). *Judgment; user correction.*
8. **The document is the generated application facsimile.** Paper
   tokens (`bg-paper` / `text-paper-foreground`), court heading,
   parties table, title, operative paragraphs, prayer — the same
   markup `GeneratedApplicationDocument` already uses, composed
   from this request's fields, restated in `lib/employee` so the
   employee area does not read `lib/cases`. Download writes that
   plain-text copy, hanging off `DocumentPreview`, not a second
   footer link. *Compose existing.*
9. **Approve is the dialog's one primary; Reject is `destructive`
   (muted).** The dialog is its own visual region, so teal here
   does not compete with Search on the list (Laws: ration teal per
   region — same call `GeneratedApplicationDialog` already made).
   Reject uses the DS muted destructive, not a red outline we would
   have to invent. *Law + DS button variants.*
10. **Approve and Reject only remove the row from this demo queue.**
    They do not write an order, move a listing, or notify anyone.
    Pass over already made this bargain. No second confirm: the
    reference has none, and the act is local. *Judgment.*
11. **Comments are local to the open dialog, not a filing.** Same
    pane as `DocumentRecordDialog`: empty well, labelled textarea,
    Post, attach disabled. The scoping line stays (“On this file
    only — not a filing”). *Compose existing.*
12. **Demo data is twelve listed ST matters, application date
    newest first.** Enough to page at 10. Count is derived from the
    list so the rail cannot disagree — the transcribed 20 yields to
    the list the way Register cases already did. Parties are Kollam
    fixtures that do not overlap today's cause list, the scheduling
    queue, or the register queue (a complaint waiting to be
    registered has no listed date to move). One row has no consent;
    one proposes two dates; one has no accused counsel. *Judgment.*
13. **Phone: stacked items, not a four-column table.** Same answer
    as Register cases. Dates spelled with the long `en-IN` form
    because there is no column header. The review dialog stacks
    comments under the document (`flex-col` below `md`) and lets
    that column scroll; fill preview only from `md`, where the
    dialog has a definite height. *RESPONSIVE.*

---

## 6. What I cut (and why)

- **Nine bordered fact rows above a clipped document.** The document
  is the review. Facts that duplicate the paper or the header
  (type, sender, created by, a second title) left the well.
- **The legacy title “Document Submission”.** The product already
  names this type Advancement/reschedule. A generic container title
  would hide which application is open.
- **“View case”.** Promises a court-side case file that is not there.
- **A second Download in the footer.** `DocumentPreview` already
  hangs it on the document.
- **Writing an order, or moving the listed date, from Approve.**
  Those acts belong to the order composer and Bulk reschedule.
  Approve here only clears the review queue.
- **A status / type filter.** Not on the reference; every row is
  pending the same review.
- **An advocates column.** Not on the reference. Search still
  reaches counsel, because that is the question the box was labelled
  with.
- **Copying the screenshot's dummy names (`GURU vs Junior Adv
  Filed`, `CMP/444/2026`).** The court side already speaks ST /
  Kollam parties. CMP is the number *before* cognizance; a listed
  hearing to reschedule is already on file.
- **Extracting `DocumentRecordDialog` into a shared primitive, then
  stuffing this facsimile into it.** Reversed 2026-09-03: the filed-PDF
  facts stack is the wrong container for a generated application.
  Comments are shared (`CommentsPane`); the left pane is the
  generated-application grid. `CaseDocument` is still not imported.

---

## 7. Layout & hierarchy

**List**

- Page: `p-6 md:p-8`, `gap-8` between title and panel.
- Title: `text-title sm:text-title-l font-semibold` “Rescheduling
  request”. Supporting line: the queue count in `text-body
  text-muted-foreground`.
- Panel: `rounded-xl border-hairline bg-card shadow-raised p-6
  gap-6`.
- Filters: `gap-4`, wrap, labels above controls, Search + Clear at
  the end of the row (`items-end`).
- Table: header well `bg-surface-sunken` rounded on the end cells;
  `h-2` spacer row; rows `border-b border-hairline`; last row
  cleared.   Cause title is a quiet `text-foreground` control; the whole row
  opens the review.
- Footer: shared `ListFooter`.
- Primary on the list: Search.

**Review dialog**

- `DialogContent`: `flex h-[85dvh] max-h-[85dvh] flex-col gap-0
  overflow-hidden p-0 sm:max-w-5xl`, `shadow-modal` from the
  primitive. Height is definite so the fill preview has a budget.
- Header `p-6 pr-16`: short type title + warning badge;
  description = sender line. Title role `text-title-s`.
- Body: `flex-col md:flex-row`. Left is
  `grid-rows-[auto_minmax(0,1fr)]` — sunken meta well, then fill
  preview. Right is `CommentsPane` `md:w-80`.
- Footer: Reject then Approve, right-aligned, `border-t` from
  `DialogFooter`. Primary on the dialog: Approve.

---

## 8. Components (DS name → region)

| Region | DS |
|---|---|
| Page title | `text-title` / `text-title-l` |
| List panel | composed `section` with panel classes (not a nested Card) |
| Search | `Field` + `FieldLabel` + `InputGroup` / `InputGroupInput` |
| Search / Clear | `Button` primary / ghost |
| Table | `Table` + header well / hairline rows |
| Cause title opener | quiet `text-foreground` button; click is on the row |
| Empty | `Empty` + `EmptyMedia` icon |
| Pagination | `ListFooter` (`Pagination` + `Select`) |
| Review overlay | `GeneratedApplicationDialog` layout + `CommentsPane` |
| Status | `Badge variant="warning"` |
| Facts | sunken well + `DescriptionList` (decision facts only) |
| Facsimile | `DocumentPreview` `height="fill"`, `kind: "composed"` |
| Comments | `Empty` / `Item` / `Field` + `Textarea` |
| Approve / Reject | `Button` default / `destructive` |

---

## 9. Spacing

`p-6` panel, `gap-6` panel stack, `gap-8` page sections, `gap-4`
filter row and table-to-footer, `px-4 py-3` cells, `h-10` controls,
dialog header/footer `p-6`, comments pane `w-80`. Ladder only.

---

## 10. States (empty / loading / error / partial / long-label)

- **Empty queue:** “Nothing waiting” — the court is up to date; no
  action. Icon `FolderCheck`.
- **Filtered empty:** “No matters match this search” + Clear search.
- **Loading / error:** none — demo data, no backend.
- **Partial:** a side with no vakalat is omitted from the sender
  line; a missing proposed date is not invented — that row is not in
  the demo.
- **Long label:** cause title wraps (`whitespace-normal`); corporate
  accused in the demo; search field `min-w-0`; dialog title is the
  short type label so it does not wrap beside the badge.
- **Approve / Reject taken:** the row leaves the queue; the dialog
  closes; focus returns to the search (the opener is gone). If that
  was the last row on the page, the list shows the empty state.

---

## 11. Risks accepted

- Approve / Reject can be mistaken for filing an order. The missing
  order is the honesty; a caption that over-explains would dress up
  the gap. Same bargain as Pass over.
- One-click Approve / Reject with no confirm. The reference has
  none; the act is local to demo data. A real backend would need an
  order before the listed date moves.
- Twelve rows, not the transcribed 20. Honesty of a derived count
  beats padding identical fixtures.

---

## 12. Open questions for product

1. **What is this screen's job?** Reviewing an application, or
   actually rescheduling the listed date from here?
2. **Who does it?** Magistrate, bench clerk, sheristadar?
3. **What does Approve write?** An order (`reschedule-of-hearing-date`
   already exists in `lib/cases/orders.ts`), a listing change, both?
4. **What does Reject write?** `rejection-reschedule-request` is
   already named on the orders side — is that the product, or a
   comment back to the filer?
5. **Does Delay condonation reuse this overlay next?** The Delay
   condonation list shipped 2026-09-03 without a click — the screenshot
   was the list only. Still unanswered if a later overlay reuses this
   one.

---

## 13. Gaps in the DS (if any)

None. The table container already exists on Register cases. The
review overlay is the advocate generated-application layout plus
the existing comments pane.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-02 | First pass from the legacy screenshots: compose the list in the court-side table panel; reuse the advocate document-record layout for the click; Approve / Reject are local to the demo queue. | user asked; ux-designer |
| 2026-09-02 | Cause title is the Hearings peek trigger, not a teal underline. First overlay attempt used `DocumentRecordFrame`; `height="fill"` collapsed inside that scrolling column. | user correction; ux-designer / ui-designer |
| 2026-09-03 | Overlay is generated-application (compact well + fill preview) plus comments and Approve / Reject — not the filed-PDF facts layout. | user correction; ui-reviewer / ui-designer |
| 2026-09-03 | The whole row opens the review, not only the case-name hit area. | user correction; ui-designer |
