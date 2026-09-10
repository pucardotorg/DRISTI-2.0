"use client";

import * as React from "react";
import { ChevronDownIcon, ImageOffIcon } from "lucide-react";

import {
  ChromeAlertDialogContent,
  ChromeDialogContent,
} from "@/components/chrome/app-chrome";
import { DocumentPreview } from "@/components/cases/document-preview";
import { ReviewRow } from "@/components/cases/filing-form-shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DescriptionList } from "@/components/ui/description-list";
import {
  Dialog,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  currentRound,
  earlierRejections,
  editFor,
  formatRegistrationLongDate,
  idPhotoLabel,
  latestRejection,
  registrantNoun,
  registrationIdLabel,
  rejectionDay,
  submissionDay,
  type AdvocateRegistration,
  type BarCouncilLookup,
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
 * claim, so the body is built as that comparison and nothing else: the claim on the left,
 * the card on the right, at the same time, one saccade apart. The legacy screen put the
 * two furthest from each other and six dead fields in between.
 *
 * **Only what the registration flow collects.** Full name, Bar registration ID, the
 * OTP-verified mobile, an email if one was given, and the photograph. Address, ID type,
 * Aadhaar proof and map location are not shown as blank rows — handover §5.1 says they
 * are never collected, and a row reading "—" would teach the officer the data is missing
 * rather than absent.
 *
 * **Approve and Reject perform no act.** Both drop the row from the demo queue and close —
 * see `lib/employee/register-advocates.ts`. No account is opened, no access is granted or
 * refused, no reason is sent and nobody is told.
 */
export function RegisterAdvocateDialog({
  request,
  onOpenChange,
  onApprove,
  onReject,
  onReturnFocus,
}: {
  request: AdvocateRegistration | null;
  onOpenChange: (request: AdvocateRegistration | null) => void;
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
        /* Keyed on the request so opening a second one starts fresh rather than
           inheriting the last one's scroll position — or, worse, a rejection reason typed
           about somebody else. */
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
  request: AdvocateRegistration;
  onApprove: (request: AdvocateRegistration) => void;
  onReject: (request: AdvocateRegistration) => void;
  onReturnFocus: () => void;
}) {
  /* Rejecting is a two-beat act inside one overlay: arm it, then write why. It is not a
     second dialog — the reason *is* the friction, and a confirmation on top of a typed
     sentence would be a double gate on the recoverable half of the decision. */
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const reasonRef = React.useRef<HTMLTextAreaElement>(null);
  /* The button that arms the composer, so cancelling can put focus back on it. */
  const rejectRef = React.useRef<HTMLButtonElement>(null);
  const wasRejecting = React.useRef(false);

  /**
   * Focus follows the composer in and back out again.
   *
   * In: the textarea, because writing the reason is the only thing the second beat is
   * for. Out: the `Reject` button that armed it — cancelling unmounts the control that
   * held focus, and a dropped focus lands on the dialog container, which puts a keyboard
   * officer back at the top of a two-column overlay to tab down to where they were.
   *
   * `wasRejecting` is what keeps this from firing on arrival: on mount the composer has
   * never been open, so there is nothing to come back from and nothing to steal focus
   * from the dialog's own opening.
   */
  React.useEffect(() => {
    if (rejecting) {
      reasonRef.current?.focus();
    } else if (wasRejecting.current) {
      rejectRef.current?.focus();
    }
    wasRejecting.current = rejecting;
  }, [rejecting]);

  const empty = reason.trim() === "";
  const noun = registrantNoun(request.registrantKind);
  const latest = latestRejection(request);
  const earlier = earlierRejections(request);

  return (
    <ChromeDialogContent
      className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh]"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-title-s font-semibold">
            Review registration request
          </DialogTitle>
          {/* The request's own state, said once, here. The queue behind this overlay is
              entirely pending, so a column repeating it fourteen times would carry no
              information — the convention the other court-side review overlays already
              set, in the same `warning` variant. */}
          <Badge variant="warning">Pending approval</Badge>
        </div>
        <DialogDescription className="text-body-compact text-muted-foreground">
          <span className="tabular-nums">{request.applicationNumber}</span>
          {" · "}
          <span lang={request.fullNameLang}>{request.fullName}</span>
        </DialogDescription>
      </DialogHeader>
      <Separator />

      {/* Claim on the left, evidence on the right, and below `md` the claim first — it is
          what you read before you look at anything. Each column scrolls on its own once
          there is a viewport to split, so a request on its fifth round does not push the
          photograph off the bottom of the overlay. */}
      {/* `grid-rows-[auto_auto]` below `md` and a single `minmax(0,1fr)` row above it —
          the recipe `ApproveCopyApplicationDialog` and `ApplicationReviewDialog` already
          use, with the row split into two columns instead of stacked.

          Both halves are load-bearing. Stacked, the claim row must be `auto`: the
          photograph's `min-h-96` on its own exceeds the body's height, so an auto track
          whose item declares `min-h-0` sizes to a 0px base and the claim column collapses
          to nothing while its content paints on out of it, behind the card. Hence
          `md:min-h-0` on that column and not `min-h-0` — the zero minimum is what lets it
          scroll inside a definite row at `md`, and it is exactly what must not apply once
          the row is content-sized. Side by side, the row must be `minmax(0,1fr)` for the
          same reason from the other end: it gives the two columns the definite height that
          `md:overflow-y-auto` and `height="fill"` both resolve against. */}
      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto] gap-6 overflow-y-auto p-6 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
        <div className="flex min-w-0 flex-col gap-6 md:min-h-0 md:overflow-y-auto">
          {request.requestKind === "resubmission" && latest ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-caption font-semibold text-muted-foreground">
                Why this was rejected last time
              </h3>
              {/* In full, in the officer's own words. The question a resubmission
                  actually asks is "did they fix what I said", and a summary of what the
                  court said would let this screen quietly rewrite it. */}
              <blockquote className="rounded-lg bg-surface-sunken p-4 text-body-compact">
                {latest.reason}
              </blockquote>
              <p className="text-caption text-muted-foreground">
                {"Round "}
                <span className="tabular-nums">{latest.round}</span>
                {", rejected "}
                <span className="tabular-nums">
                  {formatRegistrationLongDate(rejectionDay(latest))}
                </span>
                {". This request is round "}
                <span className="tabular-nums">{currentRound(request)}</span>.
              </p>

              {/* Older rounds are context, not the question — they collapse so the block
                  cannot grow without bound on a request that has come back five times
                  (`REG-23` sets no limit). The DS `Collapsible`, not a native
                  `details`/`summary`: the app has one disclosure mechanism and this was
                  the only place not using it, which meant hand-keeping a marker, a hover
                  and a focus ring that the shared idiom already carries. */}
              {earlier.length > 0 ? (
                <Collapsible>
                  {/* Styled off `TaskDetailPanel`'s history disclosure
                      (`components/tasks/task-detail-panel.tsx`) — the same job, down to
                      the Timeline underneath: a muted caption that darkens on hover, one
                      chevron that turns, and the DS focus ring. `w-fit` rather than that
                      one's full-width `justify-between`, because this label is a phrase in
                      a narrow column and a chevron parked at the far edge would lose touch
                      with it. `min-h-10` keeps the DS's 40px floor on a target an officer
                      reaches on a tablet. */}
                  <CollapsibleTrigger className="group/earlier flex min-h-10 w-fit items-center gap-1.5 rounded-lg text-left text-caption text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring">
                    {earlier.length === 1
                      ? "1 earlier round"
                      : `${earlier.length} earlier rounds`}
                    <ChevronDownIcon
                      aria-hidden
                      className="size-4 shrink-0 transition-transform group-data-[state=open]/earlier:rotate-180"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Timeline className="mt-3">
                      {earlier.map((round) => (
                        <TimelineItem
                          key={round.round}
                          status="past"
                          /* `title` is the DS's own `<li title>` narrowed to a string, so
                             the figures cannot be wrapped in their own span. The variant
                             inherits, so it goes on the item and covers both lines. */
                          className="tabular-nums"
                          title={`Round ${round.round} · ${formatRegistrationLongDate(
                            rejectionDay(round),
                          )}`}
                          description={round.reason}
                        />
                      ))}
                    </Timeline>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </section>
          ) : null}

          {request.requestKind === "edited" ? (
            /* `REG-18`. The account already existed — the Bar Council database created
               it — and what is under review is the change, not the record. Said in words
               above the block whose rows carry the was → now. */
            <p className="text-body-compact text-muted-foreground">
              This account was created from the Bar Council record. The{" "}
              {noun} changed the marked values at first login; the rest is the
              record as it stood.
            </p>
          ) : null}

          <BarCouncilLine
            lookup={request.lookup}
            claimedName={request.fullName}
            claimedNameLang={request.fullNameLang}
            barRegistrationId={request.barRegistrationId}
          />

          {/* What they typed, in a well. Four rows and no more — the flow collects no
              more (handover §5.1). */}
          <div className="rounded-lg bg-surface-sunken p-4">
            <DescriptionList>
              <ReviewRow term="Full name">
                <span lang={request.fullNameLang}>{request.fullName}</span>
                <WasLine edit={editFor(request, "fullName")} />
              </ReviewRow>
              <ReviewRow term={registrationIdLabel(request.registrantKind)}>
                <span className="font-mono tabular-nums">
                  {request.barRegistrationId}
                </span>
                <WasLine edit={editFor(request, "barRegistrationId")} mono />
              </ReviewRow>
              <ReviewRow term="Mobile number">
                <span className="tabular-nums">{request.mobile}</span>
                {/* `REG-10`/`REG-11` — the number is the account's primary key and it was
                    proved by OTP before the request was ever made. Quiet, because it is
                    true of every row: it is here so the officer does not spend a doubt on
                    the one fact that has already been checked by machine. */}
                <span className="block text-caption text-muted-foreground">
                  Verified by OTP
                </span>
                <WasLine edit={editFor(request, "mobile")} />
              </ReviewRow>
              {request.email ? (
                <ReviewRow term="Email">
                  {/* `break-all`, alone among the four rows. An address has no space in
                      it, so normal wrapping has nowhere to break and the value runs
                      straight out of the well's right edge in the two-column layout — and
                      `break-words` would not help, because that only breaks a word that
                      cannot fit *on its own line*, which at 188px this one nearly can. A
                      name wraps on its spaces and the Bar ID is short, so neither needs
                      this and neither should have it: a mid-syllable break in a Malayalam
                      name is a worse read than a wrapped line. */}
                  <span className="break-all">{request.email}</span>
                  <WasLine edit={editFor(request, "email")} />
                </ReviewRow>
              ) : null}
            </DescriptionList>
          </div>

          {rejecting ? (
            <Field data-invalid={touched && empty}>
              {/* Written for the person who will read it, not for the officer. The
                  documented failure in this role is one-word remarks that send an advocate
                  to the court counter to decode them (`scrutiny/flag-composer.tsx`), and a
                  label naming the reader is the cheapest thing that answers it. Visible,
                  never a placeholder alone — a listed accessibility defect. */}
              <FieldLabel htmlFor={`reject-${request.id}`}>
                Why are you rejecting this? The {noun} will read this.
              </FieldLabel>
              <Textarea
                id={`reject-${request.id}`}
                ref={reasonRef}
                className="max-h-40 min-h-24"
                placeholder="e.g. The name on the Bar ID card is different from the name you typed. Please check and submit again."
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setTouched(true);
                }}
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
                    Reject is available once you have written the reason.
                  </FieldDescription>
                )
              ) : null}
            </Field>
          ) : null}
        </div>

        {/* The evidence. `REG-14` collects this photograph for one purpose, so it takes
            the rest of the overlay's height rather than sitting under the facts as a
            thumbnail. Download and Full view are `DocumentPreview`'s own, in its sticky
            header — the footer keeps only the two decisions. */}
        <DocumentPreview
          className="min-h-96 md:min-h-0"
          height="fill"
          title={idPhotoLabel(request.registrantKind)}
          description={
            <>
              {"Uploaded "}
              <span className="tabular-nums">
                {formatRegistrationLongDate(submissionDay(request))}
              </span>
            </>
          }
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
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0">
        {rejecting ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRejecting(false);
                setReason("");
                setTouched(false);
              }}
            >
              Cancel
            </Button>
            {/* Soft destructive, not the solid. The DS reserves `destructive-solid` for a
                confirmed irreversible act, and a rejection here is reversible by design —
                `REG-23`: the advocate edits and resubmits, without limit. The loud
                treatment belongs to the act that cannot be taken back, and this is not it. */}
            <Button
              type="button"
              variant="destructive"
              disabled={empty}
              onClick={() => onReject(request)}
            >
              Reject request
            </Button>
          </>
        ) : (
          <>
            <Button
              ref={rejectRef}
              type="button"
              variant="destructive"
              onClick={() => setRejecting(true)}
            >
              Reject
            </Button>
            <ApproveConfirm
              request={request}
              noun={noun}
              onApprove={() => onApprove(request)}
            />
          </>
        )}
      </DialogFooter>
    </ChromeDialogContent>
  );
}

