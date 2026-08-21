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
 *
 * Derivation is live; the *record* is not. What the advocate sees — the frame's state, the
 * queue's count, the submit gate — recomputes on every keystroke from the draft. What the
 * task's history receives is written only when a human act finishes: focus leaves the
 * field, typing pauses, a suggestion is accepted, or the corrections are submitted. A
 * history that gained a line per keystroke would be a log of the keyboard, not of the work.
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
  firstUnresolved,
  intendedResolution,
  sameResolution,
  targetKey,
} from "@/lib/tasks/defects";
import { useRoomInRem } from "@/hooks/use-min-width";
import { cn } from "@/lib/utils";
import { useFiling } from "@/lib/filing/store";
import { intakeSlot, readTarget, writeTarget } from "@/lib/filing/targets";
import type { StepId } from "@/lib/filing/types";
import { getStep } from "@/lib/filing/steps";
import type { Ctx } from "@/lib/tasks/transitions";
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
import {
  FilingChromeContext,
  TOP_BAR_HEIGHT,
  type FilingChromeValue,
} from "@/components/filing/chrome";
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

/**
 * The two side panes are sized in pixels, not rems, on purpose.
 *
 * Tailwind's breakpoints are viewport pixels and do not move with the root font size, but
 * `w-64` does — so at 200% text zoom the rails would each double while the ladder stayed
 * on three panes, and the page would scroll sideways. `ACCESSIBILITY.md` §10 and
 * `RESPONSIVE.md` rule 9 both forbid that. Held in pixels, the rails keep their width and
 * the centre column reflows, which is what zooming is for.
 */
const RAIL_W = 256;
const QUEUE_W = 320;
const QUEUE_W_XL = 384;

/** Room the three-pane and two-pane layouts need, measured in the page's own text. */
const RAIL_REM = 80;
const QUEUE_REM = 64;

/** How long typing has to stop before the act is written to the task's history. */
const COMMIT_QUIET_MS = 700;

/** The one primary action, sized by its words rather than clipping them. */
const SUBMIT_CLASS = "h-auto min-h-11 w-full whitespace-normal py-2 text-center";

function dueCue(task: Task): string | null {
  if (!task.dueAt) return null;
  return `Due ${longDate(task.dueAt)}`;
}

/**
 * Move focus to the thing the defect is about.
 *
 * "First enabled focusable in the frame" is not that: a field whose label carries a
 * tooltip puts the tip's icon button ahead of the input in the DOM, so the advocate who
 * clicked "Go to the field" landed on a help button. So the search is ordered — the
 * control the frame nominates, then a real form control inside it, and only then any
 * button, which is what a document row (Replace) legitimately offers.
 */
function focusTheControl(frame: HTMLElement): void {
  const scope = frame.querySelector<HTMLElement>("[data-defect-control]") ?? frame;
  const control =
    scope.querySelector<HTMLElement>("[data-defect-focus]:not([disabled])") ??
    scope.querySelector<HTMLElement>(
      "input:not([disabled]):not([type=hidden]), textarea:not([disabled]), select:not([disabled])"
    ) ??
    scope.querySelector<HTMLElement>("button:not([disabled])");
  control?.focus({ preventScroll: true });
}

