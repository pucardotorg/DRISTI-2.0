"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookmarkIcon,
  FileSearchIcon,
  FolderIcon,
  FolderOpenIcon,
  ListIcon,
  SearchIcon,
  Share2Icon,
  UserPlusIcon,
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
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  applySheetFilters,
  buildCasesHref,
  clearedFilters,
  isNarrowed,
  selectCases,
  summariseBuckets,
  summariseCases,
  type CasesQuery,
} from "@/lib/cases/query";
import { partiesLabel, type CaseRecord } from "@/lib/cases/types";
import { ShareDialog } from "@/components/access/share-dialog";
import { type AccessCase } from "@/lib/access/content";
import { AdvocateJoinCaseDialog } from "@/components/advocate/join-case-dialog";
import { advJoinPage } from "@/lib/advocate/content";
import { pick } from "@/lib/onboarding/content";
import { useLocale } from "@/components/shell/locale";
import { useProfile } from "@/components/shell/profile";

import { CasesBucketFolders } from "./cases-bucket-folders";
import { CasesFiltersButton, CasesAppliedFilters } from "./cases-filters";
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

/**
 * The Cases landing.
 *
 * Three rows: the page title with its one strong action (Join a case — the whole
 * journey is a dialog, so it needs a button, not a page); a toolbar with the
 * Bookmarked lens on the left and the presentation controls (Folders / List,
 * Columns) on the right; and the panel, whose header carries what narrows the
 * list — Share access for the selection, Filters, search — over the count of what
 * matched out of the whole book. The old tab strip is gone: status is one group in
 * the Filters sheet, since Ongoing, Long pending register and Disposed were only
 * ever filters wearing tabs. Bookmarked stays outside the sheet because it is not
 * a filter on the case; it is a mark the person put there, and they want it in one
 * press.
 */
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
  const { profileRole, switchProfile } = useProfile();

  // Bulk share: select cases in the list, then Share access adds staff to all at once.
  const [selectedCases, setSelectedCases] = React.useState<Set<string>>(
    () => new Set()
  );
  const [shareOpen, setShareOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);
  const toggleSelected = React.useCallback((id: string) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const setManySelected = React.useCallback((ids: readonly string[], on: boolean) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
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

  const totals = summariseCases(cases, bookmarks);
  const scoped = applySheetFilters(cases, effective, now, bookmarks);
  const buckets = summariseBuckets(effective, scoped);
  const selection = selectCases({
    query: effective,
    bookmarks,
    now,
    source: cases,
  });
  const narrowed = isNarrowed(effective);
  const matched = showing === "folders" ? scoped.length : selection.total;
  /* The long-pending flag repeats the filter when that is the only status shown. */
  const onlyLongPending =
    effective.status.length === 1 && effective.status[0] === "long-pending";

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

  /* Joining is the advocate journey. A litigant joins from their own home, so the
     same button sends them there rather than opening the advocate dialog. */
  function joinCase() {
    if (profileRole === "litigant") {
      router.push("/home?join=manual");
      return;
    }
    setJoinOpen(true);
  }

  function clearAll() {
    onSearchChange("");
    go(clearedFilters());
  }

  let body: React.ReactNode;
  if (cases.length === 0) {
    body = (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">No cases yet</EmptyTitle>
          <EmptyDescription className="text-body">
            A case appears here once its filing has cleared scrutiny. Drafts and
            returned filings stay in File a case.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else if (matched === 0) {
    body = (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSearchIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">
            No cases match
          </EmptyTitle>
          <EmptyDescription className="text-body">
            {search
              ? "Nothing here matches this search. Try another case name or number, or clear the filters."
              : "Nothing here matches these filters. Change them, or clear them to see every case again."}
          </EmptyDescription>
        </EmptyHeader>
        {narrowed ? (
          <EmptyContent>
            <Button variant="outline" onClick={clearAll}>
              Clear all filters
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  } else if (showing === "folders") {
    body = <CasesBucketFolders buckets={buckets} query={effective} />;
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
        hideLongPendingFlag={onlyLongPending}
      />
    );
  }

  const panel =
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
        <CasePeekSurface className="flex flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
          {/* What narrows the list sits with the list: the selection's action,
              the filters, the search. Stack first (RESPONSIVE). */}
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-title-s font-semibold">Your cases</h2>
              {/* Says how many matched out of everything, so a filtered list is
                  never mistaken for the whole book. */}
              <p
                className="text-body-compact text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                Showing {matched} of {cases.length} {cases.length === 1 ? "case" : "cases"}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
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
              {showing === "list" ? <CasesTableColumnsMenu /> : null}
              <CasesFiltersButton
                query={effective}
                cases={cases}
                totals={totals}
                onChange={(patch) => go(patch)}
              />
              <div className="w-full min-w-0 sm:w-72">
                <Label htmlFor="cases-search" className="sr-only">
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
                    placeholder="Search by case name or number"
                  />
                </InputGroup>
              </div>
            </div>
          </div>

          <CasesAppliedFilters query={effective} onChange={(patch) => go(patch)} />

          {showing === "folders" && cases.length > 0 && matched > 0 ? (
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
        setMany: setManySelected,
        enabled: showing === "list",
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
        {/* One plane above the panel: the title, then on the right the page-level
            controls — how the book is shown (Folders / List), the Bookmarked lens,
            and the page's one bg-primary action (Laws: ration teal). Bookmarked sits
            here rather than in the panel because it is about the person, not the
            case, and beside Join a case because that is the other thing on this
            page that is theirs to do. Column choice moved into the panel, beside
            Filters, with the rest of what shapes the table. */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-title-l font-semibold">Cases</h1>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
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
            <Toggle
              variant="outline"
              pressed={effective.bookmarked}
              onPressedChange={(bookmarked) => go({ bookmarked })}
              aria-label={`Bookmarked cases, ${totals.bookmarked}`}
              /* Same metric and type as the buttons beside it: h-10, the DS button
                 label size. The Toggle's own text is that size already; only the
                 height and padding are lifted to the control floor. */
              className="h-10 gap-1.5 px-4"
            >
              <BookmarkIcon
                aria-hidden
                className={effective.bookmarked ? "fill-current" : undefined}
              />
              Bookmarked
              <span className="text-muted-foreground tabular-nums">
                {totals.bookmarked}
              </span>
            </Toggle>
            <Button size="lg" onClick={joinCase} className="shrink-0">
              <UserPlusIcon data-icon="inline-start" aria-hidden />
              {pick(advJoinPage.cta, locale)}
            </Button>
          </div>
        </header>

        {panel}
      </div>
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cases={shareCases}
        locale={locale}
      />
      {/* The join journey — lookup → details → code → role → vakalatnama → done —
          runs here, over the list it will add to. Discovering mid-journey that you
          are a party rather than a representative hands off to the same profile
          switch the rail's foot offers. */}
      <AdvocateJoinCaseDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        mode="manual"
        locale={locale}
        onJoined={() => {
          /* The dialog's done-stage reports the outcome (joined, or waiting on an
             approver). A joined case surfaces in this list once the backend lands. */
        }}
        onJoinAsLitigant={() => {
          setJoinOpen(false);
          if (profileRole === "advocate") switchProfile();
          router.push("/home?join=manual");
        }}
      />
    </CasesSelectionProvider>
  );
}
