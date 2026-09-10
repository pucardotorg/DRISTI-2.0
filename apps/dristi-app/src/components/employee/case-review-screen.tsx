"use client";

import * as React from "react";
import Link from "next/link";
import { FileQuestionIcon, FileTextIcon } from "lucide-react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
import { DocumentPreview } from "@/components/cases/document-preview";
import { useCourtToday } from "@/components/employee/use-court-today";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentSlot } from "@/components/ui/document-slot";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { ThumbnailButton } from "@/components/filing/upload/thumbnail";
import {
  CASE_REVIEW_STATUS,
  caseReviewFor,
  formatDaysWaitingLong,
  type CaseAbsence,
  type CaseDocument,
  type CaseDocumentKind,
  type CaseFact,
  type CaseGroup,
  type CaseReview,
  type CaseSection,
  type CaseTimelineDetail,
} from "@/lib/employee/case-review";
import { formatCaseDate } from "@/lib/employee/hearing-overview";
/* The wait as a value beside the term "Waiting" — which is the case the advocate
   register already exports this for, and the case the header's cell now is. Not a fourth
   `formatDaysWaiting`: a new function returning a different string under a name two
   sibling modules already use is how two screens start counting differently. */
import { formatWaitingDuration } from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

/**
 * One waiting complaint's file, read in full — the screen behind a cause title on
 * Register cases.
 *
 * Transcribed from the legacy Register Cases → View reference (screenshots, this
 * conversation): a reading index down the left, the complaint's numbered sections in
 * the middle, the case's progress on the right, and the two decisions pinned at the
 * foot. What the file *contains* is `lib/employee/case-review.ts`; this module is only
 * how it is read. **No term, label or fact string lives here** — every one of them is
 * an attribute the file names (`FACT_TERMS`), which is what keeps the screen from
 * quietly inventing a field.
 *
 * **The index is the thing that had to stay put.** On the reference it scrolls away
 * with the page, so by the second section — of four, across a file this long — the
 * clerk has no idea where they are and no way to jump. Here it is `sticky` at the
 * chrome's own resting offset and marks the section being read, which is the whole
 * point of a five-part file. Below `lg` there is no room for a rail, so the index
 * becomes the first panel on the page rather than disappearing: chrome that vanishes
 * is the structural regression `ui-craft` §0 names, and a table of contents is still
 * useful when it is not beside the text.
 *
 * **The sections do not fold** (brief §5a.2a, owner 2026-09-10). Every one of them was
 * open by default, the index already navigates, and the disclosure's own affordance was
 * invisible until somebody found it — so it hid what the clerk came to read and bought
 * nothing. Removing it removed three workarounds with it: the `not-last:border-b-0`
 * variant reset, the `h-auto` cancellation of Radix's non-remeasured content height, and
 * the `flushSync` that had to commit an unfold before a scroll could reach it. What did
 * *not* change is the index's claim / observer / end-of-scroll reasoning below: that is
 * about where the reader is, not about what is folded.
 *
 * **The page is layered, not framed** (owner, 2026-09-11). The reading canvas carries
 * `bg-muted` in light mode with `dark:bg-background`, which is `FilingMain`'s recipe
 * verbatim (`components/filing/filing-shell.tsx`) — including the dark fallback, where
 * `muted` is the *raised* step and tinting the canvas would put the page above its own
 * panels. The panels are the only white, the bar above and the decision band below stay
 * `bg-card`, and nothing inside a panel is sunken except a document row and the icon
 * tile: canvas → panel → record separated by a hairline is three readable tiers, and
 * canvas → panel → well → record would have been four on a page that is read rather than
 * filled. `ui-craft` §1.0 reserves the tinted canvas for pages that are *filled*; the
 * owner has overruled that for this screen and it is logged in the brief.
 *
 * **It reads; it does not decide.** Registering a complaint is taking cognizance, and
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
 * How far down the viewport the reading line sits, past the chrome.
 *
 * A section used to stay current until its *heading* scrolled under the sticky bar, which
 * put the switch at the very top of the screen: the reader was two-thirds of the way
 * through a section before the index agreed they had started it, and the owner read that
 * as the index firing early. A reading line about a third of the way down is where a
 * reader's eye actually is, so the current entry becomes the **last** section whose
 * heading has crossed above it. Measured on the render at 900 and 1200 tall: 0.35 puts
 * the line at 403px and 508px, which in both cases is the first third of the text
 * column rather than its top edge.
 */
