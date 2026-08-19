# Pending tasks — how the front end works, and where the backend plugs in

The pending-tasks area (`/tasks/**`) is a working front end with **no server**: people,
cases, tasks and uploads live in the browser (IndexedDB), the current person is a
sandbox identity chosen from the account menu ("Viewing as"), and pay / sign / file are
sandboxes that behave like the real services will. Two tabs signed in as two people see
each other's changes at once (`BroadcastChannel`). The seams below are where engineering
swaps the local implementation for DRISTI's services. Screens do not change when that
happens.

## Model

`types.ts` is the contract. `Person`, `Case` (with `signatories` — on the vakalatnama,
first = the main advocate — and `advocates` — everyone on the case, signatories included)
and `Task`. A task is created by a court, registry or system event (`why`), says what to
do, may carry an amount and fee head, has a deadline with a kind and provenance
(`dueKind`, `deadlineNote`), may be anchored to a hearing (`hearingAt`, `isBlocking`),
and moves through the statuses below. `draft` / `prepared` record who last saved or
finished the preparation; `returned` carries scrutiny's defects; `completion` records how
it closed; `history` is the audit trail — every transition appends one line.

### Kinds → overview cards

| Kind | Card | What it is |
| --- | --- | --- |
| `sign` | To sign | A vakalatnama, affidavit, application or memo needing the advocate's e-sign |
| `pay` | To pay | A fee: process fee, court fee, copying fee |
| `file` | To file | A document or application due with the court |
| `returned` | Returned by scrutiny | A filing sent back for compliance — fix the defects and re-file |
| `hearing` | For a hearing | Court-initiated, anchored to a posting: the plea, a deposition, the sworn statement, arguments — done in court, marked done by hand |
| `draft` | Drafts | A filing or application someone started and left in draft |

`cardKindOf(task)` decides the card: anything in status `draft` counts under **Drafts**,
whatever its kind; a `draft`-kind task that has been marked ready or filed counts under
**To file** from then on.

### Statuses → views

`open` · `draft` · `ready` → **Open** · `awaiting-court` · `payment-confirming` →
**Waiting on others** · `done` · `expired` · `obsolete` → **Completed**. The same for
every viewer (`viewOf`).

## Seams (swap these; keep the signatures)

| Seam | Today | Replace with |
| --- | --- | --- |
| `data/repository.ts` → `data/indexeddb.ts` | IndexedDB (`dristi-tasks`: `people`, `cases`, `tasks`, `files`) + `sessionStorage` for the current person | HTTP repository against the tasks/case services; `getRepository()` in `data/index.ts` is the single choice point |
| `store.tsx` — `useTasks()` | Loads, seeds `sandbox.ts` on first run (re-seeds when `SEED_VERSION` moves), `dispatch(taskId, transition)` applies a pure transition and writes it | The same provider over the HTTP repository; the session replaces `setUser` |
| `sandbox.ts` | Five advocates, 19 cases, ~38 tasks, dates relative to today | Nothing — delete once the services answer |
| Pay / sign / court (`components/tasks/act/*`) | Sandbox outcome controls: gateway result, any 6-digit OTP, "Court: accept / return with defects" | Payment gateway, eSign provider, registry scrutiny events driving the same transitions |
| Cross-tab sync | `BroadcastChannel("dristi-tasks")` | Server push / polling |

## State machine (`transitions.ts`)

```
open · draft · ready ──saveDraft(note?, files?)──▶ draft        (anyone on the case)
open · draft ──markReady(note?, files?)──▶ ready                (anyone on the case)
open · draft ──fixDefect(n)──▶ draft                            (returned tasks; anyone on the case)
open · draft · ready ──sign──▶ done                             (signatory; event)
open · draft · ready ──recordPayment──▶ done · payment-confirming
                                       · failed: the same state, "Payment failed — try again"
open · draft · ready ──file──▶ awaiting-court                   (signatory)
open · draft · ready ──refile──▶ awaiting-court                 (signatory; every defect fixed)
payment-confirming ──confirmPayment──▶ done                     (event)
awaiting-court ──courtAccepted──▶ done                          (event)
awaiting-court ──courtReturned(defects)──▶ obsolete + a new open `returned` task
open ──markDone──▶ done                                         (hearing tasks; !systemObservable)
any open state ──redate · expire · obsolete──▶ …
```

When a signatory completes work someone else prepared, the history line reads
"Completed by X — prepared by Y · …". Every transition validates the from-state and the
actor's permission and throws a `TransitionError` (`illegal-state` · `forbidden` ·
`invalid`) otherwise.

## Permissions (`permissions.ts`) — file-share, not assignment

`canView` = on the case (`advocates`) · `canComplete` = on the vakalatnama (`signatories`).
Nobody is assigned anything; nobody approves anything. A non-signatory prepares (draft,
ready); a signatory completes (sign, pay, file, re-file) — directly, or after someone
else prepared it. `verbFor` derives the one verb a row shows at render time:
**Sign · Pay · File · Fix & re-file** (signatory, open/ready) · **Continue** (anyone, on
a draft) · **Open** (on the case but cannot complete) · **Mark done** (hearing tasks the
system cannot observe) · **View** (waiting, closed, not on the case).

## Urgency (`urgency.ts`)

One comparator: overdue first → tasks a listed hearing cannot proceed without ("blocking
and coming up", the owner's rule) → the next date that will hurt (that hearing while it is
still ahead, else the deadline) → earliest deadline → case → oldest created → id. Undated
tasks last. The rail on the home screen and the table here
sort with it.

## Selectors (`selectors.ts`)

`Filters` (view, card kind, due, court, advocate, search, sort) live in the URL.
`applyFilters` narrows and sorts; `cardCounts(world, view)` gives each card its count,
overdue count and next date for the view — before the other filters apply, so the cards
always describe the tab; `summaryOf` feeds the header; `courtsOf` the Court filter.

## Vocabulary (`format.ts`, brief D13 — fixed)

Titles are verb-first ("Pay the process fee for the summons", "Fix 2 defects and re-file
the complaint", "Be present for the plea", "Continue the draft complaint"). Status
phrases: *Needs signature · X* · *Needs payment · X* · *Needs filing · X* · *Draft · X* ·
*Returned · n defects* · *With the court* · *Payment confirming* · *Done {date}* ·
*Expired — {why}* · *No longer needed — {why}*; hearing tasks read *Anyone on the case*.
X is "you" for a signatory, else the main advocate. Due phrases: *{n} days overdue* ·
*Due today* · *Due {date}* · *Before hearing {date}* · *No date*.
