"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { pick } from "@/lib/onboarding/content";
import type { WeekCell } from "@/lib/advocate/home";
import { cn } from "@/lib/utils";

/**
 * Greeting and the week strip. The strip is the board's day control: brand tint
 * marks *today*, a chosen other day gets the quiet sunken cue — the two never
 * read alike. Dots under a day: amber for a task consequence, grey for a listed
 * hearing. Dates format through `Intl` in the active locale.
 */

function greetingCopy(hour: number) {
  if (hour < 12) return advHome.greetingMorning;
  if (hour < 17) return advHome.greetingAfternoon;
  return advHome.greetingEvening;
}

function mattersLine(locale: Locale, count: number): string {
  if (count === 0) return pick(advHome.mattersNone, locale);
  if (count === 1) return pick(advHome.mattersOne, locale);
  return fillCopy(advHome.mattersMany, locale, { n: String(count) });
}

function dayNote(cell: WeekCell, locale: Locale): string {
  const parts: string[] = [];
  if (cell.hearings) parts.push(mattersLine(locale, cell.hearings));
  if (cell.due) parts.push(`${cell.due} due`);
  return parts.length ? parts.join(" · ") : pick(advHome.mattersNone, locale);
}

export function HomeGreeting({
  locale,
  firstName,
  now,
  week,
  selectedDay,
  matterCount,
  onSelectDay,
}: {
  locale: Locale;
  firstName: string;
  now: number;
  week: WeekCell[];
  selectedDay: string;
  /** Listed matters on the selected day, across courts. */
  matterCount: number;
  onSelectDay: (key: string) => void;
}) {
  const nowDate = new Date(now);
  const intl = locale === "ml" ? "ml-IN" : "en-IN";
  const todayKey = week.find((c) => c.today)?.key ?? selectedDay;
  const selected = week.find((c) => c.key === selectedDay);
  const dateLine = new Intl.DateTimeFormat(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selected?.at ?? nowDate);
  const weekdayFmt = new Intl.DateTimeFormat(intl, { weekday: "short" });

  return (
    <div className="flex flex-col items-start justify-between gap-6 @3xl:flex-row @3xl:items-center">
      <div className="flex min-w-0 flex-col gap-1">
        {/* Steps down when the board gives up width to the peek or the rail —
            a 32px greeting on a 400px board wraps to three lines. */}
        <h1 className="text-title font-semibold tracking-tight text-balance @3xl:text-title-l">
          {fillCopy(greetingCopy(nowDate.getHours()), locale, { name: firstName })}
        </h1>
        <p className="text-body-compact text-muted-foreground @3xl:text-body">
          {dateLine} · {mattersLine(locale, matterCount)}
        </p>
      </div>

      <div className="flex max-w-full items-center gap-2 overflow-x-auto">
        <Button
          variant="outline"
          size="xs"
          disabled={selectedDay === todayKey}
          onClick={() => onSelectDay(todayKey)}
        >
          {pick(advHome.today, locale)}
        </Button>
        <ul className="flex items-center gap-0.5">
          {week.map((cell) => {
            const isSelected = cell.key === selectedDay;
            return (
              <li key={cell.key}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectDay(cell.key)}
                  className={cn(
                    "flex w-11 flex-col items-center gap-1 rounded-lg py-2 transition-colors",
                    // Brand tint means "today", not "selected" — a chosen day
                    // elsewhere in the week gets a neutral cue instead.
                    cell.today
                      ? "bg-brand-muted text-brand-muted-foreground"
                      : isSelected
                        ? "bg-surface-sunken text-foreground"
                        : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className="text-caption">{weekdayFmt.format(cell.at)}</span>
                  <span
                    className={cn(
                      "text-body tabular-nums",
                      (cell.today || isSelected) && "font-semibold"
                    )}
                  >
                    {cell.at.getDate()}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1 rounded-full",
                      cell.due
                        ? "bg-warning-ink"
                        : cell.hearings
                          ? "bg-muted-foreground"
                          : "bg-transparent"
                    )}
                  />
                  <span className="sr-only">
                    {weekdayFmt.format(cell.at)} {cell.at.getDate()}
                    {cell.today ? ` (${pick(advHome.today, locale)})` : ""} —{" "}
                    {dayNote(cell, locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
