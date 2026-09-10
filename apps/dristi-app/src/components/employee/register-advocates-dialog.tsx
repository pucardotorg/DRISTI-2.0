"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  ImageOffIcon,
} from "lucide-react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
import {
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_ROW,
  tableBodyClass,
  tableRowClass,
} from "@/components/chrome/table-plate";
import { DocumentPreview } from "@/components/cases/document-preview";
import { ReviewRow } from "@/components/cases/filing-form-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DescriptionList } from "@/components/ui/description-list";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  identityRows,
  idPhotoLabel,
  registrantNoun,
  rejectionRows,
  requestRows,
  type AdvocateRegistration,
  type ComparisonBlock,
  type FactRow,
  type RowFormat,
  type WaitTone,
} from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

/**
 * One registration request, verified and then approved or rejected — the whole decision,
 * without leaving the queue.
 *
 * Handover `REG-14` says the photograph of the Bar ID card exists **so the scrutiny
 * officer can verify** the typed claim, so the review body is built as that comparison
 * and nothing else: the values on the left, the card on the right, at the same time, one
 * saccade apart.
 *
 * **One overlay, five stages, no dialog on a dialog** (owner, 2026-09-10). Review →
 * Reject or Approve → a settled end state, each stage sliding in from the right and Back
 * sliding the previous one in from the left. Every stage past Review is a **focused**
 * step — one question, centred, nothing else on it — because a step that keeps the whole
 * review layout and drops a control into it does not read as a step at all (owner,
 * 2026-09-11, on the first build's reject stage).
 *
 * **Two shapes hold every fact here, and there is no third** (D19, D20).
 *
 * 1. `FactRow` — a term and its value, in a `DescriptionList`. Request metadata, the four
 *    submitted attributes, every rejection round.
 * 2. `ComparisonBlock` — a `Table` with a column per source. Anything where two values
 *    disagree.
 *
 * That division is the whole of the 2026-09-11 rebuild. The build before it decorated a
 * value with everything that could be said about it — two chips, a muted source line, a
 * struck-through previous value — and the owner read the result on the render as
 * *"an abomination of just information being thrown around with no particular
 * hierarchy"*. A comparison is not a decoration on a value; it is a table, and a table is
 * what tables are for. If you find yourself adding a fourth treatment inside a row, the
 * fact belongs in a table of its own.
 *
 * **The register only speaks when it disagrees** (D19). No `matches`, no `OTP: verified`.
 * See `registerAnswer` for why agreement is not information.
 *
 * **Approve and Reject perform no act.** Both drop the row from the demo queue — see
 * `lib/employee/register-advocates.ts`. No account is opened, no access is granted or
 * refused, no reason is sent and nobody is told, and the end states say so once.
 */
