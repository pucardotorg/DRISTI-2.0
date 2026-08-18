"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/tasks/types";

/**
 * One person's initials as a DS Avatar. "You" keeps the brand tint; teammates read as
 * quiet surface chips — the home board's convention, so the same person looks the same
 * on every screen.
 */
export function PersonAvatar({
  person,
  you,
  size = "sm",
  className,
}: {
  person: Person;
  you?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} title={person.name} className={className}>
      <AvatarFallback
        className={cn(
          "font-medium",
          size === "sm" ? "text-caption" : "text-body-compact",
          you
            ? "bg-brand-muted text-brand-muted-foreground"
            : "bg-surface-sunken text-foreground"
        )}
      >
        {person.initials}
      </AvatarFallback>
      <span className="sr-only"> — {person.name}</span>
    </Avatar>
  );
}
