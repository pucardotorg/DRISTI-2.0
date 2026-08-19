# Pending tasks

Status: building (v2 — command-centre redesign)
Updated: 2026-08-19
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
again to clear). Replaces every chip from v1. *Why kinds:* a decision maker clears work in
batches by the action it takes (all signatures, then all payments); it is also how the registry
and the court address the advocate. Judgment; owner asked for cards.

**D2 · Three state tabs — Open · Waiting on others · Completed.** *Open* = anything someone on
the case can act on now (incl. drafts and items ready for a signatory). *Waiting on others* =
with the court (filed, awaiting scrutiny/orders), payment confirming. *Completed* = done,
expired, obsolete (where expiry is explained). The owner's "To do" tab was fine; the chips beside
it were not.

**D3 · A real table with fixed columns.** Task · Case · Due · Advocates · Status · action.
Sortable by Due (default, urgency), Case, Kind; no band headers, no group-by. Below `md` the same
columns render as labelled stacked rows.

**D4 · Labelled filter row, nothing hidden in a sheet.** *Due* (Any time · Overdue · Today · This
week · Before next hearing) · *Court* · *Advocate on the case* · search "Find a case or task".
Applied filters are visible in their own controls — no echo chips. State in the URL.

**D5 · Urgency = sort order + the Due cell, not a chrome layer.** Comparator (kept from v1):
overdue first, then the upcoming date that will hurt (a hearing the task is tied to while it is
ahead, else the deadline), then earliest deadline, case, oldest. Overdue reads as
`text-destructive-ink` words in the Due cell ("3 days overdue"); one red mark per row at most,
and the **To sign / To pay /…** cards carry "n overdue" as plain text.

**D6 · People = the case's advocates, not assignees.** Column *Advocates*: avatar stack, main
advocate (first on the vakalatnama) first, then the others on the case; tooltip names. No
assign/reassign anywhere. *Status* says who a task needs ("Needs signature · R. Manoj") or who
left a draft ("Draft · S. Prakash").

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

**D10 · Mark done only for what the system cannot observe** (be present at the plea,
produce a witness); pay / sign / file / fix close on the event. Unchanged from v1.

**D11 · Overdue ≠ expired ≠ obsolete; adjournment re-dates.** Unchanged from v1.

**D12 · Sandbox, labelled.** Repository seam + IndexedDB, seed relative to today, identity switcher
and reset in the account menu, sandbox outcome controls on the pay/sign/file pages. Unchanged.

**D13 · Copy vocabulary (fixed).** Titles verb-first ("Pay the process fee for the summons",
"File the proof affidavit of the complainant", "Be present for the plea", "Produce PW-1 for
cross-examination", "Fix 2 defects and re-file the complaint", "Continue the draft application").
Status phrases: *Needs signature · {name}* · *Needs payment · {name}* · *Draft · {name}* ·
*Returned · {n} defects* · *With the court* · *Payment confirming* · *Done {date}* · *Expired —
{why}* · *No longer needed — {why}*. Due phrases: *{n} days overdue* · *Due today* · *Due {date}*
· *Before hearing {date}* · *No date*.

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

## 14. Decision log

| Date | Change | Confirmed by |
|---|---|---|
| 2026-08-18 | Ask recorded verbatim; users = advocates + teams; permission by vakalatnama | Product (owner) |
| 2026-08-18 | UX research memo; domain memo agent died; owner: stop researching, build | Product (owner) |
| 2026-08-18 | v1 built (lens-heavy list), reviewed, fixed, committed `11f6c3d` | Session |
| 2026-08-19 | Owner rejects v1: no columns, unlabelled filters, copy drift, overlapping lenses; no assignment; team access removed; file-share permissions; court-initiated + scrutiny-return tasks; wants cards / command centre | Product (owner) |
| 2026-08-19 | v2 proposed (D1–D13) and confirmed: 6 kind-cards as the filter, real table, labelled filter row, 3 state tabs, advocates-on-case column, drafts + ready instead of approval routing | Product (owner) |
