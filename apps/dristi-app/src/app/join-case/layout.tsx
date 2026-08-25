import type { Metadata } from "next";

import { TasksProvider } from "@/lib/tasks/store";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "Join a case",
};

/** Join-a-case area: the shared shell around the landing (the tasks store rides along
 *  because the shell's pending count and bell need it everywhere the shell goes). */
export default function JoinCaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TasksProvider>
      <AppShell>{children}</AppShell>
    </TasksProvider>
  );
}
