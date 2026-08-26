import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RaiseApplicationForm } from "@/components/cases/raise-application-form";
import {
  applicationsFile,
  findDraftSubmission,
} from "@/lib/cases/applications";
import { CASES } from "@/lib/cases/fixtures";

function findCase(caseId: string) {
  return CASES.find((record) => record.id === caseId);
}

/**
 * ?draft=<submission id> reopens a saved draft; without it the flow starts at
 * the type picker. Resolving it here rather than in the form keeps the
 * register the one place that knows how a draft is stored.
 */
function resumedDraft(caseId: string, draftId: string | undefined) {
  const record = findCase(caseId);
  if (!record || !draftId) return null;
  try {
    return findDraftSubmission(applicationsFile(record), draftId);
  } catch {
    return null;
  }
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
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { caseId } = await params;
  const { draft } = await searchParams;
  const record = findCase(caseId);
  if (!record) notFound();

  return (
    <main className="flex flex-1 flex-col p-6 md:p-8">
      <RaiseApplicationForm
        record={record}
        resume={resumedDraft(caseId, draft)}
      />
    </main>
  );
}
