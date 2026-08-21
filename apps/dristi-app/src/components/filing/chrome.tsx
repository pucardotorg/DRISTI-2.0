"use client";

import * as React from "react";

/** Height of the top bar — the rails hang below it and read the same number. */
export const TOP_BAR_HEIGHT = "3.5rem";

/** Cookie the sections rail's collapsed state is remembered in (read by the layout). */
export const SECTIONS_COOKIE = "filing_sections_state";
export const SECTIONS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type FilingChromeValue = {
  /** Expanded/collapsed state of the sections rail on a desktop viewport. */
  sectionsOpen: boolean;
  setSectionsOpen: (open: boolean) => void;
  /** The sections rail as a sheet, below `lg`. */
  sectionsSheetOpen: boolean;
  setSectionsSheetOpen: (open: boolean) => void;
  /** Collapse the main nav to its icon rail — used when a right-hand rail opens. */
  foldNav: () => void;
  /** Title of the draft currently loaded, for the breadcrumb. `null` outside a draft. */
  draftLabel: string | null;
  setDraftLabel: (label: string | null) => void;
};

export const FilingChromeContext = React.createContext<FilingChromeValue | null>(null);

/**
 * State the filing chrome shares across rails: which rails are open, and what the
 * breadcrumb should call the draft. It lives above the routes so a rail keeps its width
 * while the person walks from one step to the next.
 */
export function useFilingChrome(): FilingChromeValue {
  const ctx = React.useContext(FilingChromeContext);
  if (!ctx) throw new Error("useFilingChrome must be used inside <FilingsAppShell>");
  return ctx;
}

/**
 * Publishes the loaded draft's title to the top bar's breadcrumb. Rendered inside the
 * draft store — the top bar sits above it, so it cannot read the store itself.
 */
export function DraftBreadcrumbLabel({ label }: { label: string }) {
  const { setDraftLabel } = useFilingChrome();

  React.useEffect(() => {
    setDraftLabel(label);
    return () => setDraftLabel(null);
  }, [label, setDraftLabel]);

  return null;
}
