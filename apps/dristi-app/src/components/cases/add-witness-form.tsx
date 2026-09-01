"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardAction,
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import {
  DOCUMENT_MAX_LENGTH,
  PURPOSE_MAX_LENGTH,
  addressHasAnyValue,
  createEmptyWitnessAddress,
  createEmptyWitnessDraft,
  isValidEmail,
  mobileDisplayValue,
  normalizeEmail,
  normalizeMobileNumber,
  validateWitnessContact,
  validateWitnessDetails,
  witnessContactHasErrors,
  witnessDetailsHaveErrors,
  witnessDraftIsDirty,
  type WitnessAddressDraft,
  type WitnessContactErrors,
  type WitnessDetailsErrors,
  type WitnessDraft,
} from "@/lib/cases/witnesses";

type WitnessStep = 1 | 2 | 3;

const STEPS: Array<{ step: WitnessStep; title: string; description: string }> = [
  {
    step: 1,
    title: "Witness details",
    description:
      "Start with the witness identity and the reason they are being added.",
  },
  {
    step: 2,
    title: "Contact and address",
    description: "Add optional contact and service address details.",
  },
  {
    step: 3,
    title: "Review",
    description: "Confirm that the draft is accurate before adding the witness.",
  },
];

/** Shared by every Add-people stepper dialog so the three flows read as one. */
export const STEPPER_ITEM_CLASS =
  "items-center [&>div:first-child]:relative [&>div:first-child]:justify-center [&_[data-slot=stepper-connector]]:absolute [&_[data-slot=stepper-connector]]:inset-y-0 [&_[data-slot=stepper-connector]]:left-[calc(50%+1.5rem)] [&_[data-slot=stepper-connector]]:right-[calc(-50%+1.5rem)] [&_[data-slot=stepper-connector]]:mx-0 [&_[data-slot=stepper-connector]]:my-auto [&_[data-slot=stepper-connector]]:h-px [&_[data-slot=stepper-connector]]:min-w-0 [&_[data-slot=stepper-connector]]:w-auto [&_[data-slot=stepper-connector]]:flex-none [&>div:last-child]:w-full [&>div:last-child]:pr-0 [&>div:last-child]:text-center";

const EMPTY_DETAILS_ERRORS: WitnessDetailsErrors = { documents: {} };
const EMPTY_CONTACT_ERRORS: WitnessContactErrors = { addresses: {} };

function createClientId(prefix: "address" | "document"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function stepStatus(
  itemStep: number,
  currentStep: number
): "complete" | "current" | "upcoming" {
  if (itemStep < currentStep) return "complete";
  if (itemStep === currentStep) return "current";
  return "upcoming";
}

function focusFirstInvalid(container: HTMLElement | null) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    });
  });
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

function StepActions({
  step,
  onBack,
  onCancel,
}: {
  step: WitnessStep;
  onBack: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {step > 1 ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={onBack}
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
            onClick={onCancel}
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
              aria-describedby="witness-save-unavailable"
              className="w-full sm:w-auto"
            >
              Add witness
            </Button>
          )}
        </div>
        {step === 3 ? (
          <p
            id="witness-save-unavailable"
            className="text-body-compact text-muted-foreground sm:text-end"
          >
            Saving is not connected yet.
          </p>
        ) : null}
      </div>
    </>
  );
}

