"use client";

import * as React from "react";
import Link from "next/link";

import { useTasks } from "@/lib/tasks/store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TASKS_HOME } from "@/lib/tasks/routes";
import { caseOf, tasksInView } from "@/lib/tasks/selectors";
import { compareUrgency, daysUntil, isOverdue } from "@/lib/tasks/urgency";
import { useChrome } from "@/components/shell/chrome";
import {
  NotificationsBell,
  type ShellNotification,
} from "@/components/shell/notifications";

/**
 * The one breadcrumb in the app. Route-aware: Tasks › the task › the action. The task
 * crumb is a link back to the list with that task open; the action is text.
 */
function ChromeBreadcrumb() {
  const { crumbs } = useChrome();
  const last = crumbs.length - 1;

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          {crumbs.length ? (
            <BreadcrumbLink asChild>
              <Link href={TASKS_HOME}>Tasks</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Tasks</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {crumbs.map((crumb, i) => {
          const isLast = i === last;
          return (
            <React.Fragment key={`${i}-${crumb.label}`}>
              {/* Middle crumbs are what a narrow bar can afford to drop: the last crumb
                  is what orients you. */}
              <BreadcrumbSeparator
                className={isLast ? "shrink-0" : "hidden md:inline-flex"}
              />
              <BreadcrumbItem
                className={isLast ? "min-w-0" : "hidden min-w-0 md:inline-flex"}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * The DS trigger. No `aria-expanded`: the ghost Button paints `aria-expanded` as its
 * pressed fill, so the trigger would read as a filled square on every view where the
 * rail is open — the DS's own `SidebarTrigger` carries the state in its label instead.
 */
function NavTrigger() {
  const { open, isMobile } = useSidebar();
  // An open rail carries its own collapse control, in its header. Repeating it here
  // would put it back at the head of the breadcrumb row — which is what made it read as
  // the trail's first crumb. It returns only when the rail is a strip with no room.
  if (!isMobile && open) return null;
  return (
    <>
      <SidebarTrigger
        size="icon"
        aria-label="Expand main navigation"
        className="shrink-0 text-muted-foreground [&_svg]:size-5"
      />
      {/* The trigger belongs to the rail, the crumbs to the page. With the rail collapsed
          they sit side by side with nothing between them and the button reads as the
          trail's first item. A hairline is the least that separates them — and it lives
          here, with the trigger, so the two appear and disappear together. */}
      <Separator
        orientation="vertical"
        className="h-5! shrink-0 self-center! bg-hairline"
      />
    </>
  );
}

/**
 * What the bell reports, derived from the tasks already on screen.
 *
 * There is no notification service yet, so rather than invent events this reads the one
 * source of truth the app has: a task past its date is a thing that needs attention, and
 * saying so is a restatement of the person's own data rather than a fabricated feed.
 * Overdue items are `persistent` — they do not stop mattering because the panel was
 * opened — which also means nothing here is clearable until a real source lands.
 */
function useTaskNotifications() {
  const world = useTasks();
  const [readIds, setReadIds] = React.useState<ReadonlySet<string>>(new Set());

  const { state, people, cases, tasks, user } = world;

  const items = React.useMemo<ShellNotification[]>(() => {
    if (state !== "ready") return [];
    const now = new Date();
    const w = { people, cases, tasks, user, now };
    return tasksInView(w, "needs-action")
      .filter((t) => isOverdue(t, now))
      .sort((a, b) => compareUrgency(a, b, now))
      .slice(0, 8)
      .map((t) => {
        const days = t.dueAt ? Math.abs(daysUntil(t.dueAt, now)) : 0;
        const kase = caseOf(w, t);
        return {
          id: t.id,
          title: t.title,
          body: `${days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} overdue`}${
            kase ? ` · ${kase.parties}` : ""
          }`,
          unread: !readIds.has(t.id),
          tone: "warning" as const,
          persistent: true,
        };
      });
  }, [state, people, cases, tasks, user, readIds]);

  const markAllRead = React.useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of items) next.add(n.id);
      return next;
    });
  }, [items]);

  // Nothing derived from live tasks is stale, so this is a no-op until a real feed
  // arrives — the control disables itself off `stale`, so it never lies about clearing.
  const clearStale = React.useCallback(() => {}, []);

  return { items, markAllRead, clearStale };
}

/**
 * Chrome for the whole app: the main nav's collapse trigger, where you are, what needs
 * your attention, and your account. The court identity lives in the nav rail's header
 * instead — it is the page origin, and it should not move when this bar's contents change.
 */
export function TopBar() {
  const notifications = useTaskNotifications();

  return (
    // `sticky` is positioned, so the phone search row can hang under it, full width.
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6">
      <NavTrigger />
      <ChromeBreadcrumb />
      {/* The person is named once, at the foot of the rail. A second avatar here said
          the same thing twice and put two account controls on one screen. What stays is
          the one thing this bar owes you that the rail cannot give: what changed. */}
      <NotificationsBell
        notifications={notifications.items}
        onRead={notifications.markAllRead}
        onClearAll={notifications.clearStale}
      />
    </header>
  );
}
