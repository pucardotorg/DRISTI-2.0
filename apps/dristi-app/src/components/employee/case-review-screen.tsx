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
  SYNOPSIS_FIELDS,
  type CaseCheck,
  type CaseReview,
  type CaseSummary,
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
        <CaseSummaryView summary={summary} flags={flags} />
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
 * The summary: what needs him, how scrutiny went, and the synopsis.
 *
 * The synopsis is the owner's reference (2026-09-11) — the document a magistrate reads to
 * register a §138 complaint — in its own six sections and its own order, which is the
 * offence told chronologically: who, the cheque, its dishonour, the demand, the cause of
 * action, what is prayed for. Scrutiny is not part of it and sits apart, above it: it is
 * a report on how the complaint got here, the trust signal a reviewer reads first.
 *
 * Both panels share one label column, so the two read as one document with a seam
 * rather than two unrelated boxes.
 */
function CaseSummaryView({
  summary,
  flags,
}: {
  summary: CaseSummary;
  flags: CaseCheck[];
}) {
  const attention = attentionItems(flags, summary);
  const { synopsis } = summary;
  const verdict = (id: CaseSummaryWindow["id"]) =>
    summary.windows.find((window) => window.id === id)!;

  return (
    <div className="flex flex-col gap-6">
      {attention.length > 0 ? <CaseAttention items={attention} /> : null}

      <section className={cn(PANEL, "p-0")} aria-label={SUMMARY_TERMS.scrutiny}>
        <dl>
          <SummaryRow id="summary-scrutiny" term={SUMMARY_TERMS.scrutiny}>
            <ScrutinyFacts scrutiny={summary.scrutiny} />
          </SummaryRow>
        </dl>
      </section>

      <section className={cn(PANEL, "p-0")} aria-labelledby="synopsis-title">
        <h2 id="synopsis-title" className="sr-only">
          Synopsis
        </h2>
        <dl className="divide-y divide-hairline">
          <SummaryRow id="summary-parties" term={SUMMARY_TERMS.parties}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.complainant}>
                <Lead>{summary.complainant.name}</Lead>
                <Aside>{summary.complainant.type}</Aside>
              </Field>
              <Field label={SYNOPSIS_FIELDS.accused}>
                <Lead>{summary.accused.name}</Lead>
                <Aside>{summary.accused.type}</Aside>
              </Field>
              <Field label={SYNOPSIS_FIELDS.advocate}>
                {summary.advocate ?? (
                  <span className="text-muted-foreground">None on record</span>
                )}
              </Field>
            </FieldGrid>
          </SummaryRow>

          <SummaryRow id="summary-cheque" term={SUMMARY_TERMS.cheque}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.amount}>
                <Lead numeric>{summary.cheque.amount}</Lead>
                {summary.cheque.partPaid ? (
                  <Aside numeric>{summary.cheque.partPaid} paid before filing</Aside>
                ) : null}
              </Field>
              <Field label={SYNOPSIS_FIELDS.datedOn}>
                <Day on={synopsis.cheque.datedOn}>{synopsis.cheque.datedOnLabel}</Day>
              </Field>
              <Field label={SYNOPSIS_FIELDS.chequeNumber}>
                <span className="tabular-nums">{summary.cheque.number}</span>
              </Field>
              <Field label={SYNOPSIS_FIELDS.drawnOn}>
                {synopsis.cheque.drawerBank}
                <Aside>{synopsis.cheque.drawerBranch}</Aside>
              </Field>
            </FieldGrid>
          </SummaryRow>

          <SummaryRow id="summary-dishonour" term={SUMMARY_TERMS.dishonour}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.presentedOn}>
                <Day on={synopsis.dishonour.presentedOn}>
                  {synopsis.dishonour.presentedOnLabel}
                </Day>
                <WindowNote window={verdict("presentation")} after="the cheque date" />
              </Field>
              <Field label={SYNOPSIS_FIELDS.returnMemoOn}>
                <Day on={synopsis.dishonour.returnMemoOn}>
                  {synopsis.dishonour.returnMemoOnLabel}
                </Day>
              </Field>
              <Field label={SYNOPSIS_FIELDS.returnReason}>
                {summary.cheque.returnReason}
              </Field>
              <Field label={SYNOPSIS_FIELDS.presentedAt}>
                {synopsis.dishonour.payeeBank}
                <Aside>{synopsis.dishonour.payeeBranch}</Aside>
              </Field>
            </FieldGrid>
          </SummaryRow>

          <SummaryRow id="summary-notice" term={SUMMARY_TERMS.notice}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.dispatchedOn}>
                <Day on={synopsis.notice.dispatchedOn}>
                  {synopsis.notice.dispatchedOnLabel}
                </Day>
                <WindowNote window={verdict("notice")} after="the return memo" />
              </Field>
              {/* The tracking number qualifies the mode the way a branch qualifies a bank,
                  and a code in monospace identifies itself — so it sits under the mode
                  rather than taking a fifth field that stranded "Reply" on a row alone. */}
              <Field label={SYNOPSIS_FIELDS.mode}>
                {synopsis.notice.mode}
                <Aside>
                  <span className="sr-only">{SYNOPSIS_FIELDS.tracking} </span>
                  <span className="font-mono tabular-nums">{synopsis.notice.tracking}</span>
                </Aside>
              </Field>
              <Field label={SYNOPSIS_FIELDS.deliveredOn}>
                <Day on={synopsis.notice.deliveredOn}>
                  {synopsis.notice.deliveredOnLabel}
                </Day>
              </Field>
              <Field label={SYNOPSIS_FIELDS.replied}>
                {synopsis.notice.replied ? (
                  "Received"
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </Field>
            </FieldGrid>
          </SummaryRow>

          <SummaryRow id="summary-cause-of-action" term={SUMMARY_TERMS.causeOfAction}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.arisenOn}>
                <Day on={synopsis.causeOfAction.arisenOn}>
                  {synopsis.causeOfAction.arisenOnLabel}
                </Day>
              </Field>
              <Field label={SYNOPSIS_FIELDS.filedOn}>
                <Day on={synopsis.causeOfAction.filedOn}>
                  {synopsis.causeOfAction.filedOnLabel}
                </Day>
                <WindowNote window={verdict("filing")} after="the cause of action" />
              </Field>
              <Field label={SYNOPSIS_FIELDS.jurisdiction}>
                {synopsis.causeOfAction.jurisdiction}
                <Aside>{synopsis.causeOfAction.jurisdictionBasis}</Aside>
              </Field>
              <Field label={SYNOPSIS_FIELDS.otherPending}>
                {synopsis.causeOfAction.otherPending ? (
                  <>
                    <span className="font-medium text-warning-ink">Yes</span>
                    <Aside>Between the same parties</Aside>
                  </>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </Field>
            </FieldGrid>
          </SummaryRow>

          <SummaryRow id="summary-prayer" term={SUMMARY_TERMS.prayer}>
            <FieldGrid>
              <Field label={SYNOPSIS_FIELDS.relief} wide>
                {synopsis.prayer.relief}
              </Field>
              <Field label={SYNOPSIS_FIELDS.interim} wide>
                {synopsis.prayer.interim}
              </Field>
            </FieldGrid>
          </SummaryRow>
        </dl>
      </section>
    </div>
  );
}

/* ─────────────────────────────── attention ──────────────────────────────── */

type AttentionItem = { id: string; text: string; row: string };

/**
 * What needs him before he can register: every defect the checks found, and a second
 * complaint pending between the same parties — not a defect, but the one fact on the
 * synopsis that can turn a register into a joinder question. Nothing else: a lawful
 * appearance in person or a part payment is stated on its own row and needs no alarm.
 */
function attentionItems(flags: CaseCheck[], summary: CaseSummary): AttentionItem[] {
  const items: AttentionItem[] = flags.map((flag) => ({
    id: flag.id,
    text: attentionText(flag, summary),
    row: ATTENTION_ROW[flag.id],
  }));
  if (summary.synopsis.causeOfAction.otherPending) {
    items.push({
      id: "other-pending",
      text: "Another cheque dishonour complaint between the same parties is pending",
      row: "summary-cause-of-action",
    });
  }
  return items;
}

/** Which row carries the evidence for each kind of finding. */
const ATTENTION_ROW: Record<CaseCheck["id"], string> = {
  "presentation-window": "summary-dishonour",
  "notice-window": "summary-notice",
  "premature-filing": "summary-cause-of-action",
  "filing-window": "summary-cause-of-action",
  "required-documents": "summary-cheque",
  "advocate-on-record": "summary-parties",
  "part-payment": "summary-cheque",
};

/**
 * The finding as the alert states it. The window findings already name their dates and
 * the limit; the documents finding counts ("1 document the form required is not on
 * file"), which says less than it knows — so here it names the documents.
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
 * The DS `Alert` in its warning variant — a notice that reports a status, so tinted, with
 * its own ink pair, icon and words (ui-craft §2). Present only when something needs him:
 * a clean complaint has no block here, and every note on the synopsis reading within its
 * limit is the confirmation. `role="region"`, not the primitive's `alert`: this is a
 * standing part of the page, and announcing it on arrival would interrupt a screen reader
 * before the title had been read.
 */
function CaseAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Alert variant="warning" role="region" aria-labelledby="case-attention-title">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle id="case-attention-title" className="font-semibold">
        {items.length === 1
          ? "One thing needs your attention"
          : `${items.length} things need your attention`}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.row}`}
                className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/* ──────────────────────────── the row and field ─────────────────────────── */

/**
 * One section: its name in a column of its own, its fields beside it. The names line up
 * down one edge across both panels, so the eye runs down it and stops at the section it
 * wants — the reading pattern a record is for. Stacked below `md`, where a second column
 * would leave the fields a third of a phone to wrap in.
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
      className="grid scroll-mt-(--file-sticky-top) gap-3 px-6 py-6 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6"
      style={{ "--file-sticky-top": FILE_STICKY_TOP } as React.CSSProperties}
    >
      <dt className="text-body-compact font-medium text-foreground">{term}</dt>
      <dd className="@container min-w-0">{children}</dd>
    </div>
  );
}

/**
 * The fields of one section, label over value, as many across as the section has room
 * for. Filled rather than fixed at three: at 1280 the synopsis column is 766px, which
 * holds four fields, and a fixed three put one field alone on a second row in four of the
 * six sections — "Drawn on", "Presented at" and the rest stranded beside two empty columns.
 * Filling to width puts a four-field section on one line and still falls to one column on
 * a phone, measured against the section rather than the window because the rail decides
 * how much of the window it gets.
 */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    /* Each track is at least 7.5rem, and at least a quarter of the section — so a phone
       gets two columns instead of a single 2,400px stack, and a wide synopsis never goes
       past four, where a return reason would start breaking a word to a line. */
    <dl className="grid grid-cols-[repeat(auto-fill,minmax(max(7.5rem,calc((100%-4.5rem)/4)),1fr))] gap-x-6 gap-y-4">
      {children}
    </dl>
  );
}

/**
 * One field. The label is the quietest thing on the page — caption, muted — so the values
 * are what the eye lands on; a prayer spans the section, because a sentence broken into a
 * third of the width is a sentence nobody reads.
 */
function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", wide && "col-span-full")}>
      <dt className="text-caption font-medium text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col gap-0.5 text-body-compact wrap-break-word">
        {children}
      </dd>
    </div>
  );
}

/**
 * The value a reader scans for — a party's name, the cheque's amount. One step up in size
 * and weight from the values around it, and the only thing on the synopsis that is.
 */
function Lead({ numeric, children }: { numeric?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("text-body font-medium", numeric && "tabular-nums")}>
      {children}
    </span>
  );
}

/** A value's qualifier — the litigant's type, a bank's branch. */
function Aside({ numeric, children }: { numeric?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("text-caption text-muted-foreground", numeric && "tabular-nums")}>
      {children}
    </span>
  );
}

function Day({ on, children }: { on: string; children: React.ReactNode }) {
  return (
    <time dateTime={on} className="tabular-nums">
      {children}
    </time>
  );
}

/**
 * A statutory window, stated under the date that closes it — the check made visible where
 * it applies, instead of a count of comparisons at the top of the page. Within its limit
 * it is quiet, because on nearly every complaint all three are and three coloured
 * confirmations per file would mark the norm. A breach says so in words and ink.
 *
 * `condonation-sought` is neither: the filing was late and an application to condone it
 * is on the file. Whether there was sufficient cause is the magistrate's call under
 * §142(b), so the note states the application as a neutral badge and never decides it.
 */
function WindowNote({
  window,
  after,
}: {
  window: CaseSummaryWindow;
  after: string;
}) {
  /* The span is what the eye reads; what it is counted from is the statute's own
     anchor, which a magistrate already knows and a screen reader still needs said. A note
     that named it in full wrapped to two lines under a date and left one word orphaned. */
  const span = (
    <>
      <span className="whitespace-nowrap tabular-nums">
        {window.days} {window.days === 1 ? "day" : "days"}
      </span>
      <span className="sr-only"> after {after}</span>
    </>
  );
  /* "within 3 months" and "beyond 3 months" are one phrase each; left breakable, a
     narrow column put "months" alone on a second line. Bound, the only place the note
     can wrap is at its separator. */
  const limit = (word: "within" | "beyond") => (
    <span className="whitespace-nowrap">
      {word} {window.limitLabel}
    </span>
  );

  switch (window.status) {
    case "within":
      return (
        <span className="text-caption text-muted-foreground">
          {span} · {limit("within")}
        </span>
      );
    case "outside":
      return (
        <span className="flex items-start gap-1 text-caption text-warning-ink">
          <TriangleAlertIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>
            {span} · {limit("beyond")}
          </span>
        </span>
      );
    case "early":
      return (
        <span className="flex items-center gap-1 text-caption font-medium text-warning-ink">
          <TriangleAlertIcon className="size-3 shrink-0" aria-hidden />
          Before the cause of action arose
        </span>
      );
    case "condonation-sought":
      return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
          <span>
            {span} · {limit("beyond")}
          </span>
          <Badge variant="secondary">Condonation sought</Badge>
        </span>
      );
  }
}

/* ─────────────────────────────── scrutiny ───────────────────────────────── */

/**
 * How the complaint got here — who cleared it, in how many rounds, over how long. The
 * first thing the owner said a magistrate weighs, and the summary of scrutiny rather than
 * its annotations. No ink on the rounds or the days: those are facts he weighs, and the
 * screen does not get to tell a judge that three rounds was too many.
 */
function ScrutinyFacts({ scrutiny }: { scrutiny: CaseSummary["scrutiny"] }) {
  if (!scrutiny) {
    return <p className="text-body-compact text-muted-foreground">Not recorded</p>;
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
      <p className="text-body font-medium">
        Cleared{" "}
        {scrutiny.mode === "officer" ? "by a registry officer" : "by automated scrutiny"}
      </p>
      <p className="text-body-compact tabular-nums text-muted-foreground">
        {scrutiny.rounds} {scrutiny.rounds === 1 ? "round" : "rounds"} over{" "}
        {scrutiny.days} {scrutiny.days === 1 ? "day" : "days"} · cleared{" "}
        <time dateTime={scrutiny.clearedOn} className="whitespace-nowrap">
          {scrutiny.clearedOnLabel}
        </time>
      </p>
    </div>
  );
}