function WitnessDetailsStep({
  draft,
  errors,
  onChange,
  onAddDocument,
  onChangeDocument,
  onRemoveDocument,
}: {
  draft: WitnessDraft;
  errors: WitnessDetailsErrors;
  onChange: <Key extends keyof WitnessDraft>(
    key: Key,
    value: WitnessDraft[Key]
  ) => void;
  onAddDocument: () => void;
  onChangeDocument: (clientId: string, description: string) => void;
  onRemoveDocument: (clientId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Card className="hover:bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-title-s font-semibold">
            Basic details
          </CardTitle>
          <CardDescription className="text-body-compact">
            Enter a personal name, a designation, or both when known.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(errors.firstName)}>
              <FieldLabel className="text-body">First name</FieldLabel>
              <Input
                autoComplete="off"
                value={draft.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
              />
              <FieldDescription className="text-body-compact">
                Required unless a designation is provided below.
              </FieldDescription>
              <FieldError className="text-body-compact">
                {errors.firstName}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel className="text-body">Middle name (optional)</FieldLabel>
              <Input
                autoComplete="off"
                value={draft.middleName}
                onChange={(event) => onChange("middleName", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel className="text-body">Last name (optional)</FieldLabel>
              <Input
                autoComplete="off"
                value={draft.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
              />
            </Field>

            <Field data-invalid={Boolean(errors.designation)}>
              <FieldLabel className="text-body">
                Witness designation (optional)
              </FieldLabel>
              <Input
                autoComplete="off"
                value={draft.designation}
                onChange={(event) => onChange("designation", event.target.value)}
              />
              <FieldDescription className="text-body-compact">
                Use a meaningful role, office or title when the witness is known
                by their capacity, such as Medical Officer or Bank Manager.
              </FieldDescription>
              <FieldError className="text-body-compact">
                {errors.designation}
              </FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.age)}>
              <FieldLabel className="text-body">Age (optional)</FieldLabel>
              <Input
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                value={draft.age}
                onChange={(event) =>
                  onChange(
                    "age",
                    event.target.value.replace(/\D/g, "").slice(0, 3)
                  )
                }
              />
              <FieldError className="text-body-compact">
                {errors.age}
              </FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="hover:bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-title-s font-semibold">
            Purpose and documents
          </CardTitle>
          <CardDescription className="text-body-compact">
            Record why this witness is being added and any documents they may
            present.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <Field data-invalid={Boolean(errors.purposeOfExamination)}>
            <FieldLabel className="text-body">
              Purpose of examination (optional)
            </FieldLabel>
            <Textarea
              className="min-h-24"
              maxLength={PURPOSE_MAX_LENGTH}
              value={draft.purposeOfExamination}
              onChange={(event) =>
                onChange("purposeOfExamination", event.target.value)
              }
            />
            <FieldDescription className="flex justify-end text-body-compact">
              {draft.purposeOfExamination.length.toLocaleString("en-IN")} /{" "}
              {PURPOSE_MAX_LENGTH.toLocaleString("en-IN")}
            </FieldDescription>
            <FieldError className="text-body-compact">
              {errors.purposeOfExamination}
            </FieldError>
          </Field>

          <section className="flex flex-col gap-4" aria-labelledby="documents-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 id="documents-heading" className="text-body font-medium">
                  Documents to be presented (optional)
                </h3>
                <p className="mt-1 text-body-compact text-muted-foreground">
                  Add each requested document separately.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onAddDocument}
              >
                <PlusIcon data-icon="inline-start" aria-hidden />
                Add document
              </Button>
            </div>

            {draft.documentsToBeProduced.length > 0 ? (
              <ItemGroup>
                {draft.documentsToBeProduced.map((document, index) => (
                  <Item
                    key={document.clientId}
                    variant="outline"
                    className="items-start p-4 hover:bg-card"
                  >
                    <ItemContent className="min-w-0 gap-3">
                      <ItemTitle className="text-body font-medium">
                        Document {index + 1}
                      </ItemTitle>
                      <Field
                        data-invalid={Boolean(
                          errors.documents[document.clientId]
                        )}
                      >
                        <FieldLabel className="text-body">
                          Description
                          <span className="sr-only">
                            {" "}
                            for document {index + 1}
                          </span>
                        </FieldLabel>
                        <Textarea
                          className="min-h-16"
                          maxLength={DOCUMENT_MAX_LENGTH}
                          value={document.description}
                          onChange={(event) =>
                            onChangeDocument(
                              document.clientId,
                              event.target.value
                            )
                          }
                        />
                        <FieldDescription className="flex justify-end text-body-compact">
                          {document.description.length} / {DOCUMENT_MAX_LENGTH}
                        </FieldDescription>
                        <FieldError className="text-body-compact">
                          {errors.documents[document.clientId]}
                        </FieldError>
                      </Field>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="sm"
                        onClick={() => onRemoveDocument(document.clientId)}
                      >
                        <Trash2Icon data-icon="inline-start" aria-hidden />
                        Remove
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <p className="text-body-compact text-muted-foreground">
                No documents added.
              </p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactAndAddressStep({
  draft,
  mobileInput,
  emailInput,
  errors,
  onMobileInputChange,
  onEmailInputChange,
  onAddMobile,
  onAddEmail,
  onRemoveMobile,
  onRemoveEmail,
  onAddAddress,
  onChangeAddress,
  onRequestRemoveAddress,
}: {
  draft: WitnessDraft;
  mobileInput: string;
  emailInput: string;
  errors: WitnessContactErrors;
  onMobileInputChange: (value: string) => void;
  onEmailInputChange: (value: string) => void;
  onAddMobile: () => void;
  onAddEmail: () => void;
  onRemoveMobile: (value: string) => void;
  onRemoveEmail: (value: string) => void;
  onAddAddress: () => void;
  onChangeAddress: (
    clientId: string,
    key: keyof Omit<WitnessAddressDraft, "clientId">,
    value: string
  ) => void;
  onRequestRemoveAddress: (clientId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Card className="hover:bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-title-s font-semibold">
            Contact details
          </CardTitle>
          <CardDescription className="text-body-compact">
            Optional. Accurate contact details can support summon delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <section className="flex flex-col gap-4" aria-labelledby="mobile-heading">
            <h3 id="mobile-heading" className="text-body font-medium">
              Mobile numbers
            </h3>
            <Field data-invalid={Boolean(errors.mobileInput)}>
              <FieldLabel className="text-body">Mobile number</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <InputGroup className="flex-1">
                  <InputGroupAddon>
                    <InputGroupText>+91</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                    value={mobileInput}
                    onChange={(event) =>
                      onMobileInputChange(
                        normalizeMobileNumber(event.target.value)
                      )
                    }
                  />
                </InputGroup>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onAddMobile}
                >
                  Add number
                </Button>
              </div>
              <FieldDescription className="text-body-compact">
                Enter a 10-digit Indian mobile number, then select Add number.
              </FieldDescription>
              <FieldError className="text-body-compact">
                {errors.mobileInput}
              </FieldError>
            </Field>

            {draft.mobileNumbers.length > 0 ? (
              <ItemGroup className="gap-2">
                {draft.mobileNumbers.map((mobile) => (
                  <Item
                    key={mobile}
                    variant="outline"
                    className="hover:bg-card"
                  >
                    <ItemMedia variant="icon">
                      <PhoneIcon aria-hidden />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-body font-medium">
                        {mobileDisplayValue(mobile)}
                      </ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="sm"
                        onClick={() => onRemoveMobile(mobile)}
                      >
                        Remove
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : null}
          </section>

          <Separator />

          <section className="flex flex-col gap-4" aria-labelledby="email-heading">
            <h3 id="email-heading" className="text-body font-medium">
              Email addresses
            </h3>
            <Field data-invalid={Boolean(errors.emailInput)}>
              <FieldLabel className="text-body">Email address</FieldLabel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Input
                  className="flex-1"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(event) =>
                    onEmailInputChange(event.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onAddEmail}
                >
                  Add email
                </Button>
              </div>
              <FieldDescription className="text-body-compact">
                Enter an email address, then select Add email.
              </FieldDescription>
              <FieldError className="text-body-compact">
                {errors.emailInput}
              </FieldError>
            </Field>

            {draft.emailIds.length > 0 ? (
              <ItemGroup className="gap-2">
                {draft.emailIds.map((email) => (
                  <Item key={email} variant="outline" className="hover:bg-card">
                    <ItemMedia variant="icon">
                      <MailIcon aria-hidden />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="break-all text-body font-medium">
                        {email}
                      </ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="sm"
                        onClick={() => onRemoveEmail(email)}
                      >
                        Remove
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : null}
          </section>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="addresses-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="addresses-heading" className="text-title-s font-semibold">
              Addresses
            </h2>
            <p className="mt-1 text-body text-muted-foreground">
              Optional. If any part of an address is entered, complete all its
              fields before continuing.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onAddAddress}
          >
            <PlusIcon data-icon="inline-start" aria-hidden />
            Add address
          </Button>
        </div>

        {draft.addresses.length > 0 ? (
          <div className="flex flex-col gap-6">
            {draft.addresses.map((address, index) => {
              const addressErrors = errors.addresses[address.clientId] ?? {};
              return (
                <Card key={address.clientId} className="hover:bg-card">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-title-s font-semibold">
                      Address {index + 1}
                    </CardTitle>
                    <CardAction>
                      <Button
                        type="button"
                        variant="destructive-ghost"
                        size="sm"
                        onClick={() =>
                          onRequestRemoveAddress(address.clientId)
                        }
                      >
                        <Trash2Icon data-icon="inline-start" aria-hidden />
                        Remove
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="gap-4">
                      <Field data-invalid={Boolean(addressErrors.addressType)}>
                        <FieldSet>
                          <FieldLegend className="text-body">
                            Address type
                          </FieldLegend>
                          <RadioGroup
                            className="flex flex-col gap-4 sm:flex-row sm:gap-8"
                            value={address.addressType}
                            aria-describedby={
                              addressErrors.addressType
                                ? `${address.clientId}-address-type-error`
                                : undefined
                            }
                            onValueChange={(value) =>
                              onChangeAddress(
                                address.clientId,
                                "addressType",
                                value
                              )
                            }
                          >
                            <Field orientation="horizontal">
                              <RadioGroupItem
                                id={`${address.clientId}-residential`}
                                value="RESIDENTIAL"
                                aria-invalid={Boolean(
                                  addressErrors.addressType
                                )}
                                aria-describedby={
                                  addressErrors.addressType
                                    ? `${address.clientId}-address-type-error`
                                    : undefined
                                }
                              />
                              <FieldLabel
                                className="text-body"
                                htmlFor={`${address.clientId}-residential`}
                              >
                                Residential
                              </FieldLabel>
                            </Field>
                            <Field orientation="horizontal">
                              <RadioGroupItem
                                id={`${address.clientId}-office`}
                                value="OFFICE"
                                aria-invalid={Boolean(
                                  addressErrors.addressType
                                )}
                                aria-describedby={
                                  addressErrors.addressType
                                    ? `${address.clientId}-address-type-error`
                                    : undefined
                                }
                              />
                              <FieldLabel
                                className="text-body"
                                htmlFor={`${address.clientId}-office`}
                              >
                                Office
                              </FieldLabel>
                            </Field>
                          </RadioGroup>
                          <FieldError
                            id={`${address.clientId}-address-type-error`}
                            className="text-body-compact"
                          >
                            {addressErrors.addressType}
                          </FieldError>
                        </FieldSet>
                      </Field>

                      <Field data-invalid={Boolean(addressErrors.pincode)}>
                        <FieldLabel className="text-body">Pincode</FieldLabel>
                        <Input
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={6}
                          value={address.pincode}
                          onChange={(event) =>
                            onChangeAddress(
                              address.clientId,
                              "pincode",
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                            )
                          }
                        />
                        <FieldError className="text-body-compact">
                          {addressErrors.pincode}
                        </FieldError>
                      </Field>

                      <Field data-invalid={Boolean(addressErrors.state)}>
                        <FieldLabel className="text-body">State</FieldLabel>
                        <Input
                          autoComplete="address-level1"
                          value={address.state}
                          onChange={(event) =>
                            onChangeAddress(
                              address.clientId,
                              "state",
                              event.target.value
                            )
                          }
                        />
                        <FieldError className="text-body-compact">
                          {addressErrors.state}
                        </FieldError>
                      </Field>

                      <Field data-invalid={Boolean(addressErrors.district)}>
                        <FieldLabel className="text-body">District</FieldLabel>
                        <Input
                          autoComplete="address-level2"
                          value={address.district}
                          onChange={(event) =>
                            onChangeAddress(
                              address.clientId,
                              "district",
                              event.target.value
                            )
                          }
                        />
                        <FieldError className="text-body-compact">
                          {addressErrors.district}
                        </FieldError>
                      </Field>

                      <Field data-invalid={Boolean(addressErrors.cityOrTown)}>
                        <FieldLabel className="text-body">City or town</FieldLabel>
                        <Input
                          autoComplete="address-level3"
                          value={address.cityOrTown}
                          onChange={(event) =>
                            onChangeAddress(
                              address.clientId,
                              "cityOrTown",
                              event.target.value
                            )
                          }
                        />
                        <FieldError className="text-body-compact">
                          {addressErrors.cityOrTown}
                        </FieldError>
                      </Field>

                      <Field data-invalid={Boolean(addressErrors.address)}>
                        <FieldLabel className="text-body">Address</FieldLabel>
                        <Textarea
                          autoComplete="street-address"
                          value={address.address}
                          onChange={(event) =>
                            onChangeAddress(
                              address.clientId,
                              "address",
                              event.target.value
                            )
                          }
                        />
                        <FieldError className="text-body-compact">
                          {addressErrors.address}
                        </FieldError>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="hover:bg-card">
            <CardContent className="flex flex-col items-start gap-2">
              <p className="text-body font-medium">No addresses added</p>
              <p className="text-body-compact text-muted-foreground">
                You can continue without an address.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function ReviewStep({
  draft,
  onEdit,
}: {
  draft: WitnessDraft;
  onEdit: (step: 1 | 2) => void;
}) {
  const fullName = [draft.firstName, draft.middleName, draft.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const completedAddresses = draft.addresses.filter(addressHasAnyValue);
  const hasContactDetails =
    draft.mobileNumbers.length > 0 ||
    draft.emailIds.length > 0 ||
    completedAddresses.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Card className="hover:bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-title-s font-semibold">
            Witness details
          </CardTitle>
          <CardDescription className="text-body-compact">
            Check the identifying details and purpose.
          </CardDescription>
          <CardAction>
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(1)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <DescriptionList>
            {fullName ? <ReviewRow term="Name">{fullName}</ReviewRow> : null}
            {draft.designation.trim() ? (
              <ReviewRow term="Designation">
                {draft.designation.trim()}
              </ReviewRow>
            ) : null}
            {draft.age.trim() ? (
              <ReviewRow term="Age">{draft.age.trim()}</ReviewRow>
            ) : null}
            {draft.purposeOfExamination.trim() ? (
              <ReviewRow term="Purpose">
                <span className="whitespace-pre-wrap">
                  {draft.purposeOfExamination.trim()}
                </span>
              </ReviewRow>
            ) : null}
          </DescriptionList>

          {draft.documentsToBeProduced.length > 0 ? (
            <section className="flex flex-col gap-3" aria-labelledby="review-documents-heading">
              <h3 id="review-documents-heading" className="text-body font-medium">
                Documents to be presented
              </h3>
              <ItemGroup className="gap-2">
                {draft.documentsToBeProduced.map((document, index) => (
                  <Item key={document.clientId} variant="outline" className="hover:bg-card">
                    <ItemMedia variant="icon">
                      <FileTextIcon aria-hidden />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-body font-medium">
                        Document {index + 1}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-none whitespace-pre-wrap text-body-compact">
                        {document.description.trim()}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <Card className="hover:bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-title-s font-semibold">
            Contact and address
          </CardTitle>
          <CardDescription className="text-body-compact">
            Check the optional delivery details.
          </CardDescription>
          <CardAction>
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(2)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {hasContactDetails ? (
            <>
              {draft.mobileNumbers.length > 0 ? (
                <section className="flex flex-col gap-3" aria-labelledby="review-mobile-heading">
                  <h3 id="review-mobile-heading" className="text-body font-medium">
                    Mobile numbers
                  </h3>
                  <ItemGroup className="gap-2">
                    {draft.mobileNumbers.map((mobile) => (
                      <Item key={mobile} variant="outline" className="hover:bg-card">
                        <ItemMedia variant="icon">
                          <PhoneIcon aria-hidden />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle className="text-body font-medium">
                            {mobileDisplayValue(mobile)}
                          </ItemTitle>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </section>
              ) : null}

              {draft.emailIds.length > 0 ? (
                <section className="flex flex-col gap-3" aria-labelledby="review-email-heading">
                  <h3 id="review-email-heading" className="text-body font-medium">
                    Email addresses
                  </h3>
                  <ItemGroup className="gap-2">
                    {draft.emailIds.map((email) => (
                      <Item key={email} variant="outline" className="hover:bg-card">
                        <ItemMedia variant="icon">
                          <MailIcon aria-hidden />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle className="break-all text-body font-medium">
                            {email}
                          </ItemTitle>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </section>
              ) : null}

              {completedAddresses.length > 0 ? (
                <section className="flex flex-col gap-3" aria-labelledby="review-addresses-heading">
                  <h3 id="review-addresses-heading" className="text-body font-medium">
                    Addresses
                  </h3>
                  <ItemGroup>
                    {completedAddresses.map((address, index) => (
                      <Item
                        key={address.clientId}
                        variant="outline"
                        className="items-start p-4 hover:bg-card"
                      >
                        <ItemMedia variant="icon">
                          <MapPinIcon aria-hidden />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <ItemTitle className="text-body font-medium">
                            Address {index + 1}
                          </ItemTitle>
                          <DescriptionList>
                            <ReviewRow term="Type">
                              {address.addressType === "RESIDENTIAL"
                                ? "Residential"
                                : "Office"}
                            </ReviewRow>
                            <ReviewRow term="Pincode">
                              {address.pincode.trim()}
                            </ReviewRow>
                            <ReviewRow term="State">
                              {address.state.trim()}
                            </ReviewRow>
                            <ReviewRow term="District">
                              {address.district.trim()}
                            </ReviewRow>
                            <ReviewRow term="City or town">
                              {address.cityOrTown.trim()}
                            </ReviewRow>
                            <ReviewRow term="Address">
                              <span className="whitespace-pre-wrap">
                                {address.address.trim()}
                              </span>
                            </ReviewRow>
                          </DescriptionList>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                </section>
              ) : null}
            </>
          ) : (
            <p className="text-body text-muted-foreground">
              No contact or address details provided.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Controlled from outside: the trigger lives in `CaseAddPeople`, the Parties
 * tab's universal Add-people menu, alongside the advocate and PoA flows. The
 * dialog owns only its own steps and draft.
 */
export function AddWitnessDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<WitnessStep>(1);
  const [draft, setDraft] = useState<WitnessDraft>(createEmptyWitnessDraft);
  const [mobileInput, setMobileInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [detailsErrors, setDetailsErrors] =
    useState<WitnessDetailsErrors>(EMPTY_DETAILS_ERRORS);
  const [contactErrors, setContactErrors] =
    useState<WitnessContactErrors>(EMPTY_CONTACT_ERRORS);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [addressPendingRemoval, setAddressPendingRemoval] = useState<
    string | null
  >(null);

  const currentStep = STEPS.find((item) => item.step === step) ?? STEPS[0];
  const isDirty = useMemo(
    () => witnessDraftIsDirty(draft, mobileInput, emailInput),
    [draft, emailInput, mobileInput]
  );

  function resetForm() {
    setStep(1);
    setDraft(createEmptyWitnessDraft());
    setMobileInput("");
    setEmailInput("");
    setDetailsErrors(EMPTY_DETAILS_ERRORS);
    setContactErrors(EMPTY_CONTACT_ERRORS);
    setExitConfirmationOpen(false);
    setAddressPendingRemoval(null);
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
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!open || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, open]);

  useEffect(() => {
    if (!open) return;
    stepHeadingRef.current?.focus();
  }, [open, step]);

  function updateDraftField<Key extends keyof WitnessDraft>(
    key: Key,
    value: WitnessDraft[Key]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "firstName" || key === "designation") {
      setDetailsErrors((current) => ({
        ...current,
        firstName: undefined,
        designation: undefined,
      }));
    } else if (key === "age" || key === "purposeOfExamination") {
      setDetailsErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function addDocument() {
    setDraft((current) => ({
      ...current,
      documentsToBeProduced: [
        ...current.documentsToBeProduced,
        { clientId: createClientId("document"), description: "" },
      ],
    }));
  }

  function changeDocument(clientId: string, description: string) {
    setDraft((current) => ({
      ...current,
      documentsToBeProduced: current.documentsToBeProduced.map((document) =>
        document.clientId === clientId
          ? { ...document, description }
          : document
      ),
    }));
    setDetailsErrors((current) => {
      const documents = { ...current.documents };
      delete documents[clientId];
      return { ...current, documents };
    });
  }

  function removeDocument(clientId: string) {
    setDraft((current) => ({
      ...current,
      documentsToBeProduced: current.documentsToBeProduced.filter(
        (document) => document.clientId !== clientId
      ),
    }));
    setDetailsErrors((current) => {
      const documents = { ...current.documents };
      delete documents[clientId];
      return { ...current, documents };
    });
  }

  function addMobile() {
    const mobile = normalizeMobileNumber(mobileInput);
    if (mobile.length !== 10) {
      setContactErrors((current) => ({
        ...current,
        mobileInput: "Enter a 10-digit mobile number.",
      }));
      focusFirstInvalid(formRef.current);
      return;
    }
    if (draft.mobileNumbers.includes(mobile)) {
      setContactErrors((current) => ({
        ...current,
        mobileInput: "This mobile number has already been added.",
      }));
      focusFirstInvalid(formRef.current);
      return;
    }

    setDraft((current) => ({
      ...current,
      mobileNumbers: [...current.mobileNumbers, mobile],
    }));
    setMobileInput("");
    setContactErrors((current) => ({
      ...current,
      mobileInput: undefined,
    }));
  }

  function addEmail() {
    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      setContactErrors((current) => ({
        ...current,
        emailInput: "Enter a valid email address.",
      }));
      focusFirstInvalid(formRef.current);
      return;
    }
    if (draft.emailIds.includes(email)) {
      setContactErrors((current) => ({
        ...current,
        emailInput: "This email address has already been added.",
      }));
      focusFirstInvalid(formRef.current);
      return;
    }

    setDraft((current) => ({
      ...current,
      emailIds: [...current.emailIds, email],
    }));
    setEmailInput("");
    setContactErrors((current) => ({
      ...current,
      emailInput: undefined,
    }));
  }

  function addAddress() {
    setDraft((current) => ({
      ...current,
      addresses: [
        ...current.addresses,
        createEmptyWitnessAddress(createClientId("address")),
      ],
    }));
  }

  function changeAddress(
    clientId: string,
    key: keyof Omit<WitnessAddressDraft, "clientId">,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      addresses: current.addresses.map((address) =>
        address.clientId === clientId ? { ...address, [key]: value } : address
      ),
    }));
    setContactErrors((current) => {
      const addressErrors = current.addresses[clientId];
      if (!addressErrors) return current;
      const nextAddressErrors = { ...addressErrors, [key]: undefined };
      return {
        ...current,
        addresses: { ...current.addresses, [clientId]: nextAddressErrors },
      };
    });
  }

  function removeAddress(clientId: string) {
    setDraft((current) => ({
      ...current,
      addresses: current.addresses.filter(
        (address) => address.clientId !== clientId
      ),
    }));
    setContactErrors((current) => {
      const addresses = { ...current.addresses };
      delete addresses[clientId];
      return { ...current, addresses };
    });
    setAddressPendingRemoval(null);
  }

  function requestRemoveAddress(clientId: string) {
    const address = draft.addresses.find((item) => item.clientId === clientId);
    if (!address) return;
    if (addressHasAnyValue(address)) {
      setAddressPendingRemoval(clientId);
    } else {
      removeAddress(clientId);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 1) {
      const errors = validateWitnessDetails(draft);
      setDetailsErrors(errors);
      if (witnessDetailsHaveErrors(errors)) {
        focusFirstInvalid(formRef.current);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const errors = validateWitnessContact(draft, mobileInput, emailInput);
      setContactErrors(errors);
      if (witnessContactHasErrors(errors)) {
        focusFirstInvalid(formRef.current);
        return;
      }
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
      <DialogContent className="flex max-h-[90svh] flex-col gap-6 overflow-hidden sm:max-w-4xl">
        <div className="flex shrink-0 flex-col gap-6">
          <nav aria-label="Add witness progress">
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
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
            {step === 1 ? (
              <WitnessDetailsStep
                draft={draft}
                errors={detailsErrors}
                onChange={updateDraftField}
                onAddDocument={addDocument}
                onChangeDocument={changeDocument}
                onRemoveDocument={removeDocument}
              />
            ) : step === 2 ? (
              <ContactAndAddressStep
                draft={draft}
                mobileInput={mobileInput}
                emailInput={emailInput}
                errors={contactErrors}
                onMobileInputChange={(value) => {
                  setMobileInput(value);
                  setContactErrors((current) => ({
                    ...current,
                    mobileInput: undefined,
                  }));
                }}
                onEmailInputChange={(value) => {
                  setEmailInput(value);
                  setContactErrors((current) => ({
                    ...current,
                    emailInput: undefined,
                  }));
                }}
                onAddMobile={addMobile}
                onAddEmail={addEmail}
                onRemoveMobile={(value) =>
                  setDraft((current) => ({
                    ...current,
                    mobileNumbers: current.mobileNumbers.filter(
                      (mobile) => mobile !== value
                    ),
                  }))
                }
                onRemoveEmail={(value) =>
                  setDraft((current) => ({
                    ...current,
                    emailIds: current.emailIds.filter(
                      (email) => email !== value
                    ),
                  }))
                }
                onAddAddress={addAddress}
                onChangeAddress={changeAddress}
                onRequestRemoveAddress={requestRemoveAddress}
              />
            ) : (
              <ReviewStep draft={draft} onEdit={setStep} />
            )}
          </div>

          <DialogFooter
            className={
              step > 1 ? "shrink-0 sm:justify-between" : "shrink-0"
            }
          >
            <StepActions
              step={step}
              onBack={() => setStep((current) => (current - 1) as WitnessStep)}
              onCancel={requestExit}
            />
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
            <AlertDialogTitle>Discard witness draft?</AlertDialogTitle>
            <AlertDialogDescription>
              The information entered here will be lost if you discard this
              draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-solid"
              onClick={closeClean}
            >
              Discard draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(addressPendingRemoval)}
        onOpenChange={(next) => {
          if (!next) setAddressPendingRemoval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              The address details entered here will be removed from the witness
              draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep address</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-solid"
              onClick={() => {
                if (addressPendingRemoval) {
                  removeAddress(addressPendingRemoval);
                }
              }}
            >
              Remove address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

