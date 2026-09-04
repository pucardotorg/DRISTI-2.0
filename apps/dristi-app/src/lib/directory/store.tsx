"use client";

import * as React from "react";

import { DIRECTORY_CASES } from "./cases";
import { assignPreview, displayToday } from "./derive";
import type {
  DirectGrant,
  DirectoryCase,
  DirectoryWorld,
  Group,
  PendingRequest,
  Person,
} from "./types";

/**
 * The firm directory's in-memory store for the prototype. Starts EMPTY on
 * purpose: day one, Anjali has never added anyone. Every mutation is a rule
 * from the PRD, so the screens cannot bend them:
 *
 * - groups grant office access only, fanning out per (member × case);
 * - a group assigned to a case the viewer holds by office access alone does
 *   not grant: it becomes a request for the vakalatnama holder to sign;
 * - removal acts on one source and never rewrites another.
 */

export type AssignResult = {
  /** Members who now hold office access through the group. */
  people: number;
  /** Cases granted instantly. */
  granted: DirectoryCase[];
  /** Cases sent to their vakalatnama holder to sign, with the holder. */
  sentToSign: Array<{ kase: DirectoryCase; holder: string }>;
};

export type DirectoryContextValue = DirectoryWorld & {
  addPeople: (people: Person[]) => void;
  createGroup: (name: string, memberIds: string[]) => Group;
  renameGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  addMembers: (groupId: string, personIds: string[]) => void;
  removeMember: (groupId: string, personId: string) => void;
  assignCases: (groupId: string, caseIds: string[]) => AssignResult;
  removeCaseFromGroup: (groupId: string, caseId: string) => void;
  grantDirect: (personId: string, caseIds: string[]) => void;
  removeDirect: (personId: string, caseId: string) => void;
  requestRemoval: (personId: string, caseId: string, note?: string) => PendingRequest;
  /** For the demo: reset to day one. */
  reset: () => void;
};

const DirectoryContext = React.createContext<DirectoryContextValue | null>(null);

