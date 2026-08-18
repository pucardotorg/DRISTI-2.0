# Pending tasks — UX research: how the All-pending-tasks view should be organised

Status: research memo (input to the pending-tasks brief) · Updated: 2026-08-18 · Author: ux-research agent · Grounding: the verbatim ask (`pending-tasks-ask.md`), `docs/product/*`, the local home screen (`feature/advocate-home-screen-v3`), the Cases brief (`proposals/cases.md`), the e-filing sign step (`feature/e-filing-new`), DRISTI 1.0 source and issues (`pucardotorg/dristi-solutions`, `pucardotorg/dristi`), eFiling Services 3.0 manual, and queue/inbox/approval patterns from Linear, Things, Todoist, Asana, Superhuman, HEY, Jira Service Management, Clio, MyCase, DocuSign and maker-checker guides.

This memo is about the **organisation and behaviour** of the All pending tasks view. The task
taxonomy, statutory clocks, vakalatnama law and DRISTI 1.0 task vocabulary live in the sibling
**domain memo** (`pending-tasks-domain.md`); this memo assumes that taxonomy exists and refers
to it. Nothing here is a finished design: no components, no layout, no pixels — those belong to
the designer's brief.

Every finding is tagged **Grounded** (with a citation), **Inferred** (a reading of grounded
material), or **Judgment** (a recommendation the designer may overrule). Estimates are labelled.

---

## 0. In one screen

- **The view answers one question first — "what must I do next, across every case I can see?" —**
  and two follow-ups: "what is stuck on someone else?" and "what did I hand off, and where is
  it?" (Grounded: the ask; Inferred: the three questions.)
- **Three views, not one list:** *To do* (default) · *Waiting* (on someone else — sent for
  approval, awaiting court, payment confirming) · *Done* (recent, incl. expired/obsolete). Same
  population split as DocuSign's *Action required / Waiting for others / Completed* and Linear's
  assigned-vs-created tabs. (Judgment on the names; Grounded on the pattern.)
- **Default sort = urgency descending, made explicit as bands:** Overdue → Due today → Due
  before the next hearing / this week → Later → No date, with *Long pending* (overdue >45 days)
  collapsed at the bottom so stale items stop crowding the actionable ones — a lesson DRISTI 1.0
  learned in production. Within a band: blocking first, then earliest consequence date, then
  case, then oldest created. (Grounded on 1.0; Judgment on the exact tuple.)
- **Default group = by urgency band** with sticky headers; person can switch to *by case*,
  *by kind* (sign / pay / submit …), *by person*. (Judgment.)
- **Lenses:** person avatars (as on the home board) · *Blocking a hearing* · *Awaiting my
  approval* · *Unassigned* as chips with counts; kind, court, stage, date range, "show
  expired" in a deep-filter sheet echoed as removable chips; type-to-filter search; state in
  the URL. Same reasoning as `cases.md` D1–D4. (Judgment, consistent with the Cases brief.)
- **Row = title (verb + object) · case · due cue · blocking cue · owner · one status/permission
  cue.** Actions reveal on hover **and** focus-within, always visible on touch — exactly the
  home rail's stance. (Grounded: `task-row.tsx`.)
- **Detail = a side panel that pushes the list on desktop, a full-height sheet on a phone —
  the home screen's case-peek model.** Act flows (pay, sign, submit) leave the panel for a
  focused page and return to it. (Grounded on the peek; Judgment on the split.)
- **Approvals are the senior's own tasks** (verb "Approve & sign"), interleaved by urgency in
  *To do* and isolable by the *Awaiting my approval* chip; the junior sees the same task in
  *Waiting* as "Sent to R. Manoj · 2 d ago". No separate route. (Judgment.)
- **"Mark done" only for tasks the system cannot observe** (offline/paper steps). Payment,
  e-sign and submission tasks close on the event, never by hand — 1.0 closes tasks by
  workflow `closerAction`. (Grounded on 1.0; Judgment on the rule.)

---

## 1. What this view is for

**In the owner's words** (Grounded, `pending-tasks-ask.md`): "the things that are pending in a
case that need to be done by the advocate to move the case forward" — a pending signature, a
payment for a process, a document to submit; today the home rail shows them "in descending
order of urgency … the pending task that's blocking and is coming up will be shown first"; the
new view must "treat this in multiple levels. One filter would be urgency, of course, but there
should be other filters as well"; and because case access is shared with juniors and seniors,
"I have access to the pending tasks that are not just mine but relevant to other people as
well. Depending upon the kind of permission that I have, I will be able to act on it or not."

**My reading** (Inferred): this is a **work queue with deadlines and ownership**, not a to-do
app. Tasks are created by court events (an order, a scrutiny defect, a fee demand, a summons to
pay for) or by the flow itself (a signature outstanding on a prepared document); most have a
consequence date; several block a listed hearing; some can be finished only by the advocate on
the vakalatnama. The person arrives with one of three questions:

| Question on arrival | Who typically | What the view must make instant |
|---|---|---|
| "What must I do next?" | Everyone, every day | The most urgent actionable task at the top, and the ability to act without leaving |
| "What is stuck on someone else — court, junior, senior, client?" | Seniors; anyone before a hearing | A separate population that does not pollute *To do*, with who/when it is waiting on |
| "What did I hand off, and did it come back?" | Juniors / non-signatories | Their sent-for-approval items with status, and sent-back items surfacing at the top of *To do* with the note |

**What it is not** (Judgment, consistent with `cases.md` §4–§5): not a case list (Cases owns
"find and open a matter"; this view is task-first and case is a property of a row); not
notifications (the bell reports events, this view holds obligations until they close — 1.0's
"Scrutiny sent back your application" alert vs the "Fix 2 defects" task on the home board is
the right split); not the calendar (hearings are dates you attend, tasks are work you finish;
the calendar may mark task-due days, this view does not list hearings).

## 2. Populations the view must serve at once

