"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { RailPlate } from "@/components/chrome/rail-plate";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * The app's chrome frame — the rail, the top bar, and the column between them.
 *
 * This module owns *presentation only*: where the rail sits, what ground it is painted
 * on, how a row and a section label are measured, how tall the bar is and what separates
 * it from the page. It knows nothing about tasks, profiles, locales, notifications,
 * breadcrumbs or courts. Every one of those arrives as a slot, and an area that has none
 * of them passes nothing.
 *
 * That constraint is the whole point. Two areas — the advocate's and the bench's — need
 * the same chrome and share none of their content, so anything content-shaped that leaks
 * in here would have to be conditioned on which area is rendering, and the frame would
 * stop being a frame. `/employee` consumes it today; the advocate's `AppShell` migrates
 * onto it in a follow-up, and the API below is sized for what that shell already does:
 * a controlled open state, a 4rem icon rail, a footer under the nav, and a bar whose
 * three regions it fills itself.
 */

/** Height of the top bar, and of the rail header that has to line up with it. */
const BAR = "h-14";

/**
 * The rail's two widths, and the page column's left edge at each of them.
 *
 * `RAIL_WIDTH` restates the DS default rather than inheriting it silently, because the
 * page offsets below are derived from it and a pair of numbers that must agree should be
 * readable together. The icon strip is 4rem, not the DS's 3rem: 3rem leaves a 40px row
 * 4px a side and reads as a margin the icons were wedged into.
 *
 * `PAGE_LEFT_*` are the rail plus a 1rem gutter, expressed as Tailwind steps because they
 * are consumed as utilities: 68 = 17rem = 16 + 1, and 20 = 5rem = 4 + 1. Change a width
 * here and its offset is the line underneath it.
 */
const RAIL_WIDTH = "16rem";
const RAIL_WIDTH_ICON = "4rem";
const PAGE_LEFT_OPEN = "md:left-68";
const PAGE_LEFT_FOLDED = "md:left-20";

/**
 * Does the rail in this frame fold?
 *
 * On the shell rather than on the rail, because the two things that need the answer sit
 * on opposite sides of it: the rail sets its own width from it, and the page column's
 * overlays set their left edge from it — and an overlay is portalled to `document.body`,
 * so it can reach neither the rail's `data-collapsible` nor the provider's width
 * variables through the DOM. React context crosses a portal boundary; a custom property
 * on an ancestor `div` does not.
 *
 * It also closes a gap that the prop's old home left open. `SidebarProvider` binds ⌘B
 * unconditionally, so `state` goes to `collapsed` on a rail that cannot fold as readily
 * as on one that can — and anything keyed on `state` alone then acts on a fold that never
 * happened. Every consumer below asks this first.
 */
const ChromeRailFoldContext = React.createContext(false);

/**
 * One nav row.
 *
 * `h-10` and a 20px glyph against the DS's 32px row and 16px mark: primary navigation
 * has to clear the 40×40 touch floor, and a 16px mark inside a 40px square reads lost
 * once the labels are gone. `size-10!` beats the primitive's own `!` through
 * tailwind-merge — same key, ours last.
 *
 * Hover and selection are different *kinds* of mark, not two strengths of one. The
 * primitive hovers and selects with the same fill, so hovering any row made it look
 * chosen. Here hover is a step up the plate's own ramp and selection inverts to the light
 * card — the strongest signal a rail has, and one no hover can imitate. The card then has
 * to re-assert itself over its own hover, or pointing at the current page demotes it.
 *
 * `pr-3` against `px-2`: a trailing count rides to the edge, and at 8px it sat on the
 * fill's curve. `relative` so a collapsed rail can hang a count off the glyph's corner.
 */
