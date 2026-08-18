# Pending tasks

Status: reviewed
Updated: 2026-08-18
Source: docs/design/research/pending-tasks-ask.md (the owner's words) ·
docs/design/research/pending-tasks-ux.md (research memo) · docs/product/product-foundation.md ·
docs/product/domain/journey.md · docs/product/open-questions.md · docs/design/proposals/cases.md
DS read: `vendor/pucar-design-system` (origin verified `neer-ideasbeforenoon/pucar-design-system`) —
`AGENTS.md`, `ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` / `spacing` /
`colors` / `elevation`; `tabs`, `sheet`, `item`, `toggle-group`, `empty`, `timeline`,
`description-list`, `input-otp`, `alert-dialog`, `banner` source.

Written by the orchestrating session, not the `ux-designer` subagent: the owner asked to stop
researching and build ("just build the design out"). It records the decided cut the builder is
executing so the rails still hold — a plan, not a spec that overrides the DS.

---

## 1. Context

**Confirmed with product (the owner, 2026-08-18 — verbatim in the ask file):** users are advocates
and their teams (juniors and seniors sharing case access); a pending task is something pending in a
case that the advocate must do to move it forward (a signature, a payment for a process, a document
to submit); the home rail already lists them in descending urgency and its "View all N tasks" link
is dead; the new **All pending tasks** view treats tasks "in multiple levels" — urgency is one
filter, others were to be researched; permission is decided by the vakalatnama (signed → can
finalise: sign, pay; not signed → prepares and sends for the senior's approval, whose signature is
applied) → a drafts / awaiting-approval population is implied.

**Neighbours.** Nav (owner's mockup, as built on the home and e-filing branches): Home · Cases ·
Hearings · **Tasks** · Office. Cases owns "find and open a matter" (`cases.md`); the bell owns
events; the calendar owns dates. This branch is cut from `main`, which has no home screen — the
feature ships with its own app shell (main nav + top bar) so it runs standalone; the shell is the
e-filing shell ported to `components/shell/` and must be unified at merge.

**In scope:** the All pending tasks view (views, chips, search/sort/group/filters, grouped list,
bulk), the task detail (push panel / sheet), the act flows (pay · sign · submit · fix defects),
reassign, the approval handshake both ways, every state and edge case in memo §8, a sandbox data
layer with seams for the backend, and a sandbox identity switcher so the permission model can be
seen. **Out:** the home rail itself (other branch), notifications, calendar, real eSign / payment /
court integrations (labelled sandbox), bulk pay (v2).

**Screenshots** in the ask did not reach the agent; the local branches stand in as the reference.

## 2. Problem

1. The only pending-tasks surface is a rail with seven seeded rows and a dead "View all" link —
   there is no place to see, cut, or act on the whole obligation set.
2. Tasks on shared cases belong to several people (owner avatars in the seed) and some can only be
   finished by the advocate on the vakalatnama — nothing today says who may act, or lets a junior
   do the half they can.
3. Urgency in the seed is hand-ordered (a non-blocking 20-day-overdue row sits above a blocking
   4-day one); nothing computes it, so the rail and any list would disagree.
4. Nothing distinguishes overdue from expired from obsolete, or "waiting on court / senior" from
   "waiting on me".

## 3. Objective

- The most urgent actionable task is at the top for **this** person, across every case they can
  see, and can be acted on without leaving the view.
- What is stuck on someone else, and what I handed off, are visible as populations — not mixed into
  my queue and not hidden.
- Every row says in words who may finish it and what its next step is; a non-signatory can do their
  half and hand it off; the signatory approves with their own signature.
- Home rail and this view order tasks by the **same** comparator (rail is on another branch; the
  comparator is exported for it).

## 4. Job

**Job (product, owner's words):** "the things that are pending in a case that need to be done by
the advocate to move the case forward" — a work queue with deadlines and ownership. Confirmed for
this feature; wider who-logs-in remains open in `docs/product/open-questions.md`.

## 5. Decisions

**D1 · Three views, not one list — To do · Waiting · Done** (research §0/§2; pattern from
DocuSign / Linear). *To do* = open, in progress, draft, sent back, and awaiting-approval **when I
can approve** ("Approve & sign" is my task). *Waiting* = awaiting approval by someone else
(including things I prepared), awaiting court, payment confirming. *Done* = done, expired,
obsolete (the only place expiry is explained). Judgment on names.

**D2 · Default sort = urgency, made explicit as bands; default group = band.** Overdue (≤ 45 d) →
Due today → Soon (before the next hearing / within 7 d) → Later → No date → **Long pending**
(overdue > 45 d, collapsed, counted — DRISTI 1.0's production lesson, research §0). Ties: sent-back
first → blocking → next consequence date (the hearing it blocks while that is still ahead, else
the deadline — the owner's "blocking and coming up" leads) → earliest deadline → case → oldest → id.
Sort alternatives: Due date · Case · Recently added. Group alternatives: Case · Kind · Person.

**D3 · Lenses follow `cases.md` D1–D4:** views are tabs; the frequent cuts are chips with counts
(team avatars as on the home board · Blocking a hearing · Awaiting my approval · Unassigned); the
rest (kind, court, stage, due/created range, show expired) live in a Filters `Sheet` and echo as
removable chips; type-to-filter search; all state in the URL. No always-open filter card.

**D4 · Default population = everything on cases I can see**, narrowed by avatar chip — not "mine
only" (research §2: many tasks are role-addressed / unassigned; a junior's overdue task blocks my
hearing too; the home board already shows the whole team). Judgment; product may reverse (Q2).

**D5 · One status cue per row, in words; overdue as ink text, not a badge** (ui-craft §1.4/§2;
`task-row.tsx`). Row = verb+object · case · due cue · blocking cue · owner avatar · one
status/permission cue. Actions (verb · Mark done when allowed · select) reveal on hover **and**
focus-within, always visible on touch (WCAG 1.4.13; the rail's stance).

**D6 · Detail is a push panel on desktop, a full-height sheet on a phone** — the home's case-peek
model (ui-craft §0: structural inventions are deviations). Every task has a URL. Act flows are
focused pages that return to the flashed row.

**D7 · Permission by vakalatnama, no self-approval, either co-signatory may approve.** Verb is
derived per render from (person, task, case): finalise (Sign / Pay / Submit) vs Prepare → Send for
approval; approver sees Approve & sign / Send back with note; preparer may Withdraw. Payments follow
the same rule (owner's ask; product Q1 may loosen it).

**D8 · Mark done only for what the system cannot observe** (respond / appear / other). Pay, sign,
submit, fix-defects close on the event (research §6; 1.0's `closerAction`).

**D9 · Overdue ≠ expired ≠ obsolete.** Overdue stays in To do; expired (a window closed by rule)
and obsolete (order withdrawn) go to Done with a note; adjournment re-dates before-hearing tasks
with a history line.

**D10 · Sandbox, honestly labelled.** No server: repository seam + IndexedDB, seed generated
relative to today, identity switcher and reset in the account menu, sign/pay/court outcomes as
labelled sandbox controls fed by real task data (e-filing's posture).

**D11 · Bulk in v1 = select · Reassign · Approve & sign · Mark done; bulk pay deferred** (research §9).

## 6. What I cut (and why)

- A separate "Approvals" or "Drafts" route — approvals are the senior's tasks; a second inbox splits
  the queue (D1). Drafts not yet sent stay in To do with *Continue*.
- Manual priority / snooze / set-aside — deadlines are the law's, not the person's; product may add
  later (research Q6).
- Task type as a permanent chip row — kind is a sheet filter; the queue is triaged by urgency first.
- Badges for overdue on every row; teal row verbs; a grey canvas — craft rules.
- Bulk pay, nudges, saved views, "new since last visit" — v2.
- A domain-taxonomy memo (the agent died); the kinds shipped are the ones the owner named plus fix
  defects / respond / appear / other, continuous with the home seed.

## 7. Layout & hierarchy

Single column inside the shell. Top → bottom: title `Pending tasks` (`text-title font-semibold`, per
ui-craft scale discipline) + one-line summary; `Tabs` (line) To do · Waiting · Done with muted
counts, underline on the band rule; find row (search · Sort · Group · Filters) — stacks below `md`;
chips row (scrolls on a phone); applied-filter echoes; **one lifted panel** (`Card` +
`border-hairline shadow-raised`) holding sticky band headers and hairline-divided rows; Long pending
collapsed at the end. Detail pushes from the right at `lg`+ (list keeps its column), sheet below.
One `bg-primary` action per view: none in the list rows, the primary verb in the panel, one on each
act page. Above the fold on a phone: title, tabs, search, first band.

## 8. Components (DS name → region)

| Region | Component |
|---|---|
| Shell | `Sidebar` (icon-collapsible) · `Breadcrumb` · `DropdownMenu` (account, identity switcher) |
| Views | `Tabs` + `TabsList variant="line"` |
| Find | `InputGroup` + `Input` · `Select` ×2 · `Button outline` → `Sheet` (`Checkbox`, `Select`, date `Input`s) |
| Chips | `ToggleGroup` multi outline · `Avatar` · `Tooltip` |
| List | `Card` (panel) · `Item`/list rows · `Collapsible` (long pending) · `Checkbox` (select) · `Button` xs |
| Detail | docked panel / `Sheet` · `DescriptionList` · `Timeline` · `Select` (reassign) · `Button` |
| Act flows | `Card` panels · `AlertDialog` (confirm) · `InputOTP` (sign) · `Textarea` (note) · `Alert` (quiet sandbox notice) · file input |
| Feedback | `sonner` toasts · `Banner` (offline / error) · `Skeleton` · `Empty` |

Nothing new at component level.

## 9. Spacing

Ladder only. Page `p-6 md:p-8`; regions `gap-6`/`gap-8`; find row `gap-3`, chips `gap-2`; rows
`px-4 py-3` (`min-h-16` to hold the hover swap); panel `p-6`; controls `h-10 rounded-lg`, xs row
buttons expanded to 40 px targets; containers `rounded-xl`.

## 10. States

| State | Treatment |
|---|---|
| Loading | Skeleton rows; chrome intact |
| Empty — nothing pending | `Empty`: "Nothing pending. Every case you can see is up to date." |
| Empty — filters exclude all | `Empty` + Clear filters; chips stay |
| Load error / offline | `Banner` (+ retry / read-only, verbs disabled with tooltip) |
| No due date | "No date" band, plain caption |
| Done by someone else while looking | row dims with "Done by …", then leaves |
| Sent back | tops its band; cue "Sent back — 1 note"; note in panel |
| Payment failed / confirming | To do with cue / Waiting with cue |
| Expired / obsolete / re-dated | Done with `statusNote` / Done / cue "moved from … — hearing adjourned" |
| Assignee lost access | shown as Unassigned |
| Long / localized labels | wrap; never silent truncation |
| Phone | tabs and chips scroll; find row stacks; detail as sheet; no bulk |

## 11. Risks accepted

1. Default "everything I can see" may be noisy for a senior — the avatar chip and remembered lens
   are the mitigation; product may flip the default (Q2).
2. The 45-day long-pending threshold is inherited from 1.0, not confirmed.
3. Sandbox sign/pay/court outcomes are labelled but still stand in for real integrations.
4. A second app shell now exists on a branch — must be unified when either branch merges.
5. Payments treated as finalising (vakalat-only) per the ask; may be too strict for clerks (Q1).

## 12. Open questions for product

1. May a clerk/junior pay with standing consent (an office wallet), or is payment vakalat-only?
2. Default population: everything visible (built) or mine only? Does *specific-cases* access scope it?
3. Is assignment a real 2.0 field, and who may reassign?
4. Two seniors on one vakalatnama — either approves (built) or a named one?
5. Long-pending threshold (45 d) and what a person may do with a stale task.
6. Nav wording: mockup says *Tasks*; `cases.md` recorded *Pending tasks* — which is final?

## 13. Gaps in the DS

- Raised `Card` variant (`border-hairline shadow-raised`) is still a per-use className
  (`ds-requests.md`); reused here as `PANEL_CLASS`.
- No docked/push side-panel primitive; composed from a `div` with `bg-card` + hairline seam, as the
  home peek does. Sheet covers the phone.
- No date-range picker guidance for filters; plain date inputs used.

## 14. Decision log

| Date | Change | Confirmed by |
|---|---|---|
| 2026-08-18 | Ask recorded verbatim; users = advocates + teams; permission by vakalatnama; drafts population implied | Product (owner) |
| 2026-08-18 | UX research memo landed; domain memo agent died — taxonomy folded into the build spec | Session |
| 2026-08-18 | Owner: stop researching, build — brief written by the session as the decided cut, status `building` | Product (owner) |
| 2026-08-18 | D1–D11 as above; standalone shell on this branch, to unify at merge | Session |
| 2026-08-18 | Comparator: blocking rows order by the hearing they block while it is ahead ("blocking and coming up first"), then deadline | Session (owner's words) |
| 2026-08-18 | Built; ui-reviewer render audit → fixed: finaliser **takes over** a member's draft/sent-back (D7 extended); 40 px targets; Awaiting-my-approval chip only for signatories; failed payment stays on the page; when grouped by band the Overdue/Long-pending eyebrow carries the one red mark and row cues go muted; focus = ring only, open row = one fill; nav folds when the panel opens < 1536; copy fixes; status → reviewed | Session |