The owner confirms one shared access model — a team of advocates (seniors/juniors) sharing
cases; the home board already carries five advocates as avatar chips and tasks carry an
`owner` (Grounded: `data.ts`, `court-board.tsx`). DRISTI 1.0 formalises the same thing as
"Manage office": an advocate adds members designated *Clerk* or *Assistant advocate*, each with
*All cases* or *Specific cases* access; a member sees "Advocates I work for" and picks the
senior they are acting for (Grounded: `ManageOffice.js`, `SelectAdvocateModal.js`; 1.0 fetches
a member's tasks with `officeAdvocateUuid` + `officeMemberUuid`, i.e. *the senior's tasks the
member has access to*). eFiling 3.0 has the equivalent "My Partners / Associates / Colleagues"
(Grounded: eFiling 3.0 manual §6.1).

| Population | Who sees it | Default view placement (Judgment) | Why |
|---|---|---|---|
| **A. My tasks** — assigned to me | Everyone | *To do*, no chip needed | The core |
| **B. Tasks on cases I share, assigned to a teammate** | Anyone with case access | *To do*, shown with the owner's avatar; narrowable by avatar chip | A junior's overdue task blocks *my* hearing too; hiding it is the failure mode in a deadline domain |
| **C. Unassigned tasks on my cases** | Everyone with access | *To do*, cue "Unassigned", chip *Unassigned (n)* | 1.0 creates most tasks against a *role* not a person (`assignedRole`); the home seed already has "Unassigned" rows (Grounded) |
| **D. Tasks I can only prepare** (not on the vakalat) | Non-signatories | *To do*, cue "Needs R. Manoj's signature" on the row; primary action "Prepare" | The owner's "you can still act … it gets done halfway" |
| **E. Tasks awaiting my approval** (I am on the vakalat) | Seniors | *To do*, as tasks whose verb is "Approve & sign", cue "Prepared by S. Prakash"; chip *Awaiting my approval (n)* | They *are* the senior's tasks; a separate inbox would split their queue |
| **F. Tasks I handed off** (sent for approval) | Juniors | *Waiting*, cue "Sent to R. Manoj · 2 d ago" | Not actionable by them until it comes back |
| **G. Tasks waiting on the court/system** (submitted, awaiting scrutiny; payment confirming) | Everyone | *Waiting* | Same "not my move" semantics as F |
| **H. Done / expired / obsolete (recent)** | Everyone | *Done* | Reassurance ("did I pay that?"), receipts, and the only place expired items are explained |

**Scale** (Grounded: `product-foundation.md` §6): Kerala pilot ≈ 2,000 cases/yr in Kollam,
individual filers, the home seed shows one advocate with 17 open tasks across ~15 live matters
(estimate from `data.ts`); Gujarat sometimes ≈ 1,000+ cases/day, bank/NBFC filers — bulk.
Consequence (Judgment): the **default must be legible at 15–30 tasks and survive 300+**. That
means: default *To do* shows A + B + C + D + E together, sorted by urgency, grouped by band, with
counts on every lens so a Gujarat user can cut immediately by person, kind or case; nothing is
hidden by default except the *Waiting* and *Done* populations and *Long pending* (collapsed,
counted). A senior who finds B noisy narrows with their own avatar chip; that choice persists
in the URL / last-used state, not as a hard-coded "mine only" default.

Should the default be "mine only" instead? Arguments for: Linear, Asana, JSM all default to
"assigned to me" (Grounded). Against (Judgment): those tools assume every item *has* an
assignee; here many tasks are role-addressed/unassigned (C) and a senior is accountable for
juniors' work on the vakalat. The home board already shows the whole team's hearings and
narrows by chip — the tasks view should feel like the same instrument.

## 3. Filter and lens dimensions

Treatment vocabulary follows `cases.md`: **View** = mutually exclusive population (tab);
**Chip** = one-tap, non-exclusive lens with a count; **Deep filter** = in the filter sheet,
echoed as a removable chip; **Group-by** = a display option, not a filter (Linear's distinction:
"filters will refine the list … while display options show all issues", Grounded); **Search** =
type-to-filter, no submit (cases.md D2; NN/g: interactive filtering suits single-criterion
intent, batch suits multi-criteria — the sheet is the batch surface, chips are interactive,
Grounded).

