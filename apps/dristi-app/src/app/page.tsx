import { redirect } from "next/navigation";

import { TASKS_HOME } from "@/lib/tasks/routes";

/**
 * The home screen is not built on this branch; land on Pending tasks so the tasks area
 * is reachable. Remove once a home route exists.
 */
export default function HomePage() {
  redirect(TASKS_HOME);
}
