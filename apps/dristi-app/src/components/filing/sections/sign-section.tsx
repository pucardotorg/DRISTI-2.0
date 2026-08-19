"use client";

/**
 * Sign the complaint — the document in the column, and one rail beside it carrying both
 * who has signed and what you can do about it (stacked above the document below `xl`).
 *
 * It keeps the filing's Sections rail like every other step: the old two-rail layout ate
 * the width the rail needed, which left Sign the one screen you could not navigate out of
 * the way the rest of the flow had taught you.
 *
 * Committing to a mode is its own step, not a click on the rail: the rail carries one
 * "Continue to sign" button, which opens a dialog naming both paths and what each one
 * does to the *other* signatories — before either is clickable, not after. Nothing here
 * is a private action; every party on the complaint signs the one way that was chosen.
 *
 * The paying half of the flow lives here too: fees → process and address → payment →
 * the case file number. The document itself is the shared court sheet Preview renders.
 *
 * Signing and payment are the one part of this flow with no real system behind them yet.
 * They are wired to the draft (who signed, in what mode, what was chosen, what was
 * "paid") and every screen that stands in for a real service says so in place.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CopyIcon,
  FileTextIcon,
  PrinterIcon,
  SignatureIcon,
  UploadIcon,
} from "lucide-react";

import { getRepository, storeUpload } from "@/lib/filing/data";
import { forgetFile, formatBytes } from "@/lib/filing/files";
import { addressToString, rupees, toLongDate } from "@/lib/filing/format";
import {
  COURT,
  COURT_FEE_LINES,
  DELIVERY_CHANNELS,
  PROCESS_TYPES,
} from "@/lib/filing/options";
import { useProfile } from "@/lib/filing/profile";
import { accusedLabel, signatories } from "@/lib/filing/selectors";
import { FILINGS_HOME, neighbours } from "@/lib/filing/steps";
import { useFiling } from "@/lib/filing/store";
import type { Signatory, StoredFileRef } from "@/lib/filing/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useSourceDock } from "@/hooks/use-min-width";
import { TOP_BAR_HEIGHT } from "@/components/filing/chrome";
import { ConfirmDialog } from "@/components/filing/confirm-dialog";
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { FilingMain, useSourceRailSlot } from "@/components/filing/filing-shell";
import { PANEL_CLASS } from "@/components/filing/form-card";
import { useLeaveGuard } from "@/components/filing/leave-guard";
import { SectionNotice } from "@/components/filing/notices";
import { CourtDocument } from "@/components/filing/sections/preview/court-document";
import { pickErrorMessage, useFilePicker } from "@/components/filing/use-file-picker";

type ModalKey =
  | "choose"
  | "esign"
  | "upload"
  | "payment"
  | "procaddr"
  | "processing"
  | "success"
  | null;

/** What the court charges for this filing — the schedule is the court's, the sum is ours. */
const FEE_TOTAL = COURT_FEE_LINES.reduce((sum, line) => sum + line.amount, 0);

const REF_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Stand-in payment reference — the shape a gateway returns, generated locally. */
function newPaymentRef(): string {
  const n = 10;
  let out = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  } else {
    for (let i = 0; i < n; i += 1) {
      out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
    }
  }
  return `TXN-${out}`;
}

function newCaseFileNumber(): string {
  const serial = String(Date.now() % 1_000_000).padStart(6, "0");
  return `KL-${serial}-${new Date().getFullYear()}`;
}

/* ───────────────────────────── Signature rail ──────────────────────── */

