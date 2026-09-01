"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { causeTitle, formatCourtDay, isoDay } from "@/lib/employee/hearings";
import { useCourtNavLayout } from "@/lib/employee/nav-layout";
import { type AsyncAction, type AsyncSection } from "@/lib/employee/todays-actions";

/**
 * One queue of today's actions, opened from the hub — the specific cases or
 * applications behind a button's count.
 *
 * The screen the hub's button promised: the queue's name stands as the title, the date
 * line carries the same day and the same count the button showed, and the way back is
 * the first thing on the page. The rows report; acting on one — registering, taking
 * cognizance, deciding an application — is a judicial act and this build performs
 * none, so the caption below the list says so plainly.
 */

const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

export function TodaysActionsQueueScreen({ section }: { section: AsyncSection }) {
  const today = React.useSyncExternalStore(NEVER_CHANGES, readToday, readToday);
  const [layout] = useCourtNavLayout();
  const due = section.items.length;

  /* The way back follows how the reader got here: the combined layout enters queues
     from the day's schedule, the split layout from the Today's actions hub. */
  const back =
    layout === "split"
      ? { href: "/employee/todays-actions", label: "Back to today’s actions" }
      : { href: "/employee/todays-schedule", label: "Back to today’s schedule" };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="ghost"
          size="xs"
          className="self-start text-muted-foreground"
        >
          <Link href={back.href}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden />
            {back.label}
          </Link>
        </Button>
        <header className="flex flex-col gap-2">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {section.label}
          </h1>
          <p className="text-body text-muted-foreground tabular-nums">
            Today, {formatCourtDay(today)} ·{" "}
            {due === 1 ? "1 action due" : `${due} actions due`}
          </p>
        </header>
      </div>

      <section
        aria-label={`${section.label} — actions due`}
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-card shadow-raised p-6"
      >
        <ul className="flex flex-col gap-3">
          {section.items.map((item) => (
            <AsyncActionRow key={item.id} item={item} />
          ))}
        </ul>
        <p className="text-caption text-muted-foreground">
          Acting on an item is not part of this build.
        </p>
      </section>
    </div>
  );
}

/**
 * One action due: the cause, its number, and — for an application — what was filed.
 * A sunken row inside the panel, the way the schedule queue stacks its matters below
 * `md`; the cause title is the row's one emphasized thing.
 */
function AsyncActionRow({ item }: { item: AsyncAction }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg bg-surface-sunken px-4 py-3">
      <p className="min-w-0 text-body-compact font-medium">{causeTitle(item)}</p>
      <p className="text-caption text-muted-foreground">
        <span className="tabular-nums">{item.caseNumber}</span>
        {item.kind ? <> · {item.kind}</> : null}
      </p>
    </li>
  );
}
