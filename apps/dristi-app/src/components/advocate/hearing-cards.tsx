"use client";

import { ChevronDown, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import type { HomeHearing } from "@/lib/advocate/home";
import type { World } from "@/lib/tasks/selectors";
import { personOf } from "@/lib/tasks/selectors";
import { mainAdvocateOf } from "@/lib/tasks/permissions";
import { verbFor } from "@/lib/tasks/permissions";
import { cn } from "@/lib/utils";
import { HomeTaskRow, ItemChip, TeamAvatar } from "@/components/advocate/home-bits";

function timeOf(at: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(at));
}

function MainAvatar({
  world,
  hearing,
  onBrand,
}: {
  world: World;
  hearing: HomeHearing;
  onBrand?: boolean;
}) {
  const main = personOf(world, mainAdvocateOf(hearing.kase));
  if (!main) return null;
  const userId = typeof world.user === "string" ? world.user : world.user.id;
  return <TeamAvatar person={main} you={main.id === userId} onBrand={onBrand} />;
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
  onOpenTask,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  selected: boolean;
  onOpenCase: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-caption font-semibold text-success-ink">
        <span aria-hidden="true" className="size-2 rounded-full bg-success" />
        {fillCopy(advHome.nowLabel, locale, { n: String(hearing.item) })}
      </p>
      <Card
        className={cn(
          "relative gap-5 overflow-visible rounded-3xl border-transparent bg-brand-muted p-6 shadow-raised",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="flex flex-wrap items-start gap-4">
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
          </div>
          <MainAvatar world={world} hearing={hearing} onBrand />
        </div>

        {hearing.blockers.length ? (
          <div className="relative z-10 flex flex-col gap-1.5 rounded-md bg-card p-1.5">
            {hearing.blockers.map((task) => (
              <HomeTaskRow
                key={task.id}
                task={task}
                now={world.now}
                action={verbFor(world.user, task, hearing.kase)}
                onOpen={() => onOpenTask(task.id)}
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
  onOpenCase,
  onOpenTask,
}: {
  world: World;
  locale: Locale;
  hearing: HomeHearing;
  selected: boolean;
  onOpenCase: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const blocker = hearing.blockers[0];
  return (
    <li>
      <Card
        className={cn(
          "relative gap-3 overflow-visible rounded-2xl p-4 transition-shadow hover:shadow-raised",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
          {hearing.ready ? (
            <Badge variant="success">
              <CircleCheck aria-hidden="true" />
              {pick(advHome.ready, locale)}
            </Badge>
          ) : null}
          <MainAvatar world={world} hearing={hearing} />
        </div>

        {blocker ? (
          <div className="relative z-10 rounded-md bg-surface-sunken">
            <HomeTaskRow
              task={blocker}
              now={world.now}
              action={verbFor(world.user, blocker, hearing.kase)}
              onOpen={() => onOpenTask(blocker.id)}
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
}: {
  locale: Locale;
  concluded: HomeHearing[];
}) {
  return (
    <Collapsible className="flex flex-col gap-2">
      {/* The stack illusion: a second card's rounded top edge peeking out behind
          the strip, saying "there are more of these underneath". */}
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-x-4 -top-2 h-4 rounded-t-xl bg-surface-sunken"
        />
        <CollapsibleTrigger className="group/concluded relative flex w-full items-center gap-2.5 rounded-xl bg-surface-sunken px-4 py-3 text-muted-foreground transition-colors hover:bg-accent">
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
        <ul className="flex flex-col gap-2">
          {concluded.map((h) => (
            <li
              key={h.kase.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-surface-sunken px-4 py-3"
            >
              <span className="w-12 shrink-0 font-mono text-caption text-muted-foreground">
                item {h.item}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-compact font-medium">
                  {h.kase.parties}
                </span>
                <span className="text-caption text-muted-foreground">
                  {h.kase.cnr || h.kase.stNumber}
                </span>
              </span>
              <span className="text-caption tabular-nums text-muted-foreground">
                {timeOf(h.at)}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
