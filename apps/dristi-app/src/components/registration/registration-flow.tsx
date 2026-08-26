"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon, FileTextIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DescriptionDetails, DescriptionList, DescriptionRow, DescriptionTerm } from "@/components/ui/description-list";
import { DocumentPreviewDialog, DocumentRowValue, DocumentThumbnailButton, useObjectUrl } from "@/components/document-preview";
import { DocumentSlot } from "@/components/ui/document-slot";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stepper, StepperItem } from "@/components/ui/stepper";
import { pick, type Locale } from "@/lib/onboarding/content";
import {
  applicationView,
  approvalStep,
  contactStep,
  journeySteps,
  nameStep,
  registrationUi,
  roleStep,
  successStep,
  termsStep,
  verificationSteps,
  verificationUi,
} from "@/lib/registration/content";
import { cn } from "@/lib/utils";

type Step = "role" | "name" | "contact" | "verification" | "terms" | "success" | "application";
type AccountRole = "litigant" | "advocate" | "advocateClerk" | "poa" | "";
const DIGITS = /\D/g;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Which roles the court must approve before the account works. */
const NEEDS_VERIFICATION = new Set<AccountRole>(["advocate", "advocateClerk"]);

function applicationId(role: AccountRole) {
  const serial = String(Math.floor(Math.random() * 900000) + 100000);
  return `KL-${role === "advocateClerk" ? "CLERK" : "ADV"}-${serial}-${new Date().getFullYear()}`;
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-title text-balance font-semibold">{title}</h1>
      <p className="text-body text-pretty text-muted-foreground">{body}</p>
    </div>
  );
}

function Actions({ locale, onBack, submitLabel }: { locale: Locale; onBack: () => void; submitLabel?: string }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden />
        {pick(registrationUi.back, locale)}
      </Button>
      <Button type="submit" className="sm:min-w-40">{submitLabel ?? pick(registrationUi.continue, locale)}</Button>
    </div>
  );
}

