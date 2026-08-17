"use client";

/**
 * One document row on the case-documents screen.
 *
 * The DS `DocumentSlot` is the row; everything here composes *around* it rather than
 * restyling it. The slot's `label` takes a ReactNode, so the guidance ("The memo your
 * bank issued when this cheque bounced.") lives inside the row as a quiet second line
 * instead of an orphan caption underneath — which is also what stops the row from
 * collapsing into a label-left / button-right box with dead space in the middle.
 *
 * Actions sit once, as a flex sibling on the same sunken fill as the filled slot, so the
 * row still reads as one object at every width. The thumbnail is the preview control.
 */

import * as React from "react";
import { RefreshCwIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";

import { formatBytes, useFilePreview } from "@/lib/filing/files";
import { extractable } from "@/lib/filing/ocr";
import { extractedFieldCount } from "@/lib/filing/selectors";
import { cn } from "@/lib/utils";
import type { IntakeSlot } from "@/lib/filing/types";
import { Button } from "@/components/ui/button";
import { DocumentSlot } from "@/components/ui/document-slot";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDropTarget,
  type DroppedFiles,
} from "@/components/filing/upload/use-drop-target";

export const POOR_SCAN_HELP =
  "We couldn’t read this clearly. Re-upload a sharper copy so we can pre-fill your form, or type the details in later.";

export function slotStatus(
  slot: IntakeSlot
): "processing" | "filled" | "filled-poor" | "empty" | "empty-optional" {
  if (slot.processing) return "processing";
  if (slot.file) return slot.poor ? "filled-poor" : "filled";
  return slot.required ? "empty" : "empty-optional";
}

/** Caption under a filled row: what reading did with it. */
export function readSummary(
  slot: IntakeSlot
): { text: string; tone: "success" | "muted" } | null {
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

/**
 * The filled row's media well, and its preview control. Always a button — a PDF with no
 * image preview still has to be openable by keyboard and by voice.
 *
 * The DS media well is `overflow-hidden`, which would clip a focus ring, so focus is an
 * inset outline in the same `ring` colour.
 */
function SlotThumbnail({ slot, onPreview }: { slot: IntakeSlot; onPreview: () => void }) {
  const preview = useFilePreview(slot.file);
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview ${slot.file?.name ?? slot.label}`}
      className="size-full cursor-pointer rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {preview.status === "loading" ? (
        <Skeleton className="size-full rounded-md" />
      ) : preview.status === "ready" && preview.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={preview.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-caption font-semibold text-muted-foreground">
          {slot.file?.ext ?? "File"}
        </span>
      )}
    </button>
  );
}

/* ───────────────────────────── The row ─────────────────────────────────── */

export function IntakeSlotRow({
  slot,
  onChoose,
  onPreview,
  onDelete,
  onFiles,
  onOverChange,
}: {
  slot: IntakeSlot;
  onChoose: () => void;
  onPreview: () => void;
  onDelete: () => void;
  /** Files dropped on this row: the first fills this slot, the rest spill onward. */
  onFiles: (dropped: DroppedFiles) => void;
  onOverChange?: (over: boolean) => void;
}) {
  const ids = React.useId();
  const titleId = `${ids}-title`;
  const { isOver, dropProps } = useDropTarget({ onFiles, onOverChange });

  const status = slotStatus(slot);
  const pct = Math.round(slot.progress ?? 0);
  const showGuidance = !slot.file && !slot.processing && !!slot.desc;
  const summary = readSummary(slot);

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      {...dropProps}
      className="flex flex-col gap-2"
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg transition-shadow",
          // Same fill as the DS filled slot, so the slot and its actions read as one pill.
          slot.file && "bg-surface-sunken pr-2",
          isOver && "ring-3 ring-focus-ring"
        )}
      >
        <DocumentSlot
          status={status}
          media={slot.file ? "thumbnail" : "icon"}
          label={
            <span className="flex flex-col gap-0.5">
              <span id={titleId}>{slot.label}</span>
              {showGuidance ? (
                <span className="text-caption text-muted-foreground">{slot.desc}</span>
              ) : null}
            </span>
          }
          filename={slot.file?.name}
          meta={
            slot.processing
              ? `Reading document… ${pct}%`
              : slot.file
                ? formatBytes(slot.file.size)
                : undefined
          }
          /* Scan quality is only worth a chip when it is a problem — a good scan is
             already said in words by the read summary below. */
          quality={slot.poor && !slot.processing ? "poor" : undefined}
          thumbnail={
            slot.file ? <SlotThumbnail slot={slot} onPreview={onPreview} /> : undefined
          }
          onChooseFile={onChoose}
          /* h-10: the slot's own Choose file button is `size="sm"` (36px), under the DS
             40×40 touch floor (ACCESSIBILITY.md §8). Height only — see the build report. */
          className="min-w-0 flex-1 items-center [&>button]:h-10"
        />

        {slot.file ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Remove the file added for ${slot.label}`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon aria-hidden />
          </Button>
        ) : null}
      </div>

      {slot.processing ? (
        <Progress value={pct} aria-label={`Reading ${slot.label}`} />
      ) : null}

      {slot.file && slot.poor && !slot.processing ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex min-w-0 flex-1 items-start gap-1.5 text-caption text-warning-ink">
            <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
            {POOR_SCAN_HELP}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onChoose}
            aria-label={`Re-upload ${slot.label}`}
          >
            <RefreshCwIcon data-icon="inline-start" aria-hidden />
            Re-upload
          </Button>
        </div>
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
    </div>
  );
}
