"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { CARD_LABELS, DUE_LABELS, type DueFilter, type Filters } from "@/lib/tasks/selectors";
import type { Person } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DUES: DueFilter[] = ["any", "overdue", "today", "week", "before-hearing"];

/** Radix Select reserves "" for the placeholder, so "all" stands in for it. */
const ALL = "all";

/**
 * One labelled filter: the label sits above the control below `md` and inline to its
 * left from `md`. Labels are visible — nothing here is placeholder-only.
 */
function Filter({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <Label htmlFor={id} className="w-auto text-body-compact font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/**
 * The labelled filter row: the pressed card echoed as a removable pill, then Due ·
 * Court · Advocate. Nothing is hidden in a sheet; an applied filter is visible in its
 * own control. Search lives in the top bar, over every tab. "Clear filters" appears
 * only when something narrows the view.
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
  const triggerClass = "w-full md:w-auto md:min-w-40";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      {filters.kind ? (
        // The pressed card, echoed where the other narrowing values live — with its
        // own clear affordance (32px visible, expanded to the 40px touch floor).
        <span className="inline-flex h-10 items-center gap-1 self-start rounded-full border border-hairline bg-surface-sunken pl-4 pr-1 text-body-compact font-medium md:self-auto">
          {CARD_LABELS[filters.kind]}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Clear the ${CARD_LABELS[filters.kind]} filter`}
            onClick={() => onChange({ kind: null })}
            className="relative rounded-full after:absolute after:-inset-1"
          >
            <XIcon aria-hidden />
          </Button>
        </span>
      ) : null}

      <Filter id="filter-due" label="Due">
        <Select value={filters.due} onValueChange={(v) => onChange({ due: v as DueFilter })}>
          <SelectTrigger id="filter-due" className={triggerClass} aria-label="Due">
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
      </Filter>

      <Filter id="filter-court" label="Court">
        <Select value={filters.court || ALL} onValueChange={(v) => onChange({ court: v === ALL ? "" : v })}>
          <SelectTrigger id="filter-court" className={triggerClass} aria-label="Court">
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
      </Filter>

      <Filter id="filter-advocate" label="Advocate">
        <Select value={filters.advocate || ALL} onValueChange={(v) => onChange({ advocate: v === ALL ? "" : v })}>
          <SelectTrigger id="filter-advocate" className={triggerClass} aria-label="Advocate on the case">
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
      </Filter>

      {narrowed ? (
        <Button variant="ghost" onClick={onClear} className="self-start md:self-auto">
          <XIcon data-icon="inline-start" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