export function RegisterAdvocateDialog({
  request,
  next,
  onOpenChange,
  onApprove,
  onReject,
  onNext,
  onReturnFocus,
}: {
  request: AdvocateRegistration | null;
  /**
   * The request the end state offers to open next — `nextInQueue` on the screen's own
   * list, so it respects the officer's search. `null` means the list is empty.
   */
  next: AdvocateRegistration | null;
  onOpenChange: (request: AdvocateRegistration | null) => void;
  /** Commit the demo act. Must **not** close the overlay: the end state renders after it. */
  onApprove: (request: AdvocateRegistration) => void;
  /**
   * **The reason is not handed back, on purpose.** It is what unlocks the button — the
   * gate `REG-22` asks for — and there is nothing on the court side that could carry it:
   * no notification channel is decided (`register-advocates.md` §12.1) and this build
   * sends nothing. A callback that passed the sentence up would imply somewhere for it to
   * go. **ENGINEERING SEAM:** when the registration service exists, the reason travels
   * from here, and this signature is the line that changes.
   */
  onReject: (request: AdvocateRegistration) => void;
  /** Open `next` in this same overlay. */
  onNext: (request: AdvocateRegistration) => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(null);
      }}
    >
      {request ? (
        /* Keyed on the request so opening the next one starts at Review rather than
           inheriting this one's stage, its scroll position — or, worse, a rejection reason
           typed about somebody else. */
        <RequestBody
          key={request.id}
          request={request}
          next={next}
          onApprove={onApprove}
          onReject={onReject}
          onNext={onNext}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

/* ─────────────────────────────── the stages ─────────────────────────────── */

/**
 * Where the request is in the overlay. The first three are the officer still deciding;
 * the last two are settled, and the only way out of them is Close or the next request.
 */
type Stage = "review" | "reject" | "approve" | "rejected" | "approved";

const STAGE_TITLE: Record<Stage, string> = {
  review: "Review registration request",
  reject: "Reject this registration?",
  approve: "Approve this registration?",
  rejected: "Registration rejected",
  approved: "Registration approved",
};

/**
 * The request's own state, said once, in the header.
 *
 * `Pending approval` until the act, then the decision — in the DS's own success and
 * destructive treatments, so a settled overlay reads as accepted or refused before a word
 * of it is read (owner, 2026-09-11). The words are on the chip, so the outcome is never
 * colour alone.
 */
const STAGE_BADGE: Record<
  Stage,
  { variant: "warning" | "success" | "destructive"; label: string }
> = {
  review: { variant: "warning", label: "Pending approval" },
  reject: { variant: "warning", label: "Pending approval" },
  approve: { variant: "warning", label: "Pending approval" },
  rejected: { variant: "destructive", label: "Rejected" },
  approved: { variant: "success", label: "Approved" },
};

/**
 * The entrance each stage makes. Forward is the request progressing — it arrives from the
 * right, the direction it is going. Back arrives from the left, the direction it came
 * from. `fill-mode-both` holds the first frame so nothing flashes at its final position
 * before the animation starts; `motion-reduce:animate-none` respects the OS setting and
 * leaves a plain swap.
 */
const SLIDE: Record<"forward" | "back", string> = {
  forward:
    "animate-in fade-in-0 slide-in-from-right-8 fill-mode-both duration-300 motion-reduce:animate-none",
  back: "animate-in fade-in-0 slide-in-from-left-8 fill-mode-both duration-300 motion-reduce:animate-none",
};

function RequestBody({
  request,
  next,
  onApprove,
  onReject,
  onNext,
  onReturnFocus,
}: {
  request: AdvocateRegistration;
  next: AdvocateRegistration | null;
  onApprove: (request: AdvocateRegistration) => void;
  onReject: (request: AdvocateRegistration) => void;
  onNext: (request: AdvocateRegistration) => void;
  onReturnFocus: () => void;
}) {
  const [stage, setStage] = React.useState<Stage>("review");
  const [direction, setDirection] = React.useState<"forward" | "back">(
    "forward",
  );
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  /* Where the overlay lands on open — see `onOpenAutoFocus` below. */
  const factsRef = React.useRef<HTMLDivElement>(null);
  const previousStage = React.useRef<Stage>("review");

  function go(to: Stage) {
    setDirection(to === "review" ? "back" : "forward");
    setStage(to);
  }

  /**
   * Focus follows the stage.
   *
   * Into Reject it lands on the textarea, because writing the reason is the only thing
   * that stage is for. Into every other stage it lands on the header title, which has
   * just changed to say what the stage is — a keyboard officer hears the question or the
   * outcome, and a swapped body whose focus stayed on a button that no longer exists
   * would have dropped them on the dialog container instead. `previousStage` keeps this
   * from firing on arrival: the initial open keeps the dialog's own landing place.
   */
  React.useEffect(() => {
    if (previousStage.current === stage) return;
    previousStage.current = stage;
    if (stage === "reject") reasonRef.current?.focus();
    else titleRef.current?.focus();
  }, [stage]);

  const empty = reason.trim() === "";
  const noun = registrantNoun(request.registrantKind);
  const badge = STAGE_BADGE[stage];

  return (
    <ChromeDialogContent
      className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl md:h-[85dvh]"
      /* Radix focuses the first tabbable thing it finds. With the preview's header band
         gone (D15) that is the evidence well itself — it is a scroll container, so it is
         focusable — and the overlay opened with a 3px teal ring around the whole right
         column, which reads as a selected or errored state rather than as a starting
         point. The fact column takes it instead: it is what the officer reads first, it
         is the other scroll region, and WAI-ARIA APG allows a container when a dialog
         holds this much content. Focus still moves into the dialog and is still trapped
         there; only its landing place changed. */
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        factsRef.current?.focus();
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      {/* Title, state, and the one string the advocate can quote — and nothing else
          (brief D16). The name is **not** here: it is a value under verification, and a
          screen that prints it as the record's title has asserted it before the officer
          looked at the card. It is the first row of Identity instead. The header is the
          overlay's chrome — white, over the tinted stage below — so it reads as the fixed
          frame the stages move inside. */}
      <DialogHeader className="shrink-0 gap-2 border-b border-hairline p-6 pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="text-title-s font-semibold outline-none"
          >
            {STAGE_TITLE[stage]}
          </DialogTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <DialogDescription className="text-body-compact tabular-nums text-muted-foreground">
          {request.applicationNumber}
        </DialogDescription>
      </DialogHeader>

      {/* The stage. A tinted canvas under white cards — the scoped work canvas the order
          screen and the filing form already use (ui-craft §1.0), and the one place a
          tinted stage is sanctioned: the chrome above and below it stays white so the
          tint reads as the surface the work sits on, not as a grey dialog. Dark keeps
          `bg-background`, because `muted` is the raised step there and would invert the
          depth. `overflow-hidden` is what the slide moves inside; keyed on the stage so
          each one mounts fresh and plays its entrance. */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted dark:bg-background">
        <div
          key={stage}
          className={cn("flex h-full min-h-0 flex-col", SLIDE[direction])}
        >
          {stage === "review" ? (
            <ReviewStage request={request} factsRef={factsRef} />
          ) : stage === "reject" ? (
            <RejectStage
              request={request}
              reason={reason}
              touched={touched}
              reasonRef={reasonRef}
              onChange={(value) => {
                setReason(value);
                setTouched(true);
              }}
            />
          ) : stage === "approve" ? (
            <FocusedStage>
              <IdentityCard request={request} eyebrow="You are approving" />
            </FocusedStage>
          ) : (
            <SettledStage
              stage={stage}
              request={request}
              noun={noun}
              reason={reason}
            />
          )}
        </div>
      </div>

      {/* The footer is chrome too, so it is `bg-card` rather than the primitive's muted
          fill — under a muted stage the two would merge into one grey band. */}
      <DialogFooter className="mx-0 mb-0 shrink-0 border-hairline bg-card">
        {stage === "review" ? (
          <>
            {/* Soft destructive, not the solid. The DS reserves `destructive-solid` for a
                confirmed irreversible act, and a rejection here is reversible by design —
                `REG-23`: the advocate edits and resubmits, without limit. */}
            <Button
              type="button"
              variant="destructive"
              onClick={() => go("reject")}
            >
              Reject
            </Button>
            {/* The overlay's one teal button, on every stage that has one: the guarded
                act. Approval is where a credential is granted — the person can then act
                as an advocate on real §138 files — which is why there is no bulk path
                anywhere on this screen and why the photograph is opened one at a time. */}
            <Button type="button" onClick={() => go("approve")}>
              Approve
            </Button>
          </>
        ) : stage === "reject" ? (
          <>
            <Button type="button" variant="ghost" onClick={() => go("review")}>
              Back
            </Button>
            {/* "Confirm rejection", not "Reject" again: a second button with the same
                word as the one that got you here reads as nothing having happened
                (owner, 2026-09-11, on the approve pair). */}
            <Button
              type="button"
              variant="destructive"
              disabled={empty}
              onClick={() => {
                onReject(request);
                go("rejected");
              }}
            >
              Confirm rejection
            </Button>
          </>
        ) : stage === "approve" ? (
          <>
            <Button type="button" variant="ghost" onClick={() => go("review")}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                onApprove(request);
                go("approved");
              }}
            >
              Confirm approval
            </Button>
          </>
        ) : (
          <>
            {/* What is left of the queue, in the footer beside the button that opens it —
                not inside the card that reports this request's outcome. They are two
                different subjects, and the owner read them clubbed together on the render
                as exactly that (2026-09-11). The next request is **not** named by its
                application number: a serial the officer has never seen tells them
                nothing, and the button already says what pressing it will do. */}
            {next === null ? (
              <p className="text-body-compact text-muted-foreground sm:mr-auto sm:self-center">
                No more requests are waiting.
              </p>
            ) : null}
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            {next ? (
              <Button type="button" onClick={() => onNext(next)}>
                View next application
                <ArrowRightIcon data-icon="inline-end" aria-hidden />
              </Button>
            ) : null}
          </>
        )}
      </DialogFooter>
    </ChromeDialogContent>
  );
}

/* ───────────────────────────── stage: review ────────────────────────────── */

/**
 * The facts on the left, the evidence on the right, and below `md` the facts first —
 * they are what you read before you look at anything. Each column scrolls on its own once
 * there is a viewport to split, so a request on its fifth round does not push the
 * photograph off the bottom of the overlay.
 *
 * **The split is 3:2, not 1:1** (2026-09-11). The left column now holds comparison
 * tables — two values side by side, and one of them can be a name with four given names
 * in it — while the right holds one landscape card scan that stops gaining from width
 * long before the tables do. An even split is what had the owner reading the fact column
 * as cramped.
 *
 * `grid-rows-[auto_auto]` below `md` and a single `minmax(0,1fr)` row above it — the
 * recipe `ApproveCopyApplicationDialog` and `ApplicationReviewDialog` already use. Both
 * halves are load-bearing: stacked, the facts row must be `auto` or the left column
 * collapses to a 0px base behind the card's `min-h-96`; side by side, the row must be
 * `minmax(0,1fr)` to give the two columns the definite height that `md:overflow-y-auto`
 * and `height="fill"` resolve against.
 */
function ReviewStage({
  request,
  factsRef,
}: {
  request: AdvocateRegistration;
  factsRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rounds = rejectionRows(request);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_auto] gap-6 overflow-y-auto p-6 md:grid-cols-[3fr_2fr] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
      <div
        ref={factsRef}
        tabIndex={-1}
        className="flex min-w-0 flex-col gap-6 outline-none md:min-h-0 md:overflow-y-auto"
      >
        {/* Two groups and, on a request that has been sent back, a third. Every
            comparison is behind the row that announces it (D23), so an ordinary request
            is eight values and a photograph — and an exceptional one is eight values, a
            photograph, and a row worth clicking. */}
        <FactGroup label="Request" rows={requestRows(request)} />
        <FactGroup label="Identity" rows={identityRows(request)} />

        {rounds.length > 0 ? <EarlierRejections rounds={rounds} /> : null}
      </div>

      <EvidenceColumn request={request} />
    </div>
  );
}

