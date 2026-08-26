import type { Metadata } from "next";
import { cookies } from "next/headers";

import { TasksProvider } from "@/lib/tasks/store";
import { ProfileProvider } from "@/lib/filing/profile";
import { AppShell } from "@/components/shell/app-shell";
import {
  FilingChromeProvider,
  SECTIONS_COOKIE,
} from "@/components/filing/chrome";
import { FilingTopBar } from "@/components/filing/filing-top-bar";

export const metadata: Metadata = {
  title: "Filings",
};

/**
 * Filings area: the one app shell, with the filing flow's own top bar in its slot.
 *
 * This layout used to mount a second, filings-only shell — the app's third. Now the
 * rail, its theme, the profile foot and the fold behaviour are the shared shell's, and
 * the only thing this area declares is what is genuinely its own: the sections-rail
 * state and the draft breadcrumb, both carried by `FilingChromeProvider` + the bar.
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
          <AppShell topBar={<FilingTopBar />}>{children}</AppShell>
        </FilingChromeProvider>
      </ProfileProvider>
    </TasksProvider>
  );
}
