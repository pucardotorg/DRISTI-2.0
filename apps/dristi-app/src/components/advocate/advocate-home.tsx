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
  courtRooms,
  dayKeyOf,
  matterCountOn,
  nextHearingDayAfter,
  weekOf,
  type Board,
} from "@/lib/advocate/home";
import { useTasks } from "@/lib/tasks/store";
import { TASKS_HOME, taskHref } from "@/lib/tasks/routes";
import type { PersonId } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import { CourtBoard, type BoardView } from "@/components/advocate/court-board";
import { CasePeek } from "@/components/advocate/case-peek";
import { HomeGreeting } from "@/components/advocate/home-greeting";
import { TasksRail } from "@/components/advocate/tasks-rail";

/** The shell top bar is `h-14`; the sticky rails hang below it. */
const TOP_BAR = "3.5rem";

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
 * the pending-tasks rail (the Needs-action tab of /tasks, verbatim), and the
 * case peek. A blocking task appears on the hearing it blocks *and* in the rail,
 * because they are the same task read twice — opening it anywhere lands on
 * /tasks, where acting on it lives.
 */
export function AdvocateHome({
  locale,
  profileFirstName,
}: {
  locale: Locale;
  profileFirstName: string;
}) {
  const store = useTasks();
  const { state, people, cases, tasks, user } = store;
  const router = useRouter();
  const now = useNow();

  const world = React.useMemo<World>(
    () => ({ people, cases, tasks, user, now: new Date(now) }),
    [people, cases, tasks, user, now]
  );

  const todayKey = dayKeyOf(now);
  const [selectedDay, setSelectedDay] = React.useState<string>(todayKey);
  const [view, setView] = React.useState<BoardView>("cards");
  const [advocates, setAdvocates] = React.useState<PersonId[]>([]);
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const [railOpen, setRailOpen] = React.useState(false);

  const week = React.useMemo(() => weekOf(world, now), [world, now]);
  const rooms = React.useMemo(
    () => courtRooms(world, selectedDay, now),
    [world, selectedDay, now]
  );
  const [courtId, setCourtId] = React.useState<string | null>(null);
  const court = courtId ?? rooms[0]?.court ?? null;

  const matterCount = React.useMemo(
    () => matterCountOn(world, selectedDay, now),
    [world, selectedDay, now]
  );

  function filteredBoard(board: Board): Board {
    if (advocates.length === 0) return board;
    const keep = (h: { kase: { advocates: PersonId[] } }) =>
      h.kase.advocates.some((id) => advocates.includes(id));
    return {
      now: board.now && keep(board.now) ? board.now : null,
      upcoming: board.upcoming.filter(keep),
      concluded: board.concluded.filter(keep),
    };
  }

  const boards = React.useMemo(() => {
    const map = new Map<string, Board>();
    for (const room of rooms) {
      map.set(room.court, boardOf(world, room.court, selectedDay, now));
    }
    return map;
  }, [world, rooms, selectedDay, now]);

  // The peek's hearing: whichever board on the selected day holds the case.
  const selectedHearing = React.useMemo(() => {
    if (!selectedCaseId) return null;
    for (const board of boards.values()) {
      const all = [
        ...(board.now ? [board.now] : []),
        ...board.upcoming,
        ...board.concluded,
      ];
      const hit = all.find((h) => h.kase.id === selectedCaseId);
      if (hit) return hit;
    }
    return null;
  }, [boards, selectedCaseId]);

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
    setSelectedCaseId(null);
  }

  function toggleAdvocate(id: PersonId) {
    setAdvocates((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function openTask(taskId: string) {
    router.push(taskHref(taskId));
  }

  if (state !== "ready") {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {/* A container, not just a column: the peek and the rail narrow the board
          without narrowing the viewport, so what the board puts on one line has
          to answer to its own width. */}
      <main className="@container flex min-w-0 flex-1 flex-col">
        <div className="px-4 pt-8 pb-4 md:px-6">
          <HomeGreeting
            locale={locale}
            firstName={profileFirstName}
            now={now}
            week={week}
            selectedDay={selectedDay}
            matterCount={matterCount}
            onSelectDay={selectDay}
          />
        </div>

        <Tabs value={court ?? ""} onValueChange={setCourtId}>
          {/* The active underline sits ON the band's rule rather than floating
              above it — one horizontal line, not two. */}
          <TabsList
            variant="line"
            className="w-full justify-start gap-1 overflow-x-auto border-b border-hairline px-4 pb-0 group-data-horizontal/tabs:h-auto md:px-6"
          >
            {rooms.map((room) => (
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
                board={filteredBoard(boards.get(room.court)!)}
                filtered={advocates.length > 0}
                view={view}
                onViewChange={setView}
                advocates={advocates}
                onToggleAdvocate={toggleAdvocate}
                selectedCaseId={selectedCaseId}
                onOpenCase={setSelectedCaseId}
                onOpenTask={openTask}
                jump={jump}
                onJump={selectDay}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <CasePeek
        world={world}
        locale={locale}
        hearing={selectedHearing}
        open={Boolean(selectedHearing)}
        topOffset={TOP_BAR}
        onOpenChange={(next) => {
          if (!next) setSelectedCaseId(null);
        }}
        onOpenTask={openTask}
      />

      <TasksRail
        world={world}
        locale={locale}
        open={railOpen}
        topOffset={TOP_BAR}
        onOpen={() => setRailOpen(true)}
        onClose={() => setRailOpen(false)}
        onOpenTask={openTask}
        onViewAll={() => router.push(TASKS_HOME)}
      />
    </div>
  );
}
