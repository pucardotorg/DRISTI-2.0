import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Court staff",
    template: "%s · Court staff · DRISTI",
  },
};

/**
 * `/employee/*` — the court-staff area: magistrate, bench clerk, scrutiny officer.
 *
 * This is a blank canvas on purpose. It does NOT wrap children in the citizen app
 * shell (`AppShell`) — court staff get their own navigation, built here. Add the
 * employee shell/sidebar in this layout when it exists.
 */
export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-col">{children}</div>;
}
