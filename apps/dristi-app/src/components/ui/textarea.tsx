"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useFieldControlProps } from "@/components/ui/field"

const PREFILLED_HINT = "Machine filled, not yet verified"

function Textarea({
  className,
  prefilled = false,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<"textarea"> & {
  /** Machine-read, human-unverified value — amber fill + dashed border; never colour alone. */
  prefilled?: boolean
}) {
  const fieldProps = useFieldControlProps({
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  })
  const prefilledId = React.useId()
  const describedBy = [
    fieldProps["aria-describedby"],
    prefilled ? prefilledId : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <span className="contents">
      <textarea
        data-slot="textarea"
        data-prefilled={prefilled || undefined}
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 read-only:bg-muted read-only:text-foreground aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[prefilled=true]:border-dashed data-[prefilled=true]:border-warning-ink data-[prefilled=true]:bg-prefilled dark:data-[prefilled=true]:bg-prefilled",
          className
        )}
        {...props}
        {...fieldProps}
        aria-describedby={describedBy || undefined}
      />
      {prefilled ? (
        <span id={prefilledId} className="sr-only">
          {PREFILLED_HINT}
        </span>
      ) : null}
    </span>
  )
}

export { Textarea }
