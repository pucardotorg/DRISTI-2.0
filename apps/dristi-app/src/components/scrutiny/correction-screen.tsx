"use client";

/**
 * Scrutiny return — the correction round.
 *
 * The filing came back from the Registry with defects; this is where the advocate sees
 * exactly what was flagged, fixes it *in the filing itself*, and submits the corrections.
 * It is the e-filing form re-entered in a correction posture (brief D2), not a second
 * form: same steps, same section components, same validation. Three panes — the sections,
 * the section, the resolution queue — with the queue as the spine (D5).
 *
 * The two rules that shape everything else:
 *
 *   · **Nothing unflagged can be edited** (D3, owner's answer to O5). A correction round
 *     is not an edit round, and the reason is stated as text in each section rather than
 *     hidden in a tooltip on a dead control.
 *   · **Resolved is derived, never certified** (D6). The screen reconciles each defect's
 *     recorded resolution against what the filing actually holds — see `lib/tasks/defects`
 *     — so nothing counts because someone ticked it.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  LockIcon,
  PanelLeftIcon,
  ListChecksIcon,
  SendIcon,
} from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import {
  allResolved,
  countResolved,
  editedResolution,
  firstUnresolved,
  targetKey,
} from "@/lib/tasks/defects";
import { useFiling } from "@/lib/filing/store";
import { intakeSlot, readTarget, writeTarget } from "@/lib/filing/targets";
import type { StepId } from "@/lib/filing/types";
import { getStep } from "@/lib/filing/steps";
import { refile, resolveDefect } from "@/lib/tasks/transitions";
import type { Case, Defect, Resolution, Task } from "@/lib/tasks/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CorrectionProvider, type CorrectionValue } from "@/components/filing/posture";
import { DefectFrame, type FrameActions } from "@/components/scrutiny/defect-frame";
import {
  QueueProgress,
  ResolutionQueue,
  submitReason,
  type QueueDefect,
} from "@/components/scrutiny/resolution-queue";
import { SectionRail } from "@/components/scrutiny/section-rail";
import { SectionBody } from "@/components/scrutiny/section-body";
import { useTaskActions } from "@/components/tasks/use-task-actions";

/** Where the correction round starts when nothing is flagged on a step yet. */
const FALLBACK_STEP: StepId = "cheque";

function dueCue(task: Task): string | null {
  if (!task.dueAt) return null;
  return `Due ${longDate(task.dueAt)}`;
}

