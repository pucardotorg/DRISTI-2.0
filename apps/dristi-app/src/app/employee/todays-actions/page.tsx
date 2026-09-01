import type { Metadata } from "next";

import { TodaysActionsScreen } from "@/components/employee/todays-actions-screen";

export const metadata: Metadata = { title: "Today's actions" };

/**
 * The bench's paper-only work for the day — the screen the rail's "Today's actions"
 * row leads to: registrations, cognizance and the applications that only need the
 * papers, one button per queue with its count of actions due, the specifics one click
 * in.
 *
 * There is no backend — `lib/employee/todays-actions.ts` says exactly what the data is
 * and is not, and nothing here performs a judicial act.
 */
export default function EmployeeTodaysActionsPage() {
  return <TodaysActionsScreen />;
}
