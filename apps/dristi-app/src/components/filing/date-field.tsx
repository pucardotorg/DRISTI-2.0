"use client";

import * as React from "react";
import { CalendarDaysIcon } from "lucide-react";

import { dateToIso, isoToDate, toDisplayDate } from "@/lib/filing/format";
import type { ISODate } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

/**
 * Date control bound to an ISO string. Uses the DS DatePicker to pick; when the value was
 * machine-read (`prefilled`), the field shows the amber fill and opens its source document
 * instead — the value is corrected from the source panel, as in the demo.
 */
export function DateField({
  value,
  onChange,
  prefilled = false,
  onViewSource,
  placeholder = "Pick date",
  ariaLabel,
  className,
  id,
}: {
  value: ISODate;
  onChange: (iso: ISODate) => void;
  prefilled?: boolean;
  onViewSource?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  id?: string;
}) {
  if (prefilled && onViewSource) {
    return (
      <Button
        id={id}
        type="button"
        variant="outline"
        onClick={onViewSource}
        aria-label={ariaLabel}
        aria-description="Machine filled, not yet verified. Opens the source document."
        className={cn(
          "w-full justify-start gap-2 border-dashed border-warning-ink bg-prefilled font-normal hover:bg-prefilled",
          className
        )}
      >
        <CalendarDaysIcon data-icon="inline-start" aria-hidden />
        <span className="truncate">{toDisplayDate(value) || placeholder}</span>
      </Button>
    );
  }
  return (
    <DatePicker
      value={isoToDate(value)}
      onValueChange={(d) => onChange(dateToIso(d))}
      placeholder={placeholder}
      className={cn("w-full", className)}
    />
  );
}
