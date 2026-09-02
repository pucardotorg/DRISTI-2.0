"use client";

/**
 * Session-local additions to the Parties list.
 *
 * Adding an advocate is an immediate act — they can work the case as soon as
 * the vakalatnama is on record — so the list should say so without waiting
 * for a backend that does not exist yet. The provider holds what this
 * session added; the wells component renders those advocates into the
 * Representation section, in the same well every advocate on record gets
 * (removal entry included). This replaced the done stage's "the Parties
 * list does not update yet" banner (PM, Sept 2): the list now updates.
 *
 * State is session-local by design — a refresh returns to the record. The
 * seam is the participants service: once additions land there, the server
 * renders them and this file goes.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

import { RepresentationWell } from "@/components/cases/representation-well";
import type { CaseRef } from "@/components/cases/party-application";

type AddedAdvocates = { names: string[]; partyIds: string[] };

type PartiesLive = {
  added: AddedAdvocates[];
  addAdvocates: (names: string[], partyIds: string[]) => void;
};

const PartiesLiveContext = createContext<PartiesLive | null>(null);

export function PartiesLiveProvider({ children }: { children: ReactNode }) {
  const [added, setAdded] = useState<AddedAdvocates[]>([]);
  return (
    <PartiesLiveContext.Provider
      value={{
        added,
        addAdvocates: (names, partyIds) =>
          setAdded((current) => [...current, { names, partyIds }]),
      }}
    >
      {children}
    </PartiesLiveContext.Provider>
  );
}

/** Null outside the provider, so callers can no-op rather than crash. */
export function usePartiesLive(): PartiesLive | null {
  return useContext(PartiesLiveContext);
}

/**
 * The advocates this session added for a party, appended to their
 * Representation section in the same grammar the record's advocates use.
 */
export function LiveAdvocateWells({
  partyId,
  partyName,
  caseRef,
}: {
  partyId: string;
  partyName: string;
  caseRef: CaseRef;
}) {
  const live = usePartiesLive();
  if (!live) return null;
  const names = live.added
    .filter((entry) => entry.partyIds.includes(partyId))
    .flatMap((entry) => entry.names);
  if (names.length === 0) return null;
  return (
    <>
      {names.map((name) => (
        <RepresentationWell
          key={name}
          advocate={name}
          partyName={partyName}
          caseRef={caseRef}
        />
      ))}
    </>
  );
}
