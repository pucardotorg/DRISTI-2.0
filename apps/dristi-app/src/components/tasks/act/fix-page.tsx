"use client";

/**
 * Fix defects — each scrutiny remark as a row: tick it fixed, attach a replacement if
 * one is needed. Re-submit is enabled only when every defect is ticked; a signatory
 * re-submits (confirmed), a member sends the cured filing for approval. Once
 * re-submitted the rail carries the registry sandbox again.
 */

import * as React from "react";
import { SendIcon } from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import { approveAndSign, setDefect, submit } from "@/lib/tasks/transitions";
import type { Defect, StoredFileRef } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PANEL_CLASS } from "@/components/shell/panel";
import { useTaskActions } from "@/components/tasks/use-task-actions";
import {
  ActColumns,
  ActFrame,
  type ActContext,
  ApproveCard,
  CourtSandbox,
  FileChip,
  FileSlot,
  finaliserLine,
  PrepareCard,
  RailCard,
  RecordCard,
  TakeOverNote,
  useActContext,
  ViewOnlyCard,
  WaitingCard,
} from "@/components/tasks/act/shared";

function DefectRow({
  ctx,
  defect,
  editable,
}: {
  ctx: ActContext;
  defect: Defect;
  editable: boolean;
}) {
  const { task, online } = ctx;
  const { act, busy } = useTaskActions();
  const id = `defect-${defect.n}-fixed`;
  const disabled = !editable || !online || !!busy;
  const setFixed = (fixed: boolean, replacement?: StoredFileRef) =>
    void act(task.id, (t, c) => setDefect(t, c, defect.n, fixed, replacement));

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={defect.fixed}
          disabled={disabled}
          onCheckedChange={(v) => setFixed(!!v)}
          className="mt-0.5 after:absolute after:-inset-3"
        />
        <Label htmlFor={id} className={cn("flex-1 text-body-compact font-normal leading-snug", defect.fixed && "text-muted-foreground")}>
          <span className="mr-2 font-medium tabular-nums">{defect.n}.</span>
          {defect.text}
        </Label>
        <span className={cn("shrink-0 text-caption", defect.fixed ? "text-success-ink" : "text-muted-foreground")}>
          {defect.fixed ? "Fixed" : "Open"}
        </span>
      </div>
      <div className="pl-7">
        {editable ? (
          <ul>
            <FileSlot
              name={`Replacement for defect ${defect.n}`}
              file={defect.replacement}
              disabled={disabled}
              optional
              onFile={(ref) => setFixed(true, ref)}
              onRemove={() => setFixed(defect.fixed, undefined)}
            />
          </ul>
        ) : defect.replacement ? (
          <FileChip file={defect.replacement} />
        ) : null}
      </div>
    </li>
  );
}

function ResubmitCard({ ctx, complete }: { ctx: ActContext; complete: boolean }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [confirm, setConfirm] = React.useState(false);
  return (
    <RailCard
      title={ctx.takingOver ? "Take over and re-submit" : "Re-submit"}
      description={finaliserLine(ctx, "Re-submitting")}
    >
      <TakeOverNote ctx={ctx} />
      <Button size="lg" disabled={!online || !!busy || !complete} onClick={() => setConfirm(true)}>
        <SendIcon data-icon="inline-start" aria-hidden />
        Re-submit to court
      </Button>
      <p className="text-caption text-muted-foreground">
        {complete ? "Every defect is marked fixed." : "Mark every defect fixed to enable re-submission."}
      </p>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-submit to the court?</AlertDialogTitle>
            <AlertDialogDescription>
              The cured filing goes back to the registry for scrutiny. In the live service this cannot be recalled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirm(false);
                const t = await act(task.id, submit);
                if (t) finish("Re-submitted — awaiting scrutiny");
              }}
            >
              Re-submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RailCard>
  );
}

export function FixPage() {
  const ctx = useActContext();
  return (
    <ActFrame
      ctx={ctx}
      action="Fix defects"
      sandbox="Replacements stay in this browser and the registry's answer is whatever you pick. Nothing is sent to a court."
    >
      {(c) => {
        const { task, finaliser, approver, preparer, online, finish } = c;
        const defects = task.defects ?? [];
        const complete = defects.length > 0 && defects.every((d) => d.fixed);
        const closed = ["done", "expired", "obsolete"].includes(task.status);
        const editable =
          ["open", "in-progress", "draft", "sent-back"].includes(task.status) && (finaliser || preparer);

        let rail: React.ReactNode;
        if (task.status === "done") rail = <RecordCard ctx={c} title="Accepted by the registry" />;
        else if (closed) rail = <RecordCard ctx={c} title={task.status === "expired" ? "Expired" : "No longer required"} />;
        else if (task.status === "awaiting-court") rail = <CourtSandbox ctx={c} />;
        else if (task.status === "awaiting-approval") {
          rail = approver ? (
            <ApproveCard
              ctx={c}
              title="Approve and re-submit"
              approve={<ApproveResubmit ctx={c} online={online} finish={finish} />}
            />
          ) : (
            <WaitingCard ctx={c} />
          );
        } else if (finaliser) rail = <ResubmitCard ctx={c} complete={complete} />;
        else if (preparer) rail = <PrepareCard ctx={c} what="re-submit it" />;
        else rail = <ViewOnlyCard ctx={c} why="You can see this case but cannot act on this task." />;

        return (
          <ActColumns
            main={
              <Card className={cn(PANEL_CLASS, "gap-4")}>
                <CardHeader>
                  <CardTitle className="text-body font-semibold">
                    {defects.length} defect{defects.length === 1 ? "" : "s"} from scrutiny
                  </CardTitle>
                  <p className="text-body-compact text-muted-foreground tabular-nums">
                    {defects.filter((d) => d.fixed).length} of {defects.length} fixed
                    {task.deadlineNote ? ` · ${task.deadlineNote}` : task.dueAt ? ` · due ${longDate(task.dueAt)}` : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  <ol className="divide-y divide-hairline">
                    {defects.map((d) => (
                      <DefectRow key={d.n} ctx={c} defect={d} editable={!!editable} />
                    ))}
                  </ol>
                </CardContent>
              </Card>
            }
            rail={rail}
          />
        );
      }}
    </ActFrame>
  );
}

function ApproveResubmit({ ctx, online, finish }: { ctx: ActContext; online: boolean; finish: ActContext["finish"] }) {
  const { act, busy } = useTaskActions();
  return (
    <Button
      size="lg"
      disabled={!online || !!busy}
      onClick={async () => {
        const t = await act(ctx.task.id, approveAndSign);
        if (t) finish("Approved and re-submitted — awaiting scrutiny");
      }}
    >
      <SendIcon data-icon="inline-start" aria-hidden />
      Approve &amp; re-submit
    </Button>
  );
}
