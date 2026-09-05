"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarX2Icon } from "lucide-react";

import { useCourtToday } from "@/components/employee/use-court-today";
import { useHearingSession } from "@/components/employee/use-hearing-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  causeTitle,
  counselFor,
  courtCaseStageLabel,
  courtHearingPurposeLabel,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  hearingById,
  parseIsoDay,
  withHearingSession,
  type CourtHearing,
} from "@/lib/employee/hearings";
import {
  caseHistory,
  formatCaseDate,
  formatCaseWeekday,
  formatChequeAmount,
  formatCounselList,
  hearingCaseExtras,
  type HearingCaseExtras,
} from "@/lib/employee/hearing-overview";

/**
 * How a panel sits on the court-side page — the same recipe as today's cause list
 * (`HearingsScreen`) and the order composer. One lifted sheet, hairline edge, no
 * nested second frame inside it.
 */
const PANEL =
  "min-w-0 rounded-xl border border-hairline bg-card p-6 shadow-raised";

/**
 * One listing's case overview — what is in this case, at a glance.
 *
 * Entered from Start hearing on today's cause list, and from the cause title on the
 * same row. It replaces the floating case peek: the same facts, on a page the bench
 * can read, land on and come back to, rather than a panel that vanished the moment
 * anything else was clicked.
 *
 * **It reads, it does not run the sitting.** End hearing, Pass over and the order
 * composer all stay on the cause list, where the day is. Calling the matter is what
 * got the bench here; the one action this page offers is a way further into the
 * case, and even that is not connected yet (`ViewCaseAction`).
 *
 * **It carries no back control of its own.** The court's chrome already is one: the
 * trail in the top bar ends in Today's hearings, a live link to the list this page
 * was opened from, sticky at every width and cut to its two ends on a phone so the
 * way home survives (`lib/employee/navigation.ts` sets that doctrine out — the trail
 * is the path back, and the page is never a step in it). A band across the foot of a
 * page that is only read, holding one ghost button, reads as pinned chrome whether or
 * not it is pinned — and it would be a second door to a room with one.
 */
export function HearingOverviewScreen({ hearingId }: { hearingId: string }) {
  const session = useHearingSession();
  const listed = hearingById(hearingId);

  if (!listed) return <HearingMissing />;

  /* The fixture's status is the day's starting position, not where the sitting has
     got to: a matter the bench called a moment ago is on the board as scheduled and
     is ongoing in the session. The list applies the same overlay before it renders a
     chip, and the two must not disagree about the same listing. */
  const [hearing] = withHearingSession([listed], session);

  return <HearingOverview hearing={hearing} />;
}

/**
 * An id no cause list holds. Modelled on the order composer's own miss, because it
 * is the same miss arriving by the same route.
 */
function HearingMissing() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2Icon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">
            This listing is not on the board
          </EmptyTitle>
          <EmptyDescription className="text-body">
            A case overview opens a matter from today&rsquo;s cause list. This one
            is not there.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/employee/hearings">Back to today&rsquo;s hearings</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

