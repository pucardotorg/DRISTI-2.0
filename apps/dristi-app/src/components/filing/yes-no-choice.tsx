"use client";

import * as React from "react";

import type { YesNo } from "@/lib/filing/types";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFieldReadOnly, useLockedDisabled } from "@/components/filing/posture";
import { ReadOnlyValue } from "@/components/filing/inputs";

/**
 * Yes / No where no answer has been given yet.
 *
 * A segmented control is a switch: it says one of these two is currently in force, and
 * paints the chosen half. That is right for the questions on this form that start with a
 * real default — the filing is party-in-person or it is not, the amount was deposited or
 * it was not. It is wrong for the optional questions that begin genuinely unanswered,
 * where both halves render unpainted and the control reads as broken rather than empty
 * (owner, Sept 8, on "Differently abled?").
 *
 * Radios say the same thing honestly: two empty circles are visibly two things not yet
 * chosen, and choosing one is one click, same as the switch. Laid out in a row so the
 * field costs the same height it did.
 */
export function YesNoChoice({
  value,
  onValueChange,
  ariaLabel,
  name,
  disabled = false,
}: {
  value: YesNo | "";
  onValueChange: (value: YesNo) => void;
  ariaLabel?: string;
  /** Unique per instance — two of these on one screen must not share input names. */
  name: string;
  disabled?: boolean;
}) {
  const isDisabled = useLockedDisabled(disabled);
  const readOnly = useFieldReadOnly();

  if (readOnly) {
    return (
      <ReadOnlyValue
        value={value === "yes" ? "Yes" : value === "no" ? "No" : ""}
        ariaLabel={ariaLabel}
        className="w-fit min-w-32"
      />
    );
  }

  return (
    <RadioGroup
      value={value || undefined}
      onValueChange={(v) => onValueChange(v as YesNo)}
      aria-label={ariaLabel}
      disabled={isDisabled}
      className="flex h-10 w-fit flex-row items-center gap-6"
    >
      {(["yes", "no"] as const).map((option) => (
        <div key={option} className="flex items-center gap-2">
          <RadioGroupItem id={`${name}-${option}`} value={option} />
          <Label htmlFor={`${name}-${option}`} className="cursor-pointer font-normal">
            {option === "yes" ? "Yes" : "No"}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
