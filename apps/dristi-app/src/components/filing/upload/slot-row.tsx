"use client";

/**
 * One document row on the case-documents screen.
 *
 * The DS `DocumentSlot` is the row; everything here composes *around* it rather than
 * restyling it. The slot's `label` takes a ReactNode, so the guidance ("The memo your
 * bank issued when this cheque bounced.") and the read status both live *inside* the row
 * as quiet lines under the title. Nothing about a row's state floats underneath it as an
 * orphan paragraph — that is what used to leave the re-upload button aligned to nothing.
 *
 * Every action sits in one right-aligned cluster at the end of the row, delete always
 * last, so the final control lines up down the column whether a row offers re-upload,
 * delete, or only the slot's own "Choose file". The thumbnail is the preview control.
 */

import * as React from "react";
import {
  CircleCheckIcon,
  Maximize2Icon,
  RefreshCwIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";

import { formatBytes, useFilePreview } from "@/lib/filing/files";
import { cn } from "@/lib/utils";
import type { IntakeSlot } from "@/lib/filing/types";
import { Button } from "@/components/ui/button";
import { DocumentSlot } from "@/components/ui/document-slot";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCorrection } from "@/components/filing/posture";
import { readOutcome, readToneClass } from "@/components/filing/upload/read-status";
import {
  useDropTarget,
  type DroppedFiles,
} from "@/components/filing/upload/use-drop-target";

/**
 * The DS status variant. Never `filled-poor`: that variant forces the "Poor scan" badge,
 * and low confidence is not the outcome — a poor scan that filled seven fields is a read,
 * not a failure. What reading produced is said in words on the row's status line, which
 * is the row's single status cue. See `read-status.ts`.
 */
function slotStatus(
  slot: IntakeSlot
): "processing" | "filled" | "empty" | "empty-optional" {
  if (slot.processing) return "processing";
  if (slot.file) return "filled";
  return slot.required ? "empty" : "empty-optional";
}

/**
 * The media well, page-shaped rather than the DS square — a square crop of a cheque or an
 * Aadhaar card is noise, which is the same conclusion the uploaded-documents drawer
 * reached. The same box empty or filled, so a row does not jump when a file lands.
 * Overridden from the row because `DocumentSlot` fixes it at `size-16` / `size-10`.
 */
const MEDIA_CLASS = [
  "[&_[data-slot=document-slot-media]]:h-12",
  "[&_[data-slot=document-slot-media]]:w-16",
  "sm:[&_[data-slot=document-slot-media]]:h-14",
  "sm:[&_[data-slot=document-slot-media]]:w-20",
].join(" ");

/* ───────────────────────────── Thumbnail ───────────────────────────────── */

/**
 * The filled row's media well, and its preview control. Always a button — a PDF with no
 * image preview still has to be openable by keyboard and by voice.
 *
 * "You can enlarge this" cannot live on hover alone (ACCESSIBILITY §7), so the scrim is
 * revealed on hover *and* on keyboard focus, and stays visible where there is no hover at
 * all. It is decoration over the one control, not a second control.
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
      className="group/thumb relative size-full cursor-pointer rounded-md outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
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

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-scrim opacity-0 transition-opacity group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100 pointer-coarse:opacity-100"
      >
        {/* The glyph rides its own card-on-scrim chip: `scrim` is a 50% black wash in both
            themes, and no foreground token stays light in both. */}
        <span className="flex size-6 items-center justify-center rounded-full bg-card text-foreground">
          <Maximize2Icon className="size-3.5" />
        </span>
      </span>
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

  /*
   * In a correction round a document is either the one scrutiny flagged — and then it is
   * replaced inside its defect frame, in place (brief D9) — or it is not this round's
   * business. `inert` is the honest lock: the subtree stops taking pointer and keyboard
   * both, rather than looking live and refusing.
   */
  const correction = useCorrection();
  const defect = correction ? correction.defectForSlot(correction.step, slot.key) : null;
  const locked = !!correction && !defect;

  const status = slotStatus(slot);
  const pct = Math.round(slot.progress ?? 0);
  const showGuidance = !slot.file && !slot.processing && !!slot.desc;

  const outcome = readOutcome(slot);
  /* While the read is running the slot's meta line and the progress bar already say so;
     a third "Reading…" line would be the same fact three times. */
  const statusLine = outcome && outcome.kind !== "reading" ? outcome : null;
  const StatusIcon = statusLine?.tone === "success" ? CircleCheckIcon : TriangleAlertIcon;

  const body = (
    <div
      role="group"
      aria-labelledby={titleId}
      {...(locked ? {} : dropProps)}
      inert={locked || undefined}
      className={cn("flex flex-col gap-2", locked && "opacity-60")}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg transition-shadow",
          // Same fill as the DS filled slot, so the slot and its actions read as one pill.
          slot.file && "bg-surface-sunken pr-4",
          isOver && "ring-3 ring-focus-ring"
        )}
      >
        <DocumentSlot
          status={status}
          media={slot.file ? "thumbnail" : "icon"}
          label={
            <span className="flex flex-col gap-1">
              <span id={titleId}>{slot.label}</span>
              {showGuidance ? (
                <span className="text-caption text-muted-foreground">{slot.desc}</span>
              ) : null}
              {statusLine ? (
                <span
                  className={cn(
                    "flex items-start gap-1.5 text-caption",
                    readToneClass(statusLine.tone)
                  )}
                >
                  {statusLine.tone === "muted" ? null : (
                    <StatusIcon className="size-4 shrink-0" aria-hidden />
                  )}
                  <span>{statusLine.text}</span>
                </span>
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
          thumbnail={
            slot.file ? <SlotThumbnail slot={slot} onPreview={onPreview} /> : undefined
          }
          onChooseFile={onChoose}
          /* h-10: the slot's own Choose file button is `size="sm"` (36px), under the DS
             40×40 touch floor (ACCESSIBILITY.md §8). Height only — see the build report.
             The empty well is the one place its icon is the primary content, so it takes
             the 24px step, on `surface-sunken` because `muted` is invisible on a card. */
          className={cn(
            "min-w-0 flex-1 items-center [&>button]:h-10",
            MEDIA_CLASS,
            slot.file
              ? "[&_[data-slot=document-slot-media]]:bg-card"
              : "[&_[data-slot=document-slot-media]]:bg-surface-sunken [&_[data-slot=document-slot-media]_svg]:size-6"
          )}
        />

        {/* One cluster, vertically centred, delete always last — so the right edge of the
            row's actions is the same on every row whatever a row can do. */}
        {slot.file ? (
          <div className="flex shrink-0 items-center gap-1">
            {statusLine?.reupload ? (
              /* Labelled where there is room; a 40×40 icon button on a phone, where a
                 118px label would leave the status line about fifty pixels to wrap in.
                 The accessible name carries the label at every width. */
              <Button
                type="button"
                variant="outline"
                onClick={onChoose}
                aria-label={`Re-upload ${slot.label}`}
                className="max-sm:w-10 max-sm:gap-0 max-sm:px-0 max-sm:has-data-[icon=inline-start]:pl-0"
              >
                <RefreshCwIcon data-icon="inline-start" aria-hidden />
                <span className="max-sm:sr-only">Re-upload</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label={`Remove the file added for ${slot.label}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {slot.processing ? (
        <Progress value={pct} aria-label={`Reading ${slot.label}`} />
      ) : null}
    </div>
  );

  if (defect && correction) return <>{correction.renderDocDefect(defect, body)}</>;
  return body;
}
