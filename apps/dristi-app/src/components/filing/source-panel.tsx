"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  MaximizeIcon,
  UploadIcon,
} from "lucide-react";

import { useFilePreview } from "@/lib/filing/files";
import type { DocExtract, ExtractBox, StoredFileRef } from "@/lib/filing/types";
import { useRoomForLabelledNav, useSourceDock } from "@/hooks/use-min-width";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TOP_BAR_HEIGHT, useFilingChrome } from "@/components/filing/chrome";
import { useSourceRailSlot } from "@/components/filing/filing-shell";
import { Lightbox } from "@/components/filing/lightbox";

export type SourceChip = { label: string; active: boolean; onClick: () => void };

/** Highlight box over the document image, in percentages of the image box. */
export type SourceRegion = { left: string; top: string; width: string; height: string };

/** Pixel box from document reading → percentage region (with a little breathing room). */
export function regionFromBox(
  box: ExtractBox | undefined,
  page: DocExtract["page"] | undefined,
  pad = 0.01
): SourceRegion | undefined {
  if (!box || !page || !page.width || !page.height) return undefined;
  const l = Math.max(0, box.x0 / page.width - pad);
  const t = Math.max(0, box.y0 / page.height - pad);
  const r = Math.min(1, box.x1 / page.width + pad);
  const b = Math.min(1, box.y1 / page.height + pad);
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  return { left: pct(l), top: pct(t), width: pct(r - l), height: pct(b - t) };
}

export type SourcePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Field the panel explains ("Full name", "Date on cheque"). */
  title: string;
  eyebrow?: string;
  /** "Value used in this field" — editable when `onValueChange` is given. */
  value?: string;
  onValueChange?: (value: string) => void;
  chips?: SourceChip[];
  /** The uploaded document to show; `null` when nothing was uploaded for this field yet. */
  file: StoredFileRef | null;
  imageAlt: string;
  region?: SourceRegion;
  note?: string;
  /** Where "Replace" / "Upload" go — the intake step of this draft. */
  uploadHref: string;
};

/**
 * Whether the source rail is showing.
 *
 * From `xl` it is simply a column of the layout — always there, never collapsed, because
 * the document is the point of these screens and one more thing to open and shut is one
 * too many (owner, 2026-08-18). Below `xl` there is no room for a permanent column, so it
 * is a sheet that stays shut until "View source document" asks for it.
 */
export function useSourceOpenState(): [boolean, (open: boolean) => void] {
  const docked = useSourceDock();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  return [docked || sheetOpen, setSheetOpen];
}

/**
 * "Where did this value come from?" — the uploaded document with the read region
 * highlighted, plus the value box to correct a misread.
 *
 * From `xl` it is a permanent column of the shell beside the form, so the form is pushed
 * rather than covered and the sticky footer keeps its own width. Below `xl` there is no
 * room for a permanent column, so it is a sheet.
 */
export function SourcePanel(props: SourcePanelProps) {
  const docked = useSourceDock();
  const roomy = useRoomForLabelledNav();
  const slot = useSourceRailSlot();
  const { foldNav } = useFilingChrome();

  /**
   * A third column below `2xl` would leave the form too narrow to read. The nav gives up
   * its labels for it rather than the form its width — once, so a person who puts the
   * labels back is not overruled on the next render.
   */
  const crowded = docked && !roomy;
  const wasCrowded = React.useRef(false);
  React.useEffect(() => {
    if (crowded && !wasCrowded.current) foldNav();
    wasCrowded.current = crowded;
  }, [crowded, foldNav]);

  if (docked && slot) {
    return createPortal(
      <aside
        aria-label={`Source for ${props.title}`}
        style={{ top: TOP_BAR_HEIGHT, height: `calc(100svh - ${TOP_BAR_HEIGHT})` }}
        className="sticky flex w-(--source-panel-w) shrink-0 flex-col self-start overflow-y-auto border-l border-hairline bg-card"
      >
        <SourcePanelBody {...props} />
      </aside>,
      slot
    );
  }

  if (!props.open) return null;

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Source for {props.title}</SheetTitle>
          <SheetDescription>The uploaded document this value was read from.</SheetDescription>
        </SheetHeader>
        <SourcePanelBody {...props} />
      </SheetContent>
    </Sheet>
  );
}

function SourcePanelBody(p: SourcePanelProps) {
  const [zoom, setZoom] = React.useState(false);
  const preview = useFilePreview(p.file);
  const imageUrl = preview.status === "ready" ? preview.imageUrl : null;
  const fileUrl = preview.status === "ready" ? preview.fileUrl : null;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-hairline bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-muted text-info-muted-foreground"
          >
            <FileTextIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">{p.eyebrow ?? "Source"}</p>
            <p className="text-body font-semibold text-foreground">{p.title}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        {p.onValueChange !== undefined ? (
          <Field className="gap-2">
            <FieldLabel className="text-caption text-muted-foreground">
              Value used in this field
            </FieldLabel>
            <Input value={p.value ?? ""} onChange={(e) => p.onValueChange?.(e.target.value)} />
            <FieldDescription>
              Correct it here if we misread — this updates the form and clears the
              auto-filled marker.
            </FieldDescription>
          </Field>
        ) : null}

        {p.chips && p.chips.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted-foreground">Source documents</p>
            <div className="flex flex-wrap gap-2">
              {p.chips.map((c) => (
                <Button
                  key={c.label}
                  type="button"
                  size="sm"
                  variant={c.active ? "default" : "outline"}
                  aria-pressed={c.active}
                  onClick={c.onClick}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {!p.file ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-sunken px-6 py-8 text-center">
            <FileTextIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-body-compact text-muted-foreground">
              Nothing uploaded for this document yet.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={p.uploadHref}>
                <UploadIcon data-icon="inline-start" aria-hidden />
                Upload it
              </Link>
            </Button>
          </div>
        ) : preview.status === "loading" ? (
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        ) : imageUrl ? (
          <div className="group/img relative overflow-hidden rounded-xl bg-surface-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={p.imageAlt} className="block h-auto w-full" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setZoom(true)}
              className="absolute right-2 top-2 shadow-overlay"
            >
              <MaximizeIcon data-icon="inline-start" aria-hidden />
              Enlarge
            </Button>
            {p.region ? (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-md border-2 border-primary bg-halo shadow-[0_0_0_9999px_var(--color-scrim)] transition-all"
                style={{
                  left: p.region.left,
                  top: p.region.top,
                  width: p.region.width,
                  height: p.region.height,
                }}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg bg-surface-sunken text-muted-foreground">
            <FileTextIcon className="size-8" aria-hidden />
            <p className="text-body-compact">{p.file.name}</p>
            <p className="text-caption">No preview for this file type</p>
          </div>
        )}

        {p.note ? (
          <p className="text-caption text-muted-foreground">{p.note}</p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline">
            <Link href={p.uploadHref}>
              {p.file ? "Replace" : "Upload"}
              <UploadIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          {fileUrl ? (
            <Button asChild variant="secondary">
              <a href={fileUrl} target="_blank" rel="noreferrer">
                Open original source document
                <ArrowUpRightIcon data-icon="inline-end" aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {imageUrl ? (
        <Lightbox open={zoom} onOpenChange={setZoom} src={imageUrl} alt={p.imageAlt} />
      ) : null}
    </div>
  );
}

/** Pill button that re-opens a closed source panel ("View source document"). */
export function ViewSourceButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("rounded-full text-primary", className)}
    >
      <FileTextIcon data-icon="inline-start" aria-hidden />
      View source document
    </Button>
  );
}