| Dimension | Values (cardinality) | Why it earns a place | Treatment | Notes |
|---|---|---|---|---|
| **Population / status** | To do · Waiting · Done (3) | Different questions, different actions, different useful columns — the D1 test | **View** | Waiting = sent for approval, awaiting court, payment confirming. Done = completed, expired, obsolete (last 30 d) |
| **Urgency / due** | Overdue · Due today · Before next hearing / this week · Later · No date · Long pending (6 bands) | The owner's first filter; the primary sort | **Group-by (default)** + sort; *not* a chip | Bands as sticky group headers with counts do the filter's job without hiding anything. A due-range picker lives in the sheet |
| **Blocking a hearing** | yes/no | The owner's own top-level notion; the home board surfaces "blockers" per hearing (Grounded) | **Chip** with count | Also a sort tie-break within a band |
| **Whose** | me · each teammate · unassigned (team size + 1, ~6) | Shared access is the whole point; the home board already uses avatar chips (Grounded) | **Chips** — the same avatar row as the home board; plus *Unassigned* | Multi-select, as on the board |
| **Can I act** | finalisable by me · needs approval (I can prepare) · awaiting my approval · view-only (4) | Permission decides the verb on the row | **Row cue** + one **chip** (*Awaiting my approval*) | "Needs approval" is a row cue, not a filter — a junior would filter *out* their own work otherwise. View-only tasks (no case access to act) should be rare; treat as edge case §8 |
| **Action kind** | sign · pay · submit · respond · fix defects · appear/prepare (~6, from the domain memo) | Batch mode ("pay everything", "sign everything") — Superhuman's split-inbox rationale: process one workstream together (Grounded) | **Group-by** option + **deep filter** | Not chips in v1: chips row is already avatars + 3; kind-as-group gives the batch benefit without hiding the rest. Revisit as chips if Gujarat usage shows kind is the first cut (v2) |
| **Case** | one of N live cases | "Everything on this case before Thursday" | **Search** (type-to-filter on parties/number/task title) + **Group-by case** | The case peek on the home screen already lists a case's tasks; deep-linking from a case to this view pre-filtered is cheap |
| **Court** | 4 in Kollam (Grounded: home data) | Court-day preparation | **Deep filter** | Low frequency; the home board is already court-tabbed |
| **Stage** | ~10 national stages | Rarely how an advocate thinks about tasks; 1.0 offers it in the judge's table (Grounded) | **Deep filter** | Cut from chips |
| **Date created** | range | "What arrived since Monday" — Asana's *Recently assigned* is the inbox for exactly this (Grounded) | **Sort option** ("Recently added") + **deep filter** | A "new since you last looked" marker on rows is cheaper than a filter (v2) |
| **Task type / entity (1.0 vocabulary)** | order · application · hearing · summons … | 1.0's *Task type* dropdown filters by keyword; product asked to hide the *Case type* filter when there is one value (Grounded: issue dristi#1309) | **Cut** as a user-facing filter; kind (above) replaces it | Do not ship a "Case type" control while §138 is the only type — same as cases.md D6 |
| **Priority (manual High/Normal/Low)** | 3 | Clio/MyCase have it (Grounded) | **Cut** for v1 | Urgency here derives from deadlines and blocking; a manual priority invites disagreement with the court's clock. Revisit if product wants personal flags |
| **Bookmark / snooze / "set aside"** | — | HEY's *Set aside* / *Reply later* (Grounded) | **Cut** for v1 | Snoozing a statutory deadline is dangerous; a personal "later" pile hides risk. Open question §13 |

**Default sort** (Judgment; consistent with the owner's "descending urgency, blocking and
coming up first" and with 1.0's ascending-by-`stateSla`, no-date-last ordering — Grounded,
`PendingTaskAccordion.js`). Sort key, compared in order:

1. **Band** — Overdue (≤45 d) → Due today → Due before the next hearing in that case, or within
   7 days, whichever is sooner → Later → No date → Long pending (overdue >45 d).
   *Consequence date* = the earlier of the task's deadline and the hearing it blocks.
2. **Blocking a hearing** before not blocking.
3. **Consequence date** — earliest first (so within Overdue, most overdue first, matching the
   rail's seed order 41 d → 2 d).
4. **Case** — group ties from the same matter together (alphabetical by parties).
5. **Created** — oldest first.
6. **Task id** — final deterministic tie-break so the rail and the view never disagree.

Why the 45-day cut (Grounded → Judgment): 1.0 splits citizens' tasks into *Due this week* /
*Upcoming* / *Long pending* precisely because "long forgotten tasks stop crowding the
actionable ones" (`home/src/utils/index.js`), and a fresh issue asks to archive >45-day tasks
out of *Complete this week* (dristi#5956, 2026-08-06). Keep the group visible and counted, do
not hide it — a stale task is a decision waiting to be made (expire, drop, escalate; §8).

**Default grouping**: **by urgency band**, sticky headers with counts, all groups expanded
except *Long pending*. When would a person switch (Inferred from the populations)?
*By case* — before a hearing or when a case has many tasks; *by kind* — batch payment/signing
(Gujarat); *by person* — a senior reviewing the team's load. *By day* is the calendar's job and
is cut. Grouping is a display option that persists per person (Linear persists display options
per user, Grounded).

## 4. The task row

What a row must carry to be triaged **without opening** (Judgment, built on the rail's row and
1.0's card: `{action} : {case title}` / `NIA S138 – filing no – Due in N days`, Grounded):

| Slot | Content | Always / conditional |
|---|---|---|
| Title | **Verb + object**, one line: "Pay the ₹2 process fee", "Sign the vakalatnama for the additional complainant", "Approve & sign — proof affidavit prepared by S. Prakash" | Always |
| Case | Parties (and case number as a caption); when grouped by case, omitted from rows | Always |
| Due cue | Words, not a badge: "4 days past due", "Due today", "Due 11 Aug", "Before hearing 3 Sep", "No due date"; band colour only on overdue/today | Always (the one status cue at rest, per the rail) |
| Blocking cue | "blocks item 4" (today) / "blocks hearing 3 Sep" | Only when blocking |
| Owner | Avatar of the assignee, or "Unassigned" as caption | Always |
| Status / permission cue | **One** of: "Needs R. Manoj's signature" · "Prepared by S. Prakash" · "Sent back — 1 note" · "Draft saved" · "Sent to R. Manoj · 2 d" (Waiting) · "Awaiting scrutiny" (Waiting) · "Payment confirming" (Waiting) · "Expired 3 Aug" (Done) | Only when the plain state does not apply; never stack two |

**Not on the row**: the order text, fee breakdown, document list, history, court name and stage
(unless grouped by them), created date, task id, kind icon (the verb already says it — the
ui-craft rule "one status cue at rest" and "at most two weights" apply, Grounded §1). Case type
is constant and never shown (cases.md D6).

**Actions**: revealed on hover **and** focus-within, replacing the due-cue slot rather than
stacking, and always visible on coarse pointers — the rail's exact stance (Grounded:
`task-row.tsx`, `DueCue`/`TaskActions`); hover-only would fail keyboard access (WCAG 2.1.1) and
hover-revealed content must be dismissable/hoverable/persistent (WCAG 1.4.13, Grounded). Two
actions per row at most: the task's own verb (Pay / Sign / Upload / Prepare / Approve & sign /
Continue) and *Mark done* only where §6 allows it; anything else (Reassign, Open case) lives in
the detail. A **selection checkbox** for bulk (§9) also reveals on hover/focus and stays visible
once any row is selected.

**Row click** opens the detail; the verb button starts the act flow directly. Both must be
reachable by keyboard; the row is not itself a link to the case.

## 5. The task detail

Opening a task shows (Judgment; the "why/what/who/when" set is inferred from 1.0 tasks that
redirect into the order/application that created them, Grounded `TaskComponent.js`):

1. **Header** — verb + object; case (parties, number, court); due cue and band; owner.
2. **Why** — the court/system event that created it: "Order dated 27 Jul 2025 — 'complainant
   directed to keep PW-2 present on the next posting date'"; or "Scrutiny returned the
   application on 4 Aug with 2 defects"; or "Summons issued — process fee payable". Link to the
   order/notice.
3. **What to do** — steps in order; documents needed (with what is already attached);
   fee amount and breakdown; who must sign (and whether that is you).
4. **Deadline provenance** — "Due 11 Aug — set by the order of 27 Jul · next hearing 3 Sep ·
   this task blocks that hearing". If no due date: "No date set — the court did not fix one".
5. **Permission line** — "You can pay this" · "Only R. Manoj (on the vakalatnama) can sign;
   you can prepare it and send it for his approval" · "You are viewing this; S. Prakash is on
   it".
6. **History** — created (by which event, when) → assigned/reassigned → prepared → sent for
   approval → sent back with note → approved → paid/signed/submitted → closed (by which event).
   Maker-checker guidance: keep a tamper-proof trail of who initiated, who approved/rejected and
   when (Grounded).
7. **Case context** — stage, next posting, the case's other open tasks, "Open case".
8. **Primary action** (the verb) + secondaries (Reassign, Mark done where allowed, Open case).

**Push panel vs sheet vs page** (argued): the home screen's case peek is an in-flow, non-modal
panel that pushes the board from the desktop breakpoint up — "no scrim, no focus trap, the board stays live" — and
falls back to a full-width overlay sheet on a phone (Grounded: `case-detail-panel.tsx`
comment). The tasks view should reuse that model: **triage is a list-and-detail loop** (open,
read, act or move on), and a push panel keeps the list live for next/previous and preserves
group position; a modal sheet on desktop breaks the loop and hides counts; a full page loses the
list entirely and makes "back" ambiguous. The **act flows themselves** (payment gateway,
e-sign, defect fixing with uploads, application drafting) are focused work with their own
steps and receipts and should open as **pages** (as the e-filing sign step does, Grounded:
`filings/[draftId]/sign/page.tsx`), returning to the view with the task's row updated and
flashed — the rail's "arriving here focuses the card, does not select it" behaviour (Grounded:
`pending-tasks-rail.tsx`). Every task has a **URL** so the rail, notifications and the case
peek can deep-link to it.

