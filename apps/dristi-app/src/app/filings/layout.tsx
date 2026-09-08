import type { Metadata } from "next";
import { cookies } from "next/headers";

import { TasksProvider } from "@/lib/tasks/store";
import { ProfileProvider } from "@/lib/filing/profile";
import { AppShell } from "@/components/shell/app-shell";
import {
  FilingChromeProvider,
  SECTIONS_COOKIE,
} from "@/components/filing/chrome";
import { FilingBreadcrumbs } from "@/components/filing/filing-breadcrumbs";

export const metadata: Metadata = {
  title: "Filings",
};

/**
 * Filings area: the one app shell, with the filing flow's own top bar in its slot.
 *
 * This layout used to mount a second, filings-only shell — the app's third — and then,
 * for a while, the shared shell with a bar of its own. The bar is gone too: it carried a
 * search pill, an account avatar and a breadcrumb that the rest of the product did not
 * have, so the same four things sat in different places depending on which screen you
 * were on. What is left is what is genuinely this area's — the sections-rail state and
 * the draft trail — declared through the channels every other area uses.
 */
export default async function FilingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server so the sections rail renders at its remembered width from the
  // first paint, rather than flipping once the client picks the cookie up.
  const sectionsOpen =
    (await cookies()).get(SECTIONS_COOKIE)?.value !== "false";

  return (
    // The tasks store mounts wherever the shell does: the rail's pending count and the
    // bell are promises the chrome makes on every screen, and they need the data layer
    // to keep them. Same sandbox database as /tasks — one source of truth, two areas.
    <TasksProvider>
      <ProfileProvider>
        <FilingChromeProvider sectionsDefaultOpen={sectionsOpen}>
          <AppShell>
            <FilingBreadcrumbs />
            {children}
          </AppShell>
        </FilingChromeProvider>
      </ProfileProvider>
    </TasksProvider>
  );
}
