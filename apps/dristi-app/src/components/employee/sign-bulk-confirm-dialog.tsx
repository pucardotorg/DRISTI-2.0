"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";

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

/**
 * What the court is acting on in bulk.
 *
 * Four of the five plurals are a regular `-s`, so the copy builds those and the table
 * below holds only the one that is not.
 */
export type SignBulkNoun =
  | "form"
  | "order"
  | "bail bond"
  | "deposition"
  | "process";

const IRREGULAR_PLURALS: Partial<Record<SignBulkNoun, string>> = {
  process: "processes",
};

function pluralise(noun: SignBulkNoun): string {
  return IRREGULAR_PLURALS[noun] ?? `${noun}s`;
}

/**
 * The act, in the five places this dialog speaks it.
 *
 * Signing is the default and the reason the dialog exists. But the line that carries
 * court process has three acts on one screen — a collected cover sent for signature, a
 * signature, a dispatch — and all three want this same two-step shape, so the verb is a
 * parameter rather than three more copies of the component. A caller that passes nothing
 * gets the signature copy the four single-act queues have always had, word for word.
 *
 * Functions rather than strings because the dialog counts for itself: the success step
 * reports the selection the act consumed, which by then is no longer the caller's live
 * count (see `signed` in the body).
 */
export type SignBulkAct = {
  /** The question, over "this order" / "8 orders". */
  question: (subject: string) => string;
  /** What the act means, said at the moment of it. */
  meaning: (one: boolean) => string;
  /** The success heading, over "order" / "8 orders" — the bare noun, not the subject. */
  done: (phrase: string) => string;
  /** Where the rows went. */
  outcome: (one: boolean) => string;
  /** The button that commits it. */
  confirm: string;
};

/** What every queue said before there was a second act, and what they still say. */
function signatureAct(noun: SignBulkNoun): SignBulkAct {
  return {
    question: (subject) => `Sign ${subject}?`,
    meaning: (one) =>
      one
        ? `Your signature goes on the ${noun}. This cannot be reversed.`
        : `Your signature goes on every ${noun} selected. This cannot be reversed.`,
    done: (phrase) => `${capitalise(phrase)} signed`,
    outcome: (one) =>
      one
        ? "It has left the signing queue."
        : "They have left the signing queue.",
    confirm: "Sign",
  };
}

/**
 * The selection, as facts rather than as rows.
 *
 * Given per document and in list order so the dialog does the counting once, in one
 * place, instead of four screens each reducing the same shapes differently.
 */
export type SignBulkSelection = {
  /** Case number per document. */
  cases: string[];
  /**
   * Kind label per document — the process for a form, the type for an order.
   *
   * Omitted where the queue has no kind axis: every bail bond is a bail bond, and every
   * deposition is one witness's evidence, so a breakdown there would be the count
   * written twice.
   */
  kinds?: string[];
};

/**
 * Confirming a bulk act — the one dialog every court-side signing queue uses.
 *
 * The four single-act queues each grew their own version of this moment: two of them an
 * `AlertDialog` asking a one-line question, two of them a two-step `Dialog` that went on
 * to ask how the bench would sign. Four confirmations for one act, each phrased
 * differently, is four chances for the bench to read the same button as meaning
 * different things. This is that moment, once — and since the process line added three
 * acts on one screen, the verb is a parameter (`SignBulkAct`) while the shape is not.
 *
 * Two steps, and the second is the point of the rewrite. Pressing Sign commits and
 * *stays* — the dialog swaps to a success state instead of vanishing and leaving the
 * bench to infer from a shorter list that anything happened. A single Done dismisses it.
 *
 * A `Dialog` rather than an `AlertDialog`: the flow no longer ends on the decision, and
 * an alert has neither a third state nor a close affordance. This gives every queue the
 * X the reference draws, on the step that asks the question.
 *
 * The chrome is the advocate product's own overlay recipe — bordered header, scrolling
 * body, bordered footer — and the confirmation it ends on is `AddSignatureDialog`'s: a
 * solid success panel carrying the heading, the tick beneath it, and the facts in a
 * well under that. Signing off a queue and signing a submission are the same beat of
 * the same product; they should not end on two different kinds of object.
 *
 * The bulk path asks for no signature method. Choosing between e-sign and an upload is a
 * question about *one* document the bench has read; the queues' single-document paths
 * still ask it, and this path — where nothing was opened — no longer does.
 *
 * `onConfirm` runs each screen's own demo act, which drops the rows from its queue.
 */
