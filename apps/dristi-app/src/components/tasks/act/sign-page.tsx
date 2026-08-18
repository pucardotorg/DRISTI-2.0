"use client";

/**
 * Sign — the document on the left, the signing well on the right. A signatory e-signs
 * with an Aadhaar OTP (sandbox: any 6 digits) and the task closes by event with the
 * stamp on the preview. A member prepares (a note, an optional upload) and sends it for
 * approval; the approver sees what was prepared, then approves and signs — their own
 * signature is applied — or sends it back with a note.
 */

import * as React from "react";
import { SignatureIcon } from "lucide-react";

import { approveAndSign, sign } from "@/lib/tasks/transitions";
import type { StoredFileRef } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { useTaskActions } from "@/components/tasks/use-task-actions";
import { CourtDocument } from "@/components/tasks/act/court-document";
import {
  ActColumns,
  ActFrame,
  type ActContext,
  ApproveCard,
  FileChip,
  FileSlot,
  finaliserLine,
  OtpDialog,
  PrepareCard,
  RailCard,
  RecordCard,
  TakeOverNote,
  useActContext,
  ViewOnlyCard,
  WaitingCard,
} from "@/components/tasks/act/shared";

/** The signatory's own signing well. */
function SignCard({ ctx }: { ctx: ActContext }) {
  const { task, user, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [otpOpen, setOtpOpen] = React.useState(false);
  return (
    <RailCard
      title={ctx.takingOver ? "Take over and sign" : "Add your signature"}
      description={finaliserLine(ctx, "Signing")}
    >
      <TakeOverNote ctx={ctx} />
      {ctx.takingOver && task.files?.length ? (
        <ul className="flex flex-col gap-1">
          {task.files.map((f) => (
            <li key={f.id}>
              <FileChip file={f} />
            </li>
          ))}
        </ul>
      ) : null}
      <Button size="lg" disabled={!online || !!busy} onClick={() => setOtpOpen(true)}>
        <SignatureIcon data-icon="inline-start" aria-hidden />
        E-Sign with Aadhaar OTP
      </Button>
      <p className="text-caption text-muted-foreground">
        The signed document is attached to the task and the case file. Sandbox — nothing reaches a court.
      </p>
      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        signer={user}
        onSign={async () => {
          setOtpOpen(false);
          const t = await act(task.id, sign);
          if (t) finish(`Signed — ${t.completion?.receipt ?? ""}`);
        }}
      />
    </RailCard>
  );
}

/** A member's preparation: a note, and an optional upload of a draft. */
function PrepareSign({ ctx }: { ctx: ActContext }) {
  const { task, online } = ctx;
  const [files, setFiles] = React.useState<StoredFileRef[]>(task.files ?? []);
  const draft = files.find((f) => f.slot === "Draft for signature");
  return (
    <PrepareCard ctx={ctx} what="sign it" files={files}>
      <ul className="divide-y divide-hairline">
        <FileSlot
          name="Draft for signature"
          file={draft}
          disabled={!online}
          optional
          onFile={(ref) => setFiles((prev) => [...prev.filter((f) => f.slot !== ref.slot), ref])}
          onRemove={() => setFiles((prev) => prev.filter((f) => f !== draft))}
        />
      </ul>
    </PrepareCard>
  );
}

/** The approver's well: what was prepared, then approve & sign (OTP) or send back. */
function ApproveSign({ ctx }: { ctx: ActContext }) {
  const { task, user, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [otpOpen, setOtpOpen] = React.useState(false);
  return (
    <ApproveCard
      ctx={ctx}
      approve={
        <>
          <Button size="lg" disabled={!online || !!busy} onClick={() => setOtpOpen(true)}>
            <SignatureIcon data-icon="inline-start" aria-hidden />
            Approve &amp; sign
          </Button>
          <OtpDialog
            open={otpOpen}
            onOpenChange={setOtpOpen}
            signer={user}
            title="Approve and e-Sign"
            confirmLabel="Approve & sign"
            onSign={async () => {
              setOtpOpen(false);
              const t = await act(task.id, approveAndSign);
              if (t) finish(`Approved and signed — ${t.completion?.receipt ?? ""}`);
            }}
          />
        </>
      }
    >
      {task.files?.length ? (
        <ul className="flex flex-col gap-1">
          {task.files.map((f) => (
            <li key={f.id}>
              <FileChip file={f} />
            </li>
          ))}
        </ul>
      ) : null}
    </ApproveCard>
  );
}

export function SignPage() {
  const ctx = useActContext();
  return (
    <ActFrame
      ctx={ctx}
      action="Sign"
      sandbox="Any 6-digit OTP is accepted and the signature stamp is generated locally. Nothing is sent to a court."
    >
      {(c) => {
        const { task, kase, people, finaliser, approver, preparer } = c;
        const closed = ["done", "expired", "obsolete"].includes(task.status);
        let rail: React.ReactNode;
        if (task.status === "done") rail = <RecordCard ctx={c} title="Signed" />;
        else if (closed) rail = <RecordCard ctx={c} title={task.status === "expired" ? "Expired" : "No longer required"} />;
        else if (task.status === "awaiting-approval") rail = approver ? <ApproveSign ctx={c} /> : <WaitingCard ctx={c} />;
        else if (finaliser) rail = <SignCard ctx={c} />;
        else if (preparer) rail = <PrepareSign ctx={c} />;
        else rail = <ViewOnlyCard ctx={c} why="You can see this case but cannot act on this task." />;
        return <ActColumns main={<CourtDocument task={task} kase={kase} people={people} />} rail={rail} />;
      }}
    </ActFrame>
  );
}
