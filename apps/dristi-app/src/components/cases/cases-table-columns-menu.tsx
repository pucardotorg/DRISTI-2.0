"use client";

import { Columns3Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  canonicalOrder,
  isToggleableTableColumn,
  TABLE_COLUMNS,
} from "@/lib/cases/table-columns";

import { useCasesTableColumns } from "./use-cases-table-columns";

/**
 * Which columns show. Only that: a tick per column, Show all, Reset. Order is
 * not decided here — the arrows this menu used to carry made a visibility list
 * read as a sorting puzzle, and order already has a better home: the grip on
 * each column heading, which drags. The list runs in the table's current order,
 * so it also reads as a map of what is on screen.
 *
 * Case number is locked (row link). Bookmark is an action and is not listed. A
 * folder omits Stage — offering it here would put the folder's own category back
 * on every row. Reset restores order and visibility both.
 */
export function CasesTableColumnsMenu({
  hideStage = false,
}: {
  hideStage?: boolean;
}) {
  const { isVisible, toggle, showAll, reset, isDefault, isAllVisible, order } =
    useCasesTableColumns();
  const columns = canonicalOrder(order)
    .map((id) => TABLE_COLUMNS.find((column) => column.id === id)!)
    .filter((column) => !(hideStage && column.id === "stage"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="shrink-0">
          <Columns3Icon data-icon="inline-start" aria-hidden />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle className="text-body font-medium">Columns</PopoverTitle>
          <PopoverDescription className="text-caption">
            Tick a column to show it. To reorder, drag a column by the handle on
            its heading.
          </PopoverDescription>
        </PopoverHeader>
        <ul className="flex flex-col">
          {columns.map((column) => {
            const checkboxId = `cases-column-${column.id}`;
            return (
              <li key={column.id}>
                <Label
                  htmlFor={checkboxId}
                  className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-body font-normal hover:bg-accent has-disabled:cursor-default has-disabled:hover:bg-transparent"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isVisible(column.id)}
                    disabled={column.locked}
                    onCheckedChange={() => {
                      if (isToggleableTableColumn(column.id)) toggle(column.id);
                    }}
                  />
                  {column.label}
                </Label>
              </li>
            );
          })}
        </ul>
        <Separator />
        {/* Show all turns every column on; there is deliberately no "hide all" —
            a table with only the case number is not a state anyone asks for. */}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isAllVisible}
            onClick={() => showAll()}
            className="text-body"
          >
            Show all
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isDefault}
            onClick={() => reset()}
            className="text-body"
          >
            Reset to default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