function SignatureList({ title, rows }: { title: string; rows: Signatory[] }) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-col">
        {rows.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center gap-3 border-b border-hairline py-3 last:border-b-0"
          >
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-medium text-secondary-foreground tabular-nums"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-compact font-semibold text-foreground">
                  {s.name}
                </span>
                {/* One chip per row — the status. "You" is a caption, not a badge. */}
                {s.you ? (
                  <span className="text-caption font-medium text-muted-foreground">
                    You
                  </span>
                ) : null}
              </div>
              <p className="text-caption font-medium text-muted-foreground">{s.role}</p>
            </div>
            {s.status === "signed" ? (
              <Badge variant="success">
                <CheckIcon aria-hidden />
                Signed
              </Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignatureSummary({
  complainants,
  advocates,
}: {
  complainants: Signatory[];
  advocates: Signatory[];
}) {
  const all = [...complainants, ...advocates];
  const signed = all.filter((s) => s.status === "signed").length;
  const pct = all.length ? Math.round((signed / all.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-body font-semibold">Signatures</h2>
          <span className="text-caption font-medium text-muted-foreground tabular-nums">
            {signed} of {all.length} signed
          </span>
        </div>
        <Progress
          value={pct}
          aria-label={`${signed} of ${all.length} signatures collected`}
          className="h-1.5"
        />
      </div>
      <SignatureList title="Complainant signature" rows={complainants} />
      <SignatureList title="Advocate signature" rows={advocates} />
    </div>
  );
}

/* ───────────────────────────── Screen ──────────────────────────────── */

export function SignSection() {
  const { draft, update, hrefFor, flush } = useFiling();
  const { profile } = useProfile();
  const { prev } = neighbours("sign");
  const { pick, input } = useFilePicker();
  const router = useRouter();
  const docked = useSourceDock();
  const slot = useSourceRailSlot();

  const [modal, setModal] = React.useState<ModalKey>(null);
  /** Where the person asked to go while signatures are on the sheet. */
  const [leaveTo, setLeaveTo] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [resent, setResent] = React.useState(false);
  const [feesOpen, setFeesOpen] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const payTimer = React.useRef<number | null>(null);
  const copyTimer = React.useRef<number | null>(null);
  const resendTimer = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (payTimer.current) window.clearTimeout(payTimer.current);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (resendTimer.current) window.clearTimeout(resendTimer.current);
    },
    []
  );

  const filed = draft.status === "filed";
  const sign = draft.sign;

  // Who signs is derived from the parties, never stored: editing a party changes this list.
  const { complainants, advocates } = React.useMemo(
    () => signatories(draft, profile),
    [draft, profile]
  );
  const everyone = React.useMemo(
    () => [...complainants, ...advocates],
    [complainants, advocates]
  );
  // The same person can be both a complainant and the advocate — one signature covers
  // every capacity they sign in.
  const yous = everyone.filter((s) => s.you);
  const you = yous[0] ?? null;
  const youSigned = yous.length > 0 && yous.every((s) => s.status === "signed");
  const allSigned = everyone.length > 0 && everyone.every((s) => s.status === "signed");
  const anySigned = everyone.some((s) => s.status === "signed");
  const pending = everyone.filter((s) => s.status === "pending").length;
  /** Everyone the E-Sign path hands a link to, once "you" have signed your own rows. */
  const otherSigners = Math.max(0, everyone.length - yous.length);

  /**
   * Every signature on this screen belongs to *this* version of the complaint. Going back
   * to change the case means the sheet the parties signed no longer exists, so the
   * signatures cannot survive the trip — the question is asked before the move, not after.
   */
  const guardLeaving = React.useCallback(
    (href: string) => {
      if (filed || !anySigned) return false;
      setLeaveTo(href);
      return true;
    },
    [filed, anySigned, setLeaveTo]
  );
  useLeaveGuard(guardLeaving);

  const discardSignatures = () => {
    const copy = sign.signedCopy;
    update((d) => {
      d.sign.signed = {};
      d.sign.mode = null;
      d.sign.signedCopy = null;
    });
    if (copy) {
      forgetFile(copy.id);
      void getRepository().deleteFile(copy.id);
    }
  };

  const confirmLeave = () => {
    const href = leaveTo;
    discardSignatures();
    setLeaveTo(null);
    if (href) router.push(href);
  };

  // A filed draft must reach storage even if the tab closes on the success screen.
  React.useEffect(() => {
    if (filed) void flush();
  }, [filed, flush]);

  const mobileTail = (profile?.mobile ?? "").replace(/\D/g, "").slice(-4);

  /** Every address the court could serve process at, across all accused. */
  const addressOptions = React.useMemo(
    () =>
      draft.accused.flatMap((a, ai) =>
        a.addresses.flatMap((block, i) => {
          const text = addressToString(block.addr);
          if (!text.trim()) return [];
          // Several addresses for one accused need telling apart in the list.
          const label =
            a.addresses.length > 1
              ? `${accusedLabel(a, ai)} · Address ${i + 1}`
              : accusedLabel(a, ai);
          return [{ key: `${a.id}:${i}`, label, text }];
        })
      ),
    [draft.accused]
  );
  // Nothing chosen yet means "everywhere we know of" — the choice persists on first edit.
  const selectedAddresses = sign.processAddresses.length
    ? sign.processAddresses
    : addressOptions.map((o) => o.key);

  const printFile = () => {
    if (typeof window !== "undefined") window.print();
  };

  const closeModal = () => setModal(null);

  /** E-Sign records one person's signature; the other parties still have to sign. */
  const signYou = () => {
    if (yous.length === 0) return;
    update((d) => {
      for (const s of yous) d.sign.signed[s.id] = true;
      d.sign.mode = "esign";
    });
    setOtp("");
    setModal(null);
  };

  /**
   * An uploaded copy is the complaint *after* every party has signed it — that is what
   * the upload asks for and what the person confirms by submitting it. So it settles the
   * whole sheet, not the uploader's own row: no one is asked to sign again for a
   * signature already on the page in front of them.
   */
  const submitSignedCopy = () => {
    if (!sign.signedCopy) return;
    update((d) => {
      for (const s of everyone) d.sign.signed[s.id] = true;
      d.sign.mode = "upload";
    });
    setModal(null);
  };

  /** Store the signed copy the person uploaded, replacing any earlier one. */
  const receiveSignedCopy = async (file: File) => {
    const previous = sign.signedCopy;
    let ref: StoredFileRef;
    try {
      ref = await storeUpload(file);
    } catch {
      setUploadError("We couldn't store that file in this browser. Please try again.");
      return;
    }
    update((d) => {
      d.sign.signedCopy = ref;
    });
    if (previous) {
      forgetFile(previous.id);
      void getRepository().deleteFile(previous.id);
    }
  };

  const chooseSignedCopy = () => {
    setUploadError(null);
    pick((file, error) => {
      if (error) {
        setUploadError(pickErrorMessage(error));
        return;
      }
      if (file) void receiveSignedCopy(file);
    });
  };

  const resendOtp = () => {
    setResent(true);
    if (resendTimer.current) window.clearTimeout(resendTimer.current);
    resendTimer.current = window.setTimeout(() => setResent(false), 2500);
  };

  const toggleProcess = (key: string) =>
    update((d) => {
      const chosen = new Set(d.sign.processTypes);
      if (chosen.has(key)) chosen.delete(key);
      else chosen.add(key);
      // Keep the option order, and keep the processes that always issue.
      d.sign.processTypes = PROCESS_TYPES.filter(
        (p) => chosen.has(p.key) || !p.optional
      ).map((p) => p.key);
    });

  const toggleAddress = (key: string) =>
    update((d) => {
      const current = d.sign.processAddresses.length
        ? d.sign.processAddresses
        : addressOptions.map((o) => o.key);
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      // Process has to go somewhere — the last selected address stays selected.
      if (next.length) d.sign.processAddresses = next;
    });

  const setChannel = (value: string) =>
    update((d) => {
      d.sign.deliveryChannel = value;
    });

  const payNow = () => {
    setModal("processing");
    if (payTimer.current) window.clearTimeout(payTimer.current);
    payTimer.current = window.setTimeout(() => {
      const now = new Date().toISOString();
      const ref = newPaymentRef();
      const caseNumber = newCaseFileNumber();
      update((d) => {
        d.sign.paid = true;
        d.sign.paidAt = now;
        d.sign.paymentRef = ref;
        d.sign.caseFileNumber = caseNumber;
        d.status = "filed";
        d.filedAt = now;
        if (!d.sign.processAddresses.length) {
          d.sign.processAddresses = addressOptions.map((o) => o.key);
        }
        if (!d.sign.deliveryChannel) d.sign.deliveryChannel = DELIVERY_CHANNELS[0];
      });
      setModal("success");
    }, 2600);
  };

  const copyLink = () => {
    if (typeof window !== "undefined") {
      try {
        void navigator.clipboard?.writeText(
          `${window.location.origin}${hrefFor("preview")}`
        );
      } catch {
        /* clipboard blocked — the case number is on screen either way */
      }
    }
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  /**
   * What the rail carries once the filing is done — the record, not the actions. The rail
   * is a white panel in both places it appears (its own column, and the card it stacks
   * into below `xl`), so the record block is one layer in from it either way.
   */
  const filedRecord = () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Filed</h2>
        <p className="text-body-compact text-muted-foreground">
          This complaint has been submitted and paid for.
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-lg bg-surface-sunken p-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption font-medium text-muted-foreground">
            Case file number
          </dt>
          <dd className="text-body font-semibold tabular-nums">
            {sign.caseFileNumber ?? "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption font-medium text-muted-foreground">Filed on</dt>
          <dd className="text-body-compact font-medium tabular-nums">
            {draft.filedAt ? toLongDate(draft.filedAt.slice(0, 10)) : "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption font-medium text-muted-foreground">Amount paid</dt>
          <dd className="text-body-compact font-medium tabular-nums">
            {rupees(FEE_TOTAL)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption font-medium text-muted-foreground">
            Payment reference
          </dt>
          <dd className="font-mono text-body-compact font-medium break-all">
            {sign.paymentRef ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" onClick={copyLink}>
          <CopyIcon data-icon="inline-start" aria-hidden />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" variant="ghost" onClick={printFile}>
          <PrinterIcon data-icon="inline-start" aria-hidden />
          Print or save as PDF
        </Button>
      </div>

      <p className="text-caption text-muted-foreground">
        Sandbox — this filing has not been sent to a real court.
      </p>
    </div>
  );

  /** "Add your signature" — the lower half of the signing rail. */
  const signActions = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">
          {allSigned ? "Signing complete" : "Add your signature"}
        </h2>
        {you ? null : (
          <p className="text-body-compact text-muted-foreground">
            Add a complainant or an advocate before signing.
          </p>
        )}
      </div>

      {allSigned ? (
        <>
          <SectionNotice variant="success" announce="polite">
            {sign.mode === "upload"
              ? "The uploaded copy carries every signature."
              : "Every party has signed."}
          </SectionNotice>
          {sign.mode === "upload" ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setModal("upload")}
            >
              <UploadIcon data-icon="inline-start" aria-hidden />
              Replace signed copy
            </Button>
          ) : null}
        </>
      ) : youSigned ? (
        <SectionNotice variant="success" announce="polite" title="You have signed">
          {pending === 1 ? "One more party" : `${pending} more parties`} still to sign.
        </SectionNotice>
      ) : (
        /*
         * One CTA, not a button plus a dropdown of two more choices — the previous
         * shape put "how will this be signed" and "sign now" in the same click, which
         * is why it read as a personal action. The commitment itself, and what it means
         * for the *other* signatories, belongs in its own step (owner, 2026-08-19): see
         * the "How will this complaint be signed?" dialog below.
         */
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!you}
          onClick={() => setModal("choose")}
        >
          <SignatureIcon data-icon="inline-start" aria-hidden />
          Continue to sign
        </Button>
      )}
    </div>
  );

  /**
   * One rail, not two. Who has signed and what you can do about it are the same question,
   * and splitting them across opposite edges of the screen cost the filing its Sections
   * rail — the only screen in the flow you could not navigate out of the way you had been
   * taught (owner, 2026-08-18).
   */
  const railBody = filed ? (
    filedRecord()
  ) : (
    <div className="flex flex-col gap-6">
      <SignatureSummary complainants={complainants} advocates={advocates} />
      <div role="separator" className="h-px w-full bg-hairline" />
      {signActions}
    </div>
  );

  const backHref = filed ? hrefFor("preview") : prev ? hrefFor(prev) : hrefFor("preview");

  return (
    <>
      {input}

      <FilingMain width="wide" sourceOpen={docked}>
        <FilingPageHeader
          title={filed ? "Complaint filed" : "Sign the complaint"}
          description={
            filed
              ? `Filed in the ${COURT.name} under S-138, Negotiable Instruments Act.`
              : `You are filing a criminal complaint under S-138, Negotiable Instruments Act in the ${COURT.name}.`
          }
        />

        {/* Below xl there is no width for a rail column, so it stacks above the document. */}
        <Card className={cn(PANEL_CLASS, "xl:hidden")}>
          <CardContent>{railBody}</CardContent>
        </Card>

        {/* Scrolls on its own, so it is focusable — a keyboard user must be able to
            reach the scroll region to read the document. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Complaint document"
          className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CourtDocument draft={draft} />
        </div>
      </FilingMain>

      {/* From xl the rail takes the shell's third column, beside the document. */}
      {docked && slot
        ? createPortal(
            <aside
              aria-label={filed ? "Filing record" : "Signatures"}
              style={{ top: TOP_BAR_HEIGHT, height: `calc(100svh - ${TOP_BAR_HEIGHT})` }}
              className="sticky flex w-80 shrink-0 flex-col self-start overflow-y-auto border-l border-hairline bg-card p-6"
            >
              {railBody}
            </aside>,
            slot
          )
        : null}

      {filed ? (
        <FilingFooter
          backHref={backHref}
          continueHref={FILINGS_HOME}
          continueLabel="Back to dashboard"
          showSaveState={false}
          extra={
            <Button type="button" variant="outline" size="lg" onClick={printFile}>
              <PrinterIcon data-icon="inline-start" aria-hidden />
              Print or save as PDF
            </Button>
          }
        />
      ) : (
        <FilingFooter
          onBack={() => {
            if (!guardLeaving(backHref)) router.push(backHref);
          }}
          continueLabel="Continue to pay fees"
          // Nothing to pay for until the sheet is signed, so the step's one real action
          // stays dead until it is — and then it is the focal teal, as on every other step.
          continueDisabled={!allSigned}
          showSaveState={false}
          onContinue={() => setModal("payment")}
          extra={
            <Button type="button" variant="outline" size="lg" onClick={printFile}>
              <PrinterIcon data-icon="inline-start" aria-hidden />
              Print or save as PDF
            </Button>
          }
        />
      )}

      {/*
        ── How will this complaint be signed? ──
        The commitment point. Neither path is one person's action — E-Sign hands the
        rest of the parties a link the moment you pick it, and an uploaded copy is only
        accepted once it already carries every signature — so both options say who else
        it reaches before either one is clickable, not after (owner, 2026-08-19).
      */}
      <Dialog open={modal === "choose"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How will this complaint be signed?</DialogTitle>
            <DialogDescription>
              {everyone.length > 1
                ? `All ${everyone.length} signatories sign the same way.`
                : "Choose how this complaint is signed."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setOtp("");
                setModal("esign");
              }}
              className="group flex w-full items-start gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-muted text-info-muted-foreground"
              >
                <SignatureIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-body font-semibold text-foreground">
                  E-Sign with Aadhaar OTP
                </span>
                <span className="text-body-compact text-muted-foreground">
                  You sign now.{" "}
                  {otherSigners === 1
                    ? "The other party gets"
                    : `The other ${otherSigners} parties get`}{" "}
                  a link to sign the same way.
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </button>

            <button
              type="button"
              onClick={() => setModal("upload")}
              className="group flex w-full items-start gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning-muted-foreground"
              >
                <UploadIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-body font-semibold text-foreground">
                  Upload a signed copy
                </span>
                <span className="text-body-compact text-muted-foreground">
                  One file that already carries{" "}
                  {everyone.length > 1 ? `all ${everyone.length} signatures` : "the signature"}
                  , on paper or by DSC.
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>

          <p className="flex flex-wrap items-center gap-1 text-caption text-muted-foreground">
            Nothing is filed until every signature is in.
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-caption underline"
              onClick={printFile}
            >
              Print or save as PDF
            </Button>
          </p>
        </DialogContent>
      </Dialog>

      {/* ── E-Sign with Aadhaar ── */}
      <Dialog open={modal === "esign"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>E-Sign with Aadhaar</DialogTitle>
            <DialogDescription>
              {mobileTail ? (
                <>
                  In the live service, a 6-digit OTP goes to your Aadhaar-linked mobile
                  ending{" "}
                  <strong className="font-semibold text-foreground tabular-nums">
                    •••• {mobileTail}
                  </strong>
                  .
                </>
              ) : (
                "In the live service, a 6-digit OTP goes to your Aadhaar-linked mobile."
              )}
            </DialogDescription>
          </DialogHeader>

          {otherSigners > 0 ? (
            <SectionNotice variant="neutral">
              {otherSigners === 1
                ? "The other party will get a link to sign too, once you have."
                : `The other ${otherSigners} parties will get a link to sign too, once you have.`}
            </SectionNotice>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="esign-otp" className="text-body-compact">
              Enter OTP
            </Label>
            <InputOTP
              id="esign-otp"
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
              Sandbox — any 6-digit code is accepted here.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-body-compact text-muted-foreground">
              Didn’t get it?
            </span>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 underline"
              onClick={resendOtp}
            >
              {resent ? "Sent again" : "Resend OTP"}
            </Button>
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={otp.length < 6}
            onClick={signYou}
          >
            Verify &amp; sign
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Upload signed complaint ── */}
      <Dialog
        open={modal === "upload"}
        onOpenChange={(open) => {
          if (!open) {
            setUploadError(null);
            closeModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload signed complaint</DialogTitle>
            <DialogDescription>
              Upload the complaint once every party has signed it.
            </DialogDescription>
          </DialogHeader>

          <SectionNotice variant="warning" title="This settles every signature">
            Submitting this copy records{" "}
            <strong className="font-semibold">all {everyone.length} signatures</strong> as
            collected, so upload it only once every party has signed — each complainant,
            and one advocate for each complainant. The file may be signed on paper or with
            a <strong className="font-semibold">Digital Signature Certificate (DSC)</strong>
            .
          </SectionNotice>

          {sign.signedCopy ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-sunken p-4">
              <FileTextIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-compact font-medium">
                  {sign.signedCopy.name}
                </p>
                <p className="text-caption text-muted-foreground tabular-nums">
                  {sign.signedCopy.ext}
                  {formatBytes(sign.signedCopy.size)
                    ? ` · ${formatBytes(sign.signedCopy.size)}`
                    : ""}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={chooseSignedCopy}>
                Replace
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={chooseSignedCopy}
              className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-input p-6 text-center outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <UploadIcon className="size-8 text-muted-foreground" aria-hidden />
              <span className="text-body-compact text-muted-foreground">
                Choose the signed file from{" "}
                <span className="font-medium text-primary underline underline-offset-2">
                  my files
                </span>
              </span>
            </button>
          )}

          {uploadError ? (
            <SectionNotice
              variant="destructive"
              announce="assertive"
              title="That file wasn’t added"
            >
              {uploadError}
            </SectionNotice>
          ) : null}

          <p className="text-body-compact text-muted-foreground">
            Upload .jpg, .png, .jpeg, .webp or .pdf. Maximum upload size of 15 MB.
          </p>
          <p className="flex flex-wrap items-center gap-1 text-body-compact">
            Need the unsigned document to sign on paper?
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 underline"
              onClick={printFile}
            >
              Print or save as PDF
            </Button>
          </p>

          <DialogFooter>
            <Button type="button" disabled={!sign.signedCopy} onClick={submitSignedCopy}>
              Submit as fully signed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pay court fees ── */}
      <Dialog open={modal === "payment"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay court fees</DialogTitle>
            <DialogDescription>
              These fees are payable to the court before the complaint is registered.
            </DialogDescription>
          </DialogHeader>

          <Collapsible open={feesOpen} onOpenChange={setFeesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start gap-3 px-2 py-3"
              >
                <span className="text-body font-semibold">Court fees</span>
                {feesOpen ? (
                  <ChevronUpIcon className="text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronDownIcon className="text-muted-foreground" aria-hidden />
                )}
                <Badge variant="warning">Pending</Badge>
                <span className="ml-auto text-title-s font-semibold tabular-nums">
                  {rupees(FEE_TOTAL)}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className="flex flex-col border-t border-hairline">
                {COURT_FEE_LINES.map((line) => (
                  <div
                    key={line.label}
                    className="flex items-center justify-between gap-4 border-b border-hairline px-2 py-3 last:border-b-0"
                  >
                    <dt className="text-body-compact">{line.label}</dt>
                    <dd className="text-body-compact font-medium text-muted-foreground tabular-nums">
                      {rupees(line.amount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CollapsibleContent>
          </Collapsible>

          <p className="text-caption text-muted-foreground">
            Sandbox payment — no money moves.
          </p>

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => setModal("procaddr")}
          >
            Pay online
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Go back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Select process & address ── */}
      <Dialog open={modal === "procaddr"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select process &amp; address</DialogTitle>
            <DialogDescription>
              Choose what the court issues, how it is delivered, and where it goes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-8 overflow-y-auto">
            {/* Process */}
            <FieldSet className="gap-3">
              <FieldLegend className="text-body font-semibold">
                Process to issue
              </FieldLegend>
              {PROCESS_TYPES.map((p) => {
                const id = `process-${p.key}`;
                const checked = sign.processTypes.includes(p.key) || !p.optional;
                return (
                  <Field key={p.key} orientation="horizontal">
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={!p.optional}
                      onCheckedChange={() => toggleProcess(p.key)}
                    />
                    <FieldContent>
                      <Label htmlFor={id} className="text-body-compact font-medium">
                        {p.label}
                      </Label>
                      <FieldDescription className="text-caption">
                        {p.optional
                          ? "Optional — ask for this only if your case needs it"
                          : "Always issued with a new complaint"}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                );
              })}
            </FieldSet>

            {/* Delivery channel */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="delivery-channel" className="text-body font-semibold">
                Delivery channel
              </Label>
              <NativeSelect
                id="delivery-channel"
                className="w-full sm:max-w-xs"
                value={sign.deliveryChannel || DELIVERY_CHANNELS[0]}
                onChange={(e) => setChannel(e.target.value)}
              >
                {DELIVERY_CHANNELS.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Addresses */}
            <FieldSet className="gap-3">
              <FieldLegend className="text-body font-semibold">
                Where process is served
              </FieldLegend>
              {addressOptions.length ? (
                <>
                  {addressOptions.map((option) => {
                    const id = `addr-${option.key.replace(/[^a-zA-Z0-9-]/g, "-")}`;
                    return (
                      <Field key={option.key} orientation="horizontal">
                        <Checkbox
                          id={id}
                          checked={selectedAddresses.includes(option.key)}
                          onCheckedChange={() => toggleAddress(option.key)}
                        />
                        <FieldContent>
                          <Label htmlFor={id} className="text-body-compact font-medium">
                            {option.label}
                          </Label>
                          <FieldDescription className="text-caption">
                            {option.text}
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    );
                  })}
                  <p className="text-caption text-muted-foreground">
                    Process goes to at least one address.
                  </p>
                </>
              ) : (
                <p className="text-body-compact text-muted-foreground">
                  Add the accused’s address in the{" "}
                  <Link
                    href={hrefFor("accused")}
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Accused section
                  </Link>{" "}
                  to choose where process is served.
                </p>
              )}
            </FieldSet>
          </div>

          <DialogFooter>
            <Button type="button" onClick={payNow}>
              Save &amp; next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Processing ── */}
      <Dialog open={modal === "processing"}>
        <DialogContent
          className="sm:max-w-sm"
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Spinner className="size-8 text-primary" />
            <DialogTitle className="text-title-s font-semibold">
              Processing payment…
            </DialogTitle>
            <DialogDescription className="text-body-compact">
              Please don’t close or refresh this window while we confirm your payment.
            </DialogDescription>
            <p className="text-caption text-muted-foreground">
              Sandbox payment — no money moves.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment successful ── */}
      <Dialog open={modal === "success"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <div className="flex flex-col items-center gap-2 bg-success p-6 text-center text-success-foreground">
            <span className="flex size-12 items-center justify-center rounded-full bg-success-foreground text-success">
              <CheckIcon className="size-6" aria-hidden />
            </span>
            <DialogTitle className="text-title-s font-semibold">
              Payment successful
            </DialogTitle>
            <DialogDescription className="text-body-compact text-success-foreground">
              Your case file is complete. This is a sandbox — nothing has been sent to a
              real court.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-sunken p-4">
              <div>
                <p className="text-caption font-medium text-muted-foreground">
                  Case file number
                </p>
                <p className="text-body font-semibold tabular-nums">
                  {sign.caseFileNumber ?? "—"}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={copyLink}>
                <CopyIcon data-icon="inline-start" aria-hidden />
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4 text-body-compact">
              <span className="text-muted-foreground">Amount paid</span>
              <span className="font-semibold text-foreground tabular-nums">
                {rupees(FEE_TOTAL)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-body-compact">
              <span className="text-muted-foreground">Payment reference</span>
              <span className="font-mono text-foreground">{sign.paymentRef ?? "—"}</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link href={FILINGS_HOME}>Back to dashboard</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={printFile}
              >
                <PrinterIcon data-icon="inline-start" aria-hidden />
                Print or save as PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Leaving with signatures on the sheet ── */}
      <ConfirmDialog
        open={leaveTo !== null}
        onOpenChange={(open) => {
          if (!open) setLeaveTo(null);
        }}
        title="Going back voids the signatures"
        description={
          sign.mode === "upload"
            ? "The signed copy you uploaded was signed against this version of the complaint. Editing the case makes it a different document, so the copy is removed and every party has to sign again."
            : `The parties signed this version of the complaint. Editing the case makes it a different document, so ${
                everyone.filter((s) => s.status === "signed").length === 1
                  ? "the signature already collected is"
                  : "the signatures already collected are"
              } discarded and everyone has to sign again.`
        }
        confirmLabel="Go back and re-sign"
        cancelLabel="Stay here"
        onConfirm={confirmLeave}
      />
    </>
  );
}
