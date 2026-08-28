"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * `/employee` — the court-staff home.
 *
 * Blank on purpose. This is where the magistrate / bench-clerk / scrutiny-officer
 * screens get built. There is no session yet, so for now this stands in as the
 * post-login landing; when real auth exists, guard this route and redirect signed-out
 * staff back to `/employee/login`.
 */
export default function EmployeeHomePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-title-l font-semibold">Court staff home</h1>
        <p className="text-body text-muted-foreground text-balance">
          The magistrate, bench-clerk and scrutiny-officer screens are built from here.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.push("/employee/login")}>
        Back to sign-in
      </Button>
    </main>
  );
}
