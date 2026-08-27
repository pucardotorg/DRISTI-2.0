"use client";

import * as React from "react";

import { type CaseRecord } from "@/lib/cases/types";

/** Landmark id for the in-table peek — triggers point `aria-controls` here. */
export const CASE_PEEK_ID = "case-peek";

type CasePeekContextValue = {
  record: CaseRecord | null;
  now: number;
  /** The row that triggered the peek was already inside the long pending
   *  register — carried through so "Open case file" doesn't reintroduce a
   *  badge the register already established. */
  hideLongPendingFlag: boolean;
  open: (record: CaseRecord, options?: { hideLongPendingFlag?: boolean }) => void;
  close: () => void;
};

const CasePeekContext = React.createContext<CasePeekContextValue | null>(null);

export function CasePeekProvider({
  now,
  children,
}: {
  now: number;
  children: React.ReactNode;
}) {
  const [record, setRecord] = React.useState<CaseRecord | null>(null);
  const [hideLongPendingFlag, setHideLongPendingFlag] = React.useState(false);
  const open = React.useCallback(
    (next: CaseRecord, options?: { hideLongPendingFlag?: boolean }) => {
      setRecord(next);
      setHideLongPendingFlag(options?.hideLongPendingFlag ?? false);
    },
    []
  );
  const close = React.useCallback(() => setRecord(null), []);

  React.useEffect(() => {
    if (!record) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setRecord(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [record]);

  const value = React.useMemo(
    () => ({ record, now, hideLongPendingFlag, open, close }),
    [record, now, hideLongPendingFlag, open, close]
  );

  return (
    <CasePeekContext.Provider value={value}>{children}</CasePeekContext.Provider>
  );
}

export function useCasePeek() {
  const context = React.useContext(CasePeekContext);
  if (!context) {
    throw new Error("useCasePeek must be used within CasePeekProvider");
  }
  return context;
}
