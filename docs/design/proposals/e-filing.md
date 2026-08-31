# E-filing (cheque bounce, S-138 NI Act)

Status: building
Updated: 2026-08-30
Source: the owner's "ON Courts — Demo Master" prototype (Claude Design export, 14 screens;
decoded to plain HTML for this build) · docs/product/product-foundation.md ·
docs/product/domain/journey.md · docs/product/domain/practice-notes.md ·
docs/product/open-questions.md
DS read: `vendor/pucar-design-system` (origin verified
`neer-ideasbeforenoon/pucar-design-system`) — `AGENTS.md`, `ACCESSIBILITY.md`,
`RESPONSIVE.md`, foundations `laws` / `typography` / `spacing`; source of
document-slot · date-picker · banner · field · input · input-group · toggle-group ·
tabs · sheet · dialog · alert-dialog · alert · badge · progress · table · select ·
textarea · checkbox · tooltip · breadcrumb · input-otp · description-list · card.

---

## 1. Context

**Ask:** translate the e-filing experience from the offline demo into the actual app —
"not in a demo state but in an actual app state". Only the single-case cheque-bounce flow:
dashboard → *Start filing* on the cheque-bounce card → Case documents upload → the form
sections → Preview → Sign (with fees). Bulk filing is out of scope for this round. Design
alignment to the DS and structural changes are an explicit **round 2**; this round sets the
base up faithfully.

**What existed:** on this branch the app was empty (root page rendered nothing). Reference
work lives on other branches (advocate home v3, Cases + app shell) and is not merged.
The demo itself is one 11 MB HTML bundle: base64 screens rendered in an iframe, React 18
inlined, a small "Rajini 2.0" component bundle, and three `dc-import` components
(DocSlot, AddressFields, SourcePanel).

## 2. Problem

The demo defines the product almost completely (copy, fields, conditionals, mock OCR
prefill with a source-document panel, tabs per entity, modals, signing and payment) but
as inline-styled HTML with per-screen class components, hard-coded pixel values, its own
tokens, and no shared state (screens talk via `localStorage`). None of it can be shipped,
tested, themed or reviewed against the DS.

### Round 3 — the dashboard as it stands (2026-08-30)

Rounds 1–2 built and DS-anchored the whole flow; nobody has yet asked what the *entry*
screen is for. Diagnosed on the render at 1440 px on `feature/efiling-dashboard`
(= `main` @ a3d3e48) against
`apps/dristi-app/src/components/filing/dashboard/filings-dashboard.tsx`:

1. **Five sections, one rank.** Hero, Continue a draft, Received from your clients,
   Start a new case, Recently filed cases all render through the same local `Section`
   (`text-title-s` + description + `py-8`). Nothing on the page says which one is
   today's. The screen is an index of its own features, not a place of work.
