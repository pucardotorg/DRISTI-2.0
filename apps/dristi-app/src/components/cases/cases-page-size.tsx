"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAGE_SIZES,
  isCasesPageSize,
  type CasesPageSize,
} from "@/lib/cases/query";

/**
 * How many rows the list shows at once. Lives next to the "Showing" count —
 * that range is what this changes. Changing it returns to page 1.
 */
export function CasesPageSizeSelect({
  value,
  onChange,
  id = "cases-page-size",
}: {
  value: CasesPageSize;
  onChange: (pageSize: CasesPageSize) => void;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="text-body-compact font-normal text-muted-foreground"
      >
        Per page
      </Label>
      <Select
        value={String(value)}
        onValueChange={(next) => {
          const size = Number.parseInt(next, 10);
          if (isCasesPageSize(size)) onChange(size);
        }}
      >
        <SelectTrigger id={id} className="text-body">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
