"use client";

import * as React from "react";

export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type PickError = "type" | "size";

/**
 * One hidden `<input type="file">` for a whole screen. `pick(cb)` opens the OS chooser
 * and calls back with the chosen file (or a reason it was refused). Render `<input />`
 * once anywhere in the screen's tree.
 */
export function useFilePicker() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const handler = React.useRef<((file: File | null, error?: PickError) => void) | null>(null);

  const pick = React.useCallback((cb: (file: File | null, error?: PickError) => void) => {
    handler.current = cb;
    const el = inputRef.current;
    if (!el) return;
    el.value = "";
    el.click();
  }, []);

  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const cb = handler.current;
    handler.current = null;
    if (!cb) return;
    if (!file) return cb(null);
    const okType =
      file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      /\.(pdf|jpe?g|png|webp|heic)$/i.test(file.name);
    if (!okType) return cb(null, "type");
    if (file.size > MAX_UPLOAD_BYTES) return cb(null, "size");
    cb(file);
  }, []);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_TYPES}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={onChange}
    />
  );

  return { pick, input };
}

export function pickErrorMessage(error: PickError): string {
  return error === "size"
    ? "That file is larger than 15 MB. Please choose a smaller scan or photo."
    : "Please choose a photo (JPG, PNG, WEBP, HEIC) or a PDF.";
}
