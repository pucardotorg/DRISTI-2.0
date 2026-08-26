"use client";

/**
 * The browser-side reading engine: pdf.js text layer when a PDF has one, Tesseract.js
 * (LSTM, English, all assets served from /vendor) otherwise. One worker per tab, created
 * lazily; jobs run one at a time. Everything DOM-bound (canvas, images) lives here; the
 * parsers in ./parse-*.ts are pure.
 */

import { createWorker, OEM, PSM } from "tesseract.js";
import type Tesseract from "tesseract.js";

import { isPdfRef, renderPdfFirstPage } from "../files";
import type { ExtractBox, IntakeDocType, StoredFileRef } from "../types";
import type { ExtractionProgress, ExtractionResult, ExtractionStage } from "./index";
import { type OcrWord, type ParseInput, type ParsedFields } from "./parse-common";
import { parseDocument } from "./parsers";

/* ───────────────────────────── Tunables ───────────────────────────── */

/** Longest edge we hand to Tesseract — bigger is slower, not better. */
const MAX_EDGE = 2400;
/** Small images are upscaled to about this long edge (LSTM likes ~30px x-height). */
const MIN_EDGE = 1200;
const MAX_UPSCALE = 3;
/** Below this long edge the source is too small to trust. */
const TOO_SMALL_EDGE = 500;
/** A PDF text layer needs at least this many non-space characters to be used as-is. */
const MIN_TEXT_LAYER_CHARS = 40;
/** Mean word confidence under this marks the read as poor. */
const POOR_CONFIDENCE = 55;
const MIN_WORDS = 3;

/**
 * Page-segmentation passes per document type. SINGLE_BLOCK reads forms and letters best;
 * cheques also get a SPARSE_TEXT pass, which picks up the header (bank, IFSC) and the
 * date boxes that the block pass tends to skip. Fields from all passes are merged.
 */
const PSM_PASSES: Partial<Record<IntakeDocType, Tesseract.PSM[]>> = {
  "cheque-front": [PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT],
};
const DEFAULT_PASSES: Tesseract.PSM[] = [PSM.SINGLE_BLOCK];
/** When the first pass finds nothing, retry once as sparse text. */
const FALLBACK_PASS: Tesseract.PSM = PSM.SPARSE_TEXT;

/* ───────────────────────────── Worker ───────────────────────────── */

type Logger = (m: Tesseract.LoggerMessage) => void;

let workerPromise: Promise<Tesseract.Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();
const jobLoggers = new Map<string, Logger>();
const bootLoggers = new Set<Logger>();
let jobCounter = 0;

function routeLog(m: Tesseract.LoggerMessage) {
  const cb = m.userJobId ? jobLoggers.get(m.userJobId) : undefined;
  if (cb) cb(m);
  else for (const b of bootLoggers) b(m);
}

function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", OEM.LSTM_ONLY, {
      workerPath: "/vendor/tesseract/worker.min.js",
      corePath: "/vendor/tesseract/core",
      langPath: "/vendor/tesseract/lang",
      gzip: true,
      workerBlobURL: false,
      logger: routeLog,
      errorHandler: () => {},
    }).catch((e) => {
      workerPromise = null;
      throw e;
    });
    if (typeof window !== "undefined") {
      window.addEventListener(
        "pagehide",
        () => {
          const p = workerPromise;
          workerPromise = null;
          void p?.then((w) => w.terminate()).catch(() => {});
        },
        { once: true }
      );
    }
  }
  return workerPromise;
}

/** Run `fn` after every queued job — the worker is single-threaded anyway. */
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

/* ───────────────────────────── Progress ───────────────────────────── */

class Progress {
  private last = 0;
  private done = false;
  constructor(private readonly cb?: (p: ExtractionProgress) => void) {}
  set(stage: ExtractionStage, progress: number) {
    if (this.done || !this.cb) return;
    const p = Math.max(this.last, Math.min(100, Math.round(progress)));
    this.last = p;
    this.cb({ stage, progress: p });
  }
  finish() {
    this.done = true;
  }
}

