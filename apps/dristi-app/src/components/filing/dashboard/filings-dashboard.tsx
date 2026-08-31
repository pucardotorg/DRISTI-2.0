"use client";

import * as React from "react";

import {
  draftRows,
  registeredRows,
  returnedRows,
  scrutinyRows,
  type QueueTab,
} from "@/lib/filing/queue";
import { firstNameOf, useProfile } from "@/lib/filing/profile";
import { useMounted } from "@/lib/filing/store";
import { useDrafts } from "@/lib/filing/use-drafts";
import { useTasks } from "@/lib/tasks/store";
import { DEMO_BATCH } from "@/lib/filing/demo-drafts";
import { ConfirmDialog } from "@/components/filing/confirm-dialog";

import { BulkImportCard } from "./bulk-import-card";
import { FilingsQueue, type QueueData } from "./filings-queue";
import { SandboxStrip } from "./sandbox-strip";
import { StartFilingCard } from "./start-filing-card";

/**
 * File a case — the entry to e-filing and the state of everything already filed.
 *
 * Two decisions shape this screen. The entry points sit above the fold and are the only
 * place a new filing starts; below them, one work queue answers "where has everything I
 * filed got to", with the status carried by the tab rather than repeated on every row.
 * Nothing here holds its own data: drafts, cases and returned-defect tasks all come from
 * the stores that already own them.
 */
export function FilingsDashboard() {
  const mounted = useMounted();
  const { profile } = useProfile();
  const { ready, error, readAt, drafts, filed, discard, reload } = useDrafts();
  const { tasks, cases: taskCases } = useTasks();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  // The batch is shown only when the sandbox strip asks for it: nothing in the app can
  // receive a client batch yet, so the card must not claim one on its own (W4).
  const [showBatch, setShowBatch] = React.useState(false);

  const showData = mounted && ready;
  const firstName = firstNameOf(profile?.name ?? "");
  const today = new Date(readAt).toISOString().slice(0, 10);

  const data = React.useMemo<QueueData>(
    () => ({
      drafts: draftRows(drafts),
      scrutiny: scrutinyRows(today),
      returned: returnedRows(tasks, taskCases),
      registered: registeredRows(today),
    }),
    [drafts, tasks, taskCases, today]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-title-l font-semibold tracking-tight text-foreground">
          {firstName ? `File a case, ${firstName}` : "File a case"}
        </h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          Start a new e-filing, import a batch from your client&apos;s system, or track
          what you have already filed.
        </p>
      </header>

      {error ? <p className="text-body text-destructive-ink">{error}</p> : null}

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <StartFilingCard filedCount={showData ? filed.length : null} />
        <BulkImportCard batch={showBatch ? DEMO_BATCH : null} />
      </div>

      {/* Gated on the drafts read only. Cases are a static import and the tasks store
          fills the "returned" tab whenever it finishes; waiting for all three would blank
          the whole table because one tab is not ready yet. */}
      <FilingsQueue data={data} ready={showData} onDiscard={setConfirmId} />

      <SandboxStrip
        batchLoaded={showBatch}
        onToggleBatch={() => setShowBatch((on) => !on)}
        onDraftsChanged={reload}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
        title="Discard this draft?"
        description="Everything entered and uploaded for this filing will be removed. This cannot be undone."
        confirmLabel="Discard draft"
        onConfirm={() => {
          if (confirmId) void discard(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}

export type { QueueTab };
