import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  DescriptionDetails,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { type DueRamp, type DueStatusView } from "@/lib/cases/peek";
import { cn } from "@/lib/utils";

/**
 * The card shell every Overview region is built from. Shared rather than
 * copied: a second way to make an Overview card is a second set of decisions
 * about heading weight, padding, and hover, and they drift.
 */
export function OverviewSection({
  id,
  title,
  count,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  count?: number;
  /** One line under the title, for something true of the whole section
   *  rather than of any row in it. CardHeader gives a description its own
   *  row and keeps it out of the action column. */
  description?: string;
  /** Sits opposite the title. CardHeader turns itself into two columns
   *  when a CardAction is present, so the title keeps the whole width
   *  on the cards that have none. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-6">
      <RestingCard>
        <CardHeader>
          {/* min-h-10 only when there is an action: it is the icon button's
              own height, so the title centres against it instead of the two
              sitting on different baselines. Without one, nothing should
              pad the header. */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              action ? "min-h-10" : undefined,
            )}
          >
            <h2 className="text-title-s font-semibold">{title}</h2>
            {count === undefined ? null : (
              <Badge variant="secondary">{count}</Badge>
            )}
          </div>
          {/* text-caption over the primitive's own compact size, for the
              same reason OverviewRow overrides it: 14px is control chrome,
              and this is the section's quietest copy either way. */}
          {description ? (
            <CardDescription className="text-caption">
              {description}
            </CardDescription>
          ) : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
        {children}
      </RestingCard>
    </section>
  );
}

/**
 * Rows carry `text-body` explicitly — the primitive's own compact size is
 * control chrome, not a screen-copy role. The value is the emphasized half.
 */
export function OverviewRow({
  term,
  narrow,
  children,
}: {
  term: string;
  /**
   * Stacks the term over its value below `sm:`. The DS row holds a 10rem
   * label column, which is right at card width and wrong inside a nested
   * well: on a phone that leaves about 80px for the value, and a tracking
   * number or a police station wraps to five lines or pushes the grid past
   * its container. Same rows, same divider, one fewer column.
   */
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <DescriptionRow
      className={narrow ? "max-sm:grid-cols-1 max-sm:gap-y-1" : undefined}
    >
      <DescriptionTerm className="text-body">{term}</DescriptionTerm>
      <DescriptionDetails className="text-body font-medium">
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/**
 * Card hover fill is for interactive cards; these are resting panels.
 *
 * `className` is here for the one thing a caller legitimately changes: a card
 * whose content runs edge to edge has to drop the shell's own vertical
 * padding, and a second card component would be a second set of decisions
 * about border, radius, and hover.
 */
export function RestingCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <Card className={cn("hover:bg-card", className)}>{children}</Card>;
}

/**
 * The rung a deadline sits on, in badge variants. The model decides the
 * rung; this is the only place that turns one into a colour.
 */
const DUE_BADGE: Record<DueRamp, "destructive" | "warning" | "secondary"> = {
  past: "destructive",
  "before-hearing": "warning",
  later: "secondary",
};

/**
 * One deadline, ranked. Pending tasks is the only caller today; it stays a
 * component rather than inline markup because the rungs and the badge map
 * below are the case's escalation vocabulary, and a second copy of them is a
 * second set of decisions about when a deadline turns red.
 *
 * A deadline and the note saying who holds it were the same grey caption,
 * which is how a deadline goes missing on a card where nothing is late yet.
 * The badge now carries every rung rather than only the late and the
 * imminent: an escalation that fires on no row of the case in front of you
 * is one the reader never learns to read, and the row changed shape between
 * its states, so the eye had to re-find the deadline card by card. Same
 * structure throughout — interval in the badge, date plain beside it — and
 * only the fill ranks.
 *
 * `warning` for work owed before the next sitting is caution, not error, and
 * this codebase already spends it that way on the Long pending flag. `info`
 * would be wrong: a deadline is not an aside. Both status rungs use the
 * opaque `-muted` fills the Badge variants carry, never an alpha wash
 * (Laws — no alpha status fills).
 *
 * The badge holds the interval alone. The date is what the work is planned
 * against rather than part of the status, and a badge wide enough to hold
 * "Due in 6 days · 17 August 2026" has stopped reading as a status. Colour
 * is never alone either way (ACCESSIBILITY 3): the badge states the interval
 * in words, so the fill is emphasis on a fact, not the fact.
 */
export function DueStatusLine({ relative, on, ramp }: DueStatusView) {
  return (
    /* Wraps rather than truncates: the sidebar column is narrow and these
       strings run longer in Indic scripts (ACCESSIBILITY 13). */
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={DUE_BADGE[ramp]}>{relative}</Badge>
      {/* text-body, not caption: this is half the deadline — the badge holds
          the interval, this holds the date it falls on — and 12px is chrome.
          Colour is unchanged; muted-foreground is the quieter half of a
          pair, not a contrast defect. */}
      <span className="text-body text-muted-foreground">{on}</span>
    </div>
  );
}
