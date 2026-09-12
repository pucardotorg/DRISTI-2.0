import type { Metadata } from "next";

import { HearingOverviewScreen } from "@/components/employee/hearing-overview-screen";

export const metadata: Metadata = { title: "Case overview" };

/**
 * What is in the case, as a route — reached by a link, a bookmark or a typed URL that
 * names this listing.
 *
 * **Nothing on the cause list comes here any more.** The cause title opens these same
 * sections as a sheet over the day (`components/employee/hearing-overview-dialog.tsx`),
 * and Start hearing opens nothing at all — it marks the row it was pressed on. The route
 * survives for the one job an overlay cannot do: outliving the page it was opened from.
 * Beyond that it is the order composer's breadcrumb parent, and that is all.
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
