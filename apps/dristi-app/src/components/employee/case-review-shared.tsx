"use client";

import * as React from "react";
import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  type CaseDocumentKind,
  type CaseReview,
} from "@/lib/employee/case-review";
/* The wait as a value beside the term "Waiting" — which is the case the advocate
   register already exports this for, and the case the header's cell is. Not a fourth
   `formatDaysWaiting`: a new function returning a different string under a name two
   sibling modules already use is how two screens start counting differently. */
import { cn } from "@/lib/utils";

/**
 * What the glance and the full file both are — the frame, the identity, the two acts,
 * and the drawing of a page.
 *
 * The two views split on 2026-09-11 (brief D13): the landing stopped being a surface to
 * check the file on and became a statement of what has already been checked, and the
 * file it used to be moved one control away. What did **not** split is anything a reader
 * would notice being different between them. A magistrate who digs in must meet the same
 * header and be able to act where he ends up — sending him back to the landing to press
 * Register would be the wizard D13 rejected, arriving by the back door — so the shell,
 * the header, the decision band and its two stages live here and are composed by both.
 *
 * **The page is layered, not framed** (owner, 2026-09-11). The canvas carries `bg-muted`
 * in light mode with `dark:bg-background`, which is `FilingMain`'s recipe verbatim
 * (`components/filing/filing-shell.tsx`) — including the dark fallback, where `muted` is
 * the *raised* step and tinting the canvas would put the page above its own panels. The
 * panels are the only white, and the decision band below stays `bg-card` so the tint
 * reads as the surface being read rather than as grey chrome. `ui-craft` §1.0 reserves
 * the tinted canvas for pages that are *filled*; the owner has overruled that for this
 * screen and it is logged in the brief.
 */

/* The house panel, as the cause list, the scheduling queue and the case overview all
   compose it: a white sheet lifted off the canvas by its shadow, with the hairline as a
   soft edge rather than a stroke. Nothing inside draws a second frame. */
export const PANEL =
  "min-w-0 rounded-xl border border-hairline bg-card p-6 shadow-raised";

/**
 * The tab row's height, and where content inside the file comes to rest when a deep
 * link or the reading index jumps to it. The page scrolls under the chrome bar (56px)
 * and the tab row sticks directly beneath it, so a head resting at the chrome's own
 * offset would land under the tabs. `--file-sticky-top` is the bar, the row, and a
 * little air; the file region reads it as `scroll-mt-(--file-sticky-top)` and its
 * sticky document pane as `top-(--file-sticky-top)`.
 */
export const TAB_ROW = "group-data-horizontal/tabs:h-11";
export const FILE_STICKY_TOP = "calc(3.5rem + 2.75rem + 1rem)";
export const SCROLL_REST = "scroll-mt-(--file-sticky-top)";

/**
 * The frame both views sit in: tinted canvas, page padding, header, body, decision band.
 *
 * `stage` is what makes the band's two controls real without either of them performing
 * an act. Pressing one replaces the *body* with a focused stage — the register
 * confirmation, or the send-back composer — and leaves the header and the band in place,
 * which is the owner's 2026-09-10 ruling on the advocate queue applied here: *"instead of
 * a modal-on-modal interaction… it's progressing to the next state"*. Nothing on either
 * view draws a scrim except the document overlay below `xl` (brief D20).
 */
