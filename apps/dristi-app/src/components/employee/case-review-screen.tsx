"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  CircleAlertIcon,
  FileSearchIcon,
  FileTextIcon,
  InfoIcon,
  ListChecksIcon,
} from "lucide-react";

import { CaseFileRegion } from "@/components/employee/case-file-screen";
import {
  CaseHeaderCell,
  CaseReviewMissing,
  CaseReviewShell,
  DOCUMENT_MEDIA,
  FILE_STICKY_TOP,
  FILE_STRIP,
  PANEL,
  PageFacsimile,
} from "@/components/employee/case-review-shared";
import { useCourtToday } from "@/components/employee/use-court-today";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { DocumentSlot } from "@/components/ui/document-slot";
import {
  CASE_CHECK_COUNT,
  CASE_SCRUTINY_TERMS,
  SCRUTINY_MODES,
  caseChecksFor,
  caseFileCounts,
  caseFileHref,
  caseReviewFor,
  scrutinyFor,
  type CaseCheck,
  type CaseCheckDocument,
  type CaseReview,
  type CaseScrutiny,
} from "@/lib/employee/case-review";
import { counselFor } from "@/lib/employee/hearings";
import { registerCaseById } from "@/lib/employee/register-cases";
import { formatWaitingDuration } from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

/**
 * One waiting complaint, at a glance — the screen behind a cause title on Register
 * cases, and the one a magistrate meets after scrutiny.
 *
 * **This screen does not let him check the file; it tells him what has already been
 * checked, and what could not be** (brief D13). The owner's framing is the whole design:
 * *"the people who do pull requests, they do all the work. The reviewer will just glance
 * through something. So this is that equivalent of the glancing experience that you need
 * to design for."* A reviewer does not re-run the contributor's work — they read a
 * title, trust the checks that have run, and look closely only where something snags.
 *
 * So there are three regions and two acts, in this order: **who and how much** (the
 * header), **how this complaint was checked** (the report), **the way in** (one control
 * to the full file), and the decision band. On twenty-six of the thirty-five complaints
 * in the queue the report is four cells and one line, with no findings, no colour and no
 * scrolling.
 *
 * **The full file is no longer a second page** (brief D25, owner 2026-09-11: *"there is
 * no way to go back to the report if you open the full file"*). It discloses **below the
 * report, on this route**, with its state in the URL as `?file=1` — pushed, so Back
 * closes it, a link still opens it, and a finding's deep link keeps working. What used
 * to be `/file` is `case-file-screen.tsx`'s `CaseFileRegion`, composed here.
 *
 * **Nothing here opens an overlay** (brief D20, made stricter by D25). With the file on
 * this page the membership rule is: on this screen an overlay is only ever the document
 * `Sheet`/`Drawer` below `xl`. The findings, the file, the register confirmation and the
 * send-back composer are all regions or stages of the page.
 *
 * The screen is a client component because the day is read from the reader's clock
 * rather than the server's — a complaint's whole date chain, and therefore every check
 * over it, is worked backwards from how long it has waited.
 */
export function CaseReviewScreen({ caseId }: { caseId: string }) {
  const today = useCourtToday();
  const review = caseReviewFor(caseId, today);
  const complaint = registerCaseById(caseId);

  if (!review || !complaint) return <CaseReviewMissing />;

  return (
    <CaseReviewPage
      caseId={caseId}
      review={review}
      checks={caseChecksFor(caseId, today) ?? []}
      scrutiny={scrutinyFor(caseId, today)}
      hasCounsel={counselFor(complaint, "complainant").length > 0}
    />
  );
}

