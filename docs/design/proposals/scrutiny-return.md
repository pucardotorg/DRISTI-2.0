# Scrutiny return — advocate defect resolution

Status: **v2.1 built** (feature/scrutiny-back-adv) — §15 is the spec it was built to; build notes in §15.16
Updated: 2026-08-21
Source: docs/product/product-foundation.md (§3 Kerala operational spine, step 2 — "Scrutiny
& defect check (Registry; before numbering / cognizance)"), docs/product/domain/practice-notes.md
(`ke-scrutiny-officer-2026-07`), docs/product/domain/actors.md (scrutiny officer as a *domain*
role), docs/product/terminology.md, docs/product/open-questions.md
DS read: `vendor/pucar-design-system/AGENTS.md`, `RESPONSIVE.md`, `ACCESSIBILITY.md`,
`foundations/laws`, `foundations/colors`, `foundations/elevation`, `foundations/accessibility`,
glob of `src/components/ui/` (68 components), `src/components/ui/attachment.tsx`,
`src/components/ui/marker.tsx`, `src/components/ui/accordion.tsx`
Code read: `apps/dristi-app/src/lib/filing/types.ts`, `.../filing/steps.ts`,
`.../lib/tasks/types.ts`, `.../components/tasks/act/fix-page.tsx`,
`.../components/filing/{sections-rail,form-field,source-panel}.tsx`,
`.../components/filing/upload/slot-row.tsx`, `.../components/scrutiny/defect-frame.tsx`

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
**v2.1 adds O9–O11 — see §15.15.**

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
| 2026-08-21 | **Craft — the active defect gets no third cue.** D5 has the queue card expand and the frame take focus. The frame briefly also carried a focus ring, which stacked border + strip + ring; `ui-craft`'s loudness ladder says pick one, so the frame's border says *state*, the queue card's lift says *current*, and the ring belongs to whatever actually has focus. | ui-designer |
| 2026-08-21 | **v2.1 approved.** The owner signed off the rendered v2.1 mockup: the centre is the e-filing form verbatim, scrutiny layers on as a 2px accent on the flagged field group plus an inset nested under that one field, locked fields recede on `disabled-fill`, and the queue is a compact Open/Resolved index whose header carries the return deadline and the count. Direction and full spec in §15. | Owner (mockup sign-off) |
| 2026-08-21 | **Superseded by v2.1 (§15.13): in-field editing, and the always-rendered justification textarea.** The flagged control is now read-only; a defect is answered by accepting scrutiny's correction or by entering your own value inside the inset's third accordion, and the reason is one field inside that accordion. D6 (resolution is derived, never certified), D7's *rule*, D12 and D14 stand unchanged; D2, D4, D5 and D9's rendering are revised where §15 says so. | Owner (presentation feedback), ux-designer |

---

## 15. Redesign direction (v2.1, approved)

Status: **approved.** The owner signed off the rendered v2.1 mockup on 2026-08-21, then gave
presentation feedback that replaced the interaction inside the flagged field (§15.4). This
section is now the build spec; where it disagrees with §5's decisions, §15.13 names the
supersession and §14 logs it.

Read for this pass: the approved v2.1 mockup, `components/scrutiny/defect-frame.tsx`,
`components/filing/upload/slot-row.tsx` (the thumbnail pattern), `components/filing/{posture,
form-field,source-panel}.tsx`, `lib/tasks/types.ts` (the `Resolution` union), DS
`foundations/{laws,colors,elevation}`, `ui/accordion.tsx`, `AGENTS.md`.

**What this is.** v2 was a hierarchy and redundancy correction that still owned the field's
container — it wrapped the flagged field in a bordered frame with its own header strip. v2.1
gives that ownership back to the filing. The centre column is the e-filing form **verbatim**,
and scrutiny is a *layer* over it. That single change is what makes the screen read as "your
filing, with remarks on it" rather than "a defect tool that happens to contain fields", and it
is what the owner approved.

### 15.1 What the owner approved (fixed; not reopened)

1. **The centre is the e-filing form, verbatim.** Exact labels, exact rows, exact section
   cards. Nothing renamed, nothing relaid, no field promoted out of its row.
2. **Scrutiny is a thin layer:** a **2px accent** on the flagged field group, and an **inset
   container nested under that one field** — sunken, not edge-to-edge, so it reads as an
   action *within* the field rather than a banner across the section.
3. **Locked fields recede** on `disabled-fill`.
4. **The queue is a compact index**, grouped **Open / Resolved**, with the return-level
   deadline and progress together in its header: *"Due in 3 days · 3 of 8"*.
5. **The lock rule is a single quiet caption line** above the form.
6. **Resolved fields** show a green accent, a **collapsed** inset, and a *"was &lt;old value&gt;"*
   caption.
7. **Two open defects in one section: both stay accented.** (Owner ruling — this settles R6,
   which had left "de-accent all but the active one" as a reversible option. It is closed.)

### 15.2 The interaction inside the inset (owner's presentation feedback, 2026-08-21)

This supersedes v2's model of editing the flagged field directly with an always-visible
justification textarea beneath it. The new model has one governing rule:

> **The flagged form field is never directly edited.** A defect is answered by *accepting
> scrutiny's correction* or by *entering your own value* in the inset. Nothing else.

That sanctity is the point: the value the Registry saw stays legible and unaltered on the form
while the exchange about it happens in the layer beneath it. It also makes the record
unambiguous — every changed value in a correction round has a named author.

The inset holds three tiers, in this order:

**Tier 1 — primary, always visible: the correction, and two verbs.**

- The officer's correction as **old → new**: the filed value struck
  (`line-through decoration-muted-foreground tabular-nums`), the new value
  `font-medium text-foreground tabular-nums`. Two `DescriptionRow`s on the inset's own fill —
  *not* the inner `bg-card` box v2 put around the suggestion. `foundations/elevation`: "depth is
  fill, not borders … the box-in-box ban". One box, not two.
- **Two actions, side by side:** **Accept** (`variant="secondary"`) and **Ignore**
  (`variant="ghost"`). Both `h-10`. Neither is teal — the one primary teal on the screen is
  still the submit (D14, unchanged).
- **The associated document as a small thumbnail**, using the *existing* e-filing upload
  thumbnail pattern from `filing/upload/slot-row.tsx` — `SlotThumbnail`: a real `<button>`
  (a PDF with no image preview must still be openable by keyboard and by voice), page-shaped
  media well at `h-12 w-16` / `sm:h-14 sm:w-20`, `useFilePreview` image or an extension badge
  fallback, and the `bg-scrim` + `Maximize2Icon` chip revealed on hover **and** on keyboard
  focus **and** always on coarse pointers (`ACCESSIBILITY.md` §7 — "you can enlarge this"
  cannot live on hover alone). `aria-label="Preview <file name>"`.
  Clicking opens the **existing** full view — `filing/source-panel` + `Lightbox` with
  `regionFromBox()`, so the officer's annotation box is drawn exactly as the OCR highlight is
  (D8). The inset never renders an annotated page inline.
  *Reuse, not a new component:* the DS's border exception for thumbnails
  (`foundations/elevation`) is what lets this one carry an edge inside a sunken well.

**Tier 2 — secondary, a collapsed accordion: "What scrutiny said".**

The officer's text note, the composed voice row (D10) and its transcript, together, behind one
`AccordionTrigger`. Collapsed by default: when tier 1 already shows old → new, the note is
commentary, and rendering eight notes at rest is exactly the redundancy v2 set out to remove.
Progressive disclosure, per the owner.

WCAG 1.2.1 is unaffected — the text note and the audio live in the *same* disclosure, so the
text alternative is never absent when the audio is present (D10 stands).

**Tier 3 — a second accordion, opened by Ignore: "Your corrected value".**

- Contains **one** control of the same type the flagged field uses (`Input`, `DatePicker`,
  `NativeSelect` — `filing/form-field` decides), labelled *"Your corrected value"*, prefilled
  with the value currently in the filing. Prefilling is deliberate: tier 3 is only ever reached
  by an explicit Ignore, so the advocate has already chosen their own path, and the prefill is
  what makes *"my value stands"* a stated position rather than a retyping exercise.
- **This accordion is also the dispute path.** Entering the same value that is already filed is
  a valid, complete resolution — `Resolution.how = "kept"`, which the contract already carries
  from the 2026-08-21 fix pass.
- **One reason field**, per §15.3. Not an essay.
- Opens programmatically on Ignore (`Accordion type="multiple"`, controlled), and expanding it
  by hand is also allowed — an advocate who knows their own value need not click Ignore first.

**Ignore is a route, not a resolution.** Clicking Ignore and then entering nothing leaves the
defect **open**; the submit gate does not move. D6 — resolution is derived from the filing, never
self-certified — is untouched, and this is the trap most likely to be built wrong, so it is
stated here rather than left to inference.

### 15.3 Where D7's justification survives — one field, inside tier 3

D7's *rule* survives; its *rendering* does not. There is no justification textarea on the form
at rest. The reason is one field at the bottom of tier 3, a `Textarea rows={2}` inside a
`Field`, with exactly one `FieldDescription` line — *"Your reason goes back to the Registry with
the correction."* Three rules decide whether it is required:

| Situation | Reason | Resolution recorded |
|---|---|---|
| Tier 3 reached by **Ignore on an explicit suggestion**, value differs from the suggestion | **Required** — this is D7's original ruling, unchanged | `edited` |
| **Bare-note defect** (no suggestion), a new value entered | **Optional** — "a bare 'the IFSC is wrong' answered by a corrected IFSC needs no essay" (D7) | `edited` |
| Entered value **equals the filed value** — "my value stands" — any defect shape | **Required** | `kept` |
| **Accept** clicked in tier 1 | Not offered — there is nothing to explain | `accepted` |

Gate copy unchanged: `FieldError` reads *"This defect is not resolved until you say why."*
Label follows what is happening, never the word "dispute" (D7).

Recommendation recorded as such: I kept the requirement narrow deliberately. Requiring a reason
on every correction would tax the honest path — the advocate who simply mistyped an IFSC — at
the same rate as the contested one, which is the asymmetry D7 already decided.

### 15.4 The three defect shapes, mapped to the model

The single rule that generates the table: **tier 2 collapses only what tier 1 has made
redundant.** Where there is no correction to compare against, the note *is* the instruction and
it is never hidden.

| Shape | Tier 1 (always visible) | Tier 2 | Tier 3 |
|---|---|---|---|
| **Field, with a suggestion** | old → new, **Accept** + **Ignore**, thumbnail if evidence exists | collapsed "What scrutiny said" | collapsed; opens on Ignore |
| **Field, bare note** (no suggestion) | the officer's **note in full** + thumbnail if any. **No Accept, no Ignore** — there is nothing to accept | *absent* (its content was promoted to tier 1); the voice row and transcript ride with the note | **expanded by default** — it is the only action, so it is the primary one |
| **Document defect** | filed document thumbnail; **Accept / Ignore only if the officer supplied a replacement file**; otherwise the note in full | as per the two rows above | *"Your replacement document"* — the existing `Replace` control from `slot-row.tsx` (`variant="outline"`, `data-defect-focus`), expanded when there is no replacement to accept |

**Document defects, in the same vocabulary.** The sanctity rule extends: the flagged document
row is display-only, and replacement happens **inside the inset**, not on the row. (This moves
the `Replace` button that `slot-row.tsx` currently renders on the row itself — a build change,
logged.) "Ignore" on a document means *the filed scan is legible and it stands*: that is a
`kept` resolution and it takes a required reason, by the third rule in §15.3. Uploading a
replacement is `replaced` and needs no reason — the new scan speaks for itself.
D9's extraction half remains where the 2026-08-21 deviation left it: no re-extraction, and the
inset says so. **Judgment**, and the reason is consistency — one accept/ignore vocabulary across
both target kinds is worth more than a document-shaped special case.

### 15.5 The scrutiny layer on the form (deliverable 1)

**Locked fields (the inert baseline).** `disabled` control on `disabled-fill` with
`border-input`, label `text-body-compact text-muted-foreground`. No frame, no marker. They are
the quiet canvas the accent reads against — wayfinding is a contrast, so the recession is half
the design.

**Flagged fields.**

- **The accent:** `border-l-2 border-l-warning-ink` running the height of the field group
  (label + control), with `pl-3` so the text does not crowd the stroke. 2px, per the approved
  mockup. `warning-ink` as a *stroke* is not the "ink as a fill" violation — it is exactly how
  the officer's marked region is drawn in the full view (`regionFromBox` in
  `filing/source-panel`, outlined by `filing/lightbox`).
  Resolved flips it to `border-l-success-ink`.
