"use client";

import * as React from "react";

import { lookupPin } from "@/lib/filing/lookups";
import { STATES } from "@/lib/filing/options";
import type { Address } from "@/lib/filing/types";
import { FormRow } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { OptionSelect, TextField } from "@/components/filing/inputs";
import { LookupStatus } from "@/components/filing/lookup-status";

/** Wait after the sixth digit before asking the PIN service, so typing isn't chased. */
const PIN_DEBOUNCE_MS = 400;

/** What the PIN lookup filled on this address — cleared as soon as the person types over it. */
type PinFill = { pin: string; district: boolean; state: boolean };

/**
 * Address line · city · pincode · district · state. When `prefilled`, the address was
 * read from a document: fields carry the amber fill and open the source on click.
 *
 * The pincode is the fast path: once six digits are in, the postal service is asked for
 * the district and state and fills whichever of the two is still blank. Anything the
 * person typed is never overwritten, and a failed lookup says nothing — they just type.
 */
export function AddressFields({
  value,
  onChange,
  prefilled = false,
  onViewSource,
  idPrefix,
}: {
  value: Address;
  onChange: (next: Address) => void;
  prefilled?: boolean;
  onViewSource?: () => void;
  idPrefix?: string;
}) {
  const set = (k: keyof Address) => (v: string) => onChange({ ...value, [k]: v });
  const src = prefilled ? onViewSource : undefined;
  const pf = (has: string) => prefilled && !!has;

  const [pinFill, setPinFill] = React.useState<PinFill | null>(null);

  // The lookup resolves after the fact, so it reads the newest address and the newest
  // fill state through a ref — depending on them would restart the debounce on every key.
  const latest = React.useRef({ value, onChange, pinFill });
  React.useEffect(() => {
    latest.current = { value, onChange, pinFill };
  });

  const pin6 = value.pin.replace(/\D/g, "");

  React.useEffect(() => {
    if (pin6.length !== 6) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      lookupPin(pin6)
        .then((hit) => {
          if (cancelled || !hit) return;
          const { value: addr, onChange: commit, pinFill: filled } = latest.current;
          // Only the state spellings the select actually offers can be filled into it.
          const stateHit = STATES.find(
            (s) => s.toLowerCase() === hit.state.trim().toLowerCase()
          );
          const fillDistrict = !addr.district.trim() || !!filled?.district;
          const fillState = (!addr.state.trim() || !!filled?.state) && !!stateHit;
          if (!fillDistrict && !fillState) return;
          commit({
            ...addr,
            district: fillDistrict ? hit.district : addr.district,
            state: fillState && stateHit ? stateHit : addr.state,
          });
          setPinFill({ pin: hit.pin, district: fillDistrict, state: fillState });
        })
        // Best-effort: an unknown PIN or an unreachable service says nothing.
        .catch(() => {});
    }, PIN_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pin6]);

  /** Typing over a machine-filled district or state hands that field back to the person. */
  const setDistrict = (v: string) => {
    setPinFill((f) => (f ? { ...f, district: false } : null));
    onChange({ ...value, district: v });
  };
  const setState = (v: string) => {
    setPinFill((f) => (f ? { ...f, state: false } : null));
    onChange({ ...value, state: v });
  };

  // The caption belongs to the PIN still in the field; changing the PIN retires it.
  const shownFill = pinFill?.pin === pin6 ? pinFill : null;
  const filledLabel =
    shownFill?.district && shownFill.state
      ? "District and state"
      : shownFill?.district
        ? "District"
        : shownFill?.state
          ? "State"
          : null;

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Address line" required>
        <TextField
          id={idPrefix ? `${idPrefix}-line1` : undefined}
          value={value.line1}
          onChange={set("line1")}
          placeholder="House / building, street, area"
          prefilled={pf(value.line1)}
          onViewSource={src}
          autoComplete="address-line1"
        />
      </FormField>
      <FormRow>
        <FormField label="City / town" required>
          <TextField
            value={value.city}
            onChange={set("city")}
            placeholder="City or town"
            prefilled={pf(value.city)}
            onViewSource={src}
            autoComplete="address-level2"
          />
        </FormField>
        <FormField label="Pincode" required>
          <TextField
            value={value.pin}
            onChange={set("pin")}
            placeholder="6-digit"
            inputMode="numeric"
            maxLength={6}
            prefilled={pf(value.pin)}
            onViewSource={src}
            autoComplete="postal-code"
          />
        </FormField>
      </FormRow>
      <div className="flex flex-col gap-2">
        <FormRow>
          <FormField label="District" required>
            <TextField
              value={value.district}
              onChange={setDistrict}
              placeholder="District"
              prefilled={pf(value.district)}
              onViewSource={src}
            />
          </FormField>
          <FormField label="State / UT" required>
            <OptionSelect
              value={value.state}
              onValueChange={setState}
              options={STATES}
              placeholder="Select state"
              prefilled={pf(value.state)}
              onViewSource={src}
            />
          </FormField>
        </FormRow>
        {/* Mounted whether or not it has anything to say, so the fill is announced. */}
        <LookupStatus>
          {filledLabel && shownFill
            ? `${filledLabel} filled from PIN ${shownFill.pin}`
            : null}
        </LookupStatus>
      </div>
    </div>
  );
}
