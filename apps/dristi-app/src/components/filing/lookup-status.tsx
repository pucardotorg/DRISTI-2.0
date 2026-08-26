"use client";

import * as React from "react";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  success: { ink: "text-success-ink", Icon: CheckIcon },
  warning: { ink: "text-warning-ink", Icon: TriangleAlertIcon },
} as const;

export type LookupTone = keyof typeof TONES;

/**
 * What a live lookup (IFSC, PIN) found, said once under the field it filled.
 *
 * A field description that changes is never announced, so this is a polite live region —
 * and it stays mounted while there is nothing to say, because a region that appears at the
 * same moment as its text is announced unreliably. Status is carried by the ink pair *and*
 * the icon *and* the words, never by colour alone.
 */
export function LookupStatus({
  tone = "success",
  children,
  className,
  id,
}: {
  tone?: LookupTone;
  /** Nothing to report yet — the region stays mounted and silent. */
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const empty = children === null || children === undefined || children === false;
  const { ink, Icon } = TONES[tone];

  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className={cn(
        "text-caption",
        empty ? "sr-only" : cn("flex items-start gap-1", ink),
        className
      )}
    >
      {empty ? null : (
        <>
          <Icon className="size-4 shrink-0" aria-hidden />
          <span>{children}</span>
        </>
      )}
    </p>
  );
}
