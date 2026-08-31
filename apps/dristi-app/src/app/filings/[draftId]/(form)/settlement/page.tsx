import type { Metadata } from "next";

import { SettlementSection } from "@/components/filing/sections/settlement-section";

export const metadata: Metadata = { title: "Settlement options" };

export default function Page() {
  return <SettlementSection />;
}
