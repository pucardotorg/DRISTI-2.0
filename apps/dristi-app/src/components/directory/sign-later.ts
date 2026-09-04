"use client";

import * as React from "react";

import { displayName, normalizeName } from "@/lib/directory/derive";
import type { DirectoryCase } from "@/lib/directory/types";
import { newId } from "@/lib/tasks/data";
import { useTasks } from "@/lib/tasks/store";
import type { Task } from "@/lib/tasks/types";

/**
 * Sign-later, the one primitive: an act the viewer can author but not sign,
 * because they hold only office access on the case, becomes a review task
 * for the vakalatnama holder who gave them that access. Nothing changes
 * until that person signs. The same seam serves a removal and a grant.
 */

export type SignLaterRequest =
  | { kind: "remove"; personName: string; kase: DirectoryCase; holder: string; note?: string }
  | { kind: "grant-group"; groupName: string; people: number; kase: DirectoryCase; holder: string }
  | { kind: "grant-person"; personName: string; kase: DirectoryCase; holder: string };

export function useSignLater() {
  const { user, people, cases, createTask } = useTasks();

  return React.useCallback(
    (request: SignLaterRequest) => {
      const holderKey = normalizeName(request.holder);
      const holder = people.find((p) => normalizeName(p.name) === holderKey);
      // The tasks world only knows the cases it seeds; a case it lacks still
      // records the request in the directory, just without a task row.
      if (!cases.some((c) => c.id === request.kase.id)) return;
      const now = new Date().toISOString();
      const holderName = displayName(request.holder);
      const caseTitle = request.kase.title;

      const title =
        request.kind === "remove"
          ? `Sign the removal of ${displayName(request.personName)} from the case`
          : request.kind === "grant-group"
            ? `Sign office access for ${request.groupName} on the case`
            : `Sign office access for ${displayName(request.personName)} on the case`;
      const event =
        request.kind === "remove"
          ? `${user.name} authored a removal on ${caseTitle} and asked you to sign it`
          : `${user.name} asked you to sign office access on ${caseTitle}`;
      const whatToDo =
        request.kind === "remove"
          ? `${user.name} holds office access on this case and cannot finalize a removal. ${displayName(request.personName)} keeps access until you sign.${request.note ? ` Their note: ${request.note}` : ""}`
          : request.kind === "grant-group"
            ? `${user.name} wants the group ${request.groupName} (${request.people} people) to have office access to this case. Nothing is granted until you sign.`
            : `${user.name} wants ${displayName(request.personName)} to have office access to this case. Nothing is granted until you sign.`;

      const task: Task = {
        id: newId("t-sign"),
        caseId: request.kase.id,
        kind: "review",
        title,
        why: { event, at: now },
        whatToDo,
        dueKind: "none",
        isBlocking: false,
        createdAt: now,
        systemObservable: true,
        closesWhen: `Closes when ${holderName} signs or declines.`,
        status: "open",
        review: { requestedBy: user.id, of: holder?.id ?? user.id },
        history: [{ at: now, by: user.id, text: `Created — ${event}` }],
      };
      void createTask(task);
    },
    [user, people, cases, createTask],
  );
}
