"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import type { TeamMember } from "@/lib/advocate/home";
import type { Person, Task } from "@/lib/tasks/types";
import { dueCueOf } from "@/lib/tasks/format";
import { cn } from "@/lib/utils";

/**
 * Shared atoms of the advocate home: the team avatars, the cause-list item chip,
 * the row's hover action, and the task row that repeats inside hearing cards, the
 * case peek and the rail.
 */

/** Initials chip for someone on a case. Brand tint marks the signed-in user. */
export function TeamAvatar({
  person,
  you,
  onBrand,
  label,
  ring,
  className,
}: {
  person: Person;
  /** This is the signed-in account — the one brand-tinted avatar per row. */
  you?: boolean;
  /** Sitting on the brand-tinted now card, where the sunken fill has no depth. */
  onBrand?: boolean;
  /** What the tooltip says; defaults to the person's name. */
  label?: string;
  /** Ring in the surface behind, so overlapping discs stay separate. */
  ring?: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
            you
              ? "bg-brand-muted text-brand-muted-foreground"
              : onBrand
                ? "bg-card text-foreground"
                : "bg-surface-sunken text-foreground",
            ring && `ring-2 ${ring}`,
            className
          )}
        >
          {person.initials}
          <span className="sr-only">{person.name}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label ?? (you ? `${person.name} (you)` : person.name)}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Everyone on the matter, as overlapping discs — a case is rarely one advocate's,
 * and a single avatar told the row a lie about that. Vakalatnama holders come
 * first (the signed-in account first among them), then the advocates with case
 * access; the tooltip on each says which of the two they are. Past `max` the
 * remainder collapses into a count that names them.
 */
export function AdvocateStack({
  locale,
  team,
  max = 3,
  onBrand,
  ring = "ring-card",
}: {
  locale: Locale;
  team: TeamMember[];
  max?: number;
  onBrand?: boolean;
  /** The surface behind the stack — the discs ring in it to stay separate. */
  ring?: string;
}) {
  if (team.length === 0) return null;
  const shown = team.slice(0, max);
  const rest = team.slice(max);

  return (
    // Overlapped by 4px, not 8: two-letter initials sit dead centre, so any
    // deeper overlap covers the very thing the disc exists to say.
    <span className="flex shrink-0 items-center pl-1">
      {shown.map((member) => (
        <TeamAvatar
          key={member.person.id}
          person={member.person}
          you={member.you}
          onBrand={onBrand}
          ring={ring}
          className="-ml-1"
          label={fillCopy(
            member.acts ? advHome.teamHoldsVakalatnama : advHome.teamCaseAccess,
            locale,
            { name: member.you ? `${member.person.name} (you)` : member.person.name }
          )}
        />
      ))}
      {rest.length ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "-ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-medium tabular-nums ring-2",
                onBrand
                  ? "bg-card text-muted-foreground"
                  : "bg-surface-sunken text-muted-foreground",
                ring
              )}
            >
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {rest.map((m) => m.person.name).join(", ")}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

/**
 * Who may act on this matter, said positively. "View only" tells an advocate what
 * they cannot do; this tells them whom to ask — the more useful half of the same
 * fact when three people share a case.
 */
export function vakalatnamaLine(locale: Locale, holders: TeamMember[]): string | null {
  if (holders.length === 0) return null;
  const you = holders.find((h) => h.you);
  const others = holders.filter((h) => !h.you).map((h) => h.person.name);
  if (you && others.length === 0) return pick(advHome.vakalatnamaYouAlone, locale);
  if (you)
    return fillCopy(advHome.vakalatnamaYouWith, locale, { names: others.join(", ") });
  return fillCopy(advHome.vakalatnamaThem, locale, { names: others.join(", ") });
}

/**
 * The one hover affordance every repeated row on this screen shares.
 *
 * The button itself holds the cell open — invisible and inert at rest, with a
 * chevron sitting in its place — so revealing it moves nothing and masks nothing.
 * (The earlier version floated the button over the row on an opaque patch; on a
 * card with content beside it, that read as a button stranded in mid-air.) It is
 * `aria-hidden` on purpose: it repeats the row title's own action, which is the
 * accessible path and the thing focus reveals it from.
 */
export function RowAction({
  label,
  onClick,
  rest,
  className,
}: {
  label: string;
  onClick: () => void;
  /** What stands in the cell at rest — a chevron unless the row has better to say. */
  rest?: ReactNode;
  className?: string;
}) {
  return (
    // Both states occupy the same grid cell, so the cell is as wide as the wider
    // of them and nothing reflows when they trade places.
    <span className={cn("grid shrink-0 items-center justify-items-end", className)}>
      <span className="col-start-1 row-start-1 flex items-center transition-opacity group-hover/row:opacity-0 group-focus-within/row:opacity-0">
        {rest ?? (
          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
        )}
      </span>
      <Button
        variant="outline"
        size="xs"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClick}
        className="col-start-1 row-start-1 pointer-events-none opacity-0 transition-opacity group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
      >
        {label}
      </Button>
    </span>
  );
}

/**
 * The listed item number. A plain card tile on the brand-tinted hero, a sunken
 * well elsewhere — the fill change is the depth, so neither variant carries a
 * shadow inside its already-lifted card.
 */
export function ItemChip({
  item,
  size = "default",
  onBrand,
}: {
  item: number;
  size?: "default" | "lg";
  onBrand?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-md",
        onBrand ? "bg-card" : "bg-surface-sunken",
        size === "lg" ? "size-12" : "size-11"
      )}
    >
      {size === "lg" ? (
        <>
          <span className="text-caption text-muted-foreground">item</span>
          <span className="text-title-s font-semibold tabular-nums">{item}</span>
        </>
      ) : (
        <span className="text-body font-medium tabular-nums">{item}</span>
      )}
    </span>
  );
}

/**
 * The due wording a task row carries — words in ink, never a solid badge: these
 * rows repeat, and a red chip on each would spend the screen's whole
 * destructive budget before the rail count is read.
 */
export function DueCue({
  children,
  overdue,
}: {
  children: ReactNode;
  overdue?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-caption tabular-nums",
        overdue ? "font-medium text-destructive-ink" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

/**
 * One pending task inside a hearing card. Nothing appears or disappears on
 * hover — the due cue and the row's one bordered action are both always there
 * (a repeated row carries at most one visible bordered action, and this is it),
 * so the row never changes shape under the pointer.
 */
export function HomeTaskRow({
  task,
  now,
  sub,
  action,
  onOpen,
  className,
}: {
  task: Task;
  now: Date | string | number;
  /** Optional second line — e.g. the matter, where the card does not already say it. */
  sub?: string;
  /** The task's own verb — "Pay", "Sign", "Open". */
  action: string;
  onOpen: () => void;
  className?: string;
}) {
  const due = dueCueOf(task, new Date(now));
  return (
    <div
      className={cn(
        "group/task relative flex min-h-16 items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-accent has-focus-visible:bg-accent",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={onOpen}
          className="text-left text-body-compact font-medium after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {task.title}
        </button>
        {sub ? (
          <span className="text-caption text-muted-foreground">{sub}</span>
        ) : null}
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-3">
        <DueCue overdue={due.overdue}>{due.primary}</DueCue>
        <Button variant="outline" size="xs" onClick={onOpen}>
          {action}
        </Button>
      </div>
    </div>
  );
}
