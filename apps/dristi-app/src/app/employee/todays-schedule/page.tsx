import type { Metadata } from "next";

import { TodaysScheduleScreen } from "@/components/employee/todays-schedule-screen";

export const metadata: Metadata = { title: "Today's schedule" };

/**
 * The bench's day as one plan — the primary court-side view, and where `/employee`
 * lands. Conduct hearings first, then today's actions one by one, each with its
 * allotted slot; every block opens the screen where that work lives.
 *
 * There is no backend — `lib/employee/todays-schedule.ts` says exactly what the data
 * (and the slots) are and are not.
 */
export default function EmployeeTodaysSchedulePage() {
  return <TodaysScheduleScreen />;
}
