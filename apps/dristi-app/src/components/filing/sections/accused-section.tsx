"use client";

/**
 * Accused details — who the complaint is against, how the court can reach them, and
 * where process should be served.
 *
 * Source: demo "Accused Details" screen. One tab per accused; Continue is guarded, because
 * an accused with no phone or email makes the summons harder to deliver: the filer is shown
 * what that costs and must confirm it before the filing moves on.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { InfoIcon } from "lucide-react";

import { blankAccused } from "@/lib/filing/blank";
import { ACCUSED_TYPES } from "@/lib/filing/options";
import { accusedComplete, accusedHasContact } from "@/lib/filing/selectors";
import { neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import type { Accused, AccusedType } from "@/lib/filing/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import { FormCard, FormRow, HalfWidth } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { OptionSelect, TextField } from "@/components/filing/inputs";
import { SectionNotice } from "@/components/filing/notices";
import { AddressBlockList, ContactList } from "@/components/filing/repeat-lists";
import { SectionTabs } from "@/components/filing/section-tabs";
import { YesNoSegmented } from "@/components/filing/segmented";

export function AccusedSection() {
  const { draft, update, hrefFor } = useFiling();
  const router = useRouter();
  const { prev, next } = neighbours("accused");

  // Tracked by id, so removing an accused cannot leave the tabs pointing at a stale index.
  const [activeId, setActiveId] = React.useState(() => draft.accused[0]?.id ?? "");
  const [noContactOpen, setNoContactOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmChecked, setConfirmChecked] = React.useState(false);

  const found = draft.accused.findIndex((x) => x.id === activeId);
  const index = found >= 0 ? found : draft.accused.length - 1;
  const a = draft.accused[index];
  const isIndividual = a.type === "individual";

  const confirmCheckboxId = React.useId();
  const confirmStatementId = React.useId();

  const setField = <K extends keyof Accused>(key: K, value: Accused[K]) =>
    update((d) => {
      d.accused[index][key] = value;
    });

  const addAccused = () => {
    const created = blankAccused();
    update((d) => {
      d.accused.push(created);
    });
    setActiveId(created.id);
  };

  const removeAccused = (id: string) => {
    if (draft.accused.length <= 1) return;
    const i = draft.accused.findIndex((x) => x.id === id);
    if (i < 0) return;
    const fallback = draft.accused[i + 1] ?? draft.accused[i - 1];
    update((d) => {
      d.accused.splice(i, 1);
    });
    if (id === activeId && fallback) setActiveId(fallback.id);
  };

  const goToNext = () => {
    setNoContactOpen(false);
    setConfirmOpen(false);
    router.push(hrefFor(next ?? "cheque"));
  };

  const handleContinue = () => {
    if (accusedHasContact(a)) {
      goToNext();
      return;
    }
    setConfirmChecked(false);
    setNoContactOpen(true);
  };

  const proceedWithoutDetails = () => {
    setNoContactOpen(false);
    setConfirmChecked(false);
    setConfirmOpen(true);
  };

  return (
    <>
      <FilingMain>
        <FilingPageHeader
          title="Accused details"
          description="Add the person or entity you are filing this complaint against."
        />

        <SectionTabs
          tabs={draft.accused.map((acc, i) => ({
            id: acc.id,
            label: `Accused ${i + 1}`,
            meta: acc.name || undefined,
            status: accusedComplete(acc) ? "complete" : "attention",
            removable: draft.accused.length > 1,
          }))}
          activeId={a.id}
          onSelect={setActiveId}
          onRemove={removeAccused}
          addLabel="Add accused"
          onAdd={addAccused}
        />

        {/* Identity */}
        <FormCard title={isIndividual ? `Accused ${index + 1} details` : "Entity details"}>
          <HalfWidth>
            <FormField label="Accused type" required>
              <OptionSelect
                value={a.type}
                onValueChange={(v) => setField("type", v as AccusedType)}
                options={ACCUSED_TYPES}
              />
            </FormField>
          </HalfWidth>
          <FormRow>
            <FormField label={isIndividual ? "Full name" : "Entity name"} required>
              <TextField
                value={a.name}
                onChange={(v) => setField("name", v)}
                placeholder="As it should appear on the summons"
                autoComplete="off"
              />
            </FormField>
            {isIndividual ? (
              <FormField label="Age" optional>
                <TextField
                  value={a.age}
                  onChange={(v) => setField("age", v)}
                  placeholder="e.g. 45"
                  inputMode="numeric"
                />
              </FormField>
            ) : null}
          </FormRow>
        </FormCard>

        {/* Contact */}
        <FormCard
          title="Contact details"
          description="A phone number or email helps the court deliver the summons faster."
        >
          <ContactList
            contacts={a.contacts}
            onChange={(contacts) => setField("contacts", contacts)}
          />
        </FormCard>

        {/* Service addresses */}
        <FormCard title="Address details">
          {!draft.dismissed.accusedAddress ? (
            <SectionNotice
              onDismiss={() =>
                update((d) => {
                  d.dismissed.accusedAddress = true;
                })
              }
            >
              Adding more than one address improves the chances of the summons reaching the
              accused.
            </SectionNotice>
          ) : null}
          <AddressBlockList
            blocks={a.addresses}
            onChange={(addresses) => setField("addresses", addresses)}
          />
        </FormCard>

        {/* Jurisdiction */}
        <FormCard title="Jurisdiction">
          <FormField
            asGroup
            label="Does the accused reside within the jurisdiction of this court?"
            help="Your answer here doesn't by itself decide the court's jurisdiction — the court determines that on the facts."
          >
            <YesNoSegmented
              value={a.jurisdiction}
              onValueChange={(v) => setField("jurisdiction", v)}
              ariaLabel="Does the accused reside within the jurisdiction of this court?"
            />
          </FormField>
        </FormCard>
      </FilingMain>

      <FilingFooter
        backHref={prev ? hrefFor(prev) : undefined}
        onContinue={handleContinue}
      />

      {/* Continue with no phone or email on the active accused. */}
      <Dialog open={noContactOpen} onOpenChange={setNoContactOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-muted text-info-muted-foreground"
              >
                <InfoIcon className="size-5" />
              </span>
              <DialogTitle>No contact details added</DialogTitle>
            </div>
            <DialogDescription>
              Adding a phone number or email increases the chances of the summons being
              delivered to the accused.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={proceedWithoutDetails}>
              Proceed without details
            </Button>
            <Button type="button" onClick={() => setNoContactOpen(false)}>
              Add details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The confirmation itself — the court is told this was a considered choice. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent aria-describedby={confirmStatementId} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm — proceed without details</DialogTitle>
          </DialogHeader>
          <Label
            htmlFor={confirmCheckboxId}
            id={confirmStatementId}
            className="items-start gap-3 font-normal text-foreground"
          >
            <Checkbox
              id={confirmCheckboxId}
              checked={confirmChecked}
              onCheckedChange={(checked) => setConfirmChecked(checked === true)}
              className="mt-0.5"
            />
            {/* Wraps to several lines — the Label's own leading-none would collide. */}
            <span className="leading-normal">
              I confirm that I have no knowledge of the accused&apos;s electronic contact
              details and cannot locate them with reasonable effort.
            </span>
          </Label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Add details
            </Button>
            <Button
              type="button"
              onClick={goToNext}
              disabled={!confirmChecked}
              aria-disabled={!confirmChecked || undefined}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
