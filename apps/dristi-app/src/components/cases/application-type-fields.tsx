"use client";

import { useId, useState } from "react";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";

import {
  ChoicePillGroup,
  FileField,
} from "@/components/cases/filing-form-shared";
import { RichTextField } from "@/components/cases/rich-text-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_AVAILABILITY_DATES,
  emptyDocumentRow,
  emptySurety,
  transferCourtOptions,
  type ApplicationDraft,
  type ApplicationErrors,
  type DocumentRowDraft,
  type SuretyDraft,
  type YesNo,
} from "@/lib/cases/application-draft";
import { formatCaseDate, type CaseRecord } from "@/lib/cases/types";

/** Formatting markup renders the same in the editor and in the review pane. */
export const RICH_TEXT_CLASSES =
  "[&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6";

type ListKey = "supportingDocuments" | "submissionDocuments";

export type FieldActions = {
  update: <Key extends keyof ApplicationDraft>(
    key: Key,
    value: ApplicationDraft[Key]
  ) => void;
  setFieldError: (key: keyof ApplicationDraft, error: string | undefined) => void;
  updateSurety: (id: string, patch: Partial<Omit<SuretyDraft, "id">>) => void;
  setSuretyError: (id: string, field: string, error: string | undefined) => void;
  updateRow: (
    listKey: ListKey,
    id: string,
    patch: Partial<Omit<DocumentRowDraft, "id">>
  ) => void;
  setRowError: (id: string, field: string, error: string | undefined) => void;
};

type FieldsProps = {
  draft: ApplicationDraft;
  errors: ApplicationErrors;
  record: CaseRecord;
  actions: FieldActions;
};

/**
 * The fields for the selected application type.
 *
 * Every type opens with the party the application is filed for, because the
 * portal shows it on all eight and Bail names a different one. Sections are
 * Cards — Laws: grouped content gets a border.
 */
export function ApplicationTypeFields(props: FieldsProps) {
  switch (props.draft.type) {
    case "advancement-reschedule":
      return <AdvancementFields {...props} />;
    case "bail":
      return <BailFields {...props} />;
    case "condonation-of-delay":
      return <CondonationFields {...props} />;
    case "application-others":
      return <OthersFields {...props} />;
    case "production-of-documents":
      return <ProductionFields {...props} />;
    case "settlement":
      return <SettlementFields {...props} />;
    case "transfer":
      return <TransferFields {...props} />;
    case "withdrawal":
      return <WithdrawalFields {...props} />;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- shared -- */

/**
 * A value read off the case, not typed by the filer. Laws: machine-prefilled
 * values take bg-prefilled and keep border-input. readOnly rather than
 * disabled so it stays keyboard reachable and readable by assistive tech.
 */
function PrefilledField({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Field>
      <FieldLabel className="text-body">{label}</FieldLabel>
      <Input prefilled readOnly value={value} />
      {description ? (
        <FieldDescription className="text-body-compact">
          {description}
        </FieldDescription>
      ) : null}
    </Field>
  );
}

/**
 * DatePicker takes no id or aria props, so it cannot be wired to a FieldLabel
 * the way an Input is. The group carries the label instead — the same
 * escalation RichTextField makes.
 *
 * Known limit of that workaround: the trigger cannot carry aria-invalid, so a
 * date error is announced by FieldError but never receives focus from
 * focusFirstInvalid. Settlement, whose only rule is the date, therefore fails
 * with no focus move at all. Needs a DS request against date-picker.
 */
function DateField({
  label,
  value,
  error,
  placeholder = "Pick a date",
  onChange,
}: {
  label: string;
  value: Date | undefined;
  error?: string;
  placeholder?: string;
  onChange: (value: Date | undefined) => void;
}) {
  const labelId = useId();

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel id={labelId} className="text-body">
        {label}
      </FieldLabel>
      <div role="group" aria-labelledby={labelId}>
        <DatePicker
          value={value}
          onValueChange={onChange}
          placeholder={placeholder}
          className="w-full sm:w-60"
        />
      </div>
      <FieldError className="text-body-compact">{error}</FieldError>
    </Field>
  );
}

/** Two mutually exclusive answers, both visible — never a dropdown. */
const YES_NO_OPTIONS = [
  { id: "yes" as const, label: "Yes" },
  { id: "no" as const, label: "No" },
];

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <ChoicePillGroup
      legend={label}
      options={YES_NO_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}

function RichField({
  label,
  description,
  value,
  error,
  onChange,
}: {
  label: string;
  description?: string;
  value: ApplicationDraft["comments"];
  error?: string;
  onChange: (value: ApplicationDraft["comments"]) => void;
}) {
  const labelId = useId();

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel id={labelId} className="text-body">
        {label}
      </FieldLabel>
      <RichTextField
        labelId={labelId}
        value={value}
        onChange={onChange}
        className={RICH_TEXT_CLASSES}
      />
      {description ? (
        <FieldDescription className="text-body-compact">
          {description}
        </FieldDescription>
      ) : null}
      <FieldError className="text-body-compact">{error}</FieldError>
    </Field>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="hover:bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-title-s font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-6">{children}</FieldGroup>
      </CardContent>
    </Card>
  );
}