/**
 * The one guarded act on the screen, and the overlay's one teal button.
 *
 * Approval is where a credential is granted: the person can then act as an advocate on
 * real §138 files, which is why there is no bulk path anywhere on this screen and why the
 * photograph is opened one request at a time.
 *
 * **What the dialog does not say is deliberate.** The legacy confirmation claimed
 * "advocate details cannot be modified once registration request is accepted"; the
 * handover says no such thing, and asserting an irreversibility nobody has confirmed
 * would be the screen inventing product (`register-advocates.md` §12.2). So it states
 * what approval *grants* — the access `REG-24` withholds while the request is pending —
 * and stops there.
 */
function ApproveConfirm({
  request,
  noun,
  onApprove,
}: {
  request: AdvocateRegistration;
  noun: string;
  onApprove: () => void;
}) {
  /* Both halves of what this dialog says, named so the content can point at both. Radix
     describes an AlertDialog by its `AlertDialogDescription` alone, and the caveat below
     sits outside that element — so without this the one sentence saying the act is not
     real is the one sentence a screen reader never reaches. Passing `aria-describedby`
     replaces Radix's own value rather than adding to it (`ChromeAlertDialogContent`
     spreads straight through to `AlertDialogPrimitive.Content`), which is why the
     description carries an id of ours too and both are listed here. */
  const descriptionId = React.useId();
  const caveatId = React.useId();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button">Approve</Button>
      </AlertDialogTrigger>
      <ChromeAlertDialogContent
        aria-describedby={`${descriptionId} ${caveatId}`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Approve this registration?</AlertDialogTitle>
          <AlertDialogDescription id={descriptionId} className="text-body">
            <span lang={request.fullNameLang}>{request.fullName}</span> gets
            access to their {noun} account, which is closed to them while this
            request is pending.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* The court has not built the act, so the screen does not mime it. Said here, at
            the moment of the act, rather than left for the officer to discover. */}
        <p id={caveatId} className="text-caption text-muted-foreground">
          Not part of this build — no account is opened and nobody is told.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction onClick={onApprove}>Approve</AlertDialogAction>
        </AlertDialogFooter>
      </ChromeAlertDialogContent>
    </AlertDialog>
  );
}

