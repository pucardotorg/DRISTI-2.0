"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import type { Case, Person, PersonId, Task } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReassignSelect } from "@/components/tasks/reassign-select";

/**
 * The bulk bar — present only while something is selected. Reassign always; Approve &
 * sign when every selected task is awaiting this person's approval; Mark done when every
 * selected task allows it. It sits under the sticky top bar so it stays reachable.
 */
export function BulkBar({
  selected,
  cases,
  people,
  user,
  canApproveAll,
  canMarkDoneAll,
  disabled,
  onReassign,
  onApproveAll,
  onMarkDoneAll,
  onClear,
}: {
  selected: Task[];
  cases: Case[];
  people: Person[];
  user: Person;
  canApproveAll: boolean;
  canMarkDoneAll: boolean;
  disabled: boolean;
  onReassign: (assigneeId: PersonId | undefined) => void;
  onApproveAll: () => void;
  onMarkDoneAll: () => void;
  onClear: () => void;
}) {
  const selectedCases = React.useMemo(
    () => cases.filter((c) => selected.some((t) => t.caseId === c.id)),
    [cases, selected]
  );
  const shared =
    selected.every((t) => t.assigneeId === selected[0]?.assigneeId) ? selected[0]?.assigneeId : undefined;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky top-14 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-card px-4 py-3 shadow-raised"
    >
      <span className="text-body-compact font-medium tabular-nums">
        {selected.length} selected
      </span>
      <div className="flex items-center gap-2">
        <Label htmlFor="bulk-reassign" className="text-caption text-muted-foreground">
          Reassign
        </Label>
        <ReassignSelect
          id="bulk-reassign"
          value={shared}
          kase={selectedCases}
          people={people}
          user={user}
          disabled={disabled}
          onChange={onReassign}
          className="w-48"
        />
      </div>
      {canApproveAll ? (
        <Button variant="outline" disabled={disabled} onClick={onApproveAll}>
          Approve &amp; sign {selected.length}
        </Button>
      ) : null}
      {canMarkDoneAll ? (
        <Button variant="outline" disabled={disabled} onClick={onMarkDoneAll}>
          Mark {selected.length} done
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
        <XIcon data-icon="inline-start" aria-hidden />
        Clear
      </Button>
    </div>
  );
}
