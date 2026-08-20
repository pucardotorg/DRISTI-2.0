"use client";

import * as React from "react";
import { toast } from "sonner";

import { PAGED_KINDS } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import { type Transition, TransitionError } from "@/lib/tasks/transitions";
import type { Task, TaskId } from "@/lib/tasks/types";

/**
 * The act-modal flavours. Only paying and uploading documents act in the modal (the
 * owner's rule); signing, fixing a return and filing-flow drafts continue in their own
 * full pages — see `actPathOf`.
 */
export type ActMode = "pay" | "file";

const MODE_OF: Partial<Record<Task["kind"], ActMode>> = {
  pay: "pay",
  file: "file",
  draft: "file",
};

/** The act modal for a task, if its kind acts in place. Hearing tasks are done in court. */
export function actModeOf(task: Task): ActMode | null {
  if (!PAGED_KINDS.has(task.kind)) return null;
  return MODE_OF[task.kind] ?? null;
}

/** The full page a task's flow continues on, for the kinds that left the modal. */
export function actPathOf(task: Task): string | null {
  if (task.kind === "sign") return `/tasks/${encodeURIComponent(task.id)}/sign`;
  if (task.kind === "returned") return `/tasks/${encodeURIComponent(task.id)}/fix`;
  return null;
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
