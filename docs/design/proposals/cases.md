# Cases

Status: draft
Updated: 2026-08-11
Source: docs/product/product-foundation.md · docs/product/domain/journey.md ·
docs/product/domain/practice-notes.md · docs/product/open-questions.md ·
docs/product/standards/adherence.md
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`) — `AGENTS.md`, `ACCESSIBILITY.md`,
`RESPONSIVE.md`, foundations `laws` / `typography` / `spacing` / `colors`,
table / tabs / badge / pagination / empty / sheet / toggle-group / marker /
input-group registry and source.

---

## 1. Context

**Ask:** rebuild Your cases from the current screenshot. The four tabs (Ongoing ·
Pending submission · Disposed · Long pending register) do not make sense. Product
proposed simplifying toward: All cases · Long pending register · Disposed · Bookmarked.
Ignore Join case / File case for this redesign of the list itself.

**Confirmed with product (later):**

- Left nav: **Home · Your cases · Filings · Join a case · Pending tasks · Calendar ·
  Team case access.**
- **Filings** owns drafts and returned/rejected filings. Cases starts at scrutiny —
  so `Pending submission` and draft `Untitled` rows leave this screen.
- Users create their own **colour tags** (name + colour from defaults).

**In scope:** the Cases list — views, search, filters, chips, table/item list, tags on
this list, pagination.

**Out of scope to build here:** Filings UI, whole-nav redesign. Notes that affect
neighbours stay at the end of §5 as implications, not a second brief.

---

## 2. Problem

From the screenshot and the ask:

1. **Tabs mix three different questions.** Ongoing / Disposed = case lifecycle.
   Pending submission = my filing work. Long pending register = exception track.
   Tabs force mutual exclusivity when a live case can be ongoing *and* long-pending.
2. **Pending submission does not belong on Cases** once Filings owns pre-case work —
   and even before that confirmation, it was the wrong axis for a “cases” list.
3. **The always-open filter card** costs a large share of the first screen every visit;
   search needs a teal **Search** click to run.
4. **Columns are mostly classification** (name, stage, secondary stage, number, type).
   Case type is constant (`NIA S138`). Secondary stage is often `N/A`. Many names are
   `Untitled`. Little says when something is due or who acts next.
5. **Pagination is too thin** (10 rows) for a ~55-case active set.
6. **Colour tags** (confirmed later) need a safe model: named mark from a fixed palette,
   not a free hex — or they fail a11y and DS colour rules.

---

## 3. Objective

- Reach any live case **without guessing a tab or clicking Search to submit**.
- Long pending and bookmarked cases stay **visible as lenses**, not hidden behind a
  rival tab that removes them from the live list.
- Stage and party labels remain readable when long / translated.
- Tags (when DS tokens exist) recover “grab that stack” in one click and stay legible
  without colour alone.

---

## 4. Job

**Job: unconfirmed.** Product has not said what Your cases is *for* beyond “live matters
from scrutiny onward.” Do not invent a slogan.

**Scope that is confirmed:** list live cases; Filings owns drafts/returned; Pending tasks
owns obligations as a destination (no “waiting on you” chip here).

Until Job is confirmed, **do not treat `Next` / `Awaiting` columns as settled** — they
are optional later if product says this list must show dates / who-owes-next. The filter
and list shell below do not depend on that answer.

---

## 5. Decisions

### Filters and find (the ask)

**D1 · Not four equal filters — two views + two chips.**

Product’s four destinations are right. Treating them as one control type is wrong.

| Set | Treatment | Why |
|---|---|---|
| **Active** (≈ “all live cases”) | View (tab), default | Everything not disposed — Filings no longer owns this set. |
| **Disposed** | View (tab) | Different population; different useful columns / sort. |
| **Long pending register** | Filter chip + count | Still an active case; a tab would hide it from Active. |
| **Bookmarked** | Filter chip + count | A lens, not a place cases live. |

Same one-click access as the four proposed filters; no false claim they are disjoint.
`Pending submission` is gone (Filings).

**D2 · Kill the always-open filter card.** One compact row: type-to-filter search (no
submit button) · Sort · **Filters** button opening a `Sheet` for stage / court / dates.
No teal on this view — header `File case` keeps the one strong primary (Laws: ration
teal). Stage filtering lives in the Sheet, not as permanent fold controls.

**D3 · Applied Sheet filters echo as removable chips** so a short list always shows why.

**D4 · View state in the URL** (view, search, chips, sheet filters, sort, page). Judgment.

**D5 · 25 rows per page** with real pagination `href`s.

### List content

**D6 · Drop empty-calorie columns.** No Case type column while §138 is the only type.
Secondary stage is a caption under stage, not its own column. Never render `Untitled` as
a name — use case number + “Parties not yet recorded” when needed.

**D7 · Stage as plain text, not `Badge`.** Badge is `h-6` + `whitespace-nowrap`; long /
localized stage names overflow. Short flags only (`Disposed`, `Long pending`) may use
Badge.

**D8 · No status colour on stage.** Severity is party-relative; who logs in is open.

**D9 · (Only if Job later requires it)** Add `Next` / `Awaiting` columns. Until then,
ship Case · Stage · Bookmark. Do not block the filter redesign on this.

### Colour tags (same feature)

**D10 · Named tag + colour from a palette of 5**, never bare colour or free hex. Personal
by default. On the list: chip filters, optional group-by, `size-2` dot + name on the row.
**Blocked on DS `tag-1…5` tokens** ([../ds-requests.md](../ds-requests.md) #1) — everything
else above ships without tags.

### Neighbour implications (record only)

- Filings must show deadline urgency for returned filings (statutory clocks stay live).
- Nav labels: sentence case. `Join a case` is stronger as header / empty-state than as a
  permanent nav destination — product’s call when nav is owned.
- If “your cases” scope varies (mine / team / all visible), put the control *inside*
  Cases and label the nav `Cases`.

---

## 6. What I cut (and why)

- **Four equal filters / four tabs** — exclusivity bug; D1.
- **`Pending submission` on Cases** — Filings.
- **Always-open filter card + Search submit** — D2.
- **Stat cards for counts** — chips carry counts.
- **“Waiting on you” chip** — Pending tasks.
- **Case type column / Secondary stage column / `Untitled` as a name** — D6.
- **Shipping `Next`/`Awaiting` before Job is confirmed** — D9.
- **Colour wheel / hex / colour-only tags / coloured rows** — D10 + table registry.
- **Nav redesign / returned filings back into Cases** — undoes confirmed boundary.

---

## 7. Layout & hierarchy

Single column, mobile-first. Top → bottom:

1. **Header** — `Cases` (`text-title-l font-semibold`) + one-line summary
   (`text-body text-muted-foreground`), e.g. “55 active · 7 in the long pending register”.
2. **Views** — `Tabs` / `TabsList variant="line"`: Active · Disposed.
3. **Find row** — search (`InputGroup` + `Input`, type-to-filter) · Sort (`Select`) ·
   Filters (`Button outline` → `Sheet`). Stack on small screens
   (`flex-col gap-3 md:flex-row`).
4. **Chips** — `ToggleGroup` multi: Long pending register (n) · Bookmarked (n) · tag
   chips when tags exist.
5. **Applied filters** — removable echoes of Sheet filters.
6. **List** — `Table` from `md:` up; `Item` list below.

| Column | Content |
|---|---|
| **Case** | Parties (`text-body`); case number under (`font-mono text-body-compact text-muted-foreground`); tag chip when not grouped |
| **Stage** | Plain text; secondary as `text-caption text-muted-foreground` |
| **Bookmark** | Icon toggle, `size-10` hit area, `aria-pressed` |

Optional later (D9): **Next**, **Awaiting**.

7. **Pagination** — 25 / page, real `href`s.

**Tags UI:** row chip = `Badge outline` + dot + name; group headers = `Marker`; create =
`Sheet`/`Dialog` with name field + 5-swatch radio (`size-10`, name each colour).

**Hierarchy:** no teal in this view’s own controls. Rows are links; bookmark stops
propagation.

---

## 8. Components (DS name → region)

| Region | Component |
|---|---|
| Views | `Tabs` + `TabsList variant="line"` |
| Search | `InputGroup` + `Input` + `Label` |
| Sort | `Select` |
| Deep filters | `Sheet` + `Field` / `Combobox` / `Checkbox` / `DatePicker` as needed |
| Chips | `ToggleGroup` (multi, `outline`) |
| Applied filters | `Badge` or chip echoes |
| Desktop list | `Table` |
| Mobile list | `ItemGroup` / `Item` / … |
| Tag on row | `Badge outline` + `size-2` dot |
| Tag groups | `Marker` |
| Create tag | `Sheet` or `Dialog` + `Field` + `RadioGroup` |
| Loading / empty / error | `Skeleton` / `Empty` / `Banner` |
| Paging | `Pagination` |

Nothing new at component level. Tag **tokens** are the gap (§13).

---

## 9. Spacing

Ladder only: `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.

