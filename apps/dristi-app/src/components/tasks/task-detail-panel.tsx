"use client";

import * as React from "react";
import { type ElementType, type ReactNode } from "react";
import { FileTextIcon, XIcon } from "lucide-react";

import { dateTime, dueCueOf, longDate, nameOf, noteOf, permissionLineOf, rupees, shortDate, statusPhraseOf } from "@/lib/tasks/format";
import { advocatesOf, canMarkDone, PAGED_KINDS, TERMINAL, verbFor, WAITING } from "@/lib/tasks/permissions";
import { formatBytes } from "@/lib/tasks/data";
import type { Case, Person, Task, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-min-width";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shell/confirm-dialog";
import { PersonAvatar } from "@/components/tasks/person-avatar";

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

function FileList({ files }: { files: Task["files"] }) {
  if (!files?.length) return null;
  return (
    <ul className="flex flex-col gap-1">
      {files.map((f) => (
        <li key={f.id} className="flex items-center gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-body-compact">
          <FileTextIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className="text-caption text-muted-foreground">
            {f.ext} · {formatBytes(f.size)}
          </span>
        </li>
      ))}
    </ul>
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
  Title = "h2",
  Description = "p",
}: TaskDetailProps & {
  close: ReactNode;
  Title?: ElementType;
  Description?: ElementType;
}) {
  const verb = verbFor(user, task, kase);
  const due = dueCueOf(task, now);
  const closed = TERMINAL.has(task.status);
  const waiting = WAITING.has(task.status);
  const markDone = canMarkDone(user, task, kase);
  const paged = PAGED_KINDS.has(task.kind);
  const advocates = advocatesOf(kase, people);

  const [confirmDone, setConfirmDone] = React.useState(false);

  // The one primary action of the view. Waiting and closed tasks of a paged kind still
  // open their page — that is where the sandbox court/gateway controls and the record
  // live — but as a quiet secondary, not the teal verb.
  let primary: { label: string; run: () => void } | null = null;
  let secondary: { label: string; run: () => void } | null = null;
  if (verb === "Mark done") {
    primary = { label: "Mark done", run: () => (task.isBlocking ? setConfirmDone(true) : onMarkDone()) };
  } else if (verb !== "View") {
    primary = { label: verb, run: () => onVerb(verb) };
  } else if (paged && waiting) {
    secondary = { label: "Open", run: () => onVerb("View") };
  } else if (paged && closed) {
    secondary = { label: "View record", run: () => onVerb("View") };
  }

  const history = [...task.history].reverse();
  const preparedBy = task.status === "ready" ? task.prepared : null;
  const draftBy = task.status === "draft" ? task.draft : null;

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
          <span className="text-muted-foreground">{statusPhraseOf(task, user, kase, people)}</span>
          {noteOf(task) ? <span className="text-muted-foreground">{noteOf(task)}</span> : null}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-6">
        <Block title="Who can act">
          <p className="text-body-compact">{permissionLineOf(task, user, kase, people)}</p>
        </Block>

        {preparedBy ? (
          <Block title="Prepared by">
            <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const p = people.find((x) => x.id === preparedBy.by);
                  return p ? <PersonAvatar person={p} you={p.id === user.id} /> : null;
                })()}
                <p className="text-caption font-semibold text-muted-foreground">
                  {nameOf(people, preparedBy.by)} · {dateTime(preparedBy.at)}
                </p>
              </div>
              <p className="text-body-compact">
                {preparedBy.note || <span className="text-muted-foreground">No note.</span>}
              </p>
              <FileList files={preparedBy.files ?? task.files} />
            </div>
          </Block>
        ) : null}

        {draftBy ? (
          <Block title="Draft">
            <div className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const p = people.find((x) => x.id === draftBy.by);
                  return p ? <PersonAvatar person={p} you={p.id === user.id} /> : null;
                })()}
                <p className="text-caption font-semibold text-muted-foreground">
                  {draftBy.by === user.id ? "You" : nameOf(people, draftBy.by)} saved it · {dateTime(draftBy.savedAt)}
                </p>
              </div>
              {draftBy.note ? <p className="text-body-compact">{draftBy.note}</p> : null}
              <FileList files={task.files} />
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

        {task.returned?.defects.length ? (
          <Block title="Defects from scrutiny">
            <ol className="flex flex-col gap-2">
              {task.returned.defects.map((d) => (
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
            {task.hearingAt ? (
              <Fact label="Hearing">
                <span className="tabular-nums">{dateTime(task.hearingAt)}</span>
                {task.isBlocking ? (
                  <span className="block text-caption text-muted-foreground">The hearing cannot proceed without this</span>
                ) : null}
              </Fact>
            ) : null}
            {task.completion ? (
              <Fact label={task.completion.how === "manual" ? "Marked done" : "Closed"}>
                <span className="tabular-nums">{dateTime(task.completion.at)}</span>
                {task.completion.by ? <span className="text-muted-foreground"> · {nameOf(people, task.completion.by)}</span> : null}
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

        <Block title="Advocates on the case">
          <ul className="flex flex-col gap-2">
            {advocates.map((p, i) => {
              const signatory = i < kase.signatories.length;
              return (
                <li key={p.id} className="flex items-center gap-3 text-body-compact">
                  <PersonAvatar person={p} you={p.id === user.id} />
                  <span className="min-w-0 flex-1">
                    {p.name}
                    {p.id === user.id ? <span className="text-muted-foreground"> (you)</span> : null}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {i === 0 ? "Main advocate · on the vakalatnama" : signatory ? "On the vakalatnama" : "On the case"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Block>

        {!preparedBy && !draftBy && task.files?.length ? (
          <Block title="Files">
            <FileList files={task.files} />
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

      {/* Actions: the ONE teal action of the view is here; the table's row verbs are outline. */}
      {primary || secondary || (markDone && verb !== "Mark done") ? (
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
            <Button variant="outline" onClick={secondary.run}>
              {secondary.label}
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
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDone}
        onOpenChange={setConfirmDone}
        title="Mark this done?"
        description={`This task is for the hearing on ${task.hearingAt ? shortDate(task.hearingAt) : "the next posting"}. Marking it done says it has happened; nothing is sent to the court.`}
        confirmLabel="Mark done"
        destructive={false}
        onConfirm={() => {
          setConfirmDone(false);
          onMarkDone();
        }}
      />
    </div>
  );
}

/**
 * Task detail.
 *
 * From `lg` up it is an in-flow, non-modal panel that pushes the table left: no scrim, no
 * focus trap, the table stays live — so clicking another row swaps this content in place.
 * Below `lg` the table has no width to give and the detail falls back to the Sheet
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
          open ? "w-md 2xl:w-lg" : "w-0 border-l-0"
        )}
      >
        {/* Held at the open width so the content does not reflow mid-slide. */}
        <div className="flex h-full w-md flex-col 2xl:w-lg">
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
