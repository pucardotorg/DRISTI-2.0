"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilingSidebar, SidebarSections } from "@/components/filing/filing-sidebar";

/**
 * Two-column frame for the form sections: the Sections rail on the left (a sheet below
 * `lg`), the screen on the right. Screens supply their own `FilingMain` + `FilingFooter`.
 */
export function FilingShell({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex flex-1 items-start">
      {!hidden ? <FilingSidebar onHide={() => setHidden(true)} /> : null}

      <div className="flex min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 flex-col">
        <div
          className={cn(
            "flex items-center gap-2 px-4 pt-4 sm:px-6 lg:px-12",
            !hidden && "lg:hidden"
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <PanelLeftIcon data-icon="inline-start" aria-hidden />
            Sections
          </Button>
          {hidden ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => setHidden(false)}
            >
              <PanelLeftIcon data-icon="inline-start" aria-hidden />
              Show sections
            </Button>
          ) : null}
        </div>
        {children}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Sections</SheetTitle>
            <SheetDescription>Move between the parts of this filing.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 px-4 pb-4">
            <SidebarSections onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * The scrolling column of a filing screen. `sourceOpen` reserves room on wide screens
 * for the fixed source-document panel so the form is pushed rather than covered.
 */
export function FilingMain({
  children,
  width = "default",
  sourceOpen = false,
  className,
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
  sourceOpen?: boolean;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-12",
        sourceOpen && "xl:mr-(--source-panel-w)",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-6",
          width === "default" && "max-w-4xl",
          width === "wide" && "max-w-5xl",
          width === "narrow" && "mx-auto max-w-2xl"
        )}
      >
        {children}
      </div>
    </main>
  );
}
