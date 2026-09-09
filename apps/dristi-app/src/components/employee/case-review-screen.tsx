"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { FileQuestionIcon, FileTextIcon, InfoIcon } from "lucide-react";

import { useCourtToday } from "@/components/employee/use-court-today";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  CASE_REVIEW_STATUS,
  caseReviewFor,
  type CaseDocument,
  type CaseDocumentKind,
  type CaseFact,
  type CaseGroup,
  type CaseReview,
  type CaseSection,
} from "@/lib/employee/case-review";
import { formatDaysSinceSubmitted } from "@/lib/employee/register-cases";
import { cn } from "@/lib/utils";

/**
 * One waiting complaint's file, read in full — the screen behind a cause title on
 * Register cases.
 *
 * Transcribed from the legacy Register Cases → View reference (screenshots, this
 * conversation): a reading index down the left, the complaint's numbered sections in
 * the middle, the case's progress on the right, and the two decisions pinned at the
 * foot. What the file *contains* is `lib/employee/case-review.ts`; this module is only
 * how it is read.
 *
 * **The index is the thing that had to stay put.** On the reference it scrolls away
 * with the page, so by the second section — of five, across a file this long — the
 * clerk has no idea where they are and no way to jump. Here it is `sticky` at the
 * chrome's own resting offset and marks the section being read, which is the whole
 * point of a five-part file. Below `lg` there is no room for a rail, so the index
 * becomes the first panel on the page rather than disappearing: chrome that vanishes
 * is the structural regression `ui-craft` §0 names, and a table of contents is still
 * useful when it is not beside the text.
 *
 * **It reads; it does not decide.** Admitting a complaint is taking cognizance, and
 * dismissing one ends it — both are judicial acts, neither is connected to anything,
 * and `lib/employee/register-cases.ts` already records that this build performs no
 * registration act. The band is two real controls that stay unbuilt. See
 * `CaseDecisionBand`.
 */
export function CaseReviewScreen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const review = caseReviewFor(caseId, today);

  if (!review) return <CaseReviewMissing />;

  return <CaseReviewPage review={review} />;
}

/**
 * An id no register queue holds. The same miss the order composer and the case
 * overview already answer, arriving by the same route — a stale link, a typed URL, or
 * a complaint that has left the queue.
 */
function CaseReviewMissing() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-semibold text-title-s">
            This complaint is not in the register queue
          </EmptyTitle>
          <EmptyDescription className="text-body">
            A complaint opens from the list of those waiting to be registered. This
            one is not on it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/employee/register-cases">Back to register cases</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

/* The house panel, as the cause list, the scheduling queue and the case overview all
   compose it: a white sheet lifted off the white page by its shadow, with the hairline
   as a soft edge rather than a stroke. Nothing inside draws a second frame. */
const PANEL =
  "min-w-0 rounded-xl border border-hairline bg-card p-6 shadow-raised";

/**
 * Where a heading comes to rest when the index jumps to it.
 *
 * The chrome publishes its own resting offset as `--chrome-sticky-top` (bar height
 * plus the page's own step), so both the sticky rails and the scroll target read the
 * one value and a taller bar cannot leave a heading half under it.
 */
const STICKY = "lg:sticky lg:top-(--chrome-sticky-top) lg:self-start";

/**
 * The line down the viewport at which a section counts as the one being read.
 *
 * Read off the heading itself rather than restated as a number here: the heading
 * carries `scroll-mt-(--chrome-sticky-top)`, so its computed scroll margin *is* where
 * a jump comes to rest. A hard-coded 96 disagreed with that resting place by eight
 * pixels, which put a jumped-to heading just above the band that decides the index —
 * near the foot of the file, where there is no scroll left to correct it, that is the
 * difference between the section the reader asked for and the one after it.
 */
function readingLine(heading: HTMLElement): number {
  const rest = Number.parseFloat(getComputedStyle(heading).scrollMarginTop);
  return Number.isFinite(rest) && rest > 0 ? rest : 96;
}

function anchorFor(sectionId: string): string {
  return `case-section-${sectionId}`;
}

function sectionOf(anchorId: string): string {
  return anchorId.replace("case-section-", "");
}

/** The end of the file, watched so the index can tell when the reader has reached it. */
const FOOT_ANCHOR = "case-file-foot";

