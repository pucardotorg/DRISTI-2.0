import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="timeline"
      className={cn("relative flex w-full flex-col", className)}
      {...props}
    />
  )
}

const timelineDotVariants = cva(
  "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full border",
  {
    variants: {
      status: {
        past: "border-muted-foreground bg-muted-foreground",
        current: "border-primary bg-primary ring-4 ring-halo",
        future: "border-input bg-background",
      },
    },
    defaultVariants: {
      status: "future",
    },
  }
)

function TimelineItem({
  className,
  status = "future",
  title,
  description,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof timelineDotVariants> & {
    title?: React.ReactNode
    description?: React.ReactNode
  }) {
  return (
    <li
      data-slot="timeline-item"
      data-status={status}
      className={cn(
        "group/timeline-item relative flex gap-3 pb-6 last:pb-0",
        className
      )}
      {...props}
    >
      <div className="relative flex flex-col items-center">
        <div
          data-slot="timeline-dot"
          className={cn(timelineDotVariants({ status }))}
        />
        <div
          aria-hidden
          data-slot="timeline-rail"
          className="absolute top-4 bottom-0 w-px bg-border group-last/timeline-item:hidden"
        />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {title ? (
          <p
            className={cn(
              "text-sm font-medium",
              status === "future" ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {title}
          </p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    </li>
  )
}

export { Timeline, TimelineItem }
