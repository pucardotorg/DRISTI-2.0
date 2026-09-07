"use client";

import { BUNDLE, shortDocName } from "@/lib/employee/scrutiny/bundle";
import { docMarkCount } from "@/lib/employee/scrutiny/field";
import type { FlagMap } from "@/lib/employee/scrutiny/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * The bundle's index.
 *
 * Deliberately NOT `DocumentSlot`: that component is documented for "a checklist of
 * expected documents where each item has its own upload state", and its own demo runs
 * past 400px. At the width this rail defaults to, its `p-4` + `gap-4` + 40px media
 * leaves ~117px for a filename — three-line wraps and a list that has to scroll.
 *
 * It is a plain `ghost` `Button` list rather than `SidebarMenuButton`, which was the
 * previous answer: that component carries the *navigation rail's* brand-tinted hover and
 * active states, and putting them in a page panel meant two things on screen claiming to
 * be the app's nav. The active document is marked with `accent`, which is the selection
 * role, and the rail spends no brand colour at all.
 */
export function IndexRail({
  flags,
  relatedDocId,
  onGoToDoc,
}: {
  flags: FlagMap;
  /** Doc the selected field points at — highlighted, not filtered away. */
  relatedDocId: string | null;
  onGoToDoc: (docId: string) => void;
}) {
  return (
    <aside
      className="flex h-full flex-col gap-1 overflow-y-auto bg-card p-2"
      aria-label="Document index"
    >
      <IndexRows
        flags={flags}
        relatedDocId={relatedDocId}
        onGoToDoc={onGoToDoc}
      />
    </aside>
  );
}

/**
 * The same index, as a detour, for the widths where there is no room for a third pane.
 *
 * A sheet rather than a vanishing rail: the officer asks for the index, reads it, picks a
 * document and it closes behind them — the same shape `HistorySheet` uses one control
 * along in the same bar.
 */
export function IndexSheet({
  open,
  onOpenChange,
  flags,
  relatedDocId,
  onGoToDoc,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flags: FlagMap;
  relatedDocId: string | null;
  onGoToDoc: (docId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
        <SheetHeader>
          <SheetTitle>Documents</SheetTitle>
          <SheetDescription>
            {BUNDLE.length} documents in this bundle. Picking one opens it in the
            bundle.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          <IndexRows
            flags={flags}
            relatedDocId={relatedDocId}
            onGoToDoc={onGoToDoc}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** One row per document: its number, its name, and what is standing against it. */
function IndexRows({
  flags,
  relatedDocId,
  onGoToDoc,
}: {
  flags: FlagMap;
  relatedDocId: string | null;
  onGoToDoc: (docId: string) => void;
}) {
  return (
    <>
      {BUNDLE.map((doc) => {
        const marks = docMarkCount(doc.id, flags);
        const current = relatedDocId === doc.id;
        return (
          <Button
            key={doc.id}
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start gap-2 px-2 font-normal",
              current && "bg-accent",
            )}
            aria-current={current ? "true" : undefined}
            onClick={() => onGoToDoc(doc.id)}
          >
            <span className="w-4 shrink-0 text-end text-caption text-muted-foreground tabular-nums">
              {doc.no}
            </span>
            {/* The row shows the short name because the rail is narrow; a screen reader
                gets the whole one, which is where the "— Complainant" half lives. */}
            <span
              className="min-w-0 flex-1 truncate text-start text-body-compact"
              aria-hidden="true"
            >
              {shortDocName(doc.name)}
            </span>
            <span className="sr-only">{doc.name}</span>
            {/* The badges are marks, so what they mean is said in words for anyone who
                cannot read a shape — never a `title` attribute, which no touch or
                keyboard user reaches. */}
            {doc.poorScan ? (
              <Badge variant="warning" className="shrink-0">
                <span aria-hidden="true">!</span>
                <span className="sr-only">poor scan</span>
              </Badge>
            ) : null}
            {marks > 0 ? (
              <Badge variant="destructive" className="shrink-0 tabular-nums">
                {marks}
                <span className="sr-only">
                  {marks === 1 ? " item raised" : " items raised"}
                </span>
              </Badge>
            ) : null}
          </Button>
        );
      })}
    </>
  );
}
