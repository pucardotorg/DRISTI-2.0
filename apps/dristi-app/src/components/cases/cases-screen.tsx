"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileSearchIcon,
  FolderIcon,
  FolderOpenIcon,
  ListIcon,
  SearchIcon,
  Share2Icon,
} from "lucide-react";

import { Banner } from "@/components/ui/banner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  allBucketsLabel,
  applySheetFilters,
  buildCasesHref,
  selectCases,
  summariseBuckets,
  summariseCases,
  type CasesQuery,
} from "@/lib/cases/query";
import { CASES_VIEWS, partiesLabel, type BucketKey, type CaseRecord, type CasesView } from "@/lib/cases/types";
import { ShareDialog } from "@/components/access/share-dialog";
import { type AccessCase } from "@/lib/access/content";
import { useLocale } from "@/components/shell/locale";

import { CasesBucketFolders } from "./cases-bucket-folders";
import { CasesFoldersHint } from "./cases-folders-hint";
import { CasePeekSurface } from "./case-peek";
import { CasesListResults } from "./cases-list-results";
import { CasesTableColumnsMenu } from "./cases-table-columns-menu";
import {
  useCasesLandingView,
  type CasesLandingView,
} from "./use-cases-landing-view";
import { useCasesNavigation } from "./use-cases-navigation";
import { CasePeekProvider } from "./use-case-peek";
import { CasesSelectionProvider } from "./use-cases-selection";

const EMPTY_VIEW: Record<CasesView, { title: string; description: string }> = {
  ongoing: {
    title: "No cases yet",
    description:
      "A case appears here once its filing has cleared scrutiny. Drafts and returned filings stay in Filings.",
  },
  "long-pending": {
    title: "Nothing in the long pending register",
    description: "No live case is currently marked long pending.",
  },
  disposed: {
    title: "No disposed cases",
    description: "Cases move here once the court has disposed of them.",
  },
  bookmarked: {
    title: "No bookmarked cases",
    description:
      "Bookmark a case from the list to keep it within reach. Bookmarks are yours alone.",
  },
};

