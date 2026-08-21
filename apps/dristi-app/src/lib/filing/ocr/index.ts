"use client";

/**
 * Document reading — the browser-side extractor the intake step calls after an upload.
 *
 * Contract (kept small so a server-side IDP can replace it):
 *   extractDocument(blob, ref, docType, onProgress) → { extract, poor }
 * where `extract.fields` uses the field keys listed in `./fields.ts` per document type.
 * `applyExtraction` / `clearExtraction` (in `./apply.ts`) move those fields onto the
 * draft with the "machine-read, please review" markers the sections render.
 */

import type { DocExtract, IntakeDocType, StoredFileRef } from "../types";

export type ExtractionStage = "loading" | "rendering" | "reading" | "parsing";

export type ExtractionProgress = { stage: ExtractionStage; progress: number };

export type ExtractionResult = {
  extract: DocExtract;
  /** Too little confidence (or too small an image) to trust the read. */
  poor: boolean;
};

/** Document types worth reading — the rest are stored and previewed only. */
export function extractable(docType: IntakeDocType): boolean {
  return (
    docType === "cheque-front" ||
    docType === "return-memo" ||
    docType === "demand-notice" ||
    docType === "dispatch-proof" ||
    docType === "delivery-proof" ||
    docType === "id-proof"
  );
}

export async function extractDocument(
  blob: Blob,
  ref: StoredFileRef,
  docType: IntakeDocType,
  onProgress?: (p: ExtractionProgress) => void
): Promise<ExtractionResult> {
  const { runExtraction } = await import("./engine");
  return runExtraction(blob, ref, docType, onProgress);
}

export { applyExtraction, clearExtraction } from "./apply";
