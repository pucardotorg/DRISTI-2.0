import * as React from "react"

import { cn } from "@/lib/utils"

function DescriptionList({
  className,
  ...props
}: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="description-list"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function DescriptionRow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="description-row"
      className={cn(
        "grid grid-cols-[minmax(7rem,10rem)_1fr] items-start gap-4 border-b border-border py-3 last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function DescriptionTerm({
  className,
  ...props
}: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-term"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DescriptionDetails({
  className,
  ...props
}: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-details"
      className={cn("text-sm text-foreground", className)}
      {...props}
    />
  )
}

export {
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
  DescriptionDetails,
}
