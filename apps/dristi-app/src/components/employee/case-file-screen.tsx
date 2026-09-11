"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { DocumentPreview } from "@/components/cases/document-preview";
import {
  DOCUMENT_MEDIA,
  PANEL,
  PageFacsimile,
  SCROLL_REST,
} from "@/components/employee/case-review-shared";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { ThumbnailButton } from "@/components/filing/upload/thumbnail";
import {
  caseGroupAnchor,
  caseSlotFor,
  formatDaysWaitingLong,
  type CaseAbsence,
  type CaseDocument,
  type CaseDocumentKind,
  type CaseFact,
  type CaseFactTerm,
  type CaseGroup,
  type CaseGroupId,
  type CaseReview,
  type CaseSection,
  type CaseTimelineDetail,
} from "@/lib/employee/case-review";
import { formatCaseDate } from "@/lib/employee/hearing-overview";
import { cn } from "@/lib/utils";

/**
 * One complaint's whole file — every entered value, every document, read against its
 * source.
 *
 * **This is a region of the complaint's page, not a page of its own** (brief D25, owner
 * 2026-09-11: *"opening the full file should be like an accordion sort of viewing more
 * details sort of interaction. It shouldn't open up a new page"*). It was `/​<id>/file`
 * until this round; what changed is only where it lives. The claims column, the pane,
 * the statute's order and the two-pane split are exactly what D1–D12 decided, and the
 * disclosure that now carries it is `case-review-screen.tsx`.
 *
 * **A document opens beside its claims, never over them** (brief D1). The version before
 * these opened each document in a `Dialog`, which drew a scrim over the page: at the
 * exact moment a magistrate wanted to compare an entered value with its source, the
 * entered value was covered by the source. From `xl` the claims and one document are two
 * columns and the claims column does not move when a document opens. Below `xl` the two
 * cannot coexist, so a document opens in a `Sheet` — a `Drawer` on a phone
 * (`RESPONSIVE.md` §6) — and the pattern is open-read-close. **Nothing here opens a
 * modal `Dialog`.**
 *
 * **The pane carries the documents of the group being read** (brief D26, the owner's
 * third change). Not one slot with eighteen documents to choose from: the group a reader
 * is in already names its own two to four, and his own example — the cheque with its
 * deposit proof and return memo — *is* the cheque group, exactly three. Which group is
 * being read is answered by D7's reading observer, brought back for this and not for an
 * index rail.
 *
 * **A fact points at the document it would be read from** (brief D27). `CaseFact.source`
 * replaces D6's pairing-by-order; a fact with no source is not a control. The e-filing
 * annotation itself cannot cross yet, and the pane says so rather than drawing a box
 * over a drawing.
 *
 * **The order is the statute's, not the form's** (brief D4), **nothing folds** (brief
 * §5a.2a, owner 2026-09-10), and **the timeline is behind a control** that lives at the
 * head of this region rather than in the page header (brief D8, D21) — so it appears
 * only when the file is open, which is the only time it is worth offering.
 */
