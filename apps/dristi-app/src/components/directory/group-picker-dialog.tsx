"use client";

import * as React from "react";
import { CheckCircle2Icon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { directoryCopy as copy } from "@/components/directory/copy";
import { useDirectory } from "@/lib/directory/store";
import type { Group } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * "Add to group": an existing group, or a new one named right here. Groups
 * are cheap and disposable, so creating one is a name and nothing else. The
 * done stage points at the one thing that comes next: giving the group cases.
 */
export function GroupPickerDialog({
  open,
  onOpenChange,
  personIds,
  onOpenGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personIds: string[];
  /** Jump to the group on the Groups tab. */
  onOpenGroup: (groupId: string) => void;
}) {
  const { groups, createGroup, addMembers } = useDirectory();
  const NEW = "__new__";
  const [choice, setChoice] = React.useState<string>(groups.length ? "" : NEW);
  const [name, setName] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [done, setDone] = React.useState<Group | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setChoice(groups.length ? "" : NEW);
      setName("");
      setTouched(false);
      setDone(null);
    }
    onOpenChange(next);
  }

  const creating = choice === NEW;
  const nameValid = name.trim().length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (creating) {
      if (!nameValid) return;
      setDone(createGroup(name, personIds));
      return;
    }
    const group = groups.find((g) => g.id === choice);
    if (!group) return;
    addMembers(group.id, personIds);
    setDone({ ...group, memberIds: [...new Set([...group.memberIds, ...personIds])] });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        {done ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                  <CheckCircle2Icon className="size-7" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">
                    {copy.addedToGroup(personIds.length, done.name)}
                  </DialogTitle>
                  <DialogDescription className="text-pretty">{copy.addedToGroupNext}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.done}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const id = done.id;
                  handleOpenChange(false);
                  onOpenGroup(id);
                }}
              >
                {copy.openGroup}
              </Button>
            </footer>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-title-s font-semibold text-balance">
                {copy.addToGroupTitle(personIds.length)}
              </DialogTitle>
              <DialogDescription className="text-pretty">{copy.addToGroupBody}</DialogDescription>
            </DialogHeader>

            <form
              id="group-picker-form"
              noValidate
              onSubmit={submit}
              className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5"
            >
              <RadioGroup value={choice} onValueChange={setChoice} className="gap-1">
                {groups.length ? (
                  <p className="text-body font-semibold">{copy.existingGroups}</p>
                ) : null}
                {groups.map((g) => {
                  const already = personIds.filter((id) => g.memberIds.includes(id)).length;
                  return (
                    <label
                      key={g.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent",
                        choice === g.id && "bg-accent-strong",
                      )}
                    >
                      <RadioGroupItem value={g.id} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-body-compact font-medium">{g.name}</span>
                        <span className="text-caption text-muted-foreground tabular-nums">
                          {copy.memberCount(g.memberIds.length)} · {copy.caseCount(g.caseIds.length)}
                          {already ? ` · ${already} already in it` : null}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent",
                    creating && "bg-accent-strong",
                  )}
                >
                  <RadioGroupItem value={NEW} />
                  <span className="flex items-center gap-1.5 text-body-compact font-medium">
                    <PlusIcon className="size-4" aria-hidden />
                    {copy.newGroup}
                  </span>
                </label>
              </RadioGroup>
              {creating ? (
                <Field data-invalid={touched && !nameValid}>
                  <FieldLabel htmlFor="group-name">{copy.groupName}</FieldLabel>
                  <Input
                    id="group-name"
                    autoFocus
                    value={name}
                    placeholder={copy.groupNamePlaceholder}
                    onChange={(e) => {
                      setName(e.target.value);
                      setTouched(false);
                    }}
                  />
                  <FieldError>{touched && !nameValid ? copy.groupNameError : null}</FieldError>
                </Field>
              ) : null}
              {touched && !creating && !choice ? (
                <p className="text-caption text-destructive-ink">{copy.pickGroupError}</p>
              ) : null}
            </form>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.cancel}
              </Button>
              <Button type="submit" form="group-picker-form">
                {creating ? copy.createAndAdd : copy.add}
              </Button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
