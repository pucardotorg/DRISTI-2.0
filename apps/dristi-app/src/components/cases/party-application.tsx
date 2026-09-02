"use client";

/**
 * The application ending every application-type party flow shares (PM,
 * Sept 2): the system composes a court-form document from what was filled
 * in, the person reviews it as the paper it will become, downloads it if
 * they want the printable copy, and SIGNS before submitting — the bail
 * application's generate → sign chain, reused as a pattern.
 *
 * Two dialogs, layered over the owning flow the way the bail pair layers
 * over its review step:
 *
 * - `PartyGeneratedApplicationDialog` — the composed document on the
 *   `paper` facsimile family, with Download and one CTA, Add signature.
 * - `PartySignatureDialog` — choose a method (upload works end to end;
 *   Aadhaar e-sign is gated exactly as the bail flow gates it), attach the
 *   signed copy, submit.
 *
 * Consent-route endings never come here: a request to a colleague is not
 * an application.
 */

import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DocumentPreview } from "@/components/cases/document-preview";
import {
  UPLOAD_HELP,
  UploadedDocField,
} from "@/components/cases/uploaded-doc-field";
import { FieldDescription } from "@/components/ui/field";
import { SELF } from "@/lib/access/content";
import { formatCaseDate } from "@/lib/cases/types";

/** The case, as the paper names it — passed down from whoever holds it. */
export type CaseRef = {
  title: string;
  caseNumber: string;
  court: string;
};

export type PartyApplicationDoc = {
  /** "Application for the removal of an advocate". */
  matter: string;
  facts: { term: string; value: string }[];
  /** The application's own paragraphs, applicant's voice. */
  prayer: string[];
};

/* ------------------------------------------------------------------ */
/* The generated document                                              */
/* ------------------------------------------------------------------ */

