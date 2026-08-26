# Pending tasks

Status: building (v2.2 — cards inside the tab, modal policy, 1.0 grounding)
Updated: 2026-08-20
Source: docs/design/research/pending-tasks-ask.md (the owner's words, 18 Aug + 19 Aug) ·
docs/design/research/pending-tasks-ux.md (research memo) · docs/product/product-foundation.md ·
docs/product/domain/journey.md · docs/product/open-questions.md · docs/design/proposals/cases.md
DS read: `vendor/pucar-design-system` (origin verified `neer-ideasbeforenoon/pucar-design-system`) —
`AGENTS.md`, `ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` / `spacing` /
`colors` / `elevation`; `table`, `tabs`, `card`, `select`, `sheet`, `empty`, `timeline`,
`description-list`, `input-otp`, `alert-dialog`, `banner`, `avatar` source.

Written by the orchestrating session, not the `ux-designer` subagent (the owner asked to build
rather than research further). v1 (18 Aug) shipped a lens-heavy list; the owner rejected it on
19 Aug: "all the information is clapped together instead of proper columns … filters don't have
proper labels … UX copy all over the place … a global filter for To do as well as Blocking a
hearing … think like a UX designer, from first principles … a command centre". v2 below is that
rethink, confirmed by the owner before building.

---

## 1. Context

**Confirmed with product (the owner):**

- 18 Aug: users are advocates and their offices; a pending task is something pending in a case
  that must be done to move it forward (signature, payment for a process, document to submit);
  the home rail lists them by urgency; permission is decided by the vakalatnama.
- 19 Aug: **no assignment** — show the case's main advocate and everyone on the case; the
  team-access concept is being removed (the home screen will follow). Permission is **file-share
  style**: on the vakalatnama → can complete (a filing, a signature, a payment); not on it → can
  do the work and leave it pending (start an application and leave it in draft; start a filing
  and leave it in draft). **Court-initiated** tasks (plea, deposition, …) and **scrutiny
  returns** (sent back with errors to correct and re-file) are pending tasks too. Wants **cards**
  for an at-a-glance overview so decision makers act fast without being overwhelmed — "a
  command centre to manage all the pending tasks".

**Neighbours.** Nav: Home · Cases · Hearings · **Tasks** · Office. Cases owns "find a matter";
the bell owns events; the calendar owns dates. This branch is cut from `main` (no home screen), so
the feature ships its own app shell (`components/shell/`, ported from e-filing) — unify at merge.

**In scope:** the command-centre view (overview cards · labelled filters · state tabs · table),
the task detail panel, the complete flows (pay · sign · file/submit · fix returned), drafts left
by anyone on the case, court-initiated hearing tasks, all states, a sandbox data layer with
backend seams, and the sandbox identity switcher so the permission model can be seen.
**Out:** the home rail (other branch), notifications, calendar, real eSign/payment/registry
integrations (labelled sandbox), bulk pay, assignment/reassignment (removed), approval routing
(removed — see D8).

## 2. Problem (v1, as the owner saw it)

1. Rows carried title · case · court · due · blocking cue · owner · status in one lump — no
   columns, so nothing could be scanned down.
2. Five control families (tabs · avatar/blocking/approval/unassigned chips · sort · group ·
   filters sheet) with unlabelled chips; *To do* (a state) and *Blocking a hearing* (a property)
   sat side by side as if they were the same kind of thing.
3. Copy drifted between row cues, panel lines and pages.
4. Assignment, approval routing and team-access modelled an office that product has now removed.
5. Nothing gave an overview — how much of which kind of work is waiting — so the screen could not
   be triaged in batches.

## 3. Objective

- In two seconds: how much of which kind of work is waiting, and what is overdue.
- In one click: the table narrowed to one kind, sorted by urgency, ready to act row by row.
- Every cell is one fact in one column; every status is one phrase from a fixed vocabulary.
- Anyone on the case can see and prepare; only a vakalatnama signatory can complete.

## 4. Job

**Job (product, owner's words):** a command centre to manage all the pending tasks — "help the
decision makers quickly take action, not overwhelm them". The tasks are "the things pending in a
case that need to be done to move the case forward".

## 5. Decisions

**D1 · Kinds of action are the primary lens — as cards, and the cards are the filter.** Six
cards: **To sign · To pay · To file · Returned by scrutiny · For a hearing · Drafts.** Each shows
count, overdue count and next due date; clicking one filters the table (one at a time; click
again to clear). Replaces every chip from v1. **v2.2: the cards live inside the tab** (header →
tabs → cards → filters → table): the tab is the population, the cards are its breakdown — which
is what their per-tab counts always said. The kind filter stays sticky across tabs. *Why kinds:* a decision maker clears work in
batches by the action it takes (all signatures, then all payments); it is also how the registry
and the court address the advocate. Judgment; owner asked for cards.

**D2 · Four ability-based tabs — Needs action · Waiting on others · Completed · Archived**
(v2.1). Tabs answer "can *I* move this?", per viewer: *Needs action* = the viewer has an acting
verb (a signatory's sign/pay/file, anyone's continue-draft or mark-done). *Waiting on others* =
open but not this viewer's move — with the court, payment confirming, or it needs a vakalat
holder and the viewer is not one (a junior sees those as view-only). *Completed* = done, expired,
obsolete. *Archived* = archived by someone on the case. The owner: the earlier Open/Waiting split
"needs more clarity on what that ability and that filtering means".

**D3 · A real table with fixed columns.** Task · Case · Due · Advocates · action — the Status
column was cut in v2.1 as redundant with the CTA (owner). In *Waiting on others* the slot becomes
**Waiting on** ("R. Manoj — signature" / "The court — scrutiny" / "Payment confirming"); in
Completed/Archived it carries the outcome. Row CTAs share one fixed width (owner: untidy
otherwise); view-only rows get a quiet ghost *View*, never a disabled verb. Every row has a
selection checkbox (see D10). Sortable by Due (default, urgency) and Case; stacked labelled rows
below `md`.

**D4 · Labelled filter row; search lives in the top bar** (v2.1). Filter row: *Due* (Any time ·
Overdue · Today · This week · Before next hearing) · *Court* · *Advocate on the case*. A pressed
kind-card echoes as a removable pill leading this row — the owner wanted "very clear signalling"
that a card filter is applied. Search moved to the shell top bar and is global: it searches
across all tabs and the tab counts follow the query. State in the URL.

**D5 · Urgency = sort order + the Due cell, not a chrome layer.** Comparator (kept from v1):
overdue first, then the upcoming date that will hurt (a hearing the task is tied to while it is
ahead, else the deadline), then earliest deadline, case, oldest. Overdue reads as
`text-destructive-ink` words in the Due cell ("3 days overdue"); one red mark per row at most,
and the **To sign / To pay /…** cards carry "n overdue" as plain text.

**D6 · People = the case's advocates, not assignees.** Column *Advocates*: avatar stack, main
advocate (first on the vakalatnama) first, then the others on the case; tooltip names. No
assign/reassign anywhere. Who a task needs lives in *Waiting on* (for viewers who cannot act)
and in the Task second line on ready items ("Prepared by S. Prakash"); vakalat holders are
marked in the panel. A junior not on the vakalat can watch a task move and nudge the senior —
view is a real, passive relationship (owner).

**D7 · Court-initiated and scrutiny-initiated tasks are first-class kinds.** From the §138 spine
(`journey.md`): at cognizance the complainant's sworn statement/affidavit; at issue of process the
process fee and copies/addresses for summons; unserved summons → fresh steps; at appearance the
**plea** (be present with the complainant; accused side: bail/surety); at evidence the
**deposition** (file the chief affidavit before; produce the witness for cross-examination);
written arguments; after judgment certified copy / appeal within limitation. These land in *For a
hearing* (anchored to the hearing date) or *To pay / To file*. Scrutiny returns (complaint or
application "returned for compliance" with defects) land in *Returned by scrutiny* → fix and
re-file.

**D8 · Permission is file-share, completion is the signatory's.** `canView` = on the case;
`canComplete` = on the vakalatnama. A non-signatory may start, edit and save any task's work
(draft); when the work is complete it is **ready** ("Needs signature · R. Manoj" / "Needs payment
· R. Manoj"); a signatory opens it, reviews what was prepared (by whom, note, files) and
completes it. **No approve / send-back ceremony** (v1's routing is removed — the owner's 19 Aug
model is plain file-sharing). A signatory may also complete an item someone else left in draft.

**D9 · Drafts are tasks.** A filing or application started and left in draft by anyone on the
case appears in *Open* under *Drafts* ("Continue the draft complaint — Sreekumar v. Vismaya").

**D10 · Any task can be marked done by hand; anything can be archived** (v2.1). The owner:
actions may be completed physically outside the system, so manual *Mark as done* is available on
every task (with a confirm noting it was completed outside DRISTI; `completion.how = "manual"`).
Pay / sign / file / fix still close themselves on the event. Every row's checkbox enables the
selection bar: *Mark as done* · *Archive*; archived tasks live in the Archived tab and can be
unarchived (they return to their prior status).

**D11 · Overdue ≠ expired ≠ obsolete; adjournment re-dates.** Unchanged from v1.

**D12 · Sandbox, labelled.** Repository seam + IndexedDB, seed relative to today, identity switcher
and reset in the account menu, sandbox outcome controls on the pay/sign/file pages. Unchanged.

**D13 · Copy vocabulary (fixed).** Titles verb-first ("Pay the process fee for the summons",
"File the proof affidavit of the complainant", "Be present for the plea", "Produce PW-1 for
cross-examination", "Fix 2 defects and re-file the complaint", "Continue the draft application").
Status phrases: *Needs signature · {name}* · *Needs payment · {name}* · *Draft · {name}* ·
*Returned · {n} defects* · *With the court* · *Payment confirming* · *Done {date}* · *Expired —
{why}* · *No longer needed — {why}* · *Archived {date}*. Due format (v2.1, one rule everywhere):
primary line relative to today — *{n} days overdue* · *Due today* · *Due in {n} days* · *Before
hearing in {n} days* · *No date* — with the absolute date as a caption under it. The page header
carries today's date (the owner: "overdue from when… is missing"), replacing the big *Pending
tasks* title, which was redundant with the nav.

**D14 · Only payments and file uploads act in a modal** (v2.2; owner: "apart from uploading
files and making payments, nothing should be done in the modal"). Pay and File act in place and
close back to the updated row. Sign, Re-file and Continue (drafts) are real workflows: their CTA
shows a one-sentence notice ("Continuing in the signing / scrutiny / filing flow") and navigates
to a full page — interim sandbox pages until those flows are designed.

**D15 · The detail panel is context-to-act, nothing more** (v2.1). Title · case line · one
why-plus-what block · amount · due · advocates (vakalat holders marked; one quiet sentence when
the viewer can only watch) · prepared-by when ready · history collapsed behind a disclosure ·
one primary CTA. The separate "Who can act" block and duplicated status lines were cut as
redundant (owner).

## 6. What I cut (and why)

- v1's chips (avatars · Blocking · Awaiting my approval · Unassigned), group-by, filters sheet
  and echo chips — replaced by cards + a labelled row (P2).
- Band headers — the sort and the Due cell carry urgency; headers stole the first screen.
- Assignment / reassignment / unassigned / bulk reassign — product removed the concept.
- Approve & sign / send back with note / withdraw / take over — replaced by drafts + "ready"
  (D8). The audit trail (history) stays.
- Kind as a sheet filter — it is the cards now.
- Bulk actions in v1 form — v2 ships multi-select only for *Mark done* on hearing tasks; bulk sign
  and bulk pay wait for product (v2 of v2).

## 7. Layout & hierarchy

Inside the shell, single column, `max-w` wide (table needs width):

1. **Header** — `Pending tasks` (`text-title font-semibold`) + summary "32 open · 5 waiting ·
   7 overdue".
2. **Cards row** — six `Card`s (lifted: `PANEL_CLASS`), `grid` 6 across from `xl`, 3×2 from `md`,
   2×3 below; each: eyebrow kind (`text-caption font-semibold text-muted-foreground`), count
   (`text-title font-semibold tabular-nums`), caption "2 overdue · next 21 Aug"
   (`text-caption text-muted-foreground`; "2 overdue" in `text-destructive-ink` when > 0).
   Selected card: `aria-pressed`, `bg-accent-strong`-free — use a `ring-2 ring-brand-accent` +
   `bg-brand-muted` eyebrow, one quiet cue.
3. **Tabs** — `TabsList variant="line"`: Open · Waiting on others · Completed, muted tabular counts,
   underline on the band rule.
4. **Filter row** — labelled `Select`s (Due · Court · Advocate) + search `InputGroup`, each with a
   visible `Label` above on phone, inline (`Label` + control) from `md`. "Clear filters" link
   when any is set.
5. **Table** — one lifted panel; `Table` from `md`: Task (title 500; second line only when a
   task carries a note, e.g. "Returned · 2 defects" stays in Status not here) · Case (parties
   400; ST no. `font-mono text-caption text-muted-foreground` · court) · Due (`tabular-nums`;
   ink when overdue) · Advocates (avatar stack, `-space-x-2`, main first) · Status (one phrase)
   · action (`Button outline size="xs"` with 40 px pseudo-target; always visible in the
   table — a command centre acts from the row). Rows `divide-y divide-hairline`; header row
   `bg-surface-sunken text-caption font-semibold`. Row click opens the panel; the verb acts.
   Below `md`: stacked rows with labelled facts.
6. **Detail panel** (push ≥ `lg`, Sheet below) — title · case facts · why (creating event) ·
   what to do · prepared-by block (who, when, note, files) when ready/draft · deadline + provenance
   · advocates on the case · history · one primary verb.
7. **Act pages** — pay · sign · file (submit) · fix returned — as v1, with the approval ceremony
   removed: signatory completes; non-signatory's terminal step is **Save as ready** (or **Save
   draft**).

One `bg-primary` per view: none in the table rows (outline), the panel's primary verb, one per
act page.

## 8. Components (DS name → region)

| Region | Component |
|---|---|
| Shell | `Sidebar` · `Breadcrumb` · `DropdownMenu` (account, identity switcher) |
| Cards | `Card` + `PANEL_CLASS`, as `button`s with `aria-pressed` |
| Tabs | `Tabs` + `TabsList variant="line"` |
| Filters | `Label` + `Select` ×3 · `InputGroup` + `Input` |
| Table | `Table` · `Avatar` (stack) · `Tooltip` · `Button` xs · `Checkbox` (hearing tasks only) |
| Phone rows | `Item` / stacked `dl` |
| Detail | docked panel / `Sheet` · `DescriptionList` · `Timeline` · `Button` |
| Act pages | `Card` panels · `AlertDialog` · `InputOTP` · `Textarea` · `Alert` (quiet sandbox notice) |
| Feedback | `sonner` · `Banner` · `Skeleton` · `Empty` |

## 9. Spacing

Ladder only. Page `p-6 md:p-8`; regions `gap-6`; cards grid `gap-3`, card `p-4`; filter row
`gap-3`; table cells `px-4 py-3`; controls `h-10 rounded-lg`; containers `rounded-xl`.

## 10. States

| State | Treatment |
|---|---|
| Loading | skeleton cards + rows; chrome intact |
| Nothing open | cards all 0; `Empty`: "Nothing pending. Every case you are on is up to date." |
| Filters exclude all | `Empty` + Clear filters; controls keep their values |
| Load error / offline | `Banner` (+ retry / read-only with verbs disabled + tooltip) |
| No due date | "No date"; sorts last |
| Ready for a signatory (viewer is not one) | Status "Needs signature · R. Manoj"; verb *Open* |
| Ready for a signatory (viewer is one) | Status "Needs signature · you"; verb *Sign* |
| Draft by someone else | Status "Draft · S. Prakash"; verb *Continue* (anyone on the case) |
| Returned by scrutiny | card + Status "Returned · 2 defects"; verb *Fix & re-file* |
| Payment failed / confirming | Open with "Payment failed — try again" / Waiting "Payment confirming" |
| Expired / obsolete / re-dated | Completed with the reason / Completed / Due cell "moved from 20 Aug" |
| Long labels / Malayalam | cells wrap; no silent truncation |
| Phone | cards 2-col, filters stacked with labels, stacked rows, Sheet detail |

## 11. Risks accepted

1. Six cards may be one too many on a 1280 laptop (3×2 grid) — acceptable; product may merge
   *Drafts* into *To file*.
2. Removing approval routing loses the explicit "send back with note"; a signatory who disagrees
   edits the draft or leaves a note in history.
3. Court-initiated task wording is from the national spine, not Kerala rules of practice —
   verify names with the registry before shipping copy.
4. Two shells exist on branches — unify at merge.

## 12. Open questions for product

1. Card set: keep *Drafts* separate from *To file*? Merge *Returned by scrutiny* into *To file*?
2. Which court-initiated events should create tasks automatically vs appear only as hearings?
3. Exact Kerala registry wording for "returned for compliance" and the cure window.
4. Accused-side tasks (bail/surety, §313 statement, interim compensation §143A) — in scope for
   this product, or complainant-side only?
5. Nav label: *Tasks* (mockup) vs *Pending tasks* (cases brief).

## 13. Gaps in the DS

- Raised `Card` variant (`border-hairline shadow-raised`) still per-use (`PANEL_CLASS`).
- No selectable stat-card pattern; composed from `Card` as a `button` with `aria-pressed`.
- No avatar-stack primitive; composed from `Avatar` with negative space.
- No docked/push panel primitive; composed as in the home peek.

**D16 · The model declares its lifecycle, grounded in 1.0** (v2.2). `closesWhen` states each
task's closure rule in words — including auto-closure ("Closes on payment, or when the hearing
passes"; "Closes when the court decides the application") — shown in the panel; `visibility`
("case" default / "actors") covers the attributes doc's audiences, with courtroom staff out of
scope for this advocate-side app. Seeds take the 1.0 inventory's numbers: 3-day cure window on
scrutiny returns, 0–1-day payment SLAs, the vakalatnama-fee task and its dedup closure, response
tasks that die with their application. Overdue stays derived from the date — 1.0 stored it as a
status, which can go stale; ours cannot.

## 14. Decision log

| Date | Change | Confirmed by |
|---|---|---|
| 2026-08-18 | Ask recorded verbatim; users = advocates + teams; permission by vakalatnama | Product (owner) |
| 2026-08-18 | UX research memo; domain memo agent died; owner: stop researching, build | Product (owner) |
| 2026-08-18 | v1 built (lens-heavy list), reviewed, fixed, committed `11f6c3d` | Session |
| 2026-08-19 | Owner rejects v1: no columns, unlabelled filters, copy drift, overlapping lenses; no assignment; team access removed; file-share permissions; court-initiated + scrutiny-return tasks; wants cards / command centre | Product (owner) |
| 2026-08-19 | v2 proposed (D1–D13) and confirmed: 6 kind-cards as the filter, real table, labelled filter row, 3 state tabs, advocates-on-case column, drafts + ready instead of approval routing | Product (owner) |
| 2026-08-19 | v2 built and committed (`042419a`); "blocking and coming up first" tier restored in the comparator | Session |
| 2026-08-20 | Owner's correction round on the render: card filter must echo as a pill; search out of the filter row (top bar); panel too redundant — context to act only; pay/sign/file in modals, fix & drafts hand off to the (undesigned) scrutiny/filing flows via a dialog; checkbox on every row with Mark as done + Archive (+ Archived tab); card eyebrows at 12px are a violation; CTAs one width; due format consistent with today's date visible; view-only nuance for juniors; tabs renamed by ability; Status column and the page title dropped as redundant | Product (owner) |
| 2026-08-20 | v2.1 decisions D2–D4, D6, D10, D13–D15 updated/added accordingly | Session |
| 2026-08-20 | v2.1 built, verified on the render, committed `db9a513` | Session |
| 2026-08-20 | Owner: cards should be a local filter inside the tabs; only uploads + payments in a modal, everything else redirects with a notice; supplied the WIP attributes doc and the 1.0 "Pending Task Expiry" inventory as grounding — minor aligned changes pre-approved | Product (owner) |
| 2026-08-20 | v2.2: D1 (cards inside the tab), D14 (modal policy), D16 (closesWhen + visibility + 1.0-grounded seeds) | Session |