export const RAIL_ROW = [
  "relative h-10 gap-3 px-2 pr-3 text-body-compact transition-colors",
  "group-data-[collapsible=icon]:size-10!",
  // Centring the square is not enough — the glyph has to be centred *within* it: the
  // label leaves the layout on collapse, and the gap and padding go with it.
  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0!",
  // The DS clips the button so a label cannot spill mid-collapse. Once collapsed there is
  // no label left to spill, and the clip only cuts the corner off a count.
  "group-data-[collapsible=icon]:overflow-visible",
  "[&_svg]:size-5",
  "hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)",
  "data-[active=true]:bg-(--rail-card) data-[active=true]:text-(--rail-card-ink)",
  "data-[active=true]:shadow-(--rail-active-shadow)",
  "data-[active=true]:font-semibold",
  "data-[active=true]:[&_svg]:text-(--rail-card-icon)",
  "data-[active=true]:hover:bg-(--rail-card) data-[active=true]:hover:text-(--rail-card-ink)",
  // The focus ring has to change ground with the row, for the same reason the ink does.
  // The DS rail focuses on `--sidebar-ring`, which a dark plate sets to a near-white so
  // the ring reads against it — and the one row that inverts to the light card then has
  // a near-white ring on white, at 1.16:1: no visible focus indicator at all, on exactly
  // the row a keyboard is most likely to land on. On the card it takes the card's own
  // ink (17.4:1 against the fill it hugs).
  "data-[active=true]:ring-(--rail-card-ink)",
  // A row that goes nowhere yet stays legible. Dimming it to the primitive's 50% would
  // make a finished rail look broken; saying so in the markup is the honest way.
  "aria-disabled:pointer-events-auto aria-disabled:opacity-100",
].join(" ");

/**
 * A section label in the rail — plain, or the header of a disclosure.
 *
 * Same type register as `RAIL_ROW`: in the court rail the disclosures sit as peers of
 * the standalone links (icon + label + optional trailing mark), so caption + semibold
 * made "Hearings" read as a louder species than "Dashboards". `font-normal` beats the
 * primitive's `font-medium`; full `--sidebar-foreground` beats its 70% ink. The mark
 * stays at the DS group-label 16px — rows that share an icon column match that size
 * themselves rather than the other way around.
 */
export const RAIL_GROUP_LABEL = [
  "h-10 w-full gap-3 text-body-compact font-normal transition-colors",
  "text-(--sidebar-foreground)",
  "hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)",
].join(" ");

/** The rail's secondary ink, from whichever plate is mounted. */
export const RAIL_MUTED = "text-(--rail-muted)";

/** The rail's own hairline. Dark plates need a light seam; the plate decides which. */
export const RAIL_SEAM = "border-(--rail-seam)";

/**
 * A ghost icon control standing on the plate — the fold trigger, and whatever else an
 * area hangs in the rail's header or footer.
 *
 * The app's `Button` grounds itself on the page, and both of its interaction marks are
 * near-invisible on a dark plate: the ghost hover fill is `accent`, a near-white app
 * token, and the focus ring is `--ring`, which resolves to the brand teal and measures
 * 2.67:1 against charcoal. So the control is re-grounded on the plate's own ramp and
 * takes the plate's ring — the same `--sidebar-ring` every nav row already focuses with
 * (11.3:1 on charcoal), not a second, fainter answer to the same question.
 *
 * `size-10` rather than the DS trigger's own 36px square: folded, the rail's header holds
 * exactly one control and that control is the only way back out of the fold, so it clears
 * the 40×40 floor in both states instead of growing into it as the rail opens.
 */
export const RAIL_ICON_BUTTON = [
  // The corner is the rail's, not the app's. `Button` ties its radius to its size, so an
  // icon button re-sized to 40px keeps whichever corner its original size asked for; and
  // the DS's page-wide control radius is not the answer either, because `SidebarMenuButton`
  // deliberately runs one step tighter. Folded, these are the only squares in the column
  // that are not nav rows, and three radii stacked 56px apart in a 4rem strip is exactly
  // the kind of near-miss that reads as unfinished.
  //
  // The glyph rule is written in `Button`'s own idiom, `:not([class*='size-'])`, and not
  // the shorter `[&_svg]:size-5` the nav rows use, because the two are not equivalent
  // here. `SidebarMenuButton` declares the plain form, so tailwind-merge sees one key and
  // the last one wins. `Button` declares the guarded form, which is a *different* key —
  // both survive the merge, and the guarded selector then out-specifies the plain one
  // (0,2,1 against 0,1,1) and quietly holds every icon at 16px in a 40px square. Matching
  // the key is what makes the override an override. (Measured in the served stylesheet;
  // reading the class list is not enough to catch it.)
  "size-10 shrink-0 rounded-md [&_svg:not([class*='size-'])]:size-5",
  "text-(--rail-muted)",
  "hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)",
  "focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring",
].join(" ");

