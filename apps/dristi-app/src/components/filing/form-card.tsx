import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * How a panel sits on a filing screen: the DS Card lifted by the DS dual-layer
 * `shadow-raised` and edged with `hairline` — the same vocabulary as the owner's demo
 * (card + soft 5% shadow) and the accepted advocate-home build. Apply to every `Card`.
 */
export const PANEL_CLASS = "border-hairline shadow-raised";

/**
 * A grouped block of fields on a filing screen — the DS "grouped content gets a border"
 * recipe. Fields inside stack with `gap-6`; use `FormRow` for two-up fields.
 */
export function FormCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn(PANEL_CLASS, "gap-6", className)}>
      <CardHeader>
        <CardTitle className="text-body font-semibold">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-body-compact">{description}</CardDescription>
        ) : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

/** Two fields side by side from `md` up, stacked below. */
export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 items-start gap-4 md:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** A field that should take half the card width on wide screens. */
export function HalfWidth({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full md:w-1/2 md:pr-2", className)}>{children}</div>;
}

/** Sub-heading inside a card (e.g. "PoA holder details"). */
export function FormSubhead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-body-compact font-medium text-muted-foreground">{children}</p>
  );
}

/** Hairline divider inside a card. */
export function FormDivider() {
  return <div role="separator" className="h-px w-full bg-hairline" />;
}
