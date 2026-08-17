import type { Metadata } from "next";

import { FilingsDashboard } from "@/components/filing/dashboard/filings-dashboard";

export const metadata: Metadata = { title: "Filings" };

export default function FilingsPage() {
  return <FilingsDashboard />;
}
