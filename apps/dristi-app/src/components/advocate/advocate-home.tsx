"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CloudAlert, LayoutGrid, List, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome } from "@/lib/advocate/content";
import {
  boardOf,
  caseRecordFor,
  courtRooms,
  dayKeyOf,
  holdsVakalatnama,
  nextHearingDayAfter,
  weekOf,
  type Board,
  type HomeHearing,
} from "@/lib/advocate/home";
import { useTasks } from "@/lib/tasks/store";
import { TASKS_HOME } from "@/lib/tasks/routes";
import { caseOf, type World } from "@/lib/tasks/selectors";
import { verbFor } from "@/lib/tasks/permissions";
import { useTaskAct } from "@/components/tasks/task-act-layer";
import { CasePeekSurface } from "@/components/cases/case-peek";
import { CasePeekProvider, useCasePeek } from "@/components/cases/use-case-peek";
import {
  CourtBoard,
  type AccessFilter,
  type BoardView,
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

/**
 * The two controls on the tab band's trailing edge.
 *
 * Both are page state, not a court's: the access cut and the cause-list layout
 * hold across every tab, and this is where placement says so. They are the same
 * kind of choice — one value from a fixed set — so they are the same control at
 * the same size, and each keeps the DS's 40px target under a 32px well.
 */
function BoardControls({
  locale,
  access,
  onAccessChange,
  accessCounts,
  view,
  onViewChange,
}: {
  locale: Locale;
  access: AccessFilter;
  onAccessChange: (access: AccessFilter) => void;
  /** Selected-day totals per access mode — the control names its counts. */
  accessCounts: Record<AccessFilter, number>;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {/* Not a people filter: access. A matter is either one you act in — you
          hold the vakalatnama — or one you watch; the split decides the verbs
          everywhere else on this screen, so it is the one cut worth a control. */}
      <SegmentedControl
        type="single"
        size="compact"
        value={access}
        onValueChange={(next) => next && onAccessChange(next as AccessFilter)}
        aria-label={pick(advHome.filterLabel, locale)}
      >
        {(
          [
            ["all", advHome.filterAll],
            ["mine", advHome.filterMine],
            ["shared", advHome.filterShared],
          ] as const
        ).map(([value, label]) => (
          <SegmentedControlItem key={value} value={value}>
            {pick(label, locale)}
            {/* Counts presented the same way as the court tabs' — one
                presentation per data type across siblings. */}
            <span className="ml-1 text-caption tabular-nums text-muted-foreground">
              {accessCounts[value]}
            </span>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

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
  const [access, setAccess] = React.useState<AccessFilter>("all");
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
  const [courtId, setCourtId] = React.useState<string | null>(null);
  const court = courtId ?? rooms[0]?.court ?? null;

  const filterBoard = React.useCallback(
    (board: Board): Board => {
      if (access === "all") return board;
      const keep = (h: HomeHearing) =>
        access === "mine"
          ? holdsVakalatnama(world, h.kase)
          : !holdsVakalatnama(world, h.kase);
      return {
        now: board.now && keep(board.now) ? board.now : null,
        upcoming: board.upcoming.filter(keep),
        concluded: board.concluded.filter(keep),
      };
    },
    [access, world]
  );

  const boards = React.useMemo(() => {
    const map = new Map<string, Board>();
    for (const room of rooms) {
      map.set(room.court, boardOf(world, room.court, selectedDay, now));
    }
    return map;
  }, [world, rooms, selectedDay, now]);

  const allHearings = React.useMemo(
    () =>
      [...boards.values()].flatMap((board) => [
        ...(board.now ? [board.now] : []),
        ...board.upcoming,
        ...board.concluded,
      ]),
    [boards]
  );

  /** Selected-day totals per access mode — the filter control names them. */
  const accessCounts = React.useMemo(() => {
    const mine = allHearings.filter((h) => holdsVakalatnama(world, h.kase)).length;
    return { all: allHearings.length, mine, shared: allHearings.length - mine };
  }, [allHearings, world]);

  // What the tabs and greeting count — the filtered view, so a narrowed filter
  // never shows a 5 above a board of 3. Boards keep full-world item numbers.
  const roomView = React.useMemo(
    () =>
      rooms.map((room) => {
        const board = filterBoard(boards.get(room.court)!);
        return {
          court: room.court,
          count:
            (board.now ? 1 : 0) + board.upcoming.length + board.concluded.length,
          live: !!board.now,
        };
      }),
    [rooms, boards, filterBoard]
  );
  const visibleMatterCount = roomView.reduce((sum, r) => sum + r.count, 0);

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

        <Tabs value={court ?? ""} onValueChange={setCourtId}>
          {/* One band, two jobs. The court tabs choose *which* board; the two
              controls on the trailing edge are page state — they apply to every
              court, and rendering them once here says so, where a copy inside
              each court's panel implied a per-court scope they never had.
              Wrapping is `wrap-reverse` on purpose: when the board is too narrow
              to hold both, the controls take the upper line and the tabs stay
              flush with the band's rule, so the active underline lands on that
              rule at every width instead of floating above a second line. */}
          <div className="flex flex-wrap-reverse gap-x-4 gap-y-2 border-b border-hairline px-4 md:px-8">
            <TabsList
              variant="line"
              className="min-w-0 grow basis-full justify-start gap-1 overflow-x-auto px-0 pb-0 group-data-horizontal/tabs:h-auto @3xl:basis-0"
            >
              {roomView.map((room) => (
                <TabsTrigger
                  key={room.court}
                  value={room.court}
                  className="-mb-px flex-none gap-2 px-3 pt-2 pb-3 group-data-horizontal/tabs:h-auto group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:after:bg-brand-accent"
                >
                  {room.live ? (
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full bg-success"
                    />
                  ) : null}
                  {/* The court's name as the world states it. Shortening it here
                      matched an English literal, so a Malayalam or Gujarati
                      deployment would silently keep the long form — how a court
                      is named is a state-layer fact, not a view's edit. */}
                  <span className="text-body-compact font-semibold">
                    {room.court}
                  </span>
                  {/* Every tab states its count the same way — the number is the
                      same kind of fact on all four. */}
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {room.count}
                  </span>
                  {room.live ? (
                    <span className="sr-only">{pick(advHome.inSession, locale)}</span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>

            <BoardControls
              locale={locale}
              access={access}
              onAccessChange={setAccess}
              accessCounts={accessCounts}
              view={view}
              onViewChange={setView}
            />
          </div>

          {rooms.map((room) => (
            <TabsContent key={room.court} value={room.court} className="px-4 md:px-8">
              <CourtBoard
                world={world}
                locale={locale}
                board={filterBoard(boards.get(room.court)!)}
                access={access}
                view={view}
                selectedCaseId={selectedCaseId}
                onOpenCase={openCase}
                onAct={actOn}
                jump={jump}
                onJump={selectDay}
              />
            </TabsContent>
          ))}
        </Tabs>
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
