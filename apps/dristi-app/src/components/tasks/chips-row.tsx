"use client";

import { XIcon } from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import { canFinalise } from "@/lib/tasks/permissions";
import { type Counts, KIND_LABELS, type Lens, lensIsNarrowed } from "@/lib/tasks/selectors";
import type { Case, Person } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function Count({ n }: { n: number }) {
  return <span className="text-caption tabular-nums text-muted-foreground">{n}</span>;
}

/** A filter applied in the sheet, echoed here so a short list always shows why. */
function EchoChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-sunken pr-1 pl-3 text-caption font-medium text-foreground">
      {label}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Remove filter: ${label}`}
        onClick={onRemove}
        className="relative size-6 rounded-full after:absolute after:-inset-2"
      >
        <XIcon aria-hidden className="size-3" />
      </Button>
    </span>
  );
}

/** A state lens chip: 32px tall, expanded to the 40px touch floor. */
const LENS_CHIP_CLASS = "relative rounded-full after:absolute after:-inset-1";

/**
 * The chips row: the team as avatar toggles (pressed = that person's tasks), then the
 * state lenses with counts — "Awaiting my approval" only for someone who can approve
 * on at least one case. Filters applied in the sheet echo after them as removable
 * chips, and "Clear all" appears once anything narrows the list.
 */
export function ChipsRow({
  lens,
  counts,
  people,
  cases,
  user,
  onChange,
  onClearAll,
}: {
  lens: Lens;
  counts: Counts;
  people: Person[];
  cases: Case[];
  user: Person;
  onChange: (patch: Partial<Lens>) => void;
  onClearAll: () => void;
}) {
  const approves = cases.some((c) => canFinalise(user, c));
  const stateValues = [
    lens.blocking && "blocking",
    lens.approval && "approval",
    lens.unassigned && "unassigned",
  ].filter(Boolean) as string[];

  const echoes: { key: string; label: string; remove: () => void }[] = [
    ...lens.kinds.map((k) => ({
      key: `kind-${k}`,
      label: KIND_LABELS[k],
      remove: () => onChange({ kinds: lens.kinds.filter((x) => x !== k) }),
    })),
    ...lens.courts.map((c) => ({
      key: `court-${c}`,
      label: c.replace(", Kollam", ""),
      remove: () => onChange({ courts: lens.courts.filter((x) => x !== c) }),
    })),
    ...lens.stages.map((s) => ({
      key: `stage-${s}`,
      label: s,
      remove: () => onChange({ stages: lens.stages.filter((x) => x !== s) }),
    })),
  ];
  if (lens.dueFrom || lens.dueTo) {
    echoes.push({
      key: "due",
      label: `Due ${lens.dueFrom ? longDate(lens.dueFrom) : "…"} – ${lens.dueTo ? longDate(lens.dueTo) : "…"}`,
      remove: () => onChange({ dueFrom: undefined, dueTo: undefined }),
    });
  }
  if (lens.createdFrom || lens.createdTo) {
    echoes.push({
      key: "created",
      label: `Added ${lens.createdFrom ? longDate(lens.createdFrom) : "…"} – ${lens.createdTo ? longDate(lens.createdTo) : "…"}`,
      remove: () => onChange({ createdFrom: undefined, createdTo: undefined }),
    });
  }
  if (!lens.showClosed) {
    echoes.push({
      key: "closed",
      label: "Hiding expired and obsolete",
      remove: () => onChange({ showClosed: true }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <span id="people-filter-label" className="sr-only">
          Whose tasks
        </span>
        <ToggleGroup
          type="multiple"
          value={lens.people}
          onValueChange={(people) => onChange({ people })}
          aria-labelledby="people-filter-label"
          spacing={1}
        >
          {people.map((p) => {
            const n = counts.people[p.id] ?? 0;
            const you = p.id === user.id;
            return (
              <Tooltip key={p.id}>
                <TooltipTrigger asChild>
                  {/* The Tooltip trigger overwrites the toggle's `data-state`, so the on-state
                      is styled through `aria-pressed`, which the toggle keeps. */}
                  <ToggleGroupItem
                    value={p.id}
                    aria-label={`${p.name}${you ? " (you)" : ""}, ${n} tasks`}
                    className={cn(
                      "size-10 rounded-full p-0 text-caption font-semibold aria-pressed:bg-brand-muted aria-pressed:text-brand-muted-foreground aria-pressed:ring-2 aria-pressed:ring-brand-accent aria-pressed:ring-inset",
                      you
                        ? "bg-brand-muted text-brand-muted-foreground hover:bg-brand-muted-hover"
                        : "bg-surface-sunken text-foreground"
                    )}
                  >
                    {p.initials}
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  {p.name}
                  {you ? " (you)" : ""} · {n}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroup>
      </div>

      <ToggleGroup
        type="multiple"
        variant="outline"
        value={stateValues}
        onValueChange={(v) =>
          onChange({
            blocking: v.includes("blocking"),
            approval: v.includes("approval"),
            unassigned: v.includes("unassigned"),
          })
        }
        aria-label="Task lenses"
        className="flex-wrap"
      >
        <ToggleGroupItem value="blocking" className={LENS_CHIP_CLASS}>
          Blocking a hearing <Count n={counts.blocking} />
        </ToggleGroupItem>
        {approves ? (
          <ToggleGroupItem value="approval" className={LENS_CHIP_CLASS}>
            Awaiting my approval <Count n={counts.approval} />
          </ToggleGroupItem>
        ) : null}
        <ToggleGroupItem value="unassigned" className={LENS_CHIP_CLASS}>
          Unassigned <Count n={counts.unassigned} />
        </ToggleGroupItem>
      </ToggleGroup>

      {echoes.length ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
          {echoes.map((e) => (
            <li key={e.key}>
              <EchoChip label={e.label} onRemove={e.remove} />
            </li>
          ))}
        </ul>
      ) : null}

      {lensIsNarrowed(lens) ? (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
