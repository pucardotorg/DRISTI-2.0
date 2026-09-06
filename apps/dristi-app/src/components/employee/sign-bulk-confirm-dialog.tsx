"use client";

import * as React from "react";
import { CircleCheckIcon } from "lucide-react";

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
 * X the reference draws.
 *
 * The chrome is the advocate product's own overlay recipe — bordered header, scrolling
 * body, bordered footer, and the same submitted-state medallion `BailApplicationDialog`
 * and `BailBondDialog` land on. Signing off a queue and filing an application are the
 * same beat of the same product; they should not be two different kinds of object.
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
  triggerRef,
  onReturnFocus,
}: {
  noun: SignBulkNoun;
  act: SignBulkAct;
  count: number;
  selection: SignBulkSelection;
  onClose: () => void;
  onConfirm: () => void;
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
        /* `pr-14` keeps the title clear of the close button the DS places top-right —
           the advocate overlays' own figure for the same bordered header. */
        <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
          {/* The question carries the count, which is the one fact the bench cannot get
              anywhere else at this moment — it has opened none of these documents. */}
          <DialogTitle className="text-title-s font-semibold text-balance tabular-nums">
            {act.question(subject)}
          </DialogTitle>
          <DialogDescription className="text-body text-pretty">
            {act.meaning(one)}
          </DialogDescription>
        </DialogHeader>
      ) : (
        <DialogHeader className="shrink-0 border-b border-hairline px-6 py-5 pr-14 text-left">
          {/* The advocate product's submitted-state medallion, to the pixel — signing off
              a queue and filing an application are the same beat and should look it. */}
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
              <CircleCheckIcon className="size-7" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              {/* The verb the question asked, answered. */}
              <DialogTitle
                ref={titleRef}
                tabIndex={-1}
                className="text-title-s font-semibold text-balance tabular-nums outline-none"
              >
                {act.done(phrase)}
              </DialogTitle>
              {/* Focus lands on the heading, which announces the title and its role and
                  nothing else; `aria-describedby` sits on the dialog and does not re-fire
                  when the description's contents are swapped underneath it. A live region
                  is what gets the outcome spoken at all. */}
              <DialogDescription
                role="status"
                className="text-body text-pretty"
              >
                {act.outcome(one)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
      )}

      {/* What the selection is made of — the part of it this overlay is covering. The
          bench checked boxes down a list and can no longer see it, and whether eight rows
          are eight cases or three, and which kinds of document they are, changes what
          signing them together means. Facts the screen already holds; no identifier is
          minted for an act that files nothing. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <DescriptionList>
          {signed.kinds.map((kind) => (
            <DescriptionRow key={kind.label} className="border-hairline">
              <DescriptionTerm>{kind.label}</DescriptionTerm>
              <DescriptionDetails className="tabular-nums">
                {kind.count}
              </DescriptionDetails>
            </DescriptionRow>
          ))}
          <DescriptionRow className="border-hairline">
            <DescriptionTerm>Cases</DescriptionTerm>
            <DescriptionDetails className="tabular-nums">
              {signed.cases === 1 ? "1 case" : `${signed.cases} cases`}
            </DescriptionDetails>
          </DescriptionRow>
        </DescriptionList>
      </div>

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
          <Button type="button" onClick={onClose}>
            Done
          </Button>
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
