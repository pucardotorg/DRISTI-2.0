"use client";

import { MoreVerticalIcon } from "lucide-react";

import { CounselCell } from "@/components/employee/counsel-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  causeTitle,
  counselFor,
  courtHearingPurposeLabel,
  courtHearingStatusLabel,
  courtHearingStatusVariant,
  type CourtHearing,
} from "@/lib/employee/hearings";
import { cn } from "@/lib/utils";

/* The advocate's cases table is the reference for surface and row state, and this is the
 * same table: header separated by fill rather than a second stroke, rows by hairline, and
 * the panel edge as the only full-strength border on the screen (ui-craft §1.1). The
 * classes are restated rather than imported because `/employee` does not reach into the
 * citizen side (see `lib/employee/content.ts`) — when the advocate shell moves onto the
 * shared `components/chrome` frame, this treatment is the next thing that belongs there. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The row's overflow menu — the two actions the reference puts on a listed matter.
 *
 * Both are disabled and say why. Starting a hearing and passing a matter over are real
 * judicial acts on a real cause list, and this build performs neither; a menu item that
 * looked live would be claiming the court had done something it has not. The items stay
 * in the menu rather than being dropped so the shape of the action is visible and can be
 * wired later — the same bargain the rail makes with its unbuilt destinations.
 */
function HearingRowActions({ hearing }: { hearing: CourtHearing }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label={`Actions for item ${hearing.item}, ${causeTitle(hearing)}`}
        >
          <MoreVerticalIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>Start hearing</DropdownMenuItem>
        <DropdownMenuItem disabled>Mark as passed over</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Not part of this build
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Today's cause list as a table: the court's serial, the cause, its number, who appears,
 * what it is listed for, where it stands, and the row's actions.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so the table is
 * one panel rather than a box inside a box.
 */
export function HearingsTable({ rows }: { rows: CourtHearing[] }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        {/* The panel insets this table by p-6, so the header strip is a well, not a
            full-bleed band — it rounds itself (ui-craft §4). `border-separate` means each
            cell paints its own fill, so the radius goes on the end cells rather than the
            row. */}
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "w-16 whitespace-nowrap")}>
            S. no.
          </TableHead>
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "min-w-48 whitespace-normal")}>
            Advocates
          </TableHead>
          <TableHead className={cn(headClass, "min-w-40 whitespace-normal")}>
            Purpose
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Status
          </TableHead>
          <TableHead
            className={cn(
              headClass,
              "sticky right-0 z-20 w-16 bg-surface-sunken px-1",
            )}
          >
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      {/* `border-separate` (needed by the sticky actions column) puts the row stroke on
          the cell, so the DS TableBody rule that clears the last row targets the wrong
          element. Reach the cells directly, or the final row doubles its line against the
          panel edge. */}
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        {/* The header is a well, not a band welded to the rows — it needs the panel's
            fill under it or its rounded bottom corners read as cut off (ui-craft §4).
            `border-separate` has no per-edge row gap, so the gap is one inert row held
            out of the accessibility tree. */}
        <tr aria-hidden="true">
          <td colSpan={7} className="h-2 p-0" />
        </tr>
        {rows.map((hearing) => (
          <TableRow key={hearing.id} className="bg-card">
            <TableCell
              className={cn(cellClass, "w-16 tabular-nums text-muted-foreground")}
            >
              {hearing.item}
            </TableCell>
            {/* The row's one emphasised cell. Not a link: there is no court-side case
                file yet, and the citizen side's is not the bench's to point at. */}
            <TableCell
              className={cn(cellClass, "min-w-64 font-medium whitespace-normal")}
            >
              {causeTitle(hearing)}
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {hearing.caseNumber}
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-48 whitespace-normal")}>
              <CounselCell
                complainant={counselFor(hearing, "complainant").map(
                  (counsel) => counsel.name,
                )}
                accused={counselFor(hearing, "accused").map(
                  (counsel) => counsel.name,
                )}
                dense
              />
            </TableCell>
            <TableCell className={cn(cellClass, "min-w-40 whitespace-normal")}>
              {courtHearingPurposeLabel(hearing.purpose)}
            </TableCell>
            <TableCell className={cn(cellClass, "whitespace-nowrap")}>
              <Badge
                variant={courtHearingStatusVariant(hearing.status)}
                className="w-fit"
              >
                {courtHearingStatusLabel(hearing.status)}
              </Badge>
            </TableCell>
            <TableCell
              className={cn(
                cellClass,
                "sticky right-0 z-20 w-16 bg-inherit px-1",
              )}
            >
              <div className="flex justify-center">
                <HearingRowActions hearing={hearing} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
