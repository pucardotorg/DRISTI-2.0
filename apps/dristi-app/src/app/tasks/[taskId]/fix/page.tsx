import { redirect } from "next/navigation";

/** v2 route — fixing a return now happens in a modal on the list. Old links still land. */
export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  redirect(`/tasks?task=${encodeURIComponent(taskId)}`);
}
