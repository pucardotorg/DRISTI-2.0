import { Suspense } from "react";

import { ScrutinyReturnPage } from "@/components/scrutiny/scrutiny-page";

/**
 * Scrutiny return — the advocate's correction round on a filing sent back for defects.
 *
 * The screen reads the door it was opened through (`?from`) to root its breadcrumb, and
 * `useSearchParams` needs a Suspense boundary above it.
 */
export default function Page() {
  return (
    <Suspense>
      <ScrutinyReturnPage />
    </Suspense>
  );
}