## 6. Acting on a task

The owner names three families (sign, pay, submit); defects and responses are the other two
frequent kinds in 1.0 (Grounded: action names "Make Payment", "E-Sign Pending", "Esign the
Submission", "Mandatory Submission of Documents", "Case Sent Back for Edit", "Pending
Response"). Two permission states apply to each: **finalise** (on the vakalatnama) or
**prepare** (not).

| Family | Steps for a finaliser | What "done halfway" means for a non-signatory | Closes when |
|---|---|---|---|
| **Pay** | Fee breakdown → choose channel (online / offline treasury) → gateway → *Payment confirming* → receipt in the task and the case | Prepares the payment (process type, delivery, address) → *Send for approval*; senior approves and pays. Owner's rule: payment is a finalising action (Grounded). See open question §13 Q1 | Payment confirmed by the system (1.0 issues show confirmation lag and failure — Grounded dristi hotfix 19.1) |
| **Sign** | Preview the document → e-Sign (Aadhaar OTP) / DSC / upload signed copy — the e-filing sign step's three modes (Grounded: `sign-section.tsx`) → signed → submitted | Fills/attaches → *Send for approval*; senior gets "Approve & sign". eFiling 3.0's *Authorize Signatories*: the preparer names signatories, each signs from their own login (Grounded) | Signature recorded and the document filed/accepted |
| **Submit** | Draft application/document → preview → sign if required → pay if required → submit → *Awaiting scrutiny* | Drafts and attaches → *Send for approval* (if a signature/payment is needed) or submits directly where no finalising step is involved (open question Q1) | Registry accepts; defects re-open it as *Fix defects* |
| **Fix defects** | Defect list (from scrutiny; the home seed shows "2 defects to fix before re-filing", Grounded) with per-defect done state → re-upload → re-submit | Fixes and prepares → *Send for approval* if re-signing is needed | Re-submitted and accepted |
| **Respond** | Read the submission/order → draft response → sign/submit | Drafts → *Send for approval* | Response filed |
| **Approve & sign** (senior) | Queue of prepared items → open one: preview of the prepared document, what changed since the last version if resubmitted, the junior's note → **Approve & sign** (inline e-sign / DSC) · **Send back with note** · **Take over** ("I'll do this myself") | — | On approve: the underlying task completes through the finalising step. On send back: the task returns to the junior's *To do* at the top of its band with the note |

Maker-checker rules that transfer (Grounded, nasscom/opcito guides; Judgment on applying them):
no self-approval — a signatory who prepares simply finalises; the operation stays *pending*
until the checker acts; the trail records who prepared, who approved/sent back, and when.

**Confirmations and receipts** (Judgment): confirm before any irreversible external step
(payment, e-sign submission); never confirm "open", "prepare", "save draft"; after payment or
signing, show a receipt in the task and the case with an id the person can quote at the
counter. Non-modal success in place; the row updates and moves to *Done*.

**"Mark done"** — which tasks may be completed by hand?

- **Manually completable**: tasks whose completion the system cannot observe — "keep PW-2
  present", "collect the certified copy", "serve the notice by hand", offline treasury payment
  (completes with a receipt upload, not a bare tick). Mark done asks for nothing but records
  who and when in the history.
- **Event-completed only**: pay online, e-sign, submit, fix defects — 1.0 closes these by
  workflow `closerAction` when the order/application/payment reaches the closing state
  (Grounded: `PendingTaskType.closerAction`). Showing *Mark done* on them invites false
  completion of a statutory step; hide it and offer the real verb.
- The home rail today offers *Mark done* on every row (Grounded: `TaskActions`); recommend it be
  gated by task kind in both the rail and this view (§11).

## 7. The drafts / awaiting-approval section

The owner: "we need a small section for pending tasks that are in the draft stage" (Grounded).
Two people see the same task from two sides.

| Side | Where it lives (Judgment) | Row cue | Count / badge |
|---|---|---|---|
| **Junior — "I handed off"** | *Waiting* view, group "Sent for approval" | "Sent to R. Manoj · 2 d ago"; secondary action *Nudge* (v2) | *Waiting* tab count |
| **Junior — sent back** | *To do*, top of its band, cue "Sent back — 1 note" | Note visible in the detail; the row flashes on arrival | Included in *To do* count |
| **Junior — draft not yet sent** | *To do*, cue "Draft saved · 3 Aug"; verb *Continue* | — | Included in *To do* |
| **Senior — "waiting on me"** | *To do*, interleaved by the underlying task's urgency; verb *Approve & sign*; cue "Prepared by S. Prakash" | Chip *Awaiting my approval (n)* isolates the queue for a signing session | Counted in *To do*; the nav/rail count includes them — they are the senior's tasks |

**Tab, group, chip or route?** (argued): a separate route splits one obligation into two
places and breaks urgency ordering; a permanent group at the top of *To do* pins approvals
above genuinely more urgent work (an approval due next week above a defect due today); a tab
for the senior's approvals hides them from the default view. So: **the senior's approvals are
ordinary tasks plus a chip; the junior's handed-off items are a group inside *Waiting*.** This
mirrors DocuSign's *Action required* vs *Waiting for others* split (Grounded) without inventing
a fourth surface. If product later confirms high approval volume (Gujarat), the chip becomes a
saved view — same data, no new route.

**Counts** (Judgment): the nav item and the home rail carry one number — open *To do* items
(A+B+C+D+E). *Waiting* is not counted in the badge (it is not the person's move); its tab shows
its own count.

## 8. States and edge cases

| State / case | What the person sees | What they can do | Tag |
|---|---|---|---|
| **Empty — no tasks at all** | *To do* is empty: a calm statement, not a warning — "Nothing pending. Every case you can see is waiting on the court or on someone else." with the *Waiting* count if non-zero; 1.0 shows an italic grey "no pending task" line (Grounded) | Open *Waiting*; open Cases | Judgment |
| **All filtered out** | Chips stay visible; "No tasks match — clear a chip" (cases.md §10 pattern; the home board's "No matters match this filter", Grounded) | Clear one / clear all | Grounded → Judgment |
| **Loading** | Chrome (views, chips with last-known counts) first; row skeletons; never a full-page spinner (1.0 shows a bare Loader, Grounded) | — | Judgment |
| **Error** | Inline banner with retry; last successful list stays visible if any (1.0 issue: "No data is shown in Pending Task" for many advocates, Grounded hotfix 19.1) | Retry | Grounded → Judgment |
| **Partial data — no due date** | Cue "No due date"; sorts into the *No date* band, never into Overdue (1.0 sorts no-date last, Grounded) | Act; detail explains "the court did not fix a date" | Grounded |
| **Partial data — no case number yet** | Parties + "Not yet numbered" caption (cases.md D6: never render *Untitled*) | — | Grounded |
| **Partial data — payment amount unknown** | Cue "Amount to be fetched"; verb disabled until fetched (1.0: "Payment details Undefined", "Fetchbill API error" — Grounded) | Retry fetch | Grounded |
| **Completed by someone else while I look** | Row does not vanish silently: it dims with "Done by S. Prakash just now" and drops out on next refresh or when dismissed; if I had it open, the detail says so and disables the verb | Dismiss; open *Done* | Judgment |
| **Expired — deadline passed and the window is closed** | Moves to *Done* with cue "Expired 3 Aug — the court's window closed"; the detail says the consequence and the remedy (condonation, fresh application) as a new task where the domain memo says one exists (1.0 issue: "set default actions at expiry" — Grounded Dristi_kerala#951) | Open the remedy task if any | Grounded → Judgment |
| **Overdue but still doable** | Stays in *To do*, Overdue band; after 45 days drops to *Long pending* (collapsed, counted) | Act; or resolve: "No longer needed" with a reason (records who/why) | Judgment |
| **Obsoleted by a court event** (hearing adjourned so "before hearing 3 Sep" moves; order withdrawn; case disposed) | Due cue recalculates from the new hearing date and the row re-sorts; the detail's history logs "Hearing moved 3 Sep → 17 Sep". Withdrawn order → task moves to *Done* as "No longer required (order withdrawn)". MyCase's rationale for bulk due-date change is exactly the continuance case (Grounded) | Nothing; the change is explained | Judgment |
| **Same task on many cases** (bulk filers: pay process fee on 40 cases) | Individual rows; group-by kind or case makes the pattern visible; multi-select + bulk verb (§9) | Select all in group → Pay / Approve & sign | Judgment |
| **Many tasks on one case** | Group-by case shows the stack; the case peek already lists them (Grounded) | Work down the stack | Grounded |
| **Assignee left the team / lost case access** | Owner avatar becomes "Was: R. Iyer (no longer has access)"; the task is treated as Unassigned and joins that chip's count | Reassign | Judgment |
| **Permission changed midway** (I was added to the vakalatnama) | On next load the verb changes from *Prepare* to the finalising verb; anything I already sent for approval stays with the senior unless I *Take back* | Take back and finalise, or leave it | Judgment |
| **Approval rejected / sent back** | Row returns to my *To do* at the top of its band with "Sent back — 1 note"; note first in the detail | Fix and resend; or reply | Judgment |
| **Payment failed** | Row cue "Payment failed — try again"; the task stays open in *To do*; failure reason and reference id in the detail (1.0: failed payment leaves a stale "payment pending" — Grounded Dristi_kerala#979) | Retry; choose offline | Grounded → Judgment |
| **Payment pending confirmation** | Moves to *Waiting* with "Payment confirming · ref 8271"; if unconfirmed after the gateway's window, returns to *To do* with "Confirm at the counter / retry" | Wait; upload receipt if offline | Judgment |
| **Signature session abandoned** (OTP not completed, DSC unplugged) | Task stays open; cue "Signing not completed"; the prepared document is kept | Resume | Judgment |
| **Concurrent edits** (junior and senior both open a draft) | Last save shows "S. Prakash saved a newer version 2 min ago — reload"; no silent overwrite | Reload; compare | Judgment |
| **Offline** | Read-only cached list with a "Last updated 10:42" banner; verbs disabled with a reason; nothing queued for later (payments and signatures must not be optimistic) | Read; plan | Judgment |
| **Task on a case I can see but cannot act on** (view-only) | Row present with cue "View only — not on your access"; no verb | Open case; ask for access | Judgment |

## 9. Bulk and throughput

Grounded facts: 1.0 gives judges a "Bulk sign N pending orders" button on their home (Grounded:
`TaskComponent.js`); MyCase bulk actions are *mark completed, change due date, reassign*
(Grounded); Linear/JSM/Superhuman rely on keyboard triage for volume (Grounded). Product
foundation: Gujarat "stress-tests bulk"; Kerala validates the individual flow (Grounded).

Recommendation (Judgment):

- **v1**: multi-select (checkbox reveals on hover/focus; header "select all in group");
  bulk **Reassign**; bulk **Approve & sign** for the senior (the approval queue is where volume
  first shows, and one e-sign session across N documents is the 1.0 precedent); bulk **Mark
  done** only for manually completable kinds. Keyboard: arrow/j-k to move, Enter to open, Space
  to select, the verb's letter to act — cheap and it is how every queue tool earns speed.
- **v2**: bulk **Pay** (needs the gateway to support one payment for many demands and a
  per-case receipt split); saved views; "new since last visit" markers.
- **When it hurts**: at Kerala scale, always-visible checkboxes and a bulk bar are chrome for
  a job nobody has; keep selection revealed-on-hover and the bulk bar absent until a selection
  exists (the "chrome never vanishes, but earns its place" stance from ui-craft §0–1).

## 10. Mobile (a 375-wide phone)

The home rail on a phone "takes the viewport and the strip stands down" (Grounded:
`pending-tasks-rail.tsx`). The All pending tasks view is therefore **the** phone surface for
tasks; the rail is a shortcut to it.

- **Survives**: the three views as tabs; urgency grouping with sticky headers; avatar chips and
  the three state chips in a horizontally scrolling row; search behind an icon; the sort/group
  control behind one menu; the deep-filter sheet (already a sheet).
- **Row at 375**: two lines — title; case · due cue · owner. Blocking and status cues wrap to
  a third line only when present. Actions always visible (coarse pointer): the verb only;
  *Mark done* and selection move into the detail.
- **Detail**: full-height sheet (the peek's phone fallback, Grounded).
- **Act flows allowed on a phone** (Judgment): **Pay — yes** (UPI-native; process fees are
  small; the offline receipt upload uses the camera). **e-Sign with Aadhaar OTP — yes** (the
  e-filing sign step already does OTP; the OTP arrives on the same phone). **DSC — no** (needs
  a token/desktop; the row says "Sign on a computer with your DSC"). **Upload documents —
  yes** (camera). **Fix defects / draft an application — allowed but steered**: the flow works,
  the entry point says "easier on a larger screen".
- **Bulk**: not on a phone in v1.

## 11. Consistency with the home rail and the Cases screen

- **The rail links to this view with the default lens** — *To do*, urgency grouping, no chips —
  and "View all N tasks" must show the same N as *To do* for the same population. The rail's
  header today reads "Overdue or due soon" (Grounded); it should show the first rows of the
  *same query and comparator*, cut at the band boundary rather than at a fixed count if
  possible.
- **Ordering must be identical** — argued: the rail is a preview of this list; if the first
  five rows are in a different order from the view's first five, the person learns two
  urgencies and trusts neither. The rail's current seed order (pure days-overdue) places a
  non-blocking 20-day-overdue task above a blocking 4-day one; adopting the §3 comparator in
  both makes "blocking first within a band" true everywhere (Grounded on the seed; Judgment on
  the fix).
- **The rail's row is the view's row at rest**: title, due cue, case, blocking cue, owner
  avatar; hover/focus-revealed verb + gated *Mark done* (Grounded row anatomy; Judgment on the
  gate).
- **Deliberate departures from `cases.md`** (each argued in place): a **grouped list, not a
  table** — bands and per-group counts carry more than columns do, and rows need a verb and a
  status cue that a table would flatten; **no page-of-25 pagination** — bands must not be cut
  by page edges; load more within a group at volume (Cases pages a flat list, D5); **chips
  carry state** (*Awaiting my approval*, *Unassigned*, *Blocking*) not just lenses, because
  state *is* the lens here; **a detail panel** — Cases rows are links to the case, tasks need
  their why/what/who before acting; **person chips** are reused from the home board rather
  than a field inside the filter sheet. Everything else — views over rival tabs (D1), no always-open filter card
  and type-to-filter search (D2), sheet filters echoed as chips (D3), URL state (D4), no case
  type control (D6), plain-text stage (D7) — is adopted as is.

## 12. Recommendations (ranked)

1. **v1 lens set** — Views: *To do* (default) · *Waiting* · *Done*. Chips: team avatars (as on
   the home board) · *Blocking a hearing (n)* · *Awaiting my approval (n)* · *Unassigned (n)*.
   Find row: type-to-filter search · Sort (Urgency · Due date · Case · Recently added) ·
   Group (Urgency band · Case · Kind · Person) · Filters sheet (kind, court, stage, due range,
   created range, show expired/obsolete). URL holds all of it.
2. **Default sort / group** — urgency bands as sticky groups (Overdue → Due today → Before next
   hearing / this week → Later → No date → Long pending collapsed); within a band blocking →
   earliest consequence date → case → oldest created → id. Same comparator in the rail.
3. **Row anatomy** — verb+object · case · due cue in words · blocking cue · owner avatar ·
   one status/permission cue; verb + gated *Mark done* revealed on hover/focus, always on
   touch; selection checkbox on hover/focus.
4. **Detail model** — push panel on desktop, full-height sheet on phone, every task has a
   URL; act flows (pay, sign, submit, fix defects) are pages that return to the row.
5. **Action model** — verb per family; finalise vs prepare decided by vakalatnama; *Send for
   approval* is the non-signatory's terminal step; senior's *Approve & sign / Send back with
   note / Take over*; confirmations only before irreversible external steps; receipts in the
   task and the case; *Mark done* only for system-unobservable kinds.
6. **Drafts / approvals** — no new route: senior's approvals are *To do* rows + a chip; junior's
   handed-off items are a group in *Waiting*; sent-back items return to the top of their band
   with the note; drafts not yet sent stay in *To do* with *Continue*.
7. **Deferred to v2** — bulk pay; nudge/remind on sent-for-approval; saved views; "new since
   last visit" markers; kind as chips; snooze/set-aside (only if product wants it, §13 Q6);
   phone bulk.

## 13. Open questions for product (only those that reshape the view)

1. **Is paying a finalising action for a clerk/junior?** The ask says payment needs the
   vakalatnama; if a member may pay with the senior's standing consent (an office wallet, or
   *Specific cases* access as in 1.0), the *Waiting* population shrinks and bulk pay moves up.
2. **Default population**: everything on cases I can see (recommended) or mine only? And does
   a member with *Specific cases* access see tasks only on those cases (1.0 model)?
3. **Assignment**: is "assignee" a real field in 2.0, who may assign/reassign, and are
   role-addressed (unassigned) tasks the norm as in 1.0?
4. **Two seniors on one vakalatnama**: does either approve, or a named one? (Decides whether
   *Awaiting my approval* can double-count.)
5. **Long-pending threshold and expiry semantics**: keep 1.0's 45 days? What may a person do
   with a stale task — resolve "no longer needed", escalate, nothing?
6. **Personal priority / snooze**: wanted at all? (Recommended: not in v1.)

## 14. Sources

**In-repo (Grounded)**

- `docs/design/research/pending-tasks-ask.md` — the verbatim ask; permission model; "small
  section … draft stage".
- `CLAUDE.md`, `docs/product/README.md`, `docs/product/product-foundation.md` (Kerala vs
  Gujarat scale, court cast), `docs/product/domain/journey.md` (stages/clocks),
  `docs/product/open-questions.md` (no invented personas), `docs/product/standards/adherence.md`
  (WCAG/DPDP bar).
- `feature/advocate-home-screen-v3` — `components/home/data.ts` (Task/CaseTask/Blocker
  shapes; team of 5; owner/blocks/overdue/days/action; 17 total tasks),
  `pending-tasks-rail.tsx` (rail row anatomy; "Overdue or due soon"; dead "View all N tasks";
  strip/panel; phone takes viewport; arrive-focus-not-select), `task-row.tsx` (DueCue,
  hover + focus-within reveal, coarse-pointer fallback, Mark done on every row),
  `advocate-home.tsx` and `court-board.tsx` (nav rail · board · case peek · tasks rail;
  advocate avatar chips; empty-filter state), `case-detail-panel.tsx` (push panel from the desktop breakpoint,
  overlay-sheet fallback below it; case's pending tasks list).
- `feature/e-filing-new` — `components/filing/sections/sign-section.tsx` and
  `app/filings/[draftId]/sign/page.tsx` (signatories with Signed/Pending, "N of M signed",
  e-Sign with Aadhaar OTP / upload signed copy / copy link; sign as its own page).
- `docs/design/proposals/cases.md` — D1–D10, §10 states, confirmed nav (Home · Your cases ·
  Filings · Join a case · Pending tasks · Calendar · Team case access).
- `.claude/skills/ui-craft/SKILL.md` §0–§1 — reference is the spec; hover + focus-within
  reveal with touch fallback; one status cue at rest; persistent surfaces collapse, never
  vanish.

**DRISTI 1.0 (Grounded)**

- `pucardotorg/dristi-solutions` (branch `develop`):
  `frontend/.../modules/home/src/components/TaskComponent.js` (search criteria: `isCompleted`,
  `assignedTo`/`assignedRole`, `screenType`, office member fetch via
  `officeAdvocateUuid`+`officeMemberUuid`; Case type + Task type dropdowns; due wording "Due in
  N Days / Overdue by N Days / Due today / No Due Date"; judges' "Bulk sign N pending orders");
  `home/src/utils/index.js` (`getPendingTaskSections`: citizens get *Due this week* /
  *Upcoming* / *Long pending* with `LONG_PENDING_DAY_LIMIT = 45`, "so that long forgotten tasks
  stop crowding the actionable ones"); `home/src/components/PendingTaskAccordion.js` (card:
  `{action} : {case title}` / `NIA S138 – filing no – due`; sort ascending by `stateSla`,
  no-date last; "View all pending tasks" modal table Task / Due date);
  `home/src/configs/PendingTaskConfig.js` (judge table: date, stage, case search);
  `home/src/configs/HomeConfig.js` (task types; action names);
  `dristi/src/pages/citizen/Home/ManageOffice.js` (Clerk / Assistant advocate; All cases /
  Specific cases; "Advocates working for"); `home/src/pages/employee/SelectAdvocateModal.js`
  ("Do you want to file on behalf of … Select advocate").
- `pucardotorg/dristi` `backend/analytics/.../PendingTask.java`, `PendingTaskType.java`
  (fields `assignedTo`, `assignedRole`, `stateSla`, `businessServiceSla`, `isCompleted`,
  `entityType`, `referenceId`; type has `triggerAction`, `closerAction`, `actor`).
- Issues: https://github.com/pucardotorg/dristi/issues/5956 (archive >45-day tasks),
  https://github.com/pucardotorg/dristi/issues/2067 (prioritise by prescriber, kind, date),
  https://github.com/pucardotorg/dristi/issues/1309 (hide single-value case-type filter),
  https://github.com/pucardotorg/dristi/issues/3270 (screenType classification),
  https://github.com/pucardotorg/Dristi_kerala/issues/951 (default actions at expiry),
  https://github.com/pucardotorg/Dristi_kerala/issues/979 (stale payment-pending after failure).
- Release/hotfix notes: https://pucar.gitbook.io/dristi/dristi-platform/release-notes/release-1.6.0
  ("Pay Vakalatnama Fees" task on incomplete Join-a-case payment),
  https://pucar.gitbook.io/dristi/dristi-platform/hotfixes/hotfix-release-19.1 ("No data is
  shown in Pending Task", "Payment details Undefined in Pending Task", payment not reflecting).

**eCourts / e-filing (Grounded)**

- eFiling Services 3.0 User Manual (PDF):
  https://cdnbbsr.s3waas.gov.in/s3ec045421e013565f7f1afa0cfe8ad87a/uploads/2025/02/2025020655.pdf
  — dashboard tiles *Draft Pleadings · Completed Pleadings · Draft IAs · Completed IAs ·
  Objections · My Cases*; *Authorize Signatories* (advocates/clients named as signatories, each
  e-signs from own login via C-DAC Aadhaar OTP, or OTP-verifies); *My Partners / Associates /
  Colleagues*; "Only draft cases can be edited".
- Search summary of the eFiling admin manual (defective tile; pending acceptance / not
  accepted / deficit court fee / pending scrutiny statuses):
  https://efiling.ecourts.gov.in/adminHelp/ (fetched via search excerpt; direct fetch refused).

**Queue / inbox / task patterns (Grounded)**

- Linear — My issues: https://linear.app/docs/my-issues ("curated priority order": urgent,
  SLA-bound, blockers, cycle, other, triage, backlog; tabs Assigned / Created / Subscribed /
  Activity); Display options: https://linear.app/docs/display-options (grouping vs filtering;
  per-user persistence).
- Things — When vs Deadline; Today / Upcoming / Anytime / Someday:
  https://culturedcode.com/things/support/articles/2803579/
- Todoist — dates vs deadlines: https://www.todoist.com/help/articles/introduction-to-deadlines-in-todoist ;
  Today view, Overdue + "Reschedule" all: https://www.todoist.com/help/articles/plan-your-day-with-the-today-view-UVUXaiSs
- Asana — My tasks: *Recently assigned* as the undeletable inbox; auto-promotion replaced by
  rules: https://asana.com/inside-asana/customize-my-tasks ,
  https://help.asana.com/s/article/rules-in-my-tasks
- Superhuman — Split inbox ("choose a workstream and process those messages together"):
  https://blog.superhuman.com/how-to-split-your-inbox-in-superhuman/ ,
  https://help.superhuman.com/hc/en-us/articles/38458392810643-Default-Split-Inbox
- HEY — Reply later / Set aside / Imbox–Feed–Paper trail: https://www.hey.com/how-it-works/ ,
  https://www.hey.com/features/reply-later/
- Jira Service Management — queues, "Assigned to me" / unassigned, SLA-sorted with time to
  breach: https://support.atlassian.com/jira-service-management-cloud/docs/what-are-queues/ ,
  https://community.atlassian.com/learning/lesson/set-up-requests-and-queues
- Clio Manage — task filters (assigner, assignee, status *pending / in progress / in review*,
  priority, type, visibility): https://help.clio.com/hc/en-us/articles/9204917906971-Manage-Tasks-in-Clio-Manage ,
  https://help.clio.com/hc/en-us/articles/9204982812699-Filter-and-Export-Tasks (search
  excerpts; direct fetch refused).
- MyCase — Tasks overview; bulk *mark completed / change due date / reassign* ("a judge grants a
  continuation…"): https://supportcenter.mycase.com/en/articles/9370074-tasks-overview ;
  priority Low/Medium/High, overdue on due date: https://supportcenter.mycase.com/en/articles/9370073-creating-a-new-task
- DocuSign — Manage quick views *Action Required / Waiting for Others / Expiring Soon /
  Completed*: https://support.docusign.com/s/document-item?bundleId=oeq1643226594604&topicId=wdm1578456348227.html&_LANG=enus&language=en_US ;
  status codes: https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/envelopes/status-codes/
- Maker-checker — no self-approval, pending until checker acts, audit trail:
  https://community.nasscom.in/communities/application/maker-checker-implementation-guide-secure-fintech-systems ,
  https://www.opcito.com/blogs/maker-checker-implementation-guide-for-secure-fintech-systems
- NN/g — batch vs interactive filtering: https://www.nngroup.com/articles/applying-filters/
- WCAG 2.1 SC 1.4.13 Content on hover or focus:
  https://dequeuniversity.com/resources/wcag2.1/1.4.13-content-on-hover-or-focus

**Not reachable / not relied on**: PracticePanther, CaseFox, Vakilsearch/LegalKart task modules
(no primary documentation found worth citing); Clio pages returned 403 (search excerpts used
only for the filter list). No usage statistics were found for DRISTI 1.0's task panel; every
volume figure above is from `product-foundation.md` or labelled an estimate.