/** Boot statuses (core, language, api) → 5–30; recognizing → the pass's slice of 30–95. */
function logToProgress(m: Tesseract.LoggerMessage, prog: Progress, passIndex: number, passCount: number) {
  const s = m.status ?? "";
  const p = typeof m.progress === "number" ? m.progress : 0;
  if (s === "recognizing text") {
    const base = 30 + (passIndex / passCount) * 65;
    prog.set("reading", base + (p * 65) / passCount);
  } else if (s.includes("core")) prog.set("loading", 5 + p * 10);
  else if (s === "initializing tesseract") prog.set("loading", 15);
  else if (s.includes("traineddata") || s.includes("language")) prog.set("loading", 15 + p * 10);
  else if (s.includes("api")) prog.set("loading", 25 + p * 5);
}

/* ───────────────────────────── Images ───────────────────────────── */

type Prepared = {
  blob: Blob;
  width: number;
  height: number;
  /** Long edge of the source, before any scaling. */
  sourceEdge: number;
};

async function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image could not be decoded"));
      img.src = url;
    });
  } finally {
    // Revoke after the current tick so a just-resolved <img> is still drawable.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Decode, honour EXIF orientation, scale to the OCR window and re-encode. */
async function prepareImage(blob: Blob): Promise<Prepared> {
  let source: ImageBitmap | HTMLImageElement | null = null;
  try {
    source = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    source = null;
  }
  if (!source) source = await loadImageElement(blob); // throws for HEIC etc.
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (!sw || !sh) throw new Error("Image has no pixels");
  const long = Math.max(sw, sh);
  let scale = 1;
  if (long > MAX_EDGE) scale = MAX_EDGE / long;
  else if (long < MIN_EDGE) scale = Math.min(MAX_UPSCALE, MIN_EDGE / long);
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  if ("close" in source) source.close();
  const type = blob.type === "image/png" ? "image/png" : "image/jpeg";
  const out = await canvasToBlob(canvas, type, 0.92);
  return { blob: out, width: w, height: h, sourceEdge: long };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image"))),
      type,
      quality
    );
  });
}

/* ───────────────────────────── OCR ───────────────────────────── */

type OcrPass = { words: OcrWord[]; lines: OcrWord[][]; text: string; meanConfidence: number };

function collectWords(page: Tesseract.Page): OcrPass {
  const words: OcrWord[] = [];
  const lines: OcrWord[][] = [];
  for (const b of page.blocks ?? []) {
    for (const p of b.paragraphs ?? []) {
      for (const l of p.lines ?? []) {
        const lw: OcrWord[] = [];
        for (const w of l.words ?? []) {
          const text = (w.text ?? "").trim();
          if (!text) continue;
          const bbox: ExtractBox = { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 };
          const ow: OcrWord = { text, confidence: Number.isFinite(w.confidence) ? w.confidence : 0, bbox };
          lw.push(ow);
          words.push(ow);
        }
        if (lw.length) lines.push(lw);
      }
    }
  }
  const meanConfidence = words.length ? words.reduce((s, w) => s + w.confidence, 0) / words.length : 0;
  return { words, lines, text: page.text ?? "", meanConfidence };
}

async function ocr(image: Blob, psm: Tesseract.PSM, prog: Progress, passIndex: number, passCount: number): Promise<OcrPass> {
  const jobId = `dristi-ocr-${++jobCounter}`;
  const log: Logger = (m) => logToProgress(m, prog, passIndex, passCount);
  // Waiting jobs see the worker boot too (core, language data) — it happens once per tab.
  bootLoggers.add(log);
  try {
    return await enqueue(async () => {
      jobLoggers.set(jobId, log);
      try {
        const worker = await getWorker();
        bootLoggers.delete(log);
        await worker.setParameters({ tessedit_pageseg_mode: psm }, `${jobId}-params`);
        const { data } = await worker.recognize(image, {}, { text: true, blocks: true }, jobId);
        return collectWords(data);
      } finally {
        jobLoggers.delete(jobId);
      }
    });
  } finally {
    bootLoggers.delete(log);
  }
}

/* ───────────────────────────── PDF text layer ───────────────────────────── */

function wordsFromTextLayer(items: { str: string; x: number; y: number; w: number; h: number }[]): OcrWord[] {
  const words: OcrWord[] = [];
  for (const it of items) {
    const str = it.str;
    if (!str.trim()) continue;
    const charW = str.length ? it.w / str.length : 0;
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(str))) {
      const x0 = it.x + m.index * charW;
      const x1 = it.x + (m.index + m[0].length) * charW;
      words.push({ text: m[0], confidence: 100, bbox: { x0, y0: it.y, x1, y1: it.y + it.h } });
    }
  }
  return words;
}