/**
 * The evidence, and the fifth submitted value (brief D15). `REG-14` collects this
 * photograph for one purpose, so it takes the rest of the overlay's height rather than
 * sitting under the facts as a thumbnail — and it takes it **without a header band**.
 * Download and Full view are 40×40 icons on the well, which is `DocumentPreview`'s own
 * doing and not a second well hand-rolled here.
 *
 * `surface="card"`: on the tinted stage a sunken well is the stage's own tone with no
 * edge, so the photograph sits on a white sheet with a hairline instead — the same object
 * as the cards beside it, because it is the fifth attribute.
 */
function EvidenceColumn({ request }: { request: AdvocateRegistration }) {
  const noun = registrantNoun(request.registrantKind);
  return (
    <DocumentPreview
      variant="quiet"
      surface="card"
      className="min-h-96 md:min-h-0"
      height="fill"
      title={idPhotoLabel(request.registrantKind)}
      source={{
        kind: "composed",
        content: (
          <IdCardPhoto
            src={request.photo.src}
            alt={`Photograph of the ${
              request.registrantKind === "clerk" ? "clerk" : "Bar"
            } ID card uploaded with ${request.applicationNumber}`}
            noun={noun}
          />
        ),
      }}
      download={{
        href: request.photo.src,
        filename: request.photo.filename,
        label: `Download ${idPhotoLabel(request.registrantKind)}`,
      }}
    />
  );
}

