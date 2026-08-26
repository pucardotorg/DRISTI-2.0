import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildCasesHref, parseCasesQuery } from "@/lib/cases/query";

export const metadata: Metadata = {
  title: "Cases",
};

/** Older search URLs land on `/cases` — the list lives on the Cases landing. */
export default async function CasesSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseCasesQuery(await searchParams);
  redirect(buildCasesHref({ ...query, bucket: null }));
}
