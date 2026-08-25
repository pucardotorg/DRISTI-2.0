"use client";

import * as React from "react";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  HouseIcon,
  InfoIcon,
  LifeBuoyIcon,
  ScaleIcon,
  SettingsIcon,
} from "lucide-react";

import { BrandGlyph, BrandLockup } from "@/components/brand-lockup";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CompactSegmentedControl,
  CompactSegmentedControlItem,
} from "@/components/ui/compact-segmented-control";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { LOCALES, pick, ui, type Locale } from "@/lib/onboarding/content";
import { shell } from "@/lib/join/content";
import { cn } from "@/lib/utils";

/**
 * The signed-in litigant shell: collapsible sidebar, breadcrumb bar, notifications.
 *
 * Follows the scrutiny-officer redesign's frame — left rail that collapses to icons,
 * breadcrumbs in the topmost bar, person at the bottom of the rail — with litigant
 * navigation instead of registry queues: home, your cases, hearings, help. On phones
 * the rail becomes a sheet behind the top-bar toggle (the DS sidebar handles both).
 *
 * Notifications live behind the bell in the top bar, not a nav item: they interrupt
 * (an ID rejection must be seen), they are not a place someone goes to work.
 */

export type NavKey =
  | "home"
  | "cases"
  | "hearings"
  | "help"
  | "settings"
  // advocate portal
  | "filings"
  | "join"
  | "tasks"
  | "calendar"
  | "team";

export type NavItem = {
  key: Exclude<NavKey, "settings">;
  icon: typeof HouseIcon;
  label: Record<Locale, string>;
};

export type ShellNotification = {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  tone: "success" | "warning" | "info";
  topic?: "profile" | "id";
  /** An unresolved task keeps its attention indicator even after the panel is opened. */
  persistent?: boolean;
  /** Superseded updates may be cleared; current tasks and statuses may not. */
  stale?: boolean;
  /** Present when the notification has a follow-up action (e.g. re-upload the ID). */
  actionLabel?: string;
  onAction?: () => void;
};

function NotificationStatusIcon({
  tone,
}: {
  tone: ShellNotification["tone"];
}) {
  const Icon =
    tone === "success"
      ? CircleCheckIcon
      : tone === "warning"
        ? CircleAlertIcon
        : InfoIcon;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        tone === "success" && "bg-success-muted text-success-muted-foreground",
        tone === "warning" && "bg-warning-muted text-warning-muted-foreground",
        tone === "info" && "bg-info-muted text-info-muted-foreground",
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", icon: HouseIcon, label: shell.navHome },
  { key: "cases", icon: ScaleIcon, label: shell.navCases },
  { key: "hearings", icon: CalendarIcon, label: shell.navHearings },
  { key: "help", icon: LifeBuoyIcon, label: shell.navHelp },
];

type AppShellProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  profileName: string;
  /** Side-panel entries. Defaults to the litigant navigation. */
  items?: NavItem[];
  active?: NavKey;
  onNavigate: (key: NavKey) => void;
  caseCount: number;
  notifications: ShellNotification[];
  /** Called when the panel opens — only ordinary unread updates clear once seen. */
  onNotificationsRead: () => void;
  /** Clears resolved and informational history while retaining unresolved actions. */
  onNotificationsClearAll: () => void;
  profileNeedsAttention?: boolean;
  profileRole?: "litigant" | "advocate";
  advocateProfileAvailable?: boolean;
  onSwitchProfile?: () => void;
  onSettingsClick?: () => void;
  currentPageLabel?: string;
  children: React.ReactNode;
};

export function AppShell(props: AppShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider lang={props.locale}>
        <ShellInner {...props} />
      </SidebarProvider>
    </TooltipProvider>
  );
}

