"use client";

/**
 * Drag and drop for the case-documents screen.
 *
 * Drag is always an *addition* to the file picker, never the only path: every target that
 * uses this hook also carries a visible button, and coarse-pointer devices simply never
 * see a drag. The hook only reacts to drags that actually carry files, so dragging text,
 * a link, or a page element past a document row does nothing.
 */

import * as React from "react";

import { MAX_UPLOAD_BYTES } from "@/components/filing/use-file-picker";

/** What a drop yielded once the files we can't take were filtered out. */
export type DroppedFiles = {
  files: File[];
  /** How many of the dropped files were the wrong kind or over the size cap. */
  rejected: number;
};

/** The same contract the file picker enforces: a photo or a PDF, under the upload cap. */
function acceptable(file: File): boolean {
  const okType =
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    /\.(pdf|jpe?g|png|webp|heic)$/i.test(file.name);
  return okType && file.size <= MAX_UPLOAD_BYTES;
}

/** True only when the drag carries files — everything else is ignored. */
export function dragCarriesFiles(transfer: DataTransfer | null): boolean {
  return !!transfer && Array.from(transfer.types).includes("Files");
}

export function filesFromDrop(transfer: DataTransfer): DroppedFiles {
  const all = Array.from(transfer.files ?? []);
  const files = all.filter(acceptable);
  return { files, rejected: all.length - files.length };
}

/** Plain-words explanation when a drop was partly (or wholly) refused. */
export function dropProblemMessage(rejected: number, unplaced: number): string | null {
  const refused =
    rejected > 0
      ? `${rejected} ${rejected === 1 ? "file isn’t" : "files aren’t"} a photo (JPG, PNG, WEBP, HEIC) or a PDF under 15 MB`
      : null;
  const left =
    unplaced > 0
      ? `${unplaced} ${unplaced === 1 ? "file had" : "files had"} no empty document slot left to go into`
      : null;
  const advice =
    " Choose the file on the slot you want it in, or add another cheque or party first.";
  if (refused && left) return `${refused}, and ${left}.${advice}`;
  if (refused) return `${refused}.`;
  if (left) return `${left}.${advice}`;
  return null;
}

/**
 * Makes one element a drop target. Nested targets (a row inside a card) stop propagation,
 * so the row wins the drop; the card learns it lost through `onOverChange` and drops its
 * own highlight, which keeps exactly one target lit at a time.
 */
export function useDropTarget({
  onFiles,
  onOverChange,
}: {
  onFiles: (dropped: DroppedFiles) => void;
  /** Called when this target becomes — or stops being — the one under the pointer. */
  onOverChange?: (over: boolean) => void;
}) {
  const [isOver, setIsOver] = React.useState(false);
  const overRef = React.useRef(false);

  // Kept in refs so the handlers stay stable across renders of a long list of rows.
  const filesRef = React.useRef(onFiles);
  const changeRef = React.useRef(onOverChange);
  React.useEffect(() => {
    filesRef.current = onFiles;
    changeRef.current = onOverChange;
  });

  const setOver = React.useCallback((next: boolean) => {
    if (overRef.current === next) return;
    overRef.current = next;
    setIsOver(next);
    changeRef.current?.(next);
  }, []);

  // A drag that ends outside the window fires no dragleave on us — reset defensively.
  React.useEffect(() => {
    const reset = () => setOver(false);
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    return () => {
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
    };
  }, [setOver]);

  const dropProps = React.useMemo(
    () => ({
      onDragEnter: (event: React.DragEvent<HTMLElement>) => {
        if (!dragCarriesFiles(event.dataTransfer)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      },
      onDragOver: (event: React.DragEvent<HTMLElement>) => {
        if (!dragCarriesFiles(event.dataTransfer)) return;
        // Without preventDefault the browser refuses the drop and opens the file instead.
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      },
      onDragLeave: (event: React.DragEvent<HTMLElement>) => {
        // Moving onto a child still counts as inside this target.
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOver(false);
      },
      onDrop: (event: React.DragEvent<HTMLElement>) => {
        if (!dragCarriesFiles(event.dataTransfer)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        filesRef.current(filesFromDrop(event.dataTransfer));
      },
    }),
    [setOver]
  );

  return { isOver, dropProps };
}
