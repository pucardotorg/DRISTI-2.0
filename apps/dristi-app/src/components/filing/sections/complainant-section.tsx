"use client";

/**
 * Complainant details — one tab per complainant, individual or institution.
 *
 * Reading the uploaded identity proof machine-fills the name, age and residential address;
 * those fields carry the amber prefilled marker until they are checked, and clicking one
 * opens that upload beside the form with the read region highlighted.
 */

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { blankComplainant } from "@/lib/filing/blank";
import { ENTITY_TYPES } from "@/lib/filing/options";
import { complainantLabel, partySourceSlot } from "@/lib/filing/selectors";
import { neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import type {
  Address,
  Complainant,
  ComplainantPrefillKey,
  ComplainantType,
  PoaHolder,
  Representative,
} from "@/lib/filing/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { AddressFields } from "@/components/filing/address-fields";
import { ConfirmDialog } from "@/components/filing/confirm-dialog";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain } from "@/components/filing/filing-shell";
import {
  FormCard,
  FormDivider,
  FormRow,
  FormSubhead,
  HalfWidth,
} from "@/components/filing/form-card";
import { FormField } from "@/components/filing/form-field";
import { OptionSelect, PrefixInput, TextField } from "@/components/filing/inputs";
import { PrefillNotice } from "@/components/filing/prefill-notice";
import { RichTextEditor } from "@/components/filing/rich-text-editor";
import { SectionTabs } from "@/components/filing/section-tabs";
import { Segmented, YesNoSegmented } from "@/components/filing/segmented";
import {
  SourcePanel,
  ViewSourceButton,
  regionFromBox,
} from "@/components/filing/source-panel";

/** Panel title per machine-filled field. */
const SOURCE_TITLES: Record<ComplainantPrefillKey, string> = {
  name: "Full name",
  age: "Age",
  email: "Email address",
  res: "Residential address",
  entName: "Entity name",
};

/**
 * Which box on the identity proof each field was read from. An age is written as a date of
 * birth on most IDs, and an address line comes from the address block (or, failing that,
 * the pincode) — so each falls back to what the parser actually found.
 */
const SOURCE_BOX_KEYS: Record<ComplainantPrefillKey, string[]> = {
  name: ["name"],
  age: ["age", "dob"],
  res: ["address", "pin"],
  email: [],
  entName: [],
};

/** The documents uploaded for a complainant, in the order the panel offers them. */
const PARTY_DOCS = ["id-proof", "poa", "vakalatnama"] as const;
type PartyDoc = (typeof PARTY_DOCS)[number];

/** Chip wording when a complainant was added beyond the documents intake asked for. */
const PARTY_DOC_LABELS: Record<PartyDoc, string> = {
  "id-proof": "Identity proof",
  poa: "Power of attorney",
  vakalatnama: "Vakalatnama",
};

const COMPLAINANT_TYPES: { value: ComplainantType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "institution", label: "Institution" },
];

