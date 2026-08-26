"use client";

import { advocatesOf } from "@/lib/tasks/permissions";
import type { Case, Person } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PersonAvatar } from "@/components/tasks/person-avatar";

/**
 * The case's advocates as a stack: the main advocate (first on the vakalatnama) first,
 * then the rest; at most `max` faces and a "+n". One tooltip names them all, main first.
 * The DS `AvatarGroup` supplies the rings; faces are the 32px default under a 4px
 * overlap so two initials stay legible (the 24px size under 8px clips them).
 */
export function AdvocateStack({
  kase,
  people,
  user,
  max = 3,
  className,
}: {
  kase: Case;
  people: Person[];
  user: Person;
  max?: number;
  className?: string;
}) {
  const all = advocatesOf(kase, people);
  const shown = all.slice(0, max);
  const rest = all.length - shown.length;
  const names = all
    .map((p, i) => (i < kase.signatories.length ? `${p.name} (on the vakalatnama)` : p.name))
    .join(", ");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AvatarGroup role="group" aria-label={`Advocates: ${names}`} className={cn("w-fit -space-x-1", className)}>
          {shown.map((p) => (
            <PersonAvatar key={p.id} person={p} you={p.id === user.id} size="default" />
          ))}
          {rest > 0 ? (
            <AvatarGroupCount className="bg-surface-sunken text-caption font-medium tabular-nums text-foreground">+{rest}</AvatarGroupCount>
          ) : null}
        </AvatarGroup>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="flex flex-col gap-0.5">
          {all.map((p, i) => (
            <li key={p.id}>
              {p.name}
              {i < kase.signatories.length ? " · on the vakalatnama" : null}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
