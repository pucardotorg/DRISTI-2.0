"use client";

import * as React from "react";

import type { CourtRole } from "@/lib/employee/content";
import {
  readCourtRole,
  subscribeToCourtRole,
} from "@/lib/employee/court-role";

/**
 * The seat the court side is being worked from, from wherever on it the screen stands.
 *
 * `useSyncExternalStore` over a provider for the same reason `useHearingSession` uses
 * one: the store outlives every screen in `/employee`, and the rail is not the only
 * thing entitled to read it. The server snapshot is the same seat the module starts
 * at — `CURRENT_STAFF.role` — so first paint and hydration agree.
 */
export function useCourtRole(): CourtRole {
  return React.useSyncExternalStore(
    subscribeToCourtRole,
    readCourtRole,
    readCourtRole,
  );
}
