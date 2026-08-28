"use client";

import { ArrowRight, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { holdsVakalatnama, type Board } from "@/lib/advocate/home";
import type { PersonId, Task } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import {
  ConcludedStrip,
  HearingCard,
  NowHearingCard,
} from "@/components/advocate/hearing-cards";
import { HearingList } from "@/components/advocate/hearing-list";

export type BoardView = "cards" | "list";

/**
 * One court's stretch of the day, after the advocate switcher has been applied.
 *
 * A court is a *place with actions*, not just a grouping: each has its own full
 * day cause list and its own virtual courtroom. That is why the board shows one
 * court at a time behind a tab rather than stacking them — the per-court toolbar
 * has a single subject, the selected court, to act on.
 */
export type CourtSection = {
  court: string;
  /** The court's name with the establishment every court shares removed. */
  label: string;
  /** Matters left in this court once the switcher has had its say. */
  count: number;
  /** An item's listed window covers the clock right now. */
  live: boolean;
  /**
   * The court has a virtual courtroom to join. Defaults on for every court for
   * now — whether physical courts (CJM/JMFC) have one, or only the 24×7 ON Court
   * does, is a product question (brief §16.6 Q11), and this flag is where that
   * answer lands without a redesign.
   */
  hasVirtualRoom: boolean;
  board: Board;
};

/**
 * Everything below the court tabs for the selected court on the selected day.
 *
 * The board is deliberately spare chrome: the layout choice and the advocate
 * switcher are page state and live on the toolbar above it, where their scope is
 * legible; the per-court actions ("View cause list", "Join this courtroom") live
 * there too, because they operate on whichever court is selected. What is left
 * here is the day itself — concluded, now, and what is still to be called.
 */
export function CourtBoard({
  world,
  locale,
  section,
  view,
  selectedCaseId,
  active,
  userId,
  whoseName,
  jump,
  onOpenCase,
  onAct,
  onJump,
  onShowYours,
}: {
  world: World;
  locale: Locale;
  section: CourtSection;
  view: BoardView;
  selectedCaseId: string | null;
  /** The advocate the board is being seen through. */
  active: PersonId;
  /** The signed-in account — the switcher's default. */
  userId: PersonId;
  /** The name behind `active`, for the colleague-empty message. */
  whoseName: string;
  /** The next day with anything listed, when this one is empty. */
  jump: { key: string; label: string; count: number } | null;
  onOpenCase: (caseId: string) => void;
  onAct: (task: Task) => void;
  /** Move the whole board to another day — the empty state's jump-ahead. */
  onJump: (key: string) => void;
  /** Reset the switcher to the signed-in advocate from a colleague-empty state. */
  onShowYours: () => void;
}) {
  const { now, upcoming, concluded } = section.board;
  const activeList = [...(now ? [now] : []), ...upcoming];
  const mine = active === userId;

  return (
    <div className="flex flex-col gap-4 pt-4 pb-8">
      {concluded.length ? (
        <ConcludedStrip
          locale={locale}
          concluded={concluded}
          onOpenCase={onOpenCase}
        />
      ) : null}

      {activeList.length === 0 ? (
        // The sunken fill is the separation — a stroke on top of it would be the
        // second thing doing one job.
        <Empty className="bg-surface-sunken">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlidersHorizontal aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {mine
                ? pick(advHome.emptyDayTitle, locale)
                : fillCopy(advHome.emptyAdvocateTitle, locale, {
                    name: whoseName,
                  })}
            </EmptyTitle>
            <EmptyDescription>
              {mine
                ? pick(advHome.emptyDayBody, locale)
                : fillCopy(advHome.emptyAdvocateBody, locale, {
                    name: whoseName,
                  })}
            </EmptyDescription>
          </EmptyHeader>
          {mine ? (
            jump ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onJump(jump.key)}
              >
                {fillCopy(advHome.jumpNext, locale, {
                  day: jump.label,
                  n: String(jump.count),
                })}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : null
          ) : (
            <Button variant="outline" size="sm" onClick={onShowYours}>
              {pick(advHome.showYourMatters, locale)}
            </Button>
          )}
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

          {/* No "Up next" caption: the tab above names the court and every card
              carries its own item number, which is the order — cause-list order
              is never resequenced. */}
          {upcoming.length ? (
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
          ) : null}
        </>
      ) : (
        <HearingList
          world={world}
          locale={locale}
          hearings={activeList}
          selectedId={selectedCaseId}
          onOpenCase={onOpenCase}
        />
      )}
    </div>
  );
}
