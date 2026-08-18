"use client";

import * as React from "react";

import { KIND_LABELS, KIND_ORDER, type Lens } from "@/lib/tasks/selectors";
import type { TaskKind } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Draft = Pick<
  Lens,
  "kinds" | "courts" | "stages" | "dueFrom" | "dueTo" | "createdFrom" | "createdTo" | "showClosed"
>;

function pick(lens: Lens): Draft {
  return {
    kinds: lens.kinds,
    courts: lens.courts,
    stages: lens.stages,
    dueFrom: lens.dueFrom,
    dueTo: lens.dueTo,
    createdFrom: lens.createdFrom,
    createdTo: lens.createdTo,
    showClosed: lens.showClosed,
  };
}

function CheckList<T extends string>({
  legend,
  options,
  value,
  onChange,
  labelOf = (v) => v,
}: {
  legend: string;
  options: T[];
  value: T[];
  onChange: (next: T[]) => void;
  labelOf?: (v: T) => string;
}) {
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <FieldGroup className="gap-2">
        {options.map((opt) => {
          const id = `filter-${legend}-${opt}`.replace(/\s+/g, "-").toLowerCase();
          const on = value.includes(opt);
          return (
            <Field key={opt} orientation="horizontal" className="items-center gap-3">
              <Checkbox
                id={id}
                checked={on}
                onCheckedChange={(checked) =>
                  onChange(checked ? [...value, opt] : value.filter((v) => v !== opt))
                }
                className="after:absolute after:-inset-3"
              />
              <FieldLabel htmlFor={id} className="font-normal">
                {labelOf(opt)}
              </FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}

function DateRange({
  legend,
  from,
  to,
  onChange,
}: {
  legend: string;
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) {
  const id = legend.replace(/\s+/g, "-").toLowerCase();
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <div className="grid grid-cols-2 gap-3">
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${id}-from`} className="text-caption text-muted-foreground">
            From
          </FieldLabel>
          <Input
            id={`${id}-from`}
            type="date"
            value={from ?? ""}
            onChange={(e) => onChange(e.target.value || undefined, to)}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${id}-to`} className="text-caption text-muted-foreground">
            To
          </FieldLabel>
          <Input
            id={`${id}-to`}
            type="date"
            value={to ?? ""}
            onChange={(e) => onChange(from, e.target.value || undefined)}
          />
        </Field>
      </div>
    </FieldSet>
  );
}

/**
 * The deep filters — kind, court, stage, due and created ranges, closed tasks — in a
 * sheet, applied together. What is applied echoes as chips in the row above.
 */
export function FiltersSheet({
  open,
  onOpenChange,
  lens,
  courts,
  stages,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lens: Lens;
  courts: string[];
  stages: string[];
  onApply: (patch: Draft) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Mounted per open, so the draft always starts from the applied lens. */}
        {open ? (
          <FiltersForm
            lens={lens}
            courts={courts}
            stages={stages}
            onApply={onApply}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function FiltersForm({
  lens,
  courts,
  stages,
  onApply,
  onClose,
}: {
  lens: Lens;
  courts: string[];
  stages: string[];
  onApply: (patch: Draft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(() => pick(lens));

  return (
    <>
      <SheetHeader className="border-b border-hairline px-6 py-4">
          <SheetTitle className="text-title-s font-semibold">Filters</SheetTitle>
          <SheetDescription className="text-body-compact">
            Narrow the {lens.view === "todo" ? "to do" : lens.view} list. Applied filters show as chips.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-8 px-6 py-6">
          <CheckList<TaskKind>
            legend="Kind"
            options={KIND_ORDER}
            value={draft.kinds}
            onChange={(kinds) => setDraft((d) => ({ ...d, kinds }))}
            labelOf={(k) => KIND_LABELS[k]}
          />
          <CheckList
            legend="Court"
            options={courts}
            value={draft.courts}
            onChange={(c) => setDraft((d) => ({ ...d, courts: c }))}
            labelOf={(c) => c.replace(", Kollam", "")}
          />
          <CheckList
            legend="Stage"
            options={stages}
            value={draft.stages}
            onChange={(s) => setDraft((d) => ({ ...d, stages: s }))}
          />
          <DateRange
            legend="Due between"
            from={draft.dueFrom}
            to={draft.dueTo}
            onChange={(dueFrom, dueTo) => setDraft((d) => ({ ...d, dueFrom, dueTo }))}
          />
          <DateRange
            legend="Added between"
            from={draft.createdFrom}
            to={draft.createdTo}
            onChange={(createdFrom, createdTo) => setDraft((d) => ({ ...d, createdFrom, createdTo }))}
          />
          <FieldSet>
            <FieldLegend variant="label">Closed tasks</FieldLegend>
            <Field orientation="horizontal" className="items-center gap-3">
              <Checkbox
                id="filter-show-closed"
                checked={draft.showClosed}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, showClosed: !!checked }))}
                className="after:absolute after:-inset-3"
              />
              <FieldLabel htmlFor="filter-show-closed" className="font-normal">
                Show expired and obsolete tasks in Done
              </FieldLabel>
            </Field>
          </FieldSet>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-hairline px-6 py-4">
          <Button
            variant="ghost"
            onClick={() =>
              setDraft({
                kinds: [],
                courts: [],
                stages: [],
                dueFrom: undefined,
                dueTo: undefined,
                createdFrom: undefined,
                createdTo: undefined,
                showClosed: true,
              })
            }
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply filters
          </Button>
        </SheetFooter>
    </>
  );
}
