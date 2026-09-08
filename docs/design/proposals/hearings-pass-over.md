# Pass over on today’s hearings

Status: building
Updated: 2026-09-02
Source: docs/product/product-foundation.md · docs/product/domain/actors.md ·
docs/product/domain/journey.md · docs/product/open-questions.md ·
user in this conversation (2026-09-02): “Passover basically means marking this
hearing as passed over to hear it on a later date”
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`, pin e0cadea6b9d4) — `AGENTS.md`,
`ACCESSIBILITY.md`, `RESPONSIVE.md`, foundations `laws` / `typography` /
`spacing` / `colors` / `elevation` / `icons`, `dropdown-menu` / `button` /
`badge` / `table` / `tooltip`

Code read: `apps/dristi-app/src/components/employee/hearings-table.tsx`,
`hearings-screen.tsx`, `lib/employee/hearings.ts`

---

## 1. Context

**Where this sits.** Today’s hearings (`/employee/hearings`) is the court’s
cause list for the day it is sitting. Each row already has one sitting
control in the Action column: **Start hearing** on a scheduled listing,
the same slot becoming **End hearing** once that listing is ongoing, and a
muted tick once it is completed. Join VC is the screen’s one primary
(page chrome). Orders is a separate ghost icon, `aria-disabled` for this
build. Bulk reschedule (`/employee/hearings/bulk-reschedule`) already owns
moving a span of the board to another date.

**The reference (screenshots, 2026-09-02).** The legacy cause list puts
Pass over in two places at once:

1. On an Ongoing row, a kebab holds **End Hearing** and **Mark as Passed
   Over** as sibling menu items.
2. Ending opens **Confirm End Hearing**, with Pass over as a checkbox:
   “Mark this hearing as Passed Over to hear it later in the day.”

Those two models disagree with each other. They also disagree with the
table we already shipped: End hearing is no longer in a kebab, Start/End
share one labelled outline slot, and there is no confirm-end dialog.

**Confirmed with the owner (this conversation):** Pass over means marking
this hearing as passed over **to hear it on a later date**. That is the
meaning this brief uses. The screenshot’s “later in the day” copy is
noted, not followed.

**In scope:** the row action, the status chip, and the local sitting
overlay (the same class of screen action as Start/End — nothing is
filed). Desktop table and the stacked mobile list.

**Out of scope:** picking the later date (Bulk reschedule / Schedule
already own dates); restoring the confirm-end dialog; putting End hearing
back in a menu; issuing an order or notifying parties.

**Who this is for.** Who logs in is still unanswered
(`docs/product/open-questions.md`). The court-side demo runs as a JMFC
magistrate (`lib/employee/content.ts`); that is a demo identity, not a
product fact. This action is a sitting control on a cause list, so the
brief designs for a professional repeat user (throughput, density) and
flags that assumption in §12.

---

## 2. Problem

1. **The reference hides Pass over behind the wrong verb.** A checkbox on
   Confirm End Hearing makes deferring a side-effect of ending. Ending
   means this listing was heard; passing over means it was not, and will
   be heard on a later date. Those are opposite outcomes.
2. **The kebab was a symptom of icon-only actions, not a home for this
   verb.** The reference overflow held End hearing *and* Pass over because
   the row’s visible control was a glyph. We already moved End into the
   labelled session slot. Re-opening that kebab to dump Pass over beside
   End would undo that work.
3. **Start hearing and Pass over must not compete for the same slot.**
   Start/End are sequential states of one control (call this matter /
   finish the call). Pass over is an alternative outcome: skip or stop
   this listing without completing it. Sharing the button would make
   “Start hearing” mean two things.
4. **The current table explicitly left Pass over out**
   (`lib/employee/hearings.ts`: “that mark is still a real judicial act
   this build does not perform”). The owner is now asking it onto the
   screen, on the same honesty as Start/End: a local status mark, not a
   court record.

---

## 3. Objective

- On a scheduled or ongoing listing, the bench can mark Pass over without
  starting, ending, or opening a date picker.
- Start hearing remains the one labelled outline action on a callable
  row. Pass over is reachable, but visibly secondary.
- A passed-over row is distinguishable from Completed on today’s list, and
  cannot be started again today.
- No second primary, no confirm-end dialog, no kebab that re-absorbs End
  hearing.

---

## 4. Job

**Job: unconfirmed** for the hearings screen as a whole. Product docs do
not say what Today’s hearings is *for* beyond the cause list the code
already ships. Do not invent a slogan.

**This action’s meaning, confirmed with the owner (2026-09-02):** marking
this hearing as passed over to hear it on a later date.

Until the screen Job is confirmed, the row model (one session slot, Pass
over as overflow) is **provisional** on that confirmation — it only has
to stay true to the owner’s words for this verb and to the table we
already built.

---

## 5. Decisions

**D1. Do not put Pass over inside End hearing.** *Judgment, from problem
1.* Ending and passing over are opposite sitting outcomes. A checkbox on
a confirm-end dialog (screenshot 2) is the pattern we are refusing, not
adapting. End hearing stays a direct click on the session slot, as
shipped — no confirm dialog comes back with this work.

**D2. Do not share the Start/End slot.** *Judgment, from problem 3, and
the table’s own comment in `hearings-table.tsx`.* Start and End are one
control across states. Pass over is the other fork: this listing will not
be heard now. Alternative rejected: a split button “Start hearing ▾”
with Pass over in the menu — that nests a deferral under a start verb.

**D3. Pass over lives in a row overflow next to the session control.**
*Judgment, plus ui-craft §2 (“one outline action per row; the secondary
becomes an icon-only ghost”) and Laws Ration teal (Join VC remains the
screen’s one primary).* The overflow is a `DropdownMenu` triggered by a
ghost `Button size="icon"` with `EllipsisVerticalIcon` (DS icons
allowlist; the same meatball the reference used, now holding one verb
instead of two). Item copy: **Pass over** (Laws: sentence case — not
“Mark as Passed Over”). Available on **scheduled** and **ongoing** only.

Alternative rejected: a second labelled ghost “Pass over” on every
callable row. Honest, but two verbs at rest on 23 rows. The overflow is
one extra click in exchange for a table that still reads as one action
per listing.

**D4. No date picker on Pass over.** *Judgment, from the owner’s meaning
plus neighbour ownership.* “Later date” is why the mark exists; choosing
the date is Bulk reschedule / Schedule. This action only marks the
listing. Alternative rejected: a dialog that asks for the next date —
that would be a third scheduling surface.

**D5. Passed over is a status on today’s list, not Completed and not a
departure from the day.** *Judgment.* The bench still needs to see what
was deferred versus what was heard versus what is still to call. Chip
label **Passed over**; Badge `secondary` (the same family as Rescheduled
— deferred, not failed). Abandoned keeps `warning`; Completed keeps
`success`. Colour is never the only cue (ACCESSIBILITY §3) — the word is
on the chip.

Once passed over: the session slot empties (no completed tick — that
tick means the call was finished), the overflow leaves, Start hearing is
not offered. Overlay is local, same class as End: nothing filed,
notified, or written back.

**D6. Same control on the stacked mobile list.** *RESPONSIVE.* Below
`md` the session button already sits with Orders. The overflow sits
between them: session, then Pass over menu, then Orders. Icon button is
`size="icon"` (`size-10`) so the target meets ACCESSIBILITY §8.

**D7. No confirmation, matching Start/End.** *Judgment, consequence
sizing against this build’s honesty.* Start and End already commit on
click because they file nothing. Pass over is the same class of mark. A
confirm dialog only for Pass over would imply it is more real than End,
which it is not in this build. If a later build writes a court record,
confirmation belongs then — on Pass over *and* End.

---

## 6. What I cut (and why)

- **Confirm End Hearing, and its Pass over checkbox.** The dialog
  conflates two outcomes and we already dropped confirmation for End.
- **End hearing inside the overflow.** It has a labelled home.
- **A labelled “Pass over” button beside Start hearing.** Density on a
  23-row cause list; see D3.
- **Picking the later date here.** Neighbour screens own that.
- **A “Passed over” tick or clock in the session slot.** The chip is the
  mark; a second glyph would invent a status icon the completed tick
  already occupies for a different meaning.
- **Same-day recall (start a passed-over listing again today).** The
  owner said later *date*. The screenshot said later in the *day*. We
  follow the owner; recall stays an open question (§12), not a control.
- **Undo.** Start/End have none.

---

## 7. Layout & hierarchy

**Action column (desktop).** Sticky right, as shipped. Contents, in
order: session control (`outline`, `min-w-40`) then, when `canPassOver`,
the overflow. Gap `gap-2`. Column `min-w-56` so the pair does not wrap
the labelled button. Completed / passed-over rows keep the column width;
only the session slot (tick or empty) remains.

**Overflow menu.** `DropdownMenu` / `DropdownMenuContent` `align="end"`,
`shadow-overlay` (elevation: menus are overlay). One item. The menu
width must not inherit the 40px trigger — override the primitive’s
`w-(--radix-dropdown-menu-trigger-width)` with `w-auto min-w-40`.

**Status column.** Unchanged layout; new chip value only.

**Page primary.** Join VC, untouched. Search stays `secondary`. Session
stays `outline`. Overflow stays `ghost`.

**Mobile.** Stacked item: serial + cause, chip, caption, counsel, then
`HearingRowActions` as session + overflow + orders, `gap-2`.

---

## 8. Components (DS name → region)

| Region | DS component |
| --- | --- |
| Session control | `Button` `variant="outline"` (existing) |
| Pass over trigger | `Button` `variant="ghost"` `size="icon"` |
| Pass over menu | `DropdownMenu` · `DropdownMenuTrigger` · `DropdownMenuContent` · `DropdownMenuItem` |
| Status | `Badge` `secondary` for passed over |
| Icon | `EllipsisVerticalIcon` (allowlist) |
| Live announcement | existing `aria-live="polite"` line on the screen |

Do not add `Dialog` / `AlertDialog` for this action.

---

## 9. Spacing

Ladder only. Row actions `gap-2`. Icon control `size-10`. Menu item uses
the primitive’s own padding. No new section break. Action column
`min-w-56` (width, not padding).

---

## 10. States (empty / loading / error / partial / long-label)

| State | Behaviour |
| --- | --- |
| Scheduled | Start hearing + overflow (Pass over) |
| Ongoing | End hearing + overflow (Pass over). Passing over clears the ongoing id and dismisses the peek, same as End. |
| Completed | Tick in the session slot; no overflow |
| Passed over | Empty session slot; no overflow; chip “Passed over”; row stays on today’s list and in the Status filter |
| Rescheduled / abandoned | Still not on today’s list (unchanged) |
| Filter | Status select gains “Passed over” |
| Empty list | Unchanged — Pass over is a row action, not a reason the list is empty |
| Long label | Menu item is two short words; state languages may triple it — `min-w-40` on the menu, wrapping is the primitive’s, do not truncate |
| Loading / error | None — this build has no request |

---

## 11. Risks accepted

- **One-item overflow.** A menu that only holds Pass over is slightly
  awkward. We accept it so Start hearing stays the only labelled row
  action; the overflow is the place later sitting outcomes (if any) go,
  not a licence to grow a kebab of icons.
- **Accidental pass over has no undo** in this build, same as End.
- **“Later date” without a date.** A reader can think the mark scheduled
  the next sitting. The chip says Passed over, not a date; Bulk
  reschedule remains the date path. Copy on the menu is the verb only —
  we do not write “to be heard on a later date” into the row, because
  that would claim a listing we have not made.
- **Who-logs-in.** If this screen is not the bench, a sitting mark on
  every row may be the wrong affordance. Reversible once product answers.

---

## 12. Open questions for product

1. What is Today’s hearings’ job in the real case flow? (Screen Job
   unconfirmed.)
2. Who logs into this screen per state deployment?
3. Can a passed-over listing be called again **today** (screenshot: later
   in the day) or only on a **later date** (owner, 2026-09-02)? This brief
   implements the owner’s words: not callable today.
4. When this mark becomes a court record, does it need confirmation, a
   next date, and/or an order — and does End hearing then need the same?

---

## 13. Gaps in the DS (if any)

None for this action. `DropdownMenu`, `Button`, `Badge`, and
`EllipsisVerticalIcon` already exist. The menu primitive defaulting
width to the trigger is a composition caveat (override in the screen),
not a missing component.

---

## 14. Decision log

| Date | What changed | Who |
| --- | --- | --- |
| 2026-09-02 | Meaning of Pass over: mark this hearing to hear it on a later date. Placement: overflow beside Start/End, not a checkbox on End, not a second labelled button. No date picker. Stays on today’s list as status “Passed over”. | Owner in conversation; brief by ux-designer |
