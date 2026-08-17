import type { Metadata } from "next";

import { NewFiling } from "@/components/filing/new-filing";

export const metadata: Metadata = { title: "New filing" };

/** Creates a blank draft and opens it at the documents step. */
export default function NewFilingPage() {
  return <NewFiling />;
}
