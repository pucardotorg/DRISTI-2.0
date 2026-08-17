"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ShoppingCartIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { toDisplayDate } from "@/lib/filing/format";
import { CASE_TYPE } from "@/lib/filing/options";
import { firstNameOf, useProfile } from "@/lib/filing/profile";
import { draftProgress, draftTitle } from "@/lib/filing/selectors";
import { FILINGS_HOME, NEW_FILING, getStep, stepHref } from "@/lib/filing/steps";
import { useMounted } from "@/lib/filing/store";
import type { FilingDraft } from "@/lib/filing/types";
import { useDrafts } from "@/lib/filing/use-drafts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/filing/confirm-dialog";
import { PANEL_CLASS } from "@/components/filing/form-card";

type CaseTypeCard = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  documents: number;
  icon: LucideIcon;
  href?: string;
};

const CASE_TYPES: CaseTypeCard[] = [
  {
    id: "s138",
    title: CASE_TYPE.title,
    description:
      "Criminal complaint for dishonour of a cheque under Section 138 of the Negotiable Instruments Act.",
    minutes: 40,
    documents: 6,
    icon: CreditCardIcon,
    href: NEW_FILING,
  },
  {
    id: "civil-money",
    title: "Civil money suit",
    description: "Recovery of money due, breach of contract or specific performance.",
    minutes: 55,
    documents: 8,
    icon: BuildingIcon,
  },
  {
    id: "family",
    title: "Matrimonial / family",
    description: "Divorce, maintenance, custody or other matrimonial relief.",
    minutes: 60,
    documents: 10,
    icon: UsersIcon,
  },
  {
    id: "consumer",
    title: "Consumer dispute",
    description: "Deficiency in goods or services, unfair trade practice.",
    minutes: 35,
    documents: 5,
    icon: ShoppingCartIcon,
  },
];

function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-s font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-body text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function savedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * A resumable draft: what it is, how far it got, and where it resumes. Only the most
 * recent draft carries the teal action; older ones recede (one primary per view).
 */
