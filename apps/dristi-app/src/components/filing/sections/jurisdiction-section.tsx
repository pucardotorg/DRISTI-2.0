"use client";

/**
 * Jurisdiction & limitation — reference implementation for a filing section.
 *
 * Everything a section needs is here: page header, cards of fields, segmented yes/no, a
 * live IFSC lookup, repeat rows, dates, a computed read-only value, and the footer wired
 * to the walk order. Police stations are typed — there is no station registry behind them.
 */

import * as React from "react";
import { CheckIcon, PlusIcon, RefreshCwIcon } from "lucide-react";

import { daysBetween } from "@/lib/filing/format";
import { IFSC_PATTERN, lookupIfsc } from "@/lib/filing/lookups";
import { neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/filing/date-field";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import { FormCard, FormRow, FormSubhead, HalfWidth } from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { TextField } from "@/components/filing/inputs";
import { SectionNotice } from "@/components/filing/notices";
import { RemoveButton } from "@/components/filing/repeat-lists";
import { YesNoSegmented } from "@/components/filing/segmented";

/** How the IFSC lookup last ended, for the button and the help line under it. */
type IfscStatus = "idle" | "loading" | "found" | "not-found" | "error";

/**
 * What the IFSC field says under itself. Success is the only state that claims anything
 * was filled; the other two hand the work back to the person in the same breath.
 * Returns `undefined` when there is nothing to say, so no empty description renders.
 */
function ifscHelp(status: IfscStatus, fetched: boolean): React.ReactNode {
  if (status === "not-found") {
    return (
      <span className="text-warning-ink">
        We couldn&apos;t find this IFSC — check the code or type the bank details
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-warning-ink">
        Couldn&apos;t reach the IFSC registry — type the bank details below
      </span>
    );
  }
  if (status === "found" || (status === "idle" && fetched)) {
    return (
      <span className="inline-flex items-center gap-1 text-success-ink">
        <CheckIcon className="size-4" aria-hidden />
        Bank name and branch filled from the IFSC registry
      </span>
    );
  }
  return undefined;
}

export function JurisdictionSection() {
  const { draft, update, hrefFor } = useFiling();
  const j = draft.jurisdiction;
  const { prev, next } = neighbours("jurisdiction");
  const [ifscStatus, setIfscStatus] = React.useState<IfscStatus>("idle");

  const set = <K extends keyof typeof j>(key: K, value: (typeof j)[K]) =>
    update((d) => {
      d.jurisdiction[key] = value;
    });

  /** Retyping the code invalidates whatever the last lookup said about it. */
  const editIfsc = (value: string) => {
    setIfscStatus("idle");
    update((d) => {
      d.jurisdiction.ifsc = value;
      d.jurisdiction.payeeFetched = false;
    });
  };

  const ifscCode = j.ifsc.trim().toUpperCase();
  const canFetchIfsc = IFSC_PATTERN.test(ifscCode);

  const fetchIfsc = async () => {
    if (!canFetchIfsc || ifscStatus === "loading") return;
    setIfscStatus("loading");
    try {
      const hit = await lookupIfsc(ifscCode);
      if (!hit) {
        setIfscStatus("not-found");
        return;
      }
      update((d) => {
        d.jurisdiction.ifsc = hit.ifsc;
        d.jurisdiction.payeeBankName = hit.bank;
        d.jurisdiction.payeeBankBranch = hit.branch;
        d.jurisdiction.payeeFetched = true;
      });
      setIfscStatus("found");
    } catch {
      setIfscStatus("error");
    }
  };

  const delay = daysBetween(j.causeDate, j.filingDate);
  const durationDisplay =
    delay === null
      ? ""
      : delay <= 30
        ? "None — within limitation"
        : `${delay - 30} day${delay - 30 === 1 ? "" : "s"} beyond the one-month limit`;

  return (
    <>
      <FilingMain>
        <FilingPageHeader
          title="Jurisdiction & limitation"
          description="Establish which court can hear the case, and confirm the complaint is within time."
        />

        {/* Cheque presentation */}
        <FormCard
          title="Cheque presentation"
          description="Where the cheque was presented decides which court has jurisdiction."
        >
          <FormField
            asGroup
            label="Did the payee (complainant) deposit the cheque in their bank account?"
            tip="If the payee deposited it, jurisdiction follows the payee's collecting bank branch."
          >
            <YesNoSegmented
              value={j.deposited}
              onValueChange={(v) => set("deposited", v)}
              ariaLabel="Did the payee deposit the cheque in their bank account?"
            />
          </FormField>

          <SectionNotice>
            Jurisdiction is based on the bank branch where the cheque is presented for
            collection and the account is maintained by the complainant.
          </SectionNotice>

          {j.deposited === "yes" ? (
            <>
              <FormSubhead>Payee (complainant) bank details</FormSubhead>
              <FormField
                label="IFSC code"
                required
                tip="The 11-character code of the complainant's collecting branch. Fetch to auto-fill the bank name and branch."
                help={ifscHelp(ifscStatus, j.payeeFetched)}
              >
                <div className="flex items-start gap-2">
                  <TextField
                    value={j.ifsc}
                    onChange={(v) => editIfsc(v.toUpperCase())}
                    placeholder="e.g. HDFC0000512"
                    autoComplete="off"
                  />
                  {/* Stays focusable while it works — disabling mid-click would drop a
                      keyboard user's place. The guard in the handler stops a second run. */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchIfsc}
                    disabled={!canFetchIfsc}
                    aria-busy={ifscStatus === "loading"}
                  >
                    {ifscStatus === "loading" ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <RefreshCwIcon data-icon="inline-start" aria-hidden />
                    )}
                    Fetch details
                  </Button>
                </div>
              </FormField>
              {/* Typed, not read-only: a code the registry doesn't know still has to be filed. */}
              <FormRow>
                <FormField label="Bank name" required>
                  <TextField
                    value={j.payeeBankName}
                    onChange={(v) => set("payeeBankName", v)}
                    placeholder="Complainant's bank"
                  />
                </FormField>
                <FormField label="Bank branch" required>
                  <TextField
                    value={j.payeeBankBranch}
                    onChange={(v) => set("payeeBankBranch", v)}
                    placeholder="Branch name"
                  />
                </FormField>
              </FormRow>
              <HalfWidth>
                <FormField label="Police station of bank branch" required>
                  <TextField
                    value={j.payeePolice}
                    onChange={(v) => set("payeePolice", v)}
                    placeholder="e.g. Kollam East police station"
                    autoComplete="off"
                  />
                </FormField>
              </HalfWidth>
            </>
          ) : (
            <HalfWidth>
              <FormField label="Police station of drawer (accused) bank branch" required>
                <TextField
                  value={j.drawerPolice}
                  onChange={(v) => set("drawerPolice", v)}
                  placeholder="e.g. Kollam East police station"
                  autoComplete="off"
                />
              </FormField>
            </HalfWidth>
          )}
        </FormCard>

        {/* Other complaints between the same parties */}
        <FormCard title="Other cheque dishonour complaints between the same parties">
          <FormField
            asGroup
            label="Is there any other cheque dishonour complaint under Section 138 of the Negotiable Instruments Act, 1881 pending between the same parties?"
          >
            <YesNoSegmented
              value={j.otherPending}
              onValueChange={(v) => set("otherPending", v)}
              ariaLabel="Any other cheque dishonour complaint pending between the same parties?"
            />
          </FormField>

          {j.otherPending === "yes" ? (
            <>
              <SectionNotice>
                Please state the case details of such cases (court &amp; case number).
              </SectionNotice>
              <div className="flex flex-col gap-4">
                {j.otherCases.map((oc, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <FormRow className="flex-1">
                      <FormField label="Court" required>
                        <TextField
                          value={oc.court}
                          onChange={(v) =>
                            update((d) => {
                              d.jurisdiction.otherCases[i].court = v;
                            })
                          }
                          placeholder="Enter"
                        />
                      </FormField>
                      <FormField label="Case number" required>
                        <TextField
                          value={oc.caseNumber}
                          onChange={(v) =>
                            update((d) => {
                              d.jurisdiction.otherCases[i].caseNumber = v;
                            })
                          }
                          placeholder="Enter"
                        />
                      </FormField>
                    </FormRow>
                    {j.otherCases.length > 1 ? (
                      <RemoveButton
                        label={`Remove case ${i + 1}`}
                        onClick={() =>
                          update((d) => {
                            d.jurisdiction.otherCases.splice(i, 1);
                          })
                        }
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() =>
                  update((d) => {
                    d.jurisdiction.otherCases.push({ court: "", caseNumber: "" });
                  })
                }
              >
                <PlusIcon data-icon="inline-start" aria-hidden />
                Add more
              </Button>
            </>
          ) : null}
        </FormCard>

        {/* Limitation period */}
        <FormCard
          title="Limitation period"
          description="The complaint must be filed within one month of the cause of action arising."
        >
          <FormRow>
            <FormField
              label="Date of cause of action"
              required
              tip="The day after the 15-day payment window from the demand notice expires."
            >
              <DateField value={j.causeDate} onChange={(v) => set("causeDate", v)} />
            </FormField>
            <FormField label="Date of complaint filing">
              <DateField value={j.filingDate} onChange={(v) => set("filingDate", v)} />
            </FormField>
          </FormRow>
          <HalfWidth>
            <FormField label="Duration of delay" help="Calculated from the dates above.">
              <Input value={durationDisplay} readOnly placeholder="-" aria-readonly />
            </FormField>
          </HalfWidth>
          <FormField
            label="Reason for praying condonation of delay"
            tip="Required only if the complaint is filed after the limitation period. Explain the reason for the delay."
          >
            <Textarea
              value={j.condonationReason}
              onChange={(e) => set("condonationReason", e.target.value)}
              placeholder="Enter"
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
