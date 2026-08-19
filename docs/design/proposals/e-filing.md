# E-filing (cheque bounce, S-138 NI Act)

Status: building
Updated: 2026-08-17
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

## 3. Objective

A user can walk the whole flow in the app on real routes, with one persisted draft, and
every screen composed only from DS primitives and named tokens — such that round 2 is a
design pass, not a rebuild. Test: `check:tokens` · `check:typography` · `check:ui-sync`
pass; the flow completes end to end in the browser; the draft survives a reload.

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

### Phone confirmation on the upload path (2026-08-19)

The upload path used to settle every signature on one person's word: "Submitting this
copy records all N signatures as collected." The document may well carry all of them —
nothing in the product could tell. Each complainant now confirms, on their own number,
that they signed the copy being uploaded.

- **OTP only, no verification link.** A link was proposed for parties who are not in the
  room and dropped by the owner: upload is the path we would rather people did not take,
  so the friction is left in place rather than engineered away. This removes the bulk
  send, the public `/verify/<token>` route, expiry/decline states, and the DPDP question
  of what a stranger who holds a link can open.
- **Why it is there, in the owner's words:** "this ensures the litigant has access to
  their case file" — the number is the litigant's own reach into their case, not a
  security checkbox. That sentence is on the screen, under the list.
- **The OTP authenticates a sentence, not a number.** An OTP proves control of a handset,
  never that a person signed paper. The row therefore reads "Entering it confirms that
  <name> has signed this complaint" — the declaration is the attestation; the code only
  authenticates it. Copy must not be tightened into "verify your number".
- **In the dialog, not a new step.** With links gone, the whole task completes in one
  sitting, so the existing "Upload signed complaint" dialog is the right container. It
  scrolls its body between a pinned title and the button the list gates.
- **The roster is not the signature list.** `signatories()` answers "whose signature does
  the sheet need", and a complainant represented by a PoA holder needs only the holder's —
  so that list shows the holder *instead of* the complainant. The confirmation roster
  answers a different question: who has to sign this copy *and* has a number of their own
  (`phoneConfirmers()`). Where a PoA holder has been appointed the holder signs and
  verifies in the complainant's place, so **the complainant is not listed at all** — the
  list carries nobody who is not being asked for something. An institution's row names the
  authorised representative, since an entity holds no phone. Advocates cannot appear at
  all: the Advocate section collects a name and a bar number and **no phone**.
- **Attach any time, submit gated.** The file can be chosen while confirmations are still
  coming in; `Submit as fully signed` stays dead until every row is confirmed.
- **A confirmation belongs to the number it was given for.** It is derived from the draft,
  not stored as a flag, so editing a party's mobile afterwards voids it and the row
  returns to pending. Same reasoning as `REF-03`'s transitive unlocking in the handover.
- **Going back voids everything.** Discarding signatures to edit the case also clears the
  confirmations: each party confirmed they had signed *that* sheet.
- **No number on file** is a gap in the party's own section, so the row links there rather
  than dead-ending — which is also what blocks submission until it is filled.

Not built, because the sandbox accepts any six digits and the states would be unreachable
dead code: wrong-code errors, attempt limits, lockout, and OTP expiry. All four are
requirements for the real service.

## 6. What I cut (and why)

- Bulk filing (client batches) — out of scope by the ask; stubbed at `/filings/bulk`.
- Rich text toolbars beyond bold/italic/lists/align — `execCommand` is enough for round 1.
- The demo's page-fade transitions and iframe navigation — not product behaviour.
- The demo's separate "Learn more" behaviour on case cards — no target defined.

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

Confirmation row (upload path): pending · OTP open (code entering) · resent · confirmed ·
no number on file · voided by an edit to the party's number. Wrong code, attempts left,
lockout and expiry belong to the real service, not the sandbox.

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
- **Should the signature rail list the principal as well as the PoA holder?** Still one
  row there — the holder, who signs *for* the principal. Adding the principal would mean
  the sheet needs their signature too, which is a legal question about PoA filings, not a
  display one. Unanswered, and now consistent with the roster's OTP rule below.
- **Do advocates confirm?** They sign the complaint, but the Advocate section collects no
  phone number, so they cannot today. Adding one is a change to that section.
- **Two parties on one handset** — common in family and small-business filings, and also
  the obvious way to defeat this. Built as allowed, each row confirmed separately. Block,
  allow, or allow-and-flag is a policy decision.
- **A party who cannot be reached** blocks the upload path entirely, by design: the next
  action is E-Sign. Confirm that is acceptable rather than a dead end needing an override.

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

### Round 2 candidates (design pass)
Card title scale vs demo (16/600); select trigger truncation on half-width fields;
DatePicker display format vs dd/mm/yyyy; DocumentSlot progress + actions row; the
docked source panel width; type/spacing tightening per ui-craft; the sidebar rail vs the
DS `Sidebar` primitive.

- 2026-08-19 — Owner: on the upload path, every litigant and PoA holder is listed with
  their number and confirms by OTP before the signed copy can be submitted. Verification
  links were proposed for parties who are not present and **rejected** — "we don't want to
  encourage uploading a signed copy, so it's okay to have it as a slightly higher friction
  instead of building a flow for a fallback". Built and verified in the browser.
- 2026-08-19 — Owner: the E-Sign path should offer to share a link with the other
  signatories — **parked**, owner is still thinking it through. Nothing built. Note that
  the E-Sign dialog already promises a link ("The other party will get a link to sign too")
  with no way to send, see or copy one; and with a single signatory its copy reads "The
  other 0 parties get a link". Both are for that round.
- 2026-08-19 — Owner: "all of the complainants and all of the POA holders should be
  listed". They were not: a complainant with a PoA holder produced one row showing the
  holder, and the complainant appeared nowhere. Split the two questions — `signatories()`
  (who signs) is unchanged; a new `phoneConfirmers()` (who confirms by phone) lists every
  complainant and every PoA holder. Roster copy follows: "Confirm each person", and the
  notice now says everyone listed below confirms, not "each complainant".
- 2026-08-19 — Owner: "if a PoA-holder is added, no need to get OTP for the complainant".
  The complainant stays on the list (they asked for everyone to be listed) but carries
  `confirmsThrough` — no code, no gate, a muted "PoA holder confirms" in the action slot.
  The counter and the submit gate gained a distinction between rows that are *listed* and
  rows that are *asked*.
- 2026-08-19 — Owner, copy and scope on the upload dialog: notice title becomes "Ensure
  all parties have signed" and its body drops the "records all N signatures as collected"
  framing for a plain statement of who must sign; the roster heading becomes "Verify phone
  numbers" with the note "This ensures the litigant has access to their case file"; and
  people who do not have to sign are not listed — so a complainant represented by a PoA
  holder disappears from the list rather than sitting in it un-actioned. Reverses the
  "listed but not asked" row from earlier the same day.
