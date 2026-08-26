"use client";

import * as React from "react";
import { PencilRulerIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { pick, type Locale } from "@/lib/onboarding/content";
import { advHome, fillCopy } from "@/lib/advocate/content";
import { cn } from "@/lib/utils";

/**
 * Wireframe of the advocate hearings dashboard.
 *
 * The real screen belongs to another designer; this placeholder keeps its skeleton —
 * greeting, court tabs, in-session card, up-next list — so the shell, side panel and
 * join flow can be reviewed in one place. Everything here is dashed-border grey by
 * intent: nothing on this surface should read as a finished design decision.
 */

const COURT_TABS = [
  { name: "24×7 ON Court", count: 5, active: true },
  { name: "JMFC Court 1", count: 3 },
  { name: "JMFC Court 2", count: 2 },
  { name: "CJM Court", count: 1 },
];

const UP_NEXT = [
  {
    item: 7,
    title: "Fathima Beevi v. Anil Kumar K.",
    purpose: "Recording of the plea of the accused · KLKL01-000088-2026",
    task: "Upload the certified copy of the bank's return memo",
    due: "2 days past due",
  },
  {
    item: 9,
    title: "Anitha Joseph v. Latheef M.",
    purpose: "Evidence of the complainant · KLKL01-000112-2026",
    task: "File the proof affidavit of PW-1",
    due: "Due today",
  },
];

function WireCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-surface p-4", className)}>
      {children}
    </div>
  );
}

export function AdvocateHome({ locale, profileFirstName }: {
  locale: Locale;
  profileFirstName: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {fillCopy(advHome.greeting, locale, { name: profileFirstName })}
          </h1>
          <p className="text-body-compact text-muted-foreground">
            {pick(advHome.subline, locale)}
          </p>
        </div>
        <Badge variant="outline" className="mt-1 shrink-0 text-muted-foreground">
          <PencilRulerIcon aria-hidden />
          {pick(advHome.wireframeNote, locale)}
        </Badge>
      </div>

      {/* court tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {COURT_TABS.map((tab) => (
          <span
            key={tab.name}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-body-compact",
              tab.active
                ? "border-border bg-muted font-medium text-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {tab.name}
            <span className="text-caption text-muted-foreground">{tab.count}</span>
          </span>
        ))}
      </div>

      {/* concluded strip */}
      <WireCard className="flex min-h-12 items-center bg-surface-sunken py-2">
        <p className="text-body-compact text-muted-foreground">{pick(advHome.concluded, locale)}</p>
      </WireCard>

      {/* in-session card */}
      <section className="flex flex-col gap-2" aria-label={pick(advHome.nowLabel, locale)}>
        <p className="text-caption font-semibold text-muted-foreground uppercase">
          {pick(advHome.nowLabel, locale)}
        </p>
        <WireCard className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <p className="text-title-s font-semibold">Sreekumar N. v. Vismaya Traders</p>
            <p className="text-body-compact text-muted-foreground">
              Cross-examination of PW-1, and evidence of PW-2 · KLKL01-000412-2025
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { task: "Fix 2 defects — condonation of delay application", due: "4 days past due" },
              { task: "Pay the ₹2 process fee", due: "41 days past due" },
            ].map((row) => (
              <div
                key={row.task}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-sunken px-3 py-2.5"
              >
                <p className="text-body-compact">{row.task}</p>
                <p className="text-caption text-destructive">{row.due}</p>
              </div>
            ))}
          </div>
        </WireCard>
      </section>

      {/* up next */}
      <section className="flex flex-col gap-2" aria-label={pick(advHome.upNext, locale)}>
        <p className="text-caption font-semibold text-muted-foreground uppercase">
          {pick(advHome.upNext, locale)}
        </p>
        <div className="flex flex-col gap-3">
          {UP_NEXT.map((entry) => (
            <WireCard key={entry.item} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-body-compact font-semibold text-muted-foreground">
                  {entry.item}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-body font-semibold">{entry.title}</p>
                  <p className="text-caption text-muted-foreground">{entry.purpose}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-sunken px-3 py-2.5">
                <p className="text-body-compact">{entry.task}</p>
                <p className="text-caption text-destructive">{entry.due}</p>
              </div>
            </WireCard>
          ))}
        </div>
      </section>
    </main>
  );
}
