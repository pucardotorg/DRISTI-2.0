"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { SignInBlock } from "@/components/sign-in-block";
import type { CaseSummary, Locale } from "@/lib/onboarding/content";

/**
 * `/join/<token>` — the summons URL.
 * `/join`         — reached any other way. No token, so no modal on load.
 *
 * The modal opens 1s after landing and only when a token is present, per the Jul 31
 * decision: someone who found the site through search goes straight to sign-in.
 */

/** Stand-in for the pre-registration summary endpoint. Summary only — the complaint
 *  and annexures stay behind sign-in, because a summons link travels on WhatsApp. */
const DEMO_CASE: CaseSummary = {
  accusedName: "Rajan Krishnan Nair",
  caseNumber: "CC 847 / 2026",
  cnr: "KL-0423-CC-0847-2026",
  court: "Court of the Judicial First Class Magistrate I, Kollam · Court No. 3",
  courtAddress: "Civil Station, Vidya Nagar, Kollam 691 013, Kerala",
  hearingDate: "Friday, 18 September 2026, 10:30 AM",
  complainant: "South Indian Bank Ltd.",
  chequeAmount: "₹1,85,000",
  chequeNumber: "004512",
};

function JoinFlow() {
  const params = useParams<{ token?: string[] }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params?.token?.[0];

  const [locale, setLocale] = React.useState<Locale>("en");
  const [open, setOpen] = React.useState(false);

  // Auth succeeded — cross to the signed-in portal, carrying the summons token (it
  // arms the auto join-modal there), the no-case flag, the deferred-ID flag, and the
  // locale. The summons URL cannot tell the accused from their advocate — the same QR
  // serves both — so the destination is decided by the role the number is registered
  // under: litigants land on /home, advocates on /advocate.
  const goHome = React.useCallback(
    (options?: {
      idSkipped?: boolean;
      profileIncomplete?: boolean;
      role?: "litigant" | "advocate";
    }) => {
      const advocate = options?.role === "advocate";
      const query = new URLSearchParams();
      if (token) query.set("token", token);
      if (token && searchParams.get("nocase") === "1") query.set("nocase", "1");
      if (!advocate && options?.idSkipped) query.set("noid", "1");
      if (!advocate && options?.profileIncomplete) query.set("profile", "missing");
      if (locale !== "en") query.set("lang", locale);
      const qs = query.toString();
      router.push(`${advocate ? "/advocate" : "/home"}${qs ? `?${qs}` : ""}`);
    },
    [token, searchParams, locale, router],
  );

  // `?nocase=1` exercises the no-data path — the flow must stay usable when the token
  // is expired or the case is not yet in CIS. Derived, never held in state, so there is
  // no render where the summary is silently wrong.
  const caseSummary = React.useMemo(() => {
    if (!token) return undefined;
    return searchParams.get("nocase") === "1" ? undefined : DEMO_CASE;
  }, [token, searchParams]);

  // Keep the document language honest — screen readers pick the voice from it, and the
  // Malayalam copy read out in an English voice is worse than no audio at all.
  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  React.useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => setOpen(true), 1000);
    return () => window.clearTimeout(timer);
  }, [token]);

  return (
    <>
      <SignInBlock
        locale={locale}
        onLocaleChange={setLocale}
        onSeekHelp={() => setOpen(true)}
        onSignedIn={(role) => goHome({ role })}
        onRegistered={(result) => goHome(result)}
        // The token is the only thing that tells us this person was served. It changes
        // the explainer's headline, never its availability: the modal is one tap away
        // for everyone, and it runs on fallbacks when there is no case to show.
        summoned={Boolean(token)}
      />
      <OnboardingModal
        open={open}
        onOpenChange={setOpen}
        caseSummary={caseSummary}
        locale={locale}
        onLocaleChange={setLocale}
      />
    </>
  );
}

export function JoinPage() {
  return (
    <React.Suspense>
      <JoinFlow />
    </React.Suspense>
  );
}
