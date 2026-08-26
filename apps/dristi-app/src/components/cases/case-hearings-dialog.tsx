"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { CaseHearings } from "@/components/cases/case-hearings";
import {
  HearingRecordStep,
  type HearingRecordOpen,
} from "@/components/cases/hearing-record-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { hearingsFile } from "@/lib/cases/hearings";
import type { CaseRecord } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

/**
 * The register's scroll body. The same utilities the record step uses, for
 * the same reason: the panel is capped at 90svh, so the body scrolls and the
 * page behind it does not. `overscroll-contain` is the half that is easy to
 * miss — without it a wheel that reaches the end of this list keeps going
 * into the document underneath.
 *
 * No `scrollbar-color`. It used to be `var(--border) transparent`, and that
 * one declaration is what made the bar ugly twice over. `--border` is
 * `neutral-8`, the loudest non-text mark the palette has and the one reserved
 * for panel edges and structural frames; on this warm ramp it renders
 * `#c0b9af`, so the thumb arrived as a tan stripe parked beside the filter
 * row. Worse, naming a `scrollbar-color` at all opts the element out of the
 * platform's overlay scrollbars, so that stripe is painted for the whole life
 * of the overlay rather than fading with the scroll.
 *
 * Dropping it restores the scrollbar the reader's own OS draws — the one
 * every other window on their machine uses. `scrollbar-width: thin` stays,
 * because it narrows a classic scrollbar without opting out of an overlay
 * one, so nothing is invented on either platform.
 *
 * `overflow-x-hidden` is the one addition, and it earns its place at phone
 * width: the vertical scrollbar takes its gutter out of the content box while
 * the filter row's `w-full` control still measures itself against the full
 * width, which left the panel with a 4px horizontal scrollbar of its own
 * (measured 288 against 284 at 375px). Nothing inside needs to scroll
 * sideways here — the table that does carries its own `overflow-x-auto`
 * wrapper one level down, so it keeps scrolling and this only clips the
 * gutter (RESPONSIVE 5).
 */
const scrollClass =
  "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]";

/**
 * The panel's measure, capped twice over.
 *
 * The named DS width is what the panel wants — 5xl for the register, 2xl for
 * the record. `--nav-w` is what the rail has already taken. Centring inside
 * the case rather than inside the window means the panel has that much less
 * room, so the cap has to know about it: a 5xl panel pushed right by half a
 * 256px rail runs off the right edge of anything narrower than a 1280px
 * window, which is an ordinary laptop. `min()` takes the smaller of the two,
 * so the panel keeps its DS measure where there is room and shrinks to the
 * case column where there is not.
 *
 * Both are needed because they are separate breakpoints: the unprefixed cap
 * governs phone, where the rail is an offcanvas Sheet and `--nav-w` is 0, so
 * it collapses back to the primitive's own `calc(100% - 2rem)`.
 */
const registerWidthClass =
  "max-w-[calc(100%_-_2rem_-_var(--nav-w,0px))] sm:max-w-[min(var(--container-5xl),calc(100%_-_2rem_-_var(--nav-w,0px)))]";
const recordWidthClass =
  "max-w-[calc(100%_-_2rem_-_var(--nav-w,0px))] sm:max-w-[min(var(--container-2xl),calc(100%_-_2rem_-_var(--nav-w,0px)))]";

