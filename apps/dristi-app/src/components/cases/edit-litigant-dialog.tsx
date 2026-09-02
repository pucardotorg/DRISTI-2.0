"use client";

/**
 * Edit a litigant's details — scenario 10 of the party-actions spec. A change
 * to what the record says about a party is an application to the magistrate,
 * so the pencil on the detail pane opens a pre-filled form and ends in the
 * shared application chain: the generated paper, a signature, and the
 * hourglass done stage. The record itself changes only when the order is
 * passed.
 *
 * Own side only: the server renders the pencil on the viewer's own litigants.
 */

import { useMemo, useState, type ReactNode } from "react";
import { HourglassIcon, PencilIcon } from "lucide-react";

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
import { DescriptionList, DescriptionRow, DescriptionTerm, DescriptionDetails } from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PartyGeneratedApplicationDialog,
  PartySignatureDialog,
  type CaseRef,
} from "@/components/cases/party-application";
import {
  ReviewDocValue,
  UPLOAD_HELP,
  UploadedDocField,
} from "@/components/cases/uploaded-doc-field";

/** What the record holds about the litigant — the form's pre-fill. */
export type EditableLitigant = {
  name: string;
  /** The person who speaks for an entity, when the litigant is one. */
  entityRepresentative?: string;
};

export function EditLitigantAction({
  litigant,
  caseRef,
}: {
  litigant: EditableLitigant;
  caseRef: CaseRef;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label={`Edit details for ${litigant.name}`}
        onClick={() => setOpen(true)}
      >
        <PencilIcon aria-hidden />
      </Button>
      <EditLitigantDialog
        open={open}
        onOpenChange={setOpen}
        litigant={litigant}
        caseRef={caseRef}
      />
    </>
  );
}

type Errors = { name?: string; reason?: string; changes?: string };

