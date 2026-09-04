"use client";

import { useMemo } from "react";

import { useChromePageDialog } from "@/components/chrome/app-chrome";
import { CommentsPane } from "@/components/cases/document-record-dialog";
import { DocumentPreview } from "@/components/cases/document-preview";
import { ReviewRow } from "@/components/cases/filing-form-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DescriptionList } from "@/components/ui/description-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { courtHearingPurposeLabel } from "@/lib/employee/hearings";
import {
  APPLICATION_TYPE_LABEL,
  buildReschedulingDocument,
  consentLabel,
  downloadReschedulingDocument,
  formatProposedDates,
  formatRequestLongDate,
  senderLine,
  type ReschedulingDocument,
  type ReschedulingRequest,
} from "@/lib/employee/rescheduling-request";

/**
 * One rescheduling application, in the advocate generated-application
 * container, with the comments pane and Approve / Reject the bench needs.
 *
 * The document is the thing being reviewed, so it is a `height="fill"`
 * `DocumentPreview` — a grid `1fr` child with a height budget, the same
 * layout `GeneratedApplicationDialog` already uses. Facts sit in a compact
 * sunken well above it, not a nine-row list that ate the paper. Comments
 * are the pane `DocumentRecordDialog` already ships; Approve and Reject
 * only leave the demo queue.
 */
export function ReschedulingRequestDialog({
  request,
  onOpenChange,
  onApprove,
  onReject,
  onReturnFocus,
}: {
  request: ReschedulingRequest | null;
  onOpenChange: (request: ReschedulingRequest | null) => void;
  onApprove: (request: ReschedulingRequest) => void;
  onReject: (request: ReschedulingRequest) => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {request ? (
        <RequestBody
          key={request.id}
          request={request}
          onApprove={onApprove}
          onReject={onReject}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

function RequestBody({
  request,
  onApprove,
  onReject,
  onReturnFocus,
}: {
  request: ReschedulingRequest;
  onApprove: (request: ReschedulingRequest) => void;
  onReject: (request: ReschedulingRequest) => void;
  onReturnFocus: () => void;
}) {
  const document = useMemo(
    () => buildReschedulingDocument(request),
    [request],
  );
  const listedOn = formatRequestLongDate(request.listedOn);
  const purpose = courtHearingPurposeLabel(request.purpose);
  const currentHearing = `${listedOn} · ${purpose}`;
  const pageDialog = useChromePageDialog();

  return (
    <DialogContent
      className={`flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl md:h-[85dvh] ${pageDialog}`}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-title-s font-semibold">
            {APPLICATION_TYPE_LABEL}
          </DialogTitle>
          <Badge variant="warning">Pending review</Badge>
        </div>
        <DialogDescription className="text-body-compact text-muted-foreground">
          {senderLine(request)}
        </DialogDescription>
      </DialogHeader>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_auto] gap-6 p-6 md:grid-rows-[auto_minmax(0,1fr)]">
          <div className="rounded-lg bg-surface-sunken p-4">
            <DescriptionList>
              <ReviewRow term="Case number">
                <span className="font-mono">{request.caseNumber}</span>
              </ReviewRow>
              <ReviewRow term="Application sent on">
                {formatRequestLongDate(request.appliedOn)}
              </ReviewRow>
              <ReviewRow term="Current hearing">{currentHearing}</ReviewRow>
              <ReviewRow term="Proposed hearing date">
                {formatProposedDates(request.proposedOn)}
              </ReviewRow>
              <ReviewRow term="Consent of other parties">
                {consentLabel(request.partiesAgreed)}
              </ReviewRow>
            </DescriptionList>
          </div>
          <DocumentPreview
            className="min-h-96 md:min-h-0"
            height="fill"
            title={document.title}
            source={{
              kind: "composed",
              content: <ApplicationFacsimile document={document} />,
            }}
            download={{
              onDownload: () => downloadReschedulingDocument(request),
              label: `Download ${document.title}`,
            }}
          />
        </div>
        <Separator className="md:hidden" />
        <Separator orientation="vertical" className="hidden md:block" />
        <CommentsPane fieldId={`reschedule-comment-${request.id}`} />
      </div>
      <DialogFooter className="mx-0 mb-0 shrink-0">
        <Button
          type="button"
          variant="destructive"
          onClick={() => onReject(request)}
        >
          Reject
        </Button>
        <Button type="button" onClick={() => onApprove(request)}>
          Approve
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * The court-form document itself — the same paper facsimile the advocate
 * generated-application dialog already uses, bound to this request's fields.
 */
function ApplicationFacsimile({
  document,
}: {
  document: ReschedulingDocument;
}) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground [&_[data-slot=description-details]]:text-paper-foreground [&_[data-slot=description-term]]:text-paper-muted-foreground">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-body font-semibold">{document.court}</p>
        <p className="text-body font-semibold">
          Case no. {document.caseNumber}
        </p>
        <p className="text-body font-semibold">{document.matter}</p>
        <p className="text-body-compact text-paper-muted-foreground">
          Date: {document.dated}
        </p>
      </header>

      <DescriptionList className="rounded-md border border-paper-border px-4">
        {document.facts.map((fact) => (
          <ReviewRow key={fact.term} term={fact.term}>
            {fact.value}
          </ReviewRow>
        ))}
      </DescriptionList>

      <h3 className="text-center text-body font-semibold">{document.title}</h3>

      <ol className="flex list-decimal flex-col gap-3 ps-6">
        {document.paragraphs.map((paragraph, index) => (
          <li key={index} className="text-body whitespace-pre-wrap">
            {paragraph}
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-2">
        <h4 className="text-body font-semibold">Prayer</h4>
        <p className="text-body whitespace-pre-wrap">{document.prayer}</p>
      </section>

      <footer className="flex flex-col items-end gap-2">
        <p className="text-body-compact text-paper-muted-foreground">
          Filed for {document.filedFor}
        </p>
        <p className="text-body-compact text-paper-muted-foreground">
          Dated this {document.dated}
        </p>
      </footer>
    </article>
  );
}
