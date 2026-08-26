"use client";

import { type ReactNode } from "react";
import { DownloadIcon, FileTextIcon, Maximize2Icon } from "lucide-react";

import {
  FilePreviewImage,
  formatFileSize,
  isPreviewableImage,
} from "@/components/cases/filing-form-shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * The one document preview in the product: a well, and the two things anyone
 * looking at a document immediately wants from it — a copy, and a bigger
 * read. Defined once so a filed order, a generated application and a file
 * still sitting on the filer's disk all offer the same affordances in the
 * same place under the same labels.
 *
 * Three content shapes, because the product genuinely has three:
 * a document the server can serve, a document composed in the browser with no
 * file behind it, and a file the filer picked that has not been uploaded yet.
 */
export type DocumentPreviewSource =
  /** A served file — the browser's own viewer renders it in an iframe. */
  | { kind: "src"; src: string }
  /** Chosen locally and not uploaded. Images render; PDFs cannot here. */
  | { kind: "file"; file: File }
  /** Markup with no file behind it, e.g. the generated application. */
  | { kind: "composed"; content: ReactNode };

/**
 * Where Download points. A served document is an anchor; a document composed
 * in the browser has to be written by whoever knows how to compose it.
 */
export type DocumentDownload =
  | { href: string; filename?: string; label?: string }
  | { onDownload: () => void; label?: string };

/**
 * A document composed in the browser has nothing to download unless the
 * caller says how, so the button is omitted rather than shipped dead. A
 * served file always has its own URL, and a locally chosen file always has an
 * object URL, so both default to something that actually works.
 */
function resolveDownload(
  source: DocumentPreviewSource,
  download: DocumentDownload | undefined
): DocumentDownload | undefined {
  if (download) return download;
  if (source.kind === "src") return { href: source.src };
  if (source.kind === "file") {
    const { file } = source;
    return { onDownload: () => downloadLocalFile(file) };
  }
  return undefined;
}

/**
 * The object URL is released straight after the synthetic click, which is
 * when the browser has already taken the blob — the same pairing the
 * generated application's text download uses.
 */
function downloadLocalFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Full view only promises what it can deliver. A PDF chosen locally is not
 * rendered anywhere in the filing flow, so offering to enlarge it would open
 * a full-screen dialog onto the same "not previewed here" placard.
 */
function canExpand(source: DocumentPreviewSource): boolean {
  return source.kind !== "file" || isPreviewableImage(source.file);
}

const wellHeight = {
  /** The standard well — a document among other facts. */
  default: "h-96",
  /** Viewport-relative, for a record where the document *is* the record. */
  tall: "h-[60svh]",
  /** Takes the height its container can spare. */
  fill: "min-h-64 flex-1",
} as const;

/**
 * Preview well plus its action row, for any surface that shows one document.
 *
 * Surfaces that cannot hang their actions off this header — the case file,
 * whose PDF and digital reads share one grid cell — compose
 * `DocumentPreviewActions` directly instead.
 */
export function DocumentPreview({
  title,
  description,
  source,
  download,
  height = "default",
  actions,
  className,
}: {
  /** The document's own name. Heads the section and names both actions. */
  title: string;
  /** Optional sub-label, e.g. which file of how many is on screen. */
  description?: ReactNode;
  source: DocumentPreviewSource;
  download?: DocumentDownload;
  height?: keyof typeof wellHeight;
  /** Surface-specific controls, placed ahead of Download in the same row. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      {/*
        The header sticks to the top of whatever scrolls it, so Download and
        Full view stay reachable while a tall document scrolls past — the
        reason the record dialogs used to pin a footer, answered without
        spending each dialog's one primary on Download.

        bg-popover because a sticky bar has to be opaque against the surface
        sliding under it, and every caller is inside a Dialog. The gap under
        the title lives inside the sticky box as padding: as a flex gap it
        would be a transparent seam for the well to show through.
      */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-popover pb-3 sm:flex-row sm:items-center sm:justify-between">
        {/*
          Wraps rather than truncates. A document title runs long — longer
          again once it is translated — and cropping the only thing naming
          what you are about to download is not a trade worth making.
        */}
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-body font-medium break-words text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="text-body-compact text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <DocumentPreviewActions
          title={title}
          source={source}
          download={download}
          className="shrink-0"
        >
          {actions}
        </DocumentPreviewActions>
      </div>
      <DocumentWell
        title={title}
        source={source}
        className={wellHeight[height]}
      />
    </section>
  );
}

/**
 * Download and Full view on their own, for a surface whose layout cannot put
 * them in a preview header.
 */
export function DocumentPreviewActions({
  title,
  source,
  download,
  className,
  children,
}: {
  title: string;
  source: DocumentPreviewSource;
  download?: DocumentDownload;
  className?: string;
  children?: ReactNode;
}) {
  const resolved = resolveDownload(source, download);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {resolved ? <DownloadAction title={title} download={resolved} /> : null}
      {canExpand(source) ? (
        <FullViewDialog title={title} source={source} download={resolved} />
      ) : null}
    </div>
  );
}

