"use client";

import { SlidersHorizontalIcon, XIcon } from "lucide-react";

import { AppliedChip } from "@/components/shell/applied-chip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
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
import {
  CASE_STATUSES,
  CASE_TYPES,
  advocateOptions,
  clearedFilters,
  countAppliedFilters,
  isNarrowed,
  stageGroupLabel,
  stageOptionsFor,
  type CaseStatus,
  type CasesQuery,
} from "@/lib/cases/query";
import { bucketLabel, type BucketKey, type CaseRecord } from "@/lib/cases/types";

type FilterPatch = Partial<
  Pick<CasesQuery, "status" | "bookmarked" | "type" | "stage" | "advocates" | "search" | "filed">
>;

function toggleIn<T>(list: readonly T[], value: T, on: boolean): T[] {
  if (on) return list.includes(value) ? [...list] : [...list, value];
  return list.filter((entry) => entry !== value);
}

/**
 * One group of tick-boxes in the sheet. A `fieldset` with its legend, rows at the
 * 40px floor, the whole row a label so the words are the target too. Counts sit
 * after the label in muted `tabular-nums` where the group has them — same
 * presentation for every option, never a badge on one and text on the next.
 */
function CheckGroup<T extends string>({
  id,
  legend,
  options,
  value,
  onChange,
}: {
  id: string;
  legend: string;
  options: { value: T; label: string; count?: number }[];
  value: readonly T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <FieldSet className="gap-1">
      <FieldLegend variant="label" className="mb-1 text-body-compact text-muted-foreground">
        {legend}
      </FieldLegend>
      <ul className="flex flex-col">
        {options.map((option) => {
          const checkboxId = `${id}-${option.value}`;
          return (
            <li key={option.value}>
              <Label
                htmlFor={checkboxId}
                className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-body font-normal hover:bg-accent"
              >
                <Checkbox
                  id={checkboxId}
                  checked={value.includes(option.value)}
                  onCheckedChange={(checked) =>
                    onChange(toggleIn(value, option.value, checked === true))
                  }
                />
                <span className="min-w-0 flex-1">{option.label}</span>
                {option.count !== undefined ? (
                  <span className="text-body-compact text-muted-foreground tabular-nums">
                    {option.count}
                  </span>
                ) : null}
              </Label>
            </li>
          );
        })}
      </ul>
    </FieldSet>
  );
}

/**
 * The Filters button and its sheet. Every filter applies as it is ticked — the
 * list behind the sheet is the preview — and the button carries the count of what
 * is on. The four groups are the four questions people were answering with tabs
 * and a column menu before: which status, which case type, which stage, whose.
 */
export function CasesFiltersButton({
  query,
  cases,
  totals,
  onChange,
}: {
  query: CasesQuery;
  cases: CaseRecord[];
  totals: Record<CaseStatus | "bookmarked", number>;
  onChange: (patch: FilterPatch) => void;
}) {
  const applied = countAppliedFilters(query);
  const stages = stageOptionsFor(query);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="shrink-0"
          aria-label={`Filters${applied ? `, ${applied} applied` : ""}`}
        >
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
            Tick any number. The list behind this updates as you go.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <CheckGroup
            id="cases-filter-status"
            legend="Status"
            options={CASE_STATUSES.map((status) => ({
              ...status,
              count: totals[status.value],
            }))}
            value={query.status}
            onChange={(status) => onChange({ status })}
          />
          <CheckGroup
            id="cases-filter-type"
            legend="Case type"
            options={CASE_TYPES}
            value={query.type}
            onChange={(type) => onChange({ type })}
          />
          <CheckGroup<BucketKey>
            id="cases-filter-stage"
            legend={stageGroupLabel(query)}
            options={stages}
            value={query.stage}
            onChange={(stage) => onChange({ stage })}
          />
          <CheckGroup
            id="cases-filter-advocate"
            legend="Advocates on the case"
            options={advocateOptions(cases).map((name) => ({ value: name, label: name }))}
            value={query.advocates}
            onChange={(advocates) => onChange({ advocates })}
          />
        </div>

        <SheetFooter className="flex-row items-center justify-between border-t border-hairline">
          {applied ? (
            <Button
              variant="ghost"
              onClick={() => onChange({ status: [], type: [], stage: [], advocates: [] })}
            >
              Clear filters
            </Button>
          ) : (
            <span />
          )}
          <SheetClose asChild>
            <Button>Show cases</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * What is applied, always out on the card — the sheet hides controls, never state.
 * A filter you cannot see is a short list you cannot explain. Search is not a chip:
 * it sits in its own box on the same card.
 */
export function CasesAppliedFilters({
  query,
  onChange,
}: {
  query: CasesQuery;
  onChange: (patch: FilterPatch) => void;
}) {
  if (!isNarrowed(query)) return null;
  const chips: { key: string; label: string; clear: () => void }[] = [];

  if (query.bookmarked) {
    chips.push({
      key: "bookmarked",
      label: "Bookmarked",
      clear: () => onChange({ bookmarked: false }),
    });
  }
  for (const status of query.status) {
    chips.push({
      key: `status-${status}`,
      label: CASE_STATUSES.find((entry) => entry.value === status)?.label ?? status,
      clear: () => onChange({ status: query.status.filter((entry) => entry !== status) }),
    });
  }
  for (const type of query.type) {
    chips.push({
      key: `type-${type}`,
      label: CASE_TYPES.find((entry) => entry.value === type)?.label ?? type,
      clear: () => onChange({ type: query.type.filter((entry) => entry !== type) }),
    });
  }
  for (const stage of query.stage) {
    chips.push({
      key: `stage-${stage}`,
      label: bucketLabel(stage),
      clear: () => onChange({ stage: query.stage.filter((entry) => entry !== stage) }),
    });
  }
  for (const name of query.advocates) {
    chips.push({
      key: `adv-${name}`,
      label: name,
      clear: () =>
        onChange({ advocates: query.advocates.filter((entry) => entry !== name) }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
      {chips.map((chip) => (
        <AppliedChip key={chip.key} label={chip.label} onClear={chip.clear} />
      ))}
      <Button
        variant="ghost"
        onClick={() => onChange(clearedFilters())}
        className="text-muted-foreground"
      >
        <XIcon data-icon="inline-start" aria-hidden />
        Clear all
      </Button>
    </div>
  );
}
