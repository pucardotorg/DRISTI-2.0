"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileSearchIcon, InboxIcon } from "lucide-react";

import { QUEUE, QUEUE_TABS } from "@/lib/employee/scrutiny/fixtures";
import {
  countByBall,
  filterQueue,
  stageVariant,
  waitTone,
} from "@/lib/employee/scrutiny/queue";
import type { Ball, Filing, QueueOwner } from "@/lib/employee/scrutiny/types";
import { cn } from "@/lib/utils";
import { PANEL_CLASS } from "@/components/filing/form-card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLUMNS = [
  "Filing no.",
  "Parties",
  "Type",
  "Stage",
  "Reason",
  "Advocate",
  "With",
  "Waiting",
];

/**
 * The ageing cell.
 *
 * One presentation for one datum: the wait is always plain `tabular-nums` text, and
 * escalation is carried by ink on that same text. A red chip on the 16-day row beside
 * plain text on the 1-day row would be two treatments of one column — and it is the
 * default sort key, so it is already the most-read number on the screen. The number
 * itself says the thing; the colour only says how loudly.
 */
function WaitingCell({ filing }: { filing: Filing }) {
  const tone = waitTone(filing);
  return (
    <span
      className={cn(
        "tabular-nums",
        tone === "destructive" && "font-medium text-destructive-ink",
        tone === "warning" && "font-medium text-warning-ink",
        tone === "muted" && "text-muted-foreground",
      )}
    >
      {filing.days} d
    </span>
  );
}

export function ScrutinyQueue() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Ball>("registry");
  const [owner, setOwner] = React.useState<QueueOwner>("anyone");
  const [text, setText] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);

  const rows = React.useMemo(
    () => filterQueue(QUEUE, tab, owner, text),
    [tab, owner, text],
  );
  const filtered = !!text.trim() || owner !== "anyone";

  React.useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(null), 2600);
    return () => clearTimeout(timer);
  }, [note]);

  function open(filing: Filing) {
    if (!filing.openable) {
      setNote(
        "Only F/AHM/2026/00341 has a case bundle behind it in this prototype.",
      );
      return;
    }
    router.push(`/employee/scrutiny/${encodeURIComponent(filing.no)}`);
  }

  function clearFilters() {
    setText("");
    setOwner("anyone");
  }

  return (
    /*
     * The header and filters are fixed; only the list scrolls. The shell bounds the
     * column's height, so a screen that wants scrolling asks for it here rather than
     * letting the page grow.
     */
    <main
      className="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-6"
      aria-label="Scrutiny queue"
    >
      {/* The rail's label, word for word — the court screens' own convention, and what
          makes the trail's "Actions" step enough above it. */}
      <h1 className="text-title text-balance font-semibold sm:text-title-l">
        Scrutinise submitted cases
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as Ball)}
          className="w-auto"
          activationMode="automatic"
        >
          <TabsList>
            {QUEUE_TABS.map((queueTab) => (
              <TabsTrigger key={queueTab.id} value={queueTab.id}>
                {queueTab.label}
                {queueTab.id === "closed" ? null : (
                  <span className="ms-1.5 text-muted-foreground tabular-nums">
                    {countByBall(QUEUE, queueTab.id)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Filing no., party or advocate"
            aria-label="Search filings"
            className="w-72"
          />
          <Select
            value={owner}
            onValueChange={(value) => setOwner(value as QueueOwner)}
          >
            <SelectTrigger className="w-36" aria-label="Claimed by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anyone">Anyone</SelectItem>
              <SelectItem value="me">Me</SelectItem>
              <SelectItem value="unclaimed">Unclaimed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {note ? (
        <Banner variant="info">
          <FileSearchIcon />
          <div className="min-w-0 flex-1 leading-snug">{note}</div>
        </Banner>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto pb-6">
      {rows.length ? (
        /*
         * The panel is the table's frame — lifted off the white page rather than drawn
         * on it, so the rows inside need no frame of their own. `overflow-hidden` keeps
         * the first and last rows inside the radius; the inner scroller carries the
         * width so a wide table never stretches the page.
         */
        <div className={cn("overflow-hidden rounded-xl bg-card", PANEL_CLASS)}>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="[&_tr]:border-hairline">
                <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
                  {COLUMNS.map((column) => (
                    <TableHead
                      key={column}
                      className={cn(
                        "text-caption text-muted-foreground",
                        column === "Type" && "hidden xl:table-cell",
                      )}
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((filing) => (
                  <TableRow
                    key={filing.no}
                    className="cursor-pointer border-hairline text-body-compact last:border-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    tabIndex={0}
                    onClick={() => open(filing)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        open(filing);
                      }
                    }}
                  >
                    <TableCell className="tabular-nums">{filing.no}</TableCell>
                    {/*
                     * Every cell is `whitespace-nowrap` from the DS table recipe, so the
                     * natural width overflowed and clipped Waiting — the ageing signal
                     * and the sort key. Parties absorbs the slack and truncates instead:
                     * `w-full max-w-0` is the shrink-to-fit pattern for a table cell.
                     */}
                    <TableCell className="w-full max-w-0 truncate font-medium">
                      {filing.parties}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {filing.type}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stageVariant(filing)}>{filing.stage}</Badge>
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-muted-foreground">
                      {filing.reason}
                    </TableCell>
                    <TableCell className="max-w-44 truncate">
                      {filing.advocate}
                    </TableCell>
                    <TableCell
                      className={cn(
                        filing.self ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {filing.who}
                    </TableCell>
                    <TableCell>
                      <WaitingCell filing={filing} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <QueueEmpty
          tab={tab}
          filtered={filtered}
          onClearFilters={clearFilters}
          onGoToAdvocate={() => setTab("advocate")}
        />
      )}
      </div>
    </main>
  );
}

/**
 * A genuinely empty tab and a filtered-empty tab are different situations and get
 * different copy: one teaches where the work is, the other offers the way back out of
 * the filter.
 */
function QueueEmpty({
  tab,
  filtered,
  onClearFilters,
  onGoToAdvocate,
}: {
  tab: Ball;
  filtered: boolean;
  onClearFilters: () => void;
  onGoToAdvocate: () => void;
}) {
  if (filtered) {
    return (
      <Empty className="mt-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSearchIcon />
          </EmptyMedia>
          <EmptyTitle>No filings match these filters</EmptyTitle>
          <EmptyDescription>
            Nothing in this tab matches the search or the claim filter.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const withAdvocates = countByBall(QUEUE, "advocate");
  return (
    <Empty className="mt-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>
          {tab === "registry"
            ? "Nothing awaiting scrutiny"
            : tab === "advocate"
              ? "Nothing with advocates"
              : "No cases closed yet"}
        </EmptyTitle>
        {tab === "registry" ? (
          <EmptyDescription>
            {withAdvocates} filings are with advocates.
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {tab === "registry" ? (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onGoToAdvocate}>
            View filings with advocates
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
