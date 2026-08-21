"use client";

/**
 * The box the officer drew on an upload.
 *
 * Dristi already draws one of these — the OCR read region in `filing/source-panel.tsx` —
 * and `regionFromBox()` is its pixel→percentage mapping. The officer's annotation is the
 * same geometry with a different author, so it reuses that function rather than growing a
 * second one (brief D8). The DS request to pull the pattern up into the system is filed
 * (brief §13, request 2).
 *
 * The highlight is `aria-hidden` and the image carries a real alt, because a box drawn on
 * a scan is not information a screen reader can use — the officer's written note is what
 * carries the meaning, and it sits directly above this.
 */

import * as React from "react";
import { MaximizeIcon } from "lucide-react";

import { useFilePreview } from "@/lib/filing/files";
import type { DefectAnnotation } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/filing/lightbox";
import { regionFromBox } from "@/components/filing/source-panel";

export function AnnotationView({
  annotation,
  label,
}: {
  annotation: DefectAnnotation;
  label: string;
}) {
  const [zoom, setZoom] = React.useState(false);
  const preview = useFilePreview(annotation.file);
  const imageUrl = preview.status === "ready" ? preview.imageUrl : null;
  const region = regionFromBox(annotation.box, annotation.page);
  const alt = `${annotation.file.name} — the page scrutiny marked for ${label}`;

  if (preview.status === "loading") {
    return <Skeleton className="aspect-[9/4] w-full rounded-md" />;
  }

  if (!imageUrl) {
    return (
      <p className="text-caption text-muted-foreground">
        {annotation.file.name} — this browser does not hold the marked page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-md bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="block h-auto w-full" />
        {region ? (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-sm border-2 border-warning-ink bg-halo"
            style={region}
          />
        ) : null}
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
      </div>
      <p className="text-caption text-muted-foreground">
        Marked by scrutiny on {annotation.file.name}
      </p>
      <Lightbox open={zoom} onOpenChange={setZoom} src={imageUrl} alt={alt} />
    </div>
  );
}
