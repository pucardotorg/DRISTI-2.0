"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";

import { useTasks } from "@/lib/tasks/store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TASKS_HOME } from "@/components/shell/app-sidebar";
import { useChrome } from "@/components/shell/chrome";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { PersonAvatar } from "@/components/tasks/person-avatar";

const ROLE_LABEL = { senior: "Senior advocate", junior: "Junior advocate" } as const;

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
              <BreadcrumbSeparator className={isLast ? "shrink-0" : "hidden md:inline-flex"} />
              <BreadcrumbItem className={isLast ? "min-w-0" : "hidden min-w-0 md:inline-flex"}>
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">{crumb.label}</BreadcrumbPage>
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
  const { open, openMobile, isMobile } = useSidebar();
  const shown = isMobile ? openMobile : open;
  return (
    <SidebarTrigger
      size="icon"
      aria-label={shown ? "Collapse main navigation" : "Expand main navigation"}
      className="shrink-0 text-muted-foreground"
    />
  );
}

/**
 * The account menu, and — until a session exists — the sandbox identity switcher. Picking
 * a teammate re-derives every verb, tab and count on the screen from their vakalatnamas,
 * which is how the permission model is seen working. Reset wipes this browser's data and
 * re-seeds.
 */
function AccountMenu() {
  const { state, people, user, setUser, resetSandbox } = useTasks();
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Account: ${user.name}`}
            className="rounded-full"
          >
            <PersonAvatar person={user} you size="default" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-body-compact font-medium text-foreground">{user.name}</span>
            <span className="text-caption font-normal text-muted-foreground">
              {ROLE_LABEL[user.role]}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">
            Viewing as
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={user.id}
            onValueChange={(id) => void setUser(id)}
            aria-label="Viewing as"
          >
            {people.map((p) => (
              <DropdownMenuRadioItem key={p.id} value={p.id} disabled={state !== "ready"}>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="text-caption text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
            <RotateCcwIcon aria-hidden />
            Reset sandbox data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the sandbox?"
        description="Every task, upload and decision made in this browser is discarded and the seed data is loaded again. Other open tabs reload too."
        confirmLabel="Reset sandbox"
        onConfirm={() => {
          setConfirmReset(false);
          void resetSandbox();
        }}
      />
    </>
  );
}

/**
 * Chrome for the whole app: the main nav's collapse trigger, where you are, and your
 * account. The court identity lives in the nav rail's header instead — it is the page
 * origin, and it should not move when this bar's contents change.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6">
      {/* The DS ships this at 36px; 40 is the accessibility floor. */}
      <NavTrigger />
      <ChromeBreadcrumb />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <AccountMenu />
      </div>
    </header>
  );
}
