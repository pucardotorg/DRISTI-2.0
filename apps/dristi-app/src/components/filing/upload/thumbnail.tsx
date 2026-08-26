"use client";

/**
 * The preview control for an uploaded document — one implementation, two callers.
 *
 * It began on the case-documents row (`slot-row.tsx`) and the scrutiny inset needs the
 * same thing: the officer's evidence, and the flagged scan itself, are shown as the small
 * page-shaped thumbnail the advocate already knows from the upload screen, and clicking it
 * opens the full view (brief §15.2). Two copies of a control that opens a document is how
 * a product ends up with two ways to do the same thing, so it lives here.
 *
 * Always a `<button>`: a PDF with no image preview must still be openable by keyboard and
 * by voice. "You can enlarge this" cannot live on hover alone (`ACCESSIBILITY.md` §7), so
 * the scrim is revealed on hover *and* on keyboard focus, and stays visible where there is
 * no hover at all. It is decoration over the one control, not a second control.
 *
 * The DS media well is `overflow-hidden`, which would clip a focus ring, so focus is an
 * inset outline in the same `ring` colour.
 */

import * as React from "react";
import { Maximize2Icon } from "lucide-react";

import { useFilePreview } from "@/lib/filing/files";
import type { StoredFileRef } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SlotThumbnail({
  file,
  label,
  onPreview,
}: {
  file: StoredFileRef | undefined;
  /** What this document is, for the accessible name when the file has no name. */
  label: string;
  onPreview: () => void;
}) {
  const preview = useFilePreview(file);
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-label={`Preview ${file?.name ?? label}`}
      className="group/thumb relative size-full cursor-pointer rounded-md outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {preview.status === "loading" ? (
        <Skeleton className="size-full rounded-md" />
      ) : preview.status === "ready" && preview.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={preview.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-caption font-semibold text-muted-foreground">
          {file?.ext ?? "File"}
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

/**
 * The page-shaped box the thumbnail sits in, for callers outside the upload row — where
 * `DocumentSlot` provides its own media well. Page-shaped rather than square: a square
 * crop of a cheque or an AD card is noise.
 *
 * It carries a `hairline` edge inside a sunken inset, which is the DS's stated exception
 * for thumbnails (`foundations/elevation`) — the picture needs a boundary the fill cannot
 * give it.
 */
export function ThumbnailWell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-12 w-16 shrink-0 overflow-hidden rounded-md border border-hairline bg-card sm:h-14 sm:w-20",
        className
      )}
    >
      {children}
    </div>
  );
}
