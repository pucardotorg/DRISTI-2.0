"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ChromeContext, type ChromeValue, type Crumb } from "@/components/shell/chrome";
import { TopBar } from "@/components/shell/top-bar";

/**
 * Which part of the tasks area a path belongs to. The main nav is expanded on the list
 * and collapsed inside an act flow (pay, sign, file, fix), where the page needs the
 * width for a document and its actions.
 */
function areaOf(pathname: string): "list" | "flow" {
  const rest = pathname.replace(/^\/tasks\/?/, "");
  return rest ? "flow" : "list";
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
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const area = areaOf(pathname);

  const [nav, setNav] = React.useState<{ area: string; open: boolean }>({
    area,
    open: area === "list",
  });
  const navOpen = nav.area === area ? nav.open : area === "list";
  const setNavOpen = React.useCallback((open: boolean) => setNav({ area, open }), [area]);
  const foldNav = React.useCallback(() => setNavOpen(false), [setNavOpen]);
  const unfoldNav = React.useCallback(() => setNavOpen(true), [setNavOpen]);

  const [crumbs, setCrumbs] = React.useState<Crumb[]>([]);

  const chrome = React.useMemo<ChromeValue>(
    () => ({ crumbs, setCrumbs, navOpen, foldNav, unfoldNav }),
    [crumbs, navOpen, foldNav, unfoldNav]
  );

  return (
    <TooltipProvider>
      <ChromeContext.Provider value={chrome}>
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
            <TopBar />
            <div className="flex min-h-0 flex-1">{children}</div>
          </div>
        </SidebarProvider>
      </ChromeContext.Provider>
    </TooltipProvider>
  );
}