export function SignBulkConfirmDialog({
  noun,
  act,
  count,
  selection,
  open,
  onOpenChange,
  onConfirm,
  onDownload,
  triggerRef,
  onReturnFocus,
}: {
  noun: SignBulkNoun;
  /** The verb, where it is not a signature. Omitted, the dialog signs. */
  act?: SignBulkAct;
  /** How many rows the act will take. Read once per opening — see the body. */
  count: number;
  selection: SignBulkSelection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Commit the demo act — the screen's own `sign` / `onSign` handler.
   *
   * It must **not** close the dialog: the success step is what the bench sees next, and
   * closing here would take it away before it rendered.
   */
  onConfirm: () => void;
  /**
   * Take the papers away, offered on the success step only.
   *
   * Optional, and the four single-act queues pass nothing — their footer is the single
   * Done it has always been. The process line passes it because that is the one screen
   * where the rows are worth having in hand the moment they are signed.
   *
   * **It must resolve the rows again, not close over the ones it was given.** By the time
   * this can be clicked the act has run: the rows have moved stage and been stamped, and
   * a copy captured before that would write "Pending the signature of the magistrate"
   * across ten papers the bench has just signed. The screen keeps the ids and reads them
   * back off its own list — see `SignProcessScreen`.
   */
  onDownload?: () => void;
  /**
   * The sticky-bar button this was opened from, to hand focus back to on the way out.
   *
   * Named rather than inferred: Radix's modal dialog restores focus to a
   * `DialogTrigger`, and these four are opened from a button that is not one, so left
   * alone it restores to nothing and the bench loses the keyboard mid-queue.
   */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /**
   * Where focus goes when that button cannot take it back — the screens' search field.
   *
   * Signing empties the selection, which disables the button, so a committed run has
   * nowhere to return to.
   */
  onReturnFocus: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Closed renders nothing, so the body unmounts and its step and captured facts go
          with it. Re-opening therefore starts at the confirmation with the current
          selection rather than inheriting the last run's. */}
      {open ? (
        <SignBulkConfirmBody
          noun={noun}
          act={act ?? signatureAct(noun)}
          count={count}
          selection={selection}
          onClose={() => onOpenChange(false)}
          onConfirm={onConfirm}
          onDownload={onDownload}
          triggerRef={triggerRef}
          onReturnFocus={onReturnFocus}
        />
      ) : null}
    </Dialog>
  );
}

