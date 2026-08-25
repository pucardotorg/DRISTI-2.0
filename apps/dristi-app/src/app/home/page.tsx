"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { HomeScreen } from "@/components/home/home-screen";
import type { Locale } from "@/lib/onboarding/content";

/**
 * `/home` — the signed-in litigant home.
 *
 * Query params carry the demo context across the auth boundary:
 *   `token`    — the summons token; its presence arms the auto join-modal.
 *   `nocase=1` — token present but no case behind it (expired / not yet in CIS).
 *   `noid=1`   — registration finished without an ID upload; shows the reminder.
 *   `profile=missing` — registration finished with an incomplete address profile.
 *   `lang=ml`  — locale continuity from the sign-in screen.
 */
function HomePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const lang = searchParams.get("lang");

  return (
    <HomeScreen
      summoned={Boolean(token)}
      hasCase={searchParams.get("nocase") !== "1"}
      idSkipped={searchParams.get("noid") === "1"}
      profileIncomplete={searchParams.get("profile") === "missing"}
      openManualJoin={searchParams.get("join") === "manual"}
      initialLocale={lang === "ml" ? ("ml" as Locale) : "en"}
    />
  );
}

export default function Page() {
  return (
    <React.Suspense>
      <HomePage />
    </React.Suspense>
  );
}
