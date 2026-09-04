# Court home

Status: draft
Updated: 2026-09-04
Source: docs/product/domain/journey.md · docs/product/domain/actors.md ·
docs/product/open-questions.md · docs/product/overview.md ·
`apps/dristi-app/src/lib/employee/content.ts` (the branch's own statement of
audience) · user in this conversation (2026-09-04): “start the design”, on
branch `feature-courtside-dashboard`
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4, `check:ds-fresh`
green) — foundations `laws` / `typography`, `src/components/ui/` inventory
Code read: `app/employee/page.tsx`, `app/employee/layout.tsx`,
`components/employee/employee-area.tsx`, `employee-nav.tsx`,
`hearings-screen.tsx`, `lib/employee/navigation.ts`, `lib/employee/content.ts`,
`lib/employee/hearings.ts`, the twelve `*_COUNT` exports under `lib/employee/`

---

## 1. Context

**Where this sits.** `/employee` is the index of the court-staff area and the only
court-side route that is not a queue. Twelve queue screens now ship behind the rail —
three under Hearings, Register cases, three Review applications, six Sign. This is the
screen they all hang off, and the one nobody has designed. The branch is
`feature-courtside-dashboard`; this brief argues the screen is not a dashboard, so the
file is named for what it should be (§5, D1).

**In scope:** the screen at `/employee` — its regions, what each lists, how those are
ordered, the cleared and not-sitting states, and the identity line that says whose bench
this is (nothing on the court side renders one today).

**Out of scope:** the rail itself beyond the row that leads here; the external
**Dashboards** destination; sign-in; and any new judicial act — every control on this
screen leads to a queue that already exists.

**Who this is for — attributed, not invented.** `lib/employee/content.ts` fixes the area
to a JMFC magistrate and calls them “the JMFC magistrate the court-side dashboard is
being built for.” That is the branch's own statement of audience and a demo identity,
not a product fact. Who logs into DRISTI in each deployment is still unanswered
(`docs/product/open-questions.md`). This brief designs for the more constrained case — a
professional repeat user on a bench with a fixed daily sitting — and says so here so the
assumption stays reversible.

**Facts read out of the code, so the brief argues from evidence and not from taste:**

- `COURT_NAV_LINKS` carries a **Dashboards** row flagged `external: true`. Reporting
  already lives outside DRISTI, and the rail already says so.
- Every built rail count is derived from the same `lib/employee/*` constant the screen
  behind it reads, deliberately, “so the rail cannot claim a different number from the
  screen it opens.” Anything this page counts inherits that rule.
- `chart.tsx` exists in the DS and has never been synced into the app.
- `CURRENT_STAFF` is imported by seven `lib/` modules to stamp documents with the court
  name. **No component renders it.**

---

## 2. Problem

1. **The court side opens on a placeholder that describes itself.** `/employee` renders
   an `Empty`: “Nothing on the board yet · This is the court-staff home. The court-side
   dashboard is built on this screen.” It is the first thing anyone sees on the court
   side, and it is a note to the next developer.

2. **The screen claims chrome it does not have.** Its own comment says the surrounding
   `EmployeeArea` “names the court and the role the person signed in as.” It does not —
   `CURRENT_STAFF` never reaches a component. So on every court-side screen, at every
   width, nothing on the page says which bench this is. The court name exists only
   inside documents the bench signs.

3. **A board of counts would be the rail transposed.** Twelve rail rows already carry a
   derived count. A tile per row would restate all twelve — same numbers, more pixels,
   and a second place to keep them true. The rail answers *how much*; repeating it is
   not a home screen.

4. **Nothing on the court side answers “what first?”** The rail is ordered by kind of
   work, which is an IA order and fixed. It cannot say that a rescheduling request has
   waited three days while today's sitting starts within the hour. §138 runs on hard
   statutory clocks — 30 days to notice, 15 days to pay, one month to complain, and an
   endeavour to conclude within six months of filing (`domain/journey.md`, NI Act §§138,
   142, 143) — so age and order are load-bearing here, not decoration.

