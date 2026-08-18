# Pending tasks — how the front end works, and where the backend plugs in

The pending-tasks area (`/tasks/**`) is a working front end with **no server**: people,
cases, tasks and uploads live in the browser (IndexedDB), the current person is a
sandbox identity chosen from the account menu, and pay / sign / submit are sandboxes
that behave like the real services will. Two tabs signed in as two people see each
other's changes at once (`BroadcastChannel`). The seams below are where engineering
swaps the local implementation for DRISTI's services. Screens do not change when that
happens.

## Model

`types.ts` is the contract. `Person`, `Case` (with `signatories` — on the vakalatnama —
and `members` — case access without it) and `Task`. A task is created by a court or
system event (`why`), says what to do, may carry an amount and fee head, has a deadline
with a kind and provenance (`dueKind`, `deadlineNote`), may block a hearing, and moves
through the statuses below. `approval` records who prepared it and who decided;
`completion` records how it closed; `history` is the audit trail — every transition
appends one line.

## Seams (swap these; keep the signatures)

| Seam | Today | Replace with |
| --- | --- | --- |
| `data/repository.ts` → `data/indexeddb.ts` | IndexedDB (`dristi-tasks`: `people`, `cases`, `tasks`, `files`) + `sessionStorage` for the current person | HTTP repository against the tasks/case services; `getRepository()` in `data/index.ts` is the single choice point |
| `store.tsx` — `useTasks()` | Loads, seeds `sandbox.ts` on first run, `dispatch(taskId, transition)` applies a pure transition and writes it | The same provider over the HTTP repository; the session replaces `setUser` |
| `sandbox.ts` | Five people, 18 cases, ~35 tasks, dates relative to today | Nothing — delete once the services answer |
| Pay / sign / court (`components/tasks/act/*`) | Sandbox outcome controls: gateway result, any 6-digit OTP, "Court: accept / return with defects" | Payment gateway, eSign provider, registry scrutiny events driving the same transitions |
| Cross-tab sync | `BroadcastChannel("dristi-tasks")` | Server push / polling |

## State machine (`transitions.ts`)

```
open ──startPrepare──▶ draft (member) / in-progress (signatory) ──saveDraft──▶ (same)
open · in-progress · draft · sent-back ──sendForApproval──▶ awaiting-approval
awaiting-approval ──withdraw──▶ draft                       (preparer only)
awaiting-approval ──approveAndSign──▶ done (sign) · awaiting-court (submit, fix-defects)
                                    · in-progress (pay → recordPayment)
awaiting-approval ──sendBack(note)──▶ sent-back              (note required)
open · in-progress · draft · sent-back ──sign──▶ done         (event)
open · in-progress · draft · sent-back ──submit──▶ awaiting-court (fix-defects: all defects fixed)
open · in-progress · draft · sent-back ──recordPayment──▶ done · payment-confirming
                                       · failed: open, or the same draft, or back to
                                         awaiting-approval when the approver was paying
(a finaliser finishing someone else's draft "takes it over" — "Took over from …" in history)
payment-confirming ──confirmPayment──▶ done                  (event)
awaiting-court ──courtAccepted──▶ done                       (event)
awaiting-court ──courtReturned(defects)──▶ obsolete + a new open fix-defects task
open · in-progress ──markDone──▶ done                        (manual; !systemObservable only)
any open state ──reassign · redate · expire · obsolete──▶ …
```

Every transition validates the from-state and the actor's permission and throws a
`TransitionError` (`illegal-state` · `forbidden` · `invalid`) otherwise.

## Urgency (`urgency.ts`)

Band = the earlier of `dueAt` and `blocksHearingAt`, on the local calendar:
**Overdue** (past, ≤ 45 d) → **Due today** → **Due soon** (≤ 7 d, or any
`before-hearing` task) → **Later** → **No date** → **Long pending** (past > 45 d,
collapsed). Comparator: band → sent-back first → blocking first → next consequence date
(the hearing it blocks while that is still ahead, else the deadline — "blocking and
coming up" leads, however long ago it fell due) → earliest deadline → case → oldest
created → id. One comparator, used by every list.

## Permissions (`permissions.ts`)

`canView` = signatory or member · `canFinalise` = signatory · `canFinaliseTask` = signatory,
or anyone with access when the task does not `requiresSignatory` · `isTakeOver` = a finaliser
on a draft / sent-back task someone else prepared (verb "Take over") · `canPrepare` = view and not
finalise · `canApprove` = finalise ∧ awaiting-approval ∧ not the preparer (no
self-approval) · `canMarkDone` = not system-observable ∧ open/in-progress. `viewOf` puts
an awaiting-approval task in the approver's *To do* and everyone else's *Waiting* —
including the preparer's, even if they are also a signatory. `verbFor` derives the row's
verb from these at render time; nothing is cached per row.

## Selectors (`selectors.ts`)

A `Lens` (view, search, chips, sheet filters, sort, group) lives in the URL. `applyLens`
filters and sorts; `groupTasks` buckets by band / case / kind / person; `countsFor`
counts tabs and chips on the view's population before chips apply.
