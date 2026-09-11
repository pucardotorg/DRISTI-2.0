"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  FileQuestionIcon,
  Undo2Icon,
} from "lucide-react";

import { CaseFileView } from "@/components/employee/register-case-file-v3";
import { useCourtToday } from "@/components/employee/use-court-today";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  CASE_REVIEW_STATUS,
  caseReviewFor,
  caseSummaryFor,
  SCRUTINY_MODES,
  SUMMARY_TERMS,
  SYNOPSIS_FIELDS,
  type CaseReview,
  type CaseScrutiny,
  type CaseSummary,
  type CaseSummaryWindow,
} from "@/lib/employee/case-review";
import { causeTitle } from "@/lib/employee/hearings";
import {
  REGISTER_QUEUE,
  registerCaseById,
  type RegisterCase,
} from "@/lib/employee/register-cases";
import { cn } from "@/lib/utils";

/**
 * Register cases, third build — one waiting complaint, as the magistrate reads it before
 * taking it on the register or sending it back to scrutiny.
 *
 * The second build was a column of eight identical cards: three screens tall, every date
 * stated twice, forty per cent of the canvas empty. This one is composed around two
 * questions the owner put — *what does the complaint say*, and *how did it get here* —
 * across the full width, in two tiers on one column grid (brief §0).
 *
 * - **Synopsis** is one sheet of six compartments in the owner's order — parties, cheque,
 *   dishonour, demand notice, cause of action, prayer — divided by hairlines, each fact a
 *   label over its value. No dates: those are the timeline's.
 * - **Scrutiny** — who cleared it, rounds, how long, what each round was sent back for.
 * - **Timeline** — collapsed to the spans that decide it (each statutory window against
 *   its limit, and the wait since scrutiny); opened, it adds the dated steps in place.
 *
 * Every value comes from `lib/employee/case-review.ts` through one slot; every term from
 * its declared lists. Colour appears only where the file is outside a limit or another
 * complaint is pending. 14px throughout; 12px only for the two eyebrows.
 *
 * Two acts and no third (owner, 2026-09-11). Both progress in place — the body gives way
 * to one card, the header stays, and confirming settles that same card into its outcome.
 * Nothing is performed, and the settled state says so once.
 */
export function RegisterCaseV3Screen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const complaint = registerCaseById(caseId);
  const summary = caseSummaryFor(caseId, today);
  const review = caseReviewFor(caseId, today);

  if (!complaint || !summary || !review) return <ComplaintMissing />;

  /* Keyed on the complaint, so "Next complaint" opens a fresh page rather than the
     previous complaint's settled act. */
  return (
    <ComplaintPage key={caseId} complaint={complaint} summary={summary} review={review} />
  );
}

/** Where this queue lives — its rows open beneath it. */
const QUEUE_HREF = "/employee/register-cases-v3";

/** Section labels above a surface — scaffolding, so it reads as scaffolding. */
const EYEBROW = "text-caption font-semibold text-muted-foreground";

/**
 * The two directions the body moves. The act arrives from the right, where it is going;
 * Back brings the summary in from the left, where it came from. `fill-mode-both` holds
 * the first frame so nothing flashes before it moves; reduced motion gets a plain swap.
 */
const SLIDE = {
  forward:
    "animate-in fade-in-0 slide-in-from-right-8 fill-mode-both duration-300 motion-reduce:animate-none",
  back: "animate-in fade-in-0 slide-in-from-left-8 fill-mode-both duration-300 motion-reduce:animate-none",
} as const;

/* ─────────────────────────────── the page ───────────────────────────────── */

type Act = "register" | "send-back";
type Stage = { act: Act; settled: boolean };

/**
 * The frame: warm canvas, the header naming the complaint and holding the two acts, then
 * either the tabs or the act in progress.
 *
 * `bg-muted` in light, `dark:bg-background` in dark — the canvas under lifted white
 * panels that the registrations queue set as the default. `overflow-x-clip` keeps the
 * sideways entrance from flashing a scrollbar; it clips without becoming a scroll
 * container, so the sticky tab row still sticks.
 *
 * Both tabs are pages that scroll; the tab row sticks under the chrome bar on either.
 */
