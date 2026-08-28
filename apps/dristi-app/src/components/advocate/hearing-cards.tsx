"use client";

import { useState } from "react";
import { ChevronDown, CircleCheck, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { holdersOf, teamOf, type HomeHearing } from "@/lib/advocate/home";
import type { Task } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import { verbFor } from "@/lib/tasks/permissions";
import { cn } from "@/lib/utils";
import {
  AdvocateStack,
  HomeTaskRow,
  ItemChip,
  RowAction,
  vakalatnamaLine,
} from "@/components/advocate/home-bits";

function timeOf(at: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(at));
}

/**
 * The hearing currently being called — one per court, cards view only. Joining
 * the courtroom is not here: the whole court is live, not this item, so that
 * action sits in the board toolbar where its scope reads correctly.
 */
export function NowHearingCard({
  world,
  locale,
  hearing,
  selected,
  onOpenCase,
  onAct,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  selected: boolean;
  onOpenCase: () => void;
  onAct: (task: Task) => void;
}) {
  const holders = holdersOf(world, hearing.kase);
  // Quiet on the ordinary case — one holder, and it is you. Said out loud the
  // moment it is worth knowing: someone else holds it, or you hold it jointly.
  const holderLine =
    holders.length > 1 || !holders.some((h) => h.you)
      ? vakalatnamaLine(locale, holders)
      : null;
  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-caption font-semibold text-success-ink">
        <span aria-hidden="true" className="size-2 rounded-full bg-success" />
        {fillCopy(advHome.nowLabel, locale, { n: String(hearing.item) })}
      </p>
      <Card
        className={cn(
          "relative cursor-pointer gap-5 overflow-visible rounded-3xl border-transparent bg-brand-muted p-6 shadow-raised",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="relative flex flex-wrap items-start gap-4">
          <ItemChip item={hearing.item} size="lg" onBrand />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-title font-semibold text-balance">
              <button
                type="button"
                onClick={onOpenCase}
                className="text-left after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
              >
                {hearing.kase.parties}
              </button>
            </h2>
            <p className="text-body text-brand-muted-foreground">
              {hearing.kase.stage}
            </p>
            {/* On a tinted fill the caption takes that fill's own ink pair,
                never the neutral grey — size carries the step down. */}
            <p className="text-caption text-brand-muted-foreground">
              <span className="font-mono">{hearing.kase.cnr}</span> ·{" "}
              {hearing.kase.stNumber} · {timeOf(hearing.at)}
            </p>
            {/* Said positively, and by name: on a matter three advocates share,
                who may act is more useful than what this viewer cannot do. */}
            {holderLine ? (
              <p className="text-caption text-brand-muted-foreground">{holderLine}</p>
            ) : null}
          </div>
          {/* The day's one live matter is not a row in a list — its action is
              stated outright rather than waiting for a pointer. */}
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <AdvocateStack
              locale={locale}
              team={teamOf(world, hearing.kase)}
              onBrand
              ring="ring-brand-muted"
            />
            <Button variant="outline" size="sm" onClick={onOpenCase}>
              {pick(advHome.viewCase, locale)}
            </Button>
          </div>
        </div>

        {hearing.blockers.length ? (
          <div className="relative z-10 flex flex-col gap-1.5 rounded-md bg-card p-1.5">
            {hearing.blockers.map((task) => (
              <HomeTaskRow
                key={task.id}
                task={task}
                now={world.now}
                action={verbFor(world.user, task, hearing.kase)}
                onOpen={() => onAct(task)}
                className="rounded-sm"
              />
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}

/** An upcoming item in the day's cause list — a quiet, near-white card. */
export function HearingCard({
  world,
  locale,
  hearing,
  selected,
  viewOnly,
  onOpenCase,
  onAct,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  selected: boolean;
  /** The user is not on this case's vakalatnama — watching, not acting. */
  viewOnly?: boolean;
  onOpenCase: () => void;
  onAct: (task: Task) => void;
}) {
  const blocker = hearing.blockers[0];
  return (
    <li>
      <Card
        className={cn(
          "relative cursor-pointer gap-3 overflow-visible rounded-2xl p-4 transition-shadow hover:shadow-raised",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="group/row relative flex flex-wrap items-center gap-x-4 gap-y-2">
          <ItemChip item={hearing.item} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 className="text-body font-semibold text-balance">
              <button
                type="button"
                onClick={onOpenCase}
                className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
              >
                {hearing.kase.parties}
              </button>
            </h3>
            <p className="text-body-compact text-muted-foreground">
              {hearing.kase.stage} ·{" "}
              <span className="font-mono">{hearing.kase.cnr}</span>
            </p>
          </div>
          {viewOnly ? (
            <Badge variant="secondary">
              <Eye aria-hidden="true" />
              {pick(advHome.viewOnly, locale)}
            </Badge>
          ) : hearing.ready ? (
            <Badge variant="success">
              <CircleCheck aria-hidden="true" />
              {pick(advHome.ready, locale)}
            </Badge>
          ) : null}
          {/* Everyone on the matter, not just whoever signed first. */}
          <AdvocateStack locale={locale} team={teamOf(world, hearing.kase)} />
          <RowAction
            label={pick(advHome.viewCase, locale)}
            onClick={onOpenCase}
            className="relative z-10"
          />
        </div>

        {blocker ? (
          <div className="relative z-10 rounded-md bg-surface-sunken">
            <HomeTaskRow
              task={blocker}
              now={world.now}
              action={verbFor(world.user, blocker, hearing.kase)}
              onOpen={() => onAct(blocker)}
              className="rounded-md"
            />
          </div>
        ) : null}
      </Card>
    </li>
  );
}

/**
 * Items whose listed window has passed, collapsed behind one strip. The world
 * records no outcome for them yet, so the row recalls the listed time and stage
 * rather than inventing a result.
 */
export function ConcludedStrip({
  locale,
  concluded,
  onOpenCase,
}: {
  locale: Locale;
  concluded: HomeHearing[];
  onOpenCase: (caseId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col">
      <div className="relative">
        {/* The stack illusion — a second card's rounded top edge peeking out
            behind the strip — is the *closed* state's promise. Opened, the pile
            lies flat: the peek goes, and the strip becomes the flat sheet's
            header row. */}
        {open ? null : (
          <span
            aria-hidden="true"
            className="absolute inset-x-4 -top-2 h-4 rounded-t-xl bg-surface-sunken"
          />
        )}
        <CollapsibleTrigger
          className={cn(
            "group/concluded relative flex w-full items-center gap-2.5 bg-surface-sunken px-4 py-3 text-muted-foreground transition-colors hover:bg-accent",
            open ? "rounded-t-xl" : "rounded-xl"
          )}
        >
          <CircleCheck aria-hidden="true" className="size-4" />
          <span className="flex-1 text-left text-body-compact">
            {fillCopy(advHome.concludedStrip, locale, {
              n: String(concluded.length),
              items: concluded.map((h) => h.item).join(", "),
            })}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-data-open/concluded:rotate-180"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <ul className="flex flex-col divide-y divide-hairline rounded-b-xl bg-surface-sunken">
          {concluded.map((h) => (
            <li
              key={h.kase.id}
              className="group/row relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-accent has-focus-visible:bg-accent"
            >
              <span className="w-12 shrink-0 font-mono text-caption text-muted-foreground">
                item {h.item}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onOpenCase(h.kase.id)}
                  className="text-left text-body-compact font-medium after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {h.kase.parties}
                </button>
                <span className="text-caption text-muted-foreground">
                  {h.kase.cnr || h.kase.stNumber}
                </span>
              </span>
              <RowAction
                label={pick(advHome.viewCase, locale)}
                onClick={() => onOpenCase(h.kase.id)}
                className="relative z-10"
                rest={
                  <span className="text-caption tabular-nums text-muted-foreground">
                    {timeOf(h.at)}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
