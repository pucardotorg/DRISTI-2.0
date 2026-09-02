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
 * The row is the opener — this queue has no other act. The cause title stays
 * the named control (quiet `text-foreground`, no underline, no teal) so
 * keyboard and voice still have a label; pointer hits anywhere on the row.
 * A link-styled name would be a second product inside the same table
 * container.
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
          <TableRow
            key={request.id}
            className="cursor-pointer bg-card"
            onClick={() => onOpen(request)}
          >
            <TableCell
              className={cn(cellClass, "min-w-64 font-medium whitespace-normal")}
            >
              <button
                type="button"
                className="min-h-10 w-full cursor-pointer rounded-sm p-0 text-left text-body-compact font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
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
