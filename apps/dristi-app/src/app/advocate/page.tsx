"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { AdvocateScreen } from "@/components/advocate/advocate-screen";
import type { Locale } from "@/lib/onboarding/content";

/**
 * `/advocate` — the signed-in advocate portal.
 *
 * Query params carry the demo context across the auth boundary, mirroring `/home`:
 *   `token`    — the summons token; its presence arms the auto join-modal.
 *   `nocase=1` — token present but no case behind it (expired / not yet in CIS).
 *   `lang=ml`  — locale continuity from the sign-in screen.
 *
 * The same summons URL serves the accused and their advocate — the QR cannot know
 * who scanned it. Sign-in resolves the role: a litigant number lands on `/home`,
 * an advocate number lands here.
 */
function AdvocatePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const lang = searchParams.get("lang");

  return (
    <AdvocateScreen
      summoned={Boolean(token)}
      hasCase={searchParams.get("nocase") !== "1"}
      initialLocale={lang === "ml" ? ("ml" as Locale) : "en"}
    />
  );
}

export default function Page() {
  return (
    <React.Suspense>
      <AdvocatePage />
    </React.Suspense>
  );
}
