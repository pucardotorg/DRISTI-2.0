"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success-muted)",
          "--success-text": "var(--success-muted-foreground)",
          "--success-border": "var(--success-muted)",
          "--warning-bg": "var(--warning-muted)",
          "--warning-text": "var(--warning-muted-foreground)",
          "--warning-border": "var(--warning-muted)",
          "--info-bg": "var(--info-muted)",
          "--info-text": "var(--info-muted-foreground)",
          "--info-border": "var(--info-muted)",
          "--error-bg": "var(--destructive-muted)",
          "--error-text": "var(--destructive-muted-foreground)",
          "--error-border": "var(--destructive-muted)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
