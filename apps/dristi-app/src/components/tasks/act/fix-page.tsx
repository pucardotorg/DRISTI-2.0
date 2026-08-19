"use client";

/**
 * Fix & re-file — each scrutiny defect as a row: tick it fixed, attach a replacement if
 * one is needed. Re-file is enabled only when every defect is ticked; a signatory
 * re-files (confirmed), anyone else on the case cures the defects and marks it ready.
 * Once re-filed the rail carries the registry sandbox again.
 */

import * as React from "react";
import { SendIcon } from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import { TERMINAL } from "@/lib/tasks/permissions";
import { fixDefect, refile } from "@/lib/tasks/transitions";
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
  closedTitle,
  CourtSandbox,
  FileChip,
  FileSlot,
  PrepareCard,
  PreparedNote,
  RailCard,
  RecordCard,
  signatoryLine,
  useActContext,
} from "@/components/tasks/act/shared";

function DefectRow({ ctx, defect, editable }: { ctx: ActContext; defect: Defect; editable: boolean }) {
  const { task, online } = ctx;
  const { act, busy } = useTaskActions();
  const id = `defect-${defect.n}-fixed`;
  const disabled = !editable || !online || !!busy;
  const setFixed = (fixed: boolean, replacement?: StoredFileRef) =>
    void act(task.id, (t, c) => fixDefect(t, c, defect.n, fixed, replacement));

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={defect.fixed}
          disabled={disabled}
          onCheckedChange={(v) => setFixed(!!v)}
          className="mt-0.5"
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

function RefileCard({ ctx, complete }: { ctx: ActContext; complete: boolean }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [confirm, setConfirm] = React.useState(false);
  return (
    <RailCard title="Re-file" description={signatoryLine(ctx, "Re-filing")}>
      <PreparedNote ctx={ctx} />
      <Button size="lg" disabled={!online || !!busy || !complete} onClick={() => setConfirm(true)}>
        <SendIcon data-icon="inline-start" aria-hidden />
        Re-file with the court
      </Button>
      <p className="text-caption text-muted-foreground">
        {complete ? "Every defect is marked fixed." : "Mark every defect fixed to enable re-filing."}
      </p>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-file with the court?</AlertDialogTitle>
            <AlertDialogDescription>
              The cured filing goes back to the registry for scrutiny. In the live service this cannot be recalled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirm(false);
                const t = await act(task.id, refile);
                if (t) finish("Re-filed — awaiting scrutiny");
              }}
            >
              Re-file
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
      action="Fix & re-file"
      sandbox="Replacements stay in this browser and the registry's answer is whatever you pick. Nothing is sent to a court."
    >
      {(c) => {
        const { task, signatory } = c;
        const defects = task.returned?.defects ?? [];
        const complete = defects.length > 0 && defects.every((d) => d.fixed);
        const editable = ["open", "draft", "ready"].includes(task.status);

        let rail: React.ReactNode;
        if (TERMINAL.has(task.status)) rail = <RecordCard ctx={c} title={closedTitle(task, "Accepted by the registry")} />;
        else if (task.status === "awaiting-court") rail = <CourtSandbox ctx={c} />;
        else if (signatory) rail = <RefileCard ctx={c} complete={complete} />;
        else rail = <PrepareCard ctx={c} what="re-file" complete={complete} />;

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
                      <DefectRow key={d.n} ctx={c} defect={d} editable={editable} />
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
