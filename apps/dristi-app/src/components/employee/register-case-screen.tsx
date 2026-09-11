"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderIcon } from "lucide-react";

import { CaseReviewMissing } from "@/components/employee/case-review-shared";
import { useCourtToday } from "@/components/employee/use-court-today";
import { ReviewRow } from "@/components/cases/filing-form-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  caseReviewFor,
  caseSummaryFor,
  SCRUTINY_MODES,
  SUMMARY_TERMS,
  SYNOPSIS_FIELDS,
  type CaseReview,
  type CaseScrutiny,
  type CaseSummary,
  type CaseSummaryStep,
  type CaseSummaryWindow,
} from "@/lib/employee/case-review";
import { cn } from "@/lib/utils";

/**
 * Register cases, second build — one waiting complaint as the magistrate glances at it
 * before taking it on the register or sending it back to scrutiny.
 *
 * Built from nothing but the approved-registrations grammar (owner, 2026-09-11): an
 * eyebrow, a lifted card, a description list — term on the left, value on the right,
 * status carried inline in the value, notes in caption under it. Every line is
 * `text-body-compact`, the court side's standard; nothing here is 12px that matters
 * and nothing is 16px because it wanted to look important. Every fact is a value from
 * `lib/employee/case-review.ts` rendered through one slot; the only prose on the page
 * is the product's own voice at the two acts.
 *
 * Two tabs. **Summary** is the synopsis in the owner's format — parties, cheque,
 * dishonour, demand notice, cause of action, prayer — with two sections in front of it
 * that decide the glance: how scrutiny went (who cleared it, how many rounds, what each
 * round was sent back for) and the timeline, statutory chain and court chain on one
 * list, each step dated and the span it closes measured against the limit the law sets.
 * **Case file** is not built yet in this version.
 *
 * Two acts, and no third (owner, 2026-09-11): Register, or send it back to scrutiny.
 * Both progress in place — the body gives way to a focused card, the header stays —
 * and neither performs anything in this build.
 */
export function RegisterCaseScreen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const review = caseReviewFor(caseId, today);
  const summary = caseSummaryFor(caseId, today);

  if (!review || !summary) return <CaseReviewMissing />;

  return <CaseShell review={review} summary={summary} />;
}

/* ─────────────────────────────── the shell ──────────────────────────────── */

type Act = "register" | "send-back";

/**
 * The frame: tinted canvas, the header naming the complaint and holding the two acts,
 * then either the tabs or the act's focused stage.
 *
 * `bg-muted` in light mode, `dark:bg-background` in dark — the writing-surface recipe
 * `FilingMain` uses, and the beige-under-white-panels default the owner set on the
 * registrations queue. The panels are the only white on the page.
 */
