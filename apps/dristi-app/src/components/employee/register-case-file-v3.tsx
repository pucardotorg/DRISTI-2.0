"use client";

import * as React from "react";
import { FileTextIcon, ListIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { PageFacsimile, PageSheet } from "@/components/employee/page-facsimile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useLocalStorageValue,
  writeLocalStorageValue,
} from "@/hooks/use-local-storage-value";
import {
  caseBundleFor,
  type CaseBundle,
  type CaseBundleDoc,
  type CaseDocument,
  type CaseFact,
  type CaseGroup,
  type CaseRecord,
  type CaseReview,
} from "@/lib/employee/case-review";
import { cn } from "@/lib/utils";

/**
 * The case file — the complaint exactly as it was filed, laid out the way scrutiny read it.
 *
 * **Faithful to the scrutiny workbench** (`components/employee/scrutiny/case-workbench.tsx`,
 * owner 2026-09-11: *"Remember how we built the annotation module in e-filing? Try to stay
 * faithful to that"*). The magistrate is reading the same file the registry officer
 * cleared, so it takes the same three panes in the same order and proportions: the filed
 * particulars on the left, the bundle of documents in the centre, the index of documents
 * on the right, each scrolling on its own inside a fixed frame, the splits resizable. The
 * section strip that follows the scroll, the lifted group cards on a sunken ground, the
 * label-and-value rows with the source document beside the value, the numbered pages,
 * the zoom — all the workbench's.
 *
 * **What is not carried over is the annotating.** There is no Mark tool, no flag on a
 * row, no composer, no raised items: this reader acts on the whole complaint — register
 * or send back, in the header — never on a field. A row that came from a document says
 * which one, and opens it in the bundle; that is the whole of the interaction.
 *
 * When the three panes' floors do not fit, they fold to one at a time, switched from a bar
 * at the top of the file, with the index in a sheet — the workbench's narrow layout. The
 * width is measured in `rem`, as the workbench measures it, so text zoom folds it too —
 * but it is the file's **own** width, not the viewport's: this frame sits beside the
 * court rail, and at a 1024px window the viewport had room for the panes while the file
 * had 768px and squeezed all three below their floors (measured).
 */
