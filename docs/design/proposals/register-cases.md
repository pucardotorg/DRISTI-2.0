# Register cases

Status: draft — **the complaint's screen is rebuilt again, from the owner's glancing
framing.** The queue stands as built. §5a-i **A** (2026-09-11 night) is the current design;
§5a-i **B** (2026-09-11 evening) is the two-pane work, which survives as the *dig-in* view
rather than the landing; §5a-ii is everything before it, each item with a verdict.
Updated: 2026-09-11
Source: docs/product/product-foundation.md (Kerala spine, L72–74) ·
docs/product/domain/journey.md (§138/§142 chain, L30–39) ·
docs/product/domain/actors.md (L38, L45, L48) · docs/product/open-questions.md ·
docs/product/domain/practice-notes.md (`ke-scrutiny-officer-2026-07`) ·
user in this conversation (2026-09-02): screenshot of the legacy Register Cases list ·
owner (Abhiram) 2026-09-10: the complaint-file critique recorded in §5a-ii and §14 ·
**owner (Abhiram) 2026-09-11: the Job, quoted in full in §4** ·
**owner (Abhiram) 2026-09-11 (night): the glancing framing, quoted in full in §1**
DS read: `vendor/pucar-design-system`, pin `ds.lock.json` =
`e0cadea6b9d459bd3c58eed840974c6c610ad624`, `remote: pucardotorg/dristi-design-system`.
**`npm run check:ds-fresh` was not run — this session has no shell.** The pin is verified
as a fact in the repo, not as the checked-out HEAD. Run it before opening a DS file.
Files opened for this revision: `AGENTS.md` (precedence, rules 1–10, 6a, the token-meaning
table), `src/components/ui/banner.tsx` (variants and their fixed icons),
`src/components/ui/item.tsx` (row primitive, variants and slots), foundations `colors`
(the semantic mapping — `warning-ink` / `success-ink` are *text and icon, never a fill*),
foundations `icons` (the allowlist, `size-4` in controls, colour via text utilities and
never decorative teal), and the `src/components/ui/` catalog re-globbed — **67 components**.
Earlier revisions also read `ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` /
`typography` / `spacing` / `elevation`, and `table` / `button` / `empty` / `field` /
`input-group` / `pagination` / `select` / `label` / `description-list` / `accordion` /
`attachment` / `item` / `timeline` / `badge` / `document-slot`.
Skills read: `propose-ui-brief` + `references/staff-ux-thinking.md` (nine passes),
`ui-craft` §0–§5.

Code read for this revision: `lib/employee/case-review.ts` (whole file, re-read at
`d885d30` — the seven decidable checks in D15 are counted off it) ·
`components/employee/register-advocates-dialog.tsx` (`ReviewStage`, `EvidenceColumn`, the
stage machine) · `docs/design/proposals/register-advocates.md` (**D23** — "a finding opens
where it is stated" — D24, D25, D26).
Earlier revisions read: `components/employee/case-review-screen.tsx`,
`components/employee/scrutiny/case-workbench.tsx`, `scrutiny/flag-composer.tsx`,
`scrutiny/bundle-view.tsx`, `scrutiny/history-sheet.tsx`, `lib/employee/register-cases.ts`,
`schedule-screen.tsx`, `schedule-table.tsx`, `hearings-screen.tsx`, `hearings-table.tsx`,
`list-footer.tsx`, `lib/employee/schedule.ts`, `lib/employee/navigation.ts`,
`components/cases/document-preview.tsx`, `components/cases/submission-record-dialog.tsx`,
`components/employee/application-review-dialog.tsx`, `lib/filing/types.ts`,
`lib/filing/README.md`, `/Users/abhiramrajilan/Desktop/account-creation-handover.md`
(REG-13, REG-14).

---

## 1. Context

**Where this sits.** Register cases is a row in the rail's **Actions** group, beside
Scrutinise submitted cases and Approve copy application. It carries a queue of complaints
(`/employee/register-cases`) and, behind each cause title, that complaint's own screen
(`/employee/register-cases/<id>`). The queue is settled and unchanged by this revision.

**Where it sits in the case's life.** `product-foundation.md` L72–74 gives the Kerala
spine: 1 filing → **2 scrutiny & defect check (Registry; before numbering / cognizance)**
→ 3 cognizance & issue of process. This screen is the seam between 2 and 3.
`domain/actors.md` L38 and L45 name the actor at that seam: the **Judicial Magistrate of
the First Class** — "it takes cognizance of the complaint". `journey.md` L34 gives the
act: "The Magistrate takes cognizance of the offence on the complaint" (BNSS §210, §223,
NI Act §145).

**Who this is for — confirmed by the owner, 2026-09-11.** *"this is the screen a
magistrate sees after it passes through scrutiny."* This resolves who logs in **for this
screen**, and it agrees with `actors.md` L38 independently. It does **not** resolve
`docs/product/open-questions.md` L9–12 product-wide, and this brief does not claim it does.

### The framing that decides the shape — owner (Abhiram), 2026-09-11 (night)

Quoted in full, because every decision in §5a-i A is measured against it:

> "the judge or the magistrate does not have a lot of time to sit and verify a lot of
> these kind of things. So the design should be very friendly and not cognitively taxing.
> It shouldn't look overwhelming. It should be very simple to navigate, very to the
> point… He already has a lot of other things to manage. So this shouldn't become an
> overhead on him. This is just a final check, almost like how in GitHub and everything,
> the people who do pull requests, they do all the work. The reviewer will just glance
> through something. So this is that equivalent of the glancing experience that you need
> to design for."

**What it changes, in one sentence.** The screen's job is not to let him check; it is to
tell him **what has already been checked, and what could not be.** In the pull-request
analogy the reviewer does not re-run the contributor's work: they read a title, trust the
automated checks, skim what changed, and look closely only where something snags. The
version of §5a written an hour earlier — two panes, twenty-nine checkable claim rows, one
document at a time — is a *better verification tool*, which is the scrutiny officer's job
in a nicer wrapper and exactly what "not as exhaustive as the scrutiny officer's flow"
(§4) forbids. That is problem 20, and it is mine.

**The material fact that makes the new shape buildable today.**
`lib/employee/case-review.ts`, as committed at `d885d30`, already computes the §138 chain
and already knows the file's gaps. Seven of the magistrate's questions are decidable by
machine right now, over fields the registry holds and constants the module already
exports — enumerated with their derivations in **D15**. So the exception list is real, not
aspirational: `r-1333` fails the presentation window, `r-1588` is late with no application
to condone, `r-1490` is missing the accused's ID proof *and* has no advocate on record,
`r-330` and `r-1654` carry a part payment. The demo data exercises every branch and no new
fixture is needed.

**A second owner statement, relayed and deliberately unresolved.** Separately from the
framing above, the owner has said *"we should guide him to either dismiss or accept the
case."* That may be loose phrasing for the send-back this brief builds, or it may mean
**Dismiss is a real third outcome** after all. **§12.9 is not resolved here** and it is the
first thing in §12 for that reason: it is the one open question that would change a
control on the screen.

**What the previous rounds got wrong, and why.** Four rounds have now landed on this
screen. The first three polished a *file to be read* while `Job: unconfirmed` sat at the
top of the brief. The fourth had the Job and still built the wrong instrument, because
having the Job is not the same as having the *posture*: "a quick verification of does this
information match with another" was read as *give him the best comparison surface*, and
the owner meant *give him a glance and a way in*. Worth writing down rather than quietly
fixing: **the attribute census was clean, the Job was quoted, and the screen was still
wrong — because nothing had said how much of the reader's attention the screen was
entitled to.**

**Ownership.** The complaint screen is Neer's (court-side owner). This revision is made on
`feature/register-advocates` at `d885d30` at the product owner's instruction. Neer's
reasoning is kept wherever it survives; every change is attributed in §14.

**In scope:** the queue list (settled); the complaint's **glance** (the landing); the
complaint's **full file** (the dig-in view, which is the two-pane work relocated); the two
outcomes and their capture; the header; and what happens to the reading index and the case
timeline. One feature, one brief; neither view is spun off.

**Out of scope:** the scrutiny workbench (`/employee/scrutiny`, a different queue with a
different object); the advocate's side of a returned complaint; what a registered complaint
is renumbered as (§12.4); notification delivery (register-advocates §12.1).

---

## 2. Problem

Numbered so decisions and reviewers can cite them. Problems 1–12 are the early rounds' and
are kept with their resolution; 13–19 are the evening revision's; **20–23 are this
revision's**, found by re-running the nine passes against the glancing framing.

1. **The row is a dead end.** *(Resolved 2026-09-09 — the row opens the list, the cause
   title opens the screen.)*
2. **The reference is a flat white page.** *(Resolved — one lifted panel, matching Hearings
   and Schedule.)*
3. **The reference leans on placeholders and colour.** *(Resolved by §5.4 and §5.6.)*
4. **The file's structure is hidden behind a control nobody sees.** *(Resolved 2026-09-10 —
   the accordion is gone; §5a-ii.2a.)*
5. **The value column is 14 pixels wide at 1280.** *(Resolved 2026-09-10 — terms became
   attribute names, the row switches on the container; §5a-ii.4/4a.)*
6. **Nineteen of the file's facts are not attributes.** *(Resolved 2026-09-10/11 — cut; the
   census returns **zero invented attributes**, §5a-iii.)*
7. **Two facts are prose standing in for a field.** *(Resolved — `replied` is a `YesNo`,
   `grounds` is `condonationReason`, the Synopsis is cut.)*
8. **Six type levels down one reading column.** *(Resolved — four sizes; §7.)*
9. **The document tile is the wrong component.** *(Resolved 2026-09-11 — e-filing's
   `DocumentSlot` + `ThumbnailButton`, on the owner's ruling.)*
10. **The reading column is the narrowest of three.** *(Resolved 2026-09-10; reopened as
    problem 18; **closed by D17** — the file view has two columns, not four.)*
11. **The tint marks the norm.** *(Resolved — the confirmations `Alert` is one fact row.)*
12. **One off-ladder size.** *(Resolved — `size-9` → `size-8`.)*

**The file's problems as a magistrate's instrument (found 2026-09-11 evening; passes 1, 2,
5, 7, 9).** The owner's diagnosis was the frame: *"It became a data dump where neither can
he cross-verify anything nor can he just quickly approve because so much data is thrown on
his face."*

13. **The one act the screen exists for cannot be performed on it.** Opening a document
    opens a modal — `CaseDocuments` renders `<Dialog>` → `ChromeDialogContent`, which draws
    a `scrim` over the page (`case-review-screen.tsx` L974–982, L1098). At the exact moment
    the magistrate wants to compare an entered value with its source, **the entered value
    is covered by the source.** *(Pass 1. Fixed by D1, which now governs the file view.)*
14. **Nothing tells him whether this file has anything wrong with it.** The file already
    knows: `CaseFact.exception`, `CaseDocument.state === "absent"`, `CaseAbsence`, and a
    `CaseChain` whose statutory windows `case-review.test.ts` asserts across all 35. None of
    it was summarised anywhere. To learn that `r-1588`'s delay-condonation application was
    never uploaded he had to read to group 6 of 10. **The fast path cost the same as the
    slow one.** *(Fixed by D14/D15.)*
15. **The statutory chain is the second section; the first screenful is a phone number.**
    Section order was the e-filing form's, so the cheque began after ten rows. *(Pass 2.
    Fixed by D4, and by D18 for the glance.)*
16. **Both decisions are dead, and one of them is the wrong act.** `Dismiss case` was never
    traced to anything and is not one of the two outcomes the owner named. *(Pass 3. Fixed
    by D9 — but see §12.9, which this revision raises rather than settles.)*
17. **Fifteen of the forty-seven values on this file have no source document.** Counted on
    `r-1840` (§5a-iii): 29 checkable against a document, 3 computed from two checkable
    dates, **15 declared-only**. Six of the fifteen are the entire witness group, the one
    group in the model carrying no `documents` array. *(Pass 9. This is the split that
    decides what a surface can honestly promise — see problem 23.)*
18. **Two of the three columns serve reading, and neither serves verification.** 448px of
    permanent chrome at 1280 for a four-entry index and a seven-step timeline, two of whose
    steps no store holds. *(Fixed by D7/D8, and the columns are down to two under D17.)*
19. **The norm is marked in three places while the one exception is at row 14.** A
    one-member status `Badge`; `meta="Filed"` on eighteen document rows; a `Documents`
    caption on ten lists — against one `CaseFact.exception` buried in the cheque group.
    *(Pass 5. Fixed by D3/D6.)*

**The glance's problems (found 2026-09-11 night; all nine passes re-run).**

20. **The screen I proposed an hour ago is a better instrument for the job the magistrate
    delegated.** Two panes, twenty-nine checkable rows, one document at a time: that is the
    scrutiny officer's task with better furniture. The owner's own line is *"not as
    exhaustive as how the scrutiny officer's flow is"*, and the pull-request framing (§1)
    makes the reason explicit — the reviewer does not re-run the contributor's work.
    *(Pass 1, re-walked: a magistrate between two hearings, not an officer at a desk. **My
    defect, and the reason this revision exists.**)*
