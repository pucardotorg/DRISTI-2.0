"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { areaOf, ORIGIN_PARAM, originCrumb } from "@/lib/nav/origin";

/**
 * The URL of the screen this is called from, as a relative path — what to hand
 * `withOrigin` when linking somewhere else, so the way back is this exact view.
 *
 * Any `from` already on this URL is dropped: the trail is one hop deep on purpose. A
 * chain of doors would encode a whole history in the address bar and grow without limit,
 * and the crumb only ever needs to name the last one.
 */
export function useHereHref(): string {
  const pathname = usePathname();
  const params = useSearchParams();
  const next = new URLSearchParams(params?.toString() ?? "");
  next.delete(ORIGIN_PARAM);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * The door this screen was reached through — only when it is in another area.
 *
 * A door inside the same area is not news: the trail the route already produces names
 * that area and, for a task, names the task on the way to it, which is richer than
 * anything the origin could add. It is the crossing that the route cannot see — the
 * filings queue opening a screen that lives under `/tasks` — that needs recording.
 */
export function useOrigin(): { label: string; href: string } | null {
  const params = useSearchParams();
  const pathname = usePathname();
  const crumb = originCrumb(params?.get(ORIGIN_PARAM));
  if (!crumb) return null;
  return crumb.label === areaOf(pathname).label ? null : crumb;
}
