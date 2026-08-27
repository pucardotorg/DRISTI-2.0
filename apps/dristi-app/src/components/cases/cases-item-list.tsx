"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { listTableColumns } from "@/lib/cases/table-columns";
import { partiesLabel, type CaseRecord } from "@/lib/cases/types";
import { cn } from "@/lib/utils";

import { BookmarkButton } from "./bookmark-button";
import { CaseField, caseFieldIsEmpty } from "./case-field";
import { useCasePeek } from "./use-case-peek";
import { useCasesSelection } from "./use-cases-selection";
import { useCasesTableColumns } from "./use-cases-table-columns";

type ListProps = {
  rows: CaseRecord[];
  bookmarks: ReadonlySet<string>;
  onToggleBookmark: (id: string) => void;
  className?: string;
  hideStage?: boolean;
  hideLongPendingFlag?: boolean;
};

/**
 * Narrow table: stacked items in the table's visible columns and order.
 * Stage filter and column picking stay on the table. A folder drops Stage —
 * the folder is that value.
 */
export function CasesItemList({
  rows,
  bookmarks,
  onToggleBookmark,
  className,
  hideStage = false,
  hideLongPendingFlag = false,
}: ListProps) {
  const { isVisible, order } = useCasesTableColumns();
  const { record: openRecord } = useCasePeek();
  const { selected, toggle, enabled: selectable } = useCasesSelection();
  const columns = listTableColumns(isVisible, { hideStage, order });

  return (
    <ItemGroup className={cn("flex flex-col gap-3", className)}>
      {rows.map((record) => (
        <Item
          key={record.id}
          variant="outline"
          role="listitem"
          className={cn(
            "relative h-full items-start gap-3 p-4",
            openRecord?.id === record.id && "bg-accent-strong"
          )}
        >
          {selectable ? (
            <div
              className="relative z-10 flex shrink-0 items-center pt-0.5"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={selected.has(record.id)}
                onCheckedChange={() => toggle(record.id)}
                aria-label={`Select ${partiesLabel(record)}`}
              />
            </div>
          ) : null}
          <ItemContent className="min-w-0 flex-1 gap-6">
            <ItemTitle className="sr-only">
              {partiesLabel(record)}
            </ItemTitle>
            {columns.map((column) =>
              caseFieldIsEmpty(record, column.id) ? null : (
                <div key={column.id} className="flex flex-col gap-1">
                  <span className="text-caption text-muted-foreground">
                    {column.label}
                  </span>
                  <CaseField
                    record={record}
                    id={column.id}
                    presentation="list"
                    hideLongPendingFlag={hideLongPendingFlag}
                  />
                </div>
              )
            )}
          </ItemContent>
          <ItemActions className="relative z-10">
            <BookmarkButton
              caseLabel={partiesLabel(record)}
              bookmarked={bookmarks.has(record.id)}
              onToggle={() => onToggleBookmark(record.id)}
            />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
