"use client";

import * as React from "react";

import {
  SignatureFields,
  signatureSubject,
  useSignatureChoice,
} from "@/components/employee/sign-signature-fields";
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
  downloadSignFormDocument,
  type SignForm,
} from "@/lib/employee/sign-forms";

/**
 * Many forms at once — the bulk path off the signing queue.
 *
 * The same two beats as the single-document path, minus the reading: confirm what is
 * about to happen, then say how it gets signed. The bench has not opened these
 * documents, so the confirmation carries the count and the warning, and the signature
 * step carries the choice.
 *
 * It is a `Dialog` with two steps rather than an `AlertDialog` handing off to a second
 * dialog. Confirm is no longer the last thing pressed — Submit is — so it is a step in a
 * flow rather than a terminal irreversible confirmation, and one dialog keeps one focus
 * scope instead of racing Radix's focus restore against the next dialog's trap. It is
 * also the reference's own structure: a plain modal with a close button.
 *
 * **Submit signs nothing.** It drops the selected rows from the demo queue and closes —
 * see `lib/employee/sign-forms.ts`. Nothing is written, sent, or filed, and no e-sign
 * provider is called.
 */
export function SignBulkDialog({
  forms,
  open,
  onOpenChange,
  onSign,
}: {
  /** The selection, in list order. Fixed for the life of one opening. */
  forms: SignForm[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Closed renders nothing, so the body unmounts and its step and half-made
          signature choice go with it. Re-opening therefore starts at Confirm with an
          empty method rather than inheriting the last run's answers — no reset to
          remember to run, and no key to keep in sync with the openings. */}
      {open ? (
        <SignBulkBody
          forms={forms}
          onCancel={() => onOpenChange(false)}
          onSign={onSign}
        />
      ) : null}
    </Dialog>
  );
}

function SignBulkBody({
  forms,
  onCancel,
  onSign,
}: {
  forms: SignForm[];
  /** Leave without signing — the confirm step's Back, which has nowhere earlier to go. */
  onCancel: () => void;
  onSign: () => void;
}) {
  const [step, setStep] = React.useState<"confirm" | "sign">("confirm");
  const choice = useSignatureChoice();
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  /* Swapping the step replaces the dialog's content wholesale; landing focus on the new
     title is what announces the change. Initial open keeps Radix's own focus handling —
     this only runs on a step change. */
  React.useEffect(() => {
    if (step === "sign") titleRef.current?.focus();
  }, [step]);

  return (
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      {step === "confirm" ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-title-s font-semibold">
              Confirm sign
            </DialogTitle>
            <DialogDescription className="text-body">
              {forms.length === 1
                ? "This adds your signature to the selected form. It cannot be reversed."
                : `This adds your signature to all ${forms.length} selected forms. It cannot be reversed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("sign")}>
              Sign
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
              {forms.length === 1
                ? "Choose how you will sign this form."
                : "Choose how you will sign these forms."}
            </DialogDescription>
          </DialogHeader>

          {/* A selection of one is still one document, and this path never showed it —
              the bench checked a box, it did not open the form. So the read is offered
              here, asking the question that fits: before you sign, not again. Past one
              form there is no single document to hand over, and nothing renders. */}
          <SignatureFields
            choice={choice}
            subject={signatureSubject(forms)}
            download={
              forms.length === 1
                ? {
                    prompt: "Want to read the form before you sign?",
                    onDownload: () => downloadSignFormDocument(forms[0]),
                  }
                : undefined
            }
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("confirm")}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={!choice.canSubmit}
              onClick={onSign}
            >
              Submit
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}
