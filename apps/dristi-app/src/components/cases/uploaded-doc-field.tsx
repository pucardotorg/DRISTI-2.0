"use client";

/**
 * The Add-people dialogs' upload control, matching the join-a-case pattern
 * exactly (owner's call, Sept 1): DocumentSlot with a real thumbnail once a
 * file lands, a full-screen preview behind it, and Change/Remove links.
 * The advocate join dialog and both bail dialogs each carry a private
 * bilingual copy of this; this one is the cases-side EN variant.
 */

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DocumentSlot } from "@/components/ui/document-slot";
import {
  DocumentPreviewDialog,
  DocumentThumbnailButton,
  useObjectUrl,
} from "@/components/document-preview";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const UPLOAD_HELP = "Upload a JPG, JPEG, PNG or PDF up to 10 MB.";

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadedDocField({
  label,
  required = false,
  file,
  onFileChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const url = useObjectUrl(file);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next && next.size <= MAX_FILE_SIZE) onFileChange(next);
          // The same file can be picked again after a remove.
          event.target.value = "";
        }}
      />
      <DocumentSlot
        status={file ? "filled" : "empty"}
        media={file ? "thumbnail" : "icon"}
        label={label}
        required={required}
        filename={file?.name}
        meta={file ? fileSize(file.size) : undefined}
        thumbnail={
          file ? (
            <DocumentThumbnailButton
              file={file}
              url={url}
              locale="en"
              onOpen={() => setPreviewOpen(true)}
              className="size-full rounded-md"
            />
          ) : undefined
        }
        onChooseFile={() => inputRef.current?.click()}
      />
      {file ? (
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => inputRef.current?.click()}
          >
            Change file
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-destructive-ink"
            onClick={() => onFileChange(null)}
          >
            Remove
          </Button>
        </div>
      ) : null}
      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={file}
        url={url}
        locale="en"
        copy={{
          title: label,
          description: "Check the document is readable before continuing.",
          alt: label,
        }}
      />
    </>
  );
}