- **The control is read-only, not disabled.** `readOnly` (or rendered as text where the control
  type cannot be read-only) with normal `border-input` and its normal fill — never
  `disabled-fill`, which would make the field under discussion look like the fields that are out
  of this round. `ACCESSIBILITY.md`: a disabled control is not focusable, and this value must
  stay reachable by keyboard and by screen reader because it is the subject of the exchange.
  *Locked = disabled. Flagged = read-only.* Two states, two mechanisms, both honest.
- **Status is never colour alone** (`foundations/laws`): the inset's first line carries the icon
  and the word — `TriangleAlertIcon` + "Open" in `text-warning-ink`, or `CircleCheckIcon` + the
  resolution label in `text-success-ink` — and the queue row repeats both.

**The inset.** `mt-2 rounded-md bg-surface-sunken p-3`, **no border** —
`foundations/elevation`: "nested wells use `surface-sunken` with no border — the box-in-box
ban". It sits under the flagged field's row, inside the section card's own `p-6`, which is what
keeps it off the card edge: **sunken and inset, never edge-to-edge**.

*One layout call worth stating.* In a two-up `FormRow` the field group is half a column, and an
inset confined to it would hold old → new, two buttons and a thumbnail in ~300px. v1 solved that
by making the frame `col-span-full`, which relaid the row — forbidden now. So: the **accent**
stays on the flagged field group only (that is what disambiguates which of the two fields is
flagged), and the **inset spans the row beneath it**, repeating the field's own name on its
first line ("IFSC code") so the tie is stated in words as well as in position. The form's rows
are untouched; the layer lands below them.

