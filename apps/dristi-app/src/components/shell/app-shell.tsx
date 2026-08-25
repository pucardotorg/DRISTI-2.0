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
           * Two values the rail needs that have to be declared out here, in the light
           * scope, rather than on the rail itself.
           *
           * The width: the DS ships 3rem, which leaves a 40px row only 4px a side. 3.5rem
           * made the gutters even but still read tight — the strip was a slot the icons
           * were wedged into. 4rem gives each square 12px of air, which is what lets it
           * read as a rail rather than a margin.
           *
           * The ink: the rail is `dark`-scoped so it can reach the dark neutral ramp for
           * its charcoal, but that scope also inverts the teal ramp — `primary` becomes
           * #0eb39e there, which is 3:1 on the selected row's white fill and fails. This
           * resolves `primary` *here*, where it is still the light palette's #007e7e, and
           * the rail inherits the computed value across the scope boundary. It is the one
           * colour the rail cannot look up for itself.
           */}
          <SidebarProvider
            open={navOpen}
            onOpenChange={setNavOpen}
            style={
              {
                "--sidebar-width-icon": "4rem",
                "--rail-active-ink": "var(--primary)",
              } as React.CSSProperties
            }
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
      </ProfileProvider>
    </TooltipProvider>
  );
}
