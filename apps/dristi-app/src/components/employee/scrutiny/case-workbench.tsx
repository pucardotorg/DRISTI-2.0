"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, PencilIcon, TriangleAlertIcon } from "lucide-react";

import { CASE, HISTORY_ROUND } from "@/lib/employee/scrutiny/history";
import { ALL_FIELDS, FIELD_BY_ID } from "@/lib/employee/scrutiny/sections";
import type { Rect } from "@/lib/employee/scrutiny/types";
import { useScrutinyState } from "@/lib/employee/scrutiny/use-scrutiny-state";
import {
  BundleView,
  type BundleHandle,
} from "@/components/employee/scrutiny/bundle-view";
import { ChecksPopover } from "@/components/employee/scrutiny/checks-popover";
import {
  FieldsPanel,
  type FieldsPanelHandle,
} from "@/components/employee/scrutiny/fields-panel";
import { HistorySheet } from "@/components/employee/scrutiny/history-sheet";
import {
  ReviewDialog,
  type Decision,
} from "@/components/employee/scrutiny/review-dialog";
import { IndexRail } from "@/components/employee/scrutiny/index-rail";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * The case review: filed fields on the left, the bundle in the centre, the document
 * index on the right, and the decision along the bottom.
 *
 * The three panes are one `ResizablePanelGroup` rather than the hand-rolled pointer
 * dividers the prototype used — the DS ships that primitive, and it brings the keyboard
 * resize and the ARIA separator semantics with it. `horizontal` is the group's default
 * orientation, so it is not restated here. Note that v4 of the underlying library
 * dropped `autoSaveId`: pane widths reset on reload, where the prototype persisted them
 * to localStorage. Worth restoring behind `onLayoutChange` if officers miss it.
 */
