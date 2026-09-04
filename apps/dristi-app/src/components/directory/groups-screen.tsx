"use client";

import * as React from "react";
import {
  ChevronRightIcon,
  HourglassIcon,
  MoreHorizontalIcon,
  PlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initials } from "@/components/access/access-list";
import { CasePickerDialog } from "@/components/directory/case-picker-dialog";
import { directoryCopy as copy } from "@/components/directory/copy";
import { PeoplePickerDialog } from "@/components/directory/people-picker-dialog";
import { useSignLater } from "@/components/directory/sign-later";
import { displayName, formatPhone, vakalatnamaCaseIds } from "@/lib/directory/derive";
import { useDirectory } from "@/lib/directory/store";
import type { Group } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The Groups tab: the bulk levers. A group is a named set of people; give
 * it cases and everyone in it has office access. Members and cases are the
 * two things you shape here; removing either is the strongest confirm in
 * the system, with the count named.
 */

const GRID = "grid-cols-[minmax(0,1fr)_5rem_1.5rem] sm:grid-cols-[minmax(0,3fr)_2fr_2fr_1.5rem]";

export function GroupsList({
  openGroupId,
  onOpenGroup,
}: {
  openGroupId: string | null;
  onOpenGroup: (groupId: string) => void;
}) {
  const { groups } = useDirectory();
  if (groups.length === 0) {
    return (
      <Empty className="flex-1 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-body font-semibold">{copy.groupsEmptyTitle}</EmptyTitle>
          <EmptyDescription>{copy.groupsEmptyBody}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <>
      <div aria-hidden className={cn("grid items-center gap-3 border-b border-hairline px-2 pb-2", GRID)}>
        <span className="text-caption font-medium text-muted-foreground">{copy.groupsColumnGroup}</span>
        <span className="hidden text-caption font-medium text-muted-foreground sm:block">{copy.groupsColumnMembers}</span>
        <span className="text-caption font-medium text-muted-foreground">{copy.groupsColumnCases}</span>
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-hairline">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onOpenGroup(g.id)}
              aria-current={g.id === openGroupId || undefined}
              className={cn(
                "grid w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                GRID,
                g.id === openGroupId && "bg-accent-strong",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-body-compact font-medium">{g.name}</span>
                <span className="text-caption text-muted-foreground tabular-nums sm:hidden">
                  {copy.memberCount(g.memberIds.length)}
                </span>
              </span>
              <span className="hidden text-body-compact text-muted-foreground tabular-nums sm:block">
                {copy.memberCount(g.memberIds.length)}
              </span>
              <span className="text-body-compact text-muted-foreground tabular-nums">
                {copy.caseCount(g.caseIds.length)}
              </span>
              <ChevronRightIcon className="size-4 justify-self-end text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function GroupPanel({
  group,
  onClose,
  onOpenPerson,
  onOpenCase,
}: {
  group: Group;
  onClose: () => void;
  onOpenPerson: (personId: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  const directory = useDirectory();
  const { people, cases, pending, renameGroup, deleteGroup, removeMember, removeCaseFromGroup, assignCases } = directory;
  const signLater = useSignLater();
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [casesOpen, setCasesOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(group.name);
  const [confirm, setConfirm] = React.useState<
    | { kind: "member"; personId: string }
    | { kind: "case"; caseId: string }
    | { kind: "delete" }
    | null
  >(null);

  const members = group.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => displayName(a.name).localeCompare(displayName(b.name)));
  const groupCases = group.caseIds
    .map((id) => cases.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const awaiting = pending.filter((r) => r.kind === "assign-group" && r.groupId === group.id);

  const confirmPerson = confirm?.kind === "member" ? people.find((p) => p.id === confirm.personId) : null;
  const confirmCase = confirm?.kind === "case" ? cases.find((c) => c.id === confirm.caseId) : null;

  return (
    <aside
      className="@container/panel fixed inset-0 z-40 flex h-full w-full shrink-0 flex-col bg-surface md:static md:z-auto"
      aria-label={group.name}
    >
      <div className="relative flex items-start gap-3 border-b border-hairline p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-20">
          <h2 className="truncate text-body font-semibold">{group.name}</h2>
          <p className="text-caption text-muted-foreground tabular-nums">
            {copy.memberCount(group.memberIds.length)} · {copy.caseCount(group.caseIds.length)}
          </p>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreHorizontalIcon aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNewName(group.name);
                  setRenaming(true);
                }}
              >
                {copy.rename}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({ kind: "delete" })}>
                {copy.deleteGroup}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={copy.closePanel} onClick={onClose}>
            <XIcon aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/* ------------------------------------------------------- members */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
            <h3 className="text-body-compact font-semibold">
              {copy.groupMembers}{" "}
              <span className="font-normal text-muted-foreground tabular-nums">{members.length}</span>
            </h3>
            <Button type="button" variant="ghost" size="sm" data-icon="inline-start" onClick={() => setMembersOpen(true)}>
              <PlusIcon aria-hidden />
              {copy.addMembers}
            </Button>
          </div>
          {members.length ? (
            <ul className="flex flex-col divide-y divide-hairline">
              {members.map((p) => {
                const onNama = vakalatnamaCaseIds(p, cases);
                const addsNothing =
                  group.caseIds.length > 0 && group.caseIds.every((id) => onNama.includes(id));
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-caption font-medium">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => onOpenPerson(p.id)}
                      className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span className="truncate text-body-compact font-medium hover:underline">{displayName(p.name)}</span>
                      <span className="truncate text-caption text-muted-foreground tabular-nums">
                        {formatPhone(p.phone)}
                        {p.barId ? ` · ${p.barId}` : null}
                        {p.status === "invited" ? ` · ${copy.yetToJoin}` : null}
                      </span>
                      {addsNothing ? (
                        <span className="text-caption text-pretty text-muted-foreground">
                          {copy.groupAddsNothing(displayName(p.name))}
                        </span>
                      ) : null}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={copy.removeMember(displayName(p.name))}
                      onClick={() => setConfirm({ kind: "member", personId: p.id })}
                    >
                      <XIcon aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-caption text-muted-foreground">{copy.noGroupMembers}</p>
          )}
        </section>

        {/* --------------------------------------------------------- cases */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
            <h3 className="text-body-compact font-semibold">
              {copy.groupCases}{" "}
              <span className="font-normal text-muted-foreground tabular-nums">{groupCases.length}</span>
            </h3>
            <Button type="button" variant="ghost" size="sm" data-icon="inline-start" onClick={() => setCasesOpen(true)}>
              <PlusIcon aria-hidden />
              {copy.assignCases}
            </Button>
          </div>
          {groupCases.length || awaiting.length ? (
            <ul className="flex flex-col divide-y divide-hairline">
              {groupCases.map((c) => (
                <li key={c.id} className="@container/row flex flex-col gap-2 py-3 @sm/row:flex-row @sm/row:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-body-compact font-medium text-pretty">{c.title}</p>
                    <p className="text-caption text-muted-foreground tabular-nums">{c.caseNumber}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:bg-destructive-muted hover:text-destructive-muted-foreground focus-visible:text-destructive-muted-foreground"
                      onClick={() => setConfirm({ kind: "case", caseId: c.id })}
                    >
                      {copy.removeCase}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenCase(c.id)}>
                      {copy.openCase}
                    </Button>
                  </div>
                </li>
              ))}
              {awaiting.map((r) => {
                const c = cases.find((x) => x.id === r.caseId);
                if (!c) return null;
                return (
                  <li key={r.id} className="flex flex-col gap-0.5 py-3">
                    <p className="text-body-compact font-medium text-muted-foreground">{c.title}</p>
                    <p className="text-caption text-muted-foreground tabular-nums">{c.caseNumber}</p>
                    <p className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                      <HourglassIcon className="size-3.5" aria-hidden />
                      {copy.awaitingSignature(displayName(r.holder))}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-caption text-muted-foreground">{copy.noGroupCases}</p>
          )}
        </section>
      </div>

      <PeoplePickerDialog open={membersOpen} onOpenChange={setMembersOpen} group={group} />

      <CasePickerDialog
        open={casesOpen}
        onOpenChange={setCasesOpen}
        subject={group.name}
        forGroup
        alreadyHas={[...group.caseIds, ...awaiting.map((r) => r.caseId)]}
        onConfirm={(caseIds) => {
          const result = assignCases(group.id, caseIds);
          for (const { kase, holder } of result.sentToSign) {
            signLater({ kind: "grant-group", groupName: group.name, people: result.people, kase, holder });
          }
          return result;
        }}
      />

      {/* ------------------------------------------------------- rename */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
            <DialogTitle className="text-title-s font-semibold">{copy.rename}</DialogTitle>
          </DialogHeader>
          <form
            id="rename-group"
            noValidate
            className="px-6 py-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              renameGroup(group.id, newName);
              setRenaming(false);
            }}
          >
            <Field data-invalid={!newName.trim()}>
              <FieldLabel htmlFor="rename-group-name">{copy.groupName}</FieldLabel>
              <Input id="rename-group-name" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} />
              <FieldError>{!newName.trim() ? copy.groupNameError : null}</FieldError>
            </Field>
          </form>
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
              {copy.cancel}
            </Button>
            <Button type="submit" form="rename-group">
              {copy.save}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------- confirmations */}
      <AlertDialog open={confirm !== null} onOpenChange={(next) => !next && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete"
                ? copy.deleteGroupTitle(group.name)
                : confirmPerson
                  ? copy.removeMemberTitle(displayName(confirmPerson.name), group.name)
                  : confirmCase
                    ? copy.removeCaseTitle(confirmCase.title, group.name)
                    : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete"
                ? group.caseIds.length
                  ? copy.deleteGroupBody(group.memberIds.length, group.caseIds.length)
                  : copy.deleteGroupEmptyBody
                : confirmPerson
                  ? copy.removeMemberBody(group.caseIds.length)
                  : confirmCase
                    ? copy.removeCaseBody(group.memberIds.length)
                    : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "delete") {
                  deleteGroup(group.id);
                  onClose();
                } else if (confirm.kind === "member") removeMember(group.id, confirm.personId);
                else removeCaseFromGroup(group.id, confirm.caseId);
                setConfirm(null);
              }}
            >
              {confirm?.kind === "delete" ? copy.deleteGroup : copy.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
