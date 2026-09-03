"use client";

import * as React from "react";

import { CHROME_PAGE_DIALOG } from "@/components/chrome/app-chrome";
import { DocumentPreview } from "@/components/cases/document-preview";
import {
  SignatureFields,
  useSignatureChoice,
} from "@/components/employee/sign-signature-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { causeTitle } from "@/lib/employee/hearings";
import {
  buildSignBailBondDocument,
  downloadSignBailBondDocument,
  formatSignBailBondDate,
  type SignBailBond,
  type SignBailBondDocument,
} from "@/lib/employee/sign-bail-bonds";

/** What the paper is called in the signature step's copy. */
const NOUN = "bail bond";

/**
 * What the bench is about to sign, in one sentence.
 *
 * Named rather than counted wherever naming is possible, the way `signatureSubject` does
 * it for forms — and here the name is the litigant, because a case can carry two bonds
 * and "2 bail bonds" would not tell the bench which two.
 */
function bondSubject(bonds: SignBailBond[]): string {
  if (bonds.length === 0) return "No bail bonds are selected.";
  if (bonds.length === 1) {
    const [bond] = bonds;
    return `You are adding your signature to the bail bond of ${bond.litigant} in ${bond.caseNumber}.`;
  }
  return `You are adding your signature to ${bonds.length} bail bonds.`;
}

/**
 * One bail bond, read and then signed or refused — the single-bond path off the queue.
 *
 * Two steps, and each gets its own size for the reason `SignFormDialog` gives. Reading is
 * the wide step: the document *is* the task, so it is a `height="fill"` `DocumentPreview`
 * in a tall overlay. Signing is the narrow step: a note saying what is about to be signed,
 * the choice of how, and Submit.
 *
 * **The signature step is a departure from the reference**, made on the owner's
 * instruction (2026-09-03). The reference took Proceed to sign straight to a Confirm sign
 * modal and asked nothing about how the signature gets on the paper. A bail bond is
 * executed by the accused and the surety before the bench attests it, so "upload the bond
 * they signed" is a real path in a way it is not for an order — which is why this queue
 * follows the forms queue here rather than the orders queue.
 *
 * The steps live inside one `Dialog` rather than two: handing off between two dialogs
 * races Radix's focus restore against the next dialog's trap, and one dialog keeps one
 * focus scope. The document is off screen on the signing step, so Download comes back
 * there.
 *
 * **Reject** refuses the bond and it leaves the bench unsigned — no reason is asked for,
 * because the reference asks for none and a reasons taxonomy invented for a demo would be
 * inventing product. It stays on the reading step, where the bench can still see what it
 * is refusing.
 *
 * **Submit signs nothing.** It moves the row's status in the demo queue and closes — see
 * `lib/employee/sign-bail-bonds.ts`. Nothing is written, published or sent, and no e-sign
 * provider is called.
 */