/**
 * The rail header's brand row, sized so its rule meets the top bar's.
 *
 * Folded, the row centres whatever is left in it. At 4rem there is room for one 40px
 * square between the seams, so an area that puts a mark and a control side by side here
 * has to drop one of them — which one is the area's call, not the frame's.
 */
export const RAIL_BRAND_ROW = `${BAR} flex flex-row items-center justify-between gap-2 border-b ${RAIL_SEAM} px-3 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`;

/**
 * Centre a portalled overlay over the page column instead of over the whole window.
 *
 * `DialogContent` is `fixed left-1/2 -translate-x-1/2`, so it centres on the viewport —
 * and the viewport here starts 16rem left of where the page does. Measured on the court
 * screens at 1699px: a `5xl` dialog sat 82px off the rail with 337px of air to its right.
 * That is mathematically centred and visibly leaning, because the reader's frame is the
 * page, not the window.
 *
 * So above `md` the box spans the page column instead: `left` at the rail plus a gutter,
 * `right` at the matching gutter, `w-auto` because a specified width makes the `right`
 * offset a no-op (an over-constrained box drops it), `translate-x-0` to hand centring
 * back to the offsets, and `mx-auto` to split whatever the dialog's own `max-w-*` leaves
 * over. The dialog keeps its own width cap; this only decides where the slack goes, so a
 * column narrower than the cap yields the gutters instead of overflowing the page.
 *
 * Below `md` the rail is off-canvas and the window *is* the page, so none of it applies.
 * The scrim is untouched — modality still covers the rail, only the sheet moves.
 *
 * **A hook, because the left edge moves.** This was a constant while the rail was always
 * 16rem; a folding rail makes 17rem wrong for half the states, and wrong in the direction
 * the docstring above exists to prevent — at 4rem the left bound sits 208px inside the
 * page column while the right gutter stays at 16px, and below the width cap the box is
 * pinned against that dead space outright.
 *
 * The fix is not to hoist the width into CSS. `DialogContent` portals to `document.body`,
 * so `--sidebar-width`, `--sidebar-width-icon` and the rail's `data-collapsible` are all
 * out of scope inside it, and the tempting repair is to mirror the current width onto
 * `:root` from an effect and read it back with `var()`. That works, and it buys a global
 * mutation, a first-paint gap where the property is unset, and a teardown to get wrong —
 * to solve a problem CSS does not have to solve. The class is *computed* by a component
 * that renders in-tree, where the width is already in scope, and only *applied* to a
 * portalled node. So the reading happens in React and the portal receives a finished
 * string.
 */
export function useChromePageDialog(): string {
  const folds = React.useContext(ChromeRailFoldContext);
  const { state } = useSidebar();
  const left = folds && state === "collapsed" ? PAGE_LEFT_FOLDED : PAGE_LEFT_OPEN;
  // `transition-[left]` because ⌘B is bound at the window and fires with a dialog open:
  // without it the box jumps 192px while the rail behind it takes 200ms to get there.
  return `${left} md:right-4 md:mx-auto md:w-auto md:translate-x-0 md:transition-[left] md:duration-200 md:ease-linear`;
}

/**
 * The label a rail row says out loud past its own text.
 *
 * Counts, external destinations and unbuilt rows are all things a sighted person reads
 * off a mark — a pill, an arrow, a tooltip. None of that survives being announced, so the
 * words go in the row and the marks stay decorative.
 */
export function railRowNote(parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(", ");
}

/**
 * Is the rail folded down to its icon strip?
 *
 * For anything that only needs to *look* different when folded, the CSS hook is enough:
 * the rail carries `group` and `data-collapsible`, so `group-data-[collapsible=icon]:…`
 * works on every descendant. This is for content that has to change *shape* — swap a
 * disclosure header for a single mark, stop rendering a list that has no labels to show —
 * which is a render decision and cannot be made in a class.
 *
 * `state` alone is the wrong question, twice over. It is set by ⌘B whether or not this
 * frame's rail folds at all, so a rail fixed at full width would report itself collapsed;
 * and it is provider-wide, so a rail folded on a wide screen is still `collapsed` after
 * the window narrows past `md` — where the rail is off-canvas, drawn by the sheet at its
 * full width with every label showing. Asking all three parts in one place is what stops
 * a phone from inheriting a decision made on a desktop.
 */
