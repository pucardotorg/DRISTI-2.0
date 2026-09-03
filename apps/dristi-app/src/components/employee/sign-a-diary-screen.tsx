"use client";

import * as React from "react";
import { BookCheckIcon, CalendarXIcon, NotebookPenIcon } from "lucide-react";

import { ListFooter } from "@/components/employee/list-footer";
import { SignADiaryDialog } from "@/components/employee/sign-a-diary-dialog";
import { SignADiaryTable } from "@/components/employee/sign-a-diary-table";
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
import {
  causeTitle,
  formatCourtDay,
  isoDay,
  parseIsoDay,
  PAGE_SIZE,
  type HearingsPageSize,
} from "@/lib/employee/hearings";
import {
  DEFAULT_A_DIARY_FILTERS,
  aDiaryEntries,
  filterADiary,
  formatADiaryDate,
  resolveADiaryDay,
  saveBusinessOfTheDay,
  type ADiaryEntry,
  type ADiaryFilters,
} from "@/lib/employee/sign-a-diary";

/**
 * The day the bench is sitting on is the reader's, not the server's — a court in Kollam
 * should not be shown yesterday's register because the process serving it woke up
 * somewhere else. The server renders its own guess and the browser replaces it on
 * hydration, so there is no mismatch to suppress and no blank first paint. Lifted from
 * `HearingsScreen`, which needs the same day for the same reason.
 */
const NEVER_CHANGES = () => () => {};
const readToday = () => isoDay(new Date());

/**
 * Sign A-Diary — the court's own register of its day, waiting for the signature that
 * makes it a record.
 *
 * The same screen as its siblings in the rail: the page title stands on the page, and
 * **one** lifted panel holds the filter, the table and the pagination footer together.
 * Same panel recipe, same `gap-6` / `p-6`, same table treatment, literally the same
 * footer component. A bench moving between the rail's rows is looking at one court's
 * work through several windows and should not have to re-learn the furniture in between.
 *
 * Three things make this one different, and all three come from what an A-Diary is:
 *
 * - **It is read a day at a time.** The one filter is a date, and it opens on the day the
 *   court is sitting, as the reference draws it. There is no "every day": the register is
 *   dated paper, and Clear returns to today rather than pouring three days into a table
 *   whose columns cannot tell them apart.
 * - **There is no bulk act.** The reference gives this queue no checkboxes, and it is
 *   right to: the two signing queues above it sign papers the court has already
 *   finished, while signing the diary means reading what was written and correcting it
 *   first. So there is no selection and no sticky bar, and the screen's one strong action
 *   is the reference's own teal Search.
 * - **The record is editable until it is signed.** That lives in the entry dialog, beside
 *   the words it changes.
 *
 * **Nothing on this screen signs, records or files anything.** Saving replaces a string
 * in the demo register and signing drops the entry from it — see
 * `lib/employee/sign-a-diary.ts`.
 */
