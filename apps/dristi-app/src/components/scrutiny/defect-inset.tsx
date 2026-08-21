"use client";

/**
 * The scrutiny layer over a flagged field — a 2px accent on the field group, and a sunken
 * inset nested under it (brief §15.2, §15.5).
 *
 * The rule the whole thing hangs on: **the flagged form field is never directly edited.**
 * A defect is answered by *accepting scrutiny's correction* or by *entering your own
 * value* in the inset. That sanctity is the point — the value the Registry saw stays
 * legible and unaltered on the form while the exchange about it happens in the layer
 * beneath, and every changed value in a correction round therefore has a named author.
 *
 * Three tiers, and one rule generates which of them a defect shows: *tier 2 collapses
 * only what tier 1 has made redundant.*
 *
 *   1. always visible — the correction as old → new, **Accept** and **Ignore**, and the
 *      document as a small thumbnail on the e-filing upload pattern. Where there is no
 *      correction to compare against, the officer's note *is* the instruction, so it is
 *      promoted here and never hidden.
 *   2. collapsed — "What scrutiny said": the note, the spoken remark and its transcript,
 *      together. WCAG 1.2.1 is unaffected: the text alternative lives in the *same*
 *      disclosure as the audio, so it is never absent when the audio is present.
 *   3. opened by Ignore — "Your corrected value": one control of the field's own kind,
 *      prefilled with what the filing holds, and one reason field.
 *
 * **Ignore is a route, not a resolution.** Ignore followed by nothing entered leaves the
 * defect open and the submit gate shut — resolution is derived from the filing (D6), never
 * self-certified, and this is the thing most likely to be built wrong.
 *
 * Layering: the inset is `surface-sunken` with **no border**, inside the section card's own
 * `p-6` — sunken and inset, never edge-to-edge (`foundations/elevation`: nested wells use
 * `surface-sunken` with no border; depth is fill, not borders). It does not lift: the
 * filing's own section cards own the elevation on this screen (§15.9).
 */

import * as React from "react";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react";

import {
  displayTargetValue,
  targetControlKind,
} from "@/lib/filing/targets";
import { defectState, reasonRequired, resolutionLabel } from "@/lib/tasks/defects";
import type { Defect } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useFilePreview } from "@/lib/filing/files";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/filing/date-field";
import { PrefixInput, TextField } from "@/components/filing/inputs";
import { Lightbox } from "@/components/filing/lightbox";
import { regionFromBox } from "@/components/filing/source-panel";
import { SlotThumbnail, ThumbnailWell } from "@/components/filing/upload/thumbnail";
import { VoiceNoteRow } from "@/components/scrutiny/voice-note";

/* ───────────────────────────── What it can do ───────────────────────────── */

export type DefectActions = {
  /** Take the officer's exact value. Only where there is a suggestion. */
  accept?: () => void;
  /** Write the advocate's own value at this defect's target. */
  setValue: (value: string) => void;
  /** Put the filing back the way scrutiny saw it and forget the resolution. */
  undo?: () => void;
  reason: string;
  onReasonChange: (text: string) => void;
  /** Document defects: open the file picker for the flagged slot. */
  replace?: () => void;
};

/* ───────────────────────────── The evidence ───────────────────────────── */

/**
 * The document the defect points at, as the small page-shaped thumbnail the advocate
 * already knows from the upload screen. Clicking it opens the full view with the
 * officer's box drawn over the page — the inset never renders an annotated page inline.
 */
