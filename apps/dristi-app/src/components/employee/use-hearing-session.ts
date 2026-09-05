"use client";

import * as React from "react";

import {
  readHearingSession,
  subscribeToHearingSession,
  type HearingSession,
} from "@/lib/employee/hearing-session";

/**
 * This sitting's marks, from wherever on the court side the screen is standing.
 *
 * `useSyncExternalStore` over a provider because the store has to outlive the
 * cause list, and the cause list is what unmounts when Start hearing opens a
 * matter. The server snapshot is the same empty session the module starts at, so
 * the first paint and hydration agree and there is nothing to suppress.
 */
export function useHearingSession(): HearingSession {
  return React.useSyncExternalStore(
    subscribeToHearingSession,
    readHearingSession,
    readHearingSession,
  );
}
