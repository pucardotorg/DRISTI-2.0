"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

import { BrandLockup } from "@/components/brand-lockup";
import { RegistrationFlow } from "@/components/registration/registration-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { LOCALES, pick, ui, type Locale } from "@/lib/onboarding/content";
import { registrationUi } from "@/lib/registration/content";
import { cn } from "@/lib/utils";
import {
  brand,
  footer,
  footerNavLabel,
  form,
  help,
  METHOD_ORDER,
  methods,
  otp,
  unregistered,
  type Method,
  type Role,
} from "@/lib/sign-in/content";
import { registeredRole } from "@/lib/sign-in/demo-accounts";

/**
 * The page under the onboarding modal.
 *
 * Three structural decisions, all load-bearing:
 *
 * 1. **The role question moved onto this screen.** It used to be its own step ("Tell us
 *    a bit about yourself"), which cost a full screen to collect one bit. It is a tab
 *    strip now. Role is submitted with every attempt rather than inferred from the
 *    number, because the same person can be a litigant one year and an advocate the
 *    next — so the number alone does not settle it.
 *
 * 2. **Only one segmented control is full width.** Role and sign-in method are both
 *    choices, and two identical strips stacked on top of each other is how people end up
 *    changing the wrong one. Role is the wide strip at the top; method is a small
 *    labelled toggle next to the credential it governs.
 *
 * 3. **The page is a grid, not two stacked flex columns.** The canvas has to run the
 *    full height of the viewport while the footer stays a slim bar under the form
 *    column only; a two-row grid with the canvas spanning both does that directly.
 *
 * 4. **The canvas is desktop-only.** On phones it collapsed into a second page bolted
 *    to the bottom of the first. Its one piece of real content, the explainer, is
 *    re-rendered inline in the form column instead — see `HelpEntry`.
 */

const DIGITS = /\D/g;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;


/**
 * The §138 explainer entry. Rendered twice, and only ever one at a time: on the canvas
 * from `lg` up, and inline in the form column below that. `display:none` takes the
 * hidden one out of the accessibility tree, so there is no duplicate control.
 *
 * The phone version drops the canvas entirely. A gradient plate wrapped around a card
 * wrapped around a button is three container levels for one link, and at 375px it read
 * as a second page bolted to the bottom of the first. A rule and the page's own type
 * says the same thing and costs nothing.
 *
 * The action follows the explanation in a single vertical reading path. The one fact
 * that removes hesitation stays directly under the button.
 */
