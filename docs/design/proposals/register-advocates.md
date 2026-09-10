# Register advocates

Status: reviewed
Updated: 2026-09-10
Source: `/Users/abhiramrajilan/Desktop/account-creation-handover.md` (Account Creation
handover v3, 2026-09-07 — requirement IDs `REG-nn` cited throughout) ·
docs/product/README.md · docs/product/domain/actors.md ·
docs/product/domain/journey.md · docs/product/domain/practice-notes.md ·
docs/product/terminology.md · docs/product/open-questions.md ·
owner (Abhiram) in this conversation, 2026-09-10 — quoted inline
DS read: `vendor/pucar-design-system` — origin verified by reading
`.git/config` (`https://github.com/pucardotorg/dristi-design-system.git`),
pin `ds.lock.json` = `e0cadea6b9d4`. **`npm run check:ds-fresh` was not run** — this
session had no shell; the pin is verified as a fact in the repo, not as the checked-out
HEAD. Run it before building. Files opened: `AGENTS.md`, `RESPONSIVE.md`, foundations
`laws`, `colors` (destructive / status semantics), `src/components/ui/button.tsx`,
`src/components/docs/component-registry.tsx` (Button, Badge, Alert, Empty,
Document slot entries), and the `src/components/ui/` catalog (69 components).

Code read: `lib/employee/navigation.ts` (whole doc comment) ·
`lib/employee/register-cases.ts` · `lib/employee/approve-copy-application.ts` ·
`lib/employee/scrutiny/{queue,types,history}.ts` · `lib/employee/content.ts` ·
`components/employee/approve-copy-application-{screen,dialog}.tsx` ·
`components/employee/register-cases-table.tsx` ·
`components/employee/scrutiny/{flag-composer,history-sheet}.tsx` ·
`components/cases/document-preview.tsx` · `lib/cases/party-actions.ts` ·
`lib/filing/registry.ts` · `lib/sign-in/content.ts`

Passes run (`.claude/skills/propose-ui-brief/references/staff-ux-thinking.md`):
1 Walk the Tuesday · 2 Domain layout · 3 Control vocabulary · 4 Real weather ·
5 Exception vs. norm · 6 Pattern census · 7 Sibling sweep · 8 Render — **pass 8 could
not be run and is not claimed**: the screen does not exist yet. What must be checked on
the render is listed in §11.

---

## 1. Context

**Where this sits.** The employee side, as one new row in the **Actions** group of the
court-side rail — the group that today holds *Scrutinise submitted cases*, *Register
cases*, *Approve copy application*. One entry in `COURT_NAV_GROUPS[actions].items` in
`lib/employee/navigation.ts`, with an `href` and a `count` derived from the queue behind
it, per that file's own convention ("a count of the list behind it is what keeps the rail
and the screen from disagreeing"). The sidebar component is not touched.

**Confirmed with the owner (2026-09-10), in his words:**

- *"it's option 1, the approval queue"* — advocates **self-register** on the citizen
  side; their flow ends on a "Your registration is awaiting approval" screen carrying an
  application ID (`KL-ADV-000207-2026`). The FSO approves or rejects those pending
  requests. **This is not a form where the FSO keys in an advocate's details.**
- *"when an FSO rejects an application, he would need to leave a comment (similar to how
  the scrutiny comment happens) and the advocate will probably get an email about this?"*
  — the reason is required; the notification channel is his guess, not a fact (§12.1).
- *"make sure the UI and UX of this is not anchoring to the screenshots… i want you to
  build a better version of the same, based on the kind of information we are asking to
  the advocates in the registration flow."*

**Confirmed by the handover** (precedence: owner > PDF > prototype):

| Fact | Source |
|---|---|
| Advocates self-register; approval by the **scrutiny officer**; identity verified by **Bar ID + photo of Bar ID** | §2 |
| The flow collects: mobile (OTP-verified, primary key), Full Name, Bar Registration ID, Photo of Bar ID card, email (optional) | `REG-10`–`REG-15` |
| The Bar Registration ID is "looked up against the Bar Council database" | `REG-13` |
| The photo exists because "scrutiny officer uses it to verify" | `REG-14` |
| **Address and ID proof are not collected** | §5.1 `[OWNER]` |
| A Bar-Council-pre-created account whose holder **edits** anything at first login sends the updated request to the same approval queue | `REG-18` |
| A Bar ID already registered to a different mobile is blocked **at submission** — it never reaches this queue | `REG-19` |
| Lifecycle: Pending → Approved / Rejected; Rejected → user edits and resubmits → Pending | §5.3 |
| Rejections happen when details are incorrect, e.g. Bar ID doesn't match the photo | `REG-21` |
| The rejection reason is **free text** from the scrutiny officer | `REG-22` `[OWNER]` |
| Rejection–resubmission may repeat **without limit** | `REG-23` `[DERIVED]` |
| While Pending, the advocate has **no access** from their advocate account | `REG-24` `[OWNER]` |
| Notification copy is explicitly **not covered** | §12 |

**The cost of a slow queue is not a UX preference.** §138 runs on statutory clocks —
notice within 30 days of the dishonour memo, 15 days to pay, complaint within one month
of the cause of action (`docs/product/domain/journey.md` §1–3). `REG-24` says a pending
advocate has no access. So each day a request sits here is a day an advocate cannot file,
against a limitation window that does not pause. That is a property of the statute, not
an assumption about users.

**And there is a documented abuse pattern in exactly this role.**
`docs/product/domain/practice-notes.md`, note `ke-scrutiny-officer-2026-07` (Kerala,
secondhand, tagged *gatekeeping*, *delay*): "the officer often does not mark defects
properly, holding files so the advocate approaches him and may make a payment to move the
file forward." A queue in which waiting is invisible and rejection needs no stated reason
is the shape of that practice. It is provisional field observation, not a requirement —
but it is the reason two decisions below (D6, D8) are not negotiable-looking niceties.

