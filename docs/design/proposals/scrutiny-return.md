# Scrutiny return — advocate defect resolution

Status: built (feature/scrutiny-back-adv)
Updated: 2026-08-21
Source: docs/product/product-foundation.md (§3 Kerala operational spine, step 2 — "Scrutiny
& defect check (Registry; before numbering / cognizance)"), docs/product/domain/practice-notes.md
(`ke-scrutiny-officer-2026-07`), docs/product/domain/actors.md (scrutiny officer as a *domain*
role), docs/product/terminology.md, docs/product/open-questions.md
DS read: `vendor/pucar-design-system/AGENTS.md`, `RESPONSIVE.md`, `ACCESSIBILITY.md`,
`foundations/laws`, `foundations/colors`, `foundations/elevation`, `foundations/accessibility`,
glob of `src/components/ui/` (68 components), `src/components/ui/attachment.tsx`,
`src/components/ui/marker.tsx`
Code read: `apps/dristi-app/src/lib/filing/types.ts`, `.../filing/steps.ts`,
`.../lib/tasks/types.ts`, `.../components/tasks/act/fix-page.tsx`,
`.../components/filing/{sections-rail,form-field,source-panel}.tsx`

---

## 1. Context

**Where this sits in the case.** Scrutiny is step 2 of the Kerala operational spine: the
Registry checks a filed complaint for defects *before* the case is numbered and before
cognizance (`product-foundation.md` §3). Nothing downstream moves until the defects are
cured. The §138 clocks are statutory (notice 30 days, payment window 15 days, complaint
within 1 month of the cause of action; endeavour to conclude within 6 months of filing —
same doc), so a filing parked in scrutiny is a filing parked against a clock the design
does not control.

**Where this sits in the product.** Two neighbours, both already built:

| Neighbour | Relationship |
|---|---|
| Pending tasks (`/tasks`) | Owns the *returned* task kind. Its `Fix` verb is the entry point. |
| E-filing (`/filings/<draftId>/<step>`) | Owns the 13-step form, its sections rail, and every field a defect can point at. |

This screen is the join between them: it is the e-filing form, re-entered in a
correction posture, driven by what scrutiny sent back.

**Scope confirmed with the owner (2026-08-21), in this conversation:**

1. **Advocate side only.** The scrutiny officer's own tooling is out of scope; this brief
   assumes the officer's output exists and describes only what the receiving side sees.
   (`lib/tasks/types.ts` already scopes the tasks app the same way: "courtroom staff …
   out of scope for this advocate-side app".)
2. The officer flags **fields** (section → instance → field, e.g. Cheque 2 → IFSC) and/or
   **whole documents** (bad scan, signature cut off → re-upload, auto-fill where OCR applies).
3. Per defect the officer may attach: a text note (always), a voice note (optional), an
   annotation box on the uploaded scan (optional), a suggested correction old → new with
   supporting evidence (optional).
4. Three-pane layout (sidebar / form / Resolution queue) per the owner's wireframe — §7.
5. Resolution mechanics: accept a suggestion in one click; edit manually; **overriding an
   explicit suggestion requires a justification** (which doubles as the dispute channel);
   document defects replace the upload and auto-fill downstream fields where extraction applies.
6. Entry: the pending-tasks `returned` task → **Fix**, replacing `fix-page.tsx`. A second
   entry from a future File-a-Case dashboard is out of scope for now.
7. Post-submit: no dedicated screen — a confirmation moment, then back to the entry point.
8. Demo fixture: 6–8 defects across cheque (including a Cheque 2 instance), complainant,
   demand notice, and one document defect, mixing feedback shapes.

**Out of scope for this brief:** the FSO/registry-side authoring screen; the File-a-Case
dashboard entry; a second scrutiny round's UI beyond "the same screen, opened again";
payment or re-signature consequences of a correction (see open question O5).

---

## 2. Problem

Numbered so decisions can cite them.

1. **The current fix flow is a checklist, not a correction.** `fix-page.tsx` renders each
   defect as `Checkbox + text + optional file slot`, and re-file unlocks when every box is
   ticked. Nothing in it touches the filing. The advocate self-certifies that something was
   fixed somewhere else. Its own header comment concedes this: *"This is interim behaviour:
   fixing defects belongs to the scrutiny screens, which are not built yet."*
2. **A defect cannot say where it is.** `Defect = { n, text, fixed, replacement? }` has no
   section, no instance, no field. With repeating instances in the model — `cheques[]`,
   `accused[]`, `complainants[]`, `witnesses[]` (`filing/types.ts`) — "IFSC is wrong" is
   ambiguous the moment there are two cheques. The advocate resolves that ambiguity by
   guessing, and guessing wrong costs a second return and another clock.
3. **A defect cannot carry the officer's reasoning.** One free-text line is the whole
   channel. The field observation `ke-scrutiny-officer-2026-07` records exactly this as the
   pain: the officer "often does not mark defects properly, holding files so the advocate
   approaches him". Opacity is the problem being designed against, and a `text` string is
   not a remedy for it. (Provisional field observation, not a requirement — see O1.)
4. **There is no way to disagree in-product.** Today the advocate either silently complies
   or leaves the platform to argue. That both hides the disagreement from the record and
   feeds the informal channel the note describes.
5. **Correcting means leaving.** Even if the advocate knows what to change, the fix lives in
   a different route (`/filings/<id>/cheque`) with no memory of why they went there, and no
   route back to the task.
6. **Nothing shows how far the correction has got.** Neither the tasks table nor the fix
   modal answers "what is still open on this return" beyond a tick count that means only
   "someone ticked it".

Problem 1 is the one that makes this a rebuild rather than a polish.

---

## 3. Objective

Observable, in the demo and later in the product:

- Every defect resolves to **one identified field or one identified document**, and the
  advocate reaches it in one click from the queue — no searching, no guessing which cheque.
- The officer's full reasoning (note, voice, annotation, suggestion) is visible **beside the
  field it concerns**, not summarised into one line.
- The advocate can **disagree on the record**: an override of a suggestion always produces a
  written justification that travels back with the correction.
- Submission is gated on **every defect being addressed** — where "addressed" means a change,
  an accepted suggestion, or a justified override, never a self-certified tick (problem 1).
- Progress is legible at a glance and at any zoom: "N of M resolved".

---

## 4. Job

**Job (owner's framing, this conversation, 2026-08-21):** *"Scrutiny return — advocate
defect resolution."* The screen is where an advocate whose filing came back from scrutiny
sees exactly what the officer flagged, fixes it in the filing itself, and submits the
corrections back to scrutiny.

Grounded in product: scrutiny is a named step in the Kerala spine, before numbering and
cognizance (`product-foundation.md` §3). The pain being designed against — defects marked
poorly and opaquely, files held — comes from `ke-scrutiny-officer-2026-07`, which the source
doc marks **provisional field observation, not a requirement**.

**What is still not confirmed and must not be invented:** who logs into DRISTI in each state
(`open-questions.md`). "Advocate-side" here is a *scope* decision by the owner about which
side of the exchange we build, not a claim that advocates are the confirmed product persona.
Where the two possible profiles pull the design apart (an occasional individual filer vs a
bulk institutional filer clearing dozens of returns), **this brief designs for the more
constrained case — a single return, worked once, by someone who may not have seen this
screen before** — and says so. Bulk consequences are parked in O3.

---

## 5. Decisions

Every decision cites a DS file, a product doc, or the word **judgment**. Owner-settled
items are recorded as decisions, not reopened.

**D1 — Replace `fix-page.tsx` with a full-screen correction surface; do not extend the modal.**
*Owner-settled (scope item 6).* Reasoning for the record: problem 1 says the current flow
certifies rather than corrects, and a correction that must reach `cheques[1].ifsc` needs the
form. The act-modal body cannot hold a form, a sidebar and a queue at the widths
`RESPONSIVE.md` requires. **Given up:** the modal's one virtue — never losing your place in
the tasks table. Mitigated by D12 (return to entry point).

**D2 — The screen *is* the e-filing form, in a correction posture — not a new form.**
It reuses `FILING_STEPS`, the section routes, and the existing section components; only the
field's *posture* changes (locked / flagged / resolved). Rationale: DS rule 3 "Reuse before
creating", and Dristi already solves "walk a long filing by section" one way
(`sections-rail.tsx`) — introducing a second way quietly would be the defect
(`role-ux-designer`: never quietly introduce a second way). **Rejected:** a bespoke
"defects only" mini-form listing the eight flagged fields on one page. It is genuinely
faster, and I rejected it because a defect is only understandable in the context of its
section — an IFSC is judged against the bank name and branch beside it — and because it
would fork the field rendering, validation and prefill behaviour of ten section components.
**Given up:** raw speed for a professional clearing a return they already understand. The
queue (D5) buys most of it back.

**D3 — Everything not flagged is disabled, and the disabling is stated, not implied.**
*Owner-settled (scope item 3).* The header (D13) and each locked section carry the reason:
this is a correction round, not an edit round. Judgment on the wording. **Given up:** the
ability to fix an unrelated mistake the advocate spots while in here — see R2 and O5.
`ACCESSIBILITY.md`: disabled controls are not focusable, so the *reason* must be reachable
as text, not as a hover tooltip on a dead control.

**D4 — Defect state is carried by a frame around the field, not by the field's fill.**
This is the one place I am translating the owner's wireframe rather than transcribing it.
The wireframe says flagged fields are amber and resolved fields green. In this DS, amber
*inside a field* already means something else: `prefilled` is `warning-2`, "machine-prefilled,
human-unverified field fill" (`foundations/colors`), and `foundations/laws` explicitly
forbids using `warning` as a stand-in for prefilled. The e-filing form uses `prefilled`
heavily (`ChequeDetails.prefilled`, `Complainant.prefilled`) and the cheque screen is
precisely where the demo fixture puts defects — so the two ambers would collide on the same
row. So: the **defect frame** (a bordered block wrapping the label + control + officer
feedback) carries `border-warning-ink`-weight emphasis with a `bg-warning-muted` header
strip and a `text-warning-ink` "Defect 3" marker; the input keeps `border-input` and its own
fill, prefilled or not. Resolved flips the frame to `success-muted` / `success-ink` with the
word "Resolved". Per `foundations/laws` ("status never by color alone") each state also
carries an icon **and** a word. **Given up:** the wireframe's literal "the field goes amber".
Same visual language, correct token roles. Owner to confirm — see decision log.

**D5 — The Resolution queue is the spine of the screen, and the only place work is counted.**
*Owner-settled (scope item 4).* One accordion card per defect: title, location breadcrumb
("Case details › Cheque 2 › IFSC"), officer feedback block, action. Clicking a card navigates
the centre form to that section and moves focus to the field. **Judgment on focus:** moving
focus (not merely scrolling) is what makes this work for a keyboard and a screen reader;
scroll-only would be a mouse-only affordance. The card stays expanded while its field is
active so the officer's reasoning is on screen at the moment the value is typed.

**D6 — "Addressed" is a derived fact, never a checkbox.** A defect is resolved when the field
value changed, or the suggestion was accepted, or an override justification was written, or
the flagged document was replaced. The submit button reads that; nothing self-certifies.
This retires `Defect.fixed`-as-a-tick and directly answers problems 1 and 6. **Given up:**
the escape hatch for a defect the advocate believes needs no change at all — which is exactly
why D7 exists.

**D7 — Disagreement is a first-class resolution, spelled "justification".**
*Owner-settled (scope item 4b).* Overriding an explicit suggestion requires a written
reason; the same control is how the advocate says "the original value is right, here is why".
Judgment on wording: label it in the advocate's own terms ("Why you are keeping / changing
this value") rather than "dispute", which sounds like an interlocutory application.
**Required only where the officer made an explicit suggestion** — a bare "IFSC is wrong" note
answered by a corrected IFSC needs no essay. **Given up:** a uniform rule; the asymmetry has
to be explained in the UI (D14 copy).

**D8 — The `Defect` type must grow, and the grown shape is a UI dependency, not an
implementation detail.** Proposed shape (for `ui-designer` and whoever owns the tasks
contract to land together):

```
Defect = {
  n, target: FieldTarget | DocTarget, note: string,
  voice?: VoiceNote,               // { file, durationMs, transcript? }
  annotation?: { file, box },      // reuses ExtractBox semantics from filing/types.ts
  suggestion?: { old, new, evidence?: StoredFileRef },
  resolution?: { how: "accepted" | "edited" | "replaced", value?, justification?, at }
}
FieldTarget = { step: StepId, instance?: number, field: string }
DocTarget   = { step: StepId, slotKey: string }
```

`ExtractBox` and its `regionFromBox()` percentage mapping already exist in
`filing/source-panel.tsx` for the OCR highlight — the officer's annotation is the same
geometry with a different author, so it reuses that, not a new one. **Given up:** nothing
that matters; the alternative (`text` plus convention) is problem 2.

**D9 — Document defects resolve in place, not in a detour.** *Owner-settled (scope item 4c).*
Replace the upload inside the defect frame; where the slot's `IntakeDocType` supports
extraction, run it and show the downstream fields it refilled as a named list ("This also
updated: cheque number, amount") rather than silently changing values on a screen the
advocate is not looking at. **Judgment**, and a consequence rule: silent writes to a legal
filing are not acceptable, and `prefilled` fill on those refilled fields is the DS's existing
way of saying "machine-read, unverified" (`foundations/colors`).

**D10 — No audio primitive exists in the DS; compose one, and do not call it a player.**
Verified against the full `src/components/ui/` glob (68 components) — there is no `audio`,
`media`, or `player`. Compose from `Attachment` (which already has `media` / `content` slots
and `idle | uploading | processing | error | done` states), a `Button size="icon"` play/pause,
`Slider` as the scrub track, and `text-caption font-mono` for elapsed / duration. Treatment:
the voice note sits **inside** the officer feedback block, collapsed to a single 40px row
until played. `ACCESSIBILITY.md`'s floor is WCAG 2.1 AA, which for prerecorded audio-only
content requires a text alternative (1.2.1) — so a voice note **must** ship with the text note
beside it, and the design must have somewhere to put a transcript when one exists
(`VoiceNote.transcript`, rendered as a disclosure under the row). A voice note is never the
sole carrier of a defect's meaning. See §13 — this is a DS gap worth raising.

**D11 — Below `xl`, the queue becomes an overlay and gains a persistent bar; it never
disappears.** Three panes need ~1280px. Ladder: `xl` three panes → `lg` sidebar collapses to
the existing icon rail / `Sheet` pattern already in `sections-rail.tsx`, queue stays →
below `lg` centre form full width, queue moves into a `Drawer` (`RESPONSIVE.md`: "Drawer —
prefer for mobile-first bottom sheets"), with a sticky bottom bar carrying "3 of 8 resolved",
"Open the queue", and the submit action. `RESPONSIVE.md` rule 7 forbids hiding critical
actions; the queue *is* the critical action. **Given up:** side-by-side reading of feedback
and field on a phone — the drawer covers the form. Accepted because the defect frame repeats
the note inline (D4), so the phone user reads the reasoning in the form, and uses the drawer
only to navigate and to submit.

**D12 — Submitting returns you where you came from.** *Owner-settled (scope item 6.)*
Confirmation moment (`AlertDialog` before, toast after — matching how `fix-page.tsx` already
confirms re-filing), then back to `/tasks`, task showing as waiting. **Judgment on the
`AlertDialog`:** re-submission to the Registry is irreversible and clock-bearing
(`product-foundation.md` §3, and Kerala's rule that limitation runs on Registry receipt in
IST), so it earns a confirm step that ordinary navigation does not.

**D13 — Header wording follows `terminology.md`: "scrutiny", never "defect resolution mode".**
`terminology.md` and `product-foundation.md` both call step 2 *scrutiny*; "returned" is
already the task kind in `tasks/types.ts`. Header: **"Scrutiny return"** as the title, with
the case line ("Sreekumar N. v. Vismaya Traders") and a status line: "Returned by scrutiny on
12 Aug · 8 defects · 3 resolved". Footer action: **"Submit corrections to scrutiny"** (owner's
words, and sentence case per `foundations/laws`). Not "mode", not "resolution centre", and
not the word "user" anywhere in the copy.

**D14 — One primary teal action on the screen, and it lives in the queue footer.**
`foundations/laws` — "Ration teal: one strong primary action per view". Accept-suggestion
buttons are `variant="secondary"`, sidebar rows stay ghost, document replace is `outline`.
**Given up:** the visual pull of "accept" — which is correct, because accepting a suggestion
should not be more inviting than reading the reasoning first.

---

## 6. What I cut (and why)

- **A "resolve all suggestions" bulk action.** Obvious for the Gujarat-shaped user and the
  reason O3 exists — but one click that rewrites eight fields in a legal filing, in a flow
  whose entire premise is that the officer's marks are sometimes wrong
  (`ke-scrutiny-officer-2026-07`), is the wrong default. Cut until who-logs-in is answered.
- **A side-by-side diff view of the whole filing (before/after).** Interesting, and answers a
  question nobody asked; the officer flagged eight fields, not a diff.
- **A messaging thread with the scrutiny officer.** The justification field (D7) covers
  disagreement on the record. A chat channel invites exactly the informal back-and-forth the
  practice note describes, and puts it in a product that has no confirmed policy for it.
- **A dedicated post-submit screen.** Owner-settled, and correct: a confirmation the advocate
  reads once does not need a route.
- **Per-defect severity / priority.** The officer's model has no severity, and every defect
  blocks numbering equally. Inventing a ranking would be inventing product.
- **A second scrutiny round's "what changed since last time" timeline.** Real need, no
  confirmed data for it — parked as O4 rather than guessed at.
- **An overall progress ring in the page header.** The queue's `Progress` bar already answers
  it; two counters that can disagree is worse than one.

---

## 7. Layout & hierarchy

Stage: `bg-muted` (multi-panel stage rule, `foundations/laws`) with default `bg-card` panels,
so the three panes read as panels rather than as one flat sheet.

```
┌ Header: Scrutiny return · case · returned 12 Aug · 8 defects · 3 resolved ─────────┐
├──────────────┬───────────────────────────────────┬───────────────────────────────┤
│ Sections     │ The section, in correction posture│ Resolution queue              │
│ (all 13)     │                                   │  3 of 8 resolved  [▓▓▓░░░░░]  │
│ Parties      │  ┌ Defect 3 ─── warning frame ──┐ │  ┌ Defect 1 ✓ resolved ────┐ │
│  Complainant¹│  │ IFSC *                       │ │  ├ Defect 3 ▸ open (active)─┤ │
│  Advocate    │  │ [ input — focusable ]        │ │  │ Case details › Cheque 2  │ │
│  Accused     │  │ ── officer feedback ──       │ │  │ note · voice · suggestion│ │
│ Case details³│  │ note · ▶ voice 0:42 · box    │ │  │ [Accept] [Edit myself]   │ │
│  Cheque   ²  │  │ suggested: KLGB0040… → …     │ │  └──────────────────────────┘ │
│  Demand n. ¹ │  │ [Accept] [Edit myself]       │ │  ┌ Defect 4 ▸ open ─────────┐ │
│  …locked     │  └──────────────────────────────┘ │  └──────────────────────────┘ │
│              │  Bank name  [ disabled ]          │                               │
│              │  Branch     [ disabled ]          │ ── footer ──                  │
│              │                                   │ [Submit corrections to        │
│              │                                   │  scrutiny]  (disabled: 5 left)│
└──────────────┴───────────────────────────────────┴───────────────────────────────┘
```

- **Left rail** — the full `FILING_STEPS` list, all sections visible (owner-settled). Sections
  with defects carry a count `Badge`; sections without are present, muted, and navigable but
  read-only. Being able to *see* the clean sections is what tells the advocate the officer
  did not flag them.
- **Centre** — one section at a time. Defect frames are `Card`-composed blocks in the form
  flow, in the field's natural position — not hoisted to the top of the section. Reading order
  is the court form's order; that is what the advocate and the officer both hold in their heads.
- **Right** — the queue. Fixed width at `xl`, its footer sticky within the panel
  (`shadow-raised` on the footer only when content scrolls under it — `foundations/elevation`:
  level is semantic depth, never decoration).
- **Above the fold on a phone:** header status line, the active defect frame with its note and
  action, and the sticky bottom bar. Not the sidebar.

---

## 8. Components (DS name → region)

| Region | DS components |
|---|---|
| Page chrome | existing `filing/chrome` + `filing-top-bar` composition; `Breadcrumb` for case → return |
| Left rail | `Sidebar` (via the existing `sections-rail` composition), `Button` rows at `h-10`, `Badge` for defect counts, `Sheet` below `xl` |
| Section header | `Alert` (locked / correction posture notice, once per section — not per field) |
| Defect frame | `Card` + `Marker` for the "Defect 3 · open" line + `Separator` before the feedback block |
| Field | existing `filing/form-field` (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`), `Input` / `Textarea` / `NativeSelect` / `DatePicker` as the section already uses |
| Officer feedback | `Item` for the note row; `Attachment` for evidence and for the voice note (D10); `Slider` + icon `Button` as the scrub; `Collapsible` for a transcript |
| Annotation | the existing `filing/source-panel` + `Lightbox` with `regionFromBox()`; officer box drawn the same way as the OCR highlight |
| Suggestion | `DescriptionList` (old → new) inside the frame; `Button variant="secondary"` accept |
| Justification | `Textarea` inside a `Field`, revealed on override |
| Document defect | existing `filing/upload/slot-row` + `DocumentSlot`; `Progress` while extraction runs |
| Queue | `Accordion` cards inside a `Card`; `Progress` for N of M; `ScrollArea` for the list |
| Queue below xl | `Drawer` + sticky bar |
| Submit | `Button` (the one primary), `AlertDialog` confirm, `Sonner` toast on return |
| Empty / loading / error | `Empty`, `Skeleton`, `Spinner`, `Banner` (offline) |

Nothing here is a new primitive except the composed voice row (D10, §13).

---

## 9. Spacing

Ladder only — `0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`.

- Panels: `p-6`, `rounded-xl`. Controls: `h-10`, `rounded-lg`.
- Between defect frames and ordinary fields in a section: `gap-6`. Within a frame:
  `gap-4` (label/control/feedback), `gap-2` inside the feedback block's rows.
- Defect frame inner padding `p-4` (it is a card inside a form column, not a page panel);
  its header strip `px-4 py-2`.
- Queue: card list `gap-3`; queue panel `p-6`; footer `p-4` with `gap-3` between the progress
  line and the button.
- Micro steps (`0.5` / `1.5` / `2.5`) inside controls only — e.g. the scrub row's icon gap.
- Sticky mobile bar: `p-4`, full-width `Button size="lg"`.

---

## 10. States

**Field / defect states** (each carries icon + word + color, never color alone):

| State | Treatment |
|---|---|
| Locked (not flagged) | Control `disabled`; section-level `Alert` explains why; no per-field noise |
| Open defect | Warning frame (D4), `text-warning-ink` "Defect n · open", field enabled and focusable |
| Active | The queue card for it is expanded; frame has the focus ring; centre scrolled to it |
| Resolved | `success-muted` frame header, `text-success-ink` "Resolved", the resolution named ("suggestion accepted" / "edited" / "document replaced"), with an "Undo" |
| Overridden | Resolved treatment plus the justification shown back as read-only text |
| Invalid | `FieldError` under the control; the defect does **not** count as resolved |

**Queue card states:** open · active · resolved · needs justification (blocked, and the
submit button's reason text names it).

**Empty:** no defects on the task → do not render this screen; the task should not have
offered `Fix`. If reached anyway, `Empty` with a route back to the task.
**Loading:** `Skeleton` for the queue cards and the section body; the header status line is
the last thing to be a skeleton and the first to be real.
**Error:** filing draft or defect payload fails to load → `Empty` with a retry, never a
half-rendered form (a partially loaded correction screen can show a field as clean when it
was flagged). Voice note fails to load → the `Attachment` `error` state with the text note
still present (D10 is what makes this survivable). Extraction failure on a replaced document
→ keep the upload, surface the failure, leave downstream fields untouched and say so.
**Offline / stale:** `Banner`; submit disabled with the reason stated, drafts kept locally
(the filing store already persists to IndexedDB).
**Partial:** some defects resolved and the advocate leaves — the state is a draft; the task
stays `returned`, and re-entry lands on the first unresolved defect.
**Long labels / long language:** Malayalam and Gujarati are the live court languages
(`product-foundation.md` §2, §6). Location breadcrumbs in queue cards wrap to two lines
rather than truncating — a truncated "Case details › Cheque 2 › IFSC" is a wrong answer to
problem 2. Queue card titles wrap; the progress line is `tabular-nums` and never wraps mid-count.
The three-pane layout must survive 200% zoom by degrading down the D11 ladder, not by scrolling
horizontally (`ACCESSIBILITY.md`, `RESPONSIVE.md` rule 9).

---

## 11. Risks accepted

- **R1 — The advocate can accept a wrong suggestion in one click.** Accepted: the officer's
  value lands in a legal filing without independent verification. Mitigated by keeping accept
  at `secondary` emphasis (D14), showing old → new explicitly, and offering per-defect undo
  until submission. Not mitigated further, because requiring a confirm on every accept would
  make the honest path as expensive as the disputed one.
- **R2 — Locking every unflagged field means a real error the advocate spots here cannot be
  fixed here.** Accepted per D3/owner. The cost is a second cycle. O5 asks product whether the
  Registry accepts unsolicited corrections in a return round at all — if it does, this decision
  changes.
- **R3 — Designing for the constrained single-return case will feel slow to a bulk filer.**
  Accepted and visible (§4). Reversible via O3 without changing the layout.
- **R4 — The voice note is composed, not systematised.** Until §13 lands, two teams could build
  two audio rows. Mitigated by naming the composition here and filing the DS request.
- **R5 — The `Defect` growth (D8) is a contract change others depend on.** If it ships thin,
  this screen degrades to today's checklist. Flagged as a build prerequisite, not a nice-to-have.

---

## 12. Open questions for product

- **O1** — Is `ke-scrutiny-officer-2026-07` in scope to design *against*, or background only?
  `open-questions.md` explicitly parks "which practice-note observations are in scope". This
  brief treats the opacity finding as the problem to solve; if it is background only, D7
  (justification / dispute) needs product's blessing before it ships.
- **O2** — Who logs into DRISTI, per state (`open-questions.md`)? Unresolved; §4 records how
  this brief proceeded without it.
- **O3** — Does anyone clear multiple returns in a sitting? If yes, bulk accept, keyboard
  traversal between defects, and a cross-case return list all become worth designing.
- **O4** — Can a filing be returned more than once, and does the advocate see prior rounds? The
  model has one `Returned` per task today.
- ~~**O5**~~ — **Answered (owner, 2026-08-21):** the advocate may **not** correct anything the
  officer did not flag — opening unflagged fields makes the workflow too open. The full lock
  (D3) stands; R2 is accepted as designed.
- **O6** — Does a corrected filing need re-signature or a further court fee before it goes back?
  `SignState` and `pay-fees` exist in the filing model; this brief assumes neither is triggered.
  **Owner (2026-08-21): still open — to be checked; build on the no-retrigger assumption.**
- ~~**O7**~~ — **Answered (owner, 2026-08-21):** a scrutiny return carries a deadline —
  believed ~3 days in practice; **assume 5 days from the return date** until the rule is
  confirmed. The fixture sets `dueAt` = return + 5 days and the screen header carries the
  due cue.
- **O8** — Does the Registry accept a *disputed* defect as a valid response, or does an
  unresolved defect simply bounce again? D7's value to the advocate depends on the answer.

O5 and O7 were answered by the owner on 2026-08-21 (recorded above); the rest stand open.

---

## 13. Gaps in the DS

**Request 1 — an audio note primitive.** `src/components/ui/` has 68 components and none of
them plays media. A voice note is not a one-off here: any officer, judge, or party feedback
channel in a court product will want spoken context, and the accessibility contract around it
(WCAG 1.2.1 text alternative, keyboard-operable transport, ≥40×40 targets, no
color-only progress) is exactly the kind of thing that should be decided once rather than per
screen. Proposed as `Audio` / `AudioNote`, composed of transport button, `Slider` track,
`tabular-nums` time, and an optional transcript disclosure. **Meanwhile:** compose per D10
inside `apps/dristi-app` and do not generalise it.

**Request 2 — a documented "annotation over a document" pattern.** Dristi already hand-rolls
one (`filing/source-panel.tsx`, `regionFromBox`) and this feature is the second caller with a
different author of the box. Worth pulling up into the DS as a documented pattern before a
third appears.

Both go to `docs/design/ds-requests.md`. Neither licenses inventing inside Dristi.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-08-21 | Brief created. Scope items 1–8 in §1 recorded as settled by the owner and not reopened: advocate-side only; field + document defects; four feedback attachments; three-pane layout; accept / edit / mandatory-justification-on-override; entry from the pending-tasks `returned` task replacing `fix-page.tsx`; no post-submit screen; 6–8 defect demo fixture. | Owner, this conversation |
| 2026-08-21 | D4 translates the wireframe's "amber field / green field" into a defect *frame*, because `prefilled` (warning-2) already owns amber inside a field and `foundations/laws` forbids warning as a prefilled stand-in. **Needs owner confirmation** — same language, different surface. | ux-designer (judgment) |
| 2026-08-21 | D6 retires the self-certifying `fixed` checkbox in favour of derived resolution. Implies the `Defect` contract change in D8 — a build prerequisite. | ux-designer (judgment) |
| 2026-08-21 | D10 records that the DS has no audio primitive; composition specified, DS request filed (§13). | ux-designer, verified against DS glob |
| 2026-08-21 | **Built.** D1–D14 implemented in `apps/dristi-app`. The `Defect` contract grew as D8 proposed, `fixed` is gone, and resolution is derived in `lib/tasks/defects.ts`. Deviations below. | ui-designer |
| 2026-08-21 | **Deviation — the demo case.** §7's header example names *Sreekumar N. v. Vismaya Traders*, but that case is numbered and at evidence stage; scrutiny is step 2, *before* numbering (`product-foundation.md` §3). The fixture therefore sits on `c-sainaba` (*Sainaba K. v. Riyas M.*, pre-filing), the only seeded case at the right stage. | ui-designer (product correctness) |
| 2026-08-21 | **Deviation — where the document defect lives.** §8 pairs document defects with `filing/upload/slot-row`, so the demo's document defect targets the **intake** step (`upload`, slot `c1ad`) rather than the `documents` table. The frame wraps the intake row in place, with a Replace that a flagged row always offers whatever the read made of it. The `documents` table is not a place a defect frame can be threaded without forking its rendering. | ui-designer |
| 2026-08-21 | **Deviation — D9's extraction half.** The replace re-runs no extraction and writes no downstream field; the frame says so. D9's rule that mattered (no silent writes to a legal filing) is kept; its convenience half waits for a real replacement path. **Open for the owner.** | ui-designer |
| 2026-08-21 | **Deviation — returns with no filing behind them.** Three seeded returns are on filings not made in DRISTI, so there is no draft to re-enter. They keep the new contract with a doc target on the filed bundle, and `Fix` lands on an honest end state (§10's error case) instead of an empty form. | ui-designer |
| 2026-08-21 | **Deviation — pane widths in pixels.** `w-64` / `w-80` are rems, so at 200% text zoom the two rails doubled while the Tailwind ladder stayed on three panes and the page scrolled sideways (`ACCESSIBILITY.md` §10, `RESPONSIVE.md` rule 9). The side panes are sized in pixels so the centre column reflows instead. | ui-designer (a11y) |
| 2026-08-21 | **Fix pass (ui-reviewer findings 1–13).** D7 read as "justification only where there is a suggestion", which left the advocate one route past the gate — edit a value they believe is correct. The control is now *available* on every field defect and the filed value plus a reason resolves it; required-ness is unchanged. `Resolution.how` gains `kept` so the history does not call a dispute a correction. | ui-designer |
| 2026-08-21 | **The record is written per act, not per keystroke.** Derivation stays live off the draft; the task is written on blur, on a pause, on an explicit accept/undo, and inside `refile`'s own dispatch on submit. Verified on the render: eight acts, eight history lines. | ui-designer |
| 2026-08-21 | **`FieldTarget` narrowed to the steps the form can render** (`cheque`, `complainant`, `demand-notice`, `jurisdiction` — the last newly wired). `accused`, `witnesses`, `advocate` and `adr-prayer` need `name=` and `CorrectionInstance` before they can hold a defect; until then a target there rendered no frame and blocked submit forever. `lib/filing/targets.test.ts` enforces it. **Open for the owner:** whether to finish that wiring now or wait for a real officer flag outside the four. | ui-designer |
| 2026-08-21 | **Deviation retired — pane widths in pixels.** The px pinning stopped the h-scroll but truncated section names and the submit label at 200% text zoom (`ACCESSIBILITY.md` §10). The D11 ladder now folds on *measured* room (viewport ÷ root font size) rather than on a viewport-pixel breakpoint, labels wrap, and both conditions hold together at 1280 × 200%. | ui-designer (a11y) |
| 2026-08-21 | **Craft — the active defect gets no third cue.** D5 has the queue card expand and the frame take focus. The frame briefly also carried a focus ring, which stacked border + strip + ring; `ui-craft`'s loudness ladder says pick one, so the frame's border says *state*, the queue card's lift says *current*, and the ring belongs to whatever actually has focus. | ui-designer (ui-craft) |
