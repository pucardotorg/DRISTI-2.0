"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  CircleAlertIcon,
  FileSearchIcon,
  FileTextIcon,
  InfoIcon,
  ListChecksIcon,
} from "lucide-react";

import {
  CaseReviewMissing,
  CaseReviewShell,
  DOCUMENT_MEDIA,
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
import { Item, ItemGroup } from "@/components/ui/item";
import {
  CASE_CHECK_COUNT,
  caseChecksFor,
  caseFileCounts,
  caseFileHref,
  caseReviewFor,
  type CaseCheck,
  type CaseCheckDocument,
  type CaseReview,
} from "@/lib/employee/case-review";
import { counselFor } from "@/lib/employee/hearings";
import { registerCaseById } from "@/lib/employee/register-cases";
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
 * title, trust the automated checks, and look closely only where something snags.
 *
 * So there are three regions and two acts, in this order: **who and how much** (the
 * header), **what the machine found** (the ledger), **the way in** (one control to the
 * full file), and the decision band. On twenty-six of the thirty-five complaints in the
 * queue the ledger is exactly one line with no rows, no colour and no scrolling.
 *
 * The screen it replaced is not deleted — it is `case-file-screen.tsx`, one control
 * away, with every one of its decisions intact. Reading the whole complaint is
 * deliberate now rather than the default, which is what *"if he wants to dig in, then he
 * can see the entered information against the original source"* actually describes.
 *
 * **Nothing here opens an overlay** (brief D20). The three interactive things are a
 * finding's disclosure, the way in, and the two acts; none of them draws a scrim. On
 * this screen an overlay is only ever the document panel below `xl` on the file view,
 * and anything else that wants a `Dialog` is a finding that the design got the shape
 * wrong.
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

  const checks = caseChecksFor(caseId, today) ?? [];
  const hasCounsel = counselFor(complaint, "complainant").length > 0;

  return (
    <CaseReviewShell review={review} hasCounsel={hasCounsel} gap="gap-6">
      <div className="flex min-w-0 flex-col gap-6">
        <CaseCheckLedger caseId={caseId} checks={checks} />
        <CaseFileWayIn caseId={caseId} review={review} />
      </div>
    </CaseReviewShell>
  );
}

/* ─────────────────────────────── the ledger ─────────────────────────────── */

/**
 * How many findings there are, spoken.
 *
 * The ledger counts rather than lists, so the count has to be a word: "Two need a look"
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
 * **Seven checks ran on the entered data. Nothing flagged.**
 *
 * One line, in the same place and the same words, on every complaint (brief D14). The
 * region that preceded this rendered *nothing* on a clean file, which was pass 5 applied
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
 *   attribute restating the norm.
 * - **A pass is never a mark.** No tick per check, no `success` tint, no per-group
 *   cleared state. Twelve green ticks on twenty-six clean files is the norm marked,
 *   which this screen has already cut once — the confirmations `Alert` that spoke on all
 *   thirty-five complaints went on 2026-09-10 for exactly that.
 *
 * **No status fill anywhere in this panel.** Ink and words only, which is also what
 * retires the contrast risk of a tint inside a panel on a tinted canvas (AGENTS 6a):
 * there is no tint on a tint, because there is no tint.
 */
function CaseCheckLedger({
  caseId,
  checks,
}: {
  caseId: string;
  checks: CaseCheck[];
}) {
  const fired = checks.length;

  return (
    <section
      className={cn(PANEL, "flex flex-col gap-3")}
      aria-labelledby="case-checks"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p
          id="case-checks"
          className="flex min-w-0 items-start gap-2 text-body-compact"
        >
          {/* A list of checks, not a shield with a tick on it. **Logged deviation from
              the brief's §7, which names `ShieldCheckIcon`:** a check inside a shield is
              the picture of "this is verified", and the one thing D14's own copy rule
              forbids the line from saying is that the complaint is in order. The glyph
              has to report the action, not vouch for the record. Muted, never tinted —
              the icon is a mark on the line, not the message. */}
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

      {fired > 0 ? (
        <ItemGroup className="gap-2">
          {checks.map((check) => (
            <CaseFindingRow key={check.id} caseId={caseId} check={check} />
          ))}
        </ItemGroup>
      ) : null}
    </section>
  );
}

