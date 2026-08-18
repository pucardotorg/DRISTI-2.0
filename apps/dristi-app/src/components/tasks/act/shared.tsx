"use client";

/**
 * Pieces every act page shares: the frame (breadcrumb, header, sandbox notice), the
 * "prepared by" panel for approvers, the prepare form for non-signatories, the waiting
 * card for preparers, the OTP dialog, file slots, the court sandbox and the finished
 * record. Each page composes these around its own document or fee summary.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, FileTextIcon, SignatureIcon, TrashIcon } from "lucide-react";

import { fileUrl, formatBytes, storeUpload } from "@/lib/tasks/data";
import { dateTime, longDate, shortDate } from "@/lib/tasks/format";
import { canApprove, canFinaliseTask, canView, isTakeOver } from "@/lib/tasks/permissions";
import { useTasks } from "@/lib/tasks/store";
import {
  courtAccepted,
  courtReturned,
  saveDraft,
  sendBack,
  sendForApproval,
  withdraw,
} from "@/lib/tasks/transitions";
import type { Case, Person, PersonId, StoredFileRef, Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/shell/chrome";
import { SectionNotice } from "@/components/shell/notices";
import { PANEL_CLASS } from "@/components/shell/panel";
import { PersonAvatar } from "@/components/tasks/person-avatar";
import { useTaskActions } from "@/components/tasks/use-task-actions";

/* ───────────────────────────── loading the task ───────────────────────────── */

export type ActContext = {
  task: Task;
  kase: Case;
  user: Person;
  people: Person[];
  online: boolean;
  /** May complete this task's finalising step (signatory, or no signatory needed). */
  finaliser: boolean;
  /** Has access but cannot finalise this task — prepares and sends for approval. */
  preparer: boolean;
  approver: boolean;
  /** A finaliser on a draft someone else is preparing — finishing it takes it over. */
  takingOver: boolean;
  /** Back to the list with this task open, flashed. */
  finish: (message?: string, taskId?: string) => void;
};

/**
 * Resolves the task in the URL and hands the page everything it needs. Renders the
 * loading and not-found states itself so pages only write the happy shape.
 */
export function useActContext(): ActContext | { state: "loading" | "missing" | "forbidden" } {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { state, tasks, cases, people, user, online, requestHighlight } = useTasks();
  const id = decodeURIComponent(params.taskId);
  const task = tasks.find((t) => t.id === id) ?? null;
  const kase = task ? (cases.find((c) => c.id === task.caseId) ?? null) : null;

  const finish = React.useCallback(
    (message?: string, taskId?: string) => {
      const target = taskId ?? id;
      requestHighlight(target);
      if (message) toast.success(message);
      router.push(`/tasks?task=${encodeURIComponent(target)}`);
    },
    [id, requestHighlight, router]
  );

  if (state !== "ready") return { state: "loading" };
  if (!task || !kase) return { state: "missing" };
  if (!canView(user, kase)) return { state: "forbidden" };
  const finaliser = canFinaliseTask(user, task, kase);
  return {
    task,
    kase,
    user,
    people,
    online,
    finaliser,
    preparer: !finaliser,
    approver: canApprove(user, task, kase),
    takingOver: isTakeOver(user, task, kase),
    finish,
  };
}

/* ───────────────────────────── the frame ───────────────────────────── */

