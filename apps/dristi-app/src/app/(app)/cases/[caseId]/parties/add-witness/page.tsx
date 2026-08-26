import { redirect } from "next/navigation";

export default async function AddWitnessPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/cases/${encodeURIComponent(caseId)}?section=parties`);
}
