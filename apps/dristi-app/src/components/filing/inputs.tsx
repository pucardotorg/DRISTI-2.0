"use client";

import * as React from "react";

import type { Option } from "@/lib/filing/options";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Text input that may carry a machine-read value. When `prefilled`, the DS amber fill
 * shows and clicking the field opens its source (`onViewSource`) — typing still edits.
 */
export function TextField({
  value,
  onChange,
  prefilled = false,
  onViewSource,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "prefilled"> & {
  value: string;
  onChange: (value: string) => void;
  prefilled?: boolean;
  onViewSource?: () => void;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      prefilled={prefilled}
      onClick={prefilled && onViewSource ? onViewSource : undefined}
      className={cn(prefilled && onViewSource && "cursor-pointer", className)}
      {...props}
    />
  );
}

/** Input with a fixed prefix — "+91" for mobiles, "₹" for amounts. */
export function PrefixInput({
  prefix,
  value,
  onChange,
  prefilled = false,
  onViewSource,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "prefix"> & {
  prefix: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  prefilled?: boolean;
  onViewSource?: () => void;
}) {
  return (
    <InputGroup
      className={cn(
        prefilled && "border-dashed border-warning-ink bg-prefilled",
        className
      )}
    >
      <InputGroupAddon>
        <InputGroupText>{prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={prefilled && onViewSource ? onViewSource : undefined}
        aria-description={prefilled ? "Machine filled, not yet verified" : undefined}
        className={cn(prefilled && onViewSource && "cursor-pointer")}
        {...props}
      />
    </InputGroup>
  );
}

/**
 * Select over an `Option[]` with a placeholder row. `prefilled` applies the amber fill;
 * `onViewSource` opens the source panel from the trigger's pointer-down (the menu still opens).
 */
export function OptionSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  prefilled = false,
  onViewSource,
  disabled,
  ariaLabel,
  className,
  id,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[] | string[];
  placeholder?: string;
  prefilled?: boolean;
  onViewSource?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  id?: string;
}) {
  const opts: Option[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        onPointerDown={prefilled && onViewSource ? onViewSource : undefined}
        className={cn(
          "w-full",
          prefilled && "border-dashed border-warning-ink bg-prefilled",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
