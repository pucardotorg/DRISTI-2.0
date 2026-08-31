"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon, InboxIcon, SearchIcon, Trash2Icon } from "lucide-react";

import {
  applyQueueFilters,
  courtsOf,
  defaultSortFor,
  isQueueTab,
  pageWindow,
  QUEUE_TABS,
  sortOptionFor,
  TAB_LAYOUT,
  TAB_SORTS,
  type ColumnId,
  type QueueRow,
  type QueueTab,
} from "@/lib/filing/queue";
import { NEW_FILING } from "@/lib/filing/steps";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PANEL_CLASS } from "@/components/filing/form-card";

/** The tone words, so a colour is never the only thing saying "this one is late". */
const TONE_CLASS: Record<QueueRow["info"]["tone"], string> = {
  default: "text-muted-foreground",
  warning: "text-warning-ink",
  danger: "text-destructive-ink",
};

/** Matches the cases list, so the app's two tables of cases page the same way. */
const PAGE_SIZES = [10, 15, 20, 25, 30] as const;
const DEFAULT_PAGE_SIZE = 10;

export type QueueData = Record<QueueTab, QueueRow[]>;

/** The view, as it lives in the URL — so back, refresh and a shared link all restore it. */
type View = {
  tab: QueueTab;
  q: string;
  court: string;
  sort: string;
  page: number;
  size: number;
};

function readView(params: URLSearchParams): View {
  const tabParam = params.get("tab");
  const tab: QueueTab = isQueueTab(tabParam) ? tabParam : "drafts";
  const size = Number(params.get("size"));
  return {
    tab,
    q: params.get("q") ?? "",
    court: params.get("court") ?? "",
    sort: sortOptionFor(tab, params.get("sort")).value,
    page: Math.max(1, Number(params.get("page")) || 1),
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
  };
}

