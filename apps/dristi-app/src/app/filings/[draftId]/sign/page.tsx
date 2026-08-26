import type { Metadata } from "next";

import { SignSection } from "@/components/filing/sections/sign-section";

export const metadata: Metadata = { title: "Sign the complaint" };

export default function Page() {
  return <SignSection />;
}
