import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubmitDocumentsForm } from "@/components/cases/submit-documents-form";
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
    title: record ? `Submit documents · ${record.caseNumber}` : "Submit documents",
  };
}

export default async function SubmitDocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const record = findCase(caseId);
  if (!record) notFound();

  return (
    <main className="flex flex-1 flex-col p-6 md:p-8">
      <SubmitDocumentsForm caseId={record.id} />
    </main>
  );
}