function SignBulkConfirmBody({
  noun,
  act,
  count,
  selection,
  onClose,
  onConfirm,
  onDownload,
  triggerRef,
  onReturnFocus,
}: {
  noun: SignBulkNoun;
  act: SignBulkAct;
  count: number;
  selection: SignBulkSelection;
  onClose: () => void;
  onConfirm: () => void;
  onDownload?: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onReturnFocus: () => void;
}) {
  const [step, setStep] = React.useState<"confirm" | "success">("confirm");
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  /* What the success step reports, taken before the act consumes it. Signing clears the
     selection and drops the rows, so by the time that step renders the live figures are
     zero — they have to be the ones that were committed, not the ones left behind. It is
     also why the body is worth keeping after the act: these rows have just left the queue
     that listed them, and this is the last place they can be read. */
  const [signed] = React.useState(() => ({
    count,
    cases: new Set(selection.cases).size,
    kinds: selection.kinds ? tally(selection.kinds) : [],
  }));

  /* Swapping the step replaces the dialog's content wholesale; landing focus on the new
     title is what announces the change. Initial open keeps Radix's own focus handling —
     this only runs on a step change. */
  React.useEffect(() => {
    if (step === "success") titleRef.current?.focus();
  }, [step]);

  const one = signed.count === 1;
  const many = `${signed.count} ${pluralise(noun)}`;
  /* Two ways of naming the same rows: the question asks about "this order", the success
     heading reports "Order signed". Both are built from the captured count, never the
     live one. */
  const subject = one ? `this ${noun}` : many;
  const phrase = one ? noun : many;

  return (
    <ChromeDialogContent
      className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      /* The DS places a small ghost X top-right, which lands on the success panel's dark
         fill and disappears into it — the reason the advocate confirmation drew its own.
         Here the footer's Done is the way out, so the step goes without one. */
      showCloseButton={step === "confirm"}
      onCloseAutoFocus={(event) => {
        /* Backing out returns the bench to the button it left; signing sends it to the
           search field, because signing is what disabled that button — and on the queues
           whose bar goes away with the last signable row, took it off the page. */
        event.preventDefault();
        const trigger = triggerRef.current;
        if (step === "confirm" && trigger?.isConnected && !trigger.disabled) {
          trigger.focus();
          return;
        }
        onReturnFocus();
      }}
    >
      {step === "confirm" ? (
        /* A header and a footer, and nothing between them. The question names the count
           — the one fact the bench cannot get anywhere else at this moment, having
           opened none of these documents — and the line under it names the risk. What
           was ticked is the list it just came from; restating it here is a second
           reading of the same page at the moment it has to decide.

           `pr-14` keeps the title clear of the close button the DS places top-right —
           the advocate overlays' own figure for the same bordered header. */
        <DialogHeader className="min-h-0 shrink overflow-y-auto border-b border-hairline px-6 py-5 pr-14 text-left">
          <DialogTitle className="text-title-s font-semibold text-balance tabular-nums">
            {act.question(subject)}
          </DialogTitle>
          <DialogDescription className="text-body text-pretty">
            {act.meaning(one)}
          </DialogDescription>
        </DialogHeader>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            {/* The advocate product's confirmation, brought across whole: a solid success
                panel carrying the heading, with the tick under it. */}
            <div className="flex flex-col items-center gap-4 rounded-lg bg-success p-6 text-center">
              <div className="flex flex-col gap-1.5">
                {/* The verb the question asked, answered. */}
                <DialogTitle
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-title-s font-semibold text-balance tabular-nums text-success-foreground outline-none"
                >
                  {act.done(phrase)}
                </DialogTitle>
                {/* Focus lands on the heading, which announces the title and its role and
                    nothing else; `aria-describedby` sits on the dialog and does not re-fire
                    when the description's contents are swapped underneath it. A live region
                    is what gets the outcome spoken at all. */}
                <DialogDescription
                  role="status"
                  className="text-body-compact text-pretty text-success-foreground"
                >
                  {act.outcome(one)}
                </DialogDescription>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full bg-success-foreground">
                <CheckIcon className="size-6 text-success" aria-hidden />
              </span>
            </div>

            {/* What left the queue, in the well the advocate confirmation puts its facts
                in. Worth saying here and not on the question: these rows have just gone
                from the list that held them, and this is the last place they can be read.
                Facts the screen already holds; no identifier is minted for an act that
                files nothing. */}
            <DescriptionList className="rounded-lg bg-surface-sunken px-4 py-1">
              {signed.kinds.map((kind) => (
                <DescriptionRow
                  key={kind.label}
                  className="grid-cols-[1fr_auto] items-center border-hairline"
                >
                  <DescriptionTerm className="text-body">
                    {kind.label}
                  </DescriptionTerm>
                  <DescriptionDetails className="text-body tabular-nums">
                    {kind.count}
                  </DescriptionDetails>
                </DescriptionRow>
              ))}
              <DescriptionRow className="grid-cols-[1fr_auto] items-center border-hairline">
                <DescriptionTerm className="text-body">Cases</DescriptionTerm>
                <DescriptionDetails className="text-body tabular-nums">
                  {signed.cases === 1 ? "1 case" : `${signed.cases} cases`}
                </DescriptionDetails>
              </DescriptionRow>
            </DescriptionList>
          </div>
        </div>
      )}

      <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline px-6 py-4 sm:flex-row sm:justify-end">
        {step === "confirm" ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm();
                setStep("success");
              }}
            >
              {act.confirm}
            </Button>
          </>
        ) : (
          <>
            {/* The rows have just left the queue that listed them, and the bar that could
                have downloaded them went with the selection. One bordered action beside
                the strong one, the same pair the sticky bar makes — the count is the
                dialog's own captured one, so it agrees with the heading above it. */}
            {onDownload ? (
              <Button
                type="button"
                variant="outline"
                className="tabular-nums"
                onClick={onDownload}
              >
                Download {signed.count}{" "}
                {signed.count === 1 ? "document" : "documents"}
              </Button>
            ) : null}
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </footer>
    </ChromeDialogContent>
  );
}

/** Sentence case, so the noun only rises to a capital when it opens the line. */
function capitalise(noun: string): string {
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}

/** How many of each kind, in the order the kinds first appear down the list. */
function tally(labels: string[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts].map(([label, count]) => ({ label, count }));
}