5. **“Dashboard” is already taken, by something else.** The rail's **Dashboards** row is
   external. Building a second thing called a dashboard at `/employee` puts two
   different meanings on one word inside one rail.

---

## 3. Objective

- Opening `/employee` says whose bench this is, what the court is sitting on today, and
  what is waiting on this magistrate — without restating the rail's twelve counts.
- Everything listed is ordered by something that moves: time to the sitting, or how long
  the work has waited. **The test:** if you re-opened this page tomorrow and nothing had
  reordered, it is a tile board and it failed.
- A bench that is genuinely clear sees that plainly, in one screen, without reading
  twelve zeros.

*Provisional.* These track candidate job (a) in §4. If product says Court home is an
establishment overview rather than this magistrate's day, objective 1 changes.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Court home is *for*. Not inventing one.

**What is attributed — audience only.** `lib/employee/content.ts`: the area runs as a
JMFC magistrate, “the JMFC magistrate the court-side dashboard is being built for.” The
user has previously confirmed the court-side dashboard is for the magistrate (JMFC), not
the bench clerk or the registry.

**Candidate (a) — hypothesis, not settled.** *The magistrate's day:* what I am sitting on
today, and what is waiting on my signature or my decision, in the order the clock puts
them in.

**Candidate (b) — hypothesis, not settled.** *The establishment's board:* the whole
court's load, including work that belongs to the bench clerk and the scrutiny officer,
opened by any court-side role.

**Why the difference decides the screen.** (a) orders by this person's pressure and
leaves out what is not theirs; (b) must show work this magistrate never performs and
cannot personalise anything. (a) is the recommendation, and **every decision in §5 that
depends on it is marked provisional.**

---

## 5. Decisions

**D1 — Call it Court home. Do not build a dashboard.** *Traces to:* `navigation.ts`
(**Dashboards**, `external: true`) and problem 5; the route's metadata already says
“Court home”. *Rejected:* naming it Dashboard, matching the branch. *Given up:* the
branch name stops matching the screen name. Worth it — the rail would otherwise carry
two meanings of one word.

**D2 — Three regions, in this order: today's sitting; waiting on your signature;
waiting on your decision.** *Provisional on job (a).* *Traces to:* the rail's own
grouping (Hearings / Sign / {Actions + Review applications}), so no second taxonomy
enters the product, and to `actors.md` — signing and deciding are different judicial
acts with different reversibility. *Rejected:* one merged “Your work” list, which would
put a signature and a contested application on the same footing. *Given up:* two of the
three regions are frequently short; they collapse (§10).

**D3 — Never restate a rail count. List work, not sizes.** *Traces to:* problem 3. The
rule: only non-empty piles appear; each row is a real item with a title and an age;
regions cap at a small number with a link to the full queue. A pile of zero is absent,
not a tile reading 0.

**D4 — Derive every number and row from the existing `lib/employee/*` constants.**
*Traces to:* the rule `navigation.ts` already states for the rail. Home, rail and queue
read one source, so no two of them can disagree.

**D5 — Exactly one primary action on the page: open today's cause list.** *Traces to:*
Laws, “Ration teal — one strong primary action per view.” Everything else is a link or a
row. *Given up:* the sign queues lose a loud call to action; they keep an ordinary one.

**D6 — Put the identity line on the page head: court, then role.** *Fixes problem 2.*
*Rejected:* adding it to `EmployeeArea` chrome — that is a change to shared chrome and
out of scope here, and the rail is off-canvas below `md` anyway, so chrome alone would
not answer the question on a phone. *Judgment:* the court is the fact that matters
(documents are stamped with it); the role is secondary. Not a greeting — see §6.

