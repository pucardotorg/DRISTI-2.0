"use client";

import { ChevronDownIcon, FilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  allBucketsLabel,
  bucketKeysFor,
  normalizeStageFilter,
} from "@/lib/cases/query";
import { bucketLabel, type BucketKey, type CasesView } from "@/lib/cases/types";

/**
 * Excel-style AutoFilter on the Stage column: one or more values, or all.
 * Options follow the current view (stages, outcomes, or both). The column
 * header owns the "Stage" label so the header can be dragged to reorder;
 * this control is the filter only.
 */
export function CasesStageColumnFilter({
  view,
  value,
  onChange,
}: {
  view: CasesView;
  value: BucketKey[];
  onChange: (stage: BucketKey[]) => void;
}) {
  const options = bucketKeysFor(view);
  const filtered = value.length > 0;
  const selected = new Set(value);

  function toggle(key: BucketKey, checked: boolean) {
    const next = new Set(value);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(normalizeStageFilter(view, options.filter((option) => next.has(option))));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          draggable={false}
          className={
            filtered ? "text-foreground" : "text-muted-foreground"
          }
          aria-label={
            value.length === 0
              ? "Filter by stage"
              : value.length === 1
                ? `Stage, ${bucketLabel(value[0])}. Change filter`
                : `Stage, ${value.map(bucketLabel).join(", ")}. Change filter`
          }
        >
          {filtered ? (
            <FilterIcon aria-hidden />
          ) : (
            <ChevronDownIcon aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-max">
        <StageOption
          label={allBucketsLabel(view)}
          checked={filtered ? "indeterminate" : true}
          onCheckedChange={(checked) => {
            if (checked) onChange([]);
          }}
        />
        {options.map((key) => (
          <StageOption
            key={key}
            label={bucketLabel(key)}
            checked={selected.has(key)}
            onCheckedChange={(checked) => toggle(key, checked)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Menu item is the control (menuitemcheckbox). The DS Checkbox is the
 * visible box — filled primary when on — not the trailing check the
 * primitive paints on the right.
 */
function StageOption({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(event) => event.preventDefault()}
      className="pr-1.5 text-body focus:[&_[data-slot=checkbox]]:text-primary-foreground [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden"
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none [&_svg]:text-primary-foreground"
      />
      {label}
    </DropdownMenuCheckboxItem>
  );
}
