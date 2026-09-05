import type { Metadata } from "next";

import { HearingOverviewScreen } from "@/components/employee/hearing-overview-screen";

export const metadata: Metadata = { title: "Case overview" };

/**
 * What is in the case the bench has just called — opened by Start hearing on today's
 * cause list, and by the cause title on the same row.
 *
 * The screen is a client component because the marks this sitting has made live on
 * the client (`lib/employee/hearing-session.ts`) and the day is read from the
 * reader's clock, not the server's. It reads only: nothing on it is filed, and the
 * one action it offers is not connected to anything — `hearing-overview-screen.tsx`
 * says exactly what it is and is not.
 */
export default async function EmployeeHearingOverviewPage({
  params,
}: {
  params: Promise<{ hearingId: string }>;
}) {
  const { hearingId } = await params;
  return <HearingOverviewScreen hearingId={hearingId} />;
}
