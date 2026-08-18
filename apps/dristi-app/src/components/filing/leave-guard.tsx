"use client";

import * as React from "react";

/**
 * A screen that loses work when you walk away from it registers an interceptor here, and
 * the filing's own navigation asks before following a link.
 *
 * Only Sign uses it today: leaving that step invalidates every signature collected on it,
 * which is not something to discover after the fact. The guard covers the routes inside
 * `FilingShell` — the sections rail and the screen's own footer. Chrome outside the shell
 * (the main nav, the breadcrumb) still navigates directly.
 *
 * Returning `true` from the interceptor means "handled" — it has put its own question to
 * the person, and the click must not navigate.
 */
type Interceptor = (href: string) => boolean;

const LeaveGuardContext = React.createContext<React.RefObject<Interceptor | null> | null>(
  null
);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<Interceptor | null>(null);
  return (
    <LeaveGuardContext.Provider value={ref}>{children}</LeaveGuardContext.Provider>
  );
}

/** Register this screen's question. Pass `null` to stop guarding. */
export function useLeaveGuard(interceptor: Interceptor | null) {
  const ref = React.useContext(LeaveGuardContext);
  React.useEffect(() => {
    if (!ref) return;
    ref.current = interceptor;
    return () => {
      ref.current = null;
    };
  }, [ref, interceptor]);
}

/** For navigation controls: `true` means the guard took it — do not navigate. */
export function useLeaveBlocked(): (href: string) => boolean {
  const ref = React.useContext(LeaveGuardContext);
  return React.useCallback((href: string) => ref?.current?.(href) ?? false, [ref]);
}