export function ComplainantSection() {
  const { draft, update, hrefFor } = useFiling();
  const { prev, next } = neighbours("complainant");

  const complainants = draft.complainants;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const active = Math.min(activeIndex, complainants.length - 1);
  const c = complainants[active];

  /**
   * The source panel is docked beside the form from `xl` up, so it starts open there as in
   * the demo. Below that it is a sheet over the form — opened on request (a prefilled
   * field, or "View source document") rather than covering the screen on arrival.
   */
  const docked = useMediaQuery("(min-width: 1280px)");
  const [sourceOpen, setSourceOpen] = React.useState(docked);
  const [sourceField, setSourceField] = React.useState<ComplainantPrefillKey>("name");
  /** Which of the complainant's uploads the panel shows; the chips switch between them. */
  const [sourceDoc, setSourceDoc] = React.useState<PartyDoc>("id-proof");
  const [pendingRemove, setPendingRemove] = React.useState<number | null>(null);
  /** The sandbox stand-in for mobile verification — see the dialog at the foot of the file. */
  const [otpOpen, setOtpOpen] = React.useState(false);
  const [otp, setOtp] = React.useState("");

  /* ── writes ──────────────────────────────────────────────────────────────── */

  const set = <K extends keyof Complainant>(key: K, value: Complainant[K]) =>
    update((d) => {
      d.complainants[active][key] = value;
    });

  /** Changing the number retires the check that was run against the old one. */
  const setMobile = (value: string) =>
    update((d) => {
      const target = d.complainants[active];
      if (value !== target.mobile) target.verified = false;
      target.mobile = value;
    });

  /** Editing a machine-filled field clears its amber marker. */
  const setRead = (key: ComplainantPrefillKey, value: string) =>
    update((d) => {
      const target = d.complainants[active];
      if (key === "res") target.res.line1 = value;
      else if (key === "name") target.name = value;
      else if (key === "age") target.age = value;
      else if (key === "email") target.email = value;
      else target.entName = value;
      target.edited[key] = true;
    });

  const setRes = (value: Address) =>
    update((d) => {
      const target = d.complainants[active];
      // Only the address line was read from the record, so only it clears the marker.
      if (value.line1 !== target.res.line1) target.edited.res = true;
      target.res = value;
    });

  const setPoa = <K extends keyof PoaHolder>(key: K, value: PoaHolder[K]) =>
    update((d) => {
      d.complainants[active].poaHolder[key] = value;
    });

  const setRep = <K extends keyof Representative>(key: K, value: Representative[K]) =>
    update((d) => {
      d.complainants[active].rep[key] = value;
    });

  const addComplainant = () => {
    update((d) => {
      d.complainants.push(blankComplainant());
    });
    setActiveIndex(complainants.length);
  };

  const removeComplainant = (index: number) => {
    if (complainants.length <= 1) return;
    update((d) => {
      d.complainants.splice(index, 1);
    });
    setActiveIndex(Math.min(active, complainants.length - 2));
  };

  /* ── source panel ────────────────────────────────────────────────────────── */

  const openSource = (field: ComplainantPrefillKey) => {
    setSourceField(field);
    setSourceDoc("id-proof");
    setSourceOpen(true);
  };

  // Everything machine-read on a complainant comes off their identity proof; the PoA and
  // Vakalatnama are here to be looked at while the rest of the form is filled in.
  const partySlots = PARTY_DOCS.map((doc) => ({
    doc,
    slot: partySourceSlot(draft, active, doc),
  }));
  const sourceSlot = partySlots.find((s) => s.doc === sourceDoc)?.slot;
  const idProof = sourceDoc === "id-proof" ? sourceSlot : undefined;
  const sourceValue =
    sourceField === "res"
      ? c.res.line1
      : sourceField === "entName"
        ? c.entName
        : sourceField === "email"
          ? c.email
          : sourceField === "age"
            ? c.age
            : c.name;
  const sourceBox = SOURCE_BOX_KEYS[sourceField]
    .map((key) => idProof?.extract?.fields[key]?.box)
    .find(Boolean);
  const sourceRegion = regionFromBox(sourceBox, idProof?.extract?.page);

  /** Amber shows only while the value is still the machine-read one. */
  const isPrefilled = (key: ComplainantPrefillKey, value: string) =>
    !!c.prefilled[key] && !c.edited[key] && !!value;

  const namePrefilled = isPrefilled("name", c.name);
  const agePrefilled = isPrefilled("age", c.age);
  const emailPrefilled = isPrefilled("email", c.email);
  const entNamePrefilled = isPrefilled("entName", c.entName);
  const resPrefilled = !!c.prefilled.res && !c.edited.res;
  /** Something on this complainant is still waiting to be checked. */
  const anyPrefilled =
    namePrefilled || agePrefilled || emailPrefilled || entNamePrefilled || resPrefilled;

  const mobile10 = c.mobile.replace(/\D/g, "");
  const mobileMatched = !!c.mobile && c.mobile === c.confirm;
  /** OTP only makes sense once there is a whole number, and one the person re-typed. */
  const canVerify =
    mobile10.length === 10 &&
    (!c.confirm.trim() || c.confirm.replace(/\D/g, "") === mobile10);

  return (
    <>
      <FilingMain sourceOpen={sourceOpen}>
        <FilingPageHeader title="Complainant details" />

        <SectionTabs
          tabs={complainants.map((cp, i) => ({
            id: cp.id,
            label: complainantLabel(cp, i),
            status: cp.toReview ? "attention" : "complete",
            removable: complainants.length > 1,
          }))}
          activeId={c.id}
          onSelect={(id) => {
            const i = complainants.findIndex((cp) => cp.id === id);
            if (i >= 0) setActiveIndex(i);
          }}
          onRemove={(id) => {
            const i = complainants.findIndex((cp) => cp.id === id);
            if (i >= 0) setPendingRemove(i);
          }}
          addLabel="Add complainant"
          onAdd={addComplainant}
          trailing={
            sourceOpen ? null : <ViewSourceButton onClick={() => setSourceOpen(true)} />
          }
        />

        <PrefillNotice show={anyPrefilled} />

        {/* Representation & type */}
        <FormCard title="Representation & type">
          <FormField
            asGroup
            label="Are you representing yourself in person (party-in-person)?"
          >
            <YesNoSegmented
              value={c.pip}
              onValueChange={(v) => set("pip", v)}
              ariaLabel="Are you representing yourself in person (party-in-person)?"
            />
          </FormField>
          <FormField asGroup label="Complainant type">
            <Segmented
              value={c.type}
              onValueChange={(v) => set("type", v)}
              options={COMPLAINANT_TYPES}
              ariaLabel="Complainant type"
            />
          </FormField>
        </FormCard>

        {c.type === "individual" ? (
          <>
            {/* Contact */}
            <FormCard
              title="Contact"
              description="Use the complainant's own number, not the advocate's."
            >
              <FormRow>
                <FormField
                  label="Mobile number"
                  required
                  help={
                    c.verified ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success-ink">
                        <CheckIcon className="size-4" aria-hidden />
                        Verified in sandbox — no OTP was sent
                      </span>
                    ) : undefined
                  }
                >
                  <div className="flex flex-col items-start gap-2">
                    <PrefixInput
                      prefix="+91"
                      value={c.mobile}
                      onChange={setMobile}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      autoComplete="tel-national"
                    />
                    {c.verified ? null : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOtp("");
                          setOtpOpen(true);
                        }}
                        disabled={!canVerify}
                      >
                        Verify by OTP
                      </Button>
                    )}
                  </div>
                </FormField>
                <FormField
                  label="Confirm number"
                  required
                  help={
                    mobileMatched ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success-ink">
                        <CheckIcon className="size-4" aria-hidden />
                        Numbers match
                      </span>
                    ) : undefined
                  }
                >
                  <PrefixInput
                    prefix="+91"
                    value={c.confirm}
                    onChange={(v) => set("confirm", v)}
                    placeholder="Re-enter number"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </FormField>
              </FormRow>
            </FormCard>

            {/* Basic details */}
            <FormCard title="Basic details">
              <FormRow>
                <FormField label="Full name" required>
                  <TextField
                    value={c.name}
                    onChange={(v) => setRead("name", v)}
                    placeholder="As printed on the cheque"
                    autoComplete="name"
                    prefilled={namePrefilled}
                    onViewSource={() => openSource("name")}
                  />
                </FormField>
                <FormField label="Email address" optional>
                  <TextField
                    type="email"
                    value={c.email}
                    onChange={(v) => setRead("email", v)}
                    placeholder="optional@example.com"
                    autoComplete="email"
                    prefilled={emailPrefilled}
                    onViewSource={() => openSource("email")}
                  />
                </FormField>
              </FormRow>
              <HalfWidth>
                <FormField label="Age" required>
                  <TextField
                    value={c.age}
                    onChange={(v) => setRead("age", v)}
                    placeholder="e.g. 47"
                    inputMode="numeric"
                    prefilled={agePrefilled}
                    onViewSource={() => openSource("age")}
                  />
                </FormField>
              </HalfWidth>
            </FormCard>

            {/* Residential address */}
            <FormCard
              title="Residential address"
              description="Where the complainant currently lives."
            >
              <AddressFields
                value={c.res}
                onChange={setRes}
                prefilled={resPrefilled}
                onViewSource={() => openSource("res")}
              />
              <FormField
                asGroup
                label="Is the permanent address the same as the residential address?"
              >
                <YesNoSegmented
                  value={c.permSame}
                  onValueChange={(v) => set("permSame", v)}
                  ariaLabel="Is the permanent address the same as the residential address?"
                />
              </FormField>
            </FormCard>

            {c.permSame === "no" ? (
              <FormCard title="Permanent address">
                <AddressFields value={c.perm} onChange={(v) => set("perm", v)} />
              </FormCard>
            ) : null}

            {/* Power of attorney */}
            <FormCard title="Power of attorney (PoA)">
              <FormField
                asGroup
                label="Has the complainant authorised any person as their power of attorney in this case?"
              >
                <YesNoSegmented
                  value={c.poa}
                  onValueChange={(v) => set("poa", v)}
                  ariaLabel="Has the complainant authorised any person as their power of attorney in this case?"
                />
              </FormField>

              {c.poa === "yes" ? (
                <>
                  <FormDivider />
                  <FormSubhead>PoA holder details</FormSubhead>
                  <HalfWidth>
                    <FormField label="PoA holder mobile number" required>
                      <PrefixInput
                        prefix="+91"
                        value={c.poaHolder.mobile}
                        onChange={(v) => setPoa("mobile", v)}
                        placeholder="10-digit number"
                        inputMode="numeric"
                      />
                    </FormField>
                  </HalfWidth>
                  <FormRow>
                    <FormField label="PoA holder full name" required>
                      <TextField
                        value={c.poaHolder.name}
                        onChange={(v) => setPoa("name", v)}
                        placeholder="Full name"
                      />
                    </FormField>
                    <FormField label="PoA holder age" required>
                      <TextField
                        value={c.poaHolder.age}
                        onChange={(v) => setPoa("age", v)}
                        placeholder="e.g. 52"
                        inputMode="numeric"
                      />
                    </FormField>
                  </FormRow>
                  <FormSubhead>PoA holder&apos;s residential address</FormSubhead>
                  <AddressFields
                    value={c.poaHolder.res}
                    onChange={(v) => setPoa("res", v)}
                  />
                  <FormField
                    asGroup
                    label="Is the PoA holder's permanent address the same as residential?"
                  >
                    <YesNoSegmented
                      value={c.poaHolder.permSame}
                      onValueChange={(v) => setPoa("permSame", v)}
                      ariaLabel="Is the PoA holder's permanent address the same as residential?"
                    />
                  </FormField>
                  {c.poaHolder.permSame === "no" ? (
                    <>
                      <FormSubhead>PoA holder&apos;s permanent address</FormSubhead>
                      <AddressFields
                        value={c.poaHolder.perm}
                        onChange={(v) => setPoa("perm", v)}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </FormCard>
          </>
        ) : (
          <>
            {/* Institution details */}
            <FormCard title="Institution details">
              <FormRow>
                <FormField label="Type of entity" required>
                  <OptionSelect
                    value={c.entType}
                    onValueChange={(v) => set("entType", v)}
                    options={ENTITY_TYPES}
                    placeholder="Select type"
                  />
                </FormField>
                <FormField label="Entity name" required>
                  <TextField
                    value={c.entName}
                    onChange={(v) => setRead("entName", v)}
                    placeholder="Registered name"
                    prefilled={entNamePrefilled}
                    onViewSource={() => openSource("entName")}
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="Contact number" optional>
                  <PrefixInput
                    prefix="+91"
                    value={c.entPhone}
                    onChange={(v) => set("entPhone", v)}
                    placeholder="10-digit number"
                    inputMode="numeric"
                  />
                </FormField>
                <FormField label="Email address" optional>
                  <TextField
                    type="email"
                    value={c.entEmail}
                    onChange={(v) => set("entEmail", v)}
                    placeholder="optional@example.com"
                    autoComplete="email"
                  />
                </FormField>
              </FormRow>
            </FormCard>

            {/* Registered address */}
            <FormCard title="Registered address">
              <AddressFields value={c.entAddr} onChange={(v) => set("entAddr", v)} />
            </FormCard>

            {/* Authorised representative */}
            <FormCard
              title="Authorised representative"
              description="The person authorised to act for the institution in this case."
            >
              <HalfWidth>
                <FormField label="Mobile number" required>
                  <PrefixInput
                    prefix="+91"
                    value={c.rep.mobile}
                    onChange={(v) => setRep("mobile", v)}
                    placeholder="10-digit number"
                    inputMode="numeric"
                  />
                </FormField>
              </HalfWidth>
              <FormRow>
                <FormField label="Full name" required>
                  <TextField
                    value={c.rep.name}
                    onChange={(v) => setRep("name", v)}
                    placeholder="Full name"
                  />
                </FormField>
                <FormField label="Age" required>
                  <TextField
                    value={c.rep.age}
                    onChange={(v) => setRep("age", v)}
                    placeholder="e.g. 47"
                    inputMode="numeric"
                  />
                </FormField>
              </FormRow>
              <HalfWidth>
                <FormField label="Email address" optional>
                  <TextField
                    type="email"
                    value={c.rep.email}
                    onChange={(v) => setRep("email", v)}
                    placeholder="optional@example.com"
                    autoComplete="email"
                  />
                </FormField>
              </HalfWidth>
              <FormSubhead>Representative&apos;s address</FormSubhead>
              <AddressFields
                value={c.rep.addr}
                onChange={(v) => setRep("addr", v)}
              />
            </FormCard>
          </>
        )}

        {/* Affidavit — only when appearing without an advocate */}
        {c.pip === "yes" ? (
          <FormCard
            title="Affidavit for appearing as party-in-person"
            description="Pre-filled from the standard template — edit if needed."
          >
            <RichTextEditor
              value={c.affidavit}
              onChange={(html) => set("affidavit", html)}
              ariaLabel="Affidavit for appearing as party-in-person"
            />
          </FormCard>
        ) : null}
      </FilingMain>

      <FilingFooter
        backHref={prev ? hrefFor(prev) : undefined}
        continueHref={next ? hrefFor(next) : undefined}
      />

      <SourcePanel
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        title={SOURCE_TITLES[sourceField]}
        value={sourceValue}
        onValueChange={(v) => setRead(sourceField, v)}
        chips={partySlots.map(({ doc, slot }) => ({
          label: slot?.file?.name ?? slot?.label ?? PARTY_DOC_LABELS[doc],
          active: doc === sourceDoc,
          onClick: () => setSourceDoc(doc),
        }))}
        file={sourceSlot?.file ?? null}
        uploadHref={hrefFor("upload")}
        imageAlt={`Uploaded ${sourceSlot?.label ?? "document"}`}
        region={sourceRegion}
        note="Shown from your uploaded document."
      />

      {/* Mobile verification — the sandbox stand-in, shown as one. Nothing is sent, so the
          dialog says so in place and the field afterwards says so too. */}
      <Dialog
        open={otpOpen}
        onOpenChange={(open) => {
          setOtpOpen(open);
          if (!open) setOtp("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify the mobile number</DialogTitle>
            <DialogDescription>
              This confirms the number the court will use to reach{" "}
              {complainantLabel(c, active)}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="complainant-otp" className="text-body-compact">
              Enter OTP
            </Label>
            <InputOTP
              id="complainant-otp"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              containerClassName="gap-2"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="size-10 rounded-lg border border-input"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-caption text-muted-foreground">
              Sandbox — no OTP is sent, and any 6-digit code is accepted here.
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={otp.length < 6}
            onClick={() => {
              set("verified", true);
              setOtp("");
              setOtpOpen(false);
            }}
          >
            Verify number
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        title={
          pendingRemove !== null && complainants[pendingRemove]
            ? `Remove ${complainantLabel(complainants[pendingRemove], pendingRemove)}`
            : "Remove complainant"
        }
        description="Are you sure you want to delete this complainant and all their details? This cannot be undone."
        onConfirm={() => {
          if (pendingRemove !== null) removeComplainant(pendingRemove);
          setPendingRemove(null);
        }}
      />
    </>
  );
}