function DefectDocument({ defect }: { defect: Defect }) {
  const [open, setOpen] = React.useState(false);
  const file = defect.annotation?.file ?? defect.suggestion?.evidence;
  const preview = useFilePreview(file);
  if (!file) return null;

  const region = defect.annotation
    ? regionFromBox(defect.annotation.box, defect.annotation.page)
    : undefined;
  const alt = defect.annotation
    ? `${file.name} — the page scrutiny marked for ${defect.target.label}`
    : `${file.name} — the document scrutiny relied on for ${defect.target.label}`;
  const imageUrl = preview.status === "ready" ? preview.imageUrl : null;

  return (
    <div className="flex items-center gap-3">
      <ThumbnailWell>
        <SlotThumbnail
          file={file}
          label={defect.target.label}
          onPreview={() => setOpen(true)}
        />
      </ThumbnailWell>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-caption font-medium text-foreground">{file.name}</span>
        <span className="text-caption text-muted-foreground">
          {defect.annotation ? "Marked by scrutiny" : "Filed with the complaint"}
        </span>
      </div>
      {imageUrl ? (
        <Lightbox
          open={open}
          onOpenChange={setOpen}
          src={imageUrl}
          alt={alt}
          region={region}
          caption={defect.annotation ? `Marked by scrutiny on ${file.name}` : file.name}
        />
      ) : null}
    </div>
  );
}

/* ───────────────────────────── What scrutiny said ───────────────────────── */

/** The note, the spoken remark, and the transcript — one block, wherever it is shown. */
function OfficerWords({ defect }: { defect: Defect }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body-compact text-foreground">{defect.note}</p>
      {defect.voiceNote ? <VoiceNoteRow note={defect.voiceNote} /> : null}
    </div>
  );
}

/* ───────────────────────────── Your corrected value ─────────────────────── */

/**
 * D7's rule, in one field.
 *
 * The reason is *required* when the entered value contradicts an explicit suggestion, and
 * when the value that stands is the one already filed against such a suggestion — "my
 * value stands" is a position, and a position without a reason is not one the Registry
 * can read. It is *optional* on a bare-note correction: a bare "the IFSC is wrong"
 * answered by a corrected IFSC needs no essay, and taxing the honest path at the rate of
 * the contested one is the asymmetry D7 already decided against. Which of the two a
 * prefilled, untouched control is, is `reasonRequired`'s question — not this component's.
 */
function Reason({
  defect,
  value,
  required,
  overriding,
  keeping,
  onChange,
}: {
  defect: Defect;
  value: string;
  required: boolean;
  /** The value entered contradicts an explicit suggestion — the reason is already owed. */
  overriding: boolean;
  keeping: boolean;
  onChange: (text: string) => void;
}) {
  const id = `reason-${defect.n}`;
  /*
   * Required is not the same as wrong. A defect whose tier 3 has just opened has a
   * prefilled value and an empty reason, and marking that invalid on arrival is a form
   * shouting at someone who has not done anything yet. The error appears when the reason
   * is actually owed — an explicit suggestion has been overridden — or when the advocate
   * has been in the field and left it empty.
   */
  const [touched, setTouched] = React.useState(false);
  const missing = required && !value.trim() && (overriding || touched);
  const blank = !(defect.valueAtReturn ?? "").trim();
  return (
    <Field className="gap-2" data-invalid={missing || undefined}>
      <FieldLabel htmlFor={id} className="text-body-compact">
        {/* The label follows what is actually happening, and never the word "dispute" —
            which sounds like an interlocutory application (D7). A field scrutiny says is
            *missing* has no value to stand, so keeping it says the blank is the answer. */}
        {!keeping
          ? "Why you are entering a different value"
          : blank
            ? "Why this field should stay blank"
            : "Why this value should stand"}
        {required ? null : (
          <span className="font-normal text-muted-foreground">optional</span>
        )}
      </FieldLabel>
      <FieldDescription>
        Your reason goes back to the Registry with the correction.
      </FieldDescription>
      <Textarea
        id={id}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={missing || undefined}
        placeholder={
          !keeping
            ? "e.g. The return memo at page 7 reads ₹92,000."
            : blank
              ? "e.g. The complainant's age is not on any document filed with the complaint."
              : "e.g. The complaint states this as it appears on the cheque leaf."
        }
      />
      {missing ? <FieldError>This defect is not resolved until you say why.</FieldError> : null}
    </Field>
  );
}