/* ───────────────────────────── Merge ───────────────────────────── */

function mergeFields(passes: ParsedFields[]): ParsedFields {
  const out: ParsedFields = {};
  for (const fields of passes) {
    for (const [k, f] of Object.entries(fields)) {
      const cur = out[k];
      if (!cur || f.confidence > cur.confidence) out[k] = f;
    }
  }
  return out;
}

/* ───────────────────────────── Entry ───────────────────────────── */

export async function runExtraction(
  blob: Blob,
  ref: StoredFileRef,
  docType: IntakeDocType,
  onProgress?: (p: ExtractionProgress) => void
): Promise<ExtractionResult> {
  const prog = new Progress(onProgress);
  try {
    const result = await extract(blob, ref, docType, prog);
    prog.set("parsing", 100);
    return result;
  } finally {
    prog.finish();
  }
}

async function extract(blob: Blob, ref: StoredFileRef, docType: IntakeDocType, prog: Progress): Promise<ExtractionResult> {
  const isPdf = isPdfRef(ref) || blob.type === "application/pdf";
  const extractedAt = () => new Date().toISOString();

  let image: Blob;
  let page: { width: number; height: number };
  let sourceEdge: number;

  if (isPdf) {
    prog.set("rendering", 2);
    const rendered = await renderPdfFirstPage(blob, { maxEdge: MAX_EDGE, cacheId: ref.id });
    if (!rendered) throw new Error("PDF could not be rendered");
    prog.set("rendering", 10);
    const textChars = rendered.text.replace(/\s/g, "").length;
    if (textChars >= MIN_TEXT_LAYER_CHARS) {
      const words = wordsFromTextLayer(rendered.items);
      prog.set("parsing", 95);
      const input: ParseInput = { text: rendered.text, words, page: { width: rendered.width, height: rendered.height } };
      const fields = safeParse(docType, input);
      return {
        extract: { engine: "pdf-text", confidence: 100, page: input.page, fields, extractedAt: extractedAt() },
        poor: false,
      };
    }
    image = await (await fetch(rendered.dataUrl)).blob();
    page = { width: rendered.width, height: rendered.height };
    sourceEdge = Math.max(rendered.width, rendered.height);
  } else {
    prog.set("rendering", 2);
    const prepared = await prepareImage(blob); // throws when the browser cannot decode (HEIC…)
    image = prepared.blob;
    page = { width: prepared.width, height: prepared.height };
    sourceEdge = prepared.sourceEdge;
    prog.set("rendering", 5);
  }

  const passes = PSM_PASSES[docType] ?? DEFAULT_PASSES;
  const runs: OcrPass[] = [];
  const parsed: ParsedFields[] = [];
  for (let i = 0; i < passes.length; i++) {
    const run = await ocr(image, passes[i], prog, i, passes.length);
    runs.push(run);
    parsed.push(safeParse(docType, { text: run.text, words: run.words, lines: run.lines, page }));
  }
  if (parsed.every((p) => Object.keys(p).length === 0) && !passes.includes(FALLBACK_PASS)) {
    const run = await ocr(image, FALLBACK_PASS, prog, passes.length - 1, passes.length);
    runs.push(run);
    parsed.push(safeParse(docType, { text: run.text, words: run.words, lines: run.lines, page }));
  }
  prog.set("parsing", 96);

  const best = runs.reduce((a, b) => (b.words.length > a.words.length ? b : a), runs[0]);
  const confidence = Math.round(best.meanConfidence);
  const fields = mergeFields(parsed);
  const poor =
    best.meanConfidence < POOR_CONFIDENCE || best.words.length < MIN_WORDS || sourceEdge < TOO_SMALL_EDGE;

  return {
    extract: { engine: "tesseract", confidence, page, fields, extractedAt: extractedAt() },
    poor,
  };
}

function safeParse(docType: IntakeDocType, input: ParseInput): ParsedFields {
  try {
    return parseDocument(docType, input);
  } catch {
    return {};
  }
}
