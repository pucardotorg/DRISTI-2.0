"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/shell/app-sidebar";
import {
  ChromeContext,
  type ChromeValue,
  type Crumb,
} from "@/components/shell/chrome";
import { ProfileProvider } from "@/components/shell/profile";
import { RailThemeProvider } from "@/components/shell/rail-theme";
import { TopBar } from "@/components/shell/top-bar";

/**
 * Which part of the app a path belongs to. The main nav is expanded on list/dashboard
 * screens and collapsed inside a flow (a task's pay/sign/fix, a filing draft), where
 * the page needs the width for a document and its actions.
 */
function areaOf(pathname: string): "list" | "flow" {
  if (pathname.startsWith("/tasks")) {
    return pathname.replace(/^\/tasks\/?/, "") ? "flow" : "list";
  }
  if (pathname.startsWith("/filings")) {
    // `/filings/new` and `/filings/bulk` are dashboard screens, not drafts.
    const first = pathname.replace(/^\/filings\/?/, "").split("/")[0];
    return first && first !== "new" && first !== "bulk" ? "flow" : "list";
  }
  return "list";
}

/**
 * The app shell: the main navigation rail on the left, and a column holding the top bar
 * and the screen. One `SidebarProvider` for the whole area — the primitive binds ⌘B and
 * the `sidebar_state` cookie at the provider, so a second one would leave both toggling
 * two rails at once.
 *
 * Nav width follows the route: labels on the list, the icon rail inside an act flow. The
 * state is keyed by area, so a toggle holds for as long as the person stays in that area
 * and is not overridden on every render.
 *
 * `topBar` lets an area bring its own bar (the filings flow has a draft breadcrumb and
 * a sections-rail toggle no other area needs) while everything else — rail, theme,
 * profile, fold behaviour — stays the one shell. This is the unification seam: an area
 * customises the bar, never the rail.
 */
export function AppShell({
  children,
  topBar,
}: {
  children: React.ReactNode;
  topBar?: React.ReactNode;
}) {
  const pathname = usePathname();
  const area = areaOf(pathname);

  const [nav, setNav] = React.useState<{ area: string; open: boolean }>({
    area,
    open: area === "list",
  });
  const navOpen = nav.area === area ? nav.open : area === "list";
  const setNavOpen = React.useCallback(
    (open: boolean) => setNav({ area, open }),
    [area],
  );
  const foldNav = React.useCallback(() => setNavOpen(false), [setNavOpen]);
  const unfoldNav = React.useCallback(() => setNavOpen(true), [setNavOpen]);

  const [crumbs, setCrumbs] = React.useState<Crumb[]>([]);

  const chrome = React.useMemo<ChromeValue>(
    () => ({ crumbs, setCrumbs, navOpen, foldNav, unfoldNav }),
    [crumbs, navOpen, foldNav, unfoldNav],
  );

  return (
    <TooltipProvider>
      <ProfileProvider>
        <ChromeContext.Provider value={chrome}>
          {/*
           * The width: the DS ships 3rem, which leaves a 40px row only 4px a side. 3.5rem
           * made the gutters even but still read tight — the strip was a slot the icons
           * were wedged into. 4rem gives each square 12px of air, which is what lets it
           * read as a rail rather than a margin.
           *
           * The rail's inks all come from the selected rail theme now — see
           * `rail-theme.tsx`, where each plate names its complete, contrast-checked
           * palette outright instead of borrowing a scope.
           */}
          <RailThemeProvider>
            <SidebarProvider
              open={navOpen}
              onOpenChange={setNavOpen}
              style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
            >
              <AppSidebar />
              {/* Not `SidebarInset`: that primitive is itself a `<main>`, and the screens
              below already own that landmark. */}
              <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-background">
                {topBar ?? <TopBar />}
                <div className="flex min-h-0 flex-1">{children}</div>
              </div>
            </SidebarProvider>
          </RailThemeProvider>
        </ChromeContext.Provider>
      </ProfileProvider>
    </TooltipProvider>
  );
}
