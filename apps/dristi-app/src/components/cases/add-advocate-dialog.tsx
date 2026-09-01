"use client";

/**
 * Add advocates — scenario 1 of the party-actions spec: an advocate already
 * on the case brings colleagues onto it. A **system action**: the
 * vakalatnama the parties sign is the authority, so there is no approval
 * step and the review says so.
 *
 * **Composed in the owner's dialog grammar** (join-case dialog, share
 * dialog), after the first cut aped the witness dialog's oversized case-
 * screen style and was rejected (Sept 1): sm:max-w-xl, hairline header with
 * a title-s heading, sections as semibold field labels on the body fill
 * (no nested cards), people as compact chips, uploads as DocumentSlot,
 * plain hairline footer (never the bg-muted DialogFooter primitive).
 *
 * **One flow = one vakalatnama.** A single vakalatnama can name several
 * advocates for the same parties, so the dialog stacks advocates as chips
 * over ONE party set and ONE upload. Advocates for different parties are a
 * second deed, so a second pass; that scoping is what keeps the
 * advocate-to-party mapping honest with no per-row matching UI.
 *
 * **Own side only.** The party choices are the signed-in advocate's own
 * clients; you cannot put an advocate on record for the opposing party.
 *
 * The lookup resolves registered advocates on the tenth digit, the share
 * dialog's gesture. An unknown number is an invite, not a dead end: their
 * name is asked for right at the input (once, before the chip stacks) and
 * they register when they join.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { FileTextIcon, XIcon } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentSlot } from "@/components/ui/document-slot";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { initials } from "@/components/access/access-list";
import { FlowStepper } from "@/components/cases/flow-stepper";
import {
  ADVOCATE_DEMO_NUMBERS,
  ADVOCATE_LOOKUP,
  PARTY_SIDE_LABEL,
  formatAdvocatePhone,
  type PartyOption,
} from "@/lib/cases/party-actions";

type AdvocateStep = 1 | 2 | 3;

const STEPS = [
  {
    step: 1,
    title: "Advocates and parties",
    description:
      "Find the advocates by mobile number and pick which of your parties they will represent.",
  },
  {
    step: 2,
    title: "Vakalatnama",
    description:
      "Advocates are added on the strength of one vakalatnama signed by the parties they represent.",
  },
  {
    step: 3,
    title: "Review",
    description:
      "No approval is needed. The advocates can act on this case as soon as the vakalatnama is on record.",
  },
] as const;

/** `barId` absent = not on DRISTI yet; the name is typed, not resolved. */
type SelectedAdvocate = { phone: string; name: string; barId?: string };