2. **The default account is the worst-built state.** With no drafts and no filings,
   three of the five sections are a bare `<p>` of grey prose ("No drafts yet. Start a
   new filing below.", "Nothing filed yet…") — no illustration, no action, no DS
   `Empty`, which is already synced at `components/ui/empty.tsx` and unused here.
3. **The stats are decoration, and one of them is a duplicate.** "Drafts in progress: 0"
   sits directly above a section that says "No drafts yet"; "Cases filed (12 months)" is
   a vanity count with nothing behind it. Both render "–" until `useMounted`, so the
   hero visibly changes on load.
4. **Three of the four case-type cards are dead.** Civil money suit, matrimonial/family
   and consumer dispute each get a full card — icon tile, description, "~55 min · 8
   documents" — and a permanently `disabled` "Start filing". The single largest, most
   prominent grid on the page is 75% non-functional, and the ~minutes/documents figures
   on those three are invented (no product source).
5. **More than one primary.** The round-1 log already recorded "two teal actions in
   separate sections (Continue draft · Start filing)". With a draft present it is three
   once the batch card populates. `ration teal` (DS Laws) is a per-view rule, not a
   per-section one.
6. **The Status column never varies.** Every row in Recently filed renders the same
   `Badge variant="secondary"` reading "Submitted from this browser". A column with one
   value is not a column; it is a caption repeated N times.
7. **Nothing on the screen is about time.** §138 runs on hard clocks — demand notice
   within 30 days of the dishonour memo, 15 days to pay, complaint within one month of
   the cause of action (docs/product/domain/journey.md §§1–3). The dashboard shows a
   draft's *percent complete* and its *last saved* timestamp, and never the only number
   that can cost a client the case: how long the limitation window has left. Percent
   complete is a progress bar for the app; days remaining is a fact about the case.
8. **Cost to the one working action.** On an empty account the only pressable primary
   (Start filing, cheque bounce) sits ~740 px down a 1261 px page, behind two empty
   sections.

Problems 1–6 and 8 are composition and can be fixed here. Problem 7 turned out **not** to
need new data: `limitationView()` already computes it and `feeBill()` already spends it
(see decision D8).

## 3. Objective

A user can walk the whole flow in the app on real routes, with one persisted draft, and
every screen composed only from DS primitives and named tokens — such that round 2 is a
design pass, not a rebuild. Test: `check:tokens` · `check:typography` · `check:ui-sync`
pass; the flow completes end to end in the browser; the draft survives a reload.

**Round 3 (dashboard).** On opening `/filings` a person can tell, without scrolling,
what needs doing and what the next action is; every state on the page is a designed
state rather than a sentence; nothing on the page advertises a capability that does not
exist. Observable: one primary action in the viewport at 1440 px and at 375 px; zero
permanently-disabled controls; no section that renders only prose; the empty account and
the busy account are both legible screens.

## 4. Job

Filing the complaint (docs/product/product-foundation.md § "Filing the complaint") — the
DCMS e-filing step where the complaint, affidavit, documents and court fee go in. This
brief does not name who logs in (docs/product/open-questions.md); the demo's advocate/
complainant framing is carried as-is.

## 5. Decisions

### Routes and shell
- `/filings` — the e-filing dashboard (demo "Dashboard"). `/` redirects here until a home
  exists on this branch. `/filings/bulk` — honest stub.
- `/filings/new` — creates a blank draft and opens it (no screen of its own).
- `/filings/<draftId>/upload` — Case documents upload (no rail; narrow centred column).
- `/filings/<draftId>/(form)/{complainant,advocate,accused,cheque,demand-notice,
  jurisdiction,adr-prayer,witnesses,documents,preview}` — the form sections inside a
  Sections rail.
- `/filings/<draftId>/sign` — Sign (own three-column layout; fees are modals here).
- The rail lists Affidavit and Pay fees as non-link placeholders exactly as the demo did
  (affidavit is composed in Preview; fees paid from Sign).
- One `FilingProvider` per draft (`/filings/[draftId]/layout.tsx`): loads the draft from
  the browser repository (IndexedDB), `update((d) => …)` clones and commits, and the
  debounced write drives "Saving… / Saved / Couldn't save". `lastStep` follows the URL so
  the dashboard's "Continue draft" resumes in place. Many drafts coexist; each has its
  own files. See `apps/dristi-app/src/lib/filing/README.md` for the engineering seams.

### Translation rules (demo → DS)
- Prefilled (OCR) values → DS `Input`/`Textarea` `prefilled` (amber fill, dashed
  warning-ink border, sr-only "Machine filled, not yet verified"); Select/DatePicker/
  InputGroup get the same tokens by class. Clicking a prefilled control opens the
  **SourcePanel** (docked right ≥1280 px, pushes the form; Sheet below) with the document
  image, the read region highlighted with `bg-halo` + `scrim`, and the editable "Value used
  in this field" box that clears the marker.
- Segmented Yes/No → DS `ToggleGroup` (single, outline) lifted to `h-10`.
- Per-entity tabs → DS `Tabs` (line) + a status dot with sr-only text + a sibling remove
  icon button (never nested interactive) + "Add …" ghost.
- Document slots → DS `DocumentSlot` (empty · empty-optional · processing · filled ·
  filled-poor) with row actions composed beside it.
- Standing notices → DS `Alert` (info/warning) with a dismiss button; dismissals persist on
  the draft. Modals → DS `Dialog` / `AlertDialog`; drawers → `Sheet`.
- Copy converted to sentence case (DS Law); legal abbreviations kept (S-138, NI Act, PoA,
  IFSC, RPAD, AD card, OTP).
- The demo's `+91` / `₹` prefixes → DS `InputGroup`.
- Dates stored ISO, shown via the DS `DatePicker` (its own format) or dd/mm/yyyy in
  read-only/source contexts.

### Kept from the demo (behaviour), now real
Document reading of the cheque, memo, notice, dispatch/delivery proofs and ID proof
(Tesseract.js in the browser; poor-scan = low read confidence → re-upload path); IFSC
"Fetch details" (public IFSC registry) and PIN → district/state; OTP verify; "same as
previous cheque" bank inheritance; S-138 return reason warning; delivered/undelivered
branches; no-contact double confirmation for accused; required-documents gate before
Preview; sign by e-sign OTP or upload; fees → process & address → processing → success.
Sign and pay stay a **labelled sandbox** (any OTP; simulated payment; generated case-file
number) — the owner's call: the end of the flow is shown, not integrated.

### Dashboard redesign (round 3, 2026-08-30)

Provisional where noted: the Job of the *flow* is confirmed (§4), but who logs in is
still open (docs/product/open-questions.md), so anything that depends on volume —
individual Kerala filer vs Gujarat bulk institution — is marked and designed for the
more constrained case (one person, few drafts, small screen).

- **D1 · One work region, then everything else.** The page leads with the state the
  person is actually in — resume a draft, or if there is none, start one — and demotes
  the rest to a second rank. Traces to DS Laws *ration teal* (one primary per view);
  alternative rejected: keep five equal sections and re-order them, which does not fix
  problem 1. Given up: the tidy symmetry of the current section stack.
- **D2 · Kill the stat cards in their present form.** "Drafts in progress" restates the
  section below it; "Cases filed (12 months)" answers nothing anyone asked. Judgment.
  Alternative rejected: keep them and add a third — more decoration. Given up: the
  dashboard *look*. If a number returns it has to be one that changes a decision (e.g.
  drafts against a closing limitation window) — which needs D6's data.
- **D3 · One case type, honestly.** Cheque bounce is the only filing this product
  supports. The other three stop being cards with dead buttons. Recommended: a single
  "Start a cheque-bounce filing" action plus a plain line naming what is coming, not
  three disabled facsimiles. Traces to problem 4; DS has no "disabled card" pattern to
  lean on. Given up: the four-up grid that made the product look broader than it is.
- **D4 · Every empty state uses DS `Empty`.** `Empty` / `EmptyHeader` / `EmptyMedia` /
  `EmptyTitle` / `EmptyDescription` / `EmptyContent` are synced and unused
  (`components/ui/empty.tsx`). Traces to §3 of the DS gate — never hand-write what the
  DS ships. Given up: nothing.
- **D5 · Batch and filed rows compose from DS `Item`.** The batch card currently
  hand-rolls a `size-11` icon tile + text stack + button inside a `Card`; `Item` with
  `ItemMedia` / `ItemContent` / `ItemTitle` / `ItemDescription` / `ItemActions` is
  exactly that shape and is already synced (`components/ui/item.tsx`, `variant="outline"`).
  Given up: the bespoke sm:flex-row breakpoint behaviour, which `Item` handles by
  `flex-wrap`.
- **D6 · Recently filed loses the constant Status column** and, if a status column
  survives at all, it carries registry state — not "Submitted from this browser", which
  belongs once as a caption on the table. **Provisional**: what a filed case can truthfully
  say depends on whether anything connects to CIS/eCourts (open question below).
- **D7 · Reverses the round-1 "two teal actions" call.** Logged 2026-08-17 as acceptable
  because the actions sat in separate sections; problem 5 says that reading was wrong —
  Laws ration teal per *view*.

- **D8 · The limitation clock goes on the dashboard, framed as condonation — not as a
  verdict.** *Owner, 2026-08-30, answering the open question:* "maybe show it as how you
  need to finish this within x days without delay condonation? I will let you figure this
  out."

  **No new data and no new derivation is needed.** `limitationView(draft)`
  (`lib/filing/selectors.ts`) already returns `causeDate` (the filer's typed date, else
  derived as notice service + `PAYMENT_WINDOW_DAYS` = 15, taking the **earliest** across
  notices), `filingDate` (today while the draft is unfiled — "freezing the date would hide
  a growing delay"), `elapsed`, `withinLimit`, `overBy` and `causeDerived`. `feeBill()`
  already adds the condonation-application fee once `elapsed > LIMITATION_DAYS` (30).
  So the number is computed today, spent on a fee line three screens deep, and never
  shown on the screen where someone would act on it. Problem 7 is a *surfacing* problem,
  not a data problem — which retires the "can we hold the §138 clocks?" question below.

  **What the card says**, by state (`daysLeft = LIMITATION_DAYS − elapsed`):
  - *No `causeDate` and no served notice* → **no clock at all.** Matches the rule already
    written into `noticeCauseDate`: "a limitation date guessed from nothing is worse than
    no date at all." Never a zero, never an estimate.
  - *In time* → "File by {date} — {n} days left." Neutral; the date leads, the countdown
    supports it.
  - *In time, ≤ 7 days* → same sentence, warning treatment (DS `Alert`/`Badge` warning
    tokens — colour never alone, the words carry it: DS Laws *no alpha status fills*,
    a11y floor).
  - *Past 30 days* → "The one-month window closed on {date}. Filing now needs a
    delay-condonation application (added to the fee bill)." **Never "overdue", never
    "barred"** — delay is condonable for sufficient cause (NI Act §142(1)(b) proviso), so
    a hard verdict would be a legal claim the product cannot make. This wording states
    two facts the app already acts on: the date passed, and the bill changed.
  - *Derived rather than typed* (`causeDerived`) → the date is shown with a quiet "from
    your notice service date" so nobody mistakes an inference for a filer's entry.

  Traces to docs/product/domain/journey.md §§2–3 (15 days to pay; complaint within one
  month of the cause of action) and to the existing selector. Alternative rejected: a
  red "overdue" state — states a legal conclusion. Given up: a single glanceable
  traffic-light, in exchange for copy a court would not object to.

### Wireframe reconciliation (round 3, 2026-08-30)

Source: Claude Design project `9464d9bc-a8dd-4060-967b-a9644a1d8728`, `File a Case.dc.html`
+ `theme.css`, read via DesignSync. The owner's instruction: "use this as a wireframe and
make it a functional part of the design … then anchor it to our context and DS."

**What the wireframe specifies** — page head "File a case"; a two-up entry row
(*Start a new filing*: most-filed case-type rows + a "Show all 21 case types" disclosure
containing a live-filtering search over a 21-type catalogue · *Bulk filing*: most-recent
import with a stacked four-segment progress bar, legend, and three actions); then a
*Your filings* work queue — **sticky** header+tabs (`top:60px`) over four tabs
(Drafts · Pending scrutiny · Returned with defects · Registered) each with a count pill,
a toolbar (search · case type · court · sort), a per-tab column set with one CTA per row
("status lives in the tab, not the row"), and windowed pagination at 12/page.

- **W1 · The four tabs are buildable from data this repo already has** — the finding that
  retires the "can a filed case's real status be shown?" question for everything except a
  live registry link. `CaseRecord` (`lib/cases/types.ts`) already carries `caseNumber`,
  `parties`, `court`, `filedOn`, `stage` (with `"scrutiny"` among `ACTIVE_STAGES`),
  `nextHearing {on, purpose}` and `latestUpdate`; `lib/tasks` already models
  `kind: "returned"` with `returned.defects` and a due date (`sandbox.ts`), and
  `urgency.ts` already words deadlines. The wireframe's own court names
  ("JMFC-I, Kollam") are verbatim the fixtures'. So: Drafts ← `useDrafts()`,
  Pending scrutiny ← cases at `stage: "scrutiny"`, Returned with defects ←
  `kind: "returned"` tasks, Registered ← cases past scrutiny. **No parallel dataset is
  invented.**
- **W2 · …which makes the IA overlap the real risk, not the data.** That queue is close
  to `/cases` (Your Cases — which already has `selectCases`, filters, buckets and
  pagination) and overlaps `/tasks`. Building it as drawn would be a second case list with
  its own filter vocabulary — the thing CLAUDE.md forbids ("never quietly introduce a
  second way"). **Resolution:** the queue is a *view over the same stores*, scoped to
  "filings I made", never its own data or its own truth; anything about working a case
  still links out to `/cases/<id>` and `/tasks/<id>`. Registered rows therefore open the
  case, they do not restate it.
- **W3 · 21 case types → the one we actually file, plus an honest reference list.**
  The wireframe lists 21 types with personal counts ("128 filed by you"). DRISTI files
  one: cheque bounce. Keeping 20 more as pressable rows is problem 4 twenty times over.
  Decision: the primary list carries only what can be filed, with **real** counts derived
  from the person's own filed drafts; the disclosure + search survive, but as a labelled
  reference list of what is not yet on DRISTI — no chevrons, no dead affordances.
  Consistent with D3; the wireframe's *pattern* is kept, its *inventory* is not.
- **W4 · Bulk filing keeps its card, and stops claiming an import that does not exist.**
  The Tata Capital / Provakil batch is demo data. The card, the stacked bar and the
  legend are built; with no import they render the DS `Empty` state and the actions
  point at `/filings/bulk`. Still **provisional** pending the "do client batches exist?"
  question.
- **W5 · Sticky queue header is kept — it is the one scroll behaviour that earns itself.**
  Tabs and counts stay visible while a long table scrolls under them. Anchored to the
  app's own top bar height rather than the wireframe's `60px` literal.
- **W6 · Folder tabs → DS tabs.** The wireframe draws tab-shaped chips with a border on
  three sides sitting on a rule. The DS ships `tabs.tsx` (line variant) and `ui-craft`
  already settled this for the filing area: "tab underline sits on the band hairline
  (list `h-10`, `after:-bottom-px`)". DS wins. Count pills stay, as DS `Badge`.
- **W7 · Values → tokens, throughout.** The wireframe's `theme.css` is a *fork* of the DS
  (`--radius` 10px, cards 14px, `.card` shadow-sm) with its own literals: `--sb-w:248px`,
  `#80838d`, `#c1c3cc`, `#fdeceb`, radii 14/11/9/8, padding 22/20/18/16/15/13/11,
  gap 22/14/18, `.seg` 9px, `min-width:900px`. None of it ships. Everything maps to the
  Dristi ladder and named tokens (`p-6`, `rounded-xl`, `hairline`, `surface-sunken`,
  `muted-foreground`, `brand-muted`, `warning-muted`, `track`, `destructive`). The
  wireframe's `--primary:#007e7e` is already our brand teal, so intent survives the
  translation.
- **W8 · The stacked four-segment bar is a composition, not a new primitive.** DS
  `Progress` is single-value; a stacked bar is composed from a flex row of token-filled
  spans with an sr-only breakdown (status never by colour alone). Logged as a DS request.
- **W9 · D2 partially reverses.** D2 killed the stat cards as decoration. The wireframe
  replaces them with something better and I am taking it: counts move onto the tabs,
  where a number is a filter with a size rather than a tile. The stat cards still go.

Not decided here (needs the owner, see *Open questions*): whether client batches return
as a real, populated surface, and whether time-to-limitation lands this round.

## 6. What I cut (and why)

- Bulk filing (client batches) — out of scope by the ask; stubbed at `/filings/bulk`.
- Rich text toolbars beyond bold/italic/lists/align — `execCommand` is enough for round 1.
- The demo's page-fade transitions and iframe navigation — not product behaviour.
- The demo's separate "Learn more" behaviour on case cards — no target defined.

Round 3 (dashboard):

- **A KPI row.** Considered replacing the two stat cards with four; cut — a filing desk
  with a handful of live drafts has no numbers worth a tile, and at 375 px a KPI row is
  four boxes of scroll before the first action.
- **Tabs / segmented control across draft · filed · batches.** Cut: it hides two of the
  three states behind a click on an account that usually has one of them, and it fixes
  the wrong problem (density, not priority).
- **A calendar or deadline strip.** Cut *this round* only for want of data (D6 / problem
  7), not because it is wrong — it may be the most valuable thing on the screen.
- **Long-label / language:** section headings, the case-type name and any status word are
  the strings a state layer translates. Nothing in this round may depend on a heading
  fitting one line, and the case-type name ("Cheque bounce (S-138, NI Act)") must be
  allowed to wrap to two lines at 375 px without the action moving out of reach.

## 7. Layout & hierarchy

Top bar (h-14, sticky) → [rail 18rem, sticky, own scroll] + [main column, `max-w-3xl`,
left-aligned; `max-w-5xl` for the documents table] → sticky footer (Back · Saved · one
primary Continue). Source panel docks at 24rem on the right on ≥1280 px. Below `lg` the
rail is a Sheet behind a "Sections" button; below `md` all two-up rows stack.

## 8. Components (DS name → region)

Card (form groups) · Field/FieldLabel/FieldDescription (every field) · Input, InputGroup,
Textarea, Select, DatePicker, ToggleGroup, Checkbox, InputOTP · Tabs (entity tabs, preview
mode) · Alert, Banner (notices) · Dialog, AlertDialog, Sheet · DocumentSlot · Progress ·
Badge · Breadcrumb · Table · DescriptionList (preview) · Tooltip · Avatar · Spinner ·
Button (all actions; `variant=link` for view-all).

## 9. Spacing

Cards `p-6`, field stack `gap-6`, two-up grid `gap-4`, page sections `gap-6`, rail
`p-4`, footer `py-3 px-6`. Ladder only; the panel offset uses `w-96`/`mr-96` (layout,
not spacing).

## 10. States

Per screen: empty · partially filled · prefilled-unverified · edited · saving/saved ·
processing (upload) · poor scan · required-remaining vs all-set · removed (confirm) ·
signed/pending · paid. All draft state reloads from storage.

## 11. Risks accepted

- Mock data everywhere (registries, OCR, fees, case number) — shapes mirror services.
- `structuredClone` per keystroke on a small draft is fine now; revisit if the draft grows.
- The DS `DocumentSlot` has no inline progress bar or row actions; composed around it.
- DS `DatePicker` shows "March 15th, 2026" while court copy uses dd/mm/yyyy — DS wins on
  the control; documents/values use dd/mm/yyyy.

## 12. Open questions for product

- Which persona files (advocate vs complainant in person)? The demo mixes "You" as
  complainant on Sign with an advocate-style dashboard. Not decided here.
- Draft identity: one local draft now; real drafts need an id in the route.
- Where the "Affidavit" section lives (own screen vs Preview only).
- The exact order of fees vs process & address (demo left it unwired; wired here as
  Payment → Process & address → Processing → Success).

Round 3 (dashboard), 2026-08-30 — **blocking the build**:

- **Is the attached screenshot the target or the reference?** It is not this codebase:
  "Tata Capital", "via Provakil", "View all batches" and the "Exported for CIS" badge
  appear in no commit on any branch (`git log --all -S`, 226 commits), it has no app
  shell, and its copy is title-case and pre-DS-audit. It matches the owner's original
  "ON Courts — Demo Master" prototype, whose hard-coded client batch this app
  deliberately turned into an empty state (log, 2026-08-17 night). So: build *toward*
  that demo (batches become real, registry status becomes real), or treat it only as
  "the screen I mean"?
- **Do client batches exist as a product capability?** Cut in round 1, stubbed at
  `/filings/bulk`. If they are real, who pushes them (Provakil-style litigation systems?),
  and does that answer "who logs in" for the bulk-institutional deployment?
- ~~**Can a filed case's real status be shown?**~~ **Largely answered by W1** — the app
  already models scrutiny stage, returned defects and hearings, and the queue reads those.
  What remains open is narrower: a *live* CIS/eCourts link, which nothing here claims.
- ~~**Can we hold the §138 clocks on a draft?**~~ **Answered 2026-08-30 by the owner** —
  show it as "finish within X days without needing delay condonation". Moved to decision
  D8. Found while answering: the derivation already exists (`limitationView`), and the
  condonation fee already keys off it, so nothing new is claimed.

## 13. Gaps in the DS

- DocumentSlot: no progress state visual, no delete/preview actions, thumbnail slot only.
- ToggleGroup sizes stop at h-9 (36 px); lifted to h-10 in composition for touch targets.
- No "source panel" / docked inspector primitive.
- No rich-text editor primitive.
Recorded in `docs/design/ds-requests.md` when round 2 confirms them.

## 14. Decision log

- 2026-08-17 — Owner: translate the whole demo e-filing flow into the app; DS anchoring
  and structure changes come in round 2. Built the base: store, shell, shared components,
  dashboard, all sections, preview, sign. Gates + production build green; flow walked
  end to end in the browser (light/dark, 1280 and 375 px).
- 2026-08-17 — Translation calls made while building (each reversible; review in round 2):
  - Source panels default open on ≥1280 px only (a Sheet below that would trap focus on
    load); prefilled fields and "View source document" open it elsewhere.
  - Poor-scan explanation is visible text under the slot, not a hover tooltip (a11y rule
    7); slot descriptions render under the DS `DocumentSlot` (no description prop).
  - Complainant removal asks for confirmation (the demo deleted a whole party silently);
    accused/advocate removal stays immediate as in the demo.
  - Advocate "Full name" shows "No match in the Bar Council registry…" when the number
    is unknown (demo left it blank). "Fetch details" stays inert — the demo's handler was
    a no-op and there is no profile registry to pull from.
  - Return reason shows its label (not code) in the source value box; a machine-read
    dispatch date is correctable from its source panel (demo had no way back).
  - Preview "Edit" opens a Sheet (demo: docked aside); Edit buttons are 40 px.
  - Sign: E-Sign is the rail's primary until you sign, then the footer's "Continue to pay
    fees" becomes the primary (ration teal). Fees → process & address → processing →
    success wired in that order (demo left process & address unreachable). Process &
    address choices are local state — `SignState` has no field for them yet.
  - Documents gate: Continue stays focusable while blocked and explains why.
  - ADR guidance renders above the editors (demo order) via `FormField helpPlacement`.
  - Dashboard has two teal actions in separate sections (Continue draft · Start filing).

- 2026-08-17 (later) — Owner: "UI looks bad and inconsistent." Root cause: the `ui-craft`
  skill lived only on the unmerged v3 branch, so this branch was built without it.
  Restored the skill here (both rails) and ran a craft pass through the shared vocabulary:
  page title → `text-title-l`, card titles → `text-title-s`, subheads by colour not a third
  weight; every chrome seam / row rule / internal divider → `hairline` (Card edges and
  table frames keep `border`); segmented control → DS Tabs-style `bg-track` + raised chip,
  no teal on selection; info wells → borderless `surface-sunken`; DocumentSlot actions
  inline as icon-only ghosts; table delete icons muted (hover destructive); sidebar count
  as plain tabular text; tab underline sits on the band hairline (list `h-10`, `after:-bottom-px`).

- 2026-08-17 (later still) — Owner: "still amateur, wireframe, no elevation or layering."
  Root cause: everything sat on one white fill. Layering model applied across the area:
  canvas `bg-surface-sunken` on the filings layout; chrome (header, rails, footer, source
  panel) `bg-card` with hairline seams; panels = `Card` + `PANEL_CLASS`
  (`border-hairline shadow-raised`); wells `bg-surface-sunken` inside panels only (the
  Sign sheet's outer well removed; dashboard section rules removed, hero is a white band).
  Written into `ui-craft` §0/§1/§2/§4/§5/§6 and wired as mandatory in the always-on DS
  gate, CLAUDE.md, `pull-ui-from-ds`, and both design roles; committed and cherry-picked
  onto local `main` (`c157880`, unpushed) so new branches inherit it.
  **Upstream DS feedback:** the Laws' `bg-muted` stage is 1.03:1 (imperceptible) —
  propose a canvas token at the `surface-sunken` value and a `Card variant="raised"`.

- 2026-08-17 (evening) — Owner: grey canvas "not working / departing from the DS"; form
  column leaves dead space beside the source panel; documents table badly formatted; asks
  why the neutrals read dull. Reverted the page to `bg-background` and rails to
  `bg-sidebar` (the DS `SidebarInset` model and the accepted advocate-home vocabulary);
  panels stay lifted (`PANEL_CLASS`). Form column now caps at `max-w-4xl` with 48px
  gutters and the docked panel takes `clamp(20rem, 100vw − 80rem, 40rem)` via one CSS
  variable (`--source-panel-w`) — the demo's mechanism, so wide screens have no dead
  space. Documents tables share fixed columns (16 / auto / 72 / 40 / 28), uniform 40px
  rows, centred checkboxes, right-edge actions, intake note as caption text. ui-craft
  §0/§4 corrected accordingly (commit `757ad4e`, cherry-picked to local `main`).
  Diagnosis of the neutrals/tokens: `docs/design/ds-diagnosis.md`.

- 2026-08-17 (night) — Owner: "it's still acting like a demo — I want an actual app: I
  upload files, type my details, and see everything contextual to me; my tech team builds
  the backend later, this is my handoff." Decisions taken (owner answered: front end must
  work off real input; identity is out of scope here; OCR in the browser via
  Tesseract.js; sign/pay may stay a demo, just better built):
  - Drafts are real objects: `/filings/<draftId>/…`, stored in IndexedDB with their
    uploads; the dashboard lists every draft (title from the parties typed, progress
    derived from section completeness, resumes at the last step) and every filed case;
    stats derived; the hard-coded client batch became an empty state.
  - Nothing is seeded: a new filing is blank (one complainant / advocate / accused /
    cheque / notice / witness row; intake slots for cheque 1 and party 1).
  - Uploads are real files (picker, IndexedDB blobs, previews of the actual image or PDF
    page 1); reading runs in the browser and writes machine-read values with the same
    review markers; the source panel shows the real document with the read box.
  - Real lookups (IFSC registry, PIN → district/state, full state list); police station,
    district and coordinates are typed (no fake map pin); advocate name is typed (no bar
    registry exists) with "Use my details" from the profile.
  - "Me" is a local profile behind the header avatar (name, mobile, email, bar number) —
    the seam for the product session; it greets, marks "you" among signatories and
    prefills the advocate card.
  - Signatories, process addresses, fees, relief wording and the court document derive
    from the draft; the "S/o …" and Bar Council literals are gone (fields not collected —
    listed as a form gap in the README rather than invented).
  - Sign/pay: sandbox with visible captions; on payment the draft becomes `filed` with a
    generated case-file number and appears under "Recently filed".
  - Runtime assets (pdf.js worker, Tesseract worker/cores/English data) are copied into
    `public/vendor/` on dev/build — no CDN at runtime.

- 2026-08-18 — Owner: adopt the **advocate-home v3 app shell** for the filing area, and
  answer for the white notices. Decisions:
  - **Shell.** Top bar becomes chrome: sidebar collapse trigger · breadcrumb · search ·
    account. Court/product identity moves into the main sidebar header (v3's placement).
    Main navigation is the DS `Sidebar collapsible="icon"`; it is **collapsed by default
    inside the filing flow** and expanded on the dashboard, with the person's own toggle
    winning afterwards. The in-page breadcrumb leaves `FilingPageHeader` — the top bar
    carries the only one.
  - **Two rails, one provider.** The filing steps rail and the source panel are *composed*
    surfaces, not DS `Sidebar`s. Measured constraint: every `SidebarProvider` registers its
    own ⌘B `window` listener and writes the same `sidebar_state` cookie, so nesting two
    means one shortcut toggles both rails and the cookie stops meaning anything. This
    partly reverses the 2026-08-17 adoption of `Sidebar` for the filing rail — that
    adoption was right when the rail was the *only* one; with a real main nav the roles
    change, and v3 already models secondary surfaces (`PendingTasksRail`,
    `CaseDetailPanel`) as composed rails. The behaviours the adoption bought — collapse to
    a strip in place, persistence, mobile sheet, `aria-current`, 40px hit areas — are
    carried over by hand and must not regress.
  - **Source panel → right rail.** Collapses to a strip on the right edge and expands in
    place rather than disappearing; still pushes the form rather than covering it above
    `xl`, still a Sheet below.
  - **Search is built, not mimed.** A DS `Command` palette (⌘K) over the person's own
    drafts and filed cases (party names, case-file number), opening a result at its last
    step. A search box that does nothing would be the same defect as the "EN" / "Support"
    controls removed the day before.
  - **Notices get their semantic colour back.** `SectionNotice` already received
    `variant`, but the component discarded it and rendered every notice as a white panel
    with a tinted icon — a `ui-craft` cheap-tell row written in `3a22ca0` that over-reached
    into banning a treatment the DS ships (`Alert` has opaque `-muted` variants with their
    own foreground pairs). The Law is "status never by colour **alone**", not "never by
    colour". The rule is corrected in both skill copies: the cheap tell is *stacking*
    tinted blocks, tinting *body copy* grey on a tint, or tinting *pure instruction* —
    not using the system's own status fills.
  - Notifications are **not** built: v3 has a bell, this product has no notification data,
    and inventing one would be a claim.

- 2026-08-30 — Owner: redesign the existing `/filings` dashboard; branch
  `feature/efiling-dashboard` cut from `origin/main` @ a3d3e48 (e-filing, pending tasks,
  cases, vakalatnama and the `/welcome` role split are all on main now). Screenshot
  supplied "of what I exactly mean". Verified it is **not** the running app: the strings
  in it exist in no commit on any branch, and the live screen shows the batch empty state.
  Recorded as the demo, and as an open question rather than an assumption.
  Round-3 problems 1–8 diagnosed on the render; decisions D1–D7 proposed; D7 reverses the
  2026-08-17 "two teal actions" call. Job unchanged (§4). Nothing built this turn.

- 2026-08-30 (later) — Owner: answered the limitation question — frame it as "finish
  within X days without delay condonation", "I will let you figure this out". Written up
  as D8; the open question is struck through rather than deleted. Also asked to import a
  Claude Design wireframe (`File a Case.dc.html`, project 9464d9bc) as the target for this
  screen. **Not imported: DesignSync needs `/design-login`, which cannot run in a
  non-interactive session.** The wireframe is therefore not yet reflected anywhere in this
  brief — D1–D7 stand on the render diagnosis alone and must be re-checked against the
  wireframe once it can be read.

- 2026-08-30 (evening) — Wireframe imported (DesignSync, after `/design-login`):
  `File a Case.dc.html` + `theme.css`. Reconciled as W1–W9. Two findings changed earlier
  positions: the four queue tabs map onto data already in `lib/cases` and `lib/tasks`
  (so the registry question narrows to a live link only), and the wireframe's queue
  overlaps `/cases` and `/tasks` — resolved as a scoped view over the same stores, never
  a second dataset. W9 partially reverses D2. The wireframe's 21-type catalogue is not
  adopted as pressable inventory (W3, consistent with D3).

- 2026-08-30 (build) — "File a case" built on `feature/efiling-dashboard`. New:
  `lib/filing/queue.ts` (row model + the limitation clock + filters/paging, 14 tests),
  `dashboard/start-filing-card.tsx`, `dashboard/bulk-import-card.tsx`,
  `dashboard/filings-queue.tsx`; `filings-dashboard.tsx` rewritten to compose them.
  Gates green (`ds-fresh`, `tokens`, `typography`, `ui-sync`, `rails`); 132 tests pass;
  tsc and lint clean. Deviations from the wireframe, each with its reason:
  folder tabs → DS line tabs (W6); 21 pressable case types → one real type + a labelled
  reference list (W3/D3); the stat row stays deleted, counts live on the tabs (W9);
  a ghost discard action was added to draft rows, which the wireframe has no slot for —
  removing the old draft card had otherwise left no way to delete a draft.
  **Two bugs found and fixed while building:** the queue gated its whole table on the
  tasks store, so one unready tab blanked all four; and a hand-rolled `addDays` parsed
  local time and formatted UTC, which moved every limitation date a day earlier in IST
  (now uses `format.ts`'s own helpers — the reason it was caught is the D8 tests).
  **Verified on the render** (after the owner restarted the server): the "cannot hydrate"
  symptom was **not** the server — it was the origin. Next.js blocks cross-origin HMR, so
  `127.0.0.1:3000` serves a client that never hydrates while `localhost:3000` works. Every
  agent verifying this app must use `localhost`. (`.claude/rules/dev-server.md` names
  `127.0.0.1` as the address and cites a `npm run dev:stop` script that does not exist —
  both need correcting.)
  Exercised end to end at 1200–1440 px: tab switching (columns and the info cell change
  per tab), counts (Drafts 0 · Pending scrutiny 2 · Returned with defects 3 ·
  Registered 32, all from the real stores), search (matches either side of the cause
  title), the court filter (appears only when a tab has more than one court), sort,
  pagination (Showing 25–32 of 32), the case-type disclosure (expands, focuses its search,
  lists the 20 counter-only types), and the sticky header pinning flush under the top bar.
  **Two further defects found on the render and fixed:** the queue's search shared its
  accessible name with the top bar's command palette; and the sticky header did not stick,
  because the DS `Card` master carries `overflow-hidden` and a clipping ancestor makes
  `position: sticky` inert — overridden with `overflow-visible` on that one Card and
  logged in `docs/design/ds-requests.md`.

- 2026-08-30 (sandbox) — Owner asked to see the screen populated. Added
  `lib/filing/demo-drafts.ts` and a `SandboxStrip` at the foot of the screen: five sample
  drafts chosen to walk **every** state of the limitation cue (22 days left · 4 days left,
  warning · window closed, condonation · no cause of action at all), and a sample client
  batch behind a toggle. Loaded only on a press, never on open — the standing decision
  that a new filing starts blank is unchanged, and the bulk card still claims nothing on
  its own (W4). The strip is plain, last on the page, and says outright that the screen
  has no backend; `clearDemoDrafts` removes only ids it wrote, so a real typed draft
  survives. Delete both files together when real data arrives.

- 2026-08-31 — Staff UX review of the built screen, then all 13 findings fixed in the
  order the review ranked them. The two criticals were mine and were wrong, not merely
  suboptimal: **Registered opened on the furthest-away hearing** (one sort rule applied to
  four columns; descending is right for "filed on", inverted for "next hearing"), and
  **dates already heard were labelled "Next hearing"**. Fixes:
  - Each tab now owns its **order** (`TAB_SORTS`) and its **columns** (`TAB_LAYOUT`).
    Defaults are deadline-first / longest-waiting / cure-date-first / next-hearing-first;
    the label "Newest first" is gone and a test asserts it cannot return. Rows carry two
    keys — `urgencyAt` and `recencyAt` — so "most pressing" and "most recent" stop being
    the same question. A past listing or an unlisted case sorts to the end, never above
    the date being prepared for.
  - The hearing cell is tense-aware: a passed date reads "Last listed — no new date yet".
  - **Dead columns removed.** Case type is gone from every tab (one type exists) and court
    from drafts (a draft has not chosen one) — the same defect this redesign was started
    to fix, reproduced and now undone. Drafts also lose the reference column: the id shown
    there was a random string, and a draft has no number.
  - **View state moved into the URL** (`tab · q · court · sort · page · size`), the way
    `/cases` already does it, so back, refresh and a shared link restore the view. Only
    non-default values are written. Switching tabs keeps the search (a party name means
    the same everywhere) and drops a court filter that does not exist on the new tab —
    replacing the arbitrary rule that cleared one and kept the other.
  - **ARIA fixed:** the tablist's `aria-controls` pointed at a panel that did not exist,
    because the table was rendered outside `TabsContent`. Each tab now has a real panel and
    each table an accessible name.
  - Minors: the drafts empty state carries the primary action and a filtered empty state
    offers "Clear filters"; page size aligned to the cases list's 10 with a per-page
    control; whole rows are clickable via a stretched link (the discard button sits above
    it); "At the counter" no longer repeats on all 20 reference rows; only the tab strip
    pins, not the heading, returning ~90px of every scroll.
  138 tests pass (20 in `queue.test.ts`, including regression tests for both criticals);
  tsc, lint and all five gates clean.
  **Verified on the render.** Drafts order past-window → 3 days → 21 → 26 → no-clock-last;
  Registered opens on 02/09 "Framing of charge" with every already-heard date below it
  reading "Last listed — no new date yet"; defects order 31/08 → 01/09 → 02/09 and link
  into `/tasks/<id>/fix`; per-tab columns, sort labels, page size (`size=25`), the
  filtered-empty "Clear filters" action, the per-draft discard dialog, and the tablist's
  panel all behave. Round trip confirmed: a row click opens `/cases/c-1002` and Back
  returns to `/filings?tab=registered` with the tab still selected; the URL drops params
  that equal the default.
  One defect the render caught that the tests could not: rows with nothing pressing all
  share one sentinel sort key, so the whole tail sat in source order — a Hearing column
  that claimed an order and had none. Rows now carry an optional `tieAt`, set on registered
  rows to the date the column actually shows, so past listings read most-recent-first.

### Round 2 candidates (design pass)
Card title scale vs demo (16/600); select trigger truncation on half-width fields;
DatePicker display format vs dd/mm/yyyy; DocumentSlot progress + actions row; the
docked source panel width; type/spacing tightening per ui-craft; the sidebar rail vs the
DS `Sidebar` primitive.
