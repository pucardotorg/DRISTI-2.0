"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";

/**
 * `/citizen` — the citizen namespace: everyone outside the court (advocates, clerks,
 * litigants, party-in-person, PoA-holders).
 *
 * TEMPORARY. The citizen product already exists — the advocate/litigant sign-in and
 * screens are live at `/join` and the routes around it — and that work is not being
 * moved yet so as not to disrupt it. Until it is relocated under `/citizen`, this door
 * simply forwards to the sign-in that already exists.
 *
 * When the citizen screens move here, replace this redirect with the real citizen home.
 * The landing page (`/`) already links to `/citizen`, so nothing upstream changes.
 *
 * A client redirect (not `next/navigation`'s server `redirect`) so it also works under
 * the static export build.
 */
export default function CitizenEntry() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/join");
  }, [router]);

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <Spinner aria-label="Loading" />
    </main>
  );
}
