import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CasesScreen } from "@/components/cases/cases-screen";
import { CASES, FIXTURE_TODAY } from "@/lib/cases/fixtures";
import {
  buildCasesHref,
  initialBookmarks,
  parseCasesQuery,
} from "@/lib/cases/query";

export const metadata: Metadata = {
  title: "Cases",
};

export default async function CasesPage(props: PageProps<"/cases">) {
  const query = parseCasesQuery(await props.searchParams);
  if (query.bucket) {
    redirect(buildCasesHref(query));
  }

  const cases = query.demo === "empty" ? [] : CASES;

  return (
    <CasesScreen
      query={query}
      cases={cases}
      initialBookmarks={initialBookmarks(cases)}
      now={new Date(FIXTURE_TODAY).getTime()}
    />
  );
}
