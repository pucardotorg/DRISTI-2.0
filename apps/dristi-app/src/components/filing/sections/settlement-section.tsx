"use client";

/**
 * Settlement options — the offer the complainant's side is willing to make, the court's
 * own settlement question, anything else the court should know, and the relief asked for.
 *
 * The screen used to be "ADR, other details & prayer": a single yes/no/maybe answer and
 * two prayer editors. The answer still goes into the complaint, but on its own it settles
 * nothing — it tells the court a door is open and leaves the advocate to walk through it
 * by phone. So the door is now the screen: what the accused is actually offered is set up
 * here, in one of two shapes.
 *
 * **Pre-packaged offers** — up to four fixed offers. Every term is known in advance, the
 * accused picks one or none, and there is nothing to negotiate.
 *
 * **Blind bidding** — the accused names their own terms and never learns the floor. The
 * advocate sets the outer limit and a ladder of discount bands; a bid inside a band is
 * accepted on the spot, a bid outside it is refused. Neither side sees the other's hand,
 * which is the point: an opening number that is too low costs nothing to make and nothing
 * to refuse.
 *
 * Both are carried to the accused over WhatsApp, outside this product and outside the
 * court record — those screens are not ours. What is set here is only the rule the bot on
 * that end is given.
 */

import * as React from "react";
import { EyeOffIcon, PackageIcon, PlusIcon } from "lucide-react";

