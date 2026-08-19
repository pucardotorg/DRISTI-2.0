"use client";

/**
 * Sign — the document on the left, the signing well on the right. A signatory e-signs
 * with an Aadhaar OTP (sandbox: any 6 digits) and the task closes by event with the
 * stamp on the preview; if someone else prepared it, their note and upload sit above the
 * button. Anyone else on the case prepares (a note, an optional upload of the draft) and
 * marks it ready.
 */

import * as React from "react";
import { SignatureIcon } from "lucide-react";

import { TERMINAL } from "@/lib/tasks/permissions";
import { sign } from "@/lib/tasks/transitions";
import type { StoredFileRef } from "@/lib/tasks/types";
import { Button } from "@/components/ui/button";
import { useTaskActions } from "@/components/tasks/use-task-actions";
import { CourtDocument } from "@/components/tasks/act/court-document";
import {
  ActColumns,
  ActFrame,
  type ActContext,
  closedTitle,
  FileSlot,
  OtpDialog,
  PrepareCard,
  PreparedNote,
  RailCard,
  RecordCard,
  signatoryLine,
  useActContext,
} from "@/components/tasks/act/shared";

/** The signatory's own signing well. */
function SignCard({ ctx }: { ctx: ActContext }) {
  const { task, user, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [otpOpen, setOtpOpen] = React.useState(false);
  return (
    <RailCard title="Add your signature" description={signatoryLine(ctx, "Signing")}>
      <PreparedNote ctx={ctx} />
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

/** Preparation by someone who cannot sign: a note, and an optional upload of the draft. */
function PrepareSign({ ctx }: { ctx: ActContext }) {
  const { task, online } = ctx;
  const [files, setFiles] = React.useState<StoredFileRef[]>(task.files ?? []);
  const draft = files.find((f) => f.slot === "Draft for signature");
  return (
    <PrepareCard ctx={ctx} what="sign" files={files}>
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

export function SignPage() {
  const ctx = useActContext();
  return (
    <ActFrame
      ctx={ctx}
      action="Sign"
      sandbox="Any 6-digit OTP is accepted and the signature stamp is generated locally. Nothing is sent to a court."
    >
      {(c) => {
        const { task, kase, people, signatory } = c;
        let rail: React.ReactNode;
        if (TERMINAL.has(task.status)) rail = <RecordCard ctx={c} title={closedTitle(task, "Signed")} />;
        else if (signatory) rail = <SignCard ctx={c} />;
        else rail = <PrepareSign ctx={c} />;
        return <ActColumns main={<CourtDocument task={task} kase={kase} people={people} />} rail={rail} />;
      }}
    </ActFrame>
  );
}
