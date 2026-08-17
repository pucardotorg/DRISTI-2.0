"use client";

/**
 * Sign the complaint — signatures on the left, the document in the middle, the signing
 * actions on the right (stacked above the document below `xl`, so they are never hidden).
 *
 * The paying half of the flow lives here too: fees → process and address → payment →
 * the case file number. The document itself is the shared court sheet Preview renders.
 *
 * Signing and payment are the one part of this flow with no real system behind them yet.
 * They are wired to the draft (who signed, in what mode, what was chosen, what was
 * "paid") and every screen that stands in for a real service says so in place.
 */

import * as React from "react";
import Link from "next/link";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  FileTextIcon,
  InfoIcon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FilingFooter } from "@/components/filing/filing-footer";
import { FilingPageHeader } from "@/components/filing/filing-page-header";
import { PANEL_CLASS } from "@/components/filing/form-card";
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

  const [modal, setModal] = React.useState<ModalKey>(null);
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
  // The same person can be both a complainant and the advocate — one signature covers
  // every capacity they sign in.
  const yous = [...complainants, ...advocates].filter((s) => s.you);
  const you = yous[0] ?? null;
  const youSigned = yous.length > 0 && yous.every((s) => s.status === "signed");

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

  const signYou = (mode: "esign" | "upload") => {
    if (yous.length === 0) return;
    update((d) => {
      for (const s of yous) d.sign.signed[s.id] = true;
      d.sign.mode = mode;
    });
    setOtp("");
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
   * What the rail carries once the filing is done — the record, not the actions.
   * `wellClass` is the record block's fill: white on the tinted rail, sunken inside the
   * white card it stacks into below `xl`, so it reads as one layer in from its parent.
   */
  const filedRecord = (wellClass: string) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Filed</h2>
        <p className="text-body-compact text-muted-foreground">
          This complaint has been submitted and paid for.
        </p>
      </div>

      <dl className={cn("flex flex-col gap-3 rounded-lg p-4", wellClass)}>
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

  /** "Add your signature" — the rail on `xl`, stacked above the document below it. */
  const signActions = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Add your signature</h2>
        {you ? (
          <p className="text-body-compact text-muted-foreground">
            Signing as <strong className="font-semibold text-foreground">{you.name}</strong>{" "}
            ({you.role}).
          </p>
        ) : (
          <p className="text-body-compact text-muted-foreground">
            Add a complainant or an advocate before signing.
          </p>
        )}
      </div>

      {youSigned ? (
        <SectionNotice variant="success" title="You have signed">
          Your signature is recorded. The other parties still have to sign before the
          complaint can be filed.
        </SectionNotice>
      ) : (
        <>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!you}
            onClick={() => {
              setOtp("");
              setModal("esign");
            }}
          >
            <SignatureIcon data-icon="inline-start" aria-hidden />
            E-Sign with Aadhaar OTP
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="w-full" disabled={!you}>
                Sign another way
                <ChevronDownIcon data-icon="inline-end" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setModal("upload")}>
                <UploadIcon aria-hidden />
                Upload signed copy
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModal("choose")}>
                <InfoIcon aria-hidden />
                Choose mode of signing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <SectionNotice>
        All parties must sign using the{" "}
        <strong className="font-semibold text-foreground">same mode</strong>. E-Sign
        requires each signatory’s Aadhaar-linked mobile number.
      </SectionNotice>
    </div>
  );

  const railContent = filed ? filedRecord("bg-card") : signActions;
  const stackedContent = filed ? filedRecord("bg-surface-sunken") : signActions;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col">
      {input}
      <div className="flex flex-1 items-start">
        {/* Signatures */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-80 shrink-0 overflow-y-auto border-r border-hairline bg-sidebar p-6 lg:block">
          <SignatureSummary complainants={complainants} advocates={advocates} />
        </aside>

        {/* The document */}
        <main className="min-w-0 flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col gap-6">
            <FilingPageHeader
              title={filed ? "Complaint filed" : "Sign the complaint"}
              description={
                filed
                  ? `Filed in the ${COURT.name} under S-138, Negotiable Instruments Act.`
                  : `You are filing a criminal complaint under S-138, Negotiable Instruments Act in the ${COURT.name}.`
              }
              actions={
                <Button type="button" variant="outline" size="sm" onClick={printFile}>
                  <PrinterIcon data-icon="inline-start" aria-hidden />
                  Print or save as PDF
                </Button>
              }
            />

            {/* Below xl the rails collapse into the column, actions first. */}
            <div className="flex flex-col gap-6 xl:hidden">
              <Card className={cn(PANEL_CLASS, "lg:hidden")}>
                <CardContent>
                  <SignatureSummary complainants={complainants} advocates={advocates} />
                </CardContent>
              </Card>
              <Card className={PANEL_CLASS}>
                <CardContent>{stackedContent}</CardContent>
              </Card>
            </div>

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
          </div>
        </main>

        {/* Add your signature — or, once filed, the record of the filing. */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-l border-hairline bg-sidebar p-6 xl:block">
          {railContent}
        </aside>
      </div>

      {filed ? (
        <FilingFooter
          backHref={hrefFor("preview")}
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
          backHref={prev ? hrefFor(prev) : hrefFor("preview")}
          continueLabel="Continue to pay fees"
          continueVariant={youSigned ? "default" : "outline"}
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

      {/* ── Choose mode of signing ── */}
      <Dialog open={modal === "choose"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose mode of signing</DialogTitle>
            <DialogDescription>
              All parties must use the same mode of signing.
            </DialogDescription>
          </DialogHeader>
          <p className="text-body-compact">
            If E-Sign is selected, all parties must sign using their{" "}
            <strong className="font-semibold">Aadhaar-linked mobile number</strong>.
          </p>
          <p className="flex flex-wrap items-center gap-1 text-body-compact">
            Need the complaint to sign on paper?
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
            <Button type="button" variant="outline" onClick={() => setModal("upload")}>
              Upload signed copy
            </Button>
            <Button
              type="button"
              onClick={() => {
                setOtp("");
                setModal("esign");
              }}
            >
              E-Sign
            </Button>
          </DialogFooter>
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

          <SectionNotice>
            Each other party will need to sign too.
          </SectionNotice>

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
            onClick={() => signYou("esign")}
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

          <SectionNotice title="Please note">
            Please ensure you have collected the signatures of all parties (
            <strong className="font-semibold">
              all complainants and an advocate for each complainant must sign the case
            </strong>
            ). You can upload a file signed physically or with a{" "}
            <strong className="font-semibold">
              Digital Signature Certificate (DSC)
            </strong>
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
            <SectionNotice variant="warning">{uploadError}</SectionNotice>
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
            <Button
              type="button"
              disabled={!sign.signedCopy}
              onClick={() => signYou("upload")}
            >
              Submit
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
    </div>
  );
}
