import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ScaleIcon } from "lucide-react";

import { CasesScreen } from "@/components/cases/cases-screen";
import { ProfileScopedEmpty } from "@/components/shell/profile-scoped-empty";
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
    <ProfileScopedEmpty
      title="No cases yet"
      description="Cases you file or are named a party to will appear here."
      icon={<ScaleIcon aria-hidden />}
    >
      <CasesScreen
        query={query}
        cases={cases}
        initialBookmarks={initialBookmarks(cases)}
        now={new Date(FIXTURE_TODAY).getTime()}
      />
    </ProfileScopedEmpty>
  );
}
