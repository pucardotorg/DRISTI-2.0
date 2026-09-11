"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";

import { CaseFileRegion } from "@/components/employee/case-file-screen";
import {
  CaseReviewMissing,
  CaseReviewShell,
  FILE_STICKY_TOP,
  PANEL,
  TAB_ROW,
} from "@/components/employee/case-review-shared";
import { useCourtToday } from "@/components/employee/use-court-today";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  caseChecksFor,
  caseFileCounts,
  caseReviewFor,
  caseSummaryFor,
  SUMMARY_TERMS,
  type CaseCheck,
  type CaseReview,
  type CaseSummary,
  type CaseSummaryStep,
  type CaseSummaryWindow,
} from "@/lib/employee/case-review";
import { cn } from "@/lib/utils";

/**
 * The magistrate's register decision — a pull request, reviewed.
 *
 * The owner's model (2026-09-11): *"the people who do pull requests do all the work; the
 * reviewer will just glance through something."* So the page is shaped like the page a
 * reviewer lands on. The complaint's identity and the two acts sit in the title row, as a
 * pull request's do; beneath them, two tabs — the **Summary**, which is what he decides
 * from, and the **Case file**, which is what he opens when something makes him want to
 * look. A tab rather than a disclosure because a reviewer moves between the conversation
 * and the diff and back, and a tab is the control that says both places exist and which
 * one he is in. The tab row sticks under the bar, so the way back is never off screen.
 *
 * The summary is built for the common case: most complaints are registered from it
 * without opening anything. It carries the case itself — the cheque, whether it is in
 * time, which documents are on the file, who the parties are, how scrutiny went — and
 * not the process around it. Everything on it is a field; nothing is a sentence composed
 * for this complaint.
 */
export function CaseReviewScreen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const review = caseReviewFor(caseId, today);
  const summary = caseSummaryFor(caseId, today);

  if (!review || !summary) return <CaseReviewMissing />;

  const flags = (caseChecksFor(caseId, today) ?? []).filter(
    (check) => check.class === "flag",
  );

  return (
    <CaseReviewShell review={review} hasCounsel={summary.advocate !== null}>
      <CaseTabs caseId={caseId} review={review} summary={summary} flags={flags} />
    </CaseReviewShell>
  );
}

/* ──────────────────────────────── the tabs ──────────────────────────────── */

type CaseTab = "summary" | "file";

/**
 * Which tab is open, held in the URL as `?file=1` — the same key the findings' deep links
 * and the old `/file` redirect already speak, so none of them change. Pushed rather than
 * replaced, so the browser's Back returns to the summary as well as the tab does.
 */
