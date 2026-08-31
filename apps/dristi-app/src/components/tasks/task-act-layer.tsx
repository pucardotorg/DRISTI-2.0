"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { verbFor } from "@/lib/tasks/permissions";
import { caseOf } from "@/lib/tasks/selectors";
import { useTasks } from "@/lib/tasks/store";
import { taskHref } from "@/lib/tasks/routes";
import { markDone } from "@/lib/tasks/transitions";
import type { Task } from "@/lib/tasks/types";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { TaskActModal } from "@/components/tasks/act/act-modal";
import {
  type ActMode,
  type Flow,
  actModeOf,
  draftFlowOf,
  FLOW_DIALOG,
  flowPathOf,
  useTaskActions,
} from "@/components/tasks/use-task-actions";

/**
 * Acting on a task from any screen, without leaving it — the same decision
 * table /tasks runs, packaged: pay and file open the act modal in place;
 * signing, fixing a return and continuing a draft go to their own pages behind
 * the dialog that says so; hearing tasks confirm mark-as-done; anything else
 * opens the task on /tasks.
 *
 * `run(task)` routes by the viewer's verb; render `layer` once, anywhere in the
 * tree. Completions land in the shared store, so every surface reading the
 * world updates together.
 */
export function useTaskAct() {
  const store = useTasks();
  const router = useRouter();
  const { act } = useTaskActions();

  const [acting, setActing] = React.useState<{ task: Task; mode: ActMode } | null>(null);
  const [flowNotice, setFlowNotice] = React.useState<{ task: Task; flow: Flow } | null>(null);
  const [confirmDone, setConfirmDone] = React.useState<Task | null>(null);

  const run = React.useCallback(
    (task: Task) => {
      const kase = caseOf({ cases: store.cases }, task);
      if (!kase) return;
      const verb = verbFor(store.user, task, kase);
      switch (verb) {
        case "Pay":
        case "File": {
          const mode = actModeOf(task);
          if (mode) setActing({ task, mode });
          return;
        }
        case "Sign":
          setFlowNotice({ task, flow: "sign" });
          return;
        case "Re-file":
          setFlowNotice({ task, flow: "scrutiny" });
          return;
        case "Continue": {
          const flow = draftFlowOf(task);
          if (flow) setFlowNotice({ task, flow });
          else {
            const mode = actModeOf(task);
            if (mode) setActing({ task, mode });
          }
          return;
        }
        case "Mark done":
          setConfirmDone(task);
          return;
        default:
          // Waiting or closed — nothing to act on here; the task's own page explains.
          router.push(taskHref(task.id));
      }
    },
    [store.cases, store.user, router]
  );

  const actingCase = acting ? (caseOf({ cases: store.cases }, acting.task) ?? null) : null;

  const layer = (
    <>
      <TaskActModal
        task={acting?.task ?? null}
        kase={actingCase}
        mode={acting?.mode ?? null}
        open={!!acting && !!actingCase}
        onOpenChange={(open) => {
          if (!open) setActing(null);
        }}
        onFinished={(id) => store.requestHighlight(id)}
      />

      <ConfirmDialog
        open={!!flowNotice}
        onOpenChange={(open) => !open && setFlowNotice(null)}
        title={flowNotice ? FLOW_DIALOG[flowNotice.flow].title : ""}
        description={flowNotice ? FLOW_DIALOG[flowNotice.flow].description : undefined}
        confirmLabel="Continue"
        destructive={false}
        onConfirm={() => {
          const notice = flowNotice;
          setFlowNotice(null);
          if (notice) router.push(flowPathOf(notice.flow, notice.task));
        }}
      />

      <ConfirmDialog
        open={!!confirmDone}
        onOpenChange={(open) => !open && setConfirmDone(null)}
        title="Mark as done?"
        description={
          confirmDone
            ? `“${confirmDone.title}” — this records that it was completed outside DRISTI. Nothing is sent to the court.`
            : undefined
        }
        confirmLabel="Mark as done"
        destructive={false}
        onConfirm={() => {
          const task = confirmDone;
          setConfirmDone(null);
          if (task) void act(task.id, markDone, "Marked as done");
        }}
      />
    </>
  );

  return { run, layer };
}
