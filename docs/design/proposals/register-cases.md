# Register cases

Status: building
Updated: 2026-09-10
Source: docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/actors.md · docs/product/open-questions.md ·
user in this conversation (2026-09-02): screenshot of the legacy Register
Cases list; “get the sense of the idea and, using our table container,
please design this section”; owner (Abhiram) 2026-09-10: the complaint
file critique recorded in §5a and §14
DS read: `vendor/pucar-design-system` (pin `ds.lock.json` →
`pucardotorg/dristi-design-system` e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation`, `table` / `button` / `empty` / `field` /
`input-group` / `pagination` / `select` / `label` / `description-list` /
`accordion` / `attachment` / `item` / `timeline` / `badge`
Skills read: `ui-craft` §0–§5 (layering, stroke, type, spacing ladder),
`propose-ui-brief` + `references/staff-ux-thinking.md` (nine passes)

Code read: `apps/dristi-app/src/components/employee/schedule-screen.tsx`,
`schedule-table.tsx`, `hearings-screen.tsx`, `hearings-table.tsx`,
`list-footer.tsx`, `lib/employee/schedule.ts`, `lib/employee/navigation.ts`,
`components/employee/case-review-screen.tsx`, `lib/employee/case-review.ts`,
`components/cases/document-preview.tsx`,
`components/cases/submission-record-dialog.tsx`,
`components/employee/application-review-dialog.tsx`,
`components/employee/register-advocates-dialog.tsx`,
`components/employee/scrutiny/bundle-view.tsx`,
`lib/filing/types.ts`, `lib/filing/README.md`,
`/Users/abhiramrajilan/Desktop/account-creation-handover.md` (REG-13, REG-14)

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

**Ownership (2026-09-10).** The complaint file is Neer's screen
(court-side owner). This revision is made on `feature/register-advocates`
at the product owner's (Abhiram's) instruction. Neer's reasoning is kept
wherever it survives; every change is attributed in §14. **His `Job:
unconfirmed` is untouched** — nothing in this revision defines what
registration is. It only removes what was invented.

**Who this is for.** Who logs in is still unanswered
(`docs/product/open-questions.md`). The court-side demo runs as a JMFC
magistrate (`lib/employee/content.ts`); that is a demo identity, not a
product fact. This is a staff worklist, so the brief designs for a
professional repeat user (throughput, density) and flags that in §12.

**Where the file's facts come from (confirmed 2026-09-10, ux-designer).**
The e-filing model `lib/filing/types.ts` is the registry of attributes a
§138 complaint actually carries — `Complainant`, `Accused`,
`ChequeDetails`, `DemandNotice`, `Jurisdiction`, `Witness`, `AdrPrayer`,
`IntakeSlot`, `SignState`. It is the *contract* the filing front end
writes and the seam a backend replaces (`lib/filing/README.md`). This
screen reads the other end of that model, so it is the source §5a cites.
Advocate identity traces further, to the account-creation handover:
`REG-13` (Bar registration ID, looked up against the Bar Council
database) and `REG-14` (photo of the Bar ID card).

---

## 2. Problem

1. **The row is a dead end.** The rail already names Register cases and
   carries a count (4 in the transcribed nav, 3 on the screenshot). The
   control says it goes nowhere. *(Resolved 2026-09-09 — the row opens
   the list, the cause title opens the file.)*
2. **The reference is a flat white page.** Title, search and table sit
   on the same sheet with no panel. Hearings and Schedule already
   solved this shape with one lifted table container. A second layout
   for the same kind of queue would be two products. *(Resolved.)*
3. **The reference leans on placeholders and colour.** The search has
   no visible field label that matches DS ACCESSIBILITY §12. Days are
   orange on every row with no other encoding — colour alone. Case
   names are links to a registration flow this build does not have.
   *(Resolved by §5.4 and §5.6.)*

**The complaint file's own problems (found 2026-09-10, owner critique +
the nine passes).** Numbered from 4 so decisions can cite them:

4. **The file's structure is hidden behind a control nobody sees.** All
   five sections are open at first paint, so the `AccordionTrigger`
   chevron is the only thing saying they fold. The owner: “it wasn't
   very apparent to me that litigant details, case-specific details,
   etc. are collapsible accordions until I saw it.” The control is
   invisible when it matters and irrelevant when it is seen — the clerk
   is reading the whole file. *(Pass 6, pattern census: the disclosure
   is the one interaction on this screen with no sibling; every other
   region is a plain panel.)*
5. **The value column is 14 pixels wide at 1280.** The term column is
   pinned at a fixed `17rem` (`FACT_ROW` in `case-review-screen.tsx`)
   because the terms are the e-filing form's own questions — “Date the
   fifteen days from service were complete”. Measured on the render:
   `grid-template-columns: 272px 14px`; a phone number wraps one
   character per line. Derived independently: at 1280 the rail takes
   272px, the page 64px of padding, the two side rails 240 + 272 and
   two 32px gaps — the reading column is ≈368px, its panel ≈318px
   inside, its well ≈286px, and a 272px term track plus a 16px gap
   leaves nothing. *(Pass 4, real weather — the row was designed
   against the viewport, not against the column it lives in.)*
6. **Nineteen of the file's facts are not attributes.** Eleven have no
   field behind them anywhere (“Case category: Criminal”, the accused's
   power of attorney, “Additional details about the cheque”, full/part
   liability, total owed, the Synopsis, the accused's filed letter and
   its document, a document's page count, and two timeline steps).
   Four restate another row. Two are the same on every complaint DRISTI
   will ever hold. Two — a filename and a file size — name an upload no
   store holds. Full accounting in §5a Attributes. *(Pass 9, attribute
   census — the owner's ask: “everything should come from an attribute
   that is traceable, and we shouldn't be inventing new attributes
   everywhere.”)*
7. **Two facts are prose standing in for a field.** “Date of reply to
   the notice” holds either a date or the sentence “No reply received” —
   one slot, two types, and the real attribute (`DemandNotice.replied`,
   a `YesNo`) never appears. “Grounds stated” prints one of two composed
   sentences depending on whether a document arrived, where
   `Jurisdiction.condonationReason` is the field. The Synopsis is the
   pure case: two paragraphs, machine-picked by outcome, filterable by
   nothing. *(Pass 9.)*
8. **Six type levels down one reading column.** `text-title-l` →
   `text-title-s` → `text-body` 600 → `text-body` 500 → `text-body-compact`
   → `text-body` 500 again for values, with the section numbers doing the
   hierarchy the sizes should. Inside one group panel that is three
   weights (600/500/400) against `ui-craft` §1.3's two, and the *value*
   is set larger and heavier than its own term — fifteen rows of
   emphasis, so nothing is emphasised. The owner: “some tokens of
   typography also look a little off … check all the typography and
   spacing usage here.”
9. **The document tile is the wrong component, and part of it is
   fiction.** `Attachment` tiles draw an 80×107 page facsimile that is
   deliberately illegible, then caption it with a derived filename and
   `1 page · 121 KB`. None of them opens. Ten court-side dialogs already
   use the app's one `DocumentPreview`
   (`components/cases/document-preview.tsx`). *(Pass 7, sibling sweep:
   the same fact — a document on a court file — has two renderings on
   the same side of the app.)*
10. **The reading column is the narrowest of three.** Index 240 +
    timeline 272 = 512px of chrome against 368px of file at 1280. The
    two rails, which hold five links and seven dates, outweigh the
    document the screen exists to read. *(Pass 2, domain layout.)*
11. **The tint marks the norm.** The `Alert variant="info"` carrying the
    complainant's two confirmations appears on every complaint, because
    the filing cannot be submitted without them. *(Pass 5 — signal is
    deviation; this one restates the default in the view's scarcest
    colour.)*
12. **One off-ladder size.** The group icon tile is `size-9` (36px);
    the ladder is `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`
    (`AGENTS.md` rule 7a). Everything else on the screen is on it.

---

## 3. Objective

- The rail's Register cases row opens a list the bench can already
  recognise from Schedule hearing.
- A complaint in that queue is findable by cause, number or advocate
  without a second filter axis the reference never had.
- How long each complaint has waited is readable as a number, not only
  as a colour.
- **The file (2026-09-10):** every fact on it can be named as a field of
  the e-filing model or a product-doc citation; the structure of the
  file is visible without operating a control; and a fact row is legible
  at the width of the column it is actually in, not at the width of the
  window. Observable: zero rows in §5a without a source; no
  `grid-template-columns` track under 8rem at 1280; the file column no
  longer the narrowest of the three.

*Provisional while Job is unconfirmed:* what the clerk is reading *for*
is not settled, so “the file is legible and traceable” is as far as this
objective can honestly go. It does not claim the file is sufficient for
a decision — see §12.1.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Register cases is *for*
beyond the rail label and the screenshot. Do not invent a slogan.
**Unchanged 2026-09-10** — nothing in this revision defines the act.

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

## 5a. The complaint's file (added 2026-09-09; revised 2026-09-10)

Owner asked for the legacy Register Cases → View screen, with the
left panel kept constant. Built at
`/employee/register-cases/[caseId]` — `case-review-screen.tsx` over
`lib/employee/case-review.ts`.

**Passes run (2026-09-10):** all nine of
`.claude/skills/propose-ui-brief/references/staff-ux-thinking.md`, in the
skill's order — Tuesday, domain layout, **attribute census (third)**,
control vocabulary, real weather, exception vs. norm, pattern census,
sibling sweep, render judgment. Findings are problems 4–12. **Pass 8 is
discharged only in part and must be re-run on the built screen:** this
session has no shell, so no screenshot was taken and
`npm run check:ds-fresh` was not run — the pin was read from
`ds.lock.json` instead. The one render measurement this revision leans
on is the owner's own (`grid-template-columns: 272px 14px` at 1280),
which the layout arithmetic in problem 5 reproduces independently. The
builder runs `check:ds-fresh` before touching a DS file and re-runs
pass 8 at 1280, 1440 and 375 before reporting done.

1. **Three columns at `lg`: reading index · the file · the case
   timeline.** The index is `sticky` at `--chrome-sticky-top`, marks
   the section being read (`aria-current`), and its entries jump to a
   section. The reference lets it scroll away; keeping it put was the
   owner's ask and the point of a five-part file. Below `lg` it becomes
   the first panel rather than disappearing — chrome must not vanish
   (`ui-craft` §0).

   **The tracks are rebalanced (2026-09-10, judgment).**
   `lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,15rem)]`,
   replacing `15rem / 1fr / 17rem`. Measured: at 1280 the old split gave
   240 + 272 = 512px of rail against **368px** of file, and at 1440,
   512 against 528 — the document the screen exists to read was the
   narrowest column on it (problem 10). The new split gives the file
   **448px** at 1280 and **608px** at 1440. The index holds five entries
   at `text-body-compact`; “Case specific details” wraps to two lines in
   208px, which its `min-h-10` rows already allow. Rejected: dropping the
   timeline below `lg` only (it is the one place the §138 clock is
   visible, and problem 10 is a proportion problem, not a presence
   problem). Given up: two-line index entries at 1280.

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

   **The `open` state and the jump-opens-a-folded-section behaviour go
   with the accordion (item 2a). The claim, the observer and the
   end-of-scroll rule all stay exactly as they are** — they are about
   where the reader *is*, not about what is folded, and they are the best
   reasoning in this brief.
2. **Five numbered sections, sentence case.** Litigant details · Case
   specific details · Additional details · Submissions from the
   accused · Payment details. The reference numbers two sections "4";
   Title Case does not survive the Laws.

   **2a. Not collapsible (confirmed by the owner, 2026-09-10).** The
   `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent`
   goes; each section becomes a plain region — `<section>` with an `h2`,
   keeping `id={anchorFor(section.id)}` and
   `scroll-mt-(--chrome-sticky-top)` so the index still lands on it.
   Every section was open by default and the sticky index already
   navigates, so the fold hid what the clerk is there to read while its
   own affordance stayed invisible (problem 4). Removing it also removes
   three workarounds it forced: the `not-last:border-b-0` variant reset,
   the `h-auto` cancellation of Radix's non-remeasured
   `--radix-accordion-content-height`, and the `flushSync` that had to
   commit an unfold before a scroll could reach it. Rejected: keeping
   the accordion and adding a visible “collapse all” control — that
   spends a control on a state nobody asked for. Given up: the ability to
   fold away a section already checked; nobody has asked for it, and the
   index is the way back. *Owner (Abhiram), 2026-09-10.*
3. **One lifted panel per group, and one well inside it for the
   content** — whether that content is several named records (a party,
   a cheque, an advocate) or the group's own facts plus the documents
   backing them. The fill is what separates a group's parts; nothing
   inside carries a border. A group with nothing on the file keeps
   no well — a sunken box around one muted sentence is a grey void, and
   the sentence is the whole content. *Revised 2026-09-09.*

   **Unchanged in substance 2026-09-10; two spacing corrections.** With
   the accordion gone the section rhythm is stated directly rather than
   inherited: reading column `flex flex-col gap-8`, each section
   `flex flex-col gap-4` (h2 → groups), groups `gap-6`. Heading sits
   closer to its content (4) than groups sit to each other (6), which sit
   closer than sections (8) — spacing before strokes, `ui-craft` §1.1,
   and no rule is needed anywhere. And the group's icon tile drops from
   the off-ladder `size-9` to `size-8` with its `size-4` icon
   (problem 12; `AGENTS.md` rule 7a).
4. **Fact rows use the DS `DescriptionList` at its own default column.**
   `FACT_ROW`'s `sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]` is
   deleted. The DS default is
   `grid-cols-[minmax(7rem,10rem)_1fr] gap-4 py-3`, and it works the
   moment the terms stop being the form's questions — see item 4a. The
   `border-b border-border` the DS row ships still drops to
   `border-hairline`: fifteen rows at full strength would be the darkest
   marks on the page (`ui-craft` §1.1).

   **The row switches on the container, not the viewport
   (2026-09-10, judgment).** `@container` on the well; the two-column
   grid applies at `@xs` (20rem) and the row stacks below it. This is
   the direct fix for problem 5: `sm:` asks how wide the *window* is,
   and the window was never the constraint — the reading column was. At
   1280 the well is ≈350px wide inside the rebalanced tracks, so rows
   are two-column with a 112–160px term and a 174px value; at 1440,
   160 and 334; on a 375 phone the well is ≈245px and the rows stack,
   which is the same answer the old `sm:` rule gave for the right
   reason. Container queries are already Dristi's idiom
   (`scrutiny/bundle-view.tsx` uses `@md:`). Rejected: stacking every
   row always (fifteen two-line rows per group, and the term/value pair
   stops being scannable); rejected: a wider fixed term column (the same
   defect at a different number).

   **4a. A term is the attribute's name, not the form's question
   (confirmed by the owner, 2026-09-10).** “Date when the 15 days from
   service of legal demand notice was complete” becomes **“Notice period
   ended”**; “Date of return as per the cheque return memo” becomes
   **“Returned on”**; “Power of attorney given to somebody else” becomes
   **“Power of attorney”**. The fix is upstream of layout — with
   attribute names, the DS default column holds and both the `FACT_ROW`
   override and the 14px bug disappear at once. The full renaming is
   the `slot` column of §5a Attributes. *Note for the record:* a “terms
   shortened to noun phrases” pass was built and then reverted on Neer's
   branch on 2026-09-09 at **his** session's request; this one is made at
   the product owner's, which is why it stands.
5. **Identity facts at the top are one caption line, not a grid.**
   *(Revised 2026-09-10.)* Decision 4 below the header (item 4b) removes
   Case category and Case type, which leaves Court and Submitted on —
   two facts. A five-column `DescriptionList` of label-above-value
   holding two facts is a grid drawn around nothing, so they join the
   eyebrow the number and the wait already occupy:
   `CMP/1840/2025 · Kollam JMFC-II · Submitted 4 Dec 2024 · 281 days
   waiting`, at `text-caption` 500 `text-muted-foreground`, the wait in
   `text-warning-ink`, dates and numbers `tabular-nums`. `IdentityFact`
   and the header `DescriptionList` are deleted. The status stays a
   `Badge` beside the `h1` — it is a closed enum with one member and it
   is the one thing on the header that could change. Rejected: keeping
   two label-above-value cells (a two-cell grid is a list with
   ceremony). Given up: the explicit word “Court” before the court's
   name; a court name in Kerala is self-identifying, and the alternative
   was a label at the same size as its value.

   **4b. The header's constants go (confirmed by the owner,
   2026-09-10).** “Case category: Criminal” and “Case type: S.138,
   Negotiable Instruments Act, 1881” are identical on every complaint
   DRISTI will ever hold — the registry proves it: `FilingDraft.caseType`
   is the one-value union `"s138"`. This is the constant-column defect
   already killed on the queues. Court and Submitted on stay; Court is
   constant *within this queue* (it is the signed-in court) but not
   within the product, and the owner kept it.
6. **Documents use the app's `DocumentPreview`** (confirmed by the
   owner, 2026-09-10), replacing the `Attachment` tiles. *Revised
   2026-09-10; supersedes the 2026-09-09 version of this item.*

   **The list, then the document.** The nearest sibling is
   `components/cases/submission-record-dialog.tsx`, which is the app's
   answer to “a record with several documents on it”: an `Item
   variant="outline"` list naming each document, and one
   `DocumentPreview` for the one being read. A document that is not on
   file renders as a non-interactive `Item` reading **“Not on file”** —
   the same treatment, in the same component, that the sibling already
   gives a document with no source. So each group's documents become
   that list. There is no room for eighteen inline wells in a 448px
   column, so opening a row opens **one** document dialog —
   `ChromeDialogContent` + `DocumentPreview variant="quiet" height="fill"`
   with `source={{ kind: "composed", … }}`, which is exactly what
   `employee/register-advocates-dialog.tsx` composes for the Bar ID card.
   No third way is introduced; both idioms already exist on the court
   side.

   **What survives from Neer's version, and why.** The page facsimile
   (`PageFacsimile` and its six `*Marks` shapes) stays, as the
   `composed` content of the well rather than as an 80×107 tile —
   bounded (`w-64`, centred) so a bounded drawing does not become a
   full-page one. His two rules stay with it and are the best part of
   the old item: a facsimile says “a page of this kind is on the file”
   and is **deliberately not legible**, because readable text would be
   fabricating a court record; and **an absence is never dressed as a
   blank sheet** — an absent document gets no paper at all. Six shapes
   rather than one icon, for his reason: a clerk tells a cheque from a
   demand notice without reading.

   **What goes.** The derived filename, the page count and the file
   size (`id-proof-complainant.pdf · 1 page · 121 KB`). There is no
   court-side document store; `StoredFileRef` holds a name and a size on
   the *filer's* side and nothing holds a page count anywhere, so all
   three were fixtures wearing a field's clothes (problem 6). Download
   is not passed, so `resolveDownload` omits the button rather than
   shipping it dead — the same honesty as the decision band. And the
   advocate's document is relabelled from “ID proof” to **“Bar ID
   card”**, which is what `REG-14` collects and what the file holds;
   `REG-13`/§5.2 of the handover record that address and ID proof are
   *not* collected at advocate registration.

   *Given up:* the twelve-tile-per-page overview a grid of thumbnails
   gave, and one click to see a page. *Risk accepted:* the quiet variant
   keeps its own “Full view” inside a dialog that is already big — the
   same duplication `register-advocates-dialog` ships, and matching the
   sibling beats a local exception (§11).
7. **Register / Dismiss are pinned, real, and honestly dead.**
   *(Revised 2026-09-10 — confirmed by the owner.)* The footer reads
   **Register case** / **Dismiss case**. “Admit” goes: the rail row, the
   queue, this brief and the timeline's last step all say *register*, and
   a fourth verb for the same act on the one screen that performs it is
   how two vocabularies start. Both stay `aria-disabled`; no helper line.
   The owner cut the “not connected yet” copy (2026-09-09) — dimming
   carries the unbuilt state, and a tooltip would hide the same fact
   behind hover (ACCESSIBILITY §7). One teal, on Register.
   *(Pass 3, control vocabulary: the word on the control is now the word
   the user would say aloud, and the same word the nav uses.)*
8. **Particulars are derived from the queue row, not transcribed.** The
   §138 chain is worked backwards from today minus the row's wait, so
   every one of the 35 complaints opens a file that is internally
   consistent and legally coherent (deposit inside three months, notice
   inside thirty days, accrual exactly fifteen days after service —
   asserted in `case-review.test.ts` across the whole queue). Only the
   *states* are named per row in `CASE_FILE_MARKS`: a stopped payment,
   a part-liability cheque, no witness, a missing application.

   **Clarified 2026-09-10:** a derived *value* is legitimate demo data; a
   derived *attribute* is not. `CASE_FILE_MARKS` is the demo's way of
   choosing values, and every mark must land in a field the registry
   holds. Three do (`returnReason` → `ChequeDetails.returnReason`;
   `delayed` → `Jurisdiction.causeDate`/`filingDate`; `missing` →
   `IntakeSlot.file === null`). `witnesses` maps to the `Witness[]`
   length. `replied` maps to `DemandNotice.replied`. **`partialLiability`
   does not map to anything** and is re-pointed at
   `DemandNotice.paymentStatus` / `partAmount`, which is the real field
   for “part of it was paid”. **`accusedSubmissions` maps to nothing at
   all** and goes (item 9a). §5a Attributes marks which is which.
9. **The right-hand timeline carries traceable events only.**
   *(Revised 2026-09-10 — confirmed by the owner.)* Five steps, each an
   event the product records, plus the current wait and the decision
   that has not been made:

   | Step | Source |
   |---|---|
   | Complaint submitted | `FilingDraft.status: "filed"` + `submittedAt`; Kerala spine step 1 (`product-foundation.md` L72) |
   | Court fee received | `SignState.paid` / `paidAt` / `paidAmount`; spine step 1 — “court fee on filing” |
   | Delay condonation application filed | `Jurisdiction.condonationReason` + the application's `IntakeSlot`; conditional, and only when the application is actually on the file |
   | Taken up for scrutiny | Spine step 2, “Scrutiny & defect check (Registry; before numbering / cognizance)” (L73) |
   | Scrutiny completed | Spine step 2 |
   | Waiting to be registered | Derived from `daysSinceSubmitted` — the queue's own current state |
   | Registration decision · Not made | The act this build does not perform (§5.7) |

   **Deleted:** *Placed before the magistrate* and *Letter from the
   accused received*. Neither appears anywhere in `docs/product/` — the
   spine goes filing → scrutiny → **cognizance**, with no placement step
   between, and nothing in the product records a letter from an accused
   who has not been summoned. Ordering stays oldest-first, matching the
   case history on a listing's overview: two orderings for the same kind
   of column on the same side of the app is how two screens start
   disagreeing about which end is the present.

   **9a. The accused's invented submission goes with it.** The
   `accusedSubmissions` mark, its fact (“Filed: A letter asking that the
   complaint not be entertained”) and its document are cut for the same
   reason as the timeline step. Section 4 therefore always reads
   “Nothing on record — the accused has not been summoned yet”, which is
   *product copy answering a question the court asks*, not a fact with a
   missing source. **Flagged, not decided:** a section whose answer is
   fixed by where the complaint sits in the flow may not deserve a
   section. It stays for now because the reference has it and because
   §12.3 (when a complaint enters this queue) is open; if product
   answers that the accused can never have filed before registration,
   the section should be cut and the file becomes four parts. *ux-designer;
   raised for the owner.*
10. **The complainant's confirmations become fact rows, not a tinted
    alert.** *(Added 2026-09-10.)* The `Alert variant="info"` carrying
    “The complainant has confirmed …” appears on **every** complaint,
    because the filing cannot be submitted without both declarations —
    it spends the view's scarcest resource restating the default
    (problem 11; `ui-craft` §1.4, pass 5). And its second bullet is the
    return reason already stated two rows above, rewritten into a
    sentence (`RETURN_REASONS[…].sworn` exists only to make that sentence
    read). So: one fact row in the cheque group — term **“Deposited
    within three months”**, value **“Confirmed by the complainant”**
    (closed enum: confirmed / not confirmed, checkable against
    `presentDate − dateOnCheque`) — and the second bullet is deleted as a
    duplicate. `CaseConfirmations` and `RETURN_REASONS.sworn` go with it.
    Rejected: keeping the alert and un-tinting it (a notice that reports
    nothing is still a notice).

**Deviations from the reference, logged:**

| Reference | Here | Why |
|---|---|---|
| `‹ Back` link | none | The trail is the way back on the court side; the page is never a step in it (`lib/employee/navigation.ts`) |
| `Download` action | cut | Promises a document bundle that does not exist |
| "View on map" on addresses | cut | No map |
| Breadcrumb ends in "View" | ends in "Register cases" | The heading names the complaint; a crumb repeating the page is what `courtTrail` exists to prevent |
| Timeline newest-first, three placeholder steps | oldest-first; five traceable events, the current wait, and the unmade decision | One ordering for one kind of column; every step now names a source (§5a.9) |
| Title Case, two sections numbered "4" | sentence case, 1–5 | Laws; the duplicate number is a defect |
| Collapsible sections | plain regions | §5a.2a — every section was open, and the control was invisible until found |
| Placeholder filings (`asdf`, a stylesheet in the return reason) | Kollam parties, CMP numbers, real §138 vocabulary | §6 below |

---

## 5a. Attributes (value → source → type → slot)

**How to read this.** *Source* is the field a real backend would hold —
`lib/filing/types.ts` is the e-filing contract (`lib/filing/README.md`:
“`types.ts` is the contract… the seams are where engineering swaps the
local implementation for DRISTI's services”) — or a `docs/product/`
citation, or a `REG-nn` requirement. *Type* is `data` · `closed enum` ·
`user free text` · `product copy`. A **derived value** off
`CASE_FILE_MARKS` or the §138 chain is fine where the attribute is real;
a derived *attribute* is not, and is marked ✂.

**Totals: 107 rows. 11 have no source at all** (✂ invented). Four more
restate another row, two are constant on every record DRISTI will hold,
and two name an upload no store holds — 19 removals in all, against 4
real attributes added and 6 terms renamed or retyped.

### Header

| Value | Source | Type | Slot |
|---|---|---|---|
| `CMP/1840/2025` | `RegisterCase.caseNumber`; issued at filing as `SignState.caseFileNumber` | data | eyebrow, `tabular-nums` |
| `Rajan Krishnan v. Quilon Cashew Exports` | derived: `Complainant.name` v `Accused.name` | data (derived value, real attributes) | `h1` |
| `281 days waiting` | derived: today − `submittedAt` | data (derived) | eyebrow, `warning-ink` |
| `Submitted 4 Dec 2024` | `FilingDraft.submittedAt` / queue row | data | eyebrow |
| `Kollam JMFC-II` | `CURRENT_STAFF.court` (session) | data — constant *within* this queue, not within the product | eyebrow |
| `Waiting to be registered` | `CASE_REVIEW_STATUS` — the queue's one state | closed enum (one member today) | `Badge` |
| ~~`Criminal`~~ | **none** ✂ | — | cut (§5a.4b) |
| ~~`S.138, Negotiable Instruments Act, 1881`~~ | `FilingDraft.caseType` — the one-value union `"s138"` | constant on every record | cut (§5a.4b) |

### 1 · Litigant details

| Value | Source | Type | Slot |
|---|---|---|---|
| Complainant's name | `Complainant.name` | data | record heading |
| `Individual` | `Complainant.type` | closed enum | record tag |
| Mobile number | `Complainant.mobile` | data | `Mobile` |
| Email | `Complainant.email` | data | `Email` |
| Age | `Complainant.age` | data | `Age` |
| Permanent address | `Complainant.perm` | data | `Permanent address` |
| Current address | `Complainant.res`, shown when `permSame === "no"` | data | `Current address` — **today both rows print the same string under two labels** |
| `No` | `Complainant.poa` | closed enum (`YesNo`) | `Power of attorney` (was “Power of attorney given to somebody else”) |
| ID proof | `IntakeSlot.docType: "id-proof"` | data (file ref) | document row |
| Affidavit u/s 225 BNSS | `Intake.supporting` slot | data | document row |
| Accused's name | `Accused.name` | data | record heading |
| `Company` | `Accused.type` + `entType` | closed enum + user free text | record tag |
| Authorised signatory | `Accused.reps[].name` — an **array** under S-141 | data | `Authorised signatory` |
| Mobile number | `Accused.contacts[].mobile` (array) | data | `Mobile` |
| Email | `Accused.contacts[].email` | data | `Email` |
| Registered office | `Accused.addresses[]` (array) | data | `Registered office` |
| ~~`No`~~ (accused's power of attorney) | **none** ✂ — `poa` exists on `Complainant` only | — | cut |
| ID proof | `IntakeSlot.docType: "id-proof"` | data | document row |
| Company documents | `Intake.supporting` slot | data | document row |

### 2 · Case specific details

| Value | Source | Type | Slot |
|---|---|---|---|
| `Cheque no. 483920` | `ChequeDetails.chequeNumber` | data | record heading |
| ~~Signatory of the dishonoured cheque~~ | `Accused.reps[]` — **restates the Authorised signatory row** | duplicate | cut |
| Cheque amount | `ChequeDetails.amount` | data | `Amount` |
| Date of the cheque | `dateOnCheque` | data | `Cheque dated` |
| ~~Payee name on the cheque~~ | derived = `Complainant.name` — **restates the complainant record and the cause title** | duplicate | cut |
| Payee bank | `Jurisdiction.payeeBankName` | data | `Payee bank` |
| Payee bank branch | `Jurisdiction.payeeBankBranch` | data | `Payee branch` |
| Payee IFSC | `Jurisdiction.ifsc` | data | `Payee IFSC` |
| Payer bank | `ChequeDetails.bankName` | data | `Payer bank` |
| Payer bank branch | `ChequeDetails.bankBranch` | data | `Payer branch` |
| Payer IFSC | `ChequeDetails.ifsc` | data | `Payer IFSC` |
| Date deposited | `presentDate` | data | `Deposited on` |
| Date of return | `returnDate` | data | `Returned on` (was “Date of return as per the cheque return memo”) |
| `Funds insufficient` | `ChequeDetails.returnReason` | **user free text** in the registry (machine-prefilled from the memo); the screen renders a 3-value enum | `Return reason` — flagged in §12.7 |
| Police station (payee bank) | `Jurisdiction.payeePolice` | data | `Police station — payee bank` |
| Police station (drawer bank) | `Jurisdiction.drawerPolice` | data | **added** — today one unqualified row stands for two fields |
| ~~Additional details about the cheque~~ | **none** ✂ — no such field on `ChequeDetails`; empty on every record | — | cut |
| `Confirmed by the complainant` | the filing declaration; checkable against `presentDate − dateOnCheque ≤ 90` | closed enum | **added** as `Deposited within three months` (was half a tinted Alert — §5a.10) |
| ~~“returned because of the insufficiency of funds”~~ | `RETURN_REASONS[…].sworn` — **restates the Return reason row as a sentence** | duplicate / prose | cut |
| Dishonoured cheque | `IntakeSlot.docType: "cheque-front"` | data | document row |
| Proof of deposit | `Intake.supporting` slot | data | document row |
| Cheque return memo | `IntakeSlot.docType: "return-memo"` | data | document row |
| Nature of the debt | `DemandNotice.natureDebt` | user free text | `Nature of the debt` |
| ~~Cheque received for full or part liability~~ | **none** ✂ | — | cut |
| ~~Amount covered by the cheque~~ | `ChequeDetails.amount` — **restates the cheque amount** | duplicate | cut |
| ~~Total amount claimed to be owed~~ | **none** ✂ | — | cut |
| `Part payment made` | `DemandNotice.paymentStatus` (`"" \| "none" \| "part"`) | closed enum | **added** — the real field the `partialLiability` mark should have pointed at |
| Part payment amount | `DemandNotice.partAmount` | data | **added**, shown when `paymentStatus === "part"` |
| Why the cheque was issued | `DemandNotice.whyIssued` | user free text | replaces “Additional details of the debt or liability” |
| Proof of the debt or liability | `Intake.supporting` slot | data | document row |
| Date dispatched | `DemandNotice.dispatchDate` | data | `Notice dispatched` |
| Date of service | `DemandNotice.deliveryDate` | data | `Notice served` |
| `Yes` / `No` | `DemandNotice.replied` (`YesNo`) | closed enum | `Reply received` — **today a date, or the sentence “No reply received”, in one slot** (problem 7) |
| Notice period ended | `Jurisdiction.causeDate` | data | `Notice period ended` (was “Date the fifteen days from service were complete”) |
| Legal demand notice | `IntakeSlot.docType: "demand-notice"` | data | document row |
| Proof of dispatch | `"dispatch-proof"` | data | document row |
| Proof of service | `"delivery-proof"` | data | document row |
| Reply to the notice | `"notice-reply"` | data | document row |
| `No` | derived: `filingDate − causeDate > 30` (`FILING_WINDOW_DAYS`, §142(b)) | closed enum | `Filed within one month` |
| Days beyond the month | derived from the same two dates | data | `Days beyond the month` |
| Grounds stated | `Jurisdiction.condonationReason` | user free text | `Grounds` — **today one of two composed sentences** (problem 7) |
| Delay condonation application | `Intake.supporting` slot | data | document row |

### 3 · Additional details

| Value | Source | Type | Slot |
|---|---|---|---|
| Witness's name | `Witness.fullName` | data | record heading |
| Speaks to | `Witness.prove` | user free text | `Speaks to` — real attribute, but the demo prints one constant string on every witness |
| Mobile number | `Witness.contacts[].mobile` | data | `Mobile` |
| ~~Synopsis~~ | **none** ✂ — two paragraphs composed by outcome (`marks.replied`) | — | cut (problem 7) |
| Prayer | `AdrPrayer.finalRelief` | user free text | `Prayer` |
| Additional details | `AdrPrayer.otherDetails` | user free text | `Other details` |
| Complaint | `Intake.supporting` slot | data | document row |
| Affidavit u/s 223 BNSS | `Intake.supporting` slot | data | document row |
| Advocate's name | `Advocate.name` | data | record heading |
| `For the complainant` | `Advocate.forComplainants` | data | record tag |
| Bar registration | `Advocate.barNumber`; `REG-13` (looked up against the Bar Council database) | data | `Bar registration` |
| Bar ID card | `REG-14` (photo of Bar ID card) | data | document row — **relabelled** from “ID proof”; the handover records that ID proof is *not* collected at registration |
| Vakalatnama | `IntakeSlot.docType: "vakalatnama"` | data | document row |

### 4 · Submissions from the accused

| Value | Source | Type | Slot |
|---|---|---|---|
| ~~“A letter asking that the complaint not be entertained”~~ | **none** ✂ | — | cut (§5a.9a) |
| ~~Letter from the accused~~ | **none** ✂ | — | cut (document) |
| “Nothing on record — the accused has not been summoned yet” | the flow: no summons before registration (`product-foundation.md` spine 3–4) | **product copy** | group empty state — guidance, correctly not a fact |

### 5 · Payment details

| Value | Source | Type | Slot |
|---|---|---|---|
| Court fee paid | `SignState.paidAmount` | data | `Court fee paid` |
| Receipt number | `SignState.paymentRef` | data | `Receipt number` |
| Payment receipt | `Intake.supporting` slot | data | document row |

### Timeline

| Value | Source | Type | Slot |
|---|---|---|---|
| Complaint submitted | `FilingDraft.submittedAt`; spine step 1 | data | `TimelineItem status="past"` |
| Court fee received | `SignState.paid` / `paidAt`; spine step 1 | data | past |
| Delay condonation application filed | `Jurisdiction.condonationReason` + the application slot | data (conditional) | past |
| Taken up for scrutiny | spine step 2 (`product-foundation.md` L73) — **no store holds it today** | data (unbacked) | past |
| Scrutiny completed | spine step 2 — no store today | data (unbacked) | past |
| Waiting to be registered · “281 days so far” | derived from `daysSinceSubmitted` | closed enum (the current state) + derived detail | `status="current"` |
| Registration decision · “Not made” | the unbuilt act (§5.7) | product copy | `status="future"` |
| ~~Placed before the magistrate~~ | **none** ✂ — the spine runs scrutiny → cognizance with no placement step | — | cut (owner) |
| ~~Letter from the accused received~~ | **none** ✂ | — | cut (owner) |

### Every document row (applies ~18 times)

| Value | Source | Type | Slot |
|---|---|---|---|
| The court's label for the document | `IntakeSlot.label` | closed enum (the form's slot list) | `ItemTitle` |
| `Filed` / `Not on file` | `IntakeSlot.file !== null` | closed enum | `ItemDescription` |
| Which page shape to draw | derived from `IntakeSlot.docType` (11 members → 6 shapes) | presentation, not a fact | facsimile |
| ~~`return-memo-06-08-2025.pdf`~~ | `StoredFileRef.name` exists on the *filer's* side; **no court-side store**, so the value was generated | attribute real, value fabricated | cut |
| ~~`1 page · 121 KB`~~ | page count: **none anywhere** ✂. Size: `StoredFileRef.size`, fabricated by `fileSize()` | — / fabricated | cut |

### Real attributes the file does **not** show

Not a proposal — a record of what the registry holds so the next reader
can see the gap rather than invent a field: `DemandNotice.modeService`,
`tracking`, `delivered`, `nonDeliveryReason`; `Jurisdiction.otherPending`
+ `otherCases` (other proceedings between the same parties);
`AdrPrayer.adr` and `interimRelief`; `Witness.designation`, `age`,
`addresses`; `Complainant.poaHolder` (the PoA holder's own record, when
`poa === "yes"`); `Accused.jurisdiction`; `SignState.paidAt`.
Whether a registering court reads any of them is §12.6.

---

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

**Cut from the file, 2026-09-10:**

- **Eleven invented attributes**, listed ✂ in §5a: the case category;
  the accused's power of attorney; “Additional details about the
  cheque”; full-or-part liability and the total owed; the Synopsis; the
  accused's filed letter and its document; a document's page count; and
  the two timeline steps the owner named.
- **Four duplicates.** The cheque's signatory (the accused's record has
  it), the payee's name (the cause title has it), the amount covered by
  the cheque (the cheque has it), and the sworn return reason (the row
  above has it, unrhetorically).
- **Two constants.** Case category and case type are the same on every
  §138 complaint; `FilingDraft.caseType` being a one-value union is the
  proof, not an opinion.
- **The filename, page count and size on every document tile.** A
  plausible fixture in the shape of a field is worse than no field: it
  invites a reader to trust it and a builder to keep it.
- **The tinted confirmations alert.** It marked the norm (§5a.10).
- **The accordion, and the three workarounds it required.**
- **`IdentityFact` and the header's five-column `DescriptionList`.**
  Two facts do not need a grid.
- **A “collapse all” control**, which is what a reasonable person adds
  when told the accordion is invisible. The right answer was fewer
  controls, not a louder one.
- **A per-group document *grid*.** Twelve thumbnails give a good
  overview and cost a component the app does not otherwise use; the
  sibling's list-plus-preview is the idiom, and one idiom beats a
  better-in-isolation second one.
- **Not cut, deliberately:** section 4, which will always read “nothing
  on record”. It is flagged in §5a.9a for the owner rather than removed
  under a product question that is still open (§12.3).

**The long-label / other-language case.** Terms are now attribute names,
which is what makes translation survivable: “Notice period ended” has
room to triple in Malayalam inside a `minmax(7rem,10rem)` track that can
also stack, where “Date when the 15 days from service of legal demand
notice was complete” had none in any language. The container query is
what enforces it — a term that outgrows its track at a given column
width stacks at that width, whatever the window is doing.

---

## 7. Layout & hierarchy

**The queue** (unchanged):

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

**The complaint's file** (revised 2026-09-10):

- Page: `p-6 md:p-8`, header panel then the three-column grid, `gap-8`.
- Grid at `lg`:
  `grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,15rem)] gap-6 lg:gap-8`.
  **Measured widths of the middle column: 448px at 1280, 608px at 1440**
  (page 1008/1168 − 64 padding − 208 − 240 − 64 of gaps). Its panel is
  ≈382px / ≈542px inside; its well ≈350px / ≈510px. Every row metric
  below is designed for those numbers, not for the viewport.
  Below `lg`: index, timeline, file, stacked.
- Header panel: one lifted sheet at page width. Eyebrow caption line →
  `h1` + status `Badge`. No fact grid.
- Reading column: `flex flex-col gap-8`; each section
  `<section id=… class="flex flex-col gap-4 scroll-mt-(--chrome-sticky-top)">`
  with an `h2` and its group panels at `gap-6`. No accordion, no rules.
- Group panel: lifted panel, `p-6 gap-4`; `size-8` sunken icon tile +
  `h3`; then one sunken well per record and one for the group's own
  facts and documents.
- Well: `rounded-lg bg-surface-sunken p-4 gap-3`, `@container`,
  borderless (`ui-craft` §4, box-in-box ban).
- Documents inside the well: a `text-caption` “Documents” label, then a
  stacked `Item variant="outline"` list at `gap-2`.
- Decision band: sticky footer, `border-t border-hairline bg-card`,
  Dismiss case (ghost) then Register case (teal), both `aria-disabled`.

**The type hierarchy — six levels down to four sizes.** Each does one
job; hierarchy is carried by size *and* colour, not by the section
numbers (`ui-craft` §3, DS typography “hierarchy comes from size and
weight”):

| Role | Token | Weight | Colour |
|---|---|---|---|
| Page title (one per screen) | `text-title sm:text-title-l` | 600 | foreground |
| Section heading (`h2`, 1–5) | `text-title-s` | 600 | foreground |
| Group heading (`h3`, panel title) | `text-body` | 600 | foreground |
| Record name (party, cheque, advocate) | `text-body` | 500 | foreground |
| Term | `text-body-compact` | 400 | `text-muted-foreground` |
| Value | `text-body-compact` | 400 | foreground; `tabular-nums` when numeric; `text-muted-foreground` for “Not stated” |
| Eyebrow / tag / “Documents” label | `text-caption` | 500 | `text-muted-foreground`; the wait in `text-warning-ink` |

Two changes from today, both on the value: it drops from `text-body`
(16) to `text-body-compact` (14) and from 500 to 400 — which is the DS
`DescriptionList` default (`DescriptionTerm` muted, `DescriptionDetails`
foreground, both 14) and the reason the DS default exists. Today the
value is *larger and heavier than its own term*, so fifteen rows read as
fifteen emphasised strings and the pair is distinguished by nothing. At
400/400 the pair is distinguished by colour, which is `ui-craft` §1.3's
own instruction: prefer colour over a third weight. Weights per
component then hold at two — the panel is 600 (title) + 500 (record
name); the well is 500 (record name) + 400 (rows). `text-body-compact`
is sanctioned here and only here: DS typography allows it for “dense
staff tables — opt-in, never citizen-facing default”, and this is a
staff worklist (§1, who this is for). Rejected: keeping 16px values for
readability — at a 350px well that buys two-line values on half the
rows, and the DS already decided this pair.

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

The complaint's file:

| Region | DS / app component |
|---|---|
| Header, index, timeline, group panels | composed `section` / `nav` with the panel classes |
| Case status | `Badge variant="secondary"` |
| Section (1–5) | plain `<section>` + `h2` — **`Accordion` removed** |
| Fact rows | `DescriptionList` / `DescriptionRow` / `DescriptionTerm` / `DescriptionDetails`, DS default columns |
| Record / document well | `div` on `bg-surface-sunken` (DS well, borderless) |
| Document list | `Item` / `ItemContent` / `ItemTitle` / `ItemDescription`, `variant="outline"` — the `submission-record-dialog` idiom |
| Document viewer | `ChromeDialogContent` + app `DocumentPreview variant="quiet" height="fill"` with a `composed` source — the `register-advocates-dialog` idiom |
| Page facsimile | `PageFacsimile` in DS `paper` tokens, kept from the current build, bounded inside the well |
| Case timeline | `Timeline` / `TimelineItem` |
| Decision band | `Button` primary + ghost, `aria-disabled` |
| **Removed** | `Attachment` + `AttachmentMedia` / `Content` / `Title` / `Description`; `Alert` (`CaseConfirmations`); `Accordion*` |

---

## 9. Spacing

`p-6` panel, `gap-6` panel stack, `gap-8` page sections, `gap-4` filter
row and table-to-footer, `px-4 py-3` cells, `h-10` controls. Ladder
only.

The file, audited against the ladder 2026-09-10
(`0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`, micro steps inside
controls only): page `p-6 md:p-8`; page stack `gap-8`; grid `gap-6
lg:gap-8`; reading column `gap-8`; section `gap-4`; groups `gap-6`;
panel `p-6 gap-4`; well `p-4 gap-3`; rows `py-3` with `gap-4` between
term and value; documents `gap-2`; index rows `min-h-10 px-3 py-2`;
decision band `px-6 py-3 md:px-8 md:py-4`. **One off-ladder value found
and fixed: `size-9` on the group icon tile → `size-8`** (problem 12).
Radius nesting holds: panels `rounded-xl` (14) → wells and `Item` rows
`rounded-lg` (10) → nothing smaller nested inside them (`ui-craft` §4).

---

## 10. States (empty / loading / error / partial / long-label)

**The queue** (unchanged):

- **Empty queue:** “Nothing waiting” — the court is up to date; no
  action. Icon `FolderCheck`.
- **Filtered empty:** “No matters match this search” + Clear search.
- **Loading / error:** none — demo data, no backend.
- **Partial:** a side with no vakalat is omitted (`CounselCell` already).
- **Long label:** cause title wraps (`whitespace-normal`); corporate
  accused in the demo; search field `min-w-0`.

**The complaint's file:**

- **Unknown id:** the `Empty` + “Back to register cases” page that
  already ships (`CaseReviewMissing`).
- **Empty group** (no witness, no advocate on record): the group panel
  keeps its heading and states the absence in one muted `text-body`
  line, with no well around it (§5a.3).
- **Empty fact:** “Not stated” in `text-muted-foreground`, never a blank
  cell — the form asked the question and the filer answered nothing,
  which is itself a fact the court is reading. Kept from Neer's build.
- **Absent document:** a non-interactive `Item` reading “Not on file”.
  No paper, no facsimile, no filename — an absence is never dressed as a
  blank scan (kept from §5a.6).
- **Partial file:** `r-1588` (delayed, application never uploaded) and
  `r-1490` (no advocate, accused's ID proof missing) are the rows to
  check; both must read as *incomplete*, not as broken.
- **Loading / error:** none — derived data, no backend. When a document
  store arrives, the well's own states apply (`DocumentPreview` already
  renders a failure in words and keeps Download reachable).
- **Long label / other language:** covered in §6. The two regions that
  can still break are the index entry (two lines at 208px, allowed by
  `min-h-10`) and the timeline label at 192px, which wraps. The
  eyebrow's four items wrap as a group at 375px.
- **N items (pass 4):** `Accused.reps[]`, `contacts[]` and
  `addresses[]` are arrays, and S-141 means an institution can carry
  several people in charge — today one of each is rendered. Every one is
  a record in its group's well, numbered when there is more than one,
  which is the pattern the complainant and witness records already use.

---

## 11. Risks accepted

- The list can be mistaken for a place where registration happens. The
  missing action is the honesty; a caption that over-explains would
  dress up the gap.
- `warning-ink` on every days cell is a coloured mark per visible row. At
  10 per page that is above the craft budget of ~3 status marks; accepted
  so the column stays one fact.
- **The document dialog carries a “Full view” inside a dialog that is
  already near full size** — `DocumentPreview`'s quiet variant offers it
  and there is no prop to suppress it. `register-advocates-dialog` ships
  the same duplication; matching the sibling beats a local exception.
- **The facsimile is a drawing, and at well size it reads more like a
  wireframe than a scan.** Bounded to `w-64` and centred to keep it from
  filling the well. Accepted because the alternative — legible facsimile
  text — fabricates a court record, which is the one thing a demo of a
  case file must not do.
- **Two timeline steps (scrutiny taken up, scrutiny completed) name real
  spine events that no store holds**, so their dates are derived from
  the wait. Kept because the spine is a product fact and the events are
  the ones the queue sits between; flagged here so nobody reads them as
  live.
- **Section 4 will always read “nothing on record”** until §12.3 is
  answered. Flagged, not cut (§5a.9a).
- **Losing the fold** costs a reader with a very long file the ability to
  put a checked section away. The index is the mitigation.

---

## 12. Open questions for product

1. **What is this screen's job?** Taking cognizance, numbering a
   complaint, or something else the registry does?
2. **Who does it?** Magistrate, bench clerk, scrutiny officer,
   sheristadar?
3. **When does a complaint enter this queue?** After e-filing, after
   scrutiny, after defects are cleared? *(Now also decides whether
   section 4 should exist at all — §5a.9a.)*
4. **What does Register do**, when it exists — and what number does
   the complaint receive? A `CMP` complaint taken on file is renumbered
   as a summary trial (`ST/…`), and nobody has said by what rule. This
   is what blocks wiring Register / Dismiss: the outcome cannot be
   rendered without inventing it. The band stays, dimmed; the owner
   cut the helper line that used to say so. The remaining alternative
   is to drop the band, which would make the file a screen with no
   decision on it.
5. **When does a complaint leave this queue** — and does a dismissed
   complaint stay readable?
6. **Which of the registry's other fields does a registering court
   read?** Listed at the end of §5a — mode and proof of service, other
   pending proceedings between the parties, ADR willingness, the PoA
   holder's own record. Each is a real attribute this file does not
   show; none is added on a guess. *(Added 2026-09-10.)*
7. **Is the cheque's return reason a closed list or free text?** The
   e-filing model has it as a machine-prefilled `string`; this screen
   renders three values. If the bank's memo phrases are a fixed set, the
   registry should say so and both ends can be filtered; if not, this
   screen is showing an enum that does not exist. *(Added 2026-09-10.)*
8. **Does the court side get a document store — and is the scrutiny
   bundle reader the viewer?** The workbench already has one
   (`employee/scrutiny/bundle-view.tsx`: pages, zoom, marks, a document
   index). If documents here ever open for real, they should open there
   rather than in a per-document dialog, or the court will have two
   document readers. *(Added 2026-09-10, from the sibling sweep.)*

---

## 13. Gaps in the DS (if any)

None blocking. Two observations for the DS repo, neither a licence to
invent here:

1. **`AccordionContent` fixes its height from a Radix variable measured
   at open and never remeasured**, so content that reflows is clipped
   when the window narrows. This build worked around it with `h-auto`;
   the workaround leaves with the accordion (§5a.2a), but the DS issue
   stands for the next caller. Safe for a paragraph of FAQ copy, wrong
   for anything that reflows.
2. **`AccordionItem` ships `not-last:border-b`**, which a bare
   `border-b-0` cannot displace because tailwind-merge treats a
   variant-prefixed utility as a different group. Worth either dropping
   the default or documenting the reset.

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
| 2026-09-10 | **Sections are no longer collapsible** (§5a.2a). All five were open by default, the index already navigates, and the fold's own affordance was invisible until found. The accordion and its three workarounds go; the index's claim / observer / end-of-scroll behaviour is untouched. | **owner (Abhiram)** |
| 2026-09-10 | **The word is “Register”** (§5a.7). Footer reads Register case / Dismiss case, matching the nav, the queue and this brief; “Admit” goes. Both stay `aria-disabled` — the act is still undefined (§12.4). | **owner (Abhiram)** |
| 2026-09-10 | **Timeline trimmed to traceable events** (§5a.9): five steps, each with a source, plus the current wait and the unmade decision. *Placed before the magistrate* and *Letter from the accused received* deleted — neither is anywhere in `docs/product/`, and the Kerala spine runs scrutiny → cognizance with no placement step. | **owner (Abhiram)** |
| 2026-09-10 | **Header constants cut** (§5a.4b): case category and case type are identical on every §138 complaint — `FilingDraft.caseType` is a one-value union. Court and Submitted on stay, and with only two facts left the header's `DescriptionList` and `IdentityFact` are replaced by one caption eyebrow (§5a.5). | **owner (Abhiram)** for the cut; ux-designer for the eyebrow |
| 2026-09-10 | **Documents move to the app's `DocumentPreview`** (§5a.6). `Attachment` tiles go; a group's documents become an `Item` list (the `submission-record-dialog` idiom) and open one `ChromeDialogContent` + `DocumentPreview variant="quiet"` with a composed source (the `register-advocates-dialog` idiom). Derived filename, page count and size cut — no court-side store holds them. The facsimile and Neer's two rules — never legible, never a blank sheet for an absence — survive. Advocate's document relabelled “Bar ID card” per `REG-14`. | **owner (Abhiram)** for the component; ux-designer for the multi-document idiom and the labels |
| 2026-09-10 | **Terms become attribute names** (§5a.4a), so the fixed `17rem` term column and the measured 14px value column both disappear. Rows use the DS `DescriptionList` default and switch to two columns on the **container**, not the viewport (`@container` / `@xs`) — the reading column, not the window, was always the constraint. Noted for the record: an earlier “terms shortened” pass was reverted on Neer's branch on 2026-09-09 at his session's request; this one is at the product owner's. | **owner (Abhiram)**; ux-designer for the container query |
| 2026-09-10 | **§5a Attributes table added** under the new `propose-ui-brief` rule — 107 rows, every value with a source, type and slot. **11 rows have no source** and are cut as invented attributes; 4 duplicates, 2 constants and 2 fabricated file facts go with them (19 removals). 4 real attributes added (drawer-bank police station, `paymentStatus`, `partAmount`, the deposit declaration as a row); 6 terms renamed or retyped, including the reply (a date-or-sentence slot → `DemandNotice.replied`, a `YesNo`) and the delay grounds (composed prose → `Jurisdiction.condonationReason`). The Synopsis is cut outright. | ux-designer |
| 2026-09-10 | **The tinted confirmations `Alert` becomes one fact row** (§5a.10): it appeared on every complaint, so it marked the norm in the view's scarcest colour, and its second bullet restated the return reason as a sentence. | ux-designer |
| 2026-09-10 | **Typography cut from six levels to four sizes** (§7). The value drops to `text-body-compact` 400 — the DS `DescriptionList` default — because it was set larger and heavier than its own term. Two weights per component now hold. | ux-designer, on the owner's “check all the typography and spacing usage here” |
| 2026-09-10 | **Grid tracks rebalanced** to `13rem / 1fr / 15rem` (§5a.1): the reading column was the narrowest of three (368px against 512px of rails at 1280) and is now 448px at 1280, 608px at 1440. **One off-ladder value fixed:** the group icon tile `size-9` → `size-8`. | ux-designer |
| 2026-09-10 | **The invented accused submission cut** (§5a.9a) — fact and document, matching the owner's cut of its timeline step. Section 4 now always states the absence; whether a permanently empty section should exist is flagged for the owner and tied to §12.3. | ux-designer; raised for the owner |
| 2026-09-10 | Three open questions added (§12.6–§12.8): which other registry fields a registering court reads; whether the cheque return reason is an enum or free text; and whether the scrutiny bundle reader becomes the court's document viewer. | ux-designer |
| 2026-09-10 | Built to §5a. Measured, not predicted: middle column **448px at 1280, 608px at 1440** (the 1008px content assumption forgot the 256px rail); fact row `160px 190px` / `160px 350px`, stacked at 375. Six deviations, each commented in place: preview `height="default"` not `fill` (fill needs a definite container; at 85dvh it left a 256px drawing in a 630px well); facsimile `w-56` not `w-64` (64 clipped the page foot under the quiet toolbar); document Item description reads "Filed" per the table, not the sibling's "Open"; `whyIssued` / `natureDebt` / `paymentStatus` are closed lists in `lib/filing/options.ts` — labels restated locally, table's "user free text" corrected; new `formatDaysWaiting` ("281 days waiting") because the queue's formatter repeats "submitted" beside the eyebrow's own Submitted date; two focus defects fixed on the render (Escape dropped focus on body — content was unmounted in the same commit that closed the dialog; and the preview well took the opening focus ring). `submission-record-dialog.tsx` has the same Escape defect — upstream, not touched. Section 4 kept pending the owner's call (§5a.9a). | ui-designer |
| 2026-09-10 | ui-reviewer audit: ship after fixes, seven gates green. Critical: five values constant on every complaint were printed as facts in the body (`Power of attorney`, `Deposited within three months`, `Speaks to`, `Prayer`, `Filed within one month`) plus three constant record tags — the header's own rule, not applied to the body. Rulings: `Prayer` and `Filed within one month` cut (constant by construction); `Deposited within three months` becomes a real date check with a closed enum; `Power of attorney`, `Speaks to` and litigant type vary off marks that land in registry fields; a value-cardinality test now enforces it the way the term test enforces the vocabulary. Also: timeline detail slot typed (date / elapsed / state); document items drop to hairline (they were all eighteen of the page's full-strength strokes); absent row no longer hovers; duplicate `View ID proof` names disambiguated by record; 375 footer stacks Register first; group-level absence becomes a closed reason plus optional explanation copy; wait on the file loses its `warning-ink` (no sibling to compare against); `formatDaysWaiting` renamed to stop colliding with the queue's; IFSC seed no longer embeds the mobile number. Table's `paymentStatus` value corrected to the form's own `Part payment made`. | ui-reviewer / ui-designer |
| 2026-09-11 | **Section 4 dropped.** The accused cannot file before registration, so "Submissions from the accused" read "Nothing on record" on every file forever. The file is four parts; the section returns on whatever screen shows a case after registration. | owner (Abhiram) |
| 2026-09-11 | **Breadcrumb shows the current step, product-wide.** `courtTrail` omitted the current page on every employee route by convention; the DS `BreadcrumbPage` slot now carries it — the queue on queue pages, the case identifier on nested pages with the queue linked above. Changes every employee crumb. | owner (Abhiram) |
| 2026-09-11 | Design-mode report, nine comments, adjudicated for round three: header facts back to labelled cells (number as identity line; Court · Submitted · Waiting as label-over-value); section headings to the sibling role `text-body` 600 (this was the only court screen at `title-s`) with group/record levels re-stepped; canvas `bg-muted` with white panels per `filing-shell.tsx` — **owner overrules ui-craft §1.0's "filled, not read" caveat, logged**; documents on e-filing's `DocumentCard`/`Thumbnail` so one component shows an uploaded document everywhere; litigant-type tag adjacent to the name as a `Badge`; index entries top-aligned; index trigger becomes the last section whose heading has crossed a reading line ~⅓ down the viewport. | owner (Abhiram) / orchestrator |
