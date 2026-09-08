# Scrutiny workbench — the raised item, and the re-upload it must not miss

Status: draft
Updated: 2026-09-04
Branch: `feature/fso-scrutiny`
Source: `docs/product/README.md`, `docs/product/domain/practice-notes.md`
(`ke-scrutiny-officer-2026-07` — provisional field observation), `docs/product/open-questions.md`
(who logs in; unresolved), `docs/product/standards/ai-policy.md` (draft SC AI regulations —
human-in-the-loop / audit framing, **not in force**), `docs/design/proposals/scrutiny-return.md`
(the advocate side of this loop; origin of the unlock rule)
DS read: `vendor/pucar-design-system/AGENTS.md`, `foundations/laws`, `foundations/colors`,
`foundations/elevation`, `foundations/icons`, `src/components/ui/{alert,badge,button,item,
field,description-list,card,sonner}.tsx`, plus a glob of `src/components/ui/` (69 components)
Craft read: `.claude/skills/ui-craft/SKILL.md`
Code read: `components/employee/scrutiny/{field-row,flag-composer,bundle-view,fields-panel,
review-dialog,index-rail,case-workbench}.tsx`, `lib/employee/scrutiny/{types,field,sections,
bundle,history,use-scrutiny-state}.ts`

The eight passes of `.claude/skills/propose-ui-brief/references/staff-ux-thinking.md` all ran.
Findings are attributed inline as **(P1)**…**(P8)**. Pass 8 (judge on the render) is **owed** —
see §11 R7 for exactly what must be measured on the running screen before sign-off.

---

## 1. Context

**Where this sits.** `/employee/scrutiny/<filingNo>` is the court-staff side of the loop whose
advocate half is already specified and built in `docs/design/proposals/scrutiny-return.md`. The
officer cross-verifies filed fields against the uploaded bundle, raises items, and either sends
the file back or registers it. Three panes: filed fields (left), bundle (centre), document index
(right); decision bar along the bottom (`case-workbench.tsx`).

**Scope of this brief.** Two problems inside the *raising* act, both on the left panel and the
composer:

1. the **record** a raised item leaves behind (`RaisedItem` in `field-row.tsx`);
2. the **annotation → re-upload disconnect** (`commitRect` in `use-scrutiny-state.ts`).

They are one feature — "what an officer raises, and what it grants" — so they share this file.
Consequential edits fall out into `review-dialog.tsx`, `bundle-view.tsx` and `types.ts`; those
are in scope. The queue screen, history sheet, checks popover, bundle zoom/pan, and the
send-back/register decision flow are **out of scope**.

**Facts I am treating as confirmed (owner, this conversation, 2026-09-04):**

- **The unlock rule.** When the case is sent back, only what an item *names* gets unlocked. A
  field item unlocks that value (and its source document, if it has one). A **document-row**
  item unlocks **re-upload** of that document. An officer who flags a field while meaning
  "re-upload this" strands the advocate — the re-upload control never appears for them.
- The uploaded document is the source of truth for a correction (filed value vs document
  reading) — but the document itself can be bad (cut off, blurred), and that changes the meaning
  of the whole exchange.
- Officers historically left one-word remarks; advocates travelled to court to decode them. That
  is the reason this feature exists at all. (Consistent with `ke-scrutiny-officer-2026-07`,
  which `practice-notes.md` marks **provisional field observation, not a requirement**.)

**What is not confirmed and is not invented here:** who logs into DRISTI per state
(`open-questions.md`). This brief designs the officer-facing surface the owner asked about; that
is a *scope* fact, not a claim about the confirmed persona. Where the two profiles pull apart
(Kerala individual / low volume vs Gujarat bulk institutional), I design for **the more
constrained case — a dense, keyboard-and-mouse staff surface worked at 300 px of panel width by
someone who will do this fifty times a week** — and say so, because the left panel is
`ResizablePanel minSize="24%"` and 24% of 1280 px is 307 px (P4).

---

## 2. Problem

Numbered so decisions can cite them.

**The record of a raised item**

1. **The well says nothing about what is wrong.** After saving a flag on *Full name*, the well
   contains a `Badge` reading "Flag" (which only restates the button that made it), an
   unlabelled 32×56 image, and two hover-revealed buttons. `isDraftDirty()`
   (`lib/.../field.ts`) returns true for **evidence alone**, so a mark-with-no-words is savable
   today — which is precisely the one-word remark the feature exists to kill, drawn instead of
   typed (P1).
2. **The note field is placeholder-only for field items.** `flag-composer.tsx` renders a visible
   `FieldLabel` only when `isDocRow`; everywhere else the note is a `Textarea` with
   `placeholder="Note for the advocate"` and an `aria-label`. `foundations/laws` →
   *Accessibility floor* lists "Placeholder-only fields" under **don't**.