### 15.6 The queue as a compact index (deliverable 2)

- **Header, one line, `tabular-nums`:** *"Due in 3 days · 3 of 8"* over the `Progress` bar
  (`h-1.5`). The deadline and the count now sit **together, here** — which retires v2's header
  clock and finishes §6's cut properly: the queue is the only place work is counted **and** the
  only place the clock is shown. The page header keeps the case line and "Returned 12 Aug" only.
  The relative phrasing carries an absolute `<time dateTime>` so the underlying date is
  inspectable (see R11 — the 5-day window is still an assumption, O7).
  The clock is `text-warning-ink` + `ClockIcon`, and it is the **one** amber in the chrome —
  the §138 clock is the only genuinely urgent thing on this screen (`product-foundation.md` §3).
- **Grouped Open / Resolved**, each under a plain `text-caption text-muted-foreground` group
  label. The labels carry **no counts** — the header owns the one counter.
- **One row = one button**, `w-full min-h-10 rounded-lg px-3 py-2 text-left`: a `StateMark` icon
  + the location (`"Cheque 1 › IFSC code"`, `text-body-compact font-medium`, **wraps, never
  truncates** — problem 2, and Malayalam/Gujarati run longer), and beneath it the status word in
  `text-caption`, coloured by state. No officer prose anywhere in the queue (decision A, kept
  from v2). No `Accordion`, no per-card "Go to the field" button — the row is the affordance.
