# Hearing case overview (court side)

Status: **recommendation overridden — built the other way.** §5 decisions 1-4 argued
for keeping View case in the header and adding no bottom band. The owner read that
recommendation in full and decided on 2026-09-06 that View case moves into a sticky
bottom band at the foot of the page. Placement inside that band is **right-aligned**,
matching the house sticky-bar recipe (`justify-end` / `sm:ml-auto`). Sections 1-13
are kept exactly as written, because what was weighed is worth keeping; §14 logs the
override, and §7's header and hierarchy bullets now describe the superseded layout
rather than the built one.
Updated: 2026-09-06
Source: docs/product/README.md · docs/product/open-questions.md ·
docs/product/domain/practice-notes.md (checked — carries nothing on hearings or the
bench) · user in this conversation (2026-09-06): “the view case right now is on the
top-right-side corner. Instead, how about we bring this to the bottom-left corner if it
allows in the design system, and have a fixed nav bar, if that makes sense?” ·
audience confirmed for court-side surfaces in this conversation: the Magistrate (JMFC)
at the bench
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, HEAD `e0cadea6b9d4` = `ds.lock.json` pin) —
`AGENTS.md`, `RESPONSIVE.md`, foundations `laws` / `elevation` / `accessibility`
(spacing ladder taken from `AGENTS.md` §7a and the `laws` page)

Code read: `apps/dristi-app/src/components/employee/hearing-overview-screen.tsx`,
`components/chrome/app-chrome.tsx` (`ChromeTopBar`, `ChromePageColumn`),
`lib/employee/navigation.ts` (`courtTrail`), `components/employee/order-screen.tsx`,
`components/employee/hearings-screen.tsx` (`JoinVideoCourt`), and the eleven screens
that use the pinned bottom band (listed in §5, decision 1)

---

## 1. Context

**Where this sits.** `/employee/hearings/[hearingId]` is one listing from today's cause
list, opened up. It is reached from **Start hearing** on the row and from the cause
title on the same row. `lib/employee/navigation.ts` treats it as *the cause list seen
closer up*, not a new destination: `isCourtNavActive` keeps Today's hearings lit while
this page is open, and `courtTrail` renders **Court home › Hearings › Today's hearings**
above it. Hearings and Today's hearings are both live links back to the list — the
section has no page of its own, so it borrows the queue's href rather than sitting
in the trail as text a click cannot follow.

**Its sibling** is the order composer at `/employee/hearings/[hearingId]/order`
([hearing-order.md](hearing-order.md)) — same listing, and the place where the sitting
is actually worked. The cause-list row actions are owned by
[hearings-pass-over.md](hearings-pass-over.md). Neither brief covers this page; this is
its first.

**What is built today**, top to bottom: the sticky court top bar with the trail; a page
header (caption `Item 1 · ST/241/2026 · Evidence of complainant`, cause title +
status `Badge`, and **View case** opposite the title); `Case details` and
`Last hearing` side by side at `lg:` (2/5 and 3/5 of a five-column grid); `Case history`
full width beneath.

**In scope for this brief:** where the page's one action lives, and whether the page
grows pinned chrome of its own. The existing panel composition is described here as
context and is not being reopened.

**Out of scope:** wiring View case (see below); anything that runs the sitting — End
hearing, Pass over and the order composer all stay on the cause list and in the
composer.

**Confirmed already, and not re-litigated here:**

- The audience for court-side surfaces is the Magistrate (JMFC) at the bench —
  confirmed in this conversation, not derived from `docs/product/`.
- **View case is deliberately unwired.** There is no court-side case file, and
  `/employee` does not read from the citizen/advocate side
  (`lib/employee/content.ts`), so the button is a real, focusable control with
  `aria-disabled` and a tooltip that says *“The case file is not connected yet”*.
  [rescheduling-request.md](rescheduling-request.md) §6 cut a View case control
  outright for the same reason — “promises a court-side case file that is not there.”

---

## 2. Problem

Numbered so decisions can cite them.

1. **The ask contests a decision that is only recorded in a code comment.** The doc
   block above `HearingOverviewScreen` already argues against a bottom band — “a band
   across the foot of a page that is only read, holding one ghost button, reads as
   pinned chrome whether or not it is pinned — and it would be a second door to a room
   with one.” A designer looking for that reasoning has nowhere to find it. This file
   is the fix for that, whatever the outcome.

2. **“Fixed nav bar” names something that already exists.** `ChromeTopBar` is
   `sticky top-0 z-30` on a page column that is `min-h-svh` with the window scrolling
   (`app-chrome.tsx:472, 720`), so the trail is persistent at every width, on this page
   and every other court screen. There is no gap here to fill.