3. **The machine's observation outranks the human's act.** The amber `ocrfail` line ("Not on the
   uploaded Aadhaar — only the address side was uploaded") stays above the well at
   `text-warning-muted-foreground` after the officer has acted on it, so the loudest thing on a
   settled row is the prompt, not the record (P5). And the suppression rule is incoherent:
   `Hints()` hides `docread` and `scannote` when flagged, but keeps `ocrfail`, `aiok` and
   `nodoc` (P6) — three hint kinds behave one way and two the other, for no stated reason.
4. **Marked-on-document evidence is unlabelled and its behaviour is invisible.** The crop is a
   bare `<button>` with a `title` attribute, sitting in the actions row so it reads as a third
   button of unknown purpose. Worse, `evidencePreviewStyle()` returns `null` unless
   `doc.kind === "image"` — so the **affidavit** (`kind: "scan"`, `poorScan: true`), the single
   most-marked document in the fixture and in `history.ts` (open since 7 Jul, three rounds),
   renders as a lone 12 px flag glyph with no words at all (P4).
5. **The item never states its consequence.** `unlocksLabel()` exists in `lib/.../field.ts` and
   is rendered **only** in `review-dialog.tsx` — at the end, in a modal, after all the deciding
   is done. The officer grants a permission at the moment of recording and is shown what they
   granted at the moment of sending (P1, P7).
6. **Craft violations in the well.** `px-2.5 py-2` puts a micro step outside a control
   (`AGENTS.md` rule 7a: micro steps `0.5 / 1.5 / 2.5` are **inside controls only**); the well
   lives inside `DescriptionDetails`, i.e. inside the `1fr` of a
   `grid-cols-[minmax(5.5rem,9rem)_1fr]` row, which at the panel's 24% floor leaves it roughly
   **140 px** wide (P4); and the row can stack two `bg-surface-sunken` boxes — the `Hints`
   thumbnail well and the item well — showing the same document twice (P7).

**The annotation → re-upload disconnect**

7. **A mark drawn from inside a field composer silently lands on the wrong item.**
   `commitRect()` has three outcomes: `armed → attaches silently`, `upload page → opens that
   document's row`, `generated page → declined`. The first branch never asks what the mark
   *means*. An officer who drags a box around a blurred paragraph while the composer for a
   **field** is open produces a field item; the advocate gets the value unlocked and no
   re-upload button (P2).
8. **The fixture contains the trap, and it is the likeliest path, not an edge case.** Two rows
   describe one affidavit: `p-aff` ("Affidavit — Signed & uploaded (scanned copy)", a *field* in
   § 2 *ADR, Other Details & Prayer*, `doc: "affidavit"`, `scannote: "Scanned upload — check for
   blur or missing pages"`) and `d-affidavit` (the *document row* in § 3 *Evidence › Documents*,
   `docrow: "affidavit"`). The `scannote` that tells the officer to look for blur is on the
   **field**. Following it lands them in the field's composer, where marking the blur strands
   the advocate (P1, P2). `TRANSCRIPTS["c-name"]` shows the same shape on the Aadhaar: the
   officer's own dictated words are *"Please upload the front side as well"* — a re-upload
   request recorded on a field item that cannot unlock one.
9. **Nothing catches the miss later.** The review dialog groups items into "Corrections",
   "Flags" and "Document issues — advocate re-uploads" and prints `Unlocks …` per item, but it
   never says *"you marked the Aadhaar and did not unlock re-upload"*. The last gate before an
   irreversible send-back is silent about the one error the design knows how to detect.

---

## 3. Objective

Observable, on the render:

- Reading one saved item answers four questions without a click: **what kind**, **what is
  wrong**, **what backs it up**, **what it unlocks**.
- No item can be saved that says nothing — and the cheapest way to satisfy that is a mic press
  or one reason chip, not an essay.
- Every mark drawn from a field composer onto an *uploaded* document produces either a
  document-row item or an explicit "no" from the officer. Never silence.
- The officer never has to hold the unlock rule in their head: it is printed on the composer, on
  the item, and in the review dialog, in one identical sentence.

---

## 4. Job

**Job: confirmed by scope, in the owner's own framing (this conversation, 2026-09-04):** *"A
scrutiny officer cross-verifies a filed case against the uploaded document bundle"* and raises
items per field — a **correction** proposes a replacement value the advocate confirms; a **flag**
asks the advocate to fix something; items may carry evidence, a rectangle drawn on a bundle page.
The consequence of an item is a permission grant, governed by the unlock rule in §1.

Grounded in product: scrutiny is a named step before numbering and cognizance
(`scrutiny-return.md` §1, citing `product-foundation.md` §3), and the opacity of officer remarks
is the pain being designed against (`ke-scrutiny-officer-2026-07`, provisional).

**Not confirmed:** whether the officer is a DRISTI product user in every state deployment, or a
counterpart on some other system (`open-questions.md`). Nothing in this brief depends on the
answer — only on the officer's own act — so no decision here is provisional on it.

---

## 5. Decisions

Each names the rule or doc behind it, or the word **judgment**; each names the alternative
rejected and what it cost.

### D0 — Push-back first: the fix for problem 7 is not a better prompt, it is a printed rule

The owner asked for a prompt at the right moment, and D8–D12 deliver one. But a prompt that only
fires when the officer has already drawn a mark teaches nothing to the officer who *never draws
one* and simply types "re-upload the front side of the Aadhaar" into a field flag — which is
exactly what `TRANSCRIPTS["c-name"]` records them doing (problem 8). So the prompt is the
**backstop**, and the **primary** fix is D5: the unlock sentence is printed on every composer and
every item, at rest, always, and it names the boundary out loud — *"Unlocks: this value and
Aadhaar — not re-upload."* Ambient truth first, interrupt second. **Given up:** nothing; D5 costs
one caption line. **Judgment**, and it is the decision I would defend hardest.

### D1 — An item cannot be saved without saying what is wrong. Evidence alone is not saying

`canSave = isDraftDirty && saysSomething && linkedComplete`, where
`saysSomething = isCorrected(field, draft) || !!draft.reason || !!draft.text.trim()`.
A correction states itself; a document reason chip states itself; otherwise there must be words.
**A mark does not satisfy it** — a red box with no note is "look here, guess why", which is
problem 1 drawn instead of typed.

*Rejected — require a note on every item:* it taxes the honest path (a correction reading
`₹52,05,000 → ₹50,25,000` with a mark on the cheque needs no essay) at the same rate as the
contested one. The same asymmetry `scrutiny-return.md` §15.3 already settled on the advocate
side; keeping the two sides symmetrical is worth more than a uniform rule.
*Rejected — a soft nudge only:* the owner's bias is that the cost of one extra question is far
lower than a stranded advocate, and a nudge lets the silent item through.

**Reachability of the disabled state** (`ACCESSIBILITY.md`; disabled controls are not
focusable, so the reason must be text next to the field, never a tooltip on a dead control): the
note `Field` carries a permanent `FieldDescription`, which becomes a `FieldError` once the
officer has touched anything else. Copy in §5-copy.
**Given up:** the officer who genuinely wants to record "something is off here, I'll write it
up later" now has to write one line. Accepted.

### D2 — Give the note a visible label, and let the placeholder teach

`FieldLabel` **"What's wrong"** on every composer, field and document row alike (today only doc
rows get one). Rule: `foundations/laws` → *Accessibility floor*, "Placeholder-only fields" is a
listed **don't**. The placeholder becomes an exemplar rather than a restatement of the label —
the cheapest teaching device available and free of new chrome.
*Rejected — a label that switches between "What's wrong" and "Why (optional)" when a correction
is present:* it reflows the composer mid-typing. The optionality moves to the description line
instead, which changes text in a fixed-height slot. **Given up:** a slightly more precise label
for corrections.

### D3 — Once a human has acted, the machine's observation becomes provenance: grey, inside the well

When `flags[field.id]` exists, the row renders **no machine-origin hint line**. `docread`,
`ocrfail` and `aiok` move inside the item's well as one muted caption prefixed **"Document
check:"**. `scannote` stays suppressed (it is an instruction to the officer, not a finding — once
acted on it has no record value). `nodoc` **stays on the row**: it is a standing fact about the
bundle, renders with AI off, and is already grey, so it adds no colour.

