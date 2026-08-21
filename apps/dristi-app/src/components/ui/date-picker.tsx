"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarDaysIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  value?: Date
  defaultValue?: Date
  onValueChange?: (value: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

type DateRangePickerProps = {
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (value: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(
    defaultValue
  )
  const selected = value === undefined ? internalValue : value

  function handleSelect(nextValue: Date | undefined) {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-60 justify-start gap-2 text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarDaysIcon data-icon="inline-start" aria-hidden />
          <span className="truncate">
            {selected ? format(selected, "PPP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  )
}

function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date range",
  disabled,
  className,
}: DateRangePickerProps) {
  const [internalValue, setInternalValue] = React.useState<
    DateRange | undefined
  >(defaultValue)
  const selected = value === undefined ? internalValue : value

  function handleSelect(nextValue: DateRange | undefined) {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  const label = selected?.from
    ? selected.to
      ? `${format(selected.from, "MMM d, yyyy")} – ${format(selected.to, "MMM d, yyyy")}`
      : format(selected.from, "PPP")
    : placeholder

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-60 justify-start gap-2 text-left font-normal",
            !selected?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarDaysIcon data-icon="inline-start" aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
export type { DatePickerProps, DateRangePickerProps }