export function CaseFileWorkspace({ review }: { review: CaseReview }) {
  const bundle = React.useMemo(() => caseBundleFor(review), [review]);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const threePane = useWidthInRem(rootRef, PANES_FLOOR_REM);
  const [pane, setPane] = React.useState<"particulars" | "bundle">(
    "particulars",
  );
  const [indexOpen, setIndexOpen] = React.useState(false);
  /* The row whose source is being shown, and the document it points at. `nonce` makes a
     second click on the same row scroll again after the reader has moved away. */
  const [selected, setSelected] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<{
    key: string;
    nonce: number;
  } | null>(null);
  const [inView, setInView] = React.useState<string | null>(
    bundle.docs[0]?.key ?? null,
  );

  const openDoc = React.useCallback(
    (key: string, rowId?: string) => {
      setSelected(rowId ?? null);
      setTarget({ key, nonce: Date.now() });
      if (!threePane) {
        setPane("bundle");
        setIndexOpen(false);
      }
    },
    [threePane],
  );

  const particulars = (
    <ParticularsPane
      review={review}
      bundle={bundle}
      selected={selected}
      onOpenDoc={openDoc}
    />
  );
  const bundleView = (
    <BundlePane
      bundle={bundle}
      target={target}
      highlighted={selected ? (target?.key ?? null) : null}
      onInView={setInView}
    />
  );

  return (
    /* One root for both layouts, so the width it is measured by is the same box whichever
       layout is showing — observing a root that remounts on the switch would measure the
       layout it just left. */
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      {threePane ? (
        /* The floors are in `rem`, as the workbench's are: a percentage floor is a floor
           on nothing. */
        <ResizablePanelGroup className="min-h-0 flex-1">
          <ResizablePanel
            defaultSize="34%"
            minSize="18rem"
            className="flex flex-col"
          >
            {particulars}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="49%" minSize="22rem">
            {bundleView}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="17%" minSize="11rem" maxSize="20rem">
            <IndexPane bundle={bundle} current={inView} onOpenDoc={openDoc} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          {/* One surface at a time. Only the chosen pane is mounted, so the bundle's
              anchors exist once and its scroll lands where it should. */}
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-card px-4">
            <ToggleGroup
              type="single"
              value={pane}
              onValueChange={(value) => value && setPane(value as typeof pane)}
              spacing={0}
              variant="outline"
              className="bg-surface-sunken"
              aria-label="Case file view"
            >
              <ToggleGroupItem value="particulars" className="h-10 px-3">
                Particulars
              </ToggleGroupItem>
              <ToggleGroupItem value="bundle" className="h-10 px-3">
                Bundle
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              type="button"
              variant="outline"
              className="ms-auto"
              onClick={() => setIndexOpen(true)}
            >
              <ListIcon aria-hidden />
              Documents
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {pane === "particulars" ? particulars : bundleView}
          </div>
          <Sheet open={indexOpen} onOpenChange={setIndexOpen}>
            <SheetContent
              side="right"
              className="data-[side=right]:sm:max-w-100"
            >
              <SheetHeader>
                <SheetTitle>Documents</SheetTitle>
                <SheetDescription>
                  {bundle.docs.length} documents in this bundle. Picking one
                  opens it.
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
                <IndexRows
                  bundle={bundle}
                  current={inView}
                  onOpenDoc={openDoc}
                />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

/** The three panes' floors (18 + 22 + 11rem) and their two handles. */
const PANES_FLOOR_REM = 52;

/**
 * Whether an element is at least `rem` wide, in the page's own rem — re-measured when the
 * element resizes and when the root font size changes (a 1rem probe, as `useRoomInRem`
 * uses, because nothing fires for a font-size change). `false` until measured, so the
 * narrow layout renders first and never claims room it has not seen.
 */
function useWidthInRem(
  ref: React.RefObject<HTMLElement | null>,
  rem: number,
): boolean {
  const [fits, setFits] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:1rem;height:1rem;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const measure = () => {
      const base = probe.getBoundingClientRect().width || 16;
      setFits(el.getBoundingClientRect().width / base >= rem);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(probe);
    return () => {
      observer.disconnect();
      probe.remove();
    };
  }, [ref, rem]);
  return fits;
}

/* ─────────────────────────────── particulars ────────────────────────────── */

/**
 * What was filed, section by section — the workbench's fields panel, read-only.
 *
 * A white bar carries the sections as a strip that follows the scroll; below it, one
 * continuous scroll over the sunken ground, each section a quiet heading with a rule, each
 * group a lifted card of label-and-value rows. A group's documents close its card, each
 * one a row that opens it in the bundle.
 */
function ParticularsPane({
  review,
  bundle,
  selected,
  onOpenDoc,
}: {
  review: CaseReview;
  bundle: CaseBundle;
  selected: string | null;
  onOpenDoc: (key: string, rowId?: string) => void;
}) {
  const sections = review.sections;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(sections[0]?.id ?? "");
  const lock = React.useRef(false);
  const lockTimer = React.useRef(0);
  const frame = React.useRef(0);

  /* The section whose heading has passed under the bar is the current one; the bottom of
     the scroll always selects the last, which may be shorter than the pane. */
  const syncSpy = React.useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller || lock.current || sections.length === 0) return;
    if (scroller.scrollTop <= 8) return setActive(sections[0].id);
    if (
      scroller.scrollTop + scroller.clientHeight >=
      scroller.scrollHeight - 8
    ) {
      return setActive(sections[sections.length - 1].id);
    }
    let current = sections[0].id;
    for (const section of sections) {
      const el = document.getElementById(`file-sec-${section.id}`);
      if (el && el.offsetTop - scroller.scrollTop <= 96) current = section.id;
    }
    setActive(current);
  }, [sections]);

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        syncSpy();
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    syncSpy();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
      window.clearTimeout(lockTimer.current);
    };
  }, [syncSpy]);

  const jumpTo = (id: string) => {
    const scroller = scrollRef.current;
    const el = document.getElementById(`file-sec-${id}`);
    if (!scroller || !el) return;
    setActive(id);
    lock.current = true;
    scroller.scrollTo({
      top: Math.max(0, el.offsetTop - 12),
      behavior: "smooth",
    });
    window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lock.current = false;
      syncSpy();
    }, 600);
  };

  const docNo = (key: string) => bundle.docs.find((doc) => doc.key === key);

  /* The strip scrolls sideways when its labels do not fit, so the current one is brought
     into it — a mark on a tab the reader cannot see is no mark at all. */
  const stripRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-surface-sunken"
      aria-label="Filed particulars"
    >
      {/* The strip's mark hangs at `-bottom-px`, so it lands on the bar's rule rather
          than floating above it as a second line (ui-craft §2). */}
      <div className="flex h-14 shrink-0 items-stretch overflow-x-auto border-b border-hairline bg-card px-4">
        <nav ref={stripRef} aria-label="Sections" className="flex items-stretch gap-1">
          {sections.map((section, index) => {
            const current = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={() => jumpTo(section.id)}
                className={cn(
                  "relative flex shrink-0 items-center px-3 text-body-compact font-medium whitespace-nowrap transition-colors",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-accent after:opacity-0 after:transition-opacity after:content-['']",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  current
                    ? "text-primary after:opacity-100"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="tabular-nums">{index + 1}.</span>&nbsp;
                {section.title}
              </button>
            );
          })}
        </nav>
      </div>

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={`file-sec-${section.id}`}
            aria-labelledby={`file-sec-${section.id}-title`}
            className={cn(
              "flex scroll-mt-3 flex-col gap-3",
              index > 0 && "mt-8",
            )}
          >
            {/* The rule after the label is the separator; the label itself stays quiet. */}
            <h2
              id={`file-sec-${section.id}-title`}
              className="flex items-center gap-3 py-2 text-caption font-semibold text-muted-foreground after:h-px after:flex-1 after:bg-hairline after:content-['']"
            >
              <span>
                <span className="tabular-nums">{index + 1}</span> ·{" "}
                {section.title}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {section.groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  selected={selected}
                  docNo={docNo}
                  onOpenDoc={onOpenDoc}
                />
              ))}
            </div>
          </section>
        ))}
        {/* Tail, so the last section can reach the top of the pane and the strip can
            select it before the scroll bottoms out. */}
        <div aria-hidden className="h-[40vh]" />
      </div>
    </section>
  );
}