/* ───────────────────────────── stage: reject ────────────────────────────── */

/**
 * One question, asked at the size of the act.
 *
 * The owner's note on the first build of this stage: *"the typography and UX design of
 * this text box and how this is a rejection workflow — it's not feeling like one… bring
 * attention to the fact that you are rejecting and you're leaving a comment. Not through
 * text exposition again, but through better layout and typography"* (2026-09-11).
 *
 * So the hierarchy does the telling. Who is being rejected sits at the top, quiet — a
 * `compact` identity card, because the officer has just read all of it on the previous
 * stage and needs only to know they are still on the same person. Under it the question
 * is a title-s heading in destructive ink with the DS's own destructive mark
 * beside it, and the box under *that* is deep enough to invite a paragraph rather than
 * a word. Nothing explains what a reason is for.
 *
 * The ink is the DS's third status treatment, and it is carried by a heading that says
 * "rejecting" — never colour alone.
 */
function RejectStage({
  request,
  reason,
  touched,
  reasonRef,
  onChange,
}: {
  request: AdvocateRegistration;
  reason: string;
  touched: boolean;
  reasonRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}) {
  const empty = reason.trim() === "";
  const id = `reject-${request.id}`;

  return (
    <FocusedStage>
      <IdentityCard request={request} compact />

      <StageCard className="gap-3">
        <Field data-invalid={touched && empty}>
          <FieldLabel htmlFor={id} className="gap-2">
            <CircleXIcon
              aria-hidden
              className="size-5 shrink-0 text-destructive-ink"
            />
            <span className="text-title-s font-semibold text-destructive-ink">
              Why are you rejecting this?
            </span>
          </FieldLabel>
          <Textarea
            id={id}
            ref={reasonRef}
            className="min-h-40 text-body"
            placeholder="e.g. The name on the Bar ID card is different from the name you typed. Please check and submit again."
            value={reason}
            onChange={(event) => onChange(event.target.value)}
          />
          {/* The gate, only once it has been tripped. Red on a box nobody has attempted
              yet reads as a scolding, and a line stating the rule before it is broken is
              the exposition this stage exists without. */}
          {touched && empty ? (
            <FieldError>Write a reason first.</FieldError>
          ) : null}
        </Field>
      </StageCard>
    </FocusedStage>
  );
}

