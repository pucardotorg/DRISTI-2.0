"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, CloudAlert, LayoutGrid, List, RotateCw, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { cn } from "@/lib/utils";
import { advHome, fillCopy } from "@/lib/advocate/content";
import {
  advocateRosterOn,
  boardOf,
  caseRecordFor,
  courtLabelsOf,
  courtRooms,
  dayKeyOf,
  nextHearingDayAfter,
  weekOf,
  type AdvocateOption,
  type Board,
  type HomeHearing,
} from "@/lib/advocate/home";
import { useTasks } from "@/lib/tasks/store";
import { TASKS_HOME } from "@/lib/tasks/routes";
import { caseOf, type World } from "@/lib/tasks/selectors";
import { canView, verbFor } from "@/lib/tasks/permissions";
import type { PersonId } from "@/lib/tasks/types";
import { useTaskAct } from "@/components/tasks/task-act-layer";
import { PersonAvatar } from "@/components/tasks/person-avatar";
import { CasePeekSurface } from "@/components/cases/case-peek";
import { CasePeekProvider, useCasePeek } from "@/components/cases/use-case-peek";
import {
  CourtBoard,
  type BoardView,
  type CourtSection,
} from "@/components/advocate/court-board";
import { HomeGreeting } from "@/components/advocate/home-greeting";
import {
  CompanionRail,
  useRailSection,
} from "@/components/advocate/companion-rail";

/** The shell top bar is `h-14`; the sticky rail hangs below it. */
const TOP_BAR = "3.5rem";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A clock that ticks once a minute so due cues stay honest on a long-open tab. */
function useNow(): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Past this many advocates the tail collapses into a "+N" menu, not more rows. */
const MAX_CHIPS = 7;

/** The advocate's own label, "(you)" folded in for the signed-in account. */
function advocateLabel(locale: Locale, option: AdvocateOption): string {
  return option.you
    ? fillCopy(advHome.switcherYou, locale, { name: option.person.name })
    : option.person.name;
}

/**
 * One advocate in the roster, as a pressable face.
 *
 * The switcher is names the advocate says, not a permission model: holding the
 * vakalatnama is a property of one matter and never a cut that removes matters
 * from a cause list. Selection is one quiet cue — a brand ring on the chosen
 * disc — per the loudness ladder; a ring *and* a fill would be a costume. The
 * 40px hit target holds even though the disc inside it is smaller.
 */
function AdvocateChip({
  option,
  selected,
  locale,
  onSelect,
}: {
  option: AdvocateOption;
  selected: boolean;
  locale: Locale;
  onSelect: (id: PersonId) => void;
}) {
  const label = advocateLabel(locale, option);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={label}
          onClick={() => onSelect(option.person.id)}
          className="flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full transition-shadow",
              selected && "ring-2 ring-brand-accent"
            )}
          >
            <PersonAvatar
              person={option.person}
              you={option.you}
              size="default"
              surface="card"
            />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The per-court toolbar, below the court tabs.
 *
 * Two groups by role: what the board *contains* — the advocate it is seen
 * through — and how it is *drawn* on the left; the two real per-court actions on
 * the right. "View cause list" opens the court's full official day list (every
 * matter, not just the viewer's); "Join this courtroom" — the one bg-primary
 * action on the board — joins that court's virtual room. Both act on the
 * selected court, and both are honest stubs: no endpoint exists yet (§16.6 Q11).
 */
