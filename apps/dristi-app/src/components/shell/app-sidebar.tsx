"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderClosedIcon,
  HouseIcon,
  ListChecksIcon,
  SearchIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { TASKS_HOME } from "@/lib/tasks/routes";
import { summaryOf } from "@/lib/tasks/selectors";
import { useTasks } from "@/lib/tasks/store";
import { BrandGlyph, BrandLockup } from "@/components/brand-lockup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
 * Nav row metrics.
 *
 * The control is 40×40 in both states — the primary navigation has to meet the 40×40
 * touch floor, and the DS default (32px, forced with `!`) left the collapsed rail
 * reading as unfinished. `size-10!` beats the primitive's own `!` through tailwind-merge
 * (same `size-*` key, ours last).
 *
 * The glyph goes to 20px against the DS's 16px: a 16px mark inside a 40px square fills
 * two-fifths of it and reads lost once the labels are gone. 20-in-40 is the proportion
 * both reference rails use.
 *
 * Weight carries selection. The DS marks the active row `font-medium` (500); at rail
 * width that is not a perceptible step, so the active row goes to 600 — two weights on
 * the component, which is the craft ceiling.
 */
const ROW = [
  "h-10 gap-3 px-2 group-data-[collapsible=icon]:size-10!",
  "[&_svg]:size-5",
  "data-[active=true]:font-semibold",
].join(" ");

type NavItem = { id: string; label: string; icon: LucideIcon; href?: string };

/**
 * The product's navigation, in three groups: where you go, what you start, and who you
 * work with. Only Pending Tasks is built in this round; the rest are shown because the
 * shape of the product is the point of a shell, and they say plainly that they do
 * nothing rather than looking available.
 */
const GO: NavItem[] = [
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "cases", label: "Your Cases", icon: FolderClosedIcon },
  { id: "tasks", label: "Pending Tasks", icon: ListChecksIcon, href: TASKS_HOME },
  { id: "calendar", label: "Calendar", icon: CalendarDaysIcon },
];

const START: NavItem[] = [
  { id: "file-case", label: "File a Case", icon: FilePlusIcon },
  { id: "file-application", label: "File Application", icon: FileTextIcon },
  { id: "join-case", label: "Join a Case", icon: UserPlusIcon },
];

const WITH: NavItem[] = [{ id: "people", label: "People", icon: UsersIcon }];

const UNBUILT_NOTE = "not part of this build";
const SEARCH_NOTE = "product-wide search — not part of this build";

const ROLE_LABEL = {
  senior: "Senior advocate",
  junior: "Junior advocate",
} as const;

/** The Needs-action count beside Pending Tasks — plain muted text, like every count. */
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

