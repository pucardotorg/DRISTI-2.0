"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { formatCourtDay, isoDay } from "@/lib/employee/hearings";
import {
  ASYNC_DUE_TOTAL,
  ASYNC_SECTIONS,
  type AsyncSection,
} from "@/lib/employee/todays-actions";

/**
 * Today's actions — the bench's paper-only work for the day, as a hub.
 *
 * Same furniture as the day's hearings, because it is the same kind of screen at the
 * same moment: the title stands on the page, the date line says which day this is (the
 * reader's day, read the way `HearingsScreen` reads it), and one lifted panel holds the
 * work. The panel is deliberately not the lists themselves (the owner's call,
 * 2026-09-01): it is one button per queue — register cases, take cognizance, review
 * applications — with the count of actions due as the loudest thing on the row, and the
 * specific cases live one click in, on the queue's own screen. The count is what the
 * bench triages by, so the count is what the button leads with.
 *
 * Every number here is `items.length` of the list behind it, and the rail's total is
 * their sum (`ASYNC_DUE_TOTAL`) — no two surfaces can disagree.
 */

const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

export function TodaysActionsScreen() {
  const today = React.useSyncExternalStore(NEVER_CHANGES, readToday, readToday);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Today&rsquo;s actions
        </h1>
        <p className="text-body text-muted-foreground tabular-nums">
          Today, {formatCourtDay(today)} ·{" "}
          {ASYNC_DUE_TOTAL === 1 ? "1 action due" : `${ASYNC_DUE_TOTAL} actions due`}
        </p>
      </header>

      {/* One panel, one unit of work: the day's queues share the lifted sheet the other
          court screens use. */}
      <section
        aria-label="Today's tasks"
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-card shadow-raised p-6"
      >
        <h2 className="text-body font-semibold">Today&rsquo;s tasks</h2>

        <ItemGroup className="gap-3">
          {ASYNC_SECTIONS.map((section) => (
            <ActionQueueButton key={section.id} section={section} />
          ))}
        </ItemGroup>
      </section>
    </div>
  );
}

/**
 * One queue, as a button: its name, and — the row's whole point — how many actions are
 * due, set a size up so the day triages at a glance. The DS `Item` carries the hover
 * and focus treatment; the chevron says the specifics live one click in.
 */
function ActionQueueButton({ section }: { section: AsyncSection }) {
  const due = section.items.length;
  return (
    <Item asChild variant="muted" className="px-4 py-3">
      <Link href={`/employee/todays-actions/${section.id}`}>
        <ItemContent>
          <ItemTitle className="text-body font-medium">{section.label}</ItemTitle>
        </ItemContent>
        <ItemActions className="gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-title-s font-semibold tabular-nums">{due}</span>
            <span className="text-caption text-muted-foreground">due</span>
          </span>
          <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
        </ItemActions>
      </Link>
    </Item>
  );
}
