"use client";

import * as React from "react";

import { causeTitle, type CourtHearing } from "@/lib/employee/hearings";
import { HEARING_PEEK_ID } from "@/lib/employee/hearing-peek";

type HearingPeekContextValue = {
  hearing: CourtHearing | null;
  today: string;
  open: (hearing: CourtHearing) => void;
  close: () => void;
};

const HearingPeekContext = React.createContext<HearingPeekContextValue | null>(
  null,
);

export { HEARING_PEEK_ID };

export function HearingPeekProvider({
  today,
  children,
}: {
  today: string;
  children: React.ReactNode;
}) {
  const [hearing, setHearing] = React.useState<CourtHearing | null>(null);
  const open = React.useCallback((next: CourtHearing) => {
    setHearing(next);
  }, []);
  const close = React.useCallback(() => setHearing(null), []);

  React.useEffect(() => {
    if (!hearing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setHearing(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hearing]);

  const value = React.useMemo(
    () => ({ hearing, today, open, close }),
    [hearing, today, open, close],
  );

  return (
    <HearingPeekContext.Provider value={value}>
      {children}
    </HearingPeekContext.Provider>
  );
}

export function useHearingPeek() {
  const context = React.useContext(HearingPeekContext);
  if (!context) {
    throw new Error("useHearingPeek must be used within HearingPeekProvider");
  }
  return context;
}

/**
 * Opens the case peek from the cause title, the way the advocate list opens
 * it from the case number. Does not start the hearing — Start hearing does
 * that, and also opens this same peek. Another row stays the switcher.
 */
export function HearingPeekTrigger({
  hearing,
}: {
  hearing: CourtHearing;
}) {
  const { open, hearing: openHearing } = useHearingPeek();
  const expanded = openHearing?.id === hearing.id;

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={expanded ? HEARING_PEEK_ID : undefined}
      onClick={() => open(hearing)}
      className="w-fit cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
    >
      <span className="sr-only">Preview </span>
      {causeTitle(hearing)}
    </button>
  );
}