function HearingOverview({ hearing }: { hearing: CourtHearing }) {
  const today = useCourtToday();
  const extras = hearingCaseExtras(hearing.id);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      {/* The order composer's header, one page along: the caption says which listing
          this is, the cause title is the page, and the chip says where the sitting
          stands. The action sits opposite it the way Join VC sits opposite the cause
          list's title — page scope, page chrome (ui-craft §0). */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-caption font-medium text-muted-foreground">
            Item <span className="tabular-nums">{hearing.item}</span>
            {" · "}
            <span className="tabular-nums">{hearing.caseNumber}</span>
            {" · "}
            {courtHearingPurposeLabel(hearing.purpose)}
          </p>
          {/* The chip rides with the title rather than taking a third line under
              it. The cause and where its sitting stands are one thought — this
              matter, and it is under way — and stacking them spent a line of the
              page on nothing before the first panel. `flex-wrap` puts the chip
              back on its own line when the title fills a phone. */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title text-balance font-semibold sm:text-title-l">
              {causeTitle(hearing)}
            </h1>
            <Badge variant={courtHearingStatusVariant(hearing.status)}>
              {courtHearingStatusLabel(hearing.status)}
            </Badge>
          </div>
        </div>
        <ViewCaseAction />
      </header>

      {/* Case details and Last hearing pair across the top; the history runs the
          full width beneath them.

          The facts are six term/detail pairs and want the smaller share — at
          three-fifths the list spread "Evidence" across 500px of nothing and read
          as stretched. The order of the day is a paragraph and wants measure, so
          it takes the larger. History is last because it is the part that grows:
          three steps today, but a matter that has run two years is a long column,
          and the width is there for entries that carry more than a date.

          The two top panels stretch to a common height rather than sitting at
          their own — `items-start` is what left the shorter one dangling beside
          the taller. Slack inside a lifted panel reads as padding; the same slack
          beside it reads as a hole. */}
      <div className="grid min-w-0 gap-8 lg:grid-cols-5">
        <CaseFactsPanel
          hearing={hearing}
          extras={extras}
          className="lg:col-span-2"
        />
        {extras.lastHearing ? (
          <LastHearingPanel
            on={extras.lastHearing.on}
            purpose={extras.lastHearing.purpose}
            order={extras.lastHearing.order}
            directed={extras.lastHearing.directed}
            className="lg:col-span-3"
          />
        ) : (
          <NoLastHearingPanel className="lg:col-span-3" />
        )}
        <CaseHistoryPanel
          hearing={hearing}
          extras={extras}
          today={today}
          className="lg:col-span-5"
        />
      </div>
    </div>
  );
}

/**
 * The page's one CTA — and the one thing on it that does not work.
 *
 * A full case file has been built, on the citizen side, in the advocate's flows.
 * `/employee` does not read from there (`lib/employee/content.ts`), and there is no
 * court-side case file yet, so wiring this today would either point at a route that
 * 404s or cross the split the two halves of the app are being built either side of.
 * Connecting it is a decision that has been taken and deferred, not one this screen
 * gets to make.
 *
 * So it is a real button, in the page's one teal, that says plainly it goes nowhere
 * — `aria-disabled` rather than `disabled`, so it keeps focus and the tooltip is
 * reachable by keyboard. The same bargain Join VC makes on the cause list. No icon:
 * the label is the whole of it.
 */
function ViewCaseAction() {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-disabled className="w-full shrink-0 sm:w-fit">
            View case
          </Button>
        </TooltipTrigger>
        <TooltipContent>The case file is not connected yet</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * The glance: where the case has reached, what it is listed for today, who is on
 * each side, and the two numbers a §138 matter turns on.
 *
 * Cheque amount and Filed come from the demo sidecar and are simply absent when it
 * has none — a first listing shows four rows rather than four rows and two blanks.
 * A side with no counsel on record shows the party alone; no vakalat is a fact, not
 * a gap to fill with a dash.
 */
function CaseFactsPanel({
  hearing,
  extras,
  className,
}: {
  hearing: CourtHearing;
  extras: HearingCaseExtras;
  className?: string;
}) {
  const complainantCounsel = counselFor(hearing, "complainant").map(
    (entry) => entry.name,
  );
  const accusedCounsel = counselFor(hearing, "accused").map(
    (entry) => entry.name,
  );

  return (
    <section
      className={`${PANEL} flex flex-col gap-2 ${className ?? ""}`}
      aria-labelledby="case-facts"
    >
      {/* `gap-2` and not the section default: the list's own rows already carry
          `py-3`, so a full step here would open a 28px hole under the heading. */}
      <h2 id="case-facts" className="text-body font-semibold">
        Case details
      </h2>
      <DescriptionList>
        <FactRow term="Stage">{courtCaseStageLabel(hearing.stage)}</FactRow>
        <FactRow term="This sitting">
          {courtHearingPurposeLabel(hearing.purpose)}
        </FactRow>
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
          <FactRow term="Cheque amount">
            <span className="tabular-nums">
              {formatChequeAmount(extras.chequeAmount)}
            </span>
          </FactRow>
        ) : null}
        {extras.filedOn ? (
          <FactRow term="Filed">
            <span className="tabular-nums">{formatCaseDate(extras.filedOn)}</span>
          </FactRow>
        ) : null}
      </DescriptionList>
    </section>
  );
}

/**
 * The row metric, tuned from the screen with classes — never by editing the synced
 * primitive.
 *
 * Three changes to the DS default. The term column narrows from `minmax(7rem,10rem)`
 * to `minmax(6rem,8rem)`: in a two-fifths panel the wider one spent two fifths of the
 * line on the word "Stage", and pushed a corporate accused onto a second row it did
 * not need. `py-3` drops to `py-2`, because six rows at the looser step read as a
 * stretched list rather than a record. And the stroke drops to hairline — six rows at
 * full strength would be the darkest marks on the page, and an internal divider
 * inside a panel that already has an edge is not what full strength is for
 * (ui-craft §1.1).
 */
const FACT_ROW_CLASS = "grid-cols-[minmax(6rem,8rem)_1fr] border-hairline py-2";

