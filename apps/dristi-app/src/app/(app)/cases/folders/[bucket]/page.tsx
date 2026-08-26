import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CasesListScreen } from "@/components/cases/cases-list-screen";
import { CASES, FIXTURE_TODAY } from "@/lib/cases/fixtures";
import {
  buildCasesHref,
  initialBookmarks,
  parseCasesQuery,
} from "@/lib/cases/query";
import { bucketLabel } from "@/lib/cases/types";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { bucket } = await params;
  const query = parseCasesQuery(await searchParams, { bucket });
  return { title: query.bucket ? bucketLabel(query.bucket) : "Cases" };
}

export default async function CasesFolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ bucket: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bucket } = await params;
  const query = parseCasesQuery(await searchParams, { bucket });
  if (!query.bucket) {
    redirect(buildCasesHref(query));
  }

  const cases = query.demo === "empty" ? [] : CASES;

  return (
    <CasesListScreen
      query={query}
      cases={cases}
      initialBookmarks={initialBookmarks(cases)}
      now={new Date(FIXTURE_TODAY).getTime()}
    />
  );
}
