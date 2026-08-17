import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  MegaphoneIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const bannerVariants = cva(
  "relative flex min-h-11 w-full items-center gap-2.5 border-s-3 px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-info bg-info-muted text-info-muted-foreground",
        warning:
          "border-warning bg-warning-muted text-warning-muted-foreground",
        success:
          "border-success bg-success-muted text-success-muted-foreground",
        error:
          "border-destructive bg-destructive-muted text-destructive-muted-foreground",
        neutral: "border-input bg-surface-sunken text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const bannerIcons = {
  info: InfoIcon,
  warning: CircleAlertIcon,
  success: CircleCheckIcon,
  error: CircleAlertIcon,
  neutral: MegaphoneIcon,
} as const

function Banner({
  className,
  variant = "info",
  children,
  action,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bannerVariants> & {
    action?: React.ReactNode
  }) {
  const Icon = bannerIcons[variant ?? "info"]

  return (
    <div
      data-slot="banner"
      data-variant={variant}
      role="status"
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-snug">{children}</div>
      {action ? (
        <div data-slot="banner-action" className="shrink-0">
          {action}
        </div>
      ) : null}
    </div>
  )
}

export { Banner, bannerVariants }
