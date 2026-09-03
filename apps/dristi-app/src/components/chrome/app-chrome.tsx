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

/** The rail header's brand row, sized so its rule meets the top bar's. */
export const RAIL_BRAND_ROW = `${BAR} flex flex-row items-center justify-between border-b ${RAIL_SEAM} px-3 py-0`;

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
 */
export const CHROME_PAGE_DIALOG =
  "md:left-68 md:right-4 md:mx-auto md:w-auto md:translate-x-0";

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
 * `collapsible="none"` is the plate-safe mode and the one `/employee` uses: the DS's
 * other modes fork to a `Sheet` on mobile and spread the caller's `className` and `style`
 * onto `Sheet.Root`, which renders no DOM node — so a plate silently vanishes at phone
 * width and the rail comes back in the app's default light ink. This frame therefore owns
 * its own sheet, and applies the plate to it directly. An area that needs the icon-rail
 * fold passes `collapsible="icon"` and gets the DS's mobile behaviour, plate bug and all,
 * until that is fixed upstream.
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
  collapsible?: "none" | "icon" | "offcanvas";
  navLabel?: string;
  /** Names the off-canvas rail for screen readers. Required when `collapsible="none"`. */
  sheetTitle?: string;
  sheetDescription?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const body = (
    <RailBody header={header} footer={footer} navLabel={navLabel}>
      {children}
    </RailBody>
  );
  const vars = plate.vars as React.CSSProperties;

  return (
    <>
      <Sidebar
        collapsible={collapsible}
        style={vars}
        /* The primitive declares `text-sidebar-foreground` one element above where these
           vars land, so the colour computes against the DS default rather than the plate.
           Re-declaring it here, beside the vars, is what makes the ink the plate's. */
        className={[
          "text-(--sidebar-foreground)",
          collapsible === "none"
            ? // A rail with no fold gets no fixed container from the DS, so it pins
              // itself: the page scrolls behind it and the nav scrolls inside it.
              `sticky top-0 hidden h-svh shrink-0 border-r ${RAIL_SEAM} md:flex`
            : "",
        ].join(" ")}
      >
        {body}
      </Sidebar>
      {collapsible === "none" ? (
        <ChromeRailSheet
          vars={vars}
          title={sheetTitle}
          description={sheetDescription}
        >
          {body}
        </ChromeRailSheet>
      ) : null}
    </>
  );
}

/** The same rail, off-canvas, for phone widths. Opened by the bar's trigger. */
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
