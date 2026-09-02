import { CaseParticipants } from "@/components/cases/case-participants";
import { participantsFile, resolveSelection } from "@/lib/cases/parties";
import { partiesLabel, type CaseRecord } from "@/lib/cases/types";

/**
 * The Parties section of the case file.
 *
 * Thin on purpose: the model is built here, on the server, so the authored
 * pack behind it never ships to the browser, and the selection is resolved
 * here too — a `?selected=` naming nobody falls back to the first litigant
 * rather than rendering an empty pane beside a populated list.
 */
export function CaseParties({
  record,
  selectedId,
}: {
  record: CaseRecord;
  selectedId: string | undefined;
}) {
  const file = participantsFile(record);
  return (
    <CaseParticipants
      file={file}
      caseId={record.id}
      caseRef={{
        title: partiesLabel(record),
        caseNumber: record.caseNumber,
        court: record.court,
      }}
      selectedId={resolveSelection(file, selectedId)}
    />
  );
}
