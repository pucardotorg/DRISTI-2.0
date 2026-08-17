import type { Metadata } from "next";

import { AdrPrayerSection } from "@/components/filing/sections/adr-prayer-section";

export const metadata: Metadata = { title: "ADR, other details & prayer" };

export default function Page() {
  return <AdrPrayerSection />;
}
