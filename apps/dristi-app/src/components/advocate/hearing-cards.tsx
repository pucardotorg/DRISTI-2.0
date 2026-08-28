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
import { teamOf, type HomeHearing } from "@/lib/advocate/home";
import type { Task } from "@/lib/tasks/types";
import type { World } from "@/lib/tasks/selectors";
import { verbFor } from "@/lib/tasks/permissions";
import { cn } from "@/lib/utils";
import {
  AdvocateStack,
  HomeTaskRow,
  ItemChip,
  RowAction,
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
  return (
    <section className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-caption font-semibold text-success-ink">
        <span aria-hidden="true" className="size-2 rounded-full bg-success" />
        {fillCopy(advHome.nowLabel, locale, {
          n: String(hearing.item),
          at: timeOf(hearing.at),
        })}
      </p>
      <Card
        className={cn(
          "relative cursor-pointer gap-5 overflow-visible rounded-3xl border-transparent bg-brand-muted px-8 py-6 shadow-raised",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="relative flex flex-wrap items-start gap-4">
          <ItemChip item={hearing.item} size="lg" onTint />
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
            {/* Parties and posting, and nothing else: the numbers and the
                vakalatnama sentence were a wall of dimmed type on a tinted card.
                The number is one click away in the peek; who holds the
                vakalatnama is in the avatars beside it, by name, on hover. */}
            <p className="text-body text-brand-muted-foreground">
              {hearing.kase.stage}
            </p>
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
            {/* A white well full of sentences does not announce itself as a list
                of things owed. The heading says what it is. */}
            <h3 className="px-4 pt-2 text-caption font-semibold text-muted-foreground">
              {pick(advHome.blockersHeading, locale)}
            </h3>
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

/**
 * An upcoming item in the day's cause list — a quiet beige card. The queue
 * recedes on the sunken fill so the one brand-tinted "now" card is the view's
 * sole focal surface; fill is the separation, so the border goes. Hover
 * deepens the fill a step — a sunken surface darkens, it does not lift.
 */
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
          "relative cursor-pointer gap-3 overflow-visible rounded-2xl border-transparent bg-surface-sunken p-4 transition-colors hover:bg-accent-strong has-focus-visible:bg-accent-strong",
          selected && "ring-2 ring-brand-accent"
        )}
      >
        <div className="group/row relative flex flex-wrap items-center gap-x-4 gap-y-2">
          <ItemChip item={hearing.item} onTint />
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
          {/* The cell holds the listed time at rest, so reserving room for the
              button costs nothing and the row gains the fact it was missing. */}
          <RowAction
            label={pick(advHome.viewCase, locale)}
            onClick={onOpenCase}
            className="relative z-10"
            rest={
              <span className="text-body-compact tabular-nums text-muted-foreground">
                {timeOf(hearing.at)}
              </span>
            }
          />
        </div>

        {blocker ? (
          // A white well on the beige card, as on the brand-tinted hero — the
          // sunken fill would vanish into a card that is itself sunken.
          <div className="relative z-10 rounded-md bg-card">
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
              <span className="w-16 shrink-0 font-mono text-caption whitespace-nowrap text-muted-foreground">
                {fillCopy(advHome.itemN, locale, { n: String(h.item) })}
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
