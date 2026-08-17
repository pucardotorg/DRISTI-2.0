import { redirect } from "next/navigation";

import { FILINGS_HOME } from "@/lib/filing/steps";

/**
 * The home screen is not built on this branch; land on the Filings dashboard so the
 * e-filing flow is reachable. Remove once a home route exists.
 */
export default function HomePage() {
  redirect(FILINGS_HOME);
}
