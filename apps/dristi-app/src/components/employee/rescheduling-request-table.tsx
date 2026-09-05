"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { causeTitle } from "@/lib/employee/hearings";
import {
  formatRequestDate,
  type ReschedulingRequest,
} from "@/lib/employee/rescheduling-request";
import { cn } from "@/lib/utils";

/* The same table treatment as the register queue and the scheduling queue —
 * header separated by fill rather than a second stroke, rows by hairline, the
 * panel edge as the only full-strength border on the screen (ui-craft §1.1).
 * The classes are restated rather than exported because when the advocate
 * shell moves onto the shared `components/chrome` frame, this treatment is
 * what belongs there, and the court-side tables should collapse onto it
 * together rather than one of them becoming the other's parent. */
const headClass =
  "h-10 bg-surface-sunken px-4 py-3 text-caption font-semibold text-muted-foreground";
const cellClass =
  "border-b border-hairline px-4 py-3 align-middle text-left text-body-compact";

/**
 * The rescheduling queue as a table: the cause, its number, when the
 * application arrived, and the date it is asking to leave.
 *
 * Four columns, and every absence is deliberate. There is no serial — a
 * serial is a position on a day's list and these applications are not a
 * sitting. There is no status chip: a row in this queue is in exactly one
 * state, pending review. There is no advocates column: the reference did not
 * have one, and search still reaches counsel.
 *
 * The cause title is the opener; the row is not. The row used to take the
 * click, on the reasoning that this queue has no other act — but eight of the
 * nine court queues open from the name, because a row that owns a checkbox or
 * its own buttons cannot also be one big target. That makes the underlined
 * name the shared product here and the row-click the second one, so this table
 * converges rather than keeping the exception.
 *
 * The name keeps the court's quiet dress — `text-foreground`, no teal — and
 * earns its underline on hover and focus, where a pointer or a keyboard has
 * actually asked. The teal link colour is the citizen side's, for an action
 * inline in prose; a court queue is thirty rows of data and rations it.
 *
 * The panel shell (border, fill, shadow) lives on the screen around this, so
 * the table is one panel rather than a box inside a box.
 */
export function ReschedulingRequestTable({
  rows,
  onOpen,
}: {
  rows: ReschedulingRequest[];
  onOpen: (request: ReschedulingRequest) => void;
}) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-body-compact">
      <TableHeader>
        <TableRow className="hover:bg-transparent [&>th:first-child]:rounded-l-lg [&>th:last-child]:rounded-r-lg">
          <TableHead className={cn(headClass, "min-w-64 whitespace-normal")}>
            Case name
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Case number
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date of application
          </TableHead>
          <TableHead className={cn(headClass, "whitespace-nowrap")}>
            Date of next hearing
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child_td]:border-b-0">
        <tr aria-hidden="true">
          <td colSpan={4} className="h-2 p-0" />
        </tr>
        {rows.map((request) => (
          <TableRow key={request.id} className="bg-card">
            <TableCell
              className={cn(cellClass, "min-w-64 font-medium whitespace-normal")}
            >
              <button
                type="button"
                onClick={() => onOpen(request)}
                className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:underline"
              >
                <span className="sr-only">Review </span>
                {causeTitle(request)}
              </button>
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {request.caseNumber}
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {formatRequestDate(request.appliedOn)}
            </TableCell>
            <TableCell className={cn(cellClass, "tabular-nums whitespace-nowrap")}>
              {formatRequestDate(request.listedOn)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
