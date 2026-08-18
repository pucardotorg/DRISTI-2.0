"use client";

import * as React from "react";
import { type ElementType, type ReactNode } from "react";
import { FileTextIcon, XIcon } from "lucide-react";

import {
  blockingCueOf,
  dateTime,
  dueCueOf,
  longDate,
  permissionLineOf,
  rupees,
  shortDate,
} from "@/lib/tasks/format";
import { canApprove, canMarkDone, PAGED_KINDS, verbFor } from "@/lib/tasks/permissions";
import { formatBytes } from "@/lib/tasks/data";
import type { Case, Person, PersonId, Task, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-min-width";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { PersonAvatar } from "@/components/tasks/person-avatar";
import { ReassignSelect } from "@/components/tasks/reassign-select";

function Fact({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    // The primitive's row rule is border-border; inside a panel these are internal
    // dividers, so they drop to the hairline role.
    <DescriptionRow className="grid-cols-[minmax(6rem,8rem)_1fr] border-hairline py-2">
      <DescriptionTerm className="text-body-compact">{label}</DescriptionTerm>
      <DescriptionDetails className={cn("text-body-compact", mono && "font-mono tabular-nums")}>
        {children}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-caption font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export type TaskDetailProps = {
  task: Task;
  kase: Case;
  user: Person;
  people: Person[];
  now: Date;
  offline: boolean;
  busy: boolean;
  onVerb: (verb: Verb) => void;
  onMarkDone: () => void;
  onWithdraw: () => void;
  onSendBack: (note: string) => void;
  onReassign: (assigneeId: PersonId | undefined) => void;
};

/**
 * The detail itself, minus its container. `Title` / `Description` are element types
 * because the Sheet presentation must render Radix's own title and description nodes
 * for its ARIA wiring, while the push panel is plain markup with no dialog semantics.
 */
function TaskDetail({
  task,
  kase,
  user,
  people,
  now,
  offline,
  busy,
  close,
  onVerb,
  onMarkDone,
  onWithdraw,
  onSendBack,
  onReassign,
  Title = "h2",
  Description = "p",
}: TaskDetailProps & {
  close: ReactNode;
  Title?: ElementType;
  Description?: ElementType;
}) {
  const verb = verbFor(user, task, kase);
  const due = dueCueOf(task, now);
  const blocking = blockingCueOf(task, now);
  const closed = ["done", "expired", "obsolete"].includes(task.status);
  const approver = canApprove(user, task, kase);
  const markDone = canMarkDone(user, task, kase);
  const nameOf = (id?: PersonId) => people.find((p) => p.id === id)?.name ?? "someone";

  const [confirmDone, setConfirmDone] = React.useState(false);
  const [sendBackOpen, setSendBackOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  // The one primary action — a finalising or preparing verb, or nothing. Withdraw is a
  // step back, so it stays outline. Waiting and closed tasks of a paged kind still open
  // their page — that is where the sandbox court/gateway controls and the receipt live.
  const paged = PAGED_KINDS.has(task.kind);
  let primary: { label: string; run: () => void } | null = null;
  let secondary: { label: string; run: () => void } | null = null;
  if (verb === "Mark done") {
    primary = { label: "Mark done", run: () => (task.isBlocking ? setConfirmDone(true) : onMarkDone()) };
  } else if (verb === "Withdraw") {
    secondary = { label: "Withdraw", run: onWithdraw };
  } else if (verb !== "View") {
    primary = { label: verb, run: () => onVerb(verb) };
  } else if (paged && !closed) {
    primary = { label: "Open", run: () => onVerb("View") };
  }
  const record = closed && paged ? { label: "View record", run: () => onVerb("View") } : null;

  const history = [...task.history].reverse();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-hairline px-4 pt-4 pb-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption font-semibold text-muted-foreground">Task</p>
          {close}
        </div>
        <div className="flex flex-col gap-1">
          {/* Focus lands here when a row opens the panel; Escape returns it to the row. */}
          <Title
            tabIndex={-1}
            data-task-detail-title
            className="rounded-sm text-title-s font-semibold text-balance outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {task.title}
          </Title>
          <Description className="text-caption text-muted-foreground">
            {kase.parties}
            {kase.stNumber ? (
              <>
                {" · "}
                <span className="font-mono tabular-nums">{kase.stNumber}</span>
              </>
            ) : (
              " · Not yet numbered"
            )}
          </Description>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
          <span className={cn("tabular-nums", due.overdue ? "font-medium text-destructive-ink" : "text-muted-foreground")}>
            {due.text}
          </span>
          {blocking ? <span className="text-brand-muted-foreground">{blocking}</span> : null}
          {task.statusNote && task.status !== "sent-back" ? (
            <span className="text-muted-foreground">{task.statusNote}</span>
          ) : null}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-6">
        {/* Sent-back note first — it is what the person came for. */}
        {task.status === "sent-back" && task.approval?.decisionNote ? (
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-4">
            <p className="text-caption font-semibold text-muted-foreground">
              Sent back by {nameOf(task.approval.decidedBy)}
              {task.approval.decidedAt ? ` · ${shortDate(task.approval.decidedAt)}` : ""}
            </p>
            <p className="text-body-compact">{task.approval.decisionNote}</p>
          </div>
        ) : null}

        <Block title="Permission">
          <p className="text-body-compact">{permissionLineOf(task, user, kase, people)}</p>
        </Block>

        {task.status === "awaiting-approval" && task.approval ? (
          <Block title={approver ? "Prepared for you" : "Sent for approval"}>
            <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-4">
              <p className="text-caption font-semibold text-muted-foreground">
                {nameOf(task.approval.preparedBy)}
                {task.approval.sentAt ? ` · ${dateTime(task.approval.sentAt)}` : ""}
              </p>
              <p className="text-body-compact">
                {task.approval.note || <span className="text-muted-foreground">No note.</span>}
              </p>
            </div>
          </Block>
        ) : null}

        <Block title="Why">
          <p className="text-body-compact">
            {task.why.event}
            {/dated|on \d/.test(task.why.event) ? null : (
              <span className="text-muted-foreground"> · {longDate(task.why.at)}</span>
            )}
          </p>
        </Block>

        <Block title="What to do">
          <p className="text-body-compact">{task.whatToDo}</p>
        </Block>

        {task.documentsNeeded?.length ? (
          <Block title="Documents needed">
            <ul className="flex flex-col gap-1 text-body-compact">
              {task.documentsNeeded.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <FileTextIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {task.defects?.length ? (
          <Block title="Defects">
            <ol className="flex flex-col gap-2">
              {task.defects.map((d) => (
                <li key={d.n} className="flex gap-2 text-body-compact">
                  <span className="font-medium tabular-nums text-muted-foreground">{d.n}.</span>
                  <span className={cn(d.fixed && "text-muted-foreground line-through")}>{d.text}</span>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        <Block title="Details">
          <DescriptionList>
            {task.amountPaise !== undefined ? (
              <Fact label="Amount">
                <span className="font-medium tabular-nums">{rupees(task.amountPaise)}</span>
                {task.feeHead ? <span className="text-muted-foreground"> · {task.feeHead}</span> : null}
              </Fact>
            ) : null}
            <Fact label="Deadline">
              {task.dueAt ? (
                <>
                  <span className="tabular-nums">{longDate(task.dueAt)}</span>
                  {task.deadlineNote ? (
                    <span className="block text-caption text-muted-foreground">{task.deadlineNote}</span>
                  ) : null}
                  {task.redate ? (
                    <span className="block text-caption text-muted-foreground">
                      Moved from {longDate(task.redate.from)} — {task.redate.reason}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">No date set — the court did not fix one</span>
              )}
            </Fact>
            {task.blocksHearingAt ? (
              <Fact label="Blocks">
                <span className="tabular-nums">Hearing on {dateTime(task.blocksHearingAt)}</span>
              </Fact>
            ) : null}
            {task.completion ? (
              <Fact label={task.completion.how === "manual" ? "Marked done" : "Closed"}>
                <span className="tabular-nums">{dateTime(task.completion.at)}</span>
                {task.completion.by ? <span className="text-muted-foreground"> · {nameOf(task.completion.by)}</span> : null}
                {task.completion.receipt ? (
                  <span className="block font-mono text-caption tabular-nums text-muted-foreground">
                    Receipt {task.completion.receipt}
                  </span>
                ) : null}
              </Fact>
            ) : null}
          </DescriptionList>
        </Block>

        <Block title="Case">
          <DescriptionList>
            <Fact label="Parties">{kase.parties}</Fact>
            <Fact label="Number" mono>
              {kase.stNumber || "Not yet numbered"}
              {kase.cnr ? <span className="block text-caption text-muted-foreground">{kase.cnr}</span> : null}
            </Fact>
            <Fact label="Court">{kase.court}</Fact>
            <Fact label="Stage">{kase.stage}</Fact>
            <Fact label="Next hearing">
              {kase.nextHearingAt ? (
                <span className="tabular-nums">{dateTime(kase.nextHearingAt)}</span>
              ) : (
                <span className="text-muted-foreground">Not listed</span>
              )}
            </Fact>
          </DescriptionList>
        </Block>

        <Block title="Assigned to">
          <div className="flex items-center gap-3">
            <Label htmlFor="detail-assignee" className="sr-only">
              Assigned to
            </Label>
            <ReassignSelect
              id="detail-assignee"
              value={task.assigneeId && people.some((p) => p.id === task.assigneeId) ? task.assigneeId : undefined}
              kase={kase}
              people={people}
              user={user}
              disabled={offline || closed || busy}
              onChange={onReassign}
              className="w-full max-w-64"
            />
          </div>
        </Block>

        {task.files?.length ? (
          <Block title="Files">
            <ul className="flex flex-col gap-1">
              {task.files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-body-compact">
                  <FileTextIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-caption text-muted-foreground">
                    {f.ext} · {formatBytes(f.size)}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        <Block title="History">
          <Timeline>
            {history.map((h, i) => (
              // The primitive's `title` slot is 500; the panel already spends its two
              // weights on 600 eyebrows and 400 body, so the line is rendered as body.
              <TimelineItem key={`${h.at}-${i}`} status={i === 0 ? "current" : "past"}>
                <p className="text-body-compact text-foreground">{h.text}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span className="tabular-nums">{dateTime(h.at)}</span>
                  {h.by ? (
                    <>
                      <span aria-hidden>·</span>
                      {(() => {
                        const p = people.find((x) => x.id === h.by);
                        return p ? <PersonAvatar person={p} you={p.id === user.id} className="size-5" /> : null;
                      })()}
                    </>
                  ) : null}
                </p>
              </TimelineItem>
            ))}
          </Timeline>
        </Block>
      </div>

      {/* Actions: the ONE teal action of the view is here; the list's row verbs are outline. */}
      {primary || secondary || record || markDone || approver ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-3 md:px-6">
          {primary ? (
            offline ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-lg">
                    <Button disabled>{primary.label}</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>You are offline — read only</TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={primary.run} disabled={busy}>
                {primary.label}
              </Button>
            )
          ) : null}
          {secondary ? (
            <Button variant="outline" disabled={offline || busy} onClick={secondary.run}>
              {secondary.label}
            </Button>
          ) : null}
          {record ? (
            <Button variant="ghost" onClick={record.run}>
              {record.label}
            </Button>
          ) : null}
          {markDone && verb !== "Mark done" ? (
            <Button
              variant="ghost"
              disabled={offline || busy}
              onClick={() => (task.isBlocking ? setConfirmDone(true) : onMarkDone())}
            >
              Mark done
            </Button>
          ) : null}
          {approver ? (
            <Button variant="ghost" disabled={offline || busy} onClick={() => setSendBackOpen(true)}>
              Send back
            </Button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDone}
        onOpenChange={setConfirmDone}
        title="Mark this done?"
        description={`This task blocks the hearing on ${task.blocksHearingAt ? shortDate(task.blocksHearingAt) : "the next posting"}. Marking it done says the work is finished; nothing is sent to the court.`}
        confirmLabel="Mark done"
        destructive={false}
        onConfirm={() => {
          setConfirmDone(false);
          onMarkDone();
        }}
      />

      <Dialog open={sendBackOpen} onOpenChange={setSendBackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send back to {nameOf(task.approval?.preparedBy)}</DialogTitle>
            <DialogDescription>
              Say what needs to change. The task returns to the top of their list with your note.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="send-back-note">Note</FieldLabel>
            <Textarea
              id="send-back-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="What needs to change before you will sign"
              required
            />
            <FieldDescription>Required — a send-back without a reason helps nobody.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSendBackOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!note.trim() || busy}
              onClick={() => {
                onSendBack(note.trim());
                setNote("");
                setSendBackOpen(false);
              }}
            >
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Task detail.
 *
 * From `lg` up it is an in-flow, non-modal panel that pushes the list left: no scrim, no
 * focus trap, the list stays live — so clicking another row swaps this content in place.
 * Below `lg` the list has no width to give and the detail falls back to the Sheet
 * overlay, full width on a phone.
 */
export function TaskDetailPanel({
  open,
  onOpenChange,
  ...detail
}: Omit<TaskDetailProps, "task" | "kase"> & {
  task: Task | null;
  kase: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pushes = useIsDesktop();
  const { task, kase } = detail;

  // The Sheet brings its own Escape handling; the push panel is plain markup, so it
  // needs its own — closing on Escape is not optional.
  React.useEffect(() => {
    if (!pushes || !open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[role=dialog], [role=alertdialog], [data-slot=select-content]")) return;
      onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pushes, open, onOpenChange]);

  if (pushes) {
    return (
      <aside
        aria-label="Task detail"
        className={cn(
          "sticky top-14 h-[calc(100svh-3.5rem)] shrink-0 overflow-hidden border-l border-hairline bg-card transition-[width] duration-200 ease-out",
          open ? "w-md xl:w-lg" : "w-0 border-l-0"
        )}
      >
        {/* Held at the open width so the content does not reflow mid-slide. */}
        <div className="flex h-full w-md flex-col xl:w-lg">
          {task && kase ? (
            <TaskDetail
              key={task.id}
              {...detail}
              task={task}
              kase={kase}
              close={
                /* 32px visible, expanded to the 40px touch floor. */
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onOpenChange(false)}
                  className="relative after:absolute after:-inset-1"
                >
                  <XIcon aria-hidden />
                  Close
                </Button>
              }
            />
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {task && kase ? (
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <TaskDetail
            key={task.id}
            {...detail}
            task={task}
            kase={kase}
            Title={SheetTitle}
            Description={SheetDescription}
            close={
              <SheetClose asChild>
                <Button variant="ghost" size="xs" className="relative after:absolute after:-inset-1">
                  <XIcon aria-hidden />
                  Close
                </Button>
              </SheetClose>
            }
          />
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