/**
 * What the Bar Council register said, stated as a machine reading (`REG-13`).
 *
 * The default is silent. On the ~nine rows in ten where the register agrees, this is one
 * muted line and no mark at all — a green "verified" chip would spend colour marking the
 * norm, and the officer still has to look at the photograph either way.
 *
 * When it disagrees it is `warning` **with words**, never a tint alone and never
 * `destructive`. A register that holds a different name is a finding that needs a human,
 * not a verdict, and destructive treatment would have the machine reject before anybody
 * looked at the card. The repo has already learned this in this exact role — see
 * `scrutiny/flag-composer.tsx` on pre-filling a defect assertion on the officer's behalf.
 *
 * When it cannot be reached, it says so plainly and **blocks nothing**: the evidence
 * `REG-14` names is the photograph, which is in the next column.
 */
function BarCouncilLine({
  lookup,
  claimedName,
  claimedNameLang,
  barRegistrationId,
}: {
  lookup: BarCouncilLookup;
  claimedName: string;
  claimedNameLang?: string;
  barRegistrationId: string;
}) {
  if (lookup.state === "agrees") {
    return (
      <p className="text-body-compact text-muted-foreground">
        {lookup.entry.bar} register:{" "}
        {/* The register's name carries the register's own tag, never the claimant's: the
            two strings are separate answers and need not share a script (`BarCouncilLookup`
            in `lib/employee/register-advocates.ts`). */}
        <span lang={lookup.entryNameLang}>{lookup.entry.name}</span>.
      </p>
    );
  }

  if (lookup.state === "unavailable") {
    return (
      <p className="text-body-compact text-muted-foreground">
        The Bar Council register could not be reached. Decide from the card.
      </p>
    );
  }

  if (lookup.state === "not-found") {
    return (
      <Alert variant="warning">
        <AlertTitle>This number is not in the register</AlertTitle>
        <AlertDescription>
          The Bar Council register has no entry against{" "}
          <span className="font-mono tabular-nums">{barRegistrationId}</span>.
          The register is not complete, so this is ordinary — the card is what
          decides it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTitle>The register has a different name against this number</AlertTitle>
      <AlertDescription>
        {lookup.entry.bar} holds{" "}
        <span className="font-mono tabular-nums">{lookup.entry.barNumber}</span>{" "}
        against{" "}
        {/* The whole sentence is that these two names differ, so each is spoken in its
            own script — this is the one place borrowing the claimant's tag would be read
            aloud as agreement. */}
        <span lang={lookup.entryNameLang} className="font-medium">
          {lookup.entry.name}
        </span>
        . This request was made in the name{" "}
        <span lang={claimedNameLang} className="font-medium">
          {claimedName}
        </span>
        . Check the card before deciding.
      </AlertDescription>
    </Alert>
  );
}

/** "Was 9847051204" / "Added at first login" — what changed, under the value it changed to. */
function WasLine({
  edit,
  mono = false,
}: {
  edit: { was: string | null } | undefined;
  mono?: boolean;
}) {
  if (!edit) return null;
  return (
    <span className="block text-caption text-muted-foreground">
      {edit.was === null ? (
        "Added at first login"
      ) : (
        <>
          {"Was "}
          <span className={cn("line-through", mono && "font-mono tabular-nums")}>
            {edit.was}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * The photograph itself, and the two things that happen to a served file.
 *
 * It is an `<img>` inside `DocumentPreview`'s composed well rather than the well's `src`
 * branch, which renders an `<iframe>`. An iframe reports neither load nor failure, and
 * both states are ones this screen has to answer: a card photograph is a file coming down
 * a court's connection, so it is sometimes slow, and sometimes it is not there. The well,
 * the sticky header, Download and Full view are all still `DocumentPreview`'s — only the
 * element inside the well changed.
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
