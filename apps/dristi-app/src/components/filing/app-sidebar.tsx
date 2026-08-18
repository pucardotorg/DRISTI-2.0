"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  FolderClosedIcon,
  HouseIcon,
  ListChecksIcon,
  ScaleIcon,
  type LucideIcon,
} from "lucide-react";

import { COURT } from "@/lib/filing/options";
import { FILINGS_HOME } from "@/lib/filing/steps";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * DS `SidebarMenuButton` is 32px tall (and exactly 32×32 collapsed, forced with `!`).
 * These are the app's primary navigation, so they have to meet the 40×40 floor;
 * `ACCESSIBILITY.md` §8's own remedy is to expand the hit area rather than grow the
 * control. `-inset-1` adds 4px a side → 40px, and the menu's `gap-2` keeps neighbouring
 * hit areas from overlapping.
 */
const HIT_AREA = "relative after:absolute after:-inset-1 after:content-['']";

type NavItem = { id: string; label: string; icon: LucideIcon; href?: string };

/**
 * The product's real navigation. Only filings is built in this round; the rest are shown
 * because the shape of the product is the point of a shell, but they say plainly that
 * they do nothing rather than looking available.
 */
const NAV: NavItem[] = [
  { id: "home", label: "Home", icon: HouseIcon, href: FILINGS_HOME },
  { id: "cases", label: "Cases", icon: FolderClosedIcon },
  { id: "hearings", label: "Hearings", icon: CalendarDaysIcon },
  { id: "tasks", label: "Tasks", icon: ListChecksIcon },
  { id: "office", label: "Office", icon: BriefcaseIcon },
];

const UNBUILT_NOTE = "not part of this build";

/** Main navigation for the whole filings area. Icon rail from `md`, sheet below it. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      {/* The court identity sits at the page origin, in the rail — the top bar carries
          the breadcrumb instead, so the brand does not move when the rail collapses.
          The seam comes from the rail's own fill, so no border is drawn. */}
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2 px-1 py-1">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <ScaleIcon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="truncate text-body-compact font-semibold text-foreground">
              {COURT.brand}
            </span>
            <span className="truncate text-caption text-muted-foreground">
              {COURT.place}
            </span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* The primitives are `div`s; the landmark has to be declared here. */}
          <SidebarGroupContent>
            <nav aria-label="Main">
              <SidebarMenu className="gap-2">
                {NAV.map(({ id, label, icon: Icon, href }) => {
                  if (!href) {
                    return (
                      <SidebarMenuItem key={id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              aria-disabled="true"
                              /* Focusable and hoverable on purpose: a control that says
                                 why it does nothing is more use than one that cannot be
                                 reached to ask. Full contrast — dimming to 50% would
                                 make the label itself unreadable. */
                              className={`${HIT_AREA} text-muted-foreground aria-disabled:pointer-events-auto aria-disabled:opacity-100`}
                            >
                              <Icon aria-hidden />
                              <span className="truncate">{label}</span>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {label} — {UNBUILT_NOTE}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  }

                  // Highlighted for the whole filings area; `aria-current="page"` only on
                  // the screen it actually goes to.
                  const inArea = pathname.startsWith(FILINGS_HOME);
                  const isPage = pathname === FILINGS_HOME;
                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        asChild
                        isActive={inArea}
                        tooltip={label}
                        className={HIT_AREA}
                      >
                        <Link href={href} aria-current={isPage ? "page" : undefined}>
                          <Icon aria-hidden />
                          <span className="truncate">{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