/* ───────────────────────────── stage: settled ───────────────────────────── */

/**
 * The end of the request: one card, and nothing stacked beside it.
 *
 * The first build made this three cards under three caption labels — "Identity", "What
 * you wrote" — and the owner read the labels as the thing making it cheap: *"these kind
 * of subheadings is making this entire rejection and approval thing feel very cheap"*
 * (2026-09-11). They were right in a way worth writing down: a caption above a card
 * holding two rows is scaffolding around something too small to need it, and three of
 * them in a column is scaffolding pretending to be structure.
 *
 * So the settled state is **one object**: the outcome, a rule, who it was about, a rule,
 * and what was written. Hierarchy separates them, not headings.
 *
 * **The outcome is a heading, not a sentence with a name in it.** "Account created" and
 * "Reason sent to the advocate" are the same strings on every request; who it happened to
 * is the identity beneath, where a name is a value and can be scanned in the same place
 * every time (owner: *"calling out each name, is that scalable UI?"*).
 */
function SettledStage({
  stage,
  request,
  noun,
  reason,
}: {
  stage: "approved" | "rejected";
  request: AdvocateRegistration;
  noun: string;
  reason: string;
}) {
  const approved = stage === "approved";

  return (
    <FocusedStage>
      <StageCard flush>
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span
            aria-hidden
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              approved
                ? "bg-success-muted text-success-muted-foreground"
                : "bg-destructive-muted text-destructive-muted-foreground",
            )}
          >
            {approved ? (
              <CircleCheckIcon className="size-6" />
            ) : (
              <CircleXIcon className="size-6" />
            )}
          </span>
          {/* `role="status"` gets the outcome spoken: focus lands on the header title,
              which announces itself and nothing below it. */}
          <p
            role="status"
            className={cn(
              "text-title-s font-semibold text-balance",
              approved ? "text-success-ink" : "text-destructive-ink",
            )}
          >
            {approved ? "Account created" : `Reason sent to the ${noun}`}
          </p>
        </div>

        {/* Who it was about. Two facts, unlabelled, because a name and a registration
            number under an outcome need no caption to be read as the subject of it. */}
        <div className="flex flex-col gap-0.5 border-t border-hairline px-6 py-4">
          <p
            lang={request.fullNameLang}
            className="text-body font-semibold text-balance"
          >
            {request.fullName}
          </p>
          <p className="font-mono text-body-compact tabular-nums text-muted-foreground">
            {request.barRegistrationId}
          </p>
        </div>

        {approved ? null : (
          <blockquote className="border-t border-hairline px-6 py-4 text-body-compact whitespace-pre-line text-pretty">
            {reason}
          </blockquote>
        )}
      </StageCard>

      {/* The court has not built the act, so the screen does not mime it — said once, at
          the end, outside the card that carries the record's own facts. */}
      <p className="text-caption text-center text-pretty text-muted-foreground">
        {approved
          ? "Not part of this build — no account is opened and nobody is told."
          : "Not part of this build — the reason was not sent to anyone."}
      </p>
    </FocusedStage>
  );
}

/* ──────────────────────────── the two shapes ────────────────────────────── */

/**
 * A stage that asks one thing: a single centred column, vertically centred once there is
 * room for it.
 *
 * Every stage past Review takes this, so progressing through the overlay is visibly a
 * progression — the two-column review layout belongs to reading, and reading is done.
 */
function FocusedStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-xl flex-col gap-6 md:my-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * A white card on the tinted stage — the one container every group composes from.
 *
 * The DS `Card`, sized `sm` so its padding is the 16px a row wants, with the app's panel
 * edge (`border-hairline`) in place of the primitive's full `border-border`: on a tinted
 * stage the fill difference already separates the card, and the hairline is a soft edge
 * rather than a stroke (ui-craft §4). It lifts on hover and on focus-within the way the
 * product's other cards do (`companion-rail.tsx`), with `transition-shadow` so only the
 * thing that changes animates.
 */
function StageCard({
  className,
  flush = false,
  children,
}: {
  className?: string;
  /** The card's own padding is off; the children draw their own rules edge to edge. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "border-hairline transition-shadow hover:shadow-raised has-focus-visible:shadow-raised",
        flush && "gap-0 py-0",
      )}
    >
      {flush ? (
        children
      ) : (
        <CardContent className={cn("flex flex-col gap-4", className)}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Who this request is about, as the thing on the stage rather than a labelled table.
 *
 * The owner on the first build of the approve stage: *"this looks too timid. The whole
 * 'you are approving' is too small, and this looks like a plain table… better typography
 * to bring attention to what you are approving"* (2026-09-11). The answer is not a bigger
 * label — it is that **the person is the heading**. The name takes the title-s role, the
 * registration number sits under it in mono, and the contact details the officer may
 * still want are a quiet list under a rule.
 *
 * `compact` is the same object at reading weight, for a stage where the identity is
 * context rather than subject — the rejection composer, where the act is the focus.
 */
function IdentityCard({
  request,
  eyebrow,
  compact = false,
}: {
  request: AdvocateRegistration;
  /** A caption above the name, where the stage does not already say what it is doing. */
  eyebrow?: string;
  compact?: boolean;
}) {
  /* Name and number are the heading; whatever else the flow collected is the list. */
  const [, , ...rest] = identityRows(request);

  return (
    <StageCard flush>
      <div className="flex flex-col gap-1 px-4 py-4">
        {eyebrow ? (
          <p className="text-caption font-semibold text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <p
          lang={request.fullNameLang}
          className={cn(
            "text-balance",
            compact ? "text-body font-semibold" : "text-title-s font-semibold",
          )}
        >
          {request.fullName}
        </p>
        <p className="font-mono text-body-compact tabular-nums text-muted-foreground">
          {request.barRegistrationId}
        </p>
      </div>
      {compact || rest.length === 0 ? null : (
        <div className="border-t border-hairline px-4">
          <DescriptionList>
            {rest.map((row) => (
              <FactRowView key={row.id} row={row} />
            ))}
          </DescriptionList>
        </div>
      )}
    </StageCard>
  );
}

/**
 * A group's name, above whatever the group holds.
 *
 * The label is scaffolding and reads as scaffolding — `text-caption` muted — so the
 * values inside are what the eye lands on. A group that reports a finding takes the
 * warning ink and an icon, which is the one place semantic colour appears in the fact
 * column: the DS gives status three treatments and this is the ink one, never colour
 * without the words.
 */
function GroupHeading({ label }: { label: string }) {
  return (
    <h3 className="text-caption font-semibold text-muted-foreground">
      {label}
    </h3>
  );
}

/**
 * Shape one: terms and values, in a card.
 *
 * `DescriptionList` because that is the DS's named role for it — the Laws say
 * "Description list inside Card for a single record's key-value fields" — and because a
 * two-column table with no header is a description list wearing a table's markup.
 */
function FactGroup({ label, rows }: { label: string; rows: FactRow[] }) {
  return (
    <section className="flex flex-col gap-2">
      <GroupHeading label={label} />
      <StageCard className="gap-0">
        <DescriptionList>
          {rows.map((row) => (
            <FactRowView key={row.id} row={row} />
          ))}
        </DescriptionList>
      </StageCard>
    </section>
  );
}

/** Plain at rest; the exception gets the ink. The queue cell's own map (brief D6). */
const toneClass: Record<WaitTone, string> = {
  plain: "",
  warning: "text-warning-ink",
  destructive: "text-destructive-ink",
};

/**
 * How a value is set.
 *
 * `email` gets `break-all` alone among the four: an address has no space in it, so normal
 * wrapping has nowhere to break and the value runs out of the card's right edge. A name
 * wraps on its spaces and a Bar ID is short, so neither needs this and neither should
 * have it — a mid-syllable break in a Malayalam name is a worse read than a wrapped line.
 */
const formatClass: Record<RowFormat, string> = {
  text: "",
  code: "font-mono tabular-nums",
  figure: "tabular-nums",
  email: "break-all",
};

/**
 * One fact.
 *
 * A term, a value, and — on a rejection round — the date it belongs to. Nothing else
 * attaches here beyond a `detail` the row opens (D23); the comparison itself is a
 * `ComparisonTable`, which is the whole point of
 * having two shapes instead of one row that grows a treatment per scenario.
 */
function FactRowView({ row }: { row: FactRow }) {
  const value = (
    <span
      lang={row.valueLang}
      className={cn(
        "block min-w-0 whitespace-pre-line",
        formatClass[row.format],
        row.tone && toneClass[row.tone],
      )}
    >
      {row.value}
    </span>
  );

  if (row.detail) {
    /* The finding opens where it is stated (D23) — and the table it opens takes the
       **card's** width, not the value column's. Nested inside the `dd` it was 200px wide
       and clipped its own second column on the render, which is the shape of a table
       being treated as an annotation again. So the disclosure wraps the row: the term and
       the value keep the grid every other row uses, and the panel below them spans both
       tracks. A `div` around a `dt`/`dd` pair is what `DescriptionRow` already is, so the
       list stays a list. */
    return (
      <Collapsible className="border-b border-hairline last:border-b-0">
        <ReviewRow term={row.term} className="border-0">
          {/* `min-h-10` keeps the DS's 40px floor on a target an officer reaches on a
              tablet; `w-fit` keeps the chevron against the words rather than parked at
              the far edge of the column. */}
          <CollapsibleTrigger className="group/detail flex min-h-10 w-fit items-center gap-1.5 rounded-lg text-left outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring">
            {value}
            <ChevronDownIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/detail:rotate-180"
            />
          </CollapsibleTrigger>
        </ReviewRow>
        <CollapsibleContent className="pb-3">
          <ComparisonTable block={row.detail} />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    /* Hairline, not the DS row default: `border-border` between rows inside a card would
       be the loudest mark in the overlay (ui-craft §1.1). */
    <ReviewRow term={row.term} className="border-hairline">
      {value}
      {row.note ? (
        <span className="mt-1 block text-caption tabular-nums text-muted-foreground">
          {row.note}
        </span>
      ) : null}
    </ReviewRow>
  );
}

/**
 * Shape two: two values side by side, under headers naming where each came from.
 *
 * This is what the struck-through "Was …" line and the "Bar Council of Kerala: …" line
 * became. A strikethrough says a value is gone without saying what replaced it, and it
 * puts both values in one cell of one column — the owner's objection, exactly: *"it
 * should clearly show what was before and after… all in a clean tabular format so it's
 * scannable"* (2026-09-11).
 *
 * It is the **product's own table treatment** (`chrome/table-plate`), the one the queue
 * behind this overlay wears, so an officer who scans the list and then opens a request
 * reads the same grid twice. That was the other half of the note — *"everywhere I am
 * seeing a new unique way of this being implemented… UI should be scalable"* — and the
 * answer to it is not a new component but the shared one.
 *
 * `hover: false`: nothing in these rows is live, and a fill that lights under the pointer
 * promises an act the row does not perform (`table-plate`).
 */
function ComparisonTable({ block }: { block: ComparisonBlock }) {
  const span = block.columns.length + 1;

  return (
    <>
      {/* Two values plus a term do not fit 375px, and the `Card` clips what overflows
          it — measured on the render, the register's answer was cut off the right edge
          and unreachable. So the table scrolls inside its own container, the way the
          queue's does, and the page never scrolls sideways. */}
      <div className="min-w-0 overflow-x-auto">
        <Table className="w-full border-separate border-spacing-0 text-body-compact">
          <TableHeader>
            {/* The card insets this table, so the header strip is a well and rounds
                itself rather than running edge to edge (`TABLE_HEAD_ROW`, ui-craft §4). */}
            <TableRow className={TABLE_HEAD_ROW}>
              <TableHead className={cn(TABLE_HEAD, "w-28")}>
                {/* The corner cell of a comparison table names nothing — the row's own
                    term is the label. Named for a screen reader, which reads a header
                    cell for every column it announces. */}
                <span className="sr-only">Detail</span>
              </TableHead>
              {block.columns.map((column) => (
                <TableHead
                  key={column}
                  className={cn(TABLE_HEAD, "whitespace-nowrap")}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className={tableBodyClass({ hover: false })}>
            {/* `border-separate` has no per-edge row gap, so the gap under the header
                well is one inert row held out of the accessibility tree. */}
            <tr aria-hidden="true">
              <td colSpan={span} className="h-2 p-0" />
            </tr>
            {block.rows.map((row) => (
              <TableRow
                key={row.id}
                className={tableRowClass({ hover: false })}
              >
                <TableCell
                  className={cn(TABLE_CELL, "align-top text-muted-foreground")}
                >
                  {row.term}
                </TableCell>
                {row.values.map((value, index) => (
                  <TableCell
                    key={block.columns[index]}
                    lang={value.lang}
                    className={cn(
                      TABLE_CELL,
                      "align-top",
                      formatClass[value.format],
                      value.absent && "text-muted-foreground",
                    )}
                  >
                    {value.text}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/**
 * Every round this request has already been refused — newest first, all of them the same
 * row (brief D7).
 *
 * The newest is always visible, because the question a resubmission asks is "did they fix
 * what I said last time". The rest collapse, so the group cannot grow without bound on a
 * request that has come back five times (`REG-23` sets no limit). The `Collapsible`
 * governs how many are visible; it does not change how any of them look.
 *
 * There is no per-round "Rejected" chip: every round in this group was a rejection — an
 * approved request leaves the queue — so the chip would mark the norm. The group's name
 * carries it.
 */
function EarlierRejections({ rounds }: { rounds: FactRow[] }) {
  const [newest, ...older] = rounds;

  return (
    <section className="flex flex-col gap-2">
      <GroupHeading label="Earlier rejections" />
      <StageCard className="gap-0">
        <DescriptionList>
          <FactRowView row={newest} />
        </DescriptionList>
        {older.length > 0 ? (
          <Collapsible>
            {/* Styled off `TaskDetailPanel`'s history disclosure — the same job: a muted
                caption that darkens on hover, one chevron that turns, and the DS focus
                ring. `min-h-10` keeps the DS's 40px floor on a target an officer reaches
                on a tablet. */}
            <CollapsibleTrigger className="group/earlier flex min-h-10 w-fit items-center gap-1.5 rounded-lg text-left text-caption text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring">
              {older.length === 1
                ? "1 earlier round"
                : `${older.length} earlier rounds`}
              <ChevronDownIcon
                aria-hidden
                className="size-4 shrink-0 transition-transform group-data-[state=open]/earlier:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <DescriptionList>
                {older.map((row) => (
                  <FactRowView key={row.id} row={row} />
                ))}
              </DescriptionList>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </StageCard>
    </section>
  );
}

/**
 * The photograph itself.
 *
 * It is an `<img>` inside `DocumentPreview`'s composed well rather than the well's `src`
 * branch, which renders an `<iframe>`. An iframe reports neither load nor failure, and
 * both states are ones this screen has to answer: a card photograph is a file coming down
 * a court's connection, so it is sometimes slow, and sometimes it is not there.
 *
 * A failure says so in words and keeps Download reachable. **It does not block the
 * decision**: the officer may hold the card another way, and an empty box that left them
 * to infer what happened would be worse than a sentence.
 */
function IdCardPhoto({
  src,
  alt,
  noun,
}: {
  src: string;
  alt: string;
  noun: string;
}) {
  const [status, setStatus] = React.useState<"loading" | "ready" | "failed">(
    "loading",
  );

  return (
    /* `flex-1` so the card scan takes the height the frame gives it rather than sitting
       small in the middle of a tall white column — the other half of the owner's note
       about the evidence section looking empty (2026-09-11). */
    <div className="flex min-h-64 flex-1 flex-col justify-center">
      {status === "failed" ? (
        <div className="m-auto flex flex-col items-center gap-3 py-8 text-center">
          <ImageOffIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="text-body font-medium">
            This photo could not be opened
          </p>
          <p className="text-body-compact text-muted-foreground">
            Try downloading it. You can still decide this request — or reject it
            and ask the {noun} to upload the card again.
          </p>
        </div>
      ) : null}
      {/* The well keeps its height while the file is on its way. A well that collapses
          and then jumps to full height moves the decision under the officer's cursor. */}
      {status === "loading" ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- a served court document,
          not a site asset: it has no build-time dimensions and must not be re-encoded. */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("failed")}
        className={cn(
          "m-auto block h-auto max-h-full w-auto max-w-full rounded-md object-contain",
          status !== "ready" && "hidden",
        )}
      />
    </div>
  );
}
