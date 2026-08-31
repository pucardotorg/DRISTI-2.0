"use client";

import * as React from "react";
import { FlaskConicalIcon } from "lucide-react";

import { clearDemoDrafts, loadDemoDrafts } from "@/lib/filing/demo-drafts";
import { Button } from "@/components/ui/button";

/**
 * SANDBOX — the one place this screen admits it has no backend.
 *
 * Deliberately plain and last on the page: it is a reviewing aid, not product chrome, so
 * it gets no panel, no tint and no icon larger than the text beside it. Nothing above it
 * changes when it is absent, which is the test for whether it has stayed out of the way.
 * Delete this file and `lib/filing/demo-drafts.ts` together once real data exists.
 */
export function SandboxStrip({
  batchLoaded,
  onToggleBatch,
  onDraftsChanged,
}: {
  batchLoaded: boolean;
  onToggleBatch: () => void;
  onDraftsChanged: () => void;
}) {
  const [busy, setBusy] = React.useState<"load" | "clear" | null>(null);

  async function run(which: "load" | "clear") {
    setBusy(which);
    try {
      if (which === "load") await loadDemoDrafts();
      else await clearDemoDrafts();
      onDraftsChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline pt-4 text-caption text-muted-foreground">
      <FlaskConicalIcon aria-hidden className="size-3.5 shrink-0" />
      <span className="flex-1 min-w-60">
        Sandbox — this screen has no backend yet. Sample drafts and a sample client batch
        are here so the states can be seen; they live only in this browser.
      </span>
      <Button variant="outline" size="sm" onClick={() => void run("load")} disabled={busy !== null}>
        {busy === "load" ? "Loading…" : "Load sample drafts"}
      </Button>
      <Button variant="ghost" size="sm" onClick={onToggleBatch}>
        {batchLoaded ? "Hide sample batch" : "Show sample batch"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void run("clear")} disabled={busy !== null}>
        {busy === "clear" ? "Clearing…" : "Clear samples"}
      </Button>
    </div>
  );
}