function CaseReviewPage({
  caseId,
  review,
  checks,
  scrutiny,
  hasCounsel,
}: {
  caseId: string;
  review: CaseReview;
  checks: CaseCheck[];
  /** Absent when no scrutiny is recorded — the report says so (brief §10). */
  scrutiny: CaseScrutiny | undefined;
  hasCounsel: boolean;
}) {
  /* Destructured rather than held as one object: two of these are refs and two are
     values, and the React compiler reads a ref reached through a property as a ref read
     during render. */
  const { open, toggle, control, region } = useFileDisclosure();

  return (
    <CaseReviewShell review={review} hasCounsel={hasCounsel} gap="gap-6">
      <div
        className="flex min-w-0 flex-col gap-6"
        /* Published here rather than in the file, because the strip that makes the offset
           bigger belongs to this screen: everything inside the file rests clear of the
           chrome *and* of the way out. */
        style={{ "--file-sticky-top": FILE_STICKY_TOP } as React.CSSProperties}
      >
        <CaseReport caseId={caseId} checks={checks} scrutiny={scrutiny} />
        <CaseFileWayIn
          review={review}
          open={open}
          onToggle={toggle}
          controlRef={control}
        />
        {open ? (
          <div
            id={FILE_REGION_ID}
            ref={region}
            tabIndex={-1}
            aria-labelledby="case-file-heading"
            /* **The app's own motion grammar, not a new one** (brief D25): the same
               `animate-in … fill-mode-both … motion-reduce:animate-none` the advocate
               overlay's stages use, with the slide turned to the axis the file arrives
               on. `fill-mode-both` holds the first frame so the region does not flash at
               full opacity before the animation starts.

               **There is no skeleton, and that is deliberate.** The file is derived in
               this browser — nothing loads, and staging a wait for data already in
               memory is the one lie this screen cannot afford. What the owner asked for
               — *"so that contextually it doesn't throw the user off"* — is continuity,
               and continuity here is the report not moving, the control staying under
               the cursor, and the file arriving rather than snapping. No stagger across
               the four sections either: a cascade would be decoration claiming work that
               is not happening. */
            className="flex min-w-0 flex-col gap-8 outline-none animate-in fade-in-0 slide-in-from-top-2 fill-mode-both duration-300 motion-reduce:animate-none"
          >
            {/* The region's name, for the reader who cannot see the strip above it. Not
                visible, because the sticky strip already says "Full file" and a second
                heading eight pixels under it would be the two-headings-for-one-job
                defect this brief has caught five times (brief D26, D28). */}
            <h2 id="case-file-heading" className="sr-only">
              Full file
            </h2>
            <CaseFileRegion caseId={caseId} review={review} />
          </div>
        ) : null}
      </div>
    </CaseReviewShell>
  );
}

/* ────────────────────────── the file, in the URL ────────────────────────── */

/** What `aria-controls` on the way in points at, and what a focus move lands on. */
const FILE_REGION_ID = "case-file";

/**
 * Whether the full file is open — held in the URL, which is what the route was really
 * for (brief D25).
 *
 * D17 chose a route for three reasons and all three were sound: a mode needs a memory of
 * which mode you are in, a deep link needs somewhere to point, and Back has to close it.
 * A query parameter answers all three without the second page — `router.push` so the
 * browser's own Back pops the file shut, `?file=1` so a finding's link still opens it,
 * and no state for a component to lose.
 *
 * `scroll: false` on the push because this is a disclosure and not a navigation: Next
 * would otherwise put the reader back at the top of the page at the moment the thing
 * they asked for appeared beneath them.
 *
 * Focus moves only when the **reader** worked the control. Arriving on `?file=1` from a
 * link, or popping back to it, must not steal focus — and a deep link has its own
 * landing (`useDeepLink`), which would otherwise be fighting this one.
 */