function BoardToolbar({
  locale,
  roster,
  whose,
  onWhoseChange,
  view,
  onViewChange,
  section,
  onViewCauseList,
  onJoinCourt,
}: {
  locale: Locale;
  roster: AdvocateOption[];
  whose: PersonId;
  onWhoseChange: (whose: PersonId) => void;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  /** The court the per-court actions act on. */
  section: CourtSection;
  onViewCauseList: (court: string) => void;
  onJoinCourt: (court: string) => void;
}) {
  const shown = roster.slice(0, MAX_CHIPS);
  const rest = roster.slice(MAX_CHIPS);
  const restSelected = rest.some((option) => option.person.id === whose);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 px-4 pt-3 pb-3 md:px-8">
      <span className="text-caption font-medium text-muted-foreground">
        {pick(advHome.viewCases, locale)}
      </span>

      <div
        role="radiogroup"
        aria-label={pick(advHome.whoseMatters, locale)}
        className="flex items-center gap-1"
      >
        {shown.map((option) => (
          <AdvocateChip
            key={option.person.id}
            option={option}
            selected={option.person.id === whose}
            locale={locale}
            onSelect={onWhoseChange}
          />
        ))}

        {/* The roster is unbounded — an establishment day can list many
            advocates — so past seven the tail is a menu, not another row. */}
        {rest.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={pick(advHome.moreAdvocates, locale)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-caption font-medium text-muted-foreground outline-none transition-colors hover:bg-accent-strong focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-accent-strong",
                  restSelected && "ring-2 ring-brand-accent"
                )}
              >
                +{rest.length}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-auto min-w-56">
              {rest.map((option) => (
                <DropdownMenuItem
                  key={option.person.id}
                  onSelect={() => onWhoseChange(option.person.id)}
                >
                  <PersonAvatar person={option.person} size="sm" />
                  <span className="truncate text-body-compact">
                    {advocateLabel(locale, option)}
                  </span>
                  <span className="ml-auto flex items-center gap-2 text-caption tabular-nums text-muted-foreground">
                    {option.count}
                    {option.person.id === whose ? (
                      <Check aria-hidden="true" className="size-4 text-foreground" />
                    ) : null}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <SegmentedControl
        type="single"
        size="compact"
        value={view}
        onValueChange={(next) => next && onViewChange(next as BoardView)}
        aria-label={pick(advHome.layoutLabel, locale)}
      >
        {(
          [
            ["cards", advHome.layoutCards, LayoutGrid],
            ["list", advHome.layoutList, List],
          ] as const
        ).map(([value, label, Icon]) => (
          <SegmentedControlItem key={value} value={value}>
            <span className="flex items-center gap-1.5">
              <Icon aria-hidden="true" className="size-4" />
              {pick(label, locale)}
            </span>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      {/* The two per-court actions — a court is a place with a cause list and a
          courtroom of its own. Join is the one saturated action on the board. */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onViewCauseList(section.court)}
        >
          {pick(advHome.viewCauseList, locale)}
        </Button>
        {section.hasVirtualRoom ? (
          <Button onClick={() => onJoinCourt(section.court)}>
            <Video aria-hidden="true" />
            {pick(advHome.joinCourtroom, locale)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The advocate home — the day in court, and what stands in its way.
 *
 * One world, three surfaces: the cause-list board (from `Case.nextHearingAt`),
 * the pending-tasks rail (the coming week of the Needs-action tab), and the
 * case peek — the same peek Your Cases uses, over the bridged record, so one
 * component answers "what is this case" everywhere. Acting on a task happens
 * in place, through the same modal-and-flow table /tasks runs.
 */
export function AdvocateHome(props: {
  locale: Locale;
  profileFirstName: string;
}) {
  const now = useNow();
  return (
    <CasePeekProvider now={now}>
      <HomeBody {...props} now={now} />
    </CasePeekProvider>
  );
}

function HomeBody({
  locale,
  profileFirstName,
  now,
}: {
  locale: Locale;
  profileFirstName: string;
  now: number;
}) {
  const store = useTasks();
  const { state, people, cases, tasks, user, reload } = store;
  const router = useRouter();
  const { run: actOn, layer: actLayer } = useTaskAct();
  const peek = useCasePeek();

  const world = React.useMemo<World>(
    () => ({ people, cases, tasks, user, now: new Date(now) }),
    [people, cases, tasks, user, now]
  );

  const todayKey = dayKeyOf(now);
  const [selectedDay, setSelectedDay] = React.useState<string>(todayKey);
  /** Which week the strip shows — pages independently of today. */
  const [weekAnchor, setWeekAnchor] = React.useState<number>(now);
  const [view, setView] = React.useState<BoardView>("cards");
  // A per-session lens, deliberately not persisted: "my matters" is the right
  // thing to land on every morning.
  const [whose, setWhose] = React.useState<PersonId>(user.id);
  /** Which court's board is shown; null falls back to the first tab. */
  const [courtId, setCourtId] = React.useState<string | null>(null);
  // Not `useState`: which panel stands open is remembered per user, so a rail
  // closed last week is still closed. First run opens the tasks panel.
  const [railSection, setRailSection] = useRailSection();

  const week = React.useMemo(
    () => weekOf(world, now, weekAnchor),
    [world, now, weekAnchor]
  );
  const rooms = React.useMemo(
    () => courtRooms(world, selectedDay, now),
    [world, selectedDay, now]
  );

  /** The establishment every court name shares — computed, never matched. */
  const courtLabels = React.useMemo(
    () => courtLabelsOf(rooms.map((room) => room.court)),
    [rooms]
  );

  const roster = React.useMemo(
    () => advocateRosterOn(world, selectedDay, now),
    [world, selectedDay, now]
  );
  // Yesterday's colleague may have nothing listed today. Falling back to self
  // rather than syncing state in an effect keeps the choice for the day it was
  // made on: step back to that day and it is still there.
  const active = roster.some((option) => option.person.id === whose)
    ? whose
    : user.id;
  const whoseName =
    roster.find((option) => option.person.id === active)?.person.name ?? user.name;

  const boards = React.useMemo(() => {
    const map = new Map<string, Board>();
    for (const room of rooms) {
      map.set(room.court, boardOf(world, room.court, selectedDay, now));
    }
    return map;
  }, [world, rooms, selectedDay, now]);

  // Every court the viewer can see gets a tab — including one that lists nothing
  // today, which stays a landmark and leads to its own empty-state jump. The
  // switcher narrows a board's contents, never the cause list's numbering: item
  // numbers come from the full world, so a filtered board still says "item 7".
  const sections = React.useMemo<CourtSection[]>(() => {
    const keep = (h: HomeHearing) => canView(active, h.kase);
    return rooms.map((room) => {
      const full = boards.get(room.court)!;
      const board: Board = {
        now: full.now && keep(full.now) ? full.now : null,
        upcoming: full.upcoming.filter(keep),
        concluded: full.concluded.filter(keep),
      };
      return {
        court: room.court,
        label: courtLabels.shortOf(room.court),
        count:
          (board.now ? 1 : 0) + board.upcoming.length + board.concluded.length,
        live: !!board.now,
        // Every court is assumed to have a virtual room for now; §16.6 Q11 owns
        // the real answer (only the 24×7 ON Court, or all of them).
        hasVirtualRoom: true,
        board,
      };
    });
  }, [rooms, boards, courtLabels, active]);

  const visibleMatterCount = sections.reduce((sum, s) => sum + s.count, 0);
  const court = courtId ?? sections[0]?.court ?? null;
  const current = sections.find((s) => s.court === court) ?? sections[0] ?? null;

  const jump = React.useMemo(() => {
    const next = nextHearingDayAfter(world, selectedDay);
    if (!next) return null;
    const label = new Intl.DateTimeFormat(locale === "ml" ? "ml-IN" : "en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(new Date(`${next.key}T12:00:00`));
    return { ...next, label };
  }, [world, selectedDay, locale]);

  function selectDay(key: string) {
    setSelectedDay(key);
    peek.close();
    // Selecting a day in another week re-anchors the strip to it.
    setWeekAnchor(new Date(`${key}T12:00:00`).getTime());
  }

  /** Open the shared case peek for any matter in the world, via the bridge. */
  const openCase = React.useCallback(
    (caseId: string) => {
      const kase = cases.find((c) => c.id === caseId);
      if (!kase) return;
      const record = caseRecordFor(kase, kase.nextHearingAt);
      if (record) peek.open(record);
    },
    [cases, peek]
  );

  /** The viewer's verb for a task — what the hover overlay names. */
  const verbOf = React.useCallback(
    (task: (typeof tasks)[number]) => {
      const kase = caseOf({ cases }, task);
      return kase ? verbFor(user, task, kase) : "Open";
    },
    [cases, user]
  );

  const selectedCaseId = React.useMemo(() => {
    const id = peek.record?.id;
    return id?.startsWith("tw-") ? id.slice(3) : null;
  }, [peek.record]);

  // The two per-court actions the owner confirmed are real features. No endpoint
  // exists yet — the courtroom-conferencing route and the official cause-list
  // service are both open (§16.6 Q11) — so these are honest no-op stubs, wired
  // as live actions rather than hidden until the backend lands.
  const onJoinCourt = React.useCallback((court: string) => {
    // TODO(Q11): open the court's virtual courtroom for `court`.
    void court;
  }, []);
  const onViewCauseList = React.useCallback((court: string) => {
    // TODO(Q11): open the full official day cause list for `court`.
    void court;
  }, []);

  // A failure and a slow load are not the same screen. One spinner stood for
  // both, so a failed load spun forever with no way out of it.
  if (state === "error") {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CloudAlert aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{pick(advHome.loadErrorTitle, locale)}</EmptyTitle>
            <EmptyDescription>
              {pick(advHome.loadErrorBody, locale)}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            <RotateCw aria-hidden="true" />
            {pick(advHome.retry, locale)}
          </Button>
        </Empty>
      </main>
    );
  }

  if (state !== "ready") {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </main>
    );
  }

  return (
    <CasePeekSurface className="flex min-h-0 min-w-0 flex-1">
      {/* A container, not just a column: the rail narrows the board without
          narrowing the viewport, so what the board puts on one line has to
          answer to its own width. */}
      <main className="@container flex min-w-0 flex-1 flex-col">
        <div className="px-4 pt-6 pb-4 md:px-8">
          <HomeGreeting
            locale={locale}
            firstName={profileFirstName}
            now={now}
            week={week}
            selectedDay={selectedDay}
            matterCount={visibleMatterCount}
            onSelectDay={selectDay}
            onShiftWeek={(delta) => setWeekAnchor((a) => a + delta * 7 * DAY_MS)}
            onPickDate={(date) => selectDay(dayKeyOf(date))}
          />
        </div>

        {court ? (
          <Tabs value={court} onValueChange={setCourtId}>
            {/* The tab band scrolls rather than clips: a section header would
                wrap, but a court is a place with per-court actions, so a tab —
                which keeps one court selected for the toolbar to act on — is the
                right shape. Short names keep the establishment out of the band.
                The active underline sits ON the band's own rule (`-mb-px` +
                `after:bottom-0`), never floating above a second line. */}
            <div className="border-b border-hairline px-4 md:px-8">
              <TabsList
                variant="line"
                className="min-w-0 grow basis-full justify-start gap-1 overflow-x-auto px-0 pb-0 group-data-horizontal/tabs:h-auto"
              >
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.court}
                    value={section.court}
                    className="-mb-px flex-none gap-2 px-3 pt-2 pb-3 group-data-horizontal/tabs:h-auto group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:bg-brand-accent"
                  >
                    {section.live ? (
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full bg-success"
                      />
                    ) : null}
                    <span className="text-body-compact font-semibold">
                      {section.label}
                    </span>
                    <span className="text-caption tabular-nums text-muted-foreground">
                      {section.count}
                    </span>
                    {section.live ? (
                      <span className="sr-only">
                        {pick(advHome.inSession, locale)}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {current ? (
              <BoardToolbar
                locale={locale}
                roster={roster}
                whose={active}
                onWhoseChange={setWhose}
                view={view}
                onViewChange={setView}
                section={current}
                onViewCauseList={onViewCauseList}
                onJoinCourt={onJoinCourt}
              />
            ) : null}

            {sections.map((section) => (
              <TabsContent
                key={section.court}
                value={section.court}
                className="px-4 md:px-8"
              >
                <CourtBoard
                  world={world}
                  locale={locale}
                  section={section}
                  view={view}
                  selectedCaseId={selectedCaseId}
                  active={active}
                  userId={user.id}
                  whoseName={whoseName}
                  jump={jump}
                  onOpenCase={openCase}
                  onAct={actOn}
                  onJump={selectDay}
                  onShowYours={() => setWhose(user.id)}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="px-4 pt-4 pb-8 md:px-8">
            <Empty className="bg-surface-sunken">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CloudAlert aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{pick(advHome.emptyDayTitle, locale)}</EmptyTitle>
                <EmptyDescription>
                  {pick(advHome.emptyDayBody, locale)}
                </EmptyDescription>
              </EmptyHeader>
              {jump ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectDay(jump.key)}
                >
                  {fillCopy(advHome.jumpNext, locale, {
                    day: jump.label,
                    n: String(jump.count),
                  })}
                </Button>
              ) : null}
            </Empty>
          </div>
        )}
      </main>

      <CompanionRail
        world={world}
        locale={locale}
        section={railSection}
        topOffset={TOP_BAR}
        onSectionChange={setRailSection}
        verbOf={verbOf}
        onAct={actOn}
        onOpenCase={openCase}
        onViewAllTasks={() => router.push(TASKS_HOME)}
      />

      {actLayer}
    </CasePeekSurface>
  );
}
