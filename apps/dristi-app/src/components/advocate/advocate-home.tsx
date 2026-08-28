"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  CloudAlert,
  LayoutGrid,
  List,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
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
  courtSectionId,
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

/** Below this many sections the jump menu is chrome explaining two headings. */
const JUMP_MENU_FROM = 3;

/**
 * The board's own row of chrome: what it contains on the left, how it is drawn
 * on the right.
 *
 * Everything here is page state rather than one court's, and rendering it once
 * above the stack is what says so. The establishment leads because it is the
 * one fact every court heading below would otherwise repeat.
 */
function BoardToolbar({
  locale,
  roster,
  whose,
  onWhoseChange,
  sections,
  establishment,
  onJump,
  view,
  onViewChange,
}: {
  locale: Locale;
  roster: AdvocateOption[];
  whose: PersonId;
  onWhoseChange: (whose: PersonId) => void;
  /** The courts with matters — the jump menu's targets. */
  sections: CourtSection[];
  /** The trailing run every court name shares, said once. */
  establishment: string | null;
  onJump: (court: string) => void;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
}) {
  const current = roster.find((option) => option.person.id === whose);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 pb-3 md:px-8">
      {establishment ? (
        <p className="text-caption font-medium text-muted-foreground">
          {fillCopy(advHome.courtsAt, locale, { place: establishment })}
        </p>
      ) : null}

      {/* Names, not a permission model. Holding the vakalatnama is a property of
          one matter — it changes that card's verbs and nothing else — so it was
          never a cut that should remove matters from a cause list. */}
      <Select value={whose} onValueChange={onWhoseChange}>
        <SelectTrigger
          aria-label={pick(advHome.whoseMatters, locale)}
          className="w-fit min-w-48"
        >
          {current ? (
            <span className="flex min-w-0 items-center gap-2">
              <PersonAvatar person={current.person} size="sm" />
              <span className="truncate text-body-compact">
                {current.person.name}
              </span>
            </span>
          ) : null}
        </SelectTrigger>
        {/* The DS default opens the list over its own trigger; a roster is read
            downward from the control that names it. */}
        <SelectContent position="popper" align="start" sideOffset={4}>
          {roster.map((option) => (
            <SelectItem
              key={option.person.id}
              value={option.person.id}
              // The row is an avatar, a name and a count; typeahead reads text
              // content, so it needs the plain name said separately.
              textValue={option.person.name}
            >
              <PersonAvatar person={option.person} size="sm" />
              <span className="truncate text-body-compact">
                {option.you
                  ? fillCopy(advHome.switcherYou, locale, {
                      name: option.person.name,
                    })
                  : option.person.name}
              </span>
              <span className="ml-auto text-caption tabular-nums text-muted-foreground">
                {option.count}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Three courts is where a stack stops being scannable in one look. Below
          that the menu would be a control explaining two headings. */}
      {sections.length >= JUMP_MENU_FROM ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {pick(advHome.jumpToCourt, locale)}
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto min-w-56">
            {sections.map((section) => (
              <DropdownMenuItem
                key={section.court}
                onSelect={() => onJump(section.court)}
              >
                {section.live ? (
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-success"
                  />
                ) : null}
                <span className="flex-1 truncate">{section.label}</span>
                {section.live ? (
                  <span className="sr-only">
                    {pick(advHome.inSession, locale)}
                  </span>
                ) : null}
                <span className="text-caption tabular-nums text-muted-foreground">
                  {section.count}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <SegmentedControl
        className="ml-auto"
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
  // A per-session lens, deliberately not persisted: "my matters" is the right
  // thing to land on every morning.
  const [whose, setWhose] = React.useState<PersonId>(user.id);
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

  // The switcher narrows the board, never the cause list's numbering: item
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
        board,
      };
    });
  }, [rooms, boards, courtLabels, active]);

  const listed = sections.filter((section) => section.count > 0);
  const quiet = sections.filter((section) => section.count === 0);
  const visibleMatterCount = sections.reduce((sum, s) => sum + s.count, 0);

  /**
   * The jump menu moves focus, not just the scroll position — landing a keyboard
   * user at the top of the page would be a scroll that pretended to be a jump.
   */
  const jumpToCourt = React.useCallback((court: string) => {
    const section = document.getElementById(courtSectionId(court));
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    section.querySelector("h2")?.focus({ preventScroll: true });
  }, []);

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

        <BoardToolbar
          locale={locale}
          roster={roster}
          whose={active}
          onWhoseChange={setWhose}
          sections={listed}
          establishment={courtLabels.establishment}
          onJump={jumpToCourt}
          view={view}
          onViewChange={setView}
        />

        {/* The day's courts, stacked in cause-list order. A section header is a
            block element that wraps; a tab was an inline element that clipped,
            and at the pilot's own four courts none of them fitted. */}
        {listed.length ? (
          <div className="flex flex-col gap-8 px-4 pt-4 pb-8 md:px-8">
            {listed.map((section) => (
              <CourtBoard
                key={section.court}
                world={world}
                locale={locale}
                section={section}
                view={view}
                selectedCaseId={selectedCaseId}
                onOpenCase={openCase}
                onAct={actOn}
              />
            ))}

            {/* A court with nothing listed is worth one line, not a section:
                stacked, an empty court is 200px of scroll the reader pays for
                on the way past, where a tab at least stayed a landmark. */}
            {quiet.length ? (
              <p className="text-caption text-muted-foreground">
                {fillCopy(advHome.nothingListedIn, locale, {
                  courts: quiet.map((section) => section.label).join(", "),
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="px-4 pt-4 pb-8 md:px-8">
            {/* The sunken fill is the separation — a stroke on top of it would
                be the second thing doing one job. */}
            <Empty className="bg-surface-sunken">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SlidersHorizontal aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>
                  {active === user.id
                    ? pick(advHome.emptyDayTitle, locale)
                    : fillCopy(advHome.emptyAdvocateTitle, locale, {
                        name: whoseName,
                      })}
                </EmptyTitle>
                <EmptyDescription>
                  {active === user.id
                    ? pick(advHome.emptyDayBody, locale)
                    : fillCopy(advHome.emptyAdvocateBody, locale, {
                        name: whoseName,
                      })}
                </EmptyDescription>
              </EmptyHeader>
              {active === user.id ? (
                jump ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectDay(jump.key)}
                  >
                    {fillCopy(advHome.jumpNext, locale, {
                      day: jump.label,
                      n: String(jump.count),
                    })}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                ) : null
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhose(user.id)}
                >
                  {pick(advHome.showYourMatters, locale)}
                </Button>
              )}
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
