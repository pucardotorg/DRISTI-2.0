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

import { TASKS_HOME } from "@/lib/tasks/routes";
import { summaryOf } from "@/lib/tasks/selectors";
import { useTasks } from "@/lib/tasks/store";
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

/** The court identity at the page origin. */
export const COURT = { brand: "DRISTI", place: "Kollam, Kerala" };

/**
 * Re-exported so existing imports keep working. The value itself lives in
 * `lib/tasks/routes` — a route is data, and a Server Component cannot safely import one
 * out of a `"use client"` module (see the note there).
 */
export { TASKS_HOME };

/**
 * DS `SidebarMenuButton` is 32px tall, and exactly 32×32 once the rail collapses (forced
 * with `!`). These are the app's primary navigation, so they have to meet the 40×40 floor
 * — and a 32px icon adrift in the rail is what made the collapsed state read as unfinished.
 * So the control itself grows to 40px in both states rather than wearing an invisible
 * 40px hit area over a 32px mark. `size-10!` beats the primitive's own `!` through
 * tailwind-merge (same `size-*` key, ours last).
 */
const ROW_SIZE = "h-10 group-data-[collapsible=icon]:size-10!";

type NavItem = { id: string; label: string; icon: LucideIcon; href?: string };

/**
 * The product's real navigation. Only Tasks is built in this round; the rest are shown
 * because the shape of the product is the point of a shell, but they say plainly that
 * they do nothing rather than looking available.
 */
const NAV: NavItem[] = [
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "cases", label: "Cases", icon: FolderClosedIcon },
  { id: "hearings", label: "Hearings", icon: CalendarDaysIcon },
  { id: "tasks", label: "Tasks", icon: ListChecksIcon, href: TASKS_HOME },
  { id: "office", label: "Office", icon: BriefcaseIcon },
];

const UNBUILT_NOTE = "not part of this build";

/** The Needs-action count beside the Tasks item — plain muted text, like every count. */
function TasksCount() {
  const { state, people, cases, tasks, user } = useTasks();
  if (state !== "ready") return null;
  const { action } = summaryOf({ people, cases, tasks, user, now: new Date() });
  if (!action) return null;
  return (
    <span className="ml-auto text-caption tabular-nums text-muted-foreground group-data-[collapsible=icon]:hidden">
      {action}
    </span>
  );
}

/** Main navigation for the whole app. Icon rail from `md`, sheet below it. */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      {/* The court identity sits at the page origin, in the rail — the top bar carries
          the breadcrumb instead, so the brand does not move when the rail collapses.
          The seam comes from the rail's own fill, so no border is drawn. */}
      <SidebarHeader className="h-14 justify-center p-2 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <ScaleIcon className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="truncate text-body-compact font-semibold text-foreground">
              {COURT.brand}
            </span>
            <span className="truncate text-caption text-muted-foreground">{COURT.place}</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* The primitives are `div`s; the landmark has to be declared here. */}
          <SidebarGroupContent>
            <nav aria-label="Main">
              <SidebarMenu className="gap-1">
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
                              className={`${ROW_SIZE} text-muted-foreground aria-disabled:pointer-events-auto aria-disabled:opacity-100`}
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

                  // Highlighted for the whole tasks area; `aria-current="page"` only on
                  // the list itself.
                  const inArea = pathname.startsWith(href);
                  const isPage = pathname === href;
                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        asChild
                        isActive={inArea}
                        tooltip={label}
                        className={ROW_SIZE}
                      >
                        <Link href={href} aria-current={isPage ? "page" : undefined}>
                          <Icon aria-hidden />
                          <span className="truncate">{label}</span>
                          {id === "tasks" ? <TasksCount /> : null}
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
