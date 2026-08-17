"use client";

import * as React from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SectionTab = {
  id: string;
  label: string;
  /** Secondary text after the label (a name, an amount). */
  meta?: string;
  /** Drives the status dot; never colour alone — an sr-only word accompanies it. */
  status: "complete" | "attention";
  removable?: boolean;
};

/**
 * Tab strip for repeated entities (Complainant 1, 2…; Cheque 1, 2…). The DS Tabs line
 * variant carries the strip; remove is a sibling icon button so it is its own control.
 */
export function SectionTabs({
  tabs,
  activeId,
  onSelect,
  onRemove,
  addLabel,
  onAdd,
  trailing,
  className,
}: {
  tabs: SectionTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
  addLabel?: string;
  onAdd?: () => void;
  /** Right-aligned extra control (e.g. "View source document"). */
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-hairline",
        className
      )}
    >
      <Tabs value={activeId} onValueChange={onSelect} className="min-w-0">
        <TabsList variant="line" className="flex-wrap gap-1 p-0 group-data-horizontal/tabs:h-10">
          {tabs.map((t) => (
            <div key={t.id} className="flex items-center">
              <TabsTrigger
                value={t.id}
                className="h-10 flex-none gap-2 rounded-b-none px-3 text-body-compact group-data-horizontal/tabs:after:-bottom-px"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    t.status === "complete" ? "bg-success" : "bg-warning-ink"
                  )}
                />
                <span className="sr-only">
                  {t.status === "complete" ? "Complete:" : "Needs attention:"}
                </span>
                {t.label}
                {t.meta ? (
                  <span className="font-normal text-muted-foreground">{t.meta}</span>
                ) : null}
              </TabsTrigger>
              {t.removable && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${t.label}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(t.id)}
                >
                  <XIcon aria-hidden />
                </Button>
              ) : null}
            </div>
          ))}
        </TabsList>
      </Tabs>
      {addLabel && onAdd ? (
        <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="text-primary">
          <PlusIcon data-icon="inline-start" aria-hidden />
          {addLabel}
        </Button>
      ) : null}
      {trailing ? <div className="ml-auto flex items-center">{trailing}</div> : null}
    </div>
  );
}
