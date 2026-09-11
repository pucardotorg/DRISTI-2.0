import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterCaseScreen } from "@/components/employee/register-case-screen";

export const metadata: Metadata = { title: "Complaint" };

/**
 * One waiting complaint, rebuilt (owner, 2026-09-11) — the magistrate's glance before
 * taking it on the register.
 *
 * Nested under the v2 queue so the rail row stays current and the trail leads back to
 * the list (`lib/employee/navigation.ts`). `Suspense` because the screen reads the query
 * for its open tab.
 */
export default async function EmployeeRegisterCaseV2Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <Suspense>
      <RegisterCaseScreen caseId={caseId} />
    </Suspense>
  );
}
