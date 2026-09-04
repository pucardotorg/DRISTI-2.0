"use client";

/**
 * The respond dialog: a review task's one act. The addressee reads what is being
 * asked and answers it — accept or decline, with an optional note either way. A
 * decision is a sentence, not a flow, so it acts in place like pay and file do;
 * the row updates and nothing navigates.
 */

import * as React from "react";

import { dateTime } from "@/lib/tasks/format";
import { respond } from "@/lib/tasks/transitions";
import type { Case, Task } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTaskActions } from "@/components/tasks/use-task-actions";

export function TaskRespondDialog({
  task,
  kase,
  open,
  onOpenChange,
  onFinished,
}: {
  task: Task | null;
  kase: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the task id once the decision lands — the row flashes. */
  onFinished?: (taskId: string) => void;
}) {
  const { act, busy } = useTaskActions();
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);

  async function decide(accepted: boolean) {
    if (!task) return;
    const done = await act(
      task.id,
      (t, ctx) => respond(t, ctx, accepted, note),
      accepted ? "Request accepted" : "Request declined"
    );
    if (done) {
      onOpenChange(false);
      onFinished?.(task.id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review the request</DialogTitle>
          <DialogDescription>
            {kase ? `${kase.parties} · ${kase.stNumber}` : null}
          </DialogDescription>
        </DialogHeader>

        {task ? (
          <div className="space-y-4">
            <div className="space-y-1 rounded-lg bg-surface-sunken p-4">
              <p className="text-body-compact font-medium">{task.why.event}</p>
              <p className="text-caption text-muted-foreground">{dateTime(task.why.at)}</p>
            </div>
            <p className="text-body-compact text-muted-foreground">{task.whatToDo}</p>
            <div className="space-y-2">
              <Label htmlFor="respond-note">Note (optional)</Label>
              <Textarea
                id="respond-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Goes back with your answer"
                rows={2}
              />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => void decide(false)}
          >
            Decline
          </Button>
          <Button type="button" disabled={!!busy} onClick={() => void decide(true)}>
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
