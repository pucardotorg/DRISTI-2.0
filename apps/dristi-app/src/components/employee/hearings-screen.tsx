"use client";

import * as React from "react";
import { CalendarX2Icon, SearchIcon, SearchXIcon, VideoIcon } from "lucide-react";

import { CounselCell } from "@/components/employee/counsel-cell";
import { HearingsTable } from "@/components/employee/hearings-table";
import { ListFooter } from "@/components/employee/list-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  filterHearings,
  formatCourtDay,
  hearingsForDay,
  isoDay,
  parseIsoDay,
  COURT_HEARING_PURPOSES,
  COURT_HEARING_STATUSES,
  EMPTY_FILTERS,
  type CourtHearing,
  type HearingFilters,
  type HearingsPageSize,
} from "@/lib/employee/hearings";

/**
 * The day the bench is sitting on is the reader's, not the server's — a court in Kollam
 * should not be shown yesterday's list because the process serving it woke up somewhere
 * else. Read the way the rail reads its greeting: the server renders its own guess and
 * the browser replaces it on hydration, so there is no mismatch to suppress and no blank
 * first paint. It does not re-subscribe; a screen left open across midnight is settled by
 * the next navigation.
 */
const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

/**
 * Today's hearings — the court's cause list for the day it is sitting.
 *
 * Composed the way the advocate's cases list is composed (`CasesListScreen`), because it
 * is the same kind of screen and the bench should not have to learn a second layout: the
 * page title stands on the page, and **one** lifted panel holds the filters, the table
 * and the pagination footer together. The filters live inside that panel rather than
 * floating on the page — they belong to the list they filter, and a second framed box
 * below them would be the box-in-box the layering model rules out (ui-craft §4).
 */
