import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type VerticalStepperItem = {
  title: React.ReactNode;
  description?: React.ReactNode;
};

/**
 * Vertical active-flow variant of the DS Stepper. The library only ships a horizontal
 * orientation; Timeline is intentionally not reused because it represents dated case
 * history, not work the person is completing now.
 */
export function VerticalStepper({
  items,
  current,
  className,
  ariaLabel = "Progress",
}: {
  items: VerticalStepperItem[];
  current: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn("flex w-full flex-col", className)}
    >
      {items.map((item, index) => {
        const status = index < current ? "complete" : index === current ? "current" : "upcoming";

        return (
          <li
            key={index}
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
            className="group/vertical-stepper relative flex gap-3 pb-7 last:pb-0"
          >
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                  status === "complete" && "border-primary bg-primary text-primary-foreground",
                  status === "current" && "border-primary bg-brand-muted text-brand-muted-foreground ring-4 ring-brand-muted",
                  status === "upcoming" && "border-input bg-background text-muted-foreground",
                )}
              >
                {status === "complete" ? (
                  <CheckIcon className="size-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 bottom-0 w-px group-last/vertical-stepper:hidden",
                  status === "complete" ? "bg-primary" : "bg-border",
                )}
              />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={cn(
                  "text-body-compact font-medium",
                  status === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {item.title}
              </p>
              {item.description ? (
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
