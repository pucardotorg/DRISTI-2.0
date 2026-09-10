import type { Metadata } from "next";
import { Suspense } from "react";

import { CaseFileScreen } from "@/components/employee/case-file-screen";

export const metadata: Metadata = { title: "Full file" };

/**
 * One complaint's whole file — reached from "Open the full file" on the glance, or from
 * a finding that names the head and the document to open (brief D17).
 *
 * A route rather than a mode or an overlay. A mode needs a second control to leave and a
 * memory of which mode you are in; an overlay re-introduces the scrim the file view was
 * rebuilt to remove. A route gives Back for free — the trail, the browser, and the
 * breadcrumb — and it is linkable, which a deep link from a finding needs.
 *
 * `Suspense` because the screen reads `?doc=` to decide which document the pane opens
 * on arrival, and `useSearchParams` opts a route into client rendering unless a boundary
 * says where the server may stop.
 */
export default async function EmployeeCaseFilePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <Suspense>
      <CaseFileScreen caseId={caseId} />
    </Suspense>
  );
}