/** One group of the form — its records, its own particulars, then its documents. */
function GroupCard({
  group,
  selected,
  docNo,
  onOpenDoc,
}: {
  group: CaseGroup;
  selected: string | null;
  docNo: (key: string) => CaseBundleDoc | undefined;
  onOpenDoc: (key: string, rowId?: string) => void;
}) {
  const Icon = group.icon;
  const records = group.records ?? [];
  const documents = group.documents ?? [];

  return (
    <Card size="sm" className="w-full border-hairline shadow-raised">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex text-muted-foreground">
            <Icon aria-hidden className="size-4" />
          </span>
          <CardTitle>{group.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col @container">
        {group.empty ? (
          <p className="text-body-compact text-muted-foreground">
            {group.empty.explanation ??
              (group.empty.reason === "none-named"
                ? "None named"
                : "None on record")}
          </p>
        ) : null}

        {records.map((record, index) => (
          <RecordBlock
            key={record.id}
            record={record}
            first={index === 0}
            groupId={group.id}
            selected={selected}
            docNo={docNo}
            onOpenDoc={onOpenDoc}
          />
        ))}

        {group.facts && group.facts.length > 0 ? (
          <FactList
            facts={group.facts}
            idPrefix={group.id}
            selected={selected}
            docNo={docNo}
            onOpenDoc={onOpenDoc}
          />
        ) : null}

        {documents.length > 0 ? (
          <DocumentList
            documents={documents}
            docNo={docNo}
            onOpenDoc={onOpenDoc}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * One record inside a group — a cheque, a party, a witness, an advocate — named once, then
 * its particulars and documents. Records after the first are ruled off with a hairline.
 */
function RecordBlock({
  record,
  first,
  groupId,
  selected,
  docNo,
  onOpenDoc,
}: {
  record: CaseRecord;
  first: boolean;
  groupId: string;
  selected: string | null;
  docNo: (key: string) => CaseBundleDoc | undefined;
  onOpenDoc: (key: string, rowId?: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        !first && "mt-3 border-t border-hairline pt-3",
      )}
    >
      <p className="flex flex-wrap items-baseline gap-x-2 text-body-compact font-medium">
        {record.heading}
        {record.tag ? (
          <span className="font-normal text-muted-foreground">
            {record.tag}
          </span>
        ) : null}
      </p>
      <FactList
        facts={record.facts}
        idPrefix={`${groupId}-${record.id}`}
        selected={selected}
        docNo={docNo}
        onOpenDoc={onOpenDoc}
      />
      {record.documents && record.documents.length > 0 ? (
        <DocumentList
          documents={record.documents}
          docNo={docNo}
          onOpenDoc={onOpenDoc}
        />
      ) : null}
    </div>
  );
}

/**
 * The particulars of a group or a record — the workbench's field rows, without the flag.
 *
 * Label and value side by side at the workbench's own track (`minmax(5.5rem,9rem)`), rows
 * ruled with a hairline. A value read from a document carries that document's number at
 * the far edge, as a control: it opens the page in the bundle, and the row takes the
 * workbench's selection cue — a thin bar down its leading edge — while it is shown. The
 * row itself answers a click too, for a mouse; the number is the keyboard's way in.
 */
function FactList({
  facts,
  idPrefix,
  selected,
  docNo,
  onOpenDoc,
}: {
  facts: CaseFact[];
  idPrefix: string;
  selected: string | null;
  docNo: (key: string) => CaseBundleDoc | undefined;
  onOpenDoc: (key: string, rowId?: string) => void;
}) {
  return (
    <DescriptionList>
      {facts.map((fact, index) => {
        const rowId = `${idPrefix}-${index}`;
        const source = fact.source ? docNo(fact.source) : undefined;
        const isSelected = selected === rowId;
        return (
          <DescriptionRow
            key={rowId}
            id={`fact-${rowId}`}
            className={cn(
              "relative -mx-2 grid-cols-1 gap-1 border-hairline px-2 py-2.5 transition-colors @[20rem]:grid-cols-[minmax(5.5rem,9rem)_1fr] @[20rem]:gap-3",
              source && "cursor-pointer hover:bg-accent",
              isSelected &&
                "before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-primary before:content-['']",
            )}
            onClick={source ? () => onOpenDoc(source.key, rowId) : undefined}
          >
            <DescriptionTerm className="text-body-compact">
              {fact.term}
            </DescriptionTerm>
            <DescriptionDetails className="min-w-0">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "min-w-0 flex-1 text-body-compact break-words whitespace-pre-line",
                    fact.value ? "font-medium" : "text-muted-foreground",
                    fact.numeric && "tabular-nums",
                    fact.exception && "text-warning-ink",
                  )}
                >
                  {fact.value ?? "Not provided"}
                </span>
                {source ? (
                  /* The workbench's persistent source glyph, made a control: which
                     document it is lives in the name, not a tooltip. `-my-1.5` lets the
                     32px target sit on the 20px line without pushing the row open. */
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "-my-1.5 shrink-0 text-muted-foreground [@media(pointer:coarse)]:size-10",
                      isSelected && "text-primary",
                    )}
                    aria-label={`Open document ${source.no}, ${source.title}, in the bundle`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDoc(source.key, rowId);
                    }}
                  >
                    <FileTextIcon aria-hidden />
                  </Button>
                ) : null}
              </div>
            </DescriptionDetails>
          </DescriptionRow>
        );
      })}
    </DescriptionList>
  );
}

