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
import { RemoveAdvocateDialog } from "@/components/cases/remove-advocate-dialog";
import { directoryCopy as copy } from "@/components/directory/copy";
import { displayName, effectiveGrants, removalPreview } from "@/lib/directory/derive";
import { useDirectory } from "@/lib/directory/store";
import type { DirectoryCase, GrantSource, Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * The two-choice removal modal, the heart of the interaction. Removal acts
 * on a SOURCE. For a group-sourced case the honest choices are to take the
 * person out of the group (they lose every case it grants, named here) or
 * to take the case out of the group (everyone in it loses the case). There
 * is deliberately no "only this case for only this person": that is what
 * breeds exceptions. A direct grant is one plain option. A vakalatnama is
 * the court's lane and gets its own door into the existing court flow.
 */

type Choice =
  | { kind: "leave-group"; groupId: string }
  | { kind: "drop-case"; groupId: string }
  | { kind: "drop-direct" };

function choiceKey(c: Choice): string {
  return c.kind === "drop-direct" ? "direct" : `${c.kind}:${c.groupId}`;
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
  const [picked, setPicked] = React.useState<string>("");
  const [done, setDone] = React.useState<{ note: string; still: string | null; hint: boolean } | null>(null);
  const [vakalatOpen, setVakalatOpen] = React.useState(false);

  const name = displayName(person.name);
  const grant = effectiveGrants(person, directory).find((g) => g.caseId === kase.id);
  const officeSources = (grant?.sources ?? []).filter((s) => s.kind !== "vakalatnama");
  const hasVakalatnama = Boolean(grant?.sources.some((s) => s.kind === "vakalatnama"));
  const groupSources = officeSources.filter((s): s is Extract<GrantSource, { kind: "group" }> => s.kind === "group");
  const groupNames = groupSources
    .map((s) => groups.find((g) => g.id === s.groupId)?.name)
    .filter((n): n is string => Boolean(n));

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPicked("");
      setDone(null);
    }
    onOpenChange(next);
  }

  /** The choices this case offers, built from its office sources. */
  const choices: Array<{ choice: Choice; label: string; detail: React.ReactNode }> = [];
  for (const source of groupSources) {
    const group = groups.find((g) => g.id === source.groupId);
    if (!group) continue;
    const preview = removalPreview(person, kase.id, group, directory);
    choices.push({
      choice: { kind: "leave-group", groupId: group.id },
      label: copy.optionLeaveGroup(name, group.name),
      detail: (
        <>
          {copy.optionLeaveGroupDetail(preview.otherCases.length)}
          {preview.otherCases.length ? (
            <FoldedCases cases={preview.otherCases.map((c) => c.title)} />
          ) : null}
        </>
      ),
    });
    /* A group that covers only this one case collapses to the single
       choice: removing the case from the group and removing the person
       from the group are the same act for them (PRD 2 §4.2). */
    if (preview.otherCases.length > 0) {
      choices.push({
        choice: { kind: "drop-case", groupId: group.id },
        label: copy.optionDropCase(group.name),
        detail: copy.optionDropCaseDetail(preview.membersAffected),
      });
    }
  }
  const direct = officeSources.find((s): s is Extract<GrantSource, { kind: "direct" }> => s.kind === "direct");
  if (direct) {
    choices.push({
      choice: { kind: "drop-direct" },
      label: direct.addedBy ? copy.optionDropDirectBy(displayName(direct.addedBy)) : copy.optionDropDirect,
      detail: copy.optionDropDirectDetail,
    });
  }

  function apply() {
    const entry = choices.find((c) => choiceKey(c.choice) === picked);
    if (!entry) return;
    const { choice } = entry;
    let note = "";
    let hint = false;
    const remaining: GrantSource[] = [];
    if (choice.kind === "leave-group") {
      const group = groups.find((g) => g.id === choice.groupId);
      removeMember(choice.groupId, person.id);
      note = copy.removedFromGroup(name, group?.name ?? "the group");
      hint = (group?.caseIds.length ?? 0) > 1;
      remaining.push(...(grant?.sources ?? []).filter((s) => !(s.kind === "group" && s.groupId === choice.groupId)));
    } else if (choice.kind === "drop-case") {
      const group = groups.find((g) => g.id === choice.groupId);
      removeCaseFromGroup(choice.groupId, kase.id);
      note = copy.removedCaseFromGroup(kase.title, group?.name ?? "the group");
      remaining.push(...(grant?.sources ?? []).filter((s) => !(s.kind === "group" && s.groupId === choice.groupId)));
    } else {
      removeDirect(person.id, kase.id);
      note = copy.removedDirect(name, kase.title);
      remaining.push(...(grant?.sources ?? []).filter((s) => s.kind !== "direct"));
    }
    let still: string | null = null;
    if (remaining.some((s) => s.kind === "vakalatnama")) {
      still = copy.stillThroughVakalatnama(name);
    } else {
      const other = remaining.find((s): s is Extract<GrantSource, { kind: "group" }> => s.kind === "group");
      if (other) {
        const g = groups.find((x) => x.id === other.groupId);
        if (g) still = copy.stillThroughGroup(name, g.name);
      }
    }
    onRemoved?.(note);
    setDone({ note, still, hint });
  }

  return (
    <>
      <Dialog open={open && !vakalatOpen} onOpenChange={handleOpenChange}>
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
                  {groupNames.length === 1
                    ? copy.reachesThrough(name, groupNames[0])
                    : groupNames.length > 1
                      ? copy.reachesThroughMany(name, groupNames.join(" and "))
                      : hasVakalatnama && !officeSources.length
                        ? copy.vakalatnamaNote(name)
                        : null}
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                {choices.length ? (
                  <RadioGroup value={picked} onValueChange={setPicked} className="gap-2">
                    {choices.map((entry) => {
                      const key = choiceKey(entry.choice);
                      return (
                        <label
                          key={key}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent",
                            picked === key && "bg-accent-strong",
                          )}
                        >
                          <RadioGroupItem value={key} className="mt-0.5" />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-body-compact font-medium">{entry.label}</span>
                            <span className="text-caption text-pretty text-muted-foreground">{entry.detail}</span>
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                ) : null}

                {hasVakalatnama ? (
                  <div className="flex flex-col gap-3 rounded-lg bg-surface-sunken px-4 py-3">
                    <p className="text-body-compact text-pretty">
                      {officeSources.length ? copy.stillThroughVakalatnama(name) : null}{" "}
                      {officeSources.length ? copy.vakalatnamaNote(name) : null}
                    </p>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setVakalatOpen(true)}>
                        {copy.removeFromVakalatnama}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  {copy.cancel}
                </Button>
                {choices.length ? (
                  <Button type="button" variant="destructive-solid" disabled={!picked} onClick={apply}>
                    {copy.continue}
                  </Button>
                ) : null}
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* The court's lane: the Parties tab's own removal dialog, unchanged. */}
      {vakalatOpen ? (
        <RemoveAdvocateDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setVakalatOpen(false);
              handleOpenChange(false);
            }
          }}
          advocateName={person.name}
          partyName={kase.side === "complainant" ? kase.parties.complainant.name : kase.parties.accused.name}
          caseRef={{ title: kase.title, caseNumber: kase.caseNumber, court: kase.court }}
          onRequested={() => onRemoved?.(copy.removalRequested("their decision"))}
        />
      ) : null}
    </>
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
