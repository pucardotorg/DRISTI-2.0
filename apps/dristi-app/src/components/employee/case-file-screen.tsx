"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileTextIcon, HistoryIcon } from "lucide-react";

import { DocumentPreview } from "@/components/cases/document-preview";
import {
  CaseReviewMissing,
  CaseReviewShell,
  DOCUMENT_MEDIA,
  PANEL,
  PageFacsimile,
  SCROLL_REST,
} from "@/components/employee/case-review-shared";
import { useCourtToday } from "@/components/employee/use-court-today";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsWide } from "@/hooks/use-min-width";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { DocumentSlot } from "@/components/ui/document-slot";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { ThumbnailButton } from "@/components/filing/upload/thumbnail";
import {
  caseChecksFor,
  caseGroupAnchor,
  caseReviewFor,
  caseSlotFor,
  formatDaysWaitingLong,
  type CaseAbsence,
  type CaseDocument,
  type CaseFact,
  type CaseGroup,
  type CaseReview,
  type CaseSection,
  type CaseTimelineDetail,
} from "@/lib/employee/case-review";
import { counselFor } from "@/lib/employee/hearings";
import { formatCaseDate } from "@/lib/employee/hearing-overview";
import { registerCaseById } from "@/lib/employee/register-cases";
import { cn } from "@/lib/utils";

/**
 * One complaint's whole file — every entered value, every document, read against its
 * source.
 *
 * **This is the destination, not the landing** (brief D13, D17). It was the landing
 * until 2026-09-11, and the owner's glancing framing demoted it: a screen that presents
 * twenty-nine checkable rows has handed the magistrate the scrutiny officer's job with
 * better furniture, and *"not as exhaustive as how the scrutiny officer's flow is"* is
 * the instruction it was failing. Nothing about it was discarded — it is one control
 * away, reached from `case-review-screen.tsx`, and every decision that shaped it stands.
 *
 * **A document opens beside its claims, never over them** (brief D1). The version before
 * this one opened each document in a `Dialog`, which drew a scrim over the page: at the
 * exact moment a magistrate wanted to compare an entered value with its source, the
 * entered value was covered by the source. From `xl` the claims and one document are two
 * columns, the claims column does not move when a document opens, and the pane holds
 * whichever document was last asked for. Below `xl` the two cannot coexist, so a
 * document opens in a `Sheet` — a `Drawer` on a phone (`RESPONSIVE.md` §6) — and the
 * pattern is open-read-close. **Nothing opens a modal `Dialog` anywhere on this screen.**
 *
 * **The order is the statute's, not the form's** (brief D4): the cheque and the notice
 * lead, and the sections' own ids and scroll offsets are what a finding's deep link
 * lands on.
 *
 * **Nothing folds** (brief §5a.2a, owner 2026-09-10). Every section was open by default,
 * and the disclosure's own affordance was invisible until somebody found it — so it hid
 * what the reader came to read and bought nothing. Removing it removed three workarounds
 * with it. The reading index went the same way (brief D7): the check ledger on the
 * glance performs the only jump the fast path needs, and a rail that indexes four
 * headings is 208px of chrome for a control that duplicates the browser's own find.
 *
 * **The timeline is behind a control, and only here** (brief D8, D21). Two of its seven
 * steps duplicate header cells, two name spine events no store holds, one is
 * conditional, and one tells the magistrate that the decision he is here to take has not
 * been taken. It is reachable by someone who went looking for history and invisible to
 * everyone else.
 */
export function CaseFileScreen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const review = caseReviewFor(caseId, today);
  const complaint = registerCaseById(caseId);

  if (!review || !complaint) return <CaseReviewMissing />;

  return (
    <CaseFilePage
      caseId={caseId}
      review={review}
      hasCounsel={counselFor(complaint, "complainant").length > 0}
      /* Whether anything is flagged does not change this view; it changes whether the
         reader arrived here on purpose or was sent. Read here so the pane's empty state
         can say which. */
      sentByFinding={(caseChecksFor(caseId, today) ?? []).length > 0}
    />
  );
}

