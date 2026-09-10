"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ExternalLinkIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  formatChequeAmount,
  formatDueStatus,
  formatWeekdayDate,
  isSameDay,
  peekExtras,
  peekHistory,
  type CaseTask,
} from "@/lib/cases/peek";
import { caseDetailHref, caseSectionHref } from "@/lib/cases/sections";
import {
  formatCaseDate,
  formatCounselList,
  outcomeLabel,
  partiesLabel,
  stageLabel,
  counselFor,
  type CaseRecord,
} from "@/lib/cases/types";
import { cn } from "@/lib/utils";

import { CaseFlags } from "./case-identity";
import { CASE_PEEK_ID, useCasePeek } from "./use-case-peek";

/**
 * Card that owns peek state in the tree. The panel itself portals to
 * the document so it can float over the screen — the app shell clips
 * `fixed` descendants.
 */
export function CasePeekSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
      <CasePeek />
    </div>
  );
}

/**
 * Viewport-floating inspector — not a Sheet. No scrim, no trap, so
 * another case number or name stays the switcher. Overlay elevation.
 * Not the Card primitive: that hover fill would wash the whole panel.
 */
/** A subscription with nothing to report — the mount state never changes back. */
const emptySubscribe = () => () => {};

export function CasePeek() {
  const { record, now, hideLongPendingFlag, close } = useCasePeek();
  // Portal guard: the server (and the hydration render) has no document.body to
  // portal into, so both report unmounted; the client re-renders once after
  // hydration. The store shape of the old mounted-flag effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!record || !mounted) return null;

  return createPortal(
    <aside
      id={CASE_PEEK_ID}
      role="region"
      aria-labelledby="case-peek-title"
      className="fixed inset-y-6 right-6 z-50 flex w-3/4 max-w-md flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-overlay"
    >
      <CasePeekBody
        record={record}
        now={now}
        hideLongPendingFlag={hideLongPendingFlag}
        onClose={close}
      />
    </aside>,
    document.body
  );
}

