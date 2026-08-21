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
import { useRouter } from "next/navigation";
import {
  CircleCheckIcon,
  ListChecksIcon,
  LockIcon,
  PanelLeftIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { longDate } from "@/lib/tasks/format";
import {
  allResolved,
  countResolved,
  firstUnresolved,
  formOrder,
  intendedResolution,
  sameResolution,
  targetKey,
} from "@/lib/tasks/defects";
import { useRoomInRem } from "@/hooks/use-min-width";
import { cn } from "@/lib/utils";
import { useFiling } from "@/lib/filing/store";
import { intakeSlot, readTarget, writeTarget } from "@/lib/filing/targets";
import type { StepId } from "@/lib/filing/types";
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
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
import { Breadcrumbs } from "@/components/shell/chrome";
import { CorrectionProvider, type CorrectionValue } from "@/components/filing/posture";
import { DefectCard, type DefectActions } from "@/components/scrutiny/defect-card";
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
 * The sections rail is sized in pixels, not rems, on purpose.
 *
 * Tailwind's breakpoints are viewport pixels and do not move with the root font size, but
 * `w-64` does — so at 200% text zoom the rail would double while the ladder stayed on three
 * panes, and the page would scroll sideways. `ACCESSIBILITY.md` §10 and `RESPONSIVE.md`
 * rule 9 both forbid that. Held in pixels, the rail keeps its width and the columns beside
 * it reflow, which is what zooming is for.
 *
 * The record and the corrections panel have no fixed width any more: they are a resizable
 * pair whose proportions the advocate sets (v3.2).
 */
const RAIL_W = 256;

/** Room the three-pane and two-pane layouts need, measured in the page's own text. */
const RAIL_REM = 80;
const QUEUE_REM = 64;

/** How long typing has to stop before the act is written to the task's history. */
const COMMIT_QUIET_MS = 700;

/** The one primary action, sized by its words rather than clipping them. */
const SUBMIT_CLASS = "h-auto min-h-11 w-full whitespace-normal py-2 text-center";

/**
 * Where the record / corrections handle was left, on this device.
 *
 * `react-resizable-panels` v4 dropped `autoSaveId` for an explicit
 * `defaultLayout` + `onLayoutChanged` pair, so the persistence is ours to do — which is
 * fine, and honest about the failure mode: a browser with storage denied simply opens on
 * the default split every time rather than throwing.
 */
const SPLIT_KEY = "dristi:scrutiny-return:split";

function readSplit(): Record<string, number> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(SPLIT_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    const layout = parsed as Record<string, unknown>;
    /* Only take it if it is the shape we wrote — a stale or hand-edited value should fall
       back to the default rather than laying the screen out from nonsense. */
    return Object.values(layout).every((v) => typeof v === "number" && v > 0)
      ? (layout as Record<string, number>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Move focus to the thing that answers the defect.
 *
 * Not the flagged control any more — that one is read-only now (§15.2), and landing a
 * keyboard user on a field they cannot type in is the trap R12 warns about. The target is
 * the inset's primary action: Accept where scrutiny offered a correction, otherwise the
 * value control or the Replace button the inset nominates with `data-defect-focus`. D5's
 * rule is unchanged — move focus, do not merely scroll; only its target moves.
 */
function focusTheAction(scope: HTMLElement): void {
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

  /* In form order, not the officer's numbering: the queue is an index of the form, so it
     reads the way the form's pages turn — Documents, Complainant, Cheque 1, Cheque 2 —
     and the screen opens on the first unresolved defect *of the form*, not of the memo. */
  const recorded = React.useMemo(
    () => [...(task.returned?.defects ?? [])].sort(formOrder),
    [task.returned]
  );
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

  /**
   * Focus leaving a defect — its field *and* its inset, which the layer works out — ends
   * the act, so the record is written now rather than on the quiet timer.
   */
  const onFrameBlur = React.useCallback(() => commitRef.current(), []);

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
      /*
       * Two things move, and they move to different places (v3.2).
       *
       * The *record* scrolls to the field, so the value under discussion is in view — but
       * focus does not go there any more: that control is read-only, and landing a keyboard
       * user on a field they cannot type in is the trap R12 warns about. Focus goes to the
       * card's own primary action in the panel, which is where the correction is made.
       */
      window.setTimeout(() => {
        const group = document.getElementById(`defect-${n}`);
        if (group) {
          /* Scroll the *pane*, never the page. `scrollIntoView` walks every scrollable
             ancestor, which drags the screen's own header and rail out of view — and this
             screen holds the viewport precisely so those stay put. */
          const pane = group.closest("main");
          if (pane && pane.scrollHeight > pane.clientHeight + 1) {
            const top = pane.scrollTop + group.getBoundingClientRect().top -
              pane.getBoundingClientRect().top - 24;
            pane.scrollTo({ top, behavior: "smooth" });
          } else {
            /* Below the fold the page is the scroller and the header scrolls with it, so
               there is nothing to drag out of view — and moving focus without moving the
               page would leave the advocate looking at the top of the form. */
            group.scrollIntoView({ block: "start", behavior: "smooth" });
          }
        }
        const card = document.querySelector<HTMLElement>("[data-defect-card]");
        if (card) focusTheAction(card);
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

  /* ── What the panel's card can do ────────────────────────────────── */

  /**
   * Pickers lent by the document slots on screen (v3.2). The card holds the Replace action
   * but the slot owns the upload, so it registers its own `onChoose` here.
   */
  const replacers = React.useRef(new Map<string, () => void>());
  const registerReplace = React.useCallback((slotKey: string, choose: () => void) => {
    replacers.current.set(slotKey, choose);
    return () => {
      if (replacers.current.get(slotKey) === choose) replacers.current.delete(slotKey);
    };
  }, []);
  const replaceFor = React.useCallback(
    (slotKey: string) => replacers.current.get(slotKey),
    []
  );

  /* ── Where the handle was left ───────────────────────────────────── */

  /**
   * Read once, on the client. Reading during render would hand the server a different
   * layout from the browser's and hydrate mismatched; reading in an effect would lay the
   * panes out at the default and then jump. `useState`'s initialiser runs on the client's
   * first render only, which is the moment that has both the storage and no paint yet.
   */
  const [savedLayout] = React.useState<Record<string, number> | undefined>(readSplit);
  const rememberLayout = React.useCallback((layout: Record<string, number>) => {
    try {
      window.localStorage.setItem(SPLIT_KEY, JSON.stringify(layout));
    } catch {
      /* Storage denied (private mode, quota): the split still works, it just forgets. */
    }
  }, []);

  /** Forget a reason that is being typed — after an undo, or once a suggestion is taken. */
  const clearReason = (n: number) =>
    setReasons((prev) => {
      if (!(n in prev)) return prev;
      const next = { ...prev };
      delete next[n];
      return next;
    });

  /**
   * Every write in a correction round goes through here — there is no other route. The
   * form's control is read-only, so the card's *Use <value>* and its own value control are
   * the only two things that can change a filed value, and both are named acts.
   */
  const defectActions = (defect: Defect): DefectActions => ({
    accept: defect.suggestion
      ? () => {
          const to = defect.suggestion!.to;
          update((d) => writeTarget(d, defect.target, to));
          clearReason(defect.n);
          setActiveDefect(defect.n);
          commitSoon.current = true;
        }
      : undefined,
    setValue: (value) => {
      update((d) => writeTarget(d, defect.target, value));
      setActiveDefect(defect.n);
    },
    undo: defect.resolution
      ? () => {
          if (defect.target.kind === "field") {
            update((d) => writeTarget(d, defect.target, defect.valueAtReturn ?? ""));
          }
          clearReason(defect.n);
          commitSoon.current = true;
        }
      : undefined,
    reason: justificationOf(defect),
    onReasonChange: (text) => setReasons((prev) => ({ ...prev, [defect.n]: text })),
    replace:
      defect.target.kind === "doc" ? replaceFor(defect.target.slotKey) : undefined,
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
    registerReplace,
    replaceFor,
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

  /**
   * The run, and the card for whichever defect is open. Nothing regroups as work is done:
   * a corrected row keeps its place and gains a tick, so the list never shuffles under the
   * cursor of someone working down it (v3.2).
   */
  const queueBody = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <QueueProgress task={task} resolved={resolved} total={total} />
      {complete ? (
        <p className="flex items-center gap-2 rounded-lg bg-success-muted px-4 py-3 text-body-compact font-medium text-success-muted-foreground">
          <CircleCheckIcon className="size-4 shrink-0" aria-hidden />
          {`All ${total} corrected.`}
        </p>
      ) : null}
      <ResolutionQueue
        items={items}
        activeDefect={activeDefect}
        onOpenDefect={openDefect}
        renderOpen={(item, index) => (
          <DefectCard
            key={targetKey(item.defect.target)}
            defect={item.defect}
            value={item.value}
            actions={defectActions(item.defect)}
            index={index}
            total={total}
            onFocusCapture={() => setActiveDefect(item.defect.n)}
            onBlurCapture={onFrameBlur}
          />
        )}
      />
    </div>
  );

  const submitBlock = (
    <div className="flex flex-col gap-3">
      {complete ? (
        <p className="flex gap-2 text-caption text-muted-foreground">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Once sent, this cannot be recalled.
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        /* The label wraps rather than clipping: at 200% text zoom it does not fit one line
           in any pane this screen has, and a clipped label is the loss of content
           `ACCESSIBILITY.md` §10 forbids. Height follows the words. */
        className={SUBMIT_CLASS}
        disabled={!complete || !online || !!busy}
        onClick={() => setConfirm(true)}
      >
        <SendIcon data-icon="inline-start" aria-hidden />
        Send corrections back
      </Button>
      {complete ? null : <p className="text-caption text-muted-foreground">{reason}</p>}
    </div>
  );

  /*
   * The page header: one slim identity strip. Getting *back* is the top bar's breadcrumb
   * (`<Breadcrumbs>` below publishes Tasks › the task › Scrutiny return), so no second
   * back affordance lives here, and the clock and the counter both live in the queue
   * (§15.6) — what remains is the return's name and whose case it is, in two lines that
   * cost the form almost no height.
   *
   * Where the queue is a column the header is chrome and stays put. Where the queue has
   * folded away, the header rides *inside* the centre pane and scrolls with it — at
   * 1280 × 200% text zoom a pinned header is more than half the window, which would leave
   * a hand's width of form to work in (`ACCESSIBILITY.md` §10).
   */
  const pageHeader = (
  <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-hairline bg-card px-4 py-3 sm:px-6">
    <div className="flex min-w-0 flex-col gap-0.5">
      <h1 className="text-title-s font-semibold tracking-tight text-foreground">
        Scrutiny return
      </h1>
      <p className="text-caption text-muted-foreground">
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
        {" · "}
        <span className="tabular-nums">
          Returned {task.returned ? longDate(task.returned.at) : "—"}
        </span>
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
  </header>
  );

  return (
    <FilingChromeContext.Provider value={chrome}>
    <CorrectionProvider value={correction}>
      {/* The way back lives in the top bar: Tasks › the task › here (act-page's pattern). */}
      <Breadcrumbs
        crumbs={[{ label: task.title, href: back }, { label: "Scrutiny return" }]}
      />
      {/*
       * With room for the queue, the screen holds the viewport and each pane scrolls
       * inside it: panes that scrolled away with the page would leave the queue — the
       * critical action — off screen exactly when the form is long.
       *
       * Once the queue has folded into its drawer there is nothing to hold in place, and
       * holding the viewport becomes the bug: at 1280 × 200% text zoom the page header
       * alone is more than half the window, so a pinned header would leave a hand's width
       * of form to work in. Below the fold the page scrolls as a page and only the bar
       * with the submit action stays (`ACCESSIBILITY.md` §10, `RESPONSIVE.md` rule 9).
       */}
      <div
        style={queueColumn ? { height: `calc(100svh - ${TOP_BAR_HEIGHT})` } : undefined}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        {queueColumn ? pageHeader : null}

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

          {/*
           * Record and workbench, with a handle between them (owner, 2026-08-21).
           *
           * How much room the evidence needs is not ours to decide once and for all: a
           * cropped cheque line wants width, a long section of the record wants width, and
           * which one matters changes defect by defect. So the split is the DS `Resizable`
           * with the proportions v3.1 settled as the default (roughly 632/560 at 1440),
           * the last drag remembered on this device, and minimums that keep either side
           * from being dragged into uselessness. The handle is keyboard-operable — it is
           * the primitive's separator, not a bare div.
           */}
          <ResizablePanelGroup
            orientation="horizontal"
            defaultLayout={savedLayout}
            onLayoutChanged={rememberLayout}
            className="min-h-0 min-w-0 flex-1"
          >
            {/* Centre — the section, as the record.

                The `[&_…]` utilities neutralise the DS's own `disabled:opacity-50`
                ghosting so that receding is decided in *one* place instead of compounding:
                `FormField` steps a whole untouched field back to 45% and the controls
                inside it render normally at that one opacity (owner, 2026-08-21). The
                sunken fill is kept per control shape, so a locked segmented answer or
                checkbox still shows its chosen state — the choice *is* the value there.
                The `!`s are owed to the primitives' `disabled:` rules tying at equal
                specificity; noted as upstream DS feedback. */}
            <ResizablePanel
              id="record"
              defaultSize="53"
              minSize="30"
              className="flex min-w-0 flex-col"
            >
              <main
                className={cn(
                  "flex min-w-0 flex-1 flex-col overflow-y-auto pb-8",
                  "[&_:disabled]:opacity-100! [&_:disabled]:text-muted-foreground",
                  "[&_:has(:disabled)]:opacity-100! [&_[data-slot=input-group-addon]]:opacity-100!",
                  "[&_input:disabled]:bg-surface-sunken! [&_textarea:disabled]:bg-surface-sunken!",
                  "[&_:has(>input:disabled)]:bg-surface-sunken! [&_[data-slot=select-trigger]:disabled]:bg-surface-sunken!",
                  queueColumn && "px-4 pt-6 sm:px-6"
                )}
              >
                {queueColumn ? null : pageHeader}
                <div
                  className={cn(
                    "flex w-full min-w-0 max-w-4xl flex-col gap-4",
                    queueColumn ? null : "px-4 pt-4 sm:px-6"
                  )}
                >
                  {/* What this pane *is*, in one caption — not a rule about what may not
                      be done. The corrections happen in the panel, and saying so once
                      here is cheaper than a banner over an unchanged e-filing form. */}
                  <p className="flex items-start gap-2 text-caption text-muted-foreground">
                    <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                    The filing as scrutiny received it.
                  </p>
                  <SectionBody step={step} />
                </div>
              </main>
            </ResizablePanel>

            {/* Right — the workbench. A column where it fits; a drawer and a sticky bar
                below. */}
            {queueColumn ? (
              <>
                <ResizableHandle
                  withHandle
                  aria-label="Resize the record and the corrections panel"
                  className="bg-hairline"
                />
                <ResizablePanel
                  id="corrections"
                  defaultSize="47"
                  minSize="26"
                  className="flex min-w-0 flex-col overflow-hidden bg-sidebar"
                >
                  <section aria-label="Corrections" className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <h2 className="text-title-s font-semibold text-foreground">Corrections</h2>
                      <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">{queueBody}</ScrollArea>
                    </div>
                    <div className="border-t border-hairline p-4">{submitBlock}</div>
                  </section>
                </ResizablePanel>
              </>
            ) : null}
          </ResizablePanelGroup>
        </div>

        {/* With the queue folded away it is still the critical action, so it keeps a
            persistent bar — RESPONSIVE.md rule 7: never hide a critical action. */}
        <div
          className={cn(
            "z-30 shrink-0 flex-col gap-3 border-t border-hairline bg-card p-4",
            queueColumn ? "hidden" : "sticky bottom-0 flex"
          )}
        >
          <div className="flex items-center gap-3">
            <QueueProgress resolved={resolved} total={total} className="min-w-0 flex-1" />
            <Button type="button" variant="outline" onClick={() => setQueueOpen(true)}>
              <ListChecksIcon data-icon="inline-start" aria-hidden />
              Corrections
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
            Send corrections back
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
            <DrawerTitle className="text-title-s font-semibold">Corrections</DrawerTitle>
            {/* The progress line below is the count; §6 cut the second counter that can
                disagree with the first, so this says what to do, not how many. */}
            <DrawerDescription className="text-body-compact">
              Open one to see what scrutiny asked for.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{queueBody}</div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send these corrections back?</AlertDialogTitle>
            {/* The limitation point lives here rather than under the button: it is the one
                thing worth a sentence, and a sentence under a button is a sentence nobody
                reads. */}
            <AlertDialogDescription>
              {`All ${total} go back to the Registry. `}
              A re-submission cannot be recalled, and limitation runs from the
              Registry&apos;s receipt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>Send them back</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CorrectionProvider>
    </FilingChromeContext.Provider>
  );
}
