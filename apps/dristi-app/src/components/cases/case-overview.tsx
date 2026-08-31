"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { CaseHearingsDialog } from "@/components/cases/case-hearings-dialog";
import {
  DueStatusLine,
  RestingCard,
} from "@/components/cases/case-overview-card";
import {
  BondTaskRow,
  useBondTaskVisible,
} from "@/components/cases/case-bail-flow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import {
  caseOverviewModel,
  type OverviewHearingStatus,
  type OverviewNextHearing,
  type OverviewTask,
  type OverviewUpdate,
  type OverviewUpdateNote,
} from "@/lib/cases/overview";
import { caseSectionHref } from "@/lib/cases/sections";
import { type CaseRecord } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

/**
 * Two containers, and nothing under them.
 *
 * Left, where the case stands in time: the next date as a calendar face, and
 * under it the record of what has recently happened. Right, on its own edge,
 * the work owed.
 *
 * The date and the record share a container because reading either sends you
 * to the other — the date is what the file has been building toward, the last
 * three entries are how it got there, and both are things you read. The work
 * owed is a different kind of object: a queue with verbs on it, the only block
 * on this page you act *from*. Behind the same edge as the record it read as
 * three more entries in the same sequence, and the two lists competed for the
 * same glance. Its own card is what separates a list you do from a list you
 * read, and it is why the split runs this way round rather than keeping the
 * plan together and putting the record opposite.
 *
 * The date sits in a well, not in a second framed box. Grouped content gets
 * *a* border and depth is fill rather than borders, so a panel inside a panel
 * is the box-in-box the DS bans outright; a nested well is `surface-sunken`
 * with no edge of its own, and the hairline the Laws allow is for control
 * wells — a tabs list, a segmented control — not for a block of facts
 * (Laws — grouped content; /foundations/elevation). `surface-sunken` on `card`
 * is the same step the BoTD prose already sits on further down this container,
 * so the face reads as inset without a second edge, and the rule between its
 * columns carries the split the frame was drawn to carry.
 *
 * `items-start`, not stretched. The two cards no longer share a boundary rule,
 * so nothing has to run the height of the taller of them, and the balance has
 * inverted since they did: the left card holds a date face over three timeline
 * rows, the right up to three task rows. Stretched, the short one would end in
 * a bordered void, which reads as content that failed to arrive.
 *
 * Two columns is the desktop shape only. Below `lg:` the cards stack in
 * reading order — the date and the record first, the work owed under them.
 *
 * Process is no longer here. Notice/Process Status ran at full width under
 * these two containers until it became a section of its own in the strip, and
 * the move suits it: it was always answering a different question — not where
 * the case stands, but whether it can move at all
 * (docs/product/domain/journey.md §5-6) — and it is a master–detail register
 * rather than a summary, a line of rounds over a pane four facts wide with a
 * paragraph of returned process under it. It needs no link from here now that
 * it is a standing destination in the strip on every case.
 *
 * There is no Case snippet. Number, stage and substage, counsel, cheque
 * amount, and filing date live in the case header directly above this
 * component; restating them here pushed the one fact that is only on this
 * page — the next hearing — below the fold.
 */