function ComplaintPage({
  complaint,
  summary,
  review,
}: {
  complaint: RegisterCase;
  summary: CaseSummary;
  review: CaseReview;
}) {
  const [tab, setTab] = useComplaintTab();
  const [stage, setStage] = React.useState<Stage | null>(null);
  /* Null on arrival: nothing slides in when the page first opens. */
  const [motion, setMotion] = React.useState<keyof typeof SLIDE | null>(null);
  /* The act that was backed out of — its button takes focus again when the header's
     acts return, rather than focus falling to the page. */
  const [returnFocus, setReturnFocus] = React.useState<Act | null>(null);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip bg-muted dark:bg-background">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6 px-6 pt-6 pb-12 md:px-8 md:pt-8">
        <ComplaintHeader
          complaint={complaint}
          acting={stage !== null}
          returnFocus={returnFocus}
          onAct={(act) => {
            setMotion("forward");
            setStage({ act, settled: false });
          }}
        />

        {stage === null ? (
          <div className={cn("min-w-0", motion && SLIDE[motion])}>
            <ComplaintTabs tab={tab} setTab={setTab} summary={summary} review={review} />
          </div>
        ) : (
          <ActStage
            key={stage.act}
            act={stage.act}
            settled={stage.settled}
            next={nextInQueue(complaint.id)}
            onBack={() => {
              setMotion("back");
              setReturnFocus(stage.act);
              setStage(null);
            }}
            onConfirm={() => setStage({ act: stage.act, settled: true })}
          />
        )}
      </div>
    </div>
  );
}

/** The complaint after this one, in the queue's own order — or none at the end. */
function nextInQueue(id: string): RegisterCase | null {
  const index = REGISTER_QUEUE.findIndex((complaint) => complaint.id === id);
  return index >= 0 ? (REGISTER_QUEUE[index + 1] ?? null) : null;
}

/**
 * Which complaint, and what can be done with it. The number above the cause, the two
 * acts opposite: send back is outline, register the page's one primary. The acts leave
 * while one is in progress — the act's own card carries its controls.
 */
function ComplaintHeader({
  complaint,
  acting,
  returnFocus,
  onAct,
}: {
  complaint: RegisterCase;
  acting: boolean;
  returnFocus: Act | null;
  onAct: (act: Act) => void;
}) {
  return (
    <header
      aria-labelledby="complaint-title"
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-compact tabular-nums text-muted-foreground">
          {complaint.caseNumber}
        </p>
        <h1
          id="complaint-title"
          className="text-balance font-semibold text-title"
        >
          {causeTitle(complaint)}
        </h1>
      </div>
      {acting ? null : <HeaderActs returnFocus={returnFocus} onAct={onAct} />}
    </header>
  );
}

/** The two acts. Mounting again after Back, they hand focus to the one backed out of. */
function HeaderActs({
  returnFocus,
  onAct,
}: {
  returnFocus: Act | null;
  onAct: (act: Act) => void;
}) {
  const sendBackRef = React.useRef<HTMLButtonElement>(null);
  const registerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (returnFocus === "send-back") sendBackRef.current?.focus();
    if (returnFocus === "register") registerRef.current?.focus();
    // On mount only: this is the moment the acts come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex shrink-0 flex-wrap gap-3">
      <Button
        ref={sendBackRef}
        type="button"
        variant="outline"
        onClick={() => onAct("send-back")}
      >
        Send back to scrutiny
      </Button>
      <Button ref={registerRef} type="button" onClick={() => onAct("register")}>
        Register
      </Button>
    </div>
  );
}

/* ─────────────────────────────── the tabs ───────────────────────────────── */

type ComplaintTab = "summary" | "file";

