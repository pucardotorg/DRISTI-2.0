import type { Metadata } from "next";

import { EmployeeArea } from "@/components/employee/employee-area";

/**
 * `/employee/*` — the court-staff area: magistrate, bench clerk, scrutiny officer.
 *
 * Kept apart from `/citizen/*` (advocates, litigants, clerks, parties in person) so the
 * two can be built in parallel without colliding. Nothing here reaches into the citizen
 * screens and nothing there reaches in here — including the app shell, which is the
 * advocate's product and not the bench's. See `EmployeeArea` for the chrome.
 */
export const metadata: Metadata = {
  title: {
    default: "Court staff",
    template: "%s · DRISTI",
  },
};

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeeArea>{children}</EmployeeArea>;
}
