"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ImageOffIcon,
  SendIcon,
  UserCheckIcon,
} from "lucide-react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MARK_LABEL,
  identityRows,
  idPhotoLabel,
  registrantNoun,
  rejectionRows,
  requestRows,
  sourceLine,
  type AdvocateRegistration,
  type RegistrationRow,
  type RowFormat,
  type RowMark,
  type WaitTone,
} from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

/**
 * One registration request, verified and then approved or rejected — the whole decision,
 * without leaving the queue.
 *
 * The same overlay as `ApproveCopyApplicationDialog` and `ReschedulingRequestDialog`,
 * because it is the same job: an application somebody filed, in front of staff who have
 * to say yes or no. What differs is what the overlay is *for*. Handover `REG-14` says the
 * photograph of the Bar ID card exists **so the scrutiny officer can verify** the typed
 * claim, so the body is built as that comparison and nothing else: the attributes on the
 * left, the card on the right, at the same time, one saccade apart.
 *
 * **One overlay, five stages, no dialog on a dialog** (owner, design-mode round
 * 2026-09-10). The decision used to open an `AlertDialog` over this one for Approve and
 * swap a composer into the column for Reject; both now happen *inside* the overlay as the
 * next stage of the same object, which slides in from the right — the officer watches the
 * request move forward rather than a second window land on top of it. Review → Reject or
 * Approve → a settled end state that says what happened in words and an icon, and offers
 * the next request in the queue so the officer can clear it without going back to the
 * list for every row. Back slides the previous stage in from the left. Motion is one
 * short entrance per stage change, and none under `prefers-reduced-motion`.
 *
 * **Every fact here is a value in a named slot** (brief D2). One row —
 * `term · value · source line · previous line · marks` — renders the request's own
 * metadata, the four submitted values and every rejection round alike, and the machine's
 * answer about an attribute is a member of a closed six-value enum rather than a sentence
 * this component writes. Nothing on this screen is generated from a status: if you find
 * yourself writing a sentence about what the data means, the model is missing a slot.
 *
 * **Only what the registration flow collects.** Five values — full name, Bar registration
 * ID, the OTP-verified mobile, an email if one was given, and the photograph — which is
 * four rows and one column. Address, ID type, Aadhaar proof and map location are not shown
 * as blank rows; handover §5.1 says they are never collected.
 *
 * **Approve and Reject perform no act.** Both drop the row from the demo queue — see
 * `lib/employee/register-advocates.ts`. No account is opened, no access is granted or
 * refused, no reason is sent and nobody is told, and the end states say so.
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
 * The request's own state, said once in the header. It is `Pending approval` until the
 * act, then the act — the chip is the one thing on the overlay that visibly changes
 * state, which is what the stage progression exists to show.
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
  const attributesRef = React.useRef<HTMLDivElement>(null);
  const previousStage = React.useRef<Stage>("review");

  function go(to: Stage) {
    setDirection(to === "review" ? "back" : "forward");
    setStage(to);
  }

  /**
   * Focus follows the stage.
   *
   * Into Reject it lands on the textarea, because writing the reason is the only thing
   * that stage is for. Into every other stage it lands on the header's title, which has
   * just changed to say what the stage is — a keyboard officer hears the question or the
   * outcome, and a swapped body whose focus stayed on a button that no longer exists would
   * have dropped them on the dialog container instead. `previousStage` keeps this from
   * firing on arrival: the initial open keeps the dialog's own landing place.
   */
  React.useEffect(() => {
    if (previousStage.current === stage) return;
    previousStage.current = stage;
    if (stage === "reject") reasonRef.current?.focus();
    else titleRef.current?.focus();
  }, [stage]);

  const empty = reason.trim() === "";
  const noun = registrantNoun(request.registrantKind);
  const settled = stage === "rejected" || stage === "approved";
  const badge = STAGE_BADGE[stage];

  return (
    <ChromeDialogContent
      className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh]"
      /* Radix focuses the first tabbable thing it finds. With the preview's header band
         gone (D15) that is the evidence well itself — it is a scroll container, so it is
         focusable — and the overlay opened with a 3px teal ring around the whole right
         column, which reads as a selected or errored state rather than as a starting
         point. The attribute column takes it instead: it is what the officer reads
         first, it is the other scroll region, and WAI-ARIA APG allows a container when a
         dialog holds this much content. Focus still moves into the dialog and is still
         trapped there; only its landing place changed. */
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        attributesRef.current?.focus();
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
          overlay's chrome — white, over the tinted stage below — so the title reads as the
          fixed frame the stages move inside. */}
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
            <ReviewStage request={request} attributesRef={attributesRef} />
          ) : stage === "reject" ? (
            <RejectStage
              request={request}
              noun={noun}
              reason={reason}
              touched={touched}
              reasonRef={reasonRef}
              onChange={(value) => {
                setReason(value);
                setTouched(true);
              }}
            />
          ) : stage === "approve" ? (
            <ApproveStage request={request} noun={noun} />
          ) : (
            <SettledStage
              stage={stage}
              request={request}
              noun={noun}
              reason={reason}
              next={next}
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
            <Button
              type="button"
              variant="destructive"
              disabled={empty}
              onClick={() => {
                onReject(request);
                go("rejected");
              }}
            >
              Reject request
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
              Approve
            </Button>
          </>
        ) : (
          <>
            {settled && next === null ? (
              <p className="text-body-compact text-muted-foreground sm:mr-auto sm:self-center">
                No more requests are waiting.
              </p>
            ) : null}
            {/* The DS close, in the footer: the same `onOpenChange(false)` and the same
                `onCloseAutoFocus` as the corner X, so focus goes back to the search box
                either way. */}
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            {next ? (
              /* The conveyor — offered here and only here, once the request in hand is
                 settled. It opens the next request in this same overlay; `key` on the body
                 puts it back at Review. */
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
 * Attributes on the left, evidence on the right, and below `md` the attributes first —
 * they are what you read before you look at anything. Each column scrolls on its own
 * once there is a viewport to split, so a request on its fifth round does not push the
 * photograph off the bottom of the overlay.
 *
 * `grid-rows-[auto_auto]` below `md` and a single `minmax(0,1fr)` row above it — the
 * recipe `ApproveCopyApplicationDialog` and `ApplicationReviewDialog` already use, with
 * the row split into two columns instead of stacked. Both halves are load-bearing:
 * stacked, the attribute row must be `auto` or the left column collapses to a 0px base
 * behind the card's `min-h-96`; side by side, the row must be `minmax(0,1fr)` to give
 * the two columns the definite height that `md:overflow-y-auto` and `height="fill"`
 * resolve against.
 */
function ReviewStage({
  request,
  attributesRef,
}: {
  request: AdvocateRegistration;
  attributesRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rounds = rejectionRows(request);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_auto] gap-6 overflow-y-auto p-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
      <div
        ref={attributesRef}
        tabIndex={-1}
        className="flex min-w-0 flex-col gap-6 outline-none md:min-h-0 md:overflow-y-auto"
      >
        <AttributeGroup label="Request">
          <DescriptionList>
            {requestRows(request).map((row) => (
              <AttributeRow key={row.id} row={row} />
            ))}
          </DescriptionList>
        </AttributeGroup>

        <AttributeGroup label="Identity">
          <DescriptionList>
            {identityRows(request).map((row) => (
              <AttributeRow key={row.id} row={row} />
            ))}
          </DescriptionList>
        </AttributeGroup>

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
 * edge, so the photograph sits on a white sheet with a hairline instead — the same
 * object as the attribute cards beside it, because it is the fifth attribute.
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
 * The reason, written against the evidence.
 *
 * The composer takes the attribute column's place and the photograph stays: the sentence
 * the officer is about to write is usually about the card — "the name on the card is
 * different" — and a stage that hid it would have them writing from memory. Under the
 * composer, the identity rows again, so what is being refused is on the same screen as
 * why.
 *
 * Rejecting is a two-beat act inside one overlay: arm it, then write why. The reason
 * *is* the friction, and a confirmation on top of a typed sentence would be a double
 * gate on the recoverable half of the decision.
 */
function RejectStage({
  request,
  noun,
  reason,
  touched,
  reasonRef,
  onChange,
}: {
  request: AdvocateRegistration;
  noun: string;
  reason: string;
  touched: boolean;
  reasonRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}) {
  const empty = reason.trim() === "";

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_auto] gap-6 overflow-y-auto p-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
      <div className="flex min-w-0 flex-col gap-6 md:min-h-0 md:overflow-y-auto">
        <StageCard>
          <Field data-invalid={touched && empty}>
            {/* Written for the person who will read it, not for the officer. The
                documented failure in this role is one-word remarks that send an advocate
                to the court counter to decode them (`scrutiny/flag-composer.tsx`), and a
                label naming the reader is the cheapest thing that answers it. Visible,
                never a placeholder alone.

                This sentence is the one piece of free text the overlay keeps: `REG-22`
                says the reason is the officer's own words, which is user data in a fixed
                slot. */}
            <FieldLabel htmlFor={`reject-${request.id}`} className="text-body">
              Why are you rejecting this? The {noun} will read this.
            </FieldLabel>
            <Textarea
              id={`reject-${request.id}`}
              ref={reasonRef}
              className="max-h-64 min-h-32"
              placeholder="e.g. The name on the Bar ID card is different from the name you typed. Please check and submit again."
              value={reason}
              onChange={(event) => onChange(event.target.value)}
            />
            {/* The gate, said out loud. A description on arrival and an error only once
                the officer has typed and taken it back out: red on a box nobody has
                attempted yet reads as a scolding, and a disabled button is not focusable,
                so a tooltip on it would be unreachable for exactly the people who need
                the reason. */}
            {empty ? (
              touched ? (
                <FieldError>
                  Say why — the {noun} can only fix what they can read.
                </FieldError>
              ) : (
                <FieldDescription>
                  Reject request is available once you have written the reason.
                </FieldDescription>
              )
            ) : null}
          </Field>
        </StageCard>

        <AttributeGroup label="Identity">
          <DescriptionList>
            {identityRows(request).map((row) => (
              <AttributeRow key={row.id} row={row} />
            ))}
          </DescriptionList>
        </AttributeGroup>
      </div>

      <EvidenceColumn request={request} />
    </div>
  );
}

/* ───────────────────────────── stage: approve ───────────────────────────── */

/**
 * What approval grants, and what is being approved — and nothing more.
 *
 * The legacy confirmation claimed "advocate details cannot be modified once registration
 * request is accepted"; the handover says no such thing, and asserting an irreversibility
 * nobody has confirmed would be the screen inventing product (`register-advocates.md`
 * §12.2). So it states what approval *grants* — the access `REG-24` withholds while the
 * request is pending — and lists the identity the officer is vouching for, one last time.
 */
function ApproveStage({
  request,
  noun,
}: {
  request: AdvocateRegistration;
  noun: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-lg flex-col gap-6 md:my-auto">
        <StageCard>
          <p className="text-body">
            <span lang={request.fullNameLang}>{request.fullName}</span> gets
            access to their {noun} account, which is closed to them while this
            request is pending.
          </p>
        </StageCard>
        <AttributeGroup label="You are approving">
          <DescriptionList>
            {identityRows(request).map((row) => (
              <AttributeRow key={row.id} row={row} />
            ))}
          </DescriptionList>
        </AttributeGroup>
        <BuildCaveat>
          Not part of this build — no account is opened and nobody is told.
        </BuildCaveat>
      </div>
    </div>
  );
}

/* ───────────────────────────── stage: settled ───────────────────────────── */

/**
 * The end of the request — said in words, marked with an icon, and closed.
 *
 * There is no illustration pack yet, so the mark is an icon in a tinted disc: the DS's
 * `success-muted` pair for an approval, `info-muted` for a rejection *sent* — the
 * rejection is not a failure of anything, it is a message on its way, which is what the
 * plane says. Under it, the one fact that is new (who now has access; what was sent), a
 * recap of the identity the decision was about, and the caveat that none of it has
 * happened outside this screen.
 */
function SettledStage({
  stage,
  request,
  noun,
  reason,
  next,
}: {
  stage: "approved" | "rejected";
  request: AdvocateRegistration;
  noun: string;
  reason: string;
  next: AdvocateRegistration | null;
}) {
  const approved = stage === "approved";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto p-6">
      <div className="flex w-full max-w-lg flex-col gap-6 md:my-auto">
        <StageCard className="items-center text-center">
          <span
            aria-hidden
            className={cn(
              "flex size-14 items-center justify-center rounded-full",
              approved
                ? "bg-success-muted text-success-muted-foreground"
                : "bg-info-muted text-info-muted-foreground",
            )}
          >
            {approved ? (
              <UserCheckIcon className="size-7" />
            ) : (
              <SendIcon className="size-7" />
            )}
          </span>
          <div className="flex flex-col gap-2">
            {/* `role="status"` gets the outcome spoken: focus lands on the header title,
                which announces itself and nothing below it. */}
            <p role="status" className="text-body font-medium text-balance">
              {approved ? (
                <>
                  <span lang={request.fullNameLang}>{request.fullName}</span>{" "}
                  now has access to their {noun} account.
                </>
              ) : (
                <>
                  Your reason has been sent to{" "}
                  <span lang={request.fullNameLang}>{request.fullName}</span>.
                  They can correct the request and submit it again.
                </>
              )}
            </p>
            {next ? (
              <p className="text-body-compact text-pretty text-muted-foreground">
                The next request in the queue is{" "}
                <span className="tabular-nums">{next.applicationNumber}</span>.
              </p>
            ) : null}
          </div>
          <BuildCaveat>
            {approved
              ? "Not part of this build — no account is opened and nobody is told."
              : "Not part of this build — the reason was not sent to anyone."}
          </BuildCaveat>
        </StageCard>

        {approved ? null : (
          <AttributeGroup label="What you wrote">
            <blockquote className="text-body-compact whitespace-pre-line text-pretty">
              {reason}
            </blockquote>
          </AttributeGroup>
        )}

        {/* Who this was about — the two rows that identify a person, so the settled state
            can be read on its own once the list behind it has moved on. */}
        <AttributeGroup label="Identity">
          <DescriptionList>
            {identityRows(request)
              .slice(0, 2)
              .map((row) => (
                <AttributeRow key={row.id} row={row} />
              ))}
          </DescriptionList>
        </AttributeGroup>
      </div>
    </div>
  );
}

/* ───────────────────────────── the one row ──────────────────────────────── */

/** Plain at rest; the exception gets the ink. The queue cell's own map (brief D6). */
const waitClass: Record<WaitTone, string> = {
  plain: "",
  warning: "text-warning-ink",
  destructive: "text-destructive-ink",
};

/**
 * How a value is set.
 *
 * `email` gets `break-all` alone among the four: an address has no space in it, so normal
 * wrapping has nowhere to break and the value runs out of the card's right edge in the
 * two-column layout. A name wraps on its spaces and a Bar ID is short, so neither needs
 * this and neither should have it — a mid-syllable break in a Malayalam name is a worse
 * read than a wrapped line.
 */
const formatClass: Record<RowFormat, string> = {
  text: "",
  code: "font-mono tabular-nums",
  figure: "tabular-nums",
  email: "break-all",
};

/**
 * The two marks, and the treatment each takes.
 *
 * `Differs` is `warning`, **never** `destructive`: a register holding a different name is
 * a finding that needs a human to look at a photograph, not a verdict, and the loud
 * treatment would have the machine reject before anybody looked at the card (the lesson
 * `scrutiny/flag-composer.tsx` already records). `Changed` is neutral — `REG-18` says an
 * edit happened, which is a fact and not a status.
 *
 * Both carry **words**, so no finding is ever colour alone (DS Laws).
 */
const markVariant: Record<RowMark, "warning" | "secondary"> = {
  differs: "warning",
  changed: "secondary",
};

/**
 * One fact — and the only row on this screen.
 *
 * Request metadata, the four submitted attributes and every rejection round render through
 * this component. Adding a sixth attribute or a fifth register answer costs a row of data
 * in `lib/employee/register-advocates.ts`; it costs nothing here.
 *
 * Nothing below composes a sentence. The source line is two slots printed with a colon
 * between them; the previous line is `REG-18`'s own two shapes; the marks are looked up
 * from a closed set of two.
 */
function AttributeRow({ row }: { row: RegistrationRow }) {
  const line = sourceLine(row.source);

  return (
    /* Hairline, not the DS row default: `border-border` between rows inside a card would
       be the loudest mark in the overlay (ui-craft §1.1). */
    <ReviewRow term={row.term} className="border-hairline">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          lang={row.valueLang}
          className={cn(
            "min-w-0",
            formatClass[row.format],
            row.tone && waitClass[row.tone],
          )}
        >
          {row.value}
        </span>
        {row.marks.map((mark) => (
          <Badge key={mark} variant={markVariant[mark]}>
            {MARK_LABEL[mark]}
          </Badge>
        ))}
      </div>

      {/* `{source}: {answer}` — the authority's reading of *this* attribute, on the
          attribute. No line at all means nothing checks this value, which is why the
          absent slot is never filled with a dash. */}
      {line ? (
        <RowNote>
          {line.source}
          {": "}
          {/* The register's answer carries the register's own tag, never the claimant's:
              the two strings are separate answers and need not share a script, and on a
              `differs` row borrowing the claimant's tag would be read aloud as
              agreement (ACCESSIBILITY §13). */}
          <span lang={line.answerLang}>{line.answer}</span>
        </RowNote>
      ) : null}

      {row.previous ? (
        <RowNote>
          {row.previous.was === null ? (
            "Added at first login"
          ) : (
            <>
              {"Was "}
              <span
                className={cn("line-through", formatClass[row.format])}
              >
                {row.previous.was}
              </span>
            </>
          )}
        </RowNote>
      ) : null}

      {row.note ? <RowNote>{row.note}</RowNote> : null}
    </ReviewRow>
  );
}

/** Every sub-line under a value looks the same, whatever fact it carries. */
function RowNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-caption tabular-nums text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * A white card on the tinted stage — the one container every stage composes from.
 *
 * The DS `Card`, sized `sm` so its padding is the 16px an attribute row wants, with the
 * app's panel edge (`border-hairline`) in place of the primitive's full `border-border`:
 * on a tinted stage the fill difference already separates the card, and the hairline is a
 * soft edge rather than a stroke (ui-craft §4). It lifts on hover and on focus-within the
 * way the product's other cards do (`companion-rail.tsx`) — the owner's ask — with
 * `transition-shadow` so only the thing that changes animates.
 */
function StageCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      size="sm"
      className="border-hairline transition-shadow hover:shadow-raised has-focus-visible:shadow-raised"
    >
      <CardContent className={cn("flex flex-col gap-4", className)}>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * A group of rows in a card, with the group's name above it.
 *
 * The label is scaffolding and reads as scaffolding — `text-caption` muted, so the values
 * inside are what the eye lands on.
 */
function AttributeGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-caption font-semibold text-muted-foreground">
        {label}
      </h3>
      <StageCard className="gap-0">{children}</StageCard>
    </section>
  );
}