/** Which tab is open, held in the URL as `?file=1` so the browser's Back closes it. */
function useComplaintTab(): [ComplaintTab, (next: ComplaintTab) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: ComplaintTab = params.get("file") === "1" ? "file" : "summary";

  const setTab = React.useCallback(
    (next: ComplaintTab) => {
      const query = new URLSearchParams(params.toString());
      if (next === "file") query.set("file", "1");
      else query.delete("file");
      const search = query.toString();
      router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [tab, setTab];
}

/**
 * The DS trigger at the page's one size, keeping its width.
 *
 * **The underline sits on the row's rule, and spans the label.** The primitive hangs its
 * mark at `bottom: -5px` for a padded track, under a selector scoped to the horizontal
 * group — so a plain `after:-bottom-px` loses on specificity and the mark rendered 3px
 * below the rule, as a second line (measured: rule at 211px, mark at 214–216px). The
 * override has to carry the same scope to replace it, which is how every other tab row
 * in the app writes it (`case-section-tabs.tsx`). `px-0` takes the primitive's side
 * padding off, so the mark is the label's width and the first label lines up with the
 * cause title above it.
 */
const TRIGGER =
  "h-full flex-none px-0 text-body-compact group-data-horizontal/tabs:after:-bottom-px";

function ComplaintTabs({
  tab,
  setTab,
  summary,
  review,
}: {
  tab: ComplaintTab;
  setTab: (next: ComplaintTab) => void;
  summary: CaseSummary;
  review: CaseReview;
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as ComplaintTab)}
      className="gap-6"
    >
      {/* Sticky under the 56px bar, on the canvas's own fill and bled to the page edge
          so what scrolls beneath is covered cleanly. The rule is the band's, full width,
          as a sticky bar's edge is. */}
      <div className="sticky top-14 z-20 -mx-6 border-b border-hairline bg-muted px-6 md:-mx-8 md:px-8 dark:bg-background">
        <TabsList
          variant="line"
          className="w-full justify-start gap-6 rounded-none p-0 group-data-horizontal/tabs:h-11"
        >
          <TabsTrigger value="summary" className={TRIGGER}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="file" className={TRIGGER}>
            Case file
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="summary" className="text-body-compact">
        <ComplaintSummary summary={summary} />
      </TabsContent>

      <TabsContent value="file" className="text-body-compact">
        <CaseFileView review={review} />
      </TabsContent>
    </Tabs>
  );
}

/* ─────────────────────────────── the summary ────────────────────────────── */

/**
 * The summary in two tiers, across the full width.
 *
 * On top, the **synopsis** — the complaint's own account, the owner's six heads. Below it,
 * the court's record of the file: **scrutiny** in the first third and the **timeline** in
 * the other two, so the gap between them falls on the synopsis's first column divider and
 * the page keeps one column grid from top to bottom. Below 1280px the tiers stack.
 *
 * Every surface is the approved grammar — an eyebrow over a lifted white panel on the
 * warm canvas — and every fact inside is a label over its value, at 14px.
 */
function ComplaintSummary({ summary }: { summary: CaseSummary }) {
  return (
    <div className="grid items-start gap-x-6 gap-y-8 xl:grid-cols-3">
      <SynopsisPanel summary={summary} />
      <ScrutinyPanel scrutiny={summary.scrutiny} />
      <TimelinePanel summary={summary} />
    </div>
  );
}

/** A lifted white panel whose children draw their own padding and dividers. */
const SHEET = "gap-0 overflow-hidden border-hairline py-0 shadow-raised";

/** An eyebrow over the surface it names. */
function Panel({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <h2 id={id} className={EYEBROW}>
        {label}
      </h2>
      {children}
    </section>
  );
}

/**
 * The synopsis as one sheet of six compartments.
 *
 * Each head is a cell, and the cells are divided by 1px hairlines drawn as the grid's own
 * gap over a hairline fill — so the dividers are exact at every column count and never
 * double up where two cells meet. The sheet is its own container and chooses its columns
 * by the room it has: three from 896px, two from 576px, one on a phone. Six heads divide
 * evenly into all three, so no cell is ever left empty.
 *
 * **No dates here.** Each date is stated once, on the timeline. The owner's synopsis
 * format lists them under each head; moving them is the one deviation from it, and it is
 * logged (brief §0, D2).
 */