function CaseShell({ review, summary }: { review: CaseReview; summary: CaseSummary }) {
  const [act, setAct] = React.useState<Act | null>(null);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted dark:bg-background">
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 pt-6 pb-12 md:px-8 md:pt-8">
        <header
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8"
          aria-labelledby="register-case-title"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-compact tabular-nums text-muted-foreground">
              {review.caseNumber}
            </p>
            <h1 id="register-case-title" className="text-balance font-semibold text-title">
              {review.title}
            </h1>
          </div>
          {act === null ? (
            <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setAct("send-back")}>
                Send back to scrutiny
              </Button>
              <Button type="button" onClick={() => setAct("register")}>
                Register
              </Button>
            </div>
          ) : null}
        </header>

        {act === null ? (
          <CaseTabs summary={summary} />
        ) : (
          <ActStage act={act} hasCounsel={summary.advocate !== null} onBack={() => setAct(null)} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── the tabs ───────────────────────────────── */

type CaseTab = "summary" | "file";

/** Which tab is open, held in the URL as `?file=1` so Back closes the file. */
function useCaseTab(): [CaseTab, (next: CaseTab) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: CaseTab = params.get("file") === "1" ? "file" : "summary";

  const setTab = React.useCallback(
    (next: CaseTab) => {
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

/* Labels keep their widths, read as screen copy, and the active mark sits on the row's
   own rule rather than floating under it (ui-craft §2). */
const TRIGGER = "h-full flex-none px-0.5 text-body after:-bottom-px";

function CaseTabs({ summary }: { summary: CaseSummary }) {
  const [tab, setTab] = useCaseTab();

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as CaseTab)} className="gap-6">
      {/* Sticky under the 56px bar on the canvas's own fill, bled to the page edge so
          the fill reaches the gutters; the rule stays at the content's width. */}
      <div className="sticky top-14 z-20 -mx-6 bg-muted px-6 md:-mx-8 md:px-8 dark:bg-background">
        <TabsList
          variant="line"
          className="w-full justify-start gap-6 rounded-none border-b border-hairline p-0 group-data-horizontal/tabs:h-11"
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
        <CaseSummaryView summary={summary} />
      </TabsContent>

      <TabsContent value="file" className="text-body">
        <Empty className="border-0 p-0 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-semibold text-title-s">
              The case file is not built in this version yet
            </EmptyTitle>
            <EmptyDescription className="text-body">
              The summary is being settled first. The file — every particular and every
              document the complaint was filed with — follows it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TabsContent>
    </Tabs>
  );
}

/* ─────────────────────────────── the summary ────────────────────────────── */

/**
 * Scrutiny and the timeline first, because they are what the glance decides on; then
 * the synopsis in the owner's own order.
 */
function CaseSummaryView({ summary }: { summary: CaseSummary }) {
  const { synopsis, scrutiny } = summary;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <SummarySection label={SUMMARY_TERMS.scrutiny}>
        {scrutiny ? (
          <ScrutinyRows scrutiny={scrutiny} />
        ) : (
          <Row term={SYNOPSIS_FIELDS.clearedBy}>
            <Muted>Not recorded</Muted>
          </Row>
        )}
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.timeline}>
        <TimelineRows summary={summary} />
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
          {summary.advocate ?? <Muted>None on record</Muted>}
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
        </Row>
        <Row term={SYNOPSIS_FIELDS.mode}>{synopsis.notice.mode}</Row>
        <Row term={SYNOPSIS_FIELDS.tracking} code>
          {synopsis.notice.tracking}
        </Row>
        <Row term={SYNOPSIS_FIELDS.deliveredOn} figure>
          {synopsis.notice.deliveredOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.replied}>
          {synopsis.notice.replied ? "Received" : <Muted>None</Muted>}
        </Row>
      </SummarySection>

      <SummarySection label={SUMMARY_TERMS.causeOfAction}>
        <Row term={SYNOPSIS_FIELDS.arisenOn} figure>
          {synopsis.causeOfAction.arisenOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.filedOn} figure>
          {synopsis.causeOfAction.filedOnLabel}
        </Row>
        <Row term={SYNOPSIS_FIELDS.jurisdiction}>
          {synopsis.causeOfAction.jurisdiction}
          <Note>{synopsis.causeOfAction.jurisdictionBasis}</Note>
        </Row>
        <Row term={SYNOPSIS_FIELDS.otherPending}>
          {synopsis.causeOfAction.otherPending ? (
            <span className="text-warning-ink">Yes — one is pending</span>
          ) : (
            <Muted>None</Muted>
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

/**
 * How scrutiny went: who cleared it, how many rounds, and what each round before the
 * last was sent back for — the defect class, one line per round, never the officer's
 * remark. A first-time clear has no send-backs and says so in the muted voice.
 */
function ScrutinyRows({ scrutiny }: { scrutiny: CaseScrutiny }) {
  return (
    <>
      <Row term={SYNOPSIS_FIELDS.clearedBy}>{SCRUTINY_MODES[scrutiny.mode]}</Row>
      <Row term={SYNOPSIS_FIELDS.rounds} figure>
        {scrutiny.rounds}
      </Row>
      <Row term={SYNOPSIS_FIELDS.sentBack}>
        {scrutiny.returns.length === 0 ? (
          <Muted>Nothing — cleared first time</Muted>
        ) : (
          <ul className="flex flex-col gap-1">
            {scrutiny.returns.map((sendBack) => (
              <li key={sendBack.round} className="flex gap-2">
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  Round {sendBack.round}
                </span>
                <span>{sendBack.label}</span>
              </li>
            ))}
          </ul>
        )}
      </Row>
      <Row term={SYNOPSIS_FIELDS.took} figure>
        {days(scrutiny.days)}
      </Row>
    </>
  );
}

/**
 * The whole line, dated: the §138 chain the complaint stands on, then what the court
 * has done with it since. Where a step closes a statutory window the row measures it —
 * the days it took against the days the law allows — and the value turns amber only
 * where the file is outside the limit and nothing on it answers for that.
 */
function TimelineRows({ summary }: { summary: CaseSummary }) {
  const { scrutiny } = summary;
  const windowClosedBy = (step: CaseSummaryStep) =>
    summary.windows.find((window) => window.to === step.id);
  const filed = summary.steps.find((step) => step.id === "filed");

  return (
    <>
      {summary.steps.map((step) => (
        <StepRow key={step.id} step={step} window={windowClosedBy(step)} />
      ))}
      {scrutiny ? (
        <>
          <Row term={SYNOPSIS_FIELDS.takenUpOn} figure>
            {scrutiny.takenUpOnLabel}
            <Note>
              {days(scrutiny.daysToTakeUp)} after {filed ? "filing" : "the complaint"}
            </Note>
          </Row>
          <Row term={SYNOPSIS_FIELDS.clearedOn} figure>
            {scrutiny.clearedOnLabel}
            <Note>
              {days(scrutiny.days)} in scrutiny · {rounds(scrutiny.rounds)}
            </Note>
          </Row>
          <Row term={SYNOPSIS_FIELDS.waiting} figure>
            {days(scrutiny.daysWaiting)}
          </Row>
        </>
      ) : null}
    </>
  );
}

const WINDOW_FROM: Record<CaseSummaryWindow["id"], string> = {
  presentation: "the cheque date",
  notice: "the return memo",
  filing: "the cause of action",
};

/** One dated step of the chain, with the window it closes measured beneath it. */
function StepRow({ step, window }: { step: CaseSummaryStep; window?: CaseSummaryWindow }) {
  return (
    <ReviewRow term={step.label} className="border-hairline">
      <span className="block tabular-nums">{step.onLabel}</span>
      {window ? <WindowNote window={window} /> : null}
    </ReviewRow>
  );
}

function WindowNote({ window }: { window: CaseSummaryWindow }) {
  const span = `${days(window.days)} after ${WINDOW_FROM[window.id]}`;
  const limit = window.limitLabel.replace(" ", " ");
  switch (window.status) {
    case "within":
      return <Note>{`${span} · within ${limit}`}</Note>;
    case "outside":
      return (
        <span className="mt-1 block text-caption tabular-nums text-warning-ink">
          {`${span} · beyond the ${limit} allowed`}
        </span>
      );
    case "early":
      return (
        <span className="mt-1 block text-caption text-warning-ink">
          Filed before the cause of action arose
        </span>
      );
    case "condonation-sought":
      return (
        <span className="mt-1 block text-caption tabular-nums text-warning-ink">
          {`${span} · beyond ${limit} — condonation sought`}
        </span>
      );
  }
}

/* ────────────────────────────── the grammar ─────────────────────────────── */

/** Eyebrow, lifted card, description list — the approved-registrations review's shape. */
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

/** One fact. `figure` for anything a reader compares; `code` for a tracking number. */
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
      <span className={cn("block min-w-0", figure && "tabular-nums", code && "font-mono tabular-nums")}>
        {children}
      </span>
    </ReviewRow>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-caption tabular-nums text-muted-foreground">{children}</span>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function days(count: number): string {
  return `${count} ${count === 1 ? "day" : "days"}`;
}

function rounds(count: number): string {
  return `${count} ${count === 1 ? "round" : "rounds"}`;
}

/* ─────────────────────────────── the acts ───────────────────────────────── */

/**
 * The act, held. The body gives way to one focused card asking the question; the
 * header stays, so the magistrate never loses which complaint this is. Nothing here
 * performs — the act is `aria-disabled` and the line under it says why.
 */
function ActStage({
  act,
  hasCounsel,
  onBack,
}: {
  act: Act;
  hasCounsel: boolean;
  onBack: () => void;
}) {
  const sending = act === "send-back";
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const empty = reason.trim() === "";
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (sending) reasonRef.current?.focus();
    else titleRef.current?.focus();
  }, [sending]);

  const unbuiltId = sending ? "register-case-send-back-unbuilt" : "register-case-register-unbuilt";

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center pb-8">
      <div className="flex w-full max-w-xl flex-col gap-4 md:my-auto">
        <Card size="sm" className="border-hairline shadow-raised">
          <CardContent className="flex flex-col gap-4">
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="font-semibold text-title-s outline-none"
            >
              {sending ? "Send this complaint back to scrutiny?" : "Register this complaint?"}
            </h2>

            {sending ? (
              <>
                {hasCounsel ? null : (
                  <p className="text-body-compact text-muted-foreground">
                    No advocate is on record for this complaint, so there is nobody to send
                    it to.
                  </p>
                )}
                <Field data-invalid={touched && empty}>
                  <FieldLabel htmlFor="register-case-reason" className="text-body-compact font-medium">
                    Why are you sending this back?
                  </FieldLabel>
                  <Textarea
                    id="register-case-reason"
                    ref={reasonRef}
                    className="min-h-32 text-body-compact"
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setTouched(true);
                    }}
                  />
                  {touched && empty ? <FieldError>Write a reason first.</FieldError> : null}
                </Field>
              </>
            ) : (
              <p className="text-body-compact text-muted-foreground">
                Registering a complaint is taking cognizance of the offence. It is a
                judicial act, and this screen does not undo it.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            variant={sending ? "outline" : "default"}
            aria-disabled
            aria-describedby={unbuiltId}
            className={cn(
              "aria-disabled:opacity-50 aria-disabled:active:translate-y-0",
              sending ? "aria-disabled:hover:bg-card" : "aria-disabled:hover:bg-primary",
            )}
          >
            {sending ? "Send back to scrutiny" : "Register"}
          </Button>
        </div>

        <p id={unbuiltId} className="text-center text-caption text-pretty text-muted-foreground">
          {sending
            ? "Not part of this build — the reason is not sent to anyone."
            : "Not part of this build — nothing is registered and nobody is told."}
        </p>
      </div>
    </div>
  );
}
