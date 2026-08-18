"use client";

import * as React from "react";

/** Height of the top bar — sticky rails hang below it and read the same number. */
export const TOP_BAR_HEIGHT = "3.5rem";

export type Crumb = { label: string; href?: string };

export type ChromeValue = {
  /** Breadcrumb after the area root, e.g. [task title, "Pay"]. */
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
  /** Whether the main nav shows its labels (true) or only its icon rail (false). */
  navOpen: boolean;
  /** Collapse the main nav to its icon rail — used when a side panel opens. */
  foldNav: () => void;
  /** Bring the labels back — used when the panel that folded it closes. */
  unfoldNav: () => void;
};

export const ChromeContext = React.createContext<ChromeValue | null>(null);

/**
 * State the app chrome shares with the screens: what the breadcrumb should say, and a
 * way to fold the nav rail when a screen needs the width.
 */
export function useChrome(): ChromeValue {
  const ctx = React.useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used inside <AppShell>");
  return ctx;
}

/**
 * Publishes a screen's crumbs to the top bar. Rendered inside the screen — the top bar
 * sits above the screen's data, so it cannot read it itself.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const { setCrumbs } = useChrome();
  const key = JSON.stringify(crumbs);
  React.useEffect(() => {
    setCrumbs(JSON.parse(key));
    return () => setCrumbs([]);
  }, [key, setCrumbs]);
  return null;
}