/** The control the field itself uses, so a date is picked and an amount is in rupees. */
function CorrectedValue({
  defect,
  value,
  onChange,
  focusTarget,
}: {
  defect: Defect;
  value: string;
  onChange: (value: string) => void;
  focusTarget: boolean;
}) {
  const id = `own-${defect.n}`;
  const kind = targetControlKind(defect.target);
  const mark = focusTarget ? "" : undefined;
  return (
    <Field className="gap-2">
      {/* The label the brief names (§15.2: "one control … labelled 'Your corrected
          value'"), and *not* the field's name again: the form's own label, the "Scrutiny
          flagged" tag beside it and the inset's first line have already said which field
          this is, and a fourth telling is what makes the layer read as a card (§15.9).
          It is `sr-only` because the accordion trigger directly above carries the same
          words to the eye — the label exists so the control is still named to a screen
          reader and to voice control, which cannot use the trigger as one. */}
      <FieldLabel htmlFor={id} className="sr-only">
        Your corrected value
      </FieldLabel>
      {kind === "date" ? (
        <DateField id={id} value={value} onChange={onChange} />
      ) : kind === "amount" ? (
        <PrefixInput
          id={id}
          prefix="₹"
          value={value}
          onChange={onChange}
          inputMode="numeric"
          data-defect-focus={mark}
        />
      ) : (
        <TextField id={id} value={value} onChange={onChange} data-defect-focus={mark} />
      )}
    </Field>
  );
}

/* ───────────────────────────── The inset ───────────────────────────── */

