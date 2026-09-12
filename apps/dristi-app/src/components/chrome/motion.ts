/**
 * The app's motion vocabulary — four movements, and nothing else.
 *
 * Motion here is not decoration: it says **what happened to what the reader was looking
 * at**. A screen that replaces another with no movement leaves the reader checking the
 * title to find out whether anything changed; a screen that moves for its own sake makes
 * them wait. So each movement is tied to one event, and the same event moves the same way
 * everywhere in the product (`ui-craft` §8).
 *
 * - **Arriving forward** — a record replaced by the next one, or opened from a list.
 *   It rises: the gesture of a file being laid on the desk.
 * - **Arriving back** — returning to the list. It comes in from the left, the direction
 *   the list was left in.
 * - **An overlay opening** over the page. It rises too, shorter, because it is a layer
 *   over what stays put rather than a new place.
 * - **Resolving in place** — an act settling into its outcome inside that overlay. The
 *   thing that changed fades and lifts a few pixels; nothing around it moves.
 *
 * Every one of them is `motion-reduce`-guarded, and `fill-mode-both` holds the first
 * frame so nothing flashes at its final position before it starts.
 */

/** A page that has just arrived, by the direction the reader travelled. */
export const ARRIVAL = {
  next: "animate-in fade-in-0 slide-in-from-bottom-8 fill-mode-both duration-500 motion-reduce:animate-none",
  back: "animate-in fade-in-0 slide-in-from-left-8 fill-mode-both duration-300 motion-reduce:animate-none",
} as const;

export type Arrival = keyof typeof ARRIVAL;

/**
 * An overlay that rises into place, rather than snapping open at 95% scale.
 *
 * The DS `Dialog` opens with a 100ms zoom, which is right for a menu and abrupt for a
 * decision: the owner read it as exactly that on the registrations overlay (2026-09-12).
 * This keeps the DS's fade and its own tokens, cancels the zoom, and lets the panel come
 * up 16px over 300ms — the same rise a page makes when it arrives, at a layer's distance
 * rather than a page's. Closing is quicker and smaller, because leaving needs less
 * explaining than arriving.
 */
export const OVERLAY_RISE =
  /* Both durations are stated per state: a bare `duration-300` beside a
     `data-closed:duration-200` lost to it in the merge and opened in 200ms (measured). */
  "data-open:duration-300 data-open:zoom-in-100 data-open:slide-in-from-bottom-4 data-closed:duration-200 data-closed:zoom-out-100 data-closed:slide-out-to-bottom-2";

/** Something inside an overlay resolving into its outcome, in place. */
export const RESOLVE_IN_PLACE =
  "animate-in fade-in-0 slide-in-from-bottom-1 duration-500 motion-reduce:animate-none";
