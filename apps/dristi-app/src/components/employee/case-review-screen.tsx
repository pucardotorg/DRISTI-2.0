"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BanIcon,
  BanknoteIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  ScaleIcon,
  SendIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { CaseFileRegion } from "@/components/employee/case-file-screen";
import {
  CaseReviewMissing,
  CaseReviewShell,
  FILE_STICKY_TOP,
  PANEL,
  TAB_ROW,
} from "@/components/employee/case-review-shared";
import { useCourtToday } from "@/components/employee/use-court-today";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  caseFileCounts,
  caseReviewFor,
  caseSummaryFor,
  SUMMARY_TERMS,
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

  return (
    <CaseReviewShell review={review} hasCounsel={summary.advocate !== null}>
      <CaseTabs caseId={caseId} review={review} summary={summary} />
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
}: {
  caseId: string;
  review: CaseReview;
  summary: CaseSummary;
}) {
  const [tab, setTab] = useCaseTab();
  const counts = caseFileCounts(review);
  const attention = verdictsFor(summary).filter(
    (verdict) => verdict.tone === "attention",
  ).length;

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
            {attention > 0 ? (
              <span className="text-warning-ink tabular-nums">
                <span className="sr-only">, </span>
                {attention}
                <span className="sr-only">
                  {attention === 1 ? " needs attention" : " need attention"}
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

      {/* The court side's standard size, set once: every line in the summary is
          `text-body-compact` unless it says otherwise, and nothing in it does. */}
      <TabsContent value="summary" className="text-body-compact">
        <CaseSummaryView summary={summary} />
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

/**
 * The summary, built to be taken in by shape before it is read.
 *
 * A magistrate's question is "can I register this?", so the first thing on the page
 * answers it: four verdicts, each an icon and a word — in time, documents, scrutiny, other
 * complaints. A clean complaint is four checks in a row and he is done. Below it, who and
 * how much; then the §138 dates drawn as a line with the three limits bracketed under it,
 * so a late step is the one amber bracket rather than a number to compare; then the
 * particulars, each in a card he finds by its icon.
 *
 * Type is the court side's standard throughout: `text-body-compact` for everything,
 * weight and colour for hierarchy. One size, so nothing competes with the verdicts but
 * the verdicts' own icons.
 */
function CaseSummaryView({ summary }: { summary: CaseSummary }) {
  const { synopsis } = summary;

  return (
    <div className="flex flex-col gap-6">
      <VerdictStrip verdicts={verdictsFor(summary)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title={SUMMARY_TERMS.parties}
          icon={UsersIcon}
          className="lg:col-span-2"
        >
          <PartiesFacts summary={summary} />
        </SummaryCard>
        <SummaryCard title={SUMMARY_TERMS.cheque} icon={BanknoteIcon}>
          <div className="flex flex-col gap-1">
            <p className="font-semibold tabular-nums">{summary.cheque.amount}</p>
            <p className="tabular-nums text-muted-foreground">
              No. {summary.cheque.number} · {synopsis.cheque.drawerBank},{" "}
              {synopsis.cheque.drawerBranch}
            </p>
          </div>
          <IconLine icon={BanIcon}>Returned — {summary.cheque.returnReason}</IconLine>
          {summary.cheque.partPaid ? (
            <IconLine icon={WalletIcon}>
              <span className="tabular-nums">{summary.cheque.partPaid}</span> paid before
              filing
            </IconLine>
          ) : null}
        </SummaryCard>
      </div>

      <SummaryCard title={SUMMARY_TERMS.timeline} icon={CalendarDaysIcon}>
        <DateLine steps={summary.steps} windows={summary.windows} />
      </SummaryCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SummaryCard title={SUMMARY_TERMS.service} icon={MailIcon}>
          <IconLine icon={SendIcon}>
            {synopsis.notice.mode} ·{" "}
            <span className="font-mono tabular-nums">{synopsis.notice.tracking}</span>
          </IconLine>
          <IconLine icon={MessageSquareIcon}>
            {synopsis.notice.replied
              ? "The accused replied to the notice"
              : "No reply from the accused"}
          </IconLine>
          <IconLine icon={MapPinIcon}>
            {synopsis.causeOfAction.jurisdiction}
            <span className="text-muted-foreground">
              {" "}
              — {synopsis.causeOfAction.jurisdictionBasis.toLowerCase()}, S.142(2)
            </span>
          </IconLine>
        </SummaryCard>
        <SummaryCard title={SUMMARY_TERMS.relief} icon={ScaleIcon}>
          <dl className="flex flex-col gap-2">
            <ReliefLine term="Compensation" amount={synopsis.prayer.compensation} />
            <ReliefLine term="Interim, S.143A" amount={synopsis.prayer.interim} />
          </dl>
          <p className="text-muted-foreground">And punishment under S.138</p>
        </SummaryCard>
      </div>

    </div>
  );
}

/* ────────────────────────────── the verdicts ────────────────────────────── */

type Verdict = {
  title: string;
  tone: "clear" | "attention";
  icon: LucideIcon;
  detail: React.ReactNode;
};

/**
 * The four answers, in one row. An icon and a word each, so a clean complaint reads as
 * four checks before a single detail is read; a problem is an amber mark where a check
 * should be, and its detail says what. Colour sits on the icon only — the words carry the
 * status, the ink points at it.
 */
function verdictsFor(summary: CaseSummary): Verdict[] {
  const late = summary.windows.find((window) => window.status !== "within");
  const missing = [
    ...summary.documents.filter((doc) => !doc.onFile).map((doc) => doc.label),
    ...summary.otherMissing.map((doc) => doc.label),
  ];
  const { scrutiny } = summary;
  const pending = summary.synopsis.causeOfAction.otherPending;

  return [
    late
      ? {
          title: late.status === "condonation-sought" ? "Filed late" : "Out of time",
          tone: "attention",
          icon: TriangleAlertIcon,
          detail:
            late.status === "condonation-sought"
              ? "Condonation sought"
              : late.status === "early"
                ? "Filed before the cause of action"
                : `${WINDOW_NAME[late.id]} ${late.days}\u00a0days, beyond ${late.limitLabel.replace(" ", "\u00a0")}`,
        }
      : {
          title: SUMMARY_TERMS.inTime,
          tone: "clear",
          icon: CircleCheckIcon,
          detail: "All three limits met",
        },
    missing.length > 0
      ? {
          title: `${missing.length} ${missing.length === 1 ? "document" : "documents"} missing`,
          tone: "attention",
          icon: TriangleAlertIcon,
          detail: missing.join(", "),
        }
      : {
          title: SUMMARY_TERMS.documents,
          tone: "clear",
          icon: CircleCheckIcon,
          detail: "All on file",
        },
    scrutiny
      ? {
          title: `${SUMMARY_TERMS.scrutiny} cleared`,
          tone: "clear",
          icon: ShieldCheckIcon,
          detail: `${scrutiny.mode === "officer" ? "Registry officer" : "Automated"} · ${
            scrutiny.rounds
          }\u00a0${scrutiny.rounds === 1 ? "round" : "rounds"} · ${scrutiny.days}\u00a0days`,
        }
      : {
          title: SUMMARY_TERMS.scrutiny,
          tone: "attention",
          icon: CircleAlertIcon,
          detail: "Not recorded",
        },
    pending
      ? {
          title: "Another complaint pending",
          tone: "attention",
          icon: TriangleAlertIcon,
          detail: "Between the same parties",
        }
      : {
          title: `No ${SUMMARY_TERMS.otherComplaints.toLowerCase()}`,
          tone: "clear",
          icon: CircleCheckIcon,
          detail: "Between these parties",
        },
  ];
}

/**
 * The strip itself — the verdicts in one row, a check or an amber mark each.
 */
function VerdictStrip({ verdicts }: { verdicts: Verdict[] }) {
  return (
    <section
      className={cn(PANEL, "grid gap-6 sm:grid-cols-2 lg:grid-cols-4")}
      aria-label="Verdicts"
    >
      {verdicts.map((verdict) => {
        const Icon = verdict.icon;
        return (
          <div key={verdict.title} className="flex min-w-0 items-start gap-3">
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                verdict.tone === "clear" ? "text-success-ink" : "text-warning-ink",
              )}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-semibold">{verdict.title}</p>
              <p className="text-muted-foreground">{verdict.detail}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** What each window measures, for a verdict that has to name the one that failed. */
const WINDOW_NAME: Record<CaseSummaryWindow["id"], string> = {
  presentation: "Presented",
  notice: "Notice sent",
  filing: "Filed",
};

/* ───────────────────────────────── cards ────────────────────────────────── */

/**
 * One card: an icon and a name, then its content. The icon is how the eye finds the card
 * without reading its name; the name is `text-body-compact` at the heavier weight, the
 * same size as everything under it, so the card is told apart by weight and position
 * rather than by a size of its own.
 */
function SummaryCard({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(PANEL, "flex min-w-0 flex-col gap-4", className)}
      aria-label={title}
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A fact that reads as a sentence, led by the icon that says what kind of fact it is. */
function IconLine({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <p className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function ReliefLine({ term, amount }: { term: string; amount: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-semibold tabular-nums">{amount}</dd>
    </div>
  );
}

/* ─────────────────────────────── the parties ────────────────────────────── */

/**
 * "X v. Y", composed rather than listed — the way the cause is written, with a person or a
 * company told apart by its icon instead of by a label under the name.
 */
function PartiesFacts({ summary }: { summary: CaseSummary }) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <Party
        name={summary.complainant.name}
        role="Complainant"
        type={summary.complainant.type}
        extra={
          <span className="flex items-center gap-1.5">
            <BriefcaseIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {summary.advocate ?? (
              <span className="text-muted-foreground">No advocate on record</span>
            )}
          </span>
        }
      />
      <span
        className="hidden h-10 items-center font-semibold text-muted-foreground sm:flex"
        aria-hidden
      >
        v.
      </span>
      <Party name={summary.accused.name} role="Accused" type={summary.accused.type} />
    </div>
  );
}

function Party({
  name,
  role,
  type,
  extra,
}: {
  name: string;
  role: string;
  type: string;
  extra?: React.ReactNode;
}) {
  const Icon = type === "Company" ? Building2Icon : UserIcon;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold">{name}</p>
        <p className="text-muted-foreground">
          {role} · {type}
        </p>
        {extra ? <div className="mt-1">{extra}</div> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────── the dates ──────────────────────────────── */

/**
 * The §138 chain drawn as a line: seven dated points, and under the three spans the
 * statute limits, a bracket saying how long each took. Within the limit the bracket is a
 * check; outside it is the one amber mark on the line, so a late step is found by looking
 * rather than by comparing numbers.
 *
 * Drawn across from `xl`, where each point has the width a full date needs; below that it
 * is the same chain as a list, each limit stated on the step that closes it.
 */
function DateLine({
  steps,
  windows,
}: {
  steps: CaseSummaryStep[];
  windows: CaseSummaryWindow[];
}) {
  const indexOf = (id: CaseSummaryStep["id"]) => steps.findIndex((step) => step.id === id);

  return (
    <>
      <div className="hidden xl:block">
        <ol className="grid grid-cols-7">
          {steps.map((step, index) => (
            <li key={step.id} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span className="text-muted-foreground">{step.label}</span>
              <span className="relative flex h-3 w-full items-center justify-center" aria-hidden>
                {index > 0 ? (
                  <span className="absolute top-1/2 right-1/2 left-0 h-px bg-border" />
                ) : null}
                {index < steps.length - 1 ? (
                  <span className="absolute top-1/2 right-0 left-1/2 h-px bg-border" />
                ) : null}
                <span className="relative size-2.5 rounded-full bg-foreground" />
              </span>
              <time dateTime={step.on} className="font-medium tabular-nums">
                {step.onShortLabel}
              </time>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid grid-cols-7">
          {windows.map((window) => {
            const from = indexOf(window.from);
            return (
              <div
                key={window.id}
                className="flex flex-col items-center gap-2"
                style={{ gridColumn: `${from + 1} / ${from + 3}` }}
              >
                <span
                  className={cn(
                    "h-2 w-1/2 rounded-b-md border-x border-b",
                    window.status === "within" ? "border-border" : "border-warning",
                  )}
                  aria-hidden
                />
                <WindowNote window={window} />
              </div>
            );
          })}
        </div>
      </div>

      <ol className="flex flex-col gap-3 xl:hidden">
        {steps.map((step) => {
          const window = windows.find((candidate) => candidate.to === step.id);
          return (
            <li key={step.id} className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p>
                  <span className="text-muted-foreground">{step.label} </span>
                  <time dateTime={step.on} className="font-medium tabular-nums">
                    {step.onLabel}
                  </time>
                </p>
                {window ? <WindowNote window={window} /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/**
 * How long a limited span took, against its limit. A check when within; the amber mark
 * and the words when not. A late filing with an application to condone it is the
 * magistrate's call under §142(b), so it says the application is there and decides
 * nothing.
 */
function WindowNote({ window }: { window: CaseSummaryWindow }) {
  /* The count and its unit are one token — a non-breaking space keeps "8 days" from
     splitting across lines — and the whole note is one text run, so the icon's gap never
     lands between a number and its comma. */
  const days = `${window.days}\u00a0${window.days === 1 ? "day" : "days"}`;
  const limit = window.limitLabel.replace(" ", "\u00a0");
  switch (window.status) {
    case "within":
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CircleCheckIcon className="size-4 shrink-0 text-success-ink" aria-hidden />
          <span className="tabular-nums">{`${days}, within ${limit}`}</span>
        </span>
      );
    case "outside":
      return (
        <span className="flex items-center gap-1.5 font-medium text-warning-ink">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          <span className="tabular-nums">{`${days}, beyond ${limit}`}</span>
        </span>
      );
    case "early":
      return (
        <span className="flex items-center gap-1.5 font-medium text-warning-ink">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          <span>Before the cause of action</span>
        </span>
      );
    case "condonation-sought":
      return (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-warning-ink xl:justify-center">
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
          <span className="font-medium tabular-nums">{`${days}, beyond ${limit}`}</span>
          <Badge variant="secondary">Condonation sought</Badge>
        </span>
      );
  }
}
