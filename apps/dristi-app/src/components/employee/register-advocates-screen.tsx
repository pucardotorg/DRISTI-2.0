"use client";

import * as React from "react";
import { SearchIcon, SearchXIcon, UserCheckIcon } from "lucide-react";

import { ListFooter } from "@/components/employee/list-footer";
import { RegisterAdvocateDialog } from "@/components/employee/register-advocates-dialog";
import { RegisterAdvocatesTable } from "@/components/employee/register-advocates-table";
import { Badge } from "@/components/ui/badge";
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
import { PAGE_SIZE, type HearingsPageSize } from "@/lib/employee/hearings";
import {
  EMPTY_REGISTER_ADVOCATES_FILTERS,
  REGISTER_ADVOCATES_QUEUE,
  filterRegistrations,
  formatDaysWaitingSpoken,
  registrationWaitTone,
  requestKindLabel,
  type AdvocateRegistration,
  type RegisterAdvocatesFilters,
  type WaitTone,
} from "@/lib/employee/register-advocates";
import { cn } from "@/lib/utils";

const waitClass: Record<WaitTone, string> = {
  plain: "",
  warning: "text-warning-ink",
  destructive: "text-destructive-ink",
};

/**
 * Register advocates — the registration requests waiting on this court's scrutiny officer.
 *
 * Deliberately the same screen as its siblings in the rail: the page title stands on the
 * page, and **one** lifted panel holds the search, the table and the pagination footer
 * together. Same panel recipe, same `gap-6` / `p-6`, same table treatment, same empty
 * states, literally the same footer component. An officer moving from "Register cases" to
 * this row should not have to re-learn the furniture in between.
 *
 * What this screen adds is a decision taken **without leaving the list**. The legacy path
 * was row → Verify → a detail page → Accept → a confirmation → a success dialog → "Go to
 * home": six steps per request and a trip back to a home nobody asked for, at the
 * reference's own count of thirty-nine pending. Here the application number opens an
 * overlay, the officer decides in it, the row leaves, and the search box takes the focus
 * back.
 *
 * **There is no bulk path, and that is the one place this screen breaks from its nearest
 * sibling.** `ApproveCopyApplicationScreen` clears its queue with checkboxes and a sticky
 * bar, because there the evidence is a document the court itself composed. Here the
 * evidence is a photograph of a Bar ID card, collected for the sole reason that a human
 * looks at it (handover `REG-14`), and the outcome is a credential: the person may then
 * act as an advocate on real §138 files. A control that let an officer clear thirty-nine
 * registrations without opening a single photograph would void the only identity check
 * the product has. Clearing the queue is therefore slow by construction.
 *
 * **Nothing here is approved or refused.** Both paths drop their rows from the demo queue
 * and nothing else — see `lib/employee/register-advocates.ts`. No account is opened, no
 * access is granted or withheld, no reason is sent, and nothing persists past a reload.
 */
