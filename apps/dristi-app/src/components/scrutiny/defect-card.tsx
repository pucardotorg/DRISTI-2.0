"use client";

/**
 * One defect, worked on in the panel (brief v3.2).
 *
 * v2.1 put a layer under the flagged field *and* a row in the queue, so every defect spoke
 * twice and all of the officer's evidence was expanded before anyone had decided they
 * needed it. v3 gave each side one job: the form is the record, and this card — in the
 * panel — is the only place a correction is made. That is why nothing here is repeated on
 * the form, and why the form's control is no longer editable at all.
 *
 * At rest the card is three things:
 *
 *   1. **What it is** — the field, and where it lives.
 *   2. **The comparison** — two labelled rows, *You filed* over *Scrutiny reads*. No
 *      strikethrough, no arrow: the values are right-aligned in `tabular-nums`, so the
 *      character that changed sits directly under its counterpart and the eye finds the
 *      difference without decoration.
 *   3. **One primary action** — *Use <the value>*, which states its own outcome, beside a
 *      quiet *Keep mine*.
 *
 * Everything else — the officer's note or spoken remark, and the marked page — is one line,
 * *Why it was flagged*, opened by the minority who want to check and by everyone about to
 * disagree (so *Keep mine* opens it).
 *
 * **Keep mine is a route, not a resolution.** Choosing it and writing nothing leaves the
 * defect open and the submit gate shut — resolution is derived from the filing (D6), never
 * self-certified, and this is the thing most likely to be built wrong.
 *
 * A note and a spoken remark are *alternatives*: an officer leaves one or the other. Where
 * both somehow exist the note sits above the player and the layout is unchanged.
 */

import * as React from "react";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  InfoIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react";

import { displayTargetValue, targetControlKind } from "@/lib/filing/targets";
import { defectState, reasonRequired, resolutionLabel } from "@/lib/tasks/defects";
import type { Defect } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { useFilePreview } from "@/lib/filing/files";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/filing/date-field";
import { PrefixInput, TextField } from "@/components/filing/inputs";
import { Lightbox } from "@/components/filing/lightbox";
import { regionFromBox } from "@/components/filing/source-panel";
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

/* ───────────────────────── The page, cropped to the mark ───────────────────────── */

/**
 * The region the officer drew a box around — cropped, not the whole page.
 *
 * A full cheque scan at panel width is illegible, which makes it decoration rather than
 * evidence. `regionFromBox` already gives the box as fractions of the page, so the image is
 * scaled by the inverse of the region's width and offset to bring that region into the
 * frame. The officer's own outline is then drawn on the frame's edge, because after the
 * crop the region *is* the frame.
 */
