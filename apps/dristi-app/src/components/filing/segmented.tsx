"use client";

import * as React from "react";

import type { YesNo } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * Single-choice segmented control (Yes / No / Maybe…). Built on the DS ToggleGroup so
 * it has roving focus and pressed state; items are lifted to the 40px control height.
 */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className="flex">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onValueChange(v as T);
        }}
        aria-label={ariaLabel}
        className={cn(
          "h-10 w-fit gap-0.5 rounded-lg bg-track p-0.5",
          className,
        )}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            aria-label={o.label}
            className="h-9 min-w-16 rounded-md px-4 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-raised"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const YES_NO: SegmentedOption<YesNo>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function YesNoSegmented({
  value,
  onValueChange,
  ariaLabel,
}: {
  value: YesNo;
  onValueChange: (value: YesNo) => void;
  ariaLabel?: string;
}) {
  return (
    <Segmented
      value={value}
      onValueChange={onValueChange}
      options={YES_NO}
      ariaLabel={ariaLabel}
    />
  );
}
