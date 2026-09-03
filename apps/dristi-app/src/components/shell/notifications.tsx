"use client";

import * as React from "react";
import Link from "next/link";
import {
  BellIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * One line in the notifications panel.
 *
 * The shape is deliberately the one the litigant shell already uses, so the two shells
 * describe the same object and this panel can be promoted to the design system without
 * reconciling two vocabularies first.
 */
export type ShellNotification = {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  tone: "success" | "warning" | "info";
  /** An unresolved task keeps its attention indicator even after the panel is opened. */
  persistent?: boolean;
  /** Superseded updates may be cleared; current tasks and statuses may not. */
  stale?: boolean;
  /** Where acting on this lives — a notification you cannot open is noise,
      so every row derived from a task carries the task's own href. */
  href?: string;
};

/**
 * The tone mark. Colour is never the only carrier — the glyph differs per tone, and the
 * words say the same thing again — so the tint is the third treatment, not the first.
 */
function NotificationStatusIcon({ tone }: { tone: ShellNotification["tone"] }) {
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

/**
 * Notifications live behind the bell in the top bar, not as a nav item: they interrupt
 * whatever you are doing rather than being somewhere you go.
 *
 * The count badge is destructive only while something is genuinely unread; a persistent
 * item that has already been seen falls back to a plain dot. That keeps the alarm budget
 * for things that changed since you last looked.
 */
export function NotificationsBell({
  notifications,
  onRead,
  onClearAll,
}: {
  notifications: ShellNotification[];
  onRead: () => void;
  onClearAll: () => void;
}) {
  const unreadCount = notifications.filter((n) => n.unread).length;
  const hasPersistentAttention = notifications.some((n) => n.persistent);
  const hasClearable = notifications.some((n) => n.stale);
  // Controlled so a row's link can close the panel as it navigates — Radix
  // dismisses on outside-click, and a click inside the panel is not outside.
  const [open, setOpen] = React.useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative [&_svg]:size-5"
          aria-label={`Notifications${
            unreadCount
              ? ` (${unreadCount} unread)`
              : hasPersistentAttention
                ? " · needs attention"
                : ""
          }`}
        >
          <BellIcon aria-hidden />
          {/*
           * The badge sits on the button's corner, not on the glyph. A fixed 16px
           * circle could not hold two characters — "9+" broke its own edge — so it is
           * a pill that starts circular and grows only as far as the digits need. The
           * ring is the bar's own fill, which is what lets a saturated mark sit over a
           * line drawing without the two reading as one smudge. Counts stop at 9+:
           * past that the number has stopped being information and is only alarm.
           */}
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-caption font-semibold leading-none text-destructive-foreground ring-2 ring-card"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : hasPersistentAttention ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-card"
            />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-88 max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-hairline px-4 py-2">
          <p className="text-body-compact font-semibold">Notifications</p>
          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasClearable}
              onClick={onClearAll}
            >
              Clear all
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-body-compact text-muted-foreground">
            Nothing needs your attention right now.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              const content = (
                <>
                  <NotificationStatusIcon tone={n.tone} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p
                      className={cn(
                        "text-body-compact",
                        n.unread
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {n.body}
                    </p>
                  </div>
                </>
              );
              return (
                <li
                  key={n.id}
                  className="border-b border-hairline last:border-b-0"
                >
                  {/* A row that carries a task is that task's doorway: the
                      whole row is the link, and it lands on the task open in
                      Pending tasks, where the action (Respond, pay, upload)
                      lives. The chevron says the row opens. */}
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex gap-2.5 px-4 py-3 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:outline-1 focus-visible:outline-ring"
                    >
                      {content}
                      <ChevronRightIcon
                        aria-hidden
                        className="size-4 shrink-0 self-center text-muted-foreground"
                      />
                    </Link>
                  ) : (
                    <div className="flex gap-2.5 px-4 py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
