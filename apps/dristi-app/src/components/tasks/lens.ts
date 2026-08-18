"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_LENS, type GroupKey, type Lens, type SortKey } from "@/lib/tasks/selectors";
import type { TaskKind, TaskView } from "@/lib/tasks/types";

const LAST_LENS_KEY = "dristi-tasks:lens";

const VIEWS: TaskView[] = ["todo", "waiting", "done"];
const SORTS: SortKey[] = ["urgency", "due", "case", "recent"];
const GROUPS: GroupKey[] = ["band", "case", "kind", "person"];
const KINDS: TaskKind[] = ["sign", "pay", "submit", "fix-defects", "respond", "appear", "other"];

function list(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

function oneOf<T extends string>(v: string | null, allowed: T[], fallback: T): T {
  return v && (allowed as string[]).includes(v) ? (v as T) : fallback;
}

/** URL → lens. Unknown values fall back to defaults; nothing throws. */
export function parseLens(params: URLSearchParams): Lens {
  return {
    view: oneOf(params.get("view"), VIEWS, DEFAULT_LENS.view),
    q: params.get("q") ?? "",
    people: list(params.get("people")),
    blocking: params.get("blocking") === "1",
    approval: params.get("approval") === "1",
    unassigned: params.get("unassigned") === "1",
    kinds: list(params.get("kind")).filter((k): k is TaskKind => (KINDS as string[]).includes(k)),
    courts: list(params.get("court")),
    stages: list(params.get("stage")),
    dueFrom: params.get("dueFrom") ?? undefined,
    dueTo: params.get("dueTo") ?? undefined,
    createdFrom: params.get("createdFrom") ?? undefined,
    createdTo: params.get("createdTo") ?? undefined,
    showClosed: params.get("closed") !== "0",
    sort: oneOf(params.get("sort"), SORTS, DEFAULT_LENS.sort),
    group: oneOf(params.get("group"), GROUPS, DEFAULT_LENS.group),
  };
}

/** Lens → URL. Defaults are omitted so the shareable URL stays short. */
export function serializeLens(lens: Lens): URLSearchParams {
  const p = new URLSearchParams();
  if (lens.view !== DEFAULT_LENS.view) p.set("view", lens.view);
  if (lens.q.trim()) p.set("q", lens.q.trim());
  if (lens.people.length) p.set("people", lens.people.join(","));
  if (lens.blocking) p.set("blocking", "1");
  if (lens.approval) p.set("approval", "1");
  if (lens.unassigned) p.set("unassigned", "1");
  if (lens.kinds.length) p.set("kind", lens.kinds.join(","));
  if (lens.courts.length) p.set("court", lens.courts.join(","));
  if (lens.stages.length) p.set("stage", lens.stages.join(","));
  if (lens.dueFrom) p.set("dueFrom", lens.dueFrom);
  if (lens.dueTo) p.set("dueTo", lens.dueTo);
  if (lens.createdFrom) p.set("createdFrom", lens.createdFrom);
  if (lens.createdTo) p.set("createdTo", lens.createdTo);
  if (!lens.showClosed) p.set("closed", "0");
  if (lens.sort !== DEFAULT_LENS.sort) p.set("sort", lens.sort);
  if (lens.group !== DEFAULT_LENS.group) p.set("group", lens.group);
  return p;
}

/** The last lens this browser used — restored when arriving at a bare `/tasks`. */
export function rememberLens(lens: Lens): void {
  try {
    localStorage.setItem(LAST_LENS_KEY, serializeLens(lens).toString());
  } catch {
    /* private mode; nothing to do */
  }
}

export function recallLens(): string | null {
  try {
    return localStorage.getItem(LAST_LENS_KEY);
  } catch {
    return null;
  }
}

/**
 * The lens and the open task, read from and written to the URL. `replace` + no scroll,
 * so typing in the search box does not pile up history entries or jump the page.
 */
export function useLens() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const lens = React.useMemo(() => parseLens(params), [params]);
  const taskId = params.get("task");

  const write = React.useCallback(
    (nextLens: Lens, nextTask: string | null) => {
      const p = serializeLens(nextLens);
      if (nextTask) p.set("task", nextTask);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      rememberLens(nextLens);
    },
    [pathname, router]
  );

  const setLens = React.useCallback(
    (patch: Partial<Lens> | ((prev: Lens) => Lens)) => {
      const next = typeof patch === "function" ? patch(lens) : { ...lens, ...patch };
      write(next, taskId);
    },
    [lens, taskId, write]
  );

  const setTaskId = React.useCallback(
    (id: string | null) => write(lens, id),
    [lens, write]
  );

  // Arriving at a bare `/tasks` restores the last lens this browser used.
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (params.toString()) return;
    const last = recallLens();
    if (last) router.replace(`${pathname}?${last}`, { scroll: false });
  }, [params, pathname, router]);

  return { lens, setLens, taskId, setTaskId };
}
