"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarX2Icon,
  ChevronDownIcon,
  FilePlusIcon,
  PlusIcon,
} from "lucide-react";

import { useChromePageDialog } from "@/components/chrome/app-chrome";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import {
  causeTitle,
  COURT_HEARING_PURPOSES,
  courtHearingPurposeLabel,
  hearingById,
  isoDay,
  parseIsoDay,
  type CourtHearing,
  type CourtHearingPurposeId,
} from "@/lib/employee/hearings";
import {
  appearancesFor,
  assembleOrder,
  EMPTY_ORDER_DRAFT,
  HEARING_DIRECTION_TYPES,
  hearingDirectionLabel,
  type Appearance,
  type AttendanceMark,
  type DirectionDraft,
  type HearingDirectionTypeId,
  type NextListingChoice,
  type OrderDraft,
  type AssembledOrder,
} from "@/lib/employee/order-draft";

/**
 * How a panel sits on the court-side page — the same recipe as today's cause list
 * (`HearingsScreen`) and bulk reschedule. One lifted sheet, hairline edge, no nested
 * second frame inside it.
 *
 * The surface only. Each of the page's three panels (the listing band, Directions,
 * the document) adds its own inner layout, because the band is a grid at `lg` where
 * the other two are stacks.
 */
const PANEL =
  "min-w-0 rounded-xl border border-hairline bg-card p-6 shadow-raised";

/**
 * Compose the order of one listing.
 *
 * Entered from the cause-list orders icon. The work is on the left (who appeared,
 * the directions, whether it is listed next); the document on the right is the same
 * facts assembled as one order, read-only. Preview opens that text in a dialog.
 *
 * **This build issues nothing.** Save draft is a session flag announced on a live
 * region. Preview is a look. Neither files, notifies, nor signs — the same bargain
 * Start / End hearing already makes on the list this screen is opened from.
 */
export function OrderScreen({ hearingId }: { hearingId: string }) {
  const hearing = hearingById(hearingId);
  if (!hearing) return <OrderMissing />;
  return <OrderReady hearing={hearing} />;
}

function OrderMissing() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2Icon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">
            This listing is not on the board
          </EmptyTitle>
          <EmptyDescription className="text-body">
            The order composer opens a matter from today&rsquo;s cause list. This
            one is not there.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/employee/hearings">Back to today&rsquo;s hearings</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

