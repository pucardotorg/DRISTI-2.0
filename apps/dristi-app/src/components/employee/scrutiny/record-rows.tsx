"use client";

import * as React from "react";
import { Link2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The grammar a raised item is read in — one label column, one value column, rows only
 * where they apply.
 *
 * It lives here rather than inside the field row because two surfaces render the same
 * item: the record in the workbench, and the summary in the send-back dialog. Those are
 * one data type, so they get one rendering (ui-craft §2) — an officer who has learnt to
 * scan "FSO's value / Filed value / Annotation" down the left edge reads the dialog
 * without learning anything new, however many items it holds.
 *
 * The two columns collapse to one below `22rem` of container width, so a record stays
 * legible when the fields pane is dragged to its floor. `@container` is declared by the
 * caller, on whatever box actually constrains the rows.
 */
export function RecordList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-3 gap-y-2 @[22rem]:grid-cols-[minmax(6rem,8rem)_1fr]",
        className,
      )}
    >
      {children}
    </dl>
  );
}

/** One row: a quiet label, then the fact. */
export function RecordRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="pt-px text-caption text-muted-foreground @[22rem]:pt-0.5">
        {label}
      </dt>
      <dd className="-mt-1 min-w-0 text-body-compact leading-snug @[22rem]:mt-0">
        {children}
      </dd>
    </>
  );
}

/**
 * A fact that is also a way to the related item.
 *
 * `xs` keeps it at the density of the row it sits in; the coarse-pointer floor is what
 * makes that legal on the tablets the registry works on.
 */
export function RecordLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-start underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-10"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
      <Link2Icon className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