/** One key-value row. */
function FactRow({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <DescriptionRow className={FACT_ROW_CLASS}>
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body font-medium">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** A side of the cause, and who appears for it. Counsel recedes below the party. */
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
    <DescriptionRow className={FACT_ROW_CLASS}>
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="flex flex-col gap-1 text-body">
        {/* A corporate accused runs long. The row's value column is `1fr`, so the
            name wraps inside it rather than pushing the panel wide. */}
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

/**
 * What happened the last time this matter was called.
 *
 * The peek nested this in a card inside the overview; on a page the panel is the
 * card, so the shadow does not sit inside another shadow (ui-craft §4). The order
 * itself lands in a sunken well — the panel's one inset, and the thing on this page
 * most likely to be read word for word.
 *
 * "Order of the day" or "Latest update" follows `directed`: an order the court
 * passed is not the same claim as a note about where the matter got to, and this
 * build must not dress the second as the first.
 */
function LastHearingPanel({
  on,
  purpose,
  order,
  directed,
  className,
}: {
  on: string;
  purpose: string;
  order: string;
  directed: boolean;
  className?: string;
}) {
  const sat = parseIsoDay(on);
  const day = sat.toLocaleDateString("en-IN", { day: "numeric" });
  const month = sat.toLocaleDateString("en-IN", { month: "short" });

  return (
    <section
      className={`${PANEL} flex flex-col gap-4 ${className ?? ""}`}
      aria-labelledby="last-hearing"
    >
      <h2 id="last-hearing" className="text-body font-semibold">
        Last hearing
      </h2>
      <div className="flex items-start gap-4">
        {/* The date as a mark, not a sentence — the full date is spelled out beside
            it, so this tile is decoration and stays out of the reading order. */}
        <div
          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-muted"
          aria-hidden
        >
          <span className="text-body font-semibold tabular-nums text-brand-muted-foreground">
            {day}
          </span>
          <span className="text-caption text-brand-muted-foreground">
            {month}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-body font-medium">{formatCaseWeekday(on)}</p>
          <p className="text-body-compact text-muted-foreground">{purpose}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-surface-sunken p-4">
        <p className="text-body font-medium">
          {directed ? "Order of the day" : "Latest update"}
        </p>
        <p className="text-body text-muted-foreground">{order}</p>
      </div>
    </section>
  );
}

/**
 * A matter with no earlier sitting on record — a first listing, which is most of a
 * cause list.
 *
 * It holds the column rather than leaving it out, because "has this been heard
 * before?" is a question the bench is asking when it opens this page, and *no* is an
 * answer to it. Dropping the panel would give that answer as a gap, and give the row
 * a hole where its second half should be.
 *
 * The wording is about the record, not the case: the sidecar carries no earlier
 * sitting for this matter (`lib/employee/hearing-overview.ts`), and this build must
 * not upgrade that into a finding that the court never called it.
 */
function NoLastHearingPanel({ className }: { className?: string }) {
  return (
    <section
      className={`${PANEL} flex flex-col gap-4 ${className ?? ""}`}
      aria-labelledby="last-hearing-none"
    >
      <h2 id="last-hearing-none" className="text-body font-semibold">
        Last hearing
      </h2>
      {/* `Empty` is `flex-1` and centres its own content, so in a panel stretched to
          the height of the facts beside it the message sits in the middle of the
          column rather than clinging to the heading. Borderless and unpadded — the
          panel is already the frame. */}
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2Icon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-body font-semibold tracking-normal">
            No earlier sitting on record
          </EmptyTitle>
          <EmptyDescription className="text-body-compact">
            Nothing has been recorded for this matter between the complaint and
            today&rsquo;s listing.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  );
}

/**
 * The case as a sequence — filed, called, called again. The peek's second tab, and
 * with the peek gone it has nowhere else to live; a page can simply show it.
 *
 * Titles and dates only. The step's `note` is the last sitting's order, which the
 * panel above already prints in full — see `CaseHistoryItem`.
 *
 * It runs the page's width and comes last because it is the section that grows: a
 * matter two years old is a long column, and a step that one day carries more than a
 * date has the room for it. Today's three entries leave that room visibly unused,
 * which is a fact about the case rather than a fault in the layout.
 */
function CaseHistoryPanel({
  hearing,
  extras,
  today,
  className,
}: {
  hearing: CourtHearing;
  extras: HearingCaseExtras;
  today: string;
  className?: string;
}) {
  const items = caseHistory(hearing, extras, today);

  return (
    <section
      className={`${PANEL} flex flex-col gap-4 ${className ?? ""}`}
      aria-labelledby="case-history"
    >
      <h2 id="case-history" className="text-body font-semibold">
        Case history
      </h2>
      {/* Title over date, as the primitive composes it. Putting the date on the
          step's own line would read denser and use more of the width, and the DS
          declares `title` as a ReactNode — but `TimelineItem` spreads
          `ComponentProps<"li">`, whose own `title` attribute is a `string`, so the
          intersection makes the prop string-only and the composition impossible.
          Reaching around it through the primitive's internal markup would be a fork
          in all but name. Raised as upstream DS feedback instead. */}
      <Timeline>
        {items.map((item) => (
          <TimelineItem
            key={`${item.on}-${item.title}`}
            status={item.status}
            title={item.title}
            description={formatCaseDate(item.on)}
          />
        ))}
      </Timeline>
    </section>
  );
}