const READING_LINE = 0.35;

/**
 * That line, in pixels from the top of the viewport.
 *
 * The chrome's own resting offset is read off the section rather than restated as a
 * number here: the section carries `scroll-mt-(--chrome-sticky-top)`, so its computed
 * scroll margin *is* where a jump comes to rest, and a hard-coded value disagreeing with
 * it by eight pixels is what once put a jumped-to heading just above the deciding band.
 */
function readingLine(heading: HTMLElement): number {
  const rest = Number.parseFloat(getComputedStyle(heading).scrollMarginTop);
  const top = Number.isFinite(rest) && rest > 0 ? rest : 96;
  return top + READING_LINE * window.innerHeight;
}

function anchorFor(sectionId: string): string {
  return `case-section-${sectionId}`;
}

function scrollToSection(sectionId: string) {
  document.getElementById(anchorFor(sectionId))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function CaseReviewPage({ review }: { review: CaseReview }) {
  const { reading, claim } = useReadingSection(review.sections.map((s) => s.id));

  /* Following the link is two things now: the index says where the reader is going
     before the scroll has taken them there, and the page moves. It used to be three —
     the third was unfolding a section that had been folded away, which is what needed
     `flushSync` and what left the last section landing short of the reading line. With
     nothing folded, a jump is a jump. */
  function jumpTo(sectionId: string) {
    claim(sectionId);
    scrollToSection(sectionId);
  }

  return (
    /* The reading canvas. `bg-muted` in light with `dark:bg-background` is
       `FilingMain`'s recipe verbatim, dark fallback included — see the module note. The
       decision band below is a sibling and stays `bg-card`, so the tint reads as the
       page being read and not as grey chrome. */
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted dark:bg-background">
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 pb-0 md:p-8 md:pb-0">
        <CaseReviewHeader review={review} />

        {/* Three columns at `lg`: the index, the file, the progress — 13rem / free /
            15rem. The rails were 15 and 17, which at 1280 left the document the screen
            exists to read (368px) narrower than the two rails around it (512px); the
            file now takes 432px at 1280 and 592px at 1440. Below `lg` they stack in
            this order — index, progress, file — because both rails are short and the
            file is not. */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,15rem)] lg:gap-8">
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
          <div className="flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-1">
            {review.sections.map((section, index) => (
              <CaseSectionBlock
                key={section.id}
                section={section}
                number={index + 1}
              />
            ))}
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
 * Which section the reader is in — the one they just asked for, or failing that the one
 * their scroll position says they are reading.
 *
 * Three things decide it, in that order, and the order is the whole point.
 *
 * A click on the index *claims* it: the reader has said where they are going, so the
 * index says so at once and keeps saying so until they scroll somewhere themselves. The
 * claim is not decoration over a working measurement — it is the only thing that can be
 * right at the foot of the file, where asking for one of the short last sections scrolls
 * the page as far as it will go and still leaves the reading line *above* that heading.
 * No line, however placed, can read that position as anything but the earlier section;
 * the reader's own request can.
 *
 * Under the claim, the position itself: **the last section whose heading has crossed
 * above the reading line** (`readingLine`). Measured from the headings' own rects rather
 * than inferred from an `IntersectionObserver`, which is what this did until 2026-09-11.
 * An observer answers "is this box inside that band", and the question here is "is this
 * heading above an arbitrary line" — expressible as a band only when the line is the top
 * of the viewport, which is exactly the rule the owner asked to change. Reading ≤ a dozen
 * rects inside one `requestAnimationFrame` is a frame's work at most, and it is measured
 * at most once per frame however fast the wheel turns.
 *
 * Under both, the end of the scroll — the one position no line can describe, because the
 * last sections are short enough that the page runs out of scroll before their headings
 * can reach any line. Once there is no scroll left the reader has reached the end of the
 * file, so the answer becomes the last section *on screen* rather than the last one above
 * the line. This replaces the foot sentinel the observer needed: the position is already
 * being read every frame, so asking whether it is the bottom costs nothing extra.
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
    /* Id and node together, so a section the DOM has not mounted cannot shift the rest
       of the list out of step with its own ids. */
    const sections = key
      .split("|")
      .map((id) => [id, document.getElementById(anchorFor(id))] as const)
      .filter((pair): pair is [string, HTMLElement] => pair[1] !== null);
    if (sections.length === 0) return;

    let frame = 0;

    function decide() {
      frame = 0;
      const line = readingLine(sections[0][1]);
      /* The page has run out of scroll, which changes which section on screen is the
         answer — see the end-of-scroll paragraph above. */
      const ended =
        Math.ceil(window.scrollY + window.innerHeight) >=
        document.documentElement.scrollHeight - 2;
      const limit = ended ? window.innerHeight : line;

      /* The *last* heading past the limit. Sections are in reading order, so the loop
         simply keeps the latest one that qualifies; nothing qualifying means the reader
         is above the first heading, which is the first section. */
      let winner = sections[0][0];
      for (const [id, node] of sections) {
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

    /* The reader moving the page themselves gives the index back to the measurement.
       Only their own gestures count: the jump is a scroll too, and releasing on any
       scroll at all is what let every section a smooth jump passed through flash active
       on the way. */
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

/**
 * Which complaint this is: its number, the cause as the page, its one state, and the
 * three facts about the file itself.
 *
 * The reference keeps all of this inside the reading column. Here it runs the page's
 * full width as **one** lifted sheet: the court side already gives up a rail to its own
 * chrome, and a page title squeezed into a middle track is narrower than the thing it
 * names. The rails begin where the file begins.
 *
 * **The eyebrow is gone** (owner, 2026-09-11). Four unrelated things strung across one
 * caption line with `·` between them is a row that reads as one string and sorts as
 * none, and it put the record's identity at the same weight as how long it had waited.
 * So the number goes on a line of its own above the title — it is what identifies the
 * record, and it is the crumb in the bar directly above it — and the three real facts
 * become label-over-value cells beneath. No separators anywhere: a `·` that lands first
 * on a wrapped line reads as a bullet, and cells do not need one.
 *
 * **The labels here are the page's context, not the file's attributes.** Court, Submitted
 * and Waiting say where this complaint sits and how long it has sat; none of them is a
 * row of the complaint, which is why they are not in `FACT_TERMS` and why the rule that
 * keeps term strings out of this module (`case-review.test.ts`) does not reach them. A
 * fourth cell that *was* a fact about the complaint would belong in the file.
 *
 * **There is no fact grid of case category and case type** (brief §5a.4b, owner
 * 2026-09-10). Both are the same on every complaint DRISTI will ever hold —
 * `FilingDraft.caseType` is a one-value union — so they are the constant-column defect
 * already killed on the queues.
 *
 * The wait is not coloured. On the queue an amber wait is a comparison — this row against
 * the rows above it — and there is nothing here to compare against: one file, one wait
 * (`ui-craft` §1.4). The one coloured mark this page spends is on the deposit row, and
 * only on the file where it says no.
 */
function CaseReviewHeader({ review }: { review: CaseReview }) {
  return (
    <header
      className={`${PANEL} flex flex-col gap-4`}
      aria-labelledby="case-review-title"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-caption font-medium tabular-nums text-muted-foreground">
          {review.caseNumber}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1
            id="case-review-title"
            className="text-balance font-semibold text-title sm:text-title-l"
          >
            {review.title}
          </h1>
          <Badge variant="secondary">{CASE_REVIEW_STATUS}</Badge>
        </div>
      </div>

      {/* Three across from `sm`, stacked below it — the DS's own "single column by
          default, multi-column only when there is room" rule (`RESPONSIVE.md`). The
          hairline is the only stroke: the cells are separated by the grid, not by rules
          between them. */}
      <dl className="grid gap-4 border-t border-hairline pt-4 sm:grid-cols-3">
        <CaseHeaderCell term="Court" value={review.court} />
        <CaseHeaderCell term="Submitted" value={review.submittedOnLabel} numeric />
        <CaseHeaderCell
          term="Waiting"
          value={formatWaitingDuration(review.daysSinceSubmitted)}
          numeric
        />
      </dl>
    </header>
  );
}

/**
 * One label-over-value cell.
 *
 * Label above rather than beside: three of these across a wide sheet with the terms in a
 * column of their own would be a `DescriptionList`, and a description list of three rows
 * that never grows is a grid drawn around nothing. `text-caption` term over
 * `text-body-compact` value is the same pair the file's own rows use, one size apart, so
 * the header does not introduce a sixth type role for three strings.
 *
 * `<div>` between `<dl>` and `<dt>` is the HTML5 grouping form, which is what lets each
 * pair be a grid cell without breaking the list semantics.
 */
function CaseHeaderCell({
  term,
  value,
  numeric,
}: {
  term: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-caption font-medium text-muted-foreground">{term}</dt>
      <dd
        className={cn(
          "min-w-0 wrap-break-word text-body-compact",
          numeric && "tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The file's table of contents, and the one thing on this screen that does not move.
 *
 * Every entry is a real control: a jump to a section, with the section being read
 * carried by `aria-current` as well as a fill, so the position is not colour alone.
 * Rows are `min-h-10` because a 40px target is the DS floor and `py-2` on compact text
 * does not reach it on its own — and because at 13rem the longer entries take two
 * lines, which those rows already allow.
 *
 * **The number sits on the first line of its label, not in the middle of both**
 * (owner, 2026-09-11). Centring was invisible on the one-line entries and wrong on the
 * two-line one — "2. Case specific details" wraps at 13rem, and a centred "2." floated
 * between its own two lines with nothing to align to. `items-start` puts it where a
 * numbered list puts it; both spans share a line box, so the digit and the first word
 * sit on one baseline.
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
                  "flex min-h-10 w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-body-compact transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
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
 * (`timelineFor` in `case-review.ts`), where each one names the field or the spine step
 * it comes from — the two the owner cut on 2026-09-10 could name neither.
 *
 * The second line of a step is three different kinds of thing, so it is rendered by
 * three branches rather than handed over as one pre-formatted string. That is what lets
 * a day be a `<time>` a machine can read and the wait be counted rather than quoted; a
 * single `detail: string` could be neither, and put the formatting in the module
 * furthest from the render.
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
            key={step.label}
            status={step.status}
            title={step.label}
            description={<CaseTimelineDetailText detail={step.detail} />}
          />
        ))}
      </Timeline>
    </section>
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

/**
 * One numbered part of the file: a heading, and the group panels under it.
 *
 * A plain region. The heading sits on the page rather than in a panel of its own — it
 * is the section's name, and giving it a sheet would put a frame around a line of text
 * and then a second frame around each block inside it. Nothing separates the sections
 * but the page's own step: heading to groups is 4, group to group is 6, section to
 * section is 8, so the rhythm states the nesting and no rule is needed anywhere
 * (`ui-craft` §1.1).
 *
 * The id and the scroll margin stay on the region, because that is what the reading
 * index jumps to and what its reading line is measured against.
 *
 * **The heading drops to `text-body` 600 from the 20px step** (owner, 2026-09-11). Every other
 * section heading on the court side — seventeen screens of them — is `text-body`
 * `font-semibold`; this was the only one at 20px, and a heading that is bigger here than
 * the same heading everywhere else is not a hierarchy, it is a screen that disagrees with
 * its siblings. What separates it from the group headings below it, which are also
 * `text-body` 600, is not type at all: a section heading sits on the tinted canvas with
 * its ordinal, and a group heading sits inside a white panel with an icon tile beside it.
 * That is one signal each, which is what the level needed and what an extra 4px was
 * standing in for.
 */
function CaseSectionBlock({
  section,
  number,
}: {
  section: CaseSection;
  number: number;
}) {
  const headingId = `case-section-heading-${section.id}`;

  return (
    <section
      id={anchorFor(section.id)}
      aria-labelledby={headingId}
      className="flex min-w-0 scroll-mt-(--chrome-sticky-top) flex-col gap-4"
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
          <CaseGroupPanel key={group.id} group={group} />
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
 * They were sunken wells until 2026-09-11; with the canvas now tinted, a well inside a
 * panel on a tinted page would be a fourth tier on a screen that is read rather than
 * filled (owner's ruling, module note). A rule between records is the least that says
 * "another one of these" and costs no depth.
 *
 * The mark beside the title is still a well, and muted: twelve tinted tiles down a page
 * would spend the view's one saturated colour a dozen times over, and the icon is here to
 * make a long file scannable rather than to say anything.
 */
function CaseGroupPanel({ group }: { group: CaseGroup }) {
  const Icon = group.icon;
  const headingId = `case-group-${group.id}`;

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
      />
    )),
    ...(group.facts || group.documents
      ? [
          <CaseRecordBlock
            key="group-facts"
            facts={group.facts}
            documents={group.documents}
            within={group.title}
          />,
        ]
      : []),
  ];

  return (
    <section className={`${PANEL} flex flex-col gap-4`} aria-labelledby={headingId}>
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
              className={cn(
                "min-w-0",
                index > 0 && "border-t border-hairline pt-4",
              )}
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
 * voice and says what follows — that the complainant conducts the matter in person.
 * They are two lines because they are two kinds of thing (`ui-craft` §1.6): fusing the
 * second into the first is what made three authored strings out of one state.
 *
 * Two reasons since 2026-09-11, not three. `not-yet-due` belonged to the section on
 * submissions from the accused, which the owner cut — the accused cannot file before the
 * complaint is registered — and a label with no state left to name is one the next reader
 * cannot tell is dead.
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
 * this page stops at the panel (`ui-craft` §4 and the module note).
 *
 * **It is the query container for everything inside it.** The rows below switch from two
 * columns to stacked on the *block's* width, not the window's, because the window was
 * never the constraint — the reading column was. At 1280 this block is ≈384px inside a
 * 432px column and the rows are two-column; at 375 it is ≈279px and they stack, which is
 * the answer the old `sm:` rule gave for the wrong reason.
 *
 * The heading is optional. A named record has one — a party, a cheque, an advocate — and
 * a group's own facts do not, because the panel's title has already named them.
 */
function CaseRecordBlock({
  heading,
  tag,
  ordinal,
  facts,
  documents,
  within,
}: {
  heading?: string;
  tag?: string;
  ordinal?: number;
  facts?: CaseFact[];
  documents?: CaseDocument[];
  /** What the documents in this block belong to, for their accessible names. */
  within: string;
}) {
  return (
    <div className="@container flex min-w-0 flex-col gap-3">
      {heading ? (
        /* The tag sits **beside** the name, not at the far edge of the row (owner,
           2026-09-11). `justify-between` put "Company" a whole column away from the
           thing it describes, and the further apart they were the wider the panel got.
           It is a `Badge variant="secondary"` because it is a closed enum
           (`LITIGANT_TYPES`) — the DS's own shape for one — rather than the caption it
           used to be, which read as metadata about the row instead of a property of the
           party. */
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
        <CaseDocuments documents={documents} within={within} />
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
 * hairline: fifteen rows at full `border-border` would be the darkest marks on the
 * page, and an internal divider inside a panel that already has an edge is not what
 * full strength is for (`ui-craft` §1.1). And the two-column grid is applied at `@xs`
 * on the well rather than at `sm:` on the window, so a term that outgrows its track in
 * a narrow reading column stacks *there*, whatever the window is doing — which is what
 * makes the long-label and other-language cases survivable.
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
          {/* An empty slot is said, not left blank. The form asked the question and
              the filer answered nothing; a blank cell reads as a broken row, and this
              screen exists to show what is and is not on the file. */}
          <DescriptionDetails
            className={cn(
              "min-w-0 wrap-break-word text-body-compact",
              fact.value ? undefined : "text-muted-foreground",
              fact.numeric && "tabular-nums",
              /* The page's one coloured mark, and it appears on one complaint in
                 thirty-five. A cheque presented outside §138(a)'s three months is one no
                 complaint under the section can stand on, so the row that answers it is
                 the single fact on this file with a consequence for the decision at the
                 foot of it — and it sat in the same ink as a branch name. Which answer
                 is the exception is the file's to say (`CaseFact.exception`), not a
                 string comparison here. Ink, not a fill and not a chip: the word already
                 reads "No", so the colour is the second treatment and never the only one
                 (`ACCESSIBILITY.md` §3). Nothing else on the page is coloured, which is
                 what keeps this one worth seeing (`ui-craft` §1.4). */
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
 * One component showing an uploaded document everywhere was the point, and it replaces an
 * `Item variant="outline"` list borrowed from `submission-record-dialog.tsx` — a second
 * shape for the same thing, and the one place on the page where the document was
 * represented by nothing but its name.
 *
 * The thumbnail is the control, as it is on the upload screen: `ThumbnailButton` from
 * `filing/upload/thumbnail.tsx`, shared rather than copied — see that file for what was
 * split out and why. There is no room for eighteen inline previews in a 432px column, so
 * pressing it opens the one `DocumentPreview variant="quiet"` dialog below.
 *
 * A document that is *not* on file is deliberately **not** a `DocumentSlot`. The
 * primitive's empty state is an upload target — a dashed edge and a "Choose file" button
 * — and a clerk reading a complaint cannot upload a litigant's document; hiding that
 * button with CSS would leave it in the tab order and in the accessible tree. So the
 * absent row keeps the slot's geometry and none of its affordances: same media column,
 * same padding, no fill, no paper, nothing to press, reading "Not on file". An absence is
 * never dressed as a document.
 */
function CaseDocuments({
  documents,
  within,
}: {
  documents: CaseDocument[];
  within: string;
}) {
  /* Two pieces of state, and the second one is load-bearing. Radix restores focus to
     the row that opened the overlay from inside the content's own unmount, so the
     content has to survive the close: `open={reading !== null}` with the body rendered
     only while `reading` is set tears the element out of the tree in the same commit
     that closes the dialog, the restore never runs, and Escape drops focus on `body` —
     measured, not assumed. Keeping the last document mounted while `open` goes false
     hands the exit back to the primitive, and focus lands on the thumbnail again. */
  const [reading, setReading] = React.useState<CaseDocument | null>(null);
  const [open, setOpen] = React.useState(false);
  /* The thumbnail that opened the overlay, so closing it can put focus back there. */
  const trigger = React.useRef<HTMLButtonElement | null>(null);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-caption font-medium text-muted-foreground">Documents</p>
      <ul className="flex min-w-0 flex-col gap-2">
        {documents.map((document) => (
          <li key={document.label} className="min-w-0">
            <CaseDocumentItem
              document={document}
              within={within}
              onOpen={(button) => {
                trigger.current = button;
                setReading(document);
                setOpen(true);
              }}
            />
          </li>
        ))}
      </ul>
      {/* One overlay for the group rather than a trigger per row, keyed on the document
          so opening a second one starts fresh instead of inheriting the first one's
          scroll position. */}
      <Dialog open={open} onOpenChange={setOpen}>
        {reading ? (
          <CaseDocumentBody
            key={reading.label}
            document={reading}
            onReturnFocus={() => trigger.current?.focus()}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

/**
 * The media well, page-shaped rather than the DS square, and on paper.
 *
 * Page-shaped for the reason the upload row gives for the same override: a square crop of
 * a cheque or an ID card is noise, and `DocumentSlot` fixes its well at `size-16`. 44×56
 * is portrait like the facsimile's own 60×80 `viewBox`, close to the same optical area as
 * the upload row's 64×48 landscape, and — the constraint that set the width — the
 * thumbnail *is* the row's control, so it has to clear the 40×40 touch floor
 * (`ACCESSIBILITY.md` §8). 36 wide, which is what an exact 3:4 at this height would be,
 * does not.
 *
 * `paper` and `paper-border` rather than the well's default `muted`: what sits in it is a
 * drawing of a court document in the DS's document-facsimile tokens, and a page needs the
 * ground it is printed on. The hairline-weight edge is the DS's stated exception for
 * thumbnails (`foundations/elevation`) — a picture needs a boundary a fill cannot give
 * it.
 */
const DOCUMENT_MEDIA = [
  "[&_[data-slot=document-slot-media]]:h-14",
  "[&_[data-slot=document-slot-media]]:w-11",
  "[&_[data-slot=document-slot-media]]:border",
  "[&_[data-slot=document-slot-media]]:border-paper-border",
  "[&_[data-slot=document-slot-media]]:bg-paper",
].join(" ");

/** One document on the file, or one slot that was left empty. */
function CaseDocumentItem({
  document,
  within,
  onOpen,
}: {
  document: CaseDocument;
  within: string;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  if (document.state === "absent") {
    return (
      /* The `DocumentSlot` geometry without the primitive — see `CaseDocuments`. No
         fill either: the filed rows are sunken and this one is not, so a reader scanning
         the column sees which slots are full before reading a word. */
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
    );
  }

  return (
    <DocumentSlot
      status="filled"
      media="thumbnail"
      label={document.label}
      /* The second line the upload row spends on a filename and a size, which no
         court-side store holds (brief §5a.6). What it holds is whether the slot is
         full. */
      meta="Filed"
      className={DOCUMENT_MEDIA}
      thumbnail={
        <ThumbnailButton
          /* The head the document was filed under, in the name as well as beside it.
             Both parties file an "ID proof" and the file lists eighteen rows in all, so
             a reader tabbing the page or pulling up a list of controls met "View ID
             proof" twice with nothing to tell them apart. The visible label stays the
             document's own — the row sits under a heading that supplies the rest. */
          label={`View ${document.label} — ${within}`}
          onPreview={(event) => onOpen(event.currentTarget)}
        >
          <PageFacsimile kind={document.kind} />
        </ThumbnailButton>
      }
    />
  );
}

/**
 * The document itself, as far as a build with no document store can show one.
 *
 * `ChromeDialogContent` + `DocumentPreview variant="quiet" height="fill"` over a
 * `composed` source, which is exactly what `employee/register-advocates-dialog.tsx`
 * composes for the Bar ID card — no third way is introduced for this.
 *
 * What the well holds is a drawing, and the description says so. A facsimile states
 * that *a page of this kind* is on the file and is deliberately not legible, because
 * readable text here would be fabricating a court record. It is bounded and centred
 * rather than sized to the well: a drawing scaled to a full-screen dialog stops reading
 * as a thumbnail of a page and starts reading as a page.
 *
 * *Risk accepted (brief §11):* the quiet variant keeps its own "Full view" inside a
 * dialog that is already large. `register-advocates-dialog` ships the same duplication,
 * and matching the sibling beats a local exception. Download is not passed and
 * `resolveDownload` omits the button rather than shipping it dead — there is nothing to
 * download.
 */
function CaseDocumentBody({
  document,
  onReturnFocus,
}: {
  document: CaseDocument;
  onReturnFocus: () => void;
}) {
  return (
    <ChromeDialogContent
      className="flex max-h-[85dvh] flex-col gap-4 overflow-hidden sm:max-w-xl"
      /* Radix focuses the first tabbable thing it finds, and here that is the preview
         well — it is a scroll container, so it is focusable — which opened the overlay
         with a ring around the whole document. The dialog itself takes it instead: it
         is what a reader is here to read, WAI-ARIA APG allows a container when a dialog
         is this much content, and the well stays one Tab away for a keyboard reader who
         wants to scroll it. The same landing `register-advocates-dialog` chose, for the
         same reason. */
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.currentTarget as HTMLElement | null)?.focus();
      }}
      /* Focus goes back to the row that opened this, said out loud rather than left to
         the primitive: measured on the render, Escape dropped focus on `body`, which
         puts a keyboard reader back at the top of a file eighteen documents long. The
         same handler `register-advocates-dialog` writes, for the same reason. */
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      <DialogHeader className="shrink-0 pr-12">
        <DialogTitle className="font-semibold break-words text-title-s">
          {document.label}
        </DialogTitle>
        <DialogDescription className="text-body-compact">
          On the file. The page is drawn, not scanned — this build has no document
          store behind it.
        </DialogDescription>
      </DialogHeader>
      <DocumentPreview
        variant="quiet"
        /* `height="default"` and not `fill`, which is where this parts company with the
           brief — and the render is why. `fill` sizes the well against a definite
           container, so it needs the dialog pinned to a viewport height; at any such
           height a facsimile bounded to `w-64` (256×341, and bounded on purpose) leaves
           most of the well empty, and `DocumentPreview` composes its content at the top
           of the well with no way to centre it that does not mean editing the shared
           component. The standard well is 384px, which the page very nearly fills, and
           the dialog then sizes to its content. */
        height="default"
        className="min-h-0"
        title={document.label}
        source={{
          kind: "composed",
          content: (
            /* `w-56`, not the `w-64` the brief names: the well's own toolbar row sits
               above the page inside the same 384px well, and at 64 the foot of the page
               was cut off by the well's edge — measured on the render. 56 is the widest
               rung that fits the page whole. */
            <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-md border border-paper-border bg-paper">
              <PageFacsimile kind={document.kind} />
            </div>
          ),
        }}
      />
    </ChromeDialogContent>
  );
}

/**
 * A page, at thumbnail size, in the DS's document-facsimile tokens.
 *
 * Drawn as one inline SVG rather than a stack of divs: the marks are a couple of pixels
 * tall, and a `viewBox` gets them there without reaching for off-ladder heights or
 * arbitrary lengths.
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

/** A card scan — an ID proof, a Bar ID card. Photo left, particulars right. */
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
 * The two decisions this file is waiting for.
 *
 * **The word is "register"** (brief §5a.7, owner 2026-09-10). The rail row, the queue,
 * the brief and the timeline's last step all say register; "Admit" was a fourth verb for
 * the same act on the one screen that performs it, which is how two vocabularies start.
 * Registering a complaint is taking cognizance under BNSS §210; dismissing one ends it.
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
 * One teal, spent on Register. Dismiss is ghost — the reference paints it as quiet text
 * too, and a second filled button would be two primaries in one band.
 */
function CaseDecisionBand() {
  return (
    <footer className="sticky bottom-0 z-30 mt-8 border-t border-hairline bg-card px-6 py-3 md:px-8 md:py-4">
      {/* Stacked at 375 in the DS's own order — `DialogFooter` is
          `flex-col-reverse … sm:flex-row sm:justify-end`, so the decision that ends the
          row on a wide screen is the one at the top of the stack on a narrow one, and a
          court-side footer does not invent a second convention for the same shape.
          Register stays the last control in the DOM either way, which is what a
          keyboard reader meets last and what `sm:justify-end` puts on the right. */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
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
          Register case
        </Button>
      </div>
    </footer>
  );
}
