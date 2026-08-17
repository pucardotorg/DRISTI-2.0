import * as React from "react";
import Link from "next/link";

import { CASE_TYPE } from "@/lib/filing/options";
import { FILINGS_HOME } from "@/lib/filing/steps";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Breadcrumb every filing screen carries: Dashboard › Case filing under S-138, NI Act. */
export function FilingBreadcrumb({ className }: { className?: string }) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={FILINGS_HOME}>Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            Case filing under{" "}
            <span className="font-medium text-foreground">{CASE_TYPE.short}</span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Title block for a filing screen. `eyebrow` is the small primary label used on the
 * intake step ("Documents"); `actions` sits to the right of the title on wide screens.
 */
export function FilingPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <FilingBreadcrumb />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow ? (
            <p className="text-caption font-medium text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-title font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? (
            <p className="max-w-3xl text-body text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
