"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarX2Icon, PlusIcon } from "lucide-react";

import { ChromeDialogContent } from "@/components/chrome/app-chrome";
import { DocumentPreview } from "@/components/cases/document-preview";
import {
  EMPTY_RICH_TEXT,
  RichTextField,
  RichTextValueView,
  type RichTextValue,
} from "@/components/cases/rich-text-field";
import { useCourtToday } from "@/components/employee/use-court-today";
import { useHearingSession } from "@/components/employee/use-hearing-session";
import { useOrderDraft } from "@/components/employee/use-order-draft";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
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
import {
  markHearingEnded,
  markHearingOngoing,
} from "@/lib/employee/hearing-session";
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
  assembleAttendance,
  assembleNextListing,
  buildOrderDocument,
  hearingDirectionLabel,
  HEARING_DIRECTION_TYPES,
  nextUnhandledListing,
  type Appearance,
  type AttendanceEntry,
  type AttendanceMark,
  type DirectionDraft,
  type HearingDirectionTypeId,
  type NextListingChoice,
  type OrderDocument,
  type OrderDraft,
} from "@/lib/employee/order-draft";

/**
 * How a panel sits on the court-side page — the same recipe as today's cause list
 * (`HearingsScreen`) and bulk reschedule. One lifted sheet, hairline edge, no nested
 * second frame inside it.
 */
const PANEL =
  "min-w-0 rounded-xl border border-hairline bg-card p-6 shadow-raised";

/**
 * Compose the order of one listing.
 *
 * Entered from the cause-list orders icon. Two panels: the **facts of this listing**
 * on the left — who appeared, whether it is listed next — and **the order itself** on
 * the right, which is where the bench types.
 *
 * The order used to be a third panel that re-printed, in prose, what the controls
 * beside it already said: four segmented controls became four sentences, each textarea
 * became a paragraph. It cost the widest half of the page to show a copy, and it
 * pushed the one region that takes typing below the fold — three successive
 * rearrangements bought a few dozen pixels each and gave them back. So the copy is
 * gone and the document is the editor: directions are typed as the numbered paragraphs
 * they will be. The first place to type sits near the top of its own column and stays
 * there however many parties the matter has.
 *
 * **This build issues nothing.** The draft is held for this sitting and dies on a
 * reload. Preview is a look at the paper. Next item ends this listing and calls the
 * next one on the board — the same screen marks the cause list already makes. Nothing
 * files, notifies, or signs.
 */
