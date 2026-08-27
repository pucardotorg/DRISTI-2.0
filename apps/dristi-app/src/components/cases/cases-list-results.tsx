"use client";

import type { MouseEvent } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { type CasesPageSize, type CasesSelection } from "@/lib/cases/query";
import { type BucketKey, type CasesView } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

import { CasesItemList } from "./cases-item-list";
import { CasesPageSizeSelect } from "./cases-page-size";
import { CasesTable } from "./cases-table";

type PageLink = {
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  const visible = [...pages]
    .filter((entry) => entry >= 1 && entry <= pageCount)
    .sort((a, b) => a - b);

  return visible.flatMap((entry, index) =>
    index > 0 && entry - visible[index - 1] > 1
      ? ["gap" as const, entry]
      : [entry]
  );
}

/**
 * Table (md+) or stacked items, plus pagination. `framed` adds the folder
 * card when this list is not already inside one — landing and folder
 * pages pass false; their CasePeekSurface is that edge.
 */
export function CasesListResults({
  selection,
  pageSize,
  onPageSizeChange,
  bookmarks,
  onToggleBookmark,
  pageLink,
  framed = true,
  stageFilter,
  hideStage = false,
  hideLongPendingFlag = false,
}: {
  selection: CasesSelection;
  pageSize: CasesPageSize;
  onPageSizeChange: (pageSize: CasesPageSize) => void;
  bookmarks: ReadonlySet<string>;
  onToggleBookmark: (id: string) => void;
  pageLink: (page: number) => PageLink;
  framed?: boolean;
  stageFilter?: {
    view: CasesView;
    value: BucketKey[];
    onChange: (stage: BucketKey[]) => void;
  };
  hideStage?: boolean;
  hideLongPendingFlag?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div
        className={cn(
          // min-w-0 lets this flex item shrink below the table's content width, so a
          // wide table (e.g. with the select column) scrolls inside the card instead
          // of pushing the page horizontally.
          "min-w-0",
          framed && "overflow-x-auto rounded-xl border border-hairline bg-card shadow-raised",
          !framed && "overflow-x-auto"
        )}
      >
        <div className="hidden md:block">
          <CasesTable
            rows={selection.rows}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
            stageFilter={stageFilter}
            hideStage={hideStage}
            hideLongPendingFlag={hideLongPendingFlag}
          />
        </div>
        <div className={cn(framed ? "p-4 md:hidden" : "md:hidden")}>
          <CasesItemList
            rows={selection.rows}
            bookmarks={bookmarks}
            onToggleBookmark={onToggleBookmark}
            hideStage={hideStage}
            hideLongPendingFlag={hideLongPendingFlag}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p
            className="text-body-compact text-muted-foreground"
            aria-live="polite"
          >
            Showing {selection.from}–{selection.to} of {selection.total}
          </p>
          <CasesPageSizeSelect
            value={pageSize}
            onChange={onPageSizeChange}
          />
        </div>
        {selection.pageCount > 1 ? (
          <Pagination className="mx-0 w-auto justify-start md:justify-end">
            <PaginationContent>
              {selection.page > 1 ? (
                <PaginationItem>
                  <PaginationPrevious {...pageLink(selection.page - 1)} />
                </PaginationItem>
              ) : null}
              {pageWindow(selection.page, selection.pageCount).map(
                (entry, index) => (
                  <PaginationItem key={`${entry}-${index}`}>
                    {entry === "gap" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        {...pageLink(entry)}
                        isActive={entry === selection.page}
                        aria-label={`Go to page ${entry}`}
                      >
                        {entry}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                )
              )}
              {selection.page < selection.pageCount ? (
                <PaginationItem>
                  <PaginationNext {...pageLink(selection.page + 1)} />
                </PaginationItem>
              ) : null}
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  );
}
