"use client";

/**
 * Submit — the documents the court asked for, one slot each with a real file picker
 * (PDF or images, stored in the browser). A signatory submits to the court (confirmed
 * first) and the task waits on scrutiny; a member fills the slots and sends it for
 * approval. On an awaiting-court task the rail carries the registry sandbox: accept, or
 * return with defects — which creates the fix-defects task.
 */

import * as React from "react";
import { SendIcon } from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import { approveAndSign, saveDraft, submit } from "@/lib/tasks/transitions";
import type { StoredFileRef } from "@/lib/tasks/types";
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

/** The slots, editable while the task is open to this person. */
function Documents({
  ctx,
  files,
  editable,
  onChange,
}: {
  ctx: ActContext;
  files: StoredFileRef[];
  editable: boolean;
  onChange: (files: StoredFileRef[]) => void;
}) {
  const { task, online } = ctx;
  const slots = task.documentsNeeded?.length ? task.documentsNeeded : ["Document"];
  const loose = files.filter((f) => !f.slot || !slots.includes(f.slot));
  const filled = slots.filter((s) => files.some((f) => f.slot === s)).length;

  return (
    <Card className={cn(PANEL_CLASS, "gap-4")}>
      <CardHeader>
        <CardTitle className="text-body font-semibold">Documents needed</CardTitle>
        <p className="text-body-compact text-muted-foreground tabular-nums">
          {filled} of {slots.length} attached
          {task.deadlineNote ? ` · ${task.deadlineNote}` : task.dueAt ? ` · due ${longDate(task.dueAt)}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-hairline">
          {slots.map((slot) => {
            const file = files.find((f) => f.slot === slot);
            return editable ? (
              <FileSlot
                key={slot}
                name={slot}
                file={file}
                disabled={!online}
                onFile={(ref) => onChange([...files.filter((f) => f.slot !== slot), ref])}
                onRemove={() => onChange(files.filter((f) => f !== file))}
              />
            ) : (
              <li key={slot} className="flex flex-col gap-2 py-3">
                <p className="text-body-compact font-medium">{slot}</p>
                {file ? <FileChip file={file} /> : <p className="text-caption text-muted-foreground">Not attached</p>}
              </li>
            );
          })}
          {loose.map((f) => (
            <li key={f.id} className="py-3">
              <FileChip file={f} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** A signatory's submit rail: save what is attached, then submit to the court. */
function SubmitCard({ ctx, files, complete }: { ctx: ActContext; files: StoredFileRef[]; complete: boolean }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [confirm, setConfirm] = React.useState(false);
  const n = files.length;
  return (
    <RailCard
      title={ctx.takingOver ? "Take over and submit" : "Submit to court"}
      description={finaliserLine(ctx, "Submitting")}
    >
      <TakeOverNote ctx={ctx} />
      <div className="flex flex-col gap-2">
        <Button size="lg" disabled={!online || !!busy || !complete} onClick={() => setConfirm(true)}>
          <SendIcon data-icon="inline-start" aria-hidden />
          Submit to court
        </Button>
        {!complete ? (
          <p className="text-caption text-muted-foreground">Attach every document before submitting.</p>
        ) : null}
        <Button
          variant="ghost"
          disabled={!online || !!busy}
          onClick={() => void act(task.id, (t, c) => saveDraft(t, c, {}, files), "Draft saved")}
        >
          Save for later
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">Sandbox — nothing reaches the registry.</p>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit to the court?</AlertDialogTitle>
            <AlertDialogDescription>
              {n === 1 ? "1 document goes" : `${n} documents go`} to the registry for scrutiny. In the live
              service this cannot be recalled; defects come back as a new task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirm(false);
                const t = await act(task.id, (x, c) => submit(x, c, files));
                if (t) finish("Submitted — awaiting scrutiny");
              }}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RailCard>
  );
}

function ApproveSubmit({ ctx }: { ctx: ActContext }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  return (
    <ApproveCard
      ctx={ctx}
      title="Approve and submit"
      description="Your signature goes on the submission — read what was attached before you approve."
      approve={
        <Button
          size="lg"
          disabled={!online || !!busy}
          onClick={async () => {
            const t = await act(task.id, approveAndSign);
            if (t) finish("Approved and submitted — awaiting scrutiny");
          }}
        >
          <SendIcon data-icon="inline-start" aria-hidden />
          Approve &amp; submit
        </Button>
      }
    />
  );
}

export function SubmitPage() {
  const ctx = useActContext();
  return (
    <ActFrame
      ctx={ctx}
      action="Submit"
      sandbox="Uploads stay in this browser and the registry's answer is whatever you pick. Nothing is sent to a court."
    >
      {(c) => <SubmitBody ctx={c} />}
    </ActFrame>
  );
}

function SubmitBody({ ctx }: { ctx: ActContext }) {
  const { task, finaliser, approver, preparer } = ctx;
  const [files, setFiles] = React.useState<StoredFileRef[]>(task.files ?? []);
  const slots = task.documentsNeeded?.length ? task.documentsNeeded : ["Document"];
  const complete = slots.every((s) => files.some((f) => f.slot === s));
  const closed = ["done", "expired", "obsolete"].includes(task.status);
  const editable =
    !closed &&
    ["open", "in-progress", "draft", "sent-back"].includes(task.status) &&
    (finaliser || preparer);

  let rail: React.ReactNode;
  if (task.status === "done") rail = <RecordCard ctx={ctx} title="Accepted by the registry" />;
  else if (closed) rail = <RecordCard ctx={ctx} title={task.status === "expired" ? "Expired" : "No longer required"} />;
  else if (task.status === "awaiting-court") rail = <CourtSandbox ctx={ctx} />;
  else if (task.status === "awaiting-approval") rail = approver ? <ApproveSubmit ctx={ctx} /> : <WaitingCard ctx={ctx} />;
  else if (finaliser) rail = <SubmitCard ctx={ctx} files={files} complete={complete} />;
  else if (preparer) rail = <PrepareCard ctx={ctx} what="submit it" files={files} />;
  else rail = <ViewOnlyCard ctx={ctx} why="You can see this case but cannot act on this task." />;

  return (
    <ActColumns
      main={<Documents ctx={ctx} files={files} editable={editable} onChange={setFiles} />}
      rail={rail}
    />
  );
}
