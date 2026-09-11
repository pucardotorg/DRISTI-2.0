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
import { ReviewRow } from "@/components/cases/filing-form-shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  caseFileCounts,
  caseReviewFor,
  caseSummaryFor,
  SUMMARY_TERMS,
  SYNOPSIS_FIELDS,
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
  /* The tab's count and the notice on the summary read one list, so they cannot disagree. */
  const attention = attentionItems(summary).length;

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
 * The summary, in the grammar of the approved-registrations review: an eyebrow, a lifted
 * card, and a description list — term on the left, value on the right, status carried in
 * the value. Scrutiny first, because it is how the complaint got here; then the synopsis
 * the owner supplied, in its own six sections and its own order. The dates as a line are
 * behind one button, in a side sheet, because they do not need to be seen every time.
 */
function CaseSummaryView({ summary }: { summary: CaseSummary }) {
  const { synopsis, scrutiny } = summary;
  const attention = attentionItems(summary);
  const window = (id: CaseSummaryWindow["id"]) =>
    summary.windows.find((candidate) => candidate.id === id)!;
  const muted = "text-muted-foreground";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {attention.length > 0 ? <CaseAttention items={attention} /> : null}

      <TimelineSheet steps={summary.steps} windows={summary.windows} />

      <SummarySection label={SUMMARY_TERMS.scrutiny}>
        {scrutiny ? (
          <>
            <Row term={SYNOPSIS_FIELDS.clearedBy}>
              {scrutiny.mode === "officer" ? "Registry officer" : "Automated scrutiny"}
            </Row>
            <Row term={SYNOPSIS_FIELDS.rounds} figure>
              {scrutiny.rounds}
            </Row>
            <Row term={SYNOPSIS_FIELDS.took} figure>
              {scrutiny.days} {scrutiny.days === 1 ? "day" : "days"}
            </Row>
            <Row term={SYNOPSIS_FIELDS.clearedOn} figure>
              {scrutiny.clearedOnLabel}
            </Row>
          </>
        ) : (
          <Row term={SYNOPSIS_FIELDS.clearedBy}>
            <span className={muted}>Not recorded</span>
          </Row>
        )}
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.parties}>
        <Row term={SYNOPSIS_FIELDS.complainant}>
          {summary.complainant.name}
          <Note>{summary.complainant.type}</Note>
        </Row>
        <Row term={SYNOPSIS_FIELDS.accused}>
          {summary.accused.name}
          <Note>{summary.accused.type}</Note>
        </Row>
        <Row term={SYNOPSIS_FIELDS.advocate}>
          {summary.advocate ?? <span className={muted}>None on record</span>}
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.cheque}>
        <Row term={SYNOPSIS_FIELDS.amount} figure>
          {summary.cheque.amount}
          {summary.cheque.partPaid ? (
            <Note>{summary.cheque.partPaid} paid towards it before filing</Note>
          ) : null}
        </Row>
        <Row term={SYNOPSIS_FIELDS.datedOn} figure>
          {synopsis.cheque.datedOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.chequeNumber} figure>
          {summary.cheque.number}
        </Row>
        <Row term={SYNOPSIS_FIELDS.drawnOn}>
          {synopsis.cheque.drawerBank}
          <Note>{synopsis.cheque.drawerBranch}</Note>
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.dishonour}>
        <Row term={SYNOPSIS_FIELDS.presentedOn} figure>
          {synopsis.dishonour.presentedOnLabel}
          <WindowLine window={window("presentation")} after="the cheque date" />
        </Row>
        <Row term={SYNOPSIS_FIELDS.returnMemoOn} figure>
          {synopsis.dishonour.returnMemoOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.returnReason}>{summary.cheque.returnReason}</Row>
        <Row term={SYNOPSIS_FIELDS.presentedAt}>
          {synopsis.dishonour.payeeBank}
          <Note>{synopsis.dishonour.payeeBranch}</Note>
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.notice}>
        <Row term={SYNOPSIS_FIELDS.dispatchedOn} figure>
          {synopsis.notice.dispatchedOnLabel}
          <WindowLine window={window("notice")} after="the return memo" />
        </Row>
        <Row term={SYNOPSIS_FIELDS.mode}>{synopsis.notice.mode}</Row>
        <Row term={SYNOPSIS_FIELDS.tracking} code>
          {synopsis.notice.tracking}
        </Row>
        <Row term={SYNOPSIS_FIELDS.deliveredOn} figure>
          {synopsis.notice.deliveredOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.replied}>
          {synopsis.notice.replied ? "Received" : <span className={muted}>None</span>}
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.causeOfAction}>
        <Row term={SYNOPSIS_FIELDS.arisenOn} figure>
          {synopsis.causeOfAction.arisenOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.filedOn} figure>
          {synopsis.causeOfAction.filedOnLabel}
          <WindowLine window={window("filing")} after="the cause of action" />
        </Row>
        <Row term={SYNOPSIS_FIELDS.jurisdiction}>
          {synopsis.causeOfAction.jurisdiction}
          <Note>{synopsis.causeOfAction.jurisdictionBasis}</Note>
        </Row>
        <Row term={SYNOPSIS_FIELDS.otherPending}>
          {synopsis.causeOfAction.otherPending ? (
            <span className="text-warning-ink">Yes — one is pending</span>
          ) : (
            <span className={muted}>None</span>
          )}
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.prayer}>
        <Row term={SYNOPSIS_FIELDS.compensation} figure>
          {synopsis.prayer.compensation}
          <Note>Twice the cheque amount, and punishment under S.138</Note>
        </Row>
        <Row term={SYNOPSIS_FIELDS.interim} figure>
          {synopsis.prayer.interim}
        </Row>
      </SummarySection>
    </div>
  );
}

