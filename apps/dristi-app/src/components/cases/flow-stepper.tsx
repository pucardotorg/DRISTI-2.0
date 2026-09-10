"use client";

/**
 * The stepper band the Add-people dialogs share, composed the way the
 * onboarding modal composes it: connectors absolutely positioned so each
 * line starts and ends AT a circle's edge (circle radius is 1rem, so the
 * line runs from center+1rem across to the next center-1rem). The witness
 * dialog's earlier variant offset the line by 1.5rem and left a visible gap
 * on both sides of every circle, which the owner flagged (Sept 1).
 */

import { Stepper, StepperItem } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

const ATTACHED_CONNECTORS = cn(
  "w-full",
  "[&_[data-slot=stepper-item]]:items-center",
  "[&_[data-slot=stepper-item]>div:first-child]:relative [&_[data-slot=stepper-item]>div:first-child]:justify-center",
  "[&_[data-slot=stepper-connector]]:absolute [&_[data-slot=stepper-connector]]:top-4 [&_[data-slot=stepper-connector]]:left-[calc(50%+1rem)] [&_[data-slot=stepper-connector]]:mx-0 [&_[data-slot=stepper-connector]]:h-px [&_[data-slot=stepper-connector]]:w-[calc(100%-2rem)] [&_[data-slot=stepper-connector]]:min-w-0 [&_[data-slot=stepper-connector]]:flex-none",
  "[&_[data-slot=stepper-item]>div:last-child]:w-full [&_[data-slot=stepper-item]>div:last-child]:pr-0 [&_[data-slot=stepper-item]>div:last-child]:text-center"
);

export function FlowStepper({
  steps,
  current,
  label,
}: {
  steps: ReadonlyArray<{ step: number; title: string }>;
  current: number;
  label: string;
}) {
  return (
    <nav aria-label={label}>
      <Stepper className={ATTACHED_CONNECTORS}>
        {steps.map((item) => (
          <StepperItem
            key={item.step}
            step={item.step}
            title={item.title}
            status={
              item.step < current
                ? "complete"
                : item.step === current
                  ? "current"
                  : "upcoming"
            }
            aria-current={item.step === current ? "step" : undefined}
          />
        ))}
      </Stepper>
    </nav>
  );
}