/** Reference order ID + date of application — the four ordinary prayer types. */
function ReferenceAndDate({ draft, errors, actions }: FieldsProps) {
  return (
    <>
      <Field>
        <FieldLabel className="text-body">
          Reference order ID (optional)
        </FieldLabel>
        <Input
          value={draft.referenceOrderId}
          onChange={(event) =>
            actions.update("referenceOrderId", event.target.value)
          }
        />
        <FieldDescription className="text-body-compact">
          The order this application responds to, if there is one.
        </FieldDescription>
      </Field>

      <DateField
        label="Date of application"
        value={draft.applicationDate}
        error={errors.fields.applicationDate}
        onChange={(value) => actions.update("applicationDate", value)}
      />
    </>
  );
}

/* ------------------------------------------------- 1 · advancement -------- */

function AdvancementFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;
  const listedOn = record.nextHearing?.on;
  const full = draft.availabilityDates.length >= MAX_AVAILABILITY_DATES;
  // DatePicker holds its own value when uncontrolled, so it is remounted after
  // every pick — including a rejected duplicate — and returns to its placeholder.
  // The chips below are the list of record; the trigger is only an entry point.
  const [pickToken, setPickToken] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Hearing">
        <PrefilledField label="Complainant" value={record.parties.complainant} />
        <PrefilledField
          label="Original hearing date"
          value={
            listedOn
              ? `${formatCaseDate(listedOn)}${
                  record.nextHearing?.purpose
                    ? ` · ${record.nextHearing.purpose}`
                    : ""
                }`
              : "No hearing is currently listed"
          }
          description="Taken from the next listed hearing on this case."
        />
      </SectionCard>

      <SectionCard title="Proposed dates">
        <Field data-invalid={Boolean(errors.fields.availabilityDates)}>
          <FieldLabel className="text-body">
            Dates the party can attend
          </FieldLabel>
          <div className="flex flex-col gap-3">
            <DatePicker
              key={pickToken}
              onValueChange={(value) => {
                setPickToken((token) => token + 1);
                if (!value || full) return;
                const day = value.toDateString();
                const duplicate = draft.availabilityDates.some(
                  (date) => date.toDateString() === day
                );
                if (duplicate) return;
                actions.update("availabilityDates", [
                  ...draft.availabilityDates,
                  value,
                ]);
              }}
              disabled={full}
              placeholder="Add a date"
              className="w-full sm:w-60"
            />

            {draft.availabilityDates.length ? (
              <ul className="flex flex-wrap gap-2">
                {draft.availabilityDates.map((date) => (
                  <li key={date.toISOString()}>
                    <span className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-brand-muted px-3 py-2 text-body text-brand-muted-foreground">
                      {formatCaseDate(date.toISOString())}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${formatCaseDate(date.toISOString())}`}
                        onClick={() =>
                          actions.update(
                            "availabilityDates",
                            draft.availabilityDates.filter(
                              (item) => item.getTime() !== date.getTime()
                            )
                          )
                        }
                      >
                        <XIcon aria-hidden />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <FieldDescription className="text-body-compact">
            Choose up to {MAX_AVAILABILITY_DATES} dates.{" "}
            {draft.availabilityDates.length} of {MAX_AVAILABILITY_DATES} added.
          </FieldDescription>
          <FieldError className="text-body-compact">
            {errors.fields.availabilityDates}
          </FieldError>
        </Field>

        <YesNoField
          label="Have the other parties agreed to these dates?"
          value={draft.partiesAgreed}
          onChange={(value) => actions.update("partiesAgreed", value)}
        />
      </SectionCard>

      <SectionCard title="Reason and documents">
        <Field>
          <FieldLabel className="text-body">
            Reason for request (optional)
          </FieldLabel>
          <Textarea
            rows={5}
            value={draft.requestReason}
            onChange={(event) =>
              actions.update("requestReason", event.target.value)
            }
          />
        </Field>

        <FileField
          label="Supporting documents"
          description="Choose any material that supports this request."
          files={draft.supportingFiles}
          error={errors.fields.supportingFiles}
          onFilesChange={(files) => actions.update("supportingFiles", files)}
          onErrorChange={(error) =>
            actions.setFieldError("supportingFiles", error)
          }
        />
      </SectionCard>
    </div>
  );
}

/* -------------------------------------------------------- 2 · bail -------- */

function BailFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Petitioner">
        <PrefilledField label="Petitioner" value={record.parties.accused} />

        <Field data-invalid={Boolean(errors.fields.petitionerFather)}>
          <FieldLabel className="text-body">Petitioner&apos;s Father</FieldLabel>
          <Input
            value={draft.petitionerFather}
            onChange={(event) =>
              actions.update("petitionerFather", event.target.value)
            }
            aria-invalid={Boolean(errors.fields.petitionerFather)}
          />
          <FieldError className="text-body-compact">
            {errors.fields.petitionerFather}
          </FieldError>
        </Field>
      </SectionCard>

      <SectionCard title="Grounds">
        <RichField
          label="Grounds and reasons for bail"
          value={draft.bailGrounds}
          error={errors.fields.bailGrounds}
          onChange={(value) => actions.update("bailGrounds", value)}
        />
        <RichField
          label="Comments (optional)"
          value={draft.comments}
          onChange={(value) => actions.update("comments", value)}
        />
      </SectionCard>

      <SectionCard title="Bail bond">
        <YesNoField
          label="Add surety details to the bail bond?"
          value={draft.addSureties}
          onChange={(value) => {
            actions.update("addSureties", value);
            // The portal opens two surety cards when the answer turns Yes.
            if (value === "yes" && draft.sureties.length === 0) {
              actions.update("sureties", [emptySurety(), emptySurety()]);
            }
          }}
        />
        <Field data-invalid={Boolean(errors.fields.sureties)}>
          <FieldError className="text-body-compact">
            {errors.fields.sureties}
          </FieldError>
        </Field>
      </SectionCard>

      {draft.addSureties === "yes" ? (
        <SuretySection draft={draft} errors={errors} actions={actions} />
      ) : null}
    </div>
  );
}

function SuretySection({
  draft,
  errors,
  actions,
}: {
  draft: ApplicationDraft;
  errors: ApplicationErrors;
  actions: FieldActions;
}) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="sureties-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="sureties-heading" className="text-title-s font-semibold">
            Sureties
          </h3>
          <p className="mt-1 text-body text-muted-foreground">
            Each surety stands security for the petitioner&apos;s appearance.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            actions.update("sureties", [...draft.sureties, emptySurety()])
          }
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add another surety
        </Button>
      </div>

      {draft.sureties.length ? (
        <div className="flex flex-col gap-6">
          {draft.sureties.map((surety, index) => (
            <SuretyCard
              key={surety.id}
              surety={surety}
              index={index}
              errors={errors.sureties[surety.id] ?? {}}
              actions={actions}
              onRemove={() =>
                actions.update(
                  "sureties",
                  draft.sureties.filter((item) => item.id !== surety.id)
                )
              }
            />
          ))}
        </div>
      ) : (
        <Card size="sm" className="hover:bg-card">
          <CardContent>
            <p className="text-body text-muted-foreground">
              No sureties added yet.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function SuretyCard({
  surety,
  index,
  errors,
  actions,
  onRemove,
}: {
  surety: SuretyDraft;
  index: number;
  errors: Record<string, string | undefined>;
  actions: FieldActions;
  onRemove: () => void;
}) {
  function text(
    key: keyof Omit<
      SuretyDraft,
      "id" | "identityProof" | "solvencyProof" | "otherDocuments"
    >,
    label: string,
    options?: { inputMode?: "numeric" | "tel"; optional?: boolean }
  ) {
    return (
      <Field data-invalid={Boolean(errors[key])}>
        <FieldLabel className="text-body">
          {label}
          {options?.optional ? " (optional)" : ""}
        </FieldLabel>
        <Input
          value={surety[key]}
          inputMode={options?.inputMode}
          aria-invalid={Boolean(errors[key])}
          onChange={(event) =>
            actions.updateSurety(surety.id, { [key]: event.target.value })
          }
        />
        <FieldError className="text-body-compact">{errors[key]}</FieldError>
      </Field>
    );
  }

  return (
    <Card className="hover:bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-title-s font-semibold">
          Surety {index + 1}
        </CardTitle>
        <CardAction>
          <Button type="button" variant="destructive-ghost" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" aria-hidden />
            Remove
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            {text("fullName", "Full name")}
            {text("fatherName", "Father's name")}
            {text("phone", "Phone number", { inputMode: "tel" })}
            {text("email", "Email address", { optional: true })}
          </div>

          <FieldSet>
            <FieldLegend className="mb-2 text-body">Address</FieldLegend>
            <div className="grid gap-6 md:grid-cols-2">
              {text("addressLine1", "Address line 1", { optional: true })}
              {text("city", "City or town", { optional: true })}
              {text("pincode", "Pincode", {
                inputMode: "numeric",
                optional: true,
              })}
              {text("district", "District", { optional: true })}
              {text("state", "State", { optional: true })}
            </div>
          </FieldSet>

          <FileField
            required
            label="Identity proof"
            description="Attach proof of the surety's identity."
            files={surety.identityProof}
            error={errors.identityProof}
            onFilesChange={(files) =>
              actions.updateSurety(surety.id, { identityProof: files })
            }
            onErrorChange={(error) =>
              actions.setSuretyError(surety.id, "identityProof", error)
            }
          />
          <FileField
            required
            label="Proof of solvency"
            description="Attach proof that the surety can stand security."
            files={surety.solvencyProof}
            error={errors.solvencyProof}
            onFilesChange={(files) =>
              actions.updateSurety(surety.id, { solvencyProof: files })
            }
            onErrorChange={(error) =>
              actions.setSuretyError(surety.id, "solvencyProof", error)
            }
          />
          <FileField
            label="Other documents"
            description="Attach anything else this surety must produce."
            files={surety.otherDocuments}
            error={errors.otherDocuments}
            onFilesChange={(files) =>
              actions.updateSurety(surety.id, { otherDocuments: files })
            }
            onErrorChange={(error) =>
              actions.setSuretyError(surety.id, "otherDocuments", error)
            }
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------ 3 · condonation --------- */

function CondonationFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Delay">
        <PrefilledField label="Complainant" value={record.parties.complainant} />

        <Field data-invalid={Boolean(errors.fields.delayDays)}>
          <FieldLabel className="text-body">Number of days of delay</FieldLabel>
          <Input
            inputMode="numeric"
            value={draft.delayDays}
            aria-invalid={Boolean(errors.fields.delayDays)}
            onChange={(event) =>
              actions.update("delayDays", event.target.value.replace(/\D/g, ""))
            }
          />
          <FieldError className="text-body-compact">
            {errors.fields.delayDays}
          </FieldError>
        </Field>

        <RichField
          label="Reason for delay"
          value={draft.delayReason}
          error={errors.fields.delayReason}
          onChange={(value) => actions.update("delayReason", value)}
        />
        <RichField
          label="Additional information (optional)"
          value={draft.additionalInformation}
          onChange={(value) => actions.update("additionalInformation", value)}
        />
      </SectionCard>

      <DocumentRowsSection
        listKey="supportingDocuments"
        heading="Supporting documents"
        description="Attach at least one document supporting the reason for delay."
        addLabel="Add another"
        rowLabel="Supporting document"
        rows={draft.supportingDocuments}
        errors={errors}
        groupError={errors.fields.supportingDocuments}
        actions={actions}
        onRowsChange={(rows) => actions.update("supportingDocuments", rows)}
      />
    </div>
  );
}

/* ----------------------------------------------------- 4 · others --------- */

function OthersFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Application information">
        <PrefilledField label="Complainant" value={record.parties.complainant} />

        <Field data-invalid={Boolean(errors.fields.title)}>
          <FieldLabel className="text-body">Application title</FieldLabel>
          <Input
            value={draft.title}
            aria-invalid={Boolean(errors.fields.title)}
            onChange={(event) => actions.update("title", event.target.value)}
          />
          <FieldDescription className="text-body-compact">
            Use letters, numbers and spaces only.
          </FieldDescription>
          <FieldError className="text-body-compact">
            {errors.fields.title}
          </FieldError>
        </Field>

        <RichField
          label="Details"
          value={draft.details}
          error={errors.fields.details}
          onChange={(value) => actions.update("details", value)}
        />

        <FileField
          label="Document"
          description="Attach anything this application relies on."
          files={draft.supportingFiles}
          error={errors.fields.supportingFiles}
          onFilesChange={(files) => actions.update("supportingFiles", files)}
          onErrorChange={(error) =>
            actions.setFieldError("supportingFiles", error)
          }
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------- 5 · production --------- */

function ProductionFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Application">
        <PrefilledField label="Complainant" value={record.parties.complainant} />
        <ReferenceAndDate {...props} />
      </SectionCard>

      <DocumentRowsSection
        listKey="submissionDocuments"
        heading="Submission documents"
        description="Optional. Add a document only when one is being produced."
        addLabel="Add another document"
        rowLabel="Submission document"
        rows={draft.submissionDocuments}
        errors={errors}
        actions={actions}
        onRowsChange={(rows) => actions.update("submissionDocuments", rows)}
      />

      <SectionCard title="Reason">
        <RichField
          label="Reason for application"
          value={draft.applicationReason}
          error={errors.fields.applicationReason}
          onChange={(value) => actions.update("applicationReason", value)}
        />
        <RichField
          label="Comments (optional)"
          value={draft.comments}
          onChange={(value) => actions.update("comments", value)}
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------- 6 · settlement --------- */

function SettlementFields(props: FieldsProps) {
  const { draft, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Application">
        <PrefilledField label="Complainant" value={record.parties.complainant} />
        <ReferenceAndDate {...props} />
        <RichField
          label="Comments (optional)"
          value={draft.comments}
          onChange={(value) => actions.update("comments", value)}
        />
      </SectionCard>
    </div>
  );
}

/* --------------------------------------------------- 7 · transfer --------- */

function TransferFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;
  const courts = transferCourtOptions(record.court);

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Application">
        <PrefilledField label="Complainant" value={record.parties.complainant} />
        <ReferenceAndDate {...props} />
      </SectionCard>

      <SectionCard title="Transfer">
        <PrefilledField label="Current court" value={record.court} />

        <Field data-invalid={Boolean(errors.fields.requestedCourt)}>
          <FieldLabel htmlFor="requested-court" className="text-body">
            Requested court
          </FieldLabel>
          <Select
            value={draft.requestedCourt || undefined}
            onValueChange={(value) => actions.update("requestedCourt", value)}
          >
            <SelectTrigger
              id="requested-court"
              className="w-full text-body"
              aria-invalid={Boolean(errors.fields.requestedCourt)}
            >
              <SelectValue placeholder="Select the court to transfer to" />
            </SelectTrigger>
            <SelectContent>
              {courts.map((court) => (
                <SelectItem key={court} value={court} className="text-body">
                  {court}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError className="text-body-compact">
            {errors.fields.requestedCourt}
          </FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.fields.transferGrounds)}>
          <FieldLabel className="text-body">
            Grounds for seeking transfer
          </FieldLabel>
          <Textarea
            rows={5}
            value={draft.transferGrounds}
            aria-invalid={Boolean(errors.fields.transferGrounds)}
            onChange={(event) =>
              actions.update("transferGrounds", event.target.value)
            }
          />
          <FieldError className="text-body-compact">
            {errors.fields.transferGrounds}
          </FieldError>
        </Field>

        <RichField
          label="Comments (optional)"
          value={draft.comments}
          onChange={(value) => actions.update("comments", value)}
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------- 8 · withdrawal --------- */

function WithdrawalFields(props: FieldsProps) {
  const { draft, errors, record, actions } = props;

  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Application">
        <PrefilledField label="Complainant" value={record.parties.complainant} />
        <ReferenceAndDate {...props} />
      </SectionCard>

      <SectionCard title="Withdrawal">
        <RichField
          label="Reason for withdrawal"
          value={draft.withdrawalReason}
          error={errors.fields.withdrawalReason}
          onChange={(value) => actions.update("withdrawalReason", value)}
        />
        <RichField
          label="Comments (optional)"
          value={draft.comments}
          onChange={(value) => actions.update("comments", value)}
        />
      </SectionCard>
    </div>
  );
}

/* ----------------------------------------------- repeatable rows ---------- */

function DocumentRowsSection({
  listKey,
  heading,
  description,
  addLabel,
  rowLabel,
  rows,
  errors,
  groupError,
  actions,
  onRowsChange,
}: {
  listKey: ListKey;
  heading: string;
  description: string;
  addLabel: string;
  rowLabel: string;
  rows: DocumentRowDraft[];
  errors: ApplicationErrors;
  groupError?: string;
  actions: FieldActions;
  onRowsChange: (rows: DocumentRowDraft[]) => void;
}) {
  const headingId = useId();

  return (
    <section className="flex flex-col gap-4" aria-labelledby={headingId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={headingId} className="text-title-s font-semibold">
            {heading}
          </h3>
          <p className="mt-1 text-body text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onRowsChange([...rows, emptyDocumentRow()])}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          {addLabel}
        </Button>
      </div>

      {groupError ? (
        <Field data-invalid>
          <FieldError className="text-body-compact">{groupError}</FieldError>
        </Field>
      ) : null}

      {rows.length ? (
        <div className="flex flex-col gap-6">
          {rows.map((row, index) => {
            const rowErrors = errors.documentRows[row.id] ?? {};
            return (
              <Card key={row.id} className="hover:bg-card">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-title-s font-semibold">
                    {rowLabel} {index + 1}
                  </CardTitle>
                  <CardAction>
                    <Button
                      type="button"
                      variant="destructive-ghost"
                      onClick={() =>
                        onRowsChange(rows.filter((item) => item.id !== row.id))
                      }
                    >
                      <Trash2Icon data-icon="inline-start" aria-hidden />
                      Remove
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Field data-invalid={Boolean(rowErrors.type)}>
                        <FieldLabel className="text-body">
                          Document type
                        </FieldLabel>
                        <Input
                          value={row.type}
                          aria-invalid={Boolean(rowErrors.type)}
                          onChange={(event) =>
                            actions.updateRow(listKey, row.id, {
                              type: event.target.value,
                            })
                          }
                        />
                        <FieldError className="text-body-compact">
                          {rowErrors.type}
                        </FieldError>
                      </Field>

                      <Field data-invalid={Boolean(rowErrors.title)}>
                        <FieldLabel className="text-body">
                          Document title
                        </FieldLabel>
                        <Input
                          value={row.title}
                          aria-invalid={Boolean(rowErrors.title)}
                          onChange={(event) =>
                            actions.updateRow(listKey, row.id, {
                              title: event.target.value,
                            })
                          }
                        />
                        <FieldError className="text-body-compact">
                          {rowErrors.title}
                        </FieldError>
                      </Field>
                    </div>

                    <FileField
                      required
                      label="Files"
                      description="Choose one or more files for this document."
                      files={row.files}
                      error={rowErrors.files}
                      onFilesChange={(files) =>
                        actions.updateRow(listKey, row.id, { files })
                      }
                      onErrorChange={(error) =>
                        actions.setRowError(row.id, "files", error)
                      }
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card size="sm" className="hover:bg-card">
          <CardContent>
            <p className="text-body text-muted-foreground">
              No {rowLabel.toLowerCase()}s added.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