import { blankSettlementBand, blankSettlementOffer } from "@/lib/filing/blank";
import { amountToNumber, plural, rupees } from "@/lib/filing/format";
import { totalChequeAmount } from "@/lib/filing/selectors";
import {
  amountAfterDiscount,
  bandIssue,
  discountOfClaim,
  offerIssue,
  periodDays,
  periodText,
} from "@/lib/filing/settlement";
import { neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import {
  MAX_SETTLEMENT_BANDS,
  MAX_SETTLEMENT_OFFERS,
  type Period,
  type PeriodUnit,
  type SettlementBand,
  type SettlementMode,
  type SettlementOffer,
  type SettlementPrayer,
} from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import { FormCard, FormDivider, FormRow, FormSubhead } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { OptionSelect, PrefixInput, SuffixInput, TextField } from "@/components/filing/inputs";
import { RemoveButton } from "@/components/filing/repeat-lists";
import { RichTextEditor } from "@/components/filing/rich-text-editor";
import { Segmented, type SegmentedOption } from "@/components/filing/segmented";

/* ───────────────────────────── Copy ────────────────────────────────── */

const WILLING_OPTIONS: SegmentedOption<SettlementPrayer["willing"]>[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

const WILLING_QUESTION =
  "Would you like to settle the case outside the court through alternative methods of dispute resolution if the other party(s) agrees?";

const OTHER_DETAILS_QUESTION =
  "Would you like to add any additional details to the complaint?";

const RELIEF_HELP = "Please edit this where required as per the details of your case.";

const MODES: {
  value: SettlementMode;
  label: string;
  description: string;
  icon: typeof PackageIcon;
}[] = [
  {
    value: "packaged",
    label: "Pre-packaged offers",
    description:
      "You set out up to four fixed offers. The accused takes one of them or none — nothing is negotiated.",
    icon: PackageIcon,
  },
  {
    value: "blind",
    label: "Blind bidding",
    description:
      "The accused names their own terms without seeing your floor. Anything inside the limits you set is accepted on the spot.",
    icon: EyeOffIcon,
  },
];

const PERIOD_UNITS: { value: PeriodUnit; label: string }[] = [
  { value: "days", label: "days" },
  { value: "months", label: "months" },
  { value: "years", label: "years" },
];

/* ───────────────────────────── Shared field ────────────────────────── */

/**
 * A number and its unit, as one field. Two controls, because "90 days" and "3 months" are
 * the same window and an advocate should be able to write whichever one they said on the
 * phone; one label, because it is one answer.
 */
function PeriodField({
  label,
  value,
  onChange,
  help,
  error,
  placeholder,
}: {
  label: string;
  value: Period;
  onChange: (next: Period) => void;
  help?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <FormField asGroup label={label} help={help} error={error}>
      <div className="flex items-start gap-2">
        <TextField
          value={value.value}
          onChange={(v) => onChange({ ...value, value: v.replace(/[^0-9]/g, "") })}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          aria-label={`${label} — how many`}
          aria-invalid={error ? true : undefined}
          className="w-24 tabular-nums"
        />
        <OptionSelect
          value={value.unit}
          onValueChange={(v) => onChange({ ...value, unit: v as PeriodUnit })}
          options={PERIOD_UNITS}
          ariaLabel={`${label} — days, months or years`}
          className="w-32"
        />
      </div>
    </FormField>
  );
}

/* ───────────────────────────── Section ─────────────────────────────── */

export function SettlementSection() {
  const { draft, update, hrefFor } = useFiling();
  const settlement = draft.settlement;
  const { prev, next } = neighbours("settlement");
  const modeName = React.useId();

  /** What the complaint asks for — the yardstick every offer is measured against. */
  const claim = totalChequeAmount(draft.cheques);

  const set = <K extends keyof SettlementPrayer>(key: K, value: SettlementPrayer[K]) =>
    update((d) => {
      d.settlement[key] = value;
    });

  return (
    <>
      <FilingMain>
        <FilingPageHeader
          title="Settlement options"
          description="Whether you are open to settling out of court, the offer your client is willing to make, and the relief you are asking the court for."
        />

        {/* The court's own question. Its answer is printed in the complaint. */}
        <FormCard
          title="Settling out of court"
          description="The court asks this on the complaint form, and your answer is printed there."
        >
          <FormField asGroup label={WILLING_QUESTION}>
            <Segmented
              value={settlement.willing}
              onValueChange={(v) => set("willing", v)}
              options={WILLING_OPTIONS}
              ariaLabel={WILLING_QUESTION}
            />
          </FormField>
        </FormCard>

        {/*
          "No" closes the door, so there is no offer to set up and the card is not shown
          rather than shown disabled — an empty offer builder under a "No" is a question
          already answered.
        */}
        {settlement.willing === "no" ? null : (
          <FormCard
            title="Settlement offer"
            description="Offers are put to the accused over WhatsApp. Nothing here is filed with the court, and the accused never sees this screen."
          >
            <FormField asGroup label="How the offer is made">
              <RadioGroup
                value={settlement.mode}
                onValueChange={(v) => set("mode", v as SettlementMode)}
                aria-label="How the offer is made"
                className="grid gap-4 sm:grid-cols-2"
              >
                {MODES.map((m) => (
                  <ModeCard
                    key={m.value}
                    id={`${modeName}-${m.value}`}
                    mode={m}
                    chosen={settlement.mode === m.value}
                  />
                ))}
              </RadioGroup>
            </FormField>

            <FormDivider />

            {settlement.mode === "packaged" ? (
              <PackagedOffers
                offers={settlement.offers}
                claim={claim}
                onChange={(nextOffers) => set("offers", nextOffers)}
              />
            ) : (
              <BlindBidding
                maxPeriod={settlement.maxPeriod}
                bands={settlement.bands}
                claim={claim}
                onMaxPeriod={(p) => set("maxPeriod", p)}
                onBands={(nextBands) => set("bands", nextBands)}
              />
            )}
          </FormCard>
        )}

        {/* Anything else for the court */}
        <FormCard title="Other details">
          <FormField
            asGroup
            label={OTHER_DETAILS_QUESTION}
            tip="Anything the court should know that the form has not already asked for."
            helpPlacement="above"
            help="No need to repeat anything already entered above."
          >
            <RichTextEditor
              value={settlement.otherDetails}
              onChange={(html) => set("otherDetails", html)}
              placeholder="Write here"
              ariaLabel={OTHER_DETAILS_QUESTION}
            />
          </FormField>
        </FormCard>

        {/* Prayer */}
        <FormCard
          title="Prayer / relief sought"
          description="The standard S-138 prayer. Edit to fit your case."
        >
          <FormField asGroup label="Interim relief" optional helpPlacement="above" help={RELIEF_HELP}>
            <RichTextEditor
              value={settlement.interimRelief}
              onChange={(html) => set("interimRelief", html)}
              ariaLabel="Interim relief"
            />
          </FormField>
          <FormField asGroup label="Final relief" helpPlacement="above" help={RELIEF_HELP}>
            <RichTextEditor
              value={settlement.finalRelief}
              onChange={(html) => set("finalRelief", html)}
              ariaLabel="Final relief"
            />
          </FormField>
        </FormCard>
      </FilingMain>

      <FilingFooter
        backHref={prev ? hrefFor(prev) : undefined}
        continueHref={next ? hrefFor(next) : undefined}
      />
    </>
  );
}

/* ───────────────────────────── Mode picker ─────────────────────────── */

/**
 * One of the two shapes an offer can take.
 *
 * The name alone does not carry the choice — "blind bidding" tells an advocate who has
 * only ever settled by phone nothing about who names the number — so each card says what
 * the mechanism does to them. The whole card is the radio's label, so the target is the
 * card and not the 16px dot.
 *
 * Selected is one quiet cue: `accent-strong`, the DS token for an engaged control, plus
 * the radio's own mark. No ring, no brand fill — brand means "now", not "chosen".
 *
 * The `<label>` is what makes the whole card clickable, but it cannot *name* the control:
 * the DS radio is a `button`, and HTML-AAM names a button from its own contents, not from
 * an associated label — so a screen reader would read "radio, not selected" and nothing
 * else. `aria-labelledby` points at the visible title (so the spoken name is the name on
 * screen) and `aria-describedby` at the sentence under it.
 */
function ModeCard({
  id,
  mode,
  chosen,
}: {
  id: string;
  mode: (typeof MODES)[number];
  chosen: boolean;
}) {
  const Icon = mode.icon;
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-hairline p-4 transition-colors",
        chosen ? "bg-accent-strong" : "bg-surface-sunken hover:bg-accent"
      )}
    >
      <RadioGroupItem
        id={id}
        value={mode.value}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="mt-1 shrink-0"
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span id={titleId} className="text-body font-semibold text-foreground">
            {mode.label}
          </span>
        </span>
        <span id={descriptionId} className="text-body-compact text-muted-foreground">
          {mode.description}
        </span>
      </span>
    </label>
  );
}