function useCaseTab(): [CaseTab, (next: CaseTab) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: CaseTab = params.get("file") === "1" ? "file" : "summary";

  const setTab = React.useCallback(
    (next: CaseTab) => {
      const query = new URLSearchParams(params.toString());
      if (next === "file") {
        query.set("file", "1");
      } else {
        query.delete("file");
        /* The document the pane was showing belongs to the file it was open in. */
        query.delete("doc");
      }
      const search = query.toString();
      router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [tab, setTab];
}

/**
 * The trigger's metrics, after `CaseSectionTabs` — the case page's own tab row. Labels
 * keep their widths (`flex-none`), read as screen copy (`text-body`), and the active mark
 * is moved from the primitive's padded-track position to the row's own rule, so the
 * underline sits on the line rather than floating five pixels under it (ui-craft §2).
 */
const TRIGGER = "h-full flex-none px-0.5 text-body after:-bottom-px";

function CaseTabs({
  caseId,
  review,
  summary,
  flags,
}: {
  caseId: string;
  review: CaseReview;
  summary: CaseSummary;
  flags: CaseCheck[];
}) {
  const [tab, setTab] = useCaseTab();
  const counts = caseFileCounts(review);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as CaseTab)}
      className="gap-6"
    >
      {/* Sticky under the 56px bar, on the canvas's own fill so what scrolls beneath it
          is covered cleanly. Bled to the page edge so the fill reaches the gutters; the
          rule stays at the content's width. */}
      <div className="sticky top-14 z-20 -mx-6 bg-muted px-6 md:-mx-8 md:px-8 dark:bg-background">
        <TabsList
          variant="line"
          className={cn(
            "w-full justify-start gap-6 rounded-none border-b border-hairline p-0",
            TAB_ROW,
          )}
        >
          <TabsTrigger value="summary" className={TRIGGER}>
            Summary
            {flags.length > 0 ? (
              <span className="text-warning-ink tabular-nums">
                <span className="sr-only">, </span>
                {flags.length}
                <span className="sr-only">
                  {flags.length === 1 ? " needs attention" : " need attention"}
                </span>
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="file" className={TRIGGER}>
            Case file
            <span className="text-muted-foreground tabular-nums">
              <span className="sr-only">, </span>
              {counts.documents}
              <span className="sr-only"> documents</span>
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="summary" className="text-body">
        <CaseSummaryView summary={summary} flags={flags} onOpenFile={() => setTab("file")} />
      </TabsContent>

      <TabsContent
        value="file"
        className="text-body"
        style={{ "--file-sticky-top": FILE_STICKY_TOP } as React.CSSProperties}
      >
        <CaseFileRegion caseId={caseId} review={review} />
      </TabsContent>
    </Tabs>
  );
}

/* ─────────────────────────────── the summary ────────────────────────────── */

function CaseSummaryView({
  summary,
  flags,
  onOpenFile,
}: {
  summary: CaseSummary;
  flags: CaseCheck[];
  onOpenFile: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {flags.length > 0 ? (
        <CaseAttention flags={flags} summary={summary} />
      ) : null}

      <section className={cn(PANEL, "p-0")} aria-label="Summary">
        <dl className="divide-y divide-hairline">
          <SummaryRow id="summary-cheque" term={SUMMARY_TERMS.cheque}>
            <ChequeFacts cheque={summary.cheque} />
          </SummaryRow>
          <SummaryRow id="summary-in-time" term={SUMMARY_TERMS.inTime}>
            <DateChain steps={summary.steps} windows={summary.windows} />
          </SummaryRow>
          <SummaryRow id="summary-documents" term={SUMMARY_TERMS.documents}>
            <DocumentFacts summary={summary} onOpenFile={onOpenFile} />
          </SummaryRow>
          <SummaryRow id="summary-parties" term={SUMMARY_TERMS.parties}>
            <PartyFacts summary={summary} />
          </SummaryRow>
          <SummaryRow id="summary-scrutiny" term={SUMMARY_TERMS.scrutiny}>
            <ScrutinyFacts scrutiny={summary.scrutiny} />
          </SummaryRow>
        </dl>
      </section>
    </div>
  );
}

/**
 * What needs the magistrate before he can register — only ever present when something
 * does. A clean complaint has no block here at all: every window on the chain reads
 * "within", every document reads on file, and that is the confirmation, stated on the
 * evidence rather than as a banner above it.
 *
 * The DS `Alert` in its warning variant, because this is a notice that reports a status
 * (ui-craft §2) — tinted fill, its own ink pair, icon and words, never colour alone.
 * `role="region"` rather than the primitive's `alert`: this is a standing part of the
 * page, not something that happened, and announcing it on arrival would interrupt a
 * screen reader before the title had been read.
 */
function CaseAttention({
  flags,
  summary,
}: {
  flags: CaseCheck[];
  summary: CaseSummary;
}) {
  return (
    <Alert variant="warning" role="region" aria-labelledby="case-attention-title">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle id="case-attention-title" className="font-semibold">
        {flags.length === 1
          ? "One thing needs your attention"
          : `${flags.length} things need your attention`}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1">
          {flags.map((flag) => (
            <li key={flag.id}>
              <a
                href={`#${ATTENTION_ROW[flag.id]}`}
                className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
              >
                {attentionText(flag, summary)}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/** Which summary row carries the evidence for each kind of finding. */
const ATTENTION_ROW: Record<CaseCheck["id"], string> = {
  "presentation-window": "summary-in-time",
  "notice-window": "summary-in-time",
  "premature-filing": "summary-in-time",
  "filing-window": "summary-in-time",
  "required-documents": "summary-documents",
  "advocate-on-record": "summary-parties",
  "part-payment": "summary-cheque",
};

/**
 * The finding as the alert states it. The window findings already name their dates and
 * the limit; the documents finding counts ("1 document the form required is not on
 * file"), which is vaguer than the row it points at — so here it names the documents.
 */
function attentionText(flag: CaseCheck, summary: CaseSummary): string {
  if (flag.id !== "required-documents") return flag.finding;
  const missing = [
    ...summary.documents.filter((doc) => !doc.onFile).map((doc) => doc.label),
    ...summary.otherMissing.map((doc) => doc.label),
  ];
  return missing.length > 0 ? `${missing.join(", ")} not on file` : flag.finding;
}

/**
 * One row of the summary: the attribute's name in a column of its own, its facts beside
 * it. The terms line up so the eye runs down one edge and stops at the row it wants —
 * the reading pattern a record page is for. Stacked below `md`, where a second column
 * would leave the facts a third of a phone to wrap in.
 */
function SummaryRow({
  id,
  term,
  children,
}: {
  id: string;
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="grid scroll-mt-(--file-sticky-top) gap-2 px-6 py-4 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-6"
      style={{ "--file-sticky-top": FILE_STICKY_TOP } as React.CSSProperties}
    >
      <dt className="text-body-compact font-medium text-muted-foreground md:pt-0.5">
        {term}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* ─────────────────────────────── the cheque ─────────────────────────────── */

function ChequeFacts({ cheque }: { cheque: CaseSummary["cheque"] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-semibold tabular-nums">{cheque.amount}</p>
      <p className="text-body-compact tabular-nums text-muted-foreground">
        {cheque.bank} · Cheque no. {cheque.number}
      </p>
      <p className="text-body-compact">Returned unpaid — {cheque.returnReason}</p>
      {cheque.partPaid ? (
        <p className="text-body-compact tabular-nums">
          {cheque.partPaid} paid towards it before filing
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────── the chain ──────────────────────────────── */

/**
 * The §138 chain, date by date, with each statutory window stated on the row where it
 * closes.
 *
 * This is what "7 checks ran" used to stand for, made visible. Whether a complaint is in
 * time is the question registration turns on, and three of its limits are spans between
 * dates the file already holds — so the magistrate is shown the dates and the spans, not
 * a count of comparisons he has to take on trust. A breach reads on the row itself.
 *
 * Laid out as a table rather than a horizontal line: these are legal dates to be read
 * precisely, and a column of them aligns on `tabular-nums` where a strip of them would
 * have to be squinted along. The window sits in a third column so the eye can run down
 * the dates without reading it, and across to it when a date prompts the question.
 */
function DateChain({
  steps,
  windows,
}: {
  steps: CaseSummaryStep[];
  windows: CaseSummaryWindow[];
}) {
  return (
    <ol className="flex flex-col">
      {steps.map((step) => {
        const window = windows.find((candidate) => candidate.to === step.id);
        return (
          <li
            key={step.id}
            className="grid gap-x-6 py-1 sm:grid-cols-[9rem_9rem_minmax(0,1fr)]"
          >
            <span className="text-body-compact text-muted-foreground">
              {step.label}
            </span>
            <time
              dateTime={step.on}
              className="text-body-compact tabular-nums"
            >
              {step.onLabel}
            </time>
            {window ? <WindowVerdict window={window} /> : <span aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One window, as the number of days against the limit. Only a breach takes ink, and it
 * says so in words; a window that is within reads muted, because on 32 complaints in 35
 * all three are, and three coloured confirmations on every file would mark the norm.
 *
 * `condonation-sought` is neither: the filing was late and an application to condone it
 * is on the file. Whether there was sufficient cause is the magistrate's call under
 * §142(b), so the row states the application — as a neutral badge, the slot a closed
 * status takes — and never decides it.
 */
function WindowVerdict({ window }: { window: CaseSummaryWindow }) {
  const span =
    window.id === "filing"
      ? `${window.days} days after the cause of action`
      : `${window.days} days`;

  switch (window.status) {
    case "within":
      return (
        <span className="text-body-compact tabular-nums text-muted-foreground">
          {span} · within {window.limitLabel}
        </span>
      );
    case "outside":
      return (
        <span className="flex items-baseline gap-1.5 text-body-compact tabular-nums text-warning-ink">
          <TriangleAlertIcon className="size-3.5 shrink-0 translate-y-0.5" aria-hidden />
          {span} · beyond the {window.limitLabel} allowed
        </span>
      );
    case "early":
      return (
        <span className="flex items-baseline gap-1.5 text-body-compact text-warning-ink">
          <TriangleAlertIcon className="size-3.5 shrink-0 translate-y-0.5" aria-hidden />
          Filed before the cause of action arose
        </span>
      );
    case "condonation-sought":
      return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-compact tabular-nums">
          {span} · beyond {window.limitLabel}
          <Badge variant="secondary">Condonation sought</Badge>
        </span>
      );
  }
}

/* ────────────────────────────── the documents ───────────────────────────── */

function DocumentFacts({
  summary,
  onOpenFile,
}: {
  summary: CaseSummary;
  onOpenFile: () => void;
}) {
  const missing = [
    ...summary.documents.filter((doc) => !doc.onFile).map((doc) => doc.label),
    ...summary.otherMissing.map((doc) => doc.label),
  ];
  const onFile = summary.documents.filter((doc) => doc.onFile);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body-compact">
        <span className="text-muted-foreground">On file </span>
        {onFile.map((doc) => doc.label).join(" · ")}
      </p>
      {missing.length > 0 ? (
        <p className="flex items-baseline gap-1.5 text-body-compact text-warning-ink">
          <TriangleAlertIcon className="size-3.5 shrink-0 translate-y-0.5" aria-hidden />
          <span>
            <span className="font-medium">Not on file </span>
            {missing.join(" · ")}
          </span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={onOpenFile}
        className="w-fit rounded-sm text-body-compact font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        Open them in the case file
      </button>
    </div>
  );
}

/* ─────────────────────────────── the parties ────────────────────────────── */

function PartyFacts({ summary }: { summary: CaseSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-caption font-medium text-muted-foreground">Complainant</p>
        <p className="font-medium">{summary.complainant.name}</p>
        <p className="text-body-compact text-muted-foreground">
          {summary.complainant.type} ·{" "}
          {summary.advocate ?? "No advocate on record"}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-caption font-medium text-muted-foreground">Accused</p>
        <p className="font-medium">{summary.accused.name}</p>
        <p className="text-body-compact text-muted-foreground">
          {summary.accused.type}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────── the scrutiny ───────────────────────────── */

/**
 * How the complaint got here — the first thing the owner said a magistrate reads, and
 * the summary of scrutiny rather than its annotations. No ink on the rounds or the days:
 * those are facts he weighs, and the screen does not get to tell a judge that three
 * rounds was too many.
 */
function ScrutinyFacts({ scrutiny }: { scrutiny: CaseSummary["scrutiny"] }) {
  if (!scrutiny) {
    return <p className="text-body-compact text-muted-foreground">Not recorded</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      <p>
        Cleared{" "}
        {scrutiny.mode === "officer"
          ? "by a registry officer"
          : "by automated scrutiny"}
      </p>
      <p className="text-body-compact tabular-nums text-muted-foreground">
        {scrutiny.rounds} {scrutiny.rounds === 1 ? "round" : "rounds"} over{" "}
        {scrutiny.days} {scrutiny.days === 1 ? "day" : "days"} · cleared{" "}
        <time dateTime={scrutiny.clearedOn}>{scrutiny.clearedOnLabel}</time>
      </p>
    </div>
  );
}