function scrollToSection(sectionId: string) {
  document.getElementById(anchorFor(sectionId))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function CaseReviewPage({ review }: { review: CaseReview }) {
  /* Every section starts open: a clerk deciding whether to register a complaint is
     reading the whole file, not choosing a part of it. The disclosures are there to
     fold away what has been checked, which is the opposite default. */
  const [open, setOpen] = React.useState(() =>
    review.sections.map((section) => section.id),
  );
  const { reading, claim } = useReadingSection(review.sections.map((s) => s.id));

  /* Following the link is three things: the index says where the reader is going
     before the scroll has taken them there, the section opens if it was folded away,
     and the page moves.

     The open is flushed before the scroll rather than left for the next commit,
     because near the foot of the file the document is too short to scroll to a folded
     heading: the heading's own place does not move as it unfolds, but the room below
     it to bring that place up to the reading line arrives with the section. Flushing
     recovers the committed part of that room and no more — the disclosure animates its
     height, so unfolding the *last* section from the index still lands short of the
     line. The index is right either way; the scroll is as close as it can get without
     chasing an animation. */
  function jumpTo(sectionId: string) {
    claim(sectionId);
    if (!open.includes(sectionId)) {
      flushSync(() => setOpen((current) => [...current, sectionId]));
    }
    scrollToSection(sectionId);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 pb-0 md:p-8 md:pb-0">
        <CaseReviewHeader review={review} />

        {/* Three columns at `lg`: the index, the file, the progress. The file takes
            the free track and the two rails are fixed, so a corporate accused wraps
            inside the reading column rather than squeezing it. Below `lg` they stack
            in this order — index, progress, file — because both rails are short and
            the file is not. */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,17rem)] lg:gap-8">
          <CaseFileIndex
            sections={review.sections}
            reading={reading}
            onJump={jumpTo}
            className="lg:col-start-1 lg:row-start-1"
          />
          <CaseProgressPanel
            steps={review.timeline}
            className="lg:col-start-3 lg:row-start-1"
          />
          <div className="relative flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-1">
            <Accordion
              type="multiple"
              value={open}
              onValueChange={setOpen}
              className="flex min-w-0 flex-col gap-8"
            >
              {review.sections.map((section, index) => (
                <CaseSectionBlock
                  key={section.id}
                  section={section}
                  number={index + 1}
                />
              ))}
            </Accordion>
            {/* The end of the file, for the index to watch (`useReadingSection`).
                Positioned rather than stacked, so it adds no step to the column. */}
            <div
              id={FOOT_ANCHOR}
              aria-hidden
              className="pointer-events-none absolute bottom-0 h-px w-px"
            />
          </div>
        </div>
      </div>

      <CaseDecisionBand />
    </div>
  );
}

/** Keys that scroll the page, and therefore hand the index back to the scroll. */
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
 * Which section the reader is in — the one they just asked for, or failing that the
 * one their scroll position is inside.
 *
 * Three things decide it, in that order, and the order is the whole point.
 *
 * A click on the index *claims* it: the reader has said where they are going, so the
 * index says so at once and keeps saying so until they scroll somewhere themselves.
 * The claim is not decoration over a working observer — it is the only thing that can
 * be right at the foot of the file, where asking for one of the short last sections
 * scrolls the page as far as it will go and still leaves the reading line *past* that
 * heading, inside the section below it. No band, however placed, can read that
 * position as anything but the later section; the reader's own request can.
 *
 * Under the claim, an observer tracks where the page actually is. An observer rather
 * than a scroll listener: the browser already knows when a heading crosses the reading
 * line, and asking it on every frame instead is how a long page starts to feel heavy.
 * The top margin is negative by the heading's own resting offset so a heading under
 * the bar does not count as read, and the bottom cuts most of the viewport so the
 * section being finished wins over the one just appearing.
 *
 * Under both, the end of the scroll — the one position the band cannot describe, so
 * the last section on screen answers for it instead of the first.
 *
 * The dependency is the joined key, and the ids are read back out of it, so the effect
 * re-runs when the file changes and not when a caller happens to rebuild the array.
 */