export function useDirectory(): DirectoryContextValue {
  const value = React.useContext(DirectoryContext);
  if (!value) throw new Error("useDirectory must be used inside <DirectoryProvider>");
  return value;
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq}`;
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = React.useState<Person[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [directGrants, setDirectGrants] = React.useState<DirectGrant[]>([]);
  const [pending, setPending] = React.useState<PendingRequest[]>([]);
  const cases = DIRECTORY_CASES;

  const addPeople = React.useCallback((incoming: Person[]) => {
    setPeople((current) => {
      const byPhone = new Map(current.map((p) => [p.phone, p]));
      for (const person of incoming) {
        // Identity is the phone: re-importing a known number links, never duplicates.
        if (!byPhone.has(person.phone)) byPhone.set(person.phone, person);
      }
      return [...byPhone.values()];
    });
  }, []);

  const createGroup = React.useCallback((name: string, memberIds: string[]): Group => {
    const group: Group = {
      id: nextId("g"),
      name: name.trim(),
      memberIds: [...new Set(memberIds)],
      caseIds: [],
      createdOn: displayToday(),
    };
    setGroups((current) => [...current, group]);
    return group;
  }, []);

  const renameGroup = React.useCallback((groupId: string, name: string) => {
    setGroups((current) =>
      current.map((g) => (g.id === groupId ? { ...g, name: name.trim() } : g)),
    );
  }, []);

  const deleteGroup = React.useCallback((groupId: string) => {
    setGroups((current) => current.filter((g) => g.id !== groupId));
    setPending((current) =>
      current.filter((r) => !(r.kind === "assign-group" && r.groupId === groupId)),
    );
  }, []);

  const addMembers = React.useCallback((groupId: string, personIds: string[]) => {
    setGroups((current) =>
      current.map((g) =>
        g.id === groupId ? { ...g, memberIds: [...new Set([...g.memberIds, ...personIds])] } : g,
      ),
    );
  }, []);

  const removeMember = React.useCallback((groupId: string, personId: string) => {
    setGroups((current) =>
      current.map((g) =>
        g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== personId) } : g,
      ),
    );
  }, []);

  const assignCases = React.useCallback(
    (groupId: string, caseIds: string[]): AssignResult => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return { people: 0, granted: [], sentToSign: [] };
      const fresh = caseIds.filter((id) => !group.caseIds.includes(id));
      const preview = assignPreview(group, fresh, {
        people,
        groups,
        directGrants,
        pending,
        cases,
      });
      const today = displayToday();
      const sentToSign = preview.needsSignature
        .map((id) => cases.find((c) => c.id === id))
        .filter((c): c is DirectoryCase => Boolean(c) && c!.viewer.kind === "office")
        .filter((c) => !pending.some((r) => r.kind === "assign-group" && r.groupId === groupId && r.caseId === c.id))
        .map((kase) => ({
          kase,
          holder: kase.viewer.kind === "office" ? kase.viewer.via : "",
        }));

      setGroups((current) =>
        current.map((g) =>
          g.id === groupId ? { ...g, caseIds: [...g.caseIds, ...preview.grantable] } : g,
        ),
      );
      if (sentToSign.length) {
        setPending((current) => [
          ...current,
          ...sentToSign.map(({ kase, holder }) => ({
            id: nextId("req"),
            kind: "assign-group" as const,
            groupId,
            caseId: kase.id,
            holder,
            requestedOn: today,
          })),
        ]);
      }
      return {
        people: group.memberIds.length,
        granted: preview.grantable
          .map((id) => cases.find((c) => c.id === id))
          .filter((c): c is DirectoryCase => Boolean(c)),
        sentToSign,
      };
    },
    [groups, people, directGrants, pending, cases],
  );

  const removeCaseFromGroup = React.useCallback((groupId: string, caseId: string) => {
    setGroups((current) =>
      current.map((g) =>
        g.id === groupId ? { ...g, caseIds: g.caseIds.filter((id) => id !== caseId) } : g,
      ),
    );
  }, []);

  const grantDirect = React.useCallback((personId: string, caseIds: string[]) => {
    const today = displayToday();
    setDirectGrants((current) => {
      const have = new Set(
        current.filter((g) => g.personId === personId).map((g) => g.caseId),
      );
      const fresh = caseIds.filter((id) => !have.has(id));
      return [...current, ...fresh.map((caseId) => ({ personId, caseId, since: today }))];
    });
  }, []);

  const removeDirect = React.useCallback((personId: string, caseId: string) => {
    setDirectGrants((current) =>
      current.filter((g) => !(g.personId === personId && g.caseId === caseId)),
    );
  }, []);

  const requestRemoval = React.useCallback(
    (personId: string, caseId: string, note?: string): PendingRequest => {
      const kase = cases.find((c) => c.id === caseId);
      const holder = kase?.viewer.kind === "office" ? kase.viewer.via : "the vakalatnama holder";
      const request: PendingRequest = {
        id: nextId("req"),
        kind: "remove-person",
        personId,
        caseId,
        holder,
        note,
        requestedOn: displayToday(),
      };
      setPending((current) => [...current, request]);
      return request;
    },
    [cases],
  );

  const reset = React.useCallback(() => {
    setPeople([]);
    setGroups([]);
    setDirectGrants([]);
    setPending([]);
  }, []);

  const value = React.useMemo<DirectoryContextValue>(
    () => ({
      people,
      groups,
      directGrants,
      pending,
      cases,
      addPeople,
      createGroup,
      renameGroup,
      deleteGroup,
      addMembers,
      removeMember,
      assignCases,
      removeCaseFromGroup,
      grantDirect,
      removeDirect,
      requestRemoval,
      reset,
    }),
    [
      people,
      groups,
      directGrants,
      pending,
      cases,
      addPeople,
      createGroup,
      renameGroup,
      deleteGroup,
      addMembers,
      removeMember,
      assignCases,
      removeCaseFromGroup,
      grantDirect,
      removeDirect,
      requestRemoval,
      reset,
    ],
  );

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}
