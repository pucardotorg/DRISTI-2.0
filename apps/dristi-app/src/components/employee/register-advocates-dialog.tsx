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
 * **Every fact here is a value in a named slot** (brief D2). One row —
 * `term · value · source line · previous line · marks` — renders the request's own
 * metadata, the four submitted values and every rejection round alike, and the machine's
 * answer about an attribute is a member of a closed six-value enum rather than a sentence
 * this component writes. The version this replaces narrated one lookup four different
 * ways, which meant a fifth answer, a second register or a clerk queue (`REG-13a`) each
 * cost new prose. Nothing on this screen is generated from a status now: if you find
 * yourself writing a sentence about what the data means, the model is missing a slot.
 *
 * **Only what the registration flow collects.** Five values — full name, Bar registration
 * ID, the OTP-verified mobile, an email if one was given, and the photograph — which is
 * four rows and one column, and that arithmetic is how a reader checks nothing was
 * invented. Address, ID type, Aadhaar proof and map location are not shown as blank rows;
 * handover §5.1 says they are never collected.
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
  /* Where the overlay lands on open — see `onOpenAutoFocus` below. */
  const attributesRef = React.useRef<HTMLDivElement>(null);
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
  const rounds = rejectionRows(request);

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
          looked at the card. It is the first row of Identity instead. */}
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
        <DialogDescription className="text-body-compact tabular-nums text-muted-foreground">
          {request.applicationNumber}
        </DialogDescription>
      </DialogHeader>
      <Separator />

      {/* Attributes on the left, evidence on the right, and below `md` the attributes
          first — they are what you read before you look at anything. Each column scrolls
          on its own once there is a viewport to split, so a request on its fifth round
          does not push the photograph off the bottom of the overlay. */}
      {/* `grid-rows-[auto_auto]` below `md` and a single `minmax(0,1fr)` row above it —
          the recipe `ApproveCopyApplicationDialog` and `ApplicationReviewDialog` already
          use, with the row split into two columns instead of stacked.

          Both halves are load-bearing. Stacked, the attribute row must be `auto`: the
          photograph's `min-h-96` on its own exceeds the body's height, so an auto track
          whose item declares `min-h-0` sizes to a 0px base and the left column collapses
          to nothing while its content paints on out of it, behind the card. Hence
          `md:min-h-0` on that column and not `min-h-0` — the zero minimum is what lets it
          scroll inside a definite row at `md`, and it is exactly what must not apply once
          the row is content-sized. Side by side, the row must be `minmax(0,1fr)` for the
          same reason from the other end: it gives the two columns the definite height that
          `md:overflow-y-auto` and `height="fill"` both resolve against. */}
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

          {rounds.length > 0 ? (
            <EarlierRejections rounds={rounds} />
          ) : null}

          {rejecting ? (
            <Field data-invalid={touched && empty}>
              {/* Written for the person who will read it, not for the officer. The
                  documented failure in this role is one-word remarks that send an advocate
                  to the court counter to decode them (`scrutiny/flag-composer.tsx`), and a
                  label naming the reader is the cheapest thing that answers it. Visible,
                  never a placeholder alone — a listed accessibility defect.

                  This sentence is the one piece of free text the rebuild keeps, and it is
                  not the defect the rest of it removed: `REG-22` says the reason is the
                  officer's own words, which is user data in a fixed slot. Product copy
                  standing in for a machine result is what went. */}
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

        {/* The evidence, and the fifth submitted value (brief D15). `REG-14` collects this
            photograph for one purpose, so it takes the rest of the overlay's height rather
            than sitting under the facts as a thumbnail — and it takes it **without a
            header band**: the heading restated what the column plainly is, its sub-line
            said the submitted date a second time, and the two text buttons sat under the
            DialogTitle as a second title bar. Quiet mode drops all three; Download and
            Full view are 40×40 icons on the well, which is `DocumentPreview`'s own doing
            and not a second well hand-rolled here. */}
        <DocumentPreview
          variant="quiet"
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
 * wrapping has nowhere to break and the value runs out of the well's right edge in the
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
    /* Hairline, not the DS row default: these rows sit inside a sunken well, where
       `border-border` would be the loudest mark in the overlay (ui-craft §1.1). */
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
 * A group of rows in a well, with the group's name above it.
 *
 * The label is scaffolding and reads as scaffolding — `text-caption` muted, so the values
 * inside are what the eye lands on. The well is `surface-sunken` inside the dialog's own
 * panel: depth by fill, no border, nothing nested inside anything raised (DS Laws).
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
      <div className="rounded-lg bg-surface-sunken p-4">{children}</div>
    </section>
  );
}

/**
 * Every round this request has already been refused — newest first, all of them the same
 * row (brief D7).
 *
 * The newest is always visible, because the question a resubmission asks is "did they fix
 * what I said last time". The rest collapse, so the group cannot grow without bound on a
 * request that has come back five times (`REG-23` sets no limit). The `Collapsible`
 * governs how many are visible; it does not change how any of them look, which is what
 * the version this replaces got wrong — it rendered the newest as a quote block and the
 * older ones as timeline items, one fact with two treatments.
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
