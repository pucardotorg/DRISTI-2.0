"use client";

import { ArrowRight, LayoutGrid, List, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import type { Board } from "@/lib/advocate/home";
import type { PersonId } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import { cn } from "@/lib/utils";
import {
  ConcludedStrip,
  HearingCard,
  NowHearingCard,
} from "@/components/advocate/hearing-cards";
import { HearingList } from "@/components/advocate/hearing-list";

export type BoardView = "cards" | "list";

function AdvocateFilter({
  world,
  selected,
  onToggle,
}: {
  world: World;
  selected: PersonId[];
  onToggle: (id: PersonId) => void;
}) {
  const userId = typeof world.user === "string" ? world.user : world.user.id;
  return (
    <div className="flex items-center gap-2">
      <span
        id="advocate-filter-label"
        className="text-caption font-semibold text-muted-foreground"
      >
        View cases
      </span>
      <ul aria-labelledby="advocate-filter-label" className="flex items-center gap-1">
        {world.people.map((person) => {
          const on = selected.includes(person.id);
          return (
            <li key={person.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(person.id)}
                title={person.id === userId ? `${person.name} (you)` : person.name}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-caption font-semibold transition-colors",
                  on
                    ? "bg-brand-muted text-brand-muted-foreground ring-2 ring-brand-accent ring-inset"
                    : "bg-surface-sunken text-foreground hover:bg-accent"
                )}
              >
                {person.initials}
                <span className="sr-only"> — {person.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Everything below the court tabs for one court on one day.
 *
 * The board's board-level chrome is deliberately spare: the cards/list toggle is
 * the cause-list layout, and filtering is by advocate chips. The v3 mock's "Join
 * this courtroom" and "View cause list" buttons are not here — there is no
 * courtroom link to join yet, and the list view *is* the cause list; a dead
 * primary action would outrank every real one.
 */
export function CourtBoard({
  world,
  locale,
  board,
  filtered,
  view,
  onViewChange,
  advocates,
  onToggleAdvocate,
  selectedCaseId,
  onOpenCase,
  onOpenTask,
  jump,
  onJump,
}: {
  world: World;
  locale: Locale;
  board: Board;
  /** An advocate chip is narrowing the list. */
  filtered: boolean;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  advocates: PersonId[];
  onToggleAdvocate: (id: PersonId) => void;
  selectedCaseId: string | null;
  onOpenCase: (caseId: string) => void;
  onOpenTask: (taskId: string) => void;
  /** The next day with anything listed, when this one is empty. */
  jump: { key: string; label: string; count: number } | null;
  onJump: (key: string) => void;
}) {
  const { now, upcoming, concluded } = board;
  const active = [...(now ? [now] : []), ...upcoming];

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdvocateFilter world={world} selected={advocates} onToggle={onToggleAdvocate} />
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(next) => next && onViewChange(next as BoardView)}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label={pick(advHome.layoutLabel, locale)}
        >
          <ToggleGroupItem value="cards">
            <LayoutGrid aria-hidden="true" />
            {pick(advHome.layoutCards, locale)}
          </ToggleGroupItem>
          <ToggleGroupItem value="list">
            <List aria-hidden="true" />
            {pick(advHome.layoutList, locale)}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {concluded.length ? (
        <ConcludedStrip locale={locale} concluded={concluded} />
      ) : null}

      {/* The sunken fill is the separation — a stroke on top of it would be the
          second thing doing one job. */}
      {active.length === 0 ? (
        <Empty className="bg-surface-sunken">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlidersHorizontal aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {filtered
                ? pick(advHome.emptyFilterTitle, locale)
                : pick(advHome.emptyDayTitle, locale)}
            </EmptyTitle>
            <EmptyDescription>
              {filtered
                ? pick(advHome.emptyFilterBody, locale)
                : pick(advHome.emptyDayBody, locale)}
            </EmptyDescription>
          </EmptyHeader>
          {!filtered && jump ? (
            <Button variant="outline" size="sm" onClick={() => onJump(jump.key)}>
              {fillCopy(advHome.jumpNext, locale, {
                day: jump.label,
                n: String(jump.count),
              })}
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : null}
        </Empty>
      ) : view === "cards" ? (
        <>
          {now ? (
            <NowHearingCard
              world={world}
              locale={locale}
              hearing={now}
              selected={now.kase.id === selectedCaseId}
              onOpenCase={() => onOpenCase(now.kase.id)}
              onOpenTask={onOpenTask}
            />
          ) : null}

          {upcoming.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-caption font-semibold text-muted-foreground">
                {now
                  ? pick(advHome.upNext, locale)
                  : pick(advHome.inListOrder, locale)}
              </h2>
              <ul className="flex flex-col gap-3">
                {upcoming.map((hearing) => (
                  <HearingCard
                    key={hearing.kase.id}
                    world={world}
                    locale={locale}
                    hearing={hearing}
                    selected={hearing.kase.id === selectedCaseId}
                    onOpenCase={() => onOpenCase(hearing.kase.id)}
                    onOpenTask={onOpenTask}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <HearingList
          world={world}
          locale={locale}
          hearings={active}
          selectedId={selectedCaseId}
          onOpenCase={onOpenCase}
        />
      )}
    </div>
  );
}
