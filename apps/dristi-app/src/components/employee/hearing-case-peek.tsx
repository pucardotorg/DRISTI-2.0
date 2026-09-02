"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  counselFor,
  courtHearingPurposeLabel,
  parseIsoDay,
  type CourtHearing,
} from "@/lib/employee/hearings";
import {
  formatChequeAmount,
  formatCounselList,
  formatPeekDate,
  formatPeekWeekday,
  peekCourt,
  peekExtras,
  peekHistory,
  peekStage,
  peekTitle,
} from "@/lib/employee/hearing-peek";

import { HEARING_PEEK_ID, useHearingPeek } from "./use-hearing-peek";

/**
 * Owns peek state in the tree. The panel portals to the document so it can
 * float over the screen — the court chrome clips `fixed` descendants the same
 * way the advocate shell does.
 */
export function HearingPeekSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
      <HearingCasePeek />
    </div>
  );
}

/**
 * Viewport-floating inspector — not a Sheet. No scrim, no trap, so Start
 * hearing on another row stays the switcher. Overlay elevation, matching the
 * advocate case peek.
 */
export function HearingCasePeek() {
  const { hearing, today, close } = useHearingPeek();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!hearing || !mounted) return null;

  return createPortal(
    <aside
      id={HEARING_PEEK_ID}
      role="region"
      aria-labelledby="hearing-case-peek-title"
      className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-overlay md:inset-y-6 md:right-6 md:left-auto md:w-3/4 md:max-w-md"
    >
      <HearingPeekBody hearing={hearing} today={today} onClose={close} />
    </aside>,
    document.body,
  );
}

function HearingPeekBody({
  hearing,
  today,
  onClose,
}: {
  hearing: CourtHearing;
  today: string;
  onClose: () => void;
}) {
  const title = peekTitle(hearing);
  const extras = peekExtras(hearing.id);

  return (
    <>
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
            id="hearing-case-peek-title"
            className="text-title-s font-semibold"
          >
            {title}
          </h2>
          <p className="text-body-compact text-muted-foreground">
            <span className="font-mono tabular-nums">{hearing.caseNumber}</span>
            <span aria-hidden> · </span>
            <span className="tabular-nums">Item {hearing.item}</span>
            <span aria-hidden> · </span>
            {peekCourt()}
          </p>
        </div>
      </header>

      <Tabs
        key={hearing.id}
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-hairline px-6 pb-1">
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
            <HearingPeekOverview
              hearing={hearing}
              extras={extras}
            />
          </TabsContent>
          <TabsContent value="history" className="outline-none">
            <HearingPeekHistory hearing={hearing} extras={extras} today={today} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}

function HearingPeekOverview({
  hearing,
  extras,
}: {
  hearing: CourtHearing;
  extras: ReturnType<typeof peekExtras>;
}) {
  const complainantCounsel = counselFor(hearing, "complainant").map(
    (entry) => entry.name,
  );
  const accusedCounsel = counselFor(hearing, "accused").map(
    (entry) => entry.name,
  );

  return (
    <div className="flex flex-col gap-8 p-6">
      <DescriptionList>
        <PeekRow term="Stage">{peekStage(hearing)}</PeekRow>
        <PeekRow term="This sitting">
          {courtHearingPurposeLabel(hearing.purpose)}
        </PeekRow>
        <PartyRow
          term="Complainant"
          name={hearing.parties.complainant}
          counsel={complainantCounsel}
        />
        <PartyRow
          term="Accused"
          name={hearing.parties.accused}
          counsel={accusedCounsel}
        />
        {extras.chequeAmount ? (
          <PeekRow term="Cheque amount">
            {formatChequeAmount(extras.chequeAmount)}
          </PeekRow>
        ) : null}
        {extras.filedOn ? (
          <PeekRow term="Filed">{formatPeekDate(extras.filedOn)}</PeekRow>
        ) : null}
      </DescriptionList>

      {extras.lastHearing ? (
        <LastHearingCard
          on={extras.lastHearing.on}
          purpose={extras.lastHearing.purpose}
          order={extras.lastHearing.order}
          directed={extras.lastHearing.directed}
        />
      ) : null}
    </div>
  );
}

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

function PartyRow({
  term,
  name,
  counsel,
}: {
  term: string;
  name: string;
  counsel: string[];
}) {
  return (
    <DescriptionRow>
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="flex flex-col gap-1 text-body">
        <span className="font-medium">{name}</span>
        {counsel.length > 0 ? (
          <span className="text-body-compact text-muted-foreground">
            Counsel: {formatCounselList(counsel)}
          </span>
        ) : null}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

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
  const day = parseIsoDay(on).toLocaleDateString("en-IN", {
    day: "numeric",
  });
  const month = parseIsoDay(on).toLocaleDateString("en-IN", {
    month: "short",
  });

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-title-s font-semibold">Last hearing</h3>
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
                {formatPeekWeekday(on)}
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

function HearingPeekHistory({
  hearing,
  extras,
  today,
}: {
  hearing: CourtHearing;
  extras: ReturnType<typeof peekExtras>;
  today: string;
}) {
  const items = peekHistory(hearing, extras, today);

  return (
    <div className="p-6">
      <Timeline>
        {items.map((item) => (
          <TimelineItem
            key={`${item.on}-${item.title}`}
            status={item.status}
            title={item.title}
            description={formatPeekDate(item.on)}
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
