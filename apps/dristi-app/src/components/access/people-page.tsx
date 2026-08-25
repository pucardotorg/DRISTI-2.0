"use client";

import * as React from "react";
import { CheckCircle2Icon, InfoIcon, SearchIcon, UsersIcon, XIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/components/access/access-list";
import { useAccess } from "@/components/access/access-state";
import { pick, type Locale } from "@/lib/onboarding/content";
import {
  ACCESS_CASES,
  fillCopy,
  listCopy,
  peopleCopy,
  shareCopy,
  type AccessGrant,
  type AccessPerson,
} from "@/lib/access/content";
import { cn } from "@/lib/utils";

/**
 * The People page — the renamed "Team case access" destination.
 *
 * A FLAT list of everyone on my side (name, number, case count). Opening a
 * person slides in an INLINE side panel that pushes the list left — no
 * overlay, nothing behind it disabled, so clicking another person just
 * repoints the panel. It never covers the top bar on desktop because it lives
 * in the page flow; on phones it becomes a focused full-screen surface.
 *
 * The panel splits their cases in two: "Access through Vakalatnama" (open only —
 * removal is a court application) and "Administrative access" (checkbox
 * select, red remove, invited-by attribution). Bulk removal therefore only
 * ever touches the administrative group.
 */

type PeopleSort = "name-asc" | "name-desc" | "cases-desc" | "cases-asc";

function caseById(caseId: string) {
  return ACCESS_CASES.find((c) => c.id === caseId);
}

function PersonListRow({
  person,
  locale,
  active,
  onOpen,
}: {
  person: AccessPerson;
  locale: Locale;
  active: boolean;
  onOpen: () => void;
}) {
  const count = person.grants.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active && "bg-muted",
      )}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="text-caption font-medium">
          {person.pending ? "#" : initials(person.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-compact font-medium">{person.name}</p>
        <p className="truncate text-caption text-muted-foreground">
          {person.pending ? (
            pick(listCopy.invitedPending, locale)
          ) : (
            <span className="tabular-nums">{person.phone}</span>
          )}
        </p>
      </div>
      <span className="shrink-0 text-caption text-muted-foreground">
        {count === 1
          ? pick(peopleCopy.caseCountOne, locale)
          : fillCopy(peopleCopy.caseCount, locale, { count: String(count) })}
      </span>
    </button>
  );
}

