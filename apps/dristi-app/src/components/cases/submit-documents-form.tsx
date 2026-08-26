"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { DocumentPreview } from "@/components/cases/document-preview";
import {
  ChoicePillGroup,
  DiscardFilingDialog,
  FileField,
  FilingFrame,
  PrototypeActions,
  focusFirstInvalid,
  useDraftExit,
} from "@/components/cases/filing-form-shared";
import {
  EMPTY_RICH_TEXT,
  RichTextField,
  type RichTextValue,
} from "@/components/cases/rich-text-field";
import { RICH_TEXT_CLASSES } from "@/components/cases/application-type-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SUBMISSION_DOCUMENT_TYPES,
  type SubmissionDocumentTypeId,
} from "@/lib/cases/applications";
import { caseSectionHref } from "@/lib/cases/sections";

type DocumentDraft = {
  type: SubmissionDocumentTypeId | "";
  title: string;
  files: File[];
  reason: RichTextValue;
};

type DocumentErrors = {
  type?: string;
  title?: string;
  files?: string;
  reason?: string;
};

const EMPTY_DRAFT: DocumentDraft = {
  type: "",
  title: "",
  files: [],
  reason: EMPTY_RICH_TEXT,
};

function validateDocument(draft: DocumentDraft): DocumentErrors {
  const errors: DocumentErrors = {};
  if (!draft.type) errors.type = "Select a document type.";
  if (!draft.title.trim()) errors.title = "Enter a document title.";
  if (draft.files.length === 0) {
    errors.files = "Choose at least one document file.";
  }
  if (!draft.reason.text.trim()) errors.reason = "Enter the reason for filing.";
  return errors;
}

export function SubmitDocumentsForm({ caseId }: { caseId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const reasonLabelId = useId();
  const [draft, setDraft] = useState<DocumentDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DocumentErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const caseHref = caseSectionHref(caseId, "documents");
  const dirty = useMemo(
    () =>
      Boolean(
        draft.type ||
          draft.title.trim() ||
          draft.files.length ||
          draft.reason.text.trim()
      ),
    [draft]
  );
  const exit = useDraftExit(dirty, caseHref);

  function update<Key extends keyof DocumentDraft>(
    key: Key,
    value: DocumentDraft[Key]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  /** The preview only opens on a clean form — errors surface in place first. */
  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDocument(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setPreviewOpen(true);
  }

  /**
   * Nothing is persisted, so this claims nothing. It closes the preview and
   * lands on the Documents register, where the submission is designed to
   * appear — and it leaves via complete(), not requestExit(), so finishing
   * the flow never triggers the discard prompt.
   */
  function submit() {
    setPreviewOpen(false);
    exit.complete();
  }

  return (
    <>
      <FilingFrame
        title="Submit documents"
        description="Use this form to submit Memos, Affidavits, and other documents regarding your case to the court."
        onExit={exit.requestExit}
        showPrototypeBanner={false}
        showCaseContext={false}
        showStepper={false}
      >
        <form
          ref={formRef}
          noValidate
          onSubmit={review}
          className="flex flex-col gap-8"
        >
          {/*
            One card, not four loose fields: Laws gives grouped content a
            border, and Raise application already frames its fields this way.
            No CardHeader — the h1 above names the form, and a second title
            here would only repeat it.
          */}
          <Card className="hover:bg-card">
            <CardContent>
              <FieldGroup className="gap-6">
                <ChoicePillGroup
                  legend="Document type"
                  options={SUBMISSION_DOCUMENT_TYPES}
                  value={draft.type}
                  error={errors.type}
                  onChange={(value) => update("type", value)}
                />

                <Field data-invalid={Boolean(errors.title)}>
                  <FieldLabel className="text-body">Document title</FieldLabel>
                  <Input
                    value={draft.title}
                    onChange={(event) => update("title", event.target.value)}
                  />
                  <FieldDescription className="text-body-compact">
                    Use a specific title that distinguishes this document
                    from other records of the same type.
                  </FieldDescription>
                  <FieldError className="text-body-compact">
                    {errors.title}
                  </FieldError>
                </Field>

                <FileField
                  required
                  label="Documents"
                  description="Choose related files in the order they should be merged."
                  files={draft.files}
                  error={errors.files}
                  onFilesChange={(files) => update("files", files)}
                  onErrorChange={(error) =>
                    setErrors((current) => ({ ...current, files: error }))
                  }
                />

                <Field data-invalid={Boolean(errors.reason)}>
                  <FieldLabel id={reasonLabelId} className="text-body">
                    Reason for filing
                  </FieldLabel>
                  <RichTextField
                    labelId={reasonLabelId}
                    value={draft.reason}
                    onChange={(reason) => update("reason", reason)}
                    className={RICH_TEXT_CLASSES}
                  />
                  <FieldDescription className="text-body-compact">
                    Explain why this document is being placed on the case record.
                  </FieldDescription>
                  <FieldError className="text-body-compact">
                    {errors.reason}
                  </FieldError>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <PrototypeActions
            reviewLabel="Review submission"
            onCancel={exit.requestExit}
          />
        </form>
      </FilingFrame>

      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={draft.files}
        onSubmit={submit}
        onReturnFocus={() =>
          formRef.current
            ?.querySelector<HTMLElement>('button[type="submit"]')
            ?.focus()
        }
      />

      <DiscardFilingDialog
        open={exit.open}
        onOpenChange={exit.setOpen}
        onDiscard={exit.discard}
      />
    </>
  );
}

function DocumentPreviewDialog({
  open,
  onOpenChange,
  files,
  onSubmit,
  onReturnFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onSubmit: () => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid-rows-[auto_1fr_auto] max-h-[85dvh] sm:max-w-2xl"
        // Radix's own restore lands on document.body here, so put focus back
        // on the button that opened the dialog explicitly.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-title-s font-semibold">
            Review submission
          </DialogTitle>
          <DialogDescription className="text-body-compact">
            Check the files you are filing before you submit.
          </DialogDescription>
        </DialogHeader>

        {/* Remounts with the portal, so the viewer always opens on the first file. */}
        <FilePreview files={files} />

        <DialogFooter>
          <Button type="button" onClick={onSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The legacy screen counted pages of one merged PDF. Nothing is merged here,
 * so the indicator names the file actually on screen instead of inventing a
 * page count, and the arrows step through the files in merge order. They sit
 * in the preview's action row beside Download, since stepping and downloading
 * both act on the file currently shown.
 */
function FilePreview({ files }: { files: File[] }) {
  const [index, setIndex] = useState(0);
  const current = files[index];

  if (!current) {
    return (
      <div className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-xl bg-surface-sunken p-6 text-center">
        <p className="text-body font-medium">No files attached</p>
        <p className="text-body-compact text-muted-foreground">
          Go back and add at least one document.
        </p>
      </div>
    );
  }

  return (
    <DocumentPreview
      title={current.name}
      description={
        files.length > 1 ? `File ${index + 1} of ${files.length}` : undefined
      }
      source={{ kind: "file", file: current }}
      height="fill"
      actions={
        files.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous file"
              disabled={index === 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
            >
              <ChevronLeftIcon aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next file"
              disabled={index === files.length - 1}
              onClick={() =>
                setIndex((value) => Math.min(files.length - 1, value + 1))
              }
            >
              <ChevronRightIcon aria-hidden />
            </Button>
          </>
        ) : null
      }
    />
  );
}
