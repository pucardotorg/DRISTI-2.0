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

### Statuses → views (`viewOf` — per viewer)

The tab a task lands in depends on who is looking. `viewOf(task, user, case)` puts a
task under **Needs action** when this viewer holds its acting verb (`verbFor` returns
Pay / Sign / File / Re-file / Continue / Mark done): a vakalatnama signatory on
open/ready items of kinds they can complete; anyone on the case on a draft or a hearing
task. The same open or ready item is **Waiting on others** from a junior's chair — it
waits on the signatory, and the row says so ("R. Manoj — signature") with a quiet View
verb. `awaiting-court` and `payment-confirming` wait for everyone. `done` · `expired` ·
`obsolete` → **Completed**; `archived` → **Archived** (restorable, `archived.from`
remembers the state it left).

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
open · draft · ready ──markDone──▶ done                         (anyone on the case; manual)
any non-closed state ──archive──▶ archived                      (anyone on the case)
archived ──unarchive──▶ the state it left                       (anyone on the case)
any open state ──redate · expire · obsolete──▶ …
```

`markDone` is the escape hatch for work completed outside DRISTI — at the counter, in
court, on paper. Any kind, any open state, anyone on the case; the screens confirm it
first ("this records that it was completed outside DRISTI") and `completion.how` says
`"manual"`.

When a signatory completes work someone else prepared, the history line reads
"Completed by X — prepared by Y · …". Every transition validates the from-state and the
actor's permission and throws a `TransitionError` (`illegal-state` · `forbidden` ·
`invalid`) otherwise.

## Permissions (`permissions.ts`) — file-share, not assignment

`canView` = on the case (`advocates`) · `canComplete` = on the vakalatnama (`signatories`).
Nobody is assigned anything; nobody approves anything. A non-signatory prepares (draft,
ready); a signatory completes (sign, pay, file, re-file) — directly, or after someone
else prepared it. `verbFor` derives the one verb a row shows at render time:
**Sign · Pay · File · Re-file** (signatory, open/ready) · **Continue** (anyone, on a
draft) · **Mark done** (hearing tasks — done in court) · **Unarchive** (archived tasks)
· **View** (waiting, closed, or an open/ready item whose completion belongs to a
vakalatnama holder the viewer is not — a quiet ghost, never a disabled verb). Pay, sign
and file act in a **modal** over the table (`components/tasks/act/act-modal.tsx`);
Re-file and filing-flow drafts first warn that the scrutiny / e-filing screens are not
built yet, then open the interim modal. The old `/tasks/[id]/pay|sign|file|fix` routes
redirect to `/tasks?task=<id>`.

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

## Vocabulary (`format.ts`, brief D13 v2.1 — fixed)

Titles are verb-first ("Pay the process fee for the summons", "Fix 2 defects and re-file
the complaint", "Be present for the plea", "Continue the draft complaint"). There is no
Status column — the verb carries the action. Due cells are one format everywhere: a
relative primary from today — *{n} days overdue* (ink) · *Due today* · *Due in {n}
days* · *Before hearing in {n} days* · *No date* — over the absolute date ("18 Aug",
muted, tabular). Settled tasks recall the absolute date only, no ink. Waiting rows carry
one *Waiting on* phrase: *{main advocate} — signature/payment/filing* · *The court —
scrutiny* · *Payment confirming*. Completed and Archived rows carry the outcome: *Done
{date}* · *Expired — {why}* · *No longer needed — {why}* · *Archived {date}*. A row's
second line is the status note ("Payment failed — try again", "Prepared by S. Prakash")
or *Draft · X* (X is "you" for the draft's holder). The page header is today's date —
the anchor every relative phrase counts from.