function CasePeekBody({
  record,
  now,
  hideLongPendingFlag,
  onClose,
}: {
  record: CaseRecord;
  now: number;
  hideLongPendingFlag: boolean;
  onClose: () => void;
}) {
  const title = partiesLabel(record);
  const extras = peekExtras(record.id);
  const stage = record.disposal
    ? outcomeLabel(record.disposal.outcome)
    : record.substage ?? stageLabel(record.stage);

  return (
    <>
      {/* The tab row below carries the only divider — the header runs into it. */}
      <header className="flex flex-col gap-4 p-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-caption text-muted-foreground">Case peek</p>
          <Button variant="ghost" className="shrink-0" onClick={onClose}>
            <XIcon data-icon="inline-start" aria-hidden />
            Close
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <h2
            id="case-peek-title"
            className="text-title-s font-semibold"
          >
            {title}
          </h2>
          <p className="text-body-compact text-muted-foreground">
            <span className="font-mono">{record.caseNumber}</span>
            {extras.altCaseNumber ? (
              <>
                <span aria-hidden> · </span>
                {extras.altCaseNumber}
              </>
            ) : null}
            <span aria-hidden> · </span>
            {record.court}
          </p>
          {hideLongPendingFlag ? null : <CaseFlags record={record} />}
        </div>

        <Button variant="secondary" className="w-fit" asChild>
          <Link
            href={caseDetailHref(
              record.id,
              hideLongPendingFlag ? "long-pending" : undefined
            )}
          >
            <ExternalLinkIcon data-icon="inline-start" aria-hidden />
            Open case file
          </Link>
        </Button>
      </header>

      <Tabs
        key={record.id}
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        {/* Line mark sits after:bottom-[-5px] (2px). pb-1 drops the rule onto it. */}
        <div className="shrink-0 border-b border-border px-6 pb-1">
          <TabsList
            variant="line"
            aria-label="Case peek sections"
            className="h-10 w-full justify-start rounded-none p-0 group-data-horizontal/tabs:h-10"
          >
            <TabsTrigger value="overview" className="flex-none px-3 text-body">
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-none px-3 text-body">
              Case History
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="overview" className="outline-none">
            <CasePeekOverview
              record={record}
              now={now}
              stage={stage}
              extras={extras}
            />
          </TabsContent>
          <TabsContent value="history" className="outline-none">
            <CasePeekHistory record={record} now={now} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}

function CasePeekOverview({
  record,
  now,
  stage,
  extras,
}: {
  record: CaseRecord;
  now: number;
  stage: string;
  extras: ReturnType<typeof peekExtras>;
}) {
  const tasks = extras.tasks ?? [];
  const complainantCounsel = counselFor(record, "complainant");
  const accusedCounsel = counselFor(record, "accused");

  return (
    <div className="flex flex-col gap-8 p-6">
      <DescriptionList>
        <PeekRow term="Stage">{stage}</PeekRow>
        {record.nextHearing ? (
          <PeekRow term="Next posting">
            {isSameDay(record.nextHearing.on, now)
              ? "Today"
              : formatCaseDate(record.nextHearing.on)}
            {record.nextHearing.purpose ? (
              <> — {record.nextHearing.purpose}</>
            ) : null}
          </PeekRow>
        ) : null}
        <PartyRow
          term="Complainant"
          name={record.parties.complainant}
          counsel={complainantCounsel}
          appearing={extras.appearingFor === "complainant"}
        />
        <PartyRow
          term="Accused"
          name={record.parties.accused}
          counsel={accusedCounsel}
          appearing={extras.appearingFor === "accused"}
        />
        {extras.chequeAmount ? (
          <PeekRow term="Cheque amount">
            {formatChequeAmount(extras.chequeAmount)}
          </PeekRow>
        ) : null}
        <PeekRow term="Filed">{formatCaseDate(record.filedOn)}</PeekRow>
      </DescriptionList>

      {record.previousHearingOn ? (
        <LastHearingCard
          on={record.previousHearingOn}
          purpose={record.substage ?? stageLabel(record.stage)}
          order={extras.orderOfTheDay ?? record.latestUpdate}
          directed={Boolean(extras.orderOfTheDay)}
        />
      ) : null}

      {tasks.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionHeading count={tasks.length}>Pending tasks</SectionHeading>
          <ItemGroup className="gap-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} caseId={record.id} task={task} now={now} />
            ))}
          </ItemGroup>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Rows carry `text-body` explicitly — the primitive's own compact size is
 * control chrome, not a screen-copy role. The value is the emphasized half.
 */
function PeekRow({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <DescriptionRow>
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body font-medium">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** A side of the cause title: who they are, whether you appear, who is on record. */
function PartyRow({
  term,
  name,
  counsel,
  appearing,
}: {
  term: string;
  name: string;
  counsel: string[];
  /** The signed-in advocate appears for this side. */
  appearing: boolean;
}) {
  return (
    <DescriptionRow>
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="flex flex-col gap-1 text-body">
        <span className="font-medium">
          {name}
          {appearing ? (
            <>
              <span aria-hidden> · </span>you appear
            </>
          ) : null}
        </span>
        {counsel.length > 0 ? (
          <span className="text-body-compact text-muted-foreground">
            Counsel: {formatCounselList(counsel)}
          </span>
        ) : null}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** Group label, not a page heading — the design keeps these quiet. */
function SectionHeading({
  count,
  children,
}: {
  count?: number;
  children: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-caption text-muted-foreground">{children}</h3>
      {count === undefined ? null : <Badge variant="secondary">{count}</Badge>}
    </div>
  );
}

/**
 * Heading and order label follow one signal, and Overview applies the
 * same rule: it is a direction only when the court actually directed
 * something. Without an order of the day this is the latest update on
 * the hearing that happened, not a direction.
 */
function LastHearingCard({
  on,
  purpose,
  order,
  directed,
}: {
  on: string;
  purpose: string;
  order: string;
  directed: boolean;
}) {
  const day = new Date(`${on}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
  });
  const month = new Date(`${on}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
  });

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>
        {directed ? "Last direction" : "Last hearing"}
      </SectionHeading>
      <Card size="sm">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div
              className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-muted"
              aria-hidden
            >
              <span className="text-body font-semibold text-brand-muted-foreground">
                {day}
              </span>
              <span className="text-caption text-brand-muted-foreground">
                {month}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="text-body font-medium">
                {formatWeekdayDate(on)}
              </CardTitle>
              <CardDescription className="text-body-compact">
                {purpose}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-4">
            <p className="text-body font-medium text-foreground">
              {directed ? "Order of the day" : "Latest update"}
            </p>
            <p className="text-body text-muted-foreground">{order}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function TaskRow({
  caseId,
  task,
  now,
}: {
  caseId: string;
  task: CaseTask;
  now: number;
}) {
  const due = formatDueStatus(task.dueOn, now);
  /* Who holds it beats when it is due — the due status is already on the
     right, and it now carries the formatted date, so the fallback takes
     that rather than formatting the same day a second time. The drawer
     states the deadline as one line and does not rank it: it is a glance at
     a case, not the case file's queue of work. */
  const detail = task.note
    ? task.note
    : task.assignedTo && task.markedOn
      ? `Assigned to ${task.assignedTo} · marked ${formatCaseDate(task.markedOn)}`
      : due.on;

  return (
    <Item asChild variant="muted" size="sm" className="min-h-10 items-start p-4">
      <Link href={caseSectionHref(caseId, "applications")} role="listitem">
        <ItemContent className="min-w-0">
          <ItemTitle className="line-clamp-none text-body font-medium text-foreground">
            {task.title}
          </ItemTitle>
          <ItemDescription className="line-clamp-none text-caption">
            {detail}
          </ItemDescription>
        </ItemContent>
        <p
          className={cn(
            "shrink-0 text-caption",
            due.overdue ? "text-destructive-ink" : "text-muted-foreground"
          )}
        >
          {due.label}
        </p>
      </Link>
    </Item>
  );
}

function CasePeekHistory({ record, now }: { record: CaseRecord; now: number }) {
  const items = peekHistory(record, now);

  return (
    <div className="p-6">
      <Timeline>
        {items.map((item) => (
          <TimelineItem
            key={`${item.on}-${item.title}`}
            status={item.status}
            title={item.title}
            description={formatCaseDate(item.on)}
          >
            {item.note ? (
              <p className="mt-1 text-body-compact text-muted-foreground">
                {item.note}
              </p>
            ) : null}
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
}