/**
 * The court has not built the act, so the screen does not mime it — said at the moment of
 * the act and again at the end, rather than left for the officer to discover.
 */
function BuildCaveat({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption text-center text-pretty text-muted-foreground">
      {children}
    </p>
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
function EarlierRejections({ rounds }: { rounds: RegistrationRow[] }) {
  const [newest, ...older] = rounds;

  return (
    <AttributeGroup label="Earlier rejections">
      <DescriptionList>
        <AttributeRow row={newest} />
      </DescriptionList>
      {older.length > 0 ? (
        <Collapsible>
          {/* Styled off `TaskDetailPanel`'s history disclosure
              (`components/tasks/task-detail-panel.tsx`) — the same job: a muted caption
              that darkens on hover, one chevron that turns, and the DS focus ring.
              `w-fit` rather than that one's full-width `justify-between`, because this
              label is a phrase in a narrow column and a chevron parked at the far edge
              would lose touch with it. `min-h-10` keeps the DS's 40px floor on a target
              an officer reaches on a tablet. */}
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
                <AttributeRow key={row.id} row={row} />
              ))}
            </DescriptionList>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </AttributeGroup>
  );
}

/**
 * The photograph itself.
 *
 * It is an `<img>` inside `DocumentPreview`'s composed well rather than the well's `src`
 * branch, which renders an `<iframe>`. An iframe reports neither load nor failure, and
 * both states are ones this screen has to answer: a card photograph is a file coming down
 * a court's connection, so it is sometimes slow, and sometimes it is not there. The well
 * and its two actions are still `DocumentPreview`'s — only the element inside the well
 * changed.
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
    <div className="flex min-h-64 flex-col justify-center">
      {status === "failed" ? (
        <div className="m-auto flex flex-col items-center gap-3 py-8 text-center">
          <ImageOffIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="text-body font-medium">This photo could not be opened</p>
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
          "m-auto block h-auto max-w-full rounded-md",
          status !== "ready" && "hidden",
        )}
      />
    </div>
  );
}