function useFileDisclosure() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const open = params.get("file") === "1";

  const control = React.useRef<HTMLButtonElement>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const asked = React.useRef(false);

  React.useEffect(() => {
    if (!asked.current) return;
    asked.current = false;
    /* Into the file, so a keyboard reader is not stranded on a button whose page just
       grew forty-one rows; and back to the control on the way out. `preventScroll`
       because the region starts exactly where the reader is already looking. */
    if (open) region.current?.focus({ preventScroll: true });
    else control.current?.focus();
  }, [open]);

  const toggle = React.useCallback(() => {
    asked.current = true;
    const next = new URLSearchParams(params.toString());
    if (open) {
      next.delete("file");
      /* The document the pane was showing goes with the file it was in. Leaving it in
         the URL would re-open a pane nobody asked for on the next disclosure. */
      next.delete("doc");
    } else {
      next.set("file", "1");
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [open, params, pathname, router]);

  return { open, toggle, control, region };
}

/* ─────────────────────────────── the report ─────────────────────────────── */

/**
 * How this complaint was checked — one region, two statements that stay apart
 * (brief D23).
 *
 * The reader has one question, so there is one region, in the same place, on every
 * complaint. But **two different things did the checking**, with different authority,
 * and fusing them produces a claim neither made:
 *
 * - A registry officer, or an automated pass, read the complaint before it got here.
 *   That is the Kerala spine's step 2 and the thing a magistrate is actually trusting
 *   when he registers without opening a document.
 * - Seven machine comparisons ran a second ago, over entered values, reading no page.
 *
 * A single merged count — *"eight checks passed"* — would credit the machine with the
 * officer's reading and the officer with the machine's arithmetic, and it would make the
 * check caption ("No document was read") a lie about the officer. So: two statements,
 * each naming its own actor, a hairline between them, **the registry's first**, because
 * it happened first and because it is the stronger basis.
 *
 * **No status fill anywhere in this panel.** Ink and words only, which is also what
 * retires the contrast risk of a tint inside a panel on a tinted canvas (AGENTS 6a):
 * there is no tint on a tint, because there is no tint.
 */
function CaseReport({
  caseId,
  checks,
  scrutiny,
}: {
  caseId: string;
  checks: CaseCheck[];
  scrutiny: CaseScrutiny | undefined;
}) {
  return (
    <section
      className={cn(PANEL, "flex flex-col gap-4")}
      /* The reader's own question, which is what this region answers and what D23 opens
         with. An `aria-label` rather than a visible heading: a panel of four cells and
         one line does not need a title over it, and the words would be the only thing on
         the screen claiming to summarise the two statements under them. */
      aria-label="How this complaint was checked"
    >
      <CaseScrutinyCells scrutiny={scrutiny} />
      <CaseCheckLine fired={checks.length} />
      {checks.length > 0 ? (
        <CaseFindings caseId={caseId} checks={checks} />
      ) : null}
    </section>
  );
}

/**
 * Statement 1 — the registry's scrutiny, as four values in the header's own cell
 * grammar (brief D23).
 *
 * Three things about these four cells are deliberate:
 *
 * - **The kind of scrutiny is a value, not a tone.** "By a registry officer" and
 *   "Automated" are two members of one enum, rendered identically. The magistrate draws
 *   the inference — a person can read a page, a machine here cannot — and the screen
 *   does not draw it for him.
 * - **"Cleared" carries the outcome in the term and the date in the value**, which is
 *   how `Submitted` already works in the header one panel up. It is safe because a
 *   complaint is in this queue *because* scrutiny cleared it; where no record exists,
 *   every cell says "Not recorded" rather than quietly reading as cleared.
 * - **Rounds and Took carry no ink.** They are what the owner asked for in his first
 *   framing — *"how many times or how long did the advocate take to get through the
 *   scrutiny"* — and they are where the eye should land, because one round in four days
 *   and three rounds over thirty-four are different objects. No tone, no escalation, no
 *   threshold: the machine does not tell a magistrate that three rounds is bad. Whether
 *   he wants it marked is brief §12.19 and his to answer.
 *
 * Rejected, and each for a stated reason: one merged count (credits each actor with the
 * other's work); one composed sentence (*"Scrutiny cleared this complaint in three
 * rounds over 34 days"* — prose doing a field's job, and a third outcome needs a third
 * sentence); a `success` chip or the word "Passed" in a tint (the `Alert` that spoke on
 * all thirty-five complaints was cut on 2026-09-10 for exactly that); the history itself,
 * which §4 forbids in the owner's own words; and a fifth cell for the officer's name
 * (§12.18).
 */
function CaseScrutinyCells({ scrutiny }: { scrutiny: CaseScrutiny | undefined }) {
  /* The state a real backend produces first, and the one that must never render as
     cleared: nothing is recorded, so all four cells say so in the same words rather than
     one of them going quiet and the rest reading as fact (brief §10, §11.3). */
  const unrecorded = "Not recorded";

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <CaseHeaderCell
        term={CASE_SCRUTINY_TERMS.mode}
        value={scrutiny ? SCRUTINY_MODES[scrutiny.mode] : unrecorded}
      />
      <CaseHeaderCell
        term={CASE_SCRUTINY_TERMS.rounds}
        value={scrutiny ? String(scrutiny.rounds) : unrecorded}
        numeric
      />
      <CaseHeaderCell
        term={CASE_SCRUTINY_TERMS.took}
        value={scrutiny ? formatWaitingDuration(scrutiny.days) : unrecorded}
        numeric
      />
      <CaseHeaderCell
        term={CASE_SCRUTINY_TERMS.cleared}
        value={scrutiny ? scrutiny.clearedOnLabel : unrecorded}
        numeric
      />
    </dl>
  );
}

