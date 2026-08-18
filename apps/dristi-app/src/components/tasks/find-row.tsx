"use client";

import * as React from "react";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import type { GroupKey, Lens, SortKey } from "@/lib/tasks/selectors";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_LABELS: Record<SortKey, string> = {
  urgency: "Urgency",
  due: "Due date",
  case: "Case",
  recent: "Recently added",
};

const GROUP_LABELS: Record<GroupKey, string> = {
  band: "Urgency band",
  case: "Case",
  kind: "Kind",
  person: "Person",
};

/**
 * The find row: type-to-filter search (`/` focuses it), Sort, Group, and the Filters
 * button that opens the sheet. No submit button and no always-open filter card — the
 * same stance as the Cases screen.
 */
export function FindRow({
  lens,
  onChange,
  activeFilterCount,
  onOpenFilters,
}: {
  lens: Lens;
  onChange: (patch: Partial<Lens>) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState(lens.q);
  const [seen, setSeen] = React.useState(lens.q);

  // The URL is the source of truth; local state keeps typing smooth and is debounced
  // into the lens. When the URL changes underneath (Clear all, back button), adopt it.
  if (lens.q !== seen) {
    setSeen(lens.q);
    setQ(lens.q);
  }
  React.useEffect(() => {
    if (q === lens.q) return;
    const t = window.setTimeout(() => onChange({ q }), 150);
    return () => window.clearTimeout(t);
  }, [q, lens.q, onChange]);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.closest("input, textarea, select, [contenteditable=true]"))) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Inside a Field so the DS Input keeps its `id` (it drops it outside one) and the
          label binds. */}
      <Field className="min-w-64 flex-1 basis-72 gap-0">
        <FieldLabel htmlFor="task-search" className="sr-only">
          Search tasks
        </FieldLabel>
        <InputGroup className="max-w-xl">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id="task-search"
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks, parties, ST number, CNR"
            autoComplete="off"
            enterKeyHint="search"
          />
          <InputGroupAddon align="inline-end">
            {q ? (
              <InputGroupButton
                aria-label="Clear search"
                onClick={() => {
                  setQ("");
                  onChange({ q: "" });
                  inputRef.current?.focus();
                }}
              >
                <XIcon aria-hidden />
              </InputGroupButton>
            ) : (
              <Kbd className="hidden sm:inline-flex" aria-hidden>
                /
              </Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          {/* A fixed label column below `sm`, where the two selects stack and should align. */}
          <Label htmlFor="task-sort" className="w-12 shrink-0 text-caption text-muted-foreground sm:w-auto">
            Sort
          </Label>
          <Select value={lens.sort} onValueChange={(v) => onChange({ sort: v as SortKey })}>
            <SelectTrigger id="task-sort" className="w-40" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="task-group" className="w-12 shrink-0 text-caption text-muted-foreground sm:w-auto">
            Group
          </Label>
          <Select value={lens.group} onValueChange={(v) => onChange({ group: v as GroupKey })}>
            <SelectTrigger id="task-group" className="w-40" aria-label="Group by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(GROUP_LABELS) as GroupKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {GROUP_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={onOpenFilters} aria-haspopup="dialog">
          <SlidersHorizontalIcon data-icon="inline-start" aria-hidden />
          Filters
          {activeFilterCount ? (
            <span className="text-caption tabular-nums text-muted-foreground">{activeFilterCount}</span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
