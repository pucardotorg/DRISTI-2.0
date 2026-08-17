"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FileTextIcon, LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const documentSlotVariants = cva(
  "flex w-full items-start gap-4 rounded-lg border p-4",
  {
    variants: {
      status: {
        filled: "border-transparent bg-surface-sunken",
        processing: "border-transparent bg-surface-sunken",
        empty: "border-dashed border-input bg-transparent",
        "empty-optional": "border-dashed border-input bg-transparent",
        "filled-poor": "border-transparent bg-surface-sunken",
      },
      media: {
        thumbnail: "",
        icon: "",
      },
    },
    defaultVariants: {
      status: "empty",
      media: "icon",
    },
  }
)

function DocumentSlot({
  className,
  status = "empty",
  media = "icon",
  label,
  required = false,
  optional = false,
  filename,
  meta,
  quality,
  thumbnail,
  onChooseFile,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof documentSlotVariants> & {
    label: React.ReactNode
    required?: boolean
    optional?: boolean
    filename?: string
    meta?: string
    quality?: "good" | "poor"
    thumbnail?: React.ReactNode
    onChooseFile?: () => void
  }) {
  const isEmpty = status === "empty" || status === "empty-optional"
  const showOptional = optional || status === "empty-optional"
  const qualityTone =
    quality === "poor" || status === "filled-poor" ? "poor" : quality

  return (
    <div
      data-slot="document-slot"
      data-status={status}
      data-media={media}
      className={cn(documentSlotVariants({ status, media }), className)}
      {...props}
    >
      <div
        data-slot="document-slot-media"
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground",
          media === "thumbnail" ? "size-16" : "size-10"
        )}
      >
        {status === "processing" ? (
          <LoaderCircleIcon className="size-5 animate-spin" aria-hidden />
        ) : thumbnail && !isEmpty ? (
          thumbnail
        ) : (
          <FileTextIcon className="size-5" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {required && isEmpty ? (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          ) : null}
          {showOptional ? (
            <Badge variant="secondary">Optional</Badge>
          ) : null}
        </div>
        {(filename || meta) && !isEmpty ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {[filename, meta].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {isEmpty ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            No file chosen yet
          </p>
        ) : null}
        {qualityTone === "good" ? (
          <Badge variant="success" className="mt-2">
            Good scan
          </Badge>
        ) : null}
        {qualityTone === "poor" ? (
          <Badge variant="warning" className="mt-2">
            Poor scan
          </Badge>
        ) : null}
      </div>

      {isEmpty ? (
        <Button type="button" variant="outline" size="sm" onClick={onChooseFile}>
          Choose file
        </Button>
      ) : null}
    </div>
  )
}

export { DocumentSlot, documentSlotVariants }