21. **A clean file said nothing, and nothing cannot be told from "not checked".** D2 made
    the check region render zero rows on 32 of 35 complaints; §11 logged the cost and
    accepted it. Under the glancing framing that trade inverts: the fast path is supposed to
    be *trust*, and trust needs a stated basis. **Muting the norm is not deleting it** — one
    line for a norm is not twelve green ticks for it. *(Pass 5, corrected.)*
22. **The machine already decides seven of the magistrate's questions and the screen
    surfaced one.** `case-review.ts` at `d885d30` holds the presentation window
    (`depositedInTime`, surfaced only as row 14 of the cheque group), the notice window, the
    accrual, the delay and whether its application arrived, the absent slots, counsel, and
    the payment status. Everything else on the landing was a claim awaiting a human.
    *(Pass 9: the attributes existed; the surfacing did not.)*
23. **Nothing said what could not be checked.** Fifteen declared-only values (problem 17),
    and **no check reads a document** — every one of them compares entered data with other
    entered data. So an absence of flags reads as *the file has been verified*, which it is
    not. On a screen that can cost someone their case, an unstated limit on a machine
    reading is the defect that survives every audit. *(Pass 9 + consequence sizing.)*

---

## 3. Objective

No longer provisional — the Job is confirmed (§4) and the posture is stated (§1).

- **The common visit is one screenful and one act.** Observable: on `r-1840` at 1280×800 —
  identity, the check line, the way into the file, and both controls, **without scrolling**;
  no region below the fold on a complaint with nothing flagged.
- **The screen says what ran and what it found, on every file, in one line.** Observable: on
  32 of 35 complaints the check region is exactly one line and zero rows; and its words
  never say the complaint is in order, only what the checks did.
- **The screen states its own limit.** Observable: one caption, on every file, saying the
  checks read entered data and not documents (problem 23).
- **A finding names the entered value and the source that would settle it, where it is
  stated.** Observable: on `r-1333` the row opens onto the two dates and the two documents,
  and reaching either is one control.
- **Reading the whole file is deliberate, not the default.** Observable: one control, one
  route; nothing on the glance opens an overlay.
- **Both outcomes are the two the owner named**, and the third is an open question rather
  than a dimmed control (§12.9).

---

## 4. Job

**Confirmed — owner (Abhiram), 2026-09-11.** Quoted, not paraphrased, and not re-opened.

> "this is the screen a magistrate sees after it passes through scrutiny. So sometimes a
> magistrate might spot something and send it back for correction again. A lot of the
> times he'll just register the case directly only."

> "The annotation and history and everything, I don't think the magistrate needs to see,
> which is why he delegated that work in the first place in manual scrutiny. In automated
> scrutiny, that process will anyway not happen. So in case of both, it's almost like a
> situation of if he wants to dig in, then he can see the entered information against the
> original source."

> "This round is almost like a light scrutiny, scrutiny light in a way… he becomes a
> scrutinizer… we should make it fast and easy, not as exhaustive as how the scrutiny
> officer's flow is. It's almost like a quick verification of does this information match
> with another, and he'll quickly check and then register the case or send it back for
> correction again. That sending it back will go to the advocate."

**In the terms the product already uses.** The complaint has passed scrutiny
(`product-foundation.md` L73) and stands before the magistrate for cognizance
(`journey.md` L34, BNSS §210). The act is a **confirmation that the entered data matches
its source document**, with two outcomes: **register** (the common one, taken directly)
and **send back for correction**, which goes to **the advocate**.

**What this Job is not**, stated by the owner rather than inferred:

- **Not the scrutiny workbench.** No annotation, no defect log, no scrutiny history. He
  delegated that work; under automated scrutiny it will not exist as a human step at all.
  `components/employee/scrutiny/` is the same act at full scale *with* that tooling, and
  it is explicitly what this screen must not become.
- **Not a file to be read end to end.** "Fast and easy… not as exhaustive." Reading is the
  dig-in path, not the default.
- **Not a place to dismiss a complaint.** Two outcomes were named; dismissal was not one
  of them (problem 16, D9, §12.9).

**What remains open and is not resolved here:** whether product records a scrutiny
*outcome* the magistrate's screen could carry (§12.10), and whether "register" writes a
new number (§12.4). The design below works without either.

**Who logs in product-wide is still open** (`open-questions.md` L9–12). This brief
resolves it for this screen only, on the owner's word, and says so.

---

## 5. Decisions

### 5.1 — The queue (unchanged by this revision)

The list at `/employee/register-cases` is settled and nothing below touches it. Kept
verbatim from the 2026-09-02 pass:

1. **Same screen as Schedule hearing.** Title on the page, one lifted panel, search then
   table then `ListFooter`. Rejected: a second filter card, or a table that draws its own
   frame inside the panel (box-in-box; ui-craft §4). *Rule:* compose what already exists.
2. **Search only — no stage filter.** The reference has one control. Stage belongs to
   cases already on file. A complaint waiting to be registered is in one state. *Judgment.*
3. **Search is the teal action.** One primary per view (Ration Teal). Clear is ghost. *Law.*
4. **Visible field label.** `Field` + `FieldLabel` "Search cases". Forced by
   ACCESSIBILITY §12.
5. **Four columns: case name, case number, advocates, days since submitted.** The case name
   is a link (`RegisterCaseLink`) wearing the cause list's quiet-name dress.
6. **Days are a number, right-aligned, `tabular-nums`, in `text-warning-ink`.** *Reopened by
   the sibling sweep — see D12.*
7. **No actions column.** Registering is a real act; a disabled Register button on every row
   would be furniture around a hole. The decision lives at the foot of the complaint's
   screen.
8. **Demo data is 35 CMP complaints, longest wait first.**
9. **Phone: stacked items, not a four-column table.** *RESPONSIVE.*

---

## 5a. The complaint's screen

Four parts, in one section, because code comments cite `§5a.N`:

- **5a-i A** — the **glance** (2026-09-11 night): `D13`…`D22`. The current landing.
- **5a-i B** — the **full file** (2026-09-11 evening): `D1`…`D12`, each with a verdict.
  Most of them stand; what changed is *where they apply* — they now describe the dig-in
  view, not the landing.
- **5a-ii** — the 2026-09-09 / 09-10 / 09-11 decisions as written, each with a verdict.
  Nothing is deleted; `§5a.4b`, `§5a.6`, `§5a.8`, `§5a.9a`, `§5a.10` all still resolve.
- **5a-iii** — the Attributes table, now with a **Surfaced** column.

**Passes run (2026-09-11 night):** all nine of
`.claude/skills/propose-ui-brief/references/staff-ux-thinking.md`, in the skill's order —
Tuesday, domain layout, **attribute census (third)**, control vocabulary, real weather,
exception vs. norm, pattern census, sibling sweep, render judgment. Findings are problems
20–23 and the sweep in D22. **Pass 8 is not discharged and is not claimed:** this session
has no shell, so nothing was curled, no screenshot was taken, and `npm run check:ds-fresh`
was not run. Every width below is arithmetic from the known chrome (256px rail,
`p-6 md:p-8` page padding). **What the builder must measure is listed in §11**, and the
render can veto any of it.

---

### 5a-i A — the glance, 2026-09-11 (night)

#### D13 — Push back first: the landing is not a verification surface, and that is the whole revision

**Supersedes my own D1 as a description of the landing.** D1 was right that a document must
open beside its claims and never over them; it was wrong that the *landing* is where claims
and documents meet. A screen that presents twenty-nine checkable rows has handed the
magistrate the scrutiny officer's job with better furniture (problem 20).

So the landing inverts. **It does not let him check; it tells him what has been checked and
what could not be.** Three regions and two acts, in this order:

1. **Who and how much** — the header: the complaint's identity and the money (D18).
2. **What the machine found** — one line always, and a row per finding (D14, D15, D16).
3. **The way in** — one control to the full file (D17).
4. **The act** — Register, or send back for correction (D9, unchanged).

The full file — every entered value, every document, each openable beside its claims — is
one control away and is exactly the screen D1–D12 designed. **That work is not discarded;
it is demoted from landing to destination**, which is what "if he wants to dig in, then he
can see the entered information against the original source" (§4) actually describes.

*Rule:* the owner's glancing framing (§1); §4's "not as exhaustive as how the scrutiny
officer's flow is"; pass 5 applied to a whole screen rather than to a badge.
*Rejected — keep the two panes and shorten the list.* Any subset of twenty-nine rows is
still an invitation to check, and choosing the subset is the design inventing which facts
matter, which is the thing D2 was careful not to do.
*Rejected — a wizard of one check per step.* Ten interactions to confirm nothing, on the
common file, and a sequence the domain does not have.
*Given up:* a magistrate who wants to read the whole complaint pays one navigation for it.
That is the trade the framing asks for, stated plainly rather than hidden: the common visit
gets cheaper and the rare one gets one click dearer.
*Fixes problems 20, 21, 22, 23.*

#### D14 — The check ledger: one line on every complaint, rows only for findings

**Supersedes D2's silence.** D2 made the region render *nothing* on a clean file. That was
pass 5 applied honestly and it produced problem 21: silence is indistinguishable from "no
check ran", so the fast path had no stated basis. The correction is proportion, not volume.

On **every** complaint, one line, in the same place, in the same words:

> **Seven checks ran on the entered data. Nothing flagged.**
> *(caption)* Checks compare entered values with each other. No document was read.

When something fires, the same line counts it — *"Seven checks ran on the entered data. Two
need a look."* — and each finding takes one row beneath it (D16). Nothing else changes;
there is no second layout for a flagged file.

Three rules the copy obeys, and each one is load-bearing:

- **It is the system's finding, never the court's claim.** It says what ran and what it
  found. It never says the complaint is in order, never says "safe to register", and never
  recommends an outcome. `flag-composer.tsx`'s own lesson — *"pre-filling a defect
  assertion on the officer's behalf is the machine making the claim"* — binds harder here,
  because the reader is a judge.