export function DefectInset({
  defect,
  value,
  actions,
  ambiguous = false,
  className,
}: {
  defect: Defect;
  /** What the filing currently holds at this defect's target. */
  value: string | undefined;
  actions: DefectActions;
  /**
   * The flagged field shares its row with another field, so the inset spanning the row
   * beneath cannot say which of the two it belongs to by position alone (§15.5). Only
   * then does the first line name the field — see the comment where it is rendered.
   */
  ambiguous?: boolean;
  className?: string;
}) {
  const state = defectState(defect, value);
  const resolved = state === "resolved";
  const needsReason = state === "needs-justification";
  const isDoc = defect.target.kind === "doc";
  const suggestion = defect.suggestion;

  /* Tier 3 opens on Ignore, and stays open by itself where it is the only action there
     is — a bare note, or a document with nothing to accept (§15.4). It is also forced open
     while a reason is owed, because that is where the reason is written. */
  const forcedOwnValue = !suggestion || needsReason;
  const [openTiers, setOpenTiers] = React.useState<string[]>([]);
  const openItems = forcedOwnValue
    ? Array.from(new Set([...openTiers, "own"]))
    : openTiers;
  /* The first line is what tells a screen-reader user *where* the read-only control is
     answered, so the control points at it with `aria-describedby` (`ACCESSIBILITY.md`:
     "read-only" on its own says nothing about where to act). */
  const ledeId = `defect-lede-${defect.n}`;
  const ownContentId = `defect-own-${defect.n}`;

  /* Has the value ever left what scrutiny saw? A prefilled control the advocate has not
     touched is not yet a kept position — see `reasonRequired`. */
  const atReturn = (defect.valueAtReturn ?? "").trim();
  const [everChanged, setEverChanged] = React.useState(
    () => !isDoc && (value ?? "").trim() !== atReturn
  );
  if (!everChanged && !isDoc && (value ?? "").trim() !== atReturn) setEverChanged(true);

  /* Just changed: a brief wash that fades, and the one loudness-ladder slot nothing else
     uses. Not a toast — eight of those across a return is alarm fatigue (§15.8). The flip
     is noticed during render rather than in an effect, so the wash is on the same paint as
     the accent going green. */
  const [washed, setWashed] = React.useState(false);
  const [seenResolved, setSeenResolved] = React.useState(resolved);
  if (seenResolved !== resolved) {
    setSeenResolved(resolved);
    setWashed(resolved);
  }
  React.useEffect(() => {
    if (!washed) return;
    const id = window.setTimeout(() => setWashed(false), 1000);
    return () => window.clearTimeout(id);
  }, [washed]);

  /*
   * The inset collapses when the correction registers — but not out from under someone
   * who is still typing it. A reason resolves a defect on its first keystroke (the value
   * stands, and now there is a why), and collapsing then would take the field away
   * mid-sentence. So the collapse waits for the act to end: the accent, the queue row and
   * the counter still flip live, which is the answer to "did that register?".
   */
  const root = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const [typing, setTyping] = React.useState(false);
  const wasInside = React.useRef(false);
  const collapsed = resolved && !typing;

  /* Collapsing removes whatever had focus — Accept, or the reason field — so focus lands
     on the row that replaced it rather than falling to the document. */
  React.useLayoutEffect(() => {
    if (!collapsed || !wasInside.current) return;
    if (root.current?.contains(document.activeElement)) return;
    trigger.current?.focus();
    wasInside.current = false;
  }, [collapsed]);

  /* Ignore opens tier 3 — so focus goes there. Leaving it on the Ignore button makes the
     keyboard user tab past everything the disclosure just inserted to reach the control
     they asked for, which is the same trap D5 already answered for the queue: move focus,
     do not merely reveal. Mirrors the collapse-and-land effect above. */
  const landInOwnValue = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!landInOwnValue.current || !openItems.includes("own")) return;
    landInOwnValue.current = false;
    const content = root.current?.querySelector<HTMLElement>(`#${CSS.escape(ownContentId)}`);
    const control = content?.querySelector<HTMLElement>(
      "[data-defect-focus]:not([disabled]), input:not([disabled]):not([type=hidden]), textarea:not([disabled]), button:not([disabled])"
    );
    control?.focus({ preventScroll: true });
  });

  const watch = {
    ref: root,
    onFocusCapture: (event: React.FocusEvent<HTMLElement>) => {
      wasInside.current = true;
      const el = event.target as HTMLElement;
      setTyping(el.matches?.("input, textarea") ?? false);
    },
    onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
      setTyping(false);
      if (!root.current?.contains(event.relatedTarget as Node | null)) {
        wasInside.current = false;
      }
    },
  };

  const filed = displayTargetValue(defect.target, defect.valueAtReturn) || "— blank —";
  const shell = cn(
    "mt-2 flex flex-col gap-2 rounded-md p-3 transition-colors duration-700",
    washed ? "bg-success-muted" : "bg-surface-sunken",
    className
  );

  /* ── Resolved: the inset collapses to one row ──────────────────────────── */
  if (collapsed) {
    return (
      <div data-defect-inset className={shell} {...watch}>
        <Collapsible className="group/done">
          <CollapsibleTrigger asChild>
            <Button
              ref={trigger}
              type="button"
              variant="ghost"
              className="h-auto min-h-10 w-full justify-start gap-2 whitespace-normal px-2 py-2 text-left font-normal hover:bg-accent"
            >
              <CircleCheckIcon className="size-4 shrink-0 text-success-ink" aria-hidden />
              <span id={ledeId} className="text-body-compact font-medium text-success-ink">
                {resolutionLabel(defect, value)}
              </span>
              {isDoc ? null : (
                <span className="min-w-0 text-caption text-muted-foreground tabular-nums">
                  was {filed}
                </span>
              )}
              {/* A collapsed row with nothing to say it opens is a row nobody opens — and
                  what it holds is the officer's material and the undo. */}
              <ChevronDownIcon
                aria-hidden
                className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/done:rotate-180"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 px-2 pt-3">
            <OfficerWords defect={defect} />
            <DefectDocument defect={defect} />
            {defect.resolution?.justification ? (
              <div className="flex flex-col gap-1">
                <p className="text-caption font-medium text-muted-foreground">
                  Sent back with the correction
                </p>
                <p className="text-body-compact text-foreground">
                  {defect.resolution.justification}
                </p>
              </div>
            ) : null}
            {actions.undo ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpenTiers([]);
                  actions.undo?.();
                }}
                className="w-fit text-muted-foreground"
              >
                <Undo2Icon data-icon="inline-start" aria-hidden />
                Undo
              </Button>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  /* ── Open: three tiers ─────────────────────────────────────────────────── */
  const keeping = !isDoc && (value ?? "").trim() === (defect.valueAtReturn ?? "").trim();
  const required = reasonRequired(defect, value, everChanged);

  return (
    <div data-defect-inset className={shell} {...watch}>
      {/* The first line: the state in an icon and a word — status is never colour alone
          (`foundations/laws`). Not a chip, not a strip: a line on the inset's own fill.

          The field's name is appended *only* where the inset cannot say which field it
          belongs to by position — a two-up row, where it spans beneath both (§15.5). On a
          row the field owns alone the name is already above it, on the label, beside the
          "Scrutiny flagged" tag; repeating it a third time is what turns a thin layer
          into a defect card (§15.9). */}
      <p id={ledeId} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {resolved ? (
          <span className="flex items-center gap-1.5 text-caption font-medium text-success-ink">
            <CircleCheckIcon className="size-4 shrink-0" aria-hidden />
            {resolutionLabel(defect, value)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-caption font-medium text-warning-ink">
            <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
            {needsReason ? "Needs a reason" : "Open"}
          </span>
        )}
        {ambiguous ? (
          <>
            <span aria-hidden className="text-caption text-muted-foreground">
              ·
            </span>
            <span className="text-caption text-muted-foreground">{defect.target.label}</span>
          </>
        ) : null}
      </p>

      {/* Tier 1. Where there is a correction to compare against, it is the reasoning in
          its most compressed form; where there is not, the note is the instruction. */}
      {suggestion ? (
        <>
          <DescriptionList className="gap-0">
            <DescriptionRow className="border-hairline py-2">
              <DescriptionTerm>Filed as</DescriptionTerm>
              <DescriptionDetails className="tabular-nums line-through decoration-muted-foreground">
                {displayTargetValue(defect.target, suggestion.from) || "— blank —"}
              </DescriptionDetails>
            </DescriptionRow>
            <DescriptionRow className="border-hairline py-2">
              <DescriptionTerm>Scrutiny suggests</DescriptionTerm>
              <DescriptionDetails className="font-medium tabular-nums text-foreground">
                {displayTargetValue(defect.target, suggestion.to)}
              </DescriptionDetails>
            </DescriptionRow>
          </DescriptionList>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={actions.accept}
              data-defect-focus
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpenTiers((prev) => Array.from(new Set([...prev, "own"])));
                landInOwnValue.current = true;
              }}
              aria-expanded={openItems.includes("own")}
              aria-controls={ownContentId}
              className="text-muted-foreground"
            >
              Ignore
            </Button>
          </div>
        </>
      ) : (
        <OfficerWords defect={defect} />
      )}

      <DefectDocument defect={defect} />

      {/* Tiers 2 and 3. `multiple` so reading what scrutiny said never closes the place
          the answer is typed. */}
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenTiers}
      >
        {suggestion ? (
          <AccordionItem value="said" className="border-hairline">
            <AccordionTrigger className="min-h-10 text-body-compact text-muted-foreground hover:no-underline">
              What scrutiny said
            </AccordionTrigger>
            <AccordionContent className="h-auto pb-3">
              <OfficerWords defect={defect} />
            </AccordionContent>
          </AccordionItem>
        ) : null}

        <AccordionItem value="own" className="border-hairline">
          <AccordionTrigger className="min-h-10 text-body-compact text-muted-foreground hover:no-underline">
            {isDoc ? "Your replacement document" : "Your corrected value"}
          </AccordionTrigger>
          {/* `forceMount` so the region Ignore names in `aria-controls` exists before it
              is opened — Radix otherwise mints the id only while open, and a button that
              says it controls something has to point at something. Closed content is
              still `hidden`, so nothing inside it is reachable or read. */}
          <AccordionContent
            forceMount
            id={ownContentId}
            className="flex h-auto flex-col gap-3 pb-3"
          >
            {isDoc ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={actions.replace}
                  data-defect-focus
                  className="w-fit"
                >
                  <RefreshCwIcon data-icon="inline-start" aria-hidden />
                  Replace this document
                </Button>
                <p className="text-caption text-muted-foreground">
                  Replacing the scan does not re-read it — no other field in the filing
                  changes.
                </p>
              </>
            ) : (
              <>
                <CorrectedValue
                  defect={defect}
                  value={value ?? ""}
                  onChange={actions.setValue}
                  focusTarget={!suggestion}
                />
                <Reason
                  defect={defect}
                  value={actions.reason}
                  required={required}
                  overriding={needsReason}
                  keeping={keeping}
                  onChange={actions.onReasonChange}
                />
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/**
 * Does the flagged field share its row with another field?
 *
 * This is the whole question §15.5's disambiguator exists for. The inset spans the row
 * *beneath* the field group, so where the row holds two fields side by side, position
 * alone cannot say which of them the inset answers — and only then does its first line
 * name the field. Where the field has the row to itself (a full-width field, or any field
 * at a width where the form has folded to one column), the inset sits directly under the
 * only thing it could belong to, and naming the field again is the fourth telling that
 * makes a thin layer read as a card (§15.9).
 *
 * It is measured rather than declared because the answer changes with the viewport: the
 * same two-up row is one column on a phone. The two facts asked of the DOM are the ones
 * the layout actually turns on — is the row rendering more than one column, and is there
 * a sibling in it that is neither this group nor its inset.
 */
function useSharesItsRow(group: React.RefObject<HTMLElement | null>): boolean {
  const [shared, setShared] = React.useState(false);
  React.useEffect(() => {
    const el = group.current;
    const row = el?.parentElement;
    if (!el || !row) return;
    const measure = () => {
      const columns = window
        .getComputedStyle(row)
        .gridTemplateColumns.split(" ")
        .filter((track) => track && track !== "none").length;
      const neighbour = Array.from(row.children).some(
        (child) => child !== el && !child.querySelector("[data-defect-inset]")
      );
      setShared(columns > 1 && neighbour);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [group]);
  return shared;
}

/* ───────────────────────── The layer on the form ───────────────────────── */

/**
 * The two things the correction screen puts on a flagged field: the accent down its left,
 * and the inset under the row.
 *
 * They are siblings rather than one wrapper because the form's rows must not be relaid
 * (§15.1): the group stays in the field's own grid cell, and the inset spans the row
 * beneath it. `warning-ink` as a *stroke* is not the "ink as a fill" violation — it is how
 * the officer's own marked region is already drawn in the full view (`regionFromBox` in
 * `filing/source-panel`, outlined in the `Lightbox`).
 */
export function DefectLayer({
  defect,
  value,
  actions,
  children,
  onFocusCapture,
  onBlurCapture,
}: {
  defect: Defect;
  value: string | undefined;
  actions: DefectActions;
  /** The field itself, or the document row. */
  children: React.ReactNode;
  onFocusCapture?: () => void;
  /** Focus leaving the layer ends the act — the screen writes the record then. */
  onBlurCapture?: (event: React.FocusEvent<HTMLElement>) => void;
}) {
  const resolved = defectState(defect, value) === "resolved";
  const group = React.useRef<HTMLDivElement>(null);
  const ambiguous = useSharesItsRow(group);
  /* The group and its inset are siblings, so "focus left this defect" cannot be answered
     by `currentTarget.contains()` — it is answered by asking whether the focus landed on
     anything belonging to the same defect. One act, one line of history. */
  const leaving = (event: React.FocusEvent<HTMLElement>) => {
    const to = event.relatedTarget as HTMLElement | null;
    if (to?.closest?.(`[data-defect="${defect.n}"]`)) return;
    onBlurCapture?.(event);
  };
  return (
    <>
      <div
        ref={group}
        id={`defect-${defect.n}`}
        data-defect-group
        data-defect={defect.n}
        onFocusCapture={onFocusCapture}
        onBlurCapture={leaving}
        className={cn(
          "scroll-mt-6 border-l-2 pl-3 transition-colors",
          resolved ? "border-l-success-ink" : "border-l-warning-ink"
        )}
      >
        {children}
      </div>
      <div
        data-defect={defect.n}
        className="col-span-full"
        onFocusCapture={onFocusCapture}
        onBlurCapture={leaving}
      >
        <DefectInset
          defect={defect}
          value={value}
          actions={actions}
          ambiguous={ambiguous}
        />
      </div>
    </>
  );
}
