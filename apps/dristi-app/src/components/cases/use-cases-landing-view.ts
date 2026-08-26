"use client";

import * as React from "react";

/** How `/cases` presents the current view — cases, or stage/outcome folders. */
export type CasesLandingView = "list" | "folders";

const STORAGE_KEY = "dristi.cases.landing";

const listeners = new Set<() => void>();

function read(): CasesLandingView {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "list" || stored === "folders") return stored;
  } catch {
    /* private mode / blocked storage */
  }
  return "list";
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/**
 * Landing presentation is a personal working style, not a shareable filter —
 * persist locally, keep it out of the URL.
 */
export function useCasesLandingView(): readonly [
  CasesLandingView,
  (next: CasesLandingView) => void,
] {
  const view = React.useSyncExternalStore(subscribe, read, (): CasesLandingView => "list");

  const setView = React.useCallback((next: CasesLandingView) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [view, setView] as const;
}
