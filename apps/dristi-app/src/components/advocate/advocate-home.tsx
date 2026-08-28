"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import type { World } from "@/lib/tasks/selectors";
import { useTaskAct } from "@/components/tasks/task-act-layer";
import { CasePeekSurface } from "@/components/cases/case-peek";
import { CasePeekProvider, useCasePeek } from "@/components/cases/use-case-peek";
import {
  CourtBoard,
  type AccessFilter,
  type BoardView,
} from "@/components/advocate/court-board";
import { HomeGreeting } from "@/components/advocate/home-greeting";
import { TasksRail } from "@/components/advocate/tasks-rail";

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
  const { state, people, cases, tasks, user } = store;
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
  const [railOpen, setRailOpen] = React.useState(true);

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

  /** Open the shared case peek on a board hearing, via the bridged record. */
  const openHearing = React.useCallback(
    (caseId: string) => {
      const hearing = allHearings.find((h) => h.kase.id === caseId);
      if (!hearing) return;
      const record = caseRecordFor(hearing.kase, hearing.at);
      if (record) peek.open(record);
    },
    [allHearings, peek]
  );

  const selectedCaseId = React.useMemo(() => {
    const id = peek.record?.id;
    return id?.startsWith("tw-") ? id.slice(3) : null;
  }, [peek.record]);

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
        <div className="px-4 pt-8 pb-4 md:px-6">
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
          {/* The active underline sits ON the band's rule rather than floating
              above it — one horizontal line, not two. */}
          <TabsList
            variant="line"
            className="w-full justify-start gap-1 overflow-x-auto border-b border-hairline px-4 pb-0 group-data-horizontal/tabs:h-auto md:px-6"
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
                <span className="text-body-compact font-semibold">
                  {room.court.replace(", Kollam", "")}
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

          {rooms.map((room) => (
            <TabsContent key={room.court} value={room.court} className="px-4 md:px-6">
              <CourtBoard
                world={world}
                locale={locale}
                board={filterBoard(boards.get(room.court)!)}
                access={access}
                onAccessChange={setAccess}
                accessCounts={accessCounts}
                view={view}
                onViewChange={setView}
                selectedCaseId={selectedCaseId}
                onOpenCase={openHearing}
                onAct={actOn}
                jump={jump}
                onJump={selectDay}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <TasksRail
        world={world}
        locale={locale}
        open={railOpen}
        topOffset={TOP_BAR}
        onOpen={() => setRailOpen(true)}
        onClose={() => setRailOpen(false)}
        onAct={actOn}
        onViewAll={() => router.push(TASKS_HOME)}
      />

      {actLayer}
    </CasePeekSurface>
  );
}