export function RegisterAdvocatesScreen() {
  /* The court side filters on a button rather than as you type, so the officer composes a
     query and then asks for it. `draft` is what the control holds; `applied` is what the
     table is showing. Clear resets both. */
  const [draft, setDraft] = React.useState<RegisterAdvocatesFilters>(
    EMPTY_REGISTER_ADVOCATES_FILTERS,
  );
  const [applied, setApplied] = React.useState<RegisterAdvocatesFilters>(
    EMPTY_REGISTER_ADVOCATES_FILTERS,
  );
  const [pageSize, setPageSize] = React.useState<HearingsPageSize>(PAGE_SIZE);
  const [page, setPage] = React.useState(1);
  const [decidedIds, setDecidedIds] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [open, setOpen] = React.useState<AdvocateRegistration | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  const remaining = REGISTER_ADVOCATES_QUEUE.filter(
    (request) => !decidedIds.has(request.id),
  );
  const rows = filterRegistrations(remaining, applied);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const isFiltered = applied.query.trim() !== "";

  const canSearch = isPendingFilterChange(draft, applied);

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_REGISTER_ADVOCATES_FILTERS);
    setApplied(EMPTY_REGISTER_ADVOCATES_FILTERS);
    setPage(1);
  }

  /** Both decisions end here: the row leaves the demo queue, and nothing else happens. */
  function removeFromQueue(id: string, spoken: string) {
    setDecidedIds((current) => new Set(current).add(id));
    setAnnouncement(spoken);
  }

  function approveOne(request: AdvocateRegistration) {
    setOpen(null);
    removeFromQueue(
      request.id,
      `${request.applicationNumber} approved on this screen and removed from the queue. No account was opened and nobody was told.`,
    );
  }

  function rejectOne(request: AdvocateRegistration) {
    setOpen(null);
    removeFromQueue(
      request.id,
      `${request.applicationNumber} rejected on this screen and removed from the queue. The reason was not sent to anyone.`,
    );
  }

  function returnFocus() {
    searchRef.current?.focus();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Register advocates
        </h1>
        {/* The count is the whole point of the queue, so the supporting line carries it
            rather than restating the title. Singular is spelled out because
            "1 advocates" is the kind of thing a court notices. */}
        <p className="text-body text-muted-foreground">
          {remaining.length === 1
            ? "1 advocate is waiting for approval."
            : `${remaining.length} advocates are waiting for approval.`}
        </p>
      </header>

      {/* One panel: search, list and footer are one unit of work, so they share one lifted
          sheet — the same recipe every other court-side list uses. Nothing inside draws a
          second frame. */}
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <RegistrationFilters
          draft={draft}
          searchRef={searchRef}
          onDraftChange={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          canSearch={canSearch}
        />

        {pageRows.length === 0 ? (
          <RegistrationsEmpty isFiltered={isFiltered} onClear={clearFilters} />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {/* min-w-0 lets this flex item shrink below the table's content width, so a
                wide table scrolls inside the panel instead of pushing the page sideways. */}
            <div className="min-w-0 overflow-x-auto">
              {/* Five columns do not survive a phone, and they do not survive a laptop
                  either. Measured on the render: the table's natural width is ~780px, and
                  what the panel actually offers is the viewport less the 256px rail, the
                  page's `p-8` and the panel's `p-6` — 656px at 1024. The column that goes
                  over the right edge is `Days waiting`: the one tied to a statutory clock,
                  and the key the queue is read by. A wait an officer has to scroll
                  sideways to reach is a wait they will not see.
                  So the swap is at `xl`, two steps later than the sibling queues rather
                  than one. `lg` was the obvious cut and it is the wrong one — at exactly
                  1024 the table comes back and is still clipped; the whole table first
                  fits somewhere around 1150, and `xl` is the next rung of the ladder past
                  that (RESPONSIVE.md: use the prefix, do not hardcode a pixel breakpoint).
                  Below it the stacked items carry every one of these facts and spell the
                  wait out in words. (The sibling tables are five columns too and clip the
                  same way; whether they move with this one is their own change.) */}
              <div className="hidden xl:block">
                <RegisterAdvocatesTable rows={pageRows} onOpen={setOpen} />
              </div>
              <div className="xl:hidden">
                <RegistrationItemList rows={pageRows} onOpen={setOpen} />
              </div>
            </div>

            <ListFooter
              id="register-advocates-page-size"
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

      {/* What actually changed, for anyone not watching the list. A decision that only
          shows as a row disappearing is silent to a screen reader. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <RegisterAdvocateDialog
        request={open}
        onOpenChange={setOpen}
        onApprove={approveOne}
        onReject={rejectOne}
        onReturnFocus={returnFocus}
      />
    </div>
  );
}

/**
 * One text box, then search — the whole filter row.
 *
 * The reference sliced this queue by *User Type*, whose only value on this screen is
 * Advocate, and by *Application Number* alone, which is the one identifier an officer is
 * least likely to be holding. Neither completes a sentence anybody would say. What
 * replaces both is a single box reaching the name, the Bar registration ID and the
 * application number, because which of the three the officer has depends only on how the
 * question reached them. The visible label is "Search requests" so it does not promise
 * less than it does (ACCESSIBILITY §12 wants a permanent label either way).
 *
 * "Search" is the teal one here. The Ration Teal Law allows one strong action per visual
 * region, and this page has no page-level act to spend it on — there is no bulk approve
 * (see the screen doc) — so it goes to the only committing control present, exactly as
 * `RegisterCasesScreen` does. In the overlay the teal is Approve.
 */
function RegistrationFilters({
  draft,
  searchRef,
  onDraftChange,
  onApply,
  onClear,
  canSearch,
}: {
  draft: RegisterAdvocatesFilters;
  searchRef: React.Ref<HTMLInputElement>;
  onDraftChange: (filters: RegisterAdvocatesFilters) => void;
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
      {/* `Field` rather than a bare `Label htmlFor` beside an `Input id`. The DS `Input`
          destructures `id` out of its props and only puts it back through
          `useFieldControlProps`, which returns nothing when there is no `Field` context —
          so an `id` handed to an `Input` outside a `Field` is dropped and the label points
          at an element that does not exist. `Field` supplies the context, and the label
          and the control agree on one generated id. Upstream DS bug; see `HearingsFilters`. */}
      <Field className="min-w-0 sm:w-96">
        <FieldLabel className="text-body">Search requests</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            autoComplete="off"
            value={draft.query}
            onChange={(event) =>
              onDraftChange({ ...draft, query: event.target.value })
            }
            placeholder="name, Bar registration ID or application number"
          />
        </InputGroup>
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSearch}>
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Clear search
        </Button>
      </div>
    </form>
  );
}

/**
 * Why the list is empty, and what to do about it.
 *
 * Two different facts, so two different states: a search that matched nothing is a dead
 * end with an action worth offering, while an empty queue is the office being up to date —
 * the same good-empty the sibling queues use. No action is offered on that one, because
 * there is nothing for the court to do: every row in this queue arrives from the other
 * side of the product. Borderless and unpadded; the panel is already the frame.
 */
function RegistrationsEmpty({
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
            <UserCheckIcon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isFiltered
            ? "No requests match this search"
            : "No registrations waiting"}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isFiltered
            ? "No request waiting for approval matches the name, Bar registration ID or application number you searched for."
            : "Every advocate who has applied to this court has been dealt with."}
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
 * The same rows below `xl`, stacked.
 *
 * A queue read on a phone, a tablet or a narrow laptop is still who is waiting, what they
 * claim and how long they have been kept — and the officer can still open and decide one,
 * because a phone that could only read this list would be a phone that cannot do the work. The
 * column headers are gone, so each fact is spelled out where the header would have said
 * it — which is why the wait reads "19 days waiting" here and not "19".
 */
function RegistrationItemList({
  rows,
  onOpen,
}: {
  rows: AdvocateRegistration[];
  onOpen: (request: AdvocateRegistration) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((request) => {
        const kind = requestKindLabel(request);
        return (
          <li
            key={request.id}
            className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4"
          >
            <button
              type="button"
              onClick={() => onOpen(request)}
              className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
            >
              <span className="sr-only">Review </span>
              {request.applicationNumber}
            </button>
            <p
              className="min-w-0 text-body-compact"
              lang={request.fullNameLang}
            >
              {request.fullName}
            </p>
            <p className="text-caption text-muted-foreground">
              <span className="tabular-nums">{request.barRegistrationId}</span>
              {" · "}
              <span
                className={cn(
                  "tabular-nums",
                  waitClass[registrationWaitTone(request.daysWaiting)],
                )}
              >
                {formatDaysWaitingSpoken(request.daysWaiting)}
              </span>
            </p>
            {/* Neutral, for the reason `RegisterAdvocatesTable` gives: the row's one
                status cue is the wait, and the kind is a fact beside it. */}
            {kind ? (
              <Badge variant="secondary" className="w-fit">
                {kind}
              </Badge>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
