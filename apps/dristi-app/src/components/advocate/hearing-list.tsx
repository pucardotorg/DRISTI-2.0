"use client";

import { ChevronRight, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/onboarding/content";
import { pick } from "@/lib/onboarding/content";
import { advHome } from "@/lib/advocate/content";
import type { HomeHearing } from "@/lib/advocate/home";
import type { World } from "@/lib/tasks/selectors";
import { personOf } from "@/lib/tasks/selectors";
import { mainAdvocateOf } from "@/lib/tasks/permissions";
import { cn } from "@/lib/utils";
import { TeamAvatar } from "@/components/advocate/home-bits";

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
  const userId = typeof world.user === "string" ? world.user : world.user.id;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-3xl border-collapse text-left">
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
            <th scope="col" className="w-16 px-4 py-2 font-medium">
              Adv.
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
            const main = personOf(world, mainAdvocateOf(hearing.kase));
            return (
              <tr
                key={hearing.kase.id}
                className={cn(
                  "group/case",
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
                <td className="px-4 py-3">
                  {main ? (
                    <TeamAvatar person={main} you={main.id === userId} />
                  ) : null}
                </td>
                <td className="px-4 py-3">{statusCell(locale, hearing)}</td>
                {/* Fixed-width cell: the chevron yields to "View case" on hover
                    without the column moving a pixel. */}
                <td className="w-32 px-4 py-3 text-right text-muted-foreground">
                  <ChevronRight
                    aria-hidden="true"
                    className="inline size-4 group-hover/case:hidden group-focus-within/case:hidden"
                  />
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onOpenCase(hearing.kase.id)}
                    className="hidden group-hover/case:inline-flex group-focus-within/case:inline-flex"
                  >
                    {pick(advHome.viewCase, locale)}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
