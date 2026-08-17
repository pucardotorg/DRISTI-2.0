"use client";

import * as React from "react";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const NOTICE_ROLE = {
  none: undefined,
  polite: "status",
  assertive: "alert",
} as const;

/**
 * Standing notice at the top of a section (info, warning or success). `onDismiss` adds a
 * close control; the dismissal itself is remembered on the draft by the caller.
 *
 * The DS `Alert` hardcodes `role="alert"`, which makes a screen reader interrupt on every
 * mount — right for something that has just gone wrong, wrong for guidance that was
 * always on the page. So `announce` defaults to none; raise it only when the notice
 * appears in response to what the user just did.
 */
export function SectionNotice({
  title,
  children,
  variant = "info",
  announce = "none",
  onDismiss,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  variant?: "info" | "warning" | "success";
  /** "polite" for a result the user is waiting for; "assertive" only for real errors. */
  announce?: "none" | "polite" | "assertive";
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon =
    variant === "warning"
      ? TriangleAlertIcon
      : variant === "success"
        ? CircleCheckIcon
        : InfoIcon;
  const ink =
    variant === "warning"
      ? "text-warning-ink"
      : variant === "success"
        ? "text-success-ink"
        : "text-info-ink";
  // Status is carried by the glyph and the words (the DS "ink on neutral" treatment);
  // the notice itself stays a quiet white panel rather than a colour block.
  return (
    <Alert
      role={NOTICE_ROLE[announce]}
      className={cn(
        "border-hairline py-3 pl-3 shadow-raised",
        onDismiss && "pr-12",
        className
      )}
    >
      <Icon aria-hidden className={ink} />
      {title ? <AlertTitle className="text-foreground">{title}</AlertTitle> : null}
      <AlertDescription className="text-muted-foreground">{children}</AlertDescription>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-1 top-1 text-muted-foreground"
        >
          <XIcon aria-hidden />
        </Button>
      ) : null}
    </Alert>
  );
}

/** Tinted well used for helper actions ("Fetch details" beside a mobile number). */
export function InfoWell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-lg bg-surface-sunken p-4 text-body-compact text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
