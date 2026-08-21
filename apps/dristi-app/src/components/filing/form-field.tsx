"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FieldLock,
  useCorrection,
  useCorrectionInstance,
} from "@/components/filing/posture";

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

/**
 * Small "i" tooltip beside a label. Keyboard-reachable; the visible label carries meaning.
 * The target is the DS 40px icon button — pulled back with `-my-2` so a label row that
 * carries a tip is still the height of one that doesn't.
 */
export function LabelTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="More about this field"
          className="-my-2 text-muted-foreground"
        >
          <InfoIcon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{children}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Label + control + help text, wired through the DS `Field` so descriptions and errors
 * bind via aria-describedby. `required` adds the asterisk; `optional` adds the muted
 * "optional". Use `asGroup` when the control isn't a single labelled input (segmented,
 * address block).
 *
 * Passing `error` renders `FieldError` and marks the field invalid, which the DS `Input`
 * and `Textarea` read for `aria-invalid`. Other controls need `aria-invalid` themselves —
 * the DS only wires the two that call `useFieldControlProps`.
 */
export function FormField({
  label,
  name,
  required,
  optional,
  tip,
  help,
  helpPlacement = "below",
  error,
  asGroup = false,
  className,
  children,
}: {
  label: React.ReactNode;
  /**
   * The key this field writes on its record ("ifsc", "age"). Only needed so a scrutiny
   * defect can point at it — see `posture.tsx`; it changes nothing in the ordinary flow.
   */
  name?: string;
  required?: boolean;
  optional?: boolean;
  tip?: React.ReactNode;
  help?: React.ReactNode;
  /** Guidance normally follows the control; "above" puts it between label and control. */
  helpPlacement?: "above" | "below";
  /** What is wrong with the current value. Shown under the control, read out with it. */
  error?: React.ReactNode;
  asGroup?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const correction = useCorrection();
  const instance = useCorrectionInstance();
  const defect =
    correction && name ? correction.defectAt(correction.step, instance, name) : null;
  const locked = !!correction && !defect;

  const marker =
    required || optional ? <RequiredMark optional={optional} /> : null;
  const labelBody = (
    <>
      <span>{label}</span>
      {marker}
      {tip ? <LabelTip>{tip}</LabelTip> : null}
    </>
  );

  const field = (
    <Field className={cn("gap-2", className)} data-invalid={error ? true : undefined}>
      {asGroup ? (
        <FieldTitle className="text-body-compact">{labelBody}</FieldTitle>
      ) : (
        <FieldLabel className="text-body-compact">{labelBody}</FieldLabel>
      )}
      {help && helpPlacement === "above" ? <FieldDescription>{help}</FieldDescription> : null}
      {children}
      {help && helpPlacement === "below" ? <FieldDescription>{help}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );

  if (!correction) return field;
  if (defect) return <>{correction.renderFieldDefect(defect, field)}</>;
  return <FieldLock locked={locked}>{field}</FieldLock>;
}
