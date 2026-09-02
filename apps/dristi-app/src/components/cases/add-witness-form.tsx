"use client";

/**
 * Add witnesses — scenario 9 of the party-actions spec, rebuilt Sept 2 on
 * the e-filing Witnesses section (PM's reference; the earlier dialog was a
 * stale copy of a legacy form). Same questions, same controls, reused
 * directly from the filing kit:
 *
 * - identity is name OR designation either side of an OR rule, with age
 *   and "what will this witness prove" beside it;
 * - contact rows are mobile + email with Add more, both optional;
 * - ADDRESSES ARE MANDATORY (at least one complete, police station
 *   included) — "the court tries every address listed here";
 * - documents are a standard optional upload, not description boxes;
 * - multiple witnesses ride adjacent tabs, the filing section's own
 *   SectionTabs.
 *
 * Two steps, so no stepper (owner's rule). An application: the review ends
 * in the shared generate → sign → submit chain, and the done stage says
 * the witnesses are added when the order is passed.
 */

import { useMemo, useState } from "react";
import { HourglassIcon } from "lucide-react";

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
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldSeparator } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/filing/confirm-dialog";
import { HalfWidth } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { TextField } from "@/components/filing/inputs";
import { SectionNotice } from "@/components/filing/notices";
import { AddressBlockList, ContactList } from "@/components/filing/repeat-lists";
import { SectionTabs } from "@/components/filing/section-tabs";
import { FileField } from "@/components/cases/filing-form-shared";
import {
  PartyGeneratedApplicationDialog,
  PartySignatureDialog,
  type CaseRef,
} from "@/components/cases/party-application";
import { blankWitness } from "@/lib/filing/blank";
import { witnessComplete } from "@/lib/filing/selectors";
import type { AddressBlock, Witness } from "@/lib/filing/types";

/** The filing witness, plus this flow's optional document uploads. */
type DialogWitness = Witness & { docs: File[] };

function newWitness(): DialogWitness {
  return { ...blankWitness(), docs: [] };
}

/** The PM's rule: at least one address, complete to the police station. */
function addressComplete(block: AddressBlock): boolean {
  const { line1, city, pin, district, state } = block.addr;
  return Boolean(
    line1.trim() &&
      city.trim() &&
      pin.trim() &&
      district.trim() &&
      state.trim() &&
      block.police.trim()
  );
}

function witnessReady(w: DialogWitness): boolean {
  return witnessComplete(w) && w.addresses.some(addressComplete);
}

/** "Ramesh Nair" or the designation, for tabs, review rows and the paper. */
function witnessIdentity(w: DialogWitness): string {
  return w.fullName.trim() || w.designation.trim();
}