function EditLitigantDialog({
  open,
  onOpenChange,
  litigant,
  caseRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litigant: EditableLitigant;
  caseRef: CaseRef;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(litigant.name);
  const [representative, setRepresentative] = useState(
    litigant.entityRepresentative ?? ""
  );
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [appStage, setAppStage] = useState<"none" | "document" | "sign">("none");
  const [errors, setErrors] = useState<Errors>({});
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  const isEntity = litigant.entityRepresentative !== undefined;

  /** What the application actually asks to change — the review and the paper
      both print exactly this, so an untouched field never claims a correction. */
  const changes = useMemo(() => {
    const list: { term: string; value: string; was?: string }[] = [];
    if (name.trim() && name.trim() !== litigant.name) {
      list.push({ term: "Name", value: name.trim(), was: litigant.name });
    }
    if (
      isEntity &&
      representative.trim() &&
      representative.trim() !== litigant.entityRepresentative
    ) {
      list.push({
        term: "Represented by",
        value: representative.trim(),
        was: litigant.entityRepresentative,
      });
    }
    if (mobile.trim()) list.push({ term: "Mobile number", value: mobile.trim() });
    if (address.trim()) list.push({ term: "Address", value: address.trim() });
    return list;
  }, [name, representative, mobile, address, litigant, isEntity]);

  const isDirty = useMemo(
    () => changes.length > 0 || Boolean(reason || docFile),
    [changes, reason, docFile]
  );

  function resetForm() {
    setStep(1);
    setName(litigant.name);
    setRepresentative(litigant.entityRepresentative ?? "");
    setMobile("");
    setAddress("");
    setReason("");
    setDocFile(null);
    setDone(false);
    setAppStage("none");
    setErrors({});
    setExitConfirmationOpen(false);
  }

  function closeClean() {
    resetForm();
    onOpenChange(false);
  }

  function requestExit() {
    if (isDirty && !done) {
      setExitConfirmationOpen(true);
      return;
    }
    closeClean();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "The party needs a name on the record.";
    if (!changes.length && name.trim()) {
      next.changes = "Nothing has been changed yet.";
    }
    if (!reason.trim()) next.reason = "State why the record needs correcting.";
    setErrors(next);
    if (next.name || next.changes || next.reason) return;
    setStep(2);
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
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          {done ? (
            <DoneStage
              title="Application sent to the magistrate"
              description={`The record for ${litigant.name} stays as it is until the order is passed.`}
              onDone={closeClean}
            />
          ) : (
            <>
              {/* No stepper: two steps do not earn one. */}
              <DialogHeader className="shrink-0 gap-1.5 border-b border-hairline px-6 py-5 pr-14 text-left">
                <DialogTitle className="text-title-s font-semibold text-balance">
                  {step === 1 ? `Edit details for ${litigant.name}` : "Review"}
                </DialogTitle>
                <DialogDescription>
                  {step === 1
                    ? "Correct what the record holds about this party. The application goes to the magistrate."
                    : "The record is corrected when the order is passed."}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <form
                  id="edit-litigant-form"
                  noValidate
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                >
                  {step === 1 ? (
                    <>
                      <Field data-invalid={Boolean(errors.name)}>
                        <FieldLabel
                          className="block w-full text-body font-semibold leading-snug"
                          htmlFor="edit-litigant-name"
                        >
                          Name
                        </FieldLabel>
                        <Input
                          id="edit-litigant-name"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setErrors((c) => ({
                              ...c,
                              name: undefined,
                              changes: undefined,
                            }));
                          }}
                        />
                        <FieldError>{errors.name}</FieldError>
                      </Field>

                      {isEntity ? (
                        <Field>
                          <FieldLabel
                            className="block w-full text-body font-semibold leading-snug"
                            htmlFor="edit-litigant-rep"
                          >
                            Represented by
                          </FieldLabel>
                          <FieldDescription>
                            The person who speaks for the entity in this case.
                          </FieldDescription>
                          <Input
                            id="edit-litigant-rep"
                            value={representative}
                            onChange={(event) => {
                              setRepresentative(event.target.value);
                              setErrors((c) => ({ ...c, changes: undefined }));
                            }}
                          />
                        </Field>
                      ) : null}

                      <Field>
                        <FieldLabel
                          className="block w-full text-body font-semibold leading-snug"
                          htmlFor="edit-litigant-mobile"
                        >
                          Mobile number (optional)
                        </FieldLabel>
                        <Input
                          id="edit-litigant-mobile"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="10-digit mobile number"
                          value={mobile}
                          onChange={(event) => {
                            setMobile(event.target.value);
                            setErrors((c) => ({ ...c, changes: undefined }));
                          }}
                        />
                      </Field>

                      <Field>
                        <FieldLabel
                          className="block w-full text-body font-semibold leading-snug"
                          htmlFor="edit-litigant-address"
                        >
                          Address (optional)
                        </FieldLabel>
                        <Textarea
                          id="edit-litigant-address"
                          className="min-h-20"
                          value={address}
                          onChange={(event) => {
                            setAddress(event.target.value);
                            setErrors((c) => ({ ...c, changes: undefined }));
                          }}
                        />
                      </Field>

                      {errors.changes ? (
                        <p className="text-body-compact text-destructive-ink">
                          {errors.changes}
                        </p>
                      ) : null}

                      <Field data-invalid={Boolean(errors.reason)}>
                        <FieldLabel
                          className="block w-full text-body font-semibold leading-snug"
                          htmlFor="edit-litigant-reason"
                        >
                          Why does the record need correcting?
                        </FieldLabel>
                        <FieldDescription>
                          The magistrate reads this to decide the application.
                        </FieldDescription>
                        <Textarea
                          id="edit-litigant-reason"
                          className="min-h-24"
                          value={reason}
                          onChange={(event) => {
                            setReason(event.target.value);
                            setErrors((c) => ({ ...c, reason: undefined }));
                          }}
                        />
                        <FieldError>{errors.reason}</FieldError>
                      </Field>

                      <Field>
                        <FieldLabel className="block w-full text-body font-semibold leading-snug">
                          Supporting document (optional)
                        </FieldLabel>
                        <FieldDescription>
                          Proof of the corrected detail, if there is one.
                        </FieldDescription>
                        <UploadedDocField
                          label="Supporting document"
                          file={docFile}
                          onFileChange={setDocFile}
                        />
                        <FieldDescription>{UPLOAD_HELP}</FieldDescription>
                      </Field>
                    </>
                  ) : (
                    <DescriptionList>
                      <ReviewRow term="Party">{litigant.name}</ReviewRow>
                      {changes.map((change) => (
                        <ReviewRow key={change.term} term={change.term}>
                          <span className="block">{change.value}</span>
                          {change.was ? (
                            <span className="block text-muted-foreground">
                              Was: {change.was}
                            </span>
                          ) : (
                            <span className="block text-muted-foreground">
                              Not on the record before
                            </span>
                          )}
                        </ReviewRow>
                      ))}
                      <ReviewRow term="Grounds">
                        <span className="whitespace-pre-wrap">{reason.trim()}</span>
                      </ReviewRow>
                      {docFile ? (
                        <ReviewRow term="Document">
                          <ReviewDocValue file={docFile} />
                        </ReviewRow>
                      ) : null}
                    </DescriptionList>
                  )}
                </form>
              </div>

              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                ) : (
                  <span aria-hidden className="hidden sm:block" />
                )}
                {step === 1 ? (
                  <Button type="submit" form="edit-litigant-form">
                    Continue
                  </Button>
                ) : (
                  <Button type="button" onClick={() => setAppStage("document")}>
                    Generate application
                  </Button>
                )}
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PartyGeneratedApplicationDialog
        open={appStage === "document"}
        onOpenChange={(next) => {
          if (!next) setAppStage("none");
        }}
        caseRef={caseRef}
        doc={{
          matter: "Application for the correction of a litigant's details",
          facts: [
            { term: "Party", value: litigant.name },
            ...changes.map((change) => ({
              term: change.term,
              value: change.was
                ? `${change.value} (recorded as ${change.was})`
                : change.value,
            })),
            ...(docFile ? [{ term: "Annexure", value: docFile.name }] : []),
          ],
          prayer: [
            `The applicant, counsel on record in the above matter, prays that the record of ${litigant.name} be corrected as set out above.`,
            `Grounds: ${reason.trim()}`,
            "It is prayed that this Hon'ble Court may allow this application and pass such orders as are deemed fit.",
          ],
        }}
        onAddSignature={() => setAppStage("sign")}
      />
      <PartySignatureDialog
        open={appStage === "sign"}
        onOpenChange={(next) => {
          if (!next) setAppStage("none");
        }}
        onBack={() => setAppStage("document")}
        onSigned={() => {
          setAppStage("none");
          setDone(true);
        }}
      />

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

function DoneStage({
  title,
  description,
  onDone,
}: {
  title: string;
  description: string;
  onDone: () => void;
}) {
  return (
    <>
      <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-info-muted text-info-muted-foreground">
            <HourglassIcon className="size-7" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <DialogTitle className="text-title-s font-semibold text-balance">
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <footer className="flex shrink-0 justify-end border-t border-hairline px-6 py-4">
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </footer>
    </>
  );
}

function ReviewRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <DescriptionRow className="grid-cols-1 sm:grid-cols-[minmax(7rem,10rem)_1fr]">
      <DescriptionTerm className="text-body-compact">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body-compact">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}