3. **The premise “top-right is hard to reach after reading down” does not survive the
   measurements.** At `lg:` the page is a header, two panels of equal height and a
   three-entry timeline — the button is on screen at load without scrolling. Below
   `sm:` the header stacks (`flex-col sm:flex-row`) and the button is `w-full`, so it is
   the *second thing on the page*, above the first fact. At no width today is View case
   far from the reader.

4. **The genuine hierarchy cost is the phone, and it points the opposite way to the
   ask.** At `<640px` the page's loudest pixels — a full-width solid-teal button — are
   spent above the fold on the one control that does nothing. Moving it into pinned
   chrome makes it louder still, and permanent.

5. **A pinned band would collide with an established meaning.** Eleven screens in this
   app use `sticky bottom-0 … border-t border-hairline bg-card`, and every one of them
   commits or advances work (§5, decision 1). None of them is a page you only read.

---

## 3. Objective

Someone can tell, from this file, where the page's one action lives and why, without
reading the source. The page keeps exactly one persistent bar (the trail at the top),
one primary action, and no chrome that a reading page does not need. On a phone the
page's first 120 vertical pixels are not spent on navigation furniture.

---

## 4. Job

**Job: unconfirmed.** `docs/product/` has nothing on the bench at a sitting —
`domain/practice-notes.md` carries no hearing, bench or adjournment note, and
`open-questions.md` still lists who logs in as unanswered. The one framing on record is
the screen's own, and it is a build decision rather than a product fact:

> “One listing's case overview — what is in this case, at a glance… **It reads, it does
> not run the sitting.**”
> — `hearing-overview-screen.tsx`, doc block above `HearingOverviewScreen`

This brief uses that framing because every decision below already depends on it and it
is what shipped — not because product has confirmed it. See §12.

Audience is not the open part: the bench (JMFC) is confirmed for court-side surfaces.
So the design weights a professional repeat user — keyboard reachable, dense, no
hand-holding — per the role file's table.

---

## 5. Decisions

**1. No bottom action bar on this page. The recorded reasoning holds — I am not
overturning it.** Three grounds, in order of weight:

- *Pattern collision.* `sticky bottom-0 z-30 … border-t border-hairline bg-card` has one
  meaning in Dristi already: **this screen commits something.** It is on
  `order-screen.tsx:260` (Save draft / Preview), `sign-orders-screen.tsx:457`,
  `sign-evidence-screen.tsx:269`, `sign-forms-screen.tsx:276`,
  `sign-bail-bonds-screen.tsx:285`, `sign-witness-deposition-screen.tsx:401`,
  `approve-copy-application-screen.tsx:289`, `bulk-reschedule-screen.tsx:738`,
  `filing/filing-footer.tsx:102`, `vakalatnama/wizard.tsx:94` and
  `scrutiny/correction-screen.tsx:853`. Putting the same band on a read-only page
  teaches it a second meaning. *Rule:* DS `AGENTS.md` §3 (“reuse before creating”) and
  the repo rule against quietly introducing a second way of solving a shape of problem.
- *The composer already wrote the rule in words.* `order-screen.tsx:250` — “The bar
  holds the work and nothing else… leaving is not work, and it did not become work by
  sharing a container with things that are.” View case is a way out of this page into
  another surface. It is not work.
- *Cost, measured.* The top bar is `h-14` (56px). A band at the house recipe is
  `py-3` + an `h-10` button + a hairline ≈ 65px. That is ~121px of permanent chrome on
  a ~667px phone viewport — roughly 18% of the screen, held for one control, on a page
  whose whole purpose is reading. DS `elevation` foundation: *level is semantic depth,
  never decoration.* Chrome for one dead control is decoration.

*Alternative rejected:* the band, at `sm:` and up only. It removes the measured cost and
keeps the pattern collision, which is the bigger of the two problems. *What I gave up:*
a persistently visible View case on a long-scrolling case history — see risk 2.

**2. Do not duplicate View case into a second location.** A copy in a bottom band plus
the header is two solid-teal buttons in one view. *Rule:* DS `laws` → **Ration teal**,
“One `bg-primary` button per visual region… multiple competing primary buttons” is
listed as the don't. A muted second copy avoids the law and lands on the doc block's
objection instead — a second door to a room with one. *What I gave up:* nothing worth
having.