export function SignADiaryScreen() {
  const today = React.useSyncExternalStore(
    NEVER_CHANGES,
    readToday,
    readToday,
  );

  /* The register is state because both acts change it: Save rewrites an entry's business,
     Sign drops the entry. One list, so the table, the count on the page and the dialog
     can never disagree about what is still unsigned. */
  const [register, setRegister] = React.useState<ADiaryEntry[]>(() =>
    aDiaryEntries(today),
  );
  /* The reference filters on a button rather than as you pick, so the bench chooses a day
     and then asks for it. `draft` is what the control holds; `applied` is what the table
     is showing. Clear resets both to today. */
  const [draft, setDraft] = React.useState<ADiaryFilters>(
    DEFAULT_A_DIARY_FILTERS,
  );
  const [applied, setApplied] = React.useState<ADiaryFilters>(
    DEFAULT_A_DIARY_FILTERS,
  );
  const [pageSize, setPageSize] = React.useState<HearingsPageSize>(PAGE_SIZE);
  const [page, setPage] = React.useState(1);
  /* The open entry is held by id, not by value: Save changes the entry under the dialog,
     and a dialog holding a copy would keep showing the words the bench has just
     corrected. */
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const appliedDay = resolveADiaryDay(applied, today);
  const rows = filterADiary(register, applied, today);
  const open = register.find((entry) => entry.id === openId) ?? null;

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  function applyFilters() {
    setApplied(draft);
    setPage(1);
  }

  function showToday() {
    setDraft(DEFAULT_A_DIARY_FILTERS);
    setApplied(DEFAULT_A_DIARY_FILTERS);
    setPage(1);
  }

  /** Record the corrected words. The entry stays unsigned and stays in the register. */
  function save(entry: ADiaryEntry, business: string) {
    setRegister((current) => saveBusinessOfTheDay(current, entry.id, business));
  }

  /**
   * Sign one entry: it leaves the register, and nothing else happens.
   *
   * The business the bench had in the editor is written before the entry goes, so the
   * announcement and the register agree with what was on screen even though neither
   * outlives the visit. Nothing is filed — see the module header.
   */
  function sign(entry: ADiaryEntry, business: string) {
    setRegister((current) =>
      saveBusinessOfTheDay(current, entry.id, business).filter(
        (row) => row.id !== entry.id,
      ),
    );
    setOpenId(null);
    setAnnouncement(
      `The entry in ${entry.caseNumber}, ${causeTitle(entry)}, left the A-Diary queue.`,
    );
  }

  /**
   * Where focus lands when the dialog closes.
   *
   * The row that opened it is often gone by then — signing takes it out of the register —
   * so the DS's own restore-to-trigger would drop focus on nothing. The page title is the
   * one thing on this screen that is always there, and it names where the bench is.
   */
  function returnFocus() {
    headingRef.current?.focus();
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-title text-balance font-semibold outline-none sm:text-title-l"
        >
          Sign A-Diary
        </h1>
        {/* The count is the whole point of the queue, so the supporting line carries it
            rather than restating the title. It counts the whole unsigned register, not
            the day on screen — the footer below states that — so a bench that has fallen
            a day behind can see it from here. Singular is spelled out because "1 entries"
            is the kind of thing a court notices. */}
        <p className="text-body text-muted-foreground">
          {register.length === 0
            ? "This court's register is signed up to date."
            : register.length === 1
              ? "1 entry in this court's register is waiting for your signature."
              : `${register.length} entries in this court's register are waiting for your signature.`}
        </p>
      </header>

      {/* One panel: the filter, the list and the footer are one unit of work, so they
          share one lifted sheet — the same recipe every other court-side list uses.
          Nothing inside draws a second frame. */}
      <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
        <SignADiaryFilters
          draft={draft}
          today={today}
          onDraftChange={setDraft}
          onApply={applyFilters}
          onClear={showToday}
        />

        {pageRows.length === 0 ? (
          <SignADiaryEmpty
            day={appliedDay}
            today={today}
            hasUnsigned={register.length > 0}
            onShowToday={showToday}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {/* min-w-0 lets this flex item shrink below the table's content width, so a
                wide table scrolls inside the panel instead of pushing the page
                sideways. */}
            <div className="min-w-0 overflow-x-auto">
              {/* A paragraph of proceedings in a table cell does not survive a phone.
                  Below `md` the same entries stack as items — the answer the rest of the
                  court side already gives. */}
              <div className="hidden md:block">
                <SignADiaryTable rows={pageRows} onOpen={(entry) => setOpenId(entry.id)} />
              </div>
              <div className="md:hidden">
                <SignADiaryItemList
                  rows={pageRows}
                  onOpen={(entry) => setOpenId(entry.id)}
                />
              </div>
            </div>

            <ListFooter
              id="sign-a-diary-page-size"
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

      {/* What actually changed, for anyone not watching the table. The footer's own count
          line is polite too, but it reports a total rather than an act. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <SignADiaryDialog
        entry={open}
        onOpenChange={(entry) => setOpenId(entry?.id ?? null)}
        onSave={save}
        onSign={sign}
        onReturnFocus={returnFocus}
      />
    </div>
  );
}

/**
 * Which day's register is on screen — the reference's one control, and its two buttons.
 *
 * "Search" keeps the reference's teal. The Ration Teal Law allows one strong action per
 * view, and unlike the two signing queues above it this screen has no bulk act to spend
 * it on: asking for a day *is* what the bench does here, so the teal stays where the
 * reference put it.
 *
 * "Clear" rather than the reference's "Clear search": it returns the register to today
 * rather than emptying the control, and a label naming only the search would undersell
 * what it does.
 */
function SignADiaryFilters({
  draft,
  today,
  onDraftChange,
  onApply,
  onClear,
}: {
  draft: ADiaryFilters;
  today: string;
  onDraftChange: (filters: ADiaryFilters) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const day = resolveADiaryDay(draft, today);

  return (
    <form
      className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      {/* `DatePicker` owns its trigger and takes no `id`, so the visible label names a
          group around it rather than pointing `htmlFor` at a control that does not exist.
          The trigger still announces the date it holds.

          The `key` is not decoration. `DatePicker` treats `value === undefined` as "I am
          uncontrolled" and falls back to its own last selection, so a date driven from
          outside — Clear returning the filter to today — would keep showing the day the
          bench had picked. Remounting on the value is the only fix that does not edit the
          primitive; upstream DS bug, logged in the build report. */}
      <div className="flex min-w-0 flex-col gap-2">
        <span id="sign-a-diary-date-label" className="w-fit text-body font-medium">
          A-Diary dated
        </span>
        <div role="group" aria-labelledby="sign-a-diary-date-label">
          <DatePicker
            key={day}
            value={parseIsoDay(day)}
            onValueChange={(next) =>
              /* Clearing the picker itself means today: the register always shows one
                 day, and "no day" is not a view this screen has. */
              onDraftChange({ dated: next ? isoDay(next) : null })
            }
            className="w-full sm:w-52"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit">Search</Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}

/**
 * Why there is nothing to sign, which is three different facts on this screen.
 *
 * A register that is signed up to date is the bench being finished; a day the court did
 * not sit on is a dead end worth offering a way out of; and today with nothing in it yet
 * is neither — the entries arrive as the day's matters are dealt with. Borderless and
 * unpadded; the panel is already the frame.
 */
function SignADiaryEmpty({
  day,
  today,
  hasUnsigned,
  onShowToday,
}: {
  day: string;
  today: string;
  /** Whether anything at all is unsigned, on any day. */
  hasUnsigned: boolean;
  onShowToday: () => void;
}) {
  const isToday = day === today;

  if (!hasUnsigned) {
    return (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookCheckIcon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-title-s font-semibold">
            The A-Diary is signed
          </EmptyTitle>
          <EmptyDescription className="text-body">
            Every entry in this court&apos;s register carries your signature.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty className="border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isToday ? (
            <NotebookPenIcon aria-hidden />
          ) : (
            <CalendarXIcon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isToday
            ? "Nothing in today's diary yet"
            : `No entry for ${formatADiaryDate(day)}`}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isToday
            ? "Entries appear here as this court deals with the matters on today's list."
            : `This court's register holds no unsigned entry for ${formatCourtDay(day)}.`}
        </EmptyDescription>
      </EmptyHeader>
      {isToday ? null : (
        <EmptyContent>
          <Button variant="outline" onClick={onShowToday}>
            Show today&apos;s diary
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

/**
 * The same entries below `md`, stacked.
 *
 * The business of the day is the item, not a field inside it: it takes the whole width,
 * carries the emphasis and is the button that opens the entry, with the number and the
 * next date under it. Four lines rather than the table's two — a phone has the height to
 * spare and no column header to lean on.
 */
function SignADiaryItemList({
  rows,
  onOpen,
}: {
  rows: ADiaryEntry[];
  onOpen: (entry: ADiaryEntry) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-2 rounded-lg bg-surface-sunken p-4">
          <button
            type="button"
            onClick={() => onOpen(entry)}
            className="w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
          >
            <span className="sr-only">
              Read and sign the entry in {entry.caseNumber}.{" "}
            </span>
            <span className="line-clamp-4">{entry.business}</span>
          </button>
          <p className="text-caption text-muted-foreground">
            <span className="tabular-nums">{entry.caseNumber}</span>
            {" · Next hearing "}
            <span className="tabular-nums">
              {formatADiaryDate(entry.nextHearing)}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
