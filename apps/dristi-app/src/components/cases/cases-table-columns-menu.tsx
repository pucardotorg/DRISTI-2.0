"use client";

import { ChevronDownIcon, ChevronUpIcon, SlidersHorizontalIcon } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  canonicalOrder,
  isToggleableTableColumn,
  TABLE_COLUMNS,
} from "@/lib/cases/table-columns";

import { useCasesTableColumns } from "./use-cases-table-columns";

/**
 * Column visibility and order. Lives with Folders/List, not in the table
 * header — a sticky cell there reads as the end of the row. Case number is
 * locked (row link). Bookmark is an action and is not listed. A folder omits
 * Stage — offering it here would put the folder's own category back on every
 * row. Reset restores order and visibility.
 */
export function CasesTableColumnsMenu({
  hideStage = false,
}: {
  hideStage?: boolean;
}) {
  const { isVisible, toggle, reset, isDefault, order, shiftListed } =
    useCasesTableColumns();
  const columns = canonicalOrder(order)
    .map((id) => TABLE_COLUMNS.find((column) => column.id === id)!)
    .filter((column) => !(hideStage && column.id === "stage"));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 text-body"
        >
          <SlidersHorizontalIcon data-icon="inline-start" aria-hidden />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle className="text-body font-medium">Columns</PopoverTitle>
          <PopoverDescription className="text-caption">
            Tick to show a column. Use the arrows to change its order.
          </PopoverDescription>
        </PopoverHeader>
        <ScrollArea className="h-64">
          <ul className="flex flex-col gap-1">
            {columns.map((column, index) => {
              const checkboxId = `cases-column-${column.id}`;
              const shown = isVisible(column.id);
              return (
                <li
                  key={column.id}
                  className="flex items-center gap-1"
                >
                  <Label
                    htmlFor={checkboxId}
                    className="min-h-10 min-w-0 flex-1 font-normal text-body"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={shown}
                      disabled={column.locked}
                      onCheckedChange={() => {
                        if (isToggleableTableColumn(column.id)) toggle(column.id);
                      }}
                    />
                    {column.label}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    aria-label={`Move ${column.label} up`}
                    onClick={() => shiftListed(column.id, -1, { hideStage })}
                  >
                    <ChevronUpIcon aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === columns.length - 1}
                    aria-label={`Move ${column.label} down`}
                    onClick={() => shiftListed(column.id, 1, { hideStage })}
                  >
                    <ChevronDownIcon aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <Separator />
        <Button
          type="button"
          variant="ghost"
          disabled={isDefault}
          onClick={() => reset()}
          className="w-full justify-start text-body"
        >
          Reset to default
        </Button>
      </PopoverContent>
    </Popover>
  );
}