/**
 * How many findings there are, spoken.
 *
 * The line counts rather than lists, so the count has to be a word: "Two need a look"
 * beside "Seven checks ran" reads as one sentence, and a digit in the middle of it reads
 * as a figure to compare. Seven entries because seven checks run, so there can never be
 * an eighth finding — the array is the closed set, not a formatter.
 */
const FIRED_IN_WORDS = [
  "Nothing",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
] as const;

/**
 * Statement 2 — **seven checks ran on the entered data. Nothing flagged.**
 *
 * One line, in the same place and the same words, on every complaint (brief D14, which
 * D23 supersedes as the *whole* report and leaves standing as this statement). The
 * region that preceded it rendered *nothing* on a clean file, which was pass 5 applied
 * honestly and produced the defect it was written to avoid: silence cannot be told from
 * "no check ran", so the fast path had no stated basis. The correction is proportion,
 * not volume — the passes collapse into the count, and only findings take rows.
 *
 * Three rules the copy obeys, and each one is load-bearing:
 *
 * - **It is the system's finding, never the court's claim.** It says what ran and what
 *   it found. It never says the complaint is in order, never says it is safe to
 *   register, and never recommends an outcome. `flag-composer.tsx`'s own lesson —
 *   pre-filling a defect assertion on the officer's behalf is the machine making the
 *   claim — binds harder here, because the reader is a judge.
 * - **It states its own limit.** The caption is why the line can be trusted at all:
 *   seven checks over entered dates, amounts and slots, and not one of them opens a
 *   document. Constant on every file, and it stays, because it is *guidance* and not an
 *   attribute restating the norm. It is also what keeps the statement above it honest —
 *   the officer read pages, this did not, and the two are not merged.
 * - **A pass is never a mark.** No tick per check, no `success` tint, no per-group
 *   cleared state.
 */
function CaseCheckLine({ fired }: { fired: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t border-hairline pt-4">
      <p className="flex min-w-0 items-start gap-2 text-body-compact">
        {/* A list of checks, not a shield with a tick on it. **Logged deviation from the
            brief's §7, which names `ShieldCheckIcon`:** a check inside a shield is the
            picture of "this is verified", and the one thing D14's own copy rule forbids
            the line from saying is that the complaint is in order. The glyph has to
            report the action, not vouch for the record. Muted, never tinted — the icon
            is a mark on the line, not the message. */}
        <ListChecksIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <span className="min-w-0">
          {CASE_CHECK_COUNT} checks ran on the entered data.{" "}
          {fired === 0
            ? "Nothing flagged."
            : `${FIRED_IN_WORDS[fired]} ${fired === 1 ? "needs" : "need"} a look.`}
        </span>
      </p>
      <p className="text-caption text-muted-foreground">
        Checks compare entered values with each other. No document was read.
      </p>
    </div>
  );
}

/* ────────────────────────────── the findings ────────────────────────────── */

