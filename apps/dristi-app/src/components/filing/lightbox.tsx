"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Full-size view of an uploaded image (cheque, Aadhaar, notice…). */
export function Lightbox({
  open,
  onOpenChange,
  src,
  alt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] p-0 sm:max-w-4xl">
        <DialogTitle className="sr-only">{alt || "Document"}</DialogTitle>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] w-full rounded-xl bg-card object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
