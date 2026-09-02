"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  CalendarCheck2Icon,
  CalendarX2Icon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";

import { BulkRescheduleTable } from "@/components/employee/bulk-reschedule-table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  filterReschedulable,
  newDateProblem,
  reschedulableHearings,
  targetDates,
  type NewHearingDates,
  type ReschedulableHearing,
} from "@/lib/employee/bulk-reschedule";
import {
  courtCaseStageLabel,
  courtHearingPurposeLabel,
  formatCourtDay,
  formatListingDate,
  isoDay,
  parseIsoDay,
} from "@/lib/employee/hearings";

/**
 * The day the bench is standing on is the reader's, not the server's — the same clock
 * today's cause list reads: the server renders its own guess and the browser replaces it
 * on hydration, so there is no mismatch to suppress and no blank first paint.
 */
const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

/** What the filter controls hold. `null` on either end means "the day the court is on". */
type RangeDraft = { from: string | null; to: string | null; query: string };

const EMPTY_DRAFT: RangeDraft = { from: null, to: null, query: "" };

function resolveRange(draft: RangeDraft, today: string) {
  return { from: draft.from ?? today, to: draft.to ?? today, query: draft.query };
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Bulk reschedule — moving a span of this court's board to another date in one act.
 *
 * The job is the day the bench does not sit: leave, transfer, a holiday declared late.
 * The court pulls up everything listed across a range of days and lists it again
 * somewhere else, rather than opening twenty case files.
 *
 * Composed exactly as today's cause list is (`HearingsScreen`) — the two screens are
 * siblings in the same rail group and the bench should not have to learn a second layout.
 * The page title stands on the page, and **one** lifted panel holds the filters, the
 * selection bar and the table together (ui-craft §4: no box inside a box). What this
 * screen adds is a sticky action bar, because the act is committed once for a list long
 * enough to scroll away from its own button.
 *
 * **This build moves nothing.** Everything up to the commitment is live — the range, the
 * search, the selection, the new date, the validation and the confirmation with its real
 * summary. The confirmation's own button is where it stops and says so, because listing a
 * matter on a new date is a judicial act and a screen that mimed it would be claiming the
 * court had done something it has not. Same bargain the row menu on today's list makes.
 */
export function BulkRescheduleScreen() {
  const today = React.useSyncExternalStore(
    NEVER_CHANGES,
    readToday,
    readToday,
  );

  /* The reference filters on a button rather than as you type, so the bench composes a
     query and then asks for it. `draft` is what the controls hold; `applied` is what the
     table is showing. Clear resets both. */
  const [draft, setDraft] = React.useState<RangeDraft>(EMPTY_DRAFT);
  const [applied, setApplied] = React.useState<RangeDraft>(EMPTY_DRAFT);

  /**
   * Selection is held as what the bench has taken *out*, not what it has put in.
   *
   * The screen opens with the whole range selected, the way the reference does and the
   * way the job runs — the court is not sitting, so the board moves. Storing the
   * exclusions means that default costs no effect and no reset: widen the range and the
   * matters that arrive are selected, narrow it and the ones that leave stop counting,
   * with no way for the action to reach a row that is not on screen.
   */
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const [newDates, setNewDates] = React.useState<NewHearingDates>({});
  const [bulkDate, setBulkDate] = React.useState<string | null>(null);
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  const range = resolveRange(applied, today);
  const rows = filterReschedulable(reschedulableHearings(today), range);
  const selectedRows = rows.filter((row) => !excluded.has(row.id));

  const problemFor = React.useCallback(
    (row: ReschedulableHearing) =>
      newDateProblem(row, newDates[row.id], today),
    [newDates, today],
  );

  const missing = selectedRows.filter(
    (row) => problemFor(row) === "missing",
  ).length;
  const stuck = selectedRows.filter((row) => {
    const problem = problemFor(row);
    return problem !== null && problem !== "missing";
  }).length;
  const ready = selectedRows.length > 0 && missing === 0 && stuck === 0;

  const isSearched = applied.query.trim() !== "";

  function applyFilters() {
    setApplied(draft);
    setBulkError(null);
  }

  function clearFilters() {
    setDraft(EMPTY_DRAFT);
    setApplied(EMPTY_DRAFT);
    setExcluded(new Set());
    setNewDates({});
    setBulkDate(null);
    setBulkError(null);
  }

  /** Moving one end of the range past the other carries the other end with it. */
  function changeRange(end: "from" | "to", next: string) {
    setDraft((current) => {
      const from = current.from ?? today;
      const to = current.to ?? today;
      if (end === "from") {
        return { ...current, from: next, to: next > to ? next : to };
      }
      return { ...current, to: next, from: next < from ? next : from };
    });
  }

  function toggleRow(id: string, next: boolean) {
    setExcluded((current) => {
      const draftSet = new Set(current);
      if (next) draftSet.delete(id);
      else draftSet.add(id);
      return draftSet;
    });
  }

  function toggleAll(next: boolean) {
    setExcluded(next ? new Set() : new Set(rows.map((row) => row.id)));
  }

  /**
   * One date, written onto everything selected.
   *
   * A date already gone is refused here rather than left to show up as nineteen bad rows:
   * the DS `DatePicker` cannot be told which days to offer (see the build report), so the
   * screen is the only place that guard can live.
   */
  function applyBulkDate() {
    if (!bulkDate) {
      setBulkError("Choose a date to apply.");
      return;
    }
    if (bulkDate < today) {
      setBulkError("A hearing cannot be listed on a date that has passed.");
      return;
    }
    setBulkError(null);
    setNewDates((current) => {
      const next = { ...current };
      for (const row of selectedRows) next[row.id] = bulkDate;
      return next;
    });
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Bulk reschedule hearings
        </h1>
        <p className="text-body text-muted-foreground">
          Move everything this court has listed across a span of days onto a new
          date, in one act.
        </p>
      </header>

      {/* One panel: the range, the selection and the list are one unit of work, so they
          share one lifted sheet — the same recipe and the same `gap-6` / `p-6` today's
          cause list uses. Nothing inside draws a second frame. */}
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <RangeFilters
          draft={draft}
          today={today}
          onQueryChange={(query) =>
            setDraft((current) => ({ ...current, query }))
          }
          onRangeChange={changeRange}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {rows.length === 0 ? (
          <NothingToMove
            range={range}
            isSearched={isSearched}
            onClear={clearFilters}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <SelectionBar
              selected={selectedRows.length}
              total={rows.length}
              date={bulkDate}
              onDateChange={(next) => {
                setBulkDate(next);
                setBulkError(null);
              }}
              onApply={applyBulkDate}
              error={bulkError}
            />

            {/* min-w-0 lets this flex item shrink below the table's content width, so a
                wide table scrolls inside the panel instead of pushing the page sideways. */}
            <div className="min-w-0 overflow-x-auto">
              {/* Seven columns do not survive a phone. Below `md` the same rows stack as
                  items — today's cause list's own answer. */}
              <div className="hidden md:block">
                <BulkRescheduleTable
                  rows={rows}
                  selected={new Set(selectedRows.map((row) => row.id))}
                  onToggle={toggleRow}
                  onToggleAll={toggleAll}
                  newDates={newDates}
                  problemFor={problemFor}
                />
              </div>
              <div className="md:hidden">
                <RescheduleItemList
                  rows={rows}
                  excluded={excluded}
                  onToggle={toggleRow}
                  newDates={newDates}
                  problemFor={problemFor}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {rows.length === 0 ? null : (
        <CommitBar
          selected={selectedRows}
          missing={missing}
          stuck={stuck}
          ready={ready}
          newDates={newDates}
        />
      )}
    </div>
  );
}

/**
 * Which days to pull in, and what to look for inside them.
 *
 * Laid out the way today's cause list lays out its filters, and labelled the same way:
 * every control carries a visible label, because the reference labels none of them and
 * the accessibility floor treats a placeholder as a hint rather than a label
 * (ACCESSIBILITY §12).
 *
 * "Search" is `secondary`, not teal. The reference paints it as a filled primary
 * alongside the reschedule button; the Ration Teal Law allows one strong action per view,
 * and the act this screen exists for is the one that earns it.
 */
function RangeFilters({
  draft,
  today,
  onQueryChange,
  onRangeChange,
  onApply,
  onClear,
}: {
  draft: RangeDraft;
  today: string;
  onQueryChange: (query: string) => void;
  onRangeChange: (end: "from" | "to", day: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const range = resolveRange(draft, today);

  return (
    <form
      className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      {/* `DatePicker` owns its trigger and takes no `id`, so each visible label names a
          group around it rather than pointing `htmlFor` at a control that does not exist.
          The trigger still announces the date it holds. */}
      <RangeEnd
        id="reschedule-from"
        label="Listed from"
        day={range.from}
        onChange={(day) => onRangeChange("from", day)}
      />
      <RangeEnd
        id="reschedule-to"
        label="Listed until"
        day={range.to}
        onChange={(day) => onRangeChange("to", day)}
      />

      {/* `Field` rather than a bare `Label htmlFor` beside an `Input id`: the DS `Input`
          only restores an `id` through `useFieldControlProps`, which returns nothing
          outside a `Field`, so a label would point at an element that does not exist.
          Upstream DS bug — today's cause list documents it at length. */}
      <Field className="min-w-0 sm:w-64">
        <FieldLabel className="text-body">Search cases</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            autoComplete="off"
            value={draft.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="case name or number"
          />
        </InputGroup>
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}

/** One end of the date range: a visible label naming the group its picker sits in. */
function RangeEnd({
  id,
  label,
  day,
  onChange,
}: {
  id: string;
  label: string;
  day: string;
  onChange: (day: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={`${id}-label`} className="w-fit text-body font-medium">
        {label}
      </span>
      <div role="group" aria-labelledby={`${id}-label`}>
        <DatePicker
          value={parseIsoDay(day)}
          onValueChange={(next) => {
            if (next) onChange(isoDay(next));
          }}
          className="w-full sm:w-52"
        />
      </div>
    </div>
  );
}

/**
 * How much is selected, and the one date that will be written onto it.
 *
 * **One picker, not one per row.** The reference puts a date control in every row; this
 * screen puts it here and the column reads back what it wrote. Two reasons, both of them
 * collisions rather than preferences (ui-craft §0): the DS `DatePicker` renders its date
 * through a fixed `en-US` format — "September 1st, 2026" — which cannot be changed
 * without forking the primitive, so twenty of them would sit beside the court's own
 * "1 Sept 2026" and disagree with it down the whole table; and the DS picker accepts no
 * `aria-*`, so twenty of them in a table have no per-row name to give. Both are in the
 * build report as upstream requests.
 *
 * Nothing the per-row column could express is lost. Sending matters to different dates is
 * still one selection and one apply per date — which is also how the bench thinks about
 * it, rather than as twenty separate decisions.
 *
 * A control-sized well, not a second card: sunken fill + hairline (Laws "Grouped
 * content" — interactive wells keep the edge; media wells do not). Count and hint
 * stack as one block on the left; the date and apply sit on the same midline, as a
 * toolbar, not a stacked field beside a paragraph. Same recipe as the pending-tasks
 * selection bar, with the hairline the Law adds when the well holds a control.
 */
function SelectionBar({
  selected,
  total,
  date,
  onDateChange,
  onApply,
  error,
}: {
  selected: number;
  total: number;
  date: string | null;
  onDateChange: (day: string) => void;
  onApply: () => void;
  error: string | null;
}) {
  return (
    <div
      role="region"
      aria-label="Selection"
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-sunken px-4 py-3 lg:flex-row lg:items-center lg:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p
          className="text-body-compact font-medium tabular-nums"
          aria-live="polite"
        >
          {selected} of {total} {plural(total, "matter", "matters")} selected
        </p>
        {error ? (
          <p role="alert" className="text-caption text-destructive-ink">
            {error}
          </p>
        ) : (
          <p
            id="reschedule-new-hint"
            className="text-caption text-muted-foreground"
          >
            Uncheck rows to send some matters to a different date, then apply
            again.
          </p>
        )}
      </div>

      <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
        <span
          id="reschedule-new-label"
          className="w-fit shrink-0 text-body-compact font-medium"
        >
          New hearing date
        </span>
        <div
          role="group"
          aria-labelledby="reschedule-new-label"
          aria-describedby={error ? undefined : "reschedule-new-hint"}
          className="min-w-0"
        >
          <DatePicker
            value={date ? parseIsoDay(date) : undefined}
            onValueChange={(next) => {
              if (next) onDateChange(isoDay(next));
            }}
            placeholder="Choose a date"
            className="w-full sm:w-60"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onApply}
          disabled={selected === 0}
          className="w-full sm:w-fit"
        >
          Apply to selected
        </Button>
      </div>
    </div>
  );
}

/**
 * Why there is nothing to move, and what to do about it.
 *
 * Two different facts, so two different states: a span the court has nothing listed in is
 * not the same as a search that matched nothing, and only the second has an action worth
 * offering. Borderless and unpadded — the panel around it is already the frame.
 */
function NothingToMove({
  range,
  isSearched,
  onClear,
}: {
  range: { from: string; to: string };
  isSearched: boolean;
  onClear: () => void;
}) {
  const span =
    range.from === range.to
      ? `on ${formatCourtDay(range.from)}`
      : `between ${formatCourtDay(range.from)} and ${formatCourtDay(range.to)}`;

  return (
    <Empty className="border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isSearched ? (
            <SearchXIcon aria-hidden />
          ) : (
            <CalendarX2Icon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isSearched ? "No matters match this search" : "Nothing to move"}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isSearched
            ? `No matter listed ${span} matches the case name or number you asked for.`
            : `This court has nothing listed ${span} that it could move.`}
        </EmptyDescription>
      </EmptyHeader>
      {isSearched ? (
        <EmptyContent>
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/**
 * The same rows below `md`, stacked.
 *
 * A board read on a phone is still the cause, its number and the two dates — where the
 * matter stands now and where it would go. The columns that only support scanning (stage,
 * hearing type) drop to a caption line rather than forcing a seven-column table through a
 * 375px screen.
 */
function RescheduleItemList({
  rows,
  excluded,
  onToggle,
  newDates,
  problemFor,
}: {
  rows: ReschedulableHearing[];
  excluded: ReadonlySet<string>;
  onToggle: (id: string, next: boolean) => void;
  newDates: NewHearingDates;
  problemFor: (row: ReschedulableHearing) => ReturnType<typeof newDateProblem>;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const isSelected = !excluded.has(row.id);
        const newDate = newDates[row.id];
        const problem = problemFor(row);
        const note =
          isSelected && newDate && problem && problem !== "missing"
            ? problem === "unchanged"
              ? "Already listed on this date"
              : "This date has passed"
            : null;

        return (
          <li
            key={row.id}
            className="flex gap-3 rounded-lg border border-hairline bg-surface-sunken p-4"
          >
            {/* The DS box expands its own hit area to 40×40; the name it carries is the
                matter, not the column, because a row read aloud has no column header. */}
            <span className="pt-0.5">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(next) => onToggle(row.id, next === true)}
                aria-label={`Select ${row.title}, ${row.caseNumber}`}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-body-compact font-medium">{row.title}</p>
              <p className="text-caption text-muted-foreground">
                <span className="tabular-nums">{row.caseNumber}</span> ·{" "}
                {courtCaseStageLabel(row.stage)} ·{" "}
                {courtHearingPurposeLabel(row.purpose)}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-body-compact tabular-nums">
                <span className="text-muted-foreground">
                  {formatListingDate(row.date)}
                </span>
                <ArrowRightIcon
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                {newDate ? (
                  <span className="font-medium">
                    {formatListingDate(newDate)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    <span aria-hidden>&mdash;</span>
                    <span className="sr-only">No new date yet</span>
                  </span>
                )}
              </p>
              {note ? (
                <p className="text-caption text-destructive-ink">{note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * What is ready, and the act itself.
 *
 * Sticky, because the list it commits is longer than a screen and a button that scrolls
 * away from its own selection is a button the bench has to hunt for. Chrome, so it is
 * `bg-card` over a hairline seam and never carries the panel's full-strength edge
 * (ui-craft §4, layer 2); the negative margins let it span the page's own padding.
 *
 * `z-30` is the chrome layer this app already uses — the top bar and the filing footer
 * both sit there. It has to clear the table's own sticky date column, which rides at
 * `z-20`: the panel opens no stacking context of its own, so that column and this bar
 * compete directly, and at `z-10` the bar was painted over by nineteen scrolling cells.
 *
 * The count beside it is `aria-live`, so a screen reader hears the selection change
 * without going looking for the number.
 */
function CommitBar({
  selected,
  missing,
  stuck,
  ready,
  newDates,
}: {
  selected: ReschedulableHearing[];
  missing: number;
  stuck: number;
  ready: boolean;
  newDates: NewHearingDates;
}) {
  const count = selected.length;
  const targets = targetDates(selected, newDates);

  let summary: string;
  if (count === 0) {
    summary = "Select the matters to move.";
  } else if (missing > 0) {
    summary = `${missing} selected ${plural(missing, "matter", "matters")} ${plural(missing, "has", "have")} no new date yet.`;
  } else if (stuck > 0) {
    summary = `${stuck} selected ${plural(stuck, "matter", "matters")} ${plural(stuck, "is", "are")} already listed on the date chosen.`;
  } else {
    summary = `${count} ${plural(count, "matter", "matters")} ready to move.`;
  }

  return (
    <div className="sticky bottom-0 z-30 -mx-6 -mb-6 border-t border-hairline bg-card px-6 py-3 md:-mx-8 md:-mb-8 md:px-8 md:py-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p
          className="mr-auto text-body-compact text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {summary}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!ready} className="w-full sm:w-fit">
              <CalendarCheck2Icon data-icon="inline-start" aria-hidden />
              {count > 0
                ? `Reschedule ${count} ${plural(count, "hearing", "hearings")}`
                : "Reschedule hearings"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {targets.length === 1
                  ? `Move ${count} ${plural(count, "hearing", "hearings")} to ${formatCourtDay(targets[0])}?`
                  : `Reschedule ${count} ${plural(count, "hearing", "hearings")}?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body">
                {targets.length === 1
                  ? "Each matter comes off the date it stands listed on now and is listed on the new one."
                  : `Each matter comes off the date it stands listed on now and is listed on one of ${targets.length} new dates.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* The court has not built the act, so the screen does not mime it. Said here,
                at the moment of the act, rather than left for the bench to discover. */}
            <p className="text-caption text-muted-foreground">
              Not part of this build — nothing is written and no one is told.
            </p>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button disabled>Reschedule hearings</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
