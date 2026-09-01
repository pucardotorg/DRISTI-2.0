"use client";

/**
 * Add a Power of Attorney holder — scenarios 5 and 8 of the party-actions
 * spec, one flow. An **application**: unlike an advocate (whose vakalatnama
 * is the authority), a PoA-holder is added only by a magistrate's order, and
 * the flow says so before asking for anything.
 *
 * Scenario 8 lives inside scenario 5 rather than as a fourth menu entry: "an
 * existing party becomes the PoA-holder" is the same application with the
 * person picked from the case instead of entered fresh, so it is a choice on
 * the holder step — one flow, two ways to name the person.
 *
 * A party carries at most one PoA-holder, so a party that already has one is
 * shown but not selectable — replacing them is its own action (scenario 7),
 * not a second add.
 */

import { useEffect, useMemo, useRef, useState } from "react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import {
  STEPPER_ITEM_CLASS,
  stepStatus,
} from "@/components/cases/add-witness-form";
import { IdUpload } from "@/components/vakalatnama/id-upload";
import {
  PARTY_SIDE_LABEL,
  POA_REASON_MAX_LENGTH,
  type PartyOption,
} from "@/lib/cases/party-actions";

type PoaStep = 1 | 2 | 3;

const STEPS: Array<{ step: PoaStep; title: string; description: string }> = [
  {
    step: 1,
    title: "Holder and party",
    description:
      "Name the person who will hold the Power of Attorney, and the party granting it.",
  },
  {
    step: 2,
    title: "Grounds and deed",
    description:
      "State why the party needs a PoA-holder and attach the deed.",
  },
  {
    step: 3,
    title: "Review",
    description: "Confirm the application before submitting it to the court.",
  },
];

type HolderMode = "new" | "existing";

type Errors = {
  party?: string;
  holderName?: string;
  holderPhone?: string;
  existing?: string;
  reason?: string;
  deed?: string;
};