/* ───────────────────────────── Pre-packaged offers ─────────────────── */

function PackagedOffers({
  offers,
  claim,
  onChange,
}: {
  offers: SettlementOffer[];
  claim: number;
  onChange: (next: SettlementOffer[]) => void;
}) {
  const setAt = (i: number, patch: Partial<SettlementOffer>) =>
    onChange(offers.map((o, k) => (k === i ? { ...o, ...patch } : o)));

  const amounts = offers.map((o) => amountToNumber(o.amount)).filter((n) => n > 0);
  const lowest = amounts.length ? Math.min(...amounts) : 0;
  const lowestDiscount = discountOfClaim(claim, lowest);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-compact text-muted-foreground">
        {offers.length === 1
          ? "One offer, put to the accused as it stands."
          : `${plural(offers.length, "offer")}, put to the accused together — they may take any one of them.`}
      </p>

      {offers.map((offer, i) => {
        const amount = amountToNumber(offer.amount);
        const discount = discountOfClaim(claim, amount);
        const issue = offerIssue(offer, claim);
        return (
          <div key={offer.id} className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4">
            <div className="flex items-center justify-between gap-3">
              <FormSubhead>Offer {i + 1}</FormSubhead>
              {offers.length > 1 ? (
                <RemoveButton
                  label={`Remove offer ${i + 1}`}
                  onClick={() => onChange(offers.filter((_, k) => k !== i))}
                />
              ) : null}
            </div>
            <FormRow>
              <FormField
                label="Amount the accused pays"
                required
                help={
                  issue
                    ? undefined
                    : discount === null
                      ? claim
                        ? `Against the ${rupees(claim)} claimed.`
                        : "Enter the cheque amount to see what this gives up."
                      : discount > 0
                        ? `${discount}% below the ${rupees(claim)} claimed.`
                        : `The full ${rupees(claim)} claimed.`
                }
                error={
                  issue
                    ? `More than the ${rupees(claim)} claimed — a settlement can give ground, never take more than the complaint asks for.`
                    : undefined
                }
              >
                <PrefixInput
                  prefix="₹"
                  value={offer.amount}
                  onChange={(v) => setAt(i, { amount: v.replace(/[^0-9]/g, "") })}
                  placeholder="Amount in full"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={issue ? true : undefined}
                  className="tabular-nums"
                />
              </FormField>
              <PeriodField
                label="Paid in full within"
                value={offer.within}
                onChange={(within) => setAt(i, { within })}
                help="Counted from the day the accused accepts."
              />
            </FormRow>
          </div>
        );
      })}

      {offers.length < MAX_SETTLEMENT_OFFERS ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => onChange([...offers, blankSettlementOffer()])}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add another offer
        </Button>
      ) : (
        <p className="text-caption text-muted-foreground">
          Four offers is the most one settlement can carry.
        </p>
      )}

      {offers.length > 1 && lowestDiscount !== null && lowestDiscount > 0 ? (
        <p className="text-body-compact text-muted-foreground">
          The least you would take is{" "}
          <span className="font-medium tabular-nums text-foreground">{rupees(lowest)}</span> —{" "}
          <span className="tabular-nums">{lowestDiscount}%</span> below the{" "}
          <span className="tabular-nums">{rupees(claim)}</span> claimed.
        </p>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Blind bidding ───────────────────────── */

function BlindBidding({
  maxPeriod,
  bands,
  claim,
  onMaxPeriod,
  onBands,
}: {
  maxPeriod: Period;
  bands: SettlementBand[];
  claim: number;
  onMaxPeriod: (next: Period) => void;
  onBands: (next: SettlementBand[]) => void;
}) {
  const setAt = (i: number, patch: Partial<SettlementBand>) =>
    onBands(bands.map((b, k) => (k === i ? { ...b, ...patch } : b)));

  const limitText = periodText(maxPeriod);

  return (
    <div className="flex flex-col gap-6">
      <PeriodField
        label="Longest you will wait for payment"
        value={maxPeriod}
        onChange={onMaxPeriod}
        help="A bid that runs past this is refused, whatever it offers."
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <FormSubhead>Discount bands</FormSubhead>
          <p className="text-body-compact text-muted-foreground">
            The faster the accused pays, the more they may take off. A bid is checked
            against the fastest band it still fits.
          </p>
        </div>

        {bands.map((band, i) => {
          const discount = amountToNumber(band.discount);
          const issue = bandIssue(band, maxPeriod);
          return (
            <div key={band.id} className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4">
              <div className="flex items-center justify-between gap-3">
                <FormSubhead>Band {i + 1}</FormSubhead>
                {bands.length > 1 ? (
                  <RemoveButton
                    label={`Remove band ${i + 1}`}
                    onClick={() => onBands(bands.filter((_, k) => k !== i))}
                  />
                ) : null}
              </div>
              <FormRow>
                <PeriodField
                  label="Paid within"
                  value={band.within}
                  onChange={(within) => setAt(i, { within })}
                  placeholder="e.g. 30"
                  error={
                    issue === "past-limit"
                      ? `Longer than the ${limitText} you said you would wait.`
                      : undefined
                  }
                />
                <FormField
                  label="Most they may take off"
                  required
                  help={
                    issue === "over-claim"
                      ? undefined
                      : discount > 0 && claim
                        ? `You would still receive ${rupees(amountAfterDiscount(claim, discount))}.`
                        : "The largest discount a bid in this band can ask for."
                  }
                  error={
                    issue === "over-claim"
                      ? "More than the whole claim — a discount cannot be more than 100%."
                      : undefined
                  }
                >
                  <SuffixInput
                    suffix="%"
                    value={band.discount}
                    onChange={(v) => setAt(i, { discount: v.replace(/[^0-9]/g, "") })}
                    placeholder="0"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={issue === "over-claim" ? true : undefined}
                    className="tabular-nums"
                  />
                </FormField>
              </FormRow>
            </div>
          );
        })}

        {bands.length < MAX_SETTLEMENT_BANDS ? (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => onBands([...bands, blankSettlementBand()])}
          >
            <PlusIcon data-icon="inline-start" aria-hidden />
            Add another band
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">
            Four bands is the most one ladder can carry.
          </p>
        )}
      </div>

      <AcceptanceLadder bands={bands} maxPeriod={maxPeriod} claim={claim} />
    </div>
  );
}

/**
 * The rule as the bot will run it, in order.
 *
 * The bands are typed one at a time and in whatever order they come to mind; what decides
 * a bid is all of them at once, sorted, with the gap between the last band and the outer
 * limit taking no discount at all and everything past the limit refused. That reading is
 * the thing to check before this goes out, so it is stated rather than left to be worked
 * out from four separate fields.
 *
 * No fill of its own: it sits among sunken wells, so it separates by rule and rhythm
 * instead of stacking a third surface on the second.
 */
function AcceptanceLadder({
  bands,
  maxPeriod,
  claim,
}: {
  bands: SettlementBand[];
  maxPeriod: Period;
  claim: number;
}) {
  const limitDays = periodDays(maxPeriod);
  const limitText = periodText(maxPeriod);

  const rungs = bands
    .map((b) => ({
      days: periodDays(b.within),
      text: periodText(b.within),
      discount: amountToNumber(b.discount),
    }))
    .filter(
      (r): r is { days: number; text: string; discount: number } =>
        r.days !== null && r.discount > 0 && r.discount <= 100
    )
    .filter((r) => limitDays === null || r.days <= limitDays)
    .sort((a, b) => a.days - b.days);

  if (!rungs.length) {
    return (
      <p className="text-body-compact text-muted-foreground">
        Set a window and a discount above and the rule the bot will run appears here.
      </p>
    );
  }

  const slowest = rungs[rungs.length - 1];
  const rows: { when: string; what: string }[] = rungs.map((r) => ({
    when: `Paid within ${r.text}`,
    what: claim
      ? `${rupees(amountAfterDiscount(claim, r.discount))} or more · up to ${r.discount}% off`
      : `Up to ${r.discount}% off`,
  }));

  if (limitDays !== null && limitDays > slowest.days) {
    rows.push({
      when: `Slower than ${slowest.text}, up to ${limitText}`,
      what: claim ? `The full ${rupees(claim)} · no discount` : "No discount",
    });
  }
  if (limitText) {
    rows.push({ when: `Slower than ${limitText}`, what: "Refused" });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption font-semibold text-muted-foreground">
        What a bid has to clear
      </p>
      <ul className="divide-y divide-hairline">
        {rows.map((r) => (
          <li
            key={r.when}
            className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <span className="text-body-compact text-foreground">{r.when}</span>
            <span className="text-body-compact tabular-nums text-muted-foreground">
              {r.what}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground">
        The accused never sees this ladder — only whether the bid they made was accepted.
      </p>
    </div>
  );
}