/**
 * One finding: the words, then — behind a disclosure — the values it read and the
 * documents that would settle it.
 *
 * This is `register-advocates`' D23 applied to a different queue rather than re-derived:
 * *"Can you provide the information of what is not matching if I click here?"* (owner,
 * 2026-09-11). The row states the finding in words, so a reader who never opens it has
 * still been told; only the working is hidden, never the conclusion.
 *
 * **Ink, never a fill.** A flag takes `warning-ink` and a note takes plain foreground —
 * appearing in person is lawful and must never be inked as a defect (brief D15). The
 * words carry the finding on their own, so the colour is the second treatment and never
 * the only one (`ACCESSIBILITY.md` §3).
 *
 * The `Item` is the bordered object and the trigger is the strip inside it, which is a
 * **logged deviation** from the brief's §7 (where the `Item` *is* the trigger): the same
 * section also asks for the detail to open "inside the row's own bounds", and a
 * `CollapsibleTrigger` cannot contain its own `CollapsibleContent`. Keeping the border
 * on the container is the half that matters — a detail that fell outside it would be the
 * second frame `ui-craft` §4 forbids. The `Item`'s own hover fill is cancelled because a
 * container is not a target; the strip inside takes the hover and the focus ring.
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
     is on record or nobody is, there is no pair of values behind that and the
     vakalatnama slot does not exist on a complaint with no counsel to file one. A
     chevron that opens an empty box is a control that lies about having something —
     measured on the render, 2026-09-11 — so the row simply is not a disclosure. */
  const openable = check.values.length > 0 || check.documents.length > 0;

  if (!openable) {
    return (
      <Item
        role="listitem"
        variant="outline"
        className="min-h-10 items-start gap-2.5 px-3 py-2.5 hover:bg-card"
      >
        <Icon
          aria-hidden
          className={cn(
            "mt-0.5 size-4 shrink-0",
            flag ? "text-warning-ink" : "text-muted-foreground",
          )}
        />
        <span
          className={cn(
            "min-w-0 flex-1 text-pretty text-body-compact",
            flag && "text-warning-ink",
          )}
        >
          {check.finding}
        </span>
      </Item>
    );
  }

  return (
    <Collapsible asChild>
      <Item
        role="listitem"
        variant="outline"
        /* `flex-nowrap` is not cosmetic — **measured on the render, 2026-09-11.** The DS
           `Item` ships `flex-wrap`, which is right for the row it was designed as and
           wrong the moment the item runs as a column: a wrapping column flex container
           stretched the open disclosure from its 297px of content to 877px, leaving
           580px of empty white inside the panel and pushing the page 689px past the
           fold on a screen whose whole claim is that it does not scroll. One class,
           at the call site, never in the primitive. */
        className="flex-col flex-nowrap items-stretch gap-0 p-0 hover:bg-card"
      >
        <CollapsibleTrigger className="group/finding flex min-h-10 w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-focus-ring">
          <Icon
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0",
              flag ? "text-warning-ink" : "text-muted-foreground",
            )}
          />
          {/* The longest string on this screen, and it will grow by half again in
              Malayalam. It wraps inside the row rather than truncating, and the chevron
              stays where it is because it is the flex item that never shrinks. */}
          <span
            className={cn(
              "min-w-0 flex-1 text-pretty text-body-compact",
              flag && "text-warning-ink",
            )}
          >
            {check.finding}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/finding:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="@container flex min-w-0 flex-col gap-3 px-3 pt-3 pb-3">
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
      </Item>
    </Collapsible>
  );
}

/**
 * A document that would settle a finding — and the one thing on this screen that leaves
 * it.
 *
 * The whole row is the link, not a thumbnail inside it. On the upload screen and on the
 * full file the thumbnail is the control because pressing it opens the document *there*;
 * here there is nowhere to open it, so the row goes to the file view with that document
 * in the pane and that head in view. One control per row, a real anchor a reader can
 * open in a tab, and no button nested inside a link.
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

/* ─────────────────────────────── the way in ─────────────────────────────── */

/**
 * One control, honestly named, and the size of what is behind it.
 *
 * A route rather than an expansion or an overlay (brief D17): an expansion makes this
 * page a mode, and a mode needs a second control to leave and a memory of which mode you
 * are in; an overlay re-introduces the scrim the file view was rebuilt to remove. A
 * route gives Back for free — the trail, the browser, and the breadcrumb the owner
 * already ruled on — and it is linkable, which a finding's deep link needs.
 *
 * Deliberately quiet. `outline`, not teal: this is the rare path, the teal is spent on
 * the act, and a magistrate who wanted to read the whole complaint would have found a
 * grey button just as fast (`ui-craft` §1.2).
 */
function CaseFileWayIn({
  caseId,
  review,
}: {
  caseId: string;
  review: CaseReview;
}) {
  const counts = caseFileCounts(review);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <Button variant="outline" asChild>
        <Link href={caseFileHref(caseId)}>
          <FileSearchIcon data-icon="inline-start" aria-hidden />
          Open the full file
        </Link>
      </Button>
      <p className="min-w-0 text-caption tabular-nums text-muted-foreground">
        {counts.values} entered values · {counts.documents} documents
      </p>
    </div>
  );
}
