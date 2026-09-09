# Register cases

Status: building
Updated: 2026-09-09
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
column, empty states, pagination, wiring the rail row. **Since
2026-09-09, also the complaint's own file** behind a cause title
(`/employee/register-cases/<id>`) — see §5a.

**Out of scope:** performing registration / taking cognizance (a real
judicial act this build does not do); Approve copy application;
changing the Actions group itself.

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
   submitted.** The reference's columns. Advocates use `CounselCell`.
   *Judgment + existing pattern.*
   **Superseded 2026-09-09:** the case name is now a link
   (`RegisterCaseLink`), because the file behind it exists. It wears the
   cause list's own quiet-name dress — underlined on hover and focus,
   never painted — so thirty-five of them do not read as a column of
   links. The row's `hover:bg-card` cancellation went with it: the DS
   hover now tells the truth.
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
   hole — the same call `ScheduleTable` already made. *Judgment.* Still
   true: the decisions live at the foot of the complaint's own file,
   where the clerk has just read the thing they are deciding about.
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

## 5a. The complaint's file (added 2026-09-09)

Owner asked for the legacy Register Cases → View screen, with the
left panel kept constant. Built at
`/employee/register-cases/[caseId]` — `case-review-screen.tsx` over
`lib/employee/case-review.ts`.

1. **Three columns at `lg`: reading index · the file · the case
   timeline.** The index is `sticky` at `--chrome-sticky-top`, marks
   the section being read (`aria-current`), and its entries open a
   folded section before jumping to it. The
   reference lets it scroll away; keeping it put was the owner's ask
   and the point of a five-part file. Below `lg` it becomes the first
   panel rather than disappearing — chrome must not vanish
   (`ui-craft` §0).

   **What decides the marked entry, in order.** A click *claims* the
   entry: the reader has said where they are going, so the index says so
   at once and keeps saying so until they scroll somewhere themselves
   (wheel, touch, or a key that scrolls). Under that, an
   `IntersectionObserver` tracks the section the page is actually in —
   the first one inside a band from the heading's own resting offset down
   to 45% of the viewport, decided from **every** section's current state
   rather than from one callback's batch. Last, the end of the scroll is
   its own answer: once the page has no scroll left, the marked entry is
   the *last* section on screen instead of the first.

   Neither the claim nor the end-of-scroll rule is decoration over a
   working observer: the last sections are the short ones, so the page
   runs out of scroll before their headings can reach any reading line —
   measured on `r-1840`, the last heading would need 167px more than the
   document has. No band, wherever placed, can read the bottom of a
   document as anything but the section above the last one.

   The end is read from the scroll position, not from "the foot is in
   view": on a narrow viewport the last section is tall enough that the
   end of the column appears while the reader is still properly inside
   the section above it, and the first build of this rule marked the
   wrong entry there. A 1px sentinel at the end of the reading column
   says only when the position is worth watching, so the `scroll`
   listener is attached for the last screenful and removed again. *Added
   2026-09-09.*
2. **Five numbered sections, sentence case.** Litigant details · Case
   specific details · Additional details · Submissions from the
   accused · Payment details. The reference numbers two sections "4";
   Title Case does not survive the Laws.
3. **One lifted panel per group, and one well inside it for the
   content** — whether that content is several named records (a party,
   a cheque, an advocate) or the group's own facts plus the documents
   backing them. The fill is what separates a group's parts; nothing
   inside carries a border. Sections are separated by the accordion's
   `gap-8` and nothing else: the DS `AccordionItem`'s `not-last:border-b`
   is reset **with the same variant** (`not-last:border-b-0`), because
   tailwind-merge treats a bare utility as a different group and a plain
   reset leaves the rule standing. A group with nothing on the file keeps
   no well — a sunken box around one muted sentence is a grey void, and
   the sentence is the whole content. *Revised 2026-09-09.*
4. **Fact rows use the DS `DescriptionList`**, with the term column
   widened to 17rem and stacked below `sm`: the terms are the e-filing
   form's own questions ("date when the 15 days from service of legal
   demand notice was complete"), which no 10rem column holds. Rows are
   `py-3`, stroke dropped to hairline.
5. **Identity facts at the top are label-above-value** in a 2/3-column
   grid at caption, distinct from the record rows below them.
6. **Documents are realistic filings, not file icons.** Each slot names
   the court's label, the upload (`return-memo-06-08-2025.pdf`), and
   `N pages · size`; filenames are derived from the case, so the scan of
   the cheque is named after the cheque number in the record heading and
   a memo is dated from the return it records. The thumbnail is a drawn
   page facsimile in the DS `paper` tokens — six shapes (letter, cheque,
   memo, receipt, ID card, ruled court form), because a clerk tells a
   cheque from a demand notice without reading and one icon on twelve
   rows throws that away. **Deliberately not legible:** a thumbnail says
   "a page of this kind is on the file", never what it says — readable
   facsimile text would be fabricating a court record. An empty slot
   gets no paper at all (sunken media, muted icon, "Not uploaded") and
   carries no `file`, so an absence cannot be dressed as a blank scan.
   None of them opens — there is no court-side document store.
   *Revised 2026-09-09.*
