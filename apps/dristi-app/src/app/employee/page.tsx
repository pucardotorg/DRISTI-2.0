import { redirect } from "next/navigation";

/**
 * The court-staff landing — today's cause list is the default view (owner, 2026-09-01),
 * so arriving at `/employee` goes straight to the day's hearings rather than pausing on
 * a home screen. The earlier "Court home" placeholder lived here; when a court-side
 * dashboard is built, it takes this route back and the redirect goes.
 */
export default function EmployeeHomePage() {
  redirect("/employee/hearings");
}
