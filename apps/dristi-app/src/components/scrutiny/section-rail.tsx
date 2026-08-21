"use client";

/**
 * Every section of the filing, with the defect count scrutiny raised on each.
 *
 * All thirteen are listed and every one is reachable — being able to *see* the clean
 * sections is what tells the advocate the officer did not flag them (brief §7). Sections
 * without defects stay full contrast and navigable; a 50% label is not a readable one,
 * and their read-only-ness is stated in the section itself, not implied by a dim row.
 *
 * A rail rather than the filing's own `sections-rail.tsx`: that one routes
 * (`/filings/<id>/<step>`), and a correction round is one page whose centre pane swaps.
 * Reusing it would mean navigating away from the queue on every click.
 */

import * as React from "react";

import { FILING_STEPS, UPLOAD_STEP, type FilingStep } from "@/lib/filing/steps";
import type { StepId } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROW = "h-10 w-full justify-start gap-2 px-2 font-normal";
const ROW_ACTIVE =
  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

/** The correction round walks the intake step too — a document defect lives there. */
export const CORRECTION_STEPS: FilingStep[] = [UPLOAD_STEP, ...FILING_STEPS];

export function SectionRail({
  step,
  countFor,
  onSelect,
  className,
}: {
  step: StepId;
  /** How many defects scrutiny raised on that step. */
  countFor: (id: StepId) => number;
  onSelect: (id: StepId) => void;
  className?: string;
}) {
  const groups: { group: string; steps: FilingStep[] }[] = [];
  for (const s of CORRECTION_STEPS) {
    const g = groups.find((x) => x.group === s.group);
    if (g) g.steps.push(s);
    else groups.push({ group: s.group, steps: [s] });
  }

  return (
    <nav aria-label="Filing sections" className={cn("flex flex-col gap-4 px-2", className)}>
      {groups.map((g) => (
        <div key={g.group} className="flex w-full flex-col gap-1">
          <h2 className="px-2 text-caption font-medium text-muted-foreground">{g.group}</h2>
          <ul className="flex flex-col gap-1">
            {g.steps.map((s) => {
              const count = countFor(s.id);
              const active = s.id === step;
              const Icon = s.icon;
              return (
                <li key={`${s.group}-${s.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelect(s.id)}
                    aria-current={active ? "page" : undefined}
                    disabled={!!s.placeholder}
                    className={cn(ROW, active && ROW_ACTIVE)}
                  >
                    <Icon aria-hidden className={active ? undefined : "text-muted-foreground"} />
                    <span className="min-w-0 flex-1 truncate text-left">{s.title}</span>
                    {count > 0 ? (
                      <Badge variant="warning" className="tabular-nums">
                        {count}
                        <span className="sr-only">
                          {count === 1 ? " defect" : " defects"}
                        </span>
                      </Badge>
                    ) : null}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
