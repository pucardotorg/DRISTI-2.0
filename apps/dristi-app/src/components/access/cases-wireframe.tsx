"use client";

import * as React from "react";
import { ArrowLeftIcon, PencilRulerIcon, Share2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShareDialog } from "@/components/access/share-dialog";
import { pick, type Locale } from "@/lib/onboarding/content";
import { ACCESS_CASES, casesCopy, fillCopy, type AccessCase } from "@/lib/access/content";
import { cn } from "@/lib/utils";

/**
 * Wireframes of the two screens that HOST access management but are not this
 * workstream's design: the all-cases list and the single case file. Both are
 * deliberately dashed-grey (the advocate-home convention) — only the Share and
 * Manage-access controls, and the surfaces they open, are real design.
 *
 * All-cases: Share access sits permanently in the header — greyed out until a
 * row is ticked, never appearing out of nowhere — with a running count and a
 * clear-selection escape next to it. Case file: Share opens the full dialog;
 * Manage access is the same surface (single-case mode carries the
 * who-has-access list with inline remove).
 *
 * `openCaseId` is controlled by the parent so other pages (People) can deep-
 * link straight into a case.
 */

function WireCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-surface p-4", className)}>
      {children}
    </div>
  );
}

function WireframeNotice({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-caption text-pretty text-muted-foreground">
      <PencilRulerIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

export function CasesWireframe({
  locale,
  openCaseId,
  onOpenCase,
}: {
  locale: Locale;
  /** Controlled: the case file currently open, or null for the list. */
  openCaseId: string | null;
  onOpenCase: (caseId: string | null) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareCases, setShareCases] = React.useState<AccessCase[]>([]);

  const openCase = ACCESS_CASES.find((c) => c.id === openCaseId) ?? null;

  function toggle(caseId: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, caseId] : current.filter((id) => id !== caseId),
    );
  }

  function shareSelected() {
    setShareCases(ACCESS_CASES.filter((c) => selected.includes(c.id)));
    setShareOpen(true);
  }

  function shareSingle(target: AccessCase) {
    setShareCases([target]);
    setShareOpen(true);
  }

  function clearSelectionAway(event: React.PointerEvent<HTMLElement>) {
    if (!selected.length) return;
    const target = event.target as HTMLElement;
    if (!target.closest("[data-preserve-case-selection]")) setSelected([]);
  }

  /* ------------------------------------------------------- single case file */
  if (openCase) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => onOpenCase(null)}
            data-icon="inline-start"
          >
            <ArrowLeftIcon aria-hidden />
            {pick(casesCopy.backToCases, locale)}
          </Button>

          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-title text-balance font-semibold">{openCase.title}</h1>
              <p className="text-caption text-muted-foreground">
                {openCase.caseNumber} · {openCase.court}
              </p>
            </div>
            {/* The one real control on this wireframe — the dialog carries
                both sharing and managing (they are the same surface). */}
            <Button
              type="button"
              className="shrink-0"
              onClick={() => shareSingle(openCase)}
              data-icon="inline-start"
            >
              <Share2Icon aria-hidden />
              {pick(casesCopy.shareAccess, locale)}
            </Button>
          </header>

          <WireframeNotice text={pick(casesCopy.caseWireframeNote, locale)} />
        </div>

        {/* Dashed stand-ins for the case file's real content. */}
        <div className="flex flex-col gap-3">
          <WireCard>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-1/3 rounded-full bg-muted" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-1/2 rounded-full bg-muted" />
            </div>
          </WireCard>
          <WireCard>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-1/4 rounded-full bg-muted" />
              <div className="h-3 w-3/5 rounded-full bg-muted" />
            </div>
          </WireCard>
        </div>

        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} cases={shareCases} locale={locale} />
      </main>
    );
  }

  /* ------------------------------------------------------------- all cases */
  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-6 md:py-10"
      onPointerDown={clearSelectionAway}
    >
      {/* Share access lives permanently in the header — greyed out until a
          case is ticked, so the control never pops in and out of existence. */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {pick(casesCopy.title, locale)}
          </h1>
          <WireframeNotice text={pick(casesCopy.wireframeNote, locale)} />
        </div>
        <div className="flex shrink-0 items-center gap-3" data-preserve-case-selection>
          {selected.length ? (
            <>
              <span className="text-body-compact text-muted-foreground tabular-nums">
                {fillCopy(casesCopy.selectedCount, locale, { count: String(selected.length) })}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                {pick(casesCopy.clearSelection, locale)}
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            disabled={!selected.length}
            onClick={shareSelected}
            data-icon="inline-start"
          >
            <Share2Icon aria-hidden />
            {pick(casesCopy.shareAccess, locale)}
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {ACCESS_CASES.map((entry) => {
          const checked = selected.includes(entry.id);
          return (
            <div key={entry.id} data-preserve-case-selection>
              <WireCard className={cn(checked && "border-solid border-ring")}>
                <div className="flex items-start gap-3">
                <Checkbox
                  id={`select-${entry.id}`}
                  checked={checked}
                  onCheckedChange={(value) => toggle(entry.id, value === true)}
                  aria-label={fillCopy(casesCopy.selectAria, locale, {
                    caseNumber: entry.caseNumber,
                  })}
                  className="mt-1"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Label
                    htmlFor={`select-${entry.id}`}
                    className="text-body-compact font-semibold text-pretty"
                  >
                    {entry.title}
                  </Label>
                  <p className="text-caption text-muted-foreground">
                    {entry.caseNumber} · {entry.court}
                  </p>
                  <Badge variant="outline" className="mt-1 w-fit">
                    {fillCopy(casesCopy.nextHearing, locale, { date: entry.nextHearing })}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onOpenCase(entry.id)}
                >
                  {pick(casesCopy.open, locale)}
                </Button>
                </div>
              </WireCard>
            </div>
          );
        })}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={(nextOpen) => {
          setShareOpen(nextOpen);
          if (!nextOpen) setSelected([]);
        }}
        cases={shareCases}
        locale={locale}
      />
    </main>
  );
}