/* ──────────────────────── section, row, note — the grammar ───────────────────────── */

/**
 * One section: the approved-registrations `FactGroup`, transferred. A caption eyebrow —
 * scaffolding, and read as scaffolding — over a lifted card holding a description list.
 */
function SummarySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      <h2 className="text-caption font-semibold text-muted-foreground">{label}</h2>
      <Card size="sm" className="border-hairline shadow-raised">
        <CardContent className="flex flex-col gap-0">
          <DescriptionList>{children}</DescriptionList>
        </CardContent>
      </Card>
    </section>
  );
}

/** One row of a section — `ReviewRow`, the term and value pair every review in the product uses. */
function Row({
  term,
  figure,
  code,
  children,
}: {
  term: string;
  figure?: boolean;
  code?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ReviewRow term={term} className="border-hairline">
      <span
        className={cn(
          "block min-w-0",
          figure && "tabular-nums",
          code && "font-mono tabular-nums",
        )}
      >
        {children}
      </span>
    </ReviewRow>
  );
}

/** A value's qualifier, under it — the litigant's type, a bank's branch. The overlay's own `note` slot. */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-caption tabular-nums text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * A statutory window, under the date that closes it. Within its limit it is the row's
 * note; outside it is a second line of the value in warning ink — the way the overlay
 * carries "12 days" or "Full name does not match" in the value itself.
 */
function WindowLine({ window, after }: { window: CaseSummaryWindow; after: string }) {
  const days = `${window.days}\u00a0${window.days === 1 ? "day" : "days"}`;
  const limit = window.limitLabel.replace(" ", "\u00a0");
  switch (window.status) {
    case "within":
      return <Note>{`${days} after ${after} · within ${limit}`}</Note>;
    case "outside":
      return (
        <span className="mt-1 block text-warning-ink">
          {`${days} after ${after} — beyond the ${limit} allowed`}
        </span>
      );
    case "early":
      return (
        <span className="mt-1 block text-warning-ink">
          Filed before the cause of action arose
        </span>
      );
    case "condonation-sought":
      return (
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-warning-ink">{`${days} after ${after} — beyond ${limit}`}</span>
          <Badge variant="secondary">Condonation sought</Badge>
        </span>
      );
  }
}

/* ─────────────────────────────── attention ──────────────────────────────── */

type AttentionItem = { id: string; text: string };

/**
 * What needs the magistrate before he can register — the DS notice, present only when
 * something does. A limit breached, a required document missing, a second complaint
 * between the same parties, scrutiny unrecorded. Each is also stated on its own row in
 * amber; this is the one place they are gathered.
 */
function attentionItems(summary: CaseSummary): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const window of summary.windows) {
    if (window.status === "outside") {
      items.push({
        id: window.id,
        text: `${WINDOW_NAME[window.id]} ${window.days} days after ${WINDOW_AFTER[window.id]} — beyond the ${window.limitLabel} allowed`,
      });
    } else if (window.status === "early") {
      items.push({ id: window.id, text: "Filed before the cause of action arose" });
    }
  }
  const missing = [
    ...summary.documents.filter((doc) => !doc.onFile).map((doc) => doc.label),
    ...summary.otherMissing.map((doc) => doc.label),
  ];
  if (missing.length > 0) items.push({ id: "documents", text: `Not on file: ${missing.join(", ")}` });
  if (summary.synopsis.causeOfAction.otherPending) {
    items.push({ id: "other-pending", text: "Another cheque dishonour complaint between the same parties is pending" });
  }
  if (!summary.scrutiny) items.push({ id: "scrutiny", text: "No scrutiny is recorded for this complaint" });
  return items;
}

const WINDOW_NAME: Record<CaseSummaryWindow["id"], string> = {
  presentation: "Presented",
  notice: "Notice dispatched",
  filing: "Complaint filed",
};
const WINDOW_AFTER: Record<CaseSummaryWindow["id"], string> = {
  presentation: "the cheque date",
  notice: "the return memo",
  filing: "the cause of action",
};

function CaseAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Alert variant="warning" role="region" aria-labelledby="case-attention-title">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle id="case-attention-title" className="font-semibold">
        {items.length === 1 ? "Needs your attention" : `${items.length} things need your attention`}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/* ─────────────────────────────── the timeline ───────────────────────────── */

/**
 * The §138 dates as a line, behind one button — a side sheet, the way the scrutiny
 * workbench keeps its case history. Every limit is stated on the step that closes it.
 */
function TimelineSheet({
  steps,
  windows,
}: {
  steps: CaseSummaryStep[];
  windows: CaseSummaryWindow[];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div className="-mb-2 flex justify-end">
        <Button variant="outline" onClick={() => setOpen(true)}>
          View {SUMMARY_TERMS.timeline.toLowerCase()}
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
          <SheetHeader>
            <SheetTitle>{SUMMARY_TERMS.timeline}</SheetTitle>
            <SheetDescription>
              From the cheque's date to the complaint, with each S.138 limit on the step it
              closes.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Timeline>
              {steps.map((step) => {
                const window = windows.find((candidate) => candidate.to === step.id);
                return (
                  <TimelineItem
                    key={step.id}
                    status="past"
                    title={step.label}
                    description={step.onLabel}
                  >
                    {window ? (
                      <div className="mt-1 text-body-compact">
                        <WindowLine window={window} after={WINDOW_AFTER[window.id]} />
                      </div>
                    ) : null}
                  </TimelineItem>
                );
              })}
            </Timeline>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
