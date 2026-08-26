"use client";

import { useMemo, useRef, useState } from "react";

import { AddSignatureDialog } from "@/components/cases/add-signature-dialog";
import {
  ApplicationTypeFields,
  type FieldActions,
} from "@/components/cases/application-type-fields";
import { ApplicationTypePicker } from "@/components/cases/application-type-picker";
import {
  DiscardFilingDialog,
  FilingFrame,
  PrototypeActions,
  focusFirstInvalid,
  useDraftExit,
} from "@/components/cases/filing-form-shared";
import { GeneratedApplicationDialog } from "@/components/cases/generated-application-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { applicationTypeGuide } from "@/lib/cases/application-type-guide";
import {
  EMPTY_APPLICATION_DRAFT,
  EMPTY_APPLICATION_ERRORS,
  hasApplicationErrors,
  isApplicationDirty,
  validateApplication,
  type ApplicationDraft,
  type ApplicationErrors,
} from "@/lib/cases/application-draft";
import { type ApplicationTypeId } from "@/lib/cases/applications";
import { caseSectionHref } from "@/lib/cases/sections";
import { type CaseRecord } from "@/lib/cases/types";

/**
 * Raise application.
 *
 * Submission type is gone: the portal only carried it because one form served
 * both applications and document submissions, and Dristi already splits those
 * into two entry points off Make filings. What is left is the choice that
 * actually branches the form — the application type.
 *
 * Two steps, because they are two different jobs. Choosing the type is a
 * decision — the eight are cards that say what each one asks the court for,
 * searchable in the filer's own words — and it is the only thing on the
 * screen while it is being made. Filling the chosen type's fields is the
 * second, and it starts on a screen that is only those fields.
 *
 * A rail carrying all eight types beside the fields was the earlier shape.
 * It made the choice permanent furniture: eight names competing with the form
 * for the whole filing, none of them explaining themselves.
 *
 * There is no separate review step: Generate application validates the form
 * and opens the generated document, which restates every entered value as
 * the filing — the document is the review. From there the signature dialogs
 * mirror the legacy portal's chain: generated document → Add signature →
 * Upload signed document.
 */
