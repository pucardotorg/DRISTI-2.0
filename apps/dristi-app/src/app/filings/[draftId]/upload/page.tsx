import type { Metadata } from "next";

import { UploadSection } from "@/components/filing/sections/upload-section";

export const metadata: Metadata = { title: "Add your case documents" };

export default function Page() {
  return <UploadSection />;
}
