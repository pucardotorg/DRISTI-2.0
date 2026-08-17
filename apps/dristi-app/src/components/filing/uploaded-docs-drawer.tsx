"use client";

import * as React from "react";
import Link from "next/link";
import { FileTextIcon, UploadIcon } from "lucide-react";

import { useFilePreview } from "@/lib/filing/files";
import { extractable } from "@/lib/filing/ocr";
import { extractedFieldCount, uploadedIntakeSlots } from "@/lib/filing/selectors";
import { useFiling } from "@/lib/filing/store";
import type { IntakeSlot } from "@/lib/filing/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/filing/lightbox";

/** What reading did with each uploaded file. */
function readSummary(slot: IntakeSlot): { text: string; read: boolean } {
  if (slot.processing) return { text: "Reading…", read: false };
  if (!extractable(slot.docType)) return { text: "Uploaded", read: false };
  const n = extractedFieldCount(slot);
  if (n > 0) return { text: `Read · ${n} field${n === 1 ? "" : "s"} filled`, read: true };
  if (slot.poor) return { text: "Uploaded · poor scan", read: false };
  return { text: "Uploaded · nothing to pre-fill", read: false };
}

function DrawerRow({
  slot,
  onOpen,
}: {
  slot: IntakeSlot;
  onOpen: (src: string, alt: string) => void;
}) {
  const preview = useFilePreview(slot.file);
  const summary = readSummary(slot);
  const img = preview.status === "ready" ? preview.imageUrl : null;
  const body = (
    <>
      <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunken text-caption font-semibold text-muted-foreground">
        {preview.status === "loading" ? (
          <Skeleton className="size-full" />
        ) : img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          slot.file?.ext ?? "FILE"
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-body-compact font-medium text-foreground">
          {slot.label}
        </span>
        <span className="truncate text-caption text-muted-foreground">{slot.file?.name}</span>
        <span
          className={
            summary.read ? "text-caption text-success-ink" : "text-caption text-muted-foreground"
          }
        >
          {summary.text}
        </span>
      </span>
    </>
  );
  return img ? (
    <button
      type="button"
      onClick={() => onOpen(img, `Uploaded ${slot.label.toLowerCase()}`)}
      className="flex items-center gap-3 rounded-lg bg-surface-sunken p-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {body}
    </button>
  ) : (
    <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-2">{body}</div>
  );
}

/**
 * Right-hand drawer listing everything uploaded at intake, with the machine-read status
 * per file. Opened from the sidebar's "View uploaded documents".
 */
export function UploadedDocsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { draft, hrefFor } = useFiling();
  const files = uploadedIntakeSlots(draft.intake);
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Uploaded documents</SheetTitle>
            <SheetDescription>Read in your browser to pre-fill your form</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
            {files.length === 0 ? (
              <p className="text-body-compact text-muted-foreground">
                Nothing uploaded yet.
              </p>
            ) : (
              files.map((slot) => (
                <DrawerRow
                  key={slot.key}
                  slot={slot}
                  onOpen={(src, alt) => setLightbox({ src, alt })}
                />
              ))
            )}
          </div>

          <SheetFooter className="border-t border-hairline">
            <Button asChild className="w-full">
              <Link href={hrefFor("upload")}>
                <UploadIcon data-icon="inline-start" aria-hidden />
                Upload more documents
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={hrefFor("upload")}>
                <FileTextIcon data-icon="inline-start" aria-hidden />
                Manage documents
              </Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Lightbox
        open={!!lightbox}
        onOpenChange={(o) => !o && setLightbox(null)}
        src={lightbox?.src ?? ""}
        alt={lightbox?.alt ?? ""}
      />
    </>
  );
}

/** Small count chip used next to the drawer trigger. */
export function UploadedCountBadge() {
  const { draft } = useFiling();
  const n = uploadedIntakeSlots(draft.intake).length;
  return (
    <span className="text-body-compact tabular-nums text-muted-foreground" aria-label={`${n} uploaded`}>
      {n}
    </span>
  );
}
