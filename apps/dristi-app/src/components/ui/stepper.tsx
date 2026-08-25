import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Stepper({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="stepper"
      className={cn("flex w-full items-start", className)}
      {...props}
    />
  )
}

const stepperItemVariants = cva(
  "group/stepper-item relative flex min-w-0 flex-1 flex-col items-start gap-2",
  {
    variants: {
      status: {
        complete: "",
        current: "",
        upcoming: "",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  }
)

const stepperIndicatorVariants = cva(
  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
  {
    variants: {
      status: {
        complete: "border-primary bg-primary text-primary-foreground",
        current:
          "border-primary bg-brand-muted text-brand-muted-foreground ring-4 ring-brand-muted",
        upcoming: "border-input bg-background text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  }
)

function StepperItem({
  className,
  status = "upcoming",
  step,
  title,
  children,
  onActivate,
  activateLabel,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof stepperItemVariants> & {
    step?: number | string
    title?: React.ReactNode
    /**
     * Makes the step navigable — the indicator and title become a button that jumps
     * back to it. Leave unset for a static progress marker. Set it only on steps the
     * user may actually return to; a flow that cannot go back should not offer it.
     */
    onActivate?: () => void
    /** Accessible name for the navigable control; falls back to the title text. */
    activateLabel?: string
  }) {
  const indicator =
    status === "complete" ? <CheckIcon className="size-4" aria-hidden /> : step
  const label = activateLabel ?? (typeof title === "string" ? title : undefined)
  return (
    <li
      data-slot="stepper-item"
      data-status={status}
      className={cn(stepperItemVariants({ status }), className)}
      {...props}
    >
      <div className="flex w-full items-center">
        {onActivate ? (
          <button
            type="button"
            data-slot="stepper-indicator"
            onClick={onActivate}
            aria-label={label}
            className={cn(
              stepperIndicatorVariants({ status }),
              "cursor-pointer outline-none transition-[box-shadow,background-color] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:brightness-110"
            )}
          >
            {indicator}
          </button>
        ) : (
          <div
            data-slot="stepper-indicator"
            className={cn(stepperIndicatorVariants({ status }))}
          >
            {indicator}
          </div>
        )}
        <div
          aria-hidden
          data-slot="stepper-connector"
          className={cn(
            "mx-2 h-px min-w-4 flex-1 group-last/stepper-item:hidden",
            status === "complete" ? "bg-primary" : "bg-border"
          )}
        />
      </div>
      {title || children ? (
        <div className="pr-4">
          {title ? (
            onActivate ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={onActivate}
                className={cn(
                  "cursor-pointer text-sm font-medium outline-none",
                  status === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {title}
              </button>
            ) : (
              <p
                className={cn(
                  "text-sm font-medium",
                  status === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {title}
              </p>
            )
          ) : null}
          {children}
        </div>
      ) : null}
    </li>
  )
}

export { Stepper, StepperItem }