export function CaseFileRegion({
  caseId,
  review,
}: {
  caseId: string;
  review: CaseReview;
}) {
  const wide = useIsWide();
  const [selected, setSelected] = React.useState<PaneSelection | null>(null);
  const [overlay, setOverlay] = React.useState(false);
  /* The control that opened the overlay, so closing it puts focus back rather than
     dropping it on `body` — which, on a file eighteen documents long, is the top of the
     page. */
  const trigger = React.useRef<HTMLElement | null>(null);

  const groups = React.useMemo(
    () => review.sections.flatMap((section) => section.groups),
    [review],
  );
  const { reading, claim } = useReadingGroup(groups.map((group) => group.id));

  /* One handler for the three things that ask the pane for a document — a fact row, a
     thumbnail, a deep link. Each of them *claims* the pane (the reader has said where
     they are looking) until they scroll somewhere themselves, which is D7's rule intact.
     Below `xl` the same ask opens the overlay instead, because there is no second column
     for it to land in. */
  const open = React.useCallback(
    (next: PaneSelection, from?: HTMLElement | null) => {
      claim(next.group);
      setSelected(next);
      if (!wide) {
        trigger.current = from ?? null;
        setOverlay(true);
      }
    },
    [claim, wide],
  );

  useDeepLink({ caseId, groups, onOpen: open });

  /* The pane follows the group being read; the selection only survives while the reader
     is still in the group that made it. Moving to another group hands the pane that
     group's own documents, first one selected, with no fact lit — which is what "the
     pane follows the reader" has to mean if it is not to leave a stale document beside
     unrelated claims. */
  const group = groups.find((entry) => entry.id === reading) ?? groups[0];
  const documents = React.useMemo(() => paneDocumentsOf(group), [group]);
  const inGroup = selected?.group === group?.id ? selected : null;
  const active =
    documents.find((document) => document.key === inGroup?.doc) ?? documents[0];

  const pane = (
    <CaseDocumentPane
      group={group}
      documents={documents}
      active={active}
      term={active && inGroup?.doc === active.key ? inGroup.term : undefined}
      onSelect={(key) =>
        setSelected({ group: group.id, doc: key })
      }
    />
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Two columns from `xl`, one below it. At 1280 the content box is 1280 − 256
          (rail) − 64 (`md:p-8`) = 960; less a 32px gap, a `minmax(20rem,26rem)` pane
          leaves the claims 512–608px. At 1024 the same sum leaves 272px, which is the
          defect the split was moved off `lg` for. */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          {review.sections.map((section, index) => (
            <CaseSectionBlock
              key={section.id}
              section={section}
              selectedRow={inGroup?.row}
              onOpen={open}
            />
          ))}
        </div>

        {wide ? (
          /* The pane clears the sticky strip as well as the chrome — `--file-sticky-top`
             is published by the disclosure that owns that strip. */
          <div
            /* `mt-6` is the section label above the first panel — its 16px line plus the
               section's `gap-2` — so the pane's top edge meets the first panel's rather
               than floating level with a caption. */
            className="min-w-0 xl:sticky xl:top-(--file-sticky-top) xl:mt-6 xl:self-start"
          >
            {pane}
          </div>
        ) : null}
      </div>

      {/* Below `xl` the pane has nowhere to be, so the document is a detour rather than
          a neighbour. A `Drawer` on a phone and a `Sheet` on a tablet — the two the DS
          names for exactly this — carrying the same tab strip, so no third mechanism
          appears (brief D11, D20, D26). */}
      {wide ? null : (
        <CaseDocumentOverlay
          open={overlay}
          group={group}
          documents={documents}
          active={active}
          term={active && inGroup?.doc === active.key ? inGroup.term : undefined}
          onSelect={(key) => setSelected({ group: group.id, doc: key })}
          onClose={() => {
            setOverlay(false);
            trigger.current?.focus();
          }}
        />
      )}

    </div>
  );
}

/* ─────────────────────── which group is being read ──────────────────────── */

/**
 * How far down the viewport the reading line sits, past the chrome.
 *
 * A group used to stay current until its *heading* scrolled under the sticky bar, which
 * put the switch at the very top of the screen: the reader was two-thirds of the way
 * through a group before the measurement agreed they had started it, and the owner read
 * that as it firing early. A reading line about a third of the way down is where a
 * reader's eye actually is, so the current group becomes the **last** one whose head has
 * crossed above it. Measured on the render at 900 and 1200 tall: 0.35 puts the line at
 * 403px and 508px, which in both cases is the first third of the text column rather than
 * its top edge.
 */
const READING_LINE = 0.35;

/**
 * That line, in pixels from the top of the viewport.
 *
 * The resting offset is read off the head rather than restated as a number here: the
 * panel carries `scroll-mt-(--file-sticky-top)`, so its computed scroll margin *is*
 * where a jump comes to rest, and a hard-coded value disagreeing with it by eight pixels
 * is what once put a jumped-to heading just above the deciding band.
 */
function readingLine(head: HTMLElement): number {
  const rest = Number.parseFloat(getComputedStyle(head).scrollMarginTop);
  const top = Number.isFinite(rest) && rest > 0 ? rest : 96;
  return top + READING_LINE * window.innerHeight;
}

/** Keys that scroll the page, and therefore hand the pane back to the scroll. */
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