export function AddPoaDialog({
  open,
  onOpenChange,
  litigants,
  advocates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litigants: PartyOption[];
  /** Advocate names on record — scenario 8's pool alongside the litigants. */
  advocates: string[];
}) {
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<PoaStep>(1);
  const [partyId, setPartyId] = useState("");
  const [holderMode, setHolderMode] = useState<HolderMode>("new");
  const [holderName, setHolderName] = useState("");
  const [holderPhone, setHolderPhone] = useState("");
  const [existingKey, setExistingKey] = useState("");
  const [reason, setReason] = useState("");
  const [deed, setDeed] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  const currentStep = STEPS.find((item) => item.step === step) ?? STEPS[0];
  const isDirty = useMemo(
    () =>
      Boolean(
        partyId || holderName || holderPhone || existingKey || reason || deed
      ),
    [partyId, holderName, holderPhone, existingKey, reason, deed]
  );

  useEffect(() => {
    if (!open) return;
    stepHeadingRef.current?.focus();
  }, [open, step]);

  const grantingSide = litigants.find((party) => party.id === partyId)?.side;

  /**
   * Scenario 8's pool: everyone already on the case except the granting party
   * themselves — the other litigants, and the advocates on record. Litigants
   * are limited to the granting party's own side once one is picked: a
   * co-accused officer holding PoA for the company is the real case, an
   * opposing party holding it is a contradiction the form should not offer.
   * Keys are prefixed so a litigant and an advocate can never collide.
   */
  const existingPeople = [
    ...litigants
      .filter(
        (party) =>
          party.id !== partyId &&
          (!grantingSide || party.side === grantingSide)
      )
      .map((party) => ({
        key: `party:${party.id}`,
        name: party.name,
        detail: PARTY_SIDE_LABEL[party.side],
      })),
    ...advocates.map((name) => ({
      key: `advocate:${name}`,
      name,
      detail: "Advocate on record",
    })),
  ];

  const grantingParty = litigants.find((party) => party.id === partyId);
  const holderDisplayName =
    holderMode === "new"
      ? holderName.trim()
      : existingPeople.find((person) => person.key === existingKey)?.name ?? "";

  function resetForm() {
    setStep(1);
    setPartyId("");
    setHolderMode("new");
    setHolderName("");
    setHolderPhone("");
    setExistingKey("");
    setReason("");
    setDeed("");
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      const next: Errors = {};
      if (!partyId) next.party = "Pick the party granting the Power of Attorney.";
      if (holderMode === "new") {
        if (!holderName.trim()) next.holderName = "Enter the holder's name.";
        if (holderPhone && holderPhone.length !== 10) {
          next.holderPhone = "Enter a 10-digit mobile number, or leave it blank.";
        }
      } else if (!existingKey) {
        next.existing = "Pick who on the case will take on the role.";
      }
      setErrors(next);
      if (Object.values(next).some(Boolean)) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      const next: Errors = {};
      if (!reason.trim()) {
        next.reason = "State why the party needs a PoA-holder.";
      }
      if (!deed) next.deed = "Upload the Power of Attorney deed to continue.";
      setErrors(next);
      if (Object.values(next).some(Boolean)) return;
      setStep(3);
    }
  }

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
            <nav aria-label="Add Power of Attorney holder progress">
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
                  {/* Process first, then the form: the reader should know this
                      goes to the magistrate before they invest in filling it. */}
                  <Alert>
                    <AlertDescription>
                      This is an application to the court. The PoA-holder joins
                      the case only after the magistrate passes an order.
                    </AlertDescription>
                  </Alert>

                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Granting party
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        A party can have at most one PoA-holder.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FieldSet data-invalid={Boolean(errors.party)}>
                        <FieldLegend className="sr-only">
                          The party granting the Power of Attorney
                        </FieldLegend>
                        <RadioGroup
                          value={partyId}
                          onValueChange={(value) => {
                            setPartyId(value);
                            /* The pool excludes the granting party, so a pick
                               made before the party changes can go stale. */
                            setExistingKey("");
                            setErrors((current) => ({
                              ...current,
                              party: undefined,
                            }));
                          }}
                          className="flex flex-col gap-1"
                        >
                          {litigants.map((party) => {
                            const taken = Boolean(party.poaHolder);
                            return (
                              <label
                                key={party.id}
                                className={
                                  taken
                                    ? "flex min-h-12 items-center gap-3 rounded-md px-3 py-2"
                                    : "flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
                                }
                              >
                                <RadioGroupItem
                                  value={party.id}
                                  disabled={taken}
                                  aria-invalid={Boolean(errors.party)}
                                />
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span
                                    className={
                                      taken
                                        ? "truncate text-body font-medium text-muted-foreground"
                                        : "truncate text-body font-medium"
                                    }
                                  >
                                    {party.name}
                                  </span>
                                  <span className="text-caption text-muted-foreground">
                                    {taken
                                      ? `${PARTY_SIDE_LABEL[party.side]} · already has a PoA-holder (${party.poaHolder}) — replace them instead of adding a second`
                                      : PARTY_SIDE_LABEL[party.side]}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                        <FieldError className="text-body-compact">
                          {errors.party}
                        </FieldError>
                      </FieldSet>
                    </CardContent>
                  </Card>

                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Who will hold it
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        Someone new, or someone already on this case taking on
                        the role.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FieldGroup className="gap-4">
                        <RadioGroup
                          value={holderMode}
                          onValueChange={(value) => {
                            setHolderMode(value as HolderMode);
                            setErrors((current) => ({
                              ...current,
                              holderName: undefined,
                              holderPhone: undefined,
                              existing: undefined,
                            }));
                          }}
                          className="flex flex-col gap-4 sm:flex-row sm:gap-8"
                        >
                          <Field orientation="horizontal">
                            <RadioGroupItem id="poa-holder-new" value="new" />
                            <FieldLabel
                              className="text-body"
                              htmlFor="poa-holder-new"
                            >
                              Someone new
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              id="poa-holder-existing"
                              value="existing"
                            />
                            <FieldLabel
                              className="text-body"
                              htmlFor="poa-holder-existing"
                            >
                              Someone already on this case
                            </FieldLabel>
                          </Field>
                        </RadioGroup>

                        {holderMode === "new" ? (
                          <>
                            <Field data-invalid={Boolean(errors.holderName)}>
                              <FieldLabel className="text-body">
                                Full name
                              </FieldLabel>
                              <Input
                                autoComplete="off"
                                value={holderName}
                                onChange={(event) => {
                                  setHolderName(event.target.value);
                                  setErrors((current) => ({
                                    ...current,
                                    holderName: undefined,
                                  }));
                                }}
                              />
                              <FieldError className="text-body-compact">
                                {errors.holderName}
                              </FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.holderPhone)}>
                              <FieldLabel className="text-body">
                                Mobile number (optional)
                              </FieldLabel>
                              <Input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={10}
                                value={holderPhone}
                                onChange={(event) => {
                                  setHolderPhone(
                                    event.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 10)
                                  );
                                  setErrors((current) => ({
                                    ...current,
                                    holderPhone: undefined,
                                  }));
                                }}
                              />
                              <FieldError className="text-body-compact">
                                {errors.holderPhone}
                              </FieldError>
                            </Field>
                          </>
                        ) : (
                          <FieldSet data-invalid={Boolean(errors.existing)}>
                            <FieldLegend className="sr-only">
                              Who on the case will take on the role
                            </FieldLegend>
                            <RadioGroup
                              value={existingKey}
                              onValueChange={(value) => {
                                setExistingKey(value);
                                setErrors((current) => ({
                                  ...current,
                                  existing: undefined,
                                }));
                              }}
                              className="flex flex-col gap-1"
                            >
                              {existingPeople.map((person) => (
                                <label
                                  key={person.key}
                                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
                                >
                                  <RadioGroupItem
                                    value={person.key}
                                    aria-invalid={Boolean(errors.existing)}
                                  />
                                  <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-body font-medium">
                                      {person.name}
                                    </span>
                                    <span className="text-caption text-muted-foreground">
                                      {person.detail}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </RadioGroup>
                            <FieldDescription className="text-body-compact">
                              No new person joins the case — they take on the
                              PoA role alongside what they already are.
                            </FieldDescription>
                            <FieldError className="text-body-compact">
                              {errors.existing}
                            </FieldError>
                          </FieldSet>
                        )}
                      </FieldGroup>
                    </CardContent>
                  </Card>
                </div>
              ) : step === 2 ? (
                <div className="flex flex-col gap-8">
                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Grounds
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        The magistrate reads this to decide the application.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Field data-invalid={Boolean(errors.reason)}>
                        <FieldLabel className="text-body">
                          Why does {grantingParty?.name ?? "the party"} need a
                          PoA-holder?
                        </FieldLabel>
                        <Textarea
                          className="min-h-24"
                          maxLength={POA_REASON_MAX_LENGTH}
                          value={reason}
                          onChange={(event) => {
                            setReason(event.target.value);
                            setErrors((current) => ({
                              ...current,
                              reason: undefined,
                            }));
                          }}
                        />
                        <FieldDescription className="flex justify-end text-body-compact">
                          {reason.length.toLocaleString("en-IN")} /{" "}
                          {POA_REASON_MAX_LENGTH.toLocaleString("en-IN")}
                        </FieldDescription>
                        <FieldError className="text-body-compact">
                          {errors.reason}
                        </FieldError>
                      </Field>
                    </CardContent>
                  </Card>

                  <Card className="hover:bg-card">
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-title-s font-semibold">
                        Power of Attorney deed
                      </CardTitle>
                      <CardDescription className="text-body-compact">
                        The executed deed naming{" "}
                        {holderDisplayName || "the holder"} for{" "}
                        {grantingParty?.name ?? "the party"}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Field data-invalid={Boolean(errors.deed)}>
                        <IdUpload
                          value={deed}
                          onChange={(filename) => {
                            setDeed(filename);
                            setErrors((current) => ({
                              ...current,
                              deed: undefined,
                            }));
                          }}
                          label="Upload the PoA deed"
                        />
                        <FieldDescription className="text-body-compact">
                          Accepts an image or PDF of the executed deed.
                        </FieldDescription>
                        <FieldError className="text-body-compact">
                          {errors.deed}
                        </FieldError>
                      </Field>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="hover:bg-card">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-title-s font-semibold">
                      Review
                    </CardTitle>
                    <CardDescription className="text-body-compact">
                      The application goes to the magistrate; the PoA-holder is
                      added when the order is passed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DescriptionList>
                      <ReviewRow term="Granting party">
                        {grantingParty?.name}
                      </ReviewRow>
                      <ReviewRow term="PoA-holder">
                        {holderDisplayName}
                        {holderMode === "existing" ? (
                          <span className="text-muted-foreground">
                            {" "}
                            (already on this case)
                          </span>
                        ) : null}
                      </ReviewRow>
                      {holderMode === "new" && holderPhone ? (
                        <ReviewRow term="Mobile number">
                          <span className="tabular-nums">{holderPhone}</span>
                        </ReviewRow>
                      ) : null}
                      <ReviewRow term="Grounds">
                        <span className="whitespace-pre-wrap">
                          {reason.trim()}
                        </span>
                      </ReviewRow>
                      <ReviewRow term="Deed">{deed}</ReviewRow>
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
                  onClick={() => setStep((current) => (current - 1) as PoaStep)}
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
                      aria-describedby="poa-save-unavailable"
                      className="w-full sm:w-auto"
                    >
                      Submit application
                    </Button>
                  )}
                </div>
                {step === 3 ? (
                  <p
                    id="poa-save-unavailable"
                    className="text-body-compact text-muted-foreground sm:text-end"
                  >
                    Submission is not connected yet.
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
            <AlertDialogTitle>Discard this application?</AlertDialogTitle>
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