export function CaseOverview({
  record,
  now,
}: {
  record: CaseRecord;
  now: number;
}) {
  const model = caseOverviewModel(record, now);
  /* The bond lifecycle joins the Pending-tasks card as one of its rows
     rather than standing as a card of its own (Aug 31 correction round).
     Resolved here so the card renders — and counts right — even when the
     bond row is the only pending work. */
  const bondVisible = useBondTaskVisible();
  const bondTask = bondVisible ? (
    <BondTaskRow nextHearingOn={record.nextHearing?.on ?? null} now={now} />
  ) : null;

  /* Resolved here rather than inside each block, because the row has to know
     before it allocates anything: a card that renders nothing still leaves a
     column that holds nothing, and an empty bordered card is a void that reads
     as content which failed to arrive. Any of the three can be absent — a
     disposed case has no next date, a case with the registry has no pending
     work, a freshly filed one has one line of record — and all three can be. */
  const hearing = model.nextHearing ? (
    <NextHearingBlock record={record} next={model.nextHearing} />
  ) : null;
  const updates =
    model.updates.length > 0 ? (
      <CaseUpdatesBlock updates={model.updates} />
    ) : null;
  const tasks =
    model.tasks.length > 0 || bondTask ? (
      <PendingTasksBlock
        tasks={model.tasks}
        caption={model.tasksCaption}
        bondTask={bondTask}
      />
    ) : null;
  const standing = hearing ?? updates;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {standing || tasks ? (
        <div
          className={cn(
            "grid min-w-0 grid-cols-1 items-start gap-8",
            /* Even halves, and only when both cards have something in them:
               one survivor takes the whole width rather than sitting beside a
               dead column. Halves rather than a wider left: a task row carries
               its verb opposite its title, and at a third of the page that
               button wraps under the title on every row. */
            standing && tasks ? "lg:grid-cols-2" : undefined,
          )}
        >
          {standing ? (
            <RestingCard>
              {/* The Card's own gap is the 24px between the two sections;
                  CardContent supplies the matching side padding, so the well
                  below sits one step in from the card's edge rather than
                  inventing its own inset. */}
              {hearing ? <CardContent>{hearing}</CardContent> : null}
              {updates ? <CardContent>{updates}</CardContent> : null}
            </RestingCard>
          ) : null}
          {tasks ? (
            <RestingCard>
              <CardContent>{tasks}</CardContent>
            </RestingCard>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const NEXT_HEARING_HEADING = "overview-next-hearing";
const PENDING_TASKS_HEADING = "overview-pending-tasks";
const CASE_UPDATES_HEADING = "overview-case-updates";

/**
 * The stroke a status chip needs when it is not sitting on the page white.
 *
 * The `-muted` fills are pale by design, so a chip dropped into the well has
 * almost no edge: `info-muted` measures 1.02:1 against `surface-sunken`, which
 * is no boundary at all. The solid of the same family is an existing treatment
 * rather than an invented fourth, and it measures 4.33:1 against the well
 * (AGENTS 6a). Warning takes `warning-ink` instead, because `warning` itself
 * is 1.43:1 there — the same substitution the DS's own solid warning Button
 * and prefilled Input already make. `secondary` is not a status, so it takes
 * the structural border.
 *
 * Chips on the card white — every badge in Pending tasks — are unaffected and
 * carry no stroke.
 */
const WELL_CHIP_STROKE: Record<OverviewHearingStatus["variant"], string> = {
  info: "border-info",
  success: "border-success",
  warning: "border-warning-ink",
  secondary: "border-border",
};

/**
 * The next date as a listing slip: the day down one column, what the matter
 * stands listed for beside it.
 *
 * The face is `surface-sunken` with no edge of its own. Framed, it would be a
 * bordered box inside a bordered card, and the DS bans that outright — depth
 * is fill, and the hairline the Laws allow on a well is for control wells like
 * a tabs list, not for a block of facts (/foundations/elevation). The rule
 * between the columns is the division the frame was drawn to carry, and it is
 * the only rule in the container.
 *
 * The label sits above the numeral rather than across from it, so the date is
 * not answering a title from the other side of the card — it *is* the title.
 * It is set at the page-title size and no louder: the case number in the
 * header directly above is set there too, and the day the case next sits is
 * not a bigger fact than the case it belongs to.
 *
 * "Next hearing" and "Listed for" are set the same way on either side of the
 * rule. They are the same thing — the word naming what its column holds — and
 * a pair that reads as a pair is what makes this one face in two columns
 * rather than two blocks that happen to touch.
 *
 * The chip tops the second column rather than closing it. It says how the
 * listing stands in the hearings register's own words, and a qualifier reached
 * only after the clause has been read has qualified nothing. Today outranks it
 * in that slot: a sitting today is the imminent thing on the page, and this
 * codebase already spends amber on imminent (see `DueStatusLine`). Never
 * colour alone — the chip says the word (ACCESSIBILITY 3).
 *
 * The route into Hearings sits under the face, on the card white, not inside
 * it. `primary` on `surface-sunken` measures 4.46:1 — under the 4.5:1 floor
 * for 16px text (ACCESSIBILITY 6); on the card it is 4.90:1. It also reads
 * right there: the well is the fact, the link is the way out of it.
 */
function NextHearingBlock({
  record,
  next,
}: {
  record: CaseRecord;
  next: OverviewNextHearing;
}) {
  const [hearingsOpen, setHearingsOpen] = useState(false);
  const hearingsTriggerRef = useRef<HTMLAnchorElement | null>(null);
  const tile = next.tile;

  /* Nothing listed: there is no day to set on a face, and the absence is the
     fact — so it takes the date's own slot at the date's own weight rather
     than being demoted to a note about a missing date. No well either: the
     well is the calendar face, and an empty one is a frame around a sentence.
     No route out, for the same reason — there is no sitting to view. */
  if (!tile) {
    return (
      <section
        aria-labelledby={NEXT_HEARING_HEADING}
        className="flex min-w-0 flex-col gap-1"
      >
        <NextHearingLabel />
        <p className="text-title-l font-semibold text-foreground">{next.on}</p>
      </section>
    );
  }

  return (
    /* `@container` sits on the section rather than on the well, because an
       element is never its own query container — the well's own `@sm:` would
       resolve against whatever container sat above it, which is none. Same
       width either way: the well fills the section. */
    <section
      aria-labelledby={NEXT_HEARING_HEADING}
      className="@container flex min-w-0 flex-col gap-4"
    >
      {/* rounded-md, the inset radius, against the card's rounded-xl — a well
          that repeated the container's corner would read as a card lying on a
          card (/foundations/radius). p-4 is the same inset the BoTD well below
          already takes.

          The split is keyed to the well's own width, not the viewport's. This
          well is half a card wide beside Pending tasks, a whole card wide
          without it, and a phone's width below `lg:` — three widths at one
          viewport size, so a `sm:` could only ever be right about one of them.
          `@sm` is 24rem in `rem`, which is the part that matters: at 200% text
          zoom the threshold doubles with the reader's text, so a well that
          still measures 431px stops splitting instead of squeezing the clause
          into a 82px column and clipping it against the card's overflow
          (ACCESSIBILITY 10). Measured at 640px and 1440px, both themes. */}
      <div className="flex min-w-0 flex-col gap-4 rounded-md bg-surface-sunken p-4 @sm:flex-row @sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <NextHearingLabel />
          {/* The numeral and the two lines under it are one date, so they are
              one `<time>`. The face is split for the eye and hidden from the
              reader; the accessible name carries the date whole, year
              included. */}
          <time dateTime={tile.iso} className="flex min-w-0 flex-col">
            <span className="sr-only">{tile.full}</span>
            <span
              aria-hidden
              className="text-title-l font-semibold text-foreground"
            >
              {tile.day}
            </span>
            {/* Weekday over month, each on its own line rather than divided by
                a dot. This is a column, and at that width one line broke
                wherever it ran out — "Wednesday · August" over an orphaned
                "2026". Set as lines, the date breaks where a date breaks. */}
            <span aria-hidden className="text-body text-muted-foreground">
              {tile.weekday}
            </span>
            <span aria-hidden className="text-body text-muted-foreground">
              {tile.monthYear}
            </span>
          </time>
        </div>

        {/* The rule only exists while there are two columns. Stacked, they are
            already two blocks in reading order, and a rule across them would
            divide a date from its own listing. */}
        <Separator orientation="vertical" className="@max-sm:hidden" />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {tile.today ? (
            <Badge variant="warning" className={WELL_CHIP_STROKE.warning}>
              Today
            </Badge>
          ) : next.status ? (
            <Badge
              variant={next.status.variant}
              className={WELL_CHIP_STROKE[next.status.variant]}
            >
              {next.status.label}
            </Badge>
          ) : null}
          {next.purpose ? (
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-body font-medium text-muted-foreground">
                Listed for
              </p>
              {/* Never clamped: this is the clause the day exists for, and it
                  runs longer in Indic scripts (ACCESSIBILITY 13). */}
              <p className="text-body font-medium text-foreground">
                {next.purpose}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* The only route from Overview into Hearings, so it says where it goes
          rather than showing an arrow. A name is what a voice user can speak
          and a screen reader can list (ACCESSIBILITY 9). h-10 for the touch
          floor, text-body because it is screen copy, and underlined at rest
          rather than on hover: a link that only announces itself under the
          pointer does not exist on touch.

          It opens the register over the case now instead of leaving for it —
          this is a look at what the face above summarises, and a reader who
          came for the next date should not have to find their way back to
          Overview afterwards.

          Still an anchor with a real href, though, and the handler hands
          modified clicks straight back to the browser: cmd, ctrl, shift, alt
          and middle click open the page they have always opened. That is the
          whole reason it stayed a link. It is honest because the page is
          still there — the overlay is the shortcut, not the demolition of the
          destination (see `CaseHearingsDialog` on why `?section=hearings`
          stays). */}
      <Button
        variant="link"
        asChild
        className="h-10 self-start px-0 text-body underline"
      >
        <Link
          ref={hearingsTriggerRef}
          href={caseSectionHref(record.id, "hearings")}
          onClick={(event) => {
            if (event.defaultPrevented) return;
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              event.button !== 0
            ) {
              return;
            }
            event.preventDefault();
            setHearingsOpen(true);
          }}
        >
          View hearing details
        </Link>
      </Button>

      <CaseHearingsDialog
        record={record}
        open={hearingsOpen}
        onOpenChange={setHearingsOpen}
        triggerRef={hearingsTriggerRef}
      />
    </section>
  );
}

/**
 * The section's heading, set as the term of the column it heads. It is still
 * an `h2` a reader can land on and the section is still named by it — the
 * demotion is visual only, and it is what lets the date under it be the
 * loudest thing in the card.
 */
function NextHearingLabel() {
  return (
    <h2
      id={NEXT_HEARING_HEADING}
      className="text-body font-medium text-muted-foreground"
    >
      Next hearing
    </h2>
  );
}

/**
 * The work owed, on its own edge beside the date it is owed before.
 *
 * The caption pegs the whole list to that date, so no row has to carry it
 * again, and it is the only thing tying this card back to the one beside it.
 * The model only supplies it when it is true of every task (see
 * `tasksBeforeHearing`) — there is nothing to say otherwise, and nothing is
 * said. It carries more weight here than it did when the list sat directly
 * under the date: across a gutter, the sentence is the whole of the
 * relationship.
 *
 * No card at all when there is nothing owed. An empty bordered panel opposite
 * a full one reads as a list that failed to load rather than as a case with
 * its filings in order — see `CaseOverview`.
 */
function PendingTasksBlock({
  tasks,
  caption,
  bondTask,
}: {
  tasks: OverviewTask[];
  caption: string | null;
  /** The bond lifecycle's row — last, matching its later due date. */
  bondTask?: ReactNode;
}) {
  const count = tasks.length + (bondTask ? 1 : 0);
  return (
    <section
      aria-labelledby={PENDING_TASKS_HEADING}
      className="flex min-w-0 flex-col gap-4"
    >
      {/* The section title role, and the only heading in this card — it names
          the card, so it is set at the weight a card's title is set at. The
          count leads rather than trails: reached after three rows it is a
          count you have already made yourself. */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2
          id={PENDING_TASKS_HEADING}
          className="text-title-s font-semibold text-foreground"
        >
          Pending tasks
        </h2>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {caption ? (
        <p className="text-body text-muted-foreground">{caption}</p>
      ) : null}
      {/* One divided list, not N stacked panels — at panel weight, three
          tasks read as three more sections of the container. `ItemGroup`
          already carries role="list"; it is the name that is missing, and it
          is named for what it holds so that a reader who jumps into the list
          hears the same words the heading shows (ACCESSIBILITY 9). */}
      <ItemGroup aria-label="Pending tasks">
        {tasks.map((task, index) => (
          <Fragment key={task.id}>
            {index > 0 ? <ItemSeparator className="my-0" /> : null}
            <TaskRow task={task} />
          </Fragment>
        ))}
        {bondTask ? (
          <>
            {tasks.length > 0 ? <ItemSeparator className="my-0" /> : null}
            {bondTask}
          </>
        ) : null}
      </ItemGroup>
    </section>
  );
}

/**
 * Pulse of three, newest first — the rail is what makes this a sequence
 * instead of a second task list. No count: this is a window, not the
 * register, and the rows lead out to the tab that owns each event.
 *
 * The heading is a chip, because it is the second thing in a card whose first
 * thing is a 32px date: at the section-title weight it would read as the
 * card's title and put the date under it. As an outlined pill it reads as a
 * divider label — the shape the mockup drew — while staying an `h2` the
 * section is named by, which a styled `span` would not be.
 *
 * `outline`, not the teal pill the mockup shows. Teal is this app's primary,
 * the case header directly above already spends it on "Make filings", and
 * Laws ration it to one strong action per region while naming decorative teal
 * fills as the thing not to do. The last screen to carry that exact treatment
 * carried it on the *selected tab trigger*; spending it again on a label that
 * does nothing teaches the pill means "engaged" and then breaks the lesson.
 * Badge's `outline` is the DS's own outlined chip and claims no accent.
 *
 * "Case updates", not the mockup's "Case Updates" — sentence case is a Law,
 * and `app-nav.ts` and `case-peek.tsx` already say "Pending tasks" that way.
 *
 * Keeps `#case-timeline`, which is the anchor this block has answered to
 * since it was a card of its own.
 */
function CaseUpdatesBlock({ updates }: { updates: OverviewUpdate[] }) {
  return (
    <section
      id="case-timeline"
      aria-labelledby={CASE_UPDATES_HEADING}
      className="flex min-w-0 scroll-mt-6 flex-col gap-4"
    >
      <Badge variant="outline" asChild>
        <h2 id={CASE_UPDATES_HEADING}>Case updates</h2>
      </Badge>
      <Timeline aria-label="Case updates, newest first">
        {updates.map((update) => (
          <UpdateRow key={update.id} update={update} />
        ))}
      </Timeline>
    </section>
  );
}

/**
 * The row, and under it whatever the court wrote that day. The two are
 * siblings rather than one inside the other: the whole row is an anchor, and
 * a disclosure button inside an anchor is neither valid markup nor reachable
 * by keyboard — the same rule `TaskRow` already follows for a row carrying a
 * verb. Both are in the tab order, both say what they are, and both hold the
 * 40px touch floor (ACCESSIBILITY 8).
 *
 * gap-3 rather than the gap-2 inside the link: the link's own hover fill
 * bleeds 10px past its caption, and the trigger's bleeds 10px above its
 * label, so 12px of gap is the 2px of daylight that keeps the two fills from
 * touching. A row with nothing to disclose renders no trigger and no gap —
 * the stack is what holds the space, so nothing is left standing empty.
 */
function UpdateRow({ update }: { update: OverviewUpdate }) {
  return (
    <TimelineItem status={update.status}>
      <div className="flex min-w-0 flex-col gap-3">
        <Link
          href={update.href}
          className="-mx-3 -my-2.5 flex min-h-10 min-w-0 flex-col gap-2 rounded-lg px-3 py-2.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <p className="text-body font-medium text-foreground">
            {update.title}
          </p>
          <p className="text-caption text-muted-foreground">{update.caption}</p>
        </Link>
        {update.note ? (
          <UpdateNote note={update.note} of={update.caption} />
        ) : null}
      </div>
    </TimelineItem>
  );
}

/**
 * The day's business, folded under the row it came out of. It is a passage
 * the court wrote — the one block in this timeline set to be read rather than
 * scanned — and open by default it would be four lines of prose wedged
 * between two rows of a three-row pulse. Closed, the row keeps its place in
 * the sequence and the prose is one keystroke away.
 *
 * `Collapsible`, not `Accordion`: the DS points Accordion at a set of sibling
 * sections and Collapsible at a single show/hide with no siblings, and each
 * row discloses one thing of its own. An Accordion of one item per row would
 * also put the triggers on one arrow-key ring that walks over the links
 * between them.
 *
 * It reads as the row's third line rather than as a control parked under it.
 * The label is set at the DS's own button-and-menu-label role — `text-body-compact
 * font-medium` — so it sits a step below the row title it belongs to instead
 * of matching it; more than one row carries a trigger now, and at the title's
 * own 16px a pulse of three rows read as six. The 40px hit area is unchanged
 * underneath (ACCESSIBILITY 8), and `-mx-3 px-3` is the bleed the link above
 * already uses, so the term starts on the title's own left edge while the
 * fill runs out past it. The chevron sits tight against the label rather than
 * parked at the far edge of a row the label has lost touch with. Open, the
 * label darkens to `foreground` so the engaged trigger and the well beneath
 * it read as one object.
 */
function UpdateNote({
  note,
  of,
}: {
  note: OverviewUpdateNote;
  /** The row's caption, for the trigger's name out of context. */
  of: string;
}) {
  return (
    <Collapsible className="min-w-0">
      <CollapsibleTrigger className="group/update-note -mx-3 flex min-h-10 w-fit items-center gap-1.5 rounded-lg px-3 text-left text-body-compact font-medium text-muted-foreground outline-none transition-colors duration-100 hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:text-foreground">
        {note.term}
        {/* Out of context — a screen reader listing this page's buttons, a
            voice user naming one — "BoTD" on its own says nothing about which
            entry, and more than one row can carry one. The caption rather
            than the title: the title is a clause on some rows and ran to a
            whole sentence in the button's name, while the caption is the kind
            and the date and stays the length of a name. The visible label
            still leads it, so what a voice user speaks is what they see
            (ACCESSIBILITY 9, 12). */}
        <span className="sr-only">
          {" — "}
          {of}
        </span>
        <ChevronDownIcon
          className="pointer-events-none size-4 shrink-0 group-aria-expanded/update-note:hidden"
          aria-hidden
        />
        <ChevronUpIcon
          className="pointer-events-none hidden size-4 shrink-0 group-aria-expanded/update-note:inline"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* The well the rest of this page gives court prose, one step in from
            the surface it sits on — `surface-sunken` on `card`, never on the
            sunken page itself (Laws — nested soft fill inside a card). The
            container is still a Card, so the material under this well did not
            change: light puts a darker well on a near-white panel, dark puts a
            lighter one on a near-black panel. It is the same step the date
            face at the top of this card sits on, which is what makes the two
            read as one card's worth of insets rather than two devices. Never clamped: a
            truncated direction is exactly the one you needed to read, and
            these run longer in Indic scripts (ACCESSIBILITY 13). */}
        <p className="mt-2 rounded-md bg-surface-sunken p-4 text-body text-muted-foreground">
          {note.body}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Stacked rather than peek's title-opposite-date: the due status carries its
 * own date, and against the title it would take the room the title needs in
 * a half-width column — more so in Indic scripts (ACCESSIBILITY 13).
 *
 * A row whose task names a verb is not a link. Wrapping the row in an anchor
 * and hanging the button inside it is invalid markup, and it leaves the
 * button unreachable by keyboard and unannounced by a screen reader — so the
 * verb becomes the only thing that navigates. Rows product has not named a
 * verb for keep the whole-row link they have, rather than inventing one.
 */
function TaskRow({ task }: { task: OverviewTask }) {
  const action = task.action;
  if (action) {
    return (
      <Item
        role="listitem"
        size="sm"
        /* Hover fill off: the row itself no longer does anything, and a fill
           that follows the pointer across dead space is a promise of a click
           target that is not there. */
        className="min-h-10 items-start px-0 hover:bg-transparent"
      >
        <TaskFacts task={task} />
        {/* Opposite the title from sm: up, wrapping under it when the column
            cannot hold both — Item is flex-wrap with flex-1 content, so a
            long title grows the row rather than squeezing the button, and
            nothing is clamped (ACCESSIBILITY 13). At phone width a
            full-basis button is a 40px band of mostly empty row three times
            over, which is what sm: marks (RESPONSIVE.md 5, flex-col then
            sm:flex-row).

            Outline, not primary. The container is now one visual region and
            there is one primary allowed in it (Laws — ration teal), while
            this button appears once per task with an action: teal here would
            be up to three competing primaries, and a variant that changed
            with the number of tasks would make the same button teal on one
            case and outlined on the next. Default size, because sm is 36px
            against the 40px touch floor (ACCESSIBILITY 8). */}
        <ItemActions className="shrink-0 max-sm:basis-full">
          <Button variant="outline" className="max-sm:w-full" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </ItemActions>
      </Item>
    );
  }
  return (
    /* Same -mx-3/px-3 bleed UpdateRow uses: the title lines up with the
       caption and the separators at the column's 24px inset, while the hover
       fill still runs out past them. w-auto so the primitive's own w-full
       does not pin the right edge and make the bleed one-sided. */
    <Item asChild size="sm" className="-mx-3 min-h-10 w-auto items-start px-3">
      <Link href={task.href} role="listitem">
        <TaskFacts task={task} />
      </Link>
    </Item>
  );
}

/**
 * The due status keeps its place directly under the title. It is the line
 * that escalates, and a grey line between it and the title is a line of
 * separation from the thing it is about; who holds the task follows.
 */
function TaskFacts({ task }: { task: OverviewTask }) {
  return (
    <ItemContent className="gap-2">
      <RowTitle>{task.title}</RowTitle>
      {/* One block: the owner line continues the deadline rather than
          standing beside the title as a second peer. */}
      <div className="flex min-w-0 flex-col gap-1">
        <DueStatusLine {...task.due} />
        {/* Screen copy, not chrome — same 16px as the title it hangs
            under. Colour unchanged. */}
        {task.detail ? (
          <p className="text-body text-muted-foreground">{task.detail}</p>
        ) : null}
      </div>
    </ItemContent>
  );
}

/**
 * Clamp off: a truncated task is exactly the one you needed to read, and
 * these strings run longer in Indic scripts (ACCESSIBILITY 13).
 */
function RowTitle({ children }: { children: ReactNode }) {
  return (
    <ItemTitle className="line-clamp-none min-w-0 text-body font-medium text-foreground">
      {children}
    </ItemTitle>
  );
}
