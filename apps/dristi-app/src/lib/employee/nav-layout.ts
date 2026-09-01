"use client";

import * as React from "react";

/**
 * Which shape the court rail takes — a per-browser preference, not a product decision.
 *
 * The owner wants both layouts demonstrable side by side (2026-09-01): the combined
 * day — one primary "Today's schedule" row — and the earlier split rail with "Today's
 * hearings" and "Today's actions" as rows of their own. The switcher lives behind the
 * rail's Settings control, and everything that differs between the two worlds reads
 * this module: the rail's rows, where `/employee` lands, and where a drilled-in screen
 * points its way back.
 *
 * Stored in `localStorage` so the choice survives a reload on this browser, and
 * nowhere else — there is no backend, and a demo preference is not court data. Every
 * read is guarded: storage that is blocked or empty means the default, never a crash.
 */

export type CourtNavLayout = "schedule" | "split";

const KEY = "dristi.court-nav-layout";
const CHANGE_EVENT = "dristi:court-nav-layout";

function read(): CourtNavLayout {
  try {
    return window.localStorage.getItem(KEY) === "split" ? "split" : "schedule";
  } catch {
    return "schedule";
  }
}

/** The layout on the server and the first client paint — settled after hydration. */
const readServer = (): CourtNavLayout => "schedule";

function write(layout: CourtNavLayout) {
  try {
    window.localStorage.setItem(KEY, layout);
  } catch {
    // Blocked storage loses persistence, not the switch — listeners still fire.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  // `storage` covers another tab flipping the preference; the custom event covers
  // this one — the storage event deliberately does not fire in the tab that wrote.
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The rail layout and its setter, live across every component that reads it. */
export function useCourtNavLayout(): [
  CourtNavLayout,
  (layout: CourtNavLayout) => void,
] {
  const layout = React.useSyncExternalStore(subscribe, read, readServer);
  return [layout, write];
}
