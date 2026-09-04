"use client";

import * as React from "react";
import { CheckCircle2Icon, HourglassIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { directoryCopy as copy } from "@/components/directory/copy";
import { useDirectory } from "@/lib/directory/store";
import { displayName } from "@/lib/directory/derive";
import type { DirectoryCase } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * Multi-select the firm's cases for a group or a person. One picker, both
 * doors: assigning a group fans office access out to every member; adding
 * cases for one person is a direct grant. Cases the viewer holds by office
 * access alone are pickable but say so: those go to the vakalatnama holder
 * to sign, and the done stage says which.
 */

export type PickResult = {
  granted: DirectoryCase[];
  sentToSign: Array<{ kase: DirectoryCase; holder: string }>;
  /** How many people the grant reached (a group's members; 1 for a person). */
  people: number;
};

export function CasePickerDialog({
  open,
  onOpenChange,
  subject,
  forGroup,
  alreadyHas,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The group's name, or the person's display name. */
  subject: string;
  forGroup: boolean;
  /** Cases the subject already reaches; shown checked and locked. */
  alreadyHas: string[];
  onConfirm: (caseIds: string[]) => PickResult;
}) {
  const { cases } = useDirectory();
  const [picked, setPicked] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<PickResult | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPicked([]);
      setQuery("");
      setResult(null);
    }
    onOpenChange(next);
  }

  const q = query.trim().toLowerCase();
  const visible = cases.filter(
    (c) => !q || c.title.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {result ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full",
                    result.granted.length
                      ? "bg-success-muted text-success-muted-foreground"
                      : "bg-info-muted text-info-muted-foreground",
                  )}
                >
                  {result.granted.length ? (
                    <CheckCircle2Icon className="size-7" aria-hidden />
                  ) : (
                    <HourglassIcon className="size-7" aria-hidden />
                  )}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">
                    {copy.assignedTitle(subject, result.granted.length)}
                  </DialogTitle>
                  <DialogDescription className="text-pretty">
                    {result.granted.length
                      ? forGroup
                        ? copy.assignedPeople(result.people, result.granted.length)
                        : copy.assignedPersonLine(subject, result.granted.length)
                      : copy.nothingGranted}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {result.granted.length ? (
                <ul className="flex flex-col divide-y divide-hairline">
                  {result.granted.map((c) => (
                    <li key={c.id} className="flex flex-col gap-0.5 py-2.5">
                      <span className="text-body-compact font-medium">{c.title}</span>
                      <span className="text-caption text-muted-foreground tabular-nums">
                        {c.caseNumber}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.sentToSign.length ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-surface-sunken px-4 py-3 text-body-compact">
                  <HourglassIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-pretty">
                    {copy.sentToSign(
                      displayName(result.sentToSign[0].holder),
                      result.sentToSign.map((s) => s.kase.title).join(" · "),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
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
                {copy.pickCasesTitle(subject)}
              </DialogTitle>
              <DialogDescription className="text-pretty">
                {forGroup ? copy.pickCasesBody : copy.pickCasesBodyPerson}
              </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
              <Field>
                <FieldLabel>{copy.pickCasesSearch}</FieldLabel>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    className="pl-9"
                    placeholder={copy.pickCasesSearchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </Field>

              <ul className="min-h-0 flex-1 overflow-y-auto divide-y divide-hairline" aria-label={copy.pickCasesSearch}>
                {visible.map((c) => {
                  const locked = alreadyHas.includes(c.id);
                  const checked = locked || picked.includes(c.id);
                  const office = c.viewer.kind === "office";
                  const id = `pick-${c.id}`;
                  return (
                    <li key={c.id}>
                      <label
                        htmlFor={id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent",
                          locked && "cursor-default hover:bg-transparent",
                        )}
                      >
                        <Checkbox
                          id={id}
                          className="mt-0.5"
                          checked={checked}
                          disabled={locked}
                          onCheckedChange={(value) =>
                            setPicked((cur) =>
                              value === true ? [...cur, c.id] : cur.filter((x) => x !== c.id),
                            )
                          }
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className={cn("text-body-compact font-medium", locked && "text-muted-foreground")}>
                            {c.title}
                          </span>
                          <span className="text-caption text-muted-foreground tabular-nums">
                            {c.caseNumber}
                            {locked ? <> · {copy.alreadyHas}</> : null}
                            {!locked && office && c.viewer.kind === "office" ? (
                              <> · {copy.needsSignature(displayName(c.viewer.via))}</>
                            ) : null}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.cancel}
              </Button>
              <Button
                type="button"
                disabled={picked.length === 0}
                onClick={() => setResult(onConfirm(picked))}
              >
                {copy.addCases(picked.length)}
              </Button>
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
