"use client";

import * as React from "react";
import { CheckCircle2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { directoryCopy as copy } from "@/components/directory/copy";
import { displayName, effectiveGrants, findCase } from "@/lib/directory/derive";
import { useDirectory } from "@/lib/directory/store";
import type { DirectoryCase, Group, GrantSource, Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The two-choice removal modal, the heart of the interaction. Removal acts
 * on a SOURCE, and either choice takes the person off this case for good:
 *
 * - remove the person from every group that grants it (they lose every
 *   case those groups grant, named here), or
 * - remove the case from every one of those groups (everyone in them loses
 *   the case).
 *
 * When two groups reach the same case the choices span both (owner,
 * Sept 4): offering them one group at a time left the person with the case
 * through the other, which is exactly the confusion the modal exists to
 * prevent. There is deliberately no "only this case for only this person":
 * that breeds exceptions. A direct grant folds into whichever choice is
 * taken. The vakalatnama is the court's lane and has its own tab.
 */

type Choice = "leave" | "drop";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function RemoveAccessDialog({
  open,
  onOpenChange,
  person,
  kase,
  onRemoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  kase: DirectoryCase;
  /** The panel's chance to show the one-line result. */
  onRemoved?: (note: string) => void;
}) {
  const directory = useDirectory();
  const { groups, removeMember, removeCaseFromGroup, removeDirect } = directory;
  const [picked, setPicked] = React.useState<Choice | "">("");
  const [done, setDone] = React.useState<{ note: string; still: string | null; hint: boolean } | null>(null);

  const name = displayName(person.name);
  const grant = effectiveGrants(person, directory).find((g) => g.caseId === kase.id);
  const sources = grant?.sources ?? [];
  const hasVakalatnama = sources.some((s) => s.kind === "vakalatnama");
  const viaGroups = sources
    .filter((s): s is Extract<GrantSource, { kind: "group" }> => s.kind === "group")
    .map((s) => groups.find((g) => g.id === s.groupId))
    .filter((g): g is Group => Boolean(g));
  const direct = sources.find((s): s is Extract<GrantSource, { kind: "direct" }> => s.kind === "direct");
  const groupNames = joinNames(viaGroups.map((g) => g.name));
  const many = viaGroups.length > 1;

  /* The blast radius, by case: every other case any of these groups grants. */
  const otherCases = [...new Set(viaGroups.flatMap((g) => g.caseIds))]
    .filter((id) => id !== kase.id)
    .map((id) => findCase(directory, id))
    .filter((c): c is DirectoryCase => Boolean(c));
  const membersAffected = new Set(viaGroups.flatMap((g) => g.memberIds)).size;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPicked("");
      setDone(null);
    }
    onOpenChange(next);
  }

  const choices: Array<{ key: Choice; label: string; detail: React.ReactNode }> = [];
  if (viaGroups.length) {
    choices.push({
      key: "leave",
      label: direct ? copy.optionLeaveGroupAndDirect(name, groupNames) : copy.optionLeaveGroup(name, groupNames),
      detail: (
        <>
          {copy.optionLeaveGroupDetail(otherCases.length, many)}
          {otherCases.length ? <FoldedCases cases={otherCases.map((c) => c.title)} /> : null}
        </>
      ),
    });
    /* Groups that cover only this one case collapse to the single choice:
       removing the case from them and removing the person from them are the
       same act for this person (PRD 2 §4.2). */
    if (otherCases.length > 0) {
      choices.push({
        key: "drop",
        label: direct ? copy.optionDropCaseAndDirect(groupNames, name) : copy.optionDropCase(groupNames),
        detail: copy.optionDropCaseDetail(membersAffected, many),
      });
    }
  } else if (direct) {
    choices.push({
      key: "leave",
      label: direct.addedBy ? copy.optionDropDirectBy(displayName(direct.addedBy)) : copy.optionDropDirect,
      detail: copy.optionDropDirectDetail,
    });
  }

  function apply() {
    if (!picked) return;
    let note: string;
    let hint = false;
    if (picked === "leave") {
      for (const g of viaGroups) removeMember(g.id, person.id);
      if (direct) removeDirect(person.id, kase.id);
      note = viaGroups.length ? copy.removedFromGroup(name, groupNames) : copy.removedDirect(name, kase.title);
      hint = otherCases.length > 0;
    } else {
      for (const g of viaGroups) removeCaseFromGroup(g.id, kase.id);
      if (direct) removeDirect(person.id, kase.id);
      note = copy.removedCaseFromGroup(kase.title, groupNames);
    }
    const still = hasVakalatnama ? copy.stillThroughVakalatnama(name) : null;
    onRemoved?.(note);
    setDone({ note, still, hint });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {done ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                  <CheckCircle2Icon className="size-7" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">{done.note}</DialogTitle>
                  <DialogDescription className="text-pretty">
                    {done.still ?? (done.hint ? copy.grantBackHint : null)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <footer className="flex shrink-0 justify-end border-t border-hairline px-6 py-4">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {copy.done}
              </Button>
            </footer>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-title-s font-semibold text-balance">
                {copy.removeTitle(name, kase.title)}
              </DialogTitle>
              <DialogDescription className="text-pretty">
                {viaGroups.length === 1
                  ? copy.reachesThrough(name, groupNames)
                  : viaGroups.length > 1
                    ? copy.reachesThroughMany(name, groupNames)
                    : null}
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              <RadioGroup value={picked} onValueChange={(v) => setPicked(v as Choice)} className="gap-2">
                {choices.map((entry) => (
                  <label
                    key={entry.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent",
                      picked === entry.key && "bg-accent-strong",
                    )}
                  >
                    <RadioGroupItem value={entry.key} className="mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-body-compact font-medium">{entry.label}</span>
                      <span className="text-caption text-pretty text-muted-foreground">{entry.detail}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>

              {hasVakalatnama ? (
                <p className="rounded-lg bg-surface-sunken px-4 py-3 text-body-compact text-pretty">
                  {copy.stillThroughVakalatnama(name)}
                </p>
              ) : null}
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.cancel}
              </Button>
              <Button type="button" variant="destructive-solid" disabled={!picked} onClick={apply}>
                {copy.continue}
              </Button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Three case names, then a dotted "+N more" that opens the full list. Never a wall. */
export function FoldedCases({ cases }: { cases: string[] }) {
  const shown = cases.slice(0, 3);
  const rest = cases.slice(3);
  return (
    <span className="mt-1 block text-foreground">
      {shown.join(" · ")}
      {rest.length ? (
        <>
          {" · "}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-sm underline decoration-dotted underline-offset-4 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {copy.moreCases(rest.length)}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <ul className="flex flex-col gap-1 text-body-compact">
                {rest.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </>
      ) : null}
    </span>
  );
}