type Errors = {
  advocates?: string;
  parties?: string;
  vakalatnama?: string;
};

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AddAdvocateDialog({
  open,
  onOpenChange,
  litigants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The viewer's own clients only; never the opposing side. */
  litigants: PartyOption[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inviteNameRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<AdvocateStep>(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [chips, setChips] = useState<SelectedAdvocate[]>([]);
  /** The unregistered number whose name is being asked for, pre-chip. */
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [partyIds, setPartyIds] = useState<string[]>([]);
  const [vakalatFile, setVakalatFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  const current = STEPS.find((item) => item.step === step) ?? STEPS[0];
  const isDirty = useMemo(
    () =>
      Boolean(
        phoneInput ||
          chips.length > 0 ||
          pendingInvite ||
          partyIds.length > 0 ||
          vakalatFile
      ),
    [phoneInput, chips, pendingInvite, partyIds, vakalatFile]
  );

  const inputValid = /^\d{10}$/.test(phoneInput);
  const alreadyStacked = chips.some((chip) => chip.phone === phoneInput);
  const lookup =
    inputValid && !alreadyStacked ? (ADVOCATE_LOOKUP[phoneInput] ?? null) : null;

  useEffect(() => {
    if (pendingInvite) inviteNameRef.current?.focus();
  }, [pendingInvite]);

  function resetForm() {
    setStep(1);
    setPhoneInput("");
    setChips([]);
    setPendingInvite(null);
    setInviteName("");
    setPartyIds([]);
    setVakalatFile(null);
    setErrors({});
    setExitConfirmationOpen(false);
  }

  function closeClean() {
    resetForm();
    onOpenChange(false);
  }

  function requestExit() {
    if (isDirty) {
      setExitConfirmationOpen(true);
      return;
    }
    closeClean();
  }

  function stack(chip: SelectedAdvocate) {
    setChips((existing) =>
      existing.some((c) => c.phone === chip.phone) ? existing : [...existing, chip]
    );
    setErrors((c) => ({ ...c, advocates: undefined }));
  }

  /** The one gesture on a resolved number: chip it, or open the name ask. */
  function takeCandidate() {
    if (!inputValid || alreadyStacked) return;
    if (lookup) {
      stack({ phone: phoneInput, ...lookup });
    } else {
      setPendingInvite(phoneInput);
      setInviteName("");
    }
    setPhoneInput("");
  }

  function commitInvite() {
    if (!pendingInvite) return;
    if (!inviteName.trim()) {
      setErrors((c) => ({ ...c, advocates: "Enter the advocate's name." }));
      inviteNameRef.current?.focus();
      return;
    }
    stack({ phone: pendingInvite, name: inviteName.trim() });
    setPendingInvite(null);
    setInviteName("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      // A half-finished invite with a name counts; without one it blocks.
      if (pendingInvite) {
        if (!inviteName.trim()) {
          setErrors((c) => ({ ...c, advocates: "Enter the advocate's name." }));
          inviteNameRef.current?.focus();
          return;
        }
        commitInvite();
      }
      const stacked = pendingInvite && inviteName.trim() ? chips.length + 1 : chips.length;
      const next: Errors = {};
      if (stacked === 0) {
        next.advocates = "Add at least one advocate by their mobile number.";
      }
      if (partyIds.length === 0) {
        next.parties = "Pick at least one party for the advocates to represent.";
      }
      setErrors(next);
      if (next.advocates || next.parties) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!vakalatFile) {
        setErrors((c) => ({
          ...c,
          vakalatnama: "Upload the signed vakalatnama to continue.",
        }));
        return;
      }
      setStep(3);
    }
  }

  const chosenParties = litigants.filter((party) => partyIds.includes(party.id));
  const advocateNames = chips.map((chip) => chip.name);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else requestExit();
        }}
      >
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 gap-4 border-b border-hairline px-6 py-5 pr-14 text-left">
            <FlowStepper
              steps={STEPS}
              current={step}
              label="Add advocates progress"
            />
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-title-s font-semibold text-balance">
                {current.title}
              </DialogTitle>
              <DialogDescription className="text-pretty">
                {current.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <form
              id="add-advocates-form"
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
            >
              {step === 1 ? (
                <>
                  <Field data-invalid={Boolean(errors.advocates)}>
                    <FieldLabel
                      className="block w-full text-body font-semibold leading-snug"
                      htmlFor="advocate-phone"
                    >
                      Advocates
                    </FieldLabel>
                    <FieldDescription>
                      Everyone added here goes on the same vakalatnama.
                    </FieldDescription>

                    {chips.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <span
                            key={chip.phone}
                            className="inline-flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2.5 text-caption text-foreground"
                          >
                            <span className="flex flex-col">
                              <span className="font-medium">{chip.name}</span>
                              <span className="text-muted-foreground tabular-nums">
                                {formatAdvocatePhone(chip.phone)}
                                {chip.barId ? null : " · invited"}
                              </span>
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${chip.name}`}
                              className="flex size-5 items-center justify-center self-start rounded-sm text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setChips((existing) =>
                                  existing.filter((c) => c.phone !== chip.phone)
                                )
                              }
                            >
                              <XIcon className="size-3.5" aria-hidden />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="relative">
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>+91</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id="advocate-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={phoneInput}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          onChange={(event) => {
                            setPhoneInput(
                              event.target.value.replace(/\D/g, "").slice(0, 10)
                            );
                            setErrors((c) => ({ ...c, advocates: undefined }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              takeCandidate();
                            }
                          }}
                        />
                      </InputGroup>

                      {/* The tenth digit resolves against the registry; the
                          dropdown anchors to the input, share-dialog style.
                          A registered advocate chips at once; an unknown
                          number opens the one-time name ask below. */}
                      {inputValid && !alreadyStacked && focused ? (
                        <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay">
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              takeCandidate();
                            }}
                          >
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className="text-caption font-medium">
                                {lookup ? initials(lookup.name) : "#"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-body-compact font-medium">
                                {lookup
                                  ? lookup.name
                                  : `+91 ${formatAdvocatePhone(phoneInput)}`}
                              </span>
                              <span className="truncate text-caption text-muted-foreground">
                                {lookup ? (
                                  <>
                                    <span className="tabular-nums">
                                      {formatAdvocatePhone(phoneInput)}
                                    </span>
                                    {" · Bar ID "}
                                    <span className="font-mono">
                                      {lookup.barId}
                                    </span>
                                  </>
                                ) : (
                                  "Not on DRISTI yet. They'll be asked to register when they join."
                                )}
                              </span>
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {alreadyStacked ? (
                      <FieldDescription>
                        This advocate is already in the list.
                      </FieldDescription>
                    ) : null}

                    {pendingInvite ? (
                      <div className="flex items-start gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Label
                            htmlFor="invite-name"
                            className="text-caption text-muted-foreground"
                          >
                            Name for +91 {formatAdvocatePhone(pendingInvite)}
                          </Label>
                          <Input
                            id="invite-name"
                            ref={inviteNameRef}
                            autoComplete="off"
                            placeholder="Advocate's name"
                            value={inviteName}
                            onChange={(event) => {
                              setInviteName(event.target.value);
                              setErrors((c) => ({
                                ...c,
                                advocates: undefined,
                              }));
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitInvite();
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-5"
                          onClick={commitInvite}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 text-muted-foreground"
                          aria-label="Cancel this invite"
                          onClick={() => {
                            setPendingInvite(null);
                            setInviteName("");
                            setErrors((c) => ({ ...c, advocates: undefined }));
                          }}
                        >
                          <XIcon aria-hidden />
                        </Button>
                      </div>
                    ) : null}

                    <FieldError>{errors.advocates}</FieldError>
                    <p className="text-caption text-muted-foreground tabular-nums">
                      {ADVOCATE_DEMO_NUMBERS}
                    </p>
                  </Field>

                  <Field data-invalid={Boolean(errors.parties)}>
                    <FieldLabel className="block w-full text-body font-semibold leading-snug">
                      Who will they represent?
                    </FieldLabel>
                    <FieldDescription>
                      Your clients on this case. The vakalatnama must be signed
                      by every party picked here.
                    </FieldDescription>
                    <div className="flex flex-col gap-1">
                      {litigants.map((party) => (
                        <div
                          key={party.id}
                          className="flex min-h-10 items-center gap-2"
                        >
                          <Checkbox
                            id={`represent-${party.id}`}
                            checked={partyIds.includes(party.id)}
                            onCheckedChange={() => {
                              setPartyIds((existing) =>
                                existing.includes(party.id)
                                  ? existing.filter((id) => id !== party.id)
                                  : [...existing, party.id]
                              );
                              setErrors((c) => ({ ...c, parties: undefined }));
                            }}
                            aria-invalid={Boolean(errors.parties)}
                          />
                          <Label htmlFor={`represent-${party.id}`}>
                            {party.name}
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {PARTY_SIDE_LABEL[party.side]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FieldError>{errors.parties}</FieldError>
                  </Field>
                </>
              ) : step === 2 ? (
                <Field data-invalid={Boolean(errors.vakalatnama)}>
                  <FieldLabel className="block w-full text-body font-semibold leading-snug">
                    Signed vakalatnama
                  </FieldLabel>
                  <FieldDescription>
                    Executed by {formatNames(chosenParties.map((p) => p.name))}{" "}
                    in favour of {formatNames(advocateNames)}.
                  </FieldDescription>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden="true"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setVakalatFile(file);
                        setErrors((c) => ({ ...c, vakalatnama: undefined }));
                      }
                      event.target.value = "";
                    }}
                  />
                  <DocumentSlot
                    status={vakalatFile ? "filled" : "empty"}
                    media="icon"
                    label="Signed vakalatnama"
                    required
                    filename={vakalatFile?.name}
                    meta={vakalatFile ? fileSize(vakalatFile.size) : undefined}
                    thumbnail={<FileTextIcon className="size-5" aria-hidden />}
                    onChooseFile={() => fileInputRef.current?.click()}
                  />
                  <FieldDescription>
                    Accepts an image or PDF. A vakalatnama can also be prepared
                    and e-signed on DRISTI.
                  </FieldDescription>
                  <FieldError>{errors.vakalatnama}</FieldError>
                </Field>
              ) : (
                <DescriptionList>
                  <ReviewRow term={chips.length === 1 ? "Advocate" : "Advocates"}>
                    <span className="flex flex-col gap-1">
                      {chips.map((chip) => (
                        <span key={chip.phone}>
                          {chip.name}
                          {chip.barId ? (
                            <span className="text-muted-foreground">
                              {" · Bar ID "}
                              <span className="font-mono">{chip.barId}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {" "}
                              (will be asked to register when they join)
                            </span>
                          )}
                        </span>
                      ))}
                    </span>
                  </ReviewRow>
                  <ReviewRow term="Representing">
                    {formatNames(chosenParties.map((p) => p.name))}
                  </ReviewRow>
                  <ReviewRow term="Vakalatnama">
                    {vakalatFile?.name}
                    {vakalatFile ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {fileSize(vakalatFile.size)}
                      </span>
                    ) : null}
                  </ReviewRow>
                </DescriptionList>
              )}
            </form>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as AdvocateStep)}
              >
                Back
              </Button>
            ) : (
              <span aria-hidden className="hidden sm:block" />
            )}
            {step < 3 ? (
              <Button type="submit" form="add-advocates-form">
                Continue
              </Button>
            ) : (
              <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <p
                  id="advocate-save-unavailable"
                  className="text-caption text-muted-foreground sm:text-end"
                >
                  Saving is not connected yet.
                </p>
                <Button
                  type="button"
                  disabled
                  aria-describedby="advocate-save-unavailable"
                >
                  {chips.length === 1 ? "Add advocate" : "Add advocates"}
                </Button>
              </div>
            )}
          </footer>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={exitConfirmationOpen}
        onOpenChange={setExitConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard advocate draft?</AlertDialogTitle>
            <AlertDialogDescription>
              The details entered here will be lost if you discard this draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid" onClick={closeClean}>
              Discard draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReviewRow({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <DescriptionRow className="grid-cols-1 sm:grid-cols-[minmax(7rem,10rem)_1fr]">
      <DescriptionTerm className="text-body-compact">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body-compact">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** "A", "A and B", "A, B and C" — a list of people reads as a sentence. */
function formatNames(names: string[]): string {
  return new Intl.ListFormat("en-IN", {
    style: "long",
    type: "conjunction",
  }).format(names);
}