/** Inside the provider so it can close the phone sheet when navigation happens. */
function ShellInner({
  locale,
  onLocaleChange,
  profileName,
  items = NAV_ITEMS,
  active = "home",
  onNavigate,
  caseCount,
  notifications,
  onNotificationsRead,
  onNotificationsClearAll,
  profileNeedsAttention = false,
  profileRole = "litigant",
  advocateProfileAvailable = false,
  onSwitchProfile,
  onSettingsClick,
  currentPageLabel,
  children,
}: AppShellProps) {
  const { setOpenMobile } = useSidebar();
  // Every navigation collapses the phone sheet — arriving on a new page behind an
  // open panel reads as nothing having happened.
  const navigate = (key: NavKey) => {
    setOpenMobile(false);
    onNavigate(key);
  };
  const openSettings = () => {
    setOpenMobile(false);
    onSettingsClick?.();
  };
  const unreadCount = notifications.filter((n) => n.unread && !n.persistent).length;
  const hasPersistentAttention = notifications.some((n) => n.persistent);
  const hasClearableNotifications = notifications.some(
    (notification) =>
      !notification.persistent &&
      (notification.stale || !notification.actionLabel || !notification.onAction),
  );
  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Rendered twice — once per breakpoint's row — so phone and desktop bars can have
  // genuinely different layouts without duplicating this markup inline.
  const breadcrumbs = (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => navigate("home")} className="cursor-pointer">
            {pick(shell.breadcrumbHome, locale)}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">
            {currentPageLabel ?? pick(shell.breadcrumbAllCases, locale)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const notificationsBell = (
    <Popover
      onOpenChange={(open) => {
        if (open) onNotificationsRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${pick(shell.notifications, locale)}${unreadCount ? ` (${unreadCount})` : hasPersistentAttention ? ` · ${pick(shell.profileIncompleteLabel, locale)}` : ""}`}
        >
          <BellIcon aria-hidden />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="text-caption absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive leading-none font-semibold text-destructive-foreground"
            >
              {unreadCount}
            </span>
          ) : hasPersistentAttention ? (
            <span
              aria-hidden
              className="absolute top-2 right-2 size-2.5 rounded-full bg-destructive ring-2 ring-background"
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={16} className="w-88 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-hairline px-4 py-2">
          <p className="text-body-compact font-semibold">
            {pick(shell.notifications, locale)}
          </p>
          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasClearableNotifications}
              onClick={onNotificationsClearAll}
            >
              {pick(shell.clearAllNotifications, locale)}
            </Button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-body-compact text-muted-foreground">
            {pick(shell.noNotifications, locale)}
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex gap-2.5 border-b border-hairline px-4 py-3 last:border-b-0"
              >
                <NotificationStatusIcon tone={notification.tone} />
                <div className="flex min-w-0 flex-col gap-1">
                  <p
                    className={cn(
                      "text-body-compact font-medium",
                      notification.unread && "font-semibold",
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-body-compact text-pretty text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {pick(shell.justNow, locale)}
                  </p>
                  {notification.actionLabel && notification.onAction ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 self-start"
                      onClick={notification.onAction}
                    >
                      {notification.actionLabel}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );

  const languageControl = (
    <CompactSegmentedControl
      type="single"
      value={locale}
      onValueChange={(value) => value && onLocaleChange(value as Locale)}
      aria-label={pick(ui.language, locale)}
    >
      {LOCALES.map((l) => (
        <CompactSegmentedControlItem key={l.value} value={l.value}>
          {l.label}
        </CompactSegmentedControlItem>
      ))}
    </CompactSegmentedControl>
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          {/* Fixed height keeps the header divider where it is regardless of mark
              size — the wordmark can grow (expanded) and the glyph shrink (collapsed)
              without moving the rule. */}
          <div className="flex h-11 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <BrandLockup className="h-10 group-data-[collapsible=icon]:hidden" />
            <BrandGlyph className="hidden h-6 group-data-[collapsible=icon]:inline-flex" />
            {/* Inside the phone sheet there is otherwise no way to collapse the panel
                short of tapping the scrim — the same toggle that opened it closes it. */}
            <SidebarTrigger className="ml-auto md:hidden" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{pick(shell.navGroup, locale)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={item.key === active}
                      className="group-data-[collapsible=icon]:[&>svg]:translate-x-1"
                      tooltip={pick(item.label, locale)}
                      onClick={() => navigate(item.key)}
                    >
                      <item.icon aria-hidden />
                      <span>{pick(item.label, locale)}</span>
                    </SidebarMenuButton>
                    {item.key === "cases" && caseCount > 0 ? (
                      <SidebarMenuBadge>{caseCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      tooltip={profileNeedsAttention ? `${profileName} · ${pick(shell.profileIncompleteLabel, locale)}` : profileName}
                      aria-label={`${profileName} · ${profileRole === "advocate" ? "Advocate" : "Litigant"} · Switch profile`}
                    >
                      <span className="relative shrink-0">
                        <Avatar size="lg">
                          <AvatarFallback className="bg-brand-muted text-body-compact text-brand-muted-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        {profileNeedsAttention ? <span aria-hidden className="absolute top-0 right-0 size-2.5 rounded-full bg-destructive ring-2 ring-sidebar" /> : null}
                        <span aria-hidden className="absolute -left-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-sidebar ring-1 ring-sidebar-border">
                          <ChevronsUpDownIcon className="size-3 text-sidebar-foreground/70" />
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-body-compact font-medium">{profileName}</span>
                        <span className="truncate text-caption text-sidebar-foreground/70">{profileRole === "advocate" ? (locale === "ml" ? "അഭിഭാഷകൻ" : "Advocate") : pick(shell.role, locale)}</span>
                      </span>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" collisionPadding={16} className="w-64 p-2">
                    <p className="px-2 py-1.5 text-caption font-semibold text-muted-foreground">Switch profile</p>
                    <Button variant="ghost" className="w-full justify-start" onClick={profileRole === "advocate" ? onSwitchProfile : undefined}>
                      <Avatar size="sm"><AvatarFallback>L</AvatarFallback></Avatar>
                      <span className="flex-1 text-left">Litigant</span>
                      {profileRole === "litigant" ? <CheckIcon aria-hidden /> : null}
                    </Button>
                    {advocateProfileAvailable ? (
                      <Button variant="ghost" className="w-full justify-start" onClick={profileRole === "litigant" ? onSwitchProfile : undefined}>
                        <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
                        <span className="flex-1 text-left">Advocate</span>
                        {profileRole === "advocate" ? <CheckIcon aria-hidden /> : null}
                      </Button>
                    ) : null}
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="ghost" size="icon" className={cn("size-10 shrink-0 group-data-[collapsible=icon]:hidden", active === "settings" && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")} aria-current={active === "settings" ? "page" : undefined} aria-label="Open profile settings" title="Profile settings" onClick={openSettings}>
                <SettingsIcon className="size-5" aria-hidden />
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh overflow-hidden">
        {/* -------------------------------------------------- topmost bar */}
        {/* On phones the bar is two rows — pane toggle + language above, breadcrumbs +
            bell below — so the breadcrumb never fights the controls for one cramped
            line. On md+ everything sits on the single 56px row. */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-hairline bg-background">
          <div className="flex h-14 items-center gap-2 px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 ml-3 hidden h-5! self-center! md:block"
            />
            <div className="hidden min-w-0 flex-1 items-center md:flex">{breadcrumbs}</div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden md:contents">{notificationsBell}</span>
              {languageControl}
            </div>
          </div>
          <div className="flex h-12 items-center gap-2 border-t border-hairline px-4 md:hidden">
            <div className="min-w-0 flex-1">{breadcrumbs}</div>
            {notificationsBell}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      </SidebarInset>
    </>
  );
}