/**
 * Which group the reader is in — the one they just asked for, or failing that the one
 * their scroll position says they are reading.
 *
 * **D7's machinery, back for the pane rather than for an index rail** (brief D21, D26).
 * The rule is reused verbatim rather than rebuilt, because it was verified over CDP —
 * 40/40 clicks and 60/60 scroll positions across three viewports — and because the claim
 * matters *more* here than it did for the index: what changes now is the pane's content,
 * not a highlight.
 *
 * Three things decide it, in that order, and the order is the whole point.
 *
 * A click *claims* it: the reader has said where they are looking, so the pane says so at
 * once and keeps saying so until they scroll somewhere themselves. The claim is not
 * decoration over a working measurement — it is the only thing that can be right at the
 * foot of the file, where asking for one of the short last groups scrolls the page as far
 * as it will go and still leaves the reading line *above* that head. No line, however
 * placed, can read that position as anything but the earlier group; the reader's own
 * request can.
 *
 * Under the claim, the position itself: **the last group whose head has crossed above the
 * reading line**. Measured from the heads' own rects rather than inferred from an
 * `IntersectionObserver` — an observer answers "is this box inside that band", and the
 * question here is "is this head above an arbitrary line", expressible as a band only
 * when the line is the top of the viewport, which is exactly the rule the owner asked to
 * change. Reading a dozen rects inside one `requestAnimationFrame` is a frame's work at
 * most, and it is measured at most once per frame however fast the wheel turns.
 *
 * Under both, the end of the scroll — the one position no line can describe, because the
 * last groups are short enough that the page runs out of scroll before their heads can
 * reach any line. Once there is no scroll left the reader has reached the end of the
 * file, so the answer becomes the last group *on screen*.
 *
 * The dependency is the joined key, and the ids are read back out of it, so the effect
 * re-runs when the file changes and not when a caller happens to rebuild the array.
 */
function useReadingGroup(ids: CaseGroupId[]): {
  reading: CaseGroupId | undefined;
  claim: (group: CaseGroupId) => void;
} {
  const key = ids.join("|");
  const [scrolled, setScrolled] = React.useState<CaseGroupId | undefined>(
    () => ids[0],
  );
  const [claimed, setClaimed] = React.useState<CaseGroupId | undefined>(
    undefined,
  );

  React.useEffect(() => {
    /* Id and node together, so a group the DOM has not mounted cannot shift the rest of
       the list out of step with its own ids. */
    const heads = (key.split("|") as CaseGroupId[])
      .map(
        (id) => [id, document.getElementById(caseGroupAnchor(id))] as const,
      )
      .filter((pair): pair is [CaseGroupId, HTMLElement] => pair[1] !== null);
    if (heads.length === 0) return;

    let frame = 0;

    function decide() {
      frame = 0;
      const line = readingLine(heads[0][1]);
      /* The page has run out of scroll, which changes which group on screen is the
         answer — see the end-of-scroll paragraph above. */
      const ended =
        Math.ceil(window.scrollY + window.innerHeight) >=
        document.documentElement.scrollHeight - 2;
      const limit = ended ? window.innerHeight : line;

      /* The *last* head past the limit. Groups are in reading order, so the loop keeps
         the latest one that qualifies; nothing qualifying means the reader is above the
         first head, which is the first group. */
      let winner = heads[0][0];
      for (const [id, node] of heads) {
        if (node.getBoundingClientRect().top <= limit) winner = id;
      }
      setScrolled(winner);
    }

    function measure() {
      if (frame) return;
      frame = window.requestAnimationFrame(decide);
    }

    decide();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    /* The reader moving the page themselves gives the pane back to the measurement.
       Only their own gestures count: a jump is a scroll too, and releasing on any scroll
       at all is what let every group a smooth jump passed through flash active on the
       way. */
    const release = (event: Event) => {
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
      setClaimed(undefined);
    };
    const gestures = ["wheel", "touchstart", "keydown"] as const;
    for (const gesture of gestures) {
      window.addEventListener(gesture, release, { passive: true });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      for (const gesture of gestures) {
        window.removeEventListener(gesture, release);
      }
    };
  }, [key]);

  return { reading: claimed ?? scrolled, claim: setClaimed };
}

/* ──────────────────────── arriving from a finding ───────────────────────── */

/**
 * Arriving from a finding: scroll to the head it named, put focus there, and open the
 * document it pointed at.
 *
 * The link is now `?file=1&doc=…#case-group-…` on the complaint's own route (brief D25),
 * so the file region has just been disclosed rather than loaded — which is why the scroll
 * happens here instead of being left to the browser. The head carries
 * `scroll-mt-(--file-sticky-top)`, so it comes to rest clear of the chrome *and* the
 * sticky strip without this having to measure anything.
 *
 * What the browser will not do is move *focus*, so a keyboard reader who followed a
 * finding would have arrived at the top of a forty-one-row file with no idea the page had
 * moved. The head takes focus instead.
 *
 * The pane is pre-loaded **only** on a deep link, which is the one time a starting point
 * is asserted by the reader rather than by the screen.
 */
