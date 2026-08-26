"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CasesWireframe } from "@/components/access/cases-wireframe";

/**
 * Your Cases — a placeholder list/file (Mohit's access wireframe). The open case is in
 * the URL (`?case=<id>`) so People can deep-link into a case file. Later swapped for
 * Neer's real case list/detail without touching this route's wiring.
 */
function CasesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCaseId = searchParams.get("case");

  return (
    <CasesWireframe
      locale="en"
      openCaseId={openCaseId}
      onOpenCase={(caseId) => {
        const params = new URLSearchParams();
        if (caseId) params.set("case", caseId);
        const qs = params.toString();
        router.replace(`/cases${qs ? `?${qs}` : ""}`);
      }}
    />
  );
}

export default function Page() {
  return (
    <React.Suspense>
      <CasesInner />
    </React.Suspense>
  );
}
