"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * A Pucar-specific compact segmented control for secondary choices such as language
 * and sign-in method.
 *
 * The upstream ToggleGroup `size="sm"` is visually compact but exposes a 28px target,
 * below Pucar's 40px citizen-facing touch floor. This component separates the two:
 * every Radix item remains 40px tall, while the tokenized well is 32px and the selected
 * pill is 26px. The requested 3px inset is derived from the spacing scale, and the inner
 * radius subtracts that same inset from `radius-lg`. That keeps the two curves parallel
 * through the corners instead of letting them converge.
 */
function CompactSegmentedControl({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="compact-segmented-control"
      className={cn(
        "relative flex h-10 w-fit flex-row items-center gap-0 [--compact-segment-inset:calc(var(--spacing)*0.75)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:rounded-lg before:border before:border-border before:bg-surface-sunken",
        className,
      )}
      {...props}
    />
  );
}

function CompactSegmentedControlItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="compact-segmented-control-item"
      className={cn(
        "group/compact-segment relative z-10 inline-flex h-10 min-w-10 shrink-0 items-center justify-center px-0.75 text-body-compact font-medium whitespace-nowrap text-foreground outline-none transition-colors",
        "hover:text-foreground focus-visible:z-20 disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:font-semibold data-[state=on]:text-primary data-[state=on]:hover:text-primary",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none flex h-6.5 min-w-0 items-center justify-center rounded-[calc(var(--radius-lg)-var(--compact-segment-inset))] border border-transparent px-2.5 transition-all",
          "group-hover/compact-segment:bg-accent",
          "group-focus-visible/compact-segment:border-ring group-focus-visible/compact-segment:ring-3 group-focus-visible/compact-segment:ring-ring/50",
          "group-data-[state=on]/compact-segment:bg-background group-data-[state=on]/compact-segment:shadow-raised",
          "group-data-[state=on]/compact-segment:group-hover/compact-segment:bg-background",
          "dark:group-data-[state=on]/compact-segment:bg-accent-strong dark:group-data-[state=on]/compact-segment:group-hover/compact-segment:bg-accent-strong",
        )}
      >
        {children}
      </span>
    </ToggleGroupPrimitive.Item>
  );
}

export { CompactSegmentedControl, CompactSegmentedControlItem };
