"use client";

import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome } from "@/lib/advocate/content";
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

/** One court's stretch of the day, after the advocate switcher has been applied. */
export type CourtSection = {
  court: string;
  /** The court's name with the establishment every court shares removed. */
  label: string;
  /** Matters left in this court once the switcher has had its say. */
  count: number;
  /** An item's listed window covers the clock right now. */
  live: boolean;
  board: Board;
};

/**
 * The anchor a court section answers to. Shared by the section and the jump
 * menu, so the two can never disagree about where a court lives.
 */
export function courtSectionId(court: string): string {
  return `court-${encodeURIComponent(court)}`;
}

/**
 * One court's section of the day's board.
 *
 * The domain nests day ⊃ court ⊃ matter, and the screen now says so: courts are
 * containers stacked down the page, not tabs that show one and hide the rest. A
 * tab band could not accommodate the pilot's own four courts at 1440px, and the
 * fix was never a narrower tab — a scroll that hides a cause list is the defect.
 *
 * Nothing here collapses. A collapsed court can hide a listed matter, and on a
 * §138 board that is the failure mode with the worst consequence: the statutory
 * clocks do not give the day back. The concluded strip may fold, because those
 * matters have already been called.
 */
export function CourtBoard({
  world,
  locale,
  section,
  view,
  selectedCaseId,
  onOpenCase,
  onAct,
}: {
  world: World;
  locale: Locale;
  section: CourtSection;
  view: BoardView;
  selectedCaseId: string | null;
  onOpenCase: (caseId: string) => void;
  onAct: (task: Task) => void;
}) {
  const { court, label, count, live, board } = section;
  const { now, upcoming, concluded } = board;
  const active = [...(now ? [now] : []), ...upcoming];
  const headingId = `${courtSectionId(court)}-heading`;

  return (
    // `scroll-mt-16` clears the 56px top bar when the jump menu lands here.
    <section
      id={courtSectionId(court)}
      aria-labelledby={headingId}
      className="flex scroll-mt-16 flex-col gap-4"
    >
      <header className="flex flex-wrap items-center gap-2">
        {live ? (
          <span aria-hidden="true" className="size-2 rounded-full bg-success" />
        ) : null}
        {/* The heading takes focus from the jump menu, so a keyboard user lands
            on the court rather than at the top of the page. */}
        <h2
          id={headingId}
          tabIndex={-1}
          className="text-title-s font-semibold outline-none"
        >
          {label}
        </h2>
        <span className="text-caption tabular-nums text-muted-foreground">
          {count}
        </span>
        {/* Words, not just the dot — a green disc alone would mean by colour. */}
        {live ? (
          <span className="text-caption font-medium text-success-ink">
            {pick(advHome.inSession, locale)}
          </span>
        ) : null}
      </header>

      {concluded.length ? (
        <ConcludedStrip
          locale={locale}
          concluded={concluded}
          onOpenCase={onOpenCase}
        />
      ) : null}

      {view === "cards" ? (
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

          {/* No "Up next" caption: the court heading above already says what
              this list is, and every card carries its own item number, which is
              the order — cause-list order is never resequenced. */}
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
      ) : active.length ? (
        <HearingList
          world={world}
          locale={locale}
          hearings={active}
          selectedId={selectedCaseId}
          onOpenCase={onOpenCase}
        />
      ) : null}
    </section>
  );
}
