"use client";

/**
 * A flagged field (or document) in the form, with everything scrutiny said about it.
 *
 * **Why a frame and not an amber field (brief D4).** The owner's wireframe colours the
 * flagged field amber and the resolved one green. In this design system amber *inside a
 * field* is already taken: `prefilled` is `warning-2`, "machine-prefilled,
 * human-unverified field fill", and `foundations/laws` forbids using `warning` as a
 * stand-in for it. The cheque screen — where most of these defects land — is full of
 * prefilled fields, so the two ambers would collide on the same row. So the *frame*
 * carries the state and the input keeps `border-input` and its own fill. Same visual
 * language, correct token roles.
 *
 * Every state carries an icon **and** a word as well as the colour
 * (`foundations/laws`: status never by colour alone).
 *
 * Layering: the frame sits inside a `FormCard`, which is already a lifted panel, so it
 * never lifts again — it is a bordered block on the card, and the officer's feedback is a
 * sunken well inside it. The voice row inside that well goes back to a flat card fill.
 */

import * as React from "react";
import {
  CircleCheckIcon,
  FileTextIcon,
  MessageSquareQuoteIcon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react";

import { displayTargetValue } from "@/lib/filing/targets";
import { breadcrumbOf, defectState, resolutionLabel } from "@/lib/tasks/defects";
import type { Defect } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { AnnotationView } from "@/components/scrutiny/annotation";
import { VoiceNoteRow } from "@/components/scrutiny/voice-note";

/* ───────────────────────────── The feedback block ───────────────────────────── */

/**
 * Everything the officer sent: the written note (always), a spoken remark, a box on the
 * scan, and a suggested value with the paper behind it. A well inside the frame.
 */
export function OfficerFeedback({ defect }: { defect: Defect }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-3">
      <p className="flex items-start gap-2 text-caption font-semibold text-muted-foreground">
        <MessageSquareQuoteIcon className="size-4 shrink-0" aria-hidden />
        What scrutiny said
      </p>
      <p className="text-body text-foreground">{defect.note}</p>

      {defect.voiceNote ? <VoiceNoteRow note={defect.voiceNote} /> : null}
      {defect.annotation ? (
        <AnnotationView annotation={defect.annotation} label={defect.target.label} />
      ) : null}

      {defect.suggestion ? (
        /* A flat card on the sunken well — the well is the recessed layer, so this does
           not lift, and its corner stays a step inside the well's. */
        <DescriptionList className="gap-2 rounded-sm bg-card p-3">
          <DescriptionRow className="border-hairline py-2">
            <DescriptionTerm>Filed as</DescriptionTerm>
            <DescriptionDetails className="tabular-nums line-through decoration-muted-foreground">
              {displayTargetValue(defect.target, defect.suggestion.from) || "— blank —"}
            </DescriptionDetails>
          </DescriptionRow>
          <DescriptionRow className="border-hairline py-2">
            <DescriptionTerm>Scrutiny suggests</DescriptionTerm>
            <DescriptionDetails className="font-medium tabular-nums text-foreground">
              {displayTargetValue(defect.target, defect.suggestion.to)}
            </DescriptionDetails>
          </DescriptionRow>
          {defect.suggestion.evidence ? (
            <DescriptionRow className="border-hairline py-2">
              <DescriptionTerm>From</DescriptionTerm>
              <DescriptionDetails className="flex items-center gap-1.5">
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {defect.suggestion.evidence.name}
              </DescriptionDetails>
            </DescriptionRow>
          ) : null}
        </DescriptionList>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Justification ───────────────────────────── */

/**
 * Disagreement as a first-class resolution (brief D7).
 *
 * It is *required* only where the officer made an explicit suggestion and the advocate
 * went another way — a bare "the IFSC is wrong" answered by a corrected IFSC needs no
 * essay. It is *available* on every field defect, because this is also how the advocate
 * says "the value as filed is right, and here is why", and that is a resolution too. Take
 * it away and the only route past the submit gate is to change a value the advocate
 * believes is correct.
 *
 * Labelled in the advocate's own terms rather than "dispute", which sounds like an
 * interlocutory application — and the label follows what is actually happening, so it does
 * not read as an accusation when the value has simply been corrected.
 */
function Justification({
  defect,
  value,
  required,
  keeping,
  onChange,
}: {
  defect: Defect;
  value: string;
  required: boolean;
  /** The filing still holds what scrutiny saw — the reason is a disagreement, not a note. */
  keeping: boolean;
  onChange: (text: string) => void;
}) {
  const id = `justify-${defect.n}`;
  const missing = required && !value.trim();
  return (
    <Field className="gap-2" data-invalid={missing || undefined}>
      <FieldLabel htmlFor={id} className="text-body-compact">
        {keeping ? "Why this value should stand" : "Why you are changing this value"}
      </FieldLabel>
      <FieldDescription>
        {keeping
          ? "If the filing is right as it stands, say why and this defect is answered — you do not have to change the value to clear it."
          : defect.suggestion
            ? "Scrutiny suggested a value and you have entered a different one."
            : "Optional — add a reason if the correction needs explaining."}{" "}
        Your reason goes back to the Registry with the correction.
      </FieldDescription>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={missing || undefined}
        placeholder={
          keeping
            ? "e.g. The complaint states this as it appears on the cheque leaf; it is the return memo that carries the error."
            : "e.g. The return memo at page 7 reads ₹1,85,000; the figure in the complaint was the typing error."
        }
      />
      {missing ? <FieldError>This defect is not resolved until you say why.</FieldError> : null}
    </Field>
  );
}

/* ───────────────────────────── The frame ───────────────────────────── */

export type FrameActions = {
  /** Take the officer's exact value. */
  accept?: () => void;
  /** Put the filing back the way scrutiny saw it and forget the resolution. */
  undo?: () => void;
  justification: string;
  onJustificationChange: (text: string) => void;
};

export function DefectFrame({
  defect,
  value,
  active,
  actions,
  children,
  onFocusCapture,
  onBlurCapture,
}: {
  defect: Defect;
  /** What the filing currently holds at this defect's target. */
  value: string | undefined;
  active: boolean;
  actions: FrameActions;
  /** The field itself, or the document row. */
  children: React.ReactNode;
  onFocusCapture?: () => void;
  /** Focus leaving the frame ends the act — the screen writes the record then. */
  onBlurCapture?: (event: React.FocusEvent<HTMLElement>) => void;
}) {
  const state = defectState(defect, value);
  const resolved = state === "resolved";
  const trail = breadcrumbOf(defect.target).join(" › ");
  const showAccept =
    !!defect.suggestion && !!actions.accept && value !== defect.suggestion.to;
  const needsReason = state === "needs-justification";
  const keeping = (value ?? "").trim() === (defect.valueAtReturn ?? "").trim();
  /* Every field defect can carry a reason; only taking scrutiny's exact value makes one
     pointless, because there is then nothing to explain. */
  const justifiable = defect.target.kind === "field" && !resolvedBySuggestion(defect, value);

  return (
    <section
      id={`defect-${defect.n}`}
      data-defect-frame
      aria-label={`Defect ${defect.n} — ${trail}`}
      aria-current={active ? "true" : undefined}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
      /* One cue at a time: the frame's border and strip say what state the defect is in,
         the queue card's lift says which one is current, and the ring belongs to whatever
         actually has focus inside. Stacking all three is the "selection costume".
         `col-span-full` because a frame that lands in a two-up `FormRow` would otherwise
         hold the officer's reasoning in half a column. */
      className={cn(
        "col-span-full scroll-mt-6 overflow-hidden rounded-lg border bg-card transition-colors",
        resolved ? "border-success-ink" : "border-warning-ink"
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2",
          resolved
            ? "bg-success-muted text-success-muted-foreground"
            : "bg-warning-muted text-warning-muted-foreground"
        )}
      >
        {resolved ? (
          <CircleCheckIcon className="size-4 shrink-0" aria-hidden />
        ) : (
          <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
        )}
        <span className="text-caption font-semibold tabular-nums">
          Defect {defect.n}
        </span>
        <span aria-hidden>·</span>
        <span className="text-caption">
          {resolved ? resolutionLabel(defect, value) : needsReason ? "Needs a reason" : "Open"}
        </span>
        <span className="ml-auto text-caption">{trail}</span>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Named so "Go to the field" lands on the control the defect is about, and not on
            whatever focusable the label happens to carry. */}
        <div data-defect-control>{children}</div>

        <OfficerFeedback defect={defect} />

        {justifiable ? (
          <Justification
            defect={defect}
            value={actions.justification}
            required={needsReason}
            keeping={keeping}
            onChange={actions.onJustificationChange}
          />
        ) : null}

        {showAccept || actions.undo ? (
          <div className="flex flex-wrap items-center gap-2">
            {showAccept ? (
              <Button type="button" variant="secondary" onClick={actions.accept}>
                Use scrutiny&apos;s value
              </Button>
            ) : null}
            {actions.undo ? (
              <Button
                type="button"
                variant="ghost"
                onClick={actions.undo}
                className="text-muted-foreground"
              >
                <Undo2Icon data-icon="inline-start" aria-hidden />
                Undo
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function resolvedBySuggestion(defect: Defect, value: string | undefined): boolean {
  return !!defect.suggestion && (value ?? "").trim() === defect.suggestion.to.trim();
}
