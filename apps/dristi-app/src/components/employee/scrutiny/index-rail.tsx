"use client";

import { BUNDLE, shortDocName } from "@/lib/employee/scrutiny/bundle";
import { docMarkCount } from "@/lib/employee/scrutiny/field";
import type { FlagMap } from "@/lib/employee/scrutiny/types";
import { Badge } from "@/components/ui/badge";
import { SidebarMenuButton } from "@/components/ui/sidebar";

/**
 * The bundle's index.
 *
 * Deliberately NOT `DocumentSlot`: that component is documented for "a checklist of
 * expected documents where each item has its own upload state", and its own demo runs
 * past 400px. At the ~230px this rail defaults to, its `p-4` + `gap-4` + 40px media
 * leaves ~117px for a filename — three-line wraps and a list that has to scroll. This is
 * the DS's own compact sidebar-menu-button row instead.
 *
 * That recipe carries `[&>span:last-child]:truncate`, so the filename span is given
 * `truncate min-w-0 flex-1` explicitly — otherwise the badge is what gets truncated.
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
      className="flex h-full flex-col gap-0.5 overflow-y-auto bg-card p-2"
      aria-label="Document index"
    >
      {BUNDLE.map((doc) => {
        const marks = docMarkCount(doc.id, flags);
        return (
          <SidebarMenuButton
            key={doc.id}
            className="h-9 gap-2"
            isActive={relatedDocId === doc.id}
            onClick={() => onGoToDoc(doc.id)}
            title={doc.name}
            aria-label={`Document ${doc.no}: ${doc.name}`}
          >
            <span className="w-4 shrink-0 text-end text-caption text-muted-foreground tabular-nums">
              {doc.no}
            </span>
            <span className="min-w-0 flex-1 truncate text-body-compact">
              {shortDocName(doc.name)}
            </span>
            {doc.poorScan ? (
              <Badge variant="warning" className="shrink-0" title="Poor scan">
                !
              </Badge>
            ) : null}
            {marks > 0 ? (
              <Badge variant="destructive" className="shrink-0 tabular-nums">
                {marks}
              </Badge>
            ) : null}
          </SidebarMenuButton>
        );
      })}
    </aside>
  );
}