export function CorrectionScreen({ task, kase }: { task: Task; kase: Case }) {
  const router = useRouter();
  const { draft, update } = useFiling();
  const { act, busy, online } = useTaskActions();

  const recorded = React.useMemo(() => task.returned?.defects ?? [], [task.returned]);
  const valueOf = React.useCallback(
    (defect: Defect) => readTarget(draft, defect.target),
    [draft]
  );

  /**
   * Reasons still being typed, by defect number. They live here rather than in the task
   * so a half-written sentence never reaches the history; the record catches up on commit.
   */
  const [reasons, setReasons] = React.useState<Record<number, string>>({});

  /**
   * The defects as the screen sees them: the task's record, with any reason still being
   * typed folded in. Every derivation below — the frames, the queue, the count, the gate —
   * reads this, so a disagreement counts the moment it is written rather than the moment
   * it is committed. `intendedResolution` is the same function the commit uses, so what is
   * shown and what will be recorded can never disagree.
   */
  const defects = React.useMemo(
    () =>
      recorded.map((d) => {
        const typed = reasons[d.n];
        if (typed === undefined) return d;
        const next = intendedResolution(d, readTarget(draft, d.target), typed, d.resolution?.at ?? "");
        return sameResolution(d.resolution, next) ? d : { ...d, resolution: next };
      }),
    [recorded, reasons, draft]
  );

  /* ── Where we are ────────────────────────────────────────────────── */

  const [step, setStep] = React.useState<StepId>(
    () => firstUnresolved(recorded, (d) => readTarget(draft, d.target))?.target.step ?? FALLBACK_STEP
  );
  const [activeDefect, setActiveDefect] = React.useState<number | null>(
    () => firstUnresolved(recorded, (d) => readTarget(draft, d.target))?.n ?? null
  );
  const [instanceRequest, setInstanceRequest] = React.useState<
    CorrectionValue["instanceRequest"]
  >(null);
  const [railOpen, setRailOpen] = React.useState(false);
  /**
   * The D11 ladder, measured in the page's own text rather than in viewport pixels: three
   * panes need ~80rem of room, the queue alone needs ~64rem. At 200% text zoom a 1280px
   * window is forty rem wide, so the rails fold to their sheet and the form keeps the
   * width — which is what stops "Case documents" becoming "Cas…".
   */
  const railColumn = useRoomInRem(RAIL_REM);
  const queueColumn = useRoomInRem(QUEUE_REM);
  const [queueOpen, setQueueOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const nonce = React.useRef(0);

  /** The reason for a defect: what is being typed, or what the record already holds. */
  const justificationOf = (defect: Defect) =>
    reasons[defect.n] ?? defect.resolution?.justification ?? "";

  /* ── Recording what was done ─────────────────────────────────────── */

  /**
   * The gap between what the task's record says and what the filing (plus any reason
   * typed) actually shows. Empty on every render where nothing has been done — which is
   * most of them, including every keystroke that only retypes the same conclusion.
   */
  const pending = React.useMemo<{ n: number; resolution: Resolution | undefined }[]>(() => {
    if (task.status === "awaiting-court") return [];
    const at = new Date().toISOString();
    const changes: { n: number; resolution: Resolution | undefined }[] = [];
    for (const defect of recorded) {
      let next: Resolution | undefined;
      if (defect.target.kind === "doc") {
        /* A replacement upload is the resolution; putting the original back undoes it. */
        const slot = intakeSlot(draft, defect.target.slotKey);
        const replaced = !!slot?.file && slot.file.id !== defect.valueAtReturn;
        next = replaced ? { how: "replaced", at, replacement: slot!.file! } : undefined;
      } else {
        const value = valueOf(defect);
        /* A target this draft cannot resolve is not evidence that nothing was done. */
        if (value === undefined) continue;
        next = intendedResolution(defect, value, justificationOf(defect), at);
      }
      if (!sameResolution(defect.resolution, next)) changes.push({ n: defect.n, resolution: next });
    }
    return changes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorded, draft, reasons, valueOf, task.status]);

  /**
   * Write the gap to the task — one dispatch, and one history line per defect actually
   * decided. Folding the writes into a single transition also keeps them consistent: each
   * `resolveDefect` is pure, so they compose on the same task rather than racing to
   * overwrite one another.
   */
  const commit = React.useCallback(() => {
    if (pending.length === 0) return;
    void act(task.id, (t, c: Ctx) =>
      pending.reduce((acc, ch) => resolveDefect(acc, c, ch.n, ch.resolution), t)
    );
  }, [act, pending, task.id]);

  /* So a timer and a blur handler both reach the latest one without re-subscribing. */
  const commitRef = React.useRef(commit);
  React.useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  /**
   * Set by an explicit action — accept, undo — which is a finished act the moment it is
   * clicked. It still waits for the next render, because the draft has to settle before
   * there is anything true to write.
   */
  const commitSoon = React.useRef(false);

  /**
   * Commit when typing stops. Blur commits too (see `onFrameBlur`), which is the usual
   * path; this catches the advocate who types a value and then reaches for the mouse
   * without leaving the field, and it is what keeps the record honest if the tab is closed.
   */
  React.useEffect(() => {
    if (pending.length === 0) return;
    const wait = commitSoon.current ? 0 : COMMIT_QUIET_MS;
    commitSoon.current = false;
    const id = window.setTimeout(() => commitRef.current(), wait);
    return () => window.clearTimeout(id);
  }, [pending]);

  /** Focus leaving a defect frame ends the act — write it now rather than on the timer. */
  const onFrameBlur = React.useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      commitRef.current();
    },
    []
  );

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
        focusTheControl(frame);
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

  /** Forget a reason that is being typed — after an undo, or once a suggestion is taken. */
  const clearReason = (n: number) =>
    setReasons((prev) => {
      if (!(n in prev)) return prev;
      const next = { ...prev };
      delete next[n];
      return next;
    });

  const frameActions = (defect: Defect): FrameActions => ({
    accept: defect.suggestion
      ? () => {
          const to = defect.suggestion!.to;
          update((d) => writeTarget(d, defect.target, to));
          clearReason(defect.n);
          setActiveDefect(defect.n);
          commitSoon.current = true;
        }
      : undefined,
    undo: defect.resolution
      ? () => {
          if (defect.target.kind === "field") {
            update((d) => writeTarget(d, defect.target, defect.valueAtReturn ?? ""));
          }
          clearReason(defect.n);
          commitSoon.current = true;
        }
      : undefined,
    justification: justificationOf(defect),
    onJustificationChange: (text) =>
      setReasons((prev) => ({ ...prev, [defect.n]: text })),
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
        onBlurCapture={onFrameBlur}
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
        onBlurCapture={onFrameBlur}
      >
        {row}
      </DefectFrame>
    ),
  };

  /* ── Submitting ──────────────────────────────────────────────────── */

  const back = `/tasks?task=${encodeURIComponent(task.id)}`;
  /**
   * Anything still uncommitted goes in *with* the re-filing, in one transition: `refile`
   * reads the resolutions off the task, so a reason typed a second before the click has to
   * be on the task before `refile` looks at it — two dispatches would race.
   */
  const submit = async () => {
    setConfirm(false);
    const done = await act(task.id, (t, c: Ctx) =>
      refile(pending.reduce((acc, ch) => resolveDefect(acc, c, ch.n, ch.resolution), t), c)
    );
    if (done) router.push(back);
  };

  const reason = submitReason(resolved, total, online);
  const stepTitle = getStep(step).title;

  /*
   * The correction screen is a filing chrome host in its own right: it owns the sections
   * rail's open state, and the source rail (rendered deep inside a section) reads this
   * context. Nothing here folds the main nav — that rail is not part of this screen.
   */
  const chrome: FilingChromeValue = React.useMemo(
    () => ({
      sectionsOpen: true,
      setSectionsOpen: () => undefined,
      sectionsSheetOpen: railOpen,
      setSectionsSheetOpen: setRailOpen,
      foldNav: () => undefined,
      draftLabel: null,
      setDraftLabel: () => undefined,
    }),
    [railOpen]
  );

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
        /* The label wraps rather than clipping: at 200% text zoom "Submit corrections to
           scrutiny" does not fit one line in any pane this screen has, and a button
           reading "Submit corrections to scru…" is the loss of content
           `ACCESSIBILITY.md` §10 forbids. Height follows the words. */
        className={SUBMIT_CLASS}
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
    <FilingChromeContext.Provider value={chrome}>
    <CorrectionProvider value={correction}>
      {/*
       * The screen holds the viewport and each pane scrolls inside it. Three panes that
       * scroll away with the page would leave the queue — the critical action — off
       * screen exactly when the form is long, and the queue is the spine of this screen.
       */}
      <div
        style={{ height: `calc(100svh - ${TOP_BAR_HEIGHT})` }}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {/* Chrome: the page header states the return, the clock, and the count. */}
        <header className="z-30 flex shrink-0 flex-col gap-2 border-b border-hairline bg-card px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Button asChild variant="ghost" size="xs" className="self-start text-muted-foreground">
            <Link href={back}>
              <ArrowLeftIcon data-icon="inline-start" aria-hidden />
              Back to tasks
            </Link>
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
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
            {railColumn ? null : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRailOpen(true)}
                aria-haspopup="dialog"
                className="shrink-0"
              >
                <PanelLeftIcon data-icon="inline-start" aria-hidden />
                Sections
              </Button>
            )}
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1">
          {/* Left — every section, with the defect counts. A column where there is room
              for one; the same list in a sheet where there is not. */}
          {railColumn ? (
            <aside
              aria-label="Sections"
              style={{ width: RAIL_W }}
              className="flex shrink-0 flex-col overflow-y-auto border-r border-hairline bg-sidebar py-4"
            >
              <SectionRail step={step} countFor={countFor} onSelect={setStep} />
            </aside>
          ) : null}

          {/* Centre — the section, in correction posture. */}
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-6 sm:px-6">
            <div className="flex w-full min-w-0 max-w-4xl flex-col gap-6">
              <Alert>
                <LockIcon aria-hidden />
                <AlertTitle>This is a correction round, not an edit round</AlertTitle>
                {/* States the lock without promising an unlock: nothing in the product
                    docs says an unflagged field reopens, or when. */}
                <AlertDescription>
                  Only the fields scrutiny flagged can be changed. Everything else in{" "}
                  {stepTitle.toLowerCase()} is locked for this correction round.
                </AlertDescription>
              </Alert>
              <SectionBody step={step} />
            </div>
          </main>

          {/* Right — the queue. A column where it fits; a drawer and a sticky bar below. */}
          {queueColumn ? (
            <aside
              aria-label="Resolution queue"
              style={{ width: railColumn ? QUEUE_W_XL : QUEUE_W }}
              className="flex shrink-0 flex-col overflow-hidden border-l border-hairline bg-sidebar"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
                <h2 className="text-title-s font-semibold text-foreground">Resolution queue</h2>
                <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">{queueBody}</ScrollArea>
              </div>
              <div className="border-t border-hairline p-4">{submitBlock}</div>
            </aside>
          ) : null}
        </div>

        {/* With the queue folded away it is still the critical action, so it keeps a
            persistent bar — RESPONSIVE.md rule 7: never hide a critical action. */}
        <div
          className={cn(
            "z-30 shrink-0 flex-col gap-3 border-t border-hairline bg-card p-4",
            queueColumn ? "hidden" : "flex"
          )}
        >
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
            className={SUBMIT_CLASS}
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
            {/* The progress line below is the count; §6 cut the second counter that can
                disagree with the first, so this says what to do, not how many. */}
            <DrawerDescription className="text-body-compact">
              Open a defect to go to its field.
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
              {`All ${total} defect${total === 1 ? "" : "s"} go back to the Registry as corrected. `}
              In the live service a re-submission cannot be recalled, and limitation runs
              from the Registry&apos;s receipt.
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
    </FilingChromeContext.Provider>
  );
}