function useReadingSection(ids: string[]): {
  reading: string | undefined;
  claim: (sectionId: string) => void;
} {
  const key = ids.join("|");
  const [scrolled, setScrolled] = React.useState<string | undefined>(
    () => ids[0],
  );
  const [claimed, setClaimed] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const sectionIds = key.split("|");
    const nodes = sectionIds
      .map((id) => document.getElementById(anchorFor(id)))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    /* Every section's latest state, kept across callbacks, because a callback is
       handed only the sections whose state *changed*. Deciding the winner from one
       batch is what made the index lag and then skip: a batch carrying nothing but a
       section entering from below outranked the section above it that the reader was
       still in, purely because that one had stopped changing and so stopped being
       reported. The winner is the first section in the file that is on screen now,
       from the whole picture rather than from the last few frames of it. */
    const onScreen = new Map<string, boolean>();

    /* Whether the page has run out of scroll, which changes which section on screen
       is the answer. Kept by `readEnd` below. */
    let ended = false;

    function decide() {
      const showing = sectionIds.filter((id) => onScreen.get(id));
      const winner = ended ? showing[showing.length - 1] : showing[0];
      /* Nothing on screen means the reader is between headings, which is not a reason
         to forget where they were. */
      if (winner) setScrolled(winner);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          onScreen.set(sectionOf(entry.target.id), entry.isIntersecting);
        }
        decide();
      },
      { rootMargin: `-${readingLine(nodes[0])}px 0px -55% 0px` },
    );

    for (const node of nodes) observer.observe(node);

    /* The end of the scroll is its own answer, because the last sections are the short
       ones: the page runs out of scroll before their headings can reach the reading
       line — on this file the last heading would need 167px more than the document
       has. No band, wherever it is placed, can read the bottom of a document as
       anything but the section above the last one. So once there is no scroll left the
       reader has reached the end of the file, and the answer becomes the *last* section
       on screen instead of the first.

       The condition is the scroll position and not "the foot is in view": on a narrow
       viewport the last section is tall enough that the end of the column appears while
       the reader is still properly inside the section above it, and treating that as
       the end of the file marked the wrong entry. The sentinel's job is only to say
       when it is worth watching — the position is read on scroll, but the listener is
       attached for the last screenful and removed again, so the long part of the page
       still costs nothing per frame. */
    function readEnd() {
      const atEnd =
        Math.ceil(window.scrollY + window.innerHeight) >=
        document.documentElement.scrollHeight - 2;
      if (atEnd === ended) return;
      ended = atEnd;
      decide();
    }

    const footObserver = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) {
        window.addEventListener("scroll", readEnd, { passive: true });
      } else {
        window.removeEventListener("scroll", readEnd);
      }
      readEnd();
    });
    const foot = document.getElementById(FOOT_ANCHOR);
    if (foot) footObserver.observe(foot);

    /* The reader moving the page themselves gives the index back to the observer.
       Only their own gestures count: the jump is a scroll too, and releasing on any
       scroll at all is what let every section a smooth jump passed through flash
       active on the way. */
    const release = (event: Event) => {
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
      setClaimed(undefined);
    };
    const gestures = ["wheel", "touchstart", "keydown"] as const;
    for (const gesture of gestures) {
      window.addEventListener(gesture, release, { passive: true });
    }

    return () => {
      observer.disconnect();
      footObserver.disconnect();
      window.removeEventListener("scroll", readEnd);
      for (const gesture of gestures) {
        window.removeEventListener(gesture, release);
      }
    };
  }, [key]);

  return { reading: claimed ?? scrolled, claim: setClaimed };
}

/**
 * Which complaint this is: the number and the wait as an eyebrow, the cause as the
 * page, its one state as a chip, and the four particulars that the eyebrow does not
 * already name.
 *
 * The reference keeps all of this inside the reading column, between the two rails.
 * Here it runs the page's full width as **one** lifted sheet: the court side already
 * gives up a rail to its own chrome, and a page title squeezed into a middle track is
 * narrower than the thing it names. The rails begin where the file begins.
 *
 * Title and particulars share the sheet so the facts recede instead of arriving as a
 * second panel of form fields under a title that was already the page. The number
 * stays on the eyebrow — restating it as a labelled field printed the list's own
 * column twice, forty pixels apart. What remains is category, type, court and the
 * calendar date; the wait on the eyebrow is the duration, the date is the day.
 */
