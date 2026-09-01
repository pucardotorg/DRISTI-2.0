"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { formatCourtDay, isoDay, TODAYS_HEARING_COUNT } from "@/lib/employee/hearings";
import { ASYNC_DUE_TOTAL } from "@/lib/employee/todays-actions";
import { TODAYS_SCHEDULE, type ScheduleBlock } from "@/lib/employee/todays-schedule";

/**
 * Today's schedule — the bench's whole day as one plan.
 *
 * The primary court-side view: conducting the day's hearings first, then the paper-only
 * actions one by one, each block with the time slot allotted to it and the count of
 * what it holds. A block is a button into where that work happens — the cause list for
 * hearings, one queue of today's actions for the rest — so the schedule is how the day
 * is entered, not a report beside it.
 *
 * Same furniture as the other court screens: the title stands on the page, the date
 * line says which day this is (the reader's day, read the way `HearingsScreen` reads
 * it), and one lifted panel holds the plan. The slot leads each row on wide screens the
 * way a calendar reads; on a phone it tucks under the block's name rather than forcing
 * a column through 375px.
 */

const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

export function TodaysScheduleScreen() {
  const today = React.useSyncExternalStore(NEVER_CHANGES, readToday, readToday);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Today&rsquo;s schedule
        </h1>
        <p className="text-body text-muted-foreground tabular-nums">
          Today, {formatCourtDay(today)} · {TODAYS_HEARING_COUNT} hearings listed ·{" "}
          {ASYNC_DUE_TOTAL} actions due
        </p>
      </header>

      {/* One panel, one unit of work: the day, in the order it runs. */}
      <section
        aria-label="Today's schedule"
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-card shadow-raised p-6"
      >
        <ItemGroup className="gap-3">
          {TODAYS_SCHEDULE.map((block) => (
            <ScheduleBlockButton key={block.id} block={block} />
          ))}
        </ItemGroup>
      </section>
    </div>
  );
}

/**
 * One block of the day: its slot, its name, and how much it holds — the count set a
 * size up so the day triages at a glance, the same treatment every count button on the
 * court side gets. The DS `Item` carries the hover and focus treatment; the chevron
 * says the work lives one click in.
 */
function ScheduleBlockButton({ block }: { block: ScheduleBlock }) {
  return (
    <Item asChild variant="muted" className="px-4 py-3">
      <Link href={block.href}>
        {/* The slot column is the calendar's spine, so it leads the row and the times
            align down the page. Below `sm` it moves under the name instead. */}
        <span className="w-36 shrink-0 text-body-compact tabular-nums text-muted-foreground max-sm:hidden">
          {block.slot}
        </span>
        <ItemContent>
          <ItemTitle className="text-body font-medium">{block.label}</ItemTitle>
          <ItemDescription className="text-caption tabular-nums sm:hidden">
            {block.slot}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-title-s font-semibold tabular-nums">
              {block.count}
            </span>
            <span className="text-caption text-muted-foreground">{block.unit}</span>
          </span>
          <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
        </ItemActions>
      </Link>
    </Item>
  );
}
