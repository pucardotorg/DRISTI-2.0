"use client";

/**
 * Advocate details — the advocates on the Vakalatnama, and which complainant each acts for.
 *
 * There is no public bar-council registry to look a name up in, so both the name and the
 * registration number are typed exactly as they appear on the Vakalatnama; an advocate
 * filing for themselves can fill their own row from their profile in one click. The panel
 * beside the form is there to read the uploaded Vakalatnama off, nothing more.
 */

import * as React from "react";
import { ChevronDownIcon, PlusIcon, UserRoundIcon } from "lucide-react";

import { blankAdvocate } from "@/lib/filing/blank";
import { useProfile } from "@/lib/filing/profile";
import { complainantChoices, partySourceSlot } from "@/lib/filing/selectors";
import { neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import { FormCard, FormRow } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { TextField } from "@/components/filing/inputs";
import { SectionNotice } from "@/components/filing/notices";
import { RemoveButton } from "@/components/filing/repeat-lists";
import { SourcePanel, ViewSourceButton } from "@/components/filing/source-panel";

/** A filing carries at most six advocates. */
const MAX_ADVOCATES = 6;

export function AdvocateSection() {
  const { draft, update, hrefFor } = useFiling();
  const { prev, next } = neighbours("advocate");
  const { profile } = useProfile();

  const advocates = draft.advocates;
  const choices = complainantChoices(draft.complainants);

  const [sourceOpen, setSourceOpen] = React.useState(true);

  // One Vakalatnama is uploaded per complainant; show the one belonging to the complainant
  // the first advocate acts for (clamped, since indices survive a complainant's removal).
  const vakalatnamaParty = Math.min(
    advocates[0]?.forComplainants[0] ?? 0,
    Math.max(0, draft.complainants.length - 1)
  );
  const vakalatnama = partySourceSlot(draft, vakalatnamaParty, "vakalatnama");

  const setField = (index: number, key: "name" | "barNumber", value: string) =>
    update((d) => {
      d.advocates[index][key] = value;
    });

  /** The signed-in person filling in their own row — name and bar number in one action. */
  const canUseProfile = !!(profile?.name.trim() || profile?.barNumber.trim());
  const fillFromProfile = (index: number) =>
    update((d) => {
      if (!profile) return;
      d.advocates[index].name = profile.name;
      d.advocates[index].barNumber = profile.barNumber;
    });

  const toggleComplainant = (index: number, choice: number) =>
    update((d) => {
      const current = d.advocates[index].forComplainants;
      d.advocates[index].forComplainants = current.includes(choice)
        ? current.filter((k) => k !== choice)
        : [...current, choice].sort((a, b) => a - b);
    });

  const toggleAll = (index: number, allSelected: boolean) =>
    update((d) => {
      d.advocates[index].forComplainants = allSelected
        ? []
        : d.complainants.map((_, k) => k);
    });

  const addAdvocate = () =>
    update((d) => {
      if (d.advocates.length >= MAX_ADVOCATES) return;
      d.advocates.push(blankAdvocate());
    });

  const removeAdvocate = (index: number) =>
    update((d) => {
      if (d.advocates.length <= 1) return;
      d.advocates.splice(index, 1);
    });

  return (
    <>
      <FilingMain sourceOpen={sourceOpen}>
        <FilingPageHeader
          title="Advocate details"
          description="Add the advocates representing the complainant, as listed on the Vakalatnama."
          actions={
            sourceOpen ? null : <ViewSourceButton onClick={() => setSourceOpen(true)} />
          }
        />

        {draft.dismissed.advocateInfo ? null : (
          <SectionNotice
            title="Only registered advocates can be added"
            onDismiss={() =>
              update((d) => {
                d.dismissed.advocateInfo = true;
              })
            }
          >
            You can add advocates who have registered on the court portal. Others can be
            given case access later, once they register.
          </SectionNotice>
        )}

        {advocates.map((a, i) => {
          // Indices are kept even if a complainant is removed; show only the live ones.
          const selected = a.forComplainants.filter((k) => k < choices.length);
          const allSelected = choices.length > 0 && selected.length === choices.length;
          const forLabel =
            selected.length === 0
              ? "Select complainants"
              : allSelected
                ? "All complainants"
                : selected.map((k) => choices[k]).join(", ");

          return (
            <FormCard
              key={a.id}
              title={`Advocate ${i + 1}`}
              action={
                advocates.length > 1 ? (
                  <RemoveButton
                    label={`Remove advocate ${i + 1}`}
                    onClick={() => removeAdvocate(i)}
                  />
                ) : undefined
              }
            >
              <FormField asGroup label="Advocate for" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Advocate for"
                      className="w-full justify-between font-normal"
                    >
                      <span
                        className={
                          selected.length === 0
                            ? "min-w-0 truncate text-muted-foreground"
                            : "min-w-0 truncate"
                        }
                      >
                        {forLabel}
                      </span>
                      <ChevronDownIcon
                        data-icon="inline-end"
                        aria-hidden
                        className="text-muted-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuCheckboxItem
                      checked={allSelected}
                      onCheckedChange={() => toggleAll(i, allSelected)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      All complainants
                    </DropdownMenuCheckboxItem>
                    {choices.map((label, k) => (
                      <DropdownMenuCheckboxItem
                        key={label}
                        checked={selected.includes(k)}
                        onCheckedChange={() => toggleComplainant(i, k)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormField>

              <FormRow>
                <FormField label="Full name" required>
                  <TextField
                    value={a.name}
                    onChange={(v) => setField(i, "name", v)}
                    placeholder="As signed on the Vakalatnama"
                    autoComplete="off"
                  />
                </FormField>
                <FormField label="Bar registration number" required>
                  <TextField
                    value={a.barNumber}
                    onChange={(v) => setField(i, "barNumber", v)}
                    placeholder="e.g. G/60/1992"
                    autoComplete="off"
                  />
                </FormField>
              </FormRow>

              {canUseProfile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  // Six identical "Use my details" in a row otherwise; the visible label
                  // stays inside the accessible name, so voice control still works.
                  aria-label={`Use my details for advocate ${i + 1}`}
                  onClick={() => fillFromProfile(i)}
                >
                  <UserRoundIcon data-icon="inline-start" aria-hidden />
                  Use my details
                </Button>
              ) : null}
            </FormCard>
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={addAdvocate}
          disabled={advocates.length >= MAX_ADVOCATES}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add another advocate
        </Button>
      </FilingMain>

      <FilingFooter
        backHref={prev ? hrefFor(prev) : undefined}
        continueHref={next ? hrefFor(next) : undefined}
      />

      <SourcePanel
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        eyebrow="Uploaded document"
        title="Vakalatnama"
        chips={[
          {
            label: vakalatnama?.file?.name ?? vakalatnama?.label ?? "Vakalatnama",
            active: true,
            onClick: () => setSourceOpen(true),
          },
        ]}
        file={vakalatnama?.file ?? null}
        uploadHref={hrefFor("upload")}
        imageAlt="Uploaded Vakalatnama"
        note="Copy the advocate's name and bar number from this document."
      />
    </>
  );
}