export function useRailCollapsed(): boolean {
  const folds = React.useContext(ChromeRailFoldContext);
  const { state, isMobile } = useSidebar();
  return folds && state === "collapsed" && !isMobile;
}

/**
 * The chrome frame: a rail on the left, and a column holding the bar and the screen.
 *
 * One `SidebarProvider` for the whole area — the primitive binds ⌘B and the
 * `sidebar_state` cookie at the provider, so a second one would leave both toggling two
 * rails at once. `open`/`onOpenChange` are passed straight through for areas that drive
 * the rail's width from the route; leave them off and the primitive keeps its own state.
 *
 * The icon rail is 4rem, not the DS's 3rem: 3rem leaves a 40px row 4px a side and reads
 * as a margin the icons were wedged into. 4rem gives each square 12px of air.
 */
export function ChromeShell({
  rail,
  topBar,
  children,
  open,
  onOpenChange,
}: {
  rail: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
    >
      {rail}
      {/* Not `SidebarInset`: that primitive is itself a `<main>`, and the screens below
          already own that landmark. `min-w-0` on this column is what lets a wide table
          scroll inside the page instead of stretching the shell past the viewport. */}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-background">
        {topBar}
        <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}

/** The rail's contents, written once and rendered in both the column and the sheet. */
function RailBody({
  header,
  footer,
  navLabel,
  children,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  navLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {header ? <SidebarHeader className="p-0">{header}</SidebarHeader> : null}
      <SidebarContent>
        {/* The primitives are all `div`s, so an area that wants one landmark over the
            whole rail asks for it here. An area that labels each group instead — as the
            advocate's does — passes no `navLabel` and brings its own. */}
        {navLabel ? <nav aria-label={navLabel}>{children}</nav> : children}
      </SidebarContent>
      {footer ? <SidebarFooter className="p-0">{footer}</SidebarFooter> : null}
    </>
  );
}

/**
 * The navigation rail, on its plate.
 *
 * **Both modes render through the DS's `collapsible="none"` branch.** That is the only
 * one of the three that keeps a plate. The other two fork to a `Sheet` on mobile and
 * spread the caller's props onto `Sheet.Root` — a Radix Root, which renders no DOM node —
 * while `className` is destructured out of those props and never applied at all. So below
 * `md` the plate's custom properties land on nothing and the seam, the ink and the ground
 * all revert: a charcoal rail comes back in the app's default light ink. This frame
 * therefore owns its own plated `ChromeRailSheet` and never lets the DS pick the mobile
 * branch, in either mode.
 *
 * Which leaves the desktop fold to build here rather than delegate. The `none` branch
 * spreads props onto its own `div` and merges `className` through `cn`, so the frame can
 * dress that div as the primitive dresses its icon-mode container: `group` plus
 * `data-collapsible` on the *same* element (a `group-*` variant needs a descendant, so
 * splitting them across two elements matches nothing), and a width the variant overrides.
 * `data-[collapsible=icon]:w-…` rather than `group-data-…` for the width itself, because
 * the rail is not its own descendant either — and it beats the primitive's base
 * `w-(--sidebar-width)` on both counts: tailwind-merge keeps both (different modifiers)
 * and the attribute selector adds the specificity that settles it.
 *
 * The pay-off is that every `group-data-[collapsible=icon]:` utility already written into
 * `RAIL_ROW`, `RAIL_BRAND_ROW` and the DS's own menu primitives — inert while nothing
 * declared the state — starts working, and the fold costs the rail's contents nothing but
 * the shape decisions only they can make.
 */
export function ChromeRail({
  plate,
  collapsible = "none",
  navLabel,
  sheetTitle,
  sheetDescription,
  header,
  footer,
  children,
}: {
  plate: RailPlate;
  /**
   * `"none"` — a fixed rail at the full width. `"icon"` — the same rail, foldable to the
   * icon strip by the provider's `open` state (and by ⌘B, which the provider binds).
   *
   * The DS's own `"offcanvas"` is deliberately not offered: it is the third of the three
   * modes that throws the plate away below `md`, and nothing here has wanted a rail that
   * leaves the desktop layout entirely.
   */
  collapsible?: "none" | "icon";
  navLabel?: string;
  /** Names the off-canvas rail for screen readers. */
  sheetTitle?: string;
  sheetDescription?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  const folds = collapsible === "icon";
  const body = (
    <RailBody header={header} footer={footer} navLabel={navLabel}>
      {children}
    </RailBody>
  );
  const vars = plate.vars as React.CSSProperties;

  return (
    <>
      <Sidebar
        collapsible="none"
        style={vars}
        /* The state the rail's own contents read out of the DOM. `data-collapsible` is
           empty rather than absent when the rail is open, matching the primitive — an
           empty value matches no `[data-collapsible=icon]` selector, so one attribute
           carries both "this rail folds" and "it is folded right now". */
        data-state={state}
        data-collapsible={folds && state === "collapsed" ? "icon" : ""}
        /* The primitive declares `text-sidebar-foreground` one element above where these
           vars land, so the colour computes against the DS default rather than the plate.
           Re-declaring it here, beside the vars, is what makes the ink the plate's. */
        className={[
          "text-(--sidebar-foreground)",
          // A rail with no fixed container from the DS pins itself: the page scrolls
          // behind it and the nav scrolls inside it.
          `group sticky top-0 hidden h-svh shrink-0 border-r ${RAIL_SEAM} md:flex`,
          folds
            ? "transition-[width] duration-200 ease-linear data-[collapsible=icon]:w-(--sidebar-width-icon)"
            : "",
        ].join(" ")}
      >
        {body}
      </Sidebar>
      <ChromeRailSheet
        vars={vars}
        title={sheetTitle}
        description={sheetDescription}
      >
        {body}
      </ChromeRailSheet>
    </>
  );
}

/**
 * The same rail, off-canvas, for phone widths. Opened by the bar's trigger.
 *
 * The fold does not reach in here, and does not have to be told not to: the sheet portals
 * to the body, so the rail's `group` element is not an ancestor of anything inside it and
 * every `group-data-[collapsible=icon]:` utility in the shared body simply does not match.
 * A rail folded on a desktop therefore opens at full width on a phone, which is the only
 * width that has room for it.
 */
function ChromeRailSheet({
  vars,
  title,
  description,
  children,
}: {
  vars: React.CSSProperties;
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        style={vars}
        /* The plate lands here rather than on an ancestor: the sheet portals to the body,
           so nothing set on the rail's own column reaches it. `[&>button]` is the DS's own
           idiom for the close control it appends after the children. */
        className={[
          "gap-0 bg-sidebar p-0 text-(--sidebar-foreground)",
          // The appended close control is an app-scoped ghost Button, so its hover fill
          // is a near-white app token that would flash on a dark plate. Re-ground it.
          "[&>button]:text-(--rail-muted)",
          "[&>button]:hover:bg-(--sidebar-accent) [&>button]:hover:text-(--sidebar-foreground)",
          // The DS appends it at `size-icon-sm` — 32px, with no `after:` hit area to make
          // up the difference. This sheet *is* the phone breakpoint, which is the one
          // ACCESSIBILITY.md §8 writes its 40×40 floor for, so the square goes to `h-10`
          // and the inset comes in a step so the bigger control does not crowd the corner.
          // A descendant utility cannot be merged away by `cn`, so it wins on specificity
          // instead: `.[&>button]:size-10>button` is (0,1,1) against the Button's own
          // `.size-8` at (0,1,0).
          "[&>button]:size-10 [&>button]:top-2 [&>button]:right-2",
        ].join(" ")}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title ?? "Navigation"}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The bar across the top of the screen.
 *
 * Chrome, not a panel: `bg-card` on the white page with a hairline seam, so it reads as a
 * fixed edge rather than a card that happens to sit at the top. `sticky` is positioned, so
 * an area can hang a second row under it at full width.
 *
 * Three regions and no opinion about what goes in them. The advocate fills all three; the
 * bench fills none on desktop and only the rail trigger below `md`.
 */
export function ChromeTopBar({
  leading,
  trailing,
  className,
  children,
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        `sticky top-0 z-30 flex ${BAR} shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6`,
        className,
      )}
    >
      {leading}
      {children}
      {trailing}
    </header>
  );
}