/**
 * Zero to seven findings — **rows of the report, not objects on it** (brief D24).
 *
 * This is the owner's second change: *"the way that one strip was showing, it feels too
 * tacky to me"*. The diagnosis came before the fix, and it had three parts, all measured
 * on the render of `58285b3`: a full-strength `border-border` box on a white panel, which
 * is the darkest non-text mark in the system spent on a list of two; a **control-shaped
 * primitive** (`Item variant="outline"` is `border-border bg-card hover:bg-accent` — a
 * control's edge, a control's fill, a control's hover, which the build had to cancel on
 * both branches); and one component doing two jobs depending on whether the finding
 * happened to have working to show, so a finding with none looked like a dead button.
 *
 * What replaces it is `ui-craft` §1.1's separation ladder taken from the top instead of
 * the bottom: **spacing groups, a hairline separates, and no box appears at all.** It is
 * also, finally, `register-advocates`' own grammar — `FactRowView` in
 * `register-advocates-dialog.tsx` is a `Collapsible` wrapping a hairline-separated list
 * row with the chevron beside the words and the detail spanning the row. D22 claimed the
 * glance had taken that "verbatim"; the build took the mechanism and not the shape.
 *
 * A `ul`, because it is a list of statements — the `ItemGroup` that used to supply the
 * list semantics went with the `Item` it was grouping.
 */
function CaseFindings({
  caseId,
  checks,
}: {
  caseId: string;
  checks: CaseCheck[];
}) {
  return (
    <ul className="flex min-w-0 flex-col border-t border-hairline">
      {checks.map((check) => (
        <CaseFindingRow key={check.id} caseId={caseId} check={check} />
      ))}
    </ul>
  );
}

/**
 * One finding: the words, then — where there is working to show — the values it read and
 * the documents that would settle it.
 *
 * *"Can you provide the information of what is not matching if I click here?"* (owner,
 * 2026-09-11). The row states the finding in words, so a reader who never opens it has
 * still been told; only the working is hidden, never the conclusion (brief D16, whose
 * rule stands under D24's new shape).
 *
 * **The sentence is `text-body`, up one step from the row it replaced.** `ui-craft` §3
 * reserves `text-body-compact` for "dense staff tables/rows — opt-in only", and a finding
 * is not a table row: it is the one piece of prose on this screen that a magistrate must
 * actually read. That single change does more than the border removal to stop the row
 * reading as furniture.
 *
 * **Ink, never a fill.** A flag takes `warning-ink` and a note takes plain foreground —
 * appearing in person is lawful and must never be inked as a defect (brief D15). The
 * words carry the finding on their own, so the colour is the second treatment and never
 * the only one (`ACCESSIBILITY.md` §3). A `warning-muted` block behind the findings was
 * considered and rejected: the detail holds sunken document wells, and a well on a tint
 * is AGENTS 6a arriving by the back door — and a tint turns statements a magistrate must
 * *read* into a callout he can skim. Reversible in one class if the owner wants urgency
 * (brief §12.19).
 */
