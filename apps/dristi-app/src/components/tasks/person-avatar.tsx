"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/tasks/types";

/**
 * The surface a disc is sitting on. One word decides the fill, because a disc
 * that shares its card's token has nothing separating it but the DS's own edge
 * — which is exactly what the owner saw on the beige queue. The fill is always
 * one step *off* the surface, so the disc reads on white, on sunken and on the
 * brand tint without a per-case rule.
 */
export type AvatarSurface = "card" | "sunken" | "brand";

/**
 * One person's initials as a DS Avatar. "You" keeps the brand tint; teammates read as
 * quiet surface chips — the home board's convention, so the same person looks the same
 * on every screen. The separator between overlapping discs is the DS Avatar's own
 * `after:border-border mix-blend-darken` edge, which darkens whatever fill it lands on;
 * the group's ring is the *surface*, punching a clean hole rather than drawing a line.
 */
export function PersonAvatar({
  person,
  you,
  size = "sm",
  surface = "card",
  label,
  className,
}: {
  person: Person;
  you?: boolean;
  size?: "sm" | "default" | "lg";
  surface?: AvatarSurface;
  /**
   * What names this disc, when the caller names it richly (the home stack's
   * vakalatnama/case-access tooltip). The native `title` steps aside so a Radix
   * tooltip is not racing one the browser drew.
   */
  label?: string;
  className?: string;
}) {
  return (
    <Avatar
      size={size}
      title={label ? undefined : person.name}
      className={className}
    >
      <AvatarFallback
        className={cn(
          "font-medium",
          size === "sm" ? "text-caption" : "text-body-compact",
          you
            ? "bg-brand-muted text-brand-muted-foreground"
            : surface === "card"
              ? "bg-surface-sunken text-foreground"
              : "bg-card text-foreground"
        )}
      >
        {person.initials}
      </AvatarFallback>
      <span className="sr-only">{label ?? ` — ${person.name}`}</span>
    </Avatar>
  );
}