7. **Admit / Dismiss are pinned, real, and honestly dead.**
   `aria-disabled` on both; no helper line. The owner cut the
   "not connected yet" copy (2026-09-09) — dimming carries the
   unbuilt state, and a tooltip would hide the same fact behind
   hover (ACCESSIBILITY §7). One teal, on Admit.
8. **Particulars are derived from the queue row, not transcribed.** The
   §138 chain is worked backwards from today minus the row's wait, so
   every one of the 35 complaints opens a file that is internally
   consistent and legally coherent (deposit inside three months, notice
   inside thirty days, accrual exactly fifteen days after service —
   asserted in `case-review.test.ts` across the whole queue). Only the
   *states* are named per row in `CASE_FILE_MARKS`: a stopped payment,
   a part-liability cheque, no witness, a missing application.
9. **The right-hand timeline is a dummy registry history, not three
   stubs.** It follows the Kerala spine as far as this queue
   (e-filing and fee, scrutiny, placement before the magistrate) and
   stops before cognizance. How much of that path has happened is
   derived from the wait: a one-day complaint has only been submitted;
   a months-old one has been through scrutiny and placed. Marks add
   only events the file already carries. Still no registration act.

**Deviations from the reference, logged:**

| Reference | Here | Why |
|---|---|---|
| `‹ Back` link | none | The trail is the way back on the court side; the page is never a step in it (`lib/employee/navigation.ts`) |
| `Download` action | cut | Promises a document bundle that does not exist |
| "View on map" on addresses | cut | No map |
| Breadcrumb ends in "View" | ends in "Register cases" | The heading names the complaint; a crumb repeating the page is what `courtTrail` exists to prevent |
| Timeline newest-first, three placeholder steps | oldest-first; dummy registry history through scrutiny and placement, stopping before cognizance | One ordering for one kind of column; the three-step stub did not fill the rail the reference gave to a timeline. Still no registration act. |
| Title Case, two sections numbered "4" | sentence case, 1–5 | Laws; the duplicate number is a defect |
| Placeholder filings (`asdf`, a stylesheet in the return reason) | Kollam parties, CMP numbers, real §138 vocabulary | §6 below |

## 6. What I cut (and why)

- **A Register row action, even disabled.** Registering is not built.
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
   the complaint receive? A `CMP` complaint taken on file is renumbered
   as a summary trial (`ST/…`), and nobody has said by what rule. This
   is what blocks wiring Admit / Dismiss: the outcome cannot be
   rendered without inventing it. The band stays, dimmed; the owner
   cut the helper line that used to say so. The remaining alternative
   is to drop the band, which would make the file a screen with no
   decision on it.
5. **When does a complaint leave this queue** — and does a dismissed
   complaint stay readable?

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
| 2026-09-09 | The complaint's file added behind the cause title (§5a); the case name becomes a link, superseding §5 and one of §6's cuts. Left panel kept constant per the owner's ask. | user asked; ui-designer |
| 2026-09-09 | A details pass (records out of wells, terms shortened to noun phrases, bank rows collapsed, documents into a sunken well) was built and then reverted at the owner's request. One correctness fix from it was kept: the delay-condonation grounds row no longer cites an application that is not on the file. The reverted work is recoverable from this session's scratchpad. | user asked; ui-designer |
| 2026-09-09 | Documents became realistic filings — per-case filenames, page count and size, and a drawn page facsimile per document kind in the DS `paper` tokens. Absent slots carry no file and no paper. | user asked; ui-designer |
| 2026-09-09 | Two defects fixed: a group's own facts now share the record well, so the sunken block is not present on half the file and missing on the other half; and the accordion's `not-last:border-b` is reset with its own variant, removing the full-strength rule that sat flush against the last panel of every section but the last. | user reported; ui-designer |
| 2026-09-09 | Right-hand case timeline filled with dummy registry history along the Kerala spine, still stopping before cognizance. | user asked; ui-designer |
| 2026-09-09 | The reading index's marked entry rebuilt after the owner reported entries 3–5 lagging, skipping and never activating. Three causes, all in §5a item 1: the observer judged each callback's batch instead of the accumulated state, so a batch carrying one section entering from below outranked the section above it that had merely stopped changing; the reading line was a hard-coded 96px against a resting offset of 88px; and the last sections are too short for their headings to reach any line, which no band can fix. A click now claims the index until the reader scrolls, and the end of the scroll is its own answer. Verified over CDP: 40/40 index clicks correct across four complaints at 1440px and 375px, and 60/60 hand-scroll positions across three viewport sizes. | user reported; ui-designer |
| 2026-09-09 | Helper line on the Admit / Dismiss band cut. The controls stay `aria-disabled`; the copy that used to say the decision is not connected is gone. | user asked; ui-designer |
