"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PeoplePage } from "@/components/access/people-page";

/** People — the access-management page. Opening a case jumps to Your Cases with it open. */
export default function Page() {
  const router = useRouter();
  return (
    <PeoplePage
      locale="en"
      onOpenCase={(caseId) => router.push(`/cases?case=${encodeURIComponent(caseId)}`)}
    />
  );
}