That single rule replaces the incoherent three-of-five suppression in `Hints()` (problem 3).

Rules: ui-craft §1.4 (semantic colour is a scarce resource; one status cue per row) and §2
("actions … *replace* the status cue in its slot rather than stacking beside it") — an amber line
above a destructive badge above a grey well is three cues for one settled fact.
`foundations/colors`: `warning-*` reports something needing attention; once the officer has
raised an item, nothing on that row needs attention.
**Not deleted, deliberately:** the observation is kept, attributed, and travels with the item.
`standards/ai-policy.md` records the draft SC regulations' human-in-the-loop and audit framing
(explicitly **not in force**, so this is directional, not compliance) — and independently, a
record that says "the machine said X, the officer did Y" is worth more than either alone.
*Rejected — keep the amber and just tighten the copy:* it leaves the machine louder than the human.
**Given up:** an officer scanning for amber will no longer see it on rows they have already
handled. That is the intent, and R5 owns the risk.

### D4 — Marked-on-document evidence becomes a labelled row, not a floating thumb

One full-width `<button>` inside the well: crop tile · label **"Mark on Doc 7 · Aadhaar"** ·
trailing `ArrowUpRightIcon`. The words carry the meaning (`foundations/icons`: icons are 16 px in
controls and inherit `currentColor`; the arrow is the conventional "goes somewhere" mark, not the
carrier of meaning). Row height 40 px (`h-8` tile + `p-1`), so it clears the Laws' 40×40 target
where the `xs` buttons beside it do not (see D7's logged deviation).

**The fallback is the important half.** When `evidencePreviewStyle()` returns `null` (any `scan`
or `generated` page — i.e. the affidavit), the tile is a `bg-card` well with a muted
`FileTextIcon` and **the label is unchanged**. Today that case renders a 12 px glyph and no
words (problem 4).

Tile geometry (`h-8 w-12`, `rounded-sm`) is copied from the row's own source thumbnail in
`Hints()` — same data type, same rendering (P7; ui-craft §2, "repeated siblings present the same
data type identically"). The tile may carry `border-hairline`: `foundations/elevation` names
chips and thumbnails as the border exception.
**And one thumbnail per row:** when the item's evidence is on the same document the row's
`Hints()` thumbnail shows, the row thumbnail is dropped — the crop is strictly more specific
(problem 6).

### D5 — The unlock sentence is printed in three places, identically, and it names its boundary

`unlocksLabel(field)` is rewritten to return a full phrase, and is rendered as
`<FileTextIcon className="size-3"/> Unlocks: {label}` in **the composer** (consequence strip, at
rest), **the item's well** (footer meta), and **the review dialog** (existing meta row, unchanged
treatment). One string, one icon, one tone, three surfaces (P7).

| Field shape | Phrase |
|---|---|
| `docrow` | `re-upload of Affidavit` |
| field with `doc` | `this value and Aadhaar — not re-upload` |
| field, no `doc` | `this value` |

The middle row is the whole point: the parenthetical appears **exactly** where the
misunderstanding is possible, and nowhere else. It is the cheapest, most-repeated teaching
surface in the feature.
*Rejected — putting it only on the item (the record):* the officer decides in the composer.
*Rejected — a louder treatment (tint, badge):* it would fight the claim line and burn a colour
slot; ui-craft §1.4. **Given up:** loudness. Position and repetition carry it instead.
**Depends on O1** — see §12 for the one clause I cannot verify.

### D6 — The well moves to `col-span-full`, so the record and the composer occupy the same box

`RaisedItem` becomes the row's third grid child with `col-span-full my-1`, exactly as
`FlagComposer` already is. Rules: `RESPONSIVE.md` / P4 — at the panel's 24% floor the well
currently gets ~140 px, which cannot hold a badge, a claim line and two buttons. Side effect
worth having: editing an item no longer moves the box, so the record appears to unfold into the
composer rather than jump.
**Given up:** a little of the visual tie between the value line and its item. The row's own
hover/selected fill and bottom border still contain both.

### D7 — The well's anatomy, in one fixed reading order

```
┌ bg-surface-sunken · rounded-lg · p-3 · gap-2 · col-span-full · NO border ────────┐
│ [Badge]  Only the address side of the Aadhaar was uploaded. Please upload the    │  claim
│          front side as well.                                                     │
│ Filed as ₹52,05,000                                          (corrections only)  │  caption
│ ┌──┐ Mark on Doc 7 · Aadhaar                                              ↗      │  40px button
│ Document check: Not on the uploaded Aadhaar — only the address side was uploaded │  caption
│ Also raised on Aadhaar — re-upload                              (linked only)    │  caption link
│ 🗎 Unlocks: this value and Aadhaar — not re-upload   🎤 Voice note  [Edit][Remove]│  footer
└──────────────────────────────────────────────────────────────────────────────────┘
```

**One chip.** The badge is the item's only chip, and for a document row **its text is the
reason** — "Blurry / unreadable" rather than "Document issue", because the specific fact beats
the category and the category is already evident from the unlock line. Falls back to "Document
issue" when no reason is set. Variants unchanged: `info` for corrections, `destructive`
otherwise (`foundations/colors`; ui-craft §1.4, one status chip per row).

**Claim resolution, one rule:**
`claim = comment ?? (correction ? "Corrected from <filed value>" : null) ?? (reason ? null : SILENT_FALLBACK)`
— and the filed value therefore appears exactly once (as the claim, or as the "Filed as" line,
never both). `SILENT_FALLBACK` is the defensive state D1 makes unreachable for new items; §10.

**Two weights** (ui-craft §1.3): claim at 500, everything else 400 + colour. The badge is a
component with its own internals and does not count against the row's budget.

**Borderless well** (ui-craft §2, "`bg-surface-sunken` well *plus* border → pick one"). The Laws
*permit* a hairline on a well holding interactive content; I decline it, because `DescriptionRow`
already draws a full-strength `border-border` divider above and below every row and the region is
over-stroked as it stands. Restraint, and it is reversible if the render disagrees.

**Spacing:** `p-3`, `gap-2`, `rounded-lg` — matching `FlagComposer`'s own well exactly, and
retiring the off-ladder `px-2.5 py-2` (problem 6; `AGENTS.md` 7a).

**Logged deviation:** `Edit` / `Remove` / the link stay `Button size="xs"` (32 px). The Laws set
a 40×40 minimum touch target. Kept because this is a dense staff panel with a 307 px floor, the
DS ships `xs` for exactly this, and the WCAG 2.1 AA floor in `ACCESSIBILITY.md` has no target-size
criterion. The two targets that matter for touch — the row itself and the evidence button — are
≥40 px, and the pair stays visible on `[@media(hover:none)]` as today. Owner may reverse.

### D8 — The re-upload prompt fires inline in the composer, on the *act* of attaching a mark

**Trigger — narrow and exact.** In `commitRect()`'s armed branch, set
`draft.askReupload = docId` when **all** hold:

- the composing field is **not** itself a document row (`!field.docrow`);
- the marked page maps to a document row (`DOC_ROW[docId]` exists — true for the five uploads,
  false for `synopsis` and `complaint`, which are the fields themselves);
- that document row has **no item yet** (`!flags[DOC_ROW[docId]]`).

It is keyed to the **event**, not to the presence of evidence — so re-opening an item to edit it
never re-asks, and attaching a *new* mark always does. That single choice removes the whole
"noise on the tenth use" problem without a suppression list: at most one question per uploaded
document per case, five in the fixture.

*Rejected — (b) a follow-up step at save time:* by then the officer has moved on, and ⌘↵ saves
from the note field, so the reward for the fastest path would be a surprise dialog.
*Rejected — (c) a standing affordance alone:* it never demands an answer, which is the silent
miss with a fig leaf. It survives as the **resting state** of the same control (D9), not as the
answer.
*Rejected — firing only on `poorScan` documents:* it misses the cut-off-side case on a
clean-looking scan, which is half of what the owner foresaw. `poorScan` earns one extra clause of
copy instead.
**Given up:** an officer who marks the same document from three different fields answers once and
then sees "Already flagged" — correct, but it means the second and third marks are not
individually confirmed as belonging to the document. Accepted; the unlock already exists by then.

### D9 — One region, three states: the consequence strip

The composer gains a strip between the fields and the action bar. The evidence controls move out
of the action bar into an attachments strip above it, so the button row holds only commit actions
(P6 — the action bar currently mixes attach and commit verbs).

| State | Renders |
|---|---|
| **rest** | `Unlocks: …` caption · and, when `DOC_ROW[field.doc]` exists and has no item, a `Button variant="link" size="xs"` **"Flag the Aadhaar upload"** |
| **rest, already raised** | `Unlocks: …` caption · **"Already flagged: Aadhaar — re-upload"** (link to that row) |
| **question** | the `Alert` of D10 |
| **linked** | the sub-block of D11 |

The standing link is also the **accessibility answer**: a rectangle can only be drawn with a
pointer drag, so a keyboard-only officer can never reach the D8 trigger. They reach the same
outcome in one click, always (R4).

### D10 — The question is a non-modal `Alert` inside the composer, with two buttons

DS `Alert` (default variant, `className="border-hairline"`), placed in the consequence strip.
`bg-card` on the composer's `bg-surface-sunken` well: the fill change does the separating and the
hairline softens the edge (ui-craft §1.1 border ladder; `foundations/elevation` — depth is fill,
not borders). No tint: this is a question, not a status report, and amber inside this composer
already means `prefilled` (`foundations/laws` — "never use warning as a stand-in for prefilled";
the reverse collision is just as real, since the correction box above it is literally rendering
`prefilled` amber on this very field).

`role="alert"` is hard-coded in the DS component and is **correct here**: the officer's focus is
on the bundle at that instant (they have just finished a drag), so an assertive announcement is
how a screen-reader user learns the question appeared. Focus is **not** moved — that would steal
the pointer from someone about to draw a second box. Buttons sit in a `col-start-2` row below the
description (the `Alert` grid puts a third child in column 1 otherwise).

*Rejected — a modal / `AlertDialog`:* it blocks a drawing gesture that is often repeated, and the
answer is not irreversible.
*Rejected — a toast:* it is dismissible by time, and this question must not expire.

### D11 — "Yes" opens a linked sub-composer; nothing is created until Save, and Save writes both

"Yes" does **not** silently create an item and does **not** navigate away. It replaces the Alert
with a compact block inside the same composer:

- heading **"Also raising: Aadhaar — re-upload"** + ghost `xs` **"Don't flag the upload"**;
- the **three `DOC_REASONS` chips** — the same `Button variant={on ? "secondary" : "outline"}
  size="sm"` control the document-row composer already uses (P7) — and **one is required**;
- an optional `Textarea` note of its own.

Then `saveFlag()` writes **two** entries in one act and the primary button reads **"Save both"**.

**What the linked item carries:**

| Carries | Decision |
|---|---|
| **Evidence** | **The same rectangle, copied.** The advocate's screen may never show the field item's mark beside the document item, and the mark *is* the picture of the defect. |
| **Reason** | **Required** — it is what makes the item legible, and it satisfies D1 in one click. Never pre-selected, not even on `poorScan`: pre-filling a defect assertion on the officer's behalf is the machine making a claim. |
| **Note** | **Its own, optional. Never copied.** The field note is about the value ("only the address side was uploaded"); the document note is about the file ("re-scan at 300 dpi"). Two items repeating one sentence leave the advocate unable to tell whether re-uploading answers both. |
| **Link** | `Flag.linkedTo` (field → row) and `Flag.linkedFrom` (row → field), kept in sync. |

*Rejected — creating the document item on "Yes" immediately:* it gives no chance to say what is
wrong and no undo before save.
*Rejected — saving the field item and opening the document row's own composer:* it fails when the
field draft is not yet saveable under D1, and it moves the officer's eye 200 px down the panel
mid-thought.
**Given up:** the document item cannot be given a *voice* note in the linked block (the mic stays
on the field note). Reachable by editing the document row afterwards.

### D12 — One mark on the page, not two; and the two items read as a pair everywhere

Because D11 copies the rectangle, a naive render draws two identical boxes stacked on the same
page with two flag tags — a duplication the officer would read as two defects (P4/P7).

- `collectMarks()` drops a mark whose `flag.linkedFrom` partner carries an identical rect, and
  gives the survivor a `count`. `MARK_TAG` shows `count` in `tabular-nums` when > 1 and the
  `FlagIcon` when 1 (the tag is already `min-w-5` for exactly this).
- `docMarkCount()` (index rail badge) dedupes the same way, so the rail's count matches the boxes
  on the page.
- Clicking the shared mark opens the **field** item — it holds the officer's words.
- The well shows the pair in both directions: **"Also raised on Aadhaar — re-upload"** on the
  field item, **"Raised with Full name"** on the document item; both are links that select and
  scroll to the partner row.
- The review dialog keeps its existing three groups and the true count of **two** items — because
  two grants genuinely exist. Each carries the same link line in its meta row, which is what
  stops the "did I raise this twice?" read.

### D13 — Removing an item never silently removes another one

| Act | Result |
|---|---|
| Remove the **field** item, no link | as today. |
| Remove the **field** item **with** a link | the document item **stays** (a bad scan is still a bad scan); its `linkedFrom` is cleared; a `Sonner` toast says **"Flag removed. The document issue on Aadhaar stays."** with the action **"Remove it too"**. |
| Remove the **document** item | it goes; the partner's `linkedTo` is cleared and the "Also raised…" line disappears. No toast — the field item never depended on it. |
| Edit the **field** item | the composer opens with the linked block in its saved state; **"Don't flag the upload"** unlinks and deletes the document item on save. No question fires (D8 is event-keyed). |
| **Remove mark** on the field item, link **unsaved** | the block collapses back to the standing link — it was born from that mark. |
| **Remove mark** on the field item, link **saved** | the document item keeps its own copy of the rect and is untouched. |

Rule: `foundations/laws` — irreversible/destructive acts get a stated consequence, and Sonner is
the DS's non-blocking way to state one with an action. *Rejected — an `AlertDialog` confirm on
every remove:* heavy for an item that can be re-raised in ten seconds. **Build prerequisite:**
`<Toaster />` is mounted in `app/(app)`, `app/home`, `app/tasks` and `app/(portal)` layouts but
**not** in `app/employee/(shell)/layout.tsx`. One line.

### D14 — The review dialog becomes the last backstop, and it names the stranded item

For each field item where `flag.evidence` lands on a document that has a `DOC_ROW` with no item
raised, `SummaryItem` prints one line in `text-warning-ink`:

> **Marked on Aadhaar — re-upload is not unlocked.**  [Open the item]

`warning-ink` is status text on a neutral background, never a fill (`AGENTS.md` token table);
icon + word + colour, so it is not colour alone (`foundations/laws`). "Open the item" closes the
dialog and calls the workbench's existing `goToItem()`, which already selects and scrolls
(`case-workbench.tsx`) — a way back into the work, not a dead record, matching how the history
sheet already behaves (P7). It does **not** offer to create the document item from the dialog:
the officer should choose the reason with the page in front of them.
**Given up:** one extra hop for the officer who wants to fix it from here.

---

### §5-copy — every new string

Sentence case throughout (`foundations/laws`). Staff-facing, so `text-body-compact` is the
density default and `text-caption` carries metadata; `text-body` is reserved for citizen copy.

**Composer**

| # | Where | String |
|---|---|---|
| C1 | Note `FieldLabel` (all items) | `What's wrong` |
| C2 | Note `FieldDescription`, rest | `The advocate sees only what you write here.` |
| C3 | Note `FieldDescription`, when a correction is present | `Optional — the correction already says what changed.` |
| C4 | Note `FieldError`, field item, save blocked | `Say what's wrong — one line is enough. Type it or use the mic.` |
| C5 | Note `FieldError`, document row, save blocked | `Say what's wrong — pick a reason or write a line.` |
| C6 | Note placeholder | `e.g. Only the address side was uploaded — please upload the front.` |
| C7 | Consequence strip, rest | `Unlocks: this value and Aadhaar — not re-upload` · `Unlocks: this value` · `Unlocks: re-upload of Affidavit` |
| C8 | Standing link | `Flag the Aadhaar upload` |
| C9 | Already-raised link | `Already flagged: Aadhaar — re-upload` |
| C10 | Question title | `Does the advocate need to re-upload Aadhaar?` |
| C11 | Question body | `This mark stays with Full name. Re-upload only opens if you raise it on the document too.` |
| C12 | Question body, `poorScan` docs — appended | ` This upload is already marked as a poor scan.` |
| C13 | Question buttons | `Yes — flag the upload` (`secondary`) · `No` (`ghost`) |
| C14 | Linked block heading | `Also raising: Aadhaar — re-upload` |
| C15 | Linked block reason label | `What's wrong with the document?` |
| C16 | Linked block reason error | `Pick what's wrong with the document.` |
| C17 | Linked block note placeholder | `Note for the advocate (optional)` |
| C18 | Linked block dismiss | `Don't flag the upload` |
| C19 | Save button, linked | `Save both` (`aria-label="Save the flag and the document issue"`) |

Document names use `shortDocName()` from `lib/.../bundle.ts` — "Aadhaar", not "Aadhaar —
Complainant" — everywhere in C7–C14, so a Malayalam or Gujarati bundle name does not blow the
line (P4).

**Item well**

| # | Where | String |
|---|---|---|
| I1 | Badge | `Correction` · `Flag` · the reason (`Blurry / unreadable`, …) · `Document issue` |
| I2 | Claim, correction with no note | `Corrected from ₹52,05,000` |
| I3 | Filed line | `Filed as ` + `<s>₹52,05,000</s>` |
| I4 | Silent fallback (defensive) | `No note — the advocate won't know what to fix.` (`text-warning-ink`) |
| I5 | Evidence row | `Mark on Doc 7 · Aadhaar` — `aria-label="Go to the mark on Doc 7, Aadhaar"` |
| I6 | Provenance | `Document check: Not on the uploaded Aadhaar — only the address side was uploaded` / `Document check: reads ₹50,25,000/- — flagged at filing, skipped` / `Document check: Consistent with the accused's address` |
| I7 | Link line, field item | `Also raised on Aadhaar — re-upload` |
| I8 | Link line, document item | `Raised with Full name` |
| I9 | Footer meta | `Unlocks: …` (identical to C7) · `Voice note` (today's "Voice" — unified with the review dialog, P7) |

**Toasts & review dialog**

| # | Where | String |
|---|---|---|
| T1 | Remove linked field item | `Flag removed. The document issue on Aadhaar stays.` · action `Remove it too` |
| T2 | Review dialog, stranded mark | `Marked on Aadhaar — re-upload is not unlocked.` · `Open the item` |
| T3 | Review dialog meta, linked pair | `Linked to Aadhaar — re-upload` / `Linked to Full name` (`Link2Icon`) |

---

## 6. What I cut (and why)

- **A modal for the re-upload question.** It blocks a gesture officers repeat, and the answer is
  reversible. The inline Alert answers in place.
- **Auto-creating the document item when the marked doc has `poorScan`.** Creating an unlock the
  officer never asked for is the mirror image of the defect being fixed, and it makes the product
  the author of a legal grant.
- **Copying the officer's note onto the linked document item.** Two items saying one sentence is
  worse than one item saying nothing — the advocate cannot tell what answers what.
- **A second red box on the bundle for the linked item.** Two identical stacked rectangles read
  as two defects (D12).
- **A "linked pair" group in the review dialog.** The three existing groups mirror what the
  advocate receives; a fourth grouping optimised for how the officer *entered* the items would
  fork the vocabulary between the two sides of the loop.
- **Severity or priority on items.** The model has none and every item blocks equally; inventing
  a ranking would be inventing product.
- **A general undo stack for Remove.** The one destructive case with a non-obvious consequence
  (a surviving linked item) gets a toast action; the rest are cheap to re-raise.
- **Requiring a note on every item.** D1 keeps the requirement to a *statement*, satisfiable by a
  correction or a reason chip.
- **Fixing `DescriptionRow`'s `border-border` row dividers to hairline.** Real ui-craft finding,
  DS component, whole-panel blast radius. Not this brief's day.

---

## 7. Layout & hierarchy

### 7.1 The row, after

```
┌ DescriptionRow · grid-cols-[minmax(5.5rem,9rem)_1fr] · hover fill · border-b ────┐
│ Full name    │ Prateek Agrawal                                        🗎  ⚑     │
│              │ Not in any document            ← nodoc only; machine hints moved  │
├──────────────┴───────────────────────────────────────────────────────────────────┤
│ [ the well — col-span-full, D7 ]                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

The one **primary teal** action on this screen remains `Register case` in the decision bar
(`foundations/laws`, ration teal). Nothing in the well or the composer is `variant="default"`:
Save is the composer's own primary and stays `size="sm"` default-variant as today — it is the
primary of a *region*, and the region is modal-ish while open. `Yes — flag the upload` is
`secondary`, `No` is `ghost`, the standing link is `link`, Edit is `ghost`, Remove is
`destructive-ghost`.

### 7.2 The composer, after

```
┌ bg-surface-sunken · rounded-lg · p-3 · gap-4 · col-span-full ────────────────────┐
│ Filed            ₹52,05,000                                  (field items only)  │
│ Your correction  [AI]  [ Textarea prefilled ]                (field items only)  │
│ What's wrong           [ Textarea + mic ]                                        │
│ The advocate sees only what you write here.                                      │
│ [Blurry / unreadable] [Wrong document] [Page missing]        (document rows only) │
│ ── attachments ──────────────────────────────────────────────────────────────────│
│ ┌──┐ Mark on Doc 7 · Aadhaar    [Remove mark]     |or|  ⟨cam⟩ Mark on document   │
│ ── consequence ──────────────────────────────────────────────────────────────────│
│ 🗎 Unlocks: this value and Aadhaar — not re-upload        [Flag the Aadhaar upload]│
│   …or the Alert (D10)…  …or the linked block (D11)…                              │
│ ── actions ──────────────────────────────────────────────────────────────────────│
│                                                  [Cancel]  [Save flag | Save both]│
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Above the fold at 307 px:** claim line, evidence row, unlocks line. The provenance line and the
action pair may fall below; both are recoverable by scrolling the panel that the officer is
already scrolling.

### 7.3 State model (the UI depends on this shape; it is not an implementation detail)

```ts
// types.ts
interface Flag {                       // + two pointers
  …
  linkedTo?: string | null             // field item → document-row field id
  linkedFrom?: string | null           // document item → field id
}

interface LinkedDoc { rowId: string; docId: string; reason: string | null; note: string }

interface Draft {                      // + two fields
  …
  askReupload: string | null           // bundle doc id, set by commitRect (D8)
  linked: LinkedDoc | null
}
```

Controller gains `answerReupload(yes: boolean)`, `updateLinked(patch)`, `clearLinked()`;
`removeFlag(id)` returns the unlinked partner id so the caller can raise T1.

### 7.4 Build order (one day)

1. `types.ts` + `field.ts` — `linkedTo`/`linkedFrom`, `LinkedDoc`, `saysSomething`, the rewritten
   `unlocksLabel`. (~30 min)
2. `use-scrutiny-state.ts` — `askReupload` in `commitRect`, `answerReupload`, `saveFlag` writing
   two entries, `removeFlag` unlinking. (~90 min)
3. `field-row.tsx` — `RaisedItem` rebuilt per D7, `Hints` suppression per D3, `col-span-full`.
   (~2 h)
4. `flag-composer.tsx` — label + description/error, attachments strip, consequence strip, Alert,
   linked block, Save label. (~2 h)
5. `bundle-view.tsx` + `index-rail.tsx` — mark dedupe and count. (~30 min)
6. `review-dialog.tsx` — link meta + stranded line + `onGoToItem`; `<Toaster />` in the employee
   shell. (~45 min)
7. Render pass — §11 R7's measurements, both themes, 307 px and 200% zoom. (~45 min)

---

## 8. Components (DS name → region)

| Region | DS component | Note |
|---|---|---|
| Item well | plain `div`, `bg-surface-sunken` | a well, not a `Card` — `foundations/elevation`, wells live inside panels |
| Item kind | `Badge` `info` / `destructive` | the row's one chip |
| Evidence row | `<button>` + local crop tile | the crop is a `background-position` composition that already exists (`evidencePreviewStyle`) |
| Item actions | `Button` `ghost` / `destructive-ghost`, `size="xs"` | unchanged; deviation logged in D7 |
| Link lines | `Button variant="link" size="xs"` | |
| Note field | `Field` + `FieldLabel` + `FieldDescription` + `FieldError` + `Textarea` | `FieldError` replaces the description in the same slot — no reflow |
| Reason chips | `Button` `secondary`/`outline` `size="sm"` with `aria-pressed` | the control the document-row composer already uses |
| Re-upload question | `Alert` (default) + `AlertTitle` + `AlertDescription` + `Button` ×2 | `className="border-hairline"`; no tint (D10) |
| Linked block | `div` `bg-card border-hairline rounded-md` + the chips + `Textarea` | same treatment as the Alert it replaces |
| Remove-with-link consequence | `Sonner` toast with action | needs `<Toaster />` in the employee shell |
| Review dialog additions | existing `SummaryItem` markup + `Button variant="link" size="xs"` | |
| Icons | lucide, `size-3` in caption rows / `size-4` in controls | `foundations/icons`: 16 px default in controls, stroke inherits `currentColor` |

**Nothing new is proposed.** Every element composes primitives already in
`apps/dristi-app/src/components/ui/`.

---

## 9. Spacing

Ladder only — `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`; micro steps inside controls
only (`AGENTS.md` 7a).

- Item well: `p-3`, `gap-2`, `rounded-lg`, `my-1` — identical to `FlagComposer`'s well, which is
  the point of D6. Retires `px-2.5 py-2`.
- Claim line: `flex items-start gap-2`; badge unchanged; claim `flex-1 min-w-0 break-words`.
- Evidence row: `p-1 pe-2`, `gap-2`, tile `h-8 w-12 rounded-sm` → 40 px row.
- Footer: `flex flex-wrap items-center gap-2`; actions `gap-1`.
- Composer strips: `gap-4` between strips, `gap-2` inside a strip; Alert keeps its own DS padding
  and gets `mt-2` on the button row.
- Linked block: `p-3`, `gap-2`, `rounded-md` (one step inside the `rounded-lg` well).
- Containers `p-6` / `rounded-xl` and controls `h-10` / `rounded-lg` are untouched; the panel's
  `Card size="sm"` keeps `--card-spacing: 4`.

---

## 10. States

| State | Treatment |
|---|---|
| **No item on a row** | nothing renders. Rows with nothing to say say nothing (existing rule, kept). |
| **Item with note, no evidence** | claim + unlocks + actions. Three lines. |
| **Item with evidence on a `scan` / `generated` page** | evidence row renders the `FileTextIcon` fallback tile with the label unchanged (D4). This is the affidavit — the most likely case, not an edge. |
| **Silent item** (no note, no reason, no correction) | unreachable for new items under D1; if present in older state, claim renders I4 in `text-warning-ink` and Edit fixes it. Fail loud, never blank. |
| **Machine hints with AI off** | `aiOn === false` → no provenance line at all; `nodoc` still renders on the row. |
| **Question, keyboard-only officer** | never fires (no drag possible); the standing link in the consequence strip is the route, always present when the field has a source document (D9, R4). |
| **Question answered "No"** | strip returns to rest, standing link still there — one click to change their mind. Nothing is recorded (see O2). |
| **Linked block with no reason chosen** | Save disabled; C16 renders under the chips. |
| **Document already has an item** | no question; strip shows C9 linking to that row. |
| **Loading / error** | none. All state is local to the session; nothing here fetches. Say so rather than shipping a skeleton that can never render. |
| **Empty case (nothing raised)** | decision bar hides `Send back`; review dialog's `Empty` state unchanged. |
| **Long claim** | wraps, never truncates or clamps — the officer's words are the record. |
| **Long provenance** | `line-clamp-2` + `title` (machine text, not the record). |
| **Long document name** (Malayalam / Gujarati bundle labels) | `shortDocName()` everywhere in copy; evidence label `min-w-0 truncate`; unlocks line wraps; reason chips already `flex-wrap`; question buttons wrap to their own line. |
| **307 px panel** (`minSize="24%"` at 1280) | the `col-span-full` well (D6) is what makes this survivable; verify per R7. |
| **200% text zoom** | the well and composer are flow-laid with wrapping rows and no fixed heights; the resizable group already reflows. Verify per R7. |
| **Touch / `hover:none`** | Edit/Remove stay visible as today; the evidence row is a 40 px target; the question's buttons are `size="sm"` (36 px) — one step under the Laws' 40, same logged deviation as D7. |

---

## 11. Risks accepted

- **R1 — One defect now sends two items.** The count in the decision bar and the review dialog
  rises. Accepted: two grants genuinely exist and faking one number would hide a permission.
  Mitigated by the bidirectional link lines (D12).
- **R2 — Residual question noise.** Up to five per case in the fixture (one per uploaded
  document). Accepted as the price of never missing the first one, per the owner's stated bias.
- **R3 — D1 is defeatable by typing ".".** No gate stops a determined officer. The design's job
  is to make the honest path cheaper than the dishonest one: mic → transcript, exemplar
  placeholder, one-click reason chips.
- **R4 — Marks require a pointer drag; keyboard-only officers cannot draw.** Pre-existing, not
  introduced here. Mitigated: an item's meaning never depends on a mark (D1), and the standing
  link (D9) reaches the re-upload outcome without one. Worth raising as its own piece of work.
- **R5 — Amber disappears from rows the officer has already handled** (D3). Intended; a reviewer
  may read it as "the AI warning vanished". Mitigated by the provenance line, which keeps the
  observation attached to the item that answered it.
- **R6 — `role="alert"` announces assertively** and will interrupt a screen reader mid-sentence
  if the officer somehow drew a mark while a live region was speaking. Accepted: the alternative
  (polite) risks the question going unheard, and the question is the whole point.
- **R7 — Pass 8 is owed.** This brief judged source and computed widths; it did not open the
  running screen (no dev server may be started from an agent shell — `.claude/rules/dev-server.md`).
  Before sign-off, on `http://localhost:3000/employee/scrutiny/...`, measure: (a) the well at the
  panel's 307 px floor with a 3-line claim; (b) `bg-surface-sunken` well vs `bg-card` linked
  block vs the `bg-muted` panel canvas — three fills within 20 px of each other, in **both**
  themes (in dark, `muted` sits *above* `card`, which is why `FieldsPanel` carries
  `dark:bg-background`); (c) the crop tile's `border-hairline` against a light scan; (d) the
  40 px evidence row and the 32 px `xs` buttons side by side; (e) the `Alert`'s hairline on the
  sunken well at 100% and 200% zoom.

---

## 12. Open questions for product

- **O1 — What does a field item actually unlock on the advocate's side, beyond the value?**
  `unlocksLabel()` asserts "the value and \<its document\>", and the confirmed rule says a field
  item unlocks the value *and its source document* while only a document-row item unlocks
  **re-upload**. If "unlocks the document" means view-only (or nothing at all), C7's middle
  phrase should shrink to `Unlocks: this value — not re-upload of Aadhaar`. The copy is printed
  in three places and travels to the advocate; it must be true. **Build on the string in C7; one
  answer flips one constant.**
- **O2 — Should a "No" be recorded?** Today it leaves no trace. A registry that later asks "did
  anyone consider whether that scan was legible?" has no answer. Low stakes, real question; the
  draft SC AI regulations' audit-log framing (`standards/ai-policy.md`, **not in force**) points
  the same way. Not built until asked for.
- **O3 — Can two field items legitimately need re-upload of the *same* document?** D11 allows
  only one document item per document (the second field sees C9). If the registry ever wants two
  distinct document defects on one file, this rule changes.
- **O4 — Who logs into DRISTI per state** (`open-questions.md`). Standing. Nothing here depends
  on it; §4 records how this brief proceeded without it.

---

## 13. Gaps in the DS

**None new.** Everything composes from the 69 components in `src/components/ui/`.

Two standing requests already filed by `scrutiny-return.md` §13 are re-encountered here and
should not be duplicated: (1) an **audio note primitive** — this workbench hand-rolls a mic +
timer inside the note `Textarea`; (2) a documented **"annotation over a document"** pattern —
this is now the third caller of that geometry (`filing/source-panel.tsx`, the advocate's defect
view, and `bundle-view.tsx`). Restate them in the build report; do not open new entries in
`docs/design/ds-requests.md`.

One observation for the DS, not a request: `Alert`'s hard-coded `role="alert"` makes it the wrong
primitive for a polite, non-urgent inline question. It happens to be right here (D10). A future
`Alert` with a `live` prop would settle it once instead of per screen.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-04 | Brief created for `feature/fso-scrutiny`. Two problems, one file. The unlock rule, the correction/flag distinction, and the historical one-word-remark pain recorded in §1 as **confirmed by the owner in this conversation**, not inferred. | ux-designer |
| 2026-09-04 | **D0** — the primary fix for the annotation/re-upload disconnect is the printed unlock sentence (D5), not the prompt. The prompt is the backstop. Pushing back on the shape of the ask, not its substance. | ux-designer (judgment) |
| 2026-09-04 | **D1** — evidence alone no longer satisfies the save gate. This is a behaviour change to `isDraftDirty`'s role and will make some existing demo gestures fail closed. Deliberate. | ux-designer (judgment) |
| 2026-09-04 | **D3** — machine hints move inside the well as grey provenance once an item exists, replacing the incoherent three-of-five suppression in `Hints()`. `scannote` stays suppressed; `nodoc` stays on the row. | ux-designer (ui-craft §1.4, `foundations/colors`) |
| 2026-09-04 | **D6** — the well moves to `col-span-full`, matching the composer. Driven by the measured 140 px it gets at the panel's 24% floor, not by taste. | ux-designer (P4, `RESPONSIVE.md`) |
| 2026-09-04 | **D7 deviation** — `size="xs"` (32 px) kept for Edit / Remove / links against the Laws' 40×40 target, on a dense staff panel with a 307 px floor. WCAG 2.1 AA floor unaffected. **Owner may reverse.** | ux-designer (logged deviation) |
| 2026-09-04 | **D8** — the prompt is keyed to the *act* of attaching a mark, not the presence of one. That is what removes the "noise on the tenth use" problem without a suppression list, and what stops edits from re-asking. | ux-designer (judgment) |
| 2026-09-04 | **D11** — the linked document item copies the rectangle, requires its own reason, and never copies the note. **D12** — one box on the page, count on the tag. | ux-designer (judgment) |
| 2026-09-04 | **D13** — removing a field item never deletes its linked document item; a Sonner toast offers it. Requires `<Toaster />` in `app/employee/(shell)/layout.tsx` — a build prerequisite, not a nice-to-have. | ux-designer |
| 2026-09-04 | **Pass 8 owed.** No render was inspected; R7 lists the five measurements that must happen before sign-off. | ux-designer (honest gap) |
