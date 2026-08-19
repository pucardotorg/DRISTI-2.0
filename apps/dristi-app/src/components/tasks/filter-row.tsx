"use client";

import * as React from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { DUE_LABELS, type DueFilter, type Filters } from "@/lib/tasks/selectors";
import type { Person } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
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
 * The labelled filter row: Due · Court · Advocate · search. Nothing is hidden in a
 * sheet; an applied filter is visible in its own control, so there are no echo chips.
 * "Clear filters" appears only when something narrows the view. `/` focuses the search.
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
  /** Whether anything (including a pressed card) narrows the view. */
  narrowed: boolean;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const searchRef = React.useRef<HTMLInputElement>(null);
  // Local echo of the query so typing is instant; the URL follows after a short pause.
  const [query, setQuery] = React.useState(filters.query);
  // When the URL changes underneath (Clear filters, back/forward), follow it.
  const [seen, setSeen] = React.useState(filters.query);
  if (seen !== filters.query) {
    setSeen(filters.query);
    setQuery(filters.query);
  }
  React.useEffect(() => {
    if (query === filters.query) return;
    const t = window.setTimeout(() => onChange({ query }), 200);
    return () => window.clearTimeout(t);
  }, [query, filters.query, onChange]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const triggerClass = "w-full md:w-auto md:min-w-40";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
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

      <Filter id="filter-search" label="Search">
        <InputGroup className="md:w-72 lg:w-80">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            id="filter-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a case or task"
            autoComplete="off"
            enterKeyHint="search"
          />
          <InputGroupAddon align="inline-end" className={cn(query && "hidden")}>
            <Kbd aria-hidden>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
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