**In scope (all of it, one feature):** the queue list, its search, sort and counts; the
per-request verification/decision overlay; the rejection-reason capture; the
approve confirmation; empty/loading/error states; the one nav registry entry; the demo
data shape.

**Out of scope:** the advocate-side registration flow and its "awaiting approval" screen;
the advocate-side rendering of a rejection; clerk registration (§12.3); notification
delivery (§12.1); what an approved registration writes into the advocate registry
(`lib/cases/party-actions.ts` `ADVOCATE_LOOKUP` is presumably the destination — not
confirmed, §12.8); the Actions group's other three rows.

**Who this is for.** Who logs into DRISTI is still unanswered
(`docs/product/open-questions.md`). The owner named the FSO, and the court-side demo
already carries a `scrutiny-officer` seat (`lib/employee/content.ts`), but that is a demo
identity. This is a staff worklist worked repeatedly, so the brief designs for the
**professional repeat user** — density, keyboard reach, throughput — and says so here so
the assumption stays reversible. Note also that `docs/product/domain/actors.md` **does**
carry a *Registry / Scrutiny officer* row, but defines it as "the court office that
receives and scrutinises the filed **complaint** for defects before it goes for
cognizance". Approving an advocate's registration is not in that definition. That gap is
§12.6 — it is not filled here.

---

## 2. Problem

Numbered so decisions and reviewers can cite them. Problems 1–8 are read off the six
reference screenshots of the legacy system (owner, 2026-09-10) — used, as instructed, as
a statement of *what* must exist, never *how*.

1. **The row does not exist.** The rail has no destination for advocate registrations at
   all, so the only place this work can happen today is the legacy system.
2. **The reference's detail page shows fields the new flow no longer collects.** ID Type
   (Aadhar), ID Proof (PDF), Permanent Address, Current Residential Address, Location
   (View on map) — none of these is in `REG-10`–`REG-15`; §5.1 `[OWNER]` explicitly drops
   address and ID proof. Roughly **six of the nine values on that page are dead**, and
   the three live ones (name, Bar Registration Number, Bar Council ID photo) are split
   across three cards with the two that must be compared furthest apart.
3. **It never stages the comparison the officer is there to make.** `REG-14` says the
   photo exists so the officer can verify the typed claim. The reference renders the
   typed claim as label/value pairs in two cards at the top and the photo as a small
   preview two scrolls down. The one act — *does the card show this name and this
   number* — is the one thing the layout does not put in front of the eye.
4. **The queue's columns carry almost no decision-relevant information.** Of five
   columns, **User Type is constant** (this screen is advocates), **Application Number is
   a string the officer does not hold** unless someone phoned them, and **Action ("Verify")
   is a link that says nothing and duplicates the row it sits in**. That leaves User Name
   and Due Since actually working. Nothing on the row says whether this is a first
   registration, an edit to a pre-created account (`REG-18`), or a resubmission after a
   rejection (`REG-23`) — three genuinely different jobs.
5. **The filters are sliced by the system, not by the officer.** *User Type* is a
   dropdown whose only value is Advocate; *Application Number* asks for the one identifier
   the officer is least likely to have. Neither completes a sentence an officer would say.
6. **Deciding one request costs six steps and ends in the wrong place.** Row → Verify →
   detail page → Accept Request → confirm dialog → success dialog → "Go To Home". At the
   reference's own count of **39 pending**, that is ~234 interactions and 39 trips back to
   a Home the officer did not want to be on.
7. **The decision pair is emphasised backwards.** Two equal-weight full-width buttons —
   teal *Accept Request* and red *Reject Request*. But rejection is **recoverable by
   design** (`REG-23`: the advocate edits and resubmits, without limit) while acceptance
   is the one the reference's own dialog calls irreversible ("Advocate details cannot be
   modified once registration request is accepted"). The loud destructive treatment is on
   the reversible act; the irreversible one gets brand teal and a one-line confirm.
8. **Nothing records or surfaces why a request is still here.** The reference shows a
   sortable "Due Since" and nothing else — no prior reason, no round count, no history.
   Against `REG-23` (unlimited rounds) an officer cannot tell round 1 from round 4, and
   against the Kerala practice note there is no visible clock on the officer's own delay.

---

## 3. Objective

Observable, and not provisional — the Job is confirmed (§4):

- An officer can tell, **from the row**, whether a request is routine or needs a look:
  how long it has waited, and whether it is a first registration, an edit, or a
  resubmission.
- The decision is taken **in one place where the typed claim and the photo of the Bar ID
  card are visible at the same time**, without leaving the queue.
- A rejection cannot leave the screen without a reason an advocate could act on.
- Deciding a request costs **two interactions** from the queue (open, decide) plus a
  confirm on the irreversible one — not six plus a navigation home.
- The officer's own delay is visible on every row and escalates with it.

---

## 4. Job

**Confirmed — owner, 2026-09-10.** *"it's option 1, the approval queue."*

In full, in the terms product uses: advocates self-register on the citizen side and their
account sits at **Pending Approval** with no access (`REG-24`). This screen is the
**scrutiny officer's queue of those pending registration requests**, and the act it exists
for is the one §2 of the handover names: verify the person's identity by **Bar ID + photo
of Bar ID**, then **approve or reject** (§5.3). A rejection carries a free-text reason
(`REG-22`); the advocate may edit and resubmit without limit (`REG-23`).

Two things this Job is **not**, both stated by the owner or the handover rather than
inferred: it is not a form for keying in an advocate's details (owner: "This is NOT a
form"), and it is not the complaint-scrutiny workbench — that is a different queue with a
different object (`/employee/scrutiny`), even where the same officer works both.

