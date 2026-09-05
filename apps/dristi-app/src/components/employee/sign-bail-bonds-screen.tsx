"use client";

import * as React from "react";
import { FileSignatureIcon, SearchIcon, SearchXIcon } from "lucide-react";

import { ListFooter } from "@/components/employee/list-footer";
import {
  SignBailBondDialog,
  SignBailBondsBulkDialog,
} from "@/components/employee/sign-bail-bond-dialog";
import { SignBailBondsTable } from "@/components/employee/sign-bail-bonds-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  PAGE_SIZE,
  type HearingsPageSize,
} from "@/lib/employee/hearings";
import {
  EMPTY_SIGN_BAIL_BOND_FILTERS,
  SIGN_BAIL_BOND_QUEUE,
  filterSignBailBonds,
  rejectBailBond,
  signSelectedBailBonds,
  todayIsoDay,
  type SignBailBond,
  type SignBailBondFilters,
} from "@/lib/employee/sign-bail-bonds";

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Sign bail bonds — the bonds executed in this court and not yet signed by the bench.
 *
 * Deliberately the same screen as the signing queues above it in the rail, and as the
 * three review queues before those: the page title stands on the page, and **one** lifted
 * panel holds the search, the table and the pagination footer together. Same panel
 * recipe, same `gap-6` / `p-6`, same table treatment, same empty states, literally the
 * same footer component and the same shared confirmation. A bench moving between the
 * rail's rows is looking at one court's work through several windows, and should not have
 * to re-learn the furniture in between.
 *
 * What it does *not* borrow is the sibling's filter row. The reference gives this queue
 * one control — the case — and no status, date or type filter, so there is one field here
 * and Clear search returns the screen to the whole queue. A bond signed or rejected leaves
 * the list rather than staying behind a status this screen has no control to reach.
 *
 * Signing is the one court-side job the reference does in bulk, so selection lives in the
 * table and the commit lives in a sticky footer — `SignEvidenceScreen`'s recipe, and
 * persistent for its reason: a bar that materialises on the first tick shifts the row the
 * bench just clicked. Both paths end at the same Add signature step — e-sign, or upload
 * the bond the litigant and surety put their hands to — so the bench cannot be asked for
 * a signature two different ways. The bulk path confirms the count first, because those
 * bonds have not been read; the single path has just shown the document instead.
 *
 * The case name of each row opens the bond first, because a bench that cannot read what it
 * is signing should not be offered a signature.
 *
 * **Nothing is signed, published or refused.** Every path only moves a row's status in the
 * demo queue — see `lib/employee/sign-bail-bonds.ts`.
 */