**3. View case stays top-right, opposite the title.** This is the court side's existing
convention for a page-scope action, set by `JoinVideoCourt` on the cause list — same
slot, same `w-full shrink-0 sm:w-fit`, same `aria-disabled` + tooltip bargain — and the
recorded reason there (`hearings-screen.tsx:400`) is that the header “keeps it visible
without scrolling past the controls.” Two adjacent court screens with two placements for
the same class of control is the second way again. *Judgment, plus the consistency
rule.* *Alternative rejected:* an un-pinned trailing button after Case history — closer
to what was asked, costs no chrome, and is defensible; rejected because it splits the
convention for a reachability problem that problem 3 shows does not exist, and because
the sticky trail already covers the “I finished reading, get me out” case.

**4. Change nothing in the layout as a result of this ask.** The page ships as it is.
*Judgment.* The user's instinct does point at something real — problem 4, the phone
header — but the fix for that is not a bottom bar, and every fix available (shrinking
the button to `w-fit` at all widths, demoting it to `outline`) breaks the Join VC
bargain on one of the two screens that make it. One inconsistent screen is worse than
one loud button. *What I gave up:* a slightly quieter phone header.

**5. When the court-side case file exists, wire View case in place.** Same slot, drop
`aria-disabled` and the tooltip, change nothing else. Written down so the next author
does not read “it's disabled” as “its position was never decided.”

---

## 6. What I cut (and why)

- **The bottom action bar**, in all three shapes it was reachable in: pinned at all
  widths, pinned on phone only, and static at the foot of the content. §5, decisions
  1 and 3.
- **A second “fixed nav bar.”** It exists, at the top, and it is the same one on every
  court screen (`ChromeTopBar` + `courtTrail`).
- **A Back button on this page.** Three live routes to the cause list already exist —
  the rail's current row, the trail's last crumb, and browser back —
  and `navigation.ts` forbids one destination carrying two names. The only place the
  page carries its own back control is `HearingMissing`, where there is no listing to be
  “closer up” on.
- **Demoting View case to `outline` while it is unwired.** Tempting, and it would free
  the page's teal. Cut because the court side has made the opposite bargain twice on
  purpose — “primary paint still marks the court-level act; the disabled state keeps the
  promise honest” — and flipping one of two is drift, not a decision. Recorded as
  risk 1 instead.
- **Removing View case entirely**, the way `rescheduling-request.md` did. There it was
  one of nine redundant facts beside a document. Here it is the page's only forward
  path; cutting it makes the overview a dead end.

---

## 7. Layout & hierarchy

Unchanged, and now recorded:

- **Page column:** `flex flex-col gap-8 p-6 md:p-8`. The window scrolls; the top bar
  stays.
- **Header:** `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between` —
  caption, then title + status `Badge` on one wrapping line, with the action opposite at
  `sm:` and above, stacked full-width below it.
- **Body:** `grid gap-8 lg:grid-cols-5` — Case details `lg:col-span-2`, Last hearing
  `lg:col-span-3`, Case history `lg:col-span-5`. One column below `lg`.
- **Hierarchy:** the cause title is the page. The one primary teal action for this view
  is **View case**, and it is the only one. Panels are peers — no panel outranks another
  by fill or shadow.
- **Above the fold on a phone:** caption, title, status, View case, and the top of
  Case details. That is the ordering this brief accepts (§5, decision 4).

---

## 8. Components (DS name → region)

