/**
 * One way to look a case up from anywhere the directory is used.
 *
 * The directory's own fifteen Demo World cases come first. Everything else
 * on the platform (the Your Cases register the case file and the bulk share
 * run on) resolves through the case record, so a group can be shared onto
 * any case the advocate can open, and the person panel can name it back.
 */

import { CASES } from "@/lib/cases/fixtures";
import { counselFor, partiesLabel, type CaseRecord } from "@/lib/cases/types";
import { viewerAccess } from "@/lib/cases/viewer";
import { DIRECTORY_CASES } from "./cases";
import type { DirectoryCase } from "./types";

const fromRecords = new Map<string, DirectoryCase>();

function fromRecord(record: CaseRecord): DirectoryCase {
  const access = viewerAccess(record);
  const side = access.kind === "vakalatnama" ? access.sides[0] : access.side;
  return {
    id: record.id,
    title: partiesLabel(record),
    caseNumber: record.caseNumber,
    court: record.court,
    side,
    counsel: counselFor(record, side),
    viewer: access.kind === "vakalatnama" ? { kind: "vakalatnama" } : { kind: "office", via: access.via },
    /* Party numbers are not on the case record; the import guard covers the
       Demo World cases, which is where the planted number lives. */
    parties: {
      complainant: { name: record.parties.complainant, phone: "" },
      accused: { name: record.parties.accused, phone: "" },
    },
  };
}

export function resolveCase(caseId: string): DirectoryCase | undefined {
  const own = DIRECTORY_CASES.find((c) => c.id === caseId);
  if (own) return own;
  const cached = fromRecords.get(caseId);
  if (cached) return cached;
  const record = CASES.find((c) => c.id === caseId);
  if (!record) return undefined;
  const built = fromRecord(record);
  fromRecords.set(caseId, built);
  return built;
}