| Where | Value |
|---|---|
| Page | `p-6 md:p-8` |
| Major regions | `gap-8` |
| Title → summary | `gap-2` |
| Find row / chips | `gap-3` / `gap-2` |
| Table cells | `px-4 py-3` |
| Sheet body | `p-6`, fields `gap-4` |
| Controls | `h-10` `rounded-lg`; chips `h-6`; table shell `rounded-lg` |

---

## 10. States

| State | Treatment |
|---|---|
| Loading | Skeleton rows; chrome stays |
| Empty — no cases | `Empty` (+ Join case is useful here) |
| Empty — filters exclude all | `Empty` + Clear filters; chips visible |
| Load failure | `Banner` + retry |
| No parties yet | Case number as title; “Parties not yet recorded” |
| No secondary stage | Render nothing (no `N/A`) |
| No tags yet | No tag chips; create from Sheet / management |
| Long / localized labels | Stage and parties wrap; no silent truncation |
| Narrow / zoom | Item list below `md:` |
| Disposed view | Same shell; drop provisional awaiting; sort by disposed date when that column exists |

---

## 11. Risks accepted

1. LPR as a chip may be wrong if courts need a formal register document — then it is a
   report, not a filter here.
2. Constrained (phone / occasional) default may under-serve Gujarat bulk volume — revisit
   density only when who-logs-in is known.
