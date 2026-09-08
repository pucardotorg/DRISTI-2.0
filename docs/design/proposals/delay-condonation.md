# Delay condonation

Status: building
Updated: 2026-09-03
Source: docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md · docs/product/domain/practice-notes.md ·
docs/product/open-questions.md · user in this conversation (2026-09-03):
screenshot of the legacy Delay Condonation list; “using the same Table
Container that we have been doing for our new product. Please design the
same for this section as well now”
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation`, `table` / `button` / `empty` / `field` /
`input-group` / `pagination` / `select` / `label`

Code read: `apps/dristi-app/src/components/employee/register-cases-screen.tsx`,
`register-cases-table.tsx`, `schedule-screen.tsx`, `schedule-table.tsx`,
`rescheduling-request-screen.tsx`, `list-footer.tsx`,
`lib/employee/schedule.ts`, `lib/employee/navigation.ts`,
`lib/employee/content.ts`

---

## 1. Context

**Where this sits.** Delay condonation is the second row in the rail's
**Review applications** group, between Rescheduling request (built) and
Others (not built). The row already exists (`navigation.ts`) with a
transcribed count of 146 and no `href`. Hearings, Schedule hearing, Bulk
reschedule, Register cases, and Rescheduling request already share one
furniture: page title on the page, **one** lifted panel (`rounded-xl
border-hairline bg-card shadow-raised p-6`) holding filters, table and
`ListFooter`. This screen is the next queue down that group of work.

**The reference (screenshot, 2026-09-03).** A page titled Delay
Condonation: a Stage dropdown, a labelled search (“Case Name or Number,
Advocate”), a teal Search and a Clear Search text control, then a
four-column table — Case Name (underlined links), Case Number, Stage,
Advocates. Visible rows are all at Registration, numbered `CMP/…`. The
rail badge reads 146. The rest of the chrome is the legacy sidebar, not
in scope.

**What the product already names.** Delay condonation is not invented
here. `docs/product/domain/journey.md` §3: a complaint filed after the
one-month window may be condoned for sufficient cause (_NI Act §142,
BNSS §514_). The Haryana ahlmad note (`practice-notes.md`) puts
condonation of delay with the reader's objections, argued before the
judge. The court side already lists it as a hearing purpose
(`lib/employee/hearings.ts`) and as an order type
(`order-for-acceptance-rejection-of-delay-condonation`). This screen is
the review queue that names those applications, not the listed hearing
and not the order.

**In scope:** the list — title, stage filter, search, table/item list,
empty states, pagination, wiring the rail row.

**Out of scope:** opening a row (the screenshot is the list only;
Rescheduling request's overlay stays that feature's); writing the
acceptance/rejection order; Others; a court-side case file; a real
backend.

**Who this is for.** Who logs in is still unanswered
(`docs/product/open-questions.md`). The court-side demo runs as a JMFC
magistrate (`lib/employee/content.ts`); that is a demo identity, not a
product fact. This is a staff worklist, so the brief designs for a
professional repeat user (throughput, density) and flags that in §12.

---

## 2. Problem

1. **The row is a dead end.** The rail already names Delay condonation
   and carries a count. The control says it goes nowhere.
2. **The reference is a flat white page.** Title, filters and table sit
   on the same sheet with no panel. Five court-side lists already solved
   this shape with one lifted table container. A sixth layout for the
   same kind of queue would be two products.
3. **The reference leans on placeholders and a link that goes nowhere
   here.** The search has no visible field label that matches DS
   ACCESSIBILITY §12. Case names are underlined because they open a
   review this build does not have a screenshot of, and no court-side
   case file to fall back on.

---

## 3. Objective

- The rail's Delay condonation row opens a list the bench can already
  recognise from Schedule hearing / Register cases.
- An application in that queue is findable by stage, cause, number or
  advocate — the two controls the reference actually had.
- How far each matter has reached is readable as a word in the Stage
  column, not only as a filter that has already been applied.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Delay condonation is
*for* beyond the rail label and the screenshot. Do not invent a slogan.

**What the screenshot shows, attributed:** a queue of applications with
a cause title, a number, a stage and advocates. The user asked to
compose that list in the court-side table container, not to design the
act of condoning delay.

**Hypothesis (not settled):** after a complaint is filed out of time
(`journey.md` §3) — or when a later delay-condonation application
reaches the bench — it waits here before the magistrate accepts or
rejects it. The order
`order-for-acceptance-rejection-of-delay-condonation` already exists;
this list does not write it. Treat as provisional.

---

## 5. Decisions

1. **Same screen as Schedule hearing / Register cases.** Title on the
   page, one lifted panel, filters then table then `ListFooter`.
   Rejected: a second filter card, or a table that draws its own frame
   inside the panel (box-in-box; ui-craft §4). *Rule:* compose what
   already exists.
2. **Stage and search — the reference's two controls.** Register cases
   cut stage because that queue is one state and its reference had one
   box. This reference has Stage. A filter that can never match a row
   is a control that only ever returns nothing (`schedule.ts`), so the
   demo includes every stage the filter offers. *Existing pattern +
   screenshot.*
3. **Registration is a stage on this queue, not on Schedule hearing.**
   The screenshot's visible rows are Registration / `CMP/…` — filing
   before cognizance, which `CASE_STAGES` deliberately omits because
   those are not hearings to date. Adding Registration to the
   scheduling filter would offer a value that matches nothing there.
   This module prepends it to `CASE_STAGES` and leaves Schedule
   untouched. Later stages use ST numbers, because a delay-condonation
   hearing purpose already exists on listed matters. *Judgment;
   journey.md §3 + hearings.ts purpose.*
4. **Search is the teal action.** One primary per view (Ration Teal).
   Matches Schedule hearing. Clear is ghost. *Law.*
5. **Visible field labels.** Stage keeps its name. Search uses `Field`
   + `FieldLabel` “Search cases”; placeholder hints “case name, number
   or advocate”. Deviation from the reference, forced by ACCESSIBILITY
   §12. Smallest available.
6. **Four columns: case name, case number, stage, advocates.** The
   reference's columns. Case name is the one emphasised cell
   (`font-medium`), **not** a link — there is no review overlay in the
   screenshot and no court-side case file (same honesty as
   `ScheduleTable` / `RegisterCasesTable`). Stage is plain text, not a
   chip — seven tinted stages down a column is decoration (craft: ration
   colour). Advocates use `CounselCell`. *Judgment + existing pattern.*
7. **No actions column, no click.** Condonaing delay is a real
   judicial act this build does not perform; Rescheduling request opened
   a row because the user supplied the overlay. A disabled Review
   button, or a teal underline that goes nowhere, would be furniture
   around a hole. *Judgment.*
8. **Demo data is 35 applications, Registration first so the opening
   page matches the screenshot.** Enough to page at 10 / 20 / 30. Count
   is derived from the list so the rail cannot disagree — the
   transcribed 146 yields to the list the way Register cases already
   did. Parties are Kollam fixtures that do not overlap today's cause
   list, the scheduling queue, the register queue, or the rescheduling
   queue. Several rows have no counsel. Every stage the filter offers
   has at least one row. *Judgment.*
9. **Phone: stacked items, not a four-column table.** Same answer as
   Schedule hearing. Stage sits on the caption line with the number.
   *RESPONSIVE.*

---

## 6. What I cut (and why)

- **The underlined case-name link.** Promises a review this screenshot
  does not show. Rescheduling request earned the click with a second
  screenshot; this one did not.
- **Reusing Rescheduling request's overlay.** That overlay is an
  advancement/reschedule facsimile. A delay-condonation application is
  a different paper. Open question on that brief stays open.
- **An Approve / Reject on the list.** Those acts write
  `order-for-acceptance-rejection-of-delay-condonation`. This build
  does not file orders from a queue row.
- **Padding the list to 146.** Honesty of a derived count beats 111
  identical fixtures.
- **A second framed box for search.** Filters belong inside the list
  panel.
- **Copying the screenshot's dummy names (`Lit vs Aasass`,
  `CMP/1213/2025` as the whole vocabulary).** The court side already
  speaks CMP / ST / Kollam parties. The number *shape* is kept; the
  dummy parties are not.
- **Adding Registration to `CASE_STAGES`.** That list is the
  scheduling queue's filter. A value that cannot match a row there is
  the defect `schedule.ts` already refused.

---

## 7. Layout & hierarchy

- Page: `p-6 md:p-8`, `gap-8` between title and panel.
- Title: `text-title sm:text-title-l font-semibold` “Delay
  condonation”. Supporting line: the queue count in `text-body
  text-muted-foreground`.
- Panel: `rounded-xl border-hairline bg-card shadow-raised p-6
  gap-6`.
- Filters: `gap-4`, wrap, labels above controls, Search + Clear at the
  end of the row (`items-end`). Stage `sm:w-52`, search `sm:w-72` —
  Schedule hearing's widths.
- Table: header well `bg-surface-sunken` rounded on the end cells;
  `h-2` spacer row; rows `border-b border-hairline`; last row cleared.
- Footer: shared `ListFooter`.
- Primary: Search. Everything else recedes.

---

## 8. Components (DS name → region)

| Region | DS |
|---|---|
| Page title | `text-title` / `text-title-l` |
| List panel | composed `section` with panel classes (not a nested Card) |
| Stage | `Label` + `Select` |
| Search | `Field` + `FieldLabel` + `InputGroup` / `InputGroupInput` |
| Search / Clear | `Button` primary / ghost |
| Table | `Table` + header well / hairline rows |
| Advocates | existing `CounselCell` |
| Empty | `Empty` + `EmptyMedia` icon |
| Pagination | `ListFooter` (`Pagination` + `Select`) |

---

## 9. Spacing

`p-6` panel, `gap-6` panel stack, `gap-8` page sections, `gap-4` filter
row and table-to-footer, `px-4 py-3` cells, `h-10` controls. Ladder
only.

---

## 10. States (empty / loading / error / partial / long-label)

- **Empty queue:** “Nothing waiting” — the court is up to date; no
  action. Icon `FolderCheck`.
- **Filtered empty:** “No matters match these filters” + Clear
  filters.
- **Loading / error:** none — demo data, no backend.
- **Partial:** a side with no vakalat is omitted (`CounselCell`
  already).
- **Long label:** cause title wraps (`whitespace-normal`); corporate
  accused in the demo; search field `min-w-0`.

---

## 11. Risks accepted

- The list can be mistaken for a place where delay is condoned. The
  missing action is the honesty; a caption that over-explains would
  dress up the gap. Same bargain as Register cases.
- Thirty-five rows, not the transcribed 146. Honesty of a derived
  count beats padding.

---

## 12. Open questions for product

1. **What is this screen's job?** Reviewing the application, taking
   the limitation objection, or writing the
   acceptance/rejection order from here?
2. **Who does it?** Magistrate, bench clerk, scrutiny officer,
   sheristadar?
3. **When does an application enter this queue?** Only at filing
   (Registration / CMP), or also later when delay-condonation is a
   hearing purpose?
4. **What does opening a row show**, when it exists — and does it
   reuse the generated-application overlay Rescheduling request
   already composed?

---

## 13. Gaps in the DS (if any)

None. The table container, the stage-and-search row, and the four
columns already exist on Schedule hearing.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-03 | First pass from the legacy screenshot: compose the list in the court-side table panel; Stage + search; no review overlay. | user asked; ux-designer |
