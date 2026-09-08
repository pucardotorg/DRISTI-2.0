"use client";

import * as React from "react";
import { FolderCheckIcon, SearchIcon, SearchXIcon } from "lucide-react";

import { CounselCell } from "@/components/employee/counsel-cell";
import { ListFooter } from "@/components/employee/list-footer";
import { RegisterCasesTable } from "@/components/employee/register-cases-table";
import { Button } from "@/components/ui/button";
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
import { isPendingFilterChange } from "@/lib/employee/filter-state";
import {
  causeTitle,
  counselFor,
  PAGE_SIZE,
  type HearingsPageSize,
} from "@/lib/employee/hearings";
import {
  EMPTY_REGISTER_FILTERS,
  REGISTER_QUEUE,
  filterRegisterCases,
  type RegisterCase,
  type RegisterFilters,
} from "@/lib/employee/register-cases";

/**
 * Register cases — complaints this court has not yet taken on the register.
 *
 * Deliberately the same screen as `ScheduleScreen`, one group over in the rail: the
 * page title stands on the page, and **one** lifted panel holds the filters, the
 * table and the pagination footer together. Same panel recipe, same `gap-6` / `p-6`,
 * same table treatment, same footer — literally the same footer component. A bench
 * moving from "Schedule hearing" to "Register cases" is looking at one court's work
 * at two moments, and should not have to re-learn the furniture in between.
 *
 * What differs is only what the list actually is. There is no stage to filter by —
 * a complaint in this queue is in one state, waiting — so the reference's single
 * search is the only control. The search reaches counsel as well as the cause and
 * the number, because that is the question the reference labelled.
 */
export function RegisterCasesScreen() {
  /* The reference filters on a button rather than as you type, so the clerk composes
     a query and then asks for it. `draft` is what the controls hold; `applied` is
     what the table is showing. Clear resets both. */
  const [draft, setDraft] = React.useState<RegisterFilters>(
    EMPTY_REGISTER_FILTERS,
  );
  const [applied, setApplied] = React.useState<RegisterFilters>(
    EMPTY_REGISTER_FILTERS,
  );
  const [pageSize, setPageSize] = React.useState<HearingsPageSize>(PAGE_SIZE);
  const [page, setPage] = React.useState(1);

  const rows = filterRegisterCases(REGISTER_QUEUE, applied);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const isFiltered = applied.query !== "";

  const canSearch = isPendingFilterChange(draft, applied);

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_REGISTER_FILTERS);
    setApplied(EMPTY_REGISTER_FILTERS);
    setPage(1);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Register cases
        </h1>
        {/* The count is the whole point of the queue, so the supporting line carries
            it rather than restating the title. Singular is spelled out because
            "1 complaints" is the kind of thing a court notices. */}
        <p className="text-body text-muted-foreground">
          {REGISTER_QUEUE.length === 1
            ? "1 complaint is waiting to be registered."
            : `${REGISTER_QUEUE.length} complaints are waiting to be registered.`}
        </p>
      </header>

      {/* One panel: filters, list and footer are one unit of work, so they share one
          lifted sheet — the same recipe the cause list and the scheduling queue use.
          Nothing inside draws a second frame. */}
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <RegisterCasesFilters
          draft={draft}
          onDraftChange={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          canSearch={canSearch}
        />

        {pageRows.length === 0 ? (
          <RegisterCasesEmpty isFiltered={isFiltered} onClear={clearFilters} />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {/* min-w-0 lets this flex item shrink below the table's content width, so
                a wide table scrolls inside the panel instead of pushing the page
                sideways. */}
            <div className="min-w-0 overflow-x-auto">
              {/* Four columns do not survive a phone. Below `md` the same rows stack
                  as items — the scheduling queue's own answer. */}
              <div className="hidden md:block">
                <RegisterCasesTable rows={pageRows} />
              </div>
              <div className="md:hidden">
                <RegisterCasesItemList rows={pageRows} />
              </div>
            </div>

            <ListFooter
              id="register-cases-page-size"
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
 * Free text, then apply — the reference's one control, laid out the way the
 * scheduling queue lays out its two.
 *
 * Every control carries a visible label. The reference labels the box with the
 * things it searches, which is a hint rather than a name; ACCESSIBILITY §12 wants
 * a permanent label, so "Search cases" is the deviation, and the smallest one
 * available. The placeholder keeps the reference's reach (name, number, advocate).
 *
 * "Search" is the teal one here. The Ration Teal Law allows one strong action per
 * view and it is spent on the loudest thing present: there is nothing above the
 * filters, and the reference paints Search as the primary.
 */
function RegisterCasesFilters({
  draft,
  onDraftChange,
  onApply,
  onClear,
  canSearch,
}: {
  draft: RegisterFilters;
  onDraftChange: (filters: RegisterFilters) => void;
  onApply: () => void;
  onClear: () => void;
  canSearch: boolean;
}) {
  return (
    <form
      className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      {/* `Field` rather than a bare `Label htmlFor` beside an `Input id`. The DS
          `Input` destructures `id` out of its props and only puts it back through
          `useFieldControlProps`, which returns nothing when there is no `Field`
          context — so an `id` handed to an `Input` outside a `Field` is dropped
          and the label points at an element that does not exist. `Field` supplies
          the context, and the label and the control agree on one generated id.
          Upstream DS bug; see `HearingsFilters`. */}
      <Field className="min-w-0 sm:w-80">
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
            placeholder="case name, number or advocate"
          />
        </InputGroup>
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSearch}>
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}

/**
 * Why the list is empty, and what to do about it.
 *
 * Two different facts, so two different states: a filter that matched nothing is a
 * dead end with an action worth offering, while an empty queue is the court being
 * up to date — the same good-empty Schedule hearing already uses. Borderless and
 * unpadded; the panel is already the frame.
 */
function RegisterCasesEmpty({
  isFiltered,
  onClear,
}: {
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
            <FolderCheckIcon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isFiltered ? "No matters match this search" : "Nothing waiting"}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isFiltered
            ? "No complaint waiting to be registered matches the search you asked for."
            : "Every complaint before this court is already on the register."}
        </EmptyDescription>
      </EmptyHeader>
      {isFiltered ? (
        <EmptyContent>
          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/**
 * The same rows below `md`, stacked.
 *
 * A queue read on a phone is still the cause, its number and how long it has
 * waited — the advocates drop to their own line rather than forcing a four-column
 * table through a 375px screen. Days are spelled out because there is no column
 * header to name the unit.
 */
function RegisterCasesItemList({ rows }: { rows: RegisterCase[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((matter) => (
        <li
          key={matter.id}
          className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4"
        >
          <p className="min-w-0 text-body-compact font-medium">
            {causeTitle(matter)}
          </p>
          <p className="text-caption text-muted-foreground">
            <span className="tabular-nums">{matter.caseNumber}</span>
            {" · "}
            <span className="tabular-nums text-warning-ink">
              {matter.daysSinceSubmitted}
            </span>{" "}
            {matter.daysSinceSubmitted === 1
              ? "day since submitted"
              : "days since submitted"}
          </p>
          <CounselCell
            complainant={counselFor(matter, "complainant").map(
              (counsel) => counsel.name,
            )}
            accused={counselFor(matter, "accused").map(
              (counsel) => counsel.name,
            )}
          />
        </li>
      ))}
    </ul>
  );
}
