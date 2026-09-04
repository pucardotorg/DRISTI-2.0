"use client";

import * as React from "react";
import { CheckCircle2Icon, FileUpIcon, UserPlusIcon, XIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
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
import { initials } from "@/components/access/access-list";
import { directoryCopy as copy } from "@/components/directory/copy";
import { KNOWN_ACCOUNTS, partyByPhone } from "@/lib/directory/cases";
import { displayName, displayToday, formatPhone } from "@/lib/directory/derive";
import { BAR_ID_PATTERN, isValidMobile } from "@/lib/directory/import";
import { useDirectory } from "@/lib/directory/store";
import type { Person } from "@/lib/directory/types";
import { cn } from "@/lib/utils";

/**
 * Add people: the two doors, then the by-hand flow. The list door hands off
 * to the import wizard. By hand is one input that morphs: a number resolves
 * against DRISTI on the tenth digit; a known number chips at once, an
 * unknown one asks for the name, then a Bar ID if they are an advocate.
 * Nothing is sent until Add; chips never claim "invited". The done stage
 * nudges the new people into a group so they do not land loose.
 */

type Chip = { phone: string; name: string; barId?: string; linked: boolean };
type Morph = { phone: string; step: "name" | "barId"; name?: string };

export function AddPeopleDialog({
  open,
  onOpenChange,
  onUpload,
  onGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: () => void;
  onGroup: (personIds: string[]) => void;
}) {
  const { people, cases, addPeople } = useDirectory();
  const [stage, setStage] = React.useState<"choose" | "manual" | "done">("choose");
  const [chips, setChips] = React.useState<Chip[]>([]);
  const [input, setInput] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [morph, setMorph] = React.useState<Morph | null>(null);
  const [text, setText] = React.useState("");
  const [added, setAdded] = React.useState<Person[]>([]);

  function reset() {
    setStage("choose");
    setChips([]);
    setInput("");
    setError(null);
    setMorph(null);
    setText("");
    setAdded([]);
  }
  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const valid = isValidMobile(input);
  const known = valid ? KNOWN_ACCOUNTS[input] : undefined;
  const inOffice = valid ? people.find((p) => p.phone === input) : undefined;
  const party = valid ? partyByPhone(input, cases) : null;
  const stacked = valid ? chips.some((c) => c.phone === input) : false;
  const blocked = party
    ? copy.phoneParty(party.party, cases.find((c) => c.id === party.caseId)?.title ?? "a case")
    : inOffice
      ? `${displayName(inOffice.name)} is already in your office.`
      : stacked
        ? copy.phoneDuplicate
        : null;

  function pickNumber() {
    if (!valid) {
      setError(copy.phoneError);
      return;
    }
    if (blocked) {
      setError(blocked);
      return;
    }
    if (known) {
      setChips((cur) => [...cur, { phone: input, name: known.name, barId: known.barId, linked: true }]);
      setInput("");
      return;
    }
    setMorph({ phone: input, step: "name" });
    setInput("");
    setText("");
  }

  function commitMorph(skipBar = false) {
    if (!morph) return;
    if (morph.step === "name") {
      if (!text.trim()) {
        setError("Give their name.");
        return;
      }
      setMorph({ ...morph, step: "barId", name: text.trim() });
      setText("");
      setError(null);
      return;
    }
    const barId = skipBar ? "" : text.trim();
    if (barId && !BAR_ID_PATTERN.test(barId)) {
      setError(copy.barIdError);
      return;
    }
    const name = barId && !/^adv\./i.test(morph.name ?? "") ? `Adv. ${morph.name}` : (morph.name ?? "");
    setChips((cur) => [...cur, { phone: morph.phone, name, barId: barId || undefined, linked: false }]);
    setMorph(null);
    setText("");
    setError(null);
  }

  function submit() {
    if (!chips.length) {
      setError(copy.phoneError);
      return;
    }
    const today = displayToday();
    const fresh: Person[] = chips.map((c) => ({
      id: `p-${c.phone}`,
      name: c.name,
      phone: c.phone,
      barId: c.barId,
      status: c.linked ? "registered" : "invited",
      addedOn: today,
    }));
    addPeople(fresh);
    setAdded(fresh);
    setStage("done");
  }

  const invited = added.filter((p) => p.status === "invited").length;
  const linked = added.length - invited;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {stage === "done" ? (
          <>
            <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
                  <CheckCircle2Icon className="size-7" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <DialogTitle className="text-title-s font-semibold text-balance">{copy.addedTitle(added.length)}</DialogTitle>
                  <DialogDescription className="text-pretty">{copy.addedBody(invited, linked)}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {copy.notNow}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const ids = added.map((p) => p.id);
                  reset();
                  onGroup(ids);
                }}
              >
                {copy.groupThemNow}
              </Button>
            </footer>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
              <DialogTitle className="text-title-s font-semibold text-balance">
                {stage === "choose" ? copy.addTitle : copy.manualTitle}
              </DialogTitle>
              <DialogDescription className="text-pretty">
                {stage === "choose" ? copy.addBody : copy.manualBody}
              </DialogDescription>
            </DialogHeader>

            {/* The by-hand body keeps room for the number's dropdown so it
                never has to be scrolled into view. */}
            <div className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5", stage === "manual" && "min-h-80")}>
              {stage === "choose" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DoorButton
                    icon={<UserPlusIcon className="size-5" aria-hidden />}
                    title={copy.chooseManual}
                    body={copy.chooseManualBody}
                    onClick={() => setStage("manual")}
                  />
                  <DoorButton
                    icon={<FileUpIcon className="size-5" aria-hidden />}
                    title={copy.chooseUpload}
                    body={copy.chooseUploadBody}
                    onClick={() => {
                      reset();
                      onUpload();
                    }}
                  />
                </div>
              ) : (
                <>
                  {chips.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((chip) => (
                        <span
                          key={chip.phone}
                          className="inline-flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2.5 text-caption text-foreground"
                        >
                          <span className="flex flex-col">
                            <span className="font-medium">{displayName(chip.name)}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {formatPhone(chip.phone)}
                              {chip.barId ? ` · ${chip.barId}` : null}
                              {chip.linked ? ` · ${copy.linked}` : null}
                            </span>
                          </span>
                          <button
                            type="button"
                            aria-label={`${copy.removeChip} ${displayName(chip.name)}`}
                            className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                            onClick={() => setChips((cur) => cur.filter((c) => c.phone !== chip.phone))}
                          >
                            <XIcon className="size-3.5" aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {morph ? (
                    /* An unknown number: the number moves into its own
                       read-only box and the field asks for the name, then a
                       Bar ID. Each value gets its own box, so the boundary
                       between them is visible (owner, Sept 4). */
                    <div className="flex flex-col gap-4">
                      <Field>
                        <FieldLabel htmlFor="add-morph-number">{copy.phoneLabel}</FieldLabel>
                        <Input id="add-morph-number" readOnly value={formatPhone(morph.phone)} className="tabular-nums" />
                      </Field>
                      {morph.step === "barId" ? (
                        <Field>
                          <FieldLabel htmlFor="add-morph-name">{copy.nameLabel}</FieldLabel>
                          <Input id="add-morph-name" readOnly value={morph.name ?? ""} />
                        </Field>
                      ) : null}
                      <Field data-invalid={Boolean(error)}>
                        <FieldLabel htmlFor="add-morph">
                          {morph.step === "name" ? copy.nameLabel : copy.barIdLabel}
                        </FieldLabel>
                        <div className="flex items-start gap-2">
                          <Input
                            id="add-morph"
                            autoFocus
                            className="flex-1"
                            value={text}
                            placeholder={morph.step === "name" ? copy.namePlaceholder : copy.barIdPlaceholder}
                            onChange={(e) => {
                              setText(e.target.value);
                              setError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitMorph();
                              }
                            }}
                          />
                          {morph.step === "barId" ? (
                            <Button type="button" variant="outline" onClick={() => commitMorph(true)}>
                              {copy.skip}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={copy.cancel}
                              onClick={() => {
                                setMorph(null);
                                setText("");
                                setError(null);
                              }}
                            >
                              <XIcon aria-hidden />
                            </Button>
                          )}
                          <Button type="button" onClick={() => commitMorph()}>
                            {morph.step === "name" ? copy.addName : copy.addPerson}
                          </Button>
                        </div>
                        <FieldError>{error}</FieldError>
                      </Field>
                    </div>
                  ) : (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel htmlFor="add-phone">{copy.phoneLabel}</FieldLabel>
                      <div className="relative">
                        <Input
                          id="add-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="off"
                          autoFocus
                          maxLength={10}
                          placeholder={copy.phonePlaceholder}
                          value={input}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          onChange={(e) => {
                            setInput(e.target.value.replace(/\D/g, "").slice(0, 10));
                            setError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              pickNumber();
                            }
                          }}
                        />
                        {valid && focused && !blocked ? (
                          <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay">
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickNumber();
                              }}
                            >
                              <Avatar className="size-8 shrink-0">
                                <AvatarFallback className="text-caption font-medium">
                                  {known ? initials(known.name) : "#"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-body-compact font-medium">
                                  {known ? displayName(known.name) : `+91 ${formatPhone(input)}`}
                                </span>
                                <span className="truncate text-caption text-muted-foreground tabular-nums">
                                  {known ? `${formatPhone(input)} · ${copy.linked}` : copy.willInvite}
                                </span>
                              </span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <FieldError>{error}</FieldError>
                      {blocked && valid ? <Banner variant="warning">{blocked}</Banner> : null}
                    </Field>
                  )}
                </>
              )}
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              {stage === "manual" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setStage("choose")}>
                    {copy.back}
                  </Button>
                  <Button type="button" disabled={chips.length === 0 || Boolean(morph)} onClick={submit}>
                    {copy.addThese(chips.length)}
                  </Button>
                </>
              ) : (
                <>
                  <span aria-hidden className="hidden sm:block" />
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    {copy.cancel}
                  </Button>
                </>
              )}
            </footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DoorButton({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-xl border border-hairline bg-card p-6 text-left shadow-raised transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-muted text-brand-muted-foreground">
        {icon}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-body font-semibold">{title}</span>
        <span className="text-caption text-pretty text-muted-foreground">{body}</span>
      </span>
    </button>
  );
}
