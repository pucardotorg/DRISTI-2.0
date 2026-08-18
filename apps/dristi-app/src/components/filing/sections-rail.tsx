"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilesIcon, PanelLeftIcon } from "lucide-react";

import { draftProgress, uploadedIntakeSlots } from "@/lib/filing/selectors";
import {
  FILING_STEPS,
  stepFromPathname,
  stepGroups,
  type FilingStep,
} from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOP_BAR_HEIGHT, useFilingChrome } from "@/components/filing/chrome";
import {
  UploadedCountBadge,
  UploadedDocsDrawer,
} from "@/components/filing/uploaded-docs-drawer";

/**
 * A row in the rail. `Button` is the DS control that already meets the 40px metric, so
 * rows are 40px tall rather than the 32px of `SidebarMenuButton` and need no hit-area
 * patch. The current step takes the rail's own brand tint, which is also what colours its
 * icon — "you are here" is one cue, not two competing ones.
 */
const ROW = "h-10 w-full justify-start gap-2 px-2 font-normal";
const ROW_ACTIVE =
  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const ROW_ICON = "size-10 justify-center px-0";
/**
 * Steps listed for orientation with no screen behind them. They keep full contrast — a
 * 50% label is not a readable one — and stay focusable, so the note saying where that
 * work actually happens is reachable by keyboard rather than by hover alone.
 */
const ROW_PLACEHOLDER = "text-muted-foreground";

/** Where each listed-but-screenless step is really carried out. */
const PLACEHOLDER_NOTE: Record<string, string> = {
  affidavit: "composed for you on the preview screen",
  "pay-fees": "paid on the sign screen, after signing",
};

function useActiveStep(): FilingStep | undefined {
  const pathname = usePathname();
  const id = stepFromPathname(pathname);
  return FILING_STEPS.find((s) => !s.placeholder && s.id === id);
}

/* ───────────────────────────── Rows ────────────────────────────────── */

function StepRow({
  step,
  active,
  compact,
  onNavigate,
}: {
  step: FilingStep;
  active: boolean;
  compact: boolean;
  onNavigate: () => void;
}) {
  const { hrefFor } = useFiling();
  const Icon = step.icon;

  if (step.placeholder) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-disabled="true"
              className={cn(compact ? ROW_ICON : ROW, ROW_PLACEHOLDER)}
            >
              <Icon aria-hidden />
              {compact ? (
                <span className="sr-only">{step.title}</span>
              ) : (
                <span className="min-w-0 truncate">{step.title}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {step.title} — {PLACEHOLDER_NOTE[step.id] ?? "not a screen of its own"}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  const row = (
    <Button
      asChild
      variant="ghost"
      className={cn(compact ? ROW_ICON : ROW, active && ROW_ACTIVE)}
    >
      <Link
        href={hrefFor(step.id)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
      >
        <Icon aria-hidden className={active ? undefined : "text-muted-foreground"} />
        {compact ? (
          <span className="sr-only">{step.title}</span>
        ) : (
          <span className="min-w-0 truncate">{step.title}</span>
        )}
      </Link>
    </Button>
  );

  return (
    <li>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>{row}</TooltipTrigger>
          <TooltipContent side="right">{step.title}</TooltipContent>
        </Tooltip>
      ) : (
        row
      )}
    </li>
  );
}

function DocsRow({ compact, onOpen }: { compact: boolean; onOpen: () => void }) {
  const { draft } = useFiling();
  const count = uploadedIntakeSlots(draft.intake).length;

  const button = (
    <Button
      type="button"
      variant="ghost"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={compact ? `View uploaded documents, ${count} uploaded` : undefined}
      className={cn(compact ? ROW_ICON : ROW)}
    >
      <FilesIcon aria-hidden className="text-muted-foreground" />
      {compact ? null : (
        <>
          <span className="min-w-0 flex-1 truncate text-left">
            View uploaded documents
          </span>
          <UploadedCountBadge />
        </>
      )}
    </Button>
  );

  if (!compact) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">View uploaded documents ({count})</TooltipContent>
    </Tooltip>
  );
}

/* ───────────────────────────── Rail body ───────────────────────────── */

