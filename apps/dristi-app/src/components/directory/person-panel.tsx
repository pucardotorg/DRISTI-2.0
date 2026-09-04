"use client";

import * as React from "react";
import { CheckCircle2Icon, HourglassIcon, PlusIcon, XIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useDirectory } from "@/lib/directory/store";
import type { DirectoryCase, EffectiveGrant, Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The per-person truth. Every case the person reaches, each tagged with
 * how: via a named group, added directly, or the vakalatnama. When the
 * vakalatnama wins, the office sources stay visible but grayed. Remove
 * behaves by source (the two-choice modal), and on a case the viewer holds
 * only by office access it opens the existing removal flow ending in
 * "Sign later".
 */
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
  const { cases, groups, pending, grantDirect, requestRemoval } = directory;
  const signLater = useSignLater();
  const [note, setNote] = React.useState<string | null>(null);
  const [removeCaseId, setRemoveCaseId] = React.useState<string | null>(null);
  const [signLaterCaseId, setSignLaterCaseId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const name = displayName(person.name);
  const memberOf = groupsOf(person.id, groups);
  const grants = effectiveGrants(person, directory)
    .map((g) => ({ grant: g, kase: cases.find((c) => c.id === g.caseId) }))
    .filter((e): e is { grant: EffectiveGrant; kase: DirectoryCase } => Boolean(e.kase))
    .sort((a, b) => a.kase.title.localeCompare(b.kase.title));
  const requestedGrants = pending.filter(
    (r) => r.kind === "grant-person" && r.personId === person.id && !grants.some((g) => g.kase.id === r.caseId),
  );
  const removeCase = removeCaseId ? cases.find((c) => c.id === removeCaseId) : null;
  const signLaterCase = signLaterCaseId ? cases.find((c) => c.id === signLaterCaseId) : null;

  function pendingRemoval(caseId: string) {
    return pending.find((r) => r.kind === "remove-person" && r.personId === person.id && r.caseId === caseId);
  }

  function startRemove(entry: { grant: EffectiveGrant; kase: DirectoryCase }) {
    setNote(null);
    if (entry.kase.viewer.kind === "office") {
      setSignLaterCaseId(entry.kase.id);
      return;
    }
    const office = entry.grant.sources.filter((s) => s.kind !== "vakalatnama");
    /* A lone direct grant is a plain Remove: gone, nothing else moves. */
    if (office.length === 1 && office[0].kind === "direct" && entry.grant.accessType === "office") {
      directory.removeDirect(person.id, entry.kase.id);
      setNote(copy.removedDirect(name, entry.kase.title));
      return;
    }
    setRemoveCaseId(entry.kase.id);
  }

  return (
    <aside
      className="@container/panel fixed inset-0 z-40 flex h-full w-full shrink-0 flex-col bg-surface md:static md:z-auto"
      aria-label={person.name}
    >
      <div className="relative flex items-start gap-3 border-b border-hairline p-4">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-brand-muted text-body-compact font-medium text-brand-muted-foreground">
            {initials(person.name)}
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

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {note ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-success bg-success-muted px-3 py-2 text-body-compact font-medium text-success-muted-foreground">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{note}</span>
          </p>
        ) : null}

        {/* ------------------------------------------------------- groups */}
        <section className="flex flex-col gap-2">
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

        {/* -------------------------------------------------------- cases */}
        <section className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
            <h3 className="text-body-compact font-semibold">
              {copy.panelCases}{" "}
              <span className="font-normal text-muted-foreground tabular-nums">{grants.length}</span>
            </h3>
            <Button type="button" variant="ghost" size="sm" data-icon="inline-start" onClick={() => setPickerOpen(true)}>
              <PlusIcon aria-hidden />
              {copy.addToCases}
            </Button>
          </div>

          {grants.length === 0 && requestedGrants.length === 0 ? (
            <p className="py-4 text-caption text-pretty text-muted-foreground">{copy.noCasesYet}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {grants.map((entry) => {
                const { grant, kase } = entry;
                const won = grant.accessType === "vakalatnama";
                const pendingReq = pendingRemoval(kase.id);
                return (
                  <li key={kase.id} className="@container/row flex flex-col gap-2 py-3 @sm/row:flex-row @sm/row:items-start">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="text-body-compact font-medium text-pretty">{kase.title}</p>
                      <p className="text-caption text-muted-foreground tabular-nums">{kase.caseNumber}</p>
                      <p className="text-caption">
                        {grant.sources.map((source, index) => {
                          const grayed = won && source.kind !== "vakalatnama";
                          return (
                            <span key={index} className={cn(grayed ? "text-muted-foreground" : "text-foreground")}>
                              {index > 0 ? " · " : null}
                              {sourceLabel(source, groups)}
                              {grayed ? `, ${copy.addedThroughVakalatnama}` : null}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1 @sm/row:justify-end">
                      <span className="px-2 text-caption text-muted-foreground">
                        {won ? copy.accessVakalatnama : copy.accessOffice}
                      </span>
                      {pendingReq ? (
                        <span className="inline-flex items-center gap-1 px-2 text-caption text-muted-foreground">
                          <HourglassIcon className="size-3.5" aria-hidden />
                          {copy.removalRequested(displayName(pendingReq.holder))}
                        </span>
                      ) : (
                        /* Quiet at rest: twelve red marks in one panel would be
                           alarm fatigue. It turns destructive on hover and focus. */
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:bg-destructive-muted hover:text-destructive-muted-foreground focus-visible:text-destructive-muted-foreground"
                          onClick={() => startRemove(entry)}
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
              })}
              {requestedGrants.map((r) => {
                const kase = cases.find((c) => c.id === r.caseId);
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
        </section>
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

      {/* The viewer holds only office access here: the removal is authored
          in full and waits for the vakalatnama holder's signature. */}
      {signLaterCase && signLaterCase.viewer.kind === "office" ? (
        <RemoveAdvocateDialog
          open
          onOpenChange={(next) => {
            if (!next) setSignLaterCaseId(null);
          }}
          advocateName={person.name}
          partyName={
            signLaterCase.side === "complainant"
              ? signLaterCase.parties.complainant.name
              : signLaterCase.parties.accused.name
          }
          caseRef={{ title: signLaterCase.title, caseNumber: signLaterCase.caseNumber, court: signLaterCase.court }}
          signLater={{
            holder: displayName(signLaterCase.viewer.via),
            onSignLater: () => {
              requestRemoval(person.id, signLaterCase.id);
              signLater({
                kind: "remove",
                personName: person.name,
                kase: signLaterCase,
                holder: signLaterCase.viewer.kind === "office" ? signLaterCase.viewer.via : "",
              });
            },
          }}
        />
      ) : null}

      <CasePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        subject={name}
        forGroup={false}
        alreadyHas={[...grants.map((g) => g.kase.id), ...requestedGrants.map((r) => r.caseId)]}
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
