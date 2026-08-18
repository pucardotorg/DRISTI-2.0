import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ProfileProvider } from "@/lib/filing/profile";
import { FilingsAppShell } from "@/components/filing/app-shell";
import { SECTIONS_COOKIE } from "@/components/filing/chrome";

export const metadata: Metadata = {
  title: "Filings",
};

/** Filings area: main navigation and the top bar around every screen. */
export default async function FilingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server so the sections rail renders at its remembered width from the
  // first paint, rather than flipping once the client picks the cookie up.
  const sectionsOpen = (await cookies()).get(SECTIONS_COOKIE)?.value !== "false";

  return (
    <ProfileProvider>
      <FilingsAppShell sectionsDefaultOpen={sectionsOpen}>{children}</FilingsAppShell>
    </ProfileProvider>
  );
}
