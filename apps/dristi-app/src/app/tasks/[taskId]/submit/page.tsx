import { redirect } from "next/navigation";

/** v1 route — "submit" became "file". Old links still land. */
export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  redirect(`/tasks/${taskId}/file`);
}
