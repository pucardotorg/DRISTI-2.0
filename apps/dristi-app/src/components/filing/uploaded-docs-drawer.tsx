"use client";

import * as React from "react";
import Link from "next/link";
import { FileTextIcon, UploadIcon } from "lucide-react";

import { useFilePreview } from "@/lib/filing/files";
import { extractable } from "@/lib/filing/ocr";
import { extractedFieldCount, uploadedIntakeSlots } from "@/lib/filing/selectors";
import { useFiling } from "@/lib/filing/store";
import type { IntakeSlot } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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
      {/* Page-shaped, not the DS square: a cropped 40×40 of a document reads as noise.
          Sized here rather than via variant="image" so nothing collides with `size-10`.
          `bg-card` because the row it sits in is already the sunken layer. */}
      <ItemMedia className="h-11 w-16 overflow-hidden rounded-sm bg-card [&_img]:size-full [&_img]:object-cover">
        {preview.status === "loading" ? (
          <Skeleton className="size-full" />
        ) : img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" />
        ) : (
          <span className="text-caption font-semibold text-muted-foreground">
            {slot.file?.ext ?? "FILE"}
          </span>
        )}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">{slot.label}</ItemTitle>
        <ItemDescription className="truncate">{slot.file?.name}</ItemDescription>
        <ItemDescription className={cn(summary.read && "text-success-ink")}>
          {summary.text}
        </ItemDescription>
      </ItemContent>
    </>
  );
  return img ? (
    <Item asChild className="bg-surface-sunken hover:bg-accent">
      <button
        type="button"
        onClick={() => onOpen(img, `Uploaded ${slot.label.toLowerCase()}`)}
      >
        {body}
      </button>
    </Item>
  ) : (
    <Item className="bg-surface-sunken">{body}</Item>
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
    <Badge variant="secondary" className="tabular-nums">
      {n}
      <span className="sr-only">uploaded</span>
    </Badge>
  );
}
