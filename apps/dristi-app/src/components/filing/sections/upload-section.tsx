"use client";

/**
 * Case documents upload — the intake step that runs before the filing form.
 *
 * One card per cheque and per party, each holding DS `DocumentSlot` rows. Choosing a
 * file opens the OS picker; the file is stored (IndexedDB) and, for the document types we
 * can read, run through document reading in the browser — progress is the real read, and
 * whatever it finds lands on the draft as machine-read values the later steps show for
 * review. Everything is written to `draft.intake`, so add, remove and delete all persist.
 *
 * This route renders outside the sidebar shell, so it carries its own full-height column.
 */

import * as React from "react";
import {
  CheckIcon,
  CreditCardIcon,
  EyeIcon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react";

import {
  intakeChequeGroup,
  intakeOtherPartyDoc,
  intakePartyGroup,
} from "@/lib/filing/blank";
import { getRepository, storeUpload } from "@/lib/filing/data";
import { forgetFile, formatBytes, getFileBlob, useFilePreview } from "@/lib/filing/files";
import {
  applyExtraction,
  clearExtraction,
  extractDocument,
  extractable,
} from "@/lib/filing/ocr";
import { extractedFieldCount, findIntakeSlot, intakeProgress } from "@/lib/filing/selectors";
import { FILINGS_HOME } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import { cn } from "@/lib/utils";
import type { Intake, IntakeSlot } from "@/lib/filing/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentSlot } from "@/components/ui/document-slot";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import { PANEL_CLASS } from "@/components/filing/form-card";
import { SectionNotice } from "@/components/filing/notices";
import { pickErrorMessage, useFilePicker } from "@/components/filing/use-file-picker";

const POOR_SCAN_HELP =
  "We couldn’t read this clearly. Re-upload a sharper copy so we can pre-fill your form, or type the details in later.";

/* ───────────────────────────── Draft helpers ───────────────────────────── */

/** Every slot on the intake, in display order. */
function allSlots(intake: Intake): IntakeSlot[] {
  return [
    ...intake.cheques.flatMap((g) => g.slots),
    ...intake.parties.flatMap((g) => g.slots),
    ...intake.supporting,
  ];
}

/**
 * Keep slot keys unique. The factories derive keys from the group number, so adding a
 * group after a removal can otherwise reuse a key that is still on the draft.
 */
function withUniqueKeys(slots: IntakeSlot[], taken: Set<string>): IntakeSlot[] {
  return slots.map((slot) => {
    let key = slot.key;
    let suffix = 2;
    while (taken.has(key)) {
      key = `${slot.key}-${suffix}`;
      suffix += 1;
    }
    taken.add(key);
    return key === slot.key ? slot : { ...slot, key };
  });
}

function takenKeys(intake: Intake): Set<string> {
  return new Set(allSlots(intake).map((s) => s.key));
}

function slotStatus(
  slot: IntakeSlot
): "processing" | "filled" | "filled-poor" | "empty" | "empty-optional" {
  if (slot.processing) return "processing";
  if (slot.file) return slot.poor ? "filled-poor" : "filled";
  return slot.required ? "empty" : "empty-optional";
}

/** Caption under a filled row: what reading did with it. */
function readSummary(slot: IntakeSlot): { text: string; tone: "success" | "muted" } | null {
  if (!slot.file || slot.processing) return null;
  if (slot.error) return { text: slot.error, tone: "muted" };
  if (!extractable(slot.docType)) return null;
  const n = extractedFieldCount(slot);
  if (n > 0) {
    return {
      text: `Read · ${n} field${n === 1 ? "" : "s"} filled in your form`,
      tone: "success",
    };
  }
  if (slot.poor) return null; // the poor-scan help carries the message
  return {
    text: "Uploaded — nothing to pre-fill from this one; type the details in the form",
    tone: "muted",
  };
}

/* ───────────────────────────── Thumbnail ───────────────────────────────── */

function SlotThumbnail({ slot, onPreview }: { slot: IntakeSlot; onPreview: () => void }) {
  const preview = useFilePreview(slot.file);
  if (preview.status === "loading") return <Skeleton className="size-full rounded-md" />;
  if (preview.status !== "ready" || !preview.imageUrl) {
    return (
      <span className="flex size-full items-center justify-center text-caption font-semibold text-muted-foreground">
        {slot.file?.ext ?? ""}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview ${slot.file?.name ?? slot.label}`}
      className="size-full cursor-pointer rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview.imageUrl} alt="" className="size-full object-cover" />
    </button>
  );
}

/* ───────────────────────────── One document row ────────────────────────── */

/**
 * A DS `DocumentSlot` plus the row actions the primitive does not carry: preview (also on
 * the thumbnail), re-upload for a poor scan, and delete.
 */
function IntakeSlotRow({
  slot,
  onChoose,
  onPreview,
  onDelete,
}: {
  slot: IntakeSlot;
  onChoose: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const status = slotStatus(slot);
  const pct = Math.round(slot.progress ?? 0);
  const showDesc = !slot.file && !slot.processing && !!slot.desc;
  const summary = readSummary(slot);

  // Filled rows carry their actions inline on the right; the DS DocumentSlot has no
  // action slot, so the cluster overlays the row's right padding. Below `sm` the same
  // actions render as a row underneath instead.
  const actions = slot.file ? (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPreview}
        aria-label={`Preview ${slot.label}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <EyeIcon aria-hidden />
      </Button>
      {slot.poor ? (
        <Button
          type="button"
          variant="outline"
          onClick={onChoose}
          aria-label={`Re-upload ${slot.label}`}
        >
          <RefreshCwIcon data-icon="inline-start" aria-hidden />
          Re-upload
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`Delete ${slot.label}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2Icon aria-hidden />
      </Button>
    </>
  ) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <DocumentSlot
          status={status}
          media={slot.file ? "thumbnail" : "icon"}
          label={slot.label}
          required={slot.required}
          filename={slot.file?.name}
          meta={
            slot.processing
              ? `Reading document… ${pct}%`
              : slot.file
                ? formatBytes(slot.file.size)
                : undefined
          }
          quality={slot.file && !slot.processing ? (slot.poor ? "poor" : "good") : undefined}
          className={cn(
            "items-center",
            slot.file && (slot.poor ? "sm:pr-64" : "sm:pr-28")
          )}
          thumbnail={slot.file ? <SlotThumbnail slot={slot} onPreview={onPreview} /> : undefined}
          onChooseFile={onChoose}
        />
        {actions ? (
          <div className="absolute inset-y-0 right-3 hidden items-center gap-1 sm:flex">
            {actions}
          </div>
        ) : null}
      </div>

      {slot.processing ? (
        <Progress value={pct} aria-label={`Reading ${slot.label}`} />
      ) : null}

      {showDesc ? (
        <p className="text-caption text-muted-foreground">{slot.desc}</p>
      ) : null}

      {slot.file && slot.poor && !slot.processing ? (
        <p className="flex items-start gap-1.5 text-caption text-warning-ink">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          {POOR_SCAN_HELP}
        </p>
      ) : summary ? (
        <p
          className={cn(
            "text-caption",
            summary.tone === "success" ? "text-success-ink" : "text-muted-foreground"
          )}
        >
          {summary.text}
        </p>
      ) : null}

      {actions ? (
        <div className="flex flex-wrap items-center gap-1 sm:hidden">{actions}</div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Preview dialog body ─────────────────────── */

function PreviewBody({ slot }: { slot: IntakeSlot }) {
  const preview = useFilePreview(slot.file);
  if (preview.status === "loading") return <Skeleton className="h-64 w-full rounded-lg" />;
  if (preview.status === "ready" && preview.imageUrl) {
    return (
      <div className="overflow-hidden rounded-lg bg-surface-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview.imageUrl}
          alt={`Scan of ${slot.file?.name ?? slot.label}`}
          className="max-h-[60vh] w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg bg-surface-sunken text-muted-foreground">
      <FileTextIcon className="size-8" aria-hidden />
      <p className="text-body-compact">{slot.file?.name}</p>
      <p className="text-caption">
        {preview.status === "missing"
          ? "File not found in this browser"
          : "No preview for this file type"}
      </p>
    </div>
  );
}

/* ───────────────────────────────── Screen ──────────────────────────────── */

export function UploadSection() {
  const { draft, update, hrefFor } = useFiling();
  const intake = draft.intake;
  const { done, total, remaining, pct } = intakeProgress(intake);
  const { pick, input } = useFilePicker();

  const [previewKey, setPreviewKey] = React.useState<string | null>(null);
  const [pickError, setPickError] = React.useState<string | null>(null);

  /** Reads in flight, by slot key — a delete or re-upload cancels the older one. */
  const runs = React.useRef<Record<string, number>>({});

  const patchSlot = React.useCallback(
    (key: string, patch: (slot: IntakeSlot) => void) =>
      update((d) => {
        const slot = findIntakeSlot(d.intake, key);
        if (slot) patch(slot);
      }),
    [update]
  );

  /** Store the chosen file on a slot, then read it (when the type is readable). */
  const receiveFile = React.useCallback(
    async (key: string, file: File) => {
      const slot = findIntakeSlot(intake, key);
      if (!slot) return;
      const previous = slot.file;
      const runId = (runs.current[key] ?? 0) + 1;
      runs.current[key] = runId;

      let ref;
      try {
        ref = await storeUpload(file);
      } catch {
        setPickError("We couldn't store that file in this browser. Please try again.");
        return;
      }
      if (runs.current[key] !== runId) return;

      const readable = extractable(slot.docType);
      update((d) => {
        const s = findIntakeSlot(d.intake, key);
        if (!s) return;
        clearExtraction(d, key);
        s.file = ref;
        s.extract = undefined;
        s.error = undefined;
        s.poor = false;
        s.processing = readable;
        s.progress = 0;
      });
      if (previous) {
        forgetFile(previous.id);
        void getRepository().deleteFile(previous.id);
      }
      if (!readable) return;

      try {
        const blob = (await getFileBlob(ref.id)) ?? file;
        const result = await extractDocument(blob, ref, slot.docType, (p) => {
          if (runs.current[key] !== runId) return;
          patchSlot(key, (s) => {
            s.progress = p.progress;
          });
        });
        if (runs.current[key] !== runId) return;
        update((d) => {
          const s = findIntakeSlot(d.intake, key);
          if (!s || s.file?.id !== ref.id) return;
          s.processing = false;
          s.progress = 100;
          s.extract = result.extract;
          s.poor = result.poor;
          applyExtraction(d, key);
        });
      } catch {
        if (runs.current[key] !== runId) return;
        patchSlot(key, (s) => {
          s.processing = false;
          s.progress = 100;
          s.error = "Couldn't read this file — you can still continue and type the details.";
        });
      }
    },
    [intake, update, patchSlot]
  );

  /** Choose (or re-upload) a file for a slot. */
  const chooseFile = (key: string) => {
    setPickError(null);
    pick((file, error) => {
      if (error) {
        setPickError(pickErrorMessage(error));
        return;
      }
      if (file) void receiveFile(key, file);
    });
  };

  const dropFiles = (files: Array<IntakeSlot["file"]>) => {
    for (const f of files) {
      if (!f) continue;
      forgetFile(f.id);
      void getRepository().deleteFile(f.id);
    }
  };

  const deleteFile = (key: string) => {
    runs.current[key] = (runs.current[key] ?? 0) + 1;
    if (previewKey === key) setPreviewKey(null);
    const ref = findIntakeSlot(intake, key)?.file ?? null;
    update((d) => {
      const s = findIntakeSlot(d.intake, key);
      if (!s) return;
      clearExtraction(d, key);
      s.file = null;
      s.extract = undefined;
      s.error = undefined;
      s.processing = false;
      s.progress = 0;
      s.poor = false;
    });
    dropFiles([ref]);
  };

  const addCheque = () =>
    update((d) => {
      const group = intakeChequeGroup(d.intake.cheques.length + 1);
      group.slots = withUniqueKeys(group.slots, takenKeys(d.intake));
      d.intake.cheques.push(group);
    });

  const removeCheque = (index: number) => {
    const group = intake.cheques[index];
    if (!group) return;
    for (const slot of group.slots) runs.current[slot.key] = (runs.current[slot.key] ?? 0) + 1;
    update((d) => {
      for (const slot of d.intake.cheques[index]?.slots ?? []) clearExtraction(d, slot.key);
      d.intake.cheques.splice(index, 1);
      d.intake.cheques.forEach((c, i) => {
        c.n = i + 1;
      });
    });
    dropFiles(group.slots.map((s) => s.file));
  };

  const addParty = () =>
    update((d) => {
      const group = intakePartyGroup(d.intake.parties.length + 1);
      group.slots = withUniqueKeys(group.slots, takenKeys(d.intake));
      d.intake.parties.push(group);
    });

  const removeParty = (index: number) => {
    const group = intake.parties[index];
    if (!group) return;
    for (const slot of group.slots) runs.current[slot.key] = (runs.current[slot.key] ?? 0) + 1;
    update((d) => {
      for (const slot of d.intake.parties[index]?.slots ?? []) clearExtraction(d, slot.key);
      d.intake.parties.splice(index, 1);
      d.intake.parties.forEach((p, i) => {
        p.n = i + 1;
      });
    });
    dropFiles(group.slots.map((s) => s.file));
  };

  const addPartyDoc = (index: number) =>
    update((d) => {
      const party = d.intake.parties[index];
      if (!party) return;
      const [doc] = withUniqueKeys(
        [intakeOtherPartyDoc(party.n, party.slots.length + 1)],
        takenKeys(d.intake)
      );
      party.slots.push(doc);
    });

  const previewSlot = previewKey ? findIntakeSlot(intake, previewKey) : undefined;
  const previewFile = previewSlot?.file ?? null;

  const remainingLabel = remaining > 0 ? `${remaining} to go` : "all set";
  const footerText =
    remaining > 0
      ? `${remaining} required document${remaining > 1 ? "s" : ""} still needed`
      : "All required documents added";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col">
      {input}
      <FilingMain width="narrow">
        <FilingPageHeader
          eyebrow="Documents"
          title="Add your case documents"
          description="Put each document in its place. We read them and fill your form where we can — anything we can’t read, you type in. Add a card for every cheque and complainant in your case."
        />

        {/* Required-document progress */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Progress
            value={pct}
            aria-label="Required documents added"
            className="h-2 sm:flex-1"
          />
          <p className="text-body-compact text-muted-foreground">
            <span className="font-semibold text-foreground">
              {done} of {total}
            </span>{" "}
            required documents · {remainingLabel}
          </p>
        </div>

        {pickError ? (
          <SectionNotice
            variant="warning"
            title="That file wasn’t added"
            onDismiss={() => setPickError(null)}
          >
            {pickError}
          </SectionNotice>
        ) : null}

        {/* ── The cheques ── */}
        {intake.cheques.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-caption font-semibold text-muted-foreground">
              The cheques
            </h2>

            {intake.cheques.map((cheque, index) => (
              <Card key={cheque.slots[0]?.key ?? `cheque-${index}`} className={PANEL_CLASS}>
                <CardHeader>
                  <CardTitle>
                    <h3 className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                        <CreditCardIcon className="size-4" aria-hidden />
                      </span>
                      Cheque {cheque.n}
                    </h3>
                  </CardTitle>
                  {intake.cheques.length > 1 ? (
                    <CardAction>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => removeCheque(index)}
                      >
                        Remove this cheque
                      </Button>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {cheque.slots.map((slot) => (
                    <IntakeSlotRow
                      key={slot.key}
                      slot={slot}
                      onChoose={() => chooseFile(slot.key)}
                      onPreview={() => setPreviewKey(slot.key)}
                      onDelete={() => deleteFile(slot.key)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="w-fit" onClick={addCheque}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Add another cheque
            </Button>
          </section>
        ) : null}

        {/* ── Parties ── */}
        {intake.parties.length > 0 ? (
          <section className="flex flex-col gap-4">
            {intake.parties.map((party, index) => (
              <Card key={party.slots[0]?.key ?? `party-${index}`} className={PANEL_CLASS}>
                <CardHeader>
                  <CardTitle>
                    <h2 className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                        <UserRoundIcon className="size-4" aria-hidden />
                      </span>
                      Party {party.n} details
                    </h2>
                  </CardTitle>
                  {intake.parties.length > 1 ? (
                    <CardAction>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => removeParty(index)}
                      >
                        Remove
                      </Button>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {party.slots.map((slot) => (
                    <IntakeSlotRow
                      key={slot.key}
                      slot={slot}
                      onChoose={() => chooseFile(slot.key)}
                      onPreview={() => setPreviewKey(slot.key)}
                      onDelete={() => deleteFile(slot.key)}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => addPartyDoc(index)}
                  >
                    <PlusIcon data-icon="inline-start" aria-hidden />
                    Add other documents
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="w-fit" onClick={addParty}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Add another party
            </Button>
          </section>
        ) : null}

        {/* ── Supporting ── */}
        {intake.supporting.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-caption font-semibold text-muted-foreground">
              Supporting (optional)
            </h2>
            <div className="flex flex-col gap-3">
              {intake.supporting.map((slot) => (
                <IntakeSlotRow
                  key={slot.key}
                  slot={slot}
                  onChoose={() => chooseFile(slot.key)}
                  onPreview={() => setPreviewKey(slot.key)}
                  onDelete={() => deleteFile(slot.key)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </FilingMain>

      <FilingFooter
        backHref={FILINGS_HOME}
        continueHref={hrefFor("complainant")}
        continueLabel="Continue to filing"
        leading={
          <span className="flex items-center gap-2 text-body-compact text-muted-foreground">
            <span
              className={
                remaining > 0
                  ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-warning-muted text-warning-muted-foreground"
                  : "flex size-6 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground"
              }
            >
              {remaining > 0 ? (
                <TriangleAlertIcon className="size-4" aria-hidden />
              ) : (
                <CheckIcon className="size-4" aria-hidden />
              )}
            </span>
            {footerText}
          </span>
        }
      />

      {/* Document preview */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) setPreviewKey(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
              <Badge variant="secondary">{previewFile?.ext}</Badge>
              <span className="min-w-0 break-all">{previewFile?.name}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview of the file added for {previewSlot?.label}.
            </DialogDescription>
          </DialogHeader>

          {previewSlot ? <PreviewBody slot={previewSlot} /> : null}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (previewKey) chooseFile(previewKey);
              }}
            >
              Replace file
            </Button>
            <Button type="button" onClick={() => setPreviewKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
