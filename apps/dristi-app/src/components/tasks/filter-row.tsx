"use client";

import * as React from "react";
import { ArrowUpDownIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import {
  CARD_LABELS,
  DUE_LABELS,
  SORT_LABELS,
  type DueFilter,
  type Filters,
  type SortKey,
} from "@/lib/tasks/selectors";
import type { Person } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const DUES: DueFilter[] = ["any", "overdue", "today", "week", "before-hearing"];
const SORTS: SortKey[] = ["urgency", "case", "kind"];

/** Radix Select reserves "" for the placeholder, so "all" stands in for it. */
const ALL = "all";

/**
 * One removable chip for an applied filter.
 *
 * A chip is a well: sunken fill, no border (`ui-craft` §4 — depth is fill, not strokes,
 * and a filled box with a stroke is the box-in-box the skill bans). The dismiss target is
 * 32px visible and expanded to the 40px floor with `after:-inset-1`.
 */
function AppliedChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-surface-sunken pl-3.5 pr-1 text-body-compact font-medium text-foreground">
      {label}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Clear the ${label} filter`}
        onClick={onClear}
        className="relative rounded-full text-muted-foreground after:absolute after:-inset-1 hover:text-foreground"
      >
        <XIcon aria-hidden />
      </Button>
    </span>
  );
}

/** A labelled control inside the peek — label above, full-width control below. */
function PeekField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-body-compact font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

/**
 * The task list's one control row: **how it is ordered**, then a way in to the filters,
 * then whatever is currently applied.
 *
 * The rebuild (owner, 2026-08-24 — "the overall UX of this screen is a little fucked"):
 *
 *   · **Sort is surfaced and named honestly.** It was reachable only by clicking a column
 *     header, and its default was labelled *Due* although it has always run
 *     `compareUrgency`. The screen answered "what do I do next" and never said so.
 *     *Most urgent* is now the visible default.
 *   · **The three selects moved into a peek.** Due · Court · Advocate sat on screen at
 *     their defaults on nearly every visit, costing a row of height for controls almost
 *     nobody had touched, and pushing the first task far down the page.
 *   · **What is applied never hides.** The original row was built on the rule that
 *     "nothing is hidden in a sheet; an applied filter is visible in its own control",
 *     and that rule is right — a filter you cannot see is a short list you cannot
 *     explain. So the *controls* fold away and the *state* does not: every active filter
 *     stays out here as a removable chip, and the trigger carries a count.
 */
export function FilterRow({
  filters,
  courts,
  people,
  narrowed,
  onChange,
  onClear,
}: {
  filters: Filters;
  courts: string[];
  people: Person[];
  /** Whether anything (including a pressed card or the search) narrows the view. */
  narrowed: boolean;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  /* What the peek holds — the pressed card and the search live outside it, so they are
     not counted here; each shows its own chip or its own box. */
  const applied = [
    filters.due !== "any",
    filters.court !== "",
    filters.advocate !== "",
  ].filter(Boolean).length;

  const advocateName = people.find((p) => p.id === filters.advocate)?.name;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Order first: it is the thing that decides what the advocate reads at the top. */}
      <div className="flex items-center gap-2">
        <ArrowUpDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <Select value={filters.sort} onValueChange={(v) => onChange({ sort: v as SortKey })}>
          <SelectTrigger id="task-sort" aria-label="Sort tasks" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" aria-label={`Filters${applied ? `, ${applied} applied` : ""}`}>
            <SlidersHorizontalIcon data-icon="inline-start" aria-hidden />
            Filters
            {applied ? (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-medium tabular-nums text-primary-foreground">
                {applied}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-title-s font-semibold">Filters</SheetTitle>
            <SheetDescription className="text-body-compact">
              Narrow the list. Anything you set stays visible on the row behind this.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-4">
            <PeekField id="filter-due" label="Due">
              <Select value={filters.due} onValueChange={(v) => onChange({ due: v as DueFilter })}>
                <SelectTrigger id="filter-due" className="w-full" aria-label="Due">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DUE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PeekField>

            <PeekField id="filter-court" label="Court">
              <Select
                value={filters.court || ALL}
                onValueChange={(v) => onChange({ court: v === ALL ? "" : v })}
              >
                <SelectTrigger id="filter-court" className="w-full" aria-label="Court">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All courts</SelectItem>
                  {courts.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PeekField>

            <PeekField id="filter-advocate" label="Advocate">
              <Select
                value={filters.advocate || ALL}
                onValueChange={(v) => onChange({ advocate: v === ALL ? "" : v })}
              >
                <SelectTrigger
                  id="filter-advocate"
                  className="w-full"
                  aria-label="Advocate on the case"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Anyone on the case</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PeekField>
          </div>

          <SheetFooter>
            {narrowed ? (
              <Button variant="outline" onClick={onClear}>
                Clear all filters
              </Button>
            ) : null}
            <SheetClose asChild>
              <Button>Show the tasks</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Applied state, always out here — the peek hides controls, never what is on. */}
      {filters.kind ? (
        <AppliedChip
          label={CARD_LABELS[filters.kind]}
          onClear={() => onChange({ kind: null })}
        />
      ) : null}
      {filters.due !== "any" ? (
        <AppliedChip label={DUE_LABELS[filters.due]} onClear={() => onChange({ due: "any" })} />
      ) : null}
      {filters.court ? (
        <AppliedChip label={filters.court} onClear={() => onChange({ court: "" })} />
      ) : null}
      {filters.advocate ? (
        <AppliedChip
          label={advocateName ?? "Advocate"}
          onClear={() => onChange({ advocate: "" })}
        />
      ) : null}

      {narrowed ? (
        <Button variant="ghost" onClick={onClear} className={cn("text-muted-foreground")}>
          <XIcon data-icon="inline-start" aria-hidden />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
