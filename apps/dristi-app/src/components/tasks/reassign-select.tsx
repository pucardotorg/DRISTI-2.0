"use client";

import { canView } from "@/lib/tasks/permissions";
import type { Case, Person, PersonId } from "@/lib/tasks/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNASSIGNED = "__unassigned__";

/**
 * Who a task is assigned to — anyone with access to the case, or nobody. Anyone with
 * access may change it; the change is written to the task's history.
 */
export function ReassignSelect({
  id,
  value,
  kase,
  people,
  user,
  disabled,
  onChange,
  className,
}: {
  id?: string;
  value: PersonId | undefined;
  kase: Case | Case[];
  people: Person[];
  user: Person;
  disabled?: boolean;
  onChange: (assigneeId: PersonId | undefined) => void;
  className?: string;
}) {
  const cases = Array.isArray(kase) ? kase : [kase];
  // For a bulk reassign the person must have access to every selected case.
  const eligible = people.filter((p) => cases.every((c) => canView(p, c)));
  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? undefined : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className} aria-label="Assigned to">
        <SelectValue placeholder="Assigned to" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {eligible.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
            {p.id === user.id ? " (you)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
