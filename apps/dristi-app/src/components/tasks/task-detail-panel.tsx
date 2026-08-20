"use client";

import * as React from "react";
import { type ElementType, type ReactNode } from "react";
import { ChevronDownIcon, FileTextIcon, XIcon } from "lucide-react";

import {
  dateTime,
  dueCueOf,
  longDate,
  nameOf,
  outcomeOf,
  rupees,
  secondLineOf,
  viewOnlyLineOf,
  waitingOnOf,
} from "@/lib/tasks/format";
import {
  ACTIONABLE,
  advocatesOf,
  canArchive,
  canMarkDone,
  PAGED_KINDS,
  TERMINAL,
  verbFor,
  WAITING,
} from "@/lib/tasks/permissions";
import { formatBytes } from "@/lib/tasks/data";
import type { Case, Person, Task, Verb } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-min-width";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  /** Open the task's act modal for a look — waiting and closed paged tasks. */
  onOpenFlow: () => void;
  /** Both confirmed and executed by the screen. */
  onMarkDone: () => void;
  onArchive: () => void;
};

/**
 * The detail itself, minus its container — enough context to act, nothing more: the
 * case line, why + what to do, the money and the deadline, who is on the case, what was
 * prepared, and the history folded away. `Title` / `Description` are element types
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
  onOpenFlow,
  onMarkDone,
  onArchive,
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
  const actionable = ACTIONABLE.has(task.status);
  const markable = canMarkDone(user, task, kase);
  const archivable = canArchive(user, task, kase);
  const paged = PAGED_KINDS.has(task.kind);
  const advocates = advocatesOf(kase, people);
  // On the case but the move is a vakalatnama holder's — the quiet sentence says so.
  const viewOnly = actionable && verb === "View";

  // The one primary action of the view. Waiting and closed tasks of a paged kind still
  // open their flow — that is where the sandbox court/gateway controls and the record
  // live — but as a quiet secondary, not the teal verb.
  let primary: { label: string; run: () => void } | null = null;
  let secondary: { label: string; run: () => void } | null = null;
  if (verb === "Mark done") {
    primary = { label: "Mark as done", run: onMarkDone };
  } else if (verb !== "View") {
    primary = { label: verb, run: () => onVerb(verb) };
  } else if (paged && (waiting || viewOnly)) {
    secondary = { label: "Open", run: onOpenFlow };
  } else if (paged && closed) {
    secondary = { label: "View record", run: onOpenFlow };
  }

  // The one caption under the title: what the row's fifth column would say here.
  const statusLine =
    task.status === "archived" || closed
      ? outcomeOf(task)
      : waiting || viewOnly
        ? waitingOnOf(task, kase, people)
        : secondLineOf(task, user, people);

  const history = [...task.history].reverse();
  const preparedBy = task.status === "ready" ? task.prepared : null;
  const draftBy = task.status === "draft" ? task.draft : null;
  // The instruction often already names the documents; list only what it does not.
  const extraDocs = (task.documentsNeeded ?? []).filter(
    (d) => !task.whatToDo.toLowerCase().includes(d.toLowerCase())
  );

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
            {" · "}
            {kase.court}
          </Description>
          <p className="text-caption text-muted-foreground">
            {kase.nextHearingAt ? (
              <>
                Next hearing <span className="tabular-nums">{dateTime(kase.nextHearingAt)}</span>
              </>
            ) : (
              "No hearing listed"
            )}
            {statusLine ? (
              <>
                <span aria-hidden> · </span>
                {statusLine}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-6">
        {/* The creating event, dated, then the instruction — one block, no repeats. */}
        <Block title="Why and what to do">
          <p className="text-body-compact text-muted-foreground">
            {task.why.event}
            {/dated|on \d/.test(task.why.event) ? null : <> · {longDate(task.why.at)}</>}
          </p>
          <p className="text-body-compact">{task.whatToDo}</p>
        </Block>

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
            <Fact label="Due">
              {due.primary === "No date" ? (
                <span className="text-muted-foreground">No date set — the court did not fix one</span>
              ) : (
                <>
                  <span className={cn("tabular-nums", due.overdue && "font-medium text-destructive-ink")}>
                    {due.primary}
                  </span>
                  {due.date ? <span className="tabular-nums text-muted-foreground"> · {due.date}</span> : null}
                  {task.deadlineNote ? (
                    <span className="block text-caption text-muted-foreground">{task.deadlineNote}</span>
                  ) : null}
                  {task.redate ? (
                    <span className="block text-caption text-muted-foreground">
                      Moved from {longDate(task.redate.from)} — {task.redate.reason}
                    </span>
                  ) : null}
                  {task.isBlocking && task.hearingAt ? (
                    <span className="block text-caption text-muted-foreground">
                      The hearing cannot proceed without this
                    </span>
                  ) : null}
                </>
              )}
            </Fact>
            {task.completion ? (
              <Fact label={task.completion.how === "manual" ? "Marked done" : "Closed"}>
                <span className="tabular-nums">{dateTime(task.completion.at)}</span>
                {task.completion.by ? (
                  <span className="text-muted-foreground"> · {nameOf(people, task.completion.by)}</span>
                ) : null}
                {task.completion.receipt ? (
                  <span className="block font-mono text-caption tabular-nums text-muted-foreground">
                    Receipt {task.completion.receipt}
                  </span>
                ) : null}
              </Fact>
            ) : null}
          </DescriptionList>
        </Block>

        {extraDocs.length ? (
          <Block title="Documents needed">
            <ul className="flex flex-col gap-1 text-body-compact">
              {extraDocs.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <FileTextIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        <Block title="Advocates on this case">
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
                    {signatory ? "Vakalatnama" : "On the case"}
                  </span>
                </li>
              );
            })}
          </ul>
          {viewOnly ? (
            <p className="text-body-compact text-muted-foreground">{viewOnlyLineOf(kase, people)}</p>
          ) : null}
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

        {!preparedBy && !draftBy && task.files?.length ? (
          <Block title="Files">
            <FileList files={task.files} />
          </Block>
        ) : null}

        {/* The audit trail matters when questioned, not on every glance — folded away. */}
        <Collapsible className="flex flex-col gap-2">
          <CollapsibleTrigger className="group flex h-10 w-full items-center justify-between gap-2 rounded-lg text-left text-caption font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <span className="tabular-nums">History · {history.length}</span>
            <ChevronDownIcon
              aria-hidden
              className="size-4 transition-transform group-data-[state=open]:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Actions: the ONE teal action of the view is here; the table's row verbs are outline. */}
      {primary || secondary || markable || archivable ? (
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
          {markable && verb !== "Mark done" ? (
            <Button variant="ghost" disabled={offline || busy} onClick={onMarkDone}>
              Mark as done
            </Button>
          ) : null}
          {archivable ? (
            <Button variant="ghost" disabled={offline || busy} onClick={onArchive}>
              Archive
            </Button>
          ) : null}
        </div>
      ) : null}
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
