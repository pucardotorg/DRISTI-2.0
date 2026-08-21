"use client";

import * as React from "react";

/**
 * Viewport width check, mirroring the DS `useIsMobile` pattern for the breakpoints that
 * hook does not cover. `false` on the server and before mount.
 */
export function useMinWidth(minWidth: number): boolean {
  const query = `(min-width: ${minWidth}px)`;

  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * Width thresholds for the filing chrome. The flow can show four columns at once — main
 * nav, sections rail, form, source rail — so each surface has a width it is allowed to
 * take a column at, and below it becomes an overlay instead of squeezing the form.
 *
 * Budget (chrome at its widest): nav 16rem + sections 18rem + source 20rem = 54rem.
 * The form column needs ~40rem to keep its two-up field rows; 54 + 40 = 94rem, past
 * `2xl`. Hence: below `2xl` the nav gives up its labels rather than the form its width.
 */

/** From `lg`: the sections rail is a column. Below it, a sheet. */
export function useSectionsDock() {
  return useMinWidth(1024);
}

/** From `xl`: the source rail is a column beside the form. Below it, a sheet. */
export function useSourceDock() {
  return useMinWidth(1280);
}

/** From `2xl`: room for a labelled main nav *and* both rails at once. */
export function useRoomForLabelledNav() {
  return useMinWidth(1536);
}

/** True from `lg` up — the board can give up width to an in-flow case peek. */
export function useIsDesktop(): boolean {
  return useMinWidth(1024);
}

/** True from `xl` up — the case peek and the tasks rail can coexist. */
export function useIsWide(): boolean {
  return useMinWidth(1280);
}