function HelpEntry({
  locale,
  entry,
  onSeekHelp,
  onCanvas,
}: {
  locale: Locale;
  entry: (typeof help)["summoned"];
  onSeekHelp: () => void;
  onCanvas?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        onCanvas ? "items-start" : "items-center",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2",
          onCanvas ? "items-start text-left" : "items-center text-center",
        )}
      >
        <h3 className="text-body font-semibold text-balance">
          {pick(entry.title, locale)}
        </h3>
        <p
          className={cn(
            "text-body-compact",
            onCanvas ? "text-brand-canvas-muted-foreground" : "text-muted-foreground",
          )}
        >
          {pick(entry.body, locale)}
        </p>
      </div>
      <div className={cn(onCanvas ? "items-start" : "items-center")}>
        <Button
          variant="outline"
          className={cn(
            onCanvas &&
              "border-brand-canvas-muted-foreground bg-transparent text-brand-canvas-foreground data-[variant=outline]:hover:bg-brand-canvas data-[variant=outline]:hover:text-brand-canvas-foreground dark:bg-transparent dark:data-[variant=outline]:hover:bg-brand-canvas dark:data-[variant=outline]:hover:text-brand-canvas-foreground",
          )}
          onClick={onSeekHelp}
        >
          {pick(entry.action, locale)}
          <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export function SignInBlock({
  locale,
  onLocaleChange,
  onSeekHelp,
  onRegister,
  onSignedIn,
  onRegistered,
  summoned = false,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onSeekHelp: () => void;
  onRegister?: () => void;
  /** Called when credentials are accepted, with the role the number is registered
   *  under — the caller routes litigants and advocates to different portals. Without
   *  it, the prototype notice shows. */
  onSignedIn?: (role: Role) => void;
  /** Called from the registration success action, carrying whether the ID upload was
   *  deferred. Without it, registration shows its own prototype notice. */
  onRegistered?: (result: {
    idSkipped: boolean;
    profileIncomplete: boolean;
  }) => void;
  /** True when a summons token brought them here, so the explainer can name the summons
   *  outright. Everyone else gets the neutral headline — same destination either way. */
  summoned?: boolean;
}) {
  const [registrationOpen, setRegistrationOpen] = React.useState(false);
  const [step, setStep] = React.useState<"credentials" | "code">("credentials");
  const [method, setMethod] = React.useState<Method>("password");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [revealed, setRevealed] = React.useState(false);
  const [notRegistered, setNotRegistered] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);
  // Which fields failed, not what the failure reads as. Storing the resolved sentence
  // would freeze it in whichever language was selected when the person pressed submit,
  // and this screen is switched between languages mid-form all the time.
  const [touched, setTouched] = React.useState(false);

  const methodLabelId = React.useId();

  const badMobile = touched && mobile.length !== 10;
  const badPassword = touched && method === "password" && !password;
  const badCode = touched && code.length !== OTP_LENGTH;

  // Any change to what is being submitted invalidates the last answer. A stale "this
  // number is registered as an advocate" sitting above a number someone has already
  // started correcting is how people conclude the site is broken.
  const invalidate = React.useCallback(() => {
    setTouched(false);
    setNotRegistered(false);
    setAccepted(false);
  }, []);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (mobile.length !== 10) return;
    if (method === "password" && !password) return;

    const registered = registeredRole(mobile);
    if (!registered) {
      setNotRegistered(true);
      return;
    }
    setNotRegistered(false);

    if (method === "otp") {
      setStep("code");
      setTouched(false);
      setResendIn(RESEND_SECONDS);
      return;
    }
    if (onSignedIn) {
      onSignedIn(registered);
      return;
    }
    setAccepted(true);
  }

  function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (code.length !== OTP_LENGTH) return;
    if (onSignedIn) {
      // The credentials step verified this number is registered before sending a code.
      onSignedIn(registeredRole(mobile) ?? "litigant");
      return;
    }
    setAccepted(true);
  }

  function changeNumber() {
    setStep("credentials");
    setCode("");
    setResendIn(0);
    invalidate();
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 grid-rows-[1fr_auto] lg:h-dvh lg:min-h-0 lg:grid-cols-[4fr_5fr] lg:overflow-hidden">
      {/* Brand canvas — desktop only. The gradient is mode-invariant by design; see the
          CHANGELOG note on the brand-canvas tokens. */}
      <aside className="hidden bg-linear-160 from-brand-canvas to-brand-canvas-deep px-12 pt-10 pb-12 text-brand-canvas-foreground lg:flex lg:flex-col lg:row-span-2">
        <BrandLockup onDark className="h-14" />

        {/* Rule, not card. The explainer is a second thought under the promise, not a
            competing offer beside it. The 40px rhythm on either side makes that
            separation unambiguous without splitting the panel into boxes.
            `flex-1` + centred keeps the promise vertically centred in the panel with
            the mark pinned at the top. */}
        <div className="flex flex-1 flex-col justify-center gap-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-display-s text-balance font-semibold">
              {pick(brand.headline, locale)}
            </h2>
            <p className="text-body text-brand-canvas-muted-foreground">
              {pick(brand.subline, locale)}
            </p>
          </div>

          {/* This panel stays dark in both modes, so the global `hairline` token is not
              suitable: it becomes a black tint in light mode. The canvas's own muted
              foreground is the correct on-canvas token; reducing its opacity makes the
              rule quieter than body copy while keeping it visibly lighter than the
              background. */}
          {summoned ? (
            <>
              <Separator className="bg-brand-canvas-muted-foreground/40" />
              <HelpEntry
                locale={locale}
                entry={help.summoned}
                onSeekHelp={onSeekHelp}
                onCanvas
              />
            </>
          ) : null}
        </div>
      </aside>

      {/* Form column. */}
      <div className="relative flex flex-col lg:col-start-2 lg:min-h-0">
        {/* The compact secondary toggle lets the phone header stay on one row without
            sacrificing the 40px touch-target floor. The court subline already drops
            below `sm`, leaving the full lockup in the desktop canvas. */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-hairline bg-background px-6 py-5 lg:absolute lg:inset-x-0 lg:top-0 lg:border-b-0 lg:px-12 lg:pt-10 lg:pb-0">
          {registrationOpen ? (
            <Button
              type="button"
              variant="ghost"
              className="-ml-2 lg:ml-0"
              onClick={() => setRegistrationOpen(false)}
            >
              <ArrowLeftIcon data-icon="inline-start" aria-hidden />
              {pick(registrationUi.backToSignIn, locale)}
            </Button>
          ) : (
            <BrandLockup className="h-8 lg:hidden" />
          )}

          {/* Two locales, so a segmented toggle beats a dropdown: it costs one tap
              instead of two, and — the reason it matters here — it shows മലയാളം in its
              own script, findable by someone who cannot read the word "Language". */}
          <SegmentedControl size="compact"
            className="lg:ml-auto"
            type="single"
            value={locale}
            onValueChange={(value) => value && onLocaleChange(value as Locale)}
            aria-label={pick(ui.language, locale)}
          >
            {LOCALES.map((l) => (
              <SegmentedControlItem
                key={l.value}
                value={l.value}
              >
                {l.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </header>

        <main
          className={cn(
            "flex flex-1 items-start justify-center overflow-y-auto px-6 pb-10 lg:min-h-0 lg:px-12",
            registrationOpen
              ? "pt-4 md:pt-8 lg:pt-32 lg:pb-12"
              : "pt-8 lg:items-center lg:py-12",
          )}
        >
          {registrationOpen ? (
            <RegistrationFlow
              locale={locale}
              summoned={summoned}
              initialMobile={mobile}
              onFinish={onRegistered}
            />
          ) : (
          <div className="mx-auto flex w-full max-w-100 flex-col gap-6 lg:-translate-y-2">
            {step === "credentials" ? (
              <>
                {/* One token down the scale on phones — `title-s` and `body-compact`.
                    Type steps; controls do not, because 40px is the touch-target floor
                    and shrinking a field to buy air is how a form becomes unusable in
                    exactly the hands that need it most. */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-title-s text-balance font-semibold sm:text-title">
                    {pick(form.title, locale)}
                  </h1>
                  <p className="text-body-compact text-muted-foreground sm:text-body">
                    {pick(form.subtitle, locale)}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <form
                    onSubmit={submitCredentials}
                    noValidate
                    aria-label={pick(form.title, locale)}
                    className="flex flex-col gap-4"
                  >
                    {notRegistered ? (
                      <Alert variant="info">
                        <AlertTitle>{pick(unregistered.title, locale)}</AlertTitle>
                        <AlertDescription className="flex flex-col items-start gap-2">
                          {pick(unregistered.body, locale)}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRegistrationOpen(true);
                              onRegister?.();
                            }}
                          >
                            {pick(unregistered.action, locale)}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <Field data-invalid={badMobile}>
                      <FieldLabel>{pick(form.mobileLabel, locale)}</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>+91</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          placeholder={pick(form.mobilePlaceholder, locale)}
                          value={mobile}
                          onChange={(event) => {
                            setMobile(
                              event.target.value.replace(DIGITS, "").slice(0, 10),
                            );
                            invalidate();
                          }}
                        />
                      </InputGroup>
                      <FieldError>
                        {badMobile ? pick(form.mobileError, locale) : null}
                      </FieldError>
                    </Field>

                    {/* Directly under the number, because the number is the one thing
                        both methods share: you give it, then you say how you will prove
                        it is yours. Both options stay visible — recall is the wrong
                        thing to ask of someone who signs in twice a year. */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        id={methodLabelId}
                        className="text-body-compact font-medium"
                      >
                        {pick(form.methodLegend, locale)}
                      </span>
                      <SegmentedControl size="compact"
                        type="single"
                        value={method}
                        onValueChange={(value) => {
                          if (!value) return;
                          setMethod(value as Method);
                          invalidate();
                        }}
                        aria-labelledby={methodLabelId}
                      >
                        {METHOD_ORDER.map((m) => (
                          <SegmentedControlItem
                            key={m}
                            value={m}
                          >
                            {pick(methods[m], locale)}
                          </SegmentedControlItem>
                        ))}
                      </SegmentedControl>
                    </div>

                    {method === "password" ? (
                      <Field data-invalid={badPassword}>
                        <div className="flex items-center justify-between gap-4">
                          <FieldLabel>
                            {pick(form.passwordLabel, locale)}
                          </FieldLabel>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                          >
                            {pick(form.forgot, locale)}
                          </Button>
                        </div>
                        <InputGroup>
                          <InputGroupInput
                            type={revealed ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder={pick(form.passwordPlaceholder, locale)}
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              invalidate();
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              size="icon-sm"
                              aria-label={pick(
                                revealed
                                  ? form.passwordHide
                                  : form.passwordShow,
                                locale,
                              )}
                              aria-pressed={revealed}
                              onClick={() => setRevealed((value) => !value)}
                            >
                              {revealed ? (
                                <EyeOffIcon aria-hidden />
                              ) : (
                                <EyeIcon aria-hidden />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldError>
                          {badPassword ? pick(form.passwordError, locale) : null}
                        </FieldError>
                      </Field>
                    ) : null}

                    {/* The hint belongs to the button, not to the field above it. Left
                        in the form's own rhythm it sat equidistant between the two and
                        read as a caption on the wrong element. */}
                    <div className="flex flex-col gap-2">
                      {method === "otp" ? (
                        <FieldDescription>
                          {pick(form.otpHint, locale)}
                        </FieldDescription>
                      ) : null}
                      <Button type="submit" size="lg" className="w-full">
                        {pick(
                          method === "password"
                            ? form.submitPassword
                            : form.submitOtp,
                          locale,
                        )}
                      </Button>
                    </div>

                    <PrototypeNotice
                      show={accepted}
                      mobile={mobile}
                      method={method}
                    />
                  </form>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-body-compact text-muted-foreground">
                    {pick(form.registerPrompt, locale)}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => {
                        setRegistrationOpen(true);
                        onRegister?.();
                      }}
                    >
                      {pick(form.registerAction, locale)}
                    </Button>
                  </div>
                </div>

                {/* The phone half of the explainer. Same content, page type, a rule
                    instead of a gradient plate. Only one of the two is ever in the
                    accessibility tree — the other is `display:none`. */}
                {summoned ? (
                  <div className="mt-2 flex flex-col gap-10 lg:hidden">
                    <Separator />
                    <HelpEntry
                      locale={locale}
                      entry={help.summoned}
                      onSeekHelp={onSeekHelp}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-title text-balance font-semibold">
                    {pick(otp.title, locale)}
                  </h1>
                  {/* The number is shown, not assumed. Someone who mistyped a digit two
                      taps ago finds out here rather than after the code never arrives. */}
                  <p className="text-body text-muted-foreground">
                    {pick(otp.subtitle, locale).replace("{number}", mobile)}
                  </p>
                </div>

                <form
                  onSubmit={submitCode}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  <Field data-invalid={badCode}>
                    <FieldLabel>{pick(otp.label, locale)}</FieldLabel>
                    <InputOTP
                      maxLength={OTP_LENGTH}
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        setTouched(false);
                        setAccepted(false);
                      }}
                    >
                      {/* The system ships slots at 32px — under its own 40×40 floor,
                          and a third narrower than every other control on the page.
                          Widened to fill and matched to the tab strip's height. */}
                      <InputOTPGroup className="w-full">
                        {Array.from({ length: OTP_LENGTH }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="h-12 w-auto flex-1 text-body font-semibold"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldError>
                      {badCode ? pick(otp.error, locale) : null}
                    </FieldError>
                  </Field>

                  <Button type="submit" size="lg" className="w-full">
                    {pick(otp.verify, locale)}
                  </Button>

                  <PrototypeNotice
                    show={accepted}
                    mobile={mobile}
                    method={method}
                  />

                  <div className="flex flex-col items-center gap-2">
                    {resendIn > 0 ? (
                      <p className="text-body-compact text-muted-foreground">
                        {pick(otp.resendIn, locale).replace(
                          "{seconds}",
                          String(resendIn),
                        )}
                      </p>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setResendIn(RESEND_SECONDS)}
                      >
                        {pick(otp.resend, locale)}
                      </Button>
                    )}
                    <Button type="button" variant="ghost" onClick={changeNumber}>
                      <ArrowLeftIcon data-icon="inline-start" aria-hidden />
                      {pick(otp.changeNumber, locale)}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
          )}
        </main>
      </div>

      {/* One line: who runs it, then the policies, dot-separated. The separators are
          decorative, so they stay out of the accessibility tree. */}
      <footer
        aria-label={pick(footerNavLabel, locale)}
        className="flex flex-wrap items-center justify-center gap-x-2 border-t border-border px-6 py-2 text-caption text-muted-foreground lg:col-start-2 lg:px-12"
      >
        {footer.map((item, index) => (
          // Separator and link stay in one flex item so a wrap never strands a dot at
          // the end of a line — which is exactly what happens at 375px.
          <span key={item.href} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden>·</span> : null}
            <Button
              variant="link"
              asChild
              className="h-10 px-0 text-caption text-muted-foreground"
            >
              <a href={item.href}>{pick(item.label, locale)}</a>
            </Button>
          </span>
        ))}
      </footer>
    </div>
  );
}

/**
 * Scaffolding, not product copy — deliberately English-only and labelled, so it cannot
 * be mistaken for a real screen. Delete with `demo-accounts.ts` when the credentials
 * endpoint lands. It exists because the payload is the whole point of the role tabs.
 */
function PrototypeNotice({
  show,
  mobile,
  method,
}: {
  show: boolean;
  mobile: string;
  method: Method;
}) {
  if (!show) return null;
  return (
    <Alert variant="info">
      <AlertTitle>Prototype: no next screen yet</AlertTitle>
      <AlertDescription>
        {`Would sign in +91 ${mobile}, verified by ${method === "password" ? "password" : "one-time code"}.`}
      </AlertDescription>
    </Alert>
  );
}
