"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { blankAddressBlock, blankContact } from "@/lib/filing/blank";
import type { AddressBlock, Contact } from "@/lib/filing/types";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/filing/address-fields";
import { FormRow, FormSubhead } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { PrefixInput, TextField } from "@/components/filing/inputs";

/** Icon-only remove control at the 40px floor. */
export function RemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      <Trash2Icon aria-hidden />
    </Button>
  );
}

/** Mobile + email rows with add / remove — used for accused and witness contacts. */
export function ContactList({
  contacts,
  onChange,
  addLabel = "Add another contact",
  emailLabel = "Email address",
  mobilePlaceholder = "10-digit number",
  emailPlaceholder = "name@example.com",
}: {
  contacts: Contact[];
  onChange: (next: Contact[]) => void;
  addLabel?: string;
  emailLabel?: string;
  mobilePlaceholder?: string;
  emailPlaceholder?: string;
}) {
  const setAt = (i: number, patch: Partial<Contact>) =>
    onChange(contacts.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  return (
    <div className="flex flex-col gap-4">
      {contacts.map((c, i) => (
        <div key={i} className="flex items-end gap-3">
          <FormRow className="flex-1">
            <FormField label="Mobile number">
              <PrefixInput
                prefix="+91"
                value={c.mobile}
                onChange={(v) => setAt(i, { mobile: v })}
                placeholder={mobilePlaceholder}
                inputMode="numeric"
                autoComplete="tel-national"
              />
            </FormField>
            <FormField label={emailLabel}>
              <TextField
                type="email"
                value={c.email}
                onChange={(v) => setAt(i, { email: v })}
                placeholder={emailPlaceholder}
                autoComplete="email"
              />
            </FormField>
          </FormRow>
          {contacts.length > 1 ? (
            <RemoveButton
              label={`Remove contact ${i + 1}`}
              onClick={() => onChange(contacts.filter((_, k) => k !== i))}
            />
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() => onChange([...contacts, blankContact()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}

/**
 * "Address N" blocks: address fields, the police station the address falls under, and
 * optional coordinates. There is no map picker and no station registry behind this — both
 * are typed, so the form promises only what it can keep.
 */
export function AddressBlockList({
  blocks,
  onChange,
  addLabel = "Add another address",
}: {
  blocks: AddressBlock[];
  onChange: (next: AddressBlock[]) => void;
  addLabel?: string;
}) {
  const setAt = (i: number, patch: Partial<AddressBlock>) =>
    onChange(blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)));

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <FormSubhead>Address {i + 1}</FormSubhead>
            {blocks.length > 1 ? (
              <RemoveButton
                label={`Remove address ${i + 1}`}
                onClick={() => onChange(blocks.filter((_, k) => k !== i))}
              />
            ) : null}
          </div>
          <AddressFields value={b.addr} onChange={(addr) => setAt(i, { addr })} />
          <FormRow>
            <FormField
              label="Police station"
              required
              help="The station in whose jurisdiction this address falls."
            >
              <TextField
                value={b.police}
                onChange={(v) => setAt(i, { police: v })}
                placeholder="e.g. Kollam East police station"
                autoComplete="off"
              />
            </FormField>
            <FormField
              label="Location"
              optional
              help="Helps the court's process server find the address."
            >
              <TextField
                value={b.geo}
                onChange={(v) => setAt(i, { geo: v })}
                placeholder="latitude, longitude — e.g. 8.8932, 76.6141"
                autoComplete="off"
              />
            </FormField>
          </FormRow>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() => onChange([...blocks, blankAddressBlock()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