function CaseReviewHeader({ review }: { review: CaseReview }) {
  return (
    <header
      className={`${PANEL} flex flex-col gap-4`}
      aria-labelledby="case-review-title"
    >
      <div className="flex min-w-0 flex-col gap-2">
        {/* The wait is the one number this queue is ordered by, so it is stated where
            the list states it and in the same colour — the number carries the fact and
            the colour agrees with it. */}
        <p className="text-caption font-medium text-muted-foreground">
          <span className="tabular-nums">{review.caseNumber}</span>
          {" · "}
          <span className="tabular-nums text-warning-ink">
            {formatDaysSinceSubmitted(review.daysSinceSubmitted)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1
            id="case-review-title"
            className="text-balance font-semibold text-title sm:text-title-l"
          >
            {review.title}
          </h1>
          {/* One chip. Every complaint in this queue is in one state, which is why the
              list has no status column — on a single file it is worth saying once. */}
          <Badge variant="secondary">{CASE_REVIEW_STATUS}</Badge>
        </div>
      </div>

      {/* A real `dl`, term over value: the Laws name Description list for a record's
          key-value fields, and a 3-column grid of five left a hole on the second row.
          Four facts take two columns, then five from `lg`, with the statute name —
          the long cell — spanning two so it is not the squeezed one. Caption labels,
          compact values, one weight: size and colour do the rest. */}
      <DescriptionList className="grid min-w-0 grid-cols-2 items-start gap-4 lg:grid-cols-5">
        <IdentityFact term="Case category" value={review.category} />
        <IdentityFact
          term="Case type"
          value={review.type}
          className="lg:col-span-2"
        />
        <IdentityFact term="Court" value={review.court} />
        <IdentityFact
          term="Submitted on"
          value={review.submittedOnLabel}
          numeric
        />
      </DescriptionList>
    </header>
  );
}

/** One particular of the complaint. Label above value, not beside it. */
function IdentityFact({
  term,
  value,
  numeric = false,
  className,
}: {
  term: string;
  value: string;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <DescriptionRow
      className={cn("grid-cols-1 gap-1 border-b-0 py-0", className)}
    >
      <DescriptionTerm className="text-caption font-medium text-muted-foreground">
        {term}
      </DescriptionTerm>
      <DescriptionDetails
        className={cn(
          "min-w-0 wrap-break-word text-body-compact font-medium",
          numeric && "tabular-nums",
        )}
      >
        {value}
      </DescriptionDetails>
    </DescriptionRow>
  );
}

/**
 * The file's table of contents, and the one thing on this screen that does not move.
 *
 * Every entry is a real control: a jump that also opens the section it lands in, with
 * the section being read carried by `aria-current` as well as a fill, so the position
 * is not colour alone. Rows are `min-h-10` because a 40px target is the DS floor and
 * `py-2` on compact text does not reach it on its own.
 */
function CaseFileIndex({
  sections,
  reading,
  onJump,
  className,
}: {
  sections: CaseSection[];
  reading: string | undefined;
  onJump: (sectionId: string) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Sections of this complaint"
      className={cn(PANEL, "flex flex-col gap-3", STICKY, className)}
    >
      <p className="text-caption font-semibold text-muted-foreground">
        In this complaint
      </p>
      <ol className="flex flex-col gap-1">
        {sections.map((section, index) => {
          const current = reading === section.id;
          return (
            <li key={section.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onJump(section.id)}
                aria-current={current ? "true" : undefined}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-compact transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  current
                    ? "bg-accent-strong font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="tabular-nums">{index + 1}.</span>
                <span className="min-w-0">{section.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * How far the complaint has got.
 *
 * Oldest first — the same direction the case history on a listing's overview runs, so
 * the two columns on the same side of the app agree about which end is the present.
 * The reference puts the newest at the top; one ordering for one kind of column is
 * worth more than matching that. What the steps *are* lives with the file
 * (`timelineFor` in `case-review.ts`): a dummy registry history that follows the
 * Kerala spine as far as this queue, and stops before the decision this screen does
 * not make.
 */
function CaseProgressPanel({
  steps,
  className,
}: {
  steps: CaseReview["timeline"];
  className?: string;
}) {
  return (
    <section
      className={cn(PANEL, "flex flex-col gap-4", STICKY, className)}
      aria-labelledby="case-progress"
    >
      <h2 id="case-progress" className="text-body font-semibold">
        Case timeline
      </h2>
      <Timeline>
        {steps.map((step) => (
          <TimelineItem
            key={step.on ? `${step.on}-${step.label}` : step.label}
            status={step.status}
            title={step.label}
            description={step.detail}
          />
        ))}
      </Timeline>
    </section>
  );
}

/**
 * One numbered part of the file: a heading that folds it away, and the blocks inside.
 *
 * The heading sits on the page rather than in a panel of its own — it is the section's
 * name, and giving it a sheet would put a frame around a line of text and then a second
 * frame around each block inside it. The `AccordionItem` border goes for the same
 * reason: sections are separated by the page's own step, and a rule between two
 * disclosures that are already a full step apart is a stroke doing nothing.
 */
function CaseSectionBlock({
  section,
  number,
}: {
  section: CaseSection;
  number: number;
}) {
  return (
    <AccordionItem
      value={section.id}
      id={anchorFor(section.id)}
      /* `not-last:border-b-0`, not `border-b-0`. The DS `AccordionItem` ships
         `not-last:border-b`, and tailwind-merge treats a variant-prefixed utility as a
         different group from a bare one — so the unprefixed reset never displaced it
         and every section but the last drew a full-strength rule hard against its own
         last panel, with no padding between. Matching the variant is what removes it.
         Sections are separated by the accordion's own `gap-8`: spacing before
         strokes (`ui-craft` §1.1). */
      className="flex min-w-0 scroll-mt-(--chrome-sticky-top) flex-col gap-4 not-last:border-b-0"
    >
      <AccordionTrigger className="items-center py-0 font-semibold text-title-s hover:no-underline">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="tabular-nums text-muted-foreground">{number}.</span>
          <span className="min-w-0">{section.title}</span>
        </span>
      </AccordionTrigger>
      {/* `h-auto` cancels the primitive's own `h-(--radix-accordion-content-height)`.
          Radix measures that variable when the item opens and does not remeasure it on
          resize, and the content here is a column of panels that reflows at every
          breakpoint — so a window narrowed after opening left the last panel cut off by
          the wrapper's `overflow-hidden`. The open/close animation is on the wrapper and
          still runs. Upstream DS feedback: the fixed height is safe for a paragraph of
          FAQ copy and wrong for anything that reflows. */}
      <AccordionContent className="flex h-auto min-w-0 flex-col gap-6 pb-0">
        {section.groups.map((group) => (
          <CaseGroupPanel key={group.id} group={group} />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * One block of the file — the cheque, the notice, who appears.
 *
 * The panel is the frame, so what is inside it is fill and spacing: repeated records
 * are sunken wells, a group's own facts sit straight on the sheet, and nothing draws a
 * second edge. The mark beside the title is a well too, and muted: twelve tinted tiles
 * down a page would spend the view's one saturated colour a dozen times over, and the
 * icon is here to make a long file scannable rather than to say anything.
 */
function CaseGroupPanel({ group }: { group: CaseGroup }) {
  const Icon = group.icon;
  const headingId = `case-group-${group.id}`;

  return (
    <section className={`${PANEL} flex flex-col gap-4`} aria-labelledby={headingId}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <h3 id={headingId} className="min-w-0 text-body font-semibold">
          {group.title}
        </h3>
      </div>

      {group.empty ? (
        /* Not a bordered grey void: the panel is already the frame, and the sentence
           is the whole content. A head the form asked about and nobody answered is a
           fact the court is reading. */
        <p className="text-body text-muted-foreground">{group.empty}</p>
      ) : null}

      {group.records?.map((record, index) => (
        <CaseFactWell
          key={record.id}
          heading={record.heading}
          tag={record.tag}
          /* "1." above a lone complainant counts nothing, so the ordinal appears only
             where there is more than one of something. */
          ordinal={(group.records?.length ?? 0) > 1 ? index + 1 : undefined}
          facts={record.facts}
          confirmed={record.confirmed}
          documents={record.documents}
        />
      ))}

      {/* A group's own facts go in the same well as a named record's. They used to sit
          bare on the sheet, which meant half the file had a sunken block inside its
          panel and half did not — Complainant, Accused, Cheque, Witness and Advocate
          against Debt, Notice, Delay, Payment and Submissions. The split tracked
          whether the data happened to be modelled as `records` or as `facts`, which is
          invisible to a reader and meant nothing to them. */}
      {group.facts || group.confirmed || group.documents ? (
        <CaseFactWell
          facts={group.facts}
          confirmed={group.confirmed}
          documents={group.documents}
        />
      ) : null}
    </section>
  );
}

/**
 * A block of the file's content, in the one container every block uses.
 *
 * A well, because the fill is what separates a group's parts: several records inside
 * one panel, or one set of facts and the documents backing them. Nothing in here
 * carries a border — depth is fill (`ui-craft` §4), and the panel around it is already
 * the frame.
 *
 * The heading is optional. A named record has one — a party, a cheque, an advocate —
 * and a group's own facts do not, because the panel's title has already named them.
 * That is the only difference between the two callers; before this they were two
 * different treatments, and a reader could not tell why.
 */
function CaseFactWell({
  heading,
  tag,
  ordinal,
  facts,
  confirmed,
  documents,
}: {
  heading?: string;
  tag?: string;
  ordinal?: number;
  facts?: CaseFact[];
  confirmed?: string[];
  documents?: CaseDocument[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-surface-sunken p-4">
      {heading ? (
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 text-body font-medium">
            {ordinal ? (
              <span className="tabular-nums text-muted-foreground">
                {ordinal}.{" "}
              </span>
            ) : null}
            {heading}
          </p>
          {tag ? (
            <span className="text-caption text-muted-foreground">{tag}</span>
          ) : null}
        </div>
      ) : null}
      {facts ? <CaseFactRows facts={facts} /> : null}
      {confirmed ? <CaseConfirmations items={confirmed} /> : null}
      {documents ? <CaseDocuments documents={documents} inset /> : null}
    </div>
  );
}

/**
 * The row metric, tuned from the screen rather than by editing the synced primitive.
 *
 * Two changes to the DS default. The term column widens and then disappears: a §138
 * file asks things like "date the fifteen days from service were complete", which no
 * 10rem column holds, so terms sit above their values below `sm` and beside them from
 * `sm` up at a width that fits a clause. And the stroke drops to hairline — fifteen
 * rows at full strength would be the darkest marks on the page, and an internal
 * divider inside a panel that already has an edge is not what full strength is for.
 */
const FACT_ROW =
  "grid-cols-1 gap-1 border-hairline py-3 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:gap-4";

function CaseFactRows({ facts }: { facts: CaseFact[] }) {
  return (
    <DescriptionList>
      {facts.map((fact) => (
        <DescriptionRow key={fact.term} className={FACT_ROW}>
          <DescriptionTerm className="text-body-compact">
            {fact.term}
          </DescriptionTerm>
          {/* An empty slot is said, not left blank. The form asked the question and
              the filer answered nothing; a blank cell reads as a broken row, and this
              screen exists to show what is and is not on the file. */}
          <DescriptionDetails
            className={cn(
              "min-w-0 wrap-break-word text-body",
              fact.value ? "font-medium" : "text-muted-foreground",
              fact.numeric && "tabular-nums",
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
 * A page, at thumbnail size, in the DS's document-facsimile tokens.
 *
 * Drawn as one inline SVG rather than a stack of divs: at 80×107 the marks are two
 * pixels tall, and a `viewBox` gets them there without reaching for off-ladder heights
 * or arbitrary lengths. `size-full` is also what keeps the media's
 * `[&_svg:not([class*='size-'])]:size-4` rule from shrinking it to an icon.
 *
 * Six shapes, because a §138 file holds six kinds of page and a clerk tells them apart
 * without reading. Marks are `paper-muted` for body and `paper-muted-foreground` for
 * the parts of a page that are darker in fact — a heading, a signature, an amount box.
 * Nothing here is legible, and nothing here is a specific document.
 */
function PageFacsimile({ kind }: { kind: CaseDocumentKind }) {
  return (
    <svg
      viewBox="0 0 60 80"
      className="size-full"
      role="presentation"
      aria-hidden
    >
      {kind === "letter" ? <LetterMarks /> : null}
      {kind === "cheque" ? <ChequeMarks /> : null}
      {kind === "memo" ? <MemoMarks /> : null}
      {kind === "receipt" ? <ReceiptMarks /> : null}
      {kind === "id" ? <IdMarks /> : null}
      {kind === "form" ? <FormMarks /> : null}
    </svg>
  );
}

/** Body text, as a run of lines with a short last one. */
function TextLines({
  top,
  count,
  x = 10,
  width = 40,
}: {
  top: number;
  count: number;
  x?: number;
  width?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          x={x}
          y={top + index * 4}
          width={index === count - 1 ? width * 0.6 : width}
          height="1.5"
          className="fill-paper-muted"
        />
      ))}
    </>
  );
}

/** A typed page — the complaint, a notice, an affidavit, an application. */
function LetterMarks() {
  return (
    <>
      <rect x="18" y="8" width="24" height="2.5" className="fill-paper-muted-foreground" />
      <TextLines top={16} count={9} />
      {/* The signature block a filed page ends with. */}
      <rect x="34" y="66" width="16" height="2" className="fill-paper-muted-foreground" />
      <rect x="34" y="71" width="10" height="1.5" className="fill-paper-muted" />
    </>
  );
}

/** The cheque itself: a landscape slip on a portrait scan, with its MICR band. */
function ChequeMarks() {
  return (
    <>
      <rect
        x="5"
        y="26"
        width="50"
        height="28"
        className="fill-paper-muted"
        rx="1"
      />
      {/* Payee line, then the amount box on the right, then the code band. */}
      <rect x="9" y="33" width="24" height="1.5" className="fill-paper-muted-foreground" />
      <rect x="38" y="31" width="13" height="6" className="fill-paper-muted-foreground" rx="0.5" />
      <rect x="9" y="40" width="18" height="1.5" className="fill-paper-muted-foreground" />
      <rect x="34" y="44" width="17" height="2" className="fill-paper-muted-foreground" />
      <rect x="9" y="49" width="42" height="2" className="fill-paper-muted-foreground" />
    </>
  );
}

/** A bank slip — a return memo, a deposit counterfoil. Short, and stamped. */
function MemoMarks() {
  return (
    <>
      <rect x="10" y="10" width="40" height="24" className="fill-paper-muted" rx="1" />
      <rect x="14" y="14" width="20" height="2" className="fill-paper-muted-foreground" />
      <TextLines top={20} count={2} x={14} width={32} />
      {/* The stamp a bank puts on a returned instrument. */}
      <rect
        x="30"
        y="40"
        width="20"
        height="12"
        className="fill-paper-muted-foreground"
        rx="1"
      />
    </>
  );
}

/** A receipt or a ledger extract: label-and-amount rows, then a total under a rule. */
function ReceiptMarks() {
  return (
    <>
      <rect x="16" y="9" width="28" height="2.5" className="fill-paper-muted-foreground" />
      {Array.from({ length: 5 }, (_, index) => (
        <g key={index}>
          <rect x="10" y={20 + index * 7} width="22" height="1.5" className="fill-paper-muted" />
          <rect x="40" y={20 + index * 7} width="10" height="1.5" className="fill-paper-muted" />
        </g>
      ))}
      <rect x="10" y="58" width="40" height="1" className="fill-paper-muted-foreground" />
      <rect x="36" y="63" width="14" height="2.5" className="fill-paper-muted-foreground" />
    </>
  );
}

/** A card scan — an ID proof, a bar card. Photo left, particulars right. */
function IdMarks() {
  return (
    <>
      <rect x="6" y="22" width="48" height="32" className="fill-paper-muted" rx="2" />
      <rect x="11" y="28" width="14" height="18" className="fill-paper-muted-foreground" rx="1" />
      <TextLines top={29} count={3} x={29} width={20} />
    </>
  );
}

/** A court form with a ruled table — a vakalatnama, a registration paper. */
function FormMarks() {
  return (
    <>
      <rect x="14" y="8" width="32" height="2.5" className="fill-paper-muted-foreground" />
      <rect x="10" y="16" width="40" height="1.5" className="fill-paper-muted" />
      {/* The ruled grid a court form is mostly made of. */}
      <rect x="10" y="24" width="40" height="24" className="fill-paper-muted" rx="0.5" />
      <rect x="10" y="32" width="40" height="0.8" className="fill-paper-muted-foreground" />
      <rect x="10" y="40" width="40" height="0.8" className="fill-paper-muted-foreground" />
      <rect x="24" y="24" width="0.8" height="24" className="fill-paper-muted-foreground" />
      <rect x="30" y="66" width="20" height="2" className="fill-paper-muted-foreground" />
    </>
  );
}

/**
 * What the filer has sworn to.
 *
 * Tinted, because these are the two facts a §138 complaint turns on and the court
 * checks them against the dates a few rows up — machine-read data that carries legal
 * risk, which is what a tint is for. The variant carries its own text colour; grey on
 * a tinted fill is the thing it exists to prevent.
 */
function CaseConfirmations({ items }: { items: string[] }) {
  return (
    <Alert variant="info">
      <InfoIcon aria-hidden />
      <AlertTitle className="text-body-compact font-medium">
        The complainant has confirmed
      </AlertTitle>
      <AlertDescription className="text-body-compact">
        <ul className="flex list-disc flex-col gap-1 pl-4">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * The documents filed under one head, and the slots left empty.
 *
 * A wrapping grid rather than the primitive's own scrolling strip: a document a clerk
 * has to reach by dragging a horizontal scrollbar is a document they will miss.
 *
 * None of these opens. There is no document store behind the court side, so a tile
 * that looked clickable would promise a viewer that is not there; the tile states what
 * the file holds and stops.
 */
function CaseDocuments({
  documents,
  inset = false,
}: {
  documents: CaseDocument[];
  inset?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-caption font-medium text-muted-foreground">Documents</p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <CaseDocumentTile
            key={document.label}
            document={document}
            inset={inset}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One document, as the registry holds it: a thumbnail of the page, what the court
 * calls it, and the upload underneath.
 *
 * The reference shows page previews rather than file icons, and it is right to — a
 * clerk checking a §138 file recognises a cheque from a demand notice at a glance, and
 * an identical icon on twelve rows throws that away. There is no document store to
 * preview from, so the thumbnail is drawn: `bg-paper` with `paper-muted` marks standing
 * in for the page, in the DS's own facsimile tokens (`paper` exists for exactly this —
 * "a printed complaint is a convention the reader recognises").
 *
 * It is deliberately *not legible*. A thumbnail says "a page of this kind is on the
 * file"; putting readable text in it would be fabricating a court record, which is the
 * one thing a demo of a case file must not do.
 *
 * An empty slot gets no paper at all — the sunken media and a muted icon, because
 * there is no page. Dressing an absence as a blank sheet is how "not uploaded" starts
 * looking like "uploaded and blank".
 */
function CaseDocumentTile({
  document,
  inset,
}: {
  document: CaseDocument;
  inset: boolean;
}) {
  const filed = document.state === "filed";

  return (
    <Attachment
      /* `size="default"` and not `sm`: the media's width is overridden below, and the
         `sm` variant sets it through a `group-data-` selector, which outranks a plain
         utility no matter what `cn` merges. */
      state={filed ? "done" : "idle"}
      className={cn("w-full items-start", inset ? "rounded-md" : "rounded-lg")}
    >
      <AttachmentMedia
        className={cn(
          "aspect-[3/4] w-20",
          filed && "border-paper-border bg-paper",
        )}
      >
        {filed ? (
          <PageFacsimile kind={document.kind} />
        ) : (
          <FileTextIcon className="text-muted-foreground" aria-hidden />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        {/* `text-clip` is what actually displaces the primitive's `truncate` — adding
            `whitespace-normal` alone leaves both rules standing and which one wins is
            down to stylesheet order. The court's name for a document is the one label
            here that must not be cut. */}
        <AttachmentTitle className="text-clip whitespace-normal text-body-compact">
          {document.label}
        </AttachmentTitle>
        {document.file ? (
          <>
            <AttachmentDescription className="font-mono">
              {document.file.name}
            </AttachmentDescription>
            <AttachmentDescription className="tabular-nums">
              {document.file.pages === 1
                ? "1 page"
                : `${document.file.pages} pages`}
              {" · "}
              {document.file.size}
            </AttachmentDescription>
          </>
        ) : (
          <AttachmentDescription>Not uploaded</AttachmentDescription>
        )}
      </AttachmentContent>
    </Attachment>
  );
}

/**
 * The two decisions this file is waiting for.
 *
 * Admitting a complaint is taking cognizance under BNSS §210; dismissing one ends it.
 * Both are judicial acts, and `lib/employee/register-cases.ts` records the standing
 * position that this build performs no registration act — which is also why the queue
 * behind this screen carries no row actions. What the reference does have is this band,
 * and a file with nothing at the foot of it would not be the same screen: the decision
 * is the reason a clerk opened the complaint.
 *
 * The band is real and the controls are honest. The owner cut the helper line that
 * used to say the decision is not connected — the dimming and `aria-disabled` carry
 * that, and a tooltip would hide the same fact behind hover (ACCESSIBILITY §7).
 *
 * `aria-disabled` rather than `disabled`, following the distinction the cause list
 * already draws: a live precondition takes `disabled`, an unbuilt promise stays
 * focusable so a reader who tabs into the band meets the control and its state. The DS
 * hangs its dimming off `:disabled`, which these do not set, so the three
 * `aria-disabled:` utilities restore the disabled look and cancel the hover and the
 * press — a teal button that lit up and went down under the finger while doing nothing
 * is worse than one that looks dead. Deliberately not `pointer-events-none`.
 *
 * One teal, spent on Admit. Dismiss is ghost — the reference paints it as quiet text
 * too, and a second filled button would be two primaries in one band.
 */
function CaseDecisionBand() {
  return (
    <footer className="sticky bottom-0 z-30 mt-8 border-t border-hairline bg-card px-6 py-3 md:px-8 md:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          aria-disabled
          className="w-full sm:w-fit aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:active:translate-y-0"
        >
          Dismiss case
        </Button>
        <Button
          type="button"
          aria-disabled
          className="w-full sm:w-fit aria-disabled:opacity-50 aria-disabled:hover:bg-primary aria-disabled:active:translate-y-0"
        >
          Admit case
        </Button>
      </div>
    </footer>
  );
}
