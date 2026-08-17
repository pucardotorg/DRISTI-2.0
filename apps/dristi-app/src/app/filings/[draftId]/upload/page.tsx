import type { Metadata } from "next";

import { UploadSection } from "@/components/filing/sections/upload-section";

export const metadata: Metadata = { title: "Add your case documents" };

/** Intake sits outside `FilingShell`, so the page carries its own `main` landmark. */
export default function Page() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <UploadSection />
    </main>
  );
}
