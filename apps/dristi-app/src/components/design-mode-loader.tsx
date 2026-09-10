"use client";

import { useEffect } from "react";

/**
 * Loads the design-mode review overlay (public/design-mode.js) when asked to —
 * and only then. Visiting any route with `?design=1` turns it on for the tab
 * (`?design=0`, the panel's Close button, or closing the tab turns it off);
 * with no flag, nothing loads and nothing runs.
 *
 * Dev-only by construction: NODE_ENV is inlined at build time, so production
 * bundles compile this to an effect that returns immediately. The overlay is
 * review tooling, not product UI — see docs/design-mode.md.
 */
export function DesignModeLoader() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    try {
      const flag = new URLSearchParams(window.location.search).get("design");
      if (flag === "0") sessionStorage.removeItem("designMode");
      else if (flag === "1") sessionStorage.setItem("designMode", "on");
      if (
        sessionStorage.getItem("designMode") === "on" &&
        !(window as unknown as { __dmActive?: boolean }).__dmActive
      ) {
        const s = document.createElement("script");
        s.src = "/design-mode.js?t=" + Date.now();
        document.body.appendChild(s);
      }
    } catch {
      // Storage unavailable (private mode oddities) — the overlay just stays off.
    }
  }, []);
  return null;
}