export function SignBailBondsScreen() {
  /* The queue is state because signing and rejecting change it. One list, so the table,
     the count in the header and the footer can never disagree about what is still
     pending. */
  const [bonds, setBonds] = React.useState<SignBailBond[]>(
    SIGN_BAIL_BOND_QUEUE,
  );
  /* The reference searches on a button rather than as you type, so the clerk composes a
     query and then asks for it. `draft` is what the field holds; `applied` is what the
     table is showing. */
  const [draft, setDraft] = React.useState<SignBailBondFilters>(
    EMPTY_SIGN_BAIL_BOND_FILTERS,
  );
  const [applied, setApplied] = React.useState<SignBailBondFilters>(
    EMPTY_SIGN_BAIL_BOND_FILTERS,
  );
  const [pageSize, setPageSize] = React.useState<HearingsPageSize>(PAGE_SIZE);
  const [page, setPage] = React.useState(1);
  const [picked, setPicked] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /* The open bond is held by id, not by object: the queue is state, and a row captured
     before a signature would go stale the moment its status moved. */
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  const pending = filterSignBailBonds(bonds, EMPTY_SIGN_BAIL_BOND_FILTERS);
  const rows = filterSignBailBonds(bonds, applied);
  const openBond = bonds.find((bond) => bond.id === openId) ?? null;

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const isSearched = applied.query !== "";

  /* What the footer will actually sign: only bonds the bench can currently see. A row
     signed out from under the selection, or searched out of view, is dropped rather than
     counted — the button must never promise more than the list in front of it. It reaches
     across pages, so ten picked on page one still sign from page two. */
  const visibleIds = new Set(rows.map((bond) => bond.id));
  const selectedIds = new Set([...picked].filter((id) => visibleIds.has(id)));
  /* In list order, so the signature step's note reads the way the table does. */
  const selectedBonds = rows.filter((bond) => selectedIds.has(bond.id));

  const canSearch = isPendingFilterChange(draft, applied);

  function applySearch() {
    setApplied(draft);
    setPage(1);
  }

  function clearSearch() {
    setDraft(EMPTY_SIGN_BAIL_BOND_FILTERS);
    setApplied(EMPTY_SIGN_BAIL_BOND_FILTERS);
    setPage(1);
  }

  function toggle(bond: SignBailBond) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(bond.id)) next.delete(bond.id);
      else next.add(bond.id);
      return next;
    });
  }

  /** The header checkbox: every row in view, or none of them. */
  function toggleAllInView(select: boolean) {
    setPicked((current) => {
      const next = new Set(current);
      for (const bond of pageRows) {
        if (select) next.add(bond.id);
        else next.delete(bond.id);
      }
      return next;
    });
  }

  /**
   * Both signing paths end here: the bonds are marked signed in this demo queue, the
   * selection that fed them is cleared, and what happened is spoken. Nothing leaves the
   * browser.
   */
  function sign(ids: ReadonlySet<string>) {
    const count = bonds.filter(
      (bond) => ids.has(bond.id) && bond.status === "pending-signature",
    ).length;
    if (count === 0) return;
    setBonds((current) => signSelectedBailBonds(current, ids, todayIsoDay()));
    setPicked((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    setAnnouncement(
      `${count} ${plural(count, "bail bond is", "bail bonds are")} marked signed on this screen. Nothing was published.`,
    );
  }

  /** Refusing one bond, from the preview. It leaves the queue unsigned. */
  function reject(bond: SignBailBond) {
    setBonds((current) => rejectBailBond(current, bond.id));
    setPicked((current) => {
      const next = new Set(current);
      next.delete(bond.id);
      return next;
    });
    setOpenId(null);
    setAnnouncement(
      `The bail bond of ${bond.litigant} in ${bond.caseNumber} is marked rejected on this screen. Nothing was sent.`,
    );
  }

  function returnFocus() {
    searchRef.current?.focus();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 pb-0 md:p-8 md:pb-0">
        <header className="flex flex-col gap-2">
          <h1 className="text-title text-balance font-semibold sm:text-title-l">
            Sign bail bonds
          </h1>
          {/* The count is the whole point of the queue, so the supporting line carries it
              rather than restating the title. Singular is spelled out because "1 bail
              bonds" is the kind of thing a court notices. */}
          <p className="text-body text-muted-foreground">
            {pending.length === 1
              ? "1 bail bond is waiting for your signature."
              : `${pending.length} bail bonds are waiting for your signature.`}
          </p>
        </header>

        {/* One panel: the search, the list and the pager are one unit of work, so they
            share one lifted sheet — the same recipe every other court-side list uses.
            Nothing inside draws a second frame. */}
        <section className="flex min-w-0 flex-col gap-6 rounded-xl border border-hairline bg-card shadow-raised p-6">
          <SignBailBondSearch
            draft={draft}
            searchRef={searchRef}
            onDraftChange={setDraft}
            onApply={applySearch}
            onClear={clearSearch}
            canSearch={canSearch}
          />

          {pageRows.length === 0 ? (
            <SignBailBondsEmpty isSearched={isSearched} onClear={clearSearch} />
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              {/* min-w-0 lets this flex item shrink below the table's content width, so a
                  wide table scrolls inside the panel instead of pushing the page
                  sideways. */}
              <div className="min-w-0 overflow-x-auto">
                {/* Four columns do not survive a phone. Below `md` the same rows stack as
                    items — the answer the rest of the court side already gives. */}
                <div className="hidden md:block">
                  <SignBailBondsTable
                    rows={pageRows}
                    selectedIds={selectedIds}
                    onToggle={toggle}
                    onToggleAll={toggleAllInView}
                    onOpen={(bond) => setOpenId(bond.id)}
                  />
                </div>
                <div className="md:hidden">
                  <SignBailBondsItemList
                    rows={pageRows}
                    selectedIds={selectedIds}
                    onToggle={toggle}
                    onOpen={(bond) => setOpenId(bond.id)}
                  />
                </div>
              </div>

              <ListFooter
                id="sign-bail-bonds-page-size"
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

      {/* What is selected, and the one act. The court side's own chrome for a screen whose
          act lives at the bottom: `bg-card` over a hairline seam, never the panel's
          full-strength edge (ui-craft §4, layer 2). `z-30` is the chrome layer this app
          already uses — the top bar and the filing footer both sit there.

          Persistent rather than appearing on the first tick: a bar that materialises under
          the cursor shifts the row the bench just clicked. Empty-handed it holds a
          disabled button and says what to do instead. */}
      <footer className="sticky bottom-0 z-30 mt-8 border-t border-hairline bg-card px-6 py-3 md:px-8 md:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p
            className="text-body-compact text-muted-foreground tabular-nums sm:mr-auto"
            aria-live="polite"
          >
            {selectedIds.size === 0
              ? "Select the bail bonds to sign them together."
              : `${selectedIds.size} ${plural(selectedIds.size, "bail bond", "bail bonds")} selected.`}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {selectedIds.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-fit"
                onClick={() => setPicked(new Set())}
              >
                Clear selection
              </Button>
            ) : null}
            <Button
              type="button"
              className="w-full sm:w-fit"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkOpen(true)}
            >
              Sign selected bail bonds
            </Button>
          </div>
        </div>
      </footer>

      {/* What actually changed, for anyone not watching the list. The count line in the
          footer is polite too, but it reports a total rather than an act. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Confirm the count, then say how it gets signed — the same two beats the
          single-bond path runs, minus the reading. */}
      <SignBailBondsBulkDialog
        bonds={selectedBonds}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSign={() => {
          setBulkOpen(false);
          sign(selectedIds);
        }}
      />

      <SignBailBondDialog
        bond={openBond}
        onOpenChange={(bond) => setOpenId(bond?.id ?? null)}
        onSign={(bond) => {
          setOpenId(null);
          sign(new Set([bond.id]));
        }}
        onReject={reject}
        onReturnFocus={returnFocus}
      />
    </div>
  );
}

/**
 * One box and the two buttons that work it — the reference's whole filter row.
 *
 * The label is the reference's own words, and here they are a real label rather than a
 * placeholder standing in for one, so ACCESSIBILITY §12 needs no deviation: the field is
 * named "Case name or number" above the control. The placeholder adds the third column the
 * search also reaches.
 *
 * "Search" is not the teal one, and that is the one place this screen departs from the
 * reference's colour. The Ration Teal Law allows a single strong action per view, and on a
 * screen whose whole purpose is signing it belongs to Sign selected bail bonds in the
 * footer below.
 */
function SignBailBondSearch({
  draft,
  searchRef,
  onDraftChange,
  onApply,
  onClear,
  canSearch,
}: {
  draft: SignBailBondFilters;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onDraftChange: (filters: SignBailBondFilters) => void;
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
          and the control agree on one generated id. Upstream DS bug; see
          `HearingsFilters`. */}
      <Field className="min-w-0 sm:w-80">
        <FieldLabel className="text-body">Case name or number</FieldLabel>
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
            placeholder="case name, number or litigant"
          />
        </InputGroup>
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!canSearch}>
          Search
        </Button>
        {/* "Clear search" rather than the sibling queues' "Clear": the search is the only
            control on this screen, so the reference's own label is the accurate one. */}
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
 * end with an action worth offering, while an empty queue is the bench being up to date —
 * the same good-empty the sibling queues use. Borderless and unpadded; the panel is
 * already the frame.
 */
function SignBailBondsEmpty({
  isSearched,
  onClear,
}: {
  isSearched: boolean;
  onClear: () => void;
}) {
  return (
    <Empty className="border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isSearched ? (
            <SearchXIcon aria-hidden />
          ) : (
            <FileSignatureIcon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle className="text-title-s font-semibold">
          {isSearched ? "No bail bond matches this search" : "Nothing to sign"}
        </EmptyTitle>
        <EmptyDescription className="text-body">
          {isSearched
            ? "No bail bond in this queue matches the case name, number or litigant you asked for."
            : "No bail bond is waiting for your signature."}
        </EmptyDescription>
      </EmptyHeader>
      {isSearched ? (
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
 * The checkbox and the opener stay separate controls here too, for the same reason they do
 * in the table: one tap cannot mean both. The checkbox takes the leading column at its
 * full 40px target, and the case name beside it is the button that opens the bond — with
 * the litigant and the number under it, spelled out because there is no column header to
 * name them.
 */
function SignBailBondsItemList({
  rows,
  selectedIds,
  onToggle,
  onOpen,
}: {
  rows: SignBailBond[];
  selectedIds: ReadonlySet<string>;
  onToggle: (bond: SignBailBond) => void;
  onOpen: (bond: SignBailBond) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((bond) => (
        <li
          key={bond.id}
          className="flex gap-3 rounded-lg bg-surface-sunken p-4"
        >
          {/* The DS box expands its own hit area to 40×40; the name it carries is the bond
              and its case, not the column, because a row read aloud has no column
              header. */}
          <span className="pt-0.5">
            <Checkbox
              checked={selectedIds.has(bond.id)}
              onCheckedChange={() => onToggle(bond)}
              aria-label={`Select the bail bond of ${bond.litigant} in ${bond.caseNumber}`}
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpen(bond)}
              className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
            >
              <span className="sr-only">
                {`Read the bail bond of ${bond.litigant} in `}
              </span>
              {causeTitle(bond)}
            </button>
            <p className="min-w-0 text-body-compact">
              Litigant: {bond.litigant}
            </p>
            <p className="text-caption text-muted-foreground tabular-nums">
              {bond.caseNumber}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