/**
 * Ghost, not primary: these dialogs are for reading, and the teal each one
 * has left to spend belongs to whatever act the dialog exists to complete —
 * Add signature, Submit — or to nothing at all on a read-only record (Laws
 * ration teal; they cap primaries, they do not require one).
 *
 * The visible label stays "Download" and the accessible name extends it with
 * the document's name, so the spoken name still starts with what is written
 * on the button (WCAG 2.5.3).
 */
function DownloadAction({
  title,
  download,
}: {
  title: string;
  download: DocumentDownload;
}) {
  const label = download.label ?? `Download ${title}`;

  if ("href" in download) {
    return (
      <Button variant="ghost" className="shrink-0" asChild>
        <a
          href={download.href}
          download={download.filename ?? true}
          aria-label={label}
        >
          Download
          <DownloadIcon data-icon="inline-end" aria-hidden />
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="shrink-0"
      aria-label={label}
      onClick={download.onDownload}
    >
      Download
      <DownloadIcon data-icon="inline-end" aria-hidden />
    </Button>
  );
}

/**
 * The same document, near the size of the window.
 *
 * A dialog rather than a new tab: the generated application is composed in
 * the browser with no file behind it, so there is nothing for a tab to load —
 * and one behaviour on every surface beats a tab here and a dialog there.
 *
 * On the record dialogs this opens inside an already-open Dialog. Radix
 * stacks dismissable layers, so Escape closes this viewer and leaves the
 * record behind it open; DialogTrigger wires aria-haspopup / aria-expanded
 * and returns focus to the trigger on close without any help from us.
 */
function FullViewDialog({
  title,
  source,
  download,
}: {
  title: string;
  source: DocumentPreviewSource;
  download: DocumentDownload | undefined;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0"
          aria-label={`Full view of ${title}`}
        >
          Full view
          <Maximize2Icon data-icon="inline-end" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[92svh] flex-col gap-4 overflow-hidden sm:max-w-[calc(100%-4rem)]">
        {/*
          Same rule as the inline header: title left, actions right. Download
          is repeated rather than duplicated — the row that carries it is
          behind this overlay and cannot be reached while the viewer is open.
          pr-12 keeps it clear of the primitive's close button.
        */}
        <div className="flex shrink-0 flex-col gap-2 pr-12 sm:flex-row sm:items-center sm:justify-between">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-title-s font-semibold break-words">
              {title}
            </DialogTitle>
            <DialogDescription className="text-body-compact">
              Full view — close to go back.
            </DialogDescription>
          </DialogHeader>
          {download ? (
            <DownloadAction title={title} download={download} />
          ) : null}
        </div>
        <DocumentWell
          title={title}
          source={source}
          className="min-h-0 flex-1"
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The well itself. surface-sunken with no border and no shadow — a document
 * preview is the nested media well the Laws name, and depth here is fill
 * (Elevation: the box-in-box ban).
 */
function DocumentWell({
  title,
  source,
  className,
}: {
  title: string;
  source: DocumentPreviewSource;
  className?: string;
}) {
  if (source.kind === "src") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface-sunken",
          className
        )}
      >
        {/* Keyed on the src so switching documents rebuilds the viewer
            rather than leaving the previous one's scroll position behind. */}
        <iframe
          key={source.src}
          title={title}
          src={source.src}
          className="absolute inset-0 size-full border-0 bg-paper"
        />
      </div>
    );
  }

  // A well the browser does not scroll for us has to be focusable, or its
  // content is unreachable without a pointer.
  const scrollableWell = cn(
    "flex overflow-auto overscroll-contain rounded-xl bg-surface-sunken p-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    className
  );

  if (source.kind === "composed") {
    return (
      <div
        tabIndex={0}
        aria-label={`Preview of ${title}`}
        className={cn(scrollableWell, "flex-col")}
      >
        {/* Capped so full view buys a bigger document, not a longer line —
            past about 90 characters a paragraph gets harder to read, not
            easier. Inert at the widths the inline well ever reaches. */}
        <div className="mx-auto w-full max-w-4xl">{source.content}</div>
      </div>
    );
  }

  const { file } = source;

  return (
    <div
      tabIndex={0}
      aria-label={`Preview of ${title}`}
      className={scrollableWell}
    >
      {/*
        Centred with margin auto rather than items-center: a flex-centred
        child that outgrows a scroll container has its top edge clipped away,
        and a document is exactly the thing you cannot afford to crop.
      */}
      {isPreviewableImage(file) ? (
        <FilePreviewImage
          file={file}
          className="m-auto block h-auto max-w-full rounded-md"
        />
      ) : (
        <div className="m-auto flex flex-col items-center gap-3 py-8 text-center">
          <FileTextIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="text-body font-medium">{file.name}</p>
          <p className="text-body-compact text-muted-foreground">
            {formatFileSize(file.size)} · PDF pages are not previewed here.
          </p>
        </div>
      )}
    </div>
  );
}
