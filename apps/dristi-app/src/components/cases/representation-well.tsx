"use client";

/**
 * An advocate's well in the Parties detail pane, with the removal entry
 * point (scenarios 3a/3b) riding on it: you act on the person where you
 * see them. The well matches the pane's other fact wells; Remove is the
 * row's one action, destructive-ghost like the access list's rows, and
 * opens the shared removal flow.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CaseRef } from "@/components/cases/party-application";
import { RemoveAdvocateDialog } from "@/components/cases/remove-advocate-dialog";

export function RepresentationWell({
  advocate,
  partyName,
  caseRef,
}: {
  advocate: string;
  /** The litigant this pane belongs to, for the dialog's copy. */
  partyName: string;
  caseRef: CaseRef;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex min-h-12 min-w-0 items-center gap-2 rounded-md bg-surface-sunken py-2 pr-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">
          {advocate}
        </span>
        <Button
          type="button"
          variant="destructive-ghost"
          size="sm"
          className="shrink-0"
          onClick={() => setOpen(true)}
        >
          Remove
        </Button>
      </div>
      <RemoveAdvocateDialog
        open={open}
        onOpenChange={setOpen}
        advocateName={advocate}
        partyName={partyName}
        caseRef={caseRef}
      />
    </>
  );
}
