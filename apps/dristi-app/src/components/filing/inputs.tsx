"use client";

import * as React from "react";

import type { Option } from "@/lib/filing/options";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
      {/*
        The DS default is `item-aligned`, which lays the open list over the trigger — on a
        form card that reads as the menu having eaten the label and the field below it.
        Inside a form a menu belongs under the control it belongs to, at its width.
      */}
      <SelectContent position="popper" align="start" sideOffset={4} className="w-(--radix-select-trigger-width)">
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A field whose list is too long to scan — police stations, a bar register — so it is
 * typed into and filtered rather than scrolled.
 *
 * It stays open: anything typed is kept whether or not the list has it. These registers
 * are never complete, and a form that refuses an address because its station is missing
 * from our copy of the directory is worse than one that takes the person's word for it.
 */
export function ComboField({
  value,
  onChange,
  items,
  onSelect,
  placeholder = "Search or type",
  emptyLabel = "No match — what you typed is kept.",
  renderItem,
  itemKey = (item) => String(item),
  itemLabel = (item) => String(item),
  /**
   * `undefined` (default) leaves Base UI's own matching in place — it checks the typed
   * text against `itemToStringLabel`, which is right for a field with one thing to match
   * on (a police station's name). `null` turns internal matching off entirely: use this
   * when `items` already *is* the matched set, e.g. handed down from an async search that
   * matched on more than the one string this field displays (a name search that has to
   * find rows by registration number too, or the reverse).
   */
  filter,
  disabled,
  ariaLabel,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  items: readonly unknown[];
  /** Fired only when a row is picked, so a screen can fill sibling fields from it. */
  onSelect?: (item: unknown) => void;
  placeholder?: string;
  emptyLabel?: string;
  renderItem?: (item: unknown) => React.ReactNode;
  itemKey?: (item: unknown) => string;
  itemLabel?: (item: unknown) => string;
  filter?: null;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
}) {
  return (
    <Combobox
      items={items as unknown[]}
      itemToStringLabel={(item) => itemLabel(item)}
      filter={filter}
      inputValue={value}
      onInputValueChange={(text) => onChange(text)}
      onValueChange={(item) => {
        if (item == null) return;
        onChange(itemLabel(item));
        onSelect?.(item);
      }}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="w-full"
        autoComplete="off"
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item: unknown) => (
            <ComboboxItem key={itemKey(item)} value={item}>
              {renderItem ? renderItem(item) : itemLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
