"use client";

/**
 * Add an advocate — scenario 1 of the party-actions spec: an advocate already
 * on the case brings a colleague onto it. A **system action**: the
 * vakalatnama the parties sign is the authority, so there is no approval
 * step and the flow says so on review.
 *
 * Deliberately NOT the share dialog. Sharing grants office access (clerks,
 * juniors — no legal standing, instant, revocable); this puts an advocate on
 * the record with the right to act. The two doors stay separate and
 * cross-reference each other instead — the share dialog notices when a typed
 * number belongs to an advocate and points here.
 *
 * The lookup resolves registered advocates only: an advocate joins on their
 * registered identity, not on a name somebody typed. An unknown number gets
 * an explanation, never a free-text name field.
 *
 * Same three-step grammar as the witness dialog on purpose — one Add-people
 * entry, one shape per flow.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { XIcon } from "lucide-react";

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { initials } from "@/components/access/access-list";
import {
  STEPPER_ITEM_CLASS,
  stepStatus,
} from "@/components/cases/add-witness-form";
import { IdUpload } from "@/components/vakalatnama/id-upload";
import {
  ADVOCATE_DEMO_NUMBERS,
  ADVOCATE_LOOKUP,
  PARTY_SIDE_LABEL,
  formatAdvocatePhone,
  type PartyOption,
} from "@/lib/cases/party-actions";

type AdvocateStep = 1 | 2 | 3;

const STEPS: Array<{ step: AdvocateStep; title: string; description: string }> =
  [
    {
      step: 1,
      title: "Advocate and parties",
      description:
        "Find the advocate on DRISTI and pick the parties they will represent.",
    },
    {
      step: 2,
      title: "Vakalatnama",
      description:
        "An advocate is added on the strength of a vakalatnama signed by the parties they represent.",
    },
    {
      step: 3,
      title: "Review",
      description: "Confirm the details before adding the advocate.",
    },
  ];

type SelectedAdvocate = { phone: string; name: string; barId: string };

type Errors = {
  advocate?: string;
  parties?: string;
  vakalatnama?: string;
};

export function AddAdvocateDialog({
  open,
  onOpenChange,
  litigants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litigants: PartyOption[];
}) {
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<AdvocateStep>(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [advocate, setAdvocate] = useState<SelectedAdvocate | null>(null);
  const [partyIds, setPartyIds] = useState<string[]>([]);
  const [vakalatnama, setVakalatnama] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  const currentStep = STEPS.find((item) => item.step === step) ?? STEPS[0];
  const isDirty = useMemo(
    () =>
      Boolean(phoneInput || advocate || partyIds.length > 0 || vakalatnama),
    [phoneInput, advocate, partyIds, vakalatnama]
  );

  const inputValid = /^\d{10}$/.test(phoneInput);
  const lookup = inputValid ? (ADVOCATE_LOOKUP[phoneInput] ?? null) : null;

  function resetForm() {
    setStep(1);
    setPhoneInput("");
    setAdvocate(null);
    setPartyIds([]);
    setVakalatnama("");
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

  useEffect(() => {
    if (!open) return;
    stepHeadingRef.current?.focus();
  }, [open, step]);

  function togglePartyId(id: string) {
    setPartyIds((current) =>
      current.includes(id)
        ? current.filter((partyId) => partyId !== id)
        : [...current, id]
    );
    setErrors((current) => ({ ...current, parties: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      const next: Errors = {};
      if (!advocate) {
        next.advocate = inputValid
          ? "This number is not registered as an advocate on DRISTI. Check the number, or ask them to register first."
          : "Find the advocate by their registered mobile number.";
      }
      if (partyIds.length === 0) {
        next.parties = "Pick at least one party for the advocate to represent.";
      }
      setErrors(next);
      if (next.advocate || next.parties) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!vakalatnama) {
        setErrors((current) => ({
          ...current,
          vakalatnama: "Upload the signed vakalatnama to continue.",
        }));
        return;
      }
      setStep(3);
    }
  }

  const chosenParties = litigants.filter((party) =>
    partyIds.includes(party.id)
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else requestExit();
        }}
      >
        <DialogContent className="flex max-h-[90svh] flex-col gap-6 overflow-hidden sm:max-w-2xl">
          <div className="flex shrink-0 flex-col gap-6">
            <nav aria-label="Add advocate progress">
              <Stepper className="mx-auto w-full max-w-xl">
                {STEPS.map((item) => (
                  <StepperItem
                    key={item.step}
                    step={item.step}
                    title={item.title}
                    status={stepStatus(item.step, step)}
                    aria-current={item.step === step ? "step" : undefined}
                    className={STEPPER_ITEM_CLASS}
                  />
                ))}
              </Stepper>
            </nav>
            <DialogHeader className="pr-12">
              <DialogTitle
                ref={stepHeadingRef}
                tabIndex={-1}
                className="text-title font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {currentStep.title}
              </DialogTitle>
              <DialogDescription className="text-body text-muted-foreground">
                {currentStep.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
              {step === 1 ? (
                <div className="flex flex-col gap-8">
                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Advocate
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        Only advocates registered on DRISTI can be added.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {advocate ? (
                        <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
                          <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="text-caption font-medium">
                              {initials(advocate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="truncate text-body font-medium">
                              {advocate.name}
                            </p>
                            <p className="truncate text-caption text-muted-foreground">
                              <span className="tabular-nums">
                                {formatAdvocatePhone(advocate.phone)}
                              </span>
                              {" · Bar ID "}
                              <span className="font-mono">{advocate.barId}</span>
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${advocate.name}`}
                            className="text-muted-foreground"
                            onClick={() => setAdvocate(null)}
                          >
                            <XIcon aria-hidden />
                          </Button>
                        </div>
                      ) : (
                        <Field data-invalid={Boolean(errors.advocate)}>
                          <FieldLabel className="text-body" htmlFor="advocate-phone">
                            Mobile number
                          </FieldLabel>
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
                              onChange={(event) => {
                                setPhoneInput(
                                  event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10)
                                );
                                setErrors((current) => ({
                                  ...current,
                                  advocate: undefined,
                                }));
                              }}
                            />
                          </InputGroup>
                          {/* The tenth digit resolves against the advocate
                              registry — same gesture as the share dialog's
                              staff lookup, one candidate instead of chips. */}
                          {lookup ? (
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-lg border border-hairline px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:outline-1 focus-visible:outline-ring"
                              onClick={() => {
                                setAdvocate({ phone: phoneInput, ...lookup });
                                setPhoneInput("");
                                setErrors((current) => ({
                                  ...current,
                                  advocate: undefined,
                                }));
                              }}
                            >
                              <Avatar className="size-8 shrink-0">
                                <AvatarFallback className="text-caption font-medium">
                                  {initials(lookup.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-body-compact font-medium">
                                  {lookup.name}
                                </span>
                                <span className="truncate text-caption text-muted-foreground">
                                  Bar ID{" "}
                                  <span className="font-mono">{lookup.barId}</span>
                                </span>
                              </span>
                              <span className="shrink-0 text-caption font-medium text-muted-foreground">
                                Select
                              </span>
                            </button>
                          ) : null}
                          {inputValid && !lookup ? (
                            <FieldDescription className="text-body-compact">
                              No registered advocate has this number. Check the
                              number, or ask them to register on DRISTI first.
                            </FieldDescription>
                          ) : null}
                          <FieldDescription className="text-caption tabular-nums">
                            {ADVOCATE_DEMO_NUMBERS}
                          </FieldDescription>
                          <FieldError className="text-body-compact">
                            {errors.advocate}
                          </FieldError>
                        </Field>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Representing
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        The vakalatnama must be signed by every party picked
                        here.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FieldSet data-invalid={Boolean(errors.parties)}>
                        <FieldLegend className="sr-only">
                          Parties the advocate will represent
                        </FieldLegend>
                        <div className="flex flex-col gap-1">
                          {litigants.map((party) => (
                            <label
                              key={party.id}
                              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
                            >
                              <Checkbox
                                checked={partyIds.includes(party.id)}
                                onCheckedChange={() => togglePartyId(party.id)}
                                aria-invalid={Boolean(errors.parties)}
                              />
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-body font-medium">
                                  {party.name}
                                </span>
                                <span className="text-caption text-muted-foreground">
                                  {PARTY_SIDE_LABEL[party.side]}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <FieldError className="text-body-compact">
                          {errors.parties}
                        </FieldError>
                      </FieldSet>
                    </CardContent>
                  </Card>
                </div>
              ) : step === 2 ? (
                <Card className="hover:bg-card">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-title-s font-semibold">
                      Signed vakalatnama
                    </CardTitle>
                    <CardDescription className="text-body-compact">
                      Upload the vakalatnama executed by{" "}
                      {formatNames(chosenParties.map((party) => party.name))} in
                      favour of {advocate?.name ?? "the advocate"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Field data-invalid={Boolean(errors.vakalatnama)}>
                      <IdUpload
                        value={vakalatnama}
                        onChange={(filename) => {
                          setVakalatnama(filename);
                          setErrors((current) => ({
                            ...current,
                            vakalatnama: undefined,
                          }));
                        }}
                        label="Upload signed vakalatnama"
                      />
                      <FieldDescription className="text-body-compact">
                        Accepts an image or PDF of the executed vakalatnama. A
                        vakalatnama can also be prepared and e-signed on DRISTI.
                      </FieldDescription>
                      <FieldError className="text-body-compact">
                        {errors.vakalatnama}
                      </FieldError>
                    </Field>
                  </CardContent>
                </Card>
              ) : (
                <Card className="hover:bg-card">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-title-s font-semibold">
                      Review
                    </CardTitle>
                    <CardDescription className="text-body-compact">
                      No approval is needed: the advocate can act on this case
                      as soon as the vakalatnama is on record.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DescriptionList>
                      <ReviewRow term="Advocate">
                        {advocate?.name}
                      </ReviewRow>
                      <ReviewRow term="Bar ID">
                        <span className="font-mono">{advocate?.barId}</span>
                      </ReviewRow>
                      <ReviewRow term="Representing">
                        {formatNames(chosenParties.map((party) => party.name))}
                      </ReviewRow>
                      <ReviewRow term="Vakalatnama">{vakalatnama}</ReviewRow>
                    </DescriptionList>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter
              className={step > 1 ? "shrink-0 sm:justify-between" : "shrink-0"}
            >
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    setStep((current) => (current - 1) as AdvocateStep)
                  }
                >
                  Back
                </Button>
              ) : null}
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={requestExit}
                  >
                    Cancel
                  </Button>
                  {step < 3 ? (
                    <Button type="submit" className="w-full sm:w-auto">
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      aria-describedby="advocate-save-unavailable"
                      className="w-full sm:w-auto"
                    >
                      Add advocate
                    </Button>
                  )}
                </div>
                {step === 3 ? (
                  <p
                    id="advocate-save-unavailable"
                    className="text-body-compact text-muted-foreground sm:text-end"
                  >
                    Saving is not connected yet.
                  </p>
                ) : null}
              </div>
            </DialogFooter>
          </form>
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

/** "A", "A and B", "A, B and C" — the parties read as a sentence. */
function formatNames(names: string[]): string {
  return new Intl.ListFormat("en-IN", {
    style: "long",
    type: "conjunction",
  }).format(names);
}