3. Tags wait on DS tokens; no local hex workaround.
4. Neighbour implications may be overruled when Filings / nav are designed.

---

## 12. Open questions for product

Only what blocks or reshapes *this* feature:

1. **What is Your cases for?** (find-and-open only vs also show next date / who owes —
   gates D9.)
2. **Long pending register:** property of a case, or a formal register to produce?
3. **Are tags personal or team-visible?** (Personal-first for now; shared raises DPDP.)
4. **Cap on tags per user / per case?**
5. **Two number formats on one column** (`KL-…` vs `CMP/…`) — both after registration?

Broader who-logs-in / Gujarat volume already live in
[open-questions.md](../../product/open-questions.md) — not re-litigated here.

---

## 13. Gaps in the DS

See [../ds-requests.md](../ds-requests.md):

1. **`tag-1…5` token family** — blocking for tags.
2. **Badge cannot hold long localized labels** — why stage is text (D7).
3. **Missing registry guidance** for item / description-list / toggle-group /
   input-group / marker.
4. **No sticky table header / row-density guidance.**

No local invention while these are open.

---

## 14. Decision log

| Date | Change | Confirmed by |
|---|---|---|
| 2026-08-11 | Screenshot ask: tabs don’t work; proposed All / LPR / Disposed / Bookmarked; rebuild list | Product |
| 2026-08-11 | Nav + Filings owns drafts/returned; Pending submission leaves Cases | Product |
| 2026-08-11 | User-created colour tags from defaults | Product |
| 2026-08-11 | **D1:** four destinations → Active/Disposed views + LPR/Bookmarked chips (pushback on four equal filters) | Brief |
| 2026-08-11 | Job left unconfirmed; `Next`/`Awaiting` parked behind Job (D9) | Brief |
| 2026-08-11 | Brief rewritten to lead with the filter/list problem; neighbour/tag sprawl compressed | Brief |