export function CorrectionScreen({ task, kase }: { task: Task; kase: Case }) {
  const router = useRouter();
  const { draft, update } = useFiling();
  const { act, busy, online } = useTaskActions();

  const defects = React.useMemo(() => task.returned?.defects ?? [], [task.returned]);
  const valueOf = React.useCallback(
    (defect: Defect) => readTarget(draft, defect.target),
    [draft]
  );

  /* ── Where we are ────────────────────────────────────────────────── */

  const [step, setStep] = React.useState<StepId>(
    () => firstUnresolved(defects, (d) => readTarget(draft, d.target))?.target.step ?? FALLBACK_STEP
  );
  const [activeDefect, setActiveDefect] = React.useState<number | null>(
    () => firstUnresolved(defects, (d) => readTarget(draft, d.target))?.n ?? null
  );
  const [instanceRequest, setInstanceRequest] = React.useState<
    CorrectionValue["instanceRequest"]
  >(null);
  const [railOpen, setRailOpen] = React.useState(false);
  const [queueOpen, setQueueOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const nonce = React.useRef(0);

  /** Justifications are typed continuously; the task record is written on each change. */
  const justificationOf = (defect: Defect) => defect.resolution?.justification ?? "";

  /* ── Recording what was done ─────────────────────────────────────── */

  const record = React.useCallback(
    (defect: Defect, resolution: Resolution | undefined) =>
      void act(task.id, (t, c) => resolveDefect(t, c, defect.n, resolution)),
    [act, task.id]
  );

  /**
   * Keep the task's record in step with the filing.
   *
   * The advocate edits the *form*, not this screen's own controls, so the resolution has
   * to follow the draft: a value put back the way scrutiny saw it clears the record, a
   * value that matches the suggestion is an acceptance, anything else is an edit — and it
   * keeps whatever justification has already been written. Guarded so it only dispatches
   * when the conclusion actually changes.
   */
  React.useEffect(() => {
    if (task.status === "awaiting-court") return;
    for (const defect of defects) {
      const value = valueOf(defect);

      if (defect.target.kind === "doc") {
        /* A replacement upload is the resolution; putting the original back undoes it. */
        const slot = intakeSlot(draft, defect.target.slotKey);
        const replaced = !!slot?.file && slot.file.id !== defect.valueAtReturn;
        if (replaced && defect.resolution?.replacement?.id !== slot!.file!.id) {
          record(defect, {
            how: "replaced",
            at: new Date().toISOString(),
            replacement: slot!.file!,
          });
        } else if (!replaced && defect.resolution) {
          record(defect, undefined);
        }
        continue;
      }

      if (value === undefined) continue;
      const current = defect.resolution;
      const unchanged = value.trim() === (defect.valueAtReturn ?? "").trim();

      if (unchanged) {
        if (current) record(defect, undefined);
        continue;
      }
      const how: Resolution["how"] =
        defect.suggestion && value.trim() === defect.suggestion.to.trim() ? "accepted" : "edited";
      if (current?.how === how && current.value === value) continue;
      record(
        defect,
        how === "accepted"
          ? { how, value, at: new Date().toISOString() }
          : editedResolution(value, current?.justification, new Date().toISOString())
      );
    }
  }, [defects, valueOf, record, task.status, draft]);

  /* ── Navigating to a defect ──────────────────────────────────────── */

  const openDefect = React.useCallback(
    (n: number) => {
      const defect = defects.find((d) => d.n === n);
      if (!defect) {
        setActiveDefect(null);
        return;
      }
      setActiveDefect(n);
      setStep(defect.target.step);
      setQueueOpen(false);
      if (defect.target.kind === "field" && defect.target.instance !== undefined) {
        nonce.current += 1;
        setInstanceRequest({
          step: defect.target.step,
          instance: defect.target.instance,
          nonce: nonce.current,
        });
      }
      /* Focus, not scroll: the queue has to work for a keyboard and a screen reader, and
         a scroll-only jump is a mouse affordance wearing navigation's clothes. */
      window.setTimeout(() => {
        const frame = document.getElementById(`defect-${n}`);
        if (!frame) return;
        frame.scrollIntoView({ block: "center", behavior: "smooth" });
        const control = frame.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])"
        );
        control?.focus({ preventScroll: true });
      }, 120);
    },
    [defects]
  );

  /* ── Progress and the gate ───────────────────────────────────────── */

  const { resolved, total } = countResolved(defects, valueOf);
  const complete = allResolved(defects, valueOf);
  const items: QueueDefect[] = defects.map((defect) => ({ defect, value: valueOf(defect) }));
  const countFor = React.useCallback(
    (id: StepId) => defects.filter((d) => d.target.step === id).length,
    [defects]
  );

  /* ── The frames the form renders in place of a flagged field ─────── */

  const frameActions = (defect: Defect): FrameActions => ({
    accept: defect.suggestion
      ? () => {
          const to = defect.suggestion!.to;
          update((d) => writeTarget(d, defect.target, to));
          setActiveDefect(defect.n);
        }
      : undefined,
    undo: defect.resolution
      ? () => {
          if (defect.target.kind === "field") {
            update((d) => writeTarget(d, defect.target, defect.valueAtReturn ?? ""));
          }
          record(defect, undefined);
        }
      : undefined,
    justification: justificationOf(defect),
    onJustificationChange: (text) => {
      const value = valueOf(defect) ?? "";
      record(defect, editedResolution(value, text, new Date().toISOString()));
    },
  });

  const correction: CorrectionValue = {
    step,
    defectAt: (s, instance, field) =>
      defects.find(
        (d) =>
          d.target.kind === "field" &&
          d.target.step === s &&
          (d.target.instance ?? 0) === instance &&
          d.target.field === field
      ) ?? null,
    defectForSlot: (s, slotKey) =>
      defects.find(
        (d) => d.target.kind === "doc" && d.target.step === s && d.target.slotKey === slotKey
      ) ?? null,
    valueOf,
    resolve: record,
    activeDefect,
    setActiveDefect,
    instanceRequest,
    renderFieldDefect: (defect, control) => (
      <DefectFrame
        key={targetKey(defect.target)}
        defect={defect}
        value={valueOf(defect)}
        active={activeDefect === defect.n}
        actions={frameActions(defect)}
        onFocusCapture={() => setActiveDefect(defect.n)}
      >
        {control}
      </DefectFrame>
    ),
    renderDocDefect: (defect, row) => (
      <DefectFrame
        key={targetKey(defect.target)}
        defect={defect}
        value={valueOf(defect)}
        active={activeDefect === defect.n}
        actions={frameActions(defect)}
        onFocusCapture={() => setActiveDefect(defect.n)}
      >
        {row}
      </DefectFrame>
    ),
  };

  /* ── Submitting ──────────────────────────────────────────────────── */

  const back = `/tasks?task=${encodeURIComponent(task.id)}`;
  const submit = async () => {
    setConfirm(false);
    const done = await act(task.id, refile);
    if (done) router.push(back);
  };

  const reason = submitReason(resolved, total, online);
  const stepTitle = getStep(step).title;

  /* ── The panes ───────────────────────────────────────────────────── */

  const queueBody = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <QueueProgress resolved={resolved} total={total} />
      <ResolutionQueue items={items} activeDefect={activeDefect} onOpenDefect={openDefect} />
    </div>
  );

  const submitBlock = (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!complete || !online || !!busy}
        onClick={() => setConfirm(true)}
      >
        <SendIcon data-icon="inline-start" aria-hidden />
        Submit corrections to scrutiny
      </Button>
      <p className="text-caption text-muted-foreground">{reason}</p>
    </div>
  );

  return (
    <CorrectionProvider value={correction}>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        {/* Chrome: the page header states the return, the clock, and the count. */}
        <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-hairline bg-card px-4 py-4 sm:px-6">
          <Button asChild variant="ghost" size="xs" className="self-start text-muted-foreground">
            <Link href={back}>
              <ArrowLeftIcon data-icon="inline-start" aria-hidden />
              Back to tasks
            </Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-title font-semibold tracking-tight text-foreground">
                Scrutiny return
              </h1>
              <p className="text-body-compact text-muted-foreground">
                {kase.parties}
                {kase.stNumber ? (
                  <>
                    {" · "}
                    <span className="font-mono tabular-nums">{kase.stNumber}</span>
                  </>
                ) : (
                  " · Not yet numbered"
                )}
                {" · "}
                {kase.court}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                <span className="tabular-nums">
                  Returned by scrutiny on {task.returned ? longDate(task.returned.at) : "—"}
                </span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {total} defect{total === 1 ? "" : "s"} · {resolved} resolved
                </span>
                {dueCue(task) ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="flex items-center gap-1 text-warning-ink tabular-nums">
                      <ClockIcon className="size-4" aria-hidden />
                      {dueCue(task)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2 xl:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRailOpen(true)}
                aria-haspopup="dialog"
                className="lg:hidden"
              >
                <PanelLeftIcon data-icon="inline-start" aria-hidden />
                Sections
              </Button>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1">
          {/* Left — every section, with the defect counts. A column from `lg`. */}
          <aside
            aria-label="Sections"
            className="hidden w-64 shrink-0 flex-col self-stretch overflow-y-auto border-r border-hairline bg-sidebar py-4 lg:flex"
          >
            <SectionRail step={step} countFor={countFor} onSelect={setStep} />
          </aside>

          {/* Centre — the section, in correction posture. */}
          <main className="flex min-w-0 flex-1 flex-col px-4 pb-24 pt-6 sm:px-6 xl:pb-8">
            <div className="flex w-full min-w-0 max-w-4xl flex-col gap-6">
              <Alert>
                <LockIcon aria-hidden />
                <AlertTitle>This is a correction round, not an edit round</AlertTitle>
                <AlertDescription>
                  Only the fields scrutiny flagged can be changed. Everything else in{" "}
                  {stepTitle.toLowerCase()} is locked until the Registry accepts the filing.
                </AlertDescription>
              </Alert>
              <SectionBody step={step} />
            </div>
          </main>

          {/* Right — the queue. A column from `xl`; a drawer below it. */}
          <aside
            aria-label="Resolution queue"
            className="hidden w-96 shrink-0 flex-col self-stretch border-l border-hairline bg-sidebar xl:flex"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
              <h2 className="text-title-s font-semibold text-foreground">Resolution queue</h2>
              <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">{queueBody}</ScrollArea>
            </div>
            <div className="border-t border-hairline p-4">{submitBlock}</div>
          </aside>
        </div>

        {/* Below xl the queue is the critical action, so it gets a persistent bar —
            RESPONSIVE.md rule 7: never hide a critical action. */}
        <div className="sticky bottom-0 z-30 flex flex-col gap-3 border-t border-hairline bg-card p-4 xl:hidden">
          <div className="flex items-center gap-3">
            <QueueProgress resolved={resolved} total={total} className="min-w-0 flex-1" />
            <Button type="button" variant="outline" onClick={() => setQueueOpen(true)}>
              <ListChecksIcon data-icon="inline-start" aria-hidden />
              Open the queue
            </Button>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!complete || !online || !!busy}
            onClick={() => setConfirm(true)}
          >
            <SendIcon data-icon="inline-start" aria-hidden />
            Submit corrections to scrutiny
          </Button>
          <p className="text-caption text-muted-foreground">{reason}</p>
        </div>
      </div>

      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-title-s font-semibold">Sections</SheetTitle>
            <SheetDescription className="text-body-compact">
              Every part of this filing. The count shows what scrutiny flagged there.
            </SheetDescription>
          </SheetHeader>
          <div className="pb-6">
            <SectionRail
              step={step}
              countFor={countFor}
              onSelect={(id) => {
                setStep(id);
                setRailOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Drawer open={queueOpen} onOpenChange={setQueueOpen}>
        <DrawerContent className="max-h-[85svh]">
          <DrawerHeader>
            <DrawerTitle className="text-title-s font-semibold">Resolution queue</DrawerTitle>
            <DrawerDescription className="text-body-compact">
              {resolved} of {total} resolved. Open a defect to go to its field.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{queueBody}</div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit these corrections to scrutiny?</AlertDialogTitle>
            <AlertDialogDescription>
              All {total} defects go back to the Registry as corrected. In the live service
              a re-submission cannot be recalled, and limitation runs from the Registry&apos;s
              receipt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>
              Submit corrections
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CorrectionProvider>
  );
}