export function AddWitnessDialog({
  open,
  onOpenChange,
  caseRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseRef: CaseRef;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [witnesses, setWitnesses] = useState<DialogWitness[]>(() => [
    newWitness(),
  ]);
  const [activeId, setActiveId] = useState(() => witnesses[0].id);
  const [error, setError] = useState<string | undefined>(undefined);
  const [filesErrors, setFilesErrors] = useState<Record<string, string>>({});
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeNumber, setRemoveNumber] = useState(1);
  const [done, setDone] = useState(false);
  const [appStage, setAppStage] = useState<"none" | "document" | "sign">(
    "none"
  );
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);

  const found = witnesses.findIndex((w) => w.id === activeId);
  const index = found >= 0 ? found : witnesses.length - 1;
  const w = witnesses[index];

  const isDirty = useMemo(
    () =>
      witnesses.length > 1 ||
      witnessComplete(witnesses[0]) ||
      witnesses[0].addresses.length > 0 ||
      witnesses[0].contacts.length > 0 ||
      witnesses[0].docs.length > 0 ||
      Boolean(witnesses[0].age || witnesses[0].prove),
    [witnesses]
  );

  function setField<K extends keyof DialogWitness>(
    key: K,
    value: DialogWitness[K]
  ) {
    setWitnesses((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
    setError(undefined);
  }

  function addWitness() {
    const created = newWitness();
    setWitnesses((current) => [...current, created]);
    setActiveId(created.id);
  }

  function askRemove(id: string) {
    const i = witnesses.findIndex((item) => item.id === id);
    if (i < 0 || witnesses.length <= 1) return;
    setRemoveNumber(i + 1);
    setRemoveId(id);
  }

  function confirmRemove() {
    const i = removeId
      ? witnesses.findIndex((item) => item.id === removeId)
      : -1;
    if (i < 0 || witnesses.length <= 1) {
      setRemoveId(null);
      return;
    }
    const fallback = witnesses[i + 1] ?? witnesses[i - 1];
    setWitnesses((current) => current.filter((item) => item.id !== removeId));
    if (removeId === activeId && fallback) setActiveId(fallback.id);
    setRemoveId(null);
  }

  function resetForm() {
    const first = newWitness();
    setStep(1);
    setWitnesses([first]);
    setActiveId(first.id);
    setError(undefined);
    setFilesErrors({});
    setRemoveId(null);
    setDone(false);
    setAppStage("none");
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

  function continueToReview() {
    const missing = witnesses.findIndex((item) => !witnessReady(item));
    if (missing >= 0) {
      setActiveId(witnesses[missing].id);
      setError(
        witnessComplete(witnesses[missing])
          ? `Witness ${missing + 1} needs at least one complete address, police station included.`
          : `Witness ${missing + 1} needs a name or a designation.`
      );
      return;
    }
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
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {done ? (
            <>
              <DialogHeader className="shrink-0 px-6 py-5 pr-14 text-left">
                <div className="flex items-center gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-info-muted text-info-muted-foreground">
                    <HourglassIcon className="size-7" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <DialogTitle className="text-title-s font-semibold text-balance">
                      Application sent to the magistrate
                    </DialogTitle>
                    <DialogDescription>
                      {witnesses.length === 1
                        ? "The witness is added to the case once the order is passed."
                        : "The witnesses are added to the case once the order is passed."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <footer className="flex shrink-0 justify-end border-t border-hairline px-6 py-4">
                <Button type="button" onClick={closeClean}>
                  Done
                </Button>
              </footer>
            </>
          ) : (
            <>
              <DialogHeader className="shrink-0 gap-1.5 border-b border-hairline px-6 py-5 pr-14 text-left">
                <DialogTitle className="text-title-s font-semibold text-balance">
                  {step === 1 ? "Add witnesses" : "Review"}
                </DialogTitle>
                <DialogDescription>
                  {step === 1
                    ? "List the witnesses you intend to rely on, and how the court can reach them."
                    : "The application goes to the magistrate. The witnesses are added when the order is passed."}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {step === 1 ? (
                  <div className="flex flex-col gap-6">
                    <SectionTabs
                      tabs={witnesses.map((wit, i) => ({
                        id: wit.id,
                        label: `Witness ${i + 1}`,
                        status: witnessReady(wit) ? "complete" : "attention",
                        removable: witnesses.length > 1,
                      }))}
                      activeId={w.id}
                      onSelect={setActiveId}
                      onRemove={askRemove}
                      addLabel="Add witness"
                      onAdd={addWitness}
                    />

                    <section className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-body font-semibold leading-snug">
                          Witness {index + 1}
                        </h3>
                        <p className="text-body-compact text-muted-foreground">
                          Enough for the court to identify this witness.
                        </p>
                      </div>
                      <FormField
                        asGroup
                        label="How is this witness identified?"
                        required
                        help="Either one is enough. Use the designation if you only know the office they hold."
                        helpPlacement="above"
                      >
                        <div className="flex flex-col gap-4">
                          <FormField label="Full name">
                            <TextField
                              value={w.fullName}
                              onChange={(v) => setField("fullName", v)}
                              placeholder="e.g. Ramesh Nair"
                              autoComplete="off"
                            />
                          </FormField>

                          <FieldSeparator>OR</FieldSeparator>

                          <FormField label="Designation">
                            <TextField
                              value={w.designation}
                              onChange={(v) => setField("designation", v)}
                              placeholder="e.g. Bank Manager, SBI Sector 17"
                              autoComplete="off"
                            />
                          </FormField>
                        </div>
                      </FormField>

                      <HalfWidth>
                        <FormField label="Age" optional>
                          <TextField
                            value={w.age}
                            onChange={(v) => setField("age", v)}
                            placeholder="e.g. 42"
                            inputMode="numeric"
                          />
                        </FormField>
                      </HalfWidth>

                      <FormField label="What will this witness prove?" optional>
                        <Textarea
                          value={w.prove}
                          onChange={(e) => setField("prove", e.target.value)}
                          placeholder="e.g. Confirms the cheque was handed over on 4 March"
                        />
                      </FormField>
                    </section>

                    <Separator />

                    <section className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-body font-semibold leading-snug">
                          Contact details
                        </h3>
                        <p className="text-body-compact text-muted-foreground">
                          Optional. Where the court can reach this witness.
                        </p>
                      </div>
                      <ContactList
                        contacts={w.contacts}
                        onChange={(contacts) => setField("contacts", contacts)}
                        addLabel="Add more"
                        emailLabel="Email ID"
                        mobilePlaceholder="Enter mobile number"
                        emailPlaceholder="ex: xyz@gmail.com"
                      />
                    </section>

                    <Separator />

                    <section className="flex flex-col gap-4">
                      <h3 className="text-body font-semibold leading-snug">
                        Address details
                      </h3>
                      <SectionNotice variant="info">
                        The court tries every address listed here.
                      </SectionNotice>
                      <AddressBlockList
                        blocks={w.addresses}
                        onChange={(addresses) =>
                          setField("addresses", addresses)
                        }
                        addLabel="Add address"
                      />
                    </section>

                    <Separator />

                    <FileField
                      label="Documents to be presented"
                      description="Optional. Documents this witness will present to the court."
                      files={w.docs}
                      error={filesErrors[w.id]}
                      onFilesChange={(docs) => setField("docs", docs)}
                      onErrorChange={(message) =>
                        setFilesErrors((current) => ({
                          ...current,
                          [w.id]: message ?? "",
                        }))
                      }
                    />

                    <FieldError>{error}</FieldError>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {witnesses.map((wit, i) => (
                      <div key={wit.id} className="flex flex-col gap-4">
                        {i > 0 ? <Separator /> : null}
                        <h3 className="text-body font-semibold leading-snug">
                          Witness {i + 1}
                        </h3>
                        <DescriptionList>
                          <ReviewRow term="Identified as">
                            {witnessIdentity(wit)}
                            {wit.fullName.trim() && wit.designation.trim() ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · {wit.designation.trim()}
                              </span>
                            ) : null}
                          </ReviewRow>
                          {wit.age.trim() ? (
                            <ReviewRow term="Age">{wit.age.trim()}</ReviewRow>
                          ) : null}
                          {wit.prove.trim() ? (
                            <ReviewRow term="Will prove">
                              <span className="whitespace-pre-wrap">
                                {wit.prove.trim()}
                              </span>
                            </ReviewRow>
                          ) : null}
                          {wit.contacts.some(
                            (c) => c.mobile.trim() || c.email.trim()
                          ) ? (
                            <ReviewRow term="Contact">
                              {wit.contacts
                                .flatMap((c) =>
                                  [c.mobile.trim(), c.email.trim()].filter(
                                    Boolean
                                  )
                                )
                                .join(" · ")}
                            </ReviewRow>
                          ) : null}
                          <ReviewRow term="Addresses">
                            {wit.addresses
                              .filter(addressComplete)
                              .map(
                                (block) =>
                                  `${block.addr.line1.trim()}, ${block.addr.city.trim()}`
                              )
                              .join(" · ")}
                          </ReviewRow>
                          {wit.docs.length > 0 ? (
                            <ReviewRow term="Documents">
                              {wit.docs.map((file) => file.name).join(" · ")}
                            </ReviewRow>
                          ) : null}
                        </DescriptionList>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                {step === 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                ) : (
                  <span aria-hidden className="hidden sm:block" />
                )}
                {step === 1 ? (
                  <Button type="button" onClick={continueToReview}>
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setAppStage("document")}
                  >
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
          matter:
            witnesses.length === 1
              ? "Application for the addition of a witness"
              : "Application for the addition of witnesses",
          facts: witnesses.map((wit, i) => ({
            term: `Witness ${i + 1}`,
            value: `${witnessIdentity(wit)}${
              wit.prove.trim() ? ` — to prove: ${wit.prove.trim()}` : ""
            }`,
          })),
          prayer: [
            `The applicant, counsel on record in the above matter, prays that the ${
              witnesses.length === 1 ? "witness" : "witnesses"
            } named above be added to the case and summoned at the addresses on record.`,
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

      <ConfirmDialog
        open={removeId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRemoveId(null);
        }}
        title={`Remove witness ${removeNumber}`}
        description="Are you sure you want to delete this witness and all their details? This cannot be undone."
        confirmLabel="Yes, remove"
        onConfirm={confirmRemove}
      />

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
