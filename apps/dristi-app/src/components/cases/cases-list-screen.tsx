"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  FileSearchIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  allBucketsLabel,
  buildCasesHref,
  selectCases,
  type CasesQuery,
} from "@/lib/cases/query";
import { bucketLabel, type CaseRecord } from "@/lib/cases/types";

import { CasePeekSurface } from "./case-peek";
import { CasesListResults } from "./cases-list-results";
import { CasesTableColumnsMenu } from "./cases-table-columns-menu";
import { useCasesNavigation } from "./use-cases-navigation";
import { CasePeekProvider } from "./use-case-peek";

export function CasesListScreen({
  query,
  cases,
  initialBookmarks,
  now,
}: {
  query: CasesQuery;
  cases: CaseRecord[];
  initialBookmarks: string[];
  now: number;
}) {
  const router = useRouter();
  const { search, effective, go, onSearchChange } = useCasesNavigation(query);
  const [bookmarks, setBookmarks] = React.useState<ReadonlySet<string>>(
    () => new Set(initialBookmarks)
  );

  const selection = selectCases({
    query: effective,
    bookmarks,
    now,
    source: cases,
  });
  const title = query.bucket ? bucketLabel(query.bucket) : "Search results";
  const backLabel = allBucketsLabel(query.view);
  const backHref = buildCasesHref(query, {
    bucket: null,
    search: "",
    stage: [],
  });

  function pageLink(page: number) {
    const href = buildCasesHref(effective, { page });
    return {
      href,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        router.push(href);
      },
    };
  }

  function toggleBookmark(id: string) {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      <div>
        <Button variant="ghost" className="w-fit" asChild>
          <Link href={backHref}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden />
            {backLabel}
          </Link>
        </Button>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-title-l font-semibold">{title}</h1>
      </header>

      <CasePeekProvider now={now}>
        <CasePeekSurface className="flex flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex w-full max-w-lg flex-col gap-2">
            <Label htmlFor="cases-search" className="w-fit text-body">
              Search cases
            </Label>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                id="cases-search"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="case name or number"
              />
            </InputGroup>
          </div>
          <CasesTableColumnsMenu hideStage />
        </div>

        {search ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onSearchChange("")}
              aria-label={`Remove Search: ${search}`}
            >
              Search: {search}
              <XIcon data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        ) : null}

        {selection.total === 0 ? (
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileSearchIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle className="text-title-s font-semibold">
                No cases match these filters
              </EmptyTitle>
              <EmptyDescription className="text-body">
                {search
                  ? `Nothing here matches this search. Try another case name or number, or go back to ${backLabel.toLowerCase()}.`
                  : "Nothing here matches. Go back and try another folder."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {search ? (
                <Button variant="outline" onClick={() => onSearchChange("")}>
                  Clear search
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <CasesListResults
            selection={selection}
            pageSize={effective.pageSize}
            onPageSizeChange={(pageSize) => go({ pageSize })}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            pageLink={pageLink}
            framed={false}
            hideStage
            hideLongPendingFlag={query.view === "long-pending"}
          />
        )}
        </CasePeekSurface>
      </CasePeekProvider>
    </div>
  );
}