function StepList({
  compact,
  onNavigate,
  onOpenDocs,
}: {
  compact: boolean;
  onNavigate: () => void;
  onOpenDocs: () => void;
}) {
  const active = useActiveStep();

  return (
    <nav
      aria-label="Filing sections"
      className={cn("flex flex-col gap-4", compact ? "items-center px-1" : "px-2")}
    >
      <ul className="flex w-full flex-col gap-1">
        <li>
          <DocsRow compact={compact} onOpen={onOpenDocs} />
        </li>
      </ul>

      {stepGroups().map((g) => (
        <div key={g.group} className="flex w-full flex-col gap-1">
          {compact ? null : (
            <h2 className="px-2 text-caption font-medium text-muted-foreground">
              {g.group}
            </h2>
          )}
          <ul className="flex flex-col gap-1">
            {g.steps.map((s) => (
              <StepRow
                key={s.id}
                step={s}
                active={active?.id === s.id}
                compact={compact}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ProgressBlock() {
  const { draft } = useFiling();
  const progress = draftProgress(draft);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-caption">
        <span className="font-medium text-foreground">Progress</span>
        <span className="tabular-nums text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} aria-label="Filing progress" className="h-1.5" />
    </div>
  );
}

/** The strip's stand-in for the progress bar — 48px has room for the number, not the bar. */
function ProgressChip() {
  const { draft } = useFiling();

  return (
    <span className="text-caption font-medium tabular-nums text-muted-foreground">
      {draftProgress(draft)}%<span className="sr-only"> of this filing is complete</span>
    </span>
  );
}

/* ───────────────────────────── Rail ────────────────────────────────── */

/**
 * The filing's own navigation: progress, the uploaded documents, and every section
 * grouped as in the court form.
 *
 * Composed from primitives rather than the DS `Sidebar` on purpose — the app's main nav
 * is already a `Sidebar`, and its provider owns ⌘B and the `sidebar_state` cookie for the
 * whole page, so a second provider would toggle two rails at once.
 *
 * From `lg` up it is a column in one of two widths — a 48px strip or an 18rem panel —
 * expanding in place; collapsing returns it to the strip and it never leaves the layout.
 * Narrower than that there is no width for a permanent strip, so it becomes a sheet
 * opened from the "Sections" button on the screen.
 */
export function SectionsRail() {
  const { sectionsOpen, setSectionsOpen, sectionsSheetOpen, setSectionsSheetOpen } =
    useFilingChrome();
  const [docsOpen, setDocsOpen] = React.useState(false);
  const closeSheet = () => setSectionsSheetOpen(false);

  return (
    <>
      <aside
        aria-label="Sections"
        style={{ top: TOP_BAR_HEIGHT, height: `calc(100svh - ${TOP_BAR_HEIGHT})` }}
        className={cn(
          "sticky hidden shrink-0 flex-col self-start overflow-y-auto border-r border-hairline bg-sidebar transition-[width] duration-200 ease-out lg:flex",
          sectionsOpen ? "w-72" : "w-12"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-3 py-3",
            sectionsOpen ? "px-4" : "items-center gap-2 px-1"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              sectionsOpen ? "justify-between" : "flex-col"
            )}
          >
            {sectionsOpen ? (
              <span className="text-body font-medium text-foreground">Sections</span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={sectionsOpen}
              aria-label={sectionsOpen ? "Collapse sections" : "Expand sections"}
              onClick={() => setSectionsOpen(!sectionsOpen)}
              className="shrink-0 text-muted-foreground"
            >
              <PanelLeftIcon aria-hidden />
            </Button>
            {sectionsOpen ? null : <ProgressChip />}
          </div>

          {sectionsOpen ? <ProgressBlock /> : null}
        </div>

        <div className="pb-4">
          <StepList
            compact={!sectionsOpen}
            onNavigate={() => undefined}
            onOpenDocs={() => setDocsOpen(true)}
          />
        </div>
      </aside>

      <Sheet open={sectionsSheetOpen} onOpenChange={setSectionsSheetOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-title-s font-semibold">Sections</SheetTitle>
            <SheetDescription className="text-body-compact">
              Every part of this filing, in the order the court form takes them.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <ProgressBlock />
          </div>
          <div className="pb-6">
            <StepList
              compact={false}
              onNavigate={closeSheet}
              onOpenDocs={() => {
                closeSheet();
                setDocsOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <UploadedDocsDrawer open={docsOpen} onOpenChange={setDocsOpen} />
    </>
  );
}

/**
 * Opens the rail below `lg`, where it is a sheet rather than a column. From `lg` up the
 * rail is always on screen — collapsed to its strip at worst — and toggles from its own
 * header, so this is the only trigger that has to exist in the content column.
 */
export function SectionsTrigger() {
  const { sectionsSheetOpen, setSectionsSheetOpen } = useFilingChrome();

  return (
    <div className="px-4 pt-4 sm:px-6 lg:hidden">
      <Button
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={sectionsSheetOpen}
        onClick={() => setSectionsSheetOpen(true)}
      >
        <PanelLeftIcon data-icon="inline-start" aria-hidden />
        Sections
      </Button>
    </div>
  );
}