export function OrderScreen({ hearingId }: { hearingId: string }) {
  const hearing = hearingById(hearingId);
  if (!hearing) return <OrderMissing />;
  /* Keyed on the listing so advancing to the next item opens a composer at the top of
     itself rather than inheriting this one's transient state. The draft is not in that
     state — it lives in `order-drafts.ts`, keyed by listing there. */
  return <OrderReady key={hearing.id} hearing={hearing} />;
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
  const router = useRouter();
  const session = useHearingSession();
  const today = useCourtToday();
  const [draft, setDraft] = useOrderDraft(hearing.id);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");

  const appearances = React.useMemo(() => appearancesFor(hearing), [hearing]);
  const attendance = assembleAttendance(appearances, draft.marks);
  const nextListing = assembleNextListing(draft);
  const upNext = nextUnhandledListing(hearing, session);

  function setMark(id: string, mark: AttendanceMark | undefined) {
    setDraft((current) => ({
      ...current,
      marks: { ...current.marks, [id]: mark },
    }));
  }

  function setNext(next: NextListingChoice) {
    setDraft((current) => ({
      ...current,
      next,
      ...(next === "none" ? { nextPurpose: "" as const, nextDate: null } : {}),
    }));
  }

  function addDirection(typeId: HearingDirectionTypeId) {
    setDraft((current) => ({
      ...current,
      directions: [
        ...current.directions,
        {
          id: nextDirectionId(current.directions),
          typeId,
          body: EMPTY_RICH_TEXT,
        },
      ],
    }));
    setAnnouncement(
      `${hearingDirectionLabel(typeId)} added as direction ${draft.directions.length + 1}.`,
    );
  }

  function updateDirection(id: string, body: RichTextValue) {
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
    setAnnouncement("Direction removed. The rest are renumbered.");
  }

  /**
   * End this listing and call the next one on the board.
   *
   * Both marks already exist on the cause list, and the sitting holds a single ongoing
   * listing — so navigating without ending would land on a composer the sitting has
   * locked, and calling the next matter without ending this one would silently return
   * this one to scheduled. The pair is the act a bench actually performs.
   *
   * Neither mark files, signs or notifies anything (`hearing-session.ts`).
   */
  function advance() {
    markHearingEnded(hearing.id);
    if (!upNext) {
      router.push("/employee/hearings");
      return;
    }
    markHearingOngoing(upNext.id);
    router.push(`/employee/hearings/${upNext.id}/order`);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 pb-0 md:p-8 md:pb-0">
        <header className="flex min-w-0 flex-col gap-2">
          <p className="text-caption font-medium text-muted-foreground">
            Order · item <span className="tabular-nums">{hearing.item}</span>
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

        {/* Two panels, `items-start` so the shorter facts column is not stretched to
            the order's height. Nothing is sticky: a column holding a growing list of
            textareas cannot be pinned to a viewport it outgrows. */}
        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-5">
          <ListingFacts
            appearances={appearances}
            draft={draft}
            onMark={setMark}
            onNext={setNext}
            onPurpose={(nextPurpose) =>
              setDraft((current) => ({ ...current, nextPurpose }))
            }
            onDate={(nextDate) =>
              setDraft((current) => ({ ...current, nextDate }))
            }
          />
          <OrderPanel
            hearing={hearing}
            attendanceBody={attendance.body}
            attendancePending={attendance.pending}
            roll={attendance.appearances}
            directions={draft.directions}
            nextBody={nextListing.body}
            nextPending={nextListing.pending}
            onAdd={addDirection}
            onUpdate={updateDirection}
            onRemove={removeDirection}
          />
        </div>
      </div>

      <footer className="sticky bottom-0 z-30 mt-8 border-t border-hairline bg-card px-6 py-3 md:px-8 md:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* What the screen is doing with the words, standing — not a confirmation
              that fires after an act.

              There is no Save draft any more. The draft is written to
              `order-drafts.ts` on every keystroke, because Next item unmounts this
              composer and a draft in component state would not survive the trip. A
              button that performs what the screen already does continuously is a
              button that teaches the bench to distrust the screen the first time they
              forget to press it.

              Muted rather than caution ink: this is standing state, present from first
              paint on every visit, and a coloured line that never changes is the alarm
              fatigue the craft rules warn about. Status ink is for status. */}
          <div className="flex min-w-0 flex-col gap-1 text-body-compact text-muted-foreground sm:mr-auto">
            <p>Held for this sitting — a reload loses it.</p>
            <p>
              {upNext ? (
                <>
                  Ends this hearing and calls item{" "}
                  <span className="tabular-nums">{upNext.item}</span>.
                </>
              ) : (
                "Ends this hearing. Nothing else is waiting on the board."
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-fit"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            {/* The view's one primary. Preview is a look; this is what a bench does
                twenty-three times before lunch, so the look yields the teal.

                "Next item", never "Next hearing" — the next hearing is the section in
                the column beside it, the one that posts *this case* to a date. One
                phrase cannot carry both meanings on one screen.

                No confirmation dialog. Ending a listing is not reversible in this
                build, which is the argument for one — and a modal on each of
                twenty-three items is a modal people dismiss without reading, which
                protects nothing. The caption beside it carries the consequence. */}
            <Button type="button" className="w-full sm:w-fit" onClick={advance}>
              {upNext ? "Next item" : "End item"}
            </Button>
          </div>
        </div>
      </footer>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <PreviewDialog
        document={buildOrderDocument(hearing, draft, today)}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

/**
 * Ids come from the list rather than a mount-scoped counter: the draft outlives this
 * component now, so a counter restarting at 1 on every visit would hand a second
 * direction the id of the first.
 */
function nextDirectionId(directions: DirectionDraft[]): string {
  const used = directions
    .map((direction) => Number(direction.id.replace("direction-", "")))
    .filter((value) => Number.isFinite(value));
  return `direction-${(used.length ? Math.max(...used) : 0) + 1}`;
}

/**
 * The facts of this listing: who appeared, and whether it is posted to a date.
 *
 * Both are bounded — the roll grows only with the party count, the next listing is two
 * fields — so this column can grow without moving anything the bench types. That is
 * the whole reason it is a column of its own.
 */
function ListingFacts({
  appearances,
  draft,
  onMark,
  onNext,
  onPurpose,
  onDate,
}: {
  appearances: Appearance[];
  draft: OrderDraft;
  onMark: (id: string, mark: AttendanceMark | undefined) => void;
  onNext: (next: NextListingChoice) => void;
  onPurpose: (purpose: CourtHearingPurposeId | "") => void;
  onDate: (day: string | null) => void;
}) {
  return (
    <div className={`${PANEL} flex flex-col gap-8 lg:col-span-2`}>
      <AttendanceSection
        appearances={appearances}
        marks={draft.marks}
        onMark={onMark}
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
    </div>
  );
}

function AttendanceSection({
  appearances,
  marks,
  onMark,
}: {
  appearances: Appearance[];
  marks: OrderDraft["marks"];
  onMark: (id: string, mark: AttendanceMark | undefined) => void;
}) {
  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      aria-labelledby="order-attendance"
    >
      {/* No fold. The roll folded once it was complete, which is after the work the
          fold was meant to make room for — the composer opens unmarked, so on arrival
          it gave nothing back. With the roll in its own narrow column beside the
          typing, its height costs the order nothing and there is nothing to buy. */}
      <h2 id="order-attendance" className="text-body font-semibold">
        Attendance
      </h2>
      <ul className="flex flex-col">
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
        /* Stacked, not side by side. This column is roughly 438px, so a pair would get
           ~200px each and "For reports (to be received from forensics, ADR, etc)" —
           which already wraps in the cause list — would truncate in a trigger that
           narrow. The column is allowed to be tall; nothing waits below it. */
        <div className="flex flex-col gap-4">
          <Field className="min-w-0">
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
              names a group around it rather than pointing `htmlFor` at a control that
              does not exist. Same pattern as today's hearings filter. */}
          <div className="flex min-w-0 flex-col gap-2">
            <span
              id="order-next-date-label"
              className="w-fit text-body font-medium"
            >
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

/**
 * The order — and the place the bench writes it.
 *
 * It reads in the sequence an order reads: the cause at the head, the roll as it will
 * be recorded, the numbered directions, then where the matter is posted to. The
 * generated lines stay generated; only the direction bodies take typing, and they take
 * it inside the paragraph they will become.
 *
 * Nothing here is a second copy of a control in the column beside it, which is the
 * whole point: the panel that used to sit here said the same sentences twice.
 */
function OrderPanel({
  hearing,
  attendanceBody,
  attendancePending,
  roll,
  directions,
  nextBody,
  nextPending,
  onAdd,
  onUpdate,
  onRemove,
}: {
  hearing: CourtHearing;
  attendanceBody: string;
  attendancePending: boolean;
  roll: AttendanceEntry[] | undefined;
  directions: DirectionDraft[];
  nextBody: string;
  nextPending: boolean;
  onAdd: (typeId: HearingDirectionTypeId) => void;
  onUpdate: (id: string, body: RichTextValue) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section
      className={`${PANEL} flex flex-col gap-8 lg:col-span-3`}
      aria-labelledby="order-document"
    >
      <header className="flex min-w-0 flex-col gap-2">
        <p className="text-caption font-medium text-muted-foreground">Order</p>
        <h2 id="order-document" className="text-body font-semibold text-balance">
          {causeTitle(hearing)}
        </h2>
        <p className="text-caption text-muted-foreground">
          <span className="tabular-nums">{hearing.caseNumber}</span>
          {" · item "}
          <span className="tabular-nums">{hearing.item}</span>
          {" · "}
          {courtHearingPurposeLabel(hearing.purpose)}
        </p>
      </header>

      <OrderBlock heading="Attendance">
        {roll && roll.length > 0 ? (
          <AttendanceRoll roll={roll} pending={attendancePending} />
        ) : (
          <p className="text-body text-muted-foreground">{attendanceBody}</p>
        )}
      </OrderBlock>

      <DirectionsBlock
        directions={directions}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />

      <OrderBlock heading="Next listing">
        <p
          className={nextPending ? "text-body text-muted-foreground" : "text-body"}
        >
          {nextBody}
        </p>
      </OrderBlock>
    </section>
  );
}

function OrderBlock({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-caption font-medium text-muted-foreground">
        {heading}
      </h3>
      {children}
    </section>
  );
}

/**
 * Who appeared, as the order names them — one sentence per person, not a run-on
 * paragraph. The name carries the line; the office recedes. Present stays in the
 * body's colour; absent takes status ink so a miss scans without a chip, and the words
 * still carry the fact.
 */
function AttendanceRoll({
  roll,
  pending,
}: {
  roll: AttendanceEntry[];
  pending: boolean;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {roll.map((entry) => (
        <li
          key={entry.id}
          className={pending ? "text-body text-muted-foreground" : "text-body"}
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

/**
 * The directions, as the numbered paragraphs they are in the order.
 *
 * The composer used to print them as unnumbered prose while the signing queue printed
 * the same artefact as an ordered list — two screens in one court-side flow disagreeing
 * about the shape of one document. The number was already in the model as list
 * position; it simply was not on screen.
 *
 * Each direction takes formatted text, on the owner's call. Sub-items — (a), (b), (c)
 * inside one direction — are what plain text genuinely could not carry, and §138
 * directions do carry them: produce three documents, comply on three conditions. The
 * editor's own list controls now express that inside a paragraph, where the previous
 * answer was to split it into a second numbered direction it was not.
 *
 * The markup is the editor's own and nothing else's: it blocks pasted HTML, so the
 * order can only ever hold what this toolbar produced.
 */
function DirectionsBlock({
  directions,
  onAdd,
  onUpdate,
  onRemove,
}: {
  directions: DirectionDraft[];
  onAdd: (typeId: HearingDirectionTypeId) => void;
  onUpdate: (id: string, body: RichTextValue) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-caption font-medium text-muted-foreground">
        Directions
      </h3>
      {directions.length === 0 ? (
        /* The document's own pending voice — the same muted line "Next date has not
           been set." uses one block down — rather than an illustrated empty state. An
           icon in a dashed box halfway through a court order reads as a rendering
           fault, and the add control is the invitation. */
        <div className="flex flex-col items-start gap-4">
          <p className="text-body text-muted-foreground">
            No directions have been written.
          </p>
          <AddDirectionControl onAdd={onAdd} label="Add direction" />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <ol className="flex w-full flex-col gap-4">
            {directions.map((direction, index) => (
              <li key={direction.id}>
                <DirectionParagraph
                  direction={direction}
                  number={index + 1}
                  onUpdate={(body) => onUpdate(direction.id, body)}
                  onRemove={() => onRemove(direction.id)}
                />
              </li>
            ))}
          </ol>
          <AddDirectionControl onAdd={onAdd} label="Add another direction" />
        </div>
      )}
    </section>
  );
}

/**
 * Adding a direction is an action, not a field. A select with the placeholder "Add
 * direction" read as picking the one type for this sitting; the list only revealed
 * itself after the first choice. A menu says there can be more than one.
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
          <DropdownMenuItem key={entry.id} onSelect={() => onAdd(entry.id)}>
            {entry.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DirectionParagraph({
  direction,
  number,
  onUpdate,
  onRemove,
}: {
  direction: DirectionDraft;
  number: number;
  onUpdate: (body: RichTextValue) => void;
  onRemove: () => void;
}) {
  const headingId = React.useId();
  const label = hearingDirectionLabel(direction.typeId);
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 id={headingId} className="text-body font-semibold">
          <span className="tabular-nums">{number}.</span> {label}
        </h4>
        {/* Visible, not hover-only: a keyboard has no hover, and a destructive action
            that appears on approach is one a bench cannot find on purpose. */}
        <Button type="button" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
      {/* The app's one editor, not a second one. `RichTextField` is what the
          applications forms already use: DS chrome (an `InputGroup` for the bordered
          well and focus ring, `ToggleGroup` in a toolbar strip) around the one part
          the design system cannot supply. Nothing under `components/ui` is forked,
          and the court side does not get an editor of its own to drift from that one.

          Shorter than its default here — a direction is a paragraph, not an affidavit —
          set through the DS's own `data-slot` hook rather than by editing the shared
          component a teammate also builds on.

          `labelId` is the heading: a contentEditable region cannot be labelled by a
          `<label>`, so the numbered heading beside it is what names the field. */}
      <RichTextField
        value={direction.body}
        onChange={onUpdate}
        labelId={headingId}
        className="[&_[data-slot=input-group-control]]:min-h-24"
      />
    </div>
  );
}

/**
 * The order as paper — the one place it appears with no controls in it.
 *
 * The same facsimile treatment the signing queue uses on the same artefact, so the
 * order a bench reads back here is the order it will see when it comes to sign. Paper
 * is fixed in both themes by design and is never app chrome, which is why it lives in
 * this dialog and not under the textareas.
 *
 * No download. There is no court record to download — the order has not been issued,
 * and offering a file would claim one.
 */
function PreviewDialog({
  document,
  open,
  onOpenChange,
}: {
  document: OrderDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ChromeDialogContent
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:h-[85dvh]"
      >
        <DialogHeader className="shrink-0 gap-2 p-6 pr-16">
          <DialogTitle className="text-title-s font-semibold">
            Preview
          </DialogTitle>
          <DialogDescription className="text-body-compact text-muted-foreground">
            {document.matter} · {document.caseNumber} — the order as it will read.
            It has not been issued.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
          <DocumentPreview
            className="min-h-96 md:min-h-0"
            height="fill"
            title={document.title}
            source={{
              kind: "composed",
              content: <OrderFacsimile document={document} />,
            }}
          />
        </div>
      </ChromeDialogContent>
    </Dialog>
  );
}

function OrderFacsimile({ document }: { document: OrderDocument }) {
  return (
    <article className="flex flex-col gap-6 rounded-md bg-paper p-6 text-paper-foreground">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-body font-semibold">{document.court}</p>
        <p className="text-body font-semibold">Case no. {document.caseNumber}</p>
        <p className="text-body font-semibold">{document.matter}</p>
      </header>

      <h3 className="text-center text-body font-semibold">{document.title}</h3>

      <p className="text-body">{document.opening}</p>

      {document.directions.length > 0 ? (
        <ol className="flex list-decimal flex-col gap-3 ps-6">
          {document.directions.map((direction) => (
            <li key={direction.id} className="text-body">
              {direction.pending ? (
                /* Unwritten: the paper says so in the muted voice the rest of the
                   document uses, rather than printing an empty paragraph. */
                <span className="text-paper-muted-foreground">
                  {direction.body}
                </span>
              ) : (
                <RichTextValueView
                  value={{ html: direction.html, text: direction.body }}
                />
              )}
            </li>
          ))}
        </ol>
      ) : null}

      <p className="text-body">{document.closing}</p>

      <p className="text-body">Dated {document.dated}.</p>

      <p className="text-body text-paper-muted-foreground">
        {document.signature}
      </p>
    </article>
  );
}
