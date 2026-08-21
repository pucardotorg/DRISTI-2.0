"use client";

import * as React from "react";

import type { YesNo } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLockedDisabled } from "@/components/filing/posture";

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
  disabled = false,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel?: string;
  /** The answer is settled by another answer — shown, not hidden, so the person sees why. */
  disabled?: boolean;
  className?: string;
}) {
  const isDisabled = useLockedDisabled(disabled);
  return (
    <div className="flex">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onValueChange(v as T);
        }}
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={cn(
          "h-10 w-fit gap-0.5 rounded-lg bg-track p-0.5",
          className,
        )}
      >
        {options.map((o) => (
          /*
           * Selected reads as a raised chip on the track, which is the DS's own treatment
           * for "selected on a track": `Tabs` puts `bg-track` on its list and gives the
           * active trigger `data-active:bg-background` plus a shadow. `Toggle`'s
           * `accent-strong` is the right fill for a toggle on a page, but on this track it
           * measures 1.08:1 — an invisible selection. See docs/design/ds-requests.md #11.
           */
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            className="h-9 min-w-16 rounded-md px-4 text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-raised"
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
  disabled = false,
}: {
  value: YesNo;
  onValueChange: (value: YesNo) => void;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Segmented
      value={value}
      onValueChange={onValueChange}
      options={YES_NO}
      ariaLabel={ariaLabel}
      disabled={disabled}
    />
  );
}
