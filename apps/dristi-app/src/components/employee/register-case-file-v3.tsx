"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilesIcon,
  SearchXIcon,
} from "lucide-react";

import { DocumentPreview } from "@/components/cases/document-preview";
import { PageFacsimile, PageSheet } from "@/components/employee/page-facsimile";
import { QueueSearchField } from "@/components/employee/queue-search-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionRow,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMinWidth } from "@/hooks/use-min-width";
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
 * The case file — everything the complaint was filed with, for a magistrate who is not
 * going to scrutinise it but may want to check one thing.
 *
 * **Not a workspace** (owner, 2026-09-11, on the three-pane build: *"it's almost like a
 * scrutiny officer view… it shouldn't look like another workspace… the magistrate is not
 * gonna really go and scrutinize things here. He just wants to quickly verify something,
 * if at all"*). So the file is a page that scrolls, in the same grammar as the summary —
 * a section eyebrow over one lifted panel, groups inside it, label beside value — and the
 * three ways to check something sit around it rather than in panes of their own:
 *
 * - **Search**, as the queues search: the file narrows as you type to the particulars and
 *   documents that match, with the match marked in each.
 * - **Contents**, as a rail of quiet ticks beside the file (owner's reference): one tick
 *   per group, the one you are reading darker; hover or tab into it and the group names
 *   open over it in a card.
 * - **The page, on request** — a panel beside the file, sticky as the file scrolls (the
 *   "floating preview" of the first build, owner's note). At rest it is the list of
 *   documents; pick one, or a particular that was read from one, and it shows that page
 *   with the values read from it listed underneath, so a value is checked against its
 *   source without leaving the line you were on. Below 1280px the same panel is a sheet.
 */
export function CaseFileView({ review }: { review: CaseReview }) {
  const bundle = React.useMemo(() => caseBundleFor(review), [review]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<{ key: string; rowId?: string } | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const wide = useMinWidth(1280);
  const asideRef = React.useRef<HTMLElement>(null);
  useFitToWindow(asideRef);

  const needle = query.trim().toLowerCase();
  const sections = React.useMemo(
    () =>
      review.sections
        .map((section) => ({
          section,
          groups: section.groups
            .map((group) => groupView(group, needle))
            .filter((view): view is GroupView => view !== null),
        }))
        .filter((entry) => entry.groups.length > 0),
    [review, needle],
  );
  const matchCount = needle
    ? sections.reduce(
        (sum, entry) =>
          sum +
          entry.groups.reduce(
            (groupSum, view) =>
              groupSum +
              view.facts.length +
              view.documents.length +
              view.records.reduce(
                (recordSum, record) => recordSum + record.facts.length + record.documents.length,
                0,
              ),
            0,
          ),
        0,
      )
    : 0;

  const readFrom = React.useCallback(
    (key: string) => factsReadFrom(review, key),
    [review],
  );

  const show = (key: string | null, rowId?: string) => {
    setSelected(key ? { key, rowId } : null);
    if (key && !wide) setSheetOpen(true);
  };

  const panel = (
    <DocumentPanel
      bundle={bundle}
      selected={selected}
      query={needle}
      readFrom={readFrom}
      onShow={show}
    />
  );

  const visibleGroups = sections.flatMap((entry) => entry.groups.map((view) => view.group));

  return (
    <div className="grid items-start gap-x-6 gap-y-8 xl:grid-cols-[minmax(0,1fr)_1rem_minmax(22rem,26rem)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-end gap-3">
          <QueueSearchField
            label="Search the case file"
            placeholder="A name, a number, a date or a document"
            value={query}
            onChange={setQuery}
            className="w-full max-w-md"
          />
          {/* Below 1280px the documents live in a sheet, and this is the way in. */}
          <Button
            type="button"
            variant="outline"
            className="xl:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <FilesIcon aria-hidden />
            Documents
          </Button>
        </div>

        {needle && matchCount > 0 ? (
          <p role="status" className="-mt-3 text-body-compact text-muted-foreground">
            <span className="tabular-nums">{matchCount}</span>{" "}
            {matchCount === 1 ? "match" : "matches"}
          </p>
        ) : null}

        {sections.length === 0 ? (
          <Empty className="border-0 p-0 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle className="font-semibold text-title-s">
                Nothing in this file matches “{query.trim()}”
              </EmptyTitle>
              <EmptyDescription className="text-body-compact">
                Try part of a name, a number or a date, or clear the search to see the
                whole file.
              </EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </Empty>
        ) : (
          sections.map(({ section, groups }) => (
            <section
              key={section.id}
              aria-labelledby={`file-sec-${section.id}`}
              className="flex flex-col gap-2"
            >
              <h2
                id={`file-sec-${section.id}`}
                className="text-caption font-semibold text-muted-foreground"
              >
                {section.title}
              </h2>
              <Card size="sm" className="gap-0 border-hairline py-0 shadow-raised">
                {groups.map((view) => (
                  <GroupBlock
                    key={view.group.id}
                    view={view}
                    needle={needle}
                    bundle={bundle}
                    selected={selected}
                    onShow={show}
                  />
                ))}
              </Card>
            </section>
          ))
        )}
      </div>

      {/* The contents rail sits in the gutter beside the file it indexes. */}
      <div className="hidden self-stretch xl:block">
        <ContentsRail groups={visibleGroups} />
      </div>

      {/* Sticky under the chrome bar and the tab row, and never taller than the window
          from wherever it is — see `useFitToWindow`. */}
      <aside
        ref={asideRef}
        aria-label="Documents"
        className="sticky top-29 hidden max-h-[calc(100svh-8.25rem)] min-h-0 flex-col xl:flex"
      >
        {panel}
      </aside>

      <Sheet open={sheetOpen && !wide} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="gap-0 data-[side=right]:sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>Documents</SheetTitle>
            <SheetDescription>The documents this complaint was filed with.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col p-4 pt-12">{panel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Keep a sticky panel's foot inside the window wherever the panel is.
 *
 * A sticky panel capped at "the window less the stuck offset" is right only once it has
 * stuck: at the top of the page it starts lower — under the search, 121px below where it
 * will stick — so its last 105px sat under the fold until the reader scrolled, and that is
 * where the values read from the page are (measured, 1440×900). Capping it at the space
 * actually left below its top, every frame it moves, keeps the whole panel on screen.
 */
function useFitToWindow(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    let frame = 0;
    const fit = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      el.style.maxHeight = `${Math.max(320, window.innerHeight - top - 16)}px`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    fit();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/* ─────────────────────────────── the search ─────────────────────────────── */

type FactItem = { id: string; fact: CaseFact };
type RecordView = { record: CaseRecord; facts: FactItem[]; documents: CaseDocument[] };
type GroupView = {
  group: CaseGroup;
  records: RecordView[];
  facts: FactItem[];
  documents: CaseDocument[];
};

function hit(text: string | undefined, needle: string): boolean {
  return !!text && text.toLowerCase().includes(needle);
}

/**
 * A group as the search leaves it — or `null` when nothing in it matches.
 *
 * A match on the group's own name, or on a record's name, keeps everything under it: a
 * reader who types "accused" wants the accused, not the rows that happen to contain the
 * word. Otherwise a particular stays when its label or its value matches, and a document
 * when its name does. Row ids are the particular's place in the file, not in the result,
 * so a selection survives the search changing.
 */
function groupView(group: CaseGroup, needle: string): GroupView | null {
  const whole = !needle || hit(group.title, needle);
  const keepFact = (fact: CaseFact, all: boolean) =>
    all || hit(fact.term, needle) || hit(fact.value, needle);
  const keepDoc = (doc: CaseDocument, all: boolean) => all || hit(doc.label, needle);

  const records = (group.records ?? [])
    .map((record) => {
      const all = whole || hit(record.heading, needle) || hit(record.tag, needle);
      return {
        record,
        facts: record.facts
          .map((fact, index) => ({ id: `${group.id}-${record.id}-${index}`, fact }))
          .filter((item) => keepFact(item.fact, all)),
        documents: (record.documents ?? []).filter((doc) => keepDoc(doc, all)),
        all,
      };
    })
    .filter((view) => view.all || view.facts.length > 0 || view.documents.length > 0);

  const facts = (group.facts ?? [])
    .map((fact, index) => ({ id: `${group.id}-${index}`, fact }))
    .filter((item) => keepFact(item.fact, whole));
  const documents = (group.documents ?? []).filter((doc) => keepDoc(doc, whole));

  if (!whole && records.length === 0 && facts.length === 0 && documents.length === 0) {
    return null;
  }
  return { group, records, facts, documents };
}

/** Every particular in the file that was read from one document, with its row id. */
function factsReadFrom(review: CaseReview, key: string): FactItem[] {
  const out: FactItem[] = [];
  for (const section of review.sections) {
    for (const group of section.groups) {
      for (const record of group.records ?? []) {
        record.facts.forEach((fact, index) => {
          if (fact.source === key) out.push({ id: `${group.id}-${record.id}-${index}`, fact });
        });
      }
      (group.facts ?? []).forEach((fact, index) => {
        if (fact.source === key) out.push({ id: `${group.id}-${index}`, fact });
      });
    }
  }
  return out;
}

/** The text with every occurrence of the search marked. */
function Marked({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(needle);
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-accent-strong px-0.5 text-foreground">
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

/* ─────────────────────────────── the file ───────────────────────────────── */

/**
 * One group of the form inside its section's panel — its name, its records, its own
 * particulars, then its documents. Groups are separated by a hairline; the panel's shadow
 * is the only lift.
 */
function GroupBlock({
  view,
  needle,
  bundle,
  selected,
  onShow,
}: {
  view: GroupView;
  needle: string;
  bundle: CaseBundle;
  selected: { key: string; rowId?: string } | null;
  onShow: (key: string | null, rowId?: string) => void;
}) {
  const { group } = view;
  const Icon = group.icon;
  const docNo = (key: string) => bundle.docs.find((doc) => doc.key === key);

  return (
    <section
      id={`file-group-${group.id}`}
      aria-labelledby={`file-group-${group.id}-title`}
      className="flex scroll-mt-32 flex-col gap-3 border-t border-hairline p-6 first:border-t-0"
    >
      <h3
        id={`file-group-${group.id}-title`}
        className="flex items-center gap-2 text-body-compact font-semibold"
      >
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <Marked text={group.title} needle={needle} />
      </h3>

      {group.empty && !needle ? (
        <p className="text-body-compact text-muted-foreground">
          {group.empty.explanation ??
            (group.empty.reason === "none-named" ? "None named" : "None on record")}
        </p>
      ) : null}

      {view.records.map((record) => (
        <div key={record.record.id} className="flex flex-col gap-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-body-compact font-medium">
            <Marked text={record.record.heading} needle={needle} />
            {record.record.tag ? (
              <span className="font-normal text-muted-foreground">{record.record.tag}</span>
            ) : null}
          </p>
          <FactRows
            items={record.facts}
            needle={needle}
            docNo={docNo}
            selected={selected}
            onShow={onShow}
          />
          <DocumentChips documents={record.documents} needle={needle} docNo={docNo} onShow={onShow} />
        </div>
      ))}

      {view.facts.length > 0 ? (
        <FactRows
          items={view.facts}
          needle={needle}
          docNo={docNo}
          selected={selected}
          onShow={onShow}
        />
      ) : null}
      <DocumentChips documents={view.documents} needle={needle} docNo={docNo} onShow={onShow} />
    </section>
  );
}

/**
 * Particulars, label beside value. A value read from a document ends in a quiet eye: it
 * shows that page beside the file, and the row keeps a light fill while its page is the
 * one on show. The whole row answers a click, for a mouse; the eye is the keyboard's way
 * in and says which document it opens.
 */
function FactRows({
  items,
  needle,
  docNo,
  selected,
  onShow,
}: {
  items: FactItem[];
  needle: string;
  docNo: (key: string) => CaseBundleDoc | undefined;
  selected: { key: string; rowId?: string } | null;
  onShow: (key: string | null, rowId?: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <DescriptionList>
      {items.map(({ id, fact }) => {
        const source = fact.source ? docNo(fact.source) : undefined;
        const current = selected?.rowId === id;
        return (
          <DescriptionRow
            key={id}
            id={`fact-${id}`}
            className={cn(
              "group/row -mx-3 grid-cols-1 gap-1 rounded-lg border-0 px-3 py-2 transition-colors sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] sm:gap-4",
              source && "cursor-pointer hover:bg-accent",
              current && "bg-accent",
            )}
            onClick={source ? () => onShow(source.key, id) : undefined}
          >
            <DescriptionTerm className="text-body-compact">
              <Marked text={fact.term} needle={needle} />
            </DescriptionTerm>
            <DescriptionDetails className="flex min-w-0 items-start gap-2 text-body-compact">
              <span
                className={cn(
                  "min-w-0 flex-1 break-words whitespace-pre-line",
                  !fact.value && "text-muted-foreground",
                  fact.numeric && "tabular-nums",
                  fact.exception && "text-warning-ink",
                )}
              >
                {fact.value ? <Marked text={fact.value} needle={needle} /> : "Not provided"}
              </span>
              {source ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  /* One eye per row, fourteen in a column, was the loudest thing on the
                     page. It comes up with the row's hover fill, or when the row is the one
                     on show; the keyboard finds it by focus, and a touch screen, which has
                     no hover, always shows it (ui-craft §2, repeated rows). */
                  className={cn(
                    "-my-1.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:size-10",
                    current && "opacity-100",
                  )}
                  aria-label={`Show ${source.title}, document ${source.no}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onShow(source.key, id);
                  }}
                >
                  <EyeIcon aria-hidden />
                </Button>
              ) : null}
            </DescriptionDetails>
          </DescriptionRow>
        );
      })}
    </DescriptionList>
  );
}

/**
 * The documents a group or record was filed with, as chips under its particulars: a small
 * drawing of the page and its name. A filed one shows its page; a slot left empty keeps
 * its place with a dashed edge and says so.
 */
function DocumentChips({
  documents,
  needle,
  docNo,
  onShow,
}: {
  documents: CaseDocument[];
  needle: string;
  docNo: (key: string) => CaseBundleDoc | undefined;
  onShow: (key: string | null, rowId?: string) => void;
}) {
  if (documents.length === 0) return null;
  return (
    <ul className="mt-1 flex flex-wrap gap-2" aria-label="Documents">
      {documents.map((document) => {
        const filed = document.state === "filed" ? docNo(document.key) : undefined;
        return (
          <li key={document.key}>
            {filed ? (
              <button
                type="button"
                onClick={() => onShow(filed.key)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-hairline bg-card py-1 pr-3 pl-1 text-start text-body-compact transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-paper ring-1 ring-hairline">
                  <PageFacsimile kind={filed.kind} />
                </span>
                <Marked text={filed.label} needle={needle} />
              </button>
            ) : (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-input py-1 pr-3 pl-1 text-body-compact text-muted-foreground">
                <span aria-hidden className="h-8 w-6 shrink-0" />
                <Marked text={document.label} needle={needle} />
                <span className="text-caption">· Not filed</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────────── the contents ───────────────────────────── */

/**
 * The file's contents as a rail of ticks (owner's reference, 2026-09-11) — one per group,
 * the one being read darker. Hover it, or tab into it, and the group names open over it in
 * a card; picking one scrolls the file there.
 *
 * The card is the real navigation and is always in the tab order — it is transparent, not
 * hidden, until hover or focus brings it up — so a keyboard reaches every group and a
 * screen reader hears a list of them. The ticks are only its picture.
 */
function ContentsRail({ groups }: { groups: CaseGroup[] }) {
  const [active, setActive] = React.useState(groups[0]?.id ?? "");

  React.useEffect(() => {
    let frame = 0;
    const sync = () => {
      frame = 0;
      /* The group whose heading has passed under the sticky tab row. */
      let current = groups[0]?.id ?? "";
      for (const group of groups) {
        const el = document.getElementById(`file-group-${group.id}`);
        if (el && el.getBoundingClientRect().top <= 160) current = group.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = groups[groups.length - 1]?.id ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [groups]);

  if (groups.length < 2) return null;

  return (
    <nav aria-label="Case file contents" className="group/toc sticky top-32 w-4">
      <div aria-hidden className="flex flex-col items-end gap-3 py-2">
        {groups.map((group) => (
          <span
            key={group.id}
            className={cn(
              "h-0.5 w-4 rounded-full transition-colors",
              active === group.id ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>
      <ul
        className={cn(
          "absolute top-0 right-0 z-30 flex w-64 flex-col gap-0.5 rounded-xl border border-hairline bg-card p-2 shadow-overlay transition-opacity duration-150",
          "pointer-events-none opacity-0",
          "group-hover/toc:pointer-events-auto group-hover/toc:opacity-100",
          "group-focus-within/toc:pointer-events-auto group-focus-within/toc:opacity-100",
        )}
      >
        {groups.map((group) => (
          <li key={group.id}>
            <button
              type="button"
              aria-current={active === group.id ? "true" : undefined}
              onClick={() =>
                document
                  .getElementById(`file-group-${group.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={cn(
                "w-full rounded-lg px-3 py-1.5 text-start text-body-compact transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                active === group.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {group.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ─────────────────────────────── the page ───────────────────────────────── */

/**
 * Beside the file: the documents, and — when one is asked for — its page.
 *
 * At rest it is the list: every filed document, numbered in the file's order, and the
 * slots left empty under "Not filed", narrowed by the same search as the file. Picking a
 * document, or a particular read from one, turns the panel to that page — the product's
 * own framed preview, with its full view — and lists underneath what was read from it, the
 * particular you came from marked. Back returns to the list; the arrows step through the
 * bundle without going back to it.
 */
function DocumentPanel({
  bundle,
  selected,
  query,
  readFrom,
  onShow,
}: {
  bundle: CaseBundle;
  selected: { key: string; rowId?: string } | null;
  query: string;
  readFrom: (key: string) => FactItem[];
  onShow: (key: string | null, rowId?: string) => void;
}) {
  const doc = selected ? bundle.docs.find((candidate) => candidate.key === selected.key) : undefined;

  if (!doc) {
    const docs = bundle.docs.filter((candidate) => !query || hit(candidate.title, query));
    const absent = bundle.absent.filter((candidate) => !query || hit(candidate.title, query));
    return (
      <Card size="sm" className="min-h-0 gap-0 border-hairline py-0 shadow-raised">
        <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-4 py-3">
          <h2 className="text-body-compact font-semibold">Documents</h2>
          <span className="text-caption tabular-nums text-muted-foreground">
            {bundle.docs.length} filed
          </span>
        </div>
        <div className="flex min-h-0 flex-col gap-0.5 overflow-y-auto p-2">
          {docs.map((candidate) => (
            <button
              key={candidate.key}
              type="button"
              onClick={() => onShow(candidate.key)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-paper ring-1 ring-hairline">
                <PageFacsimile kind={candidate.kind} />
              </span>
              <span className="min-w-0 flex-1 text-body-compact">
                <Marked text={candidate.title} needle={query} />
              </span>
              <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                {candidate.no}
              </span>
            </button>
          ))}
          {docs.length === 0 && absent.length === 0 ? (
            <p className="px-2 py-3 text-body-compact text-muted-foreground">
              No document matches.
            </p>
          ) : null}
          {absent.length > 0 ? (
            <>
              <p className="px-2 pt-3 pb-1 text-caption font-semibold text-muted-foreground">
                Not filed
              </p>
              {absent.map((candidate) => (
                <p
                  key={candidate.key}
                  className="flex min-h-10 items-center gap-3 px-2 text-body-compact text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="h-8 w-6 shrink-0 rounded-sm border border-dashed border-input"
                  />
                  {candidate.title}
                </p>
              ))}
            </>
          ) : null}
        </div>
      </Card>
    );
  }

  const index = bundle.docs.indexOf(doc);
  const previous = bundle.docs[index - 1];
  const next = bundle.docs[index + 1];
  const facts = readFrom(doc.key);

  return (
    <div className="@container flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-1">
        {/* In a phone's sheet the row holds four controls in 248px; the way back keeps its
            arrow and says its name to a screen reader, and shows the name once there is
            room for it. */}
        <Button type="button" variant="ghost" className="-ms-2" onClick={() => onShow(null)}>
          <ArrowLeftIcon aria-hidden />
          <span className="sr-only @xs:not-sr-only">All documents</span>
        </Button>
        <span className="ms-auto text-caption whitespace-nowrap tabular-nums text-muted-foreground">
          {doc.no} of {bundle.docs.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!previous}
          aria-label={previous ? `Previous: ${previous.title}` : "No previous document"}
          onClick={() => previous && onShow(previous.key)}
        >
          <ChevronLeftIcon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!next}
          aria-label={next ? `Next: ${next.title}` : "No next document"}
          onClick={() => next && onShow(next.key)}
        >
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>

      <DocumentPreview
        key={doc.key}
        variant="quiet"
        surface="card"
        height="fill"
        title={doc.title}
        className="min-h-80 flex-1 shadow-raised animate-in fade-in-0 duration-200 motion-reduce:animate-none"
        source={{
          kind: "composed",
          content: (
            <div className="mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-md bg-paper shadow-raised">
              <PageSheet kind={doc.kind} />
            </div>
          ),
        }}
      />

      {facts.length > 0 ? (
        <Card size="sm" className="@container shrink-0 gap-0 border-hairline py-0 shadow-raised">
          <h3 className="border-b border-hairline px-4 py-2.5 text-caption font-semibold text-muted-foreground">
            Read from this page
          </h3>
          <DescriptionList className="px-4 py-1">
            {facts.map(({ id, fact }) => (
              <DescriptionRow
                key={id}
                className={cn(
                  "-mx-2 grid-cols-1 gap-0.5 rounded-md border-0 px-2 py-1.5 @xs:grid-cols-[minmax(6rem,9rem)_minmax(0,1fr)] @xs:gap-3",
                  selected?.rowId === id && "bg-accent",
                )}
              >
                <DescriptionTerm className="text-body-compact">{fact.term}</DescriptionTerm>
                <DescriptionDetails
                  className={cn(
                    "min-w-0 text-body-compact break-words",
                    fact.numeric && "tabular-nums",
                    !fact.value && "text-muted-foreground",
                  )}
                >
                  {fact.value ?? "Not provided"}
                </DescriptionDetails>
              </DescriptionRow>
            ))}
          </DescriptionList>
        </Card>
      ) : null}
    </div>
  );
}