function OrderReady({ hearing }: { hearing: CourtHearing }) {
  const appearances = React.useMemo(
    () => appearancesFor(hearing),
    [hearing],
  );
  const [draft, setDraft] = React.useState<OrderDraft>(EMPTY_ORDER_DRAFT);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [rollOpen, setRollOpen] = React.useState(true);
  const nextId = React.useRef(1);
  const autoFolded = React.useRef(false);

  const assembled = assembleOrder(hearing, draft);

  /**
   * Marking the last appearance folds the roll: the roll call is done, so the
   * section gives its height back to the directions below it.
   *
   * Folded on the *transition* into "all marked", never on every change —
   * otherwise reopening the section would slam it shut again on the next click.
   * Unmarking someone re-arms the fold but does not reopen the section; whether
   * to look at the roll again is the bench's call, not the screen's. Done here
   * rather than in an effect so nothing sets state during render.
   */
  function setMark(id: string, mark: AttendanceMark | undefined) {
    const marks = { ...draft.marks, [id]: mark };
    setDraft((current) => ({
      ...current,
      marks: { ...current.marks, [id]: mark },
    }));
    const allMarked = appearances.every(
      (appearance) => marks[appearance.id] !== undefined,
    );
    if (!allMarked) {
      autoFolded.current = false;
    } else if (!autoFolded.current) {
      autoFolded.current = true;
      setRollOpen(false);
    }
  }

  function setNext(next: NextListingChoice) {
    setDraft((current) => ({
      ...current,
      next,
      ...(next === "none" ? { nextPurpose: "", nextDate: null } : {}),
    }));
  }

  function addDirection(typeId: HearingDirectionTypeId) {
    const id = `direction-${nextId.current}`;
    nextId.current += 1;
    setDraft((current) => ({
      ...current,
      directions: [...current.directions, { id, typeId, body: "" }],
    }));
  }

  function updateDirection(id: string, body: string) {
    setDraft((current) => ({
      ...current,
      directions: current.directions.map((direction) =>
        direction.id === id ? { ...direction, body } : direction,
      ),
    }));
  }

  function removeDirection(id: string) {
    setDraft((current) => ({
      ...current,
      directions: current.directions.filter((direction) => direction.id !== id),
    }));
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 pb-0 md:p-8 md:pb-0">
        <header className="flex min-w-0 flex-col gap-2">
          <p className="text-caption font-medium text-muted-foreground">
            Order · item{" "}
            <span className="tabular-nums">{hearing.item}</span>
            {" · "}
            <span className="tabular-nums">{hearing.caseNumber}</span>
            {" · "}
            {courtHearingPurposeLabel(hearing.purpose)}
          </p>
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            {causeTitle(hearing)}
          </h1>
          <p className="text-body text-muted-foreground">
            Draft — nothing on this screen is issued.
          </p>
        </header>

        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-5">
          <WorkPanel
            appearances={appearances}
            draft={draft}
            rollOpen={rollOpen}
            onRollOpenChange={setRollOpen}
            onMark={setMark}
            onNext={setNext}
            onPurpose={(nextPurpose) =>
              setDraft((current) => ({ ...current, nextPurpose }))
            }
            onDate={(nextDate) =>
              setDraft((current) => ({ ...current, nextDate }))
            }
            onAdd={addDirection}
            onUpdate={updateDirection}
            onRemove={removeDirection}
          />
          <DocumentPanel order={assembled} />
        </div>
      </div>

      <footer className="sticky bottom-0 z-30 mt-8 border-t border-hairline bg-card px-6 py-3 md:px-8 md:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start sm:w-fit"
          >
            <Link href="/employee/hearings">
              <ArrowLeftIcon data-icon="inline-start" aria-hidden />
              Back
            </Link>
          </Button>
          <p
            className="text-body-compact text-muted-foreground sm:mr-auto"
            aria-live="polite"
          >
            {saved ? "Draft saved on this device." : null}
          </p>
          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-fit"
              onClick={() => setSaved(true)}
            >
              Save draft
            </Button>
            <Button
              type="button"
              className="w-full sm:w-fit"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
          </div>
        </div>
      </footer>

      <PreviewDialog
        order={assembled}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

/**
 * The composer: the roll, the next listing, the directions — one container, in the
 * order a sitting runs.
 *
 * Attendance is the only section here that is expensive in height and short-lived
 * in relevance: it is marked once, at the top of the matter, and then it is history
 * the document already carries. So it folds when the roll is complete and hands its
 * height to the directions below, which is where the typing happens. That is the
 * fix for the composer's scroll problem — the layout no longer has to buy the space
 * by rearranging everything around it.
 */
function WorkPanel({
  appearances,
  draft,
  rollOpen,
  onRollOpenChange,
  onMark,
  onNext,
  onPurpose,
  onDate,
  onAdd,
  onUpdate,
  onRemove,
}: {
  appearances: Appearance[];
  draft: OrderDraft;
  rollOpen: boolean;
  onRollOpenChange: (open: boolean) => void;
  onMark: (id: string, mark: AttendanceMark | undefined) => void;
  onNext: (next: NextListingChoice) => void;
  onPurpose: (purpose: CourtHearingPurposeId | "") => void;
  onDate: (day: string | null) => void;
  onAdd: (typeId: HearingDirectionTypeId) => void;
  onUpdate: (id: string, body: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={`${PANEL} flex flex-col gap-8 lg:col-span-3`}>
      <AttendanceSection
        appearances={appearances}
        marks={draft.marks}
        onMark={onMark}
        open={rollOpen}
        onOpenChange={onRollOpenChange}
      />
      <div role="separator" className="h-px w-full bg-hairline" />
      <NextListingSection
        choice={draft.next}
        purpose={draft.nextPurpose}
        date={draft.nextDate}
        onNext={onNext}
        onPurpose={onPurpose}
        onDate={onDate}
      />
      <div role="separator" className="h-px w-full bg-hairline" />
      <DirectionsSection
        directions={draft.directions}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </div>
  );
}

/**
 * What the folded roll says, so collapsing hides the rows and not the fact.
 * Words, not colour — the document is where an absence is inked.
 */
function rollSummary(
  appearances: Appearance[],
  marks: OrderDraft["marks"],
): string {
  const present = appearances.filter(
    (appearance) => marks[appearance.id] === "present",
  ).length;
  const absent = appearances.filter(
    (appearance) => marks[appearance.id] === "absent",
  ).length;
  const marked = present + absent;
  if (marked === 0) return "Not marked";
  if (marked < appearances.length) {
    return `${marked} of ${appearances.length} marked`;
  }
  if (absent === 0) return `All ${present} present`;
  if (present === 0) return `All ${absent} absent`;
  return `${present} present · ${absent} absent`;
}

function AttendanceSection({
  appearances,
  marks,
  onMark,
  open,
  onOpenChange,
}: {
  appearances: Appearance[];
  marks: OrderDraft["marks"];
  onMark: (id: string, mark: AttendanceMark | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col" aria-labelledby="order-attendance">
      {/* The heading owns the button, not the other way round. `Accordion`'s own
          header is a fixed `h3`, which would put the roll a level below the two
          sections beside it and skip a level under the page `h1`; `Collapsible`
          leaves the markup to us, so the three sections stay siblings. */}
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <h2 id="order-attendance" className="text-body font-semibold">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
            Attendance
            <span className="flex shrink-0 items-center gap-2 text-caption font-medium tabular-nums text-muted-foreground">
              {open ? null : rollSummary(appearances, marks)}
              <ChevronDownIcon
                className="size-4 transition-transform group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </span>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent>
          <ul className="flex flex-col pt-2">
        {appearances.map((appearance, index) => (
          <li
            key={appearance.id}
            className={
              index === 0
                ? "py-2 first:pt-0"
                : "border-t border-hairline py-2 last:pb-0"
            }
          >
            <AttendanceRow
              appearance={appearance}
              mark={marks[appearance.id]}
              onMark={(mark) => onMark(appearance.id, mark)}
              />
            </li>
          ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

function AttendanceRow({
  appearance,
  mark,
  onMark,
}: {
  appearance: Appearance;
  mark: AttendanceMark | undefined;
  onMark: (mark: AttendanceMark | undefined) => void;
}) {
  const label = `Attendance for ${appearance.name}, ${appearance.role.toLowerCase()}`;
  return (
    <div className="flex min-h-10 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-body font-medium">{appearance.name}</p>
        <p className="text-caption text-muted-foreground">{appearance.role}</p>
      </div>
      <SegmentedControl
        type="single"
        value={mark ?? ""}
        onValueChange={(value) => {
          onMark(value === "present" || value === "absent" ? value : undefined);
        }}
        aria-label={label}
        className="w-fit shrink-0"
      >
        <SegmentedControlItem value="present">Present</SegmentedControlItem>
        <SegmentedControlItem
          value="absent"
          className="data-[state=on]:text-destructive-ink"
        >
          Absent
        </SegmentedControlItem>
      </SegmentedControl>
    </div>
  );
}

function NextListingSection({
  choice,
  purpose,
  date,
  onNext,
  onPurpose,
  onDate,
}: {
  choice: NextListingChoice;
  purpose: CourtHearingPurposeId | "";
  date: string | null;
  onNext: (next: NextListingChoice) => void;
  onPurpose: (purpose: CourtHearingPurposeId | "") => void;
  onDate: (day: string | null) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="order-next">
      <h2 id="order-next" className="text-body font-semibold">
        Next listing
      </h2>
      <SegmentedControl
        type="single"
        value={choice}
        onValueChange={(value) => {
          if (value === "list" || value === "none") onNext(value);
        }}
        aria-label="Whether to list a next hearing"
        className="w-fit"
      >
        <SegmentedControlItem value="list">List next</SegmentedControlItem>
        <SegmentedControlItem value="none">No next date</SegmentedControlItem>
      </SegmentedControl>
      {choice === "list" ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <Field className="min-w-0 flex-1">
            <FieldLabel className="text-body font-medium">Purpose</FieldLabel>
            <Select
              value={purpose || undefined}
              onValueChange={(value) =>
                onPurpose(value as CourtHearingPurposeId)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a purpose" />
              </SelectTrigger>
              <SelectContent>
                {COURT_HEARING_PURPOSES.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {/* `DatePicker` owns its trigger and takes no `id`, so the visible label
              names a group around it rather than pointing `htmlFor` at a control
              that does not exist. Same pattern as today's hearings filter. */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span id="order-next-date-label" className="w-fit text-body font-medium">
              Next date
            </span>
            <div role="group" aria-labelledby="order-next-date-label">
              <DatePicker
                value={date ? parseIsoDay(date) : undefined}
                onValueChange={(next) => {
                  onDate(next ? isoDay(next) : null);
                }}
                placeholder="Pick a date"
                className="w-full"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DirectionsSection({
  directions,
  onAdd,
  onUpdate,
  onRemove,
}: {
  directions: DirectionDraft[];
  onAdd: (typeId: HearingDirectionTypeId) => void;
  onUpdate: (id: string, body: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-labelledby="order-directions"
    >
      <h2 id="order-directions" className="text-body font-semibold">
        Directions
      </h2>
      {directions.length === 0 ? (
        <Empty className="border-0 p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePlusIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="text-body font-semibold tracking-normal">
              No directions yet
            </EmptyTitle>
            <EmptyDescription className="text-body-compact">
              Add one or more — a notice, a summons, or whatever this sitting
              needs.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddDirectionControl onAdd={onAdd} label="Add direction" />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {directions.map((direction) => (
              <li key={direction.id}>
                <DirectionWell
                  direction={direction}
                  onUpdate={(body) => onUpdate(direction.id, body)}
                  onRemove={() => onRemove(direction.id)}
                />
              </li>
            ))}
          </ul>
          <AddDirectionControl
            onAdd={onAdd}
            label="Add another direction"
          />
        </div>
      )}
    </section>
  );
}

/**
 * Adding a direction is an action, not a field. A Select with placeholder
 * "Add direction" read as picking the one type for this section; the list
 * only revealed itself after the first choice. An outline button opens a
 * menu of types — the same "Add another" pattern as sureties. Preview stays
 * the page's one teal.
 */
function AddDirectionControl({
  onAdd,
  label,
}: {
  onAdd: (typeId: HearingDirectionTypeId) => void;
  label: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="w-full sm:w-fit">
          <PlusIcon data-icon="inline-start" aria-hidden />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-56">
        {HEARING_DIRECTION_TYPES.map((entry) => (
          <DropdownMenuItem
            key={entry.id}
            onSelect={() => onAdd(entry.id)}
          >
            {entry.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DirectionWell({
  direction,
  onUpdate,
  onRemove,
}: {
  direction: DirectionDraft;
  onUpdate: (body: string) => void;
  onRemove: () => void;
}) {
  const headingId = React.useId();
  const label = hearingDirectionLabel(direction.typeId);
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 id={headingId} className="text-body font-semibold">
          {label}
        </h3>
        <Button type="button" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <Field>
        <FieldLabel className="sr-only">{label}</FieldLabel>
        <Textarea
          aria-labelledby={headingId}
          value={direction.body}
          onChange={(event) => onUpdate(event.target.value)}
          placeholder="Write the direction in the court's words."
          className="min-h-24 bg-card"
        />
      </Field>
    </div>
  );
}

/**
 * The order as it will read, beside the work and sticky, so the words land in a
 * document while they are being written.
 */
function DocumentPanel({ order }: { order: AssembledOrder }) {
  return (
    <section
      className={`${PANEL} lg:sticky lg:top-8 lg:col-span-2`}
      aria-label="Order as it will read"
    >
      <OrderProse order={order} />
    </section>
  );
}

function OrderProse({ order }: { order: AssembledOrder }) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-caption font-medium text-muted-foreground">Order</p>
        <h2 className="text-body font-semibold text-balance">{order.cause}</h2>
        <p className="text-caption text-muted-foreground">
          <span className="tabular-nums">{order.caseNumber}</span>
          {" · item "}
          <span className="tabular-nums">{order.item}</span>
          {" · "}
          {order.purpose}
        </p>
      </header>
      {order.blocks.map((block) => (
        <section key={block.id} className="flex flex-col gap-2">
          <h3 className="text-caption font-medium text-muted-foreground">
            {block.heading}
          </h3>
          {block.appearances && block.appearances.length > 0 ? (
            <AttendanceRoll
              appearances={block.appearances}
              pending={block.pending}
            />
          ) : (
            <p
              className={
                block.pending
                  ? "text-body text-muted-foreground"
                  : "text-body"
              }
            >
              {block.body}
            </p>
          )}
        </section>
      ))}
    </article>
  );
}

/**
 * Who appeared, as the order names them — one sentence per person, not a
 * run-on paragraph. The name carries the line; the office recedes. Present
 * stays in the body's colour. Absent uses `text-destructive-ink` (status
 * text on a neutral surface — colors foundation) so the miss is visible
 * without a chip, and the words still carry the fact (never colour alone).
 */
function AttendanceRoll({
  appearances,
  pending,
}: {
  appearances: NonNullable<AssembledOrder["blocks"][number]["appearances"]>;
  pending: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {appearances.map((entry) => (
        <li
          key={entry.id}
          className={
            pending ? "text-body text-muted-foreground" : "text-body"
          }
        >
          <span className="font-medium">{entry.name}</span>
          <span className="text-muted-foreground">, {entry.office}, </span>
          {entry.mark === "present" ? (
            "is present"
          ) : (
            <span className="text-destructive-ink">is absent</span>
          )}
          .
        </li>
      ))}
    </ul>
  );
}

function PreviewDialog({
  order,
  open,
  onOpenChange,
}: {
  order: AssembledOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pageDialog = useChromePageDialog();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[90svh] flex-col gap-6 overflow-hidden sm:max-w-2xl ${pageDialog}`}
      >
        <DialogHeader className="shrink-0 pr-12">
          <DialogTitle className="text-title font-semibold">Preview</DialogTitle>
          <DialogDescription className="text-body">
            This is the order as it will read. It has not been issued.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
          <OrderProse order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