export function SignBailBondDialog({
  bond,
  onOpenChange,
  onSign,
  onReject,
  onReturnFocus,
}: {
  bond: SignBailBond | null;
  onOpenChange: (bond: SignBailBond | null) => void;
  onSign: (bond: SignBailBond) => void;
  onReject: (bond: SignBailBond) => void;
  onReturnFocus: () => void;
}) {
  return (
    <Dialog
      open={bond !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
    >
      {bond ? (
        /* Keyed on the bond, and unmounted entirely while none is open — so a second
           bond renders its document from the top, and a bond abandoned mid-signature
           re-opens on the reading step rather than inheriting the method picked last
           time. */
        <SignBailBondBody
          key={bond.id}
          bond={bond}
          onSign={onSign}
          onReject={onReject}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

function SignBailBondBody({
  bond,
  onSign,
  onReject,
  onReturnFocus,
}: {
  bond: SignBailBond;
  onSign: (bond: SignBailBond) => void;
  onReject: (bond: SignBailBond) => void;
  onReturnFocus: () => void;
}) {
  const document = React.useMemo(
    () => buildSignBailBondDocument(bond),
    [bond],
  );
  const [step, setStep] = React.useState<"read" | "sign">("read");
  const choice = useSignatureChoice(NOUN);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  /* Swapping the step replaces the dialog's content wholesale; landing focus on the new
     title is what announces the change. Initial open keeps Radix's own focus handling —
     this only runs on a step change. */
  React.useEffect(() => {
    if (step === "sign") titleRef.current?.focus();
  }, [step]);

  return (
    <DialogContent
      className={
        step === "read"
          ? `flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl md:h-[85dvh] ${CHROME_PAGE_DIALOG}`
          : "max-h-[85dvh] overflow-y-auto sm:max-w-lg"
      }
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      {step === "read" ? (
        <>
          {/* `pr-16` keeps the title clear of the close button the DS places top-right.
              The reference titles this overlay with the cause and the paper — "… vs … -
              Bail Bond" — and that is the right pair: the bond has no name of its own. */}
          <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
            <DialogTitle className="text-title-s font-semibold">
              {causeTitle(bond)} — Bail bond
            </DialogTitle>
            {/* The litigant leads the supporting line rather than the case number,
                because with two bonds to a case the litigant is the only thing that says
                which of them is open. */}
            <DialogDescription className="text-body-compact text-muted-foreground">
              Executed by {bond.litigant} · {bond.caseNumber} · Added{" "}
              {formatSignBailBondDate(bond.addedOn)}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <DocumentPreview
              className="min-h-96 md:min-h-0"
              height="fill"
              title={document.title}
              source={{
                kind: "composed",
                content: <BailBondFacsimile document={document} />,
              }}
              download={{
                onDownload: () => downloadSignBailBondDocument(bond),
                label: `Download the bail bond of ${bond.litigant}`,
              }}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onReject(bond)}
            >
              Reject
            </Button>
            <Button type="button" onClick={() => setStep("sign")}>
              Proceed to sign
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              className="text-title-s font-semibold outline-none"
            >
              Add signature
            </DialogTitle>
            <DialogDescription className="text-body-compact">
              Choose how you will sign this bail bond.
            </DialogDescription>
          </DialogHeader>

          <SignatureFields
            choice={choice}
            noun={NOUN}
            subject={bondSubject([bond])}
            download={{
              prompt: "Want to read the bond again?",
              onDownload: () => downloadSignBailBondDocument(bond),
            }}
          />

          {/* What the act means, and what this build does not do — said at the moment of
              the act rather than left for the bench to discover. */}
          <p className="text-caption text-muted-foreground">
            Signing publishes this bond and cannot be reversed. Not part of this
            build — nothing is signed, published or sent.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("read")}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={!choice.canSubmit}
              onClick={() => onSign(bond)}
            >
              Submit
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

/**
 * Many bonds at once — the bulk path off the queue.
 *
 * The same two beats as the single-bond path, minus the reading: confirm what is about to
 * happen, then say how it gets signed. The bench has not opened these bonds, so the
 * confirmation carries the count and the warning, and the signature step carries the
 * choice.
 *
 * **One selected bond skips the confirmation** and opens on Add signature (owner
 * instruction, 2026-09-03). Confirming is what a *bulk* act needs: a count the bench
 * cannot see the members of is worth restating before it commits. Over a single bond the
 * step restated one row that is still on screen behind the dialog, and put a click
 * between the bench and the only question this dialog exists to ask. The warning it
 * carried does not go with it — it moves to the signature step, which is now the first
 * and only thing a single-bond run sees.
 *
 * It is a `Dialog` with two steps rather than an `AlertDialog` handing off to a second
 * dialog, for the reason `SignBulkDialog` gives: Confirm is no longer the last thing
 * pressed — Submit is — so it is a step in a flow rather than a terminal irreversible
 * confirmation. That is also why the reference's "Sign and Publish" becomes "Sign" here:
 * it no longer commits anything.
 *
 * This is `SignBulkDialog`'s shape with a different noun and subject. It is a separate
 * component rather than a reuse because that one is typed to `SignForm` and is being
 * actively edited on another branch of this work; collapsing the two into one generic
 * bulk shell is worth doing once that settles, and is noted in the build report rather
 * than done here.
 *
 * **Submit signs nothing.** See `lib/employee/sign-bail-bonds.ts`.
 */
export function SignBailBondsBulkDialog({
  bonds,
  open,
  onOpenChange,
  onSign,
}: {
  /** The selection, in list order. Read once per opening — see the key below. */
  bonds: SignBailBond[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: () => void;
}) {
  /* Counts the openings rather than the bonds: the selection cannot change while the
     dialog is up, but re-opening it must start at Confirm with an empty method rather
     than inherit the last run's answers. */
  const [run, setRun] = React.useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setRun((current) => current + 1);
        onOpenChange(next);
      }}
    >
      {open ? (
        <SignBailBondsBulkBody
          key={run}
          bonds={bonds}
          onCancel={() => onOpenChange(false)}
          onSign={onSign}
        />
      ) : null}
    </Dialog>
  );
}

function SignBailBondsBulkBody({
  bonds,
  onCancel,
  onSign,
}: {
  bonds: SignBailBond[];
  /** Leave without signing — the confirm step's Back, which has nowhere earlier to go. */
  onCancel: () => void;
  onSign: () => void;
}) {
  /* One bond needs no count confirmed, so the confirm beat is not in its flow at all —
     not merely auto-advanced past, which would leave Back pointing at a step the bench
     never saw. */
  const skipsConfirm = bonds.length === 1;
  const [step, setStep] = React.useState<"confirm" | "sign">(
    skipsConfirm ? "sign" : "confirm",
  );
  const choice = useSignatureChoice(NOUN);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const mounted = React.useRef(false);

  /* Swapping the step replaces the dialog's content wholesale; landing focus on the new
     title is what announces the change. The first render is not a change — a run that
     opens straight on the signature step keeps Radix's own focus handling, the same as
     one that opens on the confirmation. */
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (step === "sign") titleRef.current?.focus();
  }, [step]);

  return (
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      {step === "confirm" ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-title-s font-semibold">
              Confirm sign
            </DialogTitle>
            {/* The reference's own sentence for the plural case, reworded for one bond
                rather than telling a bench signing a single bond about "all selected
                bail bonds". */}
            <DialogDescription className="text-body">
              {bonds.length === 1
                ? "This will add your signature to this bail bond and publish it. This action cannot be reversed."
                : "This will add your signature to all selected bail bonds and publish them. This action cannot be reversed."}
            </DialogDescription>
          </DialogHeader>

          <p className="text-caption text-muted-foreground">
            Not part of this build — nothing is signed, published or sent.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("sign")}>
              Sign
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              className="text-title-s font-semibold outline-none"
            >
              Add signature
            </DialogTitle>
            <DialogDescription className="text-body-compact">
              {bonds.length === 1
                ? "Choose how you will sign this bail bond."
                : "Choose how you will sign these bail bonds."}
            </DialogDescription>
          </DialogHeader>

          <SignatureFields
            choice={choice}
            noun={NOUN}
            subject={bondSubject(bonds)}
          />

          {/* What the act means, and what this build does not do. It lives here rather
              than only on the confirmation, because a single-bond run never sees that
              step and must still be told the signature cannot be taken back. */}
          <p className="text-caption text-muted-foreground">
            {bonds.length === 1
              ? "Signing publishes this bond and cannot be reversed. Not part of this build — nothing is signed, published or sent."
              : "Signing publishes every bond selected and cannot be reversed. Not part of this build — nothing is signed, published or sent."}
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => (skipsConfirm ? onCancel() : setStep("confirm"))}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={!choice.canSubmit}
              onClick={onSign}
            >
              Submit
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

/**
 * The bond itself as paper — the same facsimile treatment the other court-side overlays
 * use, laid out the way the reference lays this one out.
 *
 * The reference's own order: the case number on its own line, the court as the document's
 * heading, then the register line and the cause, then the bond. The court heading is the
 * one line that steps up a size — it is the paper's own heading, and the paper is its own
 * surface — while everything under it stays body copy, which keeps the facsimile to the
 * two weights ui-craft §1.3 allows.
 */
function BailBondFacsimile({ document }: { document: SignBailBondDocument }) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground">
      <header className="flex flex-col gap-4">
        <p className="text-center text-body tabular-nums">
          Case Number: {document.caseNumber}
        </p>
        <h3 className="text-center text-title-s font-semibold">
          {document.court}
        </h3>
        <div className="flex flex-col gap-1">
          <p className="text-body tabular-nums">{document.register}</p>
          <p className="text-body">{document.matter}</p>
        </div>
      </header>

      <h4 className="text-center text-body font-semibold">{document.title}</h4>

      <div className="flex flex-col gap-3">
        {document.recital.map((paragraph, index) => (
          <p key={index} className="text-body">
            {paragraph}
          </p>
        ))}
      </div>

      <ol className="flex list-decimal flex-col gap-3 ps-6">
        {document.undertakings.map((clause, index) => (
          <li key={index} className="text-body">
            {clause}
          </li>
        ))}
      </ol>

      <p className="text-body">Dated this the {document.dated}.</p>

      {/* Who put their hand to it. A description list rather than prose, because the
          reference's paper signs itself in a block and a bench checking a bond checks the
          surety by name. */}
      <dl className="flex flex-col gap-2">
        {document.signatories.map((entry) => (
          <div key={entry.role} className="flex flex-wrap gap-2">
            <dt className="text-body text-paper-muted-foreground">
              {entry.role}:
            </dt>
            <dd className="text-body">{entry.name}</dd>
          </div>
        ))}
      </dl>

      <p className="text-body text-paper-muted-foreground">
        {document.signature}
      </p>
    </article>
  );
}
