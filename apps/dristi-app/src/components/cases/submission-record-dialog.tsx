"use client";

import Link from "next/link";
import { useState } from "react";

import { DocumentPreview } from "@/components/cases/document-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import {
  filingStatusLabel,
  filingStatusVariant,
  submissionDocumentSrc,
  submissionKindLabel,
  submissionTypeLabel,
  submittedByOnBehalf,
  type ApplicationsFile,
  type Submission,
  type SubmissionDocument,
  type SubmissionPerson,
} from "@/lib/cases/applications";
import { caseSectionHref } from "@/lib/cases/sections";

/**
 * Submission record: only what the register row could not already tell you.
 * The filed document *is* the application, so nothing here paraphrases its
 * prayer; the date and the submission ID are on the row, and a pending row
 * already carries its own action. What is left is the specific sender, the
 * court's answer when there is one, and the packet — which takes the height
 * on a document submission, since there the document is the whole record.
 * Download and Full view hang off the preview itself (see DocumentPreview),
 * which is also what keeps them reachable over a full-height document.
 */
export function SubmissionRecordDialog({
  file,
  peopleById,
  submission,
  onOpenChange,
}: {
  file: ApplicationsFile;
  peopleById: Map<string, SubmissionPerson>;
  submission: Submission | null;
  onOpenChange: (submission: Submission | null) => void;
}) {
  return (
    <Dialog
      open={submission !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {submission ? (
        <SubmissionBody
          key={submission.id}
          file={file}
          submission={submission}
          peopleById={peopleById}
        />
      ) : null}
    </Dialog>
  );
}

function SubmissionBody({
  file,
  submission,
  peopleById,
}: {
  file: ApplicationsFile;
  submission: Submission;
  peopleById: Map<string, SubmissionPerson>;
}) {
  const firstWithSrc = submission.documents.find((doc) =>
    Boolean(submissionDocumentSrc(doc))
  );
  const [preview, setPreview] = useState<SubmissionDocument | null>(
    firstWithSrc ?? null
  );
  const previewSrc = preview ? submissionDocumentSrc(preview) : undefined;
  const isApplication = submission.kind === "application";

  return (
    <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-title font-semibold">
            {submission.title}
          </DialogTitle>
          <Badge variant={filingStatusVariant(submission.status)}>
            {filingStatusLabel(submission.status)}
          </Badge>
        </div>
        {/*
          Kind and type still disambiguate a row whose title differs from its
          type; the sender is the one filing fact the row cannot carry, since
          the row shows only the side. Both sit in the Description so the
          dialog announces them on open (Radix aria-describedby).
        */}
        <DialogDescription className="flex flex-col gap-1 text-body text-muted-foreground">
          <span>
            {submissionKindLabel(submission.kind)}
            {" · "}
            {submissionTypeLabel(submission.type)}
          </span>
          <span>
            {submittedByOnBehalf(submission, peopleById, file.parties)}
          </span>
        </DialogDescription>
      </DialogHeader>
      <Separator />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-6 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
        <div className="flex flex-col gap-8">
          {isApplication ? (
            <CourtOutcome submission={submission} caseId={file.caseId} />
          ) : null}

          <SubmissionDocuments
            submission={submission}
            preview={preview}
            previewSrc={previewSrc}
            onSelect={setPreview}
            tall={!isApplication}
          />
        </div>
      </div>
    </DialogContent>
  );
}

/**
 * What came back — rendered only when there is something to report. A
 * heading over "No decision recorded yet" is a promise of news the region
 * cannot keep, and the status badge in the header already says that nothing
 * has happened yet, so silence is the honest state. The rejection heading
 * names that status rather than the court, because defects are raised by the
 * registry on scrutiny and "what the court said" would misdescribe them.
 */
function CourtOutcome({
  submission,
  caseId,
}: {
  submission: Submission;
  caseId: string;
}) {
  const { courtResult, linkedOrder, defects, status } = submission;

  if (courtResult || linkedOrder) {
    return (
      <RecordSection title="What the court said">
        {courtResult ? (
          <p className="text-body text-foreground">{courtResult}</p>
        ) : null}
        {linkedOrder ? (
          <p className="text-body text-muted-foreground">
            Recorded in{" "}
            {/*
              Closing on the way out returns focus to the row that opened
              this record before the section changes under it.
            */}
            <DialogClose asChild>
              <Link
                href={caseSectionHref(caseId, "orders-and-notifications")}
                className="rounded-sm underline underline-offset-3 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
                aria-label={`${linkedOrder.label}, open Orders & Notifications`}
              >
                {linkedOrder.label}
              </Link>
            </DialogClose>
            .
          </p>
        ) : null}
      </RecordSection>
    );
  }

  if (status === "rejected" && defects.length > 0) {
    return (
      <RecordSection title="Why it was rejected">
        <ul className="flex flex-col gap-2">
          {defects.map((defect) => (
            <li key={defect} className="text-body text-foreground">
              {defect}
            </li>
          ))}
        </ul>
      </RecordSection>
    );
  }

  // A lapse explains a consequence rather than reporting a court act, so it
  // reads as one quiet line — heading weight would overstate it.
  if (status === "expired") {
    return (
      <p className="text-body text-muted-foreground">
        This filing lapsed before it was submitted, so it never reached the
        court.
      </p>
    );
  }

  return null;
}

/**
 * The filed packet. A document submission is the document, so its preview
 * takes the height the dialog can spare; on an application the document is
 * the third thing you want, at the standard well height. The picker sits
 * above the preview so a second document is reachable without scrolling
 * past a full-height one — and the preview's own header keeps Download and
 * Full view in reach even at 60svh, which is the job the pinned footer used
 * to do.
 */
function SubmissionDocuments({
  submission,
  preview,
  previewSrc,
  onSelect,
  tall,
}: {
  submission: Submission;
  preview: SubmissionDocument | null;
  previewSrc: string | undefined;
  onSelect: (doc: SubmissionDocument) => void;
  tall: boolean;
}) {
  if (!previewSrc) {
    return (
      <Alert>
        <AlertTitle className="text-body">No document</AlertTitle>
        <AlertDescription className="text-body">
          No document is available for this submission yet.
        </AlertDescription>
      </Alert>
    );
  }

  const many = submission.documents.length > 1;
  const label = preview?.label ?? submission.title;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {many ? (
        <RecordSection title="Documents">
          <ul className="flex flex-col gap-3">
            {submission.documents.map((doc) => (
              <li key={doc.label}>
                <DocumentItem
                  doc={doc}
                  current={preview === doc}
                  onSelect={() => {
                    if (submissionDocumentSrc(doc)) onSelect(doc);
                  }}
                />
              </li>
            ))}
          </ul>
        </RecordSection>
      ) : null}
      {/* Viewport-relative on a document submission so the document keeps the
          dominant share of the dialog, matching the max-h budget above. */}
      <DocumentPreview
        title={label}
        source={{ kind: "src", src: previewSrc }}
        download={{ href: previewSrc, label: `Download ${label}` }}
        height={tall ? "tall" : "default"}
      />
    </div>
  );
}

function RecordSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-body font-medium text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function DocumentItem({
  doc,
  current,
  onSelect,
}: {
  doc: SubmissionDocument;
  current: boolean;
  onSelect: () => void;
}) {
  const src = submissionDocumentSrc(doc);
  if (!src) {
    return (
      <Item variant="outline">
        <ItemContent>
          <ItemTitle className="line-clamp-none text-body font-medium text-foreground">
            {doc.label}
          </ItemTitle>
          <ItemDescription className="line-clamp-none text-body">
            Not on file
          </ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <Item variant="outline" asChild>
      <button
        type="button"
        className="h-full min-h-10 w-full items-start text-left"
        aria-current={current ? "true" : undefined}
        aria-label={`View ${doc.label}`}
        onClick={onSelect}
      >
        <ItemContent>
          <ItemTitle className="line-clamp-none text-body font-medium text-foreground">
            {doc.label}
          </ItemTitle>
          <ItemDescription className="line-clamp-none text-body">
            {current ? "Showing" : "Open"}
          </ItemDescription>
        </ItemContent>
      </button>
    </Item>
  );
}
