"use client";

/**
 * The app's ONE address grammar, extracted Sept 3: the profile settings'
 * seven fields (PIN through door number), reused verbatim wherever a case
 * flow collects or corrects an address — the edit-litigant dialog and the
 * alternate-address dialog both render exactly this grid, so the pattern
 * cannot drift into one-line "House / building, street, area" boxes again
 * (owner, Sept 3).
 */

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type StructuredAddress = {
  door: string;
  building: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pin: string;
};

export const REQUIRED_MARK = <span className="text-destructive">*</span>;

export function emptyStructuredAddress(): StructuredAddress {
  return {
    door: "",
    building: "",
    locality: "",
    city: "",
    district: "",
    state: "",
    pin: "",
  };
}

/** Everything but the building name — the one optional field. */
export function structuredAddressComplete(a: StructuredAddress): boolean {
  return (["door", "locality", "city", "district", "state", "pin"] as const).every(
    (key) => a[key].trim()
  );
}

/** One line for lists, reviews and the paper. */
export function formatStructuredAddress(a: StructuredAddress): string {
  return [
    [a.door, a.building]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", "),
    a.locality.trim(),
    a.city.trim(),
    a.district.trim(),
    `${a.state.trim()} ${a.pin.trim()}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

const FIELDS: {
  key: keyof StructuredAddress;
  label: string;
  required: boolean;
  wide?: boolean;
  numeric?: boolean;
}[] = [
  { key: "pin", label: "PIN code", required: true, numeric: true },
  { key: "state", label: "State", required: true },
  { key: "district", label: "District", required: true },
  { key: "city", label: "City or town", required: true },
  { key: "locality", label: "Locality, street or area", required: true, wide: true },
  { key: "building", label: "Building name (optional)", required: false },
  { key: "door", label: "Door or house number", required: true },
];

export function StructuredAddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: StructuredAddress;
  onChange: (next: StructuredAddress) => void;
  /** Keeps ids unique when two of these grids share a page. */
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <Field
          key={field.key}
          className={field.wide ? "sm:col-span-2" : undefined}
        >
          <FieldLabel htmlFor={`${idPrefix}-${field.key}`}>
            {field.label} {field.required ? REQUIRED_MARK : null}
          </FieldLabel>
          <Input
            id={`${idPrefix}-${field.key}`}
            inputMode={field.numeric ? "numeric" : undefined}
            maxLength={field.numeric ? 6 : undefined}
            value={value[field.key]}
            onChange={(event) =>
              onChange({ ...value, [field.key]: event.target.value })
            }
          />
        </Field>
      ))}
    </div>
  );
}