**D7 — Rows are `Item` / `ItemGroup`, not `Table`.** *Traces to:* what a table is for in
this app — the twelve queue screens use `Table` with filters, a pager and column
semantics (`hearings-screen.tsx`). A digest has no columns to compare, nothing to sort
and nothing to page. `item.tsx` is already synced. *Rejected:* a stripped table, which
would read as a queue that lost its controls.

**D8 — No charts, no statistics, no pendency trend.** *Traces to:* the external
**Dashboards** row, and `chart.tsx` having never been synced into the app. Reporting has
an owner and it is not this screen.

---

## 6. What I cut (and why)

- **A stat-tile row of the twelve rail counts.** The whole of problem 3.
- **Charts, disposal rates, pendency trend** — D8.
- **A month calendar.** Schedule hearing and Bulk reschedule already own dates, and both
  are one rail row away.
- **A quick-actions grid.** The rail *is* the shortcut grid, and it is on screen at
  every width above `md`.
- **A greeting (“Good morning, Uddipan”).** The given name in `content.ts` is explicitly
  a placeholder that “nothing keys off,” and time-of-day copy is a fourth thing to
  translate per state for no decision it helps anyone make. The court and the role are
  the identity worth rendering.
- **Search.** Every queue has its own; a court-wide search is a real feature that
  deserves its own brief, not a widget smuggled onto a home screen.
- **Long labels and language.** One core deploys per state: cause titles arrive in
  Malayalam and Devanagari, and party names in a §138 cause are two names joined. Cause
  titles clamp to two lines; case numbers and dates never truncate; counts stay numerals.
  Line heights must tolerate taller glyphs (DS typography, multilingual note).

---

## 7. Layout & hierarchy

Single column, `max-w-5xl`, centred — the same measure the placeholder and the queue
screens already use, so the court side keeps one page width.

```
┌ page (bg-background) ────────────────────────────────┐
│  JMFC Court 1, Kollam · Magistrate      ← identity   │
│  Court home                             ← text-title │
│  <one line: what today is>                           │
│                                                      │
│  ┌ panel ── Today's sitting ──────────────────────┐  │
│  │  <n> listed · first at <time>                  │  │
│  │  ItemGroup: 3–4 next listings                  │  │
│  │  [ Open today's cause list ]  ← only primary   │  │
│  └────────────────────────────────────────────────┘  │
│  ┌ panel ── Waiting on your signature ────────────┐  │
│  │  ItemGroup: non-empty sign queues, oldest first│  │
│  └────────────────────────────────────────────────┘  │
│  ┌ panel ── Waiting on your decision ─────────────┐  │
│  │  ItemGroup: register + the three applications  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Why the sitting is first.** It is the only region with a deadline measured in minutes.
Signature and decision work is measured in days, and both regions carry that age on
every row, so nothing is hidden by being second.

**Depth.** Page is `bg-background`; each region is one panel — `bg-card border-hairline
shadow-raised rounded-xl` (ui-craft §4, layer 3). No panel nests inside another and no
second shadow appears anywhere on the page. Region headings are `text-title-s
font-semibold`; the page title is `text-title` (`sm:text-title-l`), matching the
placeholder it replaces.

---

## 8. Components (DS name → region)

| Region | DS component |
|---|---|
| Page title, identity line, sub-line | none — type roles only (`text-title` / `text-caption` / `text-body`) |
| Each of the three regions | `Card` + `CardHeader` / `CardContent` |
| Rows inside a region | `Item`, `ItemGroup`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` |
| Count or age on a row | `Badge` |
| The one primary action | `Button` (default) |
| Region → full queue | `Button variant="link"` or a plain `Link` in `CardHeader` |
| Cleared bench; a region with nothing in it | `Empty` |
| Between rows | `ItemSeparator` |
| Loading | `Skeleton` |

All eleven are already synced into `apps/dristi-app/src/components/ui/`. Nothing here
needs a new primitive.

---

## 9. Spacing