export function CasesScreen({
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
  const [landingView, setLandingView] = useCasesLandingView();
  const [bookmarks, setBookmarks] = React.useState<ReadonlySet<string>>(
    () => new Set(initialBookmarks)
  );
  const { locale } = useLocale();

  // Bulk share: select cases in the list, then Share access adds staff to all at once.
  const [selectedCases, setSelectedCases] = React.useState<Set<string>>(
    () => new Set()
  );
  const [shareOpen, setShareOpen] = React.useState(false);
  const toggleSelected = React.useCallback((id: string) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const shareCases: AccessCase[] = React.useMemo(
    () =>
      cases
        .filter((record) => selectedCases.has(record.id))
        .map((record) => ({
          id: record.id,
          title: partiesLabel(record),
          caseNumber: record.caseNumber,
          court: record.court,
          nextHearing: record.nextHearing?.on ?? "—",
        })),
    [cases, selectedCases]
  );

  /** Search always finds cases, so a query temporarily shows the list. */
  const showing: CasesLandingView = search ? "list" : landingView;

  const bookTotals = summariseCases(cases, bookmarks);
  const scoped = applySheetFilters(cases, effective, now);
  const totals = summariseCases(scoped, bookmarks);
  const buckets = summariseBuckets(query.view, scoped, bookmarks);
  const selection = selectCases({
    query: effective,
    bookmarks,
    now,
    source: cases,
  });
  const stageFiltered = effective.stage.length > 0;
  const stageFilter = {
    view: effective.view,
    value: effective.stage,
    onChange: (stage: BucketKey[]) => go({ stage }),
  };

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

  function onLandingViewChange(value: string) {
    if (value !== "list" && value !== "folders") return;
    setLandingView(value);
    if (value === "folders" && search) {
      onSearchChange("");
      return;
    }
    if (effective.page > 1) go({ page: 1 });
  }

  let body: React.ReactNode;
  if (cases.length === 0 || bookTotals[query.view] === 0) {
    body = (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">
            {EMPTY_VIEW[query.view].title}
          </EmptyTitle>
          <EmptyDescription className="text-body">
            {EMPTY_VIEW[query.view].description}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else if (showing === "folders") {
    body =
      totals[query.view] === 0 ? (
        <Empty className="border-0 p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearchIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="text-title-s font-semibold">
              No cases match these filters
            </EmptyTitle>
            <EmptyDescription className="text-body">
              Nothing here matches these filters right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <CasesBucketFolders buckets={buckets} query={effective} />
      );
  } else if (selection.total === 0) {
    body = (
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
              ? "Nothing here matches this search. Try another case name or number."
              : stageFiltered
                ? "Nothing here matches these stages. Choose other stages, or all stages, to see every case again."
                : "Nothing here matches these filters right now."}
          </EmptyDescription>
        </EmptyHeader>
        {stageFiltered ? (
          <EmptyContent>
            <Button variant="outline" onClick={() => go({ stage: [] })}>
              {allBucketsLabel(query.view)}
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  } else {
    body = (
      <CasesListResults
        selection={selection}
        pageSize={effective.pageSize}
        onPageSizeChange={(pageSize) => go({ pageSize })}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        pageLink={pageLink}
        framed={false}
        stageFilter={stageFilter}
        hideLongPendingFlag={query.view === "long-pending"}
      />
    );
  }

  const viewPanel =
    query.demo === "error" ? (
      <Banner
        variant="error"
        action={
          <Button variant="outline" onClick={() => go({ demo: null })}>
            Try again
          </Button>
        }
      >
        Cases could not be loaded. Nothing has been changed — try again in a
        moment.
      </Banner>
    ) : (
      <CasePeekProvider now={now}>
        <CasePeekSurface className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4">
          {/*
            Folders/List and Columns share the header row with the section
            title — presentation controls belong beside what they present,
            not stacked under it. Stack first (RESPONSIVE).
          */}
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
            <h2 className="text-title-s font-semibold">Your cases</h2>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              {showing === "list" ? (
                <Button
                  variant="outline"
                  disabled={selectedCases.size === 0}
                  onClick={() => setShareOpen(true)}
                  className="shrink-0"
                >
                  <Share2Icon data-icon="inline-start" aria-hidden />
                  Share access
                  {selectedCases.size ? ` (${selectedCases.size})` : ""}
                </Button>
              ) : null}
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={showing}
                onValueChange={onLandingViewChange}
                className="shrink-0"
                aria-label="Folders or list"
              >
                <ToggleGroupItem
                  value="folders"
                  aria-label="Folders"
                  className="h-10 px-3"
                >
                  <FolderIcon aria-hidden />
                  <span className="sr-only">Folders</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="List"
                  className="h-10 px-3"
                >
                  <ListIcon aria-hidden />
                  <span className="sr-only">List</span>
                </ToggleGroupItem>
              </ToggleGroup>
              {showing === "list" ? <CasesTableColumnsMenu /> : null}
            </div>
          </div>
        </div>

        {showing === "folders" &&
        cases.length > 0 &&
        bookTotals[query.view] > 0 ? (
          <CasesFoldersHint />
        ) : null}

        {body}
        </CasePeekSurface>
      </CasePeekProvider>
    );

  return (
    <CasesSelectionProvider
      value={{
        selected: selectedCases,
        toggle: toggleSelected,
        enabled: showing === "list",
      }}
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 md:p-8">
        <header>
          <h1 className="text-title-l font-semibold">Cases</h1>
        </header>

      {/*
        Ongoing and LPR partition live cases. Bookmarked is a personal
        marker and still overlaps the other counts.

        Default TabsList (surface-sunken + hairline), never line and never
        bg-card. Dark maps card = page, so an unbordered card chrome vanishes;
        the sunken well plus its hairline is what reads as recessed in both
        themes — track is now tiny marks only (progress, slider, skeleton). Each trigger must
        own a TabsContent panel (WAI-ARIA 1.2) — the cases card is that panel.
        Height only on TabsList (h-10). Triggers keep DS h-[calc(100%-1px)] —
        forcing h-10 on both overflows the padded track and breaks the pill.
        Labels stay on one line; the track sizes to the pills — no overflow
        scroll on the list.
      */}
      <Tabs
        value={query.view}
        onValueChange={(view) => go({ view: view as CasesView })}
        className="flex min-w-0 flex-col gap-6"
      >
        {/*
          Search and views share a row on desktop so the page chrome matches
          the full-width folder container. Stack first (RESPONSIVE). items-end
          keeps the unlabeled tabs on the same baseline as the search field.
        */}
        <div className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex w-full min-w-0 max-w-md flex-col gap-2">
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

          <TabsList
            variant="default"
            aria-label="Case views"
            className="h-10 w-max group-data-horizontal/tabs:h-10"
          >
            {CASES_VIEWS.map((view) => (
              <TabsTrigger
                key={view.value}
                value={view.value}
                className="px-3 text-body whitespace-nowrap"
              >
                {view.label} ({totals[view.value]})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {CASES_VIEWS.map((view) => (
          <TabsContent
            key={view.value}
            value={view.value}
            className="min-w-0 text-body outline-none"
          >
            {view.value === query.view ? viewPanel : null}
          </TabsContent>
        ))}
      </Tabs>
      </div>
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cases={shareCases}
        locale={locale}
      />
    </CasesSelectionProvider>
  );
}