function CaseFindingRow({
  caseId,
  check,
}: {
  caseId: string;
  check: CaseCheck;
}) {
  const flag = check.class === "flag";
  const Icon = flag ? CircleAlertIcon : InfoIcon;
  /* Some findings have no working to show. Check 6 is the whole of it today: an advocate
     is on record or nobody is, there is no pair of values behind that, and the
     vakalatnama slot does not exist on a complaint with no counsel to file one. Under
     D24 this costs nothing to state — the row is no longer a bordered control, so a row
     that is not a control no longer looks like a dead button. It is simply a row with no
     chevron. */
  const openable = check.values.length > 0 || check.documents.length > 0;

  const statement = (
    <>
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          flag ? "text-warning-ink" : "text-muted-foreground",
        )}
      />
      {/* The longest string on this screen, and it will grow by half again in Malayalam.
          It wraps inside the row rather than truncating. Not `flex-1`: the row sizes to
          the sentence so the chevron that follows it lands beside the last word rather
          than at the panel's far edge. */}
      <span
        className={cn("min-w-0 text-pretty text-body", flag && "text-warning-ink")}
      >
        {check.finding}
      </span>
    </>
  );

  if (!openable) {
    return (
      <li className="flex min-h-10 min-w-0 items-start gap-2.5 border-t border-hairline py-3 first:border-t-0">
        {statement}
      </li>
    );
  }

  return (
    <Collapsible asChild>
      <li className="min-w-0 border-t border-hairline first:border-t-0">
        {/* **`w-fit`, so the chevron sits beside the words** — `FactRowView`'s own shape,
            which is what D24 inherits and what the build at `58285b3` forked. Measured on
            the render before this line changed: a full-width trigger put the chevron at
            the panel's right edge, 560px from the end of a one-line finding at 1280, a
            mark with nothing near it to govern. `max-w-full` lets a long sentence wrap
            inside the row instead of widening it.

            `min-h-10` keeps the DS's 40px floor on a target reached on a tablet. The hover
            is on the chevron rather than on the row, because the row has no fill to change
            and a flag's sentence has an ink of its own that a hover must not overwrite — so
            what moves is the one mark whose whole job is to say "this opens". */}
        <CollapsibleTrigger className="group/finding flex min-h-10 w-fit max-w-full items-start gap-2.5 rounded-lg py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-focus-ring">
          {statement}
          <ChevronDownIcon
            aria-hidden
            /* `transition-[color,transform]`, not two utilities: `transition-colors` and
               `transition-transform` both set `transition-property`, so the second
               silently cancels the first and the hover would jump. The app already names
               a single property this way (`transition-[width]` on the rails). */
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover/finding:text-foreground group-data-[state=open]/finding:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* The detail opens beneath, in the sentence's own column — `pl-6` clears the
              icon, so the working lines up under the words it is working out. No second
              frame and no well: the panel is the frame and depth on this screen stops
              there (`ui-craft` §4). */}
          <div className="@container flex min-w-0 flex-col gap-3 pt-3 pb-3 pl-6">
            {check.values.length > 0 ? (
              <DescriptionList>
                {check.values.map((value) => (
                  <DescriptionRow
                    key={value.term}
                    className="grid-cols-1 gap-1 border-hairline py-2 @xs:grid-cols-[minmax(7rem,10rem)_1fr] @xs:gap-4"
                  >
                    <DescriptionTerm className="text-body-compact">
                      {value.term}
                    </DescriptionTerm>
                    <DescriptionDetails
                      className={cn(
                        "min-w-0 wrap-break-word text-body-compact",
                        value.numeric && "tabular-nums",
                      )}
                    >
                      {value.value}
                    </DescriptionDetails>
                  </DescriptionRow>
                ))}
              </DescriptionList>
            ) : null}

            {check.documents.length > 0 ? (
              <ul className="flex min-w-0 flex-col gap-2">
                {check.documents.map((document) => (
                  <li key={document.key} className="min-w-0">
                    <CaseFindingDocument caseId={caseId} document={document} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

/**
 * A document that would settle a finding.
 *
 * The whole row is the link, not a thumbnail inside it. On the upload screen and inside
 * the file the thumbnail is the control because pressing it opens the document *there*;
 * here it opens the file below, at the head the finding is stated under, with that
 * document in the pane. One control per row, a real anchor a reader can open in a tab,
 * and no button nested inside a link.
 *
 * **It no longer leaves the page** (brief D25). `caseFileHref` now builds
 * `?file=1&doc=…#case-group-…` against this same route, so following a finding opens the
 * file beneath the report and scrolls to the head rather than loading a second page —
 * and Back closes it again.
 *
 * **An absent slot is not a control.** Check 4's application and check 5's slots are
 * *absences* — there is nothing to open, and a row that looked pressable and did nothing
 * would be worse than one that plainly states the gap. It keeps the slot's geometry and
 * none of its affordances, and says "Not on file".
 *
 * `meta` carries the head the document sits under, which is real and varies — both
 * parties file an "ID proof", and a reader pulled out of the file's own order needs to
 * know which one this is. It is not the `meta="Filed"` that was cut on the file view:
 * that read the same on all eighteen rows.
 */
function CaseFindingDocument({
  caseId,
  document,
}: {
  caseId: string;
  document: CaseCheckDocument;
}) {
  if (document.state === "absent") {
    return (
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
            Not on file — {document.head}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={caseFileHref(caseId, { group: document.group, doc: document.key })}
      className="group/doc block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
    >
      {/* The slot keeps its own sunken fill — panel → row → well is three readable
          tiers and the row would otherwise be a label floating in white, which is the
          wireframe tell `ui-craft` names. The hover therefore lands on the well rather
          than on the anchor around it, or the fill would sit on top of it. */}
      <DocumentSlot
        status="filled"
        media="thumbnail"
        label={document.label}
        meta={document.head}
        className={cn(
          DOCUMENT_MEDIA,
          "transition-colors group-hover/doc:bg-accent",
        )}
        thumbnail={<PageFacsimile kind={document.kind} />}
      />
    </Link>
  );
}

/* ─────────────────────── the way in, and the way out ────────────────────── */

/**
 * One control, honestly named, the size of what is behind it — and, once the file is
 * open, the strip that keeps the way out reachable (brief D25).
 *
 * **One control, in the same row it already occupies, toggling its label.** Not a second
 * control anywhere: `aria-expanded` and `aria-controls` say what it does, and the counts
 * beside it say how much is behind it.
 *
 * **The report is not pinned.** It stays where it is and the file grows beneath it.
 * Pinning ~190px of already-read statement over a forty-one-row file would spend a
 * quarter of every screenful restating it. What must stay reachable is the **act**, and
 * it already is: the decision band is `sticky bottom-0` on the shell and is untouched by
 * this.
 *
 * **The way out is what becomes sticky.** Once the file is open this row collapses into
 * a slim strip under the chrome, carrying the same counts and the same control — which
 * is `ui-craft` §2's own rule for this shape (*a toggleable panel that fully disappears
 * when closed → persistent surfaces collapse to a slim strip and expand in place*) and
 * the reason it is not a pattern fork. The negative margins take it to the page's edges
 * so it reads as chrome rather than as a panel that happens to stick.
 *
 * Deliberately quiet in both states. `outline`, not teal: this is the rare path, the teal
 * is spent on the act, and a magistrate who wanted to read the whole complaint would have
 * found a grey button just as fast (`ui-craft` §1.2).
 */
function CaseFileWayIn({
  review,
  open,
  onToggle,
  controlRef,
}: {
  review: CaseReview;
  open: boolean;
  onToggle: () => void;
  controlRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const counts = caseFileCounts(review);

  const control = (
    <Button
      ref={controlRef}
      type="button"
      variant="outline"
      className="shrink-0"
      aria-expanded={open}
      aria-controls={FILE_REGION_ID}
      onClick={onToggle}
    >
      <FileSearchIcon data-icon="inline-start" aria-hidden />
      {open ? "Close the full file" : "Open the full file"}
    </Button>
  );

  if (!open) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {control}
        <p className="min-w-0 text-caption tabular-nums text-muted-foreground">
          {counts.values} entered values · {counts.documents} documents
        </p>
      </div>
    );
  }

  return (
    <div
      /* **`top-14`, flush under the bar — a logged deviation from the brief's §7**, which
         names `top-(--chrome-sticky-top)`. That offset is the bar *plus* the 2rem of air
         a lifted panel wants above it; a strip that reads as chrome wants none. Measured
         on the render at 1280×800: sticking at 88px left a 32px window between the bar's
         bottom (56px) and the strip through which the file visibly scrolled — three
         sticky things on one page fighting, which is §11.1.7's own named risk. `h-14` is
         the bar's height (`app-chrome.tsx` `BAR`); `task-detail-panel.tsx` sticks flush
         under it the same way. The file's own heads still rest clear of both, at
         `--file-sticky-top`. */
      className={cn(
        "sticky top-14 z-20 -mx-6 flex min-w-0 items-center gap-3 border-b border-hairline bg-card px-6 md:-mx-8 md:px-8",
        FILE_STRIP,
      )}
    >
      {/* The counts stand down below `sm` rather than truncating to nothing: at 375 the
          strip is the control and the word that names what is open, and the counts have
          already been read on the row this strip replaced. */}
      <p className="min-w-0 flex-1 truncate text-caption tabular-nums text-muted-foreground">
        Full file
        <span className="max-sm:hidden">
          {" · "}
          {counts.values} entered values · {counts.documents} documents
        </span>
      </p>
      {control}
    </div>
  );
}