- **It states its own limit.** The caption is the answer to problem 23 and it is why the
  line can be trusted at all: seven checks over entered dates, amounts and slots, and not
  one of them opens a document. Constant on every file, and it stays, because it is
  *guidance*, not an attribute restating the norm (`ui-craft` §1.6; the skill's "facts are
  attributes; guidance is copy").
- **A pass is never a mark.** No green tick per check, no `success` tint, no per-group
  cleared state. Twelve green ticks on thirty-two files is the norm marked, which
  `register-advocates` already rejected and §5a-ii.10 already killed once on this screen.
  The passes collapse into the count in one sentence; only failures take rows.

*Rule:* pass 5 (signal is deviation — *proportioned*, not deleted); AGENTS rule 6 (three
treatments per status, and none of them is "a tick on everything"); ACCESSIBILITY §3 (never
colour alone — every finding is words first).
*Rejected — `Banner variant="success"` on a clean file.* A green band on 32 of 35
complaints is the tinted `Alert` that was cut on 2026-09-10 wearing a new colour.
*Rejected — a percentage or a score.* A number the court did not compute and cannot defend.
*Given up:* the line is one more constant region than D2 had. Accepted: it is one line, and
it is the only thing standing between a fast register and an unexamined one.
*Fixes problems 14, 21, 23.*

#### D15 — What a check is: seven, closed, machine-decidable today, and two-valued in severity

Every check is a boolean over fields the registry holds, derived from constants
`case-review.ts` already exports. **Nothing here is a new attribute** — the module computes
six of the seven internally today and surfaces one of them (`depositedInTime`).

| # | The check, as a question | Derivation in `case-review.ts` | Class | Fires on |
|---|---|---|---|---|
| 1 | Was the cheque deposited within three months of its date? | `daysBetween(chequeOn, depositedOn) ≤ PRESENTATION_WINDOW_DAYS` (90) — already `DEPOSIT_LIMIT` / `CaseFact.exception` | flag | **`r-1333`** |
| 2 | Was the notice sent within thirty days of the return? | `daysBetween(returnedOn, noticeSentOn) ≤ NOTICE_WINDOW_DAYS` (30) | flag | none in the demo data — the chain is built inside the window, and the check stays because a real registry is not |
| 3 | Was the complaint filed after the fifteen days ran? | `submittedOn > accruedOn`, where `accruedOn = noticeServedOn + PAYMENT_WINDOW_DAYS` (15), asserted across all 35 by `case-review.test.ts` | flag | none in the demo data; a premature complaint is not maintainable |
| 4 | Was it filed within the month, or is an application to condone on the file? | `sinceAccrual ≤ FILING_WINDOW_DAYS` (30) `\|\| !missing.includes("delay-application")` | flag | **`r-1588`** |
| 5 | Is every document the form required on the file? | `IntakeSlot.file === null` over required slots (§12.16) | flag | **`r-1490`** (the accused's ID proof) |
| 6 | Is an advocate on record? | `counselFor(complaint, "complainant").length > 0` | **note** | **`r-1490`** — a complaint in person, which is lawful |
| 7 | Has anything been paid against the cheque? | `DemandNotice.paymentStatus === "part"` (+ `partAmount`) | **note** | **`r-330`, `r-1654`** |

**Severity is two-valued and derived, never authored:** `"flag" | "note"`. A **flag** is a
statutory or completeness failure and takes `warning-ink`; a **note** is a lawful condition
with a consequence for the reading or for the act, and takes plain ink. Appearing in person
is not a defect and must never be inked as one — but the magistrate has to know it, because
it is the send-back's missing recipient (§12.12). Two values, one enum, no third.

**Order when several fire:** flags in statutory order (1, 2, 3, 4, 5), then notes (6, 7).
Deterministic, so two magistrates reading the same complaint see the same list.

**No check says the same thing twice.** When the absent document *is* the delay-condonation
application, check 4 names it and check 5 does not count it again. That rule exists because
one fact with two treatments inside one region is the pass-7 defect this brief has now
caught four times.

**No eighth check, and specifically not these.** The cheque's return reason is not tested
(§138 requires insufficiency of funds or an amount exceeding the arrangement, but the
registry holds a `string` — §12.7, open). Jurisdiction is not tested: §142(2) turns on where
the payee's bank sits, and nothing in the product maps a branch to a court. Inventing either
would be the machine asserting law it cannot compute.

*Rule:* `journey.md` §1–3 for every window; NI Act §138(a)/(b)/(c), §142(b); the module's
own exported constants; pass 9 (a check whose inputs are not fields is a fabricated fact).
*Rejected:* a `CaseCheck` model richer than `{id, class, values[], documents[]}` — a
severity ladder, a "cleared" state, an assignee. Each is scrutiny tooling.
*Given up:* checks 2 and 3 never fire on the demo, so a reviewer cannot see them work. Named
in §10 rather than fixed by bending a fixture: the chain's integrity is asserted by tests
and bending it to demo a check would teach the reader the wrong law.

#### D16 — The exception row: the finding, then the entered values, then the document that would settle it

This is the one place the claim-vs-source pattern still earns its keep, and it is **not
re-derived** — it is `register-advocates` **D23** ("a finding opens where it is stated")
applied to a different queue:

- **The row** states the finding in words, in `warning-ink` for a flag and plain ink for a
  note, with the count or the gap in it — *"Cheque deposited 99 days after its date — outside
  the three months §138(a) allows."* The row is the `CollapsibleTrigger`, `min-h-10`, with a
  chevron.
- **The detail** opens underneath and holds two things and nothing else: the **entered
  values the check read**, as a small `DescriptionList` (`Cheque dated` · `Deposited on` ·
  the gap), and the **documents that would settle it**, as `DocumentSlot` +
  `ThumbnailButton` rows — the same document row the owner set on 2026-09-11.
- **Opening a document leaves the glance.** It navigates to the full file with that document
  in the pane and that group in view (D17). The glance itself opens nothing over itself
  (D20).

*Rule:* `register-advocates` D23 (owner, 2026-09-11 — *"Can you provide the information of
what is not matching if I click here?"*); DS `Collapsible`; ACCESSIBILITY §8 (`min-h-10`
trigger).
*Rejected:* stating the values inline, unfolded. Two findings × four values is the data dump
returning at the top of the screen.
*Rejected:* a document opening in a `Sheet` on the glance — it covers the row that asked the
question, which is problem 13 in miniature.
*Given up:* seeing the numbers behind a finding without a click. Accepted, because the row
already states the finding in words: only the working is hidden, never the conclusion.

#### D17 — The full file is one control and one route, and it is the screen D1–D12 designed

One control, honestly named: **"Open the full file"**, `Button variant="outline"`, with the
counts beside it in caption ink — *41 entered values · 18 documents* (both derived, both
real). It goes to `/employee/register-cases/<id>/file`.

That view is **exactly** the two-pane layout of D1, D4, D5, D6, D11 — claims left, one
document right from `xl`, a `Sheet` below it, statutory order, nothing folded away. Deep
links from a finding (D16) carry the group and the document: `…/file?doc=<slot>#<group>`.

**Why a route and not an expansion or an overlay.** An expansion makes the landing a mode,
and a mode needs a second control to leave and a memory of which mode you are in. An overlay
re-introduces the scrim D1 removed. A route gives Back for free — the trail, the browser,
and the breadcrumb the owner already ruled on (`BreadcrumbPage` carries the current step:
*Register cases › CMP/1840/2025 › Full file*) — and it is linkable, which a finding's deep
link needs.

**The decision band is on both views.** A magistrate who digs in must be able to act where
he ends up; sending him back to the glance to press Register would be the wizard D13
rejected, arriving by the back door.

*Rule:* owner §4 ("if he wants to dig in"); the owner's breadcrumb ruling, 2026-09-11;
RESPONSIVE §6 for the sub-`xl` behaviour (unchanged from D11).
*Rejected:* two tabs (`Tabs`) over one route. Tabs say "two equal views of one thing"; these
are a landing and a dig-in, and the ratio is 32:3.
*Given up:* one more IA node, and a magistrate who wants the file always pays one
navigation. Named in §11.

#### D18 — The header identifies the complaint and carries the money

Kept from D3: the case number on its own identity line, the cause title as `h1`, and
label-over-value cells under a hairline. No eyebrow, no separators, and **no status
`Badge`** — `CASE_REVIEW_STATUS` is a one-member enum true of every row in this queue.

**One addition, and it is mine, not the owner's: `Amount`.** Four cells —
**Court · Amount · Submitted · Waiting**. The cheque amount is the fact that sizes the
consequence of the act, it comes free from `ChequeDetails.amount`, and on a glance built to
be resolved without scrolling it is the difference between recognising a matter and reading
one. `tabular-nums`, like every other amount on the court side.

**Nothing else joins it.** Not the cause-of-action date, not the filing date, not the
statutory chain: check 3 and check 4 already speak when those matter, and a chain summary
under the title is the "cognizance chain" region D4 rejected, moved upstairs.

*Rule:* pass 5 (§5a-ii.4b's constant-column rule, applied to the one constant it missed);
`ui-craft` §2 on hierarchy.
*Rejected:* five or six cells. Every extra cell is a fact the reader must decide is not for
him.
*Given up:* nothing, except that `Amount` is a change the owner has not seen. One cell,
reverses in a line. **Flagged for him in §14.**

#### D19 — The act, unchanged — and the third outcome is the owner's question, not mine

D9 stands in full: **Send back for correction** (ghost, left) and **Register case** (teal,
right), sticky at the foot of both views, both `aria-disabled` until §12.4; Register takes a
confirmation stage of the page rather than a modal-on-modal; send-back takes the required
free-text reason of D10, soft `destructive`, never `destructive-solid`.

**What this revision adds is a flag, not a decision.** The owner has separately said *"we
should guide him to either dismiss or accept the case"* (relayed, §1). That is either loose
phrasing for send-back or a third outcome. **This brief does not resolve it and does not
quietly reinstate `Dismiss`** — an act with no product basis is furniture, and inventing a
judicial outcome is the one thing a design brief must never do. It is **§12.9**, first in
the list, and it is the only open question that changes a control on the screen.

*Rule:* owner §4; `register-advocates` §12.7's precedent for stopping at exactly this door.
*Given up:* the band may need a third control after the owner answers. Accepted: adding one
is a smaller change than shipping one nobody could trace.

#### D20 — Nothing on the glance opens an overlay, and that is the pattern census's rule

The glance has three interactive things: a finding's disclosure, the way into the full file,
and the two acts. **None of them draws a scrim.** Documents open in the file view's pane;
the timeline lives on the file view (D21); the register confirmation and the send-back
composer are *stages of the page*, which is `register-advocates` D17/D21 and already
approved.

Stated as a membership rule because pass 6 exists to catch the exception that arrives later:
*on this screen, an overlay is only ever the document `Sheet` below `xl` on the file view.*
Anything else that wants a `Dialog` is a finding that this brief got the shape wrong.

*Rule:* pass 6; RESPONSIVE §6 (the overlay table).
*Given up:* nothing. This is a constraint on future work, not a cost paid now.

#### D21 — The reading index stays cut; the timeline leaves the glance entirely

**The index does not come back.** D7 deleted it because the check region performs the only
jump the fast path needs. On a screen designed to be resolved in one glance there is nothing
left to index: five entries, and the whole screen is one screenful.

**One correction to D7, and it matters for the build.** D7 deleted the sections'
`scroll-mt-(--chrome-sticky-top)` along with the index machinery. That was wrong: the file
view's deep links (D16, D17) land on a group under a sticky chrome, so **the section `id`s
and their `scroll-mt` both stay.** What goes is `useReadingSection`, `readingLine`,
`READING_LINE` and `SCROLL_KEYS`.

**The timeline is not on the glance at all.** Two of its seven steps are header cells said
twice, two are spine events no store holds, one is conditional, and one tells the magistrate
that the decision he is here to take has not been taken. It survives where D8 put it —
behind a `Sheet` trigger, `history-sheet.tsx`'s precedent — **on the file view only**, so it
is reachable by someone who went looking for history and invisible to everyone else.

*Rule:* pass 9 (an event no store holds is kept, but never resident); pass 7
(`history-sheet.tsx` as the sibling).
*Rejected:* a "submitted / scrutinised / waiting" strip on the glance. Two of its three
steps are unbacked and the third is a header cell.
*Given up:* the wait's history at a glance. Mitigated: the two facts that decide anything —
submitted, waiting — are header cells on both views.
*Fixes problem 18.*

#### D22 — Sibling sweep for the new region

Pass 7, run pairwise against the two surfaces that already do this work.

| Fact / act | This glance | Register advocates (`ReviewStage`) | Scrutiny workbench | Verdict |
|---|---|---|---|---|
| A machine finding about a submitted record | one row, words first, `warning-ink`, detail behind a disclosure | identical — D23's `FactRow` with a `detail` | a `Banner` plus a per-field flag composer | **Closed by inheritance.** The glance takes register-advocates' grammar verbatim; the workbench's is the officer's tooling and stays his. |
| "Nothing is wrong with this record" | one counted line, neutral ink | nothing rendered (D19 there) | — | **Divergent, deliberately.** The advocate queue is eight values on one screen, so absence is self-evident; this file is 47 values behind a control, so absence has to be *stated*. Recorded rather than reconciled. |
| A document on a court file | `DocumentSlot` + `ThumbnailButton` in a finding's detail; `DocumentPreview` in the file view's pane | `DocumentPreview variant="quiet" surface="card"` | `bundle-view.tsx` reader | **Not a defect — three roles** (index / reading / annotating). `submission-record-dialog.tsx`'s `Item variant="outline"` is the fourth rendering and is still the one that should go. |
| Days waiting | uncoloured on both views (owner, 2026-09-11) | escalating `waitTone` | flat `warning-ink` on the queue | **Three treatments of one fact.** Still open, still logged in `register-advocates` §11; a queue-wide pass, not this one. |
| Sending work back to an advocate | free text, required, one box (D10) | free text, required, one box (`REG-22`) | field-scoped `DOC_REASONS` | **Closed.** Same shape, same gate, same no-exposition rule. |

*Fixes:* nothing on its own. This is the pass that stops the next round forking again.

---

### 5a-i B — the full file, 2026-09-11 (evening)

**Nothing here is deleted.** D1–D12 were written as the landing; they are now the **dig-in
view**, and most of them are unaffected by the move. Each carries a verdict.

#### D1 — A document opens beside its claims, never over them

> **STANDS as the file view; SUPERSEDED as the landing (D13).** The pairing is right and it
> is why problem 13 is fixed. What was wrong is that it was the first thing a magistrate
> met.

The file view is two panes from `xl`: the claims, and one document. The claims column does
not move when a document opens; the pane is sticky and holds exactly one document, whichever
was last asked for. *Rule:* the shape exists twice on the court side —
`register-advocates-dialog.tsx` `ReviewStage` (claim-left / evidence-right, each column
scrolling on its own) and `scrutiny/case-workbench.tsx` (selecting a field scrolls the
bundle to the document it was read from, L102–109). **The pairing is not invented here.**
*Rejected:* a stepped review, one pair at a time; all eighteen documents inline;
`ResizablePanelGroup` (annotation tooling for a forty-field task).
*Given up:* below `xl` the two panes cannot coexist — open-read-close (D11).

#### D2 — The check region: the exceptions speak, the norm is silent

> **SUPERSEDED by D14/D15.** The derivation was right and is reused; **the silence was
> wrong** (problem 21) and the four checks are now seven. Kept in the record because D14 is
> only legible as a correction to it: D2's four checks were
> `PRESENTATION_WINDOW_DAYS`, `NOTICE_WINDOW_DAYS`, `FILING_WINDOW_DAYS` and a count of
> absent slots, each derived from constants the module already exported, and each of those
> four survives as checks 1, 2, 4 and 5.

Its three "deliberately nots" survive intact and D14 obeys all three: **not** a cleared /
checked state (that is the magistrate doing the scrutiny officer's work); **not** a verdict
(`flag-composer.tsx`'s rule — the machine never makes the claim); **not** a tint on every
file (§5a-ii.10's precedent — the `Alert` that spoke on all 35 was cut for exactly that).
The line D14 adds is neutral, uncounted as a status, and one sentence long.

#### D3 — The header carries nothing true of every complaint

> **STANDS, extended by D18.** The status `Badge` is cut; `Court` stays on the owner's
> 2026-09-10 ruling with the argument for cutting it recorded in §11; `Amount` joins.

#### D4 — The order is the statute's, not the form's

> **STANDS, on the file view.** Section 2 becomes section 1 — one line in `caseReviewFor`'s
> `sections` array:

| # | Section | Groups |
|---|---|---|
| 1 | The cheque and the notice *(was "Case specific details")* | cheque · debt · demand notice · delay condonation *(conditional)* |
| 2 | Litigant details | complainant · accused |
| 3 | Additional details | witnesses · complaint · advocates |
| 4 | Payment details | payment |

The rename is still **proposed, not ruled**: "Case specific details" is the e-filing form's
label for its own second step, and §5a-ii.4a's rule (a term is the attribute's name, not the
form's question) applies to a heading with more force because it is bigger. One string.
*Rejected:* a "cognizance chain" summary region above the sections — it would restate twelve
values that are already rows. **Reorder, do not summarise.** *(And note what D14 changes
about that reasoning: a summary is a duplicate only when the rows are beside it. The check
ledger is not a summary of the rows — it is seven booleans none of the rows state.)*
*Given up:* the advocate's filing side reads the same complaint in the filing order. Logged
in §11 as a real divergence, accepted because the two readers ask different questions.
*Fixes problem 15.*

#### D5 — Every fact stays on the surface of the file view. Nothing is folded away

> **STANDS, and D13 is what finally answers the "data dump".** The obvious response —
> collapse the contact details — is the accordion, which the owner cut on 2026-09-10:
> *"it wasn't very apparent to me that litigant details, case-specific details, etc. are
> collapsible accordions until I saw it"* (§5a-ii.2a).

All 41 rows stay, unfolded, in one scrolling column **on the file view**. What changed is
that the file view is no longer what a magistrate meets first — which is the fix D5 was
reaching for and could not deliver from inside the file. *Rejected:* progressive disclosure
of the fifteen declared-only facts (the accordion at group scale; and they include the
addresses a jurisdiction question turns on). *Given up:* a shorter file. The file is exactly
as long as it was; it is now behind a door.

#### D6 — The document rows stay in the claims column, lose the norm, and load the pane

> **STANDS.** `DocumentSlot` + `ThumbnailButton` (owner, 2026-09-11); an absent slot keeps
> the geometry and reads **"Not on file"**; rows open the pane, not a dialog; `meta="Filed"`
> (18 rows) and the `Documents` caption (10 lists) are cut. The same row is what a finding's
> detail uses on the glance (D16), which is one component doing one job in two places.

How a magistrate knows which document proves which fact: **order** — the cheque group's
facts run cheque → deposit → return, and its three documents are the cheque, the proof of
deposit and the return memo, in that order. *Rejected:* a per-fact `CaseFact.source` link
(the scrutiny model's `FlatField.doc`) — real, precise, and the officer's precision on a
screen asked to be lighter. **Still the first thing to add if the render says a fourteen-row
group is too coarse.** *Given up:* certainty on the two weak pairs (nature of the debt / why
the cheque was issued, both against one "Proof of the debt or liability").

#### D7 — The reading index goes

> **STANDS, corrected by D21.** The index and `useReadingSection` / `readingLine` /
> `READING_LINE` / `SCROLL_KEYS` go; **the section `id`s and their
> `scroll-mt-(--chrome-sticky-top)` stay** — the file view's deep links land under sticky
> chrome and need them.

**What is preserved for the record**, because it was the most carefully established thing in
this brief and it is retired with its control, not disproved: a click *claims* the marked
entry until the reader scrolls; under that, the last section whose heading crossed a reading
line a third down the viewport; under both, the end of the scroll is its own answer (on
`r-1840` the last heading would need 167px more than the document has). Verified over CDP —
40/40 index clicks, 60/60 scroll positions, three viewports. **If the index ever returns,
return this with it rather than rebuilding it.**

#### D8 — The case timeline leaves the standing layout for a control

> **STANDS, narrowed by D21:** the `Sheet` lives on the **file view only**, never on the
> glance. Seven steps, of which two duplicate header cells, two name spine events no store
> holds, and one is the unmade decision.

#### D9 — Two outcomes: Register, and Send back for correction

> **STANDS — see D19 for the one thing this revision adds** (§12.9, the owner's separate
> "dismiss or accept" line, flagged and unresolved).

Register is irreversible and takes a confirmation **stage of the page** (not an
`AlertDialog` on top of it) — owner, 2026-09-10: *"instead of a modal-on-modal interaction…
it's progressing to the next state"*. Send back is reversible and takes no confirmation
beyond its reason; soft `destructive`, never `destructive-solid`, which the DS reserves for a
confirmed irreversible act. Both `aria-disabled` until §12.4; no helper line (cut by the
owner 2026-09-09 and it does not come back).

#### D10 — The send-back reason is one required free-text box, and it does not name an attribute

> **STANDS.** `Field` + visible `FieldLabel` + `Textarea` + `FieldError` on the gate once
> tripped — `register-advocates` `RejectStage` verbatim, which is itself `FlagComposer`'s
> shape. Nothing new is composed.

Two rules inherited rather than re-argued: **a reason is required** (`flag-composer.tsx`:
*"officers leave one-word remarks and advocates travel to court to decode them"*; `REG-22`
says the same), and **no exposition** (the label asks the question and stops; the error
appears only after a box has been typed in and emptied). Whether the reason should name the
attribute at fault is **§12.11**, not decided here. *Rejected:* reason chips —
`FlagComposer`'s `DOC_REASONS` is the *scrutiny officer's* closed defect taxonomy, and a
second one for a magistrate is an invented field. **The no-advocate case is §12.12**, and
the interim behaviour is that the control states it has no recipient rather than sending
nowhere.

#### D11 — Below `xl` the pane becomes a Sheet, and no third mechanism appears

> **STANDS, for the file view.** At 1280 the content box is 1280 − 256 (rail) − 64
> (`md:p-8`) = 960; less a 32px gap, a `minmax(20rem,26rem)` pane leaves the claims
> **512–608px**. At 1024 the same sum leaves 272px — the exact defect problem 10 fixed — so
> the split starts at **`xl`**, not `lg`. Below it: one column, and a document opens in a
> `Sheet` (a `Drawer` on phone, RESPONSIVE §6). **Nothing opens a modal `Dialog`** (now D20's
> membership rule).

#### D12 — Sibling sweep (evening)

> **STANDS, extended by D22.** Its four findings are unchanged: days-waiting has three
> treatments across three surfaces (open, queue-wide); `DocumentSlot` vs `DocumentPreview`
> is two roles and not a defect; send-back grammar is closed; the decision's end state is a
> stage everywhere. Its fifth line is the rule worth keeping: **show the slot when the form
> asked the question, omit it when the flow never collects it.**

---

### 5a-ii — the prior decisions, and what became of each

**Nothing here is deleted.** These record real reasoning and the owner's earlier rulings,
and code comments cite them by number.

1. **Three columns at `lg`: reading index · the file · the case timeline.**
   > **SUPERSEDED by D1, D7, D8, D21.** Both rails go. The tracks-rebalancing argument
   > (13rem / 1fr / 15rem, replacing 15 / 1fr / 17) was correct against its own problem —
   > at 1280 the old split gave 512px of rail against **368px** of file — and it is what made
   > problem 10 resolvable at all. Retired because the problem changed, not because it was
   > wrong. The claim/observer/end-of-scroll rule is preserved in D7.

2. **Five numbered sections, sentence case.**
   > **PARTLY SUPERSEDED.** Section 4 (submissions from the accused) was cut by the owner on
   > 2026-09-11 — the accused cannot file before registration — leaving four. **D4 reorders
   > those four and proposes renaming the first.** Sentence case and the ban on two sections
   > numbered "4" stand.

   **2a. Not collapsible (owner, 2026-09-10).** Every section was open by default and the
   sticky index already navigated, so the fold hid what the reader came for while its own
   affordance stayed invisible (problem 4). Removing it also removed three workarounds: the
   `not-last:border-b-0` variant reset, the `h-auto` cancellation of Radix's non-remeasured
   `--radix-accordion-content-height`, and the `flushSync` that had to commit an unfold
   before a scroll could reach it.
   > **STANDS, and is load-bearing for D5.**

3. **One lifted panel per group, one block inside it per record.** The panel is the frame;
   records are stacked blocks with a hairline between them and nothing draws a second edge.
   Reading column `gap-8`, section `gap-4`, groups `gap-6`; icon tile `size-8`.
   > **STANDS**, on the file view.

4. **Fact rows use the DS `DescriptionList` at its own default column**, with the two-column
   grid applied at `@xs` on the **container** rather than `sm:` on the window, and the row
   stroke dropped to `border-hairline`.
   > **STANDS, and matters more now** — the claims column narrows to 512px under D1, and a
   > rule that switches on the block's width rather than the window's is what makes that
   > survivable. The 2026-09-10 note is the sentence to keep: `sm:` "asks how wide the
   > *window* is, and the window was never the constraint".

   **4a. A term is the attribute's name, not the form's question (owner, 2026-09-10).**
   "Date when the 15 days from service of legal demand notice was complete" → **"Notice
   period ended"**; "Date of return as per the cheque return memo" → **"Returned on"**.
   > **STANDS, and D4 extends it to section headings.**

5. **Identity facts at the top are one caption line, not a grid.**
   > **SUPERSEDED by the owner (2026-09-11), then by D3 and D18.** The eyebrow is gone; the
   > number is an identity line; the cells are Court · Amount · Submitted · Waiting.

   **4b. The header's constants go (owner, 2026-09-10).** "Case category: Criminal" and
   "Case type: S.138, Negotiable Instruments Act, 1881" are identical on every complaint
   DRISTI will ever hold — `FilingDraft.caseType` is the one-value union `"s138"`.
   > **STANDS**; D3 applied it to the status badge, the one constant it had not reached.

6. **Documents use the app's `DocumentPreview`** (owner, 2026-09-10) — a list of `Item` rows
   and one dialog for the document being read; the facsimile survives as `composed` content,
   bounded and deliberately illegible; derived filename, page count and file size cut
   because no court-side store holds them.
   > **PARTLY SUPERSEDED, twice.** The `Item` list became e-filing's `DocumentSlot` +
   > `ThumbnailButton` (owner, 2026-09-11) — that stands and is D6's starting point — and
   > **D1 replaced the dialog with the pane**. What survives untouched, and is the best part
   > of this item: a facsimile says "a page of this kind is on the file" and is
   > **deliberately not legible**, because readable text would be fabricating a court
   > record; **an absence is never dressed as a blank sheet**; and the six shapes stay, for
   > Neer's reason — a reader tells a cheque from a demand notice without reading. The cut
   > of filename, page count and size stands: a plausible fixture in the shape of a field is
   > worse than no field.

7. **Register / Dismiss are pinned, real, and honestly dead.** "Admit" goes; the word is
   *register*, matching the rail, the queue and the timeline.
   > **PARTLY SUPERSEDED by D9/D19.** "Register" stands. **Dismiss is cut**, and whether it
   > returns is **§12.9**, the owner's to answer. `aria-disabled` stands until §12.4.

8. **Particulars are derived from the queue row, not transcribed** — the §138 chain worked
   backwards so all 35 complaints open a file that is internally consistent and legally
   coherent, asserted by `case-review.test.ts`. **A derived *value* is legitimate demo data;
   a derived *attribute* is not.**
   > **STANDS, and D15 is its dividend.** The chain that exists only to keep the demo honest
   > is what lets seven statutory questions be answered without a single new field.

9. **The right-hand timeline carries traceable events only** — five steps each naming a
   source, plus the current wait and the unmade decision. *Placed before the magistrate* and
   *Letter from the accused received* deleted (owner, 2026-09-10): neither is anywhere in
   `docs/product/`.
   > **PARTLY SUPERSEDED by D8/D21.** The trimming was right and the two cuts stay cut. The
   > panel is a `Sheet` on the file view and is absent from the glance.

   **9a. The accused's invented submission goes with it**, and section 4 with it.
   > **STANDS — resolved by the owner, 2026-09-11.**

10. **The complainant's confirmations become fact rows, not a tinted alert.** The
    `Alert variant="info"` appeared on **every** complaint, spending the view's scarcest
    resource restating the default.
    > **STANDS, and it is still the precedent every check region is measured against.** The
    > distinction D14 relies on: that `Alert` restated a *fact* that was already a row, in a
    > *tint*, on every file. D14's line states a *machine action* nothing else states, in
    > neutral ink, in one sentence. If a future round finds itself tinting it, this item is
    > the reason not to.

**Deviations from the legacy reference, logged:**

| Reference | Here | Why |
|---|---|---|
| `‹ Back` link | none | The trail is the way back on the court side (`lib/employee/navigation.ts`) |
| `Download` action | cut | Promises a document bundle that does not exist |
| "View on map" on addresses | cut | No map |
| Breadcrumb ends in "View" | ends in the case identifier, then "Full file" | Owner, 2026-09-11; D17 |
| Timeline newest-first, three placeholder steps | oldest-first, traceable steps, behind a control, on the file view only | D8, D21 |
| Title Case, two sections numbered "4" | sentence case, 1–4 | Laws; the duplicate number is a defect |
| Collapsible sections | plain regions | §5a-ii.2a |
| Sections in the filing form's order | the statute's order | D4 |
| Documents open over the file | documents open beside it | D1 |
| The whole file on arrival | a glance, and the file behind one control | **D13** |
| `Dismiss` | `Send back for correction` | D9 — and §12.9 is open |
| Placeholder filings (`asdf`, a stylesheet in the return reason) | Kollam parties, CMP numbers, real §138 vocabulary | §6 |

---

### 5a-iii — Attributes (value → source → type → checked against → surfaced → slot)

**How to read this.** *Source* is the field a real backend would hold (`lib/filing/types.ts`
is the e-filing contract), a `docs/product/` citation, or a `REG-nn` requirement. *Type* is
`data` · `closed enum` · `derived check` · `user free text` · `product copy` ·
`presentation`. **`Checked against`** is the document *on this file* a magistrate could read
the value off; `—` means **declared-only: nothing on the file can confirm it.**
**`Surfaced`** is this revision's addition and the column D13 turns on:

| Value | Meaning |
|---|---|
| `glance` | on the landing, before any control is touched |
| `glance·fired` | on the landing **only when a check fires** — a finding's row or its detail |
| `file` | on the full file view, one control away |
| `sheet` | behind the timeline `Sheet`, on the file view |
| `stage` | on the send-back or confirmation stage |
| `cut` | not rendered anywhere |

**Counted on `r-1840`** (delayed, a reply on record, two witnesses, one advocate, nothing
missing), because a table counted over every branch counts nothing.

| | Count |
|---|---|
| Values in the body (41 fact rows + 6 record headings) | **47** |
| Header values | 5 (+1 cut) |
| Machine checks (D15) | **7** |
| Document rows | **18** |
| Timeline steps (behind a control, file view only) | 7 |
| **Rows with no source at all** | **0** |
| Rows whose source is a product doc but **no store holds them** | **2** (`Taken up for scrutiny`, `Scrutiny completed`) |
| Body values **checkable** against a document in their own record or group | **29** |
| Body values **computed** from two checkable dates | **3** |
| Body values **declared-only** | **15** |
| **Values a magistrate sees before he can act, on a clean complaint** | **5 header values + 1 check line + 2 counts = 8** |

The last row is the design, in one number: **47 body values became 8 before the act**, and
the other 39 are one control away. The 15 declared-only values are why the check line's
caption exists (problem 23) — no check reads a document, and nothing on this file can
confirm a mobile number, a police station or a witness at all.

#### Header

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| `CMP/1840/2025` | `RegisterCase.caseNumber`; issued at filing as `SignState.caseFileNumber` | data | — | glance · file | identity line, `tabular-nums` |
| `Rajan Krishnan v. Quilon Cashew Exports` | `causeTitle()` over `Complainant.name` / `Accused.name` | data (derived value, real attributes) | complainant's ID proof · accused's company documents | glance · file | `h1` |
| `Kollam JMFC-II` | `CURRENT_STAFF.court` (session) | data — constant *within* this queue | — | glance · file | cell "Court" |
| **Cheque amount** | `ChequeDetails.amount` | data | the cheque | **glance** · file | cell "Amount", `tabular-nums` — **added by D18** |
| `4 Dec 2024` | `FilingDraft.submittedAt` | data | — | glance · file | cell "Submitted" |
| `281 days` | derived: today − `submittedAt` | data (derived) | — | glance · file | cell "Waiting" |
| ~~`Waiting to be registered`~~ | `CASE_REVIEW_STATUS` — one member, true of every row here | closed enum, single-valued | — | **cut** (D3) | — |

#### The check ledger (D14, D15)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| "Seven checks ran on the entered data." | the count of `CaseCheck[]` — derived | product copy over a derived count | — | **glance, always** | the ledger's first line |
| "Nothing flagged." / "Two need a look." | count of fired checks | derived count | — | **glance, always** | same line |
| "Checks compare entered values with each other. No document was read." | product copy — the limit, stated (problem 23) | product copy | — | **glance, always** | `text-caption` under the line |
| Deposited outside the three months | `daysBetween(chequeOn, depositedOn) > PRESENTATION_WINDOW_DAYS`; §138(a) | derived check, class `flag` | the cheque + the proof of deposit | glance·fired | finding row → detail |
| Notice sent more than thirty days after the return | `daysBetween(returnedOn, noticeSentOn) > NOTICE_WINDOW_DAYS`; §138(b) | derived check, `flag` | return memo + proof of dispatch | glance·fired | finding row → detail |
| Complaint filed before the fifteen days ran | `submittedOn ≤ accruedOn`; §138(c) | derived check, `flag` | proof of service | glance·fired | finding row → detail |
| Filed outside the month with no application to condone | `sinceAccrual > FILING_WINDOW_DAYS && missing.includes("delay-application")`; §142(b) | derived check, `flag` | — (the absence *is* the finding) | glance·fired | finding row → detail |
| *N* required documents not on file | count of `IntakeSlot.file === null` over required slots (§12.16) | derived count, `flag` | — | glance·fired | finding row → detail (the slots, named) |
| No advocate on record | `counselFor(complaint,"complainant").length === 0` | derived check, class **`note`** | the vakalatnama slot's absence | glance·fired | finding row; plain ink, never `warning-ink` |
| Part payment made against the cheque | `DemandNotice.paymentStatus === "part"` + `partAmount` | derived check, **`note`** | — | glance·fired | finding row → detail (amount, balance) |
| The values a fired check read | the rows below, unchanged | data | as their own rows | glance·fired | the detail's `DescriptionList` |
| The documents that would settle a finding | the group's own `CaseDocument[]` | data | — | glance·fired | `DocumentSlot` rows in the detail → open in the file view's pane |

#### The way into the file (D17)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| "Open the full file" | product copy — the control's name | product copy | — | glance | `Button variant="outline"` |
| `41 entered values · 18 documents` | counts over `CaseReview.sections` | derived counts | — | glance | `text-caption` beside the control |

#### 1 · The cheque and the notice *(was section 2)*

**Cheque details** — documents: Dishonoured cheque · Proof of deposit · Cheque return memo

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| `Cheque no. 483920` | `ChequeDetails.chequeNumber` | data | the cheque | file | record heading |
| Cheque amount | `ChequeDetails.amount` | data | the cheque | **glance** · file | `Amount` |
| Date of the cheque | `dateOnCheque` | data | the cheque | file · glance·fired (check 1) | `Cheque dated` |
| Payee bank | `Jurisdiction.payeeBankName` | data | proof of deposit | file | `Payee bank` |
| Payee bank branch | `Jurisdiction.payeeBankBranch` | data | proof of deposit | file | `Payee branch` — **and the §142(2) jurisdiction fact** |
| Payee IFSC | `Jurisdiction.ifsc` | data | proof of deposit | file | `Payee IFSC` |
| Payer bank | `ChequeDetails.bankName` | data | the cheque | file | `Payer bank` |
| Payer bank branch | `ChequeDetails.bankBranch` | data | the cheque | file | `Payer branch` |
| Payer IFSC | `ChequeDetails.ifsc` | data | the cheque | file | `Payer IFSC` |
| Date deposited | `presentDate` | data | proof of deposit | file · glance·fired (check 1) | `Deposited on` |
| Date of return | `returnDate` | data | the return memo | file · glance·fired (check 2) | `Returned on` |
| `Funds insufficient` | `ChequeDetails.returnReason` (3-value enum on screen; a `string` in the registry) | closed enum — **§12.7** | the return memo | file | `Return reason` |
| Police station (payee bank) | `Jurisdiction.payeePolice` | data | **—** | file | `Police station — payee bank` |
| Police station (drawer bank) | `Jurisdiction.drawerPolice` | data | **—** | file | `Police station — drawer bank` |
| `Yes` / `No` | derived: `daysBetween(chequeOn, depositedOn) ≤ PRESENTATION_WINDOW_DAYS`; §138(a) | derived check | the two dates above, each on a document | file (**check 1 is its glance form**) | `Deposited within three months`; `exception` ink when No |

**Debt or liability details** — document: Proof of the debt or liability

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Nature of the debt | `DemandNotice.natureDebt` (closed list, `lib/filing/options.ts`) | closed enum | proof of the debt *(weak pair)* | file | `Nature of the debt` |
| `No payment made` / `Part payment made` | `DemandNotice.paymentStatus` | closed enum | **—** | file · glance·fired (check 7) | `Payment against the cheque` |
| Part payment amount | `DemandNotice.partAmount`, when `paymentStatus === "part"` | data | **—** | file · glance·fired (check 7) | `Part payment amount` |
| Why the cheque was issued | `DemandNotice.whyIssued` (closed list) | closed enum | proof of the debt *(weak pair)* | file | `Why the cheque was issued` |

**Legal demand notice** — documents: Legal demand notice · Proof of dispatch · Proof of service · Reply to the notice

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Date dispatched | `DemandNotice.dispatchDate` | data | proof of dispatch | file · glance·fired (check 2) | `Notice dispatched` — **§138(b) starts here** |
| Date of service | `DemandNotice.deliveryDate` | data | proof of service | file · glance·fired (check 3) | `Notice served` — **§138(c) starts here** |
| `Yes` / `No` | `DemandNotice.replied` (`YesNo`) | closed enum | the reply slot's own filled/absent state | file | `Reply received` |
| Notice period ended | `Jurisdiction.causeDate` = served + `PAYMENT_WINDOW_DAYS`; §138(c) | data (derived) | the service date, on a document | file · glance·fired (checks 3, 4) | `Notice period ended` — **the cause of action** |

**Delay condonation application** *(only on a late file)* — document: Delay condonation application

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Days beyond the month | derived: `sinceAccrual − FILING_WINDOW_DAYS`; §142(b) | data (derived) | the two dates, each on a document | file · glance·fired (check 4) | `Days beyond the month` |
| Grounds stated | `Jurisdiction.condonationReason` | user free text | **the application itself** | file | `Grounds`; no value when the application is not on file |

#### 2 · Litigant details

**Complainant** — documents: ID proof · Affidavit u/s 225 BNSS

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Complainant's name | `Complainant.name` | data | ID proof | glance (in the cause title) · file | record heading |
| `Individual` / `Company` | `Complainant.type` (`LITIGANT_TYPES`) | closed enum | ID proof / company documents | file | record `Badge` |
| Authorised signatory *(entity only)* | `Complainant.reps[].name` | data | company documents | file | `Authorised signatory` |
| Mobile number | `Complainant.mobile` | data | **—** | file | `Mobile` |
| Email | `Complainant.email` | data | **—** | file | `Email` |
| Age *(individual only)* | `Complainant.age` | data | ID proof *(§12.13)* | file | `Age` |
| Permanent address *(individual only)* | `Complainant.perm` | data | ID proof *(§12.13)* | file | `Permanent address` |
| Current address *(individual only)* | `Complainant.res`, when `permSame === "no"` | data | **—** | file | `Current address` |
| Registered office *(entity only)* | `Complainant.perm` | data | company documents | file | `Registered office` |
| `Yes` / `No` | `Complainant.poa` (`YesNo`) | closed enum | **— and there is no PoA slot on the form** | file | `Power of attorney` — **§12.14** |

**Accused** — documents: ID proof · Company documents

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Accused's name | `Accused.name` | data | company documents | glance (cause title) · file | record heading |
| `Company` | `Accused.type` | closed enum | company documents | file | record `Badge` |
| Authorised signatory | `Accused.reps[].name` — an **array** under S-141 | data | company documents | file | `Authorised signatory` |
| Mobile number | `Accused.contacts[].mobile` (array) | data | **—** | file | `Mobile` |
| Email | `Accused.contacts[].email` (array) | data | **—** | file | `Email` |
| Registered office | `Accused.addresses[]` (array) | data | company documents | file | `Registered office` |

#### 3 · Additional details

**Witness details** — **no documents on this group, in the model** (`CaseRecord.documents` unset)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Witness's name (×2 on `r-1840`) | `Witness.fullName` | data | **—** | file | record heading |
| Speaks to (×2) | `Witness.prove` (`WITNESS_PROVES`, 4 values) | closed enum | **—** | file | `Speaks to` |
| Mobile number (×2) | `Witness.contacts[].mobile` | data | **—** | file | `Mobile` |

**Complaint** — documents: Complaint · Affidavit u/s 223 BNSS

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Additional details | `AdrPrayer.otherDetails` | user free text | the complaint | file | `Other details`; absent on most files |

**Advocate details** — documents: Bar ID card · Vakalatnama

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Advocate's name | `Advocate.name` | data | the vakalatnama | file | record heading |
| Bar registration | `Advocate.barNumber`; `REG-13` | data | **the Bar ID card** — the pair `register-advocates` verifies | file | `Bar registration` |
| *(the absence of any advocate)* | `counselFor(...)` empty → `CaseAbsence "none-on-record"` | closed enum | — | **glance·fired (check 6)** · file | finding row; group absence |

#### 4 · Payment details — document: Payment receipt

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Court fee paid | `SignState.paidAmount` | data | the receipt | file | `Court fee paid` |
| Receipt number | `SignState.paymentRef` | data | the receipt | file | `Receipt number` |

#### Every document row (18 on `r-1840`)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| The court's label for the document | `IntakeSlot.label` | closed enum (the form's slot list) | — | file · glance·fired (in a finding's detail) | `DocumentSlot` label |
| Which page shape to draw | derived from `IntakeSlot.docType` (11 members → 6 shapes) | **presentation, not a fact** | — | file · glance·fired | `ThumbnailButton` facsimile |
| `Not on file` | `IntakeSlot.file === null` | closed enum | — | file · **glance·fired (check 5 names it)** | absent row; **the row is the finding** |
| ~~`Filed`~~ | `IntakeSlot.file !== null` — true of every row that renders one | closed enum, single-valued in context | — | **cut** (D6) | — |
| ~~`Documents`~~ | none — a caption on ten identical lists | product copy | — | **cut** (D6) | — |

#### Timeline (behind a control, file view only — D8, D21)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| Complaint submitted | `FilingDraft.submittedAt`; spine step 1 | data | — | sheet | past — **duplicates the header cell** |
| Court fee received | `SignState.paid` / `paidAt`; spine step 1 | data | the payment receipt | sheet | past |
| Delay condonation application filed | `Jurisdiction.condonationReason` + the application slot | data (conditional) | the application | sheet | past |
| Taken up for scrutiny | `product-foundation.md` L73 — **no store holds it** | data (unbacked) | — | sheet | past |
| Scrutiny completed | L73 — **no store holds it** | data (unbacked) | — | sheet | past |
| Waiting to be registered · "281 days so far" | derived from `daysSinceSubmitted` | closed enum + derived detail | — | sheet | current — **duplicates the header cell** |
| Registration decision · "Not made" | the unbuilt act (§5.7, §12.4) | product copy | — | sheet | future |

#### The send-back stage (D10)

| Value | Source | Type | Checked against | Surfaced | Slot |
|---|---|---|---|---|---|
| The magistrate's reason | the officer's own words in a required slot; `REG-22`'s shape | **user free text** | — | stage | `Textarea`; carried to the advocate |
| "Why are you sending this back?" | product copy — the question, and nothing after it | product copy | — | stage | `FieldLabel` |
| "Write a reason first." | product copy — the gate, only once tripped | product copy | — | stage | `FieldError` |
| ~~the attribute at fault~~ | **not built** — `register-advocates` §12.10 / this brief §12.11 | — | — | **cut** | owner's call, not taken here |

#### Real attributes the file still does not show

A record of what the registry holds, so the next reader sees the gap rather than invents a
field: `DemandNotice.modeService`, `tracking`, `delivered`, `nonDeliveryReason`;
`Jurisdiction.otherPending` + `otherCases`; `AdrPrayer.adr` and `interimRelief`;
`Witness.designation`, `age`, `addresses`; **`Complainant.poaHolder`** (§12.14);
`Accused.jurisdiction`; `SignState.paidAt`. Whether a magistrate taking cognizance reads any
of them is §12.6.

---

## 6. What I cut (and why)

**Cut from the landing, 2026-09-11 (night):**

- **The twenty-nine-row claim surface, as the landing.** The single largest cut in this
  brief, and it is a cut of my own work from an hour earlier. A screen that offers rows to
  be checked has handed the magistrate the scrutiny officer's job. It survives intact as the
  full file (D17) — demoted, not deleted.
- **A green tick per passing check**, and any per-group "verified" state. Twelve marks on
  thirty-two clean files is the norm marked; the passes collapse into one counted line
  (D14). This is the cut a reasonable person would most want back, and §5a-ii.10 is the
  precedent for refusing.
- **A score, a percentage, or any word that says the complaint is in order.** The machine
  reports what it ran; the court decides what it means.
- **A document strip on the glance.** Eighteen thumbnails under the header is a data dump
  with pictures; the checks name the documents that matter, and the rest are one click away.
- **The case timeline, from the glance entirely** (D21). Two of its seven steps are header
  cells said twice; two are events no store holds.
- **The reading index** — still cut (D7), with `useReadingSection`, `readingLine`,
  `READING_LINE` and `SCROLL_KEYS`. **Un-cut on review: the section `id`s and their
  `scroll-mt`**, which the file view's deep links need (D21).
- **A third severity, and a "cleared" state.** Two values, `flag` and `note`, both derived.
- **Any overlay on the glance** (D20).
- **An eighth check on the cheque's return reason or on jurisdiction.** Neither is decidable
  from what the registry holds; both are §12.7 and §5a-iii's own record.

**Cut in the evening round, kept cut:** the modal document dialog (`Dialog`,
`ChromeDialogContent`, `CaseDocumentBody` and its two focus workarounds); `Dismiss case`
(pending §12.9); the `Waiting to be registered` badge; `meta="Filed"` on eighteen rows and
the `Documents` caption on ten lists; a "cognizance chain" summary region; a per-fact
`CaseFact.source` link; reason chips on the send-back; `ResizablePanelGroup`; progressive
disclosure of the fifteen declared-only facts.

**Cut in earlier rounds, kept cut:** nineteen invented attributes, four duplicates, two
constants, the filename / page count / file size on every document tile, the tinted
confirmations `Alert`, the accordion and its three workarounds, `IdentityFact` and the
header's five-column `DescriptionList`, a "collapse all" control, a per-group document grid,
section 4, `Prayer`, `Filed within one month`, and the advocate's constant record tag.

**Not cut, deliberately:** every one of the 41 fact rows (D5 — on the file view); the
eighteen document rows; `Court` in the header (an owner ruling; the argument for cutting it
is in §11 for him, not applied over him); and the caption stating the checks' limit, which
is the one piece of constant copy this brief defends (problem 23).

**The long-label / other-language case.** Terms are attribute names, which is what makes
translation survivable: "Notice period ended" can triple in Malayalam inside a
`minmax(7rem,10rem)` track that can also stack. **The glance's own exposure is different and
new:** a finding is a *sentence*, not a term — "Cheque deposited 99 days after its date —
outside the three months §138(a) allows" is the longest string on the landing and it will
grow by half again in Malayalam. It must wrap to two or three lines inside its row without
pushing the chevron off, and the row must stay a `min-h-10` target when it does. First thing
to measure (§11).

---

## 7. Layout & hierarchy

**The queue** (unchanged): page `p-6 md:p-8`, `gap-8`; one lifted panel
(`rounded-xl border border-hairline bg-card p-6 shadow-raised`) holding filters, table and
`ListFooter`; primary is Search.

### The glance — `/employee/register-cases/<id>`

- **Canvas:** `bg-muted dark:bg-background` — `FilingMain`'s recipe, on the owner's
  2026-09-11 overrule of `ui-craft` §1.0. Panels are the only white.
- **Page:** `p-6 md:p-8 pb-0`, `gap-6` between the three regions (tighter than the file
  view's `gap-8`: three short panels that must read as one object, not four sections).
- **One column at every width.** No grid, no rails, no split. The glance is the same shape
  on a phone and on a bench desktop, which is the only region of this feature that is.
- **Header panel:** one lifted sheet at page width. Identity line → `h1` → hairline → four
  label-over-value cells (`grid-cols-2 sm:grid-cols-4`): Court · Amount · Submitted ·
  Waiting.
- **Check ledger panel:** directly under it, page width, `p-6 gap-3`.
  - Line one: `size-4` icon (`ShieldCheckIcon`, allowlisted) in `text-muted-foreground` +
    the counted sentence in `text-body-compact`. **Neutral ink, no tint, on every file.**
  - Caption under it: `text-caption text-muted-foreground` — the limit (D14).
  - Then zero or more finding rows in an `ItemGroup`, `gap-2`: each an `Item
    variant="outline"` acting as a `CollapsibleTrigger`, `min-h-10`, with `ItemMedia
    variant="icon"` (`CircleAlertIcon` in `warning-ink` for a flag; `InfoIcon` in
    `muted-foreground` for a note), the finding in `text-body-compact` (`warning-ink` for a
    flag, `foreground` for a note), and a chevron at the end.
  - **The detail** opens inside the row's own bounds: `pt-3 gap-3`, a `DescriptionList` of
    the values read, then the `DocumentSlot` rows. No second frame — the row is already a
    bordered object, and a well inside it is the box-in-box `ui-craft` §4 forbids.
  - **No status fill anywhere in this panel.** Ink and words only. That is what retires the
    evening round's `Banner`-on-`bg-muted` contrast risk (AGENTS 6a): there is no tint on a
    tint, because there is no tint.
- **The way in:** a row under the ledger — `Button variant="outline"` "Open the full file"
  (`h-10`, `FileSearchIcon` at `size-4`) with `41 entered values · 18 documents` in
  `text-caption text-muted-foreground` beside it, wrapping under it below `sm`.
- **Decision band:** `sticky bottom-0 z-30`, `border-t border-hairline bg-card`,
  `px-6 py-3 md:px-8 md:py-4`, `flex-col-reverse … sm:flex-row sm:justify-end` (the DS
  `DialogFooter` order). Send back (ghost) then Register (teal).

**Arithmetic for "no scrolling" at 1280×800** (owed a render check, §11): chrome top bar 64 +
breadcrumb ≈ 40 + page top padding 32 + header panel ≈ 150 + 24 + ledger (clean) ≈ 96 + 24 +
the way-in row 40 + the sticky band 72 = **≈ 542px** against 800. Two findings add ≈ 96px and
it still holds. **This is the objective's one measurable claim and the first thing to
verify.**

### The full file — `/employee/register-cases/<id>/file`

Unchanged from the evening round, except that it is a destination:

- Page `p-6 md:p-8 pb-0`, `gap-8`. Same header panel, plus the timeline `Sheet` trigger with
  the cells.
- Body grid: below `xl` one column; at `xl` and up
  `xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-8`, the document pane
  `xl:sticky xl:top-(--chrome-sticky-top) xl:self-start`, each column scrolling on its own —
  the `ReviewStage` recipe.
- Claims column: `flex flex-col gap-8`; `<section>` `flex flex-col gap-4` with an `h2` and
  `scroll-mt-(--chrome-sticky-top)`; group panels `gap-6`; group panel `p-6 gap-4`, `size-8`
  sunken icon tile + `h3`; records stacked with `border-t border-hairline pt-4`;
  `@container` on the record block.
- Document pane: `DocumentPreview variant="quiet" surface="card" height="fill"` with a
  `composed` facsimile — `EvidenceColumn`'s composition verbatim. **Empty state:** a quiet
  line naming what the pane is for; **pre-loaded only when arrived at by a finding's deep
  link**, which is the one time a starting point is asserted by the reader rather than by
  the screen.
- Same decision band, same states.

**Type hierarchy — four sizes, unchanged:**

| Role | Token | Weight | Colour |
|---|---|---|---|
| Page title | `text-title sm:text-title-l` | 600 | foreground |
| Section heading (`h2`, 1–4, file view) | `text-body` | 600 | foreground *(owner, 2026-09-11)* |
| Group heading (`h3`) | `text-body` | 600 | foreground |
| Record name · check line · finding | `text-body-compact` | 500 / 400 | foreground; `warning-ink` on a flag |
| Term · value | `text-body-compact` | 400 | muted / foreground; `tabular-nums` when numeric |
| Header cell label · counts · the limit caption | `text-caption` | 500 / 400 | `text-muted-foreground` |

**Hierarchy, stated once.** On the glance: the cause title, then the check line, then the
act. A finding, when there is one, is the only coloured thing on the screen. The way into
the file is deliberately quiet — it is the rare path. On the file view the loudest thing is
whatever the reader navigated to; the pane is never loud, because it is the thing the claims
are read *against*.

---

## 8. Components (DS name → region)

**The queue** (unchanged): `text-title` / `text-title-l` · composed panel `section` ·
`Field` + `FieldLabel` + `InputGroup` · `Button` primary / ghost · `Table` · `CounselCell` ·
`Empty` + `EmptyMedia` · `ListFooter` (`Pagination` + `Select`).

**The glance:**

| Region | DS / app component |
|---|---|
| Header, ledger panels | composed `section` with the court-side panel classes (not a nested `Card`) |
| Header cells | `dl` / `div` / `dt` / `dd` — the HTML5 grouping form, as built |
| Check line + limit caption | plain `p` at `text-body-compact` / `text-caption`, with a `size-4` lucide icon from the allowlist |
| Finding rows | `ItemGroup` + `Item variant="outline"` + `ItemMedia variant="icon"` + `ItemContent` (DS `item.tsx`) |
| A finding's disclosure | `Collapsible` / `CollapsibleTrigger asChild` on the `Item` / `CollapsibleContent` — `register-advocates` D23's mechanism |
| A finding's values | `DescriptionList` / `DescriptionRow` / `DescriptionTerm` / `DescriptionDetails` |
| A finding's documents | `DocumentSlot` (DS) + `ThumbnailButton` (`filing/upload/thumbnail.tsx`), as links into the file view |
| The way in | `Button variant="outline"` |
| Decision band | `Button` primary + ghost |
| **Not used on the glance** | `Dialog`, `Sheet`, `Drawer`, `Banner`, `Alert`, `Badge`, `Timeline`, `Tabs`, `Accordion` |

**The full file:** unchanged from the evening round — composed panels, `DescriptionList`,
`Badge variant="secondary"` for litigant type, `DocumentSlot` + `ThumbnailButton`,
`PageFacsimile` in DS `paper` tokens, `DocumentPreview variant="quiet" surface="card"
height="fill"` for the pane, `Sheet` (`Drawer` on phone) below `xl`, `Sheet` + `Timeline` /
`TimelineItem` for the history, `Field` + `FieldLabel` + `Textarea` + `FieldError` for the
send-back stage.

**Why not `Banner` for the check line** — the honest answer, because it is the obvious
choice. `banner.tsx` binds an icon to each variant (`variant="neutral"` → `MegaphoneIcon`,
`success` → `CircleCheckIcon`) and fills the row (`bg-surface-sunken` or a status `-muted`).
A megaphone announcing a completed check is wrong, and every other variant is a tint on 35
of 35 files. The line is therefore composed from type and one icon, not from a component
whose semantics do not fit. **This is a DS observation, not a licence** — §13.3.

Every DS name above exists in `vendor/pucar-design-system/src/components/ui/` (catalog
re-globbed — 67 components). **Nothing new is proposed.**

---

## 9. Spacing

Ladder only (`0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`), micro steps inside
controls only:

**Glance:** page `p-6 md:p-8 pb-0` · page stack `gap-6` · panels `p-6` · header cells
`gap-4`, `gap-1` inside a cell · ledger `gap-3` · finding rows `gap-2`, each `Item` at the
DS's own `px-3 py-2.5` (a micro step inside a control) with `min-h-10` · a finding's detail
`pt-3 gap-3`, its document rows `gap-2` · the way-in row `gap-3` · decision band
`px-6 py-3 md:px-8 md:py-4`, `gap-3` between controls · controls `h-10`.

**File view:** body grid `gap-6 xl:gap-8` · claims column `gap-8` · section `gap-4` · groups
`gap-6` · panel `p-6 gap-4` · record block `gap-3` separated by `border-t border-hairline
pt-4` above a `gap-4` · fact rows `py-3`, `gap-4` term-to-value (`gap-1` stacked) · document
rows `gap-2`, each `DocumentSlot` at `p-4`.

Radius nesting: panels `rounded-xl` → rows, wells and controls `rounded-lg` → the facsimile's
own frame `rounded-md` (`ui-craft` §4). The document pane is a container: `rounded-xl`.

**One thing to watch:** the pane's `minmax(20rem,26rem)` is a *width* on the grid, not a
spacing value, and it is on the rem scale rather than the spacing ladder — which is correct
(`RESPONSIVE.md` rule 2 asks for `minmax` and `min-w-0` over fixed pixels).

---

## 10. States (empty / loading / error / partial / long-label)

**The queue** (unchanged): empty "Nothing waiting" (`FolderCheck`); filtered empty "No
matters match this search" + Clear search; no loading or error (demo data); a side with no
vakalat omitted; cause title wraps.

**The complaint's screen:**

| State | What the screen does |
|---|---|
| **Unknown id** | `CaseReviewMissing` — `Empty` + "Back to register cases", as built. Both routes |
| **The common complaint (32 of 35)** | Header, one check line, one caption, the way in, the band. **No finding rows, no scrolling, no colour.** This is the state the design is for and the one to judge it on |
| **`r-1333`** | One flag row: the cheque was deposited outside §138(a)'s three months. Opens onto `Cheque dated` · `Deposited on` · the gap, and the cheque and the proof of deposit |
| **`r-1588`** | One flag row: filed beyond the month with no application to condone on the file. **Check 5 does not also count that slot** (D15). Opens onto `Notice period ended` · `Days beyond the month` and the absent application, which is not a control |
| **`r-1490`** | One flag (the accused's ID proof is not on file — `CASE_FILE_MARKS` names `accused-id-proof`) **and one note** (no advocate on record — the complainant appears in person). The note is plain ink, and the send-back control states it has no recipient (§12.12) |
| **`r-330`, `r-1654`** | One note: a part payment was made against the cheque; the detail carries the cheque amount, the part amount and the balance |
| **Checks 2 and 3 never fire** | True of all 35 today, because `chainFor` builds every complaint inside §138(b)'s thirty days and after §138(c)'s fifteen. The checks stay: a real registry is not a generated chain. **A reviewer cannot see them work, and the fixtures must not be bent to make them** (D15) |
| **A finding whose detail has no document** | Check 4's application and check 6's vakalatnama are *absences*. The detail states the absence in words and offers no control — an absent row is not a control (as built) |
| **Empty group** *(file view)* | Panel keeps its heading and states the absence through the closed `CaseAbsence.reason` + optional explanation copy, no well |
| **Empty fact** *(file view)* | "Not stated" in `text-muted-foreground`, never a blank cell |
| **Document pane, nothing opened** | A quiet line naming what the pane is for. Never a skeleton. Pre-loaded **only** when arrived at from a finding's deep link |
| **Loading / error** | None — derived data, no backend. When a document store arrives, `DocumentPreview`'s own states apply. **The check ledger needs its own third state then**: "checks could not run", which must read as *unknown*, never as *passed* — the one state this design would be dangerous without (§11) |
| **N records (pass 4)** | `Accused.reps[]`, `contacts[]`, `addresses[]` are arrays; S-141 allows several people in charge. Three advocates means 22 documents on the file view and **still one check-6 row** — the ledger's length is bounded by seven, whatever the file holds. That is the property that makes the glance survive a bulk-filing state |
| **Long label / Malayalam** | The glance's exposure is the *finding sentence* (§6), which must wrap to three lines inside a `min-h-10` row without displacing the chevron. The file view's is the `minmax(7rem,10rem)` term track inside a 512px claims column |
| **200% zoom** | At 200% a 1280 viewport is 40rem: the glance is unchanged (it is one column at every width) and the file view falls to its single-column sheet form. The glance's "no scrolling" claim **does not survive 200%** and is not claimed there |
| **~375px phone** | Glance: one column, cells `grid-cols-2`, the way-in caption wraps under the button. File view: one column, documents in a `Drawer` |
| **Send back, no reason typed** | Register unaffected; the send-back's own control is held and says why once the box has been touched and emptied |
| **Send back, no advocate on record** | **Undesigned — §12.12.** Interim: the control states it has no recipient rather than sending nowhere |

---

## 11. Risks accepted

- **A magistrate can register without opening a single document, and this design makes that
  easy.** That is the pull-request posture the owner asked for, and it is a real transfer of
  trust from the reader to the machine and to scrutiny. Three things hold the line: the
  ledger states what ran, the caption states that **no document was read**, and the words
  never say the complaint is in order. The Kerala practice note
  (`ke-scrutiny-officer-2026-07`) is about what happens when a gate is nominal — **a real
  control on this is product's to specify, not design's to imply.**
- **Every check reads entered data against entered data.** A forged cheque, a wrong date
  typed consistently across two fields, or a document that is a photograph of the wrong page
  passes all seven. Stated on the screen (D14) and repeated here because it is the risk that
  will not show up in any test.
- **The checks are machine claims and could be wrong.** Against a real backend a bad date
  makes the ledger assert a defect that is not there. They are `warning`, never
  `destructive`; they never block; they never recommend an outcome.
- **When checks cannot run, silence would be lethal.** Today they always run (derived data).
  The moment a store is involved, "could not run" must render as its own state and never
  collapse into "nothing flagged" (§10). Whoever wires the backend owns this.
- **One more IA node.** The complaint now has two routes. A magistrate who always wants the
  file pays one navigation forever. Accepted on the 32:3 ratio; if the ratio is wrong, the
  fix is to make the file the landing again — every decision for it is preserved in §5a-i B.
- **`Amount` in the header is my addition** (D18), not an owner ruling. One cell.
- **`Court` stays in the header** though it is constant within the queue. The owner kept it
  on 2026-09-10; the argument for cutting it is §5a-ii.4b's own, recorded rather than
  applied.
- **Days waiting has three treatments across three sibling surfaces** (D12, D22). A real
  pass-7 defect, already logged in `register-advocates` §11. Accepted until someone
  reconciles all three in one pass.
- **The file's order and the filing side's order disagree** (D4). Accepted because the two
  readers ask different questions; named so nobody "fixes" one to match the other.
- **Two timeline steps name spine events no store holds.** Kept, now behind a control on the
  file view only.
- **The facsimile is a drawing** and at pane size reads more like a wireframe than a scan.
  Accepted: legible facsimile text would fabricate a court record.
- **Pass 8 is not discharged.** No shell this session — no curl, no screenshot, no
  `check:ds-fresh`. **What the builder must measure, at 375 / 1024 / 1280 / 1440 and 200%
  zoom, before reporting done:**
  1. **The glance resolves without scrolling on `r-1840` at 1280×800.** §7's ≈542px is
     arithmetic. If it fails, the cut is the header's fourth cell, not the caption.
  2. **A finding row with a three-line Malayalam sentence** — does it stay a `min-h-10`
     target, does the chevron stay put, does the disclosure still read as one object?
  3. **`Item variant="outline"` on the `bg-muted` canvas inside a white panel** — the row's
     `border-border` against `bg-card`: is the finding row legibly a row, or a hairline lost
     in a panel? (`ui-craft` §3; measure, do not assert.)
  4. **`warning-ink` text and a `warning-ink` icon on `bg-card`** — the DS tunes this pair to
     4.5:1 on the white page; confirm it on the panel, in both modes.
  5. The file view's sticky pane against the sticky decision band, and whether
     `height="fill"` resolves against a definite container here — the 2026-09-10 build found
     `fill` needs one and fell back to `height="default"`.
  6. Focus order on the glance: check line → each finding trigger → the way in → send back →
     register. And that arriving at the file view **from a finding** moves focus to the
     opened group, not to the top of the page.
  7. Whether the file view's claims column, with both rails gone, reads as an
     undifferentiated scroll. **D7's reversal condition, now scoped to the file view:** if it
     does, the index returns *there*, never on the glance.

---

## 12. Open questions for product

**The one that changes a control, and the one to answer first:**

9. **Is there a third outcome — dismissal at the threshold?** D9 cut `Dismiss case` because
   the owner named two outcomes (§4) and the control was traced to nothing. The owner has
   **separately** said *"we should guide him to either dismiss or accept the case"*
   (relayed, 2026-09-11, §1). That is either loose phrasing for send-back or a real third
   act. A magistrate can dismiss a complaint at the threshold; whether **this screen** is
   where that happens, and what it writes, is product's. **Deliberately not resolved, and
   not quietly reinstated** — the same door `register-advocates` §12.7 stopped at. *If the
   answer is yes, D19's band takes a third control and the send-back's reason field almost
   certainly becomes shared with it.*

**Answered, and kept in the record rather than deleted:**

1. ~~**What is this screen's job?**~~ **Answered by the owner, 2026-09-11** — quoted in full
   in §4, with the glancing framing in §1.
2. ~~**Who does it?**~~ **Answered by the owner, 2026-09-11** — the magistrate. Consistent
   with `actors.md` L38/L45. Resolves the question **for this screen**, not
   `open-questions.md` L9–12 product-wide.
3. **When does a complaint enter this queue?** Partly answered — "after it passes through
   scrutiny" (owner). Still open: what happens to a complaint scrutiny *returned*, and
   whether it re-enters here or the advocate's own queue.

**Still open, with UI consequences:**

4. **What does Register do**, and what number does the complaint receive? A `CMP` complaint
   taken on file is renumbered as a summary trial (`ST/…`) and nobody has said by what rule.
   **This is what keeps both controls `aria-disabled`.**
5. **When does a complaint leave this queue** — and does a returned complaint stay readable?
6. **Which of the registry's other fields does a magistrate taking cognizance read?** Listed
   at the end of §5a-iii. None is added on a guess.
7. **Is the cheque's return reason a closed list or free text?** The registry has it as a
   machine-prefilled `string`; the screen renders three values. **§138 requires the return to
   be for insufficiency of funds or an amount exceeding the arrangement** — so if it is a
   closed list, that is an eighth check; if it is free text, no machine can make it.
8. **Does the court side get a document store — and is the scrutiny bundle reader the
   viewer?** The workbench already has a reader (`scrutiny/bundle-view.tsx`). This screen's
   pane is deliberately the light one, and the owner's "not as exhaustive" argues for keeping
   it that way.
10. **Does scrutiny produce a recorded outcome the magistrate's screen can carry?**
    **Raised in priority by this revision.** The owner does not need the annotation or the
    history — but *whether scrutiny passed, and whether anything was raised and cleared*, is
    a different fact, and it is the single thing that would most justify the glance. Today
    the ledger can only say "seven checks ran"; with a scrutiny outcome it could say what a
    person found, which is a far stronger basis for a fast register. Nothing in the product
    records it (the two timeline steps are unbacked). **Do not build a scrutiny-outcome
    attribute on a guess.**
11. **Should a send-back name the attribute it is about?** `{attribute, reason}` instead of
    one free-text field. **This screen makes it cheaper than the advocate queue did** — the
    vocabulary is closed in `FACT_TERMS`, the slots are keyed, and now the *findings* are a
    closed set of seven, so a send-back raised from a finding could carry its id for free.
    Still a **product change**: it alters what is stored and what the advocate is told. **Not
    built.** Must be answered together with `register-advocates` §12.10 or the court side
    ends up with two return grammars.
12. **What happens to a send-back when there is no advocate on record?** `r-1490` is a
    complaint in person; the owner's sentence is "that sending it back will go to the
    advocate". Can a complaint in person be returned at all, and to whom? **A real state the
    demo data already produces and nobody has designed** — and now check 6 puts it on the
    landing, where it will be seen.
13. **Which ID does "ID proof" mean, and does it carry an address and a date of birth?**
    Three rows in §5a-iii are marked checkable against it. If the slot accepts any of several
    IDs, the checkable count drops from 29 to 27.
14. **Where is the power-of-attorney instrument?** `Complainant.poa` answers Yes on two
    complaints, `poaHolder` exists in the registry and is never shown, and **there is no PoA
    slot on the form at all.** Under §142(a) the complaint must be by the payee or holder in
    due course, so this is not cosmetic.
15. **What does a magistrate use this on?** Bench desktop, chambers laptop, tablet? The
    glance is one column at every width, so it no longer *depends* on the answer — but the
    file view's split starts at `xl`, and if the real device is a tablet in portrait the
    dig-in path degrades to open-read-close.
16. **Which document slots are mandatory?** Check 5 counts "required documents not on file",
    and the model cannot distinguish *absent because not applicable* (the reply slot on a
    complaint with no reply, which is correct and must never be flagged) from *absent because
    nobody uploaded it*. The interim rule is `IntakeSlot.file === null` on slots the form
    required, with the conditional reply slot excluded by construction. **A real list from
    product replaces the interim rule.**
17. **Does the magistrate want the unverifiable values enumerated?** Fifteen values on this
    file have no source document (problem 17). This brief states the limit in one caption and
    does **not** list them, on the judgment that the list is a property of the *form* and
    identical on every complaint — the constant-column rule. If a magistrate would rather see
    "these fifteen cannot be checked", that is a product call and one more ledger line.

Items 1, 2 and 15 additionally belong in `docs/product/open-questions.md` as role and
product-user questions; filing them there is product's call, not this brief's.

---

## 13. Gaps in the DS (if any)

**None blocking.** The glance is composed entirely from existing primitives; nothing here
needs a new component, and "the DS has no check-ledger primitive" is not true of a system
that has `Item`, `Collapsible` and `DescriptionList` — it is true of a system with no
*screen* that composes them this way, and this is that screen.

Four observations for the DS repo, none a licence to invent here:

1. **`Banner` binds its icon to its variant.** `variant="neutral"` is a `MegaphoneIcon`,
   which is an announcement, not a report. A `neutral` banner reporting a completed machine
   check has no correct icon in the component, so this screen composes the line instead
   (§8). Worth either an `icon` override or a fifth variant whose semantics are "a system
   report".
2. **`AccordionContent` fixes its height from a Radix variable measured at open and never
   remeasured**, so content that reflows is clipped when the window narrows. This build
   worked around it with `h-auto`; the workaround left with the accordion, but the issue
   stands for the next caller.
3. **`AccordionItem` ships `not-last:border-b`**, which a bare `border-b-0` cannot displace
   because tailwind-merge treats a variant-prefixed utility as a different group. Drop the
   default or document the reset.
4. **App-level, not DS:** `DocumentPreview`'s quiet variant now has three callers with the
   same shape, and every one ships a "Full view" control inside something that already is the
   full view. A `showFullView={false}` prop belongs in
   `components/cases/document-preview.tsx`, which is Dristi's — the build pass, not
   `ds-requests.md`.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-02 | First pass from the legacy screenshot: compose the list in the court-side table panel; no registration act. | user asked; ux-designer |
| 2026-09-02 | Queue grown from 4 to 35 so the table and pager can be judged at volume. | user asked |
| 2026-09-09 | The complaint's file added behind the cause title; the case name becomes a link. | user asked; ui-designer |
| 2026-09-09 | A details pass was built and reverted at the owner's request. One correctness fix kept: the delay-condonation grounds row no longer cites an application that is not on the file. | user asked; ui-designer |
| 2026-09-09 | Documents became realistic filings — page facsimile per kind; absent slots carry no paper. | user asked; ui-designer |
| 2026-09-09 | Right-hand case timeline filled along the Kerala spine, stopping before cognizance. | user asked; ui-designer |
| 2026-09-09 | The reading index's marked entry rebuilt after entries lagged and skipped. Verified over CDP: 40/40 clicks, 60/60 scroll positions. | user reported; ui-designer |
| 2026-09-09 | Helper line on the decision band cut. | user asked; ui-designer |
| 2026-09-10 | **Sections are no longer collapsible.** The accordion and its three workarounds go. | **owner (Abhiram)** |
| 2026-09-10 | **The word is "Register."** "Admit" goes. | **owner (Abhiram)** |
| 2026-09-10 | **Timeline trimmed to traceable events.** | **owner (Abhiram)** |
| 2026-09-10 | **Header constants cut** — case category and case type are identical on every §138 complaint. | **owner (Abhiram)** |
| 2026-09-10 | **Documents move to the app's `DocumentPreview`**; derived filename, page count and size cut. | **owner (Abhiram)** / ux-designer |
| 2026-09-10 | **Terms become attribute names**; rows switch on the container, not the viewport. | **owner (Abhiram)**; ux-designer |
| 2026-09-10 | **§5a Attributes table added** — 11 rows with no source cut as invented; 4 duplicates, 2 constants and 2 fabricated file facts with them. | ux-designer |
| 2026-09-10 | **The tinted confirmations `Alert` becomes one fact row** — it appeared on every complaint. | ux-designer |
| 2026-09-10 | **Typography cut from six levels to four sizes.** | ux-designer |
| 2026-09-10 | **Grid tracks rebalanced** to 13rem / 1fr / 15rem; `size-9` → `size-8`. | ux-designer |
| 2026-09-10 | Built to §5a; six deviations commented in place; two focus defects fixed on the render. | ui-designer |
| 2026-09-10 | ui-reviewer audit: ship after fixes. Five values constant on every complaint cut or made real; a value-cardinality test now enforces it. | ui-reviewer / ui-designer |
| 2026-09-11 | **Section 4 dropped.** The accused cannot file before registration. | owner (Abhiram) |
| 2026-09-11 | **Breadcrumb shows the current step, product-wide.** | owner (Abhiram) |
| 2026-09-11 | Design-mode round three: header facts back to labelled cells; section headings to `text-body` 600; canvas `bg-muted` with white panels (**owner overrules ui-craft §1.0, logged**); documents on e-filing's `DocumentSlot`/`ThumbnailButton`; litigant-type tag adjacent to the name. | owner (Abhiram) / orchestrator |
| 2026-09-11 (evening) | **The Job is confirmed and the screen is rebuilt from it** (§4). §12.1 and §12.2 answered and kept in the record. | **owner (Abhiram)** |
| 2026-09-11 (evening) | **D1–D12** — the document opens beside its claims (two panes from `xl`); a check region that renders nothing on 32 of 35; the statute's section order; nothing folded away; the norm goes quiet (badge, `meta="Filed"`, `Documents` caption); the index and the timeline leave the standing layout; `Dismiss` cut for **Send back for correction**; §5a-iii rewritten with a `Checked against` column (29 checkable / 3 computed / 15 declared-only / 0 invented). | ux-designer, on the owner's Job |
| **2026-09-11 (night)** | **The glancing framing is given and becomes the brief's centre** — quoted in full in §1: the magistrate has no time, the design must not be cognitively taxing, "this is that equivalent of the glancing experience that you need to design for", the pull-request reviewer who trusts the checks and looks only where something snags. | **owner (Abhiram)** |
| **2026-09-11 (night)** | **D13 — the landing is not a verification surface.** The two-pane, 29-row claim screen written hours earlier is **demoted from landing to destination**; the landing becomes header → check ledger → one way in → the act. Recorded as problem 20 and as **my defect**: it was a better instrument for the job the magistrate delegated. | ux-designer, on the owner's framing |
| **2026-09-11 (night)** | **D14 — D2's silence is superseded.** A clean complaint now gets **one counted line** ("Seven checks ran on the entered data. Nothing flagged.") plus a caption stating that no document was read. Silence could not be told from "not checked" (problem 21), and an unstated limit made an absence of flags read as verification (problem 23). Passes never take rows; no green ticks, no tint, no score, no verdict. | ux-designer |
| **2026-09-11 (night)** | **D15 — four checks become seven**, each a boolean over fields `case-review.ts` already holds at `d885d30`: presentation window, notice window, premature filing, the month and its condonation application, required documents, an advocate on record, part payment. Severity is a derived two-value enum (`flag` / `note`) — appearing in person is lawful and is never inked as a defect. No check reads a document; no check may be invented for jurisdiction or the return reason (§12.7). | ux-designer |
| **2026-09-11 (night)** | **D16 — a finding opens where it is stated**, inheriting `register-advocates` **D23** rather than re-deriving it: the row states the finding in words, the disclosure holds the entered values it read and the documents that would settle it, and opening a document leaves the glance for the file view. | ux-designer |
| **2026-09-11 (night)** | **D17 — one control, one route.** "Open the full file" → `/employee/register-cases/<id>/file`, with the counts beside it; findings deep-link into it (`?doc=…#group`). Rejected: tabs, an in-place mode, an overlay. The decision band exists on both views. | ux-designer |
| **2026-09-11 (night)** | **D18 — `Amount` joins the header** (Court · Amount · Submitted · Waiting): the fact that sizes the consequence, free from `ChequeDetails.amount`. **Flagged for the owner — one cell, mine, reverses in a line.** | ux-designer |
| **2026-09-11 (night)** | **D19 — the act is unchanged, and the third outcome is escalated.** The owner's separate *"we should guide him to either dismiss or accept the case"* is recorded in §1 and raised to the **head of §12 as §12.9**, unresolved. `Dismiss` is **not** quietly reinstated. | **owner (Abhiram)** for the statement; ux-designer for refusing to resolve it |
| **2026-09-11 (night)** | **D20, D21 — no overlay on the glance; the index stays cut and the timeline leaves the glance for the file view only.** **One correction to D7:** the section `id`s and their `scroll-mt-(--chrome-sticky-top)` are **not** deleted — the file view's deep links need them. | ux-designer |
| **2026-09-11 (night)** | **§5a-iii gains a `Surfaced` column** (`glance` / `glance·fired` / `file` / `sheet` / `stage` / `cut`). The number the design turns on: **47 body values become 8 before the act**, and the other 39 are one control away. | ux-designer |
| **2026-09-11 (night)** | **Correction against the code:** `r-1490`'s missing slot is `accused-id-proof` — *the accused's* ID proof, not the complainant's (`CASE_FILE_MARKS`, `case-review.ts`). §10 and §5a-iii say so. | ux-designer |
| **2026-09-11 (night)** | Pass 8 **not** discharged: no shell this session. Seven render checks handed to the builder in §11, headed by the glance's "no scrolling at 1280×800" claim, which is arithmetic (≈542px) and not a measurement. | ux-designer |