No slogan is coined for this screen. The sentence above is the handover's and the
owner's.

---

## 5. Decisions

Each carries the rule or doc behind it, or the word *judgment*; the alternative rejected;
and what it gives up.

### D1 — Push back first: collapse the reference's six-step path into a queue and one overlay

The request as screenshotted is a list that navigates to a page that opens a dialog that
opens another dialog that navigates home. Do not build that. The queue is a list screen;
deciding one request happens in an **overlay opened from the row**, and the officer never
leaves the list.

*Rule:* the court side already has exactly this shape, four times over —
`ApproveCopyApplicationDialog`, `ReschedulingRequestDialog`, `DelayCondonationDialog`,
`OtherApplicationDialog` — all "an application somebody filed, in front of staff who have
to say yes or no", all `ChromeDialogContent` at `sm:max-w-4xl md:h-[85dvh]` with the
document filling a `1fr` row.
*Rejected:* the reference's dedicated route. The only court-side screen that earns a route
is the scrutiny workbench (`/employee/scrutiny/<filingNo>`), and that is a 40-field
annotation task over a multi-page bundle — not a three-value comparison.
*Given up:* no deep-linkable URL per request (an officer cannot send a colleague a link
to application `KL-ADV-000207-2026`), and less width than a full page for the photo.
`DocumentPreview` already ships **Full view** and **Download** in its own sticky header,
which is the answer to the second; the first is a real loss, accepted.
*Fixes problems 1, 6.*

### D2 — The overlay is built as the verification act: claim ← → evidence, side by side

Two columns inside the overlay body, `md:grid-cols-2`, stacking to claim-then-evidence
below `md`:

- **Left — what they typed.** A `DescriptionList` in a `surface-sunken` well: Full name
  (`REG-12`), Bar registration ID (`REG-13`, `font-mono`/`tabular-nums`), Mobile number
  (`REG-10`, with a quiet "verified by OTP" note — it is the account's primary key,
  `REG-07`), Email if given (`REG-15`). Above it, the **Bar Council register line** (D5).
- **Right — the evidence.** The photo of the Bar ID card (`REG-14`) as a
  `DocumentPreview` with `height="fill"`, taking the rest of the overlay height.

The officer's eye runs claim → evidence → decide, and the two things `REG-21` says a
rejection turns on are never more than one saccade apart.

*Rule:* handover `REG-14` — the photo exists *so the officer can verify*; DS Laws,
"grouped content gets a border… `surface-sunken` for nested media wells inside a Card".
*Rejected:* the reference's two identity cards split on an unnameable axis (mobile+ID
proof in one, name+addresses in the other), and a flat `DescriptionList` of everything.
*Given up:* at narrow widths the photo is below the fold on first paint. Accepted — the
claim is what you read first anyway.
*Fixes problems 2, 3.*

### D3 — Only the fields the registration flow actually collects

Name, Bar registration ID, mobile, optional email, photo of the Bar ID card. Nothing
else. Address, ID type, Aadhaar ID proof, and Location/View-on-map are **deleted**, not
moved.

*Rule:* handover §5.1 `[OWNER]` — "Address and ID proof are **not collected** during
registration." A field the flow never captures cannot be shown, and a screen that shows
empty rows for them teaches the officer the data is missing rather than absent.
*Rejected:* keeping the rows as "—" for parity with the legacy screen.
*Given up:* an officer moving from the legacy system will notice things gone. That is the
point.
*Fixes problem 2.*

### D4 — Queue columns: application number (opener), name, Bar registration ID, request type, days waiting

Five columns. What each earns:

| Column | Why it survives |
|---|---|
| **Application number** | The one string shared with the advocate's own waiting screen (`KL-ADV-000207-2026`) — the only thing they can quote on the phone. It is the row's opener, matching `ApproveCopyApplicationTable`. |
| **Full name** (`REG-12`) | The emphasised cell (`font-medium`). What identifies a person. |
| **Bar registration ID** (`REG-13`) | The claim under verification, and the second thing an officer would search by. `tabular-nums`, `whitespace-nowrap`. |
| **Request type** | *Silent for a first registration.* Carries a `Badge` only for the two exceptions — an edited pre-created account (`REG-18`) and a resubmission (`REG-23`, with its round count). See D7. |
| **Days waiting** | Right-aligned, `tabular-nums`, escalating tone (D6). |

**Killed:** *User Type* (constant on this screen — problem 4; it returns the day clerks
join, §12.3, and not before). *Action / "Verify"* (a link that repeats its own row; the
application number is the opener on every other court-side table).

*Rule:* pattern census + `RegisterCasesTable`'s own doc comment — "there is no status
chip: a row in this queue is in exactly one state, waiting, so a column repeating that on
every row would carry no information." Same argument retires User Type.
*Rejected:* a Status column, and a Submitted-on date column beside Days waiting (two
renderings of one fact; `register-cases` already chose the day count).
*Given up:* the exact submission date is only in the overlay. Accepted.
*Fixes problems 4, 8.*

### D5 — The Bar Council lookup is stated as a machine reading, and it never pre-judges

`REG-13` says the Bar registration ID is looked up against the Bar Council database. Show
what came back, as a line above the claim block and as a mark on the row when — and only
when — it **disagrees**:

- **Agrees** (the norm): one muted line, `text-muted-foreground` —
  "Bar Council of Kerala register: Meera Suresh." No badge, no green. The default is
  silent.
- **Disagrees**: `warning`, with words — "The register has this number against a different
  name: Meera Sudhakaran." Never colour alone.
- **Unavailable**: plain statement — "The Bar Council register could not be reached." The
  decision is **not blocked**: the officer has the card photo, which is the evidence
  `REG-14` actually names.