export function RegistrationFlow({ locale, summoned, initialMobile = "", onFinish }: {
  locale: Locale;
  summoned: boolean;
  initialMobile?: string;
  onFinish?: (result: { idSkipped: boolean; profileIncomplete: boolean }) => void;
}) {
  const [step, setStep] = React.useState<Step>("role");
  const [role, setRole] = React.useState<AccountRole>("");
  const [firstName, setFirstName] = React.useState("");
  const [middleName, setMiddleName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [mobile, setMobile] = React.useState(initialMobile);
  const [email, setEmail] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [destinationNotice, setDestinationNotice] = React.useState(false);

  // Contact-step OTP. Anyone can type anyone's number, so the number is proven here —
  // code requested, verified on the same screen — before Continue means anything.
  const [otpRequested, setOtpRequested] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [otpTouched, setOtpTouched] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);

  // Advocate / clerk verification.
  const [regNumber, setRegNumber] = React.useState("");
  const [idFile, setIdFile] = React.useState<File | null>(null);
  const [idPreviewOpen, setIdPreviewOpen] = React.useState(false);
  const [appId, setAppId] = React.useState("");
  const idFileInputRef = React.useRef<HTMLInputElement>(null);
  const idFileUrl = useObjectUrl(idFile);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const needsVerification = NEEDS_VERIFICATION.has(role);
  const verification = role === "advocateClerk" ? verificationSteps.advocateClerk : verificationSteps.advocate;

  const journeyKeys: readonly (keyof typeof journeySteps)[] = needsVerification
    ? ["role", "name", "contact", "verification", "terms"]
    : ["role", "name", "contact", "terms"];
  const journeyIndex = Math.max(0, journeyKeys.indexOf(step as keyof typeof journeySteps));

  function resetOtp() {
    setOtpRequested(false);
    setOtpCode("");
    setOtpVerified(false);
    setOtpTouched(false);
    setResendIn(0);
  }

  if (step === "success") {
    if (needsVerification) {
      return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-warning-muted text-warning-muted-foreground">
            <ClockIcon className="size-7" aria-hidden />
          </span>
          <Heading title={pick(approvalStep.title, locale)} body={pick(approvalStep.body, locale).replace("{id}", appId)} />
          <Button size="lg" onClick={() => setStep("application")}>{pick(approvalStep.action, locale)}</Button>
        </div>
      );
    }
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-muted text-success-muted-foreground">
          <CheckCircle2Icon className="size-7" aria-hidden />
        </span>
        <Heading title={pick(successStep.title, locale)} body={pick(successStep.body, locale)} />
        <Button size="lg" onClick={() => onFinish ? onFinish({ idSkipped: true, profileIncomplete: true }) : setDestinationNotice(true)}>
          {pick(summoned ? successStep.summonedAction : successStep.generalAction, locale)}
        </Button>
        {destinationNotice ? <Alert variant="info" className="text-left"><AlertTitle>Prototype: destination not connected</AlertTitle><AlertDescription>This action will open your portal home.</AlertDescription></Alert> : null}
      </div>
    );
  }

  if (step === "application") {
    const fullName = [firstName, middleName, lastName].filter((part) => part.trim()).join(" ");
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-title text-balance text-center font-semibold">{pick(applicationView.title, locale).replace("{id}", appId)}</h1>
        <DescriptionList className="rounded-lg bg-muted px-4">
          <DescriptionRow><DescriptionTerm>{pick(applicationView.name, locale)}</DescriptionTerm><DescriptionDetails>{fullName}</DescriptionDetails></DescriptionRow>
          <DescriptionRow><DescriptionTerm>{pick(applicationView.mobile, locale)}</DescriptionTerm><DescriptionDetails>+91 {mobile}</DescriptionDetails></DescriptionRow>
          {email ? <DescriptionRow><DescriptionTerm>{pick(applicationView.email, locale)}</DescriptionTerm><DescriptionDetails>{email}</DescriptionDetails></DescriptionRow> : null}
          <DescriptionRow><DescriptionTerm>{pick(applicationView.role, locale)}</DescriptionTerm><DescriptionDetails>{pick(role === "advocateClerk" ? roleStep.advocateClerk : roleStep.advocate, locale)}</DescriptionDetails></DescriptionRow>
          <DescriptionRow><DescriptionTerm>{pick(verification.numberLabel, locale)}</DescriptionTerm><DescriptionDetails>{regNumber}</DescriptionDetails></DescriptionRow>
          {idFile ? <DescriptionRow className="items-center"><DescriptionTerm>{pick(verification.uploadLabel, locale)}</DescriptionTerm><DescriptionDetails><DocumentRowValue file={idFile} locale={locale} /></DescriptionDetails></DescriptionRow> : null}
        </DescriptionList>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 md:gap-10">
      <div className="mx-auto w-full max-w-2xl">
        <Stepper
          className={cn("w-full", "[&_[data-slot=stepper-item]]:items-center", "[&_[data-slot=stepper-item]>div:first-child]:relative [&_[data-slot=stepper-item]>div:first-child]:justify-center", "[&_[data-slot=stepper-connector]]:absolute [&_[data-slot=stepper-connector]]:top-4 [&_[data-slot=stepper-connector]]:left-[calc(50%+1rem)] [&_[data-slot=stepper-connector]]:mx-0 [&_[data-slot=stepper-connector]]:h-px [&_[data-slot=stepper-connector]]:w-[calc(100%-2rem)]", "[&_[data-slot=stepper-item]>div:last-child]:w-full [&_[data-slot=stepper-item]>div:last-child]:pr-0 [&_[data-slot=stepper-item]>div:last-child]:text-center", "max-md:[&_[data-slot=stepper-item]>div:last-child]:hidden")}
          aria-label={pick(registrationUi.stepOf, locale).replace("{current}", String(journeyIndex + 1)).replace("{total}", String(journeyKeys.length))}
        >
          {journeyKeys.map((key, index) => <StepperItem key={key} step={index + 1} title={pick(journeySteps[key].title, locale)} status={index < journeyIndex ? "complete" : index === journeyIndex ? "current" : "upcoming"} />)}
        </Stepper>
      </div>

      <div className="mx-auto w-full max-w-xl">
        {step === "role" ? (
          <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!role) return; setTouched(false); setStep("name"); }}>
            <Heading title={pick(roleStep.title, locale)} body={pick(roleStep.body, locale)} />
            <Field data-invalid={touched && !role}>
              <RadioGroup value={role} onValueChange={(value) => { setRole(value as AccountRole); setTouched(false); }} className="flex flex-col gap-3">
                {(["litigant", "poa", "advocate", "advocateClerk"] as const).map((value) => (
                  <Label key={value} htmlFor={`registration-role-${value}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-brand-muted">
                    <RadioGroupItem id={`registration-role-${value}`} value={value} className="mt-0.5" />
                    <span className="flex flex-col gap-1"><span className="font-medium">{pick(roleStep[value], locale)}</span><span className="text-caption font-normal text-muted-foreground">{pick(roleStep[`${value}Hint`], locale)}</span></span>
                  </Label>
                ))}
              </RadioGroup>
              <FieldError>{touched && !role ? pick(roleStep.required, locale) : null}</FieldError>
            </Field>
            <Button type="submit">{pick(registrationUi.continue, locale)}</Button>
          </form>
        ) : null}

        {step === "name" ? (
          <form className="flex flex-col gap-6" noValidate onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!firstName.trim()) return; setTouched(false); setStep("contact"); }}>
            <Heading title={pick(nameStep.title, locale)} body={pick(nameStep.body, locale)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={touched && !firstName.trim()} className="sm:col-span-2"><FieldLabel>{pick(nameStep.firstName, locale)} <span className="text-destructive">*</span></FieldLabel><Input value={firstName} autoComplete="given-name" onChange={(event) => { setFirstName(event.target.value); setTouched(false); }} /><FieldError>{touched && !firstName.trim() ? pick(nameStep.error, locale) : null}</FieldError></Field>
              <Field><FieldLabel>{pick(nameStep.middleName, locale)}</FieldLabel><Input value={middleName} autoComplete="additional-name" onChange={(event) => setMiddleName(event.target.value)} /></Field>
              <Field><FieldLabel>{pick(nameStep.lastName, locale)}</FieldLabel><Input value={lastName} autoComplete="family-name" onChange={(event) => setLastName(event.target.value)} /></Field>
            </div>
            <Actions locale={locale} onBack={() => { setTouched(false); setStep("role"); }} />
          </form>
        ) : null}

        {step === "contact" ? (
          <form className="flex flex-col gap-6" noValidate onSubmit={(event) => { event.preventDefault(); setTouched(true); if (mobile.length !== 10 || !otpVerified || (email && !EMAIL.test(email))) return; setTouched(false); setStep(needsVerification ? "verification" : "terms"); }}>
            <Heading title={pick(contactStep.title, locale)} body={pick(contactStep.body, locale)} />
            <Field data-invalid={touched && (mobile.length !== 10 || !otpVerified)}>
              <FieldLabel>{pick(contactStep.mobile, locale)} <span className="text-destructive">*</span></FieldLabel>
              <div className="flex gap-2">
                {/* The DS disabled look, minus the 50% dim on the value itself: the number
                    is the one thing being verified against the code, so it stays at full
                    contrast while the frame and addon still read as locked. */}
                <InputGroup className={cn("flex-1", otpRequested && "has-disabled:opacity-100 has-disabled:bg-surface-sunken dark:has-disabled:bg-surface-sunken")}><InputGroupAddon variant="field"><InputGroupText>+91</InputGroupText></InputGroupAddon><InputGroupInput type="tel" inputMode="numeric" maxLength={10} value={mobile} disabled={otpRequested} className={otpRequested ? "disabled:text-foreground disabled:opacity-100 disabled:[-webkit-text-fill-color:currentcolor]" : undefined} placeholder={pick(contactStep.mobilePlaceholder, locale)} onChange={(event) => { setMobile(event.target.value.replace(DIGITS, "").slice(0, 10)); setTouched(false); }} /></InputGroup>
                {!otpRequested ? (
                  <Button type="button" variant="outline" className="shrink-0" disabled={mobile.length !== 10} onClick={() => { setOtpRequested(true); setResendIn(RESEND_SECONDS); setTouched(false); }}>
                    {pick(contactStep.sendOtp, locale)}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" className="shrink-0" onClick={resetOtp}>{pick(contactStep.changeNumber, locale)}</Button>
                )}
              </div>
              {otpVerified ? (
                <p className="flex items-center gap-1.5 text-body-compact text-success"><CheckCircle2Icon className="size-4" aria-hidden />{pick(contactStep.verified, locale)}</p>
              ) : (
                <FieldDescription>{pick(contactStep.mobileHint, locale)}</FieldDescription>
              )}
              <FieldError>{touched && mobile.length !== 10 ? pick(contactStep.mobileError, locale) : touched && !otpVerified ? pick(contactStep.verifyFirst, locale) : null}</FieldError>
            </Field>

            {otpRequested && !otpVerified ? (
              <Field data-invalid={otpTouched && otpCode.length !== OTP_LENGTH} className="rounded-lg bg-surface-sunken p-4">
                <FieldLabel>{pick(contactStep.otpLabel, locale)}</FieldLabel>
                <FieldDescription>{pick(contactStep.otpSent, locale).replace("{number}", mobile)}</FieldDescription>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <InputOTP maxLength={OTP_LENGTH} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(value) => { setOtpCode(value); setOtpTouched(false); }} containerClassName="flex-1">
                    <InputOTPGroup className="w-full">
                      {Array.from({ length: OTP_LENGTH }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-auto flex-1 text-body font-semibold" />)}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button type="button" className="sm:h-12" onClick={() => { setOtpTouched(true); if (otpCode.length !== OTP_LENGTH) return; setOtpVerified(true); setOtpTouched(false); setTouched(false); }}>
                    {pick(contactStep.otpVerify, locale)}
                  </Button>
                </div>
                <FieldError>{otpTouched && otpCode.length !== OTP_LENGTH ? pick(contactStep.otpError, locale) : null}</FieldError>
                {resendIn > 0 ? (
                  <p className="text-body-compact text-muted-foreground">{pick(contactStep.otpResendIn, locale).replace("{seconds}", String(resendIn))}</p>
                ) : (
                  <Button type="button" variant="link" className="self-start p-0" onClick={() => { setResendIn(RESEND_SECONDS); setOtpCode(""); }}>{pick(contactStep.otpResend, locale)}</Button>
                )}
              </Field>
            ) : null}

            <Field data-invalid={touched && Boolean(email) && !EMAIL.test(email)}><FieldLabel>{pick(contactStep.email, locale)}</FieldLabel><Input type="email" value={email} placeholder={pick(contactStep.emailPlaceholder, locale)} onChange={(event) => { setEmail(event.target.value); setTouched(false); }} /><FieldError>{touched && email && !EMAIL.test(email) ? pick(contactStep.emailError, locale) : null}</FieldError></Field>
            <Actions locale={locale} onBack={() => { setTouched(false); setStep("name"); }} />
          </form>
        ) : null}

        {step === "verification" ? (
          <form className="flex flex-col gap-6" noValidate onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!regNumber.trim() || !idFile) return; setTouched(false); setStep("terms"); }}>
            <Heading title={pick(verification.title, locale)} body={pick(verification.body, locale)} />
            <Field data-invalid={touched && !regNumber.trim()}>
              <FieldLabel>{pick(verification.numberLabel, locale)} <span className="text-destructive">*</span></FieldLabel>
              <Input value={regNumber} placeholder={pick(verification.numberPlaceholder, locale)} onChange={(event) => { setRegNumber(event.target.value); setTouched(false); }} />
              <FieldError>{touched && !regNumber.trim() ? pick(verification.numberError, locale) : null}</FieldError>
            </Field>
            <Field data-invalid={touched && !idFile}>
              <FieldLabel>{pick(verification.uploadLabel, locale)} <span className="text-destructive">*</span></FieldLabel>
              <input ref={idFileInputRef} type="file" className="hidden" tabIndex={-1} aria-hidden="true" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(event) => { setIdFile(event.target.files?.[0] ?? null); setTouched(false); }} />
              <DocumentSlot
                status={idFile ? "filled" : "empty"}
                media={idFile && idFileUrl ? "thumbnail" : "icon"}
                label={pick(verification.uploadLabel, locale)}
                required
                filename={idFile?.name}
                thumbnail={idFile && idFileUrl ? (
                  <DocumentThumbnailButton file={idFile} url={idFileUrl} locale={locale} onOpen={() => setIdPreviewOpen(true)} className="size-full" />
                ) : (
                  <FileTextIcon className="size-5" aria-hidden />
                )}
                onChooseFile={() => idFileInputRef.current?.click()}
                copy={{ noFile: pick(verificationUi.noFile, locale), chooseFile: pick(verificationUi.chooseFile, locale) }}
              />
              <div className="flex items-start justify-between gap-4">
                <FieldDescription>{pick(verification.uploadHint, locale)} {pick(verificationUi.fileHelp, locale)}</FieldDescription>
                {idFile ? <Button type="button" variant="link" className="h-auto shrink-0 p-0" onClick={() => idFileInputRef.current?.click()}>{pick(verificationUi.changeFile, locale)}</Button> : null}
              </div>
              <FieldError>{touched && !idFile ? pick(verification.uploadError, locale) : null}</FieldError>
            </Field>
            <DocumentPreviewDialog open={idPreviewOpen} onOpenChange={setIdPreviewOpen} file={idFile} url={idFileUrl} locale={locale} />
            <Actions locale={locale} onBack={() => { setTouched(false); setStep("contact"); }} />
          </form>
        ) : null}

        {step === "terms" ? (
          <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); setTouched(true); if (!termsAccepted) return; if (NEEDS_VERIFICATION.has(role)) setAppId(applicationId(role)); setStep("success"); }}>
            <Heading title={pick(termsStep.title, locale)} body={pick(termsStep.body, locale)} />
            <div className="divide-y divide-border border-y border-border">{termsStep.clauses.map((clause, index) => <div key={index} className="flex gap-3 py-4"><span className="text-body-compact font-semibold text-muted-foreground">{index + 1}.</span><p className="text-body-compact text-muted-foreground">{pick(clause, locale)}</p></div>)}</div>
            <Field data-invalid={touched && !termsAccepted}><div className="flex items-start gap-3 rounded-lg bg-surface-sunken p-4"><Checkbox id="registration-terms" checked={termsAccepted} onCheckedChange={(checked) => { setTermsAccepted(checked === true); setTouched(false); }} /><Label htmlFor="registration-terms" className="cursor-pointer text-body-compact leading-5">{pick(termsStep.accept, locale)}</Label></div><FieldError>{touched && !termsAccepted ? pick(termsStep.error, locale) : null}</FieldError></Field>
            <Actions locale={locale} onBack={() => { setTouched(false); setStep(needsVerification ? "verification" : "contact"); }} submitLabel={pick(termsStep.submit, locale)} />
          </form>
        ) : null}
      </div>
    </div>
  );
}