/** One case entry — spacious: title, number, joined date, attribution. */
function CaseEntry({
  grant,
  person,
  locale,
  selectable,
  checked,
  onCheck,
  onOpenCase,
  onRemove,
}: {
  grant: AccessGrant;
  person: AccessPerson;
  locale: Locale;
  selectable: boolean;
  checked: boolean;
  onCheck?: (value: boolean) => void;
  onOpenCase: () => void;
  onRemove?: () => void;
}) {
  const grantCase = caseById(grant.caseId);
  if (!grantCase) return null;
  const isVakalat = grant.role === "vakalat";
  const isPending = person.pending || grant.status === "invited";
  const grantInviter = grant.addedBy ?? person.addedBy;
  const invitedBy =
    grantInviter === "self"
      ? pick(peopleCopy.invitedByYou, locale)
      : grantInviter
        ? fillCopy(peopleCopy.invitedBy, locale, { name: grantInviter })
        : null;

  return (
    <div className="@container/case-entry flex items-start gap-3 py-4">
      {selectable ? (
        <Checkbox
          checked={checked}
          data-preserve-admin-selection={selectable || undefined}
          aria-label={fillCopy(peopleCopy.selectCaseAria, locale, {
            caseNumber: grantCase.caseNumber,
          })}
          className="mt-0.5"
          onCheckedChange={(value) => onCheck?.(value === true)}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2 @xs/case-entry:flex-row @xs/case-entry:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body-compact font-medium text-pretty">{grantCase.title}</p>
            {isPending ? (
              <Badge variant="warning">{pick(shareCopy.statusInvited, locale)}</Badge>
            ) : null}
          </div>
          <p className="text-caption text-muted-foreground">{grantCase.caseNumber}</p>
          <p className="text-caption text-muted-foreground">
            {fillCopy(
              isPending ? peopleCopy.invitedOn : peopleCopy.joinedOn,
              locale,
              { date: grant.since },
            )}
            {!isVakalat && invitedBy ? <> · {invitedBy}</> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-1 @xs/case-entry:self-center @xs/case-entry:pt-0">
          {!isVakalat && onRemove ? (
            <Button type="button" variant="destructive-ghost" size="sm" onClick={onRemove}>
              {pick(peopleCopy.removeFromCase, locale)}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onOpenCase}>
            {pick(peopleCopy.openCase, locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PeoplePage({
  locale,
  onOpenCase,
}: {
  locale: Locale;
  /** Jump to a case's file (the wireframe) — wired by the parent screen. */
  onOpenCase: (caseId: string) => void;
}) {
  const { people, removeGrant, removeAll } = useAccess();
  const [query, setQuery] = React.useState("");
  const [caseQuery, setCaseQuery] = React.useState("");
  const [peopleSort, setPeopleSort] = React.useState<PeopleSort>("name-asc");
  const [openPersonId, setOpenPersonId] = React.useState<string | null>(null);
  const [checkedCases, setCheckedCases] = React.useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removedNote, setRemovedNote] = React.useState<string | null>(null);

  // People with no grants left have no access anywhere — they drop off the page.
  const active = people.filter((person) => person.grants.length > 0);
  const q = query.trim().toLowerCase();
  const searched = q
    ? active.filter(
        (person) =>
          person.name.toLowerCase().includes(q) || person.phone.replace(/\D/g, "").includes(q),
      )
    : active;
  const matches = [...searched].sort((a, b) => {
    const aName = a.name.replace(/^Adv\.\s*/, "");
    const bName = b.name.replace(/^Adv\.\s*/, "");
    if (peopleSort === "name-desc") return bName.localeCompare(aName);
    if (peopleSort === "cases-desc") return b.grants.length - a.grants.length;
    if (peopleSort === "cases-asc") return a.grants.length - b.grants.length;
    return aName.localeCompare(bName);
  });

  const openPerson = people.find((person) => person.id === openPersonId) ?? null;
  const vakalatGrants = openPerson ? openPerson.grants.filter((g) => g.role === "vakalat") : [];
  const staffGrants = openPerson ? openPerson.grants.filter((g) => g.role !== "vakalat") : [];
  const caseQ = caseQuery.trim().toLowerCase();
  const matchesCaseQuery = (grant: AccessGrant) => {
    if (!caseQ) return true;
    const grantCase = caseById(grant.caseId);
    return Boolean(
      grantCase &&
        (grantCase.title.toLowerCase().includes(caseQ) ||
          grantCase.caseNumber.toLowerCase().includes(caseQ)),
    );
  };
  const visibleVakalatGrants = vakalatGrants.filter(matchesCaseQuery);
  const visibleStaffGrants = staffGrants.filter(matchesCaseQuery);
  // Bulk removal only ever touches the administrative group — nama grants are
  // court applications, so "all cases" honestly means "all administrative ones".
  const removingAll = checkedCases.length === 0;
  const removeCount = checkedCases.length || staffGrants.length;

  function openPanel(personId: string) {
    setOpenPersonId(personId);
    setCheckedCases([]);
    setCaseQuery("");
    setRemovedNote(null);
  }

  function closePanel() {
    setOpenPersonId(null);
    setCheckedCases([]);
    setCaseQuery("");
    setRemovedNote(null);
  }

  function confirmBulkRemove() {
    if (!openPerson) return;
    const targets = removingAll ? staffGrants.map((g) => g.caseId) : checkedCases;
    if (removingAll && vakalatGrants.length === 0) {
      removeAll(openPerson.id);
      setRemovedNote(fillCopy(peopleCopy.removedAllNote, locale, { name: openPerson.name }));
    } else {
      targets.forEach((caseId) => removeGrant(openPerson.id, caseId));
      const numbers = targets
        .map((caseId) => caseById(caseId)?.caseNumber)
        .filter(Boolean)
        .join(", ");
      setRemovedNote(
        fillCopy(peopleCopy.removedNote, locale, { name: openPerson.name, case: numbers }),
      );
    }
    setCheckedCases([]);
  }

  function renderVakalatnamaSection() {
    if (!openPerson || vakalatGrants.length === 0) return null;

    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-1">
          <h4 className="min-w-0 truncate text-body-compact font-semibold">
            {pick(peopleCopy.vakalatCasesHeading, locale)}
          </h4>
          <Badge variant="secondary">{vakalatGrants.length}</Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label={pick(peopleCopy.vakalatTooltipLabel, locale)}
              >
                <InfoIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">
              {pick(listCopy.vakalatLocked, locale)}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
          {visibleVakalatGrants.length ? (
            <div className="flex flex-col divide-y divide-hairline">
              {visibleVakalatGrants.map((grant) => (
                <CaseEntry
                  key={grant.caseId}
                  grant={grant}
                  person={openPerson}
                  locale={locale}
                  selectable={false}
                  checked={false}
                  onOpenCase={() => {
                    closePanel();
                    onOpenCase(grant.caseId);
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-caption text-muted-foreground">
              {pick(peopleCopy.noCaseMatches, locale)}
            </p>
          )}
        </div>
      </section>
    );
  }

  function renderAdministrativeSection() {
    if (!openPerson || staffGrants.length === 0) return null;

    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-1">
          <h4 className="min-w-0 truncate text-body-compact font-semibold">
            {pick(peopleCopy.staffCasesHeading, locale)}
          </h4>
          <Badge variant="secondary">{staffGrants.length}</Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label={pick(peopleCopy.staffTooltipLabel, locale)}
              >
                <InfoIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">
              {pick(peopleCopy.staffTooltip, locale)}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
          {visibleStaffGrants.length ? (
            <div className="flex flex-col divide-y divide-hairline">
              {visibleStaffGrants.map((grant) => (
                <CaseEntry
                  key={grant.caseId}
                  grant={grant}
                  person={openPerson}
                  locale={locale}
                  selectable={staffGrants.length > 1}
                  checked={checkedCases.includes(grant.caseId)}
                  onCheck={(value) =>
                    setCheckedCases((current) =>
                      value
                        ? [...current, grant.caseId]
                        : current.filter((id) => id !== grant.caseId),
                    )
                  }
                  onOpenCase={() => {
                    closePanel();
                    onOpenCase(grant.caseId);
                  }}
                  onRemove={() => {
                    removeGrant(openPerson.id, grant.caseId);
                    setCheckedCases((current) =>
                      current.filter((id) => id !== grant.caseId),
                    );
                    setRemovedNote(
                      fillCopy(peopleCopy.removedNote, locale, {
                        name: openPerson.name,
                        case: caseById(grant.caseId)?.caseNumber ?? "",
                      }),
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-caption text-muted-foreground">
              {pick(peopleCopy.noCaseMatches, locale)}
            </p>
          )}
        </div>
        <div className="shrink-0 px-1 pt-2 pb-1">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            data-preserve-admin-selection
            onClick={() => setConfirmRemove(true)}
          >
            {checkedCases.length
              ? pick(peopleCopy.removeFromThese, locale)
              : pick(peopleCopy.removeFromAll, locale)}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-stretch overflow-hidden">
      <ResizablePanelGroup
        key={openPerson ? "detail-open" : "detail-closed"}
        orientation="horizontal"
      >
      <ResizablePanel
        defaultSize={openPerson ? "48%" : "100%"}
        minSize={openPerson ? "35%" : "100%"}
      >
      {/* ------------------------------------------------------ list column */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden px-4 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {pick(peopleCopy.title, locale)}
          </h1>
          <p className="text-body-compact text-pretty text-muted-foreground">
            {pick(peopleCopy.subtitle, locale)}
          </p>
        </header>

        {active.length ? (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex w-full flex-col gap-2 sm:min-w-0 sm:flex-1">
                <Label htmlFor="people-search">{pick(peopleCopy.searchLabel, locale)}</Label>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="people-search"
                    type="search"
                    className="pl-9"
                    placeholder={pick(peopleCopy.searchPlaceholder, locale)}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-48">
                <Label htmlFor="people-sort">{pick(peopleCopy.sortLabel, locale)}</Label>
                <Select value={peopleSort} onValueChange={(value) => setPeopleSort(value as PeopleSort)}>
                  <SelectTrigger id="people-sort" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">{pick(peopleCopy.sortNameAsc, locale)}</SelectItem>
                    <SelectItem value="name-desc">{pick(peopleCopy.sortNameDesc, locale)}</SelectItem>
                    <SelectItem value="cases-desc">{pick(peopleCopy.sortCasesDesc, locale)}</SelectItem>
                    <SelectItem value="cases-asc">{pick(peopleCopy.sortCasesAsc, locale)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {matches.length === 0 ? (
              <p className="py-8 text-center text-body-compact text-muted-foreground">
                {pick(peopleCopy.noMatches, locale)}
              </p>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col divide-y divide-hairline">
                  {matches.map((person) => (
                    <PersonListRow
                      key={person.id}
                      person={person}
                      locale={locale}
                      active={person.id === openPersonId}
                      onOpen={() => openPanel(person.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UsersIcon className="size-5" aria-hidden />
            </span>
            <p className="text-body-compact font-semibold">{pick(peopleCopy.emptyTitle, locale)}</p>
            <p className="max-w-sm text-caption text-pretty text-muted-foreground">
              {pick(peopleCopy.emptyBody, locale)}
            </p>
          </div>
        )}
      </main>
      </ResizablePanel>

      {/* -------------------------------------------------- inline side panel */}
      {openPerson ? (
        <>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize="52%" minSize="30%" maxSize="65%">
          <aside
            className="@container/panel fixed inset-0 z-40 flex h-full w-full shrink-0 flex-col bg-surface md:static md:z-auto"
            aria-label={openPerson.name}
            onPointerDown={(event) => {
              if (!checkedCases.length) return;
              const target = event.target as HTMLElement;
              if (!target.closest("[data-preserve-admin-selection]")) setCheckedCases([]);
            }}
          >
            <div className="relative flex items-start gap-3 border-b border-hairline p-4">
              <Avatar className="size-11 shrink-0">
                <AvatarFallback className="bg-brand-muted text-body-compact font-medium text-brand-muted-foreground">
                  {openPerson.pending ? "#" : initials(openPerson.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-10">
                <h2 className="truncate text-body font-semibold">{openPerson.name}</h2>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-caption text-muted-foreground tabular-nums">
                    {openPerson.pending ? pick(listCopy.invitedPending, locale) : openPerson.phone}
                  </p>
                  {openPerson.barId ? (
                    <p className="flex items-baseline gap-1.5 text-caption tabular-nums">
                      <span className="text-muted-foreground">
                        {pick(peopleCopy.barIdLabel, locale)}
                      </span>
                      <span className="font-medium">{openPerson.barId}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={pick(peopleCopy.closePanel, locale)}
                className="absolute top-3 right-3"
                onClick={closePanel}
              >
                <XIcon aria-hidden />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
              {removedNote ? (
                <p className="flex items-start gap-1.5 rounded-lg border border-success bg-success-muted px-3 py-2 text-body-compact font-medium text-success-muted-foreground">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{removedNote}</span>
                </p>
              ) : null}

              <div className="flex shrink-0 flex-col gap-3 border-b border-hairline pb-4 @sm/panel:flex-row @sm/panel:items-center">
                <h3
                  id="case-access-heading"
                  className="min-w-0 flex-1 text-body-compact font-semibold"
                >
                  {pick(peopleCopy.detailCases, locale)}
                </h3>
                <div className="relative w-full @sm/panel:w-56">
                  <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="case-access-search"
                    type="search"
                    aria-labelledby="case-access-heading"
                    className="h-9 pl-9"
                    placeholder={pick(peopleCopy.caseSearchPlaceholder, locale)}
                    value={caseQuery}
                    onChange={(event) => setCaseQuery(event.target.value)}
                  />
                </div>
              </div>

              <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
                {vakalatGrants.length ? (
                  <ResizablePanel
                    defaultSize={staffGrants.length ? "35%" : "100%"}
                    minSize={staffGrants.length ? "18%" : "100%"}
                  >
                    {renderVakalatnamaSection()}
                  </ResizablePanel>
                ) : null}
                {vakalatGrants.length && staffGrants.length ? (
                  <ResizableHandle
                    withHandle
                    className="my-3 shrink-0"
                    data-preserve-admin-selection
                  />
                ) : null}
                {staffGrants.length ? (
                  <ResizablePanel
                    defaultSize={vakalatGrants.length ? "65%" : "100%"}
                    minSize={vakalatGrants.length ? "30%" : "100%"}
                  >
                    {renderAdministrativeSection()}
                  </ResizablePanel>
                ) : null}
              </ResizablePanelGroup>
            </div>
          </aside>
          </ResizablePanel>
        </>
      ) : null}
      </ResizablePanelGroup>

      {/* --------------------------------------------- bulk-remove confirm */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          {openPerson ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {fillCopy(
                    removingAll ? peopleCopy.removeAllTitle : peopleCopy.removeTheseTitle,
                    locale,
                    { name: openPerson.name },
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {removeCount === 1
                    ? pick(peopleCopy.removeBodyOne, locale)
                    : fillCopy(peopleCopy.removeAllBody, locale, { count: String(removeCount) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{pick(peopleCopy.removeAllCancel, locale)}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={confirmBulkRemove}>
                  {removingAll
                    ? pick(peopleCopy.removeAllConfirm, locale)
                    : pick(peopleCopy.removeFromThese, locale)}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