| Region | DS component |
|---|---|
| Trail / persistent nav | app chrome `ChromeTopBar` + `Breadcrumb` (frame-owned, not this screen's) |
| Status beside the title | `Badge` |
| View case | `Button` (default variant) wrapped in `Tooltip` / `TooltipProvider` |
| Case details rows | `DescriptionList` + `DescriptionRow` / `DescriptionTerm` / `DescriptionDetails` |
| Case history | `Timeline` + `TimelineItem` |
| No earlier sitting / listing not on the board | `Empty` + `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent` |
| Panels | composed `Card` recipe — `rounded-xl border border-hairline bg-card p-6 shadow-raised` |

Nothing new. No DS component is added or needed by this brief.

---

## 9. Spacing

On the ladder, unchanged: page `p-6 md:p-8`, section rhythm `gap-8`, header `gap-4`,
title row `gap-3`, fact rows `py-2` with a `gap-2` heading step, nested order well
`p-4 rounded-lg`, panels `p-6 rounded-xl`, control height `h-10` / `rounded-lg`
(`AGENTS.md` §7a, `laws` → control metrics). A bottom band would have added `py-3
md:py-4` — on the ladder, and still not worth its height.

---

## 10. States

- **Empty (no earlier sitting):** `NoLastHearingPanel` holds the column rather than
  dropping it — *no* is an answer to “has this been heard before?”. Unchanged.
- **Loading:** none. The page reads fixtures synchronously. When a real fetch lands, the
  panels are the skeleton unit, not the page; the header and the trail render
  immediately so the way back never waits on data.
- **Error / listing not on the board:** `HearingMissing` — an `Empty` with a real
  Button back to today's hearings. The one place on this page a back control is correct.
- **Partial data:** cheque amount and filed date are simply absent when the sidecar has
  none; a side with no counsel on record shows the party alone. No dashes for facts that
  do not exist.
- **Long label / long language:** state deployments layer their own language over
  identical national law. The header column is `min-w-0` and the title is
  `text-balance`, so a Malayalam or Devanagari cause title wraps and pushes the badge to
  its own line (`flex-wrap`) instead of squeezing the action. A tripled **View case**
  label grows the button at `sm:w-fit` and the header stays a row until it cannot, then
  stacks. The caption line wraps as a paragraph. This is one of the quieter arguments
  against the bottom band: a fixed-height band is where a tripled label starts fighting
  a fixed height, and there is no such band.

---

## 11. Risks accepted

1. **The page's one rationed teal is spent on a control that goes nowhere.** Accepted,
   consistent with Join VC, and time-limited — decision 5 closes it. If the case file
   stays unbuilt for another quarter, revisit the demotion cut in §6 as a deliberate
   change to *both* screens, never one.
2. **A two-year matter makes Case history long, and View case scrolls away.** Accepted:
   the trail does not scroll away, and View case is an alternative to reading this page
   rather than the thing you want at the end of it. If the history ever grows tall
   enough that this bites, the answer is to make the history scroll within its panel,
   not to pin a band.
3. **The user asked for something and the answer is no.** Accepted deliberately. The
   part of the ask that is real — persistent navigation — is already shipped; the part
   that is not is documented here so it does not come back as a code comment.

---

## 12. Open questions for product

- **What is this screen's job in the sitting?** `docs/product/` says nothing about what
  the bench needs in front of it when a matter is called. The framing in §4 is the
  build's, not product's. If the answer turns out to be “this is where the matter is
  worked” rather than “this is what is read before it is called,” decisions 1 and 3
  change — a page that commits something is exactly the page that earns the bottom band.
- **Who logs into each state deployment** (`open-questions.md`) — unchanged and not
  blocking. The bench is confirmed for court-side surfaces only.
- **When does a court-side case file exist, and is it the advocate-side one or its own
  surface?** Decision 5 waits on this.

---

## 13. Gaps in the DS (if any)

None blocking. One observation, not filed: the pinned action-bar band is composed by
hand on eleven Dristi screens with no DS home, so its meaning lives in eleven comments
rather than in the system. That is worth raising as a DS request the day someone builds
the twelfth — it is not a blocker for this brief and I have not added it to
`ds-requests.md` on the strength of an ask that ends in “build nothing.”

---

## 14. Decision log

| Date | What | Who |
|---|---|---|
| 2026-09-06 | Brief opened. Asked whether View case should move to a bottom-left corner in a fixed bar. Answer: **no bottom bar, View case stays top-right, nothing in the layout changes.** The persistent nav asked for already exists as the sticky `ChromeTopBar` trail. Reasoning that previously lived only in `hearing-overview-screen.tsx`'s doc block is recorded here. Job unconfirmed. | ux-designer (user ask) |
| 2026-09-06 | **Overridden, and built.** The owner read the recommendation above and decided the other way: View case leaves the header for a sticky band at the foot of the page, on the house recipe (`order-screen.tsx` — hairline top rule, card fill, no shadow, `z-30` alongside the trail). The action **moved rather than multiplied** — the header now holds caption, cause title and status chip only, so the view still spends one teal, and decision 2 survives intact. Decision 5 is untouched: the button is still `aria-disabled` with the *case file is not connected yet* tooltip, wired to nothing. This makes it the first screen carrying that band that does not commit or advance work, which is the cost decision 1 priced; it was accepted knowingly. | user (override), ui-designer (build) |
| 2026-09-06 | **View case sits on the trailing edge of the band, not the leading.** First build placed it left; the owner asked for the right. Matches the sticky-bar recipe already on `sign-orders-screen.tsx` / `order-screen.tsx` (`justify-end` / `sm:ml-auto`). Tooltip `align` flipped from `start` to `end` so the portalled copy does not overrun the page edge from the right gutter. The button stays `w-fit` at every width — stretching it would make a teal bar, not a right-aligned control. | user (ask), ui-designer (build) |
| 2026-09-06 | **Hearings in the trail is a link on nested listing pages.** It had been text — a section is a disclosure, not a route — so clicking it from the overview did nothing. The owner asked for the crumb to take them back. `courtTrail` now gives the section the queue's href whenever the page is nested under that queue; Today's hearings was already a link to the same place. Queue screens themselves are unchanged: the section stays text, Court home is the way out. | user (ask), ui-designer (build) |
