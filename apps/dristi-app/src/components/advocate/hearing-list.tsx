"use client";

import { CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome } from "@/lib/advocate/content";
import { teamOf, type HomeHearing } from "@/lib/advocate/home";
import type { World } from "@/lib/tasks/selectors";
import { cn } from "@/lib/utils";
import { AdvocateStack, RowAction } from "@/components/advocate/home-bits";

function statusCell(locale: Locale, hearing: HomeHearing) {
  if (hearing.blockers.length) {
    return (
      <Badge variant="warning">
        {hearing.blockers.length} blocking{" "}
        {hearing.blockers.length === 1 ? "task" : "tasks"}
      </Badge>
    );
  }
  if (hearing.ready) {
    return (
      <Badge variant="success">
        <CircleCheck aria-hidden="true" />
        {pick(advHome.ready, locale)}
      </Badge>
    );
  }
  return null;
}

/** Dense list view of the same items — the day's cause list, one row per matter. */
export function HearingList({
  world,
  locale,
  hearings,
  selectedId,
  onOpenCase,
}: {
  world: World;
  locale: Locale;
  hearings: HomeHearing[];
  selectedId: string | null;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-4xl border-collapse text-left">
        <caption className="sr-only">Listed matters in this court</caption>
        <thead>
          <tr className="bg-surface-sunken text-caption text-muted-foreground">
            <th scope="col" className="w-16 px-4 py-2 font-medium">
              Item
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Parties and stage
            </th>
            <th scope="col" className="w-48 px-4 py-2 font-medium">
              CNR
            </th>
            <th scope="col" className="w-24 px-4 py-2 font-medium">
              Advocates
            </th>
            <th scope="col" className="w-40 px-4 py-2 font-medium">
              Status
            </th>
            <th scope="col" className="w-32 px-4 py-2">
              <span className="sr-only">Open case</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {hearings.map((hearing) => {
            const selected = hearing.kase.id === selectedId;
            return (
              <tr
                key={hearing.kase.id}
                className={cn(
                  "group/row",
                  "border-b border-hairline transition-colors last:border-b-0 hover:bg-accent has-focus-visible:bg-accent",
                  // Brand fill is reserved for the live "now" row; a selected row
                  // gets a quiet neutral well so the two never read alike.
                  hearing.status === "now"
                    ? "bg-brand-muted"
                    : selected && "bg-surface-sunken"
                )}
              >
                <td className="px-4 py-3 text-body-compact font-medium tabular-nums text-muted-foreground">
                  {hearing.item}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenCase(hearing.kase.id)}
                    className="flex flex-col gap-0.5 text-left"
                  >
                    <span className="text-body-compact font-semibold">
                      {hearing.kase.parties}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {hearing.kase.stage}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-caption text-muted-foreground">
                  {hearing.kase.cnr || "—"}
                </td>
                {/* Everyone on the matter — a case is rarely one advocate's,
                    and the first signatory is not the whole answer. */}
                <td className="px-4 py-3">
                  <AdvocateStack
                    locale={locale}
                    team={teamOf(world, hearing.kase)}
                    max={2}
                    ring={hearing.status === "now" ? "ring-brand-muted" : "ring-card"}
                  />
                </td>
                <td className="px-4 py-3">{statusCell(locale, hearing)}</td>
                <td className="w-32 px-4 py-3">
                  <RowAction
                    label={pick(advHome.viewCase, locale)}
                    onClick={() => onOpenCase(hearing.kase.id)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
