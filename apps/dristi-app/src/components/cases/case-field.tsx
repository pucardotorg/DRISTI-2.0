import { type TableColumnId } from "@/lib/cases/table-columns";
import { counselFor, type CaseRecord } from "@/lib/cases/types";

import { CaseAdvocatesPair } from "./case-advocates";
import {
  CaseDate,
  CaseIdentity,
  CasePlain,
  CaseStage,
  CaseTitle,
} from "./case-identity";

/** Shared field body for the table cell and the stacked list. */
export function CaseField({
  record,
  id,
  presentation,
  hideLongPendingFlag = false,
}: {
  record: CaseRecord;
  id: TableColumnId;
  presentation: "table" | "list";
  /** Drop the "Long pending" badge — set inside the long pending register. */
  hideLongPendingFlag?: boolean;
}) {
  const list = presentation === "list";

  switch (id) {
    case "caseNumber":
      return (
        <CaseIdentity
          record={record}
          tone={list ? "muted" : "default"}
          hideLongPendingFlag={hideLongPendingFlag}
        />
      );
    case "caseName":
      return <CaseTitle record={record} />;
    case "advocates":
      return <CaseAdvocatesPair record={record} dense={!list} />;
    case "stage":
      return <CaseStage record={record} detail={list} />;
    case "nextHearing":
      return (
        <CaseDate iso={record.nextHearing?.on} emphasize={list} />
      );
    case "hearingPurpose":
      return <CasePlain>{record.nextHearing?.purpose}</CasePlain>;
    case "previousHearing":
      return <CaseDate iso={record.previousHearingOn} />;
    case "latestUpdate":
      return <CasePlain>{record.latestUpdate}</CasePlain>;
  }
}

export function caseFieldIsEmpty(record: CaseRecord, id: TableColumnId): boolean {
  switch (id) {
    case "caseNumber":
    case "caseName":
    case "stage":
      return false;
    case "advocates":
      return (
        counselFor(record, "complainant").length === 0 &&
        counselFor(record, "accused").length === 0
      );
    case "nextHearing":
      return !record.nextHearing?.on;
    case "hearingPurpose":
      return !record.nextHearing?.purpose;
    case "previousHearing":
      return !record.previousHearingOn;
    case "latestUpdate":
      return !record.latestUpdate;
  }
}
