/**
 * What the bench has dictated on each listing so far, for the length of this sitting.
 *
 * It lives in a module rather than in the composer's own state because the composer
 * now advances: Next item ends this listing, calls the next, and routes to that
 * matter's composer — which unmounts this one. A draft kept in `React.useState` would
 * be gone the moment the bench moved on, on the one screen in this area whose whole
 * point is the text being written into it.
 *
 * **This is the bargain `hearing-session.ts` already makes, not a new one.** A client
 * module instance outlives client-side navigation inside `/employee`, so the words
 * survive the trip between items. They do not survive a reload and are not meant to:
 * nothing here is filed, notified, signed, or written back to a case. Moving the draft
 * out of a component changed how long it lives on one device; it changed nothing about
 * what it claims.
 *
 * Read it through `components/employee/use-order-draft.ts`, never directly from a
 * render — the hook is what subscribes.
 */

import { EMPTY_ORDER_DRAFT, type OrderDraft } from "./order-draft";

/** Every listing that has been dictated on, keyed by hearing id. */
export type OrderDrafts = Readonly<Record<string, OrderDraft>>;

/* One frozen empty map, shared: `useSyncExternalStore` compares snapshots by identity,
   so an untouched sitting has to read as the same object every time or the composer
   would re-render on every tick of anything. */
const NO_DRAFTS: OrderDrafts = {};

let drafts: OrderDrafts = NO_DRAFTS;
const listeners = new Set<() => void>();

export function subscribeToOrderDrafts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Every draft in this sitting. A new object only when one of them has changed. */
export function readOrderDrafts(): OrderDrafts {
  return drafts;
}

/**
 * One listing's draft, or the one it opens on. Never undefined — a composer always
 * opens.
 *
 * `initial` is what a listing nobody has dictated on starts from. It is empty for most
 * of the board and a written order for a listing the bench has finished
 * (`order-demo.ts`), and it has to be the *same* value on the read path and the write
 * path: an edit that started from the empty draft while the screen was showing the
 * written one would blank the order the bench could see.
 */
export function readOrderDraft(
  hearingId: string,
  initial: OrderDraft = EMPTY_ORDER_DRAFT,
): OrderDraft {
  return drafts[hearingId] ?? initial;
}

/** Replace one listing's draft. The others are untouched. */
export function writeOrderDraft(hearingId: string, next: OrderDraft): void {
  if (drafts[hearingId] === next) return;
  drafts = { ...drafts, [hearingId]: next };
  for (const listener of listeners) listener();
}

/**
 * Apply a change to one listing's draft.
 *
 * Reads through the module rather than through a captured value so two edits in the
 * same tick — typing while a mark lands — cannot write over each other.
 */
export function updateOrderDraft(
  hearingId: string,
  update: (current: OrderDraft) => OrderDraft,
  initial: OrderDraft = EMPTY_ORDER_DRAFT,
): void {
  writeOrderDraft(hearingId, update(readOrderDraft(hearingId, initial)));
}
