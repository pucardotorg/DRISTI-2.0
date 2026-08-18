"use client";

import * as React from "react";
import { toast } from "sonner";

import { PAGED_KINDS } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import { type Transition, TransitionError } from "@/lib/tasks/transitions";
import type { Task, TaskId, Verb } from "@/lib/tasks/types";

/** The act page for a task, if its kind has one. */
export function actHref(task: Task): string | null {
  if (!PAGED_KINDS.has(task.kind)) return null;
  const page = task.kind === "fix-defects" ? "fix" : task.kind;
  return `/tasks/${encodeURIComponent(task.id)}/${page}`;
}

/** Where a row's verb goes: the act page for paged kinds, otherwise the detail panel. */
export function verbTarget(task: Task, verb: Verb): "page" | "panel" {
  if (verb === "Mark done") return "panel";
  return actHref(task) ? "page" : "panel";
}

/**
 * `dispatch` with the toast and error handling every screen wants: a quiet success
 * message, and the transition's own words when it refuses.
 */
export function useTaskActions() {
  const { dispatch, online } = useTasks();
  const [busy, setBusy] = React.useState<TaskId | null>(null);

  const act = React.useCallback(
    async (taskId: TaskId, transition: Transition, done?: string): Promise<Task | null> => {
      if (!online) {
        toast.error("You are offline — nothing was changed.");
        return null;
      }
      setBusy(taskId);
      try {
        const task = await dispatch(taskId, transition);
        if (done) toast.success(done);
        return task;
      } catch (e) {
        const message =
          e instanceof TransitionError ? e.message : "Something went wrong — nothing was changed.";
        toast.error(message);
        return null;
      } finally {
        setBusy(null);
      }
    },
    [dispatch, online]
  );

  return { act, busy, online };
}
