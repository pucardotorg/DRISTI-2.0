import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";

import {
  ApplicationsLoading,
  CaseApplications,
} from "@/components/cases/case-applications";
import { CaseComplaint } from "@/components/cases/case-complaint";
import {
  CaseDocuments,
  DocumentsLoading,
} from "@/components/cases/case-documents";
import {
  BondLifecycleCard,
  CaseBailProvider,
} from "@/components/cases/case-bail-flow";
import { CaseFile } from "@/components/cases/case-file";
import { CaseHeader } from "@/components/cases/case-header";
import {
  CaseHearings,
  HearingsLoading,
} from "@/components/cases/case-hearings";
import { CaseOrders, OrdersLoading } from "@/components/cases/case-orders";
import { CaseOverview } from "@/components/cases/case-overview";
import { CaseParties } from "@/components/cases/case-parties";
import { CaseServiceOfProcess } from "@/components/cases/case-service-of-process";
import { CaseTimeline } from "@/components/cases/case-timeline";
import {
  CaseSectionTabs,
  SectionPending,
} from "@/components/cases/case-section-tabs";
import { Button } from "@/components/ui/button";
import { parseCaseFileDoc, parseCaseFileView } from "@/lib/cases/case-file";
import {
  complaintTree,
  parseComplaintPart,
} from "@/lib/cases/complaint";
import { CASES, FIXTURE_TODAY } from "@/lib/cases/fixtures";
import { partiesLabel } from "@/lib/cases/types";
import { parseSelectedId } from "@/lib/cases/parties";
import {
  CASE_SECTIONS,
  parseCaseOrigin,
  parseCaseSection,
} from "@/lib/cases/sections";

function findCase(caseId: string) {
  return CASES.find((record) => record.id === caseId);
}

export async function generateMetadata(
  props: PageProps<"/cases/[caseId]">
): Promise<Metadata> {
  const { caseId } = await props.params;
  const record = findCase(caseId);
  return { title: record ? record.caseNumber : "Case" };
}

/**
 * One branch per member of `CASE_SECTIONS`, in strip order, with Hearings
 * last — it keeps its route and its screen but no longer has a tab, so it is
 * reached from Overview's "View hearing details", the pending-task rows, the
 * case-peek drawer, and the case-history entries that point at it.
 *
 * The `SectionPending` fallback is unreachable while every member is built;
 * it stays as the landing for the next section added to the registry ahead of
 * its screen, and it reads its label off the registry rather than printing
 * the raw slug.
 */
export default async function CaseDetailPage(
  props: PageProps<"/cases/[caseId]">
) {
  const { caseId } = await props.params;
  const searchParams = await props.searchParams;
  const record = findCase(caseId);
  if (!record) notFound();

  const section = parseCaseSection(searchParams.section);
  const docId = parseCaseFileDoc(searchParams.doc);
  const view = parseCaseFileView(searchParams.view);
  const partId = parseComplaintPart(
    searchParams.part,
    complaintTree(record.id)
  );
  const origin = parseCaseOrigin(searchParams.from);
  /* A `?selected=` naming nobody — a stale link from an earlier layout, a
     hand-edited URL — falls back to the first litigant. Retired params like
     `?tab=` and `?side=` are simply unread. */
  const participantId = parseSelectedId(searchParams.selected);

  const accessCase = {
    id: record.id,
    title: partiesLabel(record),
    caseNumber: record.caseNumber,
    court: record.court,
    nextHearing: record.nextHearing?.on ?? "—",
  };

  return (
    <CaseBailProvider accessCase={accessCase}>
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
        <div>
          <Button variant="ghost" asChild>
            <Link href="/cases">
              <ArrowLeftIcon data-icon="inline-start" aria-hidden />
              Back to cases
            </Link>
          </Button>
        </div>

        <CaseHeader
          record={record}
          hideLongPendingFlag={origin === "long-pending"}
        />

      <CaseSectionTabs caseId={caseId} section={section}>
        {section === "overview" ? (
          <div className="flex min-w-0 flex-col gap-6">
            <CaseOverview
              record={record}
              now={new Date(FIXTURE_TODAY).getTime()}
            />
            {/* The bond lifecycle is a pending task, so it lives with the
                Overview's task content rather than floating above the strip
                as page chrome — and after the overview card, which leads the
                section (Aug 31 correction round). */}
            <BondLifecycleCard />
          </div>
        ) : section === "case-file" ? (
          <CaseFile record={record} docId={docId} view={view} />
        ) : section === "complaint" ? (
          <CaseComplaint record={record} partId={partId} />
        ) : section === "notice-process-status" ? (
          <CaseServiceOfProcess record={record} />
        ) : section === "hearings" ? (
          <Suspense fallback={<HearingsLoading />}>
            <CaseHearings record={record} />
          </Suspense>
        ) : section === "orders-and-notifications" ? (
          <Suspense fallback={<OrdersLoading />}>
            <CaseOrders record={record} />
          </Suspense>
        ) : section === "applications" ? (
          <Suspense fallback={<ApplicationsLoading />}>
            <CaseApplications record={record} />
          </Suspense>
        ) : section === "documents" ? (
          <Suspense fallback={<DocumentsLoading />}>
            <CaseDocuments record={record} />
          </Suspense>
        ) : section === "parties" ? (
          <CaseParties record={record} selectedId={participantId} />
        ) : section === "case-history" ? (
          <CaseTimeline record={record} />
        ) : (
          <SectionPending
            label={
              CASE_SECTIONS.find((item) => item.value === section)?.label ??
              section
            }
          />
        )}
      </CaseSectionTabs>
      </div>
    </CaseBailProvider>
  );
}