/**
 * The hearings register as an overlay over the case, opened from Overview's
 * "View hearing details".
 *
 * **One dialog, two steps.** The register lists hearings and every one of
 * them opens a record — which on the routed page is a dialog of its own.
 * Raised from inside this one it would be a dialog inside a dialog: two focus
 * traps, and an Escape key that means "close the record" and "close the
 * register" at the same moment. The DS forbids exactly that and prescribes
 * exactly this — "Nest a dialog inside another dialog — route to a second
 * step instead" (`/components/dialog`). So there is one `Dialog`, one
 * `DialogContent`, one focus trap, and the content inside it steps.
 *
 * **The register stays mounted while the record shows.** Hidden, not
 * unmounted, because its filters, page, page size and timeline/table choice
 * live in its own state — unmounting would quietly reset all four, and coming
 * back to page 1 of an unfiltered timeline is not coming back. It is also
 * what the routed page does, where the record dialog covers a list that never
 * went anywhere.
 *
 * **Every dismissal pops one step.** On the record: the back control, Escape
 * and a click outside all return to the register, and the corner close is not
 * offered — one gesture never means two things. On the register: Escape, the
 * corner and a click outside close the overlay and focus returns to the link
 * that opened it. That is also what Escape does on the routed page today, so
 * the two presentations do not disagree about what the key means.
 *
 * **Dialog, not Sheet.** Sheet is capped at `sm:max-w-sm` and is for panels
 * that stay attached to the page — "Use Sheet for content that truly needs to
 * interrupt the whole page — that's Dialog" (`/components/sheet`). This is a
 * five-column table, a timeline, filters and pagination: a screen, not a
 * side panel. Dialog is fluid at `max-w-[calc(100%-2rem)]` before its `sm:`
 * cap, so the phone gets a near-full-bleed panel from the same component
 * rather than a second design (RESPONSIVE 6).
 *
 * **Not in the URL.** Back does not close the overlay; it leaves the case.
 * The addressable presentation of this screen already exists at
 * `?section=hearings`, which is what a cmd-click on the trigger still gives —
 * a second URL state for the same content would be the drift, not the cure.
 */
