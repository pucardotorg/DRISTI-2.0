# Advocate home — refinement

Status: draft
Updated: 2026-08-28 (Round 4 added — re-audit against the owner's feedback of the same day)
Source: docs/product/product-foundation.md (§2 state config, §3 clocks, §5 Kerala limitation, §6 Kerala vs
Gujarat) · docs/product/rollout.md · docs/product/open-questions.md · docs/product/national-vs-state.md ·
docs/product/domain/actors.md · docs/design/research/pending-tasks-ask.md (owner's words, 18 Aug) ·
docs/design/proposals/pending-tasks.md §1 (owner confirmations, 18–19 Aug) ·
**owner feedback 2026-08-28 (six items + meta), recorded verbatim-of-intent — the authoritative input for
Round 4**
DS read: `vendor/pucar-design-system` — origin verified `neer-ideasbeforenoon/pucar-design-system`
via `.git/config` (no `.pucar-ds-id` file present in this checkout). `AGENTS.md`, `RESPONSIVE.md`,
foundations `laws` and `colors`; source of `badge.tsx`, `segmented-control.tsx`, `toggle-group.tsx`,
`toggle.tsx`, **`avatar.tsx`, `card.tsx`, `button.tsx`, `select.tsx`**; component catalog globbed (70 files).
Skills applied: `propose-ui-brief`, `ui-craft`.

> **Gate caveat for whoever builds this.** This brief was written without shell access, so
> `npm run check:ds-fresh` was **not** run. `ds.lock.json` pins
> `e0cadea6b9d459bd3c58eed840974c6c610ad624` (bumped 2026-08-25) and every DS quotation below is
> from the working `vendor/` tree. Run `check:ds-fresh` **before** acting on any of this; if the
> checkout is off-pin, re-verify the component facts this brief leans on hardest
> (`badge.tsx` destructive = *muted* tint; `toggle` `sm` = `h-7`; `avatar.tsx`'s
> `after:border after:border-border after:mix-blend-darken` disc edge; `select.tsx`'s
> `position="item-aligned"` default).

> **Round 4 is the live plan.** Rounds 1–3 (§14) shipped as commits `d5f2c3b`, `f9ef36a`, `685b291`.
> The owner reviewed the result on 2026-08-28 and rejected parts of it. **§15 is the current round**;
> everything it supersedes is marked *superseded by R4* in place rather than deleted, so the reasoning
> that produced the rejected work stays readable.

---

## 1. Context

### Where this sits

The advocate home is the landing screen of the advocate shell (left nav: Home · Your cases ·
Make filings · Join a case · Pending tasks · Calendar · Team case access —
`lib/advocate/content.ts` `advShell`). Its neighbours own the adjacent responsibilities and this
screen must not re-own them:

| Responsibility | Owner |
|---|---|
| Find any matter, any day | Your cases |
| The full task backlog, filtered and triaged | `/tasks` (brief: `pending-tasks.md`) |
| What one case is | the shared case peek → case file |
| Events and unread | the bell in the top bar |
| **This screen** | the selected day's cause list, per court, and what stands in its way |

The home screen is a **view over the same world `/tasks` reads** — `useTasks()` → `World`, with
`lib/advocate/home.ts` as pure selectors. It is not a second data source. Anything this brief
changes about counts or urgency wording changes a *presentation*, never a fact.

### Facts confirmed with the owner (attributed, not inferred)

From `docs/design/research/pending-tasks-ask.md` and `docs/design/proposals/pending-tasks.md` §1:

- 18 Aug — *"users are advocates and their offices"*; a pending task is *"something pending in a
  case that must be done to move it forward (signature, payment for a process, document to
  submit)"*; *"the home rail lists them by urgency"*; permission is decided by the vakalatnama.
- 18 Aug — what exists on home today: *"a rail listing pending tasks in descending urgency —
  blocking-and-upcoming first — with a 'View all N tasks' link"*.
- 19 Aug — no assignment; show the case's main advocate and everyone on the case; access is
  file-share style (on the vakalatnama → can complete; not on it → can prepare and leave pending).

From the owner's review of R1–R3, **2026-08-28** (the six items resolved in §15):

- The screen's hierarchy is *"date becomes the top filter, then you see the courts, then you see
  the cases"*. A fixed horizontal tab bar *"cannot accommodate"* more courts — *"that is a bad
  implementation"*.
- The filter should be by **advocate**: *"by default you will see your cases, but you can provide
  all the advocates who have active cases that day, and you can just switch between those"*.
- View-only is an on-card fact: *"you should show well that you are a non-vakalat holder in the
  case if it's a view-only case. And if they have vakalat, then you don't have to mention anything
  specifically."*
- The rail's cards are inconsistent with each other: *"the cards are not top aligned, but in hearing
  types it's top aligned. So the UX audit was not well done enough."*
- On the avatar discs: *"the only thing separating them is a very faint white circle, and that may
  not be enough."*
- On the Now card's button: *"that button shouldn't be persistent. There is time listed on all the
  other cards, and view case comes as a hover action. So the same will apply here also."*

**These are owner confirmations recorded in our own design record, not product-doc facts.**
`docs/product/open-questions.md` still lists "Are primary users advocates, court staff,
institutional filers, litigants, or a mix?" as unanswered. Both things are true and this brief
keeps them apart: it designs for the advocate the owner named, and treats the product-doc gap as
still open (§12).

### Constraints this brief operates inside (given, not decided here)

1. Pucar DS only — no new tokens, no DS edits, no coloured accent bars, spacing ladder only.
2. The rail's collapse model (slim strip, expand in place) is **settled**. Refine defaults and
   content; do not replace the model.
3. Cause-list item order is court truth — never resequence hearings.
4. All chrome copy is bilingual (en + ml) in `lib/advocate/content.ts`. Note the existing rule in
   that file: data-derived phrases (party names, stages, "41 days overdue" from
   `lib/tasks/format`) stay English, exactly as on `/tasks`. New copy proposed here is chrome and
   therefore bilingual; no proposal below moves a derived phrase into the bilingual layer.
5. The beige queue + single mint focal card **shipped at the owner's request**. That direction is
   locked. §5 D0 records what that lock costs and refuses to relitigate it.
6. *(R4)* The hierarchy **date → court → case** is an owner ruling, not a design option. The court
   tab band is dead.

### In scope / out of scope

**In:** everything under `components/advocate/` on the home route — greeting, week strip, the board's
chrome, concluded strip, Now card, queue cards, list view, companion rail (both panels), and the
shared atoms in `home-bits.tsx`; plus the copy in `lib/advocate/content.ts` and the selectors in
`lib/advocate/home.ts` those changes need. *(R4 adds two files at the edge of that boundary:
`components/tasks/person-avatar.tsx`, because it is the DS-composed avatar the home board should be
using, and one stale comment in `lib/tasks/sandbox.ts`.)*

**Out:** `/tasks` itself, the case peek's internals, the app shell (`components/shell/`). Two
shell observations that this audit surfaced are recorded as **neighbour implications** in §12
rather than as changes — the nav spark and the notifications badge are chrome this feature does
not own, but they land in the same viewport and they count against the same colour budget.

---

## 2. Problem

Numbered so decisions and reviewers can cite them. Every claim carries its measurement or its
file:line. **P1–P10 are the Round 1–3 audit.** P11–P24 (§15.2) are the Round 4 re-audit — including
the several that P1–P10 missed.

**P1 — The screen spends its whole urgency budget in the rail, before the day's work is read.**
At rest the rail shows the "Due today" bucket only (`railGroups` folds overdue into today;
the other two buckets are `defaultOpen={false}`). That was 8 cards, each carrying a `Badge`:
3 `variant="destructive"` and 5 `variant="warning"`. Add the strip's solid `bg-destructive` "27",
the top bar's solid `bg-destructive` "3" and the nav's `--rail-badge` spark + numeral:
**six destructive marks and six amber marks visible at rest.** `ui-craft` §1.4 budgets ~3
destructive marks per view and one status chip per card.

Two corrections to how this is usually described. First, `Badge variant="destructive"` is
`bg-destructive-muted text-destructive-muted-foreground` (`badge.tsx:15-16`) — a pale tint with
dark red ink, *not* solid red. The only solid destructive fills at rest are the strip badge and
the notifications badge. The saturation is overstated; the **count** is not. Second, the five
"Due today" chips repeat their own bucket header, which already says "Due today · 8" in
`warning-ink` — they are duplication before they are colour.

The sharpest evidence is in our own code: `DueCue` (`home-bits.tsx:233-250`) was written for
exactly this row and its docstring states the rule — *"words in ink, never a solid badge: these
rows repeat, and a red chip on each would spend the screen's whole destructive budget before the
rail count is read."* `TaskCard` did not use it.

**P2 — The layout toggle was below the DS touch floor.** `ToggleGroup size="sm"`;
`toggleVariants.sm` is `h-7` = **28px** (`toggle.tsx:20`). The Laws page lists "≥ 40×40px touch
targets" under *Accessibility floor* — "defects when missing, not preferences". The DS's own
`segmented-control.tsx:28-30` names this precise case. Compounding it: the two controls in that row
were the same kind of choice rendered as two different components.

**P3 — Brand tint carried three different meanings in one viewport.** `bg-brand-muted` meant
*today* (week cell), *now / live* (Now card, now row) **and** *you* (`TeamAvatar` `you`). The third
appeared on every card, because `teamOf` returns the viewer on every case the viewer can view and
`AdvocateStack` sorted `you` to the front — 17 identical "AN" discs in one board. `ui-craft` §2:
*"Brand fill means 'current / now / today / live' — never 'selected'."*

**P4 — 341px of page chrome stood above the day's first matter.** Measured at 1440px, nav
expanded (256), rail open (384) → board ≈ 800 CSS px:

| Band | px | Source |
|---|---:|---|
| shell top bar | 56 | `advocate-home.tsx` (`TOP_BAR`) |
| `pt-8` above greeting | 32 | |
| greeting row — the **week cell** sets the height | 68 | `home-greeting.tsx` |
| `pb-4` | 16 | |
| court tab band (pt-2 · 20 · pb-3 · rule) | 41 | |
| board `pt-4` | 16 | |
| filter row — `SegmentedControl` keeps a **40px** row at both sizes | 40 | `segmented-control.tsx:42-48` |
| `gap-6` | 24 | |
| concluded strip: 8px stack peek + (py-3 · 20) | 52 | |
| `gap-6` | 24 | |
| "Now" eyebrow + `gap-3` | 28 | |
| **Now card top edge, from viewport top** | **≈ 397** | matches the observed ~400 |

**P5 — Three counts, three denominators, no scope stated at rest.** 17 = matters listed on the
selected day, across courts, after the access filter. 27 = *every* needs-action task, unbounded by
date. 21 = substantial postings inside `PREP_HORIZON_DAYS = 21` — the count coincides with the
horizon. The tasks panel lists only tasks whose consequence date lands inside 7 days, so the
visible cards **can never sum to the badge above them**.

**P6 — The week-strip dots meant by colour alone.** Amber `warning-ink` = a task consequence lands
that day; grey `muted-foreground` = matters listed; transparent = neither. AGENTS.md rule 7 / the
Laws page: *"status never conveyed by color alone."*

**P7 — A court label was de-localized by an English string match.** `room.court.replace(", Kollam", "")`.
In a Malayalam or Gujarati deployment the court name will not contain `", Kollam"`, so the strip
silently no-ops and the tab band grows. How a court's name is displayed is a state-layer concern
(`product-foundation.md` §2 — "Court language & UI"; `national-vs-state.md`), not a literal in a view.
*(R4 note: the replace is gone, but the underlying need — say the shared establishment once — was
never met. See P11 and D14.)*

**P8 — A count was dressed as a warning.** The prep strip carried `countTone="warning"` for
"21 ahead". A count of scheduled substantial hearings is not a status.

**P9 — `gap-5` was off the spacing ladder.** AGENTS.md 7a and the Laws page name `gap-5`
explicitly among the defects. It passed green because this repo's `check-tokens.mjs` only catches
*raw-unit* arbitraries — the ladder itself is unenforced here.

**P10 — A failed load spun forever.** One `Spinner` for `state !== "ready"`, collapsing `loading`
and `error`. The store exposes `reload`; the screen never offered it.

### What I checked and could not fault (Rounds 1–3)

- **The zero-count court tab is not a dead click.** Selecting it renders `Empty` with a
  *"Next hearing day: {day} — {n} listed"* jump — a forward action, not a void. And dropping
  zero-count tabs would make the tab set change shape day to day, costing the spatial memory of
  "my four courts". **Left exactly as it was.**
  > **Superseded by R4 (D15).** The reasoning was sound *for a tab band*, where a tab is a
  > persistent landmark. It does not transfer to stacked sections, where a zero court is dead
  > vertical space in a scroll rather than a landmark in a row. R4 drops the section and states the
  > absence in one line instead.
- **The greeting's vertical cost is not the greeting's.** At ≥ `@3xl` the greeting and the week
  strip share a row and the two tie at 68px. Shrinking the greeting reclaims **0px** at desktop
  width. Only the `pt-8` above it is reclaimable. My own starting observation was mostly wrong.
- **The concluded strip is in the right place.** Earlier → now → next is the day's actual shape.
  Moving it below the queue would buy ~76px by telling a lie about the day. Take its padding, not
  its place. *(Still holds under R4, now per court section.)*

---

## 3. Objective

Observable, in the order they should be testable:

1. **Colour budget.** At rest, on the default view at 1440px: ≤ 3 destructive marks and ≤ 2 amber
   marks in the whole viewport, counted by a reviewer with `ui-craft` §5's checklist. Before R1: 6
   and 6. *(R4 tightens this further — see §15.7.)*
2. **Reach.** The day's first matter sits **≤ ~310px** from the viewport top at 1440px with the
   rail open. Before R1: ~397px. Measured after R3: **336px**.
   > **Restated by R4 (D26).** The stacked-court structure the owner ruled for puts a court heading
   > above the first matter and replaces a 41px tab band with a 53px toolbar row. The honest target
   > becomes **≤ ~370px** with a concluded strip present, ~310px without one. R3's 336px was bought
   > by a structure that showed one court out of four; that was not a saving, it was a hidden cost.
3. **No mark means by colour alone**, and no count is shown without its scope being readable
   without a pointer.
4. **Every interactive target on the board clears 40×40px.**
5. Nothing above changes what the court said: item numbers, cause-list order and the concluded /
   now / upcoming split are byte-identical before and after.
6. *(R4)* **Every data type has exactly one presentation across sibling surfaces.** A reviewer can
   name the treatment for "when", for "who is on the matter", for "selected", for "not on the
   vakalatnama", and find it identical on the Now card, the queue card, the list row and both rail
   panels.
7. *(R4)* **Every court with matters on the selected day is reachable without horizontal scrolling
   or a hidden control**, at 4 courts and at 12, in `en` and in `ml`.

Objectives 1, 3–7 are testable regardless of who logs in. Objective 2's *value* is contingent on
this being a screen someone keeps open all day — see §4 and §12 Q1.

---

## 4. Job

**Job: unconfirmed.**

What is confirmed and attributed: the owner said (18 Aug) that users are *"advocates and their
offices"* and described the home rail as *"listing pending tasks in descending urgency"*; and
(28 Aug) that the screen's logic is *"there are courts, and within the courts you see the cases"*,
with the date as the top filter. That tells us who the build is aimed at, what one rail is for, and
what the **structure** must be. It does not settle what the **screen** is for, and `docs/product/`
contains no product-user layer at all.

Two candidate framings, both **hypotheses**, neither settled:

- **H1 — the day's board.** The screen answers "what is listed today, in which court, and what
  stands in the way of each item". Wording taken from the code's own docstring
  (`advocate-home.tsx:148`: *"The advocate home — the day in court, and what stands in its way"*) —
  that is the builder's framing, not product's.
- **H2 — an all-day operating surface** kept open beside the courtroom, re-read many times a day.
  Wording taken from the person commissioning this audit ("an all-day Operate screen"). Not a
  product doc.

**What rides on this.** H2 is what makes P4 (chrome height) a real cost. Decisions D4–D7 are
marked **provisional**. The R4 decisions D13–D26 are *not* provisional on H1/H2: they follow from
an owner ruling on structure (date → court → case) and from sibling-consistency defects that are
wrong under either hypothesis.

**What I may rely on without confirmation**, because it comes from the statute rather than from
assumed users: §138 runs on hard clocks — notice within 30 days of the dishonour memo, 15 days for
the drawer to pay, complaint within one month of the cause of action (`product-foundation.md` §3) —
and Kerala's limitation runs from electronic receipt in the Registry, with portal failure no ground
for extension (`product-foundation.md` §5). A missed window is unrecoverable. That is why R4 refuses
to make a court section collapsible (D16) and why it does not recommend closing the tasks rail by
default.

**Designing for the more constrained case, and saying so:** where who-logs-in changes the answer,
this brief assumes the *professional repeat user* the owner named and weights throughput,
density and keyboard/focus reachability over first-time recognition — except in P6 (dot meaning)
and D19 (the vakalatnama mark), where the cost of being wrong is a misread deadline or a matter
someone believes they can act on when they cannot, and the fix is nearly free.

---

## 5. Decisions (Rounds 1–3)

Each carries the rule or doc it traces to, or the word *judgment*; the alternative rejected; and
what it gives up. **Round 4's decisions are D13–D26 in §15.3.**

**D0 — I am not relitigating the beige queue + single mint focal card.** It shipped at the owner's
request. Worth recording once, so nobody rediscovers it as a bug: `ui-craft` §4 says a
`surface-sunken` well "needs a white panel between it and the page", and this board puts sunken
tiles directly on `bg-background`. The board is therefore *deliberately outside* the skill's
four-layer model. **Filed as upstream feedback to the skill (§13), not as a change.**
*Gives up:* nothing today; it means a future `ui-reviewer` pass will flag the board unless this
paragraph travels with it.

**D1 — The rail states due-ness in ink, and keeps exactly one badge.** `DueCue` on every task card,
and one `Badge variant="destructive"` reserved for the single most-overdue task in the panel.
> **Superseded by R4 (D20).** The "one badge for the worst" half was wrong and the owner rejected
> it: it makes adjacent cards state the same fact two different ways, which is exactly the defect
> the ink treatment existed to fix. The ink half survives and now covers both rail panels.

**D2 — The layout toggle becomes `SegmentedControl size="compact"`.** 32px well, 40px hit target,
same two options, same icons.
*Rule:* Laws → accessibility floor (40×40); `segmented-control.tsx:28-30` names this exact
substitution; `ui-craft` §2 sibling consistency. *(Holds under R4.)*

**D3 — The viewer's own avatar leaves the board.** `AdvocateStack` drops `you` on the Now card, the
queue cards and the list rows, and renders nothing when no one else is on the matter.
*Rule:* `ui-craft` §2 loudness ladder (brand fill = current/now/today/live, not identity) — P3.
*Note (R4):* the docstring promises the case peek passes `includeSelf`. It does not — `case-peek.tsx`
does not use `AdvocateStack` at all; it renders counsel as text via `formatCounselList`. The prop
therefore has no `true` call site on this screen today. Left in place because `/tasks`' own stack
is the surface that will want it; recorded so nobody reads the docstring as a description of the
build.

**D4 (provisional — depends on H2) — The access filter and layout control move onto the tab
band's trailing edge.**
> **Superseded by R4 (D13, D18).** There is no tab band and no access filter. The *reasoning* —
> placement encodes scope, page-state controls belong on page chrome — survives verbatim and is why
> R4's toolbar row exists.

**D5 (provisional) — The concluded strip loses padding, keeps its place and keeps its peek.**
`py-3` → `py-2`. The 8px stack peek stays. *(Holds under R4, now once per court section — see D17.)*

**D6 (provisional) — The Now card loses padding, not scale.** `px-8 py-6` → `p-6`;
`rounded-3xl` → `rounded-2xl`; `gap-5` → `gap-4` (P9). The case name stays `text-title`.
*Rejected:* replacing the mint fill with a left accent line — the owner's constraint list excludes
coloured accent bars, `ui-craft` §2 lists a coloured `border-l` on a tinted panel as a cheap tell,
and the loudness ladder sanctions brand fill for precisely "now / live". *(Holds under R4; the
card's contents change under D22, its fill and geometry do not.)*

**D7 (provisional) — The rail defaults narrower and remembers.** `RAIL_DEFAULT_WIDTH` 384 → 320
(above `MIN_WIDTH` 280), and both `railSection` and `width` persist per user.
*Gives up:* 64px of task-card width. **R4 note:** the measured consequence at 320px is that task
titles get ≈30 characters and the third line's `"6 days overdue · 22 Aug"` wraps to two lines on
narrow cards. D20 fixes the wrap by construction rather than by widening the rail back.

**D8 — The rail stays open on first run, on the tasks panel — but that default needs the owner.**
Still open; §12 Q2.

**D9 — Below `md` the rail stays absent, on purpose; between `md` and ~1100px the panel becomes a
`Sheet`.** Still open; §12 Q3. **Not built.**

**D10 — Counts state their scope in words, at rest.** Tasks panel header takes the `caption` slot;
the prep strip's count goes neutral (P8); the greeting subline names the day's due count when
non-zero (P6); each week cell gains a `Tooltip`. *(Holds under R4.)*

**D11 — The court label stops being edited in the view.** Delete `.replace(", Kollam", "")`.
*Rule:* `product-foundation.md` §2; `national-vs-state.md`. *(Holds; R4 D14 supplies the thing the
deletion left missing — a locale-independent way to say the shared establishment once.)*

**D12 — The screen distinguishes a failed load from a slow one.** `state === "error"` renders a DS
`Empty` with a retry wired to the store's `reload`. *(Holds under R4.)*

---

## 6. What I cut (and why) — Rounds 1–3

- **Merging the week strip into a filter bar.** Rejected — the strip is seven days of glanceable
  load in the space a dropdown would spend on a click.
- **The left accent line on the Now card.** Rejected — D6.
- **"Lead advocate + N".** Rejected in that form — D3.
- **A fourth "Overdue" bucket in the rail.** Rejected — the grouping already exists and overdue is
  deliberately folded into "Due today".
- **A week-strip dot legend.** Rejected — a permanent row of chrome explaining two marks.
- **Dropping the zero-count court tab.** Refuted in §2 — *now reversed by R4 D15, for a reason that
  only applies once the tabs are gone.*
- **Shrinking the greeting.** Refuted in §2 — reclaims 0px at desktop.
- **Moving the concluded strip below the queue.** ~76px, declined — it would misstate the day's
  shape (D5).
- **Removing the Now card's "View case" button.** Considered and **kept**, on the argument that the
  day's one live matter should not hide its action behind a pointer.
  > **Reversed by R4 (D22), at the owner's instruction.** The argument was not wrong on its own
  > terms; it was wrong on the screen's terms, because it made one card the only surface on the
  > board that does not use the pattern every other repeated row uses. A pattern census (pass 6)
  > would have caught it before the owner did. It did not run.
- **A skeleton board for the loading state.** The whole screen swaps at once; the spinner stays.
- **Any change to `hearing-list.tsx`'s table beyond the avatar stack.**
  > **Reversed by R4 (D19, D23).** The table is a sibling of the card board and was carrying its
  > own treatment of two facts the cards also carry.

---

## 7. Layout & hierarchy (Rounds 1–3 — superseded by §15.5)

**Column, top to bottom (after Round 2):** greeting + week strip on one row → court tab band with
the access filter and layout control on its trailing edge → concluded strip → the "Now" eyebrow and
the one brand-tinted focal card → "Up next" caption → the beige queue.

**Focal point:** exactly one — the `bg-brand-muted` Now card. The one `bg-primary` action per view:
**there is none on this screen**, and that is correct — every action here is navigational or
per-row. Do not add one to "balance" the view. *(Still true under R4.)*

---

## 8. Components (DS name → region) — Rounds 1–3

| Region | DS component | Change |
|---|---|---|
| Greeting date picker | `Popover` + `Calendar` + `Button` | none |
| Week strip cells | native buttons + `Tooltip` | Tooltip added (D10) |
| Court tabs | `Tabs` / `TabsList variant="line"` / `TabsTrigger` | trailing control cluster (D4) — **removed in R4** |
| Access filter | `SegmentedControl size="compact"` | **removed in R4 (D18)** |
| Layout toggle | `SegmentedControl size="compact"` | was `ToggleGroup size="sm"` (D2) |
| Concluded group | `Collapsible` | padding only (D5) |
| Now card | `Card` on `bg-brand-muted` | padding, radius, gap (D6) |
| Queue cards | `Card` on `bg-surface-sunken` | avatar stack only (D3) |
| Row status | `Badge` (`success` / `secondary`) | **removed in R4 (D19)** |
| List view | `Table`-shaped markup in `overflow-x-auto` | avatar stack only |
| Rail panels | `Collapsible` + `Button` + `Tooltip` | header caption (D10) |
| Rail task due-ness | `DueCue` + one `Badge variant="destructive"` | **badge removed in R4 (D20)** |
| Empty / error | `Empty` (+ `EmptyMedia`, `EmptyTitle`, `EmptyDescription`) | error state (D12) |
| Mid-width rail panel | `Sheet` | proposed at `md`–~1100px (D9) — **not built** |

---

## 9. Spacing (Rounds 1–3)

Ladder only — `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`; micro steps inside controls
only. Changes made:

| Where | From | To | Why |
|---|---|---|---|
| page top | `pt-8` | `pt-6` | 8px |
| board column gap | `gap-6` | `gap-4` | 8px above the fold |
| Now card | `gap-5` **(off-ladder)** | `gap-4` | AGENTS.md 7a / Laws (P9) |
| Now card | `px-8 py-6` | `p-6` | DS container padding |
| concluded strip | `py-3` | `py-2` | 8px |

**Reclaim ledger (1440px, ≥ `@3xl`):** 64 + 8 + 8 + 8 = **88px**. 397 → **336px** measured at R3.
*(R4's ledger is in §15.7.)*

---

## 10. States (Rounds 1–3) — extended by §15.8

| State | Before | After R3 |
|---|---|---|
| **Empty — day** | `Empty` + "next hearing day" jump | unchanged |
| **Empty — access filter** | separate copy for *mine* / *shared* | unchanged — **replaced in R4** |
| **Empty — rail tasks / prep** | centred two-line message | unchanged |
| **Loading** | full-screen `Spinner` | unchanged |
| **Error** | **same spinner, forever** (P10) | `Empty` + retry → `reload` (D12) |
| **Partial — rail** | panel lists ≤ 7-day tasks under a badge counting all 27 (P5) | header caption states the 7-day scope |
| **Partial — no team** | `AdvocateStack` returns null when the team is empty | after D3, also null when the viewer is the only member |
| **Long label / long language** | `", Kollam"` strip was English-only (P7) | D11 removed the strip — **and the band then broke; see P11** |
| **Zero-count court** | tab renders with a muted `0` | unchanged — **replaced in R4 (D15)** |
| **Long day** | queue grows unbounded | unchanged; §12 Q4 |

**Focus and keyboard, since they are layout decisions here:** `RowAction` reveals on
`group-focus-within` as well as hover and is `aria-hidden` because it duplicates the row title's
own action — keep that intact through every change.

---

## 11. Risks accepted (Rounds 1–3)

- **The rail became harder to scan for red.** That was the trade in D1.
- **Below `@3xl` the merged bar reclaims almost nothing** and adds a wrap. Accepted.
- **320px rail cards truncate earlier.** Accepted, with a verification step — *the verification
  found the wrap; R4 D20 fixes it.*
- **Persisted rail state can strand a user** who closed the rail weeks ago. Mitigated by the strip.
- **This brief has not been gate-verified.** Every px figure is derived from source and the DS's
  own component values. The builder re-measures.

---

## 12. Open questions for product

**Q1 — What is this screen's job, in product's words?** Unconfirmed (§4). H1 and H2 are
hypotheses. D4–D7 are provisional on H2. Product docs contain no product-user or journey layer.

**Q2 — Should the tasks rail be open on first run?** (D8.) A product-visible default with a real
argument on both sides. Owner call, not mine. **Still open — do not decide.**

**Q3 — Is a `Sheet` at mid widths an acceptable refinement of the settled rail model, or a
replacement of it?** (D9.) The strip stays; only the panel's landing changes. Owner call.
**Still open — do not decide. Not built.**

**Q4 — Should the cards / list default follow deployment volume?** Kerala runs ~2,000 cases/yr at
Kollam; Gujarat sometimes ~1,000/day (`product-foundation.md` §6, `rollout.md`). A card board is a
low-volume cause list. Whether List should be the default above some threshold is a product/config
decision. *(R4 raises the stakes: a stacked board is longer than a tabbed one, so the volume
threshold now governs more than density — see §15.11 Q9.)*

**Q5 — Who logs into DRISTI per state deployment?** Still open in
`docs/product/open-questions.md`.

**Q6 — Malayalam wording for the new chrome strings.** ml phrasing for legal-adjacent chrome should
be confirmed by whoever owns the Malayalam copy, not accepted because an agent wrote it. *(R4 adds
nine more strings — §15.10.8.)*

**Q7–Q10 are new in Round 4 — see §15.11.**

**Neighbour implications (not this brief's files, recorded so they are not lost):**

- The rail strip's solid `bg-destructive` "27" and the nav's "27" are the same number ~250px apart
  in one viewport. One of them is redundant while the other is on screen.
- The notifications badge is the third solid destructive mark in that viewport. Together, the shell
  alone spends two thirds of `ui-craft`'s destructive budget before this screen draws anything.

---

## 13. Gaps in the DS

Framed as requests against `neer-ideasbeforenoon/pucar-design-system`; add to
`docs/design/ds-requests.md` when raised (that file currently ends at 15, so these are 16–17).

1. **No count-badge / numeral-annotation role.** Three hand-rolled numeral pills exist in this
   product already — the rail strip badge, the collapsed nav pill, the notifications badge. Each
   invented its own size, ring and numeral treatment. Ask: a `Badge`/`Count` size or a dedicated
   numeral role with a sanctioned sub-caption size and a ring token for sitting on chrome.
2. **No guidance for a "sunken tiles on the page" board.** `ui-craft` §4's four-layer model has no
   slot for the shipped board idiom. The idiom reads well and is owner-approved; the skill will
   flag it forever until the model accounts for it. *(Feedback on the `ui-craft` skill more than on
   the DS repo.)*
3. **The spacing ladder is unenforced in this product.** `check-tokens.mjs` catches raw-unit
   arbitraries but not off-ladder named steps (`gap-5`, `p-5`, `gap-10`). Ask: port the DS's ladder
   rule into the product gate.
4. *(R4)* **`AvatarGroup` rings in `background`, which is wrong on every surface that is not the
   page.** See §15.12.
5. *(R4)* **No stacked-section / section-header pattern.** See §15.12.

---

## 14. Iteration plan — Rounds 1–3 (shipped)

Each round included the previous. All three shipped: `d5f2c3b` (R1), `f9ef36a` (R2), `685b291` (R3).
Retained in full because R4's build plan edits this code and the reasoning behind each line is here.

### Round 1 — "Quiet the alarms" — shipped `d5f2c3b`

| # | File | Current | Proposed | Rule / fact |
|---|---|---|---|---|
| 1.1 | `companion-rail.tsx` (`TaskCard`) | every card ends in a `Badge` | the third line becomes `DueCue` | `ui-craft` §1.4 + §2 — P1 |
| 1.2 | `lib/advocate/home.ts` + `companion-rail.tsx` | — | `worstOverdue(world, now)`; that one card keeps `Badge variant="destructive"` | `ui-craft` §2 — **rejected by the owner 28 Aug; removed in R4** |
| 1.3 | `companion-rail.tsx` | 5 × amber `"Due today"` chips | removed — the bucket header already prints it | duplication — P1 |
| 1.4 | `court-board.tsx` | `ToggleGroup size="sm"` (28px) | `SegmentedControl size="compact"` | Laws → 40×40 floor — P2 |
| 1.5 | `hearing-cards.tsx` | `gap-5` | `gap-4` | AGENTS.md 7a — P9 |
| 1.6 | `home-bits.tsx` (`AdvocateStack`) | `you` on all 17 cards | `includeSelf` (default `false`) | `ui-craft` §2 — P3 |
| 1.7 | `companion-rail.tsx` | prep strip `countTone="warning"` | neutral tone | colors foundation — P8 |
| 1.8 | `companion-rail.tsx` + `content.ts` | no caption | `railScope` — "Due in the next 7 days" | P5 |
| 1.9 | `home-greeting.tsx` + `content.ts` | subline lacks the due count | append `dueOne` / `dueMany` | Laws — P6 |
| 1.10 | `home-greeting.tsx` | `sr-only` text only | wrap each cell in `Tooltip` | P6 |
| 1.11 | `advocate-home.tsx` | `room.court.replace(", Kollam", "")` | render `room.court` | `product-foundation.md` §2 — P7 / D11 |

### Round 2 — "Reclaim the column" — shipped `f9ef36a`

| # | File | Current | Proposed | Rule / fact |
|---|---|---|---|---|
| 2.1 | `advocate-home.tsx` + `court-board.tsx` | controls render inside each `TabsContent` | move both onto `TabsList`'s trailing edge; band wraps below `@3xl` | `ui-craft` §0 + P4. Reclaim 64px — **superseded by R4 D13** |
| 2.2 | `advocate-home.tsx` | `pt-8` | `pt-6` | 8px |
| 2.3 | `court-board.tsx` | `gap-6` | `gap-4` | 8px |
| 2.4 | `hearing-cards.tsx` | `py-3` | `py-2` | 8px |
| 2.5 | `hearing-cards.tsx` | `px-8 py-6 rounded-3xl` | `p-6 rounded-2xl` | D6 |
| 2.6 | — | — | re-measure | Objective 2 — **measured 336px** |

### Round 3 — "Rebalance the frame" — shipped `685b291`

| # | File | Current | Proposed | Rule / fact |
|---|---|---|---|---|
| 3.1 | `companion-rail.tsx` | `RAIL_DEFAULT_WIDTH = 384`; state resets | `320`; persist `railSection` and `width` | D7 |
| 3.2 ▲ | `advocate-home.tsx` | — | keep `"tasks"` as first-run default | D8 / Q2 — **still awaiting owner** |
| 3.3 ▲ | `companion-rail.tsx` | `hidden md:flex` | Sheet at mid widths | D9 / Q3 — **not built** |
| 3.4 | `advocate-home.tsx` | one `Spinner` for both | `error` → `Empty` + retry | P10 / D12 |
| 3.5 | — | — | **Do not build**: volume-aware default | Q4 |

---

## 15. Round 4 — the re-audit

### 15.0 Why there is a Round 4, and what the last audit got wrong

The owner reviewed R1–R3 and rejected four things it shipped and two things it left alone. Every
one of the six is an instance of a class the previous audit did not test for. That is the honest
diagnosis: R1–R3 audited the screen against the design system's *rules* — tokens, ladder, contrast,
touch floor — and it was largely right about those. It did not audit the screen against *itself*.
It never asked what happens to the court band at four courts on a real viewport, never listed the
screen's interaction patterns and looked for the one that broke them, and never put two sibling
cards side by side and asked whether they say the same fact the same way. Those three questions
produce five of the owner's six items.

They are now the method. The `ux-designer` role carries the eight passes; §15.1 runs all eight and
says what each found. Where a pass depends on the render and I have no browser, it is marked **run
by proxy** on the measurements supplied with the task, and §15.13 hands the implementer the exact
numbers to report back.

### 15.1 The eight passes — what each one found

| # | Pass | Verdict | Headline finding |
|---|---|---|---|
| 1 | Walk the Tuesday | **fail** | At 10:15 an advocate cannot see which of four courts is calling their matter — three of four tabs are clipped. The one control that answered "which court" is also the control that hides three of them. |
| 2 | Let the domain draw the layout | **fail** | The domain nests day ⊃ court ⊃ matter. The screen nested day ⊃ *one selected* court ⊃ matter, because a tab band was the chrome that happened to be there. |
| 3 | Whose word is on the control? | **fail** | "View access" is a permission model, not something an advocate says. "My vakalatnama" is their word — and it names a per-matter property being used as a global cut. |
| 4 | Break it with real weather | **fail (run by proxy)** | 0 of 4 tabs fully visible at rail-open, 1440px. All four seed courts end in `", Kollam"`. `"6 days overdue · 22 Aug"` wraps at 320px rail. Rail titles get ≈30 chars. Full table in §15.2 P11 and §15.8. |
| 5 | Mark the exception, mute the norm | **fail** | 14 of today's 17 matters carry a green "Ready" badge that means "nothing is wrong". Every prep card carries a status badge. The exception — no vakalatnama — is marked on the queue card and *not at all* on the Now card. |
| 6 | Census the patterns | **fail** | Six patterns enumerated (§15.2 P18). Three surfaces break their own screen's rules: the Now card's persistent button, `TaskCard`'s missing rest-fact, and the list row's separate selection cue. |
| 7 | Sweep the siblings | **fail** | Seven pairs swept (§15.2 P14–P17, P21–P23). "When", "who is on this matter", "selected" and "not on the vakalatnama" each have two or three treatments. Two different components render the avatar stack. |
| 8 | Judge it on the render | **run by proxy — the only pass I could not run myself** | Every finding above that carries a pixel number comes from the measurements supplied with this task, not from my reading of the source. The three questions I could not answer at all — the avatar/beige contrast ratio, whether `accent` is distinguishable from `surface-sunken`, and the post-change first-card offset — are handed to the implementer in §15.13 as measurements to take and report, not as things to assume. |

Two passes produced findings the owner did **not** raise, and both are in the build plan: pass 5's
"Ready" badge (14 marks of the norm) and pass 7's split selection treatment. Two candidate findings
were tested and dismissed — the week strip's grey dot and the concluded strip's denser row form —
and the reasoning is in §15.4 so the next reviewer does not rediscover them as bugs.

### 15.2 Problems (continuing the numbering)

**P11 — The court band fails at the pilot's own N, not at some future N.**
Measured, 1440px, rail open at its 320px default: **zero of four tabs render fully visible**. Rail
closed, the third tab still clips mid-name. The band is `overflow-x-auto`
(`advocate-home.tsx:373`), so its failure mode is *hiding a court's cause list behind a scroll with
no scrollbar affordance*. Compounding it, all four seed courts end in the same establishment —
`"24×7 ON Court, Kollam"`, `"JMFC Court 1, Kollam"`, `"JMFC Court 2, Kollam"`, `"CJM Court, Kollam"`
(`sandbox.ts:151-154`) — so ~40 of the band's characters are one repeated fact. D11 correctly
deleted the English `.replace(", Kollam", "")` that used to hide it, and correctly did not replace
it with another literal; nothing then supplied what the deletion removed. That is P7's unfinished
half.

**P12 — Court was a selector where the domain makes it a container.** Owner, 28 Aug: *"there are
courts, and within the courts you see the cases… date becomes the top filter, then you see the
courts, then you see the cases."* A tab band shows one court and hides the rest; the day's board is
not one court's board. This is pass 2's finding, and it is the reason P11 cannot be fixed by making
the tabs narrower.

**P13 — The access filter cut by a system concept, and hid instead of marking.** `AccessFilter =
"all" | "mine" | "shared"` (`court-board.tsx:33`). "View access" is the permission model's
vocabulary. Worse, holding or not holding the vakalatnama is a **property of one matter** — it
changes the verb on that card's blocker row and nothing else — and it was being used as a **global
cut** that removes matters from the day's cause list. A cause list with matters removed from it is
not a cause list.

**P14 — The rail states one fact three ways, across two panels.**
(a) `TaskCard` gives the single worst-overdue task a `Badge variant="destructive"` and every other
card `DueCue` ink (`companion-rail.tsx:263-270`) — adjacent siblings, two treatments. This is the
owner's rejection and it is D1's own doing.
(b) `PrepCard` gives **every** card a `Badge` — `warning` for "{n} pending", `success` for "Ready"
(`companion-rail.tsx:422-424`). D1 fixed the tasks panel and left the panel next to it untouched. A
sibling sweep across the two panels would have caught that in R1.

**P15 — The two rail panels do not share the frame they appear to share.** `RAIL_CARD` is one
constant (`companion-rail.tsx:128-129`) with `h-24 items-center`; `PrepCard` overrides it locally
with `cn(RAIL_CARD, "items-start py-3")` (`:403`). One card centres its content, the card below it
tops-aligns. The owner named this exactly.

**P16 — "When" lives in two different places in the same rail.** `TaskCard` puts due-ness on body
line 3; `PrepCard` puts it in the `RowAction` rest slot as a two-line block on the right. Both are
"when this matters"; neither is where the other is.

**P17 — Avatar discs are the same fill as the card they sit on.** `TeamAvatar` renders
`bg-surface-sunken` when `onBrand` is not set (`home-bits.tsx:55`); the queue card is
`bg-surface-sunken` (`hearing-cards.tsx:156`). The disc and its card are the same token. The only
separation is `ring-2 ring-card` — a white ring on beige, which is what the owner saw. Two further
facts make it a design defect rather than a contrast accident:
- **The same card gets it right one element over.** `ItemChip` takes `onTint` and steps to
  `bg-card` on any tinted card (`home-bits.tsx:212`), and the queue card passes it
  (`hearing-cards.tsx:161`). One card, two rules for "how does an inset read on this fill".
- **Three call sites, three combinations.** Now card: `onBrand` + `ring-brand-muted`. Queue card:
  neither. List row: `ring-brand-muted` *without* `onBrand` (`hearing-list.tsx:117`) — a
  brand-coloured ring around a beige disc on a brand-tinted row.

**P18 — Pattern census: three surfaces break their own screen's rules.** The screen has six
repeated interaction patterns:

| # | Pattern | Where it holds | Where it breaks |
|---|---|---|---|
| 1 | A repeated row shows a fact at rest and swaps it for its verb on hover **and** focus-within (`RowAction`) | queue card, concluded row, list row, `PrepCard` | **Now card** — a persistent `Button variant="outline"` (`hearing-cards.tsx:97`); **`TaskCard`** — uses `RowAction` but passes no `rest`, so its cell holds a bare chevron while every sibling holds a fact |
| 2 | Status is stated in words + ink, not a chip | `TaskCard` after D1 | `PrepCard`, queue card ("Ready"/"View only"), list `statusCell` |
| 3 | Counts are plain `text-caption tabular-nums text-muted-foreground` | court tabs, access filter, bucket headers | — holds everywhere; the one consistency the screen got right |
| 4 | A collapsed group states its contents on the trigger | concluded strip, rail buckets | — holds |
| 5 | The item number identifies a matter | `ItemChip` on both card types | **Now card states it twice** — the eyebrow says "Now — item {n} · {at}" *and* the chip says "Item {n}" (P19) |
| 6 | Selection is one quiet persistent cue | — | **two cues**: `ring-2 ring-brand-accent` on cards, `bg-surface-sunken` on list rows (P21) |

**P19 — The Now card says the item number twice.** `advHome.nowLabel` = `"Now — item {n} · {at}"`
(`content.ts:182`) sits 60px above an `ItemChip size="lg"` reading "Item {n}"
(`hearing-cards.tsx:69`).

**P20 — "Ready" marks the norm, 14 times.** Of today's 17 seeded matters, only three carry a
blocking task (`c-hd3`, `c-hd5`, `c-hd8` — the three seed tasks with `hearingAt: listedToday(…)`).
The queue card therefore renders `Badge variant="success"` "Ready" on **14 of 17** cards
(`hearing-cards.tsx:182-187`), the list's `statusCell` does the same (`hearing-list.tsx:23-30`), and
`PrepCard` does it again in the rail. A mark present on the overwhelming majority carries no
information; the mark that carries information — a matter with something owed before it — is
already on the card, as the blocker well.

**P21 — Two selection treatments, and the card's uses the wrong token family.** Cards:
`ring-2 ring-brand-accent` (`hearing-cards.tsx:157`, `:65`). List rows: `bg-surface-sunken`
(`hearing-list.tsx:87`). Beyond the split, `ui-craft` §2's loudness ladder reserves brand for
"current / now / today / live" and explicitly says a clicked row "needs a focus ring, not a
selection costume". A brand ring on a selected card is the costume.

**P22 — Two components render "who is on this matter".**
`components/advocate/home-bits.tsx` `AdvocateStack` hand-rolls the discs as `<span>`s;
`components/tasks/advocate-stack.tsx` composes the DS `AvatarGroup` + `Avatar` via
`components/tasks/person-avatar.tsx`. The DS primitive carries the answer to P17 in its own source:
`avatar.tsx:20` gives every disc `after:border after:border-border after:mix-blend-darken`, an edge
that darkens whatever fill it lands on and therefore reads on beige, on brand-muted and on white
alike. The home board reinvented the component and lost the edge.

**P23 — The Now card never says you are not on the vakalatnama.** `NowHearingCard` takes no
`viewOnly` prop (`hearing-cards.tsx:38-52`); `CourtBoard` computes it and passes it only to
`HearingCard` (`court-board.tsx:141`). The one matter being called right now is the one card that
cannot tell you whether you may act on it.

**P24 — The fixture's own comment is out of date, and it is the comment the view-only cases are
read from.** `sandbox.ts:177-179` says Anjali "can see but not act on" `c-hd4`, `c-hd7`, `c-hd12`.
`c-hd15`'s signatories are `["p-dv"]` too (`sandbox.ts:197`) — four, not three. Small, but it is
the list a builder will use to check D19 on the render.

### 15.3 Decisions (Round 4)

**D13 — The court tab band is deleted; the day's courts stack as sections, in cause-list order.**
The board becomes: toolbar row → one `<section>` per court that has matters on the selected day,
each headed by the court's name with its count and, when live, a success dot beside the visible
words "in session". Inside a section, the existing order is unchanged: concluded strip → Now card →
queue.
*Rule:* owner ruling, 28 Aug (date → court → case); pass 2 (domain containment); P11/P12.
*Rejected:* (a) making the tabs scroll better — a scroll that hides a cause list is the defect, not
its presentation; (b) a court `Select` replacing the tabs — that keeps one court visible and only
moves the hiding into a menu; (c) `Accordion` sections — see D16.
*Gives up:* the day is now a scroll rather than four fixed panes. At 17 matters that is ~2.5
screens. §15.9 owns that risk and D16 supplies the navigation.

**D14 — The shared establishment is computed from the data and said once; it is never matched
against a literal.** New pure selector `courtLabelsOf(courts: string[])` in `lib/advocate/home.ts`
returns `{ establishment, shortOf }`. It splits every court name on `", "`, takes the longest
common **trailing** run of segments that leaves at least one leading segment on every court, and
returns that run as `establishment` with `shortOf` stripping it. If there is no such run — one
court, or four unrelated names — it returns `{ establishment: null, shortOf: (c) => c }` and every
header shows the full name.
When an establishment exists, the board's toolbar row carries it once, at the far left, as
"Courts at {place}"; section headers show the short name.
*Rule:* `product-foundation.md` §2 (court naming is a state axis); `national-vs-state.md`; D11.
*Rejected:* a view-layer `replace` (P7, already deleted) and a hardcoded per-state suffix list —
both encode Kerala into a national core.
*Gives up:* the `", "` split is itself a punctuation assumption. It is *safe* — a name that does
not split simply falls through to the full label, which is always correct — but it is not the
durable fix. The durable fix is structured court data (`{ name, establishment }`), and that is
Q7 in §15.11.

**D15 — A court with nothing listed gets no section; the absence is stated in one line.**
Courts the viewer can see that end up with zero matters on the selected day — whether because the
day is empty there or because the advocate switcher filtered them out — are named in a single
caption line at the foot of the board: "Nothing listed in {courts}." The board-level
`Empty` + "next hearing day" jump survives, unchanged, for the case where **every** court is empty.
*Rule:* judgment, reversing §2's defence of the zero-count tab. That defence rested on a tab being
a persistent landmark whose set should not change shape day to day. A stacked section is not a
landmark — it is 200px of scroll — and an `Empty` inside it is a void the reader pays for on the way
past. The fact it carried is worth one line, not one section.
*Gives up:* the per-court "jump to next hearing day" affordance, which only ever made sense at board
level anyway — `nextHearingDayAfter` looks across all courts (`home.ts:234-247`), so a per-court
Empty was offering a global jump from inside one court's panel.

**D16 — Court sections are neither collapsible nor sticky; a jump menu appears at ≥ 3 sections.**
- **Not collapsible.** A collapsed court can hide a listed matter, and on a §138 board a hidden
  listing is the failure mode with the worst consequence — the clocks do not give the day back
  (`product-foundation.md` §3, §5). The concluded strip may hide matters because those have already
  risen; nothing that is still to be called may be hidden behind a control.
- **Not sticky.** A sticky court header is the obvious answer at volume, and it is the wrong first
  answer here: it needs an opaque fill and a seam that appears only when stuck, it becomes the third
  fixed layer under a fixed top bar and beside a sticky rail, and the DS has no sanctioned pattern
  for it (`ds-requests.md` #4 already asks for sticky-header guidance). At 12 matters in the busiest
  pilot court the payoff is small.
- **Jump menu.** When the board renders **3 or more** sections, a `DropdownMenu` ("Jump to court")
  joins the toolbar, listing each section with its count and live dot and scrolling to it. Sections
  carry `scroll-mt-16` so the heading clears the 56px top bar, and the heading takes focus
  (`tabIndex={-1}`) so a keyboard user lands on it rather than at the top of the page.
*Rule:* judgment, with the consequence argument from `product-foundation.md` §3/§5 doing the work on
collapsibility.
*Rejected:* an always-visible jump control (absurd at one section) and a threshold tied to a
measured scroll height (right rule, wrong cost — it needs a resize observer to answer a question
three courts already answer).
*Gives up:* the sticky "which court am I scrolled into" cue. Revisit when a deployment runs more
than ~6 courts on one day, or when the jump menu is observed to be the primary way people move.

**D17 — One brand-tinted Now card **per court section**, not one per board.** Several courts can be
live at 10:30 — that is what a court day is — and each live matter is genuinely *now*.
*Rule:* judgment, decided against `ui-craft` §1.2's "one focal surface per view" and saying so. The
alternative was a second treatment for "live" on the second and subsequent live courts, which fails
the sibling rule the owner has just called out; between one skill guideline and one hard rule about
sibling consistency, the hard rule wins.
*Gives up:* at a moment when two courts are simultaneously live and the section above is short (CJM
lists two matters today), two brand-tinted cards can share a viewport. Mitigated: the court header
carries the live dot and the words "in session", so "which courts are live" is answerable from the
headers alone.

**D18 — The access filter becomes an advocate switcher. There is no separate "everyone" view, and
the rail is not filtered.** (Owner item 2.)
- **Control:** a DS `Select` on the toolbar row, `position="popper" align="start" sideOffset={4}`
  (see `ds-requests.md` #12 — the DS default opens the list over its own trigger). Options are the
  advocates on the matters listed that day; each row is `PersonAvatar` + name + the day's count,
  right-aligned and `tabular-nums`. The trigger shows the avatar and name only — the greeting subline
  already states the total, so a count on the trigger would be the same number twice.
- **Order:** the signed-in advocate first, then the rest alphabetically. Not by descending count:
  a roster that reorders day to day costs the muscle memory that makes a repeat-user control fast.
- **Default:** the signed-in advocate, per the owner. Not persisted — it is a per-session lens, and
  "my matters" is the right thing to land on every morning.
- **Counts:** matters listed on the selected day, across every court, where that advocate is on the
  case (`canView` — on the vakalatnama *or* on the case). Not "their vakalatnama": being on the case
  is what puts a matter on their board.
- **No "everyone" option.** The board only ever contains matters the signed-in user can view
  (`viewableCases`, `home.ts:112-114`), so "everyone" and "you" are the same set by construction.
  Adding an option that duplicates the default is a control that lies about what it does.
- **The rail is untouched.** The switcher filters the board only. The rail lists what is owed on
  matters *you* can see and its footer links to `/tasks`, which is not advocate-filtered; making the
  rail follow the switcher would put a number on this screen that `/tasks` contradicts one click
  later.
*Rule:* owner ruling; pass 3 (the control now speaks the user's vocabulary — names); P13.
*Rejected:* **chips** (the v3 mock's model — they wrap into multiple rows at N and imply
multi-select, and the roster is data-driven and unbounded); **`SegmentedControl`** (the DS reserves
it for "a small, fixed set of mutually exclusive options" — `segmented-control.tsx:10-11`; a court
day's advocate roster is neither small nor fixed); **`Combobox`** as the default (a search field
over five names is chrome for its own sake — but see the note below).
*Gives up:* an honest limitation the owner should know about. Because the world is already scoped to
one viewer, choosing a colleague shows *the matters you and they share*, not their board. In today's
seed that is Deepa 6, Prakash 10, Manoj 4, Rahul 4 out of 17 — useful, and exactly the question "what
is Deepa carrying today" as far as this world can answer it. A true office board needs the world to
carry an office; that is Q8 in §15.11, and the control widens into it without a redesign.
*At N:* above **10** options the builder swaps `Select` for the DS `Combobox`, keeping the same
trigger content and metrics, so the roster stays searchable at establishment scale. That is a
one-line switch, not a second visual idiom.

**D19 — "Not on the vakalatnama" is a quiet mark on the matter's own metadata line, on all three
surfaces; "Ready" is deleted everywhere.** (Owner item 3 + pass 5.)
- **Form:** an `Eye` icon at the line's text size plus the words, in the line's own muted ink —
  `text-muted-foreground` on the queue card and the list row, `text-brand-muted-foreground` on the
  brand-tinted Now card (never grey on a tint — `ui-craft` §2). Not a `Badge`: a badge is a status
  chip in the action zone, and this is a property of the matter, which belongs with the matter's
  other properties.
- **Position:** **first** on the metadata line, before stage and CNR. That is deliberate: the line
  truncates, and the fact that must never be the first thing lost is whether you may act.
- **Wording:** "Not on the vakalatnama" (ml "വക്കാലത്തിൽ ഇല്ല"), replacing "View only". "View only"
  reads as a UI mode; the owner's own framing is *"you are a non-vakalat holder in the case"*, and
  vakalatnama is the word an advocate says. Holding it says nothing, per the owner.
- **Surfaces:** Now card (P23 — it did not have this at all), queue card, list row. One treatment,
  three surfaces.
- **"Ready" is deleted** from the queue card, the list `statusCell` and `PrepCard`. A card with
  something owed shows the blocker well; a card with nothing owed is silent. That removes 14 green
  badges from today's board and one from every prep card.
*Rule:* owner item 3; pass 5 (mark the exception, mute the norm); `ui-craft` §1.4 (one status cue per
row) and §2 (3–4 chips on one card row is a cheap tell).
*Rejected:* keeping the badge and only softening it to `outline` — it still occupies the action zone
and still races the removed "Ready" for one slot, which is how a view-only matter that was ready
used to lose its ready mark (`hearing-cards.tsx:177-187`, an `if/else if` on two unrelated facts).
*Gives up:* "Ready" as a positive confirmation. If the owner wants it back, the reversal is cheap and
the condition is stated: restore it only if a deployment's typical day has *more* blocked matters
than clear ones, which would make clear the exception.

**D20 — One rail frame, top-aligned; one due treatment; "when" in the same place in both panels.**
(Owner item 4.)
- The badge-on-worst goes. `worstOverdue` is deleted from `lib/advocate/home.ts` and its call site.
  Every task states its due-ness the same way.
- `RAIL_CARD` becomes `min-h-24 items-start py-3`; `PrepCard`'s local `cn(RAIL_CARD, "items-start
  py-3")` override disappears. One constant, two panels, no way to drift again — this is the
  structural fix, not a patch on one card.
- **"When" moves to the `RowAction` rest slot in both panels**, as a shared two-line block: the
  relative phrase (`font-medium`, `whitespace-nowrap`, `text-destructive-ink` when overdue and
  `text-muted-foreground` otherwise) over the absolute date (`text-caption text-muted-foreground`).
  `dueCueOf` already returns `{ primary, date }` as separate fields (`format.ts:69-86`), so the
  two-line split is native and the string that wrapped at 320px (P14/D7) cannot wrap by
  construction. This is also where every *other* repeated row on this screen puts its time.
- **How the most urgent still leads, honestly:** it does not lead by position, and the brief will not
  pretend otherwise. `railTasks` sorts blocking-first (`home.ts:256-258`, shared with `/tasks`), so
  the longest-overdue task can sit third in the "Due today" bucket. Changing that sort would make the
  rail disagree with the page its own footer links to — a worse sibling break than the one being
  fixed. What leads is the ink: within a bucket, "41 days overdue" in `destructive-ink` is the only
  mark of that weight, and it is now the only red on the panel.
- `PrepCard`'s badge becomes an exception line: `"{n} pending"` in `text-warning-ink` as a third body
  line **only when blockers exist**; nothing at all when there are none.
*Rule:* owner item 4; pass 7; `ui-craft` §1.4 and §2; the `DueCue` docstring's own rule.
*Gives up:* the due cue is hidden while the pointer is on the card, because `RowAction` swaps rest for
verb. On a deadline product that is a real cost, and it is accepted only because it is the
established behaviour of every other row on this screen and the owner has just endorsed that
behaviour for the Now card. §15.9 owns it.

**D21 — The avatar discs compose the DS `Avatar`; fill and ring are derived from one `surface`
prop.** (Owner item 5.)
- `TeamAvatar` is deleted from `home-bits.tsx`. `AdvocateStack` renders DS `AvatarGroup` +
  `PersonAvatar` (`components/tasks/person-avatar.tsx`, which already composes DS `Avatar` +
  `AvatarFallback`) + `AvatarGroupCount`. That gives every disc the DS's own separator —
  `after:border after:border-border after:mix-blend-darken` (`avatar.tsx:20`) — an edge that darkens
  whatever it lands on and therefore works on beige, on brand-muted and on white without a
  per-surface token.
- **One prop, `surface: "card" | "sunken" | "brand"`**, derives both halves and makes P17's mismatch
  class unrepresentable: the disc fill is one step *off* the surface (`bg-surface-sunken` on white;
  `bg-card` on sunken and on brand), and the overlap ring equals the surface
  (`ring-card` / `ring-surface-sunken` / `ring-brand-muted`) so it punches a clean hole rather than
  drawing a white line. `ItemChip` takes the same prop and the same vocabulary, replacing its
  `onTint` boolean — the two insets in one card can then never disagree again.
- `AvatarGroup`'s own `*:data-[slot=avatar]:ring-background` must be overridden per surface with a
  static class map (Tailwind cannot take a dynamic token in an arbitrary variant). `AvatarGroupCount`
  follows the same fill rule.
- Overlap stays **4px** (`-space-x-1`), not the DS default 8px: two-letter initials sit dead centre
  and a deeper overlap covers the thing the disc exists to say. `components/tasks/advocate-stack.tsx`
  already made this exact override and documented the reason — the home stack now agrees with it
  instead of hand-rolling `-ml-1`.
- `max` stays 3 on cards, 2 in the table.
*Rule:* owner item 5; `avatar.tsx:20` (the DS's own answer); AGENTS.md rule 3 ("reuse before
creating"); pass 7.
*Rejected:* thickening the white ring (it is the wrong colour, not the wrong weight — the DS's edge
solves both); spacing the discs apart (it costs the row width the stack exists to save and does not
help a single disc read on beige).
*Not done, deliberately:* merging `components/advocate/home-bits.tsx`'s stack with
`components/tasks/advocate-stack.tsx` into one component. They will look identical after this change
and the duplication (P22) stays real, but a shared component needs a neutral folder and a shared
`TeamMember` type that currently lives in `lib/advocate/home.ts`, and that refactor is larger than
the defect. Recorded as a follow-up in §15.11 Q10 rather than smuggled into a visual round.
*Verification is the implementer's:* §15.13 asks for a measured contrast sample of the disc fill and
its edge against `surface-sunken`, in both themes, before this is called done.

**D22 — The Now card joins the pattern: `RowAction` with the listed time at rest, and the eyebrow
stops repeating the item number.** (Owner item 6 + P19.)
- The persistent `Button variant="outline"` goes. The cluster becomes `AdvocateStack` +
  `RowAction label="View case" rest={the listed time}`. The card's row div gains `group/row` —
  `RowAction` depends on it and `NowHearingCard` does not have it today.
- **What sits in the cell at rest, honestly:** the listed time, in `text-body-compact tabular-nums
  text-brand-muted-foreground`. That is the same fact the queue cards and the concluded rows hold at
  rest, so the pattern is now identical across every repeated row on the board. It is only available
  because the eyebrow gives it up: `nowLabel` drops from `"Now — item {n} · {at}"` to `"Now"`. Each
  fact then appears exactly once — state on the eyebrow, item on the chip, time in the rest cell,
  verb on hover.
- The card stays clickable in full: the title button's `after:absolute after:inset-0` overlay covers
  the whole `Card` and is what a touch user taps.
*Rule:* owner item 6; pass 6 (pattern census); `ui-craft` §2 ("repeated rows: at rest, content +
ONE status cue; actions reveal on hover **and** focus-within").
*Rejected:* leaving the eyebrow intact and putting a chevron in the rest cell — that keeps P19's
double statement and gives the day's most important card the least informative rest state on the
board.
*Gives up:* the R1–R3 argument that the live matter's action should not hide behind a pointer. It was
a defensible argument and it lost to a better one: a screen with six patterns and one exception
teaches the exception, not the pattern.

**D23 — One selection treatment across the board and the table: a neutral inset bar.**
Selected card and selected list row both take a 2px neutral bar at the left edge —
`before:absolute before:inset-y-4 before:-left-2 before:w-0.5 before:rounded-full before:bg-border`
on the `Card`, and the same on the list row's first `td` (which takes `relative`). The
`ring-2 ring-brand-accent` goes; the list row's `bg-surface-sunken` goes.
*Rule:* `ui-craft` §2 loudness ladder — selection is ONE quiet persistent cue, and brand fill means
"current / now / today / live", never "selected"; pass 6/7 (P21).
*Note:* this is the same idiom the rail strip already uses for its active section
(`companion-rail.tsx:551-556`), in neutral instead of brand — so the screen gains a pattern rather
than inventing one. `ui-craft`'s "coloured `border-l` on a tinted panel" cheap-tell is about a
*coloured* bar; `border` is the DS's structural neutral and this is not that tell.
*Rejected:* `bg-accent-strong` as the selected fill (AGENTS.md rule 10's named "selected" token) —
the queue card already hovers to `accent-strong`, and demoting hover to plain `accent` on a
`surface-sunken` card risks an invisible hover, which is the exact failure AGENTS.md rule 10 exists
to prevent. The bar avoids the collision entirely. If the implementer's sampling in §15.13 shows
`accent` is clearly distinguishable from `surface-sunken`, the fill route becomes available and is
the better long-term answer — record the measurement either way.
*Gives up:* the selected list row is quieter than it was.

**D24 — The "Up next" / "In list order" caption is cut.** Once every court's matters sit under a
court heading, a second heading between the Now card and the queue is a label on a list whose order
is already stated by the `ItemChip` on every card. Cutting it also pays for most of the court header
it sits under.
*Rule:* the Chanel pass; judgment.
*Gives up:* the explicit words "in list order" on a board with no live matter. The item numbers say
it, and cause-list order is never resequenced (constraint 3), so nothing can contradict them.

**D25 — Hover-revealed row actions get no always-visible touch fallback, and here is the audit that
says why.** `ui-craft` §5 requires hover-revealed clusters to be always visible on
`pointer-coarse`. `RowAction` is not, and should not be, because on every surface that uses it the
action is *also* available from an always-visible target: the queue card, Now card, concluded row
and both rail cards put `after:absolute after:inset-0` on the row's title button, so the whole card
is the tap target; the list row's parties cell is itself a visible button. The revealed button is
`aria-hidden tabIndex={-1}` and duplicates that target. So the DS Law that matters — the Laws page's
"critical actions only on hover" defect, and RESPONSIVE.md rule 7 — is not breached: no action is
*only* behind hover.
*Logged as a deliberate deviation from the skill's checklist item*, with the reason, per `ui-craft`
§0. The alternative (a permanently visible button on every repeated row) trades a non-existent a11y
bug for permanent clutter, which §0 names explicitly as the wrong trade.

**D26 — The stacked board costs ~33px of reach, and objective 2 moves rather than the structure.**
R3 measured the first card at 336px. R4's structure replaces a 41px tab band with a 53px toolbar row
and adds a ~28px court heading, and pays ~32px back by cutting the "Up next" caption and its gap
(D24) — landing at **~369px** with a concluded strip present in the first court, ~309px without one.
*Rule:* arithmetic (§15.7), owner ruling on structure.
*Gives up:* 33px, knowingly. It buys the day's four courts being visible at once instead of one.
Objective 2 is restated, not quietly missed — §3.

### 15.4 What I cut in Round 4 (and why)

- **Sticky court headers.** D16. The obvious answer at volume; the wrong first answer here, and the
  DS has no sanctioned pattern for it (`ds-requests.md` #4).
- **Collapsible court sections.** D16. A collapsed court can hide a listed matter, and the clocks do
  not give a day back.
- **An "everyone" option on the advocate switcher.** D18. It would duplicate the default and
  therefore lie about what it does.
- **Reordering the rail's tasks so the worst overdue leads.** D20. It would put the rail out of step
  with `/tasks`, which is a worse sibling break than the one being fixed.
- **Merging the two `AdvocateStack` components.** D21. Real duplication (P22), deferred with its
  reason and a follow-up.
- **A flattened list view with a Court column.** The list view stays one table per court section, so
  the two layouts share one mental model. The flattened form is the right answer at Gujarat volume
  and belongs with Q4/Q9, not in a round about structure.
- **A permanently visible row action for touch.** D25.
- **Dropping the week strip's grey "matters listed" dot.** *Tested against pass 5 and kept.* The
  grey dot is near-universal in the seed, which looks like marking the norm — but on this strip the
  informative signal is the *absence* of a dot (a day with nothing listed), and absence is only
  legible if presence is marked. The amber dot on top of it marks the real exception, and D10 already
  gave both dots words. Recorded so the next reviewer does not re-open it.
- **Unifying the concluded strip's rows with the queue cards.** *Tested against pass 7 and kept
  apart.* The concluded rows state item number as text and time as `text-caption` where the queue
  card uses `ItemChip` and `text-body-compact`. That is a density difference justified by role — a
  closed pile of risen matters — not a treatment difference for the same fact at the same weight.
- **Changing the seed to make the advocate switcher's default look different from "everyone".** It
  cannot be done: the world is viewer-scoped, so no fixture can separate them (D18). Faking it would
  have been the worst kind of fix — a demo that proves a behaviour the product does not have.

### 15.5 Layout & hierarchy after Round 4

**Column, top to bottom, at ≥ `@3xl` (board ≈ 808px at 1440 with the rail open):**

1. Greeting + week strip on one row. **Unchanged** — the date level is already the top filter the
   owner described, and nothing in R4 touches it except that its matter count now follows the
   advocate switcher.
2. **Board toolbar** — one row, `border-b border-hairline`: `"Courts at {place}"` caption (when a
   common establishment exists, D14) · advocate switcher (D18) · "Jump to court" menu (D16, at ≥ 3
   sections) · then `ml-auto` the Cards/List `SegmentedControl`. The two groups are separated by
   role: what the board *contains* on the left, how it is *drawn* on the right.
3. **The court stack** — `gap-8` between sections. Per section: court header (name · count · live dot
   + "in session") → concluded strip (when non-empty) → "Now" eyebrow + brand-tinted Now card (when
   live) → the beige queue. `gap-4` inside a section, `gap-3` between queue cards.
4. **"Nothing listed in {courts}."** — one caption line at the foot, when any visible court came up
   empty (D15).

**Focal point:** one brand-tinted Now card per court section (D17), and no `bg-primary` action
anywhere on the screen — still correct, still do not add one to balance the view.

**Above the fold on a phone (375px):** greeting (stacked) → week strip (horizontally scrollable) →
toolbar (wrapped to two lines: switcher + jump on one, layout control on the next) → first court
header → first matter. The rail is absent by decision (D9). The stack is strictly better than the tab
band here: a section header is a block element that **wraps**, where a tab is an inline element that
**clips**.

### 15.6 Components after Round 4 (DS name → region)

| Region | DS component | Change in R4 |
|---|---|---|
| Board toolbar — advocate switcher | **`Select`** (`SelectTrigger` / `SelectContent position="popper"` / `SelectItem`), `Combobox` above 10 options | new (D18) |
| Board toolbar — court jump | **`DropdownMenu`** + `Button variant="outline"` | new, conditional (D16) |
| Board toolbar — layout | `SegmentedControl size="compact"` | unchanged |
| Court section header | native `<section>` / `<h2>` — no DS component needed | new (D13) |
| Concluded group | `Collapsible` | unchanged, now per section |
| Now card | `Card` on `bg-brand-muted` | contents only (D19, D22) |
| Queue cards | `Card` on `bg-surface-sunken` | badges removed (D19), selection (D23), avatars (D21) |
| Row action, every repeated row | `RowAction` (local, over `Button size="xs"`) | now used on the Now card too (D22) |
| Avatars | **`Avatar` / `AvatarFallback` / `AvatarGroup` / `AvatarGroupCount`** via `PersonAvatar` | replaces hand-rolled spans (D21) |
| List view | `Table`-shaped markup in `overflow-x-auto` | status cell, view-only mark, selection (D19, D23) |
| Rail cards, both panels | one local `RAIL_CARD` frame + `RowAction` + `DueCue` | unified (D20) |
| Board empty / filtered-empty / error | `Empty` (+ media, title, description) | filtered-empty rewritten for the switcher |

**No new component is proposed.** Every region above exists in
`vendor/pucar-design-system/src/components/ui/`, and `select.tsx`, `dropdown-menu.tsx`,
`combobox.tsx` and `avatar.tsx` are all already synced into `apps/dristi-app/src/components/ui/`.

### 15.7 Spacing and the reach ledger

Ladder only. New or changed values:

| Where | From | To | Why |
|---|---|---|---|
| board column (`advocate-home.tsx`) | — | `flex flex-col gap-8` between court sections | DS section-break default (AGENTS.md 7a: "section gaps `gap-8`+") |
| inside a court section (`court-board.tsx:75`) | `gap-4 pt-4 pb-8` | `gap-4` (the column now owns the outer padding) | unchanged rhythm |
| toolbar row | tab band `pt-2 … pb-3` | `pb-3` only, control sets the 40px height | 53px total incl. rule |
| court section | — | `scroll-mt-16` | clears the 56px top bar on jump (D16) |
| rail card (`RAIL_CARD`) | `h-24 items-center` | `min-h-24 items-start py-3` | one frame, both panels (D20) |
| selection bar | `ring-2` | `before:inset-y-4 before:-left-2 before:w-0.5` | D23 |

**Reach ledger (1440px, nav expanded, rail open at 320 + 56 strip → board 808px, ≥ `@3xl`):**

| Band | px |
|---|---:|
| shell top bar | 56 |
| `pt-6` | 24 |
| greeting row (week cell sets it) | 68 |
| `pb-4` | 16 |
| toolbar row (40 control + `pb-3` + 1px rule) | 53 |
| board `pt-4` | 16 |
| court header (`text-title-s`, 20/28) | 28 |
| `gap-4` | 16 |
| concluded strip (8px peek + `py-2` + 20) | 44 |
| `gap-4` | 16 |
| "Now" eyebrow + `gap-3` | 32 |
| **Now card top edge** | **≈ 369** |

Without a concluded strip in the first court: **≈ 309**. R3 measured 336 with three of four courts
hidden. The 33px is D26's, and it is bought, not lost.

**Colour budget at rest, after R4** — count it out loud in the build report:
destructive marks = 1 (the rail strip's solid "27") + 1 (notifications "3") + the nav spark = **3, of
which 2 are shell chrome this brief does not own**. The board itself has **zero** destructive marks;
the rail panel has ink only. Amber marks = the "Due today" bucket header + the week strip's amber
dots. Green marks = the live dot on a live court header and on the Now eyebrow — **down from 14
"Ready" badges plus the prep panel's**.

### 15.8 States (Round 4)

Every data-driven region, stressed at N, at zero, at the longest real string, and in Malayalam.

| Region | Zero | At N | Longest real string | `ml` |
|---|---|---|---|---|
| Court stack | no court has matters → board `Empty` + "next hearing day" jump (unchanged) | 3 courts today; sections stack, jump menu appears at ≥3; at 12+ the jump menu is the primary navigation | header wraps (block element) — this is the whole point of D13 | header wraps; `courtLabelsOf` returns `establishment: null` if the ml names do not share a trailing run, and every header then shows the full name — never a mangled one |
| Empty court | omitted; named in the foot line (D15) | foot line lists several, comma-joined; at >4 it should read as a sentence — verify the join at 375px | — | bilingual key `nothingListedIn` |
| Advocate switcher | never empty — the signed-in advocate is always present | 5 today; `Select` to 10, `Combobox` above (D18) | long names truncate in the trigger (`min-w-48`, `truncate`); the menu row keeps the full name | ml row labels are the `switcherYou` wrapper only; names are data and stay as stored |
| Board under a colleague filter | 0 matters → `Empty` with "Nothing listed for {name}" + a "Show your matters" button that resets to self | subset of the day | — | bilingual |
| Queue per court | section omitted | ON runs 12 today; unbounded at Gujarat volume → Q4/Q9 | parties `text-balance` wraps to 2 lines at 808px board | ml stage names ~1.5–2× longer; the metadata line `truncate`s from the right, and D19 puts the vakalatnama mark first so it is never the first thing lost |
| Avatar stack | `null` when the viewer is the only advocate (`c-hd9` today) | `max=3` then `+n`; tooltip names the rest | initials are always 2 chars | unaffected |
| Rail task cards | panel empty state (unchanged) | scrolls; the panel is 7-day-scoped and says so (D10) | title `truncate` (≈30 chars at 320px) with a `title` attribute; **line 3 is gone — "when" is a two-line right block that cannot wrap** (D20) | ml task titles are data and stay English, per the file's own rule |
| Rail prep cards | panel empty state (unchanged) | same frame as task cards after D20 | `stNumber · stage` truncates | as above |
| Concluded strip | not rendered | trigger names every item number — at 8+ risen matters the join gets long; it already `flex-1` truncates | — | bilingual `concludedStrip` |
| Week strip | fixed 7 | fixed 7 | — | ml weekday abbreviations via `Intl` |
| Loading / error | unchanged from D12 — spinner vs `Empty` + retry | | | |

**Focus and keyboard.** The jump menu moves focus to the target `<h2 tabIndex={-1}>`, not just the
scroll position. The advocate `Select` is a DS `Select` and keeps its typeahead — give each
`SelectItem` a `textValue` of the plain name, because the item's children are rich (avatar + name +
count) and typeahead reads text content. `RowAction`'s `group-focus-within` reveal must survive on the
Now card, which means the new `group/row` goes on the row div that contains both the title button and
the action.

### 15.9 Risks accepted (Round 4)

- **Two live courts can put two brand-tinted cards in one viewport.** D17. Accepted; the court
  headers carry the live state independently.
- **The day is a scroll, not four panes.** D13. At 17 matters it is ~2.5 screens; the jump menu is
  the answer up to the volume where Q9 takes over.
- **The due cue is hidden while the pointer is on a rail card.** D20/D25. Accepted because it is the
  screen's established behaviour and the owner endorsed it; the fact is one keyboard-tab or one
  pointer-move away, and the card's own ink is the thing that leads the panel.
- **Choosing a colleague shows shared matters, not their board.** D18. Accepted and stated in the
  brief rather than hidden in the control; Q8 is the durable fix.
- **The establishment split is punctuation-based.** D14. Safe by construction (it falls through to
  full names), not durable; Q7.
- **"Ready" is gone.** D19. If a deployment's normal day is mostly blocked, the mark should come
  back — the reversal and its condition are written down.
- **The selected list row is quieter than it was.** D23.
- **~33px of reach.** D26.
- **This brief still has not been gate-verified or seen on a render.** Pass 8 ran by proxy. §15.13
  is the list of things the implementer must measure before calling any of this done.

### 15.10 Round 4 build plan — per file, current → proposed

Run `npm run check:ds-fresh` **first**. Load `ui-craft` and `pull-ui-from-ds`. After:
`check:tokens && check:typography && check:ui-sync && check:rails`, then `ui-craft` §5 on the
**render**, both themes, 1440 and 375. Nothing below requires `sync:ui` — every DS component named is
already in `apps/dristi-app/src/components/ui/`.

#### 15.10.1 `lib/advocate/home.ts`

| # | Current | Proposed |
|---|---|---|
| a | `worstOverdue(world, now)` (`:316-330`) | **delete**, with its docstring. No test references it (`home.test.ts` has no case for it). |
| b | — | **add** `courtLabelsOf(courts: string[]): { establishment: string \| null; shortOf: (court: string) => string }`. Split each name on `", "`; find the longest common trailing run of segments such that every court retains ≥1 leading segment; return it joined by `", "` with `shortOf` stripping `", " + run`. Return `{ establishment: null, shortOf: identity }` when there are fewer than 2 courts or no such run. Pure; no locale, no literal. |
| c | — | **add** `export type AdvocateOption = { person: Person; count: number; you: boolean }` and `advocateRosterOn(world, dayKey, now): AdvocateOption[]`. Collect every hearing on `dayKey` across `courtRooms`; for each, walk `advocatesOf(kase, world.people)`; count per person using `canView(person.id, kase)`. Return the signed-in advocate first (count = every listed matter), then the rest sorted by `person.name`. |
| d | — | **add** `hearingsForAdvocate` is *not* needed — the view filters with `canView(whose, h.kase)` directly, reusing `lib/tasks/permissions`. Do not add a fourth predicate for a rule that already has one. |

**Tests to add to `home.test.ts`** (the file already pins the clock and builds a world):
`courtLabelsOf` — four Kollam courts → `establishment: "Kollam"`, `shortOf("JMFC Court 1, Kollam") ===
"JMFC Court 1"`; two courts with no shared tail → `null` and identity; one court → `null` and
identity; a court that is *only* the establishment (`"Kollam"`) → `null` (the ≥1-leading-segment
guard). `advocateRosterOn` — the signed-in advocate first with the full day count; a colleague's
count equals the matters they share; ordering after self is by name.

#### 15.10.2 `lib/advocate/content.ts`

**Add** (bilingual; ml flagged for native review — Q6):

| Key | en | ml |
|---|---|---|
| `whoseMatters` | Whose matters | ആരുടെ വിഷയങ്ങൾ |
| `switcherYou` | {name} (you) | {name} (നിങ്ങൾ) |
| `courtsAt` | Courts at {place} | {place}-ലെ കോടതികൾ |
| `jumpToCourt` | Jump to court | കോടതിയിലേക്ക് പോകുക |
| `nothingListedIn` | Nothing listed in {courts} | {courts}-ൽ ഒന്നും പട്ടികയിലില്ല |
| `notOnVakalatnama` | Not on the vakalatnama | വക്കാലത്തിൽ ഇല്ല |
| `showYourMatters` | Show your matters | നിങ്ങളുടെ വിഷയങ്ങൾ കാണിക്കുക |
| `emptyAdvocateTitle` | Nothing listed for {name} | {name}-ന് ഒന്നും പട്ടികയിലില്ല |
| `emptyAdvocateBody` | No matters listed on this day where {name} is on the case. Switch back to your own matters to see the full board. | ഈ ദിവസം {name} കേസിലുള്ള വിഷയങ്ങളൊന്നും പട്ടികയിലില്ല. മുഴുവൻ ബോർഡ് കാണാൻ നിങ്ങളുടെ വിഷയങ്ങളിലേക്ക് മടങ്ങുക. |

**Change:** `nowLabel` from `"Now — item {n} · {at}"` / `"ഇപ്പോൾ — ഇനം {n} · {at}"` to `"Now"` /
`"ഇപ്പോൾ"` (D22). Its call site moves from `fillCopy` to `pick`.

**Delete** (all become unreferenced — grep to confirm before removing): `filterAll`, `filterMine`,
`filterShared`, `filterLabel`, `viewOnly`, `emptyMineTitle`, `emptyMineBody`, `emptySharedTitle`,
`emptySharedBody`, `emptyFilterTitle`, `emptyFilterBody` (replaced by `emptyAdvocate*`), `ready`
(D19 removes its three call sites), `upNext`, `inListOrder` (D24).

#### 15.10.3 `components/advocate/advocate-home.tsx`

| # | Current | Proposed |
|---|---|---|
| a | `Tabs / TabsList / TabsTrigger / TabsContent` (`:361-432`), `courtId` state (`:206-207`) | **delete all of it**, and the `tabs` import. |
| b | `access` state + `filterBoard`'s access branch (`:193, :209-223`), `accessCounts` (`:244-247`) | replace with `const [whose, setWhose] = React.useState<PersonId>(userId)` (not persisted) and `filterBoard` keeping `canView(whose, h.kase)`. `accessCounts` → `roster = advocateRosterOn(world, selectedDay, now)`. |
| c | `BoardControls` (`:76-145`) | rename **`BoardToolbar`**; props `{ locale, roster, whose, onWhoseChange, sections, courtLabels, onJump, view, onViewChange }`. Renders, in order: the `courtsAt` caption when `courtLabels.establishment`; the advocate `Select`; the "Jump to court" `DropdownMenu` when `sections.length >= 3`; then `ml-auto` the existing layout `SegmentedControl` unchanged. Row: `flex flex-wrap items-center gap-2 border-b border-hairline px-4 pb-3 md:px-8`. |
| d | advocate `Select` | `SelectTrigger` carries explicit children (`PersonAvatar size="sm"` + truncating name) rather than `SelectValue`, `aria-label={pick(advHome.whoseMatters, locale)}`, `className="w-fit min-w-48"`. `SelectContent position="popper" align="start" sideOffset={4}` (`ds-requests.md` #12). Each `SelectItem` gets `textValue={person.name}` and renders avatar · name (`switcherYou` for self) · `ml-auto` count in `text-caption tabular-nums text-muted-foreground`. Above 10 options use `Combobox` with the same trigger content. |
| e | jump menu | `DropdownMenuItem onSelect` → `document.getElementById(courtSectionId(court))` → `scrollIntoView({ behavior: "smooth", block: "start" })` then `.querySelector("h2")?.focus()`. `courtSectionId(court) = "court-" + encodeURIComponent(court)` — one exported helper, used by both the menu and the section. |
| f | board rendering | `<div className="flex flex-col gap-8 px-4 pt-4 pb-8 md:px-8">` containing one `<CourtBoard>` per section. Sections = `rooms` with a post-filter count > 0. |
| g | per-court `Empty` lived in `court-board.tsx` | **board-level now**: when no section has matters, render the existing day `Empty` + `jumpNext` button (unchanged copy) if `whose === userId`, else the `emptyAdvocate*` `Empty` with a `showYourMatters` button calling `setWhose(userId)`. |
| h | — | after the sections, when any visible court came up empty: `<p className="pt-2 text-caption text-muted-foreground">{fillCopy(advHome.nothingListedIn, locale, { courts })}</p>`, `courts` joined with `", "` using `courtLabels.shortOf`. |
| i | greeting block | unchanged. `visibleMatterCount` keeps its existing wiring and now follows the switcher. |

#### 15.10.4 `components/advocate/court-board.tsx`

| # | Current | Proposed |
|---|---|---|
| a | props `{ world, locale, board, access, view, selectedCaseId, onOpenCase, onAct, jump, onJump }` | `{ world, locale, room, label, board, view, selectedCaseId, onOpenCase, onAct }`. `AccessFilter` type and its export **deleted**; `BoardView` stays. |
| b | `Empty` branches (`:82-112`) | **deleted** — board-level now (15.10.3g). `CourtBoard` is only rendered for a court that has matters. |
| c | root `<div className="flex flex-col gap-4 pt-4 pb-8">` | `<section id={courtSectionId(room.court)} aria-labelledby={headingId} className="flex scroll-mt-16 flex-col gap-4">` |
| d | — | **court header**, first child: `<header className="flex flex-wrap items-center gap-2">` → live dot (`size-2 rounded-full bg-success`, `aria-hidden`) when `room.live` · `<h2 id={headingId} tabIndex={-1} className="text-title-s font-semibold outline-none">{label}</h2>` · count in `text-caption tabular-nums text-muted-foreground` · when live, the **visible** words `pick(advHome.inSession, locale)` in `text-caption font-medium text-success-ink`. The words replace today's `sr-only` "in session" on the tab — the live dot stops meaning by colour alone (Laws / AGENTS.md rule 7). |
| e | `"Up next"` / `"In list order"` `<h2>` (`:127-132`) | **deleted** (D24). The `<ul>` keeps `flex flex-col gap-3`. |
| f | `<NowHearingCard>` | pass `viewOnly={!holdsVakalatnama(world, now.kase)}` (P23). |
| g | `HearingList` | unchanged call; it renders inside the section like the cards do. |

#### 15.10.5 `components/advocate/hearing-cards.tsx`

**`NowHearingCard`**

| # | Current | Proposed |
|---|---|---|
| a | eyebrow `fillCopy(advHome.nowLabel, …, { n, at })` (`:57-60`) | `pick(advHome.nowLabel, locale)` — "Now". Dot and `text-caption font-semibold text-success-ink` unchanged. |
| b | row div `className="relative flex flex-wrap items-start gap-4"` (`:68`) | add `group/row` — `RowAction`'s reveal depends on it. |
| c | stage line (`:84-86`) | `flex min-w-0 items-center gap-1.5 truncate text-body text-brand-muted-foreground`; when `viewOnly`, prefix `<Eye aria-hidden className="size-4 shrink-0" />` + `pick(advHome.notOnVakalatnama, locale)` + a `·` separator, then the stage (D19). |
| d | `<AdvocateStack … onBrand ring="ring-brand-muted" />` (`:91-96`) | `<AdvocateStack locale team surface="brand" />` (D21). |
| e | `<Button variant="outline" size="sm" onClick={onOpenCase}>View case</Button>` (`:97-99`) | `<RowAction label={pick(advHome.viewCase, locale)} onClick={onOpenCase} className="relative z-10" rest={<span className="text-body-compact tabular-nums text-brand-muted-foreground">{timeOf(hearing.at)}</span>} />` (D22). |
| f | `<ItemChip item size="lg" onTint />` | `<ItemChip item size="lg" surface="brand" />` (D21). |
| g | `selected && "ring-2 ring-brand-accent"` (`:65`) | the D23 inset bar. |
| h | new prop | `viewOnly?: boolean`. |

**`HearingCard`**

| # | Current | Proposed |
|---|---|---|
| i | the `viewOnly ? Badge : hearing.ready ? Badge : null` block (`:177-187`) | **deleted**, with the `Badge`, `Eye` and `CircleCheck` imports it alone needed (`CircleCheck` is still used by `ConcludedStrip`). |
| j | metadata line (`:172-175`) | `flex min-w-0 items-center gap-1.5 truncate text-body-compact text-muted-foreground`; `viewOnly` prefix as in (c) with `size-3.5`; then stage · `<span className="font-mono">{cnr}</span>` (D19). |
| k | `<ItemChip item onTint />` | `surface="sunken"`. |
| l | `<AdvocateStack locale team />` (`:189`) | `surface="sunken"` (D21) — this is the owner's item 5 on the card that prompted it. |
| m | `selected && "ring-2 ring-brand-accent"` (`:157`) | the D23 inset bar. |
| n | `RowAction` with the listed time | unchanged — it was already right, and is now what the Now card copies. |
| o | blocker well | unchanged. |

**`ConcludedStrip`** — unchanged.

#### 15.10.6 `components/advocate/hearing-list.tsx`

| # | Current | Proposed |
|---|---|---|
| a | `statusCell` (`:14-32`) | drop the `hearing.ready` branch and the `success` `Badge`; keep the `warning` "N blocking tasks" badge; return `null` otherwise (D19). |
| b | parties cell second line (`:102-104`) | prepend the `viewOnly` mark (`Eye size-3.5` + `notOnVakalatnama` + `·`) at `text-caption`, computed with `holdsVakalatnama(world, hearing.kase)` (D19). |
| c | `selected && "bg-surface-sunken"` (`:87`) | delete; first `<td>` takes `relative` and, when selected, the D23 inset bar. Row hover `hover:bg-accent` unchanged; the now row keeps `bg-brand-muted`. |
| d | `<AdvocateStack … ring={now ? "ring-brand-muted" : "ring-card"} />` (`:113-118`) | `surface={hearing.status === "now" ? "brand" : "card"}` — one prop, no mismatch (D21). |

#### 15.10.7 `components/advocate/home-bits.tsx` and `components/tasks/person-avatar.tsx`

| # | Current | Proposed |
|---|---|---|
| a | `TeamAvatar` (`home-bits.tsx:26-69`) | **deleted**. |
| b | `PersonAvatar` (`person-avatar.tsx`) | add `surface?: "card" \| "sunken" \| "brand"` (default `"card"`). Fallback fill: `surface === "card" ? "bg-surface-sunken" : "bg-card"`. `you` keeps `bg-brand-muted text-brand-muted-foreground` and is only reachable where `surface === "card"` (boards drop self — D3), so the brand tint can never land on a brand card. Everything else unchanged; the DS `Avatar`'s `after:border-border mix-blend-darken` edge is the separator (D21). |
| c | `AdvocateStack` (`home-bits.tsx:83-146`) | same public shape minus `onBrand`/`ring`, plus `surface`. Renders `<AvatarGroup className={cn("w-fit -space-x-1", RING[surface])}>` with a static map `RING = { card: "*:data-[slot=avatar]:ring-card", sunken: "*:data-[slot=avatar]:ring-surface-sunken", brand: "*:data-[slot=avatar]:ring-brand-muted" }`; each disc a `PersonAvatar size="default" surface={surface}` wrapped in the existing per-person `Tooltip` (`teamHoldsVakalatnama` / `teamCaseAccess` labels — keep them, they are the only place the vakalatnama/access distinction is named on a card). The `+n` uses `AvatarGroupCount` with the same fill rule. `includeSelf` and `max` unchanged; still returns `null` when nobody remains. |
| d | `ItemChip` `onTint?: boolean` (`:198-226`) | `surface?: "card" \| "sunken" \| "brand"`; fill `surface === "card" ? "bg-surface-sunken" : "bg-card"`. Same vocabulary as the avatars, so the two insets in one card cannot disagree (P17). Update the three call sites. |
| e | `RowAction`, `DueCue`, `HomeTaskRow` | unchanged. `RowAction`'s `aria-hidden` duplicate and its lack of a coarse-pointer fallback are now a **written** decision (D25) — put the reason in the docstring so the next reviewer does not "fix" it. |

#### 15.10.8 `components/advocate/companion-rail.tsx`

| # | Current | Proposed |
|---|---|---|
| a | `RAIL_CARD` `"… h-24 … items-center …"` (`:128-129`) | `"… min-h-24 … items-start … py-3 …"` (D20). |
| b | `PrepCard`'s `cn(RAIL_CARD, "items-start py-3")` (`:403`) | plain `RAIL_CARD`. |
| c | — | **add** a local `WhenBlock({ lead, sub, tone }: { lead: string; sub?: string; tone: "muted" \| "overdue" })`: `<span className="flex flex-col items-end gap-0.5 text-right">` → lead in `text-caption font-medium whitespace-nowrap tabular-nums` (`text-destructive-ink` when `tone === "overdue"`, else `text-muted-foreground`), sub in `text-caption whitespace-nowrap tabular-nums text-muted-foreground`. **Both panels use it** — that is the point. |
| d | `TaskCard` `worst?: boolean` prop, the `Badge` branch and the inline `DueCue` (`:232, :262-270`) | delete all three. Body is title + case line. `<RowAction label={verb} onClick={…} rest={<WhenBlock lead={due.primary} sub={due.date} tone={due.overdue ? "overdue" : "muted"} />} />` (D20). |
| e | `TasksPanel`'s `worst = worstOverdue(world, now)` and `worst={task.id === worst?.id}` (`:298, :330`) | delete, with the `worstOverdue` import. |
| f | `PrepCard`'s `<Badge variant={pending ? "warning" : "success"}>` (`:422-424`) | when `pending`, a third body line `<span className="truncate text-caption font-medium text-warning-ink">{pending}</span>`; when not, **nothing** (D19/D20). Drop the `Badge` import if nothing else in the file uses it. |
| g | `PrepCard`'s two-line `rest` (`:430-437`) | `<WhenBlock lead={away} sub={date} tone="muted" />` — same component, same shape. |
| h | everything else (strip, headers, buckets, widths, persistence) | unchanged. |

#### 15.10.9 `lib/tasks/sandbox.ts`

One comment fix, `:177-179`: the view-only matters are `c-hd4`, `c-hd7`, `c-hd12` **and `c-hd15`**
(`signatories: ["p-dv"]`, `:197`). No data change, no `SEED_VERSION` bump — the fixture is right and
its description is wrong, and the description is what a builder checks D19 against (P24).

#### 15.10.10 Order of work

1. `home.ts` selectors + tests (15.10.1) — nothing renders until `courtLabelsOf` and
   `advocateRosterOn` exist.
2. `content.ts` (15.10.2).
3. `home-bits.tsx` + `person-avatar.tsx` (15.10.7) — the `surface` prop must land before the three
   card files can be updated coherently.
4. `hearing-cards.tsx`, `hearing-list.tsx` (15.10.5–6).
5. `court-board.tsx`, `advocate-home.tsx` (15.10.3–4) — the structural change, last, so it lands on
   cards that already carry their new marks.
6. `companion-rail.tsx` (15.10.8) — independent of 1–5; can be done first if that is easier.
7. `sandbox.ts` comment (15.10.9).
8. Gates, then §15.13 on the render.

### 15.11 Open questions for product (Round 4)

Q1–Q6 in §12 stand. **Q2 (rail first-run default) and Q3 (mid-width `Sheet`) remain explicitly
undecided** — R4 does not touch either.

**Q7 — Is a court's name one string, or a court plus an establishment?** D14 computes the shared
establishment by splitting on `", "`, which is safe (it falls through to full names) but is a
punctuation assumption in a product that deploys in Malayalam and Gujarati. The durable fix is
structured court data — `{ name, establishment, district }` — which the state layer would populate.
Design cannot decide this; it needs whoever owns the court reference data.

**Q8 — Does the advocate's board show their own matters, or their office's?** The owner's model is
*"advocates and their offices"* (18 Aug) and the switcher is an office control. Today the world is
scoped per viewer (`canView`), so choosing a colleague shows matters you *share* with them, never
their own board (D18). Whether an office/firm scope exists — and who may see whose matters inside it
— is a product and permissions question with real consequences, not a design one.

**Q9 — At what volume does the day stop being a scroll?** Kerala's busiest pilot court lists 12 today;
Gujarat sometimes runs ~1,000 filings/day (`product-foundation.md` §6, `rollout.md`). A stacked board
scales in structure but not in length. The candidate answers — List as the default above a threshold
(Q4), a flattened table with a court column, per-court pagination — are configuration decisions.
Recorded, not decided.

**Q10 — Engineering follow-up, not product:** `components/advocate/home-bits.tsx` and
`components/tasks/advocate-stack.tsx` will render identical avatar stacks after D21 and remain two
components (P22). Merging them needs a neutral home and a shared `TeamMember` type currently living in
`lib/advocate/home.ts`. Deliberately deferred out of a visual round; worth a small refactor ticket.

### 15.12 Gaps in the DS (Round 4 — continuing the numbering in `docs/design/ds-requests.md`)

**16 — `AvatarGroup` rings in `background`, which is wrong on every surface that is not the page.**
`avatar.tsx:81` hardcodes `*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background` on the
group. The ring's job is to punch a hole in the overlap, so it must equal *the surface the stack sits
on* — and a product puts stacks on cards, on `surface-sunken` wells and on `brand-muted` tiles far
more often than on the bare page. Every consumer will discover this the way we did: an owner asking
why the discs do not separate. The single `Avatar` is fine — its
`after:border after:border-border after:mix-blend-darken` edge is exactly right and is what saves this
case. **Ask:** a `surface` (or `ring`) prop on `AvatarGroup` that sets the ring token, or documented
guidance that the ring must be overridden per surface, with the override recipe. Meanwhile Dristi
passes a static class map (D21).

**17 — No stacked-section pattern, and no sanctioned section header.** D13 replaces a `Tabs` band
with a column of `<section>` + `<h2>` because the DS has `Tabs`, `Accordion` and `Collapsible` but
nothing for "several peer groups, all expanded, each labelled and counted, one of them live". That is
the shape of every cause list, every day-grouped queue and every multi-court view this product will
build. Related to the open `ds-requests.md` #4 (no sticky table header or density guidance): the
sticky question and the section-header question are the same question at two densities. **Ask:** a
documented section-header recipe — heading role, count treatment, live/status mark, sticky behaviour
and its scroll-margin — so the next four screens do not each invent one.

### 15.13 Pass 8, handed over — what the implementer must measure and report

Pass 8 is the only pass I could not run. It is also the only pass that can veto a sign-off on its
own. These are measurements, not opinions; report the numbers in the build report.

1. **Reach.** The first matter's card-top offset at 1440px, rail open at 320, on today's date.
   Expected ≈ 369px with the ON court's concluded strip present. State the number against 369, not
   against "looks fine".
2. **The avatar question the owner actually asked.** Sample the rendered contrast of a disc against
   the beige queue card, in both themes: (a) disc fill `card` vs card fill `surface-sunken`, (b) the
   DS `Avatar`'s `after:border-border mix-blend-darken` edge vs the card fill. If (a) and (b) together
   do not read at arm's length, the next move is *not* a heavier ring — it is raising it with §15.12
   #16 and holding the DS's edge until then.
3. **`accent` vs `surface-sunken`.** Sample them. If the hover fill is clearly distinguishable from
   the queue card's resting fill, record it — D23's fill route (`accent` hover / `accent-strong`
   selected) becomes available and is the better long-term answer than the inset bar.
4. **Court headers at width.** All three sections at 1440 rail-open, at 1024, and at 375, in `en` and
   in `ml`. Confirm the heading **wraps** and never clips, and that `courtLabelsOf` produced
   "Courts at Kollam" with three short names — or fell through to full names, which is also a pass.
5. **The toolbar at 375.** The switcher, the jump menu and the layout control must wrap to two lines
   without horizontal page scroll (RESPONSIVE.md rule 2), and every target must clear 40×40.
6. **Rail card rhythm.** Both panels at 320px: task cards and prep cards must share one frame; the
   two-line `WhenBlock` must not wrap; confirm the title's character budget did not fall below ~24
   characters. If it did, the recovery is `RAIL_DEFAULT_WIDTH` 320 → 360, not a smaller type size.
7. **The colour count, out loud.** Destructive marks at rest in the whole viewport (expect 3, of
   which 2 are shell chrome), amber marks, green marks. Compare with §15.7.
8. **The `Select` menu.** Confirm it opens **below** the trigger (`position="popper"`), that the
   check indicator does not collide with the right-aligned count, and that typeahead finds a name
   (this is what `textValue` is for).
9. **Both themes.** The rail's light/dark inversion (`surface-sunken` in light, `background` in dark)
   is already handled in `RAIL_CARD`; confirm the new `min-h-24 items-start` did not disturb it, and
   that the D23 inset bar reads in dark.

**Definition of done for Round 4.** All gates green; `ui-craft` §5 run on the render in both themes
at 1440 and 375; the nine measurements above stated in the build report; every deviation from this
brief logged with the Law or a11y rule that forced it. Then hand to `review-ui-ds`, which audits
against the DS — not against this brief.

---

## 16. Decision log

| Date | What changed | Who confirmed |
|---|---|---|
| 2026-08-28 | Brief created as an audit of the shipped advocate home (no prior brief existed for this feature). | — |
| 2026-08-28 | Job recorded as **unconfirmed** with two labelled hypotheses; D4–D7 marked provisional accordingly. | not confirmed — Q1 |
| 2026-08-28 | Owner's 18–19 Aug confirmations (advocates and their offices; rail lists tasks by urgency; vakalatnama decides permission) carried into §1 as attributed facts. | owner, 18–19 Aug (via the design record) |
| 2026-08-28 | External critique adjudicated: filter merge yes, week-strip dropdown no; left accent line rejected; ink treatment adopted; drop-self adopted. | — |
| 2026-08-28 | Three of my own starting observations refuted on inspection: zero-count tab, greeting height, concluded-strip position. Recorded in §2 rather than deleted. | — |
| 2026-08-28 | Beige queue + mint focal card confirmed **locked**; the `ui-craft` layering tension recorded as upstream feedback (D0, §13.2). | owner (shipped at owner's request) |
| 2026-08-28 | Rounds 1–3 shipped as `d5f2c3b`, `f9ef36a`, `685b291`. Measured reach after R3: 336px. | — |
| **2026-08-28** | **Owner review of R1–R3. Four shipped things rejected (court tabs; the badge-on-worst-overdue; the misaligned rail cards; the Now card's persistent button) and two omissions named (view-only as a filter rather than a card fact; avatar discs on beige). Recorded verbatim-of-intent as the authoritative input for R4.** | **owner, 2026-08-28** |
| **2026-08-28** | **Round 4 opened. All eight passes run and reported (§15.1); pass 8 run by proxy on supplied measurements and handed over as §15.13. Fourteen new problems recorded (P11–P24), of which two — the "Ready" badge marking the norm, and the split selection treatment — were found by the passes rather than raised by the owner.** | — |
| **2026-08-28** | **D1 superseded: the single-badge-for-the-worst-overdue rule is withdrawn. It was mine, it shipped, and it created the adjacent-sibling divergence the ink treatment existed to prevent.** | owner, 2026-08-28 |
| **2026-08-28** | **§2's defence of the zero-count court tab reversed (D15) — the reasoning was sound for a tab band and does not transfer to stacked sections. §6's decision to keep the Now card's persistent button reversed (D22) at the owner's instruction.** | owner, 2026-08-28 |
| **2026-08-28** | **Objective 2 restated from ≤310px to ≤~370px (D26), with the 33px named as the price of showing four courts instead of one — rather than quietly missing the old number.** | — |
| **2026-08-28** | **Two DS gaps raised (§15.12): `AvatarGroup` rings in `background`; no stacked-section / section-header pattern. To be added to `docs/design/ds-requests.md` as 16 and 17.** | — |
| **2026-08-28** | **Four new open questions for product (Q7 structured court names, Q8 office scope for the advocate switcher, Q9 volume threshold, Q10 the duplicated avatar stack as an engineering follow-up). Q2 and Q3 remain untouched and undecided.** | pending |
| — | D8 (rail default open) and D9 (narrow-width behaviour) still awaiting owner sign-off. | pending |