export function CaseReviewShell({
  review,
  hasCounsel,
  children,
}: {
  review: CaseReview;
  /** Whether anyone is on record for the complainant — the send-back's recipient. */
  hasCounsel: boolean;
  children: React.ReactNode;
}) {
  const decision = useCaseDecision();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted dark:bg-background">
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-6 pt-6 pb-12 md:px-8 md:pt-8">
        <CaseReviewHeader review={review} decision={decision} />
        {decision.stage === null ? (
          children
        ) : (
          <CaseDecisionStage decision={decision} hasCounsel={hasCounsel} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── the header ─────────────────────────────── */

/**
 * Which complaint this is: its number, the cause as the page, and the four facts that
 * size the matter.
 *
 * **The eyebrow is gone** (owner, 2026-09-11). Four unrelated things strung across one
 * caption line with `·` between them is a row that reads as one string and sorts as
 * none, and it put the record's identity at the same weight as how long it had waited.
 * So the number goes on a line of its own above the title — it is what identifies the
 * record, and it is the crumb in the bar directly above it — and the facts become
 * label-over-value cells beneath. No separators anywhere: a `·` that lands first on a
 * wrapped line reads as a bullet, and cells do not need one.
 *
 * **`Amount` is the fourth cell** (brief D18). The cheque amount is the fact that sizes
 * the consequence of the act, it comes free from `ChequeDetails.amount`, and on a glance
 * built to be resolved without scrolling it is the difference between recognising a
 * matter and reading one. It is the one cell that is also a row of the file, and it
 * reads the same word in both places.
 *
 * **There is no status `Badge`** (brief D3). `CASE_REVIEW_STATUS` is a one-member enum
 * true of every row in this queue — the constant-column defect already killed on the
 * queues, and the one place it had survived.
 *
 * The wait is not coloured. On the queue an amber wait is a comparison — this row
 * against the rows above it — and there is nothing here to compare against: one file,
 * one wait (`ui-craft` §1.4).
 */
function CaseReviewHeader({
  review,
  decision,
}: {
  review: CaseReview;
  decision: CaseDecision;
}) {
  return (
    <header
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8"
      aria-labelledby="case-review-title"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-compact tabular-nums text-muted-foreground">
          {review.caseNumber}
        </p>
        <h1
          id="case-review-title"
          className="text-balance font-semibold text-title"
        >
          {review.title}
        </h1>
      </div>
      {decision.stage === null ? (
        <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            onClick={() => decision.go("send-back")}
          >
            Send back for correction
          </Button>
          <Button type="button" onClick={() => decision.go("register")}>
            Register case
          </Button>
        </div>
      ) : null}
    </header>
  );
}

/* ─────────────────────────── the two decisions ──────────────────────────── */

/** Which stage of the decision the page is in. `null` is the view itself. */
type CaseDecisionStageName = "send-back" | "register";

type CaseDecision = {
  stage: CaseDecisionStageName | null;
  reason: string;
  touched: boolean;
  go: (stage: CaseDecisionStageName | null) => void;
  write: (reason: string) => void;
};

function useCaseDecision(): CaseDecision {
  const [stage, setStage] = React.useState<CaseDecisionStageName | null>(null);
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  return {
    stage,
    reason,
    touched,
    go: setStage,
    write: (next) => {
      setReason(next);
      setTouched(true);
    },
  };
}

function CaseDecisionStage({
  decision,
  hasCounsel,
}: {
  decision: CaseDecision;
  hasCounsel: boolean;
}) {
  const sending = decision.stage === "send-back";
  const empty = decision.reason.trim() === "";
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);

  /* Focus follows the stage. Into the composer it lands on the box, which is the only
     thing that stage is for; into the confirmation it lands on the question, which has
     just replaced the body a reader was looking at. */
  React.useEffect(() => {
    if (sending) reasonRef.current?.focus();
    else titleRef.current?.focus();
  }, [sending]);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center pb-8">
      <div className="flex w-full max-w-xl flex-col gap-4 md:my-auto">
        <section
          className={cn(PANEL, "flex flex-col gap-4 p-0")}
          aria-labelledby="case-decision-title"
        >
          {/* The strip that names what is about to happen. Sunken rather than tinted:
              nothing has been decided, so there is no status to report yet, and a
              coloured band before an act is drama the owner has already cut once. */}
          <p className="rounded-t-xl bg-surface-sunken px-4 py-2.5 text-body-compact font-medium text-muted-foreground">
            {sending ? "You are sending this back" : "You are registering"}
          </p>

          <div className="flex flex-col gap-4 px-4 pb-4">
            <h2
              id="case-decision-title"
              ref={titleRef}
              tabIndex={-1}
              className="font-semibold text-title-s outline-none"
            >
              {sending
                ? "Send this complaint back for correction?"
                : "Register this complaint?"}
            </h2>

            {sending ? (
              <>
                {hasCounsel ? null : (
                  /* Brief §12.12, undesigned and open: the owner's sentence is "that
                     sending it back will go to the advocate", and this complaint has
                     none. The control states it has no recipient rather than pretending
                     to send somewhere. */
                  <p className="text-body-compact text-muted-foreground">
                    No advocate is on record for this complaint, so there is nobody
                    to send it to. Whether a complaint conducted in person can be
                    returned at all has not been decided.
                  </p>
                )}
                <Field data-invalid={decision.touched && empty}>
                  {/* A visible label whenever the box is visible: placeholder-only
                      fields are a listed accessibility defect, and a voice user says
                      the label. The label asks the question and stops — the advocate
                      reads the answer, not an explanation of the form. */}
                  <FieldLabel
                    htmlFor="case-send-back-reason"
                    className="text-body font-medium"
                  >
                    Why are you sending this back?
                  </FieldLabel>
                  <Textarea
                    id="case-send-back-reason"
                    ref={reasonRef}
                    className="min-h-32 text-body"
                    placeholder="e.g. The date on the cheque does not match the date entered. Please check and file again."
                    value={decision.reason}
                    onChange={(event) => decision.write(event.target.value)}
                  />
                  {/* The gate, only once it has been tripped. Red on a box nobody has
                      attempted yet reads as a scolding, and a line stating the rule
                      before it is broken is exposition. The rule itself is inherited
                      rather than re-argued: officers leave one-word remarks and
                      advocates travel to court to decode them (`flag-composer.tsx`). */}
                  {decision.touched && empty ? (
                    <FieldError>Write a reason first.</FieldError>
                  ) : null}
                </Field>
              </>
            ) : (
              <p className="text-body text-muted-foreground">
                Registering a complaint is taking cognizance of the offence under
                BNSS §210. It is a judicial act, and this screen does not undo it.
              </p>
            )}
          </div>
        </section>

        {/* The stage's own controls — Back, and the act itself, held. They used to live
            in a sticky band pinned to the viewport, which covered whatever was focused
            near the foot of the page; the act belongs to the question it answers. */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => decision.go(null)}>
            Back
          </Button>
          {sending ? (
            <Button
              type="button"
              variant="destructive"
              aria-disabled
              aria-describedby="case-send-back-unbuilt"
              className="aria-disabled:opacity-50 aria-disabled:hover:bg-destructive aria-disabled:active:translate-y-0"
            >
              Send back for correction
            </Button>
          ) : (
            <Button
              type="button"
              aria-disabled
              aria-describedby="case-register-unbuilt"
              className="aria-disabled:opacity-50 aria-disabled:hover:bg-primary aria-disabled:active:translate-y-0"
            >
              Register case
            </Button>
          )}
        </div>

        {/* Said once, at the end, outside the card that carries the question — the same
            place and the same voice the advocate queue's end states use. The act is
            `aria-disabled` and this is the sentence that says why. */}
        <p
          id={sending ? "case-send-back-unbuilt" : "case-register-unbuilt"}
          className="text-center text-caption text-pretty text-muted-foreground"
        >
          {sending
            ? "Not part of this build — the reason is not sent to anyone."
            : "Not part of this build — nothing is registered and nobody is told."}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────── the missing file ──────────────────────────── */

/**
 * An id no register queue holds. The same miss the order composer and the case
 * overview already answer, arriving by the same route — a stale link, a typed URL, or
 * a complaint that has left the queue.
 */
export function CaseReviewMissing() {
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

/* ──────────────────────────── the drawn page ────────────────────────────── */

/**
 * The media well a document row draws its page in — page-shaped rather than the DS
 * square, and on paper.
 *
 * Page-shaped for the reason the upload row gives for the same override: a square crop
 * of a cheque or an ID card is noise, and `DocumentSlot` fixes its well at `size-16`.
 * 44×56 is portrait like the facsimile's own 60×80 `viewBox`, close to the same optical
 * area as the upload row's 64×48 landscape, and — the constraint that set the width —
 * where the thumbnail is the row's control it has to clear the 40×40 touch floor
 * (`ACCESSIBILITY.md` §8). 36 wide, which is what an exact 3:4 at this height would be,
 * does not.
 *
 * `paper` and `paper-border` rather than the well's default `muted`: what sits in it is
 * a drawing of a court document in the DS's document-facsimile tokens, and a page needs
 * the ground it is printed on. The hairline-weight edge is the DS's stated exception for
 * thumbnails (`foundations/elevation`) — a picture needs a boundary a fill cannot give it.
 */
export const DOCUMENT_MEDIA = [
  "[&_[data-slot=document-slot-media]]:h-14",
  "[&_[data-slot=document-slot-media]]:w-11",
  "[&_[data-slot=document-slot-media]]:border",
  "[&_[data-slot=document-slot-media]]:border-paper-border",
  "[&_[data-slot=document-slot-media]]:bg-paper",
].join(" ");

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
 * Nothing here is legible, and nothing here is a specific document: readable text would
 * be fabricating a court record, which is the one thing a demo of a court file must not
 * do.
 */
export function PageFacsimile({ kind }: { kind: CaseDocumentKind }) {
  return (
    <svg viewBox="0 0 60 80" className="size-full" role="presentation" aria-hidden>
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
      <rect x="5" y="26" width="50" height="28" className="fill-paper-muted" rx="1" />
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
      <rect x="30" y="40" width="20" height="12" className="fill-paper-muted-foreground" rx="1" />
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
