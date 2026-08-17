"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, PanelLeftCloseIcon } from "lucide-react";

import { draftProgress } from "@/lib/filing/selectors";
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
  UploadedCountBadge,
  UploadedDocsDrawer,
} from "@/components/filing/uploaded-docs-drawer";

export function useActiveStep(): FilingStep | undefined {
  const pathname = usePathname();
  const id = stepFromPathname(pathname);
  return FILING_STEPS.find((s) => !s.placeholder && s.id === id);
}

/**
 * Sections navigation for the filing form: progress, uploaded documents, and every
 * section grouped as in the court form. Used inside the desktop rail and the mobile sheet.
 */
export function SidebarSections({
  onNavigate,
  onHide,
}: {
  onNavigate?: () => void;
  onHide?: () => void;
}) {
  const active = useActiveStep();
  const { draft, hrefFor } = useFiling();
  const [docsOpen, setDocsOpen] = React.useState(false);
  const progress = draftProgress(draft);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-body font-medium text-foreground">Sections</span>
        {onHide ? (
          <Button type="button" variant="ghost" onClick={onHide}>
            Hide
            <PanelLeftCloseIcon data-icon="inline-end" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex items-center justify-between text-caption">
          <span className="font-medium text-foreground">Progress</span>
          <span className="tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} aria-label="Filing progress" className="h-1.5" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setDocsOpen(true)}
      >
        View uploaded documents
        <ArrowUpRightIcon aria-hidden />
        <span className="ml-auto">
          <UploadedCountBadge />
        </span>
      </Button>
      <UploadedDocsDrawer open={docsOpen} onOpenChange={setDocsOpen} />

      <nav aria-label="Filing sections" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {stepGroups().map((g) => (
          <div key={g.group} className="mb-4 last:mb-0">
            <p className="px-2 pb-1 pt-2 text-caption text-muted-foreground">{g.group}</p>
            <ul className="flex flex-col gap-0.5">
              {g.steps.map((s) => {
                const isActive = active?.id === s.id;
                const Icon = s.icon;
                const base =
                  "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-body-compact font-medium outline-none transition-colors";
                if (s.placeholder) {
                  return (
                    <li key={s.id}>
                      <span
                        aria-disabled
                        className={cn(base, "cursor-default text-muted-foreground")}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {s.title}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={s.id}>
                    <Link
                      href={hrefFor(s.id)}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        base,
                        "focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      {s.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

/** Desktop rail (lg and up). */
export function FilingSidebar({ onHide }: { onHide?: () => void }) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-hairline bg-sidebar p-4 lg:block">
      <SidebarSections onHide={onHide} />
    </aside>
  );
}
