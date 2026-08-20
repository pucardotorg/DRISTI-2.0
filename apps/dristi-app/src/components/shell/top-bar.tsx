"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcwIcon, SearchIcon } from "lucide-react";

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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
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
 * The global search — one box that searches every tab of the task list at once: the
 * query narrows the table and the tab counts follow it, so the person sees where the
 * matches live. Lives in the chrome, not the filter row, because it is not a filter of
 * the current tab. `/` focuses it. On a phone the box has no room in the bar, so an
 * icon button expands it to a full-width row under the bar.
 */
function GlobalSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const searchRef = React.useRef<HTMLInputElement>(null);

  const onList = pathname === TASKS_HOME;
  const urlQuery = onList ? (params.get("q") ?? "") : "";

  // Local echo of the query so typing is instant; the URL follows after a short pause.
  const [query, setQuery] = React.useState(urlQuery);
  // When the URL changes underneath (Clear filters, back/forward), follow it.
  const [seen, setSeen] = React.useState(urlQuery);
  if (seen !== urlQuery) {
    setSeen(urlQuery);
    setQuery(urlQuery);
  }

  const write = React.useCallback(
    (value: string) => {
      const p = new URLSearchParams(params);
      if (value.trim()) p.set("q", value.trim());
      else p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `${TASKS_HOME}?${qs}` : TASKS_HOME, { scroll: false });
    },
    [params, router]
  );

  React.useEffect(() => {
    if (!onList || query === urlQuery) return;
    const t = window.setTimeout(() => write(query), 200);
    return () => window.clearTimeout(t);
  }, [onList, query, urlQuery, write]);

  React.useEffect(() => {
    if (!onList) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onList]);

  if (!onList) return null;

  return (
    <InputGroup className="w-full sm:w-56 lg:w-72">
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={searchRef}
        type="search"
        aria-label="Find a case or task"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a case or task"
        autoComplete="off"
        enterKeyHint="search"
      />
      <InputGroupAddon align="inline-end" className={query ? "hidden" : "max-sm:hidden"}>
        <Kbd aria-hidden>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * The phone presentation: a toggle in the bar, the box as a row under it. Kept mounted
 * (hidden) so the desktop box and the row never fight over the query state.
 */
function SearchArea() {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState(false);
  if (pathname !== TASKS_HOME) return null;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={expanded ? "Hide search" : "Search"}
        aria-expanded={expanded}
        onClick={() => setExpanded((x) => !x)}
        className="text-muted-foreground sm:hidden"
      >
        <SearchIcon aria-hidden />
      </Button>
      <div className="hidden sm:block">
        <React.Suspense fallback={null}>
          <GlobalSearch />
        </React.Suspense>
      </div>
      {expanded ? (
        <div className="absolute inset-x-0 top-full border-b border-hairline bg-card px-4 py-2 sm:hidden">
          <React.Suspense fallback={null}>
            <GlobalSearch />
          </React.Suspense>
        </div>
      ) : null}
    </>
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
    // `sticky` is positioned, so the phone search row can hang under it, full width.
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-card px-4 sm:px-6">
      {/* The DS ships this at 36px; 40 is the accessibility floor. */}
      <NavTrigger />
      <ChromeBreadcrumb />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <SearchArea />
        <AccountMenu />
      </div>
    </header>
  );
}
