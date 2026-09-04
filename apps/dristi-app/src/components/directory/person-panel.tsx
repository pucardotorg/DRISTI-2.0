"use client";

import * as React from "react";
import { CheckCircle2Icon, HourglassIcon, PlusIcon, XIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials } from "@/components/access/access-list";
import { RemoveAdvocateDialog } from "@/components/cases/remove-advocate-dialog";
import { CasePickerDialog } from "@/components/directory/case-picker-dialog";
import { directoryCopy as copy } from "@/components/directory/copy";
import { RemoveAccessDialog } from "@/components/directory/remove-access-dialog";
import { useSignLater } from "@/components/directory/sign-later";
import {
  displayName,
  effectiveGrants,
  formatPhone,
  groupsOf,
  sourceLabel,
} from "@/lib/directory/derive";
import { resolveCase } from "@/lib/directory/lookup";
import { useDirectory } from "@/lib/directory/store";
import type { DirectoryCase, EffectiveGrant, Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The per-person truth, in two lanes. The Office access tab lists every
 * case an office source reaches, each tagged with how (via a named group,
 * added directly); a case the vakalatnama also covers stays here, grayed.
 * The Vakalatnama tab lists the court's lane, and its Remove goes straight
 * into the existing court flow. On a case the viewer holds by office access
 * alone, either Remove opens that flow ending in "Sign later".
 */

type Lane = "office" | "vakalatnama";
type Entry = { grant: EffectiveGrant; kase: DirectoryCase };

/** Underline (line) tab, the same chrome the case screens' panels use. */
const TAB_CLASS =
  "-mb-px flex-none items-end gap-1.5 rounded-none px-0 pb-2.5 text-body-compact group-data-horizontal/tabs:h-10 group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:bg-brand-accent";

export function PersonPanel({
  person,
  onClose,
  onOpenCase,
  onOpenGroup,
}: {
  person: Person;
  onClose: () => void;
  onOpenCase: (caseId: string) => void;
  onOpenGroup: (groupId: string) => void;
}) {
  const directory = useDirectory();
  const { groups, pending, grantDirect, requestRemoval } = directory;
  const signLater = useSignLater();
  const [note, setNote] = React.useState<string | null>(null);
  const [removeCaseId, setRemoveCaseId] = React.useState<string | null>(null);
  /* The court flow: a vakalatnama removal, or anything on a case the viewer
     holds by office access alone (then it ends in "Sign later"). */
  const [courtCaseId, setCourtCaseId] = React.useState<string | null>(null);
  const [vakalatRequested, setVakalatRequested] = React.useState<ReadonlySet<string>>(new Set());
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const name = displayName(person.name);
  const memberOf = groupsOf(person.id, groups);
  const entries: Entry[] = effectiveGrants(person, directory)
    .map((g) => ({ grant: g, kase: resolveCase(g.caseId) }))
    .filter((e): e is Entry => Boolean(e.kase))
    .sort((a, b) => a.kase.title.localeCompare(b.kase.title));
  const officeEntries = entries.filter((e) => e.grant.sources.some((s) => s.kind !== "vakalatnama"));
  const vakalatEntries = entries.filter((e) => e.grant.accessType === "vakalatnama");
  const requestedGrants = pending.filter(
    (r) => r.kind === "grant-person" && r.personId === person.id && !entries.some((e) => e.kase.id === r.caseId),
  );
  const [lane, setLane] = React.useState<Lane>(vakalatEntries.length ? "vakalatnama" : "office");

  const removeCase = removeCaseId ? resolveCase(removeCaseId) : null;
  const courtCase = courtCaseId ? resolveCase(courtCaseId) : null;

  function pendingRemoval(caseId: string) {
    return pending.find((r) => r.kind === "remove-person" && r.personId === person.id && r.caseId === caseId);
  }

  function startRemove(entry: Entry, from: Lane) {
    setNote(null);
    if (entry.kase.viewer.kind === "office" || from === "vakalatnama") {
      setCourtCaseId(entry.kase.id);
      return;
    }
    const office = entry.grant.sources.filter((s) => s.kind !== "vakalatnama");
    /* A lone direct grant, with no vakalatnama behind it, is a plain
       Remove: gone, nothing else moves. */
    if (office.length === 1 && office[0].kind === "direct" && entry.grant.accessType === "office") {
      directory.removeDirect(person.id, entry.kase.id);
      setNote(copy.removedDirect(name, entry.kase.title));
      return;
    }
    setRemoveCaseId(entry.kase.id);
  }

  function renderRow(entry: Entry, from: Lane) {
    const { grant, kase } = entry;
    const won = grant.accessType === "vakalatnama";
    const pendingReq = pendingRemoval(kase.id);
    const vakalatPending = from === "vakalatnama" && vakalatRequested.has(kase.id);
    const shownSources =
      from === "office" ? grant.sources.filter((s) => s.kind !== "vakalatnama") : [];
    return (
      <li key={kase.id} className="@container/row flex flex-col gap-2 py-3 @sm/row:flex-row @sm/row:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={cn("text-body-compact font-medium text-pretty", from === "office" && won && "text-muted-foreground")}>
            {kase.title}
          </p>
          <p className="text-caption text-muted-foreground tabular-nums">{kase.caseNumber}</p>
          {shownSources.length ? (
            <p className={cn("text-caption", won ? "text-muted-foreground" : "text-foreground")}>
              {shownSources.map((s) => sourceLabel(s, groups)).join(" · ")}
              {won ? `, ${copy.addedThroughVakalatnama}` : null}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 @sm/row:justify-end">
          {pendingReq || vakalatPending ? (
            <span className="inline-flex items-center gap-1 px-2 text-caption text-muted-foreground">
              <HourglassIcon className="size-3.5" aria-hidden />
              {pendingReq ? copy.removalRequested(displayName(pendingReq.holder)) : copy.removalRequestedPlain}
            </span>
          ) : (
            /* Quiet at rest: a dozen red marks in one panel would be alarm
               fatigue. It turns destructive on hover and focus. */
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-destructive-muted hover:text-destructive-muted-foreground focus-visible:text-destructive-muted-foreground"
              onClick={() => startRemove(entry, from)}
            >
              {copy.remove}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenCase(kase.id)}>
            {copy.openCase}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <aside
      className="@container/panel fixed inset-0 z-40 flex h-full w-full shrink-0 flex-col bg-surface md:static md:z-auto"
      aria-label={person.name}
    >
      <div className="relative flex items-start gap-3 border-b border-hairline p-4">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-brand-muted text-body-compact font-medium text-brand-muted-foreground">
            {person.name.startsWith("+") ? "#" : initials(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-body font-semibold">{name}</h2>
            {person.status === "invited" ? <Badge variant="warning">{copy.yetToJoin}</Badge> : null}
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-caption text-muted-foreground tabular-nums">{formatPhone(person.phone)}</p>
            {person.barId ? (
              <p className="flex items-baseline gap-1.5 text-caption tabular-nums">
                <span className="text-muted-foreground">{copy.barId}</span>
                <span className="font-medium">{person.barId}</span>
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={copy.closePanel}
          className="absolute top-3 right-3"
          onClick={onClose}
        >
          <XIcon aria-hidden />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4">
        {note ? (
          <p className="flex shrink-0 items-start gap-1.5 rounded-lg border border-success bg-success-muted px-3 py-2 text-body-compact font-medium text-success-muted-foreground">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{note}</span>
          </p>
        ) : null}

        {/* ------------------------------------------------------- groups */}
        <section className="flex shrink-0 flex-col gap-2">
          <h3 className="text-body-compact font-semibold">{copy.panelGroups}</h3>
          {memberOf.length ? (
            <div className="flex flex-wrap gap-1.5">
              {memberOf.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onOpenGroup(g.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-caption font-medium text-foreground transition-colors hover:bg-accent-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {g.name}
                  <span className="font-normal text-muted-foreground tabular-nums">{copy.caseCount(g.caseIds.length)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-caption text-muted-foreground">{copy.notInAnyGroup}</p>
          )}
        </section>

        {/* ----------------------------------------------- the two lanes */}
        <Tabs value={lane} onValueChange={(v) => setLane(v as Lane)} className="min-h-0 flex-1 gap-3">
          <div className="flex items-end justify-between gap-2 border-b border-hairline">
            <TabsList variant="line" className="min-w-0 justify-start gap-6 p-0 pb-0 group-data-horizontal/tabs:h-auto">
              <TabsTrigger value="office" className={TAB_CLASS}>
                {copy.tabOffice}
                <Badge
                  variant="secondary"
                  className={cn("tabular-nums", lane === "office" && "bg-brand-muted text-brand-muted-foreground")}
                >
                  {officeEntries.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="vakalatnama" className={TAB_CLASS}>
                {copy.tabVakalatnama}
                <Badge
                  variant="secondary"
                  className={cn("tabular-nums", lane === "vakalatnama" && "bg-brand-muted text-brand-muted-foreground")}
                >
                  {vakalatEntries.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            {lane === "office" ? (
              <Button type="button" variant="ghost" size="sm" className="mb-1" data-icon="inline-start" onClick={() => setPickerOpen(true)}>
                <PlusIcon aria-hidden />
                {copy.addToCases}
              </Button>
            ) : null}
          </div>

          <TabsContent value="office" className="min-h-0 flex-1 overflow-y-auto">
            {officeEntries.length === 0 && requestedGrants.length === 0 ? (
              <p className="py-4 text-caption text-pretty text-muted-foreground">{copy.noOfficeCases}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {officeEntries.map((entry) => renderRow(entry, "office"))}
                {requestedGrants.map((r) => {
                  const kase = resolveCase(r.caseId);
                  if (!kase) return null;
                  return (
                    <li key={r.id} className="flex flex-col gap-0.5 py-3">
                      <p className="text-body-compact font-medium text-muted-foreground">{kase.title}</p>
                      <p className="text-caption text-muted-foreground tabular-nums">{kase.caseNumber}</p>
                      <p className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <HourglassIcon className="size-3.5" aria-hidden />
                        {copy.accessRequested(displayName(r.holder))}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="vakalatnama" className="min-h-0 flex-1 overflow-y-auto">
            {vakalatEntries.length === 0 ? (
              <p className="py-4 text-caption text-pretty text-muted-foreground">{copy.noVakalatCases}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline">
                {vakalatEntries.map((entry) => renderRow(entry, "vakalatnama"))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {removeCase ? (
        <RemoveAccessDialog
          open
          onOpenChange={(next) => {
            if (!next) setRemoveCaseId(null);
          }}
          person={person}
          kase={removeCase}
          onRemoved={setNote}
        />
      ) : null}

      {/* The court's lane, unchanged: the Parties tab's own removal dialog.
          Where the viewer holds only office access it ends in "Sign later". */}
      {courtCase ? (
        <RemoveAdvocateDialog
          open
          onOpenChange={(next) => {
            if (!next) setCourtCaseId(null);
          }}
          advocateName={person.name}
          partyName={courtCase.side === "complainant" ? courtCase.parties.complainant.name : courtCase.parties.accused.name}
          caseRef={{ title: courtCase.title, caseNumber: courtCase.caseNumber, court: courtCase.court }}
          signLater={
            courtCase.viewer.kind === "office"
              ? {
                  holder: displayName(courtCase.viewer.via),
                  onSignLater: () => {
                    requestRemoval(person.id, courtCase.id);
                    signLater({
                      kind: "remove",
                      personName: person.name,
                      kase: courtCase,
                      holder: courtCase.viewer.kind === "office" ? courtCase.viewer.via : "",
                    });
                  },
                }
              : undefined
          }
          onRequested={() => setVakalatRequested((cur) => new Set([...cur, courtCase.id]))}
        />
      ) : null}

      <CasePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        subject={name}
        forGroup={false}
        alreadyHas={[...entries.map((e) => e.kase.id), ...requestedGrants.map((r) => r.caseId)]}
        onConfirm={(caseIds) => {
          const result = grantDirect(person.id, caseIds);
          for (const { kase, holder } of result.sentToSign) {
            signLater({ kind: "grant-person", personName: person.name, kase, holder });
          }
          return { ...result, people: 1 };
        }}
      />
    </aside>
  );
}
