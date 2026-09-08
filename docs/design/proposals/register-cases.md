# Register cases

Status: building
Updated: 2026-09-02
Source: docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md · docs/product/open-questions.md ·
user in this conversation (2026-09-02): screenshot of the legacy Register
Cases list; “get the sense of the idea and, using our table container,
please design this section”
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation`, `table` / `button` / `empty` / `field` /
`input-group` / `pagination` / `select` / `label`

Code read: `apps/dristi-app/src/components/employee/schedule-screen.tsx`,
`schedule-table.tsx`, `hearings-screen.tsx`, `hearings-table.tsx`,
`list-footer.tsx`, `lib/employee/schedule.ts`, `lib/employee/navigation.ts`

---

## 1. Context

**Where this sits.** Register cases is the first row in the rail's
**Actions** group, next to Approve copy application. Hearings already
ships three list screens that share one furniture: page title on the
page, **one** lifted panel (`rounded-xl border-hairline bg-card
shadow-raised p-6`) holding filters, table and `ListFooter`. This
screen is the next row down that group of work.

**The reference (screenshot, 2026-09-02).** A page titled Register
Cases: one labelled search (“Case Name or No, Advocate”), a teal Search
and a Clear Search text control, then a four-column table — Case Name
(underlined links), Case Number, Advocates, Days Since Submitted (every
value rust/orange) — and a pager. Three rows; the rail badge reads 3.
The rest of the chrome is the legacy sidebar, not in scope.

**In scope:** the list — title, search, table/item list, days-waiting
column, empty states, pagination, wiring the rail row.

**Out of scope:** performing registration / taking cognizance (a real
judicial act this build does not do); a case file or peek behind the
name; Approve copy application; changing the Actions group itself.

**Who this is for.** Who logs in is still unanswered
(`docs/product/open-questions.md`). The court-side demo runs as a JMFC
magistrate (`lib/employee/content.ts`); that is a demo identity, not a
product fact. This is a staff worklist, so the brief designs for a
professional repeat user (throughput, density) and flags that in §12.

---

## 2. Problem

1. **The row is a dead end.** The rail already names Register cases and
   carries a count (4 in the transcribed nav, 3 on the screenshot). The
   control says it goes nowhere.
2. **The reference is a flat white page.** Title, search and table sit
   on the same sheet with no panel. Hearings and Schedule already
   solved this shape with one lifted table container. A second layout
   for the same kind of queue would be two products.
3. **The reference leans on placeholders and colour.** The search has
   no visible field label that matches DS ACCESSIBILITY §12. Days are
   orange on every row with no other encoding — colour alone. Case
   names are links to a registration flow this build does not have.

---

## 3. Objective

- The rail's Register cases row opens a list the bench can already
  recognise from Schedule hearing.
- A complaint in that queue is findable by cause, number or advocate
  without a second filter axis the reference never had.
- How long each complaint has waited is readable as a number, not only
  as a colour.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Register cases is *for*
beyond the rail label and the screenshot. Do not invent a slogan.

**What the screenshot shows, attributed:** a queue of complaints with a
cause title, a number, advocates, and days since submitted. The user
asked to compose that list in the court-side table container, not to
design the act of registering.

**Hypothesis (not settled):** after scrutiny and before numbering /
cognizance (`docs/product/product-foundation.md` Kerala spine step 2–3),
complaints wait to be taken on the court's register. CMP numbers in the
demo follow that reading (`lib/employee/schedule.ts` already treats
`CMP/…` as pre-cognizance). Treat as provisional.

---

## 5. Decisions

1. **Same screen as Schedule hearing.** Title on the page, one lifted
   panel, search then table then `ListFooter`. Rejected: a second
   filter card, or a table that draws its own frame inside the panel
   (box-in-box; ui-craft §4). *Rule:* compose what already exists.
2. **Search only — no stage filter.** The reference has one control.
   Stage belongs to cases already on file (Schedule hearing). A
   complaint waiting to be registered is in one state. *Judgment.*
3. **Search is the teal action.** One primary per view (Ration Teal).
   There is no court-level act above the list (Join VC lives on Today's
   hearings). Matches Schedule hearing. Clear is ghost. *Law.*
4. **Visible field label.** `Field` + `FieldLabel` “Search cases”;
   placeholder hints “case name, number or advocate”. Deviation from
   the reference, forced by ACCESSIBILITY §12. Smallest available.
5. **Four columns: case name, case number, advocates, days since
   submitted.** The reference's columns. Case name is the one
   emphasised cell (`font-medium`), not a link — there is no
   registration flow and no court-side case file (same honesty as
   `ScheduleTable`). Advocates use `CounselCell`. *Judgment + existing
   pattern.*
6. **Days are a number, right-aligned, `tabular-nums`, in
   `text-warning-ink`.** The screenshot paints the wait rust/orange;
   `warning-ink` is the DS token for that role (status text on a
   neutral ground, 4.5:1). The number is the encoding; the colour
   agrees with the reference rather than standing in for it
   (ACCESSIBILITY §3: never colour alone). Every row uses the same
   treatment — one presentation per data type (ui-craft §2). No
   threshold, no badge. *DS colors + judgment.*
7. **No actions column.** Registering is a real act this build does not
   perform. A disabled Register button would be furniture around a
   hole — the same call `ScheduleTable` already made. *Judgment.*
8. **Demo data is 35 CMP complaints, longest wait first.** Enough to
   page at 10 / 20 / 30. Count is derived from the list so the rail
   cannot disagree. Parties are Kollam fixtures that do not overlap
   the scheduling queue. Several rows have no counsel, matching the
   empty Advocates cell on the screenshot. *Judgment; volume asked
   2026-09-02.*
9. **Phone: stacked items, not a four-column table.** Same answer as
   Schedule hearing. Days spelled out (“281 days since submitted”)
   because there is no column header. *RESPONSIVE.*

---

## 6. What I cut (and why)

- **The underlined case-name link.** Promises a screen that is not
  there.
- **A Register row action, even disabled.** Same reason.
- **A stage / status filter.** Not on the reference; would invent an
  axis.
- **Painting only the longest wait in warning-ink.** Would make sibling
  days look like different kinds of fact.
- **A second framed box for search.** Filters belong inside the list
  panel.
- **Copying the screenshot's dummy names and `KL-00…` numbers.** The
  court side already speaks CMP / Kollam parties; a third vocabulary
  would be the first thing a clerk noticed.

---

## 7. Layout & hierarchy

- Page: `p-6 md:p-8`, `gap-8` between title and panel.
- Title: `text-title sm:text-title-l font-semibold` “Register cases”.
  Supporting line: the queue count in `text-body text-muted-foreground`.
- Panel: `rounded-xl border-hairline bg-card shadow-raised p-6 gap-6`.
- Filters: `gap-4`, wrap, labels above controls, Search + Clear at the
  end of the row (`items-end`).
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
- **Filtered empty:** “No matters match this search” + Clear search.
- **Loading / error:** none — demo data, no backend.
- **Partial:** a side with no vakalat is omitted (`CounselCell` already).
- **Long label:** cause title wraps (`whitespace-normal`); corporate
  accused in the demo; search field `min-w-0`.

---

## 11. Risks accepted

- The list can be mistaken for a place where registration happens. The
  missing action is the honesty; a caption that over-explains would
  dress up the gap.
- `warning-ink` on every days cell is a coloured mark per visible row. At
  10 per page that is above the craft budget of ~3 status marks; accepted
  so the column stays one fact.

---

## 12. Open questions for product

1. **What is this screen's job?** Taking cognizance, numbering a
   complaint, or something else the registry does?
2. **Who does it?** Magistrate, bench clerk, scrutiny officer,
   sheristadar?
3. **When does a complaint enter this queue?** After e-filing, after
   scrutiny, after defects are cleared?
4. **What does Register do**, when it exists — and what number does
   the complaint receive?

---

## 13. Gaps in the DS (if any)

None. The table container and the search row already exist on Schedule
hearing.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-02 | First pass from the legacy screenshot: compose the list in the court-side table panel; no registration act. | user asked; ux-designer |
| 2026-09-02 | Queue grown from 4 to 35 so the table and pager can be judged at volume. | user asked |