- **The jump moves focus to the inset's primary action** — Accept where one exists, otherwise
  the tier-3 value control or the Replace button (`data-defect-focus`) — and scrolls the field
  and its inset into view together. It no longer focuses the flagged control, because that
  control is read-only now. D5's *rule* (move focus, do not merely scroll — a scroll-only jump
  is a mouse-only affordance) is unchanged; only its target moves.
- **Active row:** `bg-accent-strong` (the DS's named selected fill, `AGENTS.md` rule 10) +
  `aria-current`. Not a ring, not a border, not a brand fill.
- **Footer, unchanged:** the one primary teal *"Submit corrections to scrutiny"*, with its gate
  stated in words below it.

### 15.7 The lock rule, once (deliverable 3)

One quiet caption line above the form: `text-caption text-muted-foreground`, a `size-4
LockIcon`, one sentence — *"Only the fields scrutiny flagged can be changed here."* No fill, no
border, no `Alert`. The full-width correction-round banner v1 shipped is deleted.
Placement is the argument: the confusion a lock creates happens next to a dead control, so the
explanation belongs in the centre column, not in the rail and not in a page-top banner. It
wraps to two lines rather than truncating in a long language.

### 15.8 The correction-registered moment (deliverable 4)

Three things fire together on resolve; all of it derives live off the draft, and only the
*history write* is debounced (correct, and invisible):

1. **The field's accent flips** amber → green, and its icon and word change to the resolution
   label — *"Suggestion accepted" / "Edited" / "Kept, with a reason" / "Document replaced"*.
2. **The inset collapses** to a single row: the check icon, the resolution label, and a
   `text-caption text-muted-foreground` caption *"was KLGB0040231"*. The word "was" does the
   work — no strike-through on top of it. The collapsed row is a `Collapsible` trigger:
   expanding it returns the officer's material, what was sent back, and a ghost **Undo**.
   As the advocate works down a return the centre column visibly *clears*, which is the whole
   answer to "did that register?" — and it costs no new component.
3. **The queue row moves** from the Open group to the Resolved group and the counter ticks.

A brief transient `bg-success-muted` wash on the inset, fading over ~1s, marks "just changed" —
the one loudness-ladder slot nothing else uses. **Cut, still:** a per-defect toast. Eight
`Sonner` toasts across a return is the alarm fatigue the ration rule warns about. The submit
`AlertDialog` + single return toast (D12) are unchanged.

### 15.9 The v2.1 loudness ladder

One job, one cue. The single most important constraint for keeping the build from re-stacking:

| Job | The one cue | Not |
|---|---|---|
| **State** (open / needs-reason / resolved) | the field's 2px **accent** colour + the inset's icon-and-word first line; the queue row's `StateMark` + word | never a filled strip, never a tinted field, never a frame around the row |
| **In play vs done** | the inset **open vs collapsed** | not elevation — v2's `shadow-raised` lift is dropped; the filing's own section cards own the elevation now |
| **Current** (the defect the queue is on) | queue row `bg-accent-strong` + the **focus ring** on whatever holds focus | not a brand fill (brand = now/live), not a second ring on the field |
| **Just changed** | the transient `bg-success-muted` fade | not a toast, not a persistent tint |
| **Deadline** | the queue header **clock** in `text-warning-ink` — the one amber in the chrome | not repeated per section, not in the page header |

Squint test (`ui-craft` pre-flight): the centre column should read as an ordinary e-filing
section — its own labels, its own rows — with one or two **amber hairlines down the left of a
field** and a quiet sunken block under each. If anything reads as a *defect card*, the layer has
grown back into a frame.

### 15.10 Components and spacing delta

Additions and changes to §8 and §9; everything not listed is unchanged.

| Region | DS / existing composition |
|---|---|
| Flagged field accent | none — `border-l-2` utility on the existing `filing/form-field` group |
| Inset | plain `div` on `bg-surface-sunken`, `rounded-md`, no border |
| Tier 1 old → new | `DescriptionList` / `DescriptionRow` with `border-hairline`, on the inset fill (no inner card) |
| Tier 1 thumbnail | the existing `SlotThumbnail` composition from `filing/upload/slot-row.tsx`, lifted to a shared module so it has one implementation |
| Tier 1 actions | `Button variant="secondary"` (Accept) + `variant="ghost"` (Ignore) |
| Tiers 2 and 3 | DS `Accordion` (`type="multiple"`, controlled), `AccordionItem` divider overridden to `border-hairline` |
| Tier 3 control | `filing/form-field` — same control type as the flagged field |
| Reason | `Textarea rows={2}` in a `Field` with one `FieldDescription` |
| Resolved (collapsed) inset | `Collapsible` — trigger row is icon + label + "was …" caption |
| Queue | flat `Button` rows in two labelled groups; `Progress`; `ScrollArea`. **No `Accordion`.** |

Spacing: inset `p-3` with `gap-2` between its rows, `mt-2` under the field row; accordion
triggers `min-h-10`; thumbnail `h-12 w-16` / `sm:h-14 sm:w-20`; buttons `h-10`; accent gutter
`pl-3`. Ladder only.

### 15.11 States specific to v2.1

- **Ignore, then collapse tier 3 with nothing entered** → the defect is **open**; the accent
  stays amber, the queue row stays in Open, the gate does not move (§15.2).
- **Accept, then Undo** → back to open; the inset re-expands to tier 1 and the queue row returns
  to the Open group.
- **Needs a reason** is visually an *open* defect (amber accent) whose word reads "Needs a
  reason", with tier 3 expanded and its reason field `required` and `aria-invalid`. No third
  colour — warning already means "your attention is required here".
- **Two open defects in one section:** both accented, both insets open (owner ruling, §15.1.7).
  Legible because the locked majority recedes on `disabled-fill`.
- **Thumbnail preview cannot render** → the extension badge fallback already in `SlotThumbnail`;
  the button still opens the full view.
- **No evidence and no suggestion** → tier 1 is the note alone; no empty thumbnail well.
- **Long labels / Malayalam / Gujarati:** old → new rows stack vertically at narrow widths;
  accordion trigger labels wrap; the queue location wraps to two lines; the "was …" caption
  truncates with a `title` only when the value itself is a long free-text field, never when it
  is an identifier.
- Loading, error, offline, empty and partial are unchanged from §10.

### 15.12 What v2.1 supersedes

| Superseded | By | Where |
|---|---|---|
| **In-field editing** of the flagged control (D2/D4's "field enabled and focusable"; v2 §15.3's "the control unchanged") | read-only control; correction happens in the inset only | §15.2, §15.5 |
| **The always-rendered justification** `Textarea` + `FieldDescription` on every field defect (D7's v1 rendering; v2's per-frame collapsed disclosure) | one reason field inside tier 3, which exists only after Ignore or on a bare-note defect. D7's *rule* survives intact | §15.3 |
| The defect **frame** with its `bg-warning-muted` header strip (D4), and v2's 4px rail + `shadow-raised` lift | a 2px field accent, no lift; the filing's own section cards own the elevation | §15.5, §15.9 |
| The officer's note **always visible** in the feedback well | tier 2 accordion — except on a bare-note defect, where the note is tier 1 | §15.2, §15.4 |
| The inline `AnnotationView` inside the well | a small thumbnail on the e-filing upload pattern; the annotated page opens in the existing full view | §15.2 |
| The suggestion's inner `bg-card` box inside the sunken well | rows directly on the inset fill (box-in-box ban) | §15.2 |
| v2's page-header deadline clock, and the queue's ungrouped flat list | deadline + count together in the queue header; rows grouped Open / Resolved | §15.6 |
| **R6** left "de-accent all but the active defect" open as a reversible option | closed by owner ruling: both stay accented | §15.1.7 |
| `slot-row.tsx` rendering `Replace` **on the flagged row** | Replace moves inside the inset (tier 3) | §15.4 |

Unchanged and not reopened: D1, D3, D6, D8, D10, D11, D12, D13, D14, and every §14 deviation
except the two named above.

### 15.13 Risks accepted (v2.1)

- **R9 — Accept is now the most prominent thing in the inset**, which sharpens R1: the officer's
  value reaches a legal filing on one click, with the reasoning one collapse away. Accepted.
  Mitigated by showing old → new literally *above* the button, keeping Accept at `secondary`
  (never teal), and per-defect Undo until submission. Not mitigated further, for R1's reason.
- **R10 — Collapsing the note means an advocate can accept without reading why.** Accepted:
  where there is a suggestion, old → new *is* the reasoning in its most compressed form; where
  there is none, the note is never collapsed (§15.4). Watch on the render whether the trigger
  label reads as skippable.
- **R11 — "Due in 3 days" phrases an unconfirmed window as fact.** The 5-day assumption is O7's,
  not the statute's. Accepted for the demo; the absolute date rides in the `<time>` element so
  the assumption is inspectable, and the wording changes the day product confirms the rule.
- **R12 — A read-only flagged control may read as broken** to someone who tries to type in it.
  Mitigated by the inset sitting immediately beneath with the actions in it, and by the lock
  caption line. This is the one thing to test first on the render; if it fails, the fix is copy
  on the field ("answer this below"), not re-opening the control.
- **R13 — Three tiers is three clicks deep for a defect whose answer is "type the right value".**
  Accepted for the constrained case (§4): the depth exists to protect the filed value, and the
  common case — Accept — is still one click at the top. Revisit if O3 says bulk filers exist.

### 15.14 Open questions raised by v2.1

- **O9** — Can the officer attach a **suggested replacement document** on a document defect, or
  only a note? Decides whether tier 1's Accept / Ignore ever appears for document targets
  (§15.4). Needed before build; the fixture currently assumes note-only.
- **O10** — Does a "kept" answer — Ignore, my value stands, with a reason — reach a human at the
  Registry, or does it simply bounce as unresolved? This is O8 restated with teeth: v2.1 makes
  the dispute path *structural*, so the answer now changes what the screen promises.
- **O11** — Is "Ignore" the right word on the button? It is the owner's own term for the
  mechanism and it is honest and short, so it ships as-is. If copy review objects, the fallback
  is *"Use a different value"* on the same control — noted so nobody re-designs the interaction
  to solve a label.

### 15.15 v2 / v2.1 decision log

| Date | Change | Who |
|---|---|---|
| 2026-08-21 | **v2 direction opened** against the owner's measured diagnosis (five problems) and fixed decisions A–D. Interaction model of D1–D14 confirmed sound; v2 corrected hierarchy, redundancy and feedback only. | ux-designer |
| 2026-08-21 | v2: superseded D4's filled `bg-warning-muted` header strip with a rail + lift + inline marker; superseded D5's accordion queue card with flat compact rows; relocated the lock rule to one caption line; de-repeated the justification instruction; defined the correction-registered moment. | ux-designer |
| 2026-08-21 | **v2.1 approved on the rendered mockup.** Centre = the e-filing form **verbatim**; scrutiny layers on as a 2px accent on the flagged field group + a sunken inset nested under that field; locked fields recede on `disabled-fill`; queue is a compact Open/Resolved index with *"Due in 3 days · N of 8"* in its header; lock rule is one quiet caption line; resolved = green accent + collapsed inset + *"was &lt;old value&gt;"*. | Owner (mockup sign-off) |
| 2026-08-21 | **Owner ruling — two open defects in one section both stay accented.** Closes R6, which had left the alternative open. | Owner |
| 2026-08-21 | **New interaction model inside the inset (presentation feedback).** Tier 1 always visible: old → new with **Accept** / **Ignore**, plus the document as a **small thumbnail on the e-filing upload pattern** (`slot-row.tsx` `SlotThumbnail`), not an inline annotated preview — click opens the existing full view. Tier 2 collapsed accordion: the officer's note, voice note and transcript. Tier 3 accordion, opened by Ignore: *"Your corrected value"*. **The flagged field is never directly edited.** | Owner (presentation feedback) |
| 2026-08-21 | **Supersedes: in-field editing, and the always-rendered justification textarea.** Both were v1/v2 renderings; the flagged control is now read-only and the reason is one field inside tier 3. D7's *rule*, D6's derived resolution, and D14's single teal action all stand. Full list in §15.12. | Owner (presentation feedback), ux-designer |
| 2026-08-21 | **Bare-note defects mapped:** no Accept and no Ignore (nothing to accept); the note is promoted to tier 1 and never collapsed; tier 3 is expanded by default as the only action. Rule behind it: *tier 2 collapses only what tier 1 has made redundant.* | ux-designer (judgment) |
| 2026-08-21 | **D7 survives as a reason field inside tier 3**, required when the entered value contradicts an explicit suggestion, and required whenever the entered value equals the filed value (`kept`); optional on a bare-note correction. One `Textarea rows={2}`, one description line, no essay. | ux-designer (judgment, per D7) |
| 2026-08-21 | **Document defects take the same accept/ignore vocabulary.** Accept / Ignore appear only when the officer supplied a replacement file (O9); otherwise the note is tier 1 and tier 3 holds the `Replace` control, expanded. The `Replace` button moves off the flagged row into the inset, extending the sanctity rule to documents. "Ignore" on a document = `kept` and takes a required reason. | ux-designer (judgment) |
| 2026-08-21 | **Ignore is a route, not a resolution** — Ignore with nothing entered leaves the defect open and the submit gate closed. Stated explicitly because it is the likeliest thing to build wrong, and because D6 forbids any self-certified resolution. | ux-designer (per D6) |
| 2026-08-21 | **Deadline moves into the queue header** beside the count (*"Due in 3 days · 3 of 8"*), retiring v2's page-header clock. One place for the clock, one place for the counter. | Owner (mockup), ux-designer |
| 2026-08-21 | **Elevation drops out of the state ladder.** v2 used `shadow-raised` for "in play"; v2.1 has no lift, because the filing's own section cards own the elevation and the form must render verbatim. "In play vs done" is now carried by the inset being open vs collapsed. | ux-designer (`foundations/elevation`) |

### 15.16 Build notes (v2.1)

| Date | Note | Who |
|---|---|---|
| 2026-08-21 | **v2.1 built.** The centre renders the e-filing form verbatim; the flagged control is `readOnly`, the accent is `border-l-2 border-l-warning-ink` + `pl-3` on the field group, and the inset (`mt-2 rounded-md bg-surface-sunken p-3`, no border, no lift) spans the row beneath it. `defect-frame.tsx` and `annotation.tsx` are deleted. | ui-designer |
| 2026-08-21 | **`Resolution.how` is unchanged: `accepted · edited · kept · replaced`** — §15.3's own table names `edited` for the advocate's own value, so the contract did not have to move. Tests name the four routes and the one thing that is not a route (Ignore with nothing entered). | ui-designer |
| 2026-08-21 | **Deviation — the queue's group labels carry no counts.** §15.6 is explicit ("the header owns the one counter") and the mockup's *"Open · 6"* is not built. The header reads *"Due in 3 days · 24 Aug"* over the bar over *"N of 8 resolved"*. | ui-designer (§15.6 over the mockup) |
| 2026-08-21 | **Deviation — the flagged control drops its `prefilled` amber.** Two ambers on one row is what D4 forbade, and a value a person is now arguing about is no longer "machine-read, unverified". The read-only fill is the DS `Input`'s own (`read-only:bg-muted`). | ui-designer (D4) |
| 2026-08-21 | **Deviation — the label-row tag and the inset's first line both name the state**, at different granularity: the tag says *"Scrutiny flagged"* / *"Corrected"*, the inset says *"Open"* / the resolution (*"Suggestion accepted"*). §15.5 and §15.8 ask for the icon-and-word line; the tag is this build's reading of §15.1.2's *"thin layer: a 2px accent and an inset"* — the accent's non-visual half, and the only thing that tells a screen-reader user *why* the control is read-only. §15.1.2 does not itself mandate a tag; the earlier version of this row cited it as if it did. Neither is dropped, and neither repeats the other's words. | ui-designer (judgment; citation corrected 2026-08-21) |
| 2026-08-21 | **Fix — the flagged field's name is said twice, not four times.** It was: the form's own label, the *"Scrutiny flagged"* tag, the inset's first line, and the tier-3 control's label. The tier-3 control now carries §15.2's own words (*"Your corrected value"*, `sr-only` — the accordion trigger directly above it already shows them, and the label exists so the control is still named to a screen reader and to voice control). The inset's first line names the field **only when the field shares its row with another**, which is the position-alone ambiguity §15.5 was written for; it is measured from the rendered grid, so the same two-up row drops the suffix once the form folds to one column. Verified on the render: *Cheque 1 › Cheque number* reads "Open", *Cheque 2 › Bank branch* reads "Open · Bank branch", and at 375px both read "Open". | ui-designer (ui-reviewer Major 1) |
| 2026-08-21 | **Fix — a bare-note defect no longer opens demanding a justification.** The reason's REQUIRED marker was derived from *"the value equals what scrutiny saw"*, which is true of the untouched prefill on first paint, so the one thing the advocate had not done yet was the one thing the form insisted on — the inverse of §15.3's table. `reasonRequired()` in `lib/tasks/defects.ts` now distinguishes the two: against an explicit suggestion, keeping the filed value is a position from the moment tier 3 is open (D7, unchanged); on a bare note it becomes one only once the value has been moved and brought back. Six tests name the cases. | ui-designer (ui-reviewer Major 2) |
| 2026-08-21 | **Fix — Ignore now moves focus into what it opened**, and names it with `aria-controls` (the tier-3 region is `forceMount`ed so the id exists before it is opened). Mirrors the collapse-and-land rule already in the inset; D5's "move focus, do not merely reveal" applies to a disclosure as much as to the queue. | ui-designer (ui-reviewer Minor 3) |
| 2026-08-21 | **Fix — the read-only flagged control is `aria-describedby` the inset's first line**, so "read only" is heard together with "Open" and, on a two-up row, the field it belongs to. Threaded through `FieldReadOnly`, so every control kind that goes read-only in a correction gets it. | ui-designer (ui-reviewer Minor 4) |
| 2026-08-21 | **Not fixed — Minor 5.** *"Your reason goes back to the Registry with the correction"* asserts what O10 has not settled. Left as written; it is an owner/product decision, not a UI one. | ui-designer |
| 2026-08-21 | **Deviation — a document defect resolves only on a replacement.** §15.4's "Ignore on a document = `kept`" is gated on the officer supplying a replacement file, which O9 says is not modelled, so no Ignore is offered on a document and no reason route is invented for one. | ui-designer (O9) |
| 2026-08-21 | **The inset collapses when the *act* ends, not when the value resolves.** A reason resolves a defect on its first keystroke; collapsing then took the field away mid-sentence. The accent, the queue row and the counter still flip live. Found on the render. | ui-designer |
| 2026-08-21 | **The fold now ungates the page header.** At 1280 × 200% text zoom a pinned header is more than half the window; below the queue's fold the page scrolls as a page and only the submit bar is sticky (`ACCESSIBILITY.md` §10). | ui-designer (a11y) |
| 2026-08-21 | **The annotation boxes were a row off** the thing they marked, which the full-size view made obvious. They are now measured against the seeded pages, and the box is an outline in the lightbox rather than a dim-everything-else mark — at full size that greyed out the page the advocate opened it to read. | ui-designer |
| 2026-08-21 | **Upstream DS feedback:** a `disabled` primary `Button` at `opacity-50` still reads as enabled in dark (`#0eb39e` at 50% over a dark card). The gate is stated in words beside it, so nothing is lost, but the disabled treatment does not survive the dark ramp. | ui-designer (`ui-craft` §6) |