/** Only what differs from the default is written, so a plain `/filings` stays plain. */
function writeView(view: View): string {
  const params = new URLSearchParams();
  if (view.tab !== "drafts") params.set("tab", view.tab);
  if (view.q) params.set("q", view.q);
  if (view.court) params.set("court", view.court);
  if (view.sort !== defaultSortFor(view.tab)) params.set("sort", view.sort);
  if (view.page > 1) params.set("page", String(view.page));
  if (view.size !== DEFAULT_PAGE_SIZE) params.set("size", String(view.size));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Everything filed, in four states, over one row model.
 *
 * The tab carries the status, so no row repeats it as a badge — the cure for the constant
 * Status column the old dashboard had. Each row gets one action, which links into the
 * screen that owns that work rather than restating it here.
 *
 * View state lives in the URL, the way `/cases` already does it: open a case from a row,
 * come back, and the tab, search, filter and page are still there.
 */
export function FilingsQueue({
  data,
  ready,
  onDiscard,
}: {
  data: QueueData;
  ready: boolean;
  /** Throwing a draft away is the one destructive act here; the screen owns the
      confirmation, the row only asks for it. */
  onDiscard: (id: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = readView(new URLSearchParams(searchParams.toString()));

  const go = React.useCallback(
    (next: Partial<View>) => {
      router.replace(`${pathname}${writeView({ ...view, ...next })}`, { scroll: false });
    },
    [router, pathname, view]
  );

  const rows = data[view.tab];
  const layout = TAB_LAYOUT[view.tab];
  const courts = React.useMemo(() => courtsOf(rows), [rows]);
  const sort = sortOptionFor(view.tab, view.sort);

  // A court chosen on one tab may not exist on the next. Rather than silently filtering
  // everything out, the filter drops itself — the search carries over, because a party
  // name means the same thing on every tab.
  const court = courts.includes(view.court) ? view.court : "";

  const filtered = React.useMemo(
    () => applyQueueFilters(rows, { q: view.q, court, sort }),
    [rows, view.q, court, sort]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / view.size));
  const page = Math.min(view.page, pageCount);
  const start = (page - 1) * view.size;
  const slice = filtered.slice(start, start + view.size);

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <div className="relative min-w-60 flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={view.q}
            onChange={(event) => go({ q: event.target.value, page: 1 })}
            placeholder="Search by party name or number"
            aria-label="Filter this list by party name or number"
            className="pl-9"
          />
        </div>
        {courts.length > 1 ? (
          <NativeSelect
            value={court}
            onChange={(event) => go({ court: event.target.value, page: 1 })}
            aria-label="Filter by court"
            className="w-auto"
          >
            <NativeSelectOption value="">All courts</NativeSelectOption>
            {courts.map((name) => (
              <NativeSelectOption key={name} value={name}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}
        <NativeSelect
          value={sort.value}
          onChange={(event) => go({ sort: event.target.value, page: 1 })}
          aria-label="Order this list"
          className="w-auto"
        >
          {TAB_SORTS[view.tab].map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {!ready ? (
        <div className="flex flex-col gap-3 px-6 pb-8" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : slice.length === 0 ? (
        <Empty className="border-0 px-6 pb-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {rows.length === 0 ? <InboxIcon aria-hidden /> : <SearchIcon aria-hidden />}
            </EmptyMedia>
            <EmptyTitle className="text-body font-semibold">
              {rows.length === 0 ? emptyTitle(view.tab) : "No filings match your search"}
            </EmptyTitle>
            <EmptyDescription className="text-body-compact">
              {rows.length === 0
                ? emptyHint(view.tab)
                : "Try a different name or number, or clear the filters."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {rows.length === 0 ? (
              view.tab === "drafts" ? (
                <Button asChild>
                  <Link href={NEW_FILING}>
                    Start a cheque-bounce filing
                    <ArrowRightIcon data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              ) : null
            ) : (
              <Button variant="outline" onClick={() => go({ q: "", court: "", page: 1 })}>
                Clear filters
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={layout.label}>
              <TableHeader>
                <TableRow className="border-hairline">
                  {layout.columns.map((column) => (
                    <TableHead
                      key={column}
                      className={cn(
                        column === layout.columns[0] && "pl-6",
                        column === "action" && "pr-6 text-right"
                      )}
                    >
                      {headingFor(column, layout)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((row) => (
                  <TableRow key={row.id} className="relative border-hairline">
                    {layout.columns.map((column) => (
                      <TableCell
                        key={column}
                        className={cn(
                          column === layout.columns[0] && "pl-6",
                          column === "action" && "pr-6",
                          column === "parties" && "font-medium",
                          column === "court" && "text-muted-foreground"
                        )}
                      >
                        {renderCell(column, row, onDiscard)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-caption text-muted-foreground">
                Showing <span className="tabular-nums">{start + 1}</span>–
                <span className="tabular-nums">
                  {Math.min(start + view.size, filtered.length)}
                </span>{" "}
                of <span className="tabular-nums">{filtered.length}</span>
              </p>
              <NativeSelect
                value={String(view.size)}
                onChange={(event) => go({ size: Number(event.target.value), page: 1 })}
                aria-label="Rows per page"
                className="h-8 w-auto"
              >
                {PAGE_SIZES.map((size) => (
                  <NativeSelectOption key={size} value={String(size)}>
                    {size} per page
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {pageCount > 1 ? (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  {page > 1 ? (
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={goto(go, page - 1)} />
                    </PaginationItem>
                  ) : null}
                  {pageWindow(page, pageCount).map((entry, index) => (
                    <PaginationItem key={`${entry}-${index}`}>
                      {entry === "gap" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          onClick={goto(go, entry)}
                          isActive={entry === page}
                          aria-label={`Go to page ${entry}`}
                        >
                          {entry}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  {page < pageCount ? (
                    <PaginationItem>
                      <PaginationNext href="#" onClick={goto(go, page + 1)} />
                    </PaginationItem>
                  ) : null}
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </>
      )}
    </>
  );

  // `overflow-visible` undoes the Card master's own `overflow-hidden`: a clipping ancestor
  // makes `position: sticky` inert, so the tab strip would scroll away. Nothing sits on a
  // rounded corner here, so nothing needs the clip. Logged upstream.
  return (
    <Card className={cn(PANEL_CLASS, "gap-0 overflow-visible py-0")}>
      <div className="flex flex-col gap-1 px-6 pt-6 pb-4">
        <h2 className="text-title-s font-semibold text-foreground">Your filings</h2>
        <p className="text-body-compact text-muted-foreground">
          Everything you have filed and everything still in progress. The tab says where it
          has reached.
        </p>
      </div>

      <Tabs
        value={view.tab}
        onValueChange={(value) => {
          const tab = value as QueueTab;
          // The order belongs to the tab, so it resets with the tab; the search follows.
          go({ tab, sort: defaultSortFor(tab), page: 1 });
        }}
      >
        {/* Only the strip pins: the heading above it is read once, and keeping it on
            screen cost 90px of every scroll. */}
        <div className="sticky top-14 z-10 overflow-x-auto border-b border-hairline bg-card px-6">
          <TabsList
            variant="line"
            aria-label="Filing states"
            className="h-10 w-max min-w-full justify-start rounded-none p-0 group-data-horizontal/tabs:h-10"
          >
            {QUEUE_TABS.map((entry) => (
              <TabsTrigger
                key={entry.id}
                value={entry.id}
                className="h-10 flex-none gap-2 px-3 text-body group-data-horizontal/tabs:after:-bottom-px"
              >
                {entry.label}
                <span className="tabular-nums text-muted-foreground">
                  {ready ? data[entry.id].length : "–"}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* One panel per tab so the tablist actually controls something; only the
            selected one mounts. */}
        {QUEUE_TABS.map((entry) => (
          <TabsContent key={entry.id} value={entry.id}>
            {body}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

function headingFor(column: ColumnId, layout: (typeof TAB_LAYOUT)[QueueTab]): React.ReactNode {
  switch (column) {
    case "ref":
      return layout.ref;
    case "parties":
      return "Parties";
    case "court":
      return "Court";
    case "info":
      return layout.info;
    case "action":
      return <span className="sr-only">Action</span>;
  }
}

function renderCell(
  column: ColumnId,
  row: QueueRow,
  onDiscard: (id: string) => void
): React.ReactNode {
  switch (column) {
    case "ref":
      return <span className="font-medium tabular-nums">{row.ref}</span>;
    case "parties":
      return row.parties;
    case "court":
      return row.court || "—";
    case "info":
      return (
        <>
          <span className="block tabular-nums">{row.info.lead}</span>
          {row.info.sub ? (
            <span className={cn("block text-caption", TONE_CLASS[row.info.tone])}>
              {row.info.sub}
            </span>
          ) : null}
        </>
      );
    case "action":
      return (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="outline" size="sm">
            {/* The link stretches over the whole row, so the row is the target and the
                button is only where it is visible. Anything else in the row that must
                stay clickable sits above it on `z-10`. */}
            <Link href={row.action.href} className="after:absolute after:inset-0">
              {row.action.label}
              <ArrowRightIcon data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          {row.discardable ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative z-10 text-muted-foreground hover:text-destructive"
              onClick={() => onDiscard(row.id)}
              aria-label={`Discard draft ${row.parties}`}
            >
              <Trash2Icon aria-hidden />
            </Button>
          ) : null}
        </div>
      );
  }
}

function goto(go: (next: { page: number }) => void, page: number) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    go({ page });
  };
}

function emptyTitle(tab: QueueTab): string {
  switch (tab) {
    case "drafts":
      return "No drafts yet";
    case "scrutiny":
      return "Nothing with the registry";
    case "returned":
      return "Nothing sent back";
    case "registered":
      return "No registered cases yet";
  }
}

function emptyHint(tab: QueueTab): string {
  switch (tab) {
    case "drafts":
      return "A filing you start is saved here until you submit it.";
    case "scrutiny":
      return "Filings waiting on the registry's check will appear here.";
    case "returned":
      return "If scrutiny sends a filing back, it lands here with the defects to cure.";
    case "registered":
      return "Cases the court has numbered will appear here with their next hearing.";
  }
}
