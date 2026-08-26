"use client";

import * as React from "react";

import { shortDate } from "@/lib/tasks/format";
import { CARD_LABELS, CARD_ORDER, type CardCount } from "@/lib/tasks/selectors";
import type { CardKind, TaskView } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PANEL_CLASS } from "@/components/shell/panel";

/**
 * Six kind cards — the overview and the filter in one. Each is a lifted panel wrapping a
 * real `button` with `aria-pressed`; pressing narrows the table to that kind, pressing
 * again clears it. One quiet cue for the pressed state: a brand ring and the eyebrow in
 * the brand tint — no fill change, so the row of cards stays one surface.
 *
 * Counts describe the current view (tab) only, never the other filters — so the cards
 * always say how much of which kind of work sits in the tab.
 */
export function OverviewCards({
  counts,
  view,
  active,
  loading,
  onToggle,
}: {
  counts: Record<CardKind, CardCount> | null;
  view: TaskView;
  active: CardKind | null;
  loading?: boolean;
  onToggle: (kind: CardKind) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Kinds of work"
      /* Five kinds, five columns — the grid was still sized for six after Drafts left,
         which parked a permanent hole at the row's end and stretched every card to
         cover for it (owner, 2026-08-24). Capped so ultrawide screens deepen the
         gutter, not the cards. */
      className="grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
    >
      {CARD_ORDER.map((kind) => {
        const c = counts?.[kind];
        const pressed = active === kind;
        return (
          <Card
            key={kind}
            size="sm"
            className={cn(
              PANEL_CLASS,
              "h-full py-0 transition-shadow hover:shadow-overlay",
              pressed && "ring-2 ring-brand-accent"
            )}
          >
            <button
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggle(kind)}
              disabled={loading}
              className="flex h-full w-full flex-col gap-0.5 rounded-xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default"
            >
              {/* The kind is the card's heading, so it reads at heading scale — 14/500,
                  not a 12px caption doing a heading's job. */}
              <span
                className={cn(
                  "text-body-compact font-medium transition-colors",
                  pressed ? "text-brand-muted-foreground" : "text-muted-foreground"
                )}
              >
                {CARD_LABELS[kind]}
              </span>
              {/* Count and caption sit at the bottom, so numbers line up across the row
                  even when a heading wraps to two lines. The 24px count carried the old
                  96px minimum's emptiness; at 20 the card sits at its natural height. */}
              <span className="mt-auto pt-1 text-title-s font-semibold tabular-nums text-foreground">
                {loading || !c ? "–" : c.count}
              </span>
              {view === "needs-action" ? (
                <span className="text-caption tabular-nums text-muted-foreground">
                  <Caption count={c} loading={loading} />
                </span>
              ) : null}
            </button>
          </Card>
        );
      })}
    </div>
  );
}

/** "2 overdue · next 21 Aug" — the overdue fragment in ink when > 0, dropped when 0. */
function Caption({ count, loading }: { count?: CardCount; loading?: boolean }) {
  if (loading || !count) return <>&nbsp;</>;
  if (count.count === 0) return <>Nothing due</>;
  const parts: React.ReactNode[] = [];
  if (count.overdue > 0) {
    parts.push(
      <span key="overdue" className="text-destructive-ink">
        {count.overdue} overdue
      </span>
    );
  }
  if (count.nextDue) parts.push(<span key="next">next {shortDate(count.nextDue)}</span>);
  if (!parts.length) return <>No date</>;
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i ? <span aria-hidden> · </span> : null}
          {p}
        </React.Fragment>
      ))}
    </>
  );
}
