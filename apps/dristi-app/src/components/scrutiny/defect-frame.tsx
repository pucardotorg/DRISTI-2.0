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
        <DescriptionList className="gap-2 rounded-md border border-hairline bg-card p-3">
          <DescriptionRow className="border-hairline py-2">
            <DescriptionTerm>Filed as</DescriptionTerm>
            <DescriptionDetails className="tabular-nums line-through decoration-muted-foreground">
              {defect.suggestion.from || "— blank —"}
            </DescriptionDetails>
          </DescriptionRow>
          <DescriptionRow className="border-hairline py-2">
            <DescriptionTerm>Scrutiny suggests</DescriptionTerm>
            <DescriptionDetails className="font-medium tabular-nums text-foreground">
              {defect.suggestion.to}
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
 * Disagreement as a first-class resolution (brief D7). Required only where the officer
 * made an explicit suggestion and the advocate went another way: a bare "the IFSC is
 * wrong" answered by a corrected IFSC needs no essay. Labelled in the advocate's own
 * terms rather than "dispute", which sounds like an interlocutory application.
 */
function Justification({
  defect,
  value,
  required,
  onChange,
}: {
  defect: Defect;
  value: string;
  required: boolean;
  onChange: (text: string) => void;
}) {
  const id = `justify-${defect.n}`;
  const missing = required && !value.trim();
  return (
    <Field className="gap-2" data-invalid={missing || undefined}>
      <FieldLabel htmlFor={id} className="text-body-compact">
        Why you are changing this value
      </FieldLabel>
      <FieldDescription>
        Scrutiny suggested a value and you have entered a different one. Your reason goes
        back to the registry with the correction.
      </FieldDescription>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={missing || undefined}
        placeholder="e.g. The return memo at page 7 reads ₹1,85,000; the figure in the complaint was the typing error."
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
}: {
  defect: Defect;
  /** What the filing currently holds at this defect's target. */
  value: string | undefined;
  active: boolean;
  actions: FrameActions;
  /** The field itself, or the document row. */
  children: React.ReactNode;
  onFocusCapture?: () => void;
}) {
  const state = defectState(defect, value);
  const resolved = state === "resolved";
  const trail = breadcrumbOf(defect.target).join(" › ");
  const showAccept =
    !!defect.suggestion && !!actions.accept && value !== defect.suggestion.to;
  const needsReason = state === "needs-justification";
  const justifiable = !!defect.suggestion && !resolvedBySuggestion(defect, value);

  return (
    <section
      id={`defect-${defect.n}`}
      aria-label={`Defect ${defect.n} — ${trail}`}
      onFocusCapture={onFocusCapture}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-lg border bg-card transition-colors",
        resolved ? "border-success-ink" : "border-warning-ink",
        active && "ring-3 ring-focus-ring"
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
        {children}

        <OfficerFeedback defect={defect} />

        {justifiable ? (
          <Justification
            defect={defect}
            value={actions.justification}
            required={needsReason}
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
