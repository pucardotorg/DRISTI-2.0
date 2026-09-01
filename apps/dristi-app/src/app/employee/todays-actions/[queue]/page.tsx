import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TodaysActionsQueueScreen } from "@/components/employee/todays-actions-queue-screen";
import { asyncSectionById } from "@/lib/employee/todays-actions";

/**
 * One queue of today's actions — `/employee/todays-actions/register`, `/cognizance`,
 * `/applications`. The segment names a queue in `lib/employee/todays-actions.ts`; a
 * URL that names none is a 404, not an empty screen pretending the queue exists.
 */

type Params = { queue: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { queue } = await params;
  const section = asyncSectionById(queue);
  return { title: section ? section.label : "Today's actions" };
}

export default async function EmployeeTodaysActionsQueuePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { queue } = await params;
  const section = asyncSectionById(queue);
  if (!section) notFound();
  return <TodaysActionsQueueScreen section={section} />;
}
