import type { Metadata } from "next";

import { CaseReviewScreen } from "@/components/employee/case-review-screen";

export const metadata: Metadata = { title: "Complaint" };

/**
 * One waiting complaint, at a glance — opened by the cause title on Register cases, and
 * by any link, bookmark or tab that names it.
 *
 * Nested under the queue rather than sitting beside it, so the rail's Register cases row
 * stays current and the top bar's trail leads back to the list
 * (`lib/employee/navigation.ts`). That is also why the screen carries no back control of
 * its own: on the court side the trail is the way back, and the page is never a step in
 * it.
 *
 * The whole file is one route deeper, at `./file` — deliberately, because a magistrate
 * arriving here after scrutiny is glancing rather than reading (brief D13, D17). What
 * this page holds and what it refuses to hold is `case-review-screen.tsx`.
 *
 * The screen is a client component because the day is read from the reader's clock
 * rather than the server's: a complaint's whole date chain, and every check run over it,
 * is worked backwards from how long it has waited.
 */
export default async function EmployeeCaseReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <CaseReviewScreen caseId={caseId} />;
}
