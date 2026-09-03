"use client";

import * as React from "react";

import { DocumentPreview } from "@/components/cases/document-preview";
import {
  SignatureFields,
  signatureSubject,
  useSignatureChoice,
} from "@/components/employee/sign-signature-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { causeTitle } from "@/lib/employee/hearings";
import {
  buildSignFormDocument,
  downloadSignFormDocument,
  signFormProcessLabel,
  type SignForm,
  type SignFormDocument,
} from "@/lib/employee/sign-forms";

/**
 * One form, read and then signed — the single-document path off the signing queue.
 *
 * Two steps, and the reference gives each its own size for a reason. Reading is the
 * wide step: the document *is* the task, so it is a `height="fill"` `DocumentPreview`
 * in a tall dialog, the same layout `ReschedulingRequestDialog` already uses to review
 * an application. Signing is the narrow step: a note saying what is about to be signed,
 * the choice of how, and Submit.
 *
 * The steps live inside one `Dialog` rather than two. Handing off between two dialogs
 * would race Radix's focus restore against the next dialog's focus trap; swapping the
 * content of one keeps a single focus scope, and moving focus to the new title is what
 * announces the change.
 *
 * Download does not sit in the footer as the reference draws it. `DocumentPreview` owns
 * a sticky header with Download and Full view in it, and repeating Download below would
 * be the same control twice in one dialog — so the footer keeps only the act the dialog
 * exists to complete. The signing step has no preview, so Download comes back there,
 * which is where the reference puts it too.
 *
 * **Submit signs nothing.** It drops the row from the demo queue and closes — see
 * `lib/employee/sign-forms.ts`. Nothing is written, sent, or filed, and no e-sign
 * provider is called.
 */
export function SignFormDialog({
  form,
  onOpenChange,
  onSign,
  onReturnFocus,
}: {
  form: SignForm | null;
  onOpenChange: (form: SignForm | null) => void;
  onSign: (form: SignForm) => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog
      open={form !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {form ? (
        /* Keyed on the form so opening a second one starts at the document again with
           an empty method rather than inheriting the last one's answers. */
        <SignFormBody
          key={form.id}
          form={form}
          onSign={onSign}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

function SignFormBody({
  form,
  onSign,
  onReturnFocus,
}: {
  form: SignForm;
  onSign: (form: SignForm) => void;
  onReturnFocus: () => void;
}) {
  const document = React.useMemo(() => buildSignFormDocument(form), [form]);
  const [step, setStep] = React.useState<"read" | "sign">("read");
  const choice = useSignatureChoice();
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  /* Swapping the step replaces the dialog's content wholesale; landing focus on the new
     title is what announces the change. Initial open keeps Radix's own focus handling —
     this only runs on a step change. */
  React.useEffect(() => {
    if (step === "sign") titleRef.current?.focus();
  }, [step]);

  const process = signFormProcessLabel(form.process);

  return (
    <DialogContent
      className={
        step === "read"
          ? "flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh]"
          : "max-h-[85dvh] overflow-y-auto sm:max-w-lg"
      }
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      {step === "read" ? (
        <>
          <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-title-s font-semibold">
                {process}
              </DialogTitle>
              {/* The form's own state — waiting for this bench's signature — in the
                  DS's sentence case rather than the reference's `PENDING_REVIEW`.
                  `warning` is the variant `ReschedulingRequestDialog` already spends on
                  a pending application, so the two court-side review overlays report a
                  pending state the same way. */}
              <Badge variant="warning">Pending signature</Badge>
            </div>
            <DialogDescription className="text-body-compact text-muted-foreground">
              {causeTitle(form)} · {form.caseNumber}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <DocumentPreview
              className="min-h-96 md:min-h-0"
              height="fill"
              title={document.title}
              source={{
                kind: "composed",
                content: <FormFacsimile document={document} />,
              }}
              download={{
                onDownload: () => downloadSignFormDocument(form),
                label: `Download ${document.title}`,
              }}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 shrink-0">
            <Button type="button" onClick={() => setStep("sign")}>
              Proceed to sign
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              className="text-title-s font-semibold outline-none"
            >
              Add signature
            </DialogTitle>
            <DialogDescription className="text-body-compact">
              Choose how you will sign this form.
            </DialogDescription>
          </DialogHeader>

          <SignatureFields
            choice={choice}
            subject={signatureSubject([form])}
            download={{
              prompt: "Want to read the form again?",
              onDownload: () => downloadSignFormDocument(form),
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("read")}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={!choice.canSubmit}
              onClick={() => onSign(form)}
            >
              Submit
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

/**
 * The form itself as paper — the same facsimile treatment the rescheduling review
 * overlay uses, bound to this form's own particulars.
 */
function FormFacsimile({ document }: { document: SignFormDocument }) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-body font-semibold">{document.court}</p>
        <p className="text-body font-semibold">
          Case no. {document.caseNumber}
        </p>
        <p className="text-body font-semibold">{document.matter}</p>
      </header>

      <h3 className="text-center text-body font-semibold">{document.title}</h3>

      <ol className="flex list-decimal flex-col gap-3 ps-6">
        {document.paragraphs.map((paragraph, index) => (
          <li key={index} className="text-body">
            {paragraph}
          </li>
        ))}
      </ol>

      <p className="text-body">{document.closing}</p>
      <p className="text-body">Dated this the {document.dated}.</p>

      <section className="flex flex-col gap-1">
        <h4 className="text-body font-semibold">Deponent</h4>
        <p className="text-body">{document.deponent.name}</p>
        <p className="text-body-compact text-paper-muted-foreground">
          {document.deponent.capacity}
        </p>
      </section>

      <p className="text-body">{document.attestation}</p>

      {document.advocate ? (
        <section className="flex flex-col gap-1">
          <h4 className="text-body font-semibold">Advocate</h4>
          <p className="text-body">{document.advocate}</p>
        </section>
      ) : null}
    </article>
  );
}
