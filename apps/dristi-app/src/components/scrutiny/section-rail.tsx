"use client";

/**
 * The filing's sections, with the defect count scrutiny raised on each.
 *
 * By default only the flagged sections are listed, following the record's own default —
 * the rail is a map of the work. The header's "show full filing" toggle brings every
 * section back, full contrast and navigable: being able to *see* the clean sections is
 * what tells the advocate the officer did not flag them (brief §7).
 *
 * A rail rather than the filing's own `sections-rail.tsx`: that one routes
 * (`/filings/<id>/<step>`), and a correction round is one page whose centre pane swaps.
 * Reusing it would mean navigating away from the queue on every click.
 */

import * as React from "react";

import { FILING_STEPS, UPLOAD_STEP, type FilingStep } from "@/lib/filing/steps";
import { CORRECTABLE_SECTIONS } from "@/components/scrutiny/section-body";
import type { StepId } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * `min-h-10` rather than `h-10`, and the label wraps.
 *
 * At 200% text zoom the rail keeps its width while the words in it double, so a fixed
 * height and a `truncate` turned "Case documents" into "Cas…" — a section list nobody can
 * read is a loss of content, which `ACCESSIBILITY.md` §10 does not allow without an
 * alternative. A taller row is the alternative.
 */
const ROW =
  "h-auto min-h-10 w-full justify-start gap-2 whitespace-normal px-2 py-2 text-left font-normal";
const ROW_ACTIVE =
  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

/**
 * The correction round walks the intake step too — a whole-document defect lives there.
 * It is titled "Case documents" here: the filing's own list of documents is a separate
 * step further down, and two rows reading "Documents" is a rail that cannot be used.
 */
export const CORRECTION_STEPS: FilingStep[] = [
  { ...UPLOAD_STEP, title: "Case documents" },
  ...FILING_STEPS,
];

export function SectionRail({
  step,
  countFor,
  onSelect,
  onlyFlagged = false,
  className,
}: {
  step: StepId;
  /** How many defects scrutiny raised on that step. */
  countFor: (id: StepId) => number;
  onSelect: (id: StepId) => void;
  /**
   * Show only the sections scrutiny flagged. Follows the header's "show full filing"
   * toggle: when the record hides its untouched fields, a rail of thirteen mostly-empty
   * sections would be a map to nowhere. The clean sections come back with the toggle —
   * being able to *see* them is what tells the advocate the officer did not flag them.
   */
  onlyFlagged?: boolean;
  className?: string;
}) {
  const groups: { group: string; steps: FilingStep[] }[] = [];
  for (const s of CORRECTION_STEPS) {
    if (onlyFlagged && countFor(s.id) === 0) continue;
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
              /* Preview, signing and fees are reads or acts, not places a defect is
                 cured — they stay listed for orientation, as the filing's own rail does
                 with its placeholder steps, but they are not somewhere to be sent. */
              const dead = !CORRECTABLE_SECTIONS[s.id];
              return (
                <li key={`${s.group}-${s.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelect(s.id)}
                    aria-current={active ? "page" : undefined}
                    disabled={dead}
                    className={cn(ROW, active && ROW_ACTIVE)}
                  >
                    <Icon aria-hidden className={active ? undefined : "text-muted-foreground"} />
                    <span className="min-w-0 flex-1 text-left break-words">{s.title}</span>
                    {/* A plain muted count, not a warning badge per row: four ambers
                        down the rail is alarm fatigue, and the one amber in this
                        screen's chrome is the deadline in the queue header (ui-craft
                        §1.4; same rule as tab counts). The number still maps where the
                        work is; the queue carries the urgency. */}
                    {count > 0 ? (
                      <span className="text-caption font-medium tabular-nums text-muted-foreground">
                        {count}
                        <span className="sr-only">
                          {count === 1 ? " defect" : " defects"}
                        </span>
                      </span>
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