function useDeepLink({
  caseId,
  groups,
  onOpen,
}: {
  caseId: string;
  groups: CaseGroup[];
  onOpen: (selection: PaneSelection) => void;
}) {
  const params = useSearchParams();
  const doc = params.get("doc");

  React.useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      const head = window.document.getElementById(hash);
      head?.scrollIntoView({ block: "start" });
      head?.focus({ preventScroll: true });
    }
    if (!doc) return;
    const spec = caseSlotFor(doc);
    if (!spec) return;
    const group = groups.find((entry) => entry.id === spec.group);
    if (!group) return;
    if (paneDocumentsOf(group).some((entry) => entry.key === doc)) {
      onOpen({ group: group.id, doc });
    }
    /* Once, on arrival. Re-running as the reader opens other documents would keep
       yanking the pane back to the one the link named. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, doc]);
}

/* ─────────────────────────────── the claims ─────────────────────────────── */

/** What the pane is showing, and what asked for it. */
type PaneSelection = {
  group: CaseGroupId;
  /** The slot key of the document in view. */
  doc: string;
  /** Which fact row is lit — `${block}:${term}`, unique inside a group. */
  row?: string;
  /** That fact's term, for the pane's own sub-line. */
  term?: CaseFactTerm;
};

/** What the pane asks for, and what a click on a claim hands it. */
type OpenPane = (selection: PaneSelection, from?: HTMLElement | null) => void;

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
  selectedRow,
  onOpen,
}: {
  section: CaseSection;
  selectedRow: string | undefined;
  onOpen: OpenPane;
}) {
  const headingId = `case-section-heading-${section.id}`;

  return (
    <section
      id={anchorFor(section.id)}
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-2", SCROLL_REST)}
    >
      {/* An eyebrow, not a heading at the panels' size. The section and the group
          titles below it were both 16px/600, so nothing told a reader which was the
          container and which the thing contained. The section is a label for a run of
          panels; the panel title is what a reader is looking for. */}
      <h2
        id={headingId}
        className="text-caption font-semibold text-muted-foreground"
      >
        {section.title}
      </h2>
      <div className="flex min-w-0 flex-col gap-4">
        {section.groups.map((group) => (
          <CaseGroupPanel
            key={group.id}
            group={group}
            selectedRow={selectedRow}
            onOpen={onOpen}
          />
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
 * **The head is what a finding links to and what the pane follows**, so it carries the
 * anchor, the scroll offset, and a focus target — a magistrate who followed a finding
 * from the report lands *here* rather than at the top of the file, and the reading
 * observer measures this rect to decide whose documents the pane should hold (brief D26).
 */
function CaseGroupPanel({
  group,
  selectedRow,
  onOpen,
}: {
  group: CaseGroup;
  selectedRow: string | undefined;
  onOpen: OpenPane;
}) {
  const Icon = group.icon;
  const headingId = `case-group-heading-${group.id}`;
  /* A group that holds exactly one record — the cheque, the complainant, the accused —
     used to print the group's title and then the record's name as a second heading row
     directly beneath it, both at 16px. The record's name is what the group is *about*,
     so it becomes the title block's second line; only a group listing several records
     (witnesses, advocates) keeps a heading per record, because there the names are what
     tell the blocks apart. */
  const sole =
    group.records?.length === 1 ? group.records[0] : undefined;

  /* Every block this panel holds, in reading order, so the rule between them is decided
     once by position rather than twice by which shape the data happened to take. A
     group's own facts are the last block; they used to sit bare on the sheet while a
     named record sat in a well, which split the file down a line — `records` versus
     `facts` — that is invisible to a reader and meant nothing to them. */
  const blocks: React.ReactNode[] = [
    ...(group.records ?? []).map((record, index) => (
      <CaseRecordBlock
        key={record.id}
        blockId={record.id}
        group={group.id}
        heading={sole ? undefined : record.heading}
        tag={sole ? undefined : record.tag}
        /* "1." above a lone complainant counts nothing, so the ordinal appears only
           where there is more than one of something. */
        ordinal={(group.records?.length ?? 0) > 1 ? index + 1 : undefined}
        facts={record.facts}
        documents={record.documents}
        /* What a document row is named after in the accessible name: the record it
           belongs to, or failing that the head it was filed under. */
        within={record.heading}
        selectedRow={selectedRow}
        onOpen={onOpen}
      />
    )),
    ...(group.facts || group.documents
      ? [
          <CaseRecordBlock
            key="group-facts"
            blockId="group-facts"
            group={group.id}
            facts={group.facts}
            documents={group.documents}
            within={group.title}
            selectedRow={selectedRow}
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
          className="flex size-8 shrink-0 items-center justify-center self-start rounded-lg bg-surface-sunken text-muted-foreground"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h3 id={headingId} className="min-w-0 text-body font-semibold">
            {group.title}
          </h3>
          {sole?.heading ? (
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-body-compact text-muted-foreground">
              <span className="min-w-0">{sole.heading}</span>
              {sole.tag ? <Badge variant="secondary">{sole.tag}</Badge> : null}
            </p>
          ) : null}
        </div>
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
  blockId,
  group,
  heading,
  tag,
  ordinal,
  facts,
  documents,
  within,
  selectedRow,
  onOpen,
}: {
  /** This block's identity inside its group, so a lit row can be told from its twin. */
  blockId: string;
  group: CaseGroupId;
  heading?: string;
  tag?: string;
  ordinal?: number;
  facts?: CaseFact[];
  documents?: CaseDocument[];
  /** What the documents in this block belong to, for their accessible names. */
  within: string;
  selectedRow: string | undefined;
  onOpen: OpenPane;
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
      {facts ? (
        <CaseFactRows
          blockId={blockId}
          group={group}
          facts={facts}
          documents={documents}
          selectedRow={selectedRow}
          onOpen={onOpen}
        />
      ) : null}
      {documents ? (
        <CaseDocuments
          group={group}
          documents={documents}
          within={within}
          onOpen={onOpen}
        />
      ) : null}
    </div>
  );
}

/**
 * The file's fact rows, at the DS `DescriptionList`'s own metric — and, where a row has
 * a source, the control that reads it against its document.
 *
 * `minmax(7rem,10rem)` is the DS default, and it holds now that the terms are the
 * attributes' names rather than the form's questions (brief §5a.4a). Two departures from
 * the primitive, both stated once here. The stroke drops to hairline: fifteen rows at
 * full `border-border` would be the darkest marks on the page, and an internal divider
 * inside a panel that already has an edge is not what full strength is for (`ui-craft`
 * §1.1). And the two-column grid is applied at `@xs` on the block rather than at `sm:` on
 * the window, so a term that outgrows its track in a narrow claims column stacks *there*,
 * whatever the window is doing — which is what makes the long-label and other-language
 * cases survivable.
 *
 * Term and value are both `text-body-compact` at 400, which is also the DS default and
 * the reason it exists: the pair is distinguished by colour rather than by a second
 * weight (`ui-craft` §1.3).
 *
 * **Only a row with a source is a control** (brief D27). Fifteen of the forty-one rows on
 * `r-1840` have no document behind them and two more are weak pairs; a row whose source
 * is a slot nobody filled is not a control either, because there is nothing to open. What
 * a control does is hand the pane that document and light itself — **one** quiet
 * persistent cue, `bg-accent` on the row, never a ring and a border and a fill stacked
 * (`ui-craft`'s loudness ladder). The negative margin is what lets the fill have padding
 * without the value moving when it appears.
 */
function CaseFactRows({
  blockId,
  group,
  facts,
  documents,
  selectedRow,
  onOpen,
}: {
  blockId: string;
  group: CaseGroupId;
  facts: CaseFact[];
  /** This block's own slots, so a source can be checked against what is actually filed. */
  documents: CaseDocument[] | undefined;
  selectedRow: string | undefined;
  onOpen: OpenPane;
}) {
  return (
    <DescriptionList>
      {facts.map((fact) => {
        const rowId = `${blockId}:${fact.term}`;
        const source = fact.source;
        const slot = source ? caseSlotFor(source) : undefined;
        /* A source only makes a control when the slot it names is on the file. The
           delay-condonation grounds are the standing case: the row points at the
           application, and on `r-1588` the application was never uploaded. */
        const filed =
          source !== undefined &&
          slot !== undefined &&
          (documents ?? []).some(
            (document) => document.key === source && document.state === "filed",
          );
        const lit = filed && selectedRow === rowId;

        return (
          <DescriptionRow
            key={fact.term}
            className={cn(
              "grid-cols-1 gap-1 border-hairline @xs:grid-cols-[minmax(7rem,10rem)_1fr] @xs:gap-4",
              lit && "-mx-2 rounded-md bg-accent px-2",
            )}
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
              {filed && slot ? (
                <button
                  type="button"
                  /* `min-h-10 min-w-10` keeps the 40×40 floor on a target that is only
                     as wide as its value — "Yes" is three characters
                     (`ACCESSIBILITY.md` §8). `w-fit` keeps the hover fill on the words
                     rather than across the column.

                     **The negative margins are what keep the value on its term's line.**
                     Measured on the render before they were added: a 40px box centring a
                     20px line put every sourced value 10px below its term — "Amount" at
                     275, "₹6,76,100" at 285 — across twenty-six rows, while the fifteen
                     declared-only rows beside them sat level. ACCESSIBILITY §8 asks for a
                     small control's hit area to be *expanded*, not for the layout to grow:
                     `-my-2.5` hands the extra 20px back to the row's own `py-3`, so the
                     target is 40px tall and the text sits exactly where plain text would. */
                  className="-mx-1.5 -my-2.5 flex min-h-10 w-fit min-w-10 items-center rounded-md px-1.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-focus-ring"
                  aria-current={lit ? "true" : undefined}
                  onClick={(event) =>
                    onOpen(
                      {
                        group,
                        doc: source,
                        row: rowId,
                        term: fact.term,
                      },
                      event.currentTarget,
                    )
                  }
                >
                  {fact.value ?? "Not stated"}
                  {/* The visible words stay the value, so the spoken name starts with
                      what is written (WCAG 2.5.3) and the rest says what pressing it
                      does — which a bare value would not. */}
                  <span className="sr-only">
                    {" "}
                    — read {fact.term} against {slot.label}
                  </span>
                </button>
              ) : (
                (fact.value ?? "Not stated")
              )}
            </DescriptionDetails>
          </DescriptionRow>
        );
      })}
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
 * beside the claims — **not a dialog over them**, which is the whole of brief D1 — and it
 * claims the pane for this group, so scrolling away hands it back.
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
  group,
  documents,
  within,
  onOpen,
}: {
  group: CaseGroupId;
  documents: CaseDocument[];
  within: string;
  onOpen: OpenPane;
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-2">
      {documents.map((document) => (
        <li key={document.key} className="min-w-0">
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
                      { group, doc: document.key },
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

/** One tab of the pane: a filed document of the group being read. */
type PaneDocument = {
  key: string;
  label: string;
  kind: CaseDocumentKind;
  /**
   * The named record it was filed under — a cheque's number, a party, an advocate — and
   * nothing when it was filed under the group itself.
   *
   * Only a record: the group's own title is already the section the reader is in, and
   * on a one-document group it is also the frame's title twenty pixels up. Measured on
   * the render: "Payment receipt" printed twice, one above the other.
   */
  record?: string;
  /** Only where a label repeats inside the group: three advocates, three vakalatnamas. */
  ordinal?: number;
};

/**
 * The tab set: the group's **filed** documents, in the file's order.
 *
 * Absent slots are not tabs (brief D26) — there is nothing to open, and the slot's
 * absence is already stated in the claims column, which is where the form's question
 * belongs. Records come before the group's own documents because that is the order the
 * panel renders them in, and a pane whose tabs disagree with the column beside it would
 * be the reader's own index working against them.
 *
 * The ordinal appears only where a label actually repeats. "1 · Vakalatnama" on a
 * complaint with one advocate counts nothing.
 */
function paneDocumentsOf(group: CaseGroup | undefined): PaneDocument[] {
  if (!group) return [];
  const blocks: { record?: string; documents?: CaseDocument[] }[] = [
    ...(group.records ?? []).map((record) => ({
      record: record.heading,
      documents: record.documents,
    })),
    { documents: group.documents },
  ];
  const filed: PaneDocument[] = blocks.flatMap((block) =>
    (block.documents ?? [])
      .filter((document) => document.state === "filed")
      .map((document) => ({
        key: document.key,
        label: document.label,
        kind: document.kind,
        record: block.record,
      })),
  );

  const repeats = new Map<string, number>();
  for (const document of filed) {
    repeats.set(document.label, (repeats.get(document.label) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return filed.map((document) => {
    if ((repeats.get(document.label) ?? 0) < 2) return document;
    const nth = (seen.get(document.label) ?? 0) + 1;
    seen.set(document.label, nth);
    return { ...document, ordinal: nth };
  });
}

/**
 * The document, beside the claims it is read against — and a tab per document of the
 * group being read (brief D26).
 *
 * `DocumentPreview variant="quiet" surface="card"` is `EvidenceColumn`'s composition
 * verbatim — the same shape the advocate queue puts a Bar ID card in, and no third way is
 * introduced for this. `surface="card"` rather than the default sunken well, because on a
 * tinted canvas a sunken fill is the canvas's own tone and the well would have no edge.
 *
 * The tabs go in the frame's `header` slot rather than above it, so the active underline
 * sits **on** the frame's own rule instead of floating a few pixels off it — two parallel
 * horizontal lines being what `ui-craft` §2 forbids — and so the tab and a title strip do
 * not name the same document twice, eight pixels apart.
 *
 * **`TabsList` has no overflow story** (brief §13.4): the DS ships it `inline-flex w-fit`
 * with `whitespace-nowrap flex-1` triggers, so a caller with many or long labels writes
 * its own scroller. This is the second caller to do so — `filing/section-tabs.tsx` was the
 * first — and the fix belongs upstream, not in the primitive here. One scrolling line,
 * never a wrapping block (`RESPONSIVE.md`: *allow wrap or scroll if many triggers*).
 *
 * What the well holds is a drawing. A facsimile states that *a page of this kind* is on
 * the file and is deliberately not legible: readable text here would be fabricating a
 * court record, which is the one thing a demo of a court file must not do.
 */
function CaseDocumentPane({
  group,
  documents,
  active,
  term,
  onSelect,
}: {
  group: CaseGroup | undefined;
  documents: PaneDocument[];
  active: PaneDocument | undefined;
  /** The fact being read against this document, when one asked for it. */
  term: CaseFactTerm | undefined;
  onSelect: (key: string) => void;
}) {
  /* A head with nothing filed under it. The pane names the group and says so — never a
     skeleton (nothing is loading) and never an upload target (brief D26, §10). */
  if (!active || !group) {
    return (
      <section
        className={cn(PANEL, "flex min-h-64 flex-col justify-center gap-2")}
        aria-label="Document"
      >
        <p className="text-body font-medium">No document</p>
        <p className="text-body-compact text-pretty text-muted-foreground">
          {group
            ? `No documents were filed under ${group.title}.`
            : "Scroll the file to read a document beside the values entered from it."}
        </p>
      </section>
    );
  }

  return (
    <Tabs value={active.key} onValueChange={onSelect}>
      <DocumentPreview
        variant="quiet"
        surface="card"
        /* `height="default"` and not `fill`: `fill` sizes the well against a definite
           container, and a sticky panel on a scrolling page has none. The standard 384px
           well is what the bounded facsimile very nearly fills anyway. */
        height="default"
        title={active.label}
        /* One document is not a tab bar. A strip with a single tab is chrome around
           nothing, so the frame keeps its own title instead (brief §10). */
        header={
          documents.length > 1 ? (
            <PaneTabs documents={documents} active={active.key} />
          ) : undefined
        }
        source={{
          kind: "composed",
          content: documents.map((document) => (
            <TabsContent key={document.key} value={document.key}>
              <PaneReading term={term} record={document.record} />
              <PaneFacsimile kind={document.kind} />
            </TabsContent>
          )),
        }}
      />
    </Tabs>
  );
}

/**
 * One scrolling line of tabs, at the DS's own metric, with the active one kept in view.
 *
 * Lifted from `filing/section-tabs.tsx` rather than re-derived: the app already solved
 * "many triggers in a bounded strip" once, and the measurements in that file — never
 * `scrollIntoView`, which nudges the page vertically; snap home on the first and last —
 * were made on a render. `after:-bottom-px` is what lands the active underline on the
 * strip's own rule.
 */
function PaneTabs({
  documents,
  active,
}: {
  documents: PaneDocument[];
  active: string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !tab) return;
    if (tab === list.firstElementChild) {
      list.scrollLeft = 0;
      return;
    }
    if (tab === list.lastElementChild) {
      list.scrollLeft = list.scrollWidth;
      return;
    }
    const strip = list.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    if (rect.left < strip.left) list.scrollLeft -= strip.left - rect.left + 8;
    else if (rect.right > strip.right) {
      list.scrollLeft += rect.right - strip.right + 8;
    }
  }, [active]);

  return (
    <TabsList
      ref={listRef}
      variant="line"
      /* `w-full` overrides the primitive's `w-fit` so the strip is bounded by the frame
         and its overflow scrolls rather than stretching the pane; `justify-start`
         overrides its centring, so two tabs sit at the left edge instead of floating
         mid-strip, orphaned from the document below. */
      className="w-full min-w-0 flex-nowrap justify-start gap-0 overflow-x-auto p-0 group-data-horizontal/tabs:h-10"
    >
      {documents.map((document) => (
        <TabsTrigger
          key={document.key}
          value={document.key}
          className="h-10 flex-none gap-1.5 rounded-b-none px-2 text-body-compact group-data-horizontal/tabs:after:-bottom-px"
        >
          {document.ordinal ? (
            <span className="tabular-nums text-muted-foreground">
              {document.ordinal} ·
            </span>
          ) : null}
          {document.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

/**
 * What this document is being read against, and the limit on how far that can go
 * (brief D27).
 *
 * **The highlight is not built, and the pane says why rather than drawing one.** The
 * e-filing side turns `ExtractedField.box` into a ring over a scan
 * (`filing/source-panel.tsx`, `regionFromBox`), and the owner asked for the same
 * interaction here — *"just like how we had it for e-filing, where when you click on a
 * relevant field, it'll show the annotation"*. Three things stop it crossing today, and
 * all three are facts rather than effort:
 *
 * 1. **The box lives on the filer's side.** It hangs off `IntakeSlot.extract`, produced
 *    by OCR at upload. The court side has no document store at all (brief §12.8).
 * 2. **The pane shows a drawing, not a scan.** `PageFacsimile` is deliberately illegible,
 *    because readable text would fabricate a court record — so a box drawn on it would
 *    point at a place that does not exist. The same rule, one layer up.
 * 3. **Even with a store, `box` is optional and sparse.** Only fields a parser read carry
 *    one; most of this file's values were typed by the filer and never read off anything.
 *    A design implying every value is machine-located would teach a magistrate to trust a
 *    link that is not there.
 *
 * So the promise is staged and the screen says which stage it is in: today the fact names
 * its document and the pane opens it. When a store arrives *and* the filing's `DocExtract`
 * travels with the complaint, the same click draws `regionFromBox(box, page)` — reused
 * verbatim from `source-panel.tsx`, never re-derived — for the values that carry a box.
 *
 * The line only appears when a fact asked, which is the one moment a reader who knows
 * e-filing is looking for the highlight.
 */
function PaneReading({
  term,
  record,
  limitStated = false,
}: {
  term: CaseFactTerm | undefined;
  record: string | undefined;
  /**
   * The overlay already says the page is drawn, in its own description, so saying it
   * again here would put one sentence on the screen twice.
   */
  limitStated?: boolean;
}) {
  if (!term) {
    /* Whose document this is, when the tab alone cannot say — "ID proof" is both
       parties', "Vakalatnama" is every advocate's. Nothing at all for a document filed
       under the group itself, whose name the reader is already inside. */
    return record ? (
      <p className="mb-3 text-caption text-muted-foreground">{record}</p>
    ) : null;
  }
  return (
    <div className="mb-3 flex min-w-0 flex-col gap-1">
      <p className="text-caption text-muted-foreground">
        Reading <span className="text-foreground">{term}</span>
      </p>
      {limitStated ? null : (
        <p className="text-caption text-pretty text-muted-foreground">
          The page is drawn, not scanned, so nothing on it is marked.
        </p>
      )}
    </div>
  );
}

/** The page itself, bounded and centred inside whatever well it is given. */
function PaneFacsimile({ kind }: { kind: CaseDocumentKind }) {
  return (
    <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-md border border-paper-border bg-paper">
      <PageFacsimile kind={kind} />
    </div>
  );
}

/**
 * The same pane, below `xl`, where there is no second column for it.
 *
 * A `Drawer` on a phone and a `Sheet` on a tablet — the DS's own answer to "the viewport
 * cannot hold two things at once" (`RESPONSIVE.md` §6). Both restore focus to the control
 * that opened them, which is what keeps a keyboard reader from being dropped at the top
 * of a file eighteen documents long.
 *
 * **The group's tab strip comes with it** (brief D26, D11): the same strip, inside the
 * overlay, so a reader who opened the cheque can reach its return memo without closing
 * and scrolling. No third mechanism appears.
 */
function CaseDocumentOverlay({
  open,
  group,
  documents,
  active,
  term,
  onSelect,
  onClose,
}: {
  open: boolean;
  group: CaseGroup | undefined;
  documents: PaneDocument[];
  active: PaneDocument | undefined;
  /** The fact being read against the active document, as in the docked pane. */
  term: CaseFactTerm | undefined;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const phone = useIsMobile();
  const showing = open && active !== undefined && group !== undefined;
  const description =
    "The page is drawn, not scanned — this build has no document store behind it.";

  const body = active ? (
    <Tabs value={active.key} onValueChange={onSelect} className="min-h-0 flex-1">
      {documents.length > 1 ? (
        <div className="border-b border-hairline px-4">
          <PaneTabs documents={documents} active={active.key} />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {documents.map((document) => (
          <TabsContent key={document.key} value={document.key}>
            <PaneReading
              term={document.key === active.key ? term : undefined}
              record={document.record}
              limitStated
            />
            <PaneFacsimile kind={document.kind} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  ) : null;

  if (phone) {
    return (
      <Drawer
        open={showing}
        onOpenChange={(next) => (next ? undefined : onClose())}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-semibold break-words text-title-s">
              {group?.title}
            </DrawerTitle>
            <DrawerDescription className="text-body-compact">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet
      open={showing}
      onOpenChange={(next) => (next ? undefined : onClose())}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-100">
        <SheetHeader>
          <SheetTitle className="font-semibold break-words text-title-s">
            {group?.title}
          </SheetTitle>
          <SheetDescription className="text-body-compact">
            {description}
          </SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}

/* ────────────────────────────── the timeline ────────────────────────────── */
