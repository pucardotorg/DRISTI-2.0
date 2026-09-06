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
 * every read and defeat the identity comparison. `EMPTY_ORDER_DRAFT` is a module
 * constant, so an untouched listing reads as the same draft every time.
 */
export function useOrderDraft(
  hearingId: string,
): [OrderDraft, (update: (current: OrderDraft) => OrderDraft) => void] {
  const drafts = React.useSyncExternalStore(
    subscribeToOrderDrafts,
    readOrderDrafts,
    readOrderDrafts,
  );
  const setDraft = React.useCallback(
    (update: (current: OrderDraft) => OrderDraft) => {
      updateOrderDraft(hearingId, update);
    },
    [hearingId],
  );
  return [drafts[hearingId] ?? EMPTY_ORDER_DRAFT, setDraft];
}