On the ladder throughout (Laws: `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`).

- Page: `px-4 py-8 sm:px-6`, `max-w-5xl` — inherited from the placeholder, unchanged.
- Between page head and the first region, and between regions: `gap-8`.
- Identity line to title: `gap-2`.
- Panel padding: `p-6`; `rounded-xl`.
- Rows within a region: `gap-4`; inside a row, `gap-2`.
- Controls `h-10` `rounded-lg`.

---

## 10. States

- **Cleared (the good day).** Every region empty. One `Empty` for the whole page, not
  three — “Nothing waiting on you” plus today's sitting line if the court is sitting. The
  three region panels do not render as three empty boxes.
- **A single region empty.** That region does not render at all. Its rail row still shows
  its zero; the home screen stays quiet about it (D3).
- **Not sitting today.** Today's sitting panel stays, and says so — a holiday or a
  non-sitting day is information, not an error. Signature and decision regions render
  normally.
- **Loading.** `Skeleton` in the shape of the rows; the page head, which needs no data
  beyond `CURRENT_STAFF`, renders immediately.
- **Error.** Per region, not per page: one region failing to resolve must not blank the
  sitting. Text plus a retry; no toast, since nothing here was user-initiated.
- **Partial.** More waiting than the cap: the region shows its first few and a link
  carrying the true total, which is the rail's number by construction (D4).
- **Long label.** Cause title clamps to two lines; case number, date and time never
  truncate; a region heading and its count never collapse onto each other below `sm`.

---

## 11. Risks accepted

- **Home and rail overlap.** Both speak about the same twelve piles. Accepted: the rail
  says how much, home says in what order, and D4 makes them read one source so they
  cannot contradict. If the overlap still reads as duplication on the built screen, the
  cut is here — home drops a region, the rail keeps its counts.
- **Everything is derived from demo data.** Ages and ordering will look plausible and be
  fictional, exactly as the twelve queues already are. Accepted on this branch; the
  ordering rule is the deliverable, not the numbers.
- **Building on candidate job (a).** If product answers (b), regions 2 and 3 lose their
  “your” framing and the ordering premise weakens. Accepted because (a) is what the
  branch's own audience note describes, and because the regions map to rail groups that
  survive either answer.
- **The identity line duplicates chrome we may build later.** If `EmployeeArea` ever
  names the court, this line becomes redundant and moves. Cheap to undo; leaving problem
  2 unfixed is not.

---

## 12. Open questions for product

1. **What is Court home's job — (a) the magistrate's day, or (b) the establishment's
   board?** Everything provisional in §5 turns on this.
2. **Is the external Dashboards destination the system of record for court reporting?**
   If yes, D8 becomes permanent rather than a judgment call.
3. **Does a magistrate want work the bench clerk or Sheristadar performs to appear here
   at all?** `actors.md` separates those roles; the rail does not.
4. **Who logs into DRISTI in each deployment** — the standing question from
   `open-questions.md`. Unchanged by this brief, recorded because the whole screen is
   personalised.
5. **Is “sitting today” a real datum a court system can supply** (a sitting calendar), or
   only inferable from whether any hearing is listed?

---

## 13. Gaps in the DS

None. Every region composes from primitives already synced. If the build wants a
number-plus-label chip that `Badge` cannot carry, that is a `docs/design/ds-requests.md`
entry, not something invented inside Dristi.

---

## 14. Decision log

| Date | Change | Confirmed by |
|---|---|---|
| 2026-09-04 | Brief opened for `/employee`. D1–D8 recorded. Job left `unconfirmed` with two candidates; §3, D2 and D5 marked provisional on candidate (a). | Neer — “start the design”, on `feature-courtside-dashboard` |
| 2026-09-04 | Problem 2 recorded: `app/employee/page.tsx` states the chrome names the court and role; `CURRENT_STAFF` reaches no component. Fixed by D6, on the page rather than in chrome. | Read from code |