**`warning`, not `destructive`.** A mismatch is a finding that needs a human, not a
verdict. The repo has already learned this in this exact role — `flag-composer.tsx`:
"pre-filling a defect assertion on the officer's behalf is the machine making the claim."
Destructive tint would have the machine reject before the officer has looked at the card.

*Rule:* DS AGENTS §6 (three treatments per status, opaque `-muted` never alpha); DS Laws
"status never conveyed by color alone"; `REG-13`.
*Existing shape to reuse:* `lib/filing/registry.ts` already models a Bar-council register
returning `{ barNumber, name, bar }` and already says in its header that "the register
will never be complete" — which is why *unavailable* and *not found* are ordinary states
here, not errors.
*Rejected:* auto-approving on a clean lookup (it would make `REG-14`'s photo pointless);
a green "verified" badge on the ~90% that agree (marks the norm — pass 5).
*Given up:* speed. An agreeing lookup still costs the officer a glance at the photo.
*Fixes problem 3.*

### D6 — Days waiting escalates; it does not paint every row

Adopt the scrutiny queue's `waitTone` shape (`lib/employee/scrutiny/queue.ts`): plain at
rest, `warning-ink` past a threshold, `destructive-ink` past a longer one. Thresholds for
*this* queue are product's to set (§12.5); until they do, mirror scrutiny's registry
clock — 7 and 14 days — and say in the build report that the numbers are borrowed.

*Rule:* pass 5 (mark the exception, mute the norm) + `REG-24` — a pending advocate has no
access, so a long wait is a live harm, and `docs/product/domain/journey.md` §1–3 is why
the harm compounds.
*Sibling divergence, named:* `RegisterCasesTable` paints **every** days cell
`text-warning-ink`, and its own brief accepted that as a risk ("a coloured mark per
visible row… above the craft budget"). Two court-side queues would then render the same
fact two ways — a pass-7 defect. **Recommendation: register-cases should move to the
escalating treatment**, as a separate change. Not done here; flagged in §11.
*Rejected:* a flat paint (restates the norm); a Due-since sort control (the default sort
already is longest-wait-first).
*Given up:* the reference's sortable column. See D11.
*Fixes problems 4, 8.*

### D7 — Three kinds of request; two of them are exceptions and get ink

- **First registration** — the norm. **No badge.**
- **Edited pre-created account** (`REG-18`) — the account was auto-created from the Bar
  Council database and the advocate changed something at first login. Row: `Badge`
  "Edited". Overlay: the changed values shown **was → now** in the claim block, so the
  officer verifies the change rather than re-verifying the whole record.
- **Resubmission** (`REG-23`) — row: `Badge` with the round ("Resubmitted · round 3").
  Overlay: the **most recent rejection reason in full**, directly above the claim block —
  the officer's actual question is "did they fix what I said" — with earlier rounds as a
  compact `Timeline`, the pattern `HistorySheet` already uses for the same job.

*Rule:* `REG-18`, `REG-23`; pass 5.
*Rejected:* a request-type column with a value on every row (would mark the norm); putting the
history behind a `Sheet` (the scrutiny workbench needs a sheet because its index rail
occupies the space; here the overlay has room, and a detour for two lines is a detour too
many).
*Given up:* an unlimited history could in principle grow long. Mitigated by showing the
latest reason in full and older rounds as one-line events.
*Fixes problems 4, 8.*

### D8 — Reject requires a reason, and it takes the DS's *soft* destructive treatment

Reject opens the reason field inside the same overlay — `Field` + a **visible**
`FieldLabel`, a `Textarea`, and the save gate stated in words when it is holding the
button, exactly as `FlagComposer` does. The label is written for the person who will
read it, not for the officer: **"Why are you rejecting this? The advocate will read
this."** Placeholder models a usable sentence: *e.g. "The name on the Bar ID card is
different from the name you typed. Please check and submit again."*

Button treatment: **`variant="destructive"` — the soft, muted at-rest treatment** — not
`destructive-solid`, and not a full-width red block.

*Rule:* DS component registry, Button: "destructive is the soft/at-rest treatment;
destructive-solid **only for a confirmed irreversible action**", and "pair
destructive-solid with confirmation (Alert Dialog) for irreversible work; keep destructive
soft at rest." A rejection here is **reversible by design** — `REG-23`, the advocate edits
and resubmits without limit — so it does not qualify for the solid.
*Why free text and not reason chips:* `REG-22` `[OWNER]` says free text. The temptation to
add chips comes from a real, documented failure in this same role — `flag-composer.tsx`:
"officers leave one-word remarks and advocates travel to court to decode them" — but the
answer inherited here is the **gate and the modelled sentence**, not a new taxonomy. Chips
belong in a later pass if rejection reasons prove to be the same three sentences; that is
a data question, not a design one. See §6.
*Rejected:* a second confirm dialog on top of a typed reason (double gate — the reason
*is* the friction); an unlabelled placeholder-only box (DS Laws accessibility floor:
"Placeholder-only fields" is a listed defect).
*Given up:* an officer in a hurry cannot reject in one click. Intended.
*Fixes problems 7, 8.*

### D9 — Approve is the guarded act: one `AlertDialog`, and no bulk path

Approve is the **overlay's** single teal action. It opens one `AlertDialog`
(`ChromeAlertDialogContent`, the court-side wrapper) stating what approval does: the
advocate gets access to their advocate account. Whether it is *irreversible* is **not
asserted** until product confirms (§12.2) — the reference's claim that "details cannot be
modified once accepted" is not in the handover.

**No bulk approve, no checkbox column.** This deliberately breaks from the nearest
sibling: `ApproveCopyApplicationScreen` clears its queue with checkboxes and a sticky bar.

*Why the break:* on that queue the evidence is a document the court itself composed and
the bench is allowing a copy. Here the evidence is a photograph, the whole reason it is
collected is that a human looks at it (`REG-14`), and the outcome is a **credential
grant** — the person can then act as an advocate on real §138 files. A bulk control would
let an officer clear 39 registrations without opening a single photo, which defeats the
only mechanism the product has for verifying identity. Consequence sizing: this is not
browsing.
*Rejected:* bulk approve for lookup-agreeing rows (same objection, one step removed); a
"next request" conveyor after each decision (a pattern no sibling has — see §6).
*Given up:* throughput. Clearing 39 costs 39 overlays. Accepted, and re-openable if
product tells us the real daily volume (§12.5).
*Fixes problem 7.*

**Teal budget, stated once so nobody has to re-derive it.** Two visual regions, one
primary each (DS Laws, Ration teal): on the **queue page** the teal is **Search** — the
only committing control there, exactly as `RegisterCasesScreen` and `ScheduleScreen` do,
because this screen has no page-level act (D9 killed the bulk bar). In the **overlay** the
teal is **Approve**. `ApproveCopyApplicationScreen` drops its Search to `outline` for the
opposite reason — it *has* a page-level Accept in a sticky bar — so the two screens follow
the same law to different answers, and that is not a drift.

### D10 — After a decision the officer stays put

The row leaves the list, an `aria-live` region announces what happened, focus returns to
the search box, and the header count drops. The rail count does **not** — it is a module constant read at load, and every court-side sibling behaves the same way (verified on `approve-copy-application`: header 30→29, rail stays 30). A shared queue store would fix all of them at once; that is not this feature's change and is logged in §11. No success dialog, no "Go
To Home".

*Rule:* `ApproveCopyApplicationScreen` already does exactly this — `removeFromQueue` +
`sr-only` `aria-live` + `onReturnFocus`. Reusing it is the sibling-consistent answer and
the accessible one (a decision that only shows in a list is silent to a screen reader).
*Rejected:* the reference's success dialog.
*Given up:* nothing. The dialog was pure cost.
*Fixes problem 6.*

### D11 — One search box; no second filter axis at this size

A single labelled search reaching **name, Bar registration ID and application number** —
the `filterCopyApplications` shape, whose module comment makes the same argument (the
reference's narrow "Case number" label "promised less than it does"). Visible label
"Search requests"; placeholder "name, Bar registration ID or application number".
Default sort: **longest wait first**, like `REGISTER_QUEUE` and `filterQueue`.

*Rule:* pass 3 — *User Type* is a system concept and a constant here; *Application
Number* alone is the identifier the officer is least likely to hold.
*Rejected:* a "needs a look / lookup agrees" segmented slice. It would be the officer's
own language, but at the reference's 39 rows a filter you must remember to apply is worse
than a mark you cannot miss — and D5/D7 already mark those rows in place. **This decision
flips if the queue is routinely in the hundreds** (a Gujarat-scale, bulk-institutional
deployment — `open-questions.md` contrasts exactly this); the row model already carries
everything such a filter would need.
*Given up:* an officer who wants only the mismatches must scan for them.
*Fixes problem 5.*

### D12 — The nav entry goes last in Actions, and its count is derived

```
{ id: "register-advocates", label: "Register advocates",
  href: "/employee/register-advocates", count: REGISTER_ADVOCATES_QUEUE_COUNT }
```

`REGISTER_ADVOCATES_QUEUE_COUNT` is the length of the pending list, exported from
`lib/employee/register-advocates.ts` — the convention `navigation.ts` documents and the
other built rows follow.

**Last in the group**, after Approve copy application. The group's internal order is a
complaint's own progression — the file says so: "Scrutiny comes first because it comes
first: a complaint an advocate files lands here, and only what survives scrutiny reaches
the register below it." An advocate's registration is not part of any case's life, so
inserting it at the head would break that reading for the three rows that share it.
*Judgment.*

### D13 — Built so clerks can be added later without restructuring

`REG-13a`/`REG-14a` put clerk registrations through the same scrutiny-officer approval,
and the owner named only advocates. So: the row model carries a `kind`, and the claim
block takes its labels from it ("Bar registration ID" / "Clerk registration number";
"Photo of Bar ID card" / "Photo of clerk ID card"). **No User Type column and no kind
filter ship now** — that is precisely the constant-column mistake of problem 4. The day
clerks join, the constant becomes a real distinction and the column earns its place then.
*Judgment, on `REG-13a`/`REG-14a`; open question §12.3.*

### D14 — Keep `KL-ADV-…` as the application number

Unlike case numbers — where `register-cases.md` rightly refused the screenshot's
`KL-00…` because the court side already speaks `CMP/…` — a registration application
number has **no** court-side equivalent, and it is the string the advocate is shown on
their own waiting screen. Changing it would break the one handshake between the two
sides. Its exact format is product's, not this screen's.
*Judgment.*

---

## 6. What I cut (and why)

- **Bulk approve** (D9) — the strongest thing a reasonable person would add, and the
  thing that would quietly void `REG-14`.
- **A "next request" conveyor** after each decision. Genuinely useful at 39/day; it is
  also an interaction pattern no court-side screen has, and I will not fork the grammar
  on an assumed volume. Revisit when §12.5 is answered.
- **Structured rejection-reason chips.** `REG-22` says free text; the gate plus a modelled
  sentence carries the lesson without minting a taxonomy nobody has validated.
- **A status column / a "Pending" badge per row.** The list is entirely pending;
  `ApproveCopyApplicationDialog` already established that this is said **once**, in the
  header — "instead of thirty times down a column".
- **A green "verified" badge on lookup-agreeing rows.** Marks the norm.
- **A "hold" / "query the advocate" third action.** Tempting — real officers want to ask a
  question without rejecting. The lifecycle has exactly two exits (§5.3) and inventing a
  third state would be inventing product. It goes to §12.7 instead.
- **Address, ID proof, ID type, map location** (D3).
- **The reference's success dialog and "Go To Home"** (D10).
- **A separate route for the detail view** (D1) — and with it, deep links.
- **Rejecting the whole legacy visual language** — the *page* structure (title, count,
  one lifted panel, table, pager) is kept deliberately, because that is the court side's
  own furniture across seven screens and a new one is not a place to be interesting.

---

## 7. Layout & hierarchy

**Queue screen** (`/employee/register-advocates`) — identical furniture to its six
siblings, so an officer moving from *Approve copy application* re-learns nothing:

- Page `p-6 md:p-8`, `gap-8` between header and panel.
- `h1` `text-title sm:text-title-l font-semibold` — "Register advocates". Supporting line
  in `text-body text-muted-foreground` carrying the count and the state once:
  *"39 advocates are waiting for approval."* (singular spelled out).
- **One** lifted panel: `rounded-xl border-hairline bg-card shadow-raised p-6`, `gap-6`,
  holding search → table → `ListFooter`. Nothing inside draws a second frame.
- Filter row: `gap-4`, wrapping, label above control, Search (teal — see D9's teal budget)
  and Clear (`ghost`) at the end of the row.
- Table: header well `bg-surface-sunken` with rounded end cells, `h-2` spacer row, rows
  `border-b border-hairline`, last row cleared — the `RegisterCasesTable` recipe verbatim.
  The row's opener is the application number cell; the name cell is the emphasised one.
- Below `md`: stacked items, each spelling out what the column header would have said
  ("18 days waiting"), per RESPONSIVE.md rule 5 and the sibling item lists.

**Decision overlay** — `ChromeDialogContent`, `flex max-h-[85dvh] flex-col gap-0
overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh]`, keyed on the request id:

- Header `p-6 pr-16`: title "Review registration request"; `Badge variant="warning"`
  "Pending approval" (the court-side convention for a pending application); description
  line = application number `tabular-nums` · advocate's name.
- `Separator`.
- Body `grid min-h-0 flex-1 grid-rows-[auto_auto] gap-6 overflow-y-auto p-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden` — rows declared explicitly on both sides of the breakpoint, and the claim column's `min-h-0` scoped to `md:`. (The first build used an unconditional `min-h-0` with implicit rows; below `md` the grid resolved the claim row to 0px and its content painted behind the photo. This is the `ApproveCopyApplicationDialog` recipe, not a new one.):
  - Exception blocks first, when present (prior rejection reason; was → now for an edit).
  - Left: Bar Council register line, then the claim `DescriptionList` in a
    `rounded-lg bg-surface-sunken p-4` well.
  - Right: `DocumentPreview height="fill"` — the Bar ID card photo.
  - Reject reason `Field` appears in the left column when Reject is armed.
- `DialogFooter`: `Button variant="destructive"` Reject · `Button` Approve (teal).
  Stacked on small screens (DS RESPONSIVE rule 4 — the DS footer already does this).

---

## 8. Components (DS name → region)

| Region | DS component |
|---|---|
| Page title / count line | `text-title` · `text-title-l` · `text-body` type roles |
| List panel | composed `section` with the court-side panel classes (not a nested `Card`) |
| Search | `Field` + `FieldLabel` + `InputGroup` / `InputGroupAddon` / `InputGroupInput` |
| Search / Clear | `Button` (`default` / `ghost`) |
| Queue table | `Table` · `TableHeader` · `TableRow` · `TableHead` · `TableCell` |
| Kind marks (Edited / Resubmitted · round n) | `Badge` (`secondary` / `warning`) |
| Empty + filtered-empty | `Empty` · `EmptyHeader` · `EmptyMedia` · `EmptyTitle` · `EmptyDescription` · `EmptyContent` |
| Pagination | app-level `ListFooter` (`Pagination` + `Select`) |
| Decision overlay | `Dialog` via app-level `ChromeDialogContent`, `DialogHeader/Title/Description/Footer`, `Separator` |
| Pending state | `Badge variant="warning"` (once, in the overlay header) |
| Claim block | `DescriptionList` + the app's `ReviewRow`, inside a `surface-sunken` well |
| Bar Council register line | `Alert` (`warning`) when it disagrees; plain `text-muted-foreground` when it agrees |
| Bar ID card photo | app-level `DocumentPreview` (`kind: "src"`, `height="fill"`) |
| Prior rounds | `Timeline` + `TimelineItem` |
| Rejection reason | `Field` + `FieldLabel` + `Textarea` + `FieldError` |
| Approve confirmation | `AlertDialog` via app-level `ChromeAlertDialogContent` |
| Photo loading | `Skeleton` |

Every DS name above exists in `vendor/pucar-design-system/src/components/ui/`. Nothing
new is proposed.

---

## 9. Spacing

Ladder only (`0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 4 · 6 · 8 · 12 · 16`), micro steps inside
controls only:

`p-6 md:p-8` page · `gap-8` page sections · `p-6` panel and overlay body · `gap-6` panel
stack and overlay grid · `gap-4` filter row, table→footer, claim rows · `p-4` sunken
wells and stacked phone rows · `gap-3`/`gap-2` inside the footer button row · `px-4 py-3`
table cells · `h-10` controls · `rounded-lg` controls and wells · `rounded-xl` containers.

---

## 10. States (empty / loading / error / partial / long-label)

| State | What the screen does |
|---|---|
| **Empty queue** | `Empty`, good-empty voice: "No registrations waiting" / "Every advocate who has applied to this court has been dealt with." Icon `UserCheck`. No action offered. |
| **Filtered empty** | "No requests match this search" / names what was searched + `Clear search` (`outline`). Two different facts, two different states — the sibling convention. |
| **Loading (list)** | No backend in this build, so none. When one arrives: the panel keeps its frame, rows become `Skeleton`. |
| **Loading (photo)** | The photo is a served file and will sometimes be slow: `Skeleton` at the well's full height. Never a collapsed well. |
| **Photo fails to load** | Say it plainly in the well — "This photo could not be opened" — and keep `Download` reachable. **Approve is not blocked** (the officer may hold the card another way) but the officer is not shown an empty box and left to infer. |
| **Photo loads but is illegible** | A human finding, not a system state. The reject placeholder models the sentence: *"The photo of your Bar ID card is too blurred to read. Please upload a clearer one."* (`REG-21`.) |
| **Bar Council lookup unavailable** | "The Bar Council register could not be reached." No mark on the row, no fake agreement, no block (D5). |
| **Bar Council: number not found** | "This number is not in the register." `warning`, not destructive — an incomplete register is normal (`lib/filing/registry.ts`). |
| **Long / Malayalam names** | `whitespace-normal` on the name column and the claim rows; no fixed widths; `min-w-0` on flex children. Malayalam is a real drafting language here (`lib/sign-in/content.ts`), and a Malayalam full name is longer in glyph height as well as width — the row must wrap, never truncate. |
| **Bar ID shapes across states** | `K/0873/2009`, `MAH/2201/2010`, `G/60/1992`, `KKKK/123453/2026` all occur (`lib/filing/registry.ts`, and the reference screenshot). Column is `tabular-nums whitespace-nowrap` and sized off the longest, not off Kerala's short form. |
| **Resubmitted five times** | Badge reads the round; latest reason in full; earlier rounds collapse to one-line `Timeline` events. The block does not grow without bound. |
| **Very old item** | Escalated tone (D6), and the default longest-wait-first sort keeps it on page 1. |
| **Partial data** | Email is optional (`REG-15`) — the row is **omitted**, not shown as "—" (the `CounselCell` precedent: an absence is not a missing value). |
| **200% zoom / ~375px** | Table → stacked items; overlay grid → single column; footer buttons stack. No horizontal page scroll (table scrolls inside its panel). |

**Demo data** should be ~39 rows (the reference's own count) so the table pages at
10/20/30, and must include: a Malayalam-script name, a long English name, non-Kerala bar
ID shapes, one `REG-18` edit, one resubmission at round 3, one lookup-disagrees row, one
lookup-unavailable row, one 60-day-old row, and one row whose photo fails to load.

---

## 11. Risks accepted

- **No bulk path.** Clearing a large queue is slow by construction (D9). Accepted; the
  alternative voids the only identity check the product has.
- **Deep links lost.** No URL per request (D1). Accepted; raise it again if officers turn
  out to hand requests to each other.
- **Days-waiting now has two treatments on the court side** — escalating here, flat
  `warning-ink` on `register-cases` (D6). A real pass-7 defect, accepted only until
  `register-cases` is reconciled. Whoever builds this should open that as a follow-up.
- **The mismatch marker depends on a lookup contract nobody has confirmed** (§12.4). If
  the lookup returns nothing usable, D5 degrades to "not checked" and the officer makes
  all three comparisons by eye. The layout survives; its main speed-up does not.
- **Visible, escalating waits are a nudge, not a control.** They do not stop an officer
  sitting on requests (the Kerala practice note). A real control — an SLA, reassignment,
  an audit trail of who held what for how long — is product's to specify, not this
  screen's to invent.
- **Thresholds for escalation are borrowed from the scrutiny queue** (7/14 days) with no
  product basis (§12.5).
- **The rail count is static after a decision** (D10). The header drops, the rail does
  not, because every `*_QUEUE_COUNT` is a module constant and there is no shared queue
  store. Every court-side sibling has the same gap (verified on `approve-copy-application`).
  Accepted here; fixing it is one store for all of them, not a per-screen patch.
- **Pass 8 ran on the render (2026-09-10, 375 and 1280, light).** (a) the pale specimen
  card inside the `surface-sunken` well still reads as a boundary — the card's own faint
  edge does the work; no hairline added; (b) the `warning` register line above the sunken
  claim well reads as two distinct boxes; (c) the two columns hold at 1280 and the left
  column scrolls independently; 200% zoom not measured; (d) Malayalam names render and
  wrap at 375 and 1280 through system fallback — the font-stack gap is the app shell's
  (`ACCESSIBILITY.md` §13), not this screen's; (e) the footer pair stacks Approve over
  Reject at 375. Two defects found and fixed: the email value clipped in the claim well,
  and below `md` the claim row collapsed to 0px behind the photo (§7 corrected).

---

## 12. Open questions for product

1. **Notification channel and content.** Handover §12 puts notification copy explicitly
   out of scope pending the application-wide notifications file; the owner guessed email;
   the legacy advocate screen promises SMS. *Leaning, not decided:* the rejection reason
   should be readable **in the app** on the advocate's own waiting screen, with the
   notification carrying only "there is an update" — a free-text reason sent by SMS is
   both a privacy surface and a truncation risk. Blocks nothing here; blocks the
   advocate-side half.
2. **Is an approved registration actually immutable?** The legacy confirm claims
   "Advocate details cannot be modified once registration request is accepted"; the
   handover does not say. Blocks the confirm copy — until answered, the dialog states
   what approval *grants* and does not claim what it *forecloses*.
3. **Does this queue also carry clerk registrations** (`REG-13a`/`REG-14a`)? The feature
   is named for advocates; the lifecycle is shared. Answer decides whether the User Type
   column returns (D13).
4. **What does the Bar Council lookup return, and when?** A name? An enrolment status? Is
   it live per request or a periodic sync (§Out-of-scope: "Bar Council database
   synchronisation mechanics")? A stale sync means the mismatch mark can be wrong, which
   changes how loudly it is allowed to speak.
5. **Real daily volume, and what "too long" means here.** Decides whether the conveyor
   and the mismatch filter earn their place (D9, D11) and replaces the borrowed 7/14-day
   thresholds (D6).
6. **Who owns this queue, and is it courtroom-scoped?** `docs/product/domain/actors.md`
   defines the *Registry / Scrutiny officer* as the office scrutinising **filed
   complaints** — advocate registration is not in that definition. Worse, `REG-35`–`REG-38`
   put every employee on a **courtroom** list and make them pick one after login, while a
   Bar registration is not courtroom-scoped at all. **So whose queue does a given request
   land in — every scrutiny officer in the state, one per district, the first to open
   it?** Two officers seeing the same request need claiming (the scrutiny queue already
   models `who` / `self` / unclaimed); nobody seeing it is worse. This is the one open
   question that could change the screen's structure.
7. **Is there a third outcome?** Officers may want to ask a question without rejecting.
   §5.3 has two exits. Deliberately not invented (§6).
8. **Where does an approved registration land, and what happens to a rejected one?**
   `lib/cases/party-actions.ts` `ADVOCATE_LOOKUP` is keyed by mobile and holds
   `{ name, barId }` — presumably the destination, unconfirmed. And does a decided
   request remain visible anywhere as a record? The count derivation assumes decided rows
   leave the queue.
9. **Handover Q-1 — help-desk contact details.** `REG-19` conflicts never reach this
   queue, but an officer rejecting for a suspected duplicate has nowhere to point the
   advocate.

Items 1–5 and 7–9 have UI consequences and stay in this brief. Item 6 additionally
belongs in `docs/product/open-questions.md` as a role/product-user question — filing it
there is product's call, not this brief's.

---

## 13. Gaps in the DS (if any)

**None filed.** Every region composes from components that already exist, and nothing
here needed a new primitive:

- The claim/evidence comparison is `DescriptionList` + `DocumentPreview` in a two-column
  grid — composition, not a component.
- A "match / mismatch" mark is `Badge`/`Alert` in the existing `warning` pair; inventing a
  fourth status treatment would break AGENTS §6.
- Enlarging the ID photo is `DocumentPreview`'s existing **Full view**.
- The near-white-card-on-`surface-sunken` edge case is already governed by the Laws
  ("`surface-sunken` for nested media wells inside a Card") and by AGENTS §6a's reasoning.

One thing to watch rather than file: the DS's destructive guidance is written for
*irreversible* work, and this screen needed the inverse case — a destructive-sounding act
that is reversible by design (D8). The existing rule already answered it correctly
("destructive is the soft/at-rest treatment"), so this is a note for the next reader, not
a request. If a second Dristi screen hits the same fork, it is worth a line in the DS
Button docs.

---

## 14. Decision log

| Date | Change | Who |
|---|---|---|
| 2026-09-10 | Job confirmed as the approval queue for self-registered advocates — "it's option 1, the approval queue"; not a data-entry form. | owner (Abhiram) |
| 2026-09-10 | Placement confirmed: a row in the court-side **Actions** group, one entry in `COURT_NAV_GROUPS`, count derived from the queue. | owner |
| 2026-09-10 | Rejection requires a free-text reason, "similar to how the scrutiny comment happens"; notification channel explicitly a guess, not a fact. | owner |
| 2026-09-10 | Screenshots are concept reference only — "build a better version… based on the kind of information we are asking to the advocates in the registration flow". | owner |
| 2026-09-10 | First pass written: overlay instead of the reference's detail route (D1); claim-vs-evidence layout (D2); dead fields deleted (D3); User Type and "Verify" columns killed (D4); lookup stated as `warning`, never destructive (D5); escalating wait (D6); no bulk approve (D9); no reason chips (§6). | ux-designer |
| 2026-09-10 | Teal budget written down explicitly (D9) after a first draft had Search as `outline` in one section and teal in another — this screen has no page-level act, so Search keeps the teal on the queue and Approve takes it in the overlay. | ux-designer |
| 2026-09-10 | Recorded that `docs/product/domain/actors.md` **does** carry a Registry / Scrutiny officer entry, but scoped to complaint scrutiny — so the gap is the scope of the role, not its absence (§1, §12.6). | ux-designer |
| 2026-09-10 | `npm run check:ds-fresh` not run (no shell in session); DS origin verified by reading `.git/config`, pin read from `ds.lock.json`. Must be run before build. | ux-designer |
| 2026-09-10 | Built and verified on the render at 375 and 1280 (light; the app pins light and ignores `prefers-color-scheme`). Two render defects fixed: email `dd` clipping (`break-all` on the value only), and the sub-`md` claim-row collapse — §7 corrected to the sibling grid recipe. | ui-designer / orchestrator |
| 2026-09-10 | D10 corrected: the rail count does not drop after a decision; the sibling has the identical limitation. Accepted as a codebase-wide gap (shared queue store), not a defect of this screen. | orchestrator |
| 2026-09-10 | ui-reviewer audit: no new criticals, gates green. Round two applied S1 (table↔list swap moved to `xl`, not the reviewer's `lg` — measured: at 1024 the table needs ~780px and has 656, so `lg` still clips the days column; `xl` is the first rung where the whole table fits), S2 (`Collapsible` replaces the hand-written disclosure), S3 (focus returns to Reject when the composer is cancelled), S5 (column header "Kind" → "Request type"), S6 (build caveat joined to the Approve dialog's `aria-describedby`), N3 (register name carries its own `lang`). S4 tested on the render: no focus race. S7, S8, N1, N2, N4 left as systemic / taste. | ui-reviewer / ui-designer |