export function PartyGeneratedApplicationDialog({
  open,
  onOpenChange,
  caseRef,
  doc,
  onAddSignature,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseRef: CaseRef;
  doc: PartyApplicationDoc;
  onAddSignature: () => void;
}) {
  const generatedOn = formatCaseDate(new Date().toISOString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-rows-[auto_auto_1fr_auto] max-h-[85dvh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-title-s font-semibold">
            Generated application
          </DialogTitle>
          <DialogDescription className="text-body-compact">
            Check the generated document before adding a signature.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-surface-sunken p-4">
          <DescriptionList>
            <ReviewRow term="Application">{doc.matter}</ReviewRow>
            <ReviewRow term="Case">{caseRef.caseNumber}</ReviewRow>
            <ReviewRow term="Generated on">{generatedOn}</ReviewRow>
          </DescriptionList>
        </div>

        <DocumentPreview
          title={doc.matter}
          source={{
            kind: "composed",
            content: (
              <PartyApplicationPaper
                caseRef={caseRef}
                doc={doc}
                generatedOn={generatedOn}
              />
            ),
          }}
          download={{
            onDownload: () => downloadPartyApplication(caseRef, doc, generatedOn),
          }}
          height="fill"
        />

        <DialogFooter>
          <Button type="button" onClick={onAddSignature}>
            Add signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The court-form paper — the `paper` facsimile family, fixed in both
 * themes, per the generated-application precedent.
 */
function PartyApplicationPaper({
  caseRef,
  doc,
  generatedOn,
}: {
  caseRef: CaseRef;
  doc: PartyApplicationDoc;
  generatedOn: string;
}) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground [&_[data-slot=description-details]]:text-paper-foreground [&_[data-slot=description-term]]:text-paper-muted-foreground">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-body font-semibold">{caseRef.court}</p>
        <p className="text-body font-semibold">Case no. {caseRef.caseNumber}</p>
        <p className="text-body font-semibold">{caseRef.title}</p>
        <p className="text-body-compact text-paper-muted-foreground">
          {doc.matter} · Date: {generatedOn}
        </p>
      </header>

      <DescriptionList className="rounded-md border border-paper-border px-4">
        {doc.facts.map((fact) => (
          <ReviewRow key={fact.term} term={fact.term}>
            {fact.value}
          </ReviewRow>
        ))}
      </DescriptionList>

      <div className="flex flex-col gap-3">
        {doc.prayer.map((paragraph) => (
          <p key={paragraph} className="text-body-compact text-pretty">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex w-1/2 flex-col gap-1 self-end pt-4">
        <div className="h-px w-full bg-paper-border" aria-hidden />
        <p className="text-caption text-paper-muted-foreground">
          {SELF.name}, Advocate
        </p>
      </div>
    </article>
  );
}

/** The printable copy — plain text until a PDF service exists. */
function downloadPartyApplication(
  caseRef: CaseRef,
  doc: PartyApplicationDoc,
  generatedOn: string
) {
  const lines = [
    caseRef.court,
    `Case no. ${caseRef.caseNumber}`,
    caseRef.title,
    `${doc.matter} · Date: ${generatedOn}`,
    "",
    ...doc.facts.map((fact) => `${fact.term}: ${fact.value}`),
    "",
    ...doc.prayer,
    "",
    `${SELF.name}, Advocate`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${doc.matter.replaceAll(" ", "_")}_${caseRef.caseNumber.replaceAll("/", "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Signing                                                             */
/* ------------------------------------------------------------------ */

type SignatureMethod = "upload" | "aadhaar" | "";

export function PartySignatureDialog({
  open,
  onOpenChange,
  onBack,
  onSigned,
  submitLabel = "Submit application",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Return to the generated document. */
  onBack: () => void;
  /** Signed and submitted — the owning flow shows its done stage. */
  onSigned: () => void;
  submitLabel?: string;
}) {
  const [method, setMethod] = useState<SignatureMethod>("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  function reset() {
    setMethod("");
    setSignedFile(null);
    setError(undefined);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function submit() {
    if (method === "") {
      setError("Pick how the application is signed.");
      return;
    }
    if (method === "aadhaar") return;
    if (!signedFile) {
      setError("Upload the signed application to continue.");
      return;
    }
    reset();
    onSigned();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 gap-1.5 border-b border-hairline px-6 py-5 pr-14 text-left">
          <DialogTitle className="text-title-s font-semibold text-balance">
            Sign the application
          </DialogTitle>
          <DialogDescription>
            An unsigned application cannot be submitted to the court.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          <Field data-invalid={Boolean(error) && method === ""}>
            <FieldLabel className="block w-full text-body font-semibold leading-snug">
              How is it signed?
            </FieldLabel>
            <RadioGroup
              value={method}
              onValueChange={(value) => {
                setMethod(value as SignatureMethod);
                setError(undefined);
              }}
              className="flex flex-col gap-1"
            >
              <div className="flex min-h-10 items-center gap-2">
                <RadioGroupItem id="party-sign-upload" value="upload" />
                <Label htmlFor="party-sign-upload">
                  Print, sign and upload the signed copy
                </Label>
              </div>
              <div className="flex min-h-10 items-center gap-2">
                <RadioGroupItem id="party-sign-aadhaar" value="aadhaar" />
                <Label htmlFor="party-sign-aadhaar">Aadhaar e-sign</Label>
              </div>
            </RadioGroup>
          </Field>

          {method === "aadhaar" ? (
            /* Selectable but gated, exactly as the bail flow gates it: a
               faked Aadhaar authentication would claim a system action
               that never happened. */
            <Banner variant="info">
              Aadhaar e-sign is not wired in this prototype. Upload a signed
              copy instead.
            </Banner>
          ) : null}

          {method === "upload" ? (
            <Field data-invalid={Boolean(error) && !signedFile}>
              <FieldLabel className="block w-full text-body font-semibold leading-snug">
                Signed application
              </FieldLabel>
              <UploadedDocField
                label="Signed application"
                required
                file={signedFile}
                onFileChange={(file) => {
                  setSignedFile(file);
                  setError(undefined);
                }}
              />
              <FieldDescription>{UPLOAD_HELP}</FieldDescription>
            </Field>
          ) : null}

          <FieldError>{error}</FieldError>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onBack();
            }}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={method === "aadhaar"}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
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
