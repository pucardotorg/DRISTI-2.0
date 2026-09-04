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
  /** False until the saved state has been read back; screens wait for it. */
  ready: boolean;
  addPeople: (people: Person[]) => void;
  createGroup: (name: string, memberIds: string[]) => Group;
  renameGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  addMembers: (groupId: string, personIds: string[]) => void;
  removeMember: (groupId: string, personId: string) => void;
  assignCases: (groupId: string, caseIds: string[]) => AssignResult;
  removeCaseFromGroup: (groupId: string, caseId: string) => void;
  /** Direct office grants; cases the viewer holds by office access alone go to their holder to sign. */
  grantDirect: (personId: string, caseIds: string[]) => { granted: DirectoryCase[]; sentToSign: Array<{ kase: DirectoryCase; holder: string }> };
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

/**
 * The directory survives navigation and reloads in this browser. The portal
 * layout that mounts the provider does not wrap every route (Vakalatnama,
 * Pending tasks), so without this a demo lost its office the moment the
 * admin stepped out and back. A real deployment persists server-side.
 */
const STORAGE_KEY = "dristi.directory.v1";

type Saved = Pick<DirectoryWorld, "people" | "groups" | "directGrants" | "pending">;

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      people: parsed.people ?? [],
      groups: parsed.groups ?? [],
      directGrants: parsed.directGrants ?? [],
      pending: parsed.pending ?? [],
    };
  } catch {
    return null;
  }
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = React.useState<Person[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [directGrants, setDirectGrants] = React.useState<DirectGrant[]>([]);
  const [pending, setPending] = React.useState<PendingRequest[]>([]);
  const [ready, setReady] = React.useState(false);
  const cases = DIRECTORY_CASES;

  // Read back after mount: the server render has no storage to agree with.
  // Deferred a tick, the way the tasks store loads, so the effect only
  // starts the read and every setState happens from the callback.
  const hydrate = React.useCallback(() => {
    const saved = readSaved();
    if (saved) {
      setPeople(saved.people);
      setGroups(saved.groups);
      setDirectGrants(saved.directGrants);
      setPending(saved.pending);
    }
    setReady(true);
  }, []);
  React.useEffect(() => {
    const t = window.setTimeout(hydrate, 0);
    return () => window.clearTimeout(t);
  }, [hydrate]);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ people, groups, directGrants, pending } satisfies Saved),
      );
    } catch {
      // Storage full or blocked: the session still works, it just will not survive a reload.
    }
  }, [ready, people, groups, directGrants, pending]);

  const addPeople = React.useCallback(
    (incoming: Person[]) => {
      setPeople((current) => {
        const byPhone = new Map(current.map((p) => [p.phone, p]));
        for (const person of incoming) {
          // Identity is the phone: re-importing a known number links, never duplicates.
          if (!byPhone.has(person.phone)) byPhone.set(person.phone, person);
        }
        return [...byPhone.values()];
      });
      // Office access a colleague already shared on a case record follows the
      // person in, attributed to whoever shared it.
      const seeded: DirectGrant[] = [];
      for (const kase of cases) {
        for (const staff of kase.officeStaff ?? []) {
          const person = incoming.find((p) => p.phone === staff.phone);
          if (person) {
            seeded.push({
              personId: person.id,
              caseId: kase.id,
              since: staff.since,
              addedBy: staff.addedBy,
            });
          }
        }
      }
      if (seeded.length) {
        setDirectGrants((current) => [
          ...current,
          ...seeded.filter(
            (g) => !current.some((c) => c.personId === g.personId && c.caseId === g.caseId),
          ),
        ]);
      }
    },
    [cases],
  );

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

  const grantDirect = React.useCallback(
    (personId: string, caseIds: string[]) => {
      const today = displayToday();
      const granted: DirectoryCase[] = [];
      const sentToSign: Array<{ kase: DirectoryCase; holder: string }> = [];
      for (const id of caseIds) {
        const kase = cases.find((c) => c.id === id);
        if (!kase) continue;
        if (kase.viewer.kind === "office") {
          if (!pending.some((r) => r.kind === "grant-person" && r.personId === personId && r.caseId === id)) {
            sentToSign.push({ kase, holder: kase.viewer.via });
          }
        } else granted.push(kase);
      }
      setDirectGrants((current) => {
        const have = new Set(current.filter((g) => g.personId === personId).map((g) => g.caseId));
        const fresh = granted.filter((c) => !have.has(c.id));
        return [...current, ...fresh.map((c) => ({ personId, caseId: c.id, since: today }))];
      });
      if (sentToSign.length) {
        setPending((current) => [
          ...current,
          ...sentToSign.map(({ kase, holder }) => ({
            id: nextId("req"),
            kind: "grant-person" as const,
            personId,
            caseId: kase.id,
            holder,
            requestedOn: today,
          })),
        ]);
      }
      return { granted, sentToSign };
    },
    [cases, pending],
  );

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
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear
    }
  }, []);

  const value = React.useMemo<DirectoryContextValue>(
    () => ({
      ready,
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
      ready,
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
