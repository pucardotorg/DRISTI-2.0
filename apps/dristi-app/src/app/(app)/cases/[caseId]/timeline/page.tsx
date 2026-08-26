import { redirect } from "next/navigation";

import { caseSectionHref } from "@/lib/cases/sections";

export default async function CaseTimelinePage(props: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await props.params;
  redirect(caseSectionHref(caseId, "case-history"));
}