/** One nav row: a link when it goes somewhere, an explained dead control when it does not. */
function NavRow({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { id, label, icon: Icon, href } = item;

  if (!href) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              aria-disabled="true"
              /* Focusable and hoverable on purpose: a control that says why it does
                 nothing is more use than one that cannot be reached to ask. Full
                 contrast — dimming to 50% would make the label itself unreadable. */
              className={`${ROW} text-muted-foreground aria-disabled:pointer-events-auto aria-disabled:opacity-100`}
            >
              <Icon aria-hidden />
              <span className="truncate">{label}</span>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">
            {id === "search" ? SEARCH_NOTE : `${label} — ${UNBUILT_NOTE}`}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  // Highlighted for the whole area; `aria-current="page"` only on the list itself.
  const inArea = pathname.startsWith(href);
  const isPage = pathname === href;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={inArea} tooltip={label} className={ROW}>
        <Link href={href} aria-current={isPage ? "page" : undefined}>
          <Icon aria-hidden />
          <span className="truncate">{label}</span>
          {id === "tasks" ? <TasksCount /> : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * One group of rows.
 *
 * `items-center` in the collapsed state is what keeps the 40px square honest: the rail
 * carries a hairline on its trailing edge, so padding-based centring leaves 8px on one
 * side and 7px on the other — the exact asymmetry that reads as "off". Centring by flex
 * is immune to the border, whatever the rail width becomes.
 *
 * A group after the first is separated by the faintest rule the DS names. The seam is
 * hidden when the rail collapses: at 56px the rows are already unmistakably grouped by
 * their own spacing, and a full-width rule across an icon rail is a stroke doing nothing.
 */
function NavGroup({
  items,
  label,
  separated,
}: {
  items: NavItem[];
  label: string;
  separated?: boolean;
}) {
  return (
    <SidebarGroup
      className={
        separated
          ? "border-t border-hairline px-3 py-2 group-data-[collapsible=icon]:border-t-0 group-data-[collapsible=icon]:px-0"
          : "px-3 py-2 group-data-[collapsible=icon]:px-0"
      }
    >
      {/* The primitives are `div`s; the landmark has to be declared here. */}
      <SidebarGroupContent>
        <nav aria-label={label}>
          <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
            {items.map((item) => (
              <NavRow key={item.id} item={item} />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * The person, at the foot of the rail.
 *
 * The slot is unconditional: an account that cannot switch profiles still has a
 * settings menu, and the rail should not change shape between roles. Only the switching
 * itself is conditional — `canSwitch` adds the profile list and the chevron that
 * advertises it. The avatar carries a saturated fill rather than the pale tint used for
 * "you" in a list of teammates: at the foot of the chrome it is an identity mark with
 * nothing beside it to be distinguished from, and both reference rails render it solid.
 */
function ProfileFooter() {
  const { state, people, user, setUser } = useTasks();
  const canSwitch = people.length > 1;
  const roleLabel = ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? "Litigant";

  return (
    <SidebarFooter className="border-t border-hairline p-3 group-data-[collapsible=icon]:px-0">
      <SidebarMenu className="group-data-[collapsible=icon]:items-center">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className={`${ROW} h-12 group-data-[collapsible=icon]:size-10!`}
                tooltip={`${user.name} · ${roleLabel}`}
                aria-label={`${user.name} · ${roleLabel}${canSwitch ? " · Switch profile" : ""}`}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground group-data-[collapsible=icon]:size-7"
                >
                  {user.initials}
                </span>
                <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-body-compact font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">{roleLabel}</span>
                </span>
                {canSwitch ? (
                  <ChevronsUpDownIcon
                    aria-hidden
                    className="ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden"
                  />
                ) : null}
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" className="min-w-64">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-body-compact font-medium text-foreground">{user.name}</span>
                <span className="text-caption font-normal text-muted-foreground">{roleLabel}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {canSwitch ? (
                <>
                  <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">
                    Switch profile
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={user.id}
                    onValueChange={(id) => void setUser(id)}
                    aria-label="Switch profile"
                  >
                    {people.map((p) => (
                      <DropdownMenuRadioItem key={p.id} value={p.id} disabled={state !== "ready"}>
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="truncate">{p.name}</span>
                          <span className="text-caption text-muted-foreground">
                            {ROLE_LABEL[p.role as keyof typeof ROLE_LABEL] ?? "Litigant"}
                          </span>
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              <DropdownMenuItem disabled>
                <SettingsIcon aria-hidden />
                Settings — {UNBUILT_NOTE}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

/** Main navigation for the whole app. Icon rail from `md`, sheet below it. */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/*
        * The brand sits at the page origin, in the rail — the top bar carries the
        * breadcrumb instead, so the mark does not move when the rail collapses. The
        * header is the top bar's own height so its rule and the breadcrumb bar's rule
        * are one continuous line across the whole chrome.
        */}
      <SidebarHeader className="h-14 justify-center border-b border-hairline px-3 py-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <BrandLockup className="h-10 group-data-[collapsible=icon]:hidden" />
        <BrandGlyph className="hidden h-7 group-data-[collapsible=icon]:flex" />
      </SidebarHeader>

      <SidebarContent>
        <NavGroup items={GO} label="Main" />
        <NavGroup items={START} label="Start something" separated />
        <NavGroup items={WITH} label="People" separated />
      </SidebarContent>

      <ProfileFooter />
    </Sidebar>
  );
}
