import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterCaseV3Screen } from "@/components/employee/register-case-v3-screen";

export const metadata: Metadata = { title: "Complaint" };

/**
 * One waiting complaint, third build — the magistrate's read before registering it or
 * sending it back to scrutiny.
 *
 * Nested under the v3 queue so the rail row stays current and the trail leads back to
 * the list (`lib/employee/navigation.ts`). `Suspense` because the screen reads the query
 * for its open tab.
 */
export default async function EmployeeRegisterCaseV3Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <Suspense>
      <RegisterCaseV3Screen caseId={caseId} />
    </Suspense>
  );
}
