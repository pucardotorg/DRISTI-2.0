"use client";

/**
 * A lightweight ID-document picker. Prototype only: it records the chosen file's name,
 * not its bytes — the real storage seam plugs in behind this without the screen changing.
 */

import * as React from "react";
import { FileCheck2Icon, UploadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function IdUpload({
  value,
  onChange,
  label = "Upload ID card",
}: {
  value: string;
  onChange: (filename: string) => void;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
        <FileCheck2Icon aria-hidden className="size-5 shrink-0 text-success-ink" />
        <span className="min-w-0 flex-1 truncate text-body-compact">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove ID"
          onClick={() => onChange("")}
          className="text-muted-foreground"
        >
          <XIcon aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f.name);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        className="w-fit"
      >
        <UploadIcon aria-hidden />
        {label}
      </Button>
    </>
  );
}
