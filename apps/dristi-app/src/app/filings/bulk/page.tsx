import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { FILINGS_HOME } from "@/lib/filing/steps";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bulk filing" };

/** Honest stub: bulk filing (client batches) is a later round. */
export default function BulkFilingPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-title font-semibold tracking-tight text-foreground">Bulk filing</h1>
      <p className="text-body text-muted-foreground">
        Reviewing and filing client batches is not built yet. The single-case e-filing flow
        starts from the dashboard.
      </p>
      <Button asChild variant="outline" className="w-fit">
        <Link href={FILINGS_HOME}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden />
          Back to dashboard
        </Link>
      </Button>
    </main>
  );
}