export function RaiseApplicationForm({
  record,
}: {
  record: CaseRecord;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<ApplicationDraft>(EMPTY_APPLICATION_DRAFT);
  const [errors, setErrors] = useState<ApplicationErrors>(
    EMPTY_APPLICATION_ERRORS
  );
  /** Choosing the type is step one; its fields are step two. */
  const [stage, setStage] = useState<"type" | "details">("type");
  const [generatedOpen, setGeneratedOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const chosen = applicationTypeGuide(
    draft.type || "application-others"
  );
  const caseHref = caseSectionHref(record.id, "applications");
  const dirty = useMemo(() => isApplicationDirty(draft), [draft]);
  const exit = useDraftExit(dirty, caseHref);

  const actions: FieldActions = {
    update(key, value) {
      setDraft((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({
        ...current,
        fields: { ...current.fields, [key]: undefined },
      }));
    },
    setFieldError(key, error) {
      setErrors((current) => ({
        ...current,
        fields: { ...current.fields, [key]: error },
      }));
    },
    updateSurety(id, patch) {
      setDraft((current) => ({
        ...current,
        sureties: current.sureties.map((surety) =>
          surety.id === id ? { ...surety, ...patch } : surety
        ),
      }));
      setErrors((current) => clearRow(current, "sureties", id));
    },
    setSuretyError(id, field, error) {
      setErrors((current) => ({
        ...current,
        sureties: {
          ...current.sureties,
          [id]: { ...current.sureties[id], [field]: error },
        },
      }));
    },
    updateRow(listKey, id, patch) {
      setDraft((current) => ({
        ...current,
        [listKey]: current[listKey].map((row) =>
          row.id === id ? { ...row, ...patch } : row
        ),
      }));
      setErrors((current) => clearRow(current, "documentRows", id));
    },
    setRowError(id, field, error) {
      setErrors((current) => ({
        ...current,
        documentRows: {
          ...current.documentRows,
          [id]: { ...current.documentRows[id], [field]: error },
        },
      }));
    },
  };

  /**
   * Choosing is what moves you on — a chosen type with a Next button beside it
   * asks the same question twice.
   *
   * Switching type keeps what was already typed: the other type's fields are
   * simply not validated, reviewed or filed. Comparing two forms should not
   * cost the work you did in the first.
   */
  function chooseType(type: ApplicationTypeId) {
    actions.update("type", type);
    setStage("details");
  }

  /** The generated document only opens on a clean form — errors surface in place first. */
  function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateApplication(draft);
    setErrors(nextErrors);
    if (hasApplicationErrors(nextErrors)) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setGeneratedOpen(true);
  }

  function returnFocusToGenerate() {
    formRef.current
      ?.querySelector<HTMLElement>('button[type="submit"]')
      ?.focus();
  }

  return (
    <>
      <FilingFrame
        title="Raise application"
        description={
          stage === "type"
            ? "Choose what you are asking the court for. Each type asks for different details."
            : `Fill in what ${chosen.label.toLowerCase()} needs. You can change the type at any point.`
        }
        // The cards want the room; a form field 1150px wide does not.
        contentWidth={stage === "type" ? "wide" : "default"}
        showPrototypeBanner={false}
        showCaseContext={false}
        step={stage === "type" ? 1 : 2}
        detailStepTitle="Application type"
        reviewStepTitle="Details"
        onExit={exit.requestExit}
      >
        {stage === "type" ? (
          <ApplicationTypePicker value={draft.type} onChoose={chooseType} />
        ) : (
          <form ref={formRef} noValidate onSubmit={generate}>
            <div className="flex flex-col gap-8">
              <ChosenType
                label={chosen.label}
                description={chosen.description}
                onChange={() => setStage("type")}
              />

              <ApplicationTypeFields
                draft={draft}
                errors={errors}
                record={record}
                actions={actions}
              />

              <PrototypeActions
                reviewLabel="Generate application"
                onCancel={exit.requestExit}
              />
            </div>
          </form>
        )}
      </FilingFrame>

      <GeneratedApplicationDialog
        open={generatedOpen}
        onOpenChange={setGeneratedOpen}
        draft={draft}
        record={record}
        onAddSignature={() => {
          setGeneratedOpen(false);
          setSignatureOpen(true);
        }}
        onReturnFocus={returnFocusToGenerate}
      />

      <AddSignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        draft={draft}
        record={record}
        onBack={() => {
          setSignatureOpen(false);
          setGeneratedOpen(true);
        }}
        // Nothing persists, so completing claims nothing. The flow lands on
        // the Applications register, where a filed application is designed
        // to appear.
        onComplete={() => {
          setSignatureOpen(false);
          exit.complete();
        }}
        onReturnFocus={returnFocusToGenerate}
      />

      <DiscardFilingDialog
        open={exit.open}
        onOpenChange={exit.setOpen}
        onDiscard={exit.discard}
      />
    </>
  );
}

function clearRow(
  errors: ApplicationErrors,
  bucket: "sureties" | "documentRows",
  id: string
): ApplicationErrors {
  const next = { ...errors[bucket] };
  delete next[id];
  return { ...errors, [bucket]: next };
}

/**
 * The details step's first line: which type these fields belong to, and the
 * way back to the choice. It restates the description from the card you
 * picked — the fields below never name the type, so without this the second
 * step could be any of eight forms.
 */
function ChosenType({
  label,
  description,
  onChange,
}: {
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <Card size="sm" className="hover:bg-card">
      <CardContent className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-caption font-medium text-muted-foreground">
            Application type
          </p>
          <p className="text-body font-semibold">{label}</p>
          <p className="mt-1 max-w-prose text-body-compact text-muted-foreground">
            {description}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onChange}>
          Change type
        </Button>
      </CardContent>
    </Card>
  );
}
