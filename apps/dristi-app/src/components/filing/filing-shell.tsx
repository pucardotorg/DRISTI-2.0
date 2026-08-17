"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { FilingSidebar, TOP_BAR_HEIGHT } from "@/components/filing/filing-sidebar";

/** Wider than the DS default 16rem — the section titles ("Demand notice & debt") need it. */
const RAIL_WIDTH = "18rem";

/**
 * Frame for the form sections, on the DS Sidebar: the Sections rail on the left, the
 * screen inside `SidebarInset`. Screens supply their own `FilingMain` + `FilingFooter`.
 *
 * The sticky `FilingTopBar` stays full-width above this: it is chrome for the whole
 * filings area (court identity, language, account) while the rail belongs to one draft,
 * so the brand keeps the page origin and does not move when the rail collapses. The DS
 * rail is `fixed inset-y-0 h-svh`, so it is offset below the bar here — the primitive
 * has no prop for that (see the build report).
 */
export function FilingShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": RAIL_WIDTH,
          // Replaces the provider's own `min-h-svh`, which would add the header's
          // height to the page and leave every screen scrolling by 3.5rem.
          minHeight: 0,
        } as React.CSSProperties
      }
    >
      <FilingSidebar />

      <SidebarInset
        className="min-w-0"
        style={{ minHeight: `calc(100svh - ${TOP_BAR_HEIGHT})` }}
      >
        <SectionsTrigger />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Opens the rail below `md`, where the DS renders it as a sheet. Above `md` the rail is
 * always on screen — collapsed to the icon strip at worst — and toggles from its own
 * header, so this is the only trigger that has to exist in the content column.
 */
function SectionsTrigger() {
  const { toggleSidebar, openMobile } = useSidebar();

  return (
    <div className="px-4 pt-4 sm:px-6 md:hidden">
      <Button
        type="button"
        variant="outline"
        aria-expanded={openMobile}
        onClick={toggleSidebar}
      >
        <PanelLeftIcon data-icon="inline-start" aria-hidden />
        Sections
      </Button>
    </div>
  );
}

/**
 * The scrolling column of a filing screen. `sourceOpen` reserves room on wide screens
 * for the fixed source-document panel so the form is pushed rather than covered.
 *
 * A `div`, not a `main`: inside `FilingShell` the landmark is `SidebarInset`, and the
 * two screens outside it (upload, sign) carry their own.
 */
export function FilingMain({
  children,
  width = "default",
  sourceOpen = false,
  className,
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
  sourceOpen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-12",
        sourceOpen && "xl:mr-(--source-panel-w)",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-6",
          width === "default" && "max-w-4xl",
          width === "wide" && "max-w-5xl",
          width === "narrow" && "mx-auto max-w-2xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}