function SynopsisPanel({ summary }: { summary: CaseSummary }) {
  const { synopsis, cheque } = summary;

  return (
    <Panel id="synopsis-heading" label={SUMMARY_TERMS.synopsis} className="xl:col-span-3">
      <Card className={cn(SHEET, "@container")}>
        <div className="grid gap-px bg-hairline @xl:grid-cols-2 @4xl:grid-cols-3">
          <SynopsisSection label={SUMMARY_TERMS.parties}>
            <Fact term={SYNOPSIS_FIELDS.complainant} note={summary.complainant.type}>
              {summary.complainant.name}
            </Fact>
            {/* No type under the accused: every accused in the queue is a company, and a
                value identical on every file is not a fact. */}
            <Fact term={SYNOPSIS_FIELDS.accused}>{summary.accused.name}</Fact>
            <Fact term={SYNOPSIS_FIELDS.advocate}>
              {summary.advocate ?? <Absent>None on record</Absent>}
            </Fact>
          </SynopsisSection>

          <SynopsisSection label={SUMMARY_TERMS.cheque}>
            <Fact
              term={SYNOPSIS_FIELDS.amount}
              format="figure"
              note={cheque.partPaid ? `${cheque.partPaid} paid before filing` : undefined}
            >
              {cheque.amount}
            </Fact>
            <Fact term={SYNOPSIS_FIELDS.chequeNumber} format="figure">
              {cheque.number}
            </Fact>
            <Fact term={SYNOPSIS_FIELDS.drawnOn} note={synopsis.cheque.drawerBranch}>
              {synopsis.cheque.drawerBank}
            </Fact>
          </SynopsisSection>

          <SynopsisSection label={SUMMARY_TERMS.dishonour}>
            <Fact term={SYNOPSIS_FIELDS.presentedAt} note={synopsis.dishonour.payeeBranch}>
              {synopsis.dishonour.payeeBank}
            </Fact>
            <Fact term={SYNOPSIS_FIELDS.returnReason}>{cheque.returnReason}</Fact>
          </SynopsisSection>

          <SynopsisSection label={SUMMARY_TERMS.notice}>
            <Fact term={SYNOPSIS_FIELDS.mode}>{synopsis.notice.mode}</Fact>
            <Fact term={SYNOPSIS_FIELDS.tracking} format="code">
              {synopsis.notice.tracking}
            </Fact>
            <Fact term={SYNOPSIS_FIELDS.replied}>
              {synopsis.notice.replied ? "Received" : <Absent>None</Absent>}
            </Fact>
          </SynopsisSection>

          <SynopsisSection label={SUMMARY_TERMS.causeOfAction}>
            {/* The branch alone: the basis beside it read "Complainant's bank branch" on
                every complaint in the queue, which is a caption, not a fact. */}
            <Fact term={SYNOPSIS_FIELDS.jurisdiction}>
              {synopsis.causeOfAction.jurisdiction}
            </Fact>
            <Fact
              term={SYNOPSIS_FIELDS.otherPending}
              tone={synopsis.causeOfAction.otherPending ? "warning" : undefined}
            >
              {synopsis.causeOfAction.otherPending ? "One pending" : <Absent>None</Absent>}
            </Fact>
          </SynopsisSection>

          <SynopsisSection label={SUMMARY_TERMS.prayer}>
            <Fact term={SYNOPSIS_FIELDS.compensation} format="figure">
              {synopsis.prayer.compensation}
            </Fact>
            <Fact term={SYNOPSIS_FIELDS.interim} format="figure">
              {synopsis.prayer.interim}
            </Fact>
          </SynopsisSection>
        </div>
      </Card>
    </Panel>
  );
}

/**
 * One compartment of the synopsis: the head's name, then its particulars. White on the
 * hairline fill, so its edges are the dividers.
 */
function SynopsisSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4 bg-card p-6">
      <h3 id={id} className="text-body-compact font-semibold">
        {label}
      </h3>
      <DescriptionList className="gap-4">{children}</DescriptionList>
    </section>
  );
}

/** How a value is set: plain, as a figure that lines up, or as a code. */
const FORMAT = {
  text: "",
  figure: "tabular-nums",
  code: "font-mono tabular-nums",
} as const;

type FactFormat = keyof typeof FORMAT;

/**
 * One particular — its label above its value, and an optional second line beneath.
 *
 * Stacked rather than side by side: the compartments are a third of the page wide, and a
 * label column beside a value column left each value a sliver of it. A value is read on
 * its own line, at full weight, with the label just above to say what it is. `tone` is
 * the one colour a value can take, and only where the file needs the reader's attention.
 */
function Fact({
  term,
  format = "text",
  tone,
  note,
  className,
  children,
}: {
  term: string;
  format?: FactFormat;
  tone?: "warning";
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DescriptionRow className={cn("flex min-w-0 flex-col gap-1 border-0 py-0", className)}>
      <DescriptionTerm className="text-body-compact">{term}</DescriptionTerm>
      <DescriptionDetails className="min-w-0 text-body-compact">
        <span
          className={cn(
            "block",
            FORMAT[format],
            tone === "warning" && "text-warning-ink",
          )}
        >
          {children}
        </span>
        {note ? <span className="block text-muted-foreground">{note}</span> : null}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** A value that is an absence — said in words, in the quiet voice. */
function Absent({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

/* ─────────────────────────────── scrutiny ───────────────────────────────── */

/**
 * How scrutiny went — who cleared it, how many rounds, how long, and what each round
 * before the last was sent back for: the kind of defect, never the officer's remark.
 *
 * The two figures sit side by side because they are read together ("three rounds, a
 * month"); the officer and the defects take the full width because they are words. A
 * complaint cleared first time has nothing to list, and the round count already says so.
 */
function ScrutinyPanel({ scrutiny }: { scrutiny: CaseScrutiny | undefined }) {
  return (
    <Panel id="scrutiny-heading" label={SUMMARY_TERMS.scrutiny}>
      <Card className={cn(SHEET, "@container")}>
        <div className="p-6">
          {scrutiny ? (
            /* Two columns in a third of the page; one row of four once the panel has the
               width — below 1280px it spans the page, and four facts stacked in two wide
               columns left most of it empty. The defects take a double share of that row:
               they are words, and at an equal share each one wrapped to two lines. */
            <DescriptionList className="grid grid-cols-2 gap-x-6 gap-y-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
              <Fact term={SYNOPSIS_FIELDS.clearedBy} className="col-span-2 @2xl:col-span-1">
                {SCRUTINY_MODES[scrutiny.mode]}
              </Fact>
              <Fact term={SYNOPSIS_FIELDS.rounds} format="figure">
                {scrutiny.rounds}
              </Fact>
              <Fact term={SYNOPSIS_FIELDS.took} format="figure">
                {days(scrutiny.days)}
              </Fact>
              {scrutiny.returns.length > 0 ? (
                <Fact term={SYNOPSIS_FIELDS.sentBack} className="col-span-2 @2xl:col-span-1">
                  <ol className="flex flex-col gap-1">
                    {scrutiny.returns.map((sendBack) => (
                      <li key={sendBack.round} className="flex gap-3">
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          Round {sendBack.round}
                        </span>
                        <span className="min-w-0">{sendBack.label}</span>
                      </li>
                    ))}
                  </ol>
                </Fact>
              ) : null}
            </DescriptionList>
          ) : (
            <p className="text-body-compact text-muted-foreground">Not recorded</p>
          )}
        </div>
      </Card>
    </Panel>
  );
}

/* ─────────────────────────────── the timeline ───────────────────────────── */

/**
 * How long everything took, and — on request — when.
 *
 * **Collapsed, it is the spans** (owner, 2026-09-11: *"the timeline does not need to be
 * fully shown all the time"*). The three statutory windows, each the days it took against
 * what the law allows, and the days the complaint has waited here since scrutiny. That is
 * the part a register decision turns on, and the only colour on it is a window the file
 * is outside of — so a time-barred complaint cannot hide behind a closed disclosure.
 *
 * **Open, it adds the dates**, in place, below the spans: the §138 chain in one column and
 * the court's steps in the other. The measures are not repeated beside the dates — each
 * is already stated once, above. The toggle stays at the foot of the panel in both states,
 * so the thing that opened it is where the eye left it.
 */
function TimelinePanel({ summary }: { summary: CaseSummary }) {
  const [open, setOpen] = React.useState(false);
  const { scrutiny } = summary;
  const beforeFiling = summary.steps.filter((step) => step.id !== "filed");
  const filed = summary.steps.find((step) => step.id === "filed");

  return (
    <Panel id="timeline-heading" label={SUMMARY_TERMS.timeline} className="xl:col-span-2">
      <Card className={cn(SHEET, "@container")}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <DescriptionList className="grid gap-6 p-6 @md:grid-cols-2 @3xl:grid-cols-4">
            {summary.windows.map((window) => (
              <WindowSpan key={window.id} window={window} />
            ))}
            {scrutiny ? (
              <Span
                label={CASE_REVIEW_STATUS}
                value={scrutiny.daysWaiting === 0 ? "Cleared today" : days(scrutiny.daysWaiting)}
                note={scrutiny.daysWaiting === 0 ? undefined : "Since scrutiny"}
              />
            ) : null}
          </DescriptionList>

          <CollapsibleContent className="border-t border-hairline animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none">
            <div className="grid gap-x-12 gap-y-8 p-6 @2xl:grid-cols-2">
              <StepGroup heading="Before filing">
                {beforeFiling.map((step) => (
                  <Step
                    key={step.id}
                    label={step.label}
                    date={<time dateTime={step.on}>{step.onShortLabel}</time>}
                  />
                ))}
              </StepGroup>
              <StepGroup heading="In court">
                {filed ? (
                  <Step
                    label={filed.label}
                    date={<time dateTime={filed.on}>{filed.onShortLabel}</time>}
                  />
                ) : null}
                {scrutiny ? (
                  <Step
                    label={SUMMARY_TERMS.scrutiny}
                    date={
                      <>
                        <time dateTime={scrutiny.takenUpOn}>
                          {scrutiny.takenUpOnShortLabel}
                        </time>
                        {" – "}
                        <time dateTime={scrutiny.clearedOn}>
                          {scrutiny.clearedOnShortLabel}
                        </time>
                      </>
                    }
                  />
                ) : null}
                <Step status="current" label={CASE_REVIEW_STATUS} date="Today" />
              </StepGroup>
            </div>
          </CollapsibleContent>

          <div className="flex justify-center border-t border-hairline p-2">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="text-body-compact">
                {open ? "Hide dates" : "Show dates"}
                <ChevronDownIcon
                  aria-hidden
                  className={cn(
                    "text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      </Card>
    </Panel>
  );
}

/**
 * One measured span: what closed it, how many days, and where that sits against the
 * limit. The figure carries the weight; the limit is the quiet line under it — unless the
 * file is outside it, when both take the warning ink.
 */
function Span({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "warning";
}) {
  return (
    <DescriptionRow className="flex min-w-0 flex-col gap-1 border-0 py-0">
      <DescriptionTerm className="text-body-compact">{label}</DescriptionTerm>
      <DescriptionDetails
        className={cn(
          "min-w-0 text-body-compact",
          tone === "warning" && "text-warning-ink",
        )}
      >
        <span className="block font-medium tabular-nums">{value}</span>
        {note ? (
          <span className={cn("block", tone !== "warning" && "text-muted-foreground")}>
            {note}
          </span>
        ) : null}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/** A statutory window as a span — the days it took, against the limit the law sets. */
function WindowSpan({ window }: { window: CaseSummaryWindow }) {
  const limit = window.limitLabel;
  switch (window.status) {
    case "within":
      return <Span label={window.label} value={days(window.days)} note={`Within ${limit}`} />;
    case "outside":
      return (
        <Span
          label={window.label}
          value={days(window.days)}
          note={`Beyond ${limit}`}
          tone="warning"
        />
      );
    case "condonation-sought":
      return (
        <Span
          label={window.label}
          value={days(window.days)}
          note={`Beyond ${limit} · condonation sought`}
          tone="warning"
        />
      );
    case "early":
      return (
        <Span
          label={window.label}
          value="Early"
          note="Before the cause of action arose"
          tone="warning"
        />
      );
  }
}

/** One column of dated steps, under the phase it belongs to. */
function StepGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h3 className="text-body-compact font-semibold text-muted-foreground">{heading}</h3>
      <Timeline className="text-body-compact">{children}</Timeline>
    </div>
  );
}

/**
 * One step: its name, and its date against the far edge where dates line up. Composed as
 * the item's children because the DS item's own title slot takes a string, and a step's
 * date is a `<time>`.
 *
 * **The spacing between steps lives inside the step, not under it.** The DS item spaces
 * itself with `pb-6` on the `li`, and its rail stretches only to the item's content box —
 * so on the render the line stopped at every step and the gap between them was blank.
 * Moving the spacing into the content makes the rail run through it to the next dot.
 * Upstream DS feedback: the rail should span the item's padding (brief §0.5).
 */
function Step({
  status = "past",
  label,
  date,
}: {
  status?: "past" | "current";
  label: string;
  date: React.ReactNode;
}) {
  return (
    <TimelineItem status={status} className="pb-0">
      {/* Regular weight: the group's heading is the one semibold line in the column, and
          the date's muted ink is what separates it from the step's name. */}
      <p className="flex items-baseline justify-between gap-4 pb-4 group-last/timeline-item:pb-0">
        <span className="min-w-0">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{date}</span>
      </p>
    </TimelineItem>
  );
}

function days(count: number): string {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

/* ─────────────────────────────── the acts ───────────────────────────────── */

/**
 * The act, as one card that becomes its own outcome — the registrations queue's decision
 * card, on a page.
 *
 * A strip across the top names what is happening; confirming resolves it in place into
 * what happened, in the status's own muted pair, and the controls under the card change
 * from Back and the act to where to go next. Nothing translates and nothing unmounts, so
 * the eye never has to find its place again.
 *
 * Send back needs a reason before it will go — the one gate, shown only once it has been
 * tripped. Register needs nothing but the consequence stated.
 */
function ActStage({
  act,
  settled,
  next,
  onBack,
  onConfirm,
}: {
  act: Act;
  settled: boolean;
  next: RegisterCase | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const sending = act === "send-back";
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const empty = reason.trim() === "";
  const stripRef = React.useRef<HTMLParagraphElement>(null);
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);

  /* Focus follows the stage: into the box when there is one to fill, otherwise onto the
     strip, which is what just changed. */
  React.useEffect(() => {
    if (sending && !settled) reasonRef.current?.focus();
    else stripRef.current?.focus();
  }, [sending, settled]);

  function confirm() {
    if (sending && empty) {
      setTouched(true);
      reasonRef.current?.focus();
      return;
    }
    onConfirm();
  }

  return (
    <section
      aria-labelledby="act-strip"
      className={cn("flex min-w-0 flex-1 flex-col items-center pb-8", SLIDE.forward)}
    >
      <div className="flex w-full max-w-xl flex-col gap-4 md:my-auto">
        <Card size="sm" className="gap-0 border-hairline py-0 shadow-raised">
          <ActStrip act={act} settled={settled} stripRef={stripRef} />

          <div className="p-4">
            {sending ? (
              settled ? (
                /* The box fills in rather than leaving: the same footprint, holding the
                   same words, so the card does not collapse as it settles. */
                <p className="min-h-32 rounded-lg bg-surface-sunken p-3 text-body-compact whitespace-pre-line text-pretty animate-in fade-in-0 duration-500 motion-reduce:animate-none">
                  {reason}
                </p>
              ) : (
                <Field data-invalid={touched && empty}>
                  <FieldLabel htmlFor="send-back-reason" className="text-body-compact font-medium">
                    Why are you sending this back?
                  </FieldLabel>
                  <Textarea
                    id="send-back-reason"
                    ref={reasonRef}
                    className="min-h-32 text-body-compact"
                    placeholder="e.g. The affidavit is not attested. Please ask the advocate to file an attested copy."
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setTouched(true);
                    }}
                  />
                  {touched && empty ? <FieldError>Write a reason first.</FieldError> : null}
                </Field>
              )
            ) : (
              <p className="text-body-compact text-muted-foreground">
                Registering takes cognizance of the complaint. It cannot be undone from
                this screen.
              </p>
            )}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {settled ? (
            <>
              <Button asChild variant={next ? "ghost" : "default"}>
                <Link href={QUEUE_HREF}>Back to register cases</Link>
              </Button>
              {next ? (
                <Button asChild>
                  <Link href={`${QUEUE_HREF}/${next.id}`}>Next complaint</Link>
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={onBack}>
                Back
              </Button>
              <Button type="button" onClick={confirm}>
                {sending ? "Send back" : "Register"}
              </Button>
            </>
          )}
        </div>

        {/* Reserved before the act and revealed after it, so nothing below the card
            moves at the moment the card claims to stay still. */}
        <p
          aria-hidden={!settled}
          className={cn(
            "text-center text-caption text-pretty text-muted-foreground",
            settled ? "animate-in fade-in-0 duration-500 motion-reduce:animate-none" : "invisible",
          )}
        >
          {sending
            ? "Not part of this build — the reason was not sent anywhere."
            : "Not part of this build — nothing was registered and nobody was told."}
        </p>
      </div>
    </section>
  );
}

/**
 * The one thing that changes when the act is performed. Before: white, with a rule under
 * it, naming what is about to happen. After: the outcome's muted pair — success for
 * registered, warning for sent back — with a 16px mark and one line. Keyed so the swap
 * replays its entrance: a fade and a millimetre of fall.
 */
function ActStrip({
  act,
  settled,
  stripRef,
}: {
  act: Act;
  settled: boolean;
  stripRef: React.RefObject<HTMLParagraphElement | null>;
}) {
  const sending = act === "send-back";
  const Mark = sending ? Undo2Icon : CircleCheckIcon;

  return (
    <div
      key={settled ? "settled" : "open"}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 animate-in fade-in-0 duration-500 motion-reduce:animate-none",
        !settled && "border-b border-hairline text-muted-foreground",
        settled && "slide-in-from-top-1",
        settled && !sending && "bg-success-muted text-success-muted-foreground",
        settled && sending && "bg-warning-muted text-warning-muted-foreground",
      )}
    >
      {settled ? <Mark aria-hidden className="size-4 shrink-0" /> : null}
      <p
        id="act-strip"
        ref={stripRef}
        tabIndex={-1}
        role={settled ? "status" : undefined}
        className="text-body-compact font-medium outline-none"
      >
        {settled
          ? sending
            ? "Sent back to scrutiny"
            : "Registered"
          : sending
            ? "You are sending this back to scrutiny"
            : "You are registering"}
      </p>
    </div>
  );
}

/* ─────────────────────────────── the miss ───────────────────────────────── */

/** An id this queue does not hold — a stale link, a typed URL, a complaint gone. */
function ComplaintMissing() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6 md:p-8">
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-semibold text-title-s">
            This complaint is not in the register queue
          </EmptyTitle>
          <EmptyDescription className="text-body">
            A complaint opens from the list of those waiting to be registered. This one
            is not on it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={QUEUE_HREF}>Back to register cases</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
