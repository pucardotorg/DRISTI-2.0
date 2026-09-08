"use client";

import * as React from "react";

import { EMPTY_ORDER_DRAFT, type OrderDraft } from "@/lib/employee/order-draft";
import {
  readOrderDrafts,
  subscribeToOrderDrafts,
  updateOrderDraft,
} from "@/lib/employee/order-drafts";

/**
 * One listing's order draft, from the store that outlives the composer.
 *
 * `useSyncExternalStore` over a provider for the same reason `useHearingSession` uses
 * one: the store has to survive the navigation that Next item performs, and the
 * composer is what unmounts on the way. The server snapshot is the same empty map the
 * module starts at, so first paint and hydration agree and there is nothing to
 * suppress.
 *
 * The whole map is the snapshot — selecting a key here would mint a new object on
 * every read and defeat the identity comparison.
 *
 * `initial` is what this listing opens on before anybody has dictated: the empty draft
 * for most of the board, and the written order for a listing the bench has finished
 * (`lib/employee/order-demo.ts`). It must be **stable across renders** — the caller
 * memoises it — because it is this hook's return value until the first edit, and a new
 * object every render would restart everything downstream that watches the draft.
 * It is handed to the store as well as read from it, so an edit is applied to the draft
 * the screen was actually showing.
 */
export function useOrderDraft(
  hearingId: string,
  initial: OrderDraft = EMPTY_ORDER_DRAFT,
): [OrderDraft, (update: (current: OrderDraft) => OrderDraft) => void] {
  const drafts = React.useSyncExternalStore(
    subscribeToOrderDrafts,
    readOrderDrafts,
    readOrderDrafts,
  );
  const setDraft = React.useCallback(
    (update: (current: OrderDraft) => OrderDraft) => {
      updateOrderDraft(hearingId, update, initial);
    },
    [hearingId, initial],
  );
  return [drafts[hearingId] ?? initial, setDraft];
}