/**
 * The documents a group or record was filed with, closing its card. A filed one is a row
 * with a small drawing of its page, its name and its number, and it opens in the bundle; a
 * slot left empty keeps its place with a dashed tile and says so in words.
 */
function DocumentList({
  documents,
  docNo,
  onOpenDoc,
}: {
  documents: CaseDocument[];
  docNo: (key: string) => CaseBundleDoc | undefined;
  onOpenDoc: (key: string, rowId?: string) => void;
}) {
  return (
    <ul
      className="-mx-2 mt-2 flex flex-col gap-1 border-t border-hairline pt-2"
      aria-label="Documents"
    >
      {documents.map((document) => {
        const filed =
          document.state === "filed" ? docNo(document.key) : undefined;
        return (
          <li key={document.key}>
            {filed ? (
              <button
                type="button"
                onClick={() => onOpenDoc(filed.key)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-paper ring-1 ring-hairline">
                  <PageFacsimile kind={filed.kind} />
                </span>
                <span className="min-w-0 flex-1 text-body-compact">
                  {filed.label}
                </span>
                <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                  Doc {filed.no}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-2 py-1.5">
                <span
                  aria-hidden
                  className="h-8 w-6 shrink-0 rounded-sm border border-dashed border-input"
                />
                <span className="min-w-0 flex-1 text-body-compact text-muted-foreground">
                  {document.label}
                </span>
                <span className="shrink-0 text-caption text-muted-foreground">
                  Not filed
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────────── the bundle ─────────────────────────────── */

const ZOOM_STEPS = [50, 67, 80, 100, 125, 150, 200];
const ZOOM_KEY = "employee-case-file-zoom";

/**
 * The bundle — every filed document, in the file's order, one page each on the sunken
 * ground. The workbench's viewer without its Mark tool: a white bar with the count and the
 * zoom, then the pages, each labelled with its number and name.
 *
 * **The pages are drawings, not scans** (`PageSheet`): the shape of each kind of document
 * at reading size, and nothing legible — readable text would be fabricating a court
 * record.
 *
 * Zoom is the workbench's: digital (`zoom`, no reflow), persisted per reader, stepped
 * from the bar or with ⌘/Ctrl and the wheel about the pointer. The page opened from a row
 * keeps a quiet ring while that row is selected.
 */
function BundlePane({
  bundle,
  target,
  highlighted,
  onInView,
}: {
  bundle: CaseBundle;
  target: { key: string; nonce: number } | null;
  highlighted: string | null;
  onInView: (key: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [base, setBase] = React.useState(640);
  const stored = Number(useLocalStorageValue(ZOOM_KEY));
  const zoom = ZOOM_STEPS.includes(stored) ? stored : 100;

  /* The page width at 100%: the column less a margin, measured at 1× only. */
  React.useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const measure = () => {
      const style = getComputedStyle(scroller);
      const available =
        scroller.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      setBase(Math.max(280, Math.min(720, Math.round(available * 0.96))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const zoomTo = React.useCallback(
    (next: number, cx?: number, cy?: number) => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const from = zoom / 100;
      const to = next / 100;
      const ax = cx ?? scroller.clientWidth / 2;
      const ay = cy ?? scroller.clientHeight / 2;
      const px = (scroller.scrollLeft + ax) / from;
      const py = (scroller.scrollTop + ay) / from;
      writeLocalStorageValue(ZOOM_KEY, String(next));
      requestAnimationFrame(() => {
        scroller.scrollLeft = px * to - ax;
        scroller.scrollTop = py * to - ay;
      });
    },
    [zoom],
  );

  const stepZoom = React.useCallback(
    (delta: number, cx?: number, cy?: number) => {
      let nearest = 0;
      ZOOM_STEPS.forEach((step, index) => {
        if (Math.abs(step - zoom) < Math.abs(ZOOM_STEPS[nearest] - zoom))
          nearest = index;
      });
      const next =
        ZOOM_STEPS[
          Math.min(ZOOM_STEPS.length - 1, Math.max(0, nearest + delta))
        ];
      zoomTo(next, cx, cy);
    },
    [zoom, zoomTo],
  );

  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const box = scroller.getBoundingClientRect();
      stepZoom(
        event.deltaY < 0 ? 1 : -1,
        event.clientX - box.left,
        event.clientY - box.top,
      );
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [stepZoom]);

  /* A document asked for by name is the one in view until its scroll has settled — the
     last pages of a bundle cannot scroll up to the reading line, and without this the
     index marked the page before the one the reader picked (measured). */
  const requested = React.useRef<{ key: string; until: number } | null>(null);

  /* Which document is in view — the one whose page top has passed a third of the way down
     the pane — so the index can say where the reader is. */
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (requested.current && performance.now() < requested.current.until) {
        onInView(requested.current.key);
        return;
      }
      requested.current = null;
      const top =
        scroller.getBoundingClientRect().top + scroller.clientHeight / 3;
      let current = bundle.docs[0]?.key;
      for (const doc of bundle.docs) {
        const el = document.getElementById(`file-doc-${doc.key}`);
        if (el && el.getBoundingClientRect().top <= top) current = doc.key;
      }
      /* The foot of the scroll is the last page, which may never reach the line — the
         particulars strip settles its last section the same way. */
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        current = bundle.docs[bundle.docs.length - 1]?.key ?? current;
      }
      if (current) onInView(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [bundle, onInView]);

  /* Go to the document a row or the index asked for. */
  React.useEffect(() => {
    if (!target) return;
    const scroller = scrollRef.current;
    const el = document.getElementById(`file-doc-${target.key}`);
    if (!scroller || !el) return;
    requested.current = { key: target.key, until: performance.now() + 800 };
    onInView(target.key);
    const top =
      el.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
  }, [target, onInView]);

  return (
    <section
      className="flex h-full min-w-0 flex-col bg-surface-sunken @container"
      aria-label="Case bundle"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-card px-4">
        <div className="me-auto flex min-w-26 flex-1 flex-col leading-tight">
          <b className="truncate text-body-compact font-semibold">
            Case bundle
          </b>
          <span className="hidden truncate text-caption text-muted-foreground @md:block">
            <span className="tabular-nums">{bundle.docs.length}</span> documents
            {bundle.absent.length > 0 ? (
              <>
                {" · "}
                <span className="tabular-nums">{bundle.absent.length}</span> not
                filed
              </>
            ) : null}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => stepZoom(-1)}
          disabled={zoom <= ZOOM_STEPS[0]}
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="tabular-nums"
          onClick={() => zoomTo(100)}
          aria-label={`Zoom is ${zoom} percent — reset to 100 percent`}
        >
          {zoom}%
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => stepZoom(1)}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 pb-12">
        <div
          className="mx-auto flex flex-col gap-6"
          style={{ width: base, zoom: zoom / 100 } as React.CSSProperties}
        >
          {bundle.docs.map((doc) => (
            <div
              key={doc.key}
              id={`file-doc-${doc.key}`}
              className="flex scroll-mt-3 flex-col gap-1.5"
            >
              {/* The only anchor in a scroll this long, so it reads as one: caption size,
                  foreground ink at 600. */}
              <p className="text-caption font-semibold text-foreground">
                <span className="tabular-nums">{doc.no}</span> · {doc.title}
              </p>
              <div
                data-doc={doc.key}
                role="img"
                aria-label={`Document ${doc.no}, ${doc.title}`}
                className={cn(
                  "relative aspect-[3/4] overflow-hidden rounded-xl bg-paper shadow-raised transition-shadow",
                  highlighted === doc.key && "ring-2 ring-primary",
                )}
              >
                <PageSheet kind={doc.kind} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── the index ──────────────────────────────── */

/**
 * The index of documents — the workbench's rail: a numbered list of the bundle, the one in
 * view marked, and — after them — the slots the form asked for that were never filed, so
 * the reader knows what the bundle does not hold without hunting through it.
 */
function IndexPane({
  bundle,
  current,
  onOpenDoc,
}: {
  bundle: CaseBundle;
  current: string | null;
  onOpenDoc: (key: string) => void;
}) {
  return (
    <aside className="flex h-full flex-col bg-card" aria-label="Document index">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-4">
        <b className="text-body-compact font-semibold">Documents</b>
        <span className="text-caption tabular-nums text-muted-foreground">
          {bundle.docs.length}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        <IndexRows bundle={bundle} current={current} onOpenDoc={onOpenDoc} />
      </div>
    </aside>
  );
}

function IndexRows({
  bundle,
  current,
  onOpenDoc,
}: {
  bundle: CaseBundle;
  current: string | null;
  onOpenDoc: (key: string) => void;
}) {
  return (
    <>
      {bundle.docs.map((doc) => {
        const here = current === doc.key;
        return (
          <Button
            key={doc.key}
            type="button"
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start gap-2 px-2 font-normal",
              here && "bg-accent",
            )}
            aria-current={here ? "true" : undefined}
            onClick={() => onOpenDoc(doc.key)}
          >
            <span className="w-5 shrink-0 text-end text-caption tabular-nums text-muted-foreground">
              {doc.no}
            </span>
            <span className="min-w-0 flex-1 truncate text-start text-body-compact">
              {doc.title}
            </span>
          </Button>
        );
      })}
      {bundle.absent.length > 0 ? (
        <>
          <p className="px-2 pt-4 pb-1 text-caption font-semibold text-muted-foreground">
            Not filed
          </p>
          {bundle.absent.map((doc) => (
            <div key={doc.key} className="flex h-10 items-center gap-2 px-2">
              <span aria-hidden className="w-5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-body-compact text-muted-foreground">
                {doc.title}
              </span>
            </div>
          ))}
        </>
      ) : null}
    </>
  );
}