function MarkedRegion({ defect }: { defect: Defect }) {
  const [open, setOpen] = React.useState(false);
  const file = defect.annotation?.file ?? defect.suggestion?.evidence;
  const preview = useFilePreview(file);
  if (!file) return null;

  const region = defect.annotation
    ? regionFromBox(defect.annotation.box, defect.annotation.page)
    : undefined;
  const imageUrl = preview.status === "ready" ? preview.imageUrl : null;
  const alt = defect.annotation
    ? `${file.name} — the part of the page scrutiny marked for ${defect.target.label}`
    : `${file.name} — the document scrutiny relied on for ${defect.target.label}`;

  /* Percentages from `regionFromBox` ("42.10%"), back to fractions for the crop maths. */
  const frac = (v: string | undefined) => (v ? parseFloat(v) / 100 : 0);
  const w = region ? frac(region.width) : 0;
  const h = region ? frac(region.height) : 0;
  const page = defect.annotation?.page;
  const cropped = !!region && !!page && w > 0.02 && h > 0.005;

  /*
   * The crop, in two moves that each resolve against the right box.
   *
   * `width` and `left` are percentages of the *container*, which is what they should be:
   * blowing the image up to `1/w` of the frame makes the region exactly one frame wide, and
   * sliding it left by `l/w` brings the region's left edge to the frame's. The vertical
   * offset cannot work the same way — a `top` percentage resolves against the container's
   * height, not the image's, so it slid by the wrong distance and threw the region off the
   * frame. `translateY` resolves against the *element's own* height, which is the image's,
   * so shifting by `-t` lands the region's top edge exactly whatever the frame's height.
   *
   * The region's rendered shape is then known without measuring anything: its width over
   * its height is `(w · pageWidth) / (h · pageHeight)`. The frame takes that ratio — so the
   * mark usually fills it exactly — clamped so a near-square region cannot grow a card-tall
   * image and a hairline one still has something to look at.
   */
  const regionAspect = cropped ? (w * page!.width) / (h * page!.height) : 16 / 10;
  const frameAspect = Math.min(Math.max(regionAspect, 1.5), 7);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${file.name} at full size`}
        className="group/scan block w-full overflow-hidden rounded-md border border-hairline bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className="relative block w-full overflow-hidden"
          style={{ aspectRatio: cropped ? `${frameAspect}` : "16 / 10" }}
        >
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={alt}
              className="absolute"
              style={
                cropped
                  ? {
                      width: `${100 / w}%`,
                      maxWidth: "none",
                      left: `${-frac(region!.left) * (100 / w)}%`,
                      top: 0,
                      transform: `translateY(${-frac(region!.top) * 100}%)`,
                    }
                  : { inset: 0, width: "100%", height: "100%", objectFit: "contain" }
              }
            />
          ) : (
            <span className="absolute inset-0 bg-surface-sunken" />
          )}
          {/* The officer's own outline, drawn at the region's rendered shape — which is the
              frame's, wherever the clamp did not bite. */}
          {cropped ? (
            <span
              aria-hidden
              style={{ aspectRatio: `${regionAspect}` }}
              className="pointer-events-none absolute left-0 top-0 w-full rounded-sm border-2 border-warning-ink"
            />
          ) : null}
        </span>
      </button>

      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        <span className="min-w-0 truncate">
          {defect.annotation ? `${file.name} — the part scrutiny marked` : file.name}
        </span>
        <span className="ml-auto shrink-0 font-medium text-brand-muted-foreground">
          See full page
        </span>
      </p>

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

/* ───────────────────────── Why it was flagged ───────────────────────── */

/**
 * The officer's reason: a typed note **or** a spoken remark, and the page it came from.
 *
 * Who wrote it is not shown. Only scrutiny flags a filing, so an officer's name told the
 * advocate nothing they did not already know and spent the space that the reason needed.
 */
function WhyFlagged({ defect }: { defect: Defect }) {
  const spoken = defect.voiceNote;
  /* Alternatives, not a stack: the note is shown when it is the message, or when an
     officer has left both — in which case it reads first and the remark follows. */
  const showNote = !spoken || !!defect.note.trim();
  return (
    <div className="flex flex-col gap-3">
      {showNote && defect.note.trim() ? (
        <p className="text-body-compact text-foreground">{defect.note}</p>
      ) : null}
      {spoken ? <VoiceNoteRow note={spoken} /> : null}
      <MarkedRegion defect={defect} />
    </div>
  );
}

/* ───────────────────────── The comparison ───────────────────────── */

/**
 * *You filed* over *Scrutiny reads* — two labelled rows, values right-aligned in
 * `tabular-nums` so the character that changed lines up with the one it replaced. This is
 * the whole reason the strikethrough and the arrow are gone: alignment carries the
 * difference, and the labels carry who said which.
 */
function Compare({
  defect,
  supersededOnly = false,
}: {
  defect: Defect;
  /** In the Keep-mine view only scrutiny's reading is left, and it stands down. */
  supersededOnly?: boolean;
}) {
  const suggestion = defect.suggestion;
  if (!suggestion) return null;
  const filed = displayTargetValue(defect.target, suggestion.from) || "Blank";
  const reads = displayTargetValue(defect.target, suggestion.to);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-hairline",
        supersededOnly && "opacity-60"
      )}
    >
      {supersededOnly ? null : (
        <div className="flex items-center justify-between gap-4 bg-surface-sunken px-3.5 py-2.5">
          <span className="shrink-0 text-caption text-muted-foreground">You filed</span>
          <span className="min-w-0 text-right text-body-compact tabular-nums text-muted-foreground">
            {filed}
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-3.5 py-2.5",
          supersededOnly ? "bg-surface-sunken" : "border-t border-hairline bg-card"
        )}
      >
        <span
          className={cn(
            "shrink-0 text-caption font-medium",
            supersededOnly ? "text-muted-foreground" : "text-brand-muted-foreground"
          )}
        >
          {supersededOnly ? "Scrutiny read" : "Scrutiny reads"}
        </span>
        <span
          className={cn(
            "min-w-0 text-right tabular-nums",
            supersededOnly
              ? "text-body-compact text-muted-foreground"
              : "text-body font-semibold text-foreground"
          )}
        >
          {reads}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── Keeping your own value ───────────────────────── */

/** The control the field itself uses, so a date is picked and an amount is in rupees. */
function OwnValue({
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
      {/* Labelled with the field's own name. "Your value" named nothing — this is the
          only control here, and the thing it holds is the cheque's date. */}
      <FieldLabel htmlFor={id} className="text-body-compact">
        {defect.target.label}
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

/**
 * D7's rule, in one field — now named for what it is.
 *
 * "Why this stands" described a position; *Your reply to scrutiny* names a thing with a
 * reader that travels with the correction. The rule underneath is unchanged: a reason is
 * *required* when the value entered contradicts an explicit suggestion, and when the value
 * that stands is the one already filed against such a suggestion. It is *optional* on a
 * bare-note correction, where a corrected value needs no essay.
 */
function Reply({
  defect,
  value,
  required,
  overriding,
  onChange,
}: {
  defect: Defect;
  value: string;
  required: boolean;
  /** The value entered contradicts an explicit suggestion — the reason is already owed. */
  overriding: boolean;
  onChange: (text: string) => void;
}) {
  const id = `reply-${defect.n}`;
  /* Required is not the same as wrong: a view that has just opened has a prefilled value
     and an empty box, and marking that invalid on arrival shouts at someone who has not
     done anything yet. */
  const [touched, setTouched] = React.useState(false);
  const missing = required && !value.trim() && (overriding || touched);
  return (
    <Field className="gap-2" data-invalid={missing || undefined}>
      <FieldLabel htmlFor={id} className="text-body-compact">
        Your reply to scrutiny
        {required ? null : (
          <span className="font-normal text-muted-foreground">optional</span>
        )}
      </FieldLabel>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={missing || undefined}
        placeholder="e.g. The cheque leaf reads 14/05/2026, and the return memo at page 7 records the same date."
      />
      <FieldDescription>Scrutiny sees this with your corrections.</FieldDescription>
      {missing ? <FieldError>Say why before this counts as done.</FieldError> : null}
    </Field>
  );
}

/* ───────────────────────── The card ───────────────────────── */

export function DefectCard({
  defect,
  value,
  actions,
  index,
  total,
  onFocusCapture,
  onBlurCapture,
  className,
}: {
  defect: Defect;
  /** What the filing currently holds at this defect's target. */
  value: string | undefined;
  actions: DefectActions;
  /** Its place in the run — "2 of 8". */
  index: number;
  total: number;
  onFocusCapture?: () => void;
  onBlurCapture?: (event: React.FocusEvent<HTMLElement>) => void;
  className?: string;
}) {
  const state = defectState(defect, value);
  const resolved = state === "resolved";
  const needsReason = state === "needs-justification";
  const isDoc = defect.target.kind === "doc";
  const suggestion = defect.suggestion;

  /* Keeping your own value: opened by "Keep mine", and standing open by itself where it is
     the only route there is — a bare note, or a document with nothing to accept. It is
     also forced open while a reply is owed, because that is where the reply is written. */
  const [keeping, setKeeping] = React.useState(false);
  const ownOpen = keeping || !suggestion || needsReason;

  /* Disagreeing is the one moment the evidence is certainly wanted, so "Keep mine" opens
     it. Otherwise it stays shut. */
  const [whyOpen, setWhyOpen] = React.useState(false);

  const root = React.useRef<HTMLDivElement>(null);
  const landInOwn = React.useRef(false);

  /* Keep mine reveals a control — so focus goes there. Leaving focus on the button makes a
     keyboard user tab past everything that just appeared to reach what they asked for. */
  React.useLayoutEffect(() => {
    if (!landInOwn.current || !ownOpen) return;
    landInOwn.current = false;
    const control = root.current?.querySelector<HTMLElement>(
      "[data-own-value] [data-defect-focus]:not([disabled]), [data-own-value] input:not([disabled]):not([type=hidden]), [data-own-value] textarea:not([disabled]), [data-own-value] button:not([disabled])"
    );
    control?.focus({ preventScroll: true });
  });

  /* Has the value ever left what scrutiny saw? A prefilled control the advocate has not
     touched is not yet a kept position — see `reasonRequired`. */
  const atReturn = (defect.valueAtReturn ?? "").trim();
  const [everChanged, setEverChanged] = React.useState(
    () => !isDoc && (value ?? "").trim() !== atReturn
  );
  if (!everChanged && !isDoc && (value ?? "").trim() !== atReturn) setEverChanged(true);

  const standing = !isDoc && (value ?? "").trim() === atReturn;
  const required = reasonRequired(defect, value, everChanged);

  const watch = {
    ref: root,
    onFocusCapture,
    onBlurCapture,
  };

  /* ── Resolved: the card reports what was decided, and offers the way back ── */
  if (resolved) {
    return (
      <div
        data-defect-card
        className={cn(
          "overflow-hidden rounded-lg border border-hairline bg-card shadow-raised",
          className
        )}
        {...watch}
      >
        <div className="flex items-start gap-2.5 p-4">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-success-ink" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-body-compact font-semibold text-foreground">
              {defect.target.label}
            </p>
            <p className="text-caption text-success-ink">{resolutionLabel(defect, value)}</p>
          </div>
          {actions.undo ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setKeeping(false);
                actions.undo?.();
              }}
              className="-my-1 shrink-0 text-muted-foreground"
            >
              <Undo2Icon data-icon="inline-start" aria-hidden />
              Undo
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── Open ── */
  return (
    <div
      data-defect-card
      className={cn(
        "overflow-hidden rounded-lg border border-hairline bg-card shadow-raised",
        className
      )}
      {...watch}
    >
      <div className="flex items-start gap-2.5 px-4 pt-4">
        {needsReason ? (
          <TriangleAlertIcon className="mt-1 size-4 shrink-0 text-warning-ink" aria-hidden />
        ) : (
          <CircleDashedIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-body font-semibold text-foreground">{defect.target.label}</h3>
          <p className="text-caption text-muted-foreground">
            {defect.target.kind === "field" && defect.target.instanceLabel
              ? defect.target.instanceLabel
              : defect.target.sectionLabel}
          </p>
        </div>
        <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
          {index} of {total}
        </span>
      </div>

      <div className="flex flex-col gap-3.5 p-4">
        {/* Where scrutiny offered a value, the comparison is the reasoning at its most
            compressed. Where it did not, the officer's words are the instruction and are
            never hidden — so `WhyFlagged` is promoted out of the disclosure below. */}
        {suggestion ? (
          <Compare defect={defect} supersededOnly={ownOpen} />
        ) : (
          <WhyFlagged defect={defect} />
        )}

        {suggestion && !ownOpen ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={actions.accept}
              data-defect-focus
              className="h-auto min-h-10 flex-1 whitespace-normal py-2"
            >
              {/* The button states its own outcome — nothing has to be inferred from the
                  block above it. */}
              Use {displayTargetValue(defect.target, suggestion.to)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setKeeping(true);
                setWhyOpen(true);
                landInOwn.current = true;
              }}
              className="shrink-0 text-muted-foreground"
            >
              Keep mine
            </Button>
          </div>
        ) : null}

        {ownOpen ? (
          <div data-own-value className="flex flex-col gap-3.5">
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
                  Replacing the scan does not re-read it — no other field changes.
                </p>
              </>
            ) : (
              <>
                <OwnValue
                  defect={defect}
                  value={value ?? ""}
                  onChange={actions.setValue}
                  focusTarget={!suggestion}
                />
                <Reply
                  defect={defect}
                  value={actions.reason}
                  required={required}
                  overriding={needsReason}
                  onChange={actions.onReasonChange}
                />
                {suggestion ? (
                  <div className="flex items-center gap-2">
                    {/* Nothing is sent at this point, so the button does not say it is —
                        it says what it does. */}
                    <Button type="button" className="flex-1" disabled={required && !actions.reason.trim()}>
                      {standing ? "Keep my value" : "Use my value"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setKeeping(false);
                        actions.undo?.();
                      }}
                      className="shrink-0 text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* One line for everything the officer said and marked — except on a bare-note
          defect, where it was the instruction and has already been shown above. */}
      {suggestion ? (
        <Collapsible open={whyOpen} onOpenChange={setWhyOpen} className="group/why">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-h-11 w-full justify-start gap-2 rounded-none border-t border-hairline px-4 py-2.5 text-left font-normal text-muted-foreground"
            >
              <InfoIcon className="size-4 shrink-0" aria-hidden />
              Why it was flagged
              <ChevronDownIcon
                aria-hidden
                className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/why:rotate-180"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <WhyFlagged defect={defect} />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