export function CaseHearingsDialog({
  record,
  open,
  onOpenChange,
  triggerRef,
}: {
  record: CaseRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The control that opened the overlay, to hand focus back to on the way
   *  out — see `onCloseAutoFocus` below for why that is done by hand. */
  triggerRef: RefObject<HTMLAnchorElement | null>;
}) {
  const [openRecord, setOpenRecord] = useState<HearingRecordOpen | null>(null);

  /* How much room the left rail has taken, published to `:root` as `--nav-w`
     so the panel can be centred on the case instead of on the window.

     Written to the DOM rather than held in React state on purpose. This
     dialog is portalled to `<body>`, outside the `SidebarProvider` that
     defines `--sidebar-width`, so that variable is not in scope here and the
     value has to arrive some other way. A custom property on the document is
     the cheap one: it inherits down to the portal, it costs no render, and
     updating an external system from an effect is what effects are for —
     mirroring the same number into state would re-render the whole register
     on every frame of the rail's 200ms transition.

     Measured off the rail's own gap element rather than derived from the two
     widths, because the gap is the one value that already accounts for
     expanded vs icon vs offcanvas. `ResizeObserver` rather than a read on
     open, because the DS registers a window-level Cmd/Ctrl+B that toggles the
     rail even while this overlay holds focus; observing follows the width
     transition so the panel glides with the rail instead of jumping after it.

     `isMobile` is a dependency, not a guard, because crossing that breakpoint
     unmounts the gap entirely — the rail becomes a Sheet that occupies no
     layout width. Re-running re-queries it and lands `--nav-w` at 0, which is
     what leaves phone centring exactly as the DS ships it. */
  const { isMobile } = useSidebar();
  useEffect(() => {
    const root = document.documentElement;
    const write = (width: number) =>
      root.style.setProperty("--nav-w", `${width}px`);
    const gap = isMobile
      ? null
      : document.querySelector<HTMLElement>('[data-slot="sidebar-gap"]');
    if (!gap) {
      write(0);
      return () => root.style.removeProperty("--nav-w");
    }
    const observer = new ResizeObserver(() =>
      write(gap.getBoundingClientRect().width)
    );
    observer.observe(gap);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--nav-w");
    };
  }, [isMobile]);

  /* What asked for the record, so leaving the step puts the reader back on
     the row they left rather than at the top of the register. Null when the
     request came from a click on a row rather than a control — there is no
     element to return to then, and the register itself takes the focus. */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  /* The same file the register builds for itself. Built here too because the
     record step is this component's child, not the register's, and needs the
     transcripts and people the step renders from. `hearingsFile` is pure and
     already called from more than one place for the same reason. */
  const file = useMemo(() => {
    try {
      return hearingsFile(record);
    } catch {
      return null;
    }
  }, [record]);

  const peopleById = useMemo(
    () => new Map((file?.people ?? []).map((person) => [person.id, person])),
    [file]
  );

  /* Radix moves focus when the dialog opens and closes; a step change inside
     one dialog is invisible to it. Entering the record focuses its heading so
     the reader is told what they arrived at; leaving returns focus to what
     opened it (ACCESSIBILITY 5). `returnFocusRef` is only ever set by
     `showRecord`, so on the dialog's own opening this does nothing and
     Radix's focus stands. */
  useEffect(() => {
    if (!open) return;
    if (openRecord) {
      headingRef.current?.focus();
      return;
    }
    const back = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!back) return;
    (back.isConnected ? back : listRef.current)?.focus();
  }, [open, openRecord]);

  function showRecord(next: HearingRecordOpen) {
    const active = document.activeElement;
    returnFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    setOpenRecord(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        /* Closed on the record step, the next opening still starts on the
           register — a peek that resumed mid-drill would be answering a
           question the reader did not ask again. */
        if (!next) {
          setOpenRecord(null);
          returnFocusRef.current = null;
        }
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[90svh] flex-col gap-6 overflow-hidden",
          /* Centred on the case, not on the window. Viewport centring put the
             panel's left edge 12px inside the rail at 1512px — close enough
             to the seam to read as a misalignment rather than as an overlay
             deliberately covering the nav. Shifting the centre by half the
             rail lands the panel in the middle of the column the reader was
             already looking at, and leaves the rail fully uncovered.

             This is a deliberate deviation from the DS, which centres Dialog
             on the viewport (`left-1/2 -translate-x-1/2` in the primitive).
             The scrim still covers the rail, so the modal still reads as
             owning the whole screen — only the panel moved. Flagged for
             review; if it should hold app-wide it belongs upstream in the DS,
             not repeated per dialog. */
          "left-[calc(50%_+_var(--nav-w,0px)_/_2)]",
          /* The register wants the width of a screen; the record is a
             document and keeps the measure it has on the routed page, so it
             reads the same in both places. */
          openRecord ? recordWidthClass : registerWidthClass
        )}
        showCloseButton={!openRecord}
        /* Radix focuses the first tabbable thing it finds, which here is the
           Type filter — the reader is told about a filter instead of the
           register they asked for, and a phone raises its keyboard for a
           field nobody tapped. WAI-ARIA APG allows the container instead when
           a dialog holds this much content, so the register takes it and the
           dialog's own name is what gets announced. Focus still moves into
           the dialog and is still trapped there; only its landing place
           changed. */
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          listRef.current?.focus();
        }}
        /* Restored by hand because Radix's own restore does not fire in this
           app — the routed page's record dialog drops focus to <body> on
           Escape in exactly the same way, with nothing of ours involved, so
           this is an app-wide defect and not a cost of the overlay. Without
           it, Escape sends a keyboard user back to the top of the document
           (WCAG 2.4.3). Guarded on `isConnected` so a trigger that re-rendered
           away leaves Radix's behaviour alone rather than throwing. */
        onCloseAutoFocus={(event) => {
          const trigger = triggerRef.current;
          if (!trigger?.isConnected) return;
          event.preventDefault();
          trigger.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (!openRecord) return;
          event.preventDefault();
          setOpenRecord(null);
        }}
        onInteractOutside={(event) => {
          if (!openRecord) return;
          event.preventDefault();
          setOpenRecord(null);
        }}
      >
        {/* Hidden rather than unmounted — see the note on state above. The
            header is the exception: two `DialogTitle`s carry one generated
            id, so the register's has to leave while the record's is here. It
            holds no state, so nothing is lost by it going. */}
        <div
          ref={listRef}
          tabIndex={-1}
          className={cn(
            "min-h-0 flex-1 flex-col gap-6 outline-none",
            openRecord ? "hidden" : "flex"
          )}
        >
          {openRecord ? null : (
            <DialogHeader className="shrink-0 pr-12">
              {/* Which case's register this is. The overlay covers the page
                  that would otherwise have said so. */}
              <DialogDescription className="text-caption font-medium text-muted-foreground">
                {record.caseNumber}
              </DialogDescription>
              <DialogTitle className="text-title font-semibold">
                Hearings
              </DialogTitle>
            </DialogHeader>
          )}
          <div className={scrollClass}>
            <CaseHearings
              record={record}
              overlay={{ onOpenRecord: showRecord }}
            />
          </div>
        </div>

        {file && openRecord ? (
          <HearingRecordStep
            key={openRecord.hearing.id}
            file={file}
            hearing={openRecord.hearing}
            peopleById={peopleById}
            initialKind={openRecord.kind}
            headingRef={headingRef}
            onBack={() => setOpenRecord(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