export function ActFrame({
  ctx,
  action,
  sandbox,
  children,
}: {
  ctx: ActContext | { state: "loading" | "missing" | "forbidden" };
  /** "Pay" · "Sign" · "Submit" · "Fix defects" — the breadcrumb's last crumb. */
  action: string;
  /** The one quiet line that says what is not real here. */
  sandbox: string;
  children: (ctx: ActContext) => React.ReactNode;
}) {
  if ("state" in ctx) {
    return (
      <main className="flex min-w-0 flex-1 flex-col">
        <Breadcrumbs crumbs={[{ label: action }]} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
          {ctx.state === "loading" ? (
            <>
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </>
          ) : (
            <Card className={cn(PANEL_CLASS, "py-0")}>
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>
                    {ctx.state === "missing" ? "This task is not here" : "Not on your access"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {ctx.state === "missing"
                      ? "It may have been reset with the sandbox, or the link is wrong."
                      : "You are not on this case's vakalatnama or its access list."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline">
                    <Link href="/tasks">Back to tasks</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </Card>
          )}
        </div>
      </main>
    );
  }

  const { task, kase } = ctx;
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <Breadcrumbs
        crumbs={[
          { label: task.title, href: `/tasks?task=${encodeURIComponent(task.id)}` },
          { label: action },
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-title font-semibold text-foreground text-balance">{task.title}</h1>
          <p className="text-body-compact text-muted-foreground">
            {kase.parties}
            {kase.stNumber ? (
              <>
                {" · "}
                <span className="font-mono tabular-nums">{kase.stNumber}</span>
              </>
            ) : (
              " · Not yet numbered"
            )}
            {" · "}
            {kase.court}
          </p>
        </header>

        {/* Quiet notice: white panel, icon in ink, words carry the status. */}
        <SectionNotice variant="neutral" title="Sandbox">
          {sandbox}
        </SectionNotice>

        {children(ctx)}
      </div>
    </main>
  );
}

/** Two columns from `lg`: the thing (document, fee) and the action rail. */
export function ActColumns({ main, rail }: { main: React.ReactNode; rail: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      {/* The rail sticks under the top bar so the action stays in reach on a long document. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20">{rail}</div>
    </div>
  );
}

export function RailCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(PANEL_CLASS, "gap-4")}>
      <CardHeader>
        <CardTitle className="text-body font-semibold">{title}</CardTitle>
        {description ? (
          <p className="text-body-compact text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

/**
 * On a finaliser's rail when the task is a draft someone else was preparing: who, and
 * what they left — the note and any upload — so taking over is informed, not blind.
 */
export function TakeOverNote({ ctx }: { ctx: ActContext }) {
  const { task, people, takingOver } = ctx;
  if (!takingOver) return null;
  const preparer = people.find((p) => p.id === task.approval?.preparedBy);
  const note = (task.approval?.prepared?.note as string | undefined) || task.approval?.note;
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-3">
      <div className="flex items-center gap-2">
        {preparer ? <PersonAvatar person={preparer} /> : null}
        <p className="text-caption font-semibold text-muted-foreground">
          {preparer?.name ?? "Someone"} is preparing this
        </p>
      </div>
      <p className="text-body-compact">
        {note || <span className="text-muted-foreground">No note yet.</span>}
      </p>
      <p className="text-caption text-muted-foreground">
        Finishing it here takes it over — the history will say so.
      </p>
    </div>
  );
}

/** "Paying as X — you are on the vakalatnama." or, on a take-over, what that means. */
export function finaliserLine(ctx: ActContext, verb: string): string {
  const { user, takingOver, task } = ctx;
  if (takingOver) return `${verb} as ${user.name} — this takes over the draft.`;
  if (!task.requiresSignatory) return `${verb} as ${user.name} — no signature is needed for this.`;
  return `${verb} as ${user.name} — you are on the vakalatnama.`;
}

/* ───────────────────────────── files ───────────────────────────── */

export function FileChip({
  file,
  onRemove,
  disabled,
}: {
  file: StoredFileRef;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let live = true;
    void fileUrl(file.id).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [file.id]);
  const body = (
    <>
      <FileTextIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      <span className="shrink-0 text-caption text-muted-foreground">
        {file.ext} · {formatBytes(file.size)}
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-body-compact">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </a>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">{body}</span>
      )}
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${file.name}`}
          disabled={disabled}
          onClick={onRemove}
          className="relative after:absolute after:-inset-1"
        >
          <TrashIcon aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

const ACCEPT = "application/pdf,image/*";

/**
 * A "documents needed" slot: the name, and either the upload that fills it or a real
 * file picker. Bytes go to the repository's file store; the task keeps the reference.
 */
export function FileSlot({
  name,
  file,
  disabled,
  optional,
  onFile,
  onRemove,
}: {
  name: string;
  file?: StoredFileRef;
  disabled?: boolean;
  /** "Optional" instead of "Missing" when the slot need not be filled. */
  optional?: boolean;
  onFile: (ref: StoredFileRef) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const id = `slot-${name.replace(/\W+/g, "-").toLowerCase()}`;

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const ref = await storeUpload(f);
      onFile({ ...ref, slot: name });
    } catch {
      toast.error("That file could not be stored in this browser.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-body-compact font-medium">
          {name}
        </FieldLabel>
        {file ? (
          <span className="inline-flex items-center gap-1 text-caption text-success-ink">
            <CheckIcon aria-hidden className="size-3.5" />
            Attached
          </span>
        ) : (
          <span className="text-caption text-muted-foreground">{optional ? "Optional" : "Missing"}</span>
        )}
      </div>
      {file ? (
        <FileChip file={file} onRemove={disabled ? undefined : onRemove} disabled={disabled} />
      ) : (
        <Field className="gap-0">
          <Input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPT}
            disabled={disabled || busy}
            onChange={(e) => void pick(e.target.files?.[0])}
            className="max-w-sm cursor-pointer file:mr-3 file:font-medium"
          />
        </Field>
      )}
    </li>
  );
}

/* ───────────────────────────── the prepare / approve / wait cards ───────────────────────────── */

/**
 * For someone with access but no signature: prepare (a note to the signatory, optional
 * uploads handled by the page), save the draft, send it for approval.
 */
export function PrepareCard({
  ctx,
  what,
  files,
  children,
}: {
  ctx: ActContext;
  /** What the signatory will do — "pay it", "sign it", "submit it". */
  what: string;
  files?: StoredFileRef[];
  children?: React.ReactNode;
}) {
  const { task, people, kase, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [note, setNote] = React.useState<string>(
    (task.approval?.prepared?.note as string | undefined) ?? task.approval?.note ?? ""
  );
  const signatories = kase.signatories
    .map((id) => people.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(" or ");
  const sentBack = task.status === "sent-back" ? task.approval : null;
  const outcome = task.kind === "pay" ? "they make the payment" : "their signature is the one applied";

  return (
    <RailCard
      title={task.status === "draft" || task.status === "sent-back" ? "Continue preparing" : "Prepare"}
      description={`${signatories || "A signatory"} will ${what}. Prepare it here and send it for approval — ${outcome}.`}
    >
      {sentBack?.decisionNote ? (
        <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
          <p className="text-caption font-semibold text-muted-foreground">
            Sent back by {people.find((p) => p.id === sentBack.decidedBy)?.name ?? "the signatory"}
            {sentBack.decidedAt ? ` · ${shortDate(sentBack.decidedAt)}` : ""}
          </p>
          <p className="text-body-compact">{sentBack.decisionNote}</p>
        </div>
      ) : null}
      {children}
      <Field>
        <FieldLabel htmlFor="prepare-note">Note to the signatory</FieldLabel>
        <Textarea
          id="prepare-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What you checked, what they should look at"
          disabled={!online || !!busy}
        />
        <FieldDescription>Optional. Shown with the task when they open it.</FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!online || !!busy}
          onClick={async () => {
            const saved = await act(task.id, (t, c) => saveDraft(t, c, { note }, files));
            if (!saved) return;
            const sent = await act(task.id, (t, c) => sendForApproval(t, c, note));
            if (sent) finish(`Sent to ${signatories || "the signatory"} for approval`);
          }}
        >
          Send for approval
        </Button>
        <Button
          variant="ghost"
          disabled={!online || !!busy}
          onClick={() => void act(task.id, (t, c) => saveDraft(t, c, { note }, files), "Draft saved")}
        >
          Save draft
        </Button>
      </div>
    </RailCard>
  );
}

/** For the preparer while a signatory decides: where it is, and the way back. */
export function WaitingCard({ ctx }: { ctx: ActContext }) {
  const { task, people, kase, user, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const approvers = kase.signatories
    .filter((id) => id !== task.approval?.preparedBy)
    .map((id) => people.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(" or ");
  const mine = task.approval?.preparedBy === user.id;
  return (
    <RailCard
      title="Sent for approval"
      description={`${people.find((p) => p.id === task.approval?.preparedBy)?.name ?? "Someone"} sent this${task.approval?.sentAt ? ` on ${longDate(task.approval.sentAt)}` : ""}. Waiting on ${approvers || "a signatory"}.`}
    >
      {task.approval?.note ? (
        <div className="rounded-lg bg-surface-sunken p-3 text-body-compact">{task.approval.note}</div>
      ) : null}
      {mine ? (
        <Button
          variant="outline"
          disabled={!online || !!busy}
          onClick={async () => {
            const t = await act(task.id, withdraw);
            if (t) finish("Withdrawn — back in your drafts");
          }}
        >
          Withdraw
        </Button>
      ) : null}
    </RailCard>
  );
}

/**
 * For a signatory looking at someone else's preparation: who, when, the note, then
 * approve (the page supplies the finalising step) or send back with a required note.
 */
export function ApproveCard({
  ctx,
  title = "Approve and sign",
  description = "Your signature is the one applied — read what was prepared before you approve.",
  approve,
  children,
}: {
  ctx: ActContext;
  title?: string;
  description?: string;
  /** The approving control(s) — a button that opens the OTP, or the pay sandbox. */
  approve: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { task, people, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const preparer = people.find((p) => p.id === task.approval?.preparedBy);
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  return (
    <RailCard title={title} description={description}>
      <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-3">
        <div className="flex items-center gap-2">
          {preparer ? <PersonAvatar person={preparer} /> : null}
          <p className="text-caption font-semibold text-muted-foreground">
            Prepared by {preparer?.name ?? "someone"}
            {task.approval?.sentAt ? ` · ${dateTime(task.approval.sentAt)}` : ""}
          </p>
        </div>
        <p className="text-body-compact">
          {task.approval?.note || <span className="text-muted-foreground">No note.</span>}
        </p>
      </div>
      {children}
      {approve}
      <Button variant="ghost" disabled={!online || !!busy} onClick={() => setOpen(true)} className="self-start">
        Send back
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send back to {preparer?.name ?? "the preparer"}</DialogTitle>
            <DialogDescription>
              Say what needs to change. The task returns to the top of their list with your note.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="approve-send-back-note">Note</FieldLabel>
            <Textarea
              id="approve-send-back-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to change before you will sign"
              required
            />
            <FieldDescription>Required.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim() || !!busy}
              onClick={async () => {
                const t = await act(task.id, (x, c) => sendBack(x, c, note.trim()));
                setOpen(false);
                if (t) finish("Sent back with your note");
              }}
            >
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RailCard>
  );
}

/* ───────────────────────────── OTP ───────────────────────────── */

/** Aadhaar e-Sign, sandboxed: any 6 digits. The signatory's name is on the button. */
export function OtpDialog({
  open,
  onOpenChange,
  signer,
  onSign,
  title = "E-Sign with Aadhaar",
  confirmLabel = "Sign",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signer: Person;
  onSign: () => void;
  title?: string;
  confirmLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted per open, so the code always starts empty. */}
        {open ? (
          <OtpForm signer={signer} onSign={onSign} title={title} confirmLabel={confirmLabel} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function OtpForm({
  signer,
  onSign,
  title,
  confirmLabel,
}: {
  signer: Person;
  onSign: () => void;
  title: string;
  confirmLabel: string;
}) {
  const [otp, setOtp] = React.useState("");
  const [resent, setResent] = React.useState(false);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          In the live service, a 6-digit OTP goes to{" "}
          <strong className="font-semibold text-foreground">{signer.name}</strong>’s Aadhaar-linked
          mobile. The signature applied is theirs.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="esign-otp" className="text-body-compact">
          Enter OTP
        </Label>
        <InputOTP id="esign-otp" maxLength={6} value={otp} onChange={setOtp} containerClassName="gap-2">
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="size-10 rounded-lg border border-input" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-caption text-muted-foreground">Sandbox — any 6-digit code is accepted here.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-body-compact text-muted-foreground">Didn’t get it?</span>
        <Button type="button" variant="link" className="h-auto p-0 underline" onClick={() => setResent(true)}>
          {resent ? "Sent again" : "Resend OTP"}
        </Button>
      </div>
      <Button size="lg" className="w-full" disabled={otp.length < 6} onClick={onSign}>
        <SignatureIcon data-icon="inline-start" aria-hidden />
        {confirmLabel}
      </Button>
    </>
  );
}

/* ───────────────────────────── court sandbox ───────────────────────────── */

/**
 * Stand-in for the registry on a submitted task: accept, or return with 1–3 defects.
 * Returning creates the fix-defects task and takes you to it.
 */
export function CourtSandbox({ ctx }: { ctx: ActContext }) {
  const { task, online, finish } = ctx;
  const { act, busy } = useTaskActions();
  const [open, setOpen] = React.useState(false);
  const [defects, setDefects] = React.useState<string[]>(["", "", ""]);
  const filled = defects.map((d) => d.trim()).filter(Boolean);

  return (
    <RailCard
      title="Awaiting scrutiny"
      description="Submitted — the registry has it now. These controls stand in for the registry's answer."
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!online || !!busy}
          onClick={async () => {
            const t = await act(task.id, courtAccepted);
            if (t) finish("Accepted by the registry");
          }}
        >
          Court: accept
        </Button>
        <Button variant="outline" disabled={!online || !!busy} onClick={() => setOpen(true)}>
          Court: return with defects
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return with defects</DialogTitle>
            <DialogDescription>
              Enter one to three scrutiny remarks. A fix-defects task is created with them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {defects.map((d, i) => (
              <Field key={i}>
                <FieldLabel htmlFor={`defect-${i}`}>Defect {i + 1}</FieldLabel>
                <Input
                  id={`defect-${i}`}
                  value={d}
                  onChange={(e) => setDefects((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "Affidavit not attested by a notary" : "Optional"}
                />
              </Field>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!filled.length || !!busy}
              onClick={async () => {
                let createdId: string | undefined;
                const t = await act(task.id, (x, c) => {
                  const r = courtReturned(x, c, filled);
                  createdId = r.created.id;
                  return r;
                });
                setOpen(false);
                if (t) finish(`Returned — ${filled.length} defect${filled.length === 1 ? "" : "s"} to fix`, createdId);
              }}
            >
              Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RailCard>
  );
}

/* ───────────────────────────── the closed record ───────────────────────────── */

export function RecordCard({ ctx, title }: { ctx: ActContext; title: string }) {
  const { task, people } = ctx;
  const by = people.find((p) => p.id === task.completion?.by);
  return (
    <RailCard title={title}>
      <dl className="flex flex-col gap-2 text-body-compact">
        {task.completion ? (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">When</dt>
              <dd className="tabular-nums">{dateTime(task.completion.at)}</dd>
            </div>
            {by ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">By</dt>
                <dd>{by.name}</dd>
              </div>
            ) : null}
            {task.completion.receipt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono tabular-nums">{task.completion.receipt}</dd>
              </div>
            ) : null}
          </>
        ) : null}
        {task.statusNote ? <p className="text-body-compact text-muted-foreground">{task.statusNote}</p> : null}
      </dl>
    </RailCard>
  );
}

/** A "who may act" line for the rail when the person can only look. */
export function ViewOnlyCard({ ctx, why }: { ctx: ActContext; why: string }) {
  return (
    <RailCard title="View only">
      <p className="text-body-compact text-muted-foreground">{why}</p>
      <Button asChild variant="outline">
        <Link href={`/tasks?task=${encodeURIComponent(ctx.task.id)}`}>Back to the task</Link>
      </Button>
    </RailCard>
  );
}

export function nameOfPerson(people: Person[], id?: PersonId): string {
  return people.find((p) => p.id === id)?.name ?? "someone";
}