export function CaseWorkbench({
  filingNo,
  aiOn = true,
}: {
  filingNo: string;
  /** With AI off the workbench still works; it just stops asserting readings. */
  aiOn?: boolean;
}) {
  const router = useRouter();
  const controller = useScrutinyState(aiOn);
  const bundle = React.useRef<BundleHandle>(null);
  const fields = React.useRef<FieldsPanelHandle>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<Decision | null>(null);

  // The case title is the officer's to correct (a mis-spelt party name is exactly the
  // kind of thing scrutiny exists to catch). Local until a case service owns it.
  const [title, setTitle] = React.useState({
    complainant: CASE.complainant,
    accused: CASE.accused,
  });
  const [editingTitle, setEditingTitle] = React.useState(false);

  const goToDoc = React.useCallback(
    (docId: string) => bundle.current?.goToDoc(docId),
    [],
  );

  /** Selecting a field scrolls the bundle to the page it was read from. */
  React.useEffect(() => {
    const field = controller.selectedId
      ? FIELD_BY_ID[controller.selectedId]
      : null;
    const target = field?.doc ?? field?.thumb ?? field?.docrow;
    if (target) goToDoc(target);
  }, [controller.selectedId, goToDoc]);

  const selected = controller.selectedId
    ? FIELD_BY_ID[controller.selectedId]
    : null;
  const relatedDocId = selected
    ? (selected.doc ?? selected.thumb ?? selected.docrow ?? null)
    : null;
  const spot: { doc: string; rect: Rect } | null =
    selected?.region && relatedDocId
      ? { doc: relatedDocId, rect: selected.region }
      : null;

  /** A history item is a way back into the work, not a dead record. */
  const goToItem = React.useCallback(
    (fieldId: string) => {
      if (!FIELD_BY_ID[fieldId]) return;
      controller.selectField(fieldId);
      requestAnimationFrame(() => fields.current?.scrollToRow(fieldId));
    },
    [controller],
  );

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (controller.composeField) controller.closeComposer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [controller]);

  const corrections = ALL_FIELDS.filter(
    (f) => controller.flags[f.id]?.correction,
  ).length;
  const flagged = ALL_FIELDS.filter(
    (f) => controller.flags[f.id] && !controller.flags[f.id].correction,
  ).length;
  const raised = corrections + flagged;

  const tally = [
    corrections && `${corrections} correction${corrections > 1 ? "s" : ""}`,
    flagged && `${flagged} flag${flagged > 1 ? "s" : ""}`,
  ].filter(Boolean) as string[];

  return (
    /*
     * The court chrome scopes its `TooltipProvider` to the rail, so a screen that uses
     * tooltips brings its own. The bundle's zoom controls are the ones that need it.
     */
    <TooltipProvider>
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-start gap-3 border-b border-hairline bg-card px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {editingTitle ? (
            <TitleEditor
              value={title}
              onCancel={() => setEditingTitle(false)}
              onSave={(next) => {
                setTitle(next);
                setEditingTitle(false);
              }}
            />
          ) : (
            <div className="flex items-center gap-1">
              <h1 className="text-title-s font-semibold">
                {title.complainant}{" "}
                <span className="font-normal text-muted-foreground">v.</span>{" "}
                {title.accused}
              </h1>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                aria-label="Edit case title"
                onClick={() => setEditingTitle(true)}
              >
                <PencilIcon />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-body-compact text-muted-foreground">
            {/* The trail stops at the queue, so the filing number is named here — it is
                how the officer knows which of the queue's rows they are inside. */}
            <span className="tabular-nums">{filingNo}</span>
            <span aria-hidden="true">·</span>
            <span>{CASE.submitted}</span>
            <span aria-hidden="true">·</span>
            <span>{CASE.advocate}</span>
          </div>
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-3">
          {/* The round count does triage work at rest; the button opens the detour. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <ClockIcon />
            Case history · round {HISTORY_ROUND}
          </Button>
          <ChecksPopover />
        </div>
      </div>

      {/* A standing condition, not feedback on an action → Banner. */}
      {aiOn ? null : (
        <Banner variant="warning">
          <TriangleAlertIcon />
          <div className="min-w-0 flex-1 leading-snug">
            AI assistance unavailable — no document readings or consistency checks
            on this file.
          </div>
        </Banner>
      )}

      <ResizablePanelGroup className="min-h-0 flex-1">
        <ResizablePanel defaultSize="34%" minSize="24%" className="flex flex-col">
          <FieldsPanel
            ref={fields}
            controller={controller}
            aiOn={aiOn}
            onGoToDoc={goToDoc}
            onGoToItem={goToItem}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="49%" minSize="30%">
          <BundleView
            ref={bundle}
            controller={controller}
            aiOn={aiOn}
            spot={spot}
            onOpenFlag={goToItem}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="17%" minSize="12%" maxSize="26%">
          <IndexRail
            flags={controller.flags}
            relatedDocId={aiOn ? relatedDocId : null}
            onGoToDoc={goToDoc}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="flex shrink-0 items-center gap-4 border-t border-hairline bg-card px-4 py-2.5">
        {/*
         * The one place the raised count lives (the section tabs no longer carry
         * numbers). Red because it is the officer's own error tally, and it has to
         * be findable from anywhere on the screen.
         */}
        <span className="text-caption text-muted-foreground">
          {tally.length > 0 ? (
            <>
              {tally.map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 ? " · " : null}
                  <b className="font-semibold text-destructive-ink">{t}</b>
                </React.Fragment>
              ))}
              {` for ${CASE.advocate}`}
            </>
          ) : null}
        </span>
        <span className="flex-1" />
        {raised > 0 ? (
          <Button variant="outline" onClick={() => setDecision("send-back")}>
            Send back to advocate
          </Button>
        ) : null}
        <Button onClick={() => setDecision("register")}>Register case</Button>
      </div>

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onGoToItem={goToItem}
      />
      <ReviewDialog
        decision={decision}
        flags={controller.flags}
        onGoToItem={goToItem}
        onOpenChange={(open) => !open && setDecision(null)}
        onDone={() => {
          setDecision(null);
          controller.reset();
          router.push("/employee/scrutiny");
        }}
      />
    </div>
    </TooltipProvider>
  );
}

/**
 * Inline edit of the two party names. Enter saves, Escape cancels, and the fields are
 * plain DS inputs — no dialog for a two-word change.
 */
function TitleEditor({
  value,
  onSave,
  onCancel,
}: {
  value: { complainant: string; accused: string };
  onSave: (next: { complainant: string; accused: string }) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const complainantRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    complainantRef.current?.focus();
    complainantRef.current?.select();
  }, []);

  function commit() {
    const complainant = draft.complainant.trim();
    const accused = draft.accused.trim();
    if (!complainant || !accused) return onCancel();
    onSave({ complainant, accused });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        ref={complainantRef}
        aria-label="Complainant"
        className="w-56"
        value={draft.complainant}
        onChange={(event) =>
          setDraft((d) => ({ ...d, complainant: event.target.value }))
        }
        onKeyDown={onKeyDown}
      />
      <span className="text-body-compact text-muted-foreground">v.</span>
      <Input
        aria-label="Accused"
        className="w-56"
        value={draft.accused}
        onChange={(event) =>
          setDraft((d) => ({ ...d, accused: event.target.value }))
        }
        onKeyDown={onKeyDown}
      />
      <Button size="sm" onClick={commit}>
        Save title
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
