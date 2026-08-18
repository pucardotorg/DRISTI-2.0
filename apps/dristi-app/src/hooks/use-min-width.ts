import { useCallback, useSyncExternalStore } from "react"

/**
 * Viewport width check, mirroring the DS `useIsMobile` pattern for breakpoints
 * that hook does not cover.
 *
 * `lg` (1024) is where the board can give up width to an in-flow case peek at
 * all; `xl` (1280) is where it can hold the peek and the pending-tasks rail at
 * the same time.
 */
export function useMinWidth(minWidth: number) {
  const query = `(min-width: ${minWidth}px)`

  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener("change", callback)
      return () => mediaQuery.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** True from `lg` up — the case peek can push instead of overlay. */
export function useIsDesktop() {
  return useMinWidth(1024)
}

/** True from `xl` up — the case peek and the tasks rail can coexist. */
export function useIsWide() {
  return useMinWidth(1280)
}
