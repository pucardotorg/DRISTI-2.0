"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { LeaveGuardProvider } from "@/components/filing/leave-guard";
import { SectionsRail, SectionsTrigger } from "@/components/filing/sections-rail";

/**
 * Where the source rail mounts. `SourcePanel` is rendered deep inside a section, but the
 * rail has to be a *column* beside the form — otherwise it can only cover the form or
 * float over the sticky footer. The slot lets it stay a sibling of the content column
 * without every section having to know about the shell's layout.
 */
const SourceRailSlot = React.createContext<HTMLElement | null>(null);

export function useSourceRailSlot(): HTMLElement | null {
  return React.useContext(SourceRailSlot);
}

/**
 * Frame for the form sections: the Sections rail, the screen, and the source rail's
 * column — three siblings in the row the filings shell opened. Screens supply their own
 * `FilingMain` + `FilingFooter`.
 */
export function FilingShell({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);

  return (
    <LeaveGuardProvider>
      <SourceRailSlot.Provider value={slot}>
        <SectionsRail />

        <main className="flex min-w-0 flex-1 flex-col">
          <SectionsTrigger />
          {children}
        </main>

        {/* Zero-width until a source or signing rail mounts into it. */}
        <div ref={setSlot} className="flex shrink-0" />
      </SourceRailSlot.Provider>
    </LeaveGuardProvider>
  );
}

/**
 * The scrolling column of a filing screen.
 *
 * A `div`, not a `main`: inside `FilingShell` the landmark is the shell's own `main`, and
 * the two screens outside it (upload, sign) carry theirs.
 */
export function FilingMain({
  children,
  width = "default",
  sourceOpen = false,
  className,
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
  /** The source rail has taken a column, so the form has less width to spend on gutters. */
  sourceOpen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 px-4 pb-8 pt-6 sm:px-6",
        sourceOpen ? "lg:px-6" : "lg:px-12",
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
    </div>
  );
}