/** What the pane is showing, and where in the file it came from. */
type OpenDocument = {
  label: string;
  kind: CaseDocument["kind"];
  /** The head it was filed under — the pane's own sub-line. */
  within: string;
};

function CaseFilePage({
  caseId,
  review,
  hasCounsel,
  sentByFinding,
}: {
  caseId: string;
  review: CaseReview;
  hasCounsel: boolean;
  sentByFinding: boolean;
}) {
  const wide = useIsWide();
  const [open, setOpen] = React.useState<OpenDocument | null>(null);
  const [history, setHistory] = React.useState(false);
  /* The row that opened the overlay, so closing it puts focus back rather than dropping
     it on `body` — which, on a file eighteen documents long, is the top of the page. */
  const trigger = React.useRef<HTMLButtonElement | null>(null);

  useDeepLink({ caseId, review, onOpen: setOpen });

  return (
    <CaseReviewShell
      review={review}
      hasCounsel={hasCounsel}
      gap="gap-8"
      headerAside={
        <Button variant="outline" onClick={() => setHistory(true)}>
          <HistoryIcon data-icon="inline-start" aria-hidden />
          Case timeline
        </Button>
      }
    >
      {/* Two columns from `xl`, one below it. At 1280 the content box is 1280 − 256
          (rail) − 64 (`md:p-8`) = 960; less a 32px gap, a `minmax(20rem,26rem)` pane
          leaves the claims 512–608px. At 1024 the same sum leaves 272px, which is the
          defect the split was moved off `lg` for. */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          {review.sections.map((section, index) => (
            <CaseSectionBlock
              key={section.id}
              section={section}
              number={index + 1}
              onOpen={(document, button) => {
                trigger.current = button;
                setOpen(document);
              }}
            />
          ))}
        </div>

        {wide ? (
          <div className={cn("min-w-0 xl:sticky xl:self-start", "xl:top-(--chrome-sticky-top)")}>
            <CaseDocumentPane document={open} sentByFinding={sentByFinding} />
          </div>
        ) : null}
      </div>

      {/* Below `xl` the pane has nowhere to be, so the document is a detour rather than
          a neighbour. A `Drawer` on a phone and a `Sheet` on a tablet — the two the DS
          names for exactly this — and never a `Dialog`, which is what covered the claims
          in the first place. */}
      {wide ? null : (
        <CaseDocumentOverlay
          document={open}
          onClose={() => {
            setOpen(null);
            trigger.current?.focus();
          }}
        />
      )}

      <CaseTimelineSheet
        steps={review.timeline}
        open={history}
        onOpenChange={setHistory}
      />
    </CaseReviewShell>
  );
}

/**
 * Arriving from a finding: open the document it named, and put focus on the head it
 * pointed at.
 *
 * The hash does the scrolling — every head carries an id and the chrome's own resting
 * offset as `scroll-mt`, so the browser lands it clear of the sticky bar without this
 * having to measure anything. What the browser will not do is move *focus*, so a
 * keyboard reader who followed a finding would have arrived at the top of a
 * forty-one-row file with no idea the page had moved. The head takes focus instead.
 *
 * The pane is pre-loaded **only** on a deep link, which is the one time a starting point
 * is asserted by the reader rather than by the screen.
 */
function useDeepLink({
  caseId,
  review,
  onOpen,
}: {
  caseId: string;
  review: CaseReview;
  onOpen: (document: OpenDocument) => void;
}) {
  const params = useSearchParams();
  const doc = params.get("doc");

  React.useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      const head = window.document.getElementById(hash);
      head?.focus({ preventScroll: true });
    }
    if (!doc) return;
    const spec = caseSlotFor(doc);
    if (!spec) return;
    const group = review.sections
      .flatMap((section) => section.groups)
      .find((entry) => entry.id === spec.group);
    if (!group) return;
    /* Found by label inside the head the slot belongs to, which is where it is unique:
       both parties file an "ID proof", and the file itself carries no key. */
    const found = [
      ...(group.documents ?? []),
      ...(group.records ?? []).flatMap((record) => record.documents ?? []),
    ].find((entry) => entry.label === spec.label && entry.state === "filed");
    if (found) {
      onOpen({ label: found.label, kind: found.kind, within: group.title });
    }
    /* Once, on arrival. Re-running as the reader opens other documents would keep
       yanking the pane back to the one the link named. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, doc]);
}

/* ─────────────────────────────── the claims ─────────────────────────────── */

function anchorFor(sectionId: string): string {
  return `case-section-${sectionId}`;
}

/**
 * One numbered part of the file: a heading, and the group panels under it.
 *
 * A plain region. The heading sits on the canvas rather than in a panel of its own — it
 * is the section's name, and giving it a sheet would put a frame around a line of text
 * and then a second frame around each block inside it. Nothing separates the sections
 * but the page's own step: heading to groups is 4, group to group is 6, section to
 * section is 8, so the rhythm states the nesting and no rule is needed anywhere
 * (`ui-craft` §1.1).
 *
 * The id and the scroll offset stay on the region even though the reading index is gone
 * (brief D21, correcting D7): a finding's deep link lands on a head under sticky chrome,
 * and both halves of that landing are here.
 *
 * **The heading is `text-body` 600, not the 20px step** (owner, 2026-09-11). Every other
 * section heading on the court side is `text-body font-semibold`; this was the only one
 * at 20px, and a heading bigger here than the same heading everywhere else is not a
 * hierarchy, it is a screen that disagrees with its siblings. What separates it from the
 * group headings below it is not type at all: a section heading sits on the tinted canvas
 * with its ordinal, and a group heading sits inside a white panel with an icon tile
 * beside it.
 */
function CaseSectionBlock({
  section,
  number,
  onOpen,
}: {
  section: CaseSection;
  number: number;
  onOpen: (document: OpenDocument, trigger: HTMLButtonElement) => void;
}) {
  const headingId = `case-section-heading-${section.id}`;

  return (
    <section
      id={anchorFor(section.id)}
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-4", SCROLL_REST)}
    >
      <h2
        id={headingId}
        className="flex min-w-0 items-baseline gap-2 text-body font-semibold"
      >
        <span className="tabular-nums text-muted-foreground">{number}.</span>
        <span className="min-w-0">{section.title}</span>
      </h2>
      <div className="flex min-w-0 flex-col gap-6">
        {section.groups.map((group) => (
          <CaseGroupPanel key={group.id} group={group} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

/**
 * One block of the file — the cheque, the notice, who appears.
 *
 * The panel is the frame, so what is inside it is fill, spacing and one hairline: the
 * records are stacked blocks with a rule between them, and nothing draws a second edge.
 * They were sunken wells until 2026-09-11; with the canvas tinted, a well inside a panel
 * on a tinted page would be a fourth tier on a screen that is read rather than filled. A
 * rule between records is the least that says "another one of these" and costs no depth.
 *
 * The mark beside the title is still a well, and muted: twelve tinted tiles down a page
 * would spend the view's one saturated colour a dozen times over, and the icon is here
 * to make a long file scannable rather than to say anything.
 *
 * **The head is what a finding links to**, so it carries the anchor, the scroll offset,
 * and a focus target — a magistrate who followed a finding from the glance lands *here*
 * rather than at the top of the file.
 */
function CaseGroupPanel({
  group,
  onOpen,
}: {
  group: CaseGroup;
  onOpen: (document: OpenDocument, trigger: HTMLButtonElement) => void;
}) {
  const Icon = group.icon;
  const headingId = `case-group-heading-${group.id}`;

  /* Every block this panel holds, in reading order, so the rule between them is decided
     once by position rather than twice by which shape the data happened to take. A
     group's own facts are the last block; they used to sit bare on the sheet while a
     named record sat in a well, which split the file down a line — `records` versus
     `facts` — that is invisible to a reader and meant nothing to them. */
  const blocks: React.ReactNode[] = [
    ...(group.records ?? []).map((record, index) => (
      <CaseRecordBlock
        key={record.id}
        heading={record.heading}
        tag={record.tag}
        /* "1." above a lone complainant counts nothing, so the ordinal appears only
           where there is more than one of something. */
        ordinal={(group.records?.length ?? 0) > 1 ? index + 1 : undefined}
        facts={record.facts}
        documents={record.documents}
        /* What a document row is named after in the accessible name: the record it
           belongs to, or failing that the head it was filed under. */
        within={record.heading}
        onOpen={onOpen}
      />
    )),
    ...(group.facts || group.documents
      ? [
          <CaseRecordBlock
            key="group-facts"
            facts={group.facts}
            documents={group.documents}
            within={group.title}
            onOpen={onOpen}
          />,
        ]
      : []),
  ];

  return (
    <section
      id={caseGroupAnchor(group.id)}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cn(PANEL, "flex flex-col gap-4 outline-none", SCROLL_REST)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <h3 id={headingId} className="min-w-0 text-body font-semibold">
          {group.title}
        </h3>
      </div>

      {group.empty ? <CaseAbsenceNote absence={group.empty} /> : null}

      {blocks.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-4">
          {blocks.map((block, index) => (
            /* The rule belongs to the block below it, not between two siblings in the
               abstract: `gap-4` above and `pt-4` below leave it centred in an even
               32px, and the first block never carries one — the panel's own heading has
               already separated it. */
            <div
              key={index}
              className={cn("min-w-0", index > 0 && "border-t border-hairline pt-4")}
            >
              {block}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * A head of the file with nothing under it, in one shape.
 *
 * Not a bordered grey void: the panel is already the frame, and the panel's own title
 * has named the head. The reason is the file's (a closed `CaseAbsence.reason`, so an
 * empty head can be counted and translated); the sentence under it is the product's
 * voice and says what follows — that the complainant conducts the matter in person. They
 * are two lines because they are two kinds of thing (`ui-craft` §1.6).
 */
const ABSENCE_REASONS = {
  "none-named": "None named",
  "none-on-record": "None on record",
} as const;

function CaseAbsenceNote({ absence }: { absence: CaseAbsence }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-body text-muted-foreground">
        {ABSENCE_REASONS[absence.reason]}
      </p>
      {absence.explanation ? (
        <p className="text-body-compact text-muted-foreground">
          {absence.explanation}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A block of the file's content, in the one shape every block takes.
 *
 * Several records inside one panel, or one set of facts and the documents backing them.
 * No fill and no border of its own — the hairline above it is the panel's, and depth on
 * this page stops at the panel (`ui-craft` §4).
 *
 * **It is the query container for everything inside it.** The rows below switch from two
 * columns to stacked on the *block's* width, not the window's, because the window was
 * never the constraint — the claims column was. At 1280 this block is ≈464px inside a
 * 512px column and the rows are two-column; at 375 it is ≈279px and they stack, which is
 * the answer the old `sm:` rule gave for the wrong reason.
 */
function CaseRecordBlock({
  heading,
  tag,
  ordinal,
  facts,
  documents,
  within,
  onOpen,
}: {
  heading?: string;
  tag?: string;
  ordinal?: number;
  facts?: CaseFact[];
  documents?: CaseDocument[];
  /** What the documents in this block belong to, for their accessible names. */
  within: string;
  onOpen: (document: OpenDocument, trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className="@container flex min-w-0 flex-col gap-3">
      {heading ? (
        /* The tag sits **beside** the name, not at the far edge of the row (owner,
           2026-09-11). `justify-between` put "Company" a whole column away from the
           thing it describes, and the further apart they were the wider the panel got.
           It is a `Badge variant="secondary"` because it is a closed enum
           (`LITIGANT_TYPES`) — the DS's own shape for one. */
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 text-body font-medium">
            {ordinal ? (
              <span className="tabular-nums text-muted-foreground">
                {ordinal}.{" "}
              </span>
            ) : null}
            {heading}
          </p>
          {tag ? <Badge variant="secondary">{tag}</Badge> : null}
        </div>
      ) : null}
      {facts ? <CaseFactRows facts={facts} /> : null}
      {documents ? (
        <CaseDocuments documents={documents} within={within} onOpen={onOpen} />
      ) : null}
    </div>
  );
}

/**
 * The file's fact rows, at the DS `DescriptionList`'s own metric.
 *
 * `minmax(7rem,10rem)` is the DS default, and it holds now that the terms are the
 * attributes' names rather than the form's questions (brief §5a.4a) — the fixed `17rem`
 * term column this used to carry is what squeezed the value cell to a measured 14px at
 * 1280, and shortening the terms is upstream of that whole problem.
 *
 * Two departures from the primitive, both stated once here. The stroke drops to
 * hairline: fifteen rows at full `border-border` would be the darkest marks on the page,
 * and an internal divider inside a panel that already has an edge is not what full
 * strength is for (`ui-craft` §1.1). And the two-column grid is applied at `@xs` on the
 * block rather than at `sm:` on the window, so a term that outgrows its track in a narrow
 * claims column stacks *there*, whatever the window is doing — which is what makes the
 * long-label and other-language cases survivable.
 *
 * Term and value are both `text-body-compact` at 400, which is also the DS default and
 * the reason it exists: the value used to be larger and heavier than its own term, so
 * fifteen rows read as fifteen emphasised strings and the pair was distinguished by
 * nothing. At one size and one weight the pair is distinguished by colour, which is
 * `ui-craft` §1.3's own instruction.
 */
function CaseFactRows({ facts }: { facts: CaseFact[] }) {
  return (
    <DescriptionList>
      {facts.map((fact) => (
        <DescriptionRow
          key={fact.term}
          className="grid-cols-1 gap-1 border-hairline @xs:grid-cols-[minmax(7rem,10rem)_1fr] @xs:gap-4"
        >
          <DescriptionTerm className="text-body-compact">
            {fact.term}
          </DescriptionTerm>
          {/* An empty slot is said, not left blank. The form asked the question and the
              filer answered nothing; a blank cell reads as a broken row, and this screen
              exists to show what is and is not on the file. */}
          <DescriptionDetails
            className={cn(
              "min-w-0 wrap-break-word text-body-compact",
              fact.value ? undefined : "text-muted-foreground",
              fact.numeric && "tabular-nums",
              /* The page's one coloured mark, and it appears on one complaint in
                 thirty-five. Which answer is the exception is the file's to say
                 (`CaseFact.exception`), not a string comparison here. Ink, not a fill
                 and not a chip: the word already reads "No", so the colour is the second
                 treatment and never the only one (`ACCESSIBILITY.md` §3). */
              fact.exception && "text-warning-ink",
            )}
          >
            {fact.value ?? "Not stated"}
          </DescriptionDetails>
        </DescriptionRow>
      ))}
    </DescriptionList>
  );
}

/**
 * The documents filed under one head, and the slots left empty.
 *
 * **This is e-filing's uploaded-document row** (owner, 2026-09-11): the DS `DocumentSlot`
 * with a page-shaped thumbnail in its media well, which is exactly what the advocate sees
 * on the upload screen (`filing/upload/slot-row.tsx`) and what the scrutiny inset shows.
 * One component showing an uploaded document everywhere was the point.
 *
 * The thumbnail is the control, as it is on the upload screen: `ThumbnailButton` from
 * `filing/upload/thumbnail.tsx`, shared rather than copied. Pressing it loads the pane
 * beside the claims — **not a dialog over them**, which is the whole of brief D1.
 *
 * **There is no `Documents` caption and no `meta="Filed"`** (brief D6). The caption named
 * ten identical lists and the meta read the same on all eighteen rows: both were the norm
 * marked, on a page whose one coloured mark is spent elsewhere.
 *
 * A document that is *not* on file is deliberately **not** a `DocumentSlot`. The
 * primitive's empty state is an upload target — a dashed edge and a "Choose file" button
 * — and a magistrate reading a complaint cannot upload a litigant's document; hiding that
 * button with CSS would leave it in the tab order and in the accessible tree. So the
 * absent row keeps the slot's geometry and none of its affordances: same media column,
 * same padding, no fill, no paper, nothing to press, reading "Not on file". An absence is
 * never dressed as a document.
 */
function CaseDocuments({
  documents,
  within,
  onOpen,
}: {
  documents: CaseDocument[];
  within: string;
  onOpen: (document: OpenDocument, trigger: HTMLButtonElement) => void;
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-2">
      {documents.map((document) => (
        <li key={document.label} className="min-w-0">
          {document.state === "absent" ? (
            /* The `DocumentSlot` geometry without the primitive. No fill either: the
               filed rows are sunken and this one is not, so a reader scanning the column
               sees which slots are full before reading a word. */
            <div className="flex w-full items-start gap-4 rounded-lg p-4">
              <span
                className="flex h-14 w-11 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground"
                aria-hidden
              >
                <FileTextIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-compact font-medium">{document.label}</p>
                <p className="mt-0.5 text-body-compact text-muted-foreground">
                  Not on file
                </p>
              </div>
            </div>
          ) : (
            <DocumentSlot
              status="filled"
              media="thumbnail"
              label={document.label}
              className={DOCUMENT_MEDIA}
              thumbnail={
                <ThumbnailButton
                  /* The head the document was filed under, in the name as well as
                     beside it. Both parties file an "ID proof" and the file lists
                     eighteen rows in all, so a reader tabbing the page or pulling up a
                     list of controls met "View ID proof" twice with nothing to tell them
                     apart. The visible label stays the document's own — the row sits
                     under a heading that supplies the rest. */
                  label={`View ${document.label} — ${within}`}
                  onPreview={(event) =>
                    onOpen(
                      {
                        label: document.label,
                        kind: document.kind,
                        within,
                      },
                      event.currentTarget,
                    )
                  }
                >
                  <PageFacsimile kind={document.kind} />
                </ThumbnailButton>
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ──────────────────────────────── the pane ──────────────────────────────── */

/**
 * The document, beside the claims it is read against.
 *
 * `DocumentPreview variant="quiet" surface="card"` is `EvidenceColumn`'s composition
 * verbatim — the same shape the advocate queue puts a Bar ID card in, and no third way
 * is introduced for this. `surface="card"` rather than the default sunken well, because
 * on a tinted canvas a sunken fill is the canvas's own tone and the well would have no
 * edge.
 *
 * What it holds is a drawing. A facsimile states that *a page of this kind* is on the
 * file and is deliberately not legible: readable text here would be fabricating a court
 * record, which is the one thing a demo of a court file must not do. The pane says so.
 *
 * **The empty state names what the pane is for and never a skeleton.** A skeleton
 * promises something is loading; nothing is.
 */
function CaseDocumentPane({
  document,
  sentByFinding,
}: {
  document: OpenDocument | null;
  sentByFinding: boolean;
}) {
  if (!document) {
    return (
      <section
        className={cn(PANEL, "flex min-h-64 flex-col justify-center gap-2")}
        aria-label="Document"
      >
        <p className="text-body font-medium">No document open</p>
        <p className="text-body-compact text-pretty text-muted-foreground">
          {sentByFinding
            ? "Open a document from a row on the left to read it beside the values it should match."
            : "Open a document from a row on the left. It opens here, beside the values entered from it."}
        </p>
      </section>
    );
  }

  return (
    <DocumentPreview
      variant="quiet"
      surface="card"
      /* `height="default"` and not `fill`: `fill` sizes the well against a definite
         container, and a sticky panel on a scrolling page has none. The standard 384px
         well is what the bounded facsimile very nearly fills anyway. */
      height="default"
      title={document.label}
      source={{ kind: "composed", content: <PaneFacsimile kind={document.kind} /> }}
    />
  );
}

/** The page itself, bounded and centred inside whatever well it is given. */
function PaneFacsimile({ kind }: { kind: CaseDocument["kind"] }) {
  return (
    <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-md border border-paper-border bg-paper">
      <PageFacsimile kind={kind} />
    </div>
  );
}

/**
 * The same document, below `xl`, where there is no second column for it.
 *
 * A `Drawer` on a phone and a `Sheet` on a tablet — the DS's own answer to "the viewport
 * cannot hold two things at once" (`RESPONSIVE.md` §6). Both restore focus to the
 * thumbnail that opened them, which is what keeps a keyboard reader from being dropped
 * at the top of a file eighteen documents long.
 */
function CaseDocumentOverlay({
  document,
  onClose,
}: {
  document: OpenDocument | null;
  onClose: () => void;
}) {
  const phone = useIsMobile();
  const open = document !== null;
  const description =
    "The page is drawn, not scanned — this build has no document store behind it.";

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-semibold break-words text-title-s">
              {document?.label}
            </DrawerTitle>
            <DrawerDescription className="text-body-compact">
              {document?.within}. {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {document ? <PaneFacsimile kind={document.kind} /> : null}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
        <SheetHeader>
          <SheetTitle className="font-semibold break-words text-title-s">
            {document?.label}
          </SheetTitle>
          <SheetDescription className="text-body-compact">
            {document?.within}. {description}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {document ? <PaneFacsimile kind={document.kind} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────────────────────── the timeline ────────────────────────────── */

/**
 * How far the complaint has got — behind a control, and only on this view.
 *
 * Oldest first, the same direction the case history on a listing's overview runs, so the
 * two columns on the same side of the app agree about which end is the present. What the
 * steps *are* lives with the file (`timelineFor` in `case-review.ts`), where each one
 * names the field or the spine step it comes from.
 *
 * It left the standing layout because of what it holds (brief D8, D21): two steps
 * duplicate header cells, two name spine events no store holds, and one is the decision
 * the magistrate is here to take. None of that is worth 240px of permanent chrome, and
 * all of it is worth having when someone goes looking.
 *
 * The second line of a step is three different kinds of thing, so it is rendered by three
 * branches rather than handed over as one pre-formatted string. That is what lets a day
 * be a `<time>` a machine can read and the wait be counted rather than quoted.
 */
function CaseTimelineSheet({
  steps,
  open,
  onOpenChange,
}: {
  steps: CaseReview["timeline"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
        <SheetHeader>
          <SheetTitle>Case timeline</SheetTitle>
          <SheetDescription className="text-body-compact">
            What the court records about this complaint, oldest first.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <Timeline>
            {steps.map((step) => (
              <TimelineItem
                key={step.label}
                status={step.status}
                title={step.label}
                description={<CaseTimelineDetailText detail={step.detail} />}
              />
            ))}
          </Timeline>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The second line of a timeline step — a day, a duration, or the name of a state. */
function CaseTimelineDetailText({ detail }: { detail: CaseTimelineDetail }) {
  switch (detail.kind) {
    case "date":
      return (
        <time dateTime={detail.on} className="tabular-nums">
          {formatCaseDate(detail.on)}
        </time>
      );
    case "elapsed":
      /* Counted here rather than quoted from the file, so the number is a number: the
         wait is the one figure on this panel that changes every day. */
      return (
        <span className="tabular-nums">{formatDaysWaitingLong(detail.days)}</span>
      );
    case "state":
      return <span>{detail.state}</span>;
  }
}
