"use client";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SourceRegion } from "@/components/filing/source-panel";

/** Full-size view of an uploaded image (cheque, Aadhaar, notice…). */
export function Lightbox({
  open,
  onOpenChange,
  src,
  alt,
  region,
  caption,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  /**
   * A box drawn over the page — the scrutiny officer's annotation, mapped by the same
   * `regionFromBox()` the OCR highlight uses (brief D8).
   *
   * An outline, and nothing else. The inline mark elsewhere dims everything *but* the box,
   * which is right at thumbnail size; at full size it would grey out the page the advocate
   * opened this view to read. The mark is not colour alone either way — the caption says
   * who drew it.
   */
  region?: SourceRegion;
  caption?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-[calc(100%-2rem)] p-0 sm:max-w-4xl", region && "gap-0")}>
        <DialogTitle className="sr-only">{alt || "Document"}</DialogTitle>
        {src ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="block max-h-[85vh] w-full rounded-xl bg-card object-contain"
            />
            {region ? (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-sm border-2 border-warning-ink"
                style={region}
              />
            ) : null}
          </div>
        ) : null}
        {caption ? (
          <p className="px-4 pb-4 text-caption text-muted-foreground">{caption}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
