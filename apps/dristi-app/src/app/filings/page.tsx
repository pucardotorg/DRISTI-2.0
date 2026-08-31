import { Suspense } from "react";
import type { Metadata } from "next";

import { FilingsDashboard } from "@/components/filing/dashboard/filings-dashboard";

export const metadata: Metadata = { title: "Filings" };

export default function FilingsPage() {
  return (
    // The shell owns the header and nav landmarks, so the screen owns `main`.
    <main className="flex min-w-0 flex-1 flex-col">
      {/* The queue reads its view (tab, search, page) from the URL. */}
      <Suspense>
        <FilingsDashboard />
      </Suspense>
    </main>
  );
}
