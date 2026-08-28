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
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { holdsVakalatnama, type Board } from "@/lib/advocate/home";
import type { Task } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import {
  ConcludedStrip,
  HearingCard,
  NowHearingCard,
} from "@/components/advocate/hearing-cards";
import { HearingList } from "@/components/advocate/hearing-list";

export type BoardView = "cards" | "list";

/**
 * Access, not people: several advocates can hold the vakalatnama on one case,
 * and others hold view access shared from the case file. The cut that matters
 * to "what can I do today" is which of the two the viewer holds per matter.
 */
export type AccessFilter = "all" | "mine" | "shared";

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
  access,
  onAccessChange,
  accessCounts,
  view,
  onViewChange,
  selectedCaseId,
  onOpenCase,
  onAct,
  jump,
  onJump,
}: {
  world: World;
  locale: Locale;
  board: Board;
  /** All matters, only vakalatnama matters, or only view-access matters. */
  access: AccessFilter;
  onAccessChange: (access: AccessFilter) => void;
  /** Selected-day totals per access mode — the control names its counts. */
  accessCounts: Record<AccessFilter, number>;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  selectedCaseId: string | null;
  onOpenCase: (caseId: string) => void;
  onAct: (task: Task) => void;
  /** The next day with anything listed, when this one is empty. */
  jump: { key: string; label: string; count: number } | null;
  onJump: (key: string) => void;
}) {
  const { now, upcoming, concluded } = board;
  const active = [...(now ? [now] : []), ...upcoming];
  const filtered = access === "mine";

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <ConcludedStrip locale={locale} concluded={concluded} onOpenCase={onOpenCase} />
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
              {access === "mine"
                ? pick(advHome.emptyMineTitle, locale)
                : access === "shared"
                  ? pick(advHome.emptySharedTitle, locale)
                  : pick(advHome.emptyDayTitle, locale)}
            </EmptyTitle>
            <EmptyDescription>
              {access === "mine"
                ? pick(advHome.emptyMineBody, locale)
                : access === "shared"
                  ? pick(advHome.emptySharedBody, locale)
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
              viewOnly={!holdsVakalatnama(world, now.kase)}
              onOpenCase={() => onOpenCase(now.kase.id)}
              onAct={onAct}
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
                    viewOnly={!holdsVakalatnama(world, hearing.kase)}
                    onOpenCase={() => onOpenCase(hearing.kase.id)}
                    onAct={onAct}
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