function DraftCard({
  draft,
  primary,
  onDiscard,
}: {
  draft: FilingDraft;
  primary: boolean;
  onDiscard: () => void;
}) {
  const progress = draftProgress(draft);
  const step = getStep(draft.lastStep);
  return (
    <Card className={PANEL_CLASS}>
      <CardHeader>
        <CardTitle className="text-body font-semibold">{draftTitle(draft)}</CardTitle>
        <CardDescription>
          {CASE_TYPE.title} · last saved {savedAt(draft.updatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 text-caption text-muted-foreground">
          <span>
            Up to <span className="text-foreground">{step.title}</span>
          </span>
          <span className="tabular-nums">{progress}% complete</span>
        </div>
        <Progress value={progress} aria-label={`${progress}% complete`} className="h-1.5" />
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant={primary ? "default" : "outline"}>
          <Link href={stepHref(draft.id, draft.lastStep)}>
            Continue draft
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
        <Button variant="ghost" onClick={onDiscard}>
          Discard draft
        </Button>
      </CardFooter>
    </Card>
  );
}

/** The e-filing dashboard: drafts, client batches, new-case entry points, recent filings. */
export function FilingsDashboard() {
  const mounted = useMounted();
  const { profile } = useProfile();
  const { ready, error, readAt, drafts, filed, discard } = useDrafts();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const showData = mounted && ready;

  const firstName = firstNameOf(profile?.name ?? "");
  const yearAgo = readAt - 365 * 86_400_000;
  const filedThisYear = filed.filter((d) => d.filedAt && new Date(d.filedAt).getTime() >= yearAgo);

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <div className="border-b border-hairline">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8 lg:py-12">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-caption font-medium text-primary">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </p>
            <h1 className="text-title-l font-semibold tracking-tight text-foreground">
              Your e-filing dashboard
            </h1>
            <p className="text-body text-muted-foreground">
              File new cases, continue drafts, and keep the ones you&apos;ve already
              submitted — all in one place.
            </p>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-3">
            <Card size="sm" className={cn(PANEL_CLASS, "min-w-36 items-center text-center")}>
              <CardContent className="flex flex-col gap-1">
                <dd className="text-title font-semibold tabular-nums text-foreground">
                  {showData ? drafts.length : "–"}
                </dd>
                <dt className="text-caption text-muted-foreground">Drafts in progress</dt>
              </CardContent>
            </Card>
            <Card size="sm" className={cn(PANEL_CLASS, "min-w-36 items-center text-center")}>
              <CardContent className="flex flex-col gap-1">
                <dd className="text-title font-semibold tabular-nums text-foreground">
                  {showData ? filedThisYear.length : "–"}
                </dd>
                <dt className="text-caption text-muted-foreground">Cases filed (12 months)</dt>
              </CardContent>
            </Card>
          </dl>
        </div>
      </div>

      {/* Continue a draft */}
      <Section title="Continue a draft" description="Pick up where you left off. Drafts are auto-saved.">
        {!showData ? null : error ? (
          <p className="text-body text-destructive-ink">{error}</p>
        ) : drafts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {drafts.map((d, i) => (
              <li key={d.id} className="flex flex-col">
                <DraftCard draft={d} primary={i === 0} onDiscard={() => setConfirmId(d.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">
            No drafts yet. Start a new filing below.
          </p>
        )}
      </Section>

      {/* Received from clients */}
      <Section
        title="Received from your clients"
        description="Case batches pushed from your clients' litigation systems, allocated to you for filing."
      >
        <Card className={cn(PANEL_CLASS, "max-w-3xl")}>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground"
            >
              <BriefcaseIcon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-body font-semibold text-foreground">No batches yet</p>
              <p className="text-body-compact text-muted-foreground">
                Batches your clients send for filing will appear here, ready to review.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href={`${FILINGS_HOME}/bulk`}>
                About bulk filing
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Section>

      {/* Start a new case */}
      <Section
        title="Start a new case"
        description="Choose the type of case you want to file. We'll guide you through the rest."
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASE_TYPES.map((c) => {
            const active = !!c.href;
            const Icon = c.icon;
            return (
              <li key={c.id} className="flex">
                {/* One cue for "this is the one you can file": the brand tile. The others
                    recede to a neutral well — no ring, no second border. */}
                <Card className={cn(PANEL_CLASS, "flex-1")}>
                  <CardHeader>
                    <span
                      aria-hidden
                      className={cn(
                        "mb-2 flex size-11 items-center justify-center rounded-lg",
                        active
                          ? "bg-brand-muted text-brand-muted-foreground"
                          : "bg-surface-sunken text-muted-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="text-body font-semibold">{c.title}</CardTitle>
                    <CardDescription className="text-body-compact">
                      {c.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center gap-4 border-t border-hairline pt-4 text-caption text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3.5" aria-hidden />~{c.minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileTextIcon className="size-3.5" aria-hidden />
                        {c.documents} documents
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {active ? (
                      <Button asChild>
                        <Link href={c.href!}>
                          Start filing
                          <ArrowRightIcon data-icon="inline-end" aria-hidden />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled aria-disabled>
                        Start filing
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Recently filed. Nothing here comes from the registry: the app has no connection
          to it, so the row says only what this browser did and there is no next date. */}
      <Section
        title="Recently filed cases"
        description="Cases you submitted from this browser. Registry status — scrutiny, listing and next date — isn't connected yet."
      >
        {!showData ? null : filed.length === 0 ? (
          <p className="text-body text-muted-foreground">
            Nothing filed yet. Cases you submit will be listed here with their case file
            number.
          </p>
        ) : (
          <Card className={cn(PANEL_CLASS, "py-0")}>
            <Table>
              <TableHeader>
                <TableRow className="border-hairline">
                  <TableHead>Case no.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Filed on</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filed.map((d) => (
                  <TableRow key={d.id} className="border-hairline">
                    <TableCell className="font-medium tabular-nums">
                      {d.sign.caseFileNumber ?? "—"}
                    </TableCell>
                    <TableCell>{draftTitle(d)}</TableCell>
                    <TableCell className="text-muted-foreground">{CASE_TYPE.short}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {d.filedAt ? toDisplayDate(d.filedAt.slice(0, 10)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Submitted from this browser</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={stepHref(d.id, "preview")}
                          aria-label={`Open ${d.sign.caseFileNumber ?? draftTitle(d)}`}
                        >
                          <ExternalLinkIcon aria-hidden />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Section>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
        title="Discard this draft?"
        description="Everything entered and uploaded for this filing will be removed. This cannot be undone."
        confirmLabel="Discard draft"
        onConfirm={() => {
          if (confirmId) void discard(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}
