import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RaiseApplicationForm } from "@/components/cases/raise-application-form";
import { CASES } from "@/lib/cases/fixtures";

function findCase(caseId: string) {
  return CASES.find((record) => record.id === caseId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ caseId: string }>;
}): Promise<Metadata> {
  const { caseId } = await params;
  const record = findCase(caseId);
  return {
    title: record ? `Raise application · ${record.caseNumber}` : "Raise application",
  };
}

export default async function RaiseApplicationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const record = findCase(caseId);
  if (!record) notFound();

  return (
    <main className="flex flex-1 flex-col p-6 md:p-8">
      <RaiseApplicationForm record={record} />
    </main>
  );
}