export function HearingsScreen() {
  const today = React.useSyncExternalStore(
    NEVER_CHANGES,
    readToday,
    readToday,
  );

  /* `null` means "the day the court is sitting" — resolved against the reader's clock
     rather than frozen at first render, so the screen is right whenever it is opened. */
  const [day, setDay] = React.useState<string | null>(null);
  const activeDay = day ?? today;

  /* The reference filters on a button rather than as you type, so the bench composes a
     query and then asks for it. `draft` is what the controls hold; `applied` is what the
     table is showing. Clear resets both. */
  const [draft, setDraft] = React.useState<HearingFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = React.useState<HearingFilters>(EMPTY_FILTERS);
  const [pageSize, setPageSize] = React.useState<HearingsPageSize>(30);
  const [page, setPage] = React.useState(1);

  const listed = hearingsForDay(activeDay, today);
  const rows = filterHearings(listed, applied);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const isFiltered =
    applied.status !== "all" ||
    applied.purpose !== "all" ||
    applied.query !== "";

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setDay(null);
    setPage(1);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Today&rsquo;s hearings
        </h1>
        <p className="text-body text-muted-foreground">
          {activeDay === today ? "Today, " : ""}
          {formatCourtDay(activeDay)}
        </p>
      </header>

      {/* One panel: filters, list and footer are one unit of work, so they share one
          lifted sheet — the same recipe and the same `gap-6` / `p-6` the cases panel
          uses. Nothing inside draws a second frame. */}
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <HearingsFilters
          draft={draft}
          onDraftChange={setDraft}
          day={activeDay}
          onDayChange={(next) => {
            setDay(next);
            setPage(1);
          }}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {pageRows.length === 0 ? (
          <HearingsEmpty
            day={activeDay}
            isFiltered={isFiltered}
            onClear={clearFilters}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {/* min-w-0 lets this flex item shrink below the table's content width, so a
                wide table scrolls inside the panel instead of pushing the page sideways. */}
            <div className="min-w-0 overflow-x-auto">
              {/* Seven columns do not survive a phone. Below `md` the same rows stack as
                  items — the advocate list's own answer. */}
              <div className="hidden md:block">
                <HearingsTable rows={pageRows} />
              </div>
              <div className="md:hidden">
                <HearingsItemList rows={pageRows} />
              </div>
            </div>

            <ListFooter
              id="hearings-page-size"
              from={start + 1}
              to={start + pageRows.length}
              total={rows.length}
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Status, purpose, day and free text — then apply. Plus the court's own action.
 *
 * The row is laid out the way the cases panel lays out its header: what filters the list
 * on the left, the control that acts on the court at the far right, stacking first on
 * narrow screens (RESPONSIVE).
 *
 * Every control carries a visible label. The reference labels none of them, leaning on
 * placeholders instead, which the accessibility floor treats as a defect rather than a
 * style (ACCESSIBILITY §12: placeholders may hint format, they are not labels) — so the
 * labels are the deviation, and the smallest one available.
 *
 * "Search" is `secondary`, not teal. The reference paints both it and "Join VC" as filled
 * primaries; the Ration Teal Law allows one strong action per view, and the court-level
 * action is the one that earns it.
 */
function HearingsFilters({
  draft,
  onDraftChange,
  day,
  onDayChange,
  onApply,
  onClear,
}: {
  draft: HearingFilters;
  onDraftChange: (filters: HearingFilters) => void;
  day: string;
  onDayChange: (day: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
      <form
        className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="hearings-status" className="w-fit text-body">
            Status
          </Label>
          <Select
            value={draft.status}
            onValueChange={(value) =>
              onDraftChange({
                ...draft,
                status: value as HearingFilters["status"],
              })
            }
          >
            <SelectTrigger id="hearings-status" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {COURT_HEARING_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="hearings-purpose" className="w-fit text-body">
            Purpose
          </Label>
          <Select
            value={draft.purpose}
            onValueChange={(value) =>
              onDraftChange({
                ...draft,
                purpose: value as HearingFilters["purpose"],
              })
            }
          >
            <SelectTrigger id="hearings-purpose" className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All purposes</SelectItem>
              {COURT_HEARING_PURPOSES.map((purpose) => (
                <SelectItem key={purpose.id} value={purpose.id}>
                  {purpose.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* `DatePicker` owns its trigger and takes no `id`, so the visible label names a
            group around it rather than pointing `htmlFor` at a control that does not
            exist. The trigger still announces the date it holds. */}
        <div className="flex min-w-0 flex-col gap-2">
          <span id="hearings-day-label" className="w-fit text-body font-medium">
            Hearing date
          </span>
          <div role="group" aria-labelledby="hearings-day-label">
            <DatePicker
              value={parseIsoDay(day)}
              onValueChange={(next) => {
                if (next) onDayChange(isoDay(next));
              }}
              className="w-full sm:w-52"
            />
          </div>
        </div>

        {/* `Field` rather than a bare `Label htmlFor` beside an `Input id`. The DS `Input`
            destructures `id` out of its props and only puts it back through
            `useFieldControlProps`, which returns nothing when there is no `Field`
            context — so an `id` handed to an `Input` outside a `Field` is dropped and the
            label points at an element that does not exist. `Field` supplies the context,
            and the label and the control agree on one generated id. Upstream DS bug; the
            advocate's cases search is currently broken this exact way. */}
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
              onChange={(event) =>
                onDraftChange({ ...draft, query: event.target.value })
              }
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

      {/* "Join VC" operates on the court's sitting, not on any one matter, so it sits in
          the panel's chrome at the far end rather than on a row (ui-craft §0). It is the
          screen's single teal action, and it is `aria-disabled` with a tooltip that says
          why: video conferencing is not part of this build, and a live-looking primary
          would promise the bench a courtroom it cannot open. */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-disabled className="w-full shrink-0 sm:w-fit">
              <VideoIcon data-icon="inline-start" aria-hidden />
              Join VC
            </Button>
          </TooltipTrigger>
          <TooltipContent>Not part of this build</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Why the list is empty, and what to do about it.
 *
 * Two different facts, so two different states: a day the court has no listing for is not
 * the same as a filter that matched nothing, and only the second one has an action worth
 * offering. Borderless and unpadded — the panel around it is already the frame.
 */
function HearingsEmpty({
  day,
  isFiltered,
  onClear,
}: {
  day: string;
  isFiltered: boolean;
  onClear: () => void;
}) {
  return (
    <Empty className="border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isFiltered ? (
            <SearchXIcon aria-hidden />
          ) : (
            <CalendarX2Icon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isFiltered ? "No matters match these filters" : "Nothing listed"}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isFiltered
            ? "No matter on this day's list matches the status, purpose or search you asked for."
            : `This court has no hearings listed for ${formatCourtDay(day)}.`}
        </EmptyDescription>
      </EmptyHeader>
      {isFiltered ? (
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
 * A cause list read on a phone is still the court's serial, the cause, and where it
 * stands — the columns that only support scanning (counsel, purpose) drop to a caption
 * line rather than forcing a seven-column table through a 375px screen.
 */
function HearingsItemList({ rows }: { rows: CourtHearing[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((hearing) => {
        const complainant = counselFor(hearing, "complainant");
        const accused = counselFor(hearing, "accused");
        return (
          <li
            key={hearing.id}
            className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-body-compact font-medium">
                <span className="text-muted-foreground tabular-nums">
                  {hearing.item}.
                </span>{" "}
                {causeTitle(hearing)}
              </p>
              <Badge
                variant={courtHearingStatusVariant(hearing.status)}
                className="shrink-0"
              >
                {courtHearingStatusLabel(hearing.status)}
              </Badge>
            </div>
            <p className="text-caption text-muted-foreground">
              <span className="tabular-nums">{hearing.caseNumber}</span> ·{" "}
              {courtHearingPurposeLabel(hearing.purpose)}
            </p>
            {/* Comfortable, not dense: on a phone the +N chip gets the full 40×40
                target, and a tap opens the same list the pointer hover does. */}
            <CounselCell
              complainant={complainant.map((counsel) => counsel.name)}
              accused={accused.map((counsel) => counsel.name)}
            />
          </li>
        );
      })}
    </ul>
  );
}
