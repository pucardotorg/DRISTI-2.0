/**
 * Which seat the court side is being worked from — the rail's settings control, as data.
 *
 * It lives in a module rather than in the rail's own state because the rail is not the
 * only thing that reads it, and because the answer has to survive moving between screens:
 * the court side navigates constantly — a queue, a listing, the order composer — and a
 * seat kept in a component would be back to the default on the next click.
 *
 * **It is a seat, not a sign-in.** There is no authentication on this branch
 * (`content.ts`), so this switches the role the one demo staff member is working in and
 * nothing more: it grants nothing, hides nothing, and is not a claim about who is
 * permitted to do what. Every queue, screen and signature is exactly the same in both
 * seats today; what each seat's work actually is comes from product, later.
 *
 * It does not survive a reload, the same bargain the sitting's own marks make
 * (`hearing-session.ts`). The default is `CURRENT_STAFF.role`, so the server's first
 * paint and the browser's first render agree and there is nothing to suppress.
 *
 * Read it through `components/employee/use-court-role.ts`, never directly from a
 * render — the hook is what subscribes.
 */

import { CURRENT_STAFF, type CourtRole } from "./content";

let seat: CourtRole = CURRENT_STAFF.role;
const listeners = new Set<() => void>();

export function subscribeToCourtRole(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The seat being worked in. A plain string, so identity comparison is free. */
export function readCourtRole(): CourtRole {
  return seat;
}

/** Take a seat. Naming the one already taken is not a change and notifies nobody. */
export function setCourtRole(next: CourtRole): void {
  if (seat === next) return;
  seat = next;
  for (const listener of listeners) listener();
}

/**
 * Whether this seat gets the bench's own three controls — Start hearing, End hearing,
 * and Pass over from the row overflow.
 *
 * **A view rule, not a permission.** There is no authentication on this branch and
 * nothing here is enforced: it decides what the cause list *offers*, on the plain ground
 * that a control nobody in that seat would use is clutter at best and a wrong claim at
 * worst. A build with real sign-in decides who may do what somewhere this file cannot
 * see, and this must not be mistaken for that decision.
 *
 * It does **not** mean the other seat is a spectator. The typist moves the same sitting;
 * it just moves it along one scripted line of work instead of from three controls — one
 * button to start, and the trip into the order is what finishes the matter
 * (`hearings-table.tsx`, `hearings-screen.tsx`). Both seats write the same marks to
 * `hearing-session.ts`, and neither writes a court record.
 */
export function seatHasBenchControls(role: CourtRole): boolean {
  return role !== "typist";
}
