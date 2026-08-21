"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/filing/app-sidebar";
import {
  FilingChromeContext,
  SECTIONS_COOKIE,
  SECTIONS_COOKIE_MAX_AGE,
  type FilingChromeValue,
} from "@/components/filing/chrome";
import { FilingTopBar } from "@/components/filing/filing-top-bar";

/**
 * Which part of the filings area a path belongs to. The main nav is expanded on the
 * dashboard and collapsed inside a draft, so the two need distinguishing — and
 * `/filings/new` and `/filings/bulk` are dashboard screens, not drafts.
 */
function areaOf(pathname: string): "dashboard" | "flow" {
  const first = pathname.replace(/^\/filings\/?/, "").split("/")[0];
  return first && first !== "new" && first !== "bulk" ? "flow" : "dashboard";
}

/**
 * The filings app shell: the main navigation rail on the left, and a column holding the
 * top bar and the screen. One `SidebarProvider` for the whole area — the primitive binds
 * ⌘B and the `sidebar_state` cookie at the provider, so a second one would leave both
 * toggling two rails at once. Every other rail in the flow (sections, source) is composed
 * from primitives instead and keeps its state here.
 *
 * Nav width follows the route: labels on the dashboard, the icon rail inside a draft
 * where the sections rail already carries the flow's navigation. The state is keyed by
 * area, so a toggle holds for as long as the person stays in that area and is not
 * overridden on every render.
 */
export function FilingsAppShell({
  children,
  sectionsDefaultOpen = true,
}: {
  children: React.ReactNode;
  /** Read from the cookie on the server so the rail does not flip after hydration. */
  sectionsDefaultOpen?: boolean;
}) {
  const pathname = usePathname();
  const area = areaOf(pathname);

  const [nav, setNav] = React.useState<{ area: string; open: boolean }>({
    area,
    open: area === "dashboard",
  });
  const navOpen = nav.area === area ? nav.open : area === "dashboard";
  const setNavOpen = React.useCallback(
    (open: boolean) => setNav({ area, open }),
    [area]
  );
  const foldNav = React.useCallback(() => setNavOpen(false), [setNavOpen]);

  const [sectionsOpen, setSectionsOpenState] = React.useState(sectionsDefaultOpen);
  const [sectionsSheetOpen, setSectionsSheetOpen] = React.useState(false);
  const setSectionsOpen = React.useCallback((open: boolean) => {
    setSectionsOpenState(open);
    document.cookie = `${SECTIONS_COOKIE}=${open}; path=/; max-age=${SECTIONS_COOKIE_MAX_AGE}`;
  }, []);

  const [draftLabel, setDraftLabel] = React.useState<string | null>(null);

  const chrome = React.useMemo<FilingChromeValue>(
    () => ({
      sectionsOpen,
      setSectionsOpen,
      sectionsSheetOpen,
      setSectionsSheetOpen,
      foldNav,
      draftLabel,
      setDraftLabel,
    }),
    [sectionsOpen, setSectionsOpen, sectionsSheetOpen, foldNav, draftLabel]
  );

  return (
    <TooltipProvider>
      <FilingChromeContext.Provider value={chrome}>
        {/*
          * The collapsed rail is widened from the DS's 3rem so a 40px control sits in it
          * with an even 8px gutter — at 3rem a 40px row leaves 4px a side and the icons
          * read as crowded against the edge.
          */}
        <SidebarProvider
          open={navOpen}
          onOpenChange={setNavOpen}
          style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
        >
          <AppSidebar />
          {/* Not `SidebarInset`: that primitive is itself a `<main>`, and the screens
              below already own that landmark. */}
          <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-background">
            <FilingTopBar />
            <div className="flex flex-1">{children}</div>
          </div>
        </SidebarProvider>
      </FilingChromeContext.Provider>
    </TooltipProvider>
  );
}
