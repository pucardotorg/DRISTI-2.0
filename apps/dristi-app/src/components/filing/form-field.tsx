"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** The `*` / "optional" marker after a label. */
export function RequiredMark({ optional }: { optional?: boolean }) {
  if (optional) {
    return <span className="font-normal text-muted-foreground">optional</span>;
  }
  return (
    <>
      <span aria-hidden className="text-destructive">
        *
      </span>
      <span className="sr-only">required</span>
    </>
  );
}

/** Small "i" tooltip beside a label. Keyboard-reachable; the visible label carries meaning. */
export function LabelTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More about this field"
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <InfoIcon className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{children}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Label + control + help text, wired through the DS `Field` so descriptions bind via
 * aria-describedby. `required` adds the asterisk; `optional` adds the muted "optional".
 * Use `asGroup` when the control isn't a single labelled input (segmented, address block).
 */
export function FormField({
  label,
  required,
  optional,
  tip,
  help,
  helpPlacement = "below",
  asGroup = false,
  className,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  tip?: React.ReactNode;
  help?: React.ReactNode;
  /** Guidance normally follows the control; "above" puts it between label and control. */
  helpPlacement?: "above" | "below";
  asGroup?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const marker =
    required || optional ? <RequiredMark optional={optional} /> : null;
  const labelBody = (
    <>
      <span>{label}</span>
      {marker}
      {tip ? <LabelTip>{tip}</LabelTip> : null}
    </>
  );

  return (
    <Field className={cn("gap-2", className)}>
      {asGroup ? (
        <FieldTitle className="text-body-compact">{labelBody}</FieldTitle>
      ) : (
        <FieldLabel className="text-body-compact">{labelBody}</FieldLabel>
      )}
      {help && helpPlacement === "above" ? <FieldDescription>{help}</FieldDescription> : null}
      {children}
      {help && helpPlacement === "below" ? <FieldDescription>{help}</FieldDescription> : null}
    </Field>
  );
}
